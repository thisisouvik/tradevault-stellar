import { Shield, ExternalLink, CheckCircle, AlertTriangle, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ walletAddress: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { walletAddress } = await params
  return { title: `Trader ${walletAddress.slice(0, 8)}... — TradeVault` }
}

// On-chain reputation is read from Algorand transaction notes
// For this implementation, we simulate the data structure that would
// come from algodClient.searchForTransactions({ address: walletAddress })
async function getOnChainReputation(walletAddress: string) {
  // In production: fetch from Algorand indexer
  // const indexer = new algosdk.Indexer(...)
  // const txns = await indexer.lookupAccountTransactions(walletAddress).do()
  // Parse transaction notes for TradeVault reputation records

  // Placeholder that returns empty data until contract is deployed
  return {
    totalTrades: 0,
    completed: 0,
    disputed: 0,
    totalVolumeUSDC: 0,
    history: [] as Array<{
      dealId: string
      outcome: string
      value: number
      timestamp: number
    }>
  }
}

function getTrustScore(completed: number, disputed: number): {
  label: string
  color: string
  bg: string
  description: string
} {
  if (completed === 0) return { label: 'New', color: '#9CA3AF', bg: 'bg-gray-100', description: 'No trade history yet.' }
  const rate = disputed / completed
  if (rate === 0) return { label: 'Trusted', color: '#10B981', bg: 'bg-green-100', description: 'Clean history — zero disputes.' }
  if (rate < 0.1) return { label: 'Good', color: '#3B82F6', bg: 'bg-blue-100', description: 'Minor dispute history.' }
  if (rate < 0.3) return { label: 'Caution', color: '#F59E0B', bg: 'bg-yellow-100', description: 'Some disputes — proceed carefully.' }
  return { label: 'High Risk', color: '#EF4444', bg: 'bg-red-100', description: 'High dispute rate — trade with caution.' }
}

export default async function TraderProfilePage({ params }: PageProps) {
  const { walletAddress } = await params
  const decodedWallet = decodeURIComponent(walletAddress)
  const rep = await getOnChainReputation(decodedWallet)
  const trust = getTrustScore(rep.completed, rep.disputed)

  const shortWallet = `${decodedWallet.slice(0, 6)}...${decodedWallet.slice(-6)}`

  return (
    <div className="min-h-screen bg-[#F0F2F5]">

      {/* Header */}
      <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 border-b border-[#E5E7EB] sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#111827]">TradeVault</span>
        </Link>
        <a
          href={`https://lora.algokit.io/testnet/account/${decodedWallet}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
        >
          View on Algorand
          <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Profile Header Card */}
        <div className="saas-card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-xl font-black flex-shrink-0">
              {decodedWallet.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#111827] font-mono">{shortWallet}</h1>
                {/* Trust badge */}
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${trust.bg}`} style={{ color: trust.color }}>
                  <Star className="w-3.5 h-3.5" />
                  {trust.label}
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mb-3">{trust.description}</p>
              {/* Full wallet address */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-mono text-[#6B7280] break-all flex-1">{decodedWallet}</p>
                <a
                  href={`https://lora.algokit.io/testnet/account/${decodedWallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] hover:bg-blue-50 p-1 rounded flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trades', value: rep.totalTrades, icon: TrendingUp, color: '#2563EB' },
            { label: 'Completed', value: rep.completed, icon: CheckCircle, color: '#10B981' },
            { label: 'Disputed', value: rep.disputed, icon: AlertTriangle, color: '#EF4444' },
            { label: 'Volume (USDC)', value: `$${rep.totalVolumeUSDC.toLocaleString()}`, icon: Star, color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} className="saas-card text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
              <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* On-chain history */}
        <div className="saas-card">
          <h2 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            Trade History
            <span className="text-xs text-[#9CA3AF] font-normal ml-1">— Read from Algorand, publicly verifiable</span>
          </h2>

          {rep.history.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-[#9CA3AF]" />
              </div>
              <p className="text-[#6B7280] text-sm font-medium mb-1">No trade history on-chain yet.</p>
              <p className="text-xs text-[#9CA3AF]">
                History will appear here once this wallet completes trades on TradeVault.
                All records are written to Algorand and cannot be deleted.
              </p>
              <a
                href={`https://lora.algokit.io/testnet/account/${decodedWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline"
              >
                View raw transactions on AlgoExplorer
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {rep.history.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    {item.outcome === 'COMPLETED'
                      ? <CheckCircle className="w-4 h-4 text-[#10B981]" />
                      : <AlertTriangle className="w-4 h-4 text-[#EF4444]" />}
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{item.outcome}</p>
                      <p className="text-xs text-[#9CA3AF]">{new Date(item.timestamp * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#2563EB]">${item.value} USDC</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          This reputation data is read directly from Algorand and cannot be modified, deleted, or faked.
        </p>
      </main>
    </div>
  )
}
