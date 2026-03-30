import { createHash } from 'crypto'
import { Horizon, rpc, Address, nativeToScVal, xdr, TransactionBuilder, Operation, Networks, Keypair } from '@stellar/stellar-sdk'

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
  
  const account = await server.loadAccount(platformKeypair.publicKey())

  let xdrArgs: xdr.ScVal[] = []

  if (method === 'resolve_dispute') {
    const [sellerPct, buyerPct] = args
    xdrArgs = [
      nativeToScVal(Number(sellerPct), { type: 'u32' }),
      nativeToScVal(Number(buyerPct), { type: 'u32' }),
    ]
  } else if (method === 'submit_delivery' || method === 'raise_dispute') {
    const [hashHex] = args
    const normalized = String(hashHex || '').trim().toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(normalized)) {
      throw new Error(`Invalid hash argument for ${method}; expected SHA256 hex string`)
    }
    const hashBytes = Buffer.from(normalized, 'hex')
    xdrArgs = [xdr.ScVal.scvBytes(hashBytes)]
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

  const sim = await sorobanServer.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ` + sim.error)
  }

  tx = rpc.assembleTransaction(tx, sim).build()
  tx.sign(platformKeypair)

  const submitted = await sorobanServer.sendTransaction(tx)
  if (submitted.status === "ERROR") throw new Error("Transaction rejected by network");

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

export async function verifyStellarRuntime(): Promise<{ ok: boolean; message: string }> {
  if (!STELLAR_RPC_URL) return { ok: false, message: 'STELLAR_RPC_URL defaults used' }
  if (!STELLAR_CONTRACT_ID) return { ok: false, message: 'STELLAR_CONTRACT_ID is not set' }
  if (!process.env.STELLAR_PLATFORM_SECRET) return { ok: false, message: 'STELLAR_PLATFORM_SECRET is not set' }
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
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, outcome, value, dealId, ts: Math.floor(Date.now() / 1000) }),
    })
  } catch {
    // Silently fail if webhook is unreachable
  }
}
