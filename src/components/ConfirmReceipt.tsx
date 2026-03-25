'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import { algodClient, USDC_ASSET_ID } from '@/lib/algorand'
import algosdk from 'algosdk'

interface ConfirmReceiptProps {
  dealId: string
  appId: number
  amountUSDC: number
  buyerWallet: string
  sellerWallet: string
  onSuccess: () => void
}

export function ConfirmReceipt({ dealId, appId, amountUSDC, buyerWallet, sellerWallet, onSuccess }: ConfirmReceiptProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [txId, setTxId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const { activeAddress, signTransactions } = useWallet()

  async function handleConfirm() {
    if (!confirmed) return
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

      // --- Read the seller address directly from the Algorand contract global state ---
      // This bypasses any database/RLS issues. The contract always has the seller stored.
      let resolvedSellerWallet = sellerWallet
      if (!resolvedSellerWallet) {
        const appInfo = await algodClient.getApplicationByID(appId).do()
        const globalState = appInfo.params.globalState as unknown as Array<{
          key: Uint8Array
          value: { type: number; uint: number | bigint; bytes: Uint8Array }
        }>
        for (const item of globalState) {
          const key = new TextDecoder().decode(item.key)
          if (key === 'seller') {
            resolvedSellerWallet = algosdk.encodeAddress(item.value.bytes)
            break
          }
        }
      }

      if (!resolvedSellerWallet) {
        throw new Error('Could not resolve seller address from contract. Please refresh and try again.')
      }

      const params = await algodClient.getTransactionParams().do()
      const confirmTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: buyerAddr,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [new TextEncoder().encode('confirm')],
        foreignAssets: [USDC_ASSET_ID],
        accounts: [resolvedSellerWallet],
        suggestedParams: {
          ...params,
          fee: 2000,
          flatFee: true,
        },
      })

      const signedTxns = await signTransactions([confirmTxn])
      const validTxns = signedTxns.filter((tx): tx is Uint8Array => tx !== null)
      
      if (validTxns.length === 0) {
        throw new Error('Transaction signing was cancelled or returned empty.');
      }
      
      const { txid } = await algodClient.sendRawTransaction(validTxns).do()
      setTxId(txid)
      await algosdk.waitForConfirmation(algodClient, txid, 4)

      // Update DB
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      setDone(true)
      setTimeout(() => onSuccess(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-4 p-5 rounded-xl bg-green-50 border border-green-200 shadow-sm">
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-base font-bold text-green-900">Payment Released Successfully!</p>
          <p className="text-sm font-medium text-green-700 mt-1">${amountUSDC} USDC has been securely transferred to the seller.</p>
          {txId && (
            <a href={`https://lora.algokit.io/testnet/transaction/${txId}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1 mt-3 bg-white border border-green-200 w-fit px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer">
              View on Algorand Explorer <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5 bg-green-50 border border-green-200 shadow-sm">
        <p className="text-sm text-green-800 font-medium leading-relaxed">
          Confirming receipt will trigger the smart contract to instantly release{' '}
          <strong className="text-green-900 font-black">${amountUSDC} USDC</strong> to the seller's wallet.
          This action is completely cryptographic and cannot be reversed.
        </p>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group p-3 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100">
        <div
          onClick={() => setConfirmed(!confirmed)}
          className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer shadow-sm ${confirmed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}
        >
          {confirmed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        <span className="text-sm font-medium text-slate-700">
          I legally confirm I have received the goods in the agreed condition and I authorize the release of the payment.
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200 shadow-sm mt-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          {error}
        </div>
      )}

      <motion.button
        onClick={handleConfirm}
        disabled={loading || !confirmed}
        whileHover={{ scale: loading || !confirmed ? 1 : 1.01 }}
        className="w-full py-4 mt-2 rounded-xl font-bold text-white text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
      >
        {loading ? 'Processing via Algorand...' : `✓ Confirm Receipt & Release $${amountUSDC} USDC`}
      </motion.button>
    </div>
  )
}
