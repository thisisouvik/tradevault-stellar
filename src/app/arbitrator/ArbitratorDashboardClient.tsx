'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Scale, LayoutDashboard, LogOut, Search, Clock, AlertTriangle, CheckCircle, Package, ArrowRight, ExternalLink, User } from 'lucide-react'
import { WalletConnect } from '@/components/WalletConnect'

interface ArbitratorDashboardProps {
  profile: any
  activeDisputes: any[]
  resolvedDisputes: any[]
}

export default function ArbitratorDashboardClient({ profile, activeDisputes, resolvedDisputes }: ArbitratorDashboardProps) {
  const [showResolved, setShowResolved] = useState(false)

  // Calculations
  const now = Date.now()
  const criticalDisputes = activeDisputes.filter(d => (now - new Date(d.created_at).getTime()) > 48 * 60 * 60 * 1000)
  
  // Fake evidence missing calculation for UI demonstration (suppose evidence count < 2 means missing)
  const missingEvidenceDisputes = activeDisputes.filter(d => (d.evidence?.length || 0) < 2)

  const thisMonthResolved = resolvedDisputes.filter(d => {
    const closedAt = new Date(d.updated_at || d.created_at) // Assuming updated_at represents resolution time
    const today = new Date()
    return closedAt.getMonth() === today.getMonth() && closedAt.getFullYear() === today.getFullYear()
  })

  // Mock average resolution time: 28 hours (static for demonstration since we may not have full timestamps ready)
  const averageResolutionHours = 28

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900 font-sans">
      
      {/* Clean Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TradeVault" className="w-6 h-6 object-contain" />
            <span className="text-[#05445E] font-bold text-lg tracking-tight">TradeVault</span>
          </Link>
        </div>

        <div className="px-6 py-5 border-b border-gray-100 bg-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm border border-orange-200">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name || 'Arbitrator'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">Neutral Judge</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/dashboard" className="flex items-center px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <LayoutDashboard className="w-4 h-4 mr-3 flex-shrink-0 text-gray-400" />
            <span className="text-sm">Account Overview</span>
          </Link>
          <Link href="/arbitrator" className="flex items-center px-3 py-2 rounded-md bg-[#F0F4F8] text-[#05445E] font-medium transition-colors">
            <Scale className="w-4 h-4 mr-3 flex-shrink-0 text-[#05445E]" />
            <span className="text-sm">Dispute Queue</span>
            {activeDisputes.length > 0 && <span className="ml-auto bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{activeDisputes.length}</span>}
          </Link>
        </div>

        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 bg-white z-10">
          <div>
            <h1 className="text-lg font-extrabold text-[#05445E]">Dispute Queue</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">Neutral conflict resolution terminal</p>
          </div>

          <div className="flex items-center gap-4">
            <WalletConnect />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* SEC A - Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Open Disputes</p>
                <div className="flex items-end gap-3 relative z-10">
                  <h3 className="text-4xl font-black text-orange-500">{activeDisputes.length}</h3>
                  <span className="text-sm font-medium text-orange-600/60 mb-1">pending verdict</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Resolved This Month</p>
                <h3 className="text-4xl font-black text-[#05445E]">{thisMonthResolved.length}</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Resolution Time</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-blue-500">{averageResolutionHours}</h3>
                  <span className="text-sm font-medium text-slate-500 mb-1">hours</span>
                </div>
              </div>
            </div>

            {/* SEC B - Urgency Banner */}
            {criticalDisputes.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 text-red-800">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">Urgent Action Required</h3>
                    <p className="text-xs font-medium mt-0.5">{criticalDisputes.length} dispute{criticalDisputes.length > 1 ? 's have' : ' has'} been waiting over 48 hours for a verdict.</p>
                  </div>
                </div>
                <Link href={`/arbitrator/${criticalDisputes[0].id}`} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap transition-colors">
                  Review Oldest
                </Link>
              </div>
            )}

            {/* SEC C - Evidence Missing Banner */}
            {missingEvidenceDisputes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-3 shadow-sm text-blue-800">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-blue-100">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm font-medium">
                  <strong className="font-extrabold">{missingEvidenceDisputes.length} dispute{missingEvidenceDisputes.length > 1 ? 's are' : ' is'}</strong> waiting for evidence submissions. You will be notified when ready for review.
                </p>
              </div>
            )}

            {/* SEC D - Dispute Queue List */}
            <div>
              <h2 className="text-base font-extrabold text-[#05445E] mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#189AB4]" />
                Active Cases
              </h2>
              <div className="space-y-4">
                {activeDisputes.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Queue is empty</h3>
                    <p className="text-sm text-gray-500">There are no active disputes requiring your attention.</p>
                  </div>
                ) : (
                  activeDisputes.map(deal => {
                    const seller = deal.profiles as { name: string; email: string }
                    const hoursOpen = Math.floor((now - new Date(deal.created_at).getTime()) / (1000 * 60 * 60))
                    // Simplified logic: length >= 2 means both submitted
                    const hasBothEvidence = (deal.evidence?.length || 0) >= 2 

                    return (
                      <div key={deal.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row">
                        <div className={`w-1.5 flex-shrink-0 ${hoursOpen > 48 ? 'bg-red-500' : 'bg-orange-400'}`} />
                        <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          
                          {/* Deal & Parties */}
                          <div className="md:col-span-5 space-y-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">#{deal.id.slice(0, 8)}</span>
                                <span className="text-xl font-black text-green-600">${deal.amount_usdc} USDC</span>
                              </div>
                              <h3 className="text-sm font-bold text-gray-900 truncate">{deal.item_name}</h3>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs font-semibold text-gray-600">
                              <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400"/> {seller?.name || 'Seller'}</div>
                              <span className="text-gray-300">|</span>
                              <div className="flex items-center gap-1.5 text-right justify-end"><User className="w-3 h-3 text-slate-400"/> {deal.buyer_email || 'Buyer'}</div>
                            </div>
                          </div>

                          {/* Status & Deadline */}
                          <div className="md:col-span-4 border-l border-gray-100 pl-6 py-2">
                            <div className="flex items-center justify-between mb-3 text-xs">
                              <span className="font-bold text-gray-500 uppercase tracking-widest">Evidence</span>
                              <span className={`font-black uppercase ${hasBothEvidence ? 'text-green-500' : 'text-blue-500'}`}>
                                {hasBothEvidence ? 'Ready ✓' : 'Pending...'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                              <div className={`h-1.5 rounded-full ${hasBothEvidence ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/2'}`} />
                            </div>

                            <div className="flex items-center gap-2">
                              {hoursOpen > 48 ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                  <AlertTriangle className="w-3 h-3"/> SLA Breach ({hoursOpen}h)
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-400"/> Opened {hoursOpen}h ago
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action */}
                          <div className="md:col-span-3 flex justify-end">
                            {hasBothEvidence ? (
                              <Link href={`/arbitrator/${deal.id}`} className="flex items-center justify-center gap-2 w-full md:w-auto bg-[#05445E] hover:bg-[#189AB4] text-white px-5 py-3 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                Review & Decide <ArrowRight className="w-4 h-4"/>
                              </Link>
                            ) : (
                              <button disabled className="flex items-center justify-center gap-2 w-full md:w-auto bg-gray-100 text-gray-400 px-5 py-3 rounded-lg text-sm font-bold cursor-not-allowed border border-gray-200">
                                Awaiting Evidence
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* SEC E - Resolved History */}
            <div className="pt-6 border-t border-gray-200">
              <button 
                onClick={() => setShowResolved(!showResolved)}
                className="text-sm font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2 hover:text-gray-800 transition-colors"
              >
                Resolved Historical Disputes ({resolvedDisputes.length})
              </button>
              
              <AnimatePresence>
                {showResolved && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {resolvedDisputes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic p-4">No resolved disputes yet.</p>
                    ) : (
                      resolvedDisputes.map(deal => (
                        <div key={deal.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex-1">
                            <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-black text-gray-500 uppercase tracking-widest mr-2">#{deal.id.slice(0, 8)}</span>
                            <span className="text-sm font-bold text-gray-900">{deal.item_name}</span>
                            <p className="text-xs text-slate-500 mt-1">Resolved on {new Date(deal.updated_at || deal.created_at).toLocaleDateString()}</p>
                          </div>
                          <Link href={`/deal/${deal.id}`} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            View Resolution <ExternalLink className="w-3 h-3"/>
                          </Link>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
