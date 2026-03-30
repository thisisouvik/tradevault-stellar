import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callContractMethod, sha256 } from '@/lib/stellar'
import { resolveOnchainAction } from '@/lib/dealLifecycle'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action } = await request.json()
    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('id, seller_id, buyer_email, buyer_wallet, status, contract_address, contract_app_id')
      .eq('id', id)
      .single()

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    const isBuyer = Boolean(
      actorProfile?.wallet_address &&
      deal.buyer_wallet &&
      actorProfile.wallet_address.trim().toUpperCase() === deal.buyer_wallet.trim().toUpperCase()
    )
    if (!isBuyer) {
      return NextResponse.json({ error: 'Only buyer can execute this action' }, { status: 403 })
    }

    const contractId = deal.contract_address || deal.contract_app_id
    if (!contractId) {
      return NextResponse.json({ error: 'Missing contract identifier for deal' }, { status: 400 })
    }

    const resolvedAction = resolveOnchainAction(action, deal.status)
    if (!resolvedAction) {
      if (action === 'fund') {
        return NextResponse.json({ error: 'Deal must be PROPOSED or ACCEPTED to fund' }, { status: 400 })
      }
      if (action === 'confirm') {
        return NextResponse.json({ error: 'Deal must be DELIVERED before confirmation' }, { status: 400 })
      }
      if (action === 'dispute') {
        return NextResponse.json({ error: 'Deal must be DELIVERED before dispute' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const method = resolvedAction.method
    const status = resolvedAction.nextStatus
    let args: unknown[] = []

    if (action === 'dispute') {
      const reasonHash = await sha256(`dispute:${deal.id}:${user.id}:${Date.now()}`)
      args = [reasonHash]
    }

    const txHash = await callContractMethod(method, args, String(contractId))

    return NextResponse.json({ success: true, txHash, status, chainNetwork: 'stellar' })
  } catch (err: any) {
    console.error('[deals/onchain] error:', err)
    return NextResponse.json({ error: err?.message || 'On-chain action failed' }, { status: 500 })
  }
}
