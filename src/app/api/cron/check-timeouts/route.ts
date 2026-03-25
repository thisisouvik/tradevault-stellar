import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callContractMethod, writeReputationNote } from '@/lib/algorand'
import { sendEmail, emailTemplates } from '@/lib/email'

// Called by Vercel Cron every hour: 0 * * * *
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Find all DELIVERED deals where dispute window has expired
  const { data: expiredDeals } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id(name, email)`)
    .eq('status', 'DELIVERED')
    .not('delivered_at', 'is', null)

  if (!expiredDeals || expiredDeals.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const deal of expiredDeals) {
    const deliveredAt = new Date(deal.delivered_at)
    const windowEnd = new Date(deliveredAt.getTime() + deal.dispute_window_days * 86400 * 1000)

    if (now <= windowEnd) continue // Still within window

    try {
      // Call timeout_release() on contract
      if (deal.contract_app_id && process.env.PLATFORM_MNEMONIC) {
        await callContractMethod(parseInt(deal.contract_app_id), 'timeout_release')
      }

      // Update DB
      await supabase
        .from('deals')
        .update({ status: 'COMPLETED' })
        .eq('id', deal.id)

      // Write reputation note
      const seller = deal.profiles as { name: string; email: string; wallet_address?: string }
      if (seller?.wallet_address) {
        await writeReputationNote(seller.wallet_address, 'COMPLETED', deal.amount_usdc, deal.id)
      }

      // Email notifications
      const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${deal.id}`
      const emailTemplate = emailTemplates.dealCompleted(seller.name, deal.item_name, deal.amount_usdc)
      await sendEmail({ to: seller.email, ...emailTemplate })
      await sendEmail({ to: deal.buyer_email, ...emailTemplate })

      processed++
      console.log(`Auto-released deal ${deal.id}`)
    } catch (err) {
      console.error(`Failed to process timeout for deal ${deal.id}:`, err)
    }
  }

  return NextResponse.json({ processed, checked: expiredDeals.length })
}
