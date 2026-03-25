import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const dealId = formData.get('dealId') as string
    const role = formData.get('role') as string
    const description = formData.get('description') as string
    const photos = formData.getAll('photos') as File[]

    if (!dealId || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()
    const photoUrls: string[] = []

    // Upload each photo to Supabase Storage
    for (const photo of photos) {
      if (!photo || photo.size === 0) continue

      const ext = photo.name.split('.').pop() || 'jpg'
      const filename = `${dealId}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
      submitted_by: role,
      submitter_id: user.id,
      description,
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
