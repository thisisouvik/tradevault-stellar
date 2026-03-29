import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sha256, callContractMethod } from '@/lib/stellar'
import { verifyTrackingNumber } from '@/lib/tracking'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dealId, courier, trackingId, evidenceUrls = [] } = await request.json()

    if (!dealId || !courier || !trackingId || evidenceUrls.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or proof images' }, { status: 400 })
    }

    // Fetch deal and verify seller
    const { data: deal } = await supabase
      .from('deals')
      .select(`*, profiles:seller_id(name, email)`)
      .eq('id', dealId)
      .single()

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    if (deal.seller_id !== user.id) return NextResponse.json({ error: 'Only seller can submit delivery' }, { status: 403 })
    if (deal.status !== 'FUNDED') return NextResponse.json({ error: 'Deal must be in FUNDED state' }, { status: 400 })

    // Step 1: Verify tracking number
    if (courier !== 'INSTANT') {
      const { valid, error: trackingError } = await verifyTrackingNumber(trackingId, courier)
      if (!valid) {
        return NextResponse.json({ error: trackingError || 'Invalid tracking number for this carrier' }, { status: 400 })
      }
    }

    // Step 2: Compute SHA256 hash of tracking number (or instant ID)
    const trackingHash = await sha256(trackingId)

    // Step 3: Call submit_delivery() on Stellar Soroban contract (server signer / relayer)
    const contractId = deal.contract_address || deal.contract_app_id
    if (!contractId) {
      return NextResponse.json({ error: 'Missing contract identifier for deal' }, { status: 400 })
    }

    let txId: string
    try {
      txId = await callContractMethod(
        'submit_delivery',
        [trackingHash],
        String(contractId)
      )
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'On-chain submit_delivery failed' },
        { status: 502 }
      )
    }

    // Step 4: Update DB
    const now = new Date().toISOString()
    await supabase
      .from('deals')
      .update({
        status: 'DELIVERED',
        tracking_id: trackingId,
        courier,
        tracking_hash: trackingHash,
        delivered_at: now,
        evidence_urls: evidenceUrls,
      })
      .eq('id', dealId)

    // Step 5: Email buyer
    const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${dealId}`
    const emailTemplate = emailTemplates.deliverySubmitted(
      deal.buyer_email.split('@')[0],
      trackingId,
      courier,
      dealLink,
      7
    )
    await sendEmail({ to: deal.buyer_email, ...emailTemplate })

    return NextResponse.json({
      success: true,
      trackingHash,
      txId,
    })
  } catch (err) {
    console.error('Submit delivery error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
