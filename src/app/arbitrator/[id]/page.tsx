import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArbitratorReviewClient from './ArbitratorReviewClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { 
  title: 'Dispute Review | Arbitrator Terminal',
}

export default async function ArbitratorPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/arbitrator')

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, wallet_address')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'arbitrator') {
    redirect(`/dashboard`)
  }

  // Use admin client to bypass RLS so the arbitrator can definitely see both
  // sides of the evidence, regardless of RLS policies on the evidence table.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: deal } = await admin
    .from('deals')
    .select(`*, profiles:seller_id (name, email, wallet_address), evidence (*)`)
    .eq('id', id)
    .single()

  if (!deal) notFound()

  // Deal must be either DISPUTED or RESOLVED to be reviewed here
  if (deal.status !== 'DISPUTED' && deal.status !== 'RESOLVED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-slate-200">
          <h2 className="text-xl font-bold mb-2">Not in dispute</h2>
          <p className="text-sm text-slate-500 mb-6">
            This deal is currently <strong>{deal.status}</strong> and not open for arbitration.
          </p>
          <a href="/arbitrator" className="text-blue-600 font-bold hover:underline">
            Back to Queue
          </a>
        </div>
      </div>
    )
  }

  const seller = deal.profiles as any
  const evidence = deal.evidence || []

  // If resolved, fetch the verdict record
  let arbitration = null
  if (deal.status === 'RESOLVED') {
    const { data: arbData } = await supabase
      .from('arbitration')
      .select('*')
      .eq('deal_id', id)
      .single()
    arbitration = arbData || null
  }

  const appId = deal.contract_app_id ? parseInt(deal.contract_app_id) : 0

  return (
    <ArbitratorReviewClient 
      deal={deal}
      seller={seller}
      evidence={evidence}
      arbitration={arbitration}
      appId={appId}
    />
  )
}
