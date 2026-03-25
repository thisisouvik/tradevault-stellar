import { NextRequest, NextResponse } from 'next/server'
import algosdk from 'algosdk'
import { algodClient, getPlatformWallet, USDC_ASSET_ID } from '@/lib/algorand'

/**
 * POST /api/deals/bootstrap
 * 
 * Called server-side after a seller deploys a new escrow contract.
 * The platform wallet pays the 0.2 ALGO MBR and calls bootstrap() on
 * the contract, which opts the contract account into USDC via an inner
 * transaction.
 * 
 * This removes the need for a second wallet approval from the seller —
 * they only sign once (the deploy transaction).
 * 
 * Body: { appId: number, appAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { appId, appAddress } = await request.json()

    if (!appId || !appAddress) {
      return NextResponse.json({ error: 'Missing appId or appAddress' }, { status: 400 })
    }

    const platformWallet = getPlatformWallet()
    const params = await algodClient.getTransactionParams().do()

    // Check platform wallet ALGO balance first
    const accountInfo = await algodClient.accountInformation(platformWallet.addr).do()
    const algoBalance = Number(accountInfo.amount)
    if (algoBalance < 500_000) {
      return NextResponse.json(
        { error: 'Platform wallet has insufficient ALGO. Please top up the platform wallet with testnet ALGO from https://bank.testnet.algorand.network/' },
        { status: 500 }
      )
    }

    // Check if already opted in to avoid wasting ALGO
    const appAccountInfo = await algodClient.accountInformation(appAddress).do()
    const appAssets = appAccountInfo.assets as Array<{ 'asset-id': number }> | undefined
    const alreadyOptedIn = appAssets?.some(a => a['asset-id'] === USDC_ASSET_ID)

    if (alreadyOptedIn) {
      // Already bootstrapped — nothing to do
      return NextResponse.json({ success: true, alreadyBootstrapped: true })
    }

    // txn[0]: Payment to fund MBR (0.2 ALGO covers opt-in MBR + fee buffer)
    const mbrPayTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: platformWallet.addr,
      receiver: appAddress,
      amount: 202_000, // 0.202 ALGO: base MBR(100k) + ASA MBR(100k) + inner fee(1k) + buffer(1k)
      suggestedParams: params,
      note: new TextEncoder().encode('TradeVault:bootstrap:MBR'),
    })

    // txn[1]: App call to bootstrap() — triggers inner USDC opt-in
    const bootstrapTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: platformWallet.addr,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new TextEncoder().encode('bootstrap')],
      foreignAssets: [USDC_ASSET_ID],
      suggestedParams: params,
    })

    // Atomic group — both succeed or neither does
    algosdk.assignGroupID([mbrPayTxn, bootstrapTxn])

    const signedMbr = mbrPayTxn.signTxn(platformWallet.sk)
    const signedBootstrap = bootstrapTxn.signTxn(platformWallet.sk)

    const { txid } = await algodClient
      .sendRawTransaction([signedMbr, signedBootstrap])
      .do()

    await algosdk.waitForConfirmation(algodClient, txid, 4)

    console.log(`[bootstrap] App ${appId} opted into USDC. TX: ${txid}`)

    return NextResponse.json({ success: true, txid })
  } catch (err: any) {
    console.error('[bootstrap] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Bootstrap failed' },
      { status: 500 }
    )
  }
}
