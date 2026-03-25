import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callContractMethod, sha256 } from '@/lib/stellar'

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
      .select('id, seller_id, buyer_email, status, contract_address, contract_app_id')
      .eq('id', id)
      .single()

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const isBuyer = Boolean(user.email && deal.buyer_email && user.email === deal.buyer_email)
    if (!isBuyer) {
      return NextResponse.json({ error: 'Only buyer can execute this action' }, { status: 403 })
    }

    const contractId = deal.contract_address || deal.contract_app_id
    if (!contractId) {
      return NextResponse.json({ error: 'Missing contract identifier for deal' }, { status: 400 })
    }

    let method = ''
    let args: unknown[] = []
    let status = ''

    if (action === 'fund') {
      if (deal.status !== 'PROPOSED' && deal.status !== 'ACCEPTED') {
        return NextResponse.json({ error: 'Deal must be PROPOSED or ACCEPTED to fund' }, { status: 400 })
      }
      method = 'fund_deal'
      status = 'FUNDED'
    } else if (action === 'confirm') {
      if (deal.status !== 'DELIVERED') {
        return NextResponse.json({ error: 'Deal must be DELIVERED before confirmation' }, { status: 400 })
      }
      method = 'confirm_package'
      status = 'COMPLETED'
    } else if (action === 'dispute') {
      if (deal.status !== 'DELIVERED') {
        return NextResponse.json({ error: 'Deal must be DELIVERED before dispute' }, { status: 400 })
      }
      const reasonHash = await sha256(`dispute:${deal.id}:${user.id}:${Date.now()}`)
      method = 'raise_dispute'
      args = [reasonHash]
      status = 'DISPUTED'
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const txHash = await callContractMethod(method, args, String(contractId))

    return NextResponse.json({ success: true, txHash, status, chainNetwork: 'stellar' })
  } catch (err: any) {
    console.error('[deals/onchain] error:', err)
    return NextResponse.json({ error: err?.message || 'On-chain action failed' }, { status: 500 })
  }
}
