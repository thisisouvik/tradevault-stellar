import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ArbitratorDashboardClient from './ArbitratorDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dispute Queue' }

export default async function ArbitratorIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/arbitrator')

  // Verify arbitrator role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, wallet_address')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'arbitrator') {
    redirect('/dashboard')
  }

  if (!profile?.wallet_address) {
    redirect('/arbitrator/profile?walletRequired=1')
  }

  // Fetch disputes assigned to this arbitrator wallet.
  const { data: activeDisputes } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id (name, email), evidence (*)`)
    .eq('status', 'DISPUTED')
    .eq('arbitrator_wallet', profile.wallet_address)
    .order('created_at', { ascending: true }) // Oldest first for queue (by spec)

  // Fetch resolved disputes history
  const { data: resolvedDisputes } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id (name, email)`)
    .eq('status', 'RESOLVED')
    .eq('arbitrator_wallet', profile.wallet_address)
    .order('updated_at', { ascending: false })

  return (
    <ArbitratorDashboardClient 
      profile={profile} 
      activeDisputes={activeDisputes || []} 
      resolvedDisputes={resolvedDisputes || []} 
    />
  )
}
