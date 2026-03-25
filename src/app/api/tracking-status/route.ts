import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrackingStatus } from '@/lib/tracking'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('dealId')

  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: deal } = await supabase
    .from('deals')
    .select('tracking_id, courier, tracking_hash, seller_id, buyer_email')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const isSeller = deal.seller_id === user.id
  const isBuyer = Boolean(user.email && deal.buyer_email && user.email === deal.buyer_email)
  const isArbitrator = actorProfile?.role === 'arbitrator'

  if (!isSeller && !isBuyer && !isArbitrator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!deal?.tracking_id || !deal?.courier) {
    return NextResponse.json({ checkpoints: [], status: 'Unknown' })
  }

  const tracking = await getTrackingStatus(deal.tracking_id, deal.courier)

  if (!tracking) {
    return NextResponse.json({ checkpoints: [], status: 'Pending' })
  }

  // Update DB if delivered
  if (tracking.isDelivered) {
    await supabase
      .from('deals')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', dealId)
      .eq('status', 'DELIVERED')
  }

  return NextResponse.json(tracking)
}
