import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, ExternalLink, Hash, Clock, Package, DollarSign, User,
  AlertTriangle, CheckCircle2, Truck, Scale
} from 'lucide-react'
import { DealDetailClient } from '@/components/DealDetail'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Contract ${id.slice(0, 8)}...` }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDeal(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id (id, name, email, wallet_address)`)
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; description: string }> = {
  PROPOSED:  { label: 'Proposed',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', description: 'Waiting for buyer to review, accept and fund.' },
  ACCEPTED:  { label: 'Accepted',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  description: 'Buyer accepted. Waiting for USDC to be locked.' },
  FUNDED:    { label: 'Funded',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  description: 'USDC locked in contract. Seller should ship now.' },
  DELIVERED: { label: 'Delivered', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  description: 'Tracking submitted. 7-day dispute window active.' },
  COMPLETED: { label: 'Completed', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  description: 'Payment released to seller. Deal archived on-chain.' },
  DISPUTED:  { label: 'Disputed',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   description: 'Dispute in progress. Funds frozen. Arbitrator reviewing.' },
  RESOLVED:  { label: 'Resolved',  color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)',  description: 'Verdict delivered. Funds split and distributed.' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', description: 'Contract cancelled.' },
}

export default async function DealPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?redirectTo=/deal/${id}`)

  const deal = await getDeal(id)
  if (!deal) notFound()

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, wallet_address')
    .eq('id', user.id)
    .single()

  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.PROPOSED
  const isSeller = user.id === deal.seller_id
  const isBuyer = user.email === deal.buyer_email
  const isArbitrator = profile?.role === 'arbitrator'

  const { data: evidence } = (deal.status === 'DELIVERED' || deal.status === 'DISPUTED' || deal.status === 'RESOLVED')
    ? await supabase.from('evidence').select('*').eq('deal_id', id).order('created_at')
    : { data: [] }

  const { data: arbitration } = deal.status === 'RESOLVED'
    ? await supabase.from('arbitration').select('*').eq('deal_id', id).single()
    : { data: null }

  const dealLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${id}`
  const seller = deal.profiles as { name: string; wallet_address?: string }

  // Explicitly fetch seller's wallet address — separate query is more reliable than join typing
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('wallet_address')
    .eq('id', deal.seller_id)
    .single()
  const sellerWallet = sellerProfile?.wallet_address || ''

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">

      {/* Header */}
      <header className="h-20 bg-white flex items-center justify-between px-8 border-b border-slate-200 sticky top-0 z-40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#189AB4] to-[#05445E]" />
        
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-slate-500 hover:text-[#05445E] transition-colors text-sm font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-[#189AB4]/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <Link href="/" className="flex items-center gap-2 relative z-10 transition-transform hover:scale-105 active:scale-95">
          <img src="/logo.png" alt="TradeVault" className="w-8 h-8 object-contain" />
          <span className="text-[#05445E] font-extrabold text-xl tracking-wide hidden sm:block">TradeVault</span>
        </Link>

        <div className="flex items-center gap-3">
          {isArbitrator && deal.status === 'DISPUTED' && (
            <Link
              href={`/arbitrator/${id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors shadow-sm"
            >
              <Scale className="w-4 h-4" />
              Arbitration Room
            </Link>
          )}
          {deal.contract_app_id && (
            <a
              href={`https://lora.algokit.io/testnet/application/${deal.contract_app_id}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
            >
              On-Chain Contract
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-8">

        {/* Status Banner */}
        <div
          className="bg-white rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-sm border border-slate-200"
          style={{ borderLeft: `6px solid ${status.color}` }}
        >
          <div className="w-4 h-4 rounded-full flex-shrink-0 animate-pulse shadow-sm shadow-[currentColor]/50" style={{ background: status.color }} />
          <div className="flex-1">
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: status.color }}>{status.label}</span>
            <span className="text-sm text-slate-500 ml-3 font-semibold">{status.description}</span>
          </div>
          {/* Role tag */}
          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border shadow-sm ${
            isSeller ? 'bg-green-50 text-green-700 border-green-200'
            : isBuyer ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            {isSeller ? 'You are Seller' : isBuyer ? 'You are Buyer' : 'Arbitrator View'}
          </span>
        </div>

        {/* Contract overview */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#05445E] mb-2">{deal.item_name}</h1>
              {deal.item_description && (
                <p className="text-slate-500 text-sm leading-relaxed max-w-2xl font-medium">{deal.item_description}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-3xl font-black text-green-600 tracking-tight">${deal.amount_usdc}</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">USDC Escrow</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            {[
              { icon: DollarSign, label: 'Asset', value: 'USDC', color: '#10B981' },
              { icon: Clock, label: 'Ship Within', value: `${deal.delivery_days} Days`, color: '#189AB4' },
              { icon: Package, label: 'Dispute Window', value: `${deal.dispute_window_days} Days`, color: '#F59E0B' },
              { icon: User, label: 'Your Role', value: isSeller ? 'Seller' : isBuyer ? 'Buyer' : 'Arbitrator', color: '#8B5CF6' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                </div>
                <p className="text-lg font-extrabold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-extrabold text-sm border border-green-200">S</div>
              <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Seller</p>
              {isSeller && <span className="ml-auto text-[10px] bg-green-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">You</span>}
            </div>
            <p className="text-base font-bold text-slate-800 relative z-10">{seller?.name}</p>
            <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 font-medium relative z-10">
              {seller?.wallet_address || 'Wallet not registered'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm border border-blue-200">B</div>
              <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Buyer</p>
              {isBuyer && <span className="ml-auto text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">You</span>}
            </div>
            <p className="text-base font-bold text-slate-800 relative z-10">{deal.buyer_email}</p>
            <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 font-medium relative z-10">
              {deal.buyer_wallet}
            </p>
          </div>
        </div>

        {/* On-chain data */}
        {(deal.contract_app_id || deal.tracking_hash) && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-[#189AB4]" />
            <h3 className="text-sm font-extrabold text-[#05445E] mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#189AB4]" />
              On-Chain State Records <span className="bg-[#189AB4]/10 text-[#189AB4] text-[9px] uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0">Immutable</span>
            </h3>
            <div className="space-y-3">
              {deal.contract_app_id && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Contract App ID</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-[#05445E]">{deal.contract_app_id}</span>
                    <a href={`https://lora.algokit.io/testnet/application/${deal.contract_app_id}`} target="_blank" rel="noopener noreferrer" className="text-[#189AB4] hover:bg-[#189AB4]/10 p-2 rounded-lg transition-colors bg-white border border-slate-200">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              {deal.tracking_hash && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <Hash className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tracking Hash</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#05445E] bg-white px-3 py-1.5 rounded border border-slate-200 break-all max-w-[50%]">{deal.tracking_hash}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Arbitration result if resolved */}
        {arbitration && (
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 mb-8 shadow-sm border border-blue-200 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-extrabold text-blue-900 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" />
              Arbitration Verdict Executed
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-white/60 backdrop-blur-sm shadow-sm rounded-xl border border-green-200">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1 items-center gap-1.5 flex"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> Seller Share</p>
                <p className="text-3xl font-black text-green-700">{(arbitration as any).seller_pct}%</p>
              </div>
              <div className="p-4 bg-white/60 backdrop-blur-sm shadow-sm rounded-xl border border-blue-200">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 items-center gap-1.5 flex"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Buyer Share</p>
                <p className="text-3xl font-black text-blue-700">{(arbitration as any).buyer_pct}%</p>
              </div>
            </div>
            {(arbitration as any).notes && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium">
                "{(arbitration as any).notes}"
              </div>
            )}
          </div>
        )}

        {/* Action Panel — role+state aware client component */}
        <DealDetailClient
          deal={{
            id: deal.id,
            status: deal.status,
            amount_usdc: deal.amount_usdc,
            buyer_wallet: deal.buyer_wallet,
            buyer_email: deal.buyer_email,
            delivery_days: deal.delivery_days,
            dispute_window_days: deal.dispute_window_days,
            contract_app_id: deal.contract_app_id,
            contract_address: deal.contract_address,
            tracking_id: deal.tracking_id,
            courier: deal.courier,
            tracking_hash: deal.tracking_hash,
            evidence_urls: deal.evidence_urls,
            seller_wallet: sellerWallet,
          }}
          isSeller={isSeller}
          isBuyer={isBuyer}
          userEmail={user.email || ''}
          evidence={evidence || []}
          arbitration={arbitration}
          dealLink={dealLink}
        />
      </main>
    </div>
  )
}
