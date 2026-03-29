'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, CheckCheck, Clock, AlertTriangle } from 'lucide-react'
import { FundEscrow } from './FundEscrow'
import { SubmitDelivery } from './SubmitDelivery'
import { ConfirmReceipt } from './ConfirmReceipt'
import { RaiseDispute } from './RaiseDispute'
import { TrackingTimeline } from './TrackingTimeline'
import { EvidenceUpload } from './EvidenceUpload'

interface DealDetailClientProps {
  deal: {
    id: string
    status: string
    amount_usdc: number
    buyer_wallet: string
    buyer_email: string
    delivery_days: number
    dispute_window_days: number
    contract_app_id?: string
    contract_address?: string
    tracking_id?: string
    courier?: string
    tracking_hash?: string
    evidence_urls?: string[]
    seller_wallet: string
  }
  isSeller: boolean
  isBuyer: boolean
  userEmail: string
  evidence: Array<{ id: string; submitted_by: string; description: string; photo_urls: string[]; created_at: string }>
  arbitration: { seller_pct: number; buyer_pct: number; notes?: string } | null
  dealLink: string
}

export function DealDetailClient({
  deal,
  isSeller,
  isBuyer,
  evidence,
  arbitration,
  dealLink,
}: DealDetailClientProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(dealLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function refresh() {
    window.location.reload()
  }

  const appId = deal.contract_app_id || deal.contract_address || ''

  return (
    <div className="space-y-6">
      {/* Share deal link - Only relevant for Seller */}
      {isSeller && deal.status === 'PROPOSED' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#189AB4]/5 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[10px] font-extrabold text-[#189AB4] uppercase tracking-widest mb-3 relative z-10">Share Contract Link</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
            <div className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-600 truncate font-semibold">
              {dealLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-slate-200 hover:border-[#189AB4]/30 hover:bg-[#189AB4]/5 text-[#05445E] transition-all"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-2 font-medium relative z-10">
            <Share2 className="w-4 h-4 text-[#189AB4]" />
            Send this link to the buyer so they can review and securely fund the escrow via Stellar.
          </p>
        </div>
      )}

      {/* Persistent Tracking & Delivery Proof (Visible post-funding) */}
      {deal.tracking_id && deal.courier && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <TrackingTimeline
            dealId={deal.id}
            trackingId={deal.tracking_id}
            courier={deal.courier}
            trackingHash={deal.tracking_hash}
            appId={appId}
          />

          {deal.evidence_urls && deal.evidence_urls.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                Seller's Shipping Evidence
              </p>
              <div className="flex gap-3 flex-wrap">
                {deal.evidence_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:scale-105 transition-transform duration-200 bg-slate-50">
                    <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action panel */}
      <AnimatePresence mode="wait">
        
        {/* PROPOSED — buyer needs to fund */}
        {deal.status === 'PROPOSED' && isBuyer && appId.length > 0 && deal.contract_address && (
          <motion.div
            key="fund"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-lg font-extrabold text-blue-900 mb-2 relative z-10">Accept & Fund Escrow</h3>
            <p className="text-sm text-blue-700/80 mb-6 font-medium relative z-10">
              Review the contract terms carefully. By funding, your USDC is locked in the smart contract and you cryptographically agree to these terms.
            </p>
            <div className="relative z-10">
              <FundEscrow
                dealId={deal.id}
                amountUSDC={deal.amount_usdc}
                sellerWallet={deal.seller_wallet}
                onSuccess={refresh}
              />
            </div>
          </motion.div>
        )}

        {deal.status === 'PROPOSED' && isSeller && (
          <motion.div
            key="proposed-seller"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 border border-slate-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-extrabold text-[#05445E]">Waiting for buyer to fund</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">Share the deal link above with <span className="font-bold text-slate-700">{deal.buyer_email}</span> to proceed.</p>
            </div>
          </motion.div>
        )}

        {/* FUNDED — seller needs to ship */}
        {deal.status === 'FUNDED' && isSeller && (
          <motion.div
            key="submit-delivery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50/50 rounded-2xl p-6 border border-green-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-lg font-extrabold text-green-900 mb-2 relative z-10">Payment Locked: Submit Shipping Proof</h3>
            <p className="text-sm text-green-700/80 mb-6 font-medium relative z-10">
              <span className="font-black text-green-600">${deal.amount_usdc} USDC</span> is now cryptographically secured. You are safe to ship. Please submit your tracking number below.
            </p>
            <div className="relative z-10">
              <SubmitDelivery dealId={deal.id} onSuccess={refresh} />
            </div>
          </motion.div>
        )}

        {deal.status === 'FUNDED' && isBuyer && (
          <motion.div
            key="funded-buyer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-purple-50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 border border-purple-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-purple-100 flex-shrink-0">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-base font-extrabold text-purple-900">Escrow Funded ✓</p>
              <p className="text-sm text-purple-700/80 mt-1 font-medium">Your funds are locked. Waiting for seller to ship and provide tracking. You'll be notified via email.</p>
            </div>
          </motion.div>
        )}

        {/* DELIVERED — tracking + confirm/dispute */}
        {deal.status === 'DELIVERED' && (
          <motion.div
            key="delivered"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >

            {isBuyer && appId.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-extrabold text-[#05445E] mb-2">Confirm or Dispute</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">
                  Goods arrived? Confirm receipt to securely release payment. Issue with goods? Raise a dispute within the <span className="font-bold text-slate-700">{deal.dispute_window_days}-day</span> window.
                </p>
                <div className="space-y-4">
                  <ConfirmReceipt
                    dealId={deal.id}
                    amountUSDC={deal.amount_usdc}
                    sellerWallet={deal.seller_wallet}
                    onSuccess={refresh}
                  />
                  <RaiseDispute
                    dealId={deal.id}
                    onSuccess={refresh}
                  />
                </div>
              </div>
            )}

            {isSeller && (
              <div className="space-y-6">
                <div className="bg-yellow-50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 border border-yellow-200 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-yellow-100 flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-yellow-900">Waiting for buyer to confirm</p>
                    <p className="text-sm text-yellow-700/80 mt-1 font-medium">
                      If they don't confirm or dispute within <span className="font-bold text-yellow-800">{deal.dispute_window_days} days</span>, funds auto-release to you.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* DISPUTED — show evidence upload for buyer only */}
        {deal.status === 'DISPUTED' && (
          <motion.div
            key="disputed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-extrabold text-red-900">Dispute in Progress</h3>
              </div>
              <p className="text-sm text-red-700/80 font-medium relative z-10">
                Funds are frozen. An independent arbitrator is reviewing the case. Please upload any necessary evidence below.
              </p>
            </div>

            {isBuyer && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-extrabold text-[#05445E] mb-2">Submit Additional Evidence</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">
                  Upload photos, chat screenshots, or tracking receipts to support your case.
                </p>
                <EvidenceUpload dealId={deal.id} role="buyer" onSuccess={refresh} />
              </div>
            )}
          </motion.div>
        )}

        {/* COMPLETED */}
        {deal.status === 'COMPLETED' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-10 border border-green-200 shadow-sm text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-green-100 relative z-10">
              <CheckCheck className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-green-900 mb-3 relative z-10">Escrow Deal Completed</h3>
            <p className="text-sm font-medium text-green-800/80 max-w-sm mx-auto relative z-10">
              <span className="font-extrabold text-green-700">${deal.amount_usdc} USDC</span> has been securely released to the seller. This deal is permanently and immutably archived on the Stellar blockchain.
            </p>
          </motion.div>
        )}

        {/* RESOLVED */}
        {deal.status === 'RESOLVED' && arbitration && (
          <motion.div
            key="resolved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50/50 rounded-2xl p-8 border border-blue-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xl font-black text-blue-900 mb-6 relative z-10 flex items-center gap-2">
              <CheckCheck className="w-6 h-6 text-blue-500" />
              Dispute Verdict Executed
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 relative z-10">
              <div className="p-6 rounded-2xl text-center bg-white shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#189AB4]" />
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Seller received</p>
                <p className="text-4xl font-black text-[#189AB4] mb-1">{arbitration.seller_pct}%</p>
                <p className="text-sm text-slate-600 font-bold">${Math.floor(deal.amount_usdc * arbitration.seller_pct / 100)} USDC</p>
              </div>
              <div className="p-6 rounded-2xl text-center bg-white shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#05445E]" />
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Buyer received</p>
                <p className="text-4xl font-black text-[#05445E] mb-1">{arbitration.buyer_pct}%</p>
                <p className="text-sm text-slate-600 font-bold">${Math.floor(deal.amount_usdc * arbitration.buyer_pct / 100)} USDC</p>
              </div>
            </div>
            {arbitration.notes && (
              <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative z-10">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Arbitrator Notes
                </p>
                <p className="text-sm text-slate-700 italic font-medium">&ldquo;{arbitration.notes}&rdquo;</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing evidence — Universally visible when evidence exists */}
      {evidence.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
          <p className="text-base font-extrabold text-[#05445E] mb-6">Submitted Evidence Library</p>
          <div className="space-y-4">
            {evidence.map(ev => (
              <div
                key={ev.id}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${ev.submitted_by === 'seller' ? 'bg-[#189AB4]' : 'bg-[#05445E]'}`} />
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 ml-2"
                  style={{ color: ev.submitted_by === 'seller' ? '#189AB4' : '#05445E' }}>
                  {ev.submitted_by} <span className="text-slate-400 font-medium ml-1">· {new Date(ev.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</span>
                </p>
                <p className="text-sm text-slate-700 leading-relaxed mb-4 ml-2 font-medium">{ev.description}</p>
                {ev.photo_urls.length > 0 && (
                  <div className="flex gap-3 flex-wrap ml-2">
                    {ev.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img src={url} alt="Evidence photo" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
