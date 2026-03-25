'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'

interface FundEscrowProps {
  dealId: string
  appId: number
  appAddress: string
  amountUSDC: number
  buyerWallet: string
  onSuccess: () => void
}

export function FundEscrow({ dealId, appId, appAddress, amountUSDC, buyerWallet, onSuccess }: FundEscrowProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txId, setTxId] = useState('')
  const [done, setDone] = useState(false)
  const [_legacyContext] = useState({ appId, appAddress, buyerWallet })

  async function handleFund() {
    setError('')
    setLoading(true)
    try {
      const onchainRes = await fetch(`/api/deals/${dealId}/onchain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fund' }),
      })

      const onchainData = await onchainRes.json().catch(() => ({}))
      if (!onchainRes.ok) {
        throw new Error(onchainData?.error || 'Failed to execute fund action on Stellar')
      }

      const txHash = String(onchainData.txHash || '')
      const status = String(onchainData.status || 'FUNDED')
      const chainNetwork = String(onchainData.chainNetwork || 'stellar')
      setTxId(txHash)

      // Update DB status
      const updateRes = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          txHash,
          chainNetwork,
        }),
      })

      if (!updateRes.ok) {
        const updateData = await updateRes.json().catch(() => ({}))
        throw new Error(updateData?.error || 'Failed to persist funded status after chain confirmation.')
      }

      setDone(true)
      setTimeout(() => onSuccess(), 1500)
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || 'Transaction failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-green-900">Escrow funded! ${amountUSDC.toLocaleString()} USDC locked in contract.</p>
          {txId && (
            <a href={`https://stellar.expert/explorer/testnet/tx/${txId}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1 mt-1 font-medium underline underline-offset-2">
              View transaction on explorer <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Informational Box */}
      <div className="rounded-xl p-5 bg-blue-50/50 border border-blue-100">
        <p className="text-sm text-blue-800 font-medium">
          Clicking below submits a Stellar Soroban escrow funding action and records a verified on-chain transaction proof.
        </p>
      </div>

      {/* Error / Warnings */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 p-4 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <p className="break-words w-full">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleFund}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-sm
          ${loading 
            ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
          }
        `}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
            />
            Processing on Stellar...
          </>
        ) : (
          <>
            Fund ${amountUSDC.toLocaleString()} USDC on Stellar
            <Zap className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  )
}
