'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'

import { isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api'
import { Horizon, rpc, xdr, nativeToScVal, TransactionBuilder, Operation, Networks, Asset, Contract } from '@stellar/stellar-sdk'

interface FundEscrowProps {
  dealId: string
  amountUSDC: number
  sellerWallet: string
  buyerWallet?: string
  contractId?: string | null
  onChainDealId?: number | string | null
  onSuccess: () => void
}

export function FundEscrow({ dealId, amountUSDC, sellerWallet, buyerWallet, contractId, onChainDealId, onSuccess }: FundEscrowProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txId, setTxId] = useState('')
  const [done, setDone] = useState(false)
  const [preflightLoading, setPreflightLoading] = useState(true)
  const [preflightIssues, setPreflightIssues] = useState<string[]>([])
  const [matchedIssuer, setMatchedIssuer] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function runPreflight() {
      setPreflightLoading(true)
      setPreflightIssues([])
      setMatchedIssuer('')

      const issues: string[] = []

      try {
        const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org')

        if (!sellerWallet) {
          issues.push('Seller wallet is missing on this deal.')
        }
        if (!buyerWallet) {
          issues.push('Buyer wallet is missing on this deal.')
        }

        if (sellerWallet && buyerWallet) {
          const [sellerAccount, buyerAccount] = await Promise.all([
            server.loadAccount(sellerWallet),
            server.loadAccount(buyerWallet),
          ])

          const sellerUsdcIssuers = sellerAccount.balances
            .filter((b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer)
            .map((b: any) => b.asset_issuer as string)

          const buyerUsdcBalances = buyerAccount.balances.filter(
            (b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer
          ) as any[]

          if (sellerUsdcIssuers.length === 0) {
            issues.push('Seller wallet has no USDC trustline.')
          }

          if (buyerUsdcBalances.length === 0) {
            issues.push('Buyer wallet has no USDC trustline/balance.')
          }

          const match = buyerUsdcBalances.find(
            (b: any) => sellerUsdcIssuers.includes(b.asset_issuer) && Number(b.balance) >= amountUSDC
          )

          if (!match && sellerUsdcIssuers.length > 0 && buyerUsdcBalances.length > 0) {
            issues.push('Buyer does not hold enough USDC from the same issuer as seller/deal.')
          }

          if (match?.asset_issuer) {
            setMatchedIssuer(match.asset_issuer)
          }
        }
      } catch (e: any) {
        issues.push(e?.message || 'Unable to run escrow preflight checks.')
      } finally {
        if (!cancelled) {
          setPreflightIssues(issues)
          setPreflightLoading(false)
        }
      }
    }

    runPreflight()
    return () => {
      cancelled = true
    }
  }, [sellerWallet, buyerWallet, amountUSDC])

  const extractSignedXdr = (signedResponse: unknown): string => {
    if (typeof signedResponse === 'string') return signedResponse
    const maybeObj = signedResponse as any
    return maybeObj?.signedTxXdr || maybeObj?.signedTransaction || ''
  }

  async function handleFund() {
    setError('')
    setLoading(true)
    try {
      if (!(await isAllowed())) await setAllowed()
      
      const publicKeyObj = await getAddress()
      const address = typeof publicKeyObj === 'string' ? publicKeyObj : (publicKeyObj as any).address        

      if (!address) throw new Error('Could not get Freighter address. Please unlock your wallet.')
      if (buyerWallet && address !== buyerWallet) {
        throw new Error('Connected wallet does not match this deal buyer wallet. Switch Freighter account and retry.')
      }
      if (preflightIssues.length > 0) {
        throw new Error('Preflight checks failed. Fix the issuer/trustline issue shown below and retry.')
      }
      
      const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org")
      const sorobanServer = new rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org")
      const userAccount = await server.loadAccount(address)

      // Preflight: ensure buyer holds enough USDC and issuer is compatible with seller's USDC asset.
      const buyerUsdcBalances = userAccount.balances.filter(
        (b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer
      ) as any[]
      const buyerHasEnoughAnyUsdc = buyerUsdcBalances.some((b: any) => Number(b.balance) >= amountUSDC)
      if (!buyerHasEnoughAnyUsdc) {
        throw new Error(`Insufficient USDC balance. You need ${amountUSDC} USDC. Use the Dev Faucet!`)
      }

      const sellerAccount = await server.loadAccount(sellerWallet)
      const sellerUsdcIssuers = sellerAccount.balances
        .filter((b: any) => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer)
        .map((b: any) => b.asset_issuer as string)

      if (sellerUsdcIssuers.length === 0) {
        throw new Error('Seller wallet has no USDC trustline. Deal token cannot be verified.')
      }

      const buyerHasMatchingIssuerBalance = buyerUsdcBalances.some(
        (b: any) => sellerUsdcIssuers.includes(b.asset_issuer) && Number(b.balance) >= amountUSDC
      )

      if (!buyerHasMatchingIssuerBalance) {
        throw new Error(
          'USDC issuer mismatch: buyer does not hold enough USDC from the same issuer used by this deal. Mint/fund buyer wallet with the seller issuer USDC and retry.'
        )
      }

      const matchedBalance = buyerUsdcBalances.find(
        (b: any) => sellerUsdcIssuers.includes(b.asset_issuer) && Number(b.balance) >= amountUSDC
      ) as any
      const resolvedUsdcIssuer = matchedBalance?.asset_issuer as string | undefined

      const resolvedContractId = contractId || process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID
      if (!resolvedContractId) {
        throw new Error('Deal contract ID is missing. Cannot fund escrow.')
      }
      const rawOnChainDealId = typeof onChainDealId === 'string' ? onChainDealId.trim() : onChainDealId
      if (rawOnChainDealId === '' || rawOnChainDealId == null) {
        throw new Error('Missing on-chain deal id for this escrow.')
      }
      const normalizedOnChainDealId = Number(rawOnChainDealId)
      if (!Number.isInteger(normalizedOnChainDealId) || normalizedOnChainDealId <= 0) {
        throw new Error('Missing or invalid on-chain deal id for this escrow. This deal may be from an older schema; recreate the deal after running on_chain_deal_id migration.')
      }

      const runSingleOp = async (op: xdr.Operation) => {
        const freshAccount = await server.loadAccount(address)

        let tx = new TransactionBuilder(freshAccount, {
          fee: '100000',
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(op)
          .setTimeout(30)
          .build()

        const sim = await sorobanServer.simulateTransaction(tx)
        if (rpc.Api.isSimulationError(sim)) {
          const simError = String((sim as any).error || '')
          if (/Error\(Storage, MissingValue\)|non-existing value for contract instance/i.test(simError)) {
            throw new Error(
              'Deal token contract is missing or incompatible (likely issuer mismatch/expired token instance). Recreate the deal with the same fixed USDC issuer for both parties, then retry.'
            )
          }
          throw new Error('Simulation failed: ' + sim.error)
        }

        tx = rpc.assembleTransaction(tx, sim).build()
        const signedResponse = await signTransaction(tx.toXDR(), {
          networkPassphrase: Networks.TESTNET,
        })
        const finalXdr = extractSignedXdr(signedResponse)
        if (!finalXdr) throw new Error('Signature failed or was cancelled')

        const signedTx = TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET)
        const submitted = await sorobanServer.sendTransaction(signedTx)
        if (submitted.status === 'ERROR') {
          throw new Error('Transaction rejected by Soroban network')
        }

        let statusResponse = await sorobanServer.getTransaction(submitted.hash)
        while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
          await new Promise(r => setTimeout(r, 2000))
          statusResponse = await sorobanServer.getTransaction(submitted.hash)
        }
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          throw new Error('Transaction failed on-chain')
        }

        return submitted.hash
      }

      const ensureStellarAssetContract = async () => {
        if (!resolvedUsdcIssuer) return
        try {
          const asset = new Asset('USDC', resolvedUsdcIssuer)
          const createAssetContractOp = Operation.createStellarAssetContract({ asset })
          await runSingleOp(createAssetContractOp)
        } catch (err: any) {
          const msg = String(err?.message || '')
          // If already instantiated, we can safely continue.
          if (/already exists|duplicate|existing/i.test(msg)) return
          console.warn('Could not pre-create stellar asset contract:', msg)
        }
      }

      const contract = new Contract(resolvedContractId)
      const acceptOp = contract.call('accept_deal', nativeToScVal(normalizedOnChainDealId, { type: 'u32' }))

      // Buyer calls fund_deal() to lock USDC into the smart contract
      const fundOp = contract.call('fund_deal', nativeToScVal(normalizedOnChainDealId, { type: 'u32' }))

      let realTxHash = ''
      try {
        // Ensure the issuer's Stellar asset contract is available on-ledger.
        await ensureStellarAssetContract()

        // Fast path: if already accepted, fund directly.
        realTxHash = await runSingleOp(fundOp)
      } catch (fundErr: any) {
        const msg = String(fundErr?.message || '')

        if (/Deal token contract is missing or incompatible/i.test(msg)) {
          await ensureStellarAssetContract()
          realTxHash = await runSingleOp(fundOp)
        } else {
        const needsAcceptFirst = /invalid state transition|invalidaction/i.test(msg)
        if (!needsAcceptFirst) throw fundErr

        // Proposed -> Accepted -> Funded path.
        await runSingleOp(acceptOp)
        realTxHash = await runSingleOp(fundOp)
        }
      }

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
      <div className="rounded-xl p-4 border border-slate-200 bg-white">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">Escrow Preflight</p>
        {preflightLoading ? (
          <p className="text-sm text-slate-600 font-medium">Checking issuer/trustline compatibility...</p>
        ) : preflightIssues.length > 0 ? (
          <div className="space-y-1">
            {preflightIssues.map((issue, idx) => (
              <p key={`${issue}-${idx}`} className="text-sm text-red-700 font-semibold">• {issue}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-700 font-semibold break-all">
            Preflight passed. Matching issuer: {matchedIssuer}
          </p>
        )}
      </div>

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
        disabled={loading || preflightLoading || preflightIssues.length > 0}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-sm
          ${(loading || preflightLoading || preflightIssues.length > 0)
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
        ) : preflightLoading ? (
          <>Running preflight checks...</>
        ) : preflightIssues.length > 0 ? (
          <>Resolve preflight issues first</>
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
