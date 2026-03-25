import { NextRequest, NextResponse } from 'next/server'
import { verifyStellarRuntime } from '@/lib/stellar'

/**
 * POST /api/deals/bootstrap
 *
 * Legacy endpoint kept for API compatibility.
 * In Stellar Soroban, there is no Algorand-style bootstrap/MBR funding step,
 * so this route now validates server-side Stellar runtime configuration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const contractId = body?.contractId || body?.appAddress || null

    const status = await verifyStellarRuntime()
    if (!status.ok) {
      return NextResponse.json({ error: status.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      alreadyBootstrapped: true,
      network: 'stellar',
      message: 'No bootstrap transaction is required for Soroban escrow contracts.',
      contractId,
    })
  } catch (err: any) {
    console.error('[bootstrap] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Bootstrap failed' },
      { status: 500 }
    )
  }
}
