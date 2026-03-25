'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink, Shield, Package, User, FileText, CheckCircle2, Scale, ImageIcon } from 'lucide-react'
import { ArbitratorForm } from '@/components/ArbitratorForm'

interface ArbitratorReviewProps {
  deal: any
  seller: any        // may be null if profile deleted/missing
  evidence: any[]
  arbitration: any
  appId: number
}

// Simple lightbox for full-size photos
function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.img
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        src={url}
        alt="Evidence Full Size"
        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl bg-white border border-slate-200"
      />
    </div>
  )
}

// ─── Evidence column (reusable for both sides) ────────────────────────────────
function EvidenceColumn({
  role,
  label,
  sublabel,
  accentColor,
  bgColor,
  borderColor,
  icon,
  items,
  onPhotoClick,
}: {
  role: string
  label: string
  sublabel: string
  accentColor: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  items: any[]
  onPhotoClick: (url: string) => void
}) {
  return (
    <div className="md:px-6 first:md:pl-0 last:md:pr-0 py-4 md:py-0">
      {/* Column header */}
      <div
        className="flex items-center gap-3 mb-6 p-3 rounded-xl border"
        style={{ background: bgColor, borderColor }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{ background: bgColor, borderColor, color: accentColor }}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-black text-gray-900">{label}</h4>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{sublabel}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            No evidence submitted by the {role}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((ev: any) => (
            <div key={ev.id} className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                  &ldquo;{ev.description}&rdquo;
                </p>
              </div>
              {ev.photo_urls?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
                    Attached Photos ({ev.photo_urls.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {ev.photo_urls.map((url: string, i: number) => (
                      <div
                        key={i}
                        className="aspect-square relative group cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 shadow-sm"
                        onClick={() => onPhotoClick(url)}
                      >
                        <img
                          src={url}
                          alt={`${role} evidence ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 font-medium">
                Submitted {new Date(ev.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ArbitratorReviewClient({
  deal,
  seller,
  evidence,
  arbitration,
  appId,
}: ArbitratorReviewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Null-safe seller values
  const sellerName         = seller?.name         || 'Unknown Seller'
  const sellerWallet       = seller?.wallet_address || null
  const sellerWalletShort  = sellerWallet
    ? `${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}`
    : 'N/A'
  const buyerNameShort     = deal.buyer_email?.split('@')[0] || 'Unknown Buyer'
  const buyerWalletShort   = deal.buyer_wallet
    ? `${deal.buyer_wallet.slice(0, 6)}...${deal.buyer_wallet.slice(-4)}`
    : 'N/A'

  const sellerEvidence = evidence.filter((e) => e.submitted_by === 'seller')
  const buyerEvidence  = evidence.filter((e) => e.submitted_by === 'buyer')

  // Inject initial delivery evidence if the seller provided photos when shipping
  if (deal.evidence_urls && deal.evidence_urls.length > 0) {
    sellerEvidence.unshift({
      id: 'delivery-proof',
      submitted_by: 'seller',
      description: 'Initial Shipping Proof (Package Photos / Labels)',
      photo_urls: deal.evidence_urls,
      created_at: deal.delivered_at || deal.updated_at || deal.created_at,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <Link
          href="/arbitrator"
          className="flex items-center gap-2 text-gray-500 hover:text-[#05445E] transition-colors text-sm font-bold bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#189AB4]/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Dispute Queue
        </Link>

        <Link href="/" className="flex items-center gap-2 relative z-10 transition-transform hover:scale-105 active:scale-95">
          <img src="/logo.png" alt="TradeVault" className="w-8 h-8 object-contain" />
          <span className="text-[#05445E] font-extrabold text-xl tracking-wide hidden sm:block">TradeVault</span>
        </Link>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
          <Scale className="w-3.5 h-3.5" />
          Arbitrator Terminal
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Alert Banner */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-red-500 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 border border-red-200">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 mb-1">Contract Dispute: {deal.item_name}</h1>
              <p className="text-sm font-bold text-gray-400 font-mono tracking-tight">ID: {deal.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-8 self-end md:self-auto">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Frozen Funds</p>
              <p className="text-2xl font-black text-rose-600">${deal.amount_usdc} USDC</p>
            </div>
            {appId > 0 && (
              <a
                href={`https://lora.algokit.io/testnet/application/${appId}`}
                target="_blank" rel="noopener noreferrer"
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-colors border border-blue-100 shadow-sm whitespace-nowrap"
              >
                Verify on Algorand <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Contract Terms + Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Immutable Contract Terms */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-fit">
            <h3 className="text-sm font-extrabold text-[#05445E] mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText className="w-4 h-4 text-[#189AB4]" /> Immutable Contract Terms
            </h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Seller</span>
                <span className="font-bold text-gray-900">
                  {sellerName}{' '}
                  <span className="text-gray-400 font-mono text-[10px]">({sellerWalletShort})</span>
                </span>
              </li>
              <li className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Buyer</span>
                <span className="font-bold text-gray-900">
                  {deal.buyer_email}{' '}
                  <span className="text-gray-400 font-mono text-[10px]">({buyerWalletShort})</span>
                </span>
              </li>
              <li className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Item</span>
                <span className="font-bold text-gray-900 text-right">{deal.item_name}</span>
              </li>
              <li className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Escrow Total</span>
                <span className="font-bold text-rose-600">${deal.amount_usdc} USDC</span>
              </li>
              <li className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Delivery Deadline</span>
                <span className="font-bold text-gray-900">{deal.delivery_days} days</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Dispute Window</span>
                <span className="font-bold text-gray-900">{deal.dispute_window_days} days</span>
              </li>
            </ul>
            <div className="mt-6 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium italic">
              &ldquo;These terms were cryptographically signed by both parties. They strictly govern this dispute.&rdquo;
            </div>
          </section>

          {/* Shipping Evidence */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-fit">
            <h3 className="text-sm font-extrabold text-[#05445E] mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package className="w-4 h-4 text-[#189AB4]" /> On-Chain Shipping Evidence
            </h3>
            {deal.tracking_id ? (
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Courier</span>
                  <span className="font-bold text-gray-900">{deal.courier || 'Private Courier'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Tracking Number</span>
                  <span className="font-mono text-gray-900 bg-gray-100 px-2 rounded font-bold text-right">{deal.tracking_id}</span>
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <span className="text-gray-500">SHA256 Hash (on Algorand)</span>
                  <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded break-all">{deal.tracking_hash || '—'}</span>
                </div>
                <div className="mt-4 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium italic">
                  &ldquo;The tracking hash is permanently stored on Algorand. It cannot be altered retroactively.&rdquo;
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-xl">
                Seller has not submitted a tracking number for this deal.
              </p>
            )}
          </section>
        </div>

        {/* ── EVIDENCE PANEL — always visible so arbitrator sees both sides ── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-base font-extrabold text-[#05445E] mb-2 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Scale className="w-5 h-5 text-[#189AB4]" /> Claims &amp; Evidence — Both Sides
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-6">
            Both the seller and buyer can upload photos and written statements. Review all evidence from both parties before submitting a verdict.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">

            {/* Seller Side */}
            <EvidenceColumn
              role="seller"
              label={`Seller — ${sellerName}`}
              sublabel={`${sellerEvidence.length} submission${sellerEvidence.length !== 1 ? 's' : ''}`}
              accentColor="#189AB4"
              bgColor="rgba(24,154,180,0.06)"
              borderColor="rgba(24,154,180,0.2)"
              icon={<Package className="w-5 h-5" />}
              items={sellerEvidence}
              onPhotoClick={setSelectedPhoto}
            />

            {/* Buyer Side */}
            <EvidenceColumn
              role="buyer"
              label={`Buyer — ${buyerNameShort}`}
              sublabel={`${buyerEvidence.length} submission${buyerEvidence.length !== 1 ? 's' : ''}`}
              accentColor="#F59E0B"
              bgColor="rgba(245,158,11,0.06)"
              borderColor="rgba(245,158,11,0.2)"
              icon={<User className="w-5 h-5" />}
              items={buyerEvidence}
              onPhotoClick={setSelectedPhoto}
            />
          </div>
        </section>

        {/* Verdict Form — only when not yet arbitrated */}
        {!arbitration && deal.status === 'DISPUTED' && (
          <section id="verdict-form">
            <ArbitratorForm
              dealId={deal.id}
              amountUSDC={deal.amount_usdc}
              sellerName={sellerName}
              buyerName={deal.buyer_email}
            />
          </section>
        )}

        {/* Post-Verdict Record — show when resolved */}
        {arbitration && (
          <section className="bg-green-50 rounded-2xl p-8 shadow-sm border border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-black text-green-900 tracking-tight">Verdict Finalized</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-green-100 shadow-sm mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Seller received</p>
                <div className="text-4xl font-black text-green-600 mb-1">
                  {arbitration.seller_pct}%{' '}
                  <span className="text-xl text-gray-400 font-bold">
                    (${Math.floor(deal.amount_usdc * arbitration.seller_pct / 100)} USDC)
                  </span>
                </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Buyer received</p>
                <div className="text-4xl font-black text-blue-600 mb-1">
                  {arbitration.buyer_pct}%{' '}
                  <span className="text-xl text-gray-400 font-bold">
                    (${Math.floor(deal.amount_usdc * arbitration.buyer_pct / 100)} USDC)
                  </span>
                </div>
              </div>
            </div>

            {arbitration.notes && (
              <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Arbitrator&apos;s reasoning</p>
                <p className="text-sm text-gray-700 italic font-medium leading-relaxed pl-3 border-l-2 border-green-400">
                  &ldquo;{arbitration.notes}&rdquo;
                </p>
              </div>
            )}

            <p className="text-xs text-green-700 mt-6 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> All evidence is permanently archived for audit.
            </p>
          </section>
        )}

      </main>

      <AnimatePresence>
        {selectedPhoto && <PhotoModal url={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      </AnimatePresence>
    </div>
  )
}
