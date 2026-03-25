import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ArbitratorProfileClient from './ArbitratorProfileClient'

export const metadata: Metadata = { 
  title: 'Arbitrator Profile | Settings',
}

export default async function ArbitratorProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/arbitrator/profile')

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'arbitrator') {
    redirect(`/dashboard`)
  }

  // Fetch resolved disputes history for the performance metrics (mocked/queried)
  const { data: resolvedDisputes } = await supabase
    .from('deals')
    .select(`*`)
    .eq('status', 'RESOLVED')

  return (
    <ArbitratorProfileClient 
      profile={profile}
      resolvedDisputes={resolvedDisputes || []}
    />
  )
}
