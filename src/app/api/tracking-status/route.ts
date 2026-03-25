import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrackingStatus } from '@/lib/tracking'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('dealId')

  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = await createClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('tracking_id, courier, tracking_hash')
    .eq('id', dealId)
    .single()

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
