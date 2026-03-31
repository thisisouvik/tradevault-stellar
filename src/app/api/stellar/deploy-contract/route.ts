import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sellerAddress } = await request.json()

    if (!sellerAddress) {
      return NextResponse.json({ error: 'sellerAddress required' }, { status: 400 })
    }

    // Validate seller address
    if (!sellerAddress.startsWith('G') || sellerAddress.length !== 56) {
      return NextResponse.json({ error: 'Invalid seller address' }, { status: 400 })
    }

    console.log(`[Contract Deploy] Deal allocation for seller: ${sellerAddress}`)

    // Contract now supports multiple deals via deal_id parameter
    // Return the platform's deployed contract address
    const contractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID || 'CDOBGVI7DZVYDHQJ42I6TQOCP3CBJ7YZKMZVJHHP6Y666SFG64KUXYPD'

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID not configured' }, { status: 500 })
    }

    console.log(`[Contract Deploy] ✓ Contract ID allocated: ${contractId}`)
    console.log(`[Contract Deploy] Seller will create deals using deal_id parameter on contract functions`)

    return NextResponse.json({
      success: true,
      contractId,
      deploymentStatus: 'ready',
      message: 'Contract instance allocated. Multiple deals supported via deal_id.',
    })

  } catch (error) {
    console.error('[Contract Deploy] Fatal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    )
  }
}
