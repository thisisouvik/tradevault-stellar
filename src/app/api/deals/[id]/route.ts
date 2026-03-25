import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailTemplates } from '@/lib/email'

const STELLAR_TXHASH_REGEX = /^[a-fA-F0-9]{64}$/

type ChainNetwork = 'stellar'

function resolveDealChain(deal: { contract_address?: string | null; contract_app_id?: string | null }): ChainNetwork {
  if (!deal.contract_address) {
    throw new Error('Deal is not configured for Stellar contract execution')
  }
  return 'stellar'
}

function isValidTxHash(network: ChainNetwork, txHash: string): boolean {
  return STELLAR_TXHASH_REGEX.test(txHash)
}

async function txExistsOnChain(_network: ChainNetwork, txHash: string): Promise<boolean> {
  try {
    const horizon = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
    const res = await fetch(`${horizon}/transactions/${txHash}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('deals')
    .select(`*, profiles:seller_id(name, email, wallet_address)`)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const isSeller = data.seller_id === user.id
  const isBuyer = Boolean(user.email && data.buyer_email && user.email === data.buyer_email)
  const isArbitrator = actorProfile?.role === 'arbitrator'

  if (!isSeller && !isBuyer && !isArbitrator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('role, wallet_address')
    .eq('id', user.id)
    .single()

  const body = await request.json()
  const { status, txHash, chainNetwork } = body

  const allowedStatuses = new Set(['FUNDED', 'COMPLETED', 'DISPUTED'])
  if (!status || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: 'Invalid or unsupported status update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existingDeal } = await admin
    .from('deals')
    .select('id, seller_id, buyer_email, status, contract_address, contract_app_id')
    .eq('id', id)
    .single()

  if (!existingDeal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const isSeller = existingDeal.seller_id === user.id
  const isBuyer = Boolean(user.email && existingDeal.buyer_email && user.email === existingDeal.buyer_email)
  const isArbitrator = actorProfile?.role === 'arbitrator'

  // Only buyer may move FUNDED/COMPLETED/DISPUTED transitions from client-triggered actions.
  if ((status === 'FUNDED' || status === 'COMPLETED' || status === 'DISPUTED') && !isBuyer) {
    return NextResponse.json({ error: 'Only buyer can update this status' }, { status: 403 })
  }

  // Arbitrator and seller are intentionally blocked from this generic status route
  // to keep state transitions explicit through dedicated APIs.
  if (isArbitrator || isSeller) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = { status }

  let expectedNetwork: ChainNetwork
  try {
    expectedNetwork = resolveDealChain(existingDeal)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unsupported chain configuration' }, { status: 400 })
  }
  if (chainNetwork && chainNetwork !== expectedNetwork) {
    return NextResponse.json(
      { error: `Invalid chain network for this deal. Expected ${expectedNetwork}.` },
      { status: 400 }
    )
  }

  if (!txHash || typeof txHash !== 'string') {
    return NextResponse.json({ error: 'Missing transaction proof (txHash)' }, { status: 400 })
  }

  const normalizedTxHash = txHash.trim()
  if (!isValidTxHash(expectedNetwork, normalizedTxHash)) {
    return NextResponse.json({ error: `Invalid ${expectedNetwork} tx hash format` }, { status: 400 })
  }

  const exists = await txExistsOnChain(expectedNetwork, normalizedTxHash)
  if (!exists) {
    return NextResponse.json(
      { error: `Transaction proof was not found on ${expectedNetwork} network` },
      { status: 400 }
    )
  }

  console.info(
    '[security] verified state transition proof',
    JSON.stringify({
      dealId: id,
      userId: user.id,
      fromStatus: existingDeal.status,
      toStatus: status,
      chain: expectedNetwork,
      txHash: normalizedTxHash,
      at: new Date().toISOString(),
    })
  )

  if (status === 'FUNDED' && existingDeal.status !== 'PROPOSED' && existingDeal.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Invalid state transition to FUNDED' }, { status: 400 })
  }
  if (status === 'COMPLETED' && existingDeal.status !== 'DELIVERED') {
    return NextResponse.json({ error: 'Deal must be DELIVERED before completion' }, { status: 400 })
  }
  if (status === 'DISPUTED' && existingDeal.status !== 'DELIVERED') {
    return NextResponse.json({ error: 'Deal must be DELIVERED before dispute' }, { status: 400 })
  }

  const { data: deal, error } = await admin
    .from('deals')
    .update(updateData)
    .eq('id', id)
    .select(`*, profiles:seller_id(name, email)`)
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Send status emails (wrapped in try/catch so db updates don't fail if email fails)
  try {
    const dealLink = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${id}`
    const seller = deal.profiles as { name: string; email: string } | null

    if (status === 'FUNDED' && seller?.email) {
      const emailTemplate = emailTemplates.dealFunded(
        seller.name || 'Seller', deal.item_name, deal.amount_usdc, dealLink
      )
      await sendEmail({ to: seller.email, ...emailTemplate })
    }

    if (status === 'COMPLETED') {
      if (seller?.email) {
        const emailTemplate = emailTemplates.dealCompleted(
          seller.name || 'Seller', deal.item_name, deal.amount_usdc
        )
        await sendEmail({ to: seller.email, ...emailTemplate })
      }
      // Also notify buyer
      if (deal.buyer_email) {
        const emailTemplate = emailTemplates.dealCompleted(
          'Buyer', deal.item_name, deal.amount_usdc
        )
        await sendEmail({
          to: deal.buyer_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })
      }
    }

    if (status === 'DISPUTED') {
      if (seller?.email) {
        const emailTemplate = emailTemplates.disputeOpened(seller.name || 'Seller', dealLink)
        await sendEmail({ to: seller.email, ...emailTemplate })
      }
      if (deal.buyer_email) {
        await sendEmail({ to: deal.buyer_email, ...emailTemplates.disputeOpened('Buyer', dealLink) })
      }
    }
  } catch (emailErr) {
    console.error('Failed to send status email:', emailErr)
  }

  return NextResponse.json(deal)
}
