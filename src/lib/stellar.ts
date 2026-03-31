import { createHash } from 'crypto'
import { Horizon, rpc, Address, nativeToScVal, xdr, TransactionBuilder, Operation, Networks, Keypair } from '@stellar/stellar-sdk'
import { validateEnv, SERVER_ENV } from '@/lib/env'
import { withRetry, fetchWithRetry } from '@/lib/retry'
import { logServerError } from '@/lib/telemetry'

export const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
export const STELLAR_CONTRACT_ID = process.env.STELLAR_CONTRACT_ID || ''

function getConfiguredContractId(contractId?: string): string {
  const resolved = contractId || STELLAR_CONTRACT_ID
  if (!resolved) {
    throw new Error('Missing STELLAR_CONTRACT_ID and contractId argument')
  }
  return resolved
}

function hasServerSigner(): boolean {
  return Boolean(process.env.STELLAR_PLATFORM_SECRET)
}

export async function sha256(text: string): Promise<string> {
  return createHash('sha256').update(text).digest('hex')
}

export async function callContractMethod(
  method: string,
  args: any[] = [],
  contractId?: string
): Promise<string> {
  const resolvedContractId = getConfiguredContractId(contractId)

  if (!hasServerSigner()) {
    throw new Error('STELLAR_PLATFORM_SECRET is not configured')
  }

  const platformKeypair = Keypair.fromSecret(process.env.STELLAR_PLATFORM_SECRET!)
  const sorobanServer = new rpc.Server(STELLAR_RPC_URL)
  const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org")
  
  const account = await withRetry(
    () => server.loadAccount(platformKeypair.publicKey()),
    { retries: 3, baseDelayMs: 300 }
  )

  let xdrArgs: xdr.ScVal[] = []

  if (method === 'accept_deal' || method === 'fund_deal' || method === 'confirm_package' || method === 'timeout_release') {
    const [dealId] = args
    if (!Number.isInteger(Number(dealId)) || Number(dealId) < 0) {
      throw new Error(`${method} requires a valid deal id`)
    }
    xdrArgs = [nativeToScVal(Number(dealId), { type: 'u32' })]
  } else if (method === 'resolve_dispute') {
    const [dealId, sellerPct, buyerPct] = args
    if (!Number.isInteger(Number(dealId)) || Number(dealId) < 0) {
      throw new Error('resolve_dispute requires a valid deal id')
    }
    xdrArgs = [
      nativeToScVal(Number(dealId), { type: 'u32' }),
      nativeToScVal(Number(sellerPct), { type: 'u32' }),
      nativeToScVal(Number(buyerPct), { type: 'u32' }),
    ]
  } else if (method === 'submit_delivery' || method === 'raise_dispute') {
    const [dealId, hashHex] = args
    if (!Number.isInteger(Number(dealId)) || Number(dealId) < 0) {
      throw new Error(`${method} requires a valid deal id`)
    }
    const normalized = String(hashHex || '').trim().toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(normalized)) {
      throw new Error(`Invalid hash argument for ${method}; expected SHA256 hex string`)
    }
    const hashBytes = Buffer.from(normalized, 'hex')
    xdrArgs = [nativeToScVal(Number(dealId), { type: 'u32' }), xdr.ScVal.scvBytes(hashBytes)]
  }

  const op = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(resolvedContractId).toScAddress(),
        functionName: method,
        args: xdrArgs
      })
    ),
    auth: []
  })

  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(30)
    .build()

  const sim = await withRetry(
    () => sorobanServer.simulateTransaction(tx),
    { retries: 2, baseDelayMs: 400 }
  )
  if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ` + sim.error)
  }

  tx = rpc.assembleTransaction(tx, sim).build()
  tx.sign(platformKeypair)

  const submitted = await withRetry(
    () => sorobanServer.sendTransaction(tx),
    { retries: 2, baseDelayMs: 400 }
  )
  if (submitted.status === "ERROR") throw new Error("Transaction rejected by network");

  let statusResponse = await withRetry(
    () => sorobanServer.getTransaction(submitted.hash),
    { retries: 2, baseDelayMs: 300 }
  )
  while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
     await new Promise(r => setTimeout(r, 2000))
     statusResponse = await withRetry(
      () => sorobanServer.getTransaction(submitted.hash),
      { retries: 2, baseDelayMs: 300 }
    )
  }
  if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction failed on-chain')
  }

  return submitted.hash
}

export async function verifyStellarRuntime(): Promise<{ ok: boolean; message: string }> {
  const env = validateEnv(SERVER_ENV)
  if (!env.ok) {
    return { ok: false, message: `Missing env: ${env.missingRequired.join(', ')}` }
  }
  return { ok: true, message: 'Stellar runtime configured' }
}

export async function writeReputationNote(
  wallet: string,
  outcome: string,
  value: number,
  dealId: string
): Promise<void> {
  const webhook = process.env.STELLAR_REPUTATION_WEBHOOK_URL
  if (!webhook) return
  try {
    await fetchWithRetry(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, outcome, value, dealId, ts: Math.floor(Date.now() / 1000) }),
    }, { retries: 2, baseDelayMs: 300 })
  } catch (error) {
    // Silently fail if webhook is unreachable
    logServerError('stellar.reputation_note.failed', error, { dealId, wallet })
  }
}
