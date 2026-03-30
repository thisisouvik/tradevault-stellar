'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api'
import { Horizon, rpc, Address, nativeToScVal, xdr, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk'

interface RaiseDisputeProps {
  dealId: string
  onSuccess: () => void
}

export function RaiseDispute({ dealId, onSuccess }: RaiseDisputeProps) {        
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDispute() {
    setError('')
    setLoading(true)
    try {
      if (!(await isAllowed())) await setAllowed()
      
      const publicKeyObj = await getAddress()
      const address = typeof publicKeyObj === 'string' ? publicKeyObj : (publicKeyObj as any).address        

      if (!address) throw new Error('Could not get Freighter address. Please unlock your wallet.')  

      const sorobanServer = new rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org")
      const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org")
      const userAccount = await server.loadAccount(address)

      const contractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID
      if (!contractId) {
        throw new Error('NEXT_PUBLIC_STELLAR_CONTRACT_ID is not configured')
      }

      const reasonSeed = `${dealId}:${address}:${Date.now()}`
      const reasonDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(reasonSeed))
      const reasonHashBytes = new Uint8Array(reasonDigest)

      const disputeOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: 'raise_dispute',
            args: [nativeToScVal(reasonHashBytes, { type: 'bytes' })]
          })
        ),
        auth: []
      })

      let txPayment = new TransactionBuilder(userAccount, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(disputeOp)
        .setTimeout(30)
        .build();

      const sim = await sorobanServer.simulateTransaction(txPayment);
      if (rpc.Api.isSimulationError(sim)) {
          throw new Error("Simulation failed: " + sim.error);
      }
      
      txPayment = rpc.assembleTransaction(txPayment, sim).build()

      const signedResponse = await signTransaction(txPayment.toXDR(), {
        networkPassphrase: Networks.TESTNET
      })

      const finalXdr = typeof signedResponse === "string" ? signedResponse : (signedResponse as any).signedTxXdr || (signedResponse as any).signedTransaction   
      if (!finalXdr) throw new Error("Signature failed or was cancelled")

      const signedTx = TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET)

      const submitted = await sorobanServer.sendTransaction(signedTx)
      if (submitted.status === "ERROR") throw new Error("Transaction rejected by network");
      
      let statusResponse = await sorobanServer.getTransaction(submitted.hash)
      while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
         await new Promise(r => setTimeout(r, 2000))
         statusResponse = await sorobanServer.getTransaction(submitted.hash)
      }
      if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          throw new Error('Transaction failed on-chain')
      }

      const txHash = submitted.hash
      const status = 'DISPUTED'
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
        throw new Error(updateData?.error || 'Failed to persist disputed status after chain confirmation.')
      }

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
