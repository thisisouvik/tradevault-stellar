import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const dealId = formData.get('dealId') as string
    const description = formData.get('description') as string
    const photos = formData.getAll('photos') as File[]

    if (!dealId || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (description.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 })
    }

    if (photos.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 photos allowed' }, { status: 400 })
    }

    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: deal } = await supabase
      .from('deals')
      .select('id, seller_id, buyer_email, status')
      .eq('id', dealId)
      .single()

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    if (deal.status !== 'DISPUTED') {
      return NextResponse.json({ error: 'Evidence can only be uploaded for disputed deals' }, { status: 400 })
    }

    const isSeller = deal.seller_id === user.id
    const isBuyer = Boolean(user.email && deal.buyer_email && user.email === deal.buyer_email)
    const isArbitrator = actorProfile?.role === 'arbitrator'

    if (!isSeller && !isBuyer && !isArbitrator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const submittedBy = isSeller ? 'seller' : isBuyer ? 'buyer' : 'arbitrator'

    const admin = createAdminClient()
    const photoUrls: string[] = []

    // Upload each photo to Supabase Storage
    for (const photo of photos) {
      if (!photo || photo.size === 0) continue

      if (!photo.type.startsWith('image/')) {
        continue
      }
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Each photo must be 10MB or smaller' }, { status: 400 })
      }

      const ext = photo.name.split('.').pop() || 'jpg'
      const filename = `${dealId}/${user.id}/${Date.now()}-${randomUUID()}.${ext}`
      const arrayBuffer = await photo.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await admin.storage
        .from('evidence')
        .upload(filename, buffer, {
          contentType: photo.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = admin.storage
          .from('evidence')
          .getPublicUrl(filename)
        photoUrls.push(urlData.publicUrl)
      }
    }

    // Save evidence record
    const { error } = await admin.from('evidence').insert({
      deal_id: dealId,
      submitted_by: submittedBy,
      submitter_id: user.id,
      description: description.trim(),
      photo_urls: photoUrls,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photoUrls })
  } catch (err) {
    console.error('Upload evidence error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
