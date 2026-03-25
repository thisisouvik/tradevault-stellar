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
      amountUSDC, deliveryDays, disputeWindowDays,
      contractAppId, contractAddress,
    } = body

    // Validation
    if (!buyerEmail || !buyerWallet || !itemName || !amountUSDC) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get seller profile
    const { data: seller } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Insert deal
    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        seller_id: user.id,
        buyer_email: buyerEmail,
        buyer_wallet: buyerWallet,
        item_name: itemName,
        item_description: itemDescription || null,
        amount_usdc: parseInt(amountUSDC),
        delivery_days: parseInt(deliveryDays),
        dispute_window_days: parseInt(disputeWindowDays),
        status: 'PROPOSED',
        contract_app_id: contractAppId || null,
        contract_address: contractAddress || null,
      })
      .select()
      .single()

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
