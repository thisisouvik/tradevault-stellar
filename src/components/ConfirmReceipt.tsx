'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api'
import { Horizon, Asset, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk'

interface ConfirmReceiptProps {
  dealId: string
  appId: string
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
  void appId
  void buyerWallet

  async function handleConfirm() {
    if (!confirmed) return
    setError('')
    setLoading(true)

    try {
      if (!(await isAllowed())) await setAllowed()
      const { address } = await getAddress()
      if (!address) throw new Error('Could not get Freighter address. Please unlock your wallet.')  

      if (!sellerWallet) {
        throw new Error('Seller wallet address is missing. Cannot release funds.')
      }

      const server = new Horizon.Server("https://horizon-testnet.stellar.org")
      const userAccount = await server.loadAccount(address)

      // Find USDC balance to correctly identify the testnet issuer
      const usdcBalance = userAccount.balances.find((b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC') as any
      if (!usdcBalance || Number(usdcBalance.balance) < amountUSDC) {
        throw new Error(`Insufficient USDC balance to release funds.`)
      }

      const usdcAsset = new Asset('USDC', usdcBalance.asset_issuer)

      // We explicitly transfer the funds to the Seller's Wallet directly from the smart contract/buyer
      const txPayment = new TransactionBuilder(userAccount, {
        fee: "10000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.payment({
          destination: sellerWallet,
          asset: usdcAsset,
          amount: amountUSDC.toString(),
        }))
        .setTimeout(30)
        .build();

      const signedResponse = await signTransaction(txPayment.toXDR(), {
        networkPassphrase: Networks.TESTNET
      })

      const finalXdr = typeof signedResponse === "string" ? signedResponse : (signedResponse as any).signedTxXdr || (signedResponse as any).signedTransaction   
      if (!finalXdr) throw new Error("Signature failed or was cancelled")

      const signedTx = TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET)

      // Submit to Stellar
      const submitted = await server.submitTransaction(signedTx as any)
      const txHash = submitted.hash
      const status = 'COMPLETED'
      const chainNetwork = 'stellar'
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
        throw new Error(updateData?.error || 'Failed to persist completed status after chain confirmation.')
      }

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
            <a href={`https://stellar.expert/explorer/testnet/tx/${txId}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1 mt-3 bg-white border border-green-200 w-fit px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer">
              View on Stellar Explorer <ExternalLink className="w-3.5 h-3.5" />
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
        {loading ? 'Processing via Stellar...' : `✓ Confirm Receipt & Release $${amountUSDC} USDC`}
      </motion.button>
    </div>
  )
}
