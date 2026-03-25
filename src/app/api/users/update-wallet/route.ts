import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: walletAddress })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update wallet error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
