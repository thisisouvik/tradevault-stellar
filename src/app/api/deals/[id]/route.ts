import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailTemplates } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id(name, email, wallet_address)`)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status, trackingId, courier, trackingHash, deliveredAt } = body

  const updateData: Record<string, unknown> = {}
  if (status) updateData.status = status
  if (trackingId) updateData.tracking_id = trackingId
  if (courier) updateData.courier = courier
  if (trackingHash) updateData.tracking_hash = trackingHash
  if (deliveredAt) updateData.delivered_at = deliveredAt

  const admin = createAdminClient()
  const { data: deal, error } = await admin
    .from('deals')
    .update(updateData)
    .eq('id', id)
    .select(`*, profiles:seller_id(name, email)`)
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Send status emails (wrapped in try/catch so db updates don't fail if email fails)
  try {
    const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${id}`
    const seller = deal.profiles as { name: string; email: string } | null

    if (status === 'FUNDED' && seller?.email) {
      const emailTemplate = emailTemplates.dealFunded(
        seller.name || 'Seller', deal.item_name, deal.amount_usdc, dealLink
      )
      await sendEmail({ to: seller.email, ...emailTemplate })
    }

    if (status === 'COMPLETED') {
      if (seller?.email) {
        const emailTemplate = emailTemplates.dealCompleted(
          seller.name || 'Seller', deal.item_name, deal.amount_usdc
        )
        await sendEmail({ to: seller.email, ...emailTemplate })
      }
      // Also notify buyer
      if (deal.buyer_email) {
        const emailTemplate = emailTemplates.dealCompleted(
          'Buyer', deal.item_name, deal.amount_usdc
        )
        await sendEmail({
          to: deal.buyer_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })
      }
    }

    if (status === 'DISPUTED') {
      if (seller?.email) {
        const emailTemplate = emailTemplates.disputeOpened(seller.name || 'Seller', dealLink)
        await sendEmail({ to: seller.email, ...emailTemplate })
      }
      if (deal.buyer_email) {
        await sendEmail({ to: deal.buyer_email, ...emailTemplates.disputeOpened('Buyer', dealLink) })
      }
    }
  } catch (emailErr) {
    console.error('Failed to send status email:', emailErr)
  }

  return NextResponse.json(deal)
}
