'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import { algodClient } from '@/lib/algorand'
import algosdk from 'algosdk'

interface RaiseDisputeProps {
  dealId: string
  appId: number
  buyerWallet: string
  onSuccess: () => void
}

export function RaiseDispute({ dealId, appId, buyerWallet, onSuccess }: RaiseDisputeProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { activeAddress, signTransactions } = useWallet()

  async function handleDispute() {
    setError('')
    setLoading(true)
    try {
      if (!activeAddress) {
        throw new Error('Please connect your Wallet first.')
      }

      const buyerAddr = activeAddress

      if (buyerAddr !== buyerWallet) {
        throw new Error('Connected wallet does not match buyer wallet for this deal.')
      }

      const params = await algodClient.getTransactionParams().do()
      const disputeTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: buyerAddr,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [new TextEncoder().encode('dispute')],
        suggestedParams: params,
      })

      const signedTxns = await signTransactions([disputeTxn])
      const validTxns = signedTxns.filter((tx): tx is Uint8Array => tx !== null)

      if (validTxns.length === 0) {
        throw new Error('Transaction signing was cancelled or returned empty.');
      }

      const { txid } = await algodClient.sendRawTransaction(validTxns).do()
      await algosdk.waitForConfirmation(algodClient, txid, 4)

      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISPUTED' }),
      })

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-3 rounded-xl font-semibold text-sm text-red-600 border border-red-200 bg-white transition-all hover:bg-red-50"
      >
        <AlertTriangle className="w-4 h-4 inline mr-2" />
        Raise a dispute
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-5 rounded-2xl bg-red-50 border border-red-100"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-900 mb-1">Open a dispute</p>
          <p className="text-xs text-red-700/80 leading-relaxed font-medium">
            This will freeze the USDC in the contract. Both parties will need to submit evidence within 48 hours.
            An arbitrator will review and decide the split.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-red-100/50 transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-red-600 w-4 h-4"
        />
        <span className="text-xs text-red-900 font-medium">
          I understand this is serious and cannot be undone. I have a genuine issue with the goods received.
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-700 bg-white border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => setShowConfirm(false)}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleDispute}
          disabled={loading || !confirmed}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing...' : 'Raise dispute'}
        </button>
      </div>
    </motion.div>
  )
}
