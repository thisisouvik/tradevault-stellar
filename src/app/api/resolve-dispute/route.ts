import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callContractMethod } from '@/lib/algorand'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dealId, sellerPct, buyerPct, notes } = await request.json()

    if (sellerPct + buyerPct !== 100) {
      return NextResponse.json({ error: 'Percentages must sum to 100' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch deal
    const { data: deal } = await admin
      .from('deals')
      .select(`*, profiles:seller_id(name, email, wallet_address)`)
      .eq('id', dealId)
      .single()

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    if (deal.status !== 'DISPUTED') return NextResponse.json({ error: 'Deal must be in DISPUTED state' }, { status: 400 })

    // Save arbitration record
    const { error: arbError } = await admin.from('arbitration').insert({
      deal_id: dealId,
      arbitrator_id: user.id,
      seller_pct: sellerPct,
      buyer_pct: buyerPct,
      notes: notes || null,
    })

    if (arbError) return NextResponse.json({ error: 'Failed to save arbitration' }, { status: 500 })

    // Call resolve_dispute() on contract
    if (deal.contract_app_id && process.env.PLATFORM_MNEMONIC) {
      try {
        await callContractMethod(
          parseInt(deal.contract_app_id),
          'resolve_dispute',
          [sellerPct, buyerPct]
        )
      } catch (err) {
        console.warn('Contract call failed (continuing):', err)
      }
    }

    // Update deal status
    await admin.from('deals').update({ status: 'RESOLVED' }).eq('id', dealId)

    // Email both parties
    const seller = deal.profiles as { name: string; email: string }
    const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${dealId}`
    const subject = `Dispute resolved — ${deal.item_name}`
    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <span style="font-size:24px;font-weight:800;color:#4ade80;display:block;margin-bottom:24px">TradeVault</span>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px">&#x2696;&#xFE0F; Dispute Resolved</h1>
        <p style="color:#8ca0b3;margin-bottom:16px">
          The arbitrator has reviewed your case for <strong style="color:#f0f4f8">${deal.item_name}</strong>.
        </p>
        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px">
          <p>Seller: ${sellerPct}% ($${Math.floor(deal.amount_usdc * sellerPct / 100)} USDC)</p>
          <p>Buyer: ${buyerPct}% ($${Math.floor(deal.amount_usdc * buyerPct / 100)} USDC)</p>
          ${notes ? `<p style="color:#8ca0b3;margin-top:12px;font-style:italic">"${notes}"</p>` : ''}
        </div>
        <a href="${dealLink}" style="display:inline-block;background:#06b6d4;color:#fff;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none">
          View deal &rarr;
        </a>
      </div>
    `
    await sendEmail({ to: seller.email, subject, html })
    await sendEmail({ to: deal.buyer_email, subject, html })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Resolve dispute error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
