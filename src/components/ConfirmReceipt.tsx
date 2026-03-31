'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api'
import { Horizon, rpc, Address, xdr, nativeToScVal, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk'

interface ConfirmReceiptProps {
  dealId: string
  amountUSDC: number
  sellerWallet: string
  onChainDealId?: number | null
  onSuccess: () => void
}

export function ConfirmReceipt({ dealId, amountUSDC, sellerWallet, onChainDealId, onSuccess }: ConfirmReceiptProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [txId, setTxId] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  async function handleConfirm() {
    if (!confirmed) return
    setError('')
    setLoading(true)

    try {
      if (!(await isAllowed())) await setAllowed()
      
      const publicKeyObj = await getAddress()
      const address = typeof publicKeyObj === 'string' ? publicKeyObj : (publicKeyObj as any).address        

      if (!address) throw new Error('Could not get Freighter address. Please unlock your wallet.')  

      if (!sellerWallet) {
        throw new Error('Seller wallet address is missing. Cannot release funds.')
      }

      const sorobanServer = new rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org")
      const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org")
      const userAccount = await server.loadAccount(address)

      const contractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID
      if (!contractId) {
        throw new Error('NEXT_PUBLIC_STELLAR_CONTRACT_ID is not configured')
      }
      if (!onChainDealId) {
        throw new Error('Missing on-chain deal id for this escrow')
      }

      // Buyer calls confirm_package() to approve and release USDC to the seller
      const confirmPackageOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: 'confirm_package',
            args: [nativeToScVal(onChainDealId, { type: 'u32' })]
          })
        ),
        auth: []
      })

      let txPayment = new TransactionBuilder(userAccount, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(confirmPackageOp)
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
      if (submitted.status === "ERROR") {
         throw new Error("Transaction rejected by Soroban network")
      }
      
      // Polling for network confirmation
      let statusResponse = await sorobanServer.getTransaction(submitted.hash)
      while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
         await new Promise(r => setTimeout(r, 2000))
         statusResponse = await sorobanServer.getTransaction(submitted.hash)
      }
      if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          throw new Error('Transaction failed on-chain')
      }

      const txHash = submitted.hash
      setTxId(txHash)
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
