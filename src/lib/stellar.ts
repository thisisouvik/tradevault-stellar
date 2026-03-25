import { createHash, randomUUID } from 'crypto'

export const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || ''
export const STELLAR_CONTRACT_ID = process.env.STELLAR_CONTRACT_ID || ''

interface RelayerInvokeResponse {
  txHash?: string
  txId?: string
  hash?: string
  error?: string
}

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

function getRelayerConfig() {
  return {
    url: process.env.STELLAR_RELAYER_URL || '',
    token: process.env.STELLAR_RELAYER_TOKEN || '',
  }
}

// Stable hash helper used for tracking/reason payloads.
export async function sha256(text: string): Promise<string> {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * Call a Soroban method through a relayer service.
 *
 * Why relayer: server-side Soroban tx simulation + assembly + signing is verbose and
 * depends on SDK/runtime setup. The relayer endpoint centralizes those steps so routes
 * only pass business-level method + args.
 */
export async function callContractMethod(
  method: string,
  args: unknown[] = [],
  contractId?: string
): Promise<string> {
  const resolvedContractId = getConfiguredContractId(contractId)
  const { url, token } = getRelayerConfig()

  if (!url) {
    throw new Error('STELLAR_RELAYER_URL is not configured')
  }

  if (!hasServerSigner()) {
    throw new Error('STELLAR_PLATFORM_SECRET is not configured')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      contractId: resolvedContractId,
      method,
      args,
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE,
      rpcUrl: STELLAR_RPC_URL,
      // Relayer should read its own secret from server env. This flag allows hard-fail if missing.
      requirePlatformSigner: true,
    }),
  })

  const data = (await response.json()) as RelayerInvokeResponse

  if (!response.ok || data.error) {
    throw new Error(data.error || `Relayer invoke failed for method: ${method}`)
  }

  const txHash = data.txHash || data.txId || data.hash
  if (!txHash) {
    // Keep DB flow alive even if relayer does not return hash yet.
    return `stellar-pending-${randomUUID()}`
  }

  return txHash
}

/**
 * Lightweight health probe used by bootstrap endpoint.
 */
export async function verifyStellarRuntime(): Promise<{ ok: boolean; message: string }> {
  if (!STELLAR_RPC_URL) {
    return { ok: false, message: 'STELLAR_RPC_URL is not set' }
  }

  if (!STELLAR_CONTRACT_ID) {
    return { ok: false, message: 'STELLAR_CONTRACT_ID is not set' }
  }

  if (!process.env.STELLAR_PLATFORM_SECRET) {
    return { ok: false, message: 'STELLAR_PLATFORM_SECRET is not set' }
  }

  return { ok: true, message: 'Stellar runtime configured' }
}

/**
 * Optional reputation hook. Kept async and non-throwing to mirror previous flow.
 */
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
  } catch (error) {
    console.error('Error writing Stellar reputation note:', error)
  }
}
