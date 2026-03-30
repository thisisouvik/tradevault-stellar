export interface CreateDealPayload {
  buyerEmail?: string
  buyerWallet?: string
  itemName?: string
  amountUSDC?: string
  deliveryDays?: string
}

export interface CreateDealValidationResult {
  ok: boolean
  error?: 'Missing required fields' | 'Invalid amountUSDC' | 'Invalid deliveryDays'
  amountUSDC?: number
  deliveryDays?: number
}

export function validateCreateDealPayload(payload: CreateDealPayload): CreateDealValidationResult {
  const { buyerEmail, buyerWallet, itemName, amountUSDC, deliveryDays } = payload

  if (!buyerEmail || !buyerWallet || !itemName || !amountUSDC) {
    return { ok: false, error: 'Missing required fields' }
  }

  const parsedAmount = Number.parseInt(amountUSDC, 10)
  const parsedDeliveryDays = Number.parseInt(deliveryDays ?? '', 10)

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { ok: false, error: 'Invalid amountUSDC' }
  }

  if (!Number.isFinite(parsedDeliveryDays) || parsedDeliveryDays <= 0) {
    return { ok: false, error: 'Invalid deliveryDays' }
  }

  return {
    ok: true,
    amountUSDC: parsedAmount,
    deliveryDays: parsedDeliveryDays,
  }
}

export function isValidDisputeSplit(sellerPct: number, buyerPct: number): boolean {
  return sellerPct + buyerPct === 100
}
