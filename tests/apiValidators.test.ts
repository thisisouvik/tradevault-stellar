import { describe, expect, it } from 'vitest'
import { isValidDisputeSplit, validateCreateDealPayload } from '@/lib/apiValidators'

describe('API validation rules', () => {
  it('rejects create-deal payload when required fields are missing', () => {
    const result = validateCreateDealPayload({
      buyerEmail: 'buyer@example.com',
      buyerWallet: 'GABC123',
      arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      itemName: '',
      amountUSDC: '100',
      deliveryDays: '7',
    })

    expect(result).toEqual({ ok: false, error: 'Missing required fields' })
  })

  it('rejects invalid amountUSDC values', () => {
    expect(
      validateCreateDealPayload({
        buyerEmail: 'buyer@example.com',
        buyerWallet: 'GABC123',
        arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        itemName: 'Phone',
        amountUSDC: '0',
        deliveryDays: '7',
      })
    ).toEqual({ ok: false, error: 'Invalid amountUSDC' })

    expect(
      validateCreateDealPayload({
        buyerEmail: 'buyer@example.com',
        buyerWallet: 'GABC123',
        arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        itemName: 'Phone',
        amountUSDC: 'not-a-number',
        deliveryDays: '7',
      })
    ).toEqual({ ok: false, error: 'Invalid amountUSDC' })
  })

  it('rejects invalid deliveryDays values', () => {
    expect(
      validateCreateDealPayload({
        buyerEmail: 'buyer@example.com',
        buyerWallet: 'GABC123',
        arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        itemName: 'Phone',
        amountUSDC: '100',
        deliveryDays: '0',
      })
    ).toEqual({ ok: false, error: 'Invalid deliveryDays' })

    expect(
      validateCreateDealPayload({
        buyerEmail: 'buyer@example.com',
        buyerWallet: 'GABC123',
        arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        itemName: 'Phone',
        amountUSDC: '100',
        deliveryDays: undefined,
      })
    ).toEqual({ ok: false, error: 'Invalid deliveryDays' })
  })

  it('returns parsed numeric values for valid create-deal payload', () => {
    const result = validateCreateDealPayload({
      buyerEmail: 'buyer@example.com',
      buyerWallet: 'GABC123',
      arbitratorWallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      itemName: 'Phone',
      amountUSDC: '250',
      deliveryDays: '5',
    })

    expect(result).toEqual({
      ok: true,
      amountUSDC: 250,
      deliveryDays: 5,
    })
  })

  it('accepts only dispute splits that sum exactly to 100', () => {
    expect(isValidDisputeSplit(50, 50)).toBe(true)
    expect(isValidDisputeSplit(100, 0)).toBe(true)
    expect(isValidDisputeSplit(80, 19)).toBe(false)
    expect(isValidDisputeSplit(60, 41)).toBe(false)
  })
})
