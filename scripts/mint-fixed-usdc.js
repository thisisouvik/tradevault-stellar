#!/usr/bin/env node

const { Keypair, TransactionBuilder, Asset, Operation, Networks, Account } = require('@stellar/stellar-sdk')

async function postTx(horizonUrl, tx) {
  const res = await fetch(`${horizonUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(tx.toEnvelope().toXDR('base64'))}`,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.title || data?.detail || 'Transaction submit failed')
  return data
}

async function loadAccount(horizonUrl, publicKey) {
  const res = await fetch(`${horizonUrl}/accounts/${publicKey}`)
  if (!res.ok) throw new Error(`Account not found or unfunded: ${publicKey}`)
  const data = await res.json()
  return new Account(publicKey, String(data.sequence))
}

async function friendbotFund(publicKey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || data?.title || 'Friendbot funding failed')
  return data
}

async function ensureTrustline(horizonUrl, userKeypair, asset) {
  const accountRes = await fetch(`${horizonUrl}/accounts/${userKeypair.publicKey()}`)
  if (!accountRes.ok) throw new Error('User account not found')
  const accountData = await accountRes.json()

  const hasTrustline = (accountData.balances || []).some(
    (b) => b.asset_code === asset.code && b.asset_issuer === asset.issuer
  )

  if (hasTrustline) {
    console.log('✓ Trustline already exists')
    return
  }

  const userAccount = new Account(userKeypair.publicKey(), String(accountData.sequence))
  const trustTx = new TransactionBuilder(userAccount, {
    fee: '10000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(30)
    .build()

  trustTx.sign(userKeypair)
  await postTx(horizonUrl, trustTx)
  console.log('✓ Trustline created')
}

async function main() {
  const userSecret = process.argv[2]
  const amount = process.argv[3] || '1000'
  const assetCode = process.argv[4] || 'USDC'

  const issuerSecret = process.env.FIXED_USDC_ISSUER_SECRET
  if (!userSecret) {
    console.error('Usage: node scripts/mint-fixed-usdc.js <USER_SECRET> [amount] [assetCode]')
    process.exit(1)
  }
  if (!issuerSecret) {
    console.error('Missing FIXED_USDC_ISSUER_SECRET in environment')
    process.exit(1)
  }

  const horizonUrl = 'https://horizon-testnet.stellar.org'
  const userKeypair = Keypair.fromSecret(userSecret)
  const issuerKeypair = Keypair.fromSecret(issuerSecret)
  const asset = new Asset(assetCode, issuerKeypair.publicKey())

  console.log('User:', userKeypair.publicKey())
  console.log('Fixed issuer:', issuerKeypair.publicKey())
  console.log('Asset:', `${assetCode}:${issuerKeypair.publicKey()}`)

  // Ensure accounts are funded on testnet
  await friendbotFund(userKeypair.publicKey()).catch(() => null)
  await friendbotFund(issuerKeypair.publicKey()).catch(() => null)

  await ensureTrustline(horizonUrl, userKeypair, asset)

  const issuerAccount = await loadAccount(horizonUrl, issuerKeypair.publicKey())
  const paymentTx = new TransactionBuilder(issuerAccount, {
    fee: '10000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: userKeypair.publicKey(),
        asset,
        amount: String(amount),
      })
    )
    .setTimeout(30)
    .build()

  paymentTx.sign(issuerKeypair)
  await postTx(horizonUrl, paymentTx)

  console.log(`✓ Minted ${amount} ${assetCode} to ${userKeypair.publicKey()}`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
