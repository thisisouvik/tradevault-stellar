'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronRight, Calculator, FileText } from 'lucide-react'

interface ArbitratorFormProps {
  dealId: string
  amountUSDC: number
  sellerName: string
  buyerName: string
}

export function ArbitratorForm({ dealId, amountUSDC, sellerName, buyerName }: ArbitratorFormProps) {
  const router = useRouter()
  const [sellerPctStr, setSellerPctStr] = useState('50')
  const [buyerPctStr, setBuyerPctStr] = useState('50')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const sellerPct = parseInt(sellerPctStr) || 0
  const buyerPct = parseInt(buyerPctStr) || 0

  const isTotalValid = sellerPct + buyerPct === 100
  const isReasoningValid = notes.trim().length >= 20
  const canSubmit = isTotalValid && isReasoningValid

  function handleSellerChange(val: string) {
    setSellerPctStr(val)
    const p = parseInt(val)
    if (!isNaN(p) && p >= 0 && p <= 100) {
      setBuyerPctStr((100 - p).toString())
    }
  }

  function handleBuyerChange(val: string) {
    setBuyerPctStr(val)
    const p = parseInt(val)
    if (!isNaN(p) && p >= 0 && p <= 100) {
      setSellerPctStr((100 - p).toString())
    }
  }

  function applyPreset(s: number, b: number) {
    setSellerPctStr(s.toString())
    setBuyerPctStr(b.toString())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, sellerPct, buyerPct, notes }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit verdict. Ensure you are authorized.')

      setDone(true)
      setTimeout(() => router.refresh(), 2000)
    } catch (err: any) {
      setError(err?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 rounded-2xl p-8 border border-green-200 text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Verdict executed on Algorand.</h3>
        <p className="text-sm text-green-700/80 mb-6">The smart contract has distributed the funds according to your verdict.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#05445E]/5 rounded-full blur-3xl" />
      
      {/* Percentage Split inputs */}
      <div>
        <label className="flex items-center gap-2 text-sm font-extrabold text-[#05445E] mb-4">
          <Calculator className="w-4 h-4 text-[#189AB4]" />
          Split percentages
        </label>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#189AB4] mb-2 px-1">Seller receives (%)</label>
            <div className={`relative flex items-center bg-gray-50 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#189AB4]/50 transition-all ${sellerPct + buyerPct > 100 ? 'border-red-400' : 'border-gray-200'}`}>
              <div className="bg-[#189AB4]/10 w-12 h-12 flex items-center justify-center font-black text-[#189AB4]">%</div>
              <input
                type="number"
                min="0"
                max="100"
                value={sellerPctStr}
                onChange={e => handleSellerChange(e.target.value)}
                className="w-full h-12 px-4 bg-transparent outline-none font-bold text-gray-900 text-lg"
              />
            </div>
            {!isTotalValid && sellerPct + buyerPct > 100 && <p className="text-xs text-red-500 mt-2 font-medium">Total exceeds 100%</p>}
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#05445E] mb-2 px-1">Buyer receives (%)</label>
            <div className={`relative flex items-center bg-gray-50 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#05445E]/50 transition-all ${sellerPct + buyerPct > 100 ? 'border-red-400' : 'border-gray-200'}`}>
              <div className="bg-[#05445E]/10 w-12 h-12 flex items-center justify-center font-black text-[#05445E]">%</div>
              <input
                type="number"
                min="0"
                max="100"
                value={buyerPctStr}
                onChange={e => handleBuyerChange(e.target.value)}
                className="w-full h-12 px-4 bg-transparent outline-none font-bold text-gray-900 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Calculated amounts preview visually */}
        {isTotalValid && (
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-100 p-2 mb-6">
            <div className="flex-1 text-center py-2 px-4 rounded-lg bg-green-50 border border-green-100">
              <p className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Seller payout</p>
              <p className="text-xl font-black text-green-700">${Math.floor(amountUSDC * sellerPct / 100)} USDC</p>
            </div>
            <div className="flex-1 text-center py-2 px-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Buyer payout</p>
              <p className="text-xl font-black text-blue-700">${Math.floor(amountUSDC * buyerPct / 100)} USDC</p>
            </div>
          </div>
        )}

        {/* Common Verdict Presets */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => applyPreset(100, 0)} className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Full payment to seller (100% / 0%)
          </button>
          <button type="button" onClick={() => applyPreset(0, 100)} className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Full refund to buyer (0% / 100%)
          </button>
          <button type="button" onClick={() => applyPreset(50, 50)} className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Split evenly (50% / 50%)
          </button>
        </div>
      </div>

      {/* Arbitrator Notes */}
      <div>
        <label className="flex items-center gap-2 text-sm font-extrabold text-[#05445E] mb-2">
          <FileText className="w-4 h-4 text-[#189AB4]" />
          Reasoning (required &mdash; shown to both parties)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Explain the basis for your verdict. Both the seller and buyer will receive this explanation..."
          rows={4}
          className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#189AB4]/30 focus:border-[#189AB4] transition-all resize-none shadow-inner"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Minimum 20 characters required.</p>
          <span className={`text-xs font-bold ${isReasoningValid ? 'text-green-500' : 'text-orange-500'}`}>
            {notes.length} / 20 chars
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {/* Preview Card */}
      {isTotalValid && isReasoningValid && (
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#189AB4]/20 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 border-b border-white/10 pb-2">Verdict Execution Preview</h4>
          
          <div className="space-y-2 mb-6 font-mono text-sm relative z-10">
            <div className="flex justify-between">
              <span className="text-gray-300">Seller ({sellerName.split(' ')[0]}) receives :</span>
              <span className="font-bold text-[#189AB4]">
                ${Math.floor(amountUSDC * sellerPct / 100)} USDC <span className="text-gray-500 text-xs">({sellerPct}%)</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Buyer ({buyerName.split(' ')[0]}) receives :</span>
              <span className="font-bold text-[#4ade80]">
                ${Math.floor(amountUSDC * buyerPct / 100)} USDC <span className="text-gray-500 text-xs">({buyerPct}%)</span>
              </span>
            </div>
          </div>
          
          <div className="mb-6 relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Reasoning to be sent:</span>
            <p className="text-xs italic text-gray-300 pl-3 border-l-2 border-[#189AB4]/50 leading-relaxed max-w-xl">
              "{notes}"
            </p>
          </div>

          <p className="text-[10px] font-bold text-orange-400 tracking-wide uppercase flex items-center gap-1.5 relative z-10">
            <AlertCircle className="w-3 h-3" />
            This will execute immediately on Algorand and cannot be undone.
          </p>

          <motion.button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            whileHover={{ scale: (loading || !canSubmit) ? 1 : 1.02 }}
            whileTap={{ scale: (loading || !canSubmit) ? 1 : 0.98 }}
            className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 font-black transition-all text-sm uppercase tracking-widest
              ${(loading || !canSubmit)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-white text-slate-900 border border-white hover:bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full" />
                Executing on-chain...
              </span>
            ) : (
              <>Confirm and Submit Verdict <ChevronRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </div>
      )}

      {/* Fallback button if preview isn't visible */}
      {(!isTotalValid || !isReasoningValid) && (
        <button
          disabled
          className="w-full py-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 font-bold text-sm flex items-center justify-center cursor-not-allowed uppercase tracking-widest shadow-sm"
        >
          {(!isTotalValid) ? 'Percentages must total 100%' : 'Reasoning needed to submit'}
        </button>
      )}

    </form>
  )
}
