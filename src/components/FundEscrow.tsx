'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'

import { isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api'
import { Horizon, rpc, Address, xdr, nativeToScVal, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk'

interface FundEscrowProps {
  dealId: string
  amountUSDC: number
  sellerWallet: string
  onChainDealId?: number | null
  onSuccess: () => void
}

export function FundEscrow({ dealId, amountUSDC, sellerWallet, onChainDealId, onSuccess }: FundEscrowProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txId, setTxId] = useState('')
  const [done, setDone] = useState(false)

  async function handleFund() {
    setError('')
    setLoading(true)
    try {
      if (!(await isAllowed())) await setAllowed()
      
      const publicKeyObj = await getAddress()
      const address = typeof publicKeyObj === 'string' ? publicKeyObj : (publicKeyObj as any).address        

      if (!address) throw new Error('Could not get Freighter address. Please unlock your wallet.')
      
      const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org")
      const sorobanServer = new rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org")
      const userAccount = await server.loadAccount(address)

      // Find USDC balance to correctly identify the testnet issuer 
      const usdcBalance = userAccount.balances.find((b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC') as any
      if (!usdcBalance || Number(usdcBalance.balance) < amountUSDC) {
        throw new Error(`Insufficient USDC balance. You need ${amountUSDC} USDC. Use the Dev Faucet!`)
      }

      const contractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID
      if (!contractId) {
        throw new Error('NEXT_PUBLIC_STELLAR_CONTRACT_ID is not configured')
      }
      if (!onChainDealId) {
        throw new Error('Missing on-chain deal id for this escrow')
      }
      const acceptOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: 'accept_deal',
            args: [nativeToScVal(onChainDealId, { type: 'u32' })]
          })
        ),
        auth: []
      })

      // Buyer calls fund_deal() to lock USDC into the smart contract
      const fundOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: 'fund_deal',
            args: [nativeToScVal(onChainDealId, { type: 'u32' })]
          })
        ),
        auth: []
      })

      let txPayment = new TransactionBuilder(userAccount, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(acceptOp)
        .addOperation(fundOp)
        .setTimeout(30)
        .build();

      let sim = await sorobanServer.simulateTransaction(txPayment);
      if (rpc.Api.isSimulationError(sim)) {
          console.warn("Accept+Fund simulation failed, trying just Fund if already accepted", sim.error);
          txPayment = new TransactionBuilder(userAccount, {
            fee: "100000",
            networkPassphrase: Networks.TESTNET,
          }).addOperation(fundOp).setTimeout(30).build();
          
          sim = await sorobanServer.simulateTransaction(txPayment);
          if (rpc.Api.isSimulationError(sim)) {
              throw new Error("Simulation failed: " + sim.error);
          }
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

      const realTxHash = submitted.hash

      setTxId(realTxHash)

      // Update DB status with the verified hash
      const updateRes = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FUNDED',
          txHash: realTxHash,
          chainNetwork: 'stellar',
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
      let msg = err?.message || 'Transaction failed'
      // Extract inner Horizon errors if available
      if (err?.response?.data?.extras?.result_codes?.operations) {
        msg += " (" + err.response.data.extras.result_codes.operations.join(", ") + ")"
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setError('')
    setLoading(true)
    try {
      const updateRes = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!updateRes.ok) {
        const updateData = await updateRes.json().catch(() => ({}))
        throw new Error(updateData?.error || 'Failed to cancel the contract.')
      }

      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Cancellation failed')
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
            Processing...
          </>
        ) : (
          <>
            Fund ${amountUSDC.toLocaleString()} USDC on Stellar
            <Zap className="w-4 h-4" />
          </>
        )}
      </motion.button>
      
      {!loading && (
        <button
          onClick={handleReject}
          className="w-full text-center text-sm font-bold text-slate-500 hover:text-red-500 transition-colors mt-2"
        >
          Reject Contract
        </button>
      )}
    </div>
  )
}
