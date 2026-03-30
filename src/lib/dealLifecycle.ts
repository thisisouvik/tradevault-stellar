const STELLAR_TXHASH_REGEX = /^[a-fA-F0-9]{64}$/

export type DealStatus =
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'FUNDED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'RESOLVED'
  | 'CANCELLED'

export type PatchableDealStatus = 'FUNDED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

export function isSupportedPatchStatus(status: string): status is PatchableDealStatus {
  return status === 'FUNDED' || status === 'COMPLETED' || status === 'DISPUTED' || status === 'CANCELLED'
}

export function isValidStellarTxHash(txHash: string): boolean {
  return STELLAR_TXHASH_REGEX.test(txHash)
}

export function canTransitionDealStatus(from: string, to: PatchableDealStatus): boolean {
  if (to === 'CANCELLED') return from === 'PROPOSED'
  if (to === 'FUNDED') return from === 'PROPOSED' || from === 'ACCEPTED'
  if (to === 'COMPLETED') return from === 'DELIVERED'
  if (to === 'DISPUTED') return from === 'DELIVERED'
  return false
}

export function resolveOnchainAction(action: string, currentStatus: string): { method: string; nextStatus: PatchableDealStatus } | null {
  if (action === 'fund') {
    if (currentStatus !== 'PROPOSED' && currentStatus !== 'ACCEPTED') return null
    return { method: 'fund_deal', nextStatus: 'FUNDED' }
  }

  if (action === 'confirm') {
    if (currentStatus !== 'DELIVERED') return null
    return { method: 'confirm_package', nextStatus: 'COMPLETED' }
  }

  if (action === 'dispute') {
    if (currentStatus !== 'DELIVERED') return null
    return { method: 'raise_dispute', nextStatus: 'DISPUTED' }
  }

  return null
}