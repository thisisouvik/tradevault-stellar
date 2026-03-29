import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      buyerEmail, buyerWallet,
      itemName, itemDescription,
      amountUSDC, deliveryDays,
      contractAppId, contractAddress,
      contractId, onChainDealId,
    } = body

    // Validation
    if (!buyerEmail || !buyerWallet || !itemName || !amountUSDC) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get seller profile
    const { data: seller } = await supabase
      .from('profiles')
      .select('name, email, role, wallet_address')
      .eq('id', user.id)
      .single()

    if (seller?.role !== 'seller') {
      return NextResponse.json({ error: 'Only sellers can create deals' }, { status: 403 })
    }

    if (!seller?.wallet_address) {
      return NextResponse.json({ error: 'Please connect a wallet before creating a deal' }, { status: 400 })
    }

    const parsedAmount = Number.parseInt(amountUSDC, 10)
    const parsedDeliveryDays = Number.parseInt(deliveryDays, 10)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amountUSDC' }, { status: 400 })
    }

    if (!Number.isFinite(parsedDeliveryDays) || parsedDeliveryDays <= 0) {
      return NextResponse.json({ error: 'Invalid deliveryDays' }, { status: 400 })
    }

    // Insert deal — with graceful fallback if on_chain_deal_id column hasn't been
    // migrated yet (retries without it so the app never hard-fails on schema drift).
    const basePayload = {
      seller_id: user.id,
      buyer_email: buyerEmail,
      buyer_wallet: buyerWallet,
      item_name: itemName,
      item_description: itemDescription || null,
      amount_usdc: parsedAmount,
      delivery_days: parsedDeliveryDays,
      dispute_window_days: 7,
      status: 'PROPOSED',
      contract_app_id: contractAppId || contractId || null,
      contract_address: contractAddress || contractId || null,
    }

    let { data: deal, error } = await supabase
      .from('deals')
      .insert({ ...basePayload, on_chain_deal_id: onChainDealId || null })
      .select()
      .single()

    // If the column doesn't exist yet (migration pending), retry without it
    if (error?.message?.includes('on_chain_deal_id') || error?.code === '42703') {
      console.warn('on_chain_deal_id column missing — retrying without it. Run migration SQL.')
      ;({ data: deal, error } = await supabase
        .from('deals')
        .insert(basePayload)
        .select()
        .single())
    }

    if (error || !deal) {
      console.error('Deal insert error:', error)
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
    }

    // Send invite email to buyer
    const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${deal.id}`
    const emailTemplate = emailTemplates.dealInvite(
      buyerEmail.split('@')[0],
      seller?.name || 'A seller',
      dealLink,
      itemName,
      amountUSDC
    )
    await sendEmail({ to: buyerEmail, ...emailTemplate })

    return NextResponse.json({ dealId: deal.id, deal })
  } catch (err) {
    console.error('Create deal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
