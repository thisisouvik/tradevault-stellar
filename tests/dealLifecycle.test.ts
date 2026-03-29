import { describe, expect, it } from 'vitest'
import {
  canTransitionDealStatus,
  isSupportedPatchStatus,
  isValidStellarTxHash,
  resolveOnchainAction,
} from '@/lib/dealLifecycle'

describe('deal lifecycle rules', () => {
  it('allows only supported patch statuses', () => {
    expect(isSupportedPatchStatus('FUNDED')).toBe(true)
    expect(isSupportedPatchStatus('COMPLETED')).toBe(true)
    expect(isSupportedPatchStatus('DISPUTED')).toBe(true)
    expect(isSupportedPatchStatus('CANCELLED')).toBe(true)
    expect(isSupportedPatchStatus('RESOLVED')).toBe(false)
    expect(isSupportedPatchStatus('PROPOSED')).toBe(false)
  })

  it('enforces valid status transitions for escrow lifecycle', () => {
    expect(canTransitionDealStatus('PROPOSED', 'FUNDED')).toBe(true)
    expect(canTransitionDealStatus('ACCEPTED', 'FUNDED')).toBe(true)
    expect(canTransitionDealStatus('DELIVERED', 'COMPLETED')).toBe(true)
    expect(canTransitionDealStatus('DELIVERED', 'DISPUTED')).toBe(true)

    expect(canTransitionDealStatus('FUNDED', 'COMPLETED')).toBe(false)
    expect(canTransitionDealStatus('PROPOSED', 'COMPLETED')).toBe(false)
    expect(canTransitionDealStatus('DELIVERED', 'CANCELLED')).toBe(false)
  })

  it('validates stellar transaction hash format strictly', () => {
    const valid = 'a'.repeat(64)
    const invalidShort = 'b'.repeat(63)
    const invalidChars = 'z'.repeat(64)

    expect(isValidStellarTxHash(valid)).toBe(true)
    expect(isValidStellarTxHash(invalidShort)).toBe(false)
    expect(isValidStellarTxHash(invalidChars)).toBe(false)
  })

  it('maps onchain actions to expected contract methods', () => {
    expect(resolveOnchainAction('fund', 'PROPOSED')).toEqual({ method: 'fund_deal', nextStatus: 'FUNDED' })
    expect(resolveOnchainAction('fund', 'ACCEPTED')).toEqual({ method: 'fund_deal', nextStatus: 'FUNDED' })
    expect(resolveOnchainAction('confirm', 'DELIVERED')).toEqual({ method: 'confirm_package', nextStatus: 'COMPLETED' })
    expect(resolveOnchainAction('dispute', 'DELIVERED')).toEqual({ method: 'raise_dispute', nextStatus: 'DISPUTED' })
  })

  it('rejects invalid onchain action/state combinations', () => {
    expect(resolveOnchainAction('fund', 'DELIVERED')).toBeNull()
    expect(resolveOnchainAction('confirm', 'FUNDED')).toBeNull()
    expect(resolveOnchainAction('dispute', 'PROPOSED')).toBeNull()
    expect(resolveOnchainAction('unknown_action', 'PROPOSED')).toBeNull()
  })
})
