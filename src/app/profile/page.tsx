import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletConnect } from '@/components/WalletConnect'
import { Shield, Star, ExternalLink, Package, ShoppingBag, Scale, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

const ROLE_CONFIG = {
  seller:     { label: 'Seller',     icon: Package,      color: '#10B981', bg: 'bg-green-100 text-green-700' },
  buyer:      { label: 'Buyer',      icon: ShoppingBag,  color: '#2563EB', bg: 'bg-blue-100 text-blue-700' },
  arbitrator: { label: 'Arbitrator', icon: Scale,        color: '#F59E0B', bg: 'bg-orange-100 text-orange-700' },
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || 'seller') as 'seller' | 'buyer' | 'arbitrator'
  const rc = ROLE_CONFIG[role]
  const RoleIcon = rc.icon

  // Fetch their deals for stats
  const { data: deals } = await supabase
    .from('deals')
    .select('status, amount_usdc')
    .or(role === 'buyer'
      ? `buyer_email.eq.${user.email},buyer_wallet.eq.${profile?.wallet_address || 'UNSET'}`
      : `seller_id.eq.${user.id}`)

  const allDeals = deals || []
  const completed = allDeals.filter(d => d.status === 'COMPLETED' || d.status === 'RESOLVED').length
  const disputed = allDeals.filter(d => d.status === 'DISPUTED').length
  const volume = allDeals
    .filter(d => d.status === 'COMPLETED' || d.status === 'RESOLVED')
    .reduce((acc, d) => acc + d.amount_usdc, 0)

  // Calculate Locked or Pending Escrow
  const activeStatuses = ['FUNDED', 'DELIVERED', 'DISPUTED']
  const lockedEscrow = allDeals
    .filter(d => activeStatuses.includes(d.status))
    .reduce((acc, d) => acc + d.amount_usdc, 0)

  // Fetch live wallet balance from Algorand Testnet
  let walletUsdc = 0
  if (profile?.wallet_address) {
    try {
      const res = await fetch(`https://testnet-api.algonode.cloud/v2/accounts/${profile.wallet_address}`, { cache: 'no-store' })
      const data = await res.json()
      const usdcAsset = data.assets?.find((a: any) => a['asset-id'] === 10458941)
      if (usdcAsset) walletUsdc = usdcAsset.amount / 1_000_000
    } catch (e) {
      console.error('Failed to fetch wallet balance', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TradeVault" className="w-6 h-6 object-contain" />
            <span className="text-[#05445E] font-bold text-lg tracking-tight hidden sm:block">TradeVault</span>
          </Link>
          <div className="w-[124px] hidden sm:block" />{/* Spacer to keep center alignment */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
              Wallet Balance
            </h2>
            <p className="text-3xl font-bold text-[#05445E]">
              ${walletUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-gray-400">USDC</span>
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
              {role === 'buyer' ? 'Locked in Escrow' : 'Pending Escrow Payout'}
            </h2>
            <p className="text-3xl font-bold text-amber-500">
              ${lockedEscrow.toLocaleString()} <span className="text-sm font-medium text-amber-500/50">USDC</span>
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
              Lifetime Volume
            </h2>
            <p className="text-3xl font-bold text-[#10b981]">
              ${volume.toLocaleString()} <span className="text-sm font-medium text-green-500/50">USDC</span>
            </p>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#F0F4F8] text-[#05445E] flex items-center justify-center border border-[#E1E8F0] shadow-sm flex-shrink-0">
            <span className="font-bold text-xl">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${rc.bg}`}>
                {rc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{profile?.email}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              Member since {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Deals', value: allDeals.length, valueClass: 'text-gray-900' },
            { label: 'Completed', value: completed, valueClass: 'text-[#10b981]' },
            { label: 'Disputes', value: disputed, valueClass: 'text-[#ef4444]' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Wallet section */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            Algorand Wallet Connection
          </h2>

          {profile?.wallet_address ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Connected Address
                  </span>
                  <a
                    href={`https://lora.algokit.io/testnet/account/${profile.wallet_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#189AB4] hover:underline flex items-center gap-1 text-sm"
                  >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-sm font-mono text-gray-900 break-all">{profile.wallet_address}</p>
              </div>
              
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#189AB4]" /> On-chain reputation coming soon
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 bg-gray-50 rounded-md border border-gray-200 flex flex-col items-center text-center">
              <Shield className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-md font-semibold text-gray-900 mb-1">No wallet connected</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Connect your Pera or Defly wallet to sign contracts and track your immutable on-chain reputation.
              </p>
              <WalletConnect />
            </div>
          )}
        </div>



      </main>
    </div>
  )
}
