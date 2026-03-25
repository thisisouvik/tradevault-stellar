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

  // Fetch all disputes assigned to this arbitrator
  // Wait, right now we don't have an arbitrator_id column on deals.
  // Deals just have status = DISPUTED. Let's fetch all disputed deals
  // Since we only have "Platform Arbitrator", all disputes go to platform arbitrators.
  const { data: activeDisputes } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id (name, email), evidence (*)`)
    .eq('status', 'DISPUTED')
    .order('created_at', { ascending: true }) // Oldest first for queue (by spec)

  // Fetch resolved disputes history
  const { data: resolvedDisputes } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id (name, email)`)
    .eq('status', 'RESOLVED')
    .order('updated_at', { ascending: false })

  return (
    <ArbitratorDashboardClient 
      profile={profile} 
      activeDisputes={activeDisputes || []} 
      resolvedDisputes={resolvedDisputes || []} 
    />
  )
}
