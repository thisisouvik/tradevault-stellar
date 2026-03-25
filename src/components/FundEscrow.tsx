'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWallet } from '@txnlab/use-wallet-react'
import { algodClient, USDC_ASSET_ID } from '@/lib/algorand'
import algosdk from 'algosdk'

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
  const [balanceUSDC, setBalanceUSDC] = useState<number | null>(null)
  
  const supabase = createClient()
  const { activeAddress, signTransactions } = useWallet()

  useEffect(() => {
    if (activeAddress) {
      fetch(`https://testnet-api.algonode.cloud/v2/accounts/${activeAddress}`)
        .then(res => res.json())
        .then(data => {
          if (data.assets) {
            const usdcAsset = data.assets.find((a: any) => a['asset-id'] === 10458941)
            if (usdcAsset) {
              setBalanceUSDC(usdcAsset.amount / 1_000_000)
            } else {
              setBalanceUSDC(0)
            }
          } else {
            setBalanceUSDC(0)
          }
        })
        .catch(() => setBalanceUSDC(0))
    } else {
      setBalanceUSDC(null)
    }
  }, [activeAddress])

  const hasInsufficientBalance = balanceUSDC !== null && balanceUSDC < amountUSDC

  async function handleFund() {
    setError('')
    setLoading(true)
    try {
      if (!activeAddress) {
        throw new Error('Please connect your Wallet first.')
      }

      const buyerAddr = activeAddress

      if (buyerAddr !== buyerWallet) {
        throw new Error(`This deal is assigned to wallet ${buyerWallet.slice(0,8)}... — your connected wallet doesn't match.`)
      }

      const params = await algodClient.getTransactionParams().do()
      params.flatFee = true
      params.fee = BigInt(1000)

      // Fee pooling: first tx covers all 3 fees (3×1000 = 3000 microALGO total)
      // Other txns set to 0 — Algorand allows group fee to be paid by one tx
      const feeParams0 = { ...params, fee: BigInt(3000) } // covers all 3 txns
      const feeParams1 = { ...params, fee: BigInt(0) }
      const feeParams2 = { ...params, fee: BigInt(0) }

      // Transaction 1: accept() — PROPOSED → ACCEPTED (pays all fees)
      const acceptTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: buyerAddr,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [new TextEncoder().encode('accept')],
        suggestedParams: feeParams0,
      })

      // Transaction 2: fund() — ACCEPTED → FUNDED (fee = 0, covered by tx1)
      const fundCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: buyerAddr,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [new TextEncoder().encode('fund')],
        suggestedParams: feeParams1,
      })

      // Transaction 3: USDC transfer (fee = 0, covered by tx1)
      const usdcTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: buyerAddr,
        receiver: appAddress,
        amount: amountUSDC * 1_000_000,
        assetIndex: USDC_ASSET_ID,
        suggestedParams: feeParams2,
      })

      // Group atomically — all 3 succeed or none do
      algosdk.assignGroupID([acceptTxn, fundCallTxn, usdcTransferTxn])

      // Sign via wallet — pass Transaction objects so Pera shows the human-readable popup
      const signedTxns = await signTransactions([acceptTxn, fundCallTxn, usdcTransferTxn])
      const validTxns = signedTxns.filter((tx): tx is Uint8Array => tx !== null)

      const sendRes = await algodClient.sendRawTransaction(validTxns).do()
      setTxId(sendRes.txid)

      await algosdk.waitForConfirmation(algodClient, sendRes.txid, 4)

      // Update DB status
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FUNDED' }),
      })

      setDone(true)
      setTimeout(() => onSuccess(), 1500)
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || 'Transaction failed'
      // Translate low-level Algorand errors into user-friendly messages
      if (msg.includes('underflow on subtracting')) {
        setError('Insufficient USDC balance to cover this transaction.')
      } else if (msg.includes('below min')) {
        setError('Insufficient ALGO balance to cover transaction fees. You need at least 0.01 ALGO.')
      } else if (msg.includes('must optin') || msg.includes('asset') && msg.includes('missing')) {
        setError('The escrow contract is not activated yet. Please ask the seller to re-create this deal so it can be bootstrapped correctly.')
      } else if (msg.includes('Only buyer can accept')) {
        setError('Your connected wallet does not match the buyer address on this deal.')
      } else if (msg.includes('rejected')) {
        setError('Transaction was rejected in your wallet.')
      } else {
        setError(msg)
      }
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
            <a href={`https://lora.algokit.io/testnet/transaction/${txId}`} target="_blank" rel="noopener noreferrer"
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
          Clicking below will request <strong className="text-blue-900">three atomic transactions</strong> in your wallet:
          your cryptographic acceptance, a deal lock confirmation, and the{' '}
          <strong className="text-blue-900">${amountUSDC.toLocaleString()} USDC transfer</strong> to the escrow smart contract.
          All three succeed together or none do — your funds are 100% protected.
        </p>
      </div>

      {/* Balance Indicator */}
      {balanceUSDC !== null && (
        <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium">Your current USDC balance:</span>
          </div>
          <span className={`text-sm font-bold ${hasInsufficientBalance ? 'text-red-500' : 'text-slate-900'}`}>
            ${balanceUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Error / Warnings */}
      <AnimatePresence>
        {hasInsufficientBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 p-4 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <p>Insufficient USDC balance. You need ${amountUSDC.toLocaleString()} USDC to fund this deal. Please top up your wallet before proceeding.</p>
          </motion.div>
        )}

        {error && !hasInsufficientBalance && (
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
        disabled={loading || hasInsufficientBalance || !activeAddress}
        whileHover={{ scale: (loading || hasInsufficientBalance || !activeAddress) ? 1 : 1.01 }}
        whileTap={{ scale: (loading || hasInsufficientBalance || !activeAddress) ? 1 : 0.99 }}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-sm
          ${(loading || hasInsufficientBalance || !activeAddress) 
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
            Waiting for confirmation...
          </>
        ) : !activeAddress ? (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet to Fund
          </>
        ) : (
          <>
            Accept, Lock &amp; Fund ${amountUSDC.toLocaleString()} USDC
            <Zap className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  )
}
