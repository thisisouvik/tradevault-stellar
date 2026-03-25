/**
 * TradeVault — Deploy Smart Contract to Algorand TestNet
 * 
 * Usage:
 *   node scripts/deploy.js
 * 
 * Before running:
 *   1. Make sure PLATFORM_MNEMONIC is set in .env.local
 *   2. Make sure the platform wallet has TestNet ALGO (use dispenser)
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT   = parseInt(process.env.ALGOD_PORT || '443');
const ALGOD_TOKEN  = process.env.ALGOD_TOKEN || '';
const MNEMONIC     = process.env.PLATFORM_MNEMONIC;

if (!MNEMONIC || MNEMONIC.includes('word1')) {
  console.error('\n❌ ERROR: PLATFORM_MNEMONIC is not set in .env.local');
  console.error('   Run "node scripts/generateWallet.js" first, then paste the mnemonic into .env.local\n');
  process.exit(1);
}

async function main() {
  console.log('\n======================================================');
  console.log('       TradeVault — Deploying Smart Contract          ');
  console.log('======================================================\n');

  // 1. Connect to Algorand TestNet
  const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
  
  // Verify connection
  try {
    const status = await client.status().do();
    console.log('✅ Connected to Algorand TestNet');
    console.log(`   Last round: ${status['last-round']}\n`);
  } catch (err) {
    console.error('❌ Cannot connect to Algorand TestNet:', err.message);
    process.exit(1);
  }

  // 2. Load deployer account
  const account = algosdk.mnemonicToSecretKey(MNEMONIC);
  console.log(`📱 Deployer: ${account.addr.toString()}`);

  // Check balance
  const accountInfo = await client.accountInformation(account.addr).do();
  const algoBalance = Number(accountInfo.amount) / 1_000_000;
  console.log(`💰 Balance:  ${algoBalance} ALGO\n`);

  if (algoBalance < 1) {
    console.error('❌ ERROR: Not enough ALGO! You need at least 1 ALGO.');
    console.error('   Go to https://bank.testnet.algorand.network/ and dispense ALGO to:');
    console.error(`   ${account.addr.toString()}\n`);
    process.exit(1);
  }

  // 3. Load TEAL programs
  const approvalPath = path.join(__dirname, '..', 'contract', 'artifacts', 'approval.teal');
  const clearPath    = path.join(__dirname, '..', 'contract', 'artifacts', 'clear.teal');

  if (!fs.existsSync(approvalPath) || !fs.existsSync(clearPath)) {
    console.error('❌ ERROR: TEAL files not found in contract/artifacts/');
    process.exit(1);
  }

  const approvalSource = fs.readFileSync(approvalPath, 'utf8');
  const clearSource    = fs.readFileSync(clearPath, 'utf8');

  console.log('📄 Compiling TEAL programs...');

  // 4. Compile TEAL to bytecode
  const approvalResult = await client.compile(Buffer.from(approvalSource)).do();
  const clearResult    = await client.compile(Buffer.from(clearSource)).do();

  const approvalProgram = new Uint8Array(Buffer.from(approvalResult.result, 'base64'));
  const clearProgram    = new Uint8Array(Buffer.from(clearResult.result, 'base64'));

  console.log('✅ Compiled successfully!\n');

  // 5. Create application
  console.log('🚀 Deploying to Algorand TestNet...');

  const params = await client.getTransactionParams().do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    sender: account.addr,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: approvalProgram,
    clearProgram: clearProgram,
    numLocalInts: 0,
    numLocalByteSlices: 0,
    numGlobalInts: 6,      // amount, deadline, dispute_end, state, delivered_at + 1 spare
    numGlobalByteSlices: 3, // seller, buyer, tracking_hash
  });

  const signedTxn = txn.signTxn(account.sk);
  const { txid } = await client.sendRawTransaction(signedTxn).do();
  console.log(`   TX ID: ${txid}`);

  // 6. Wait for confirmation
  const result = await algosdk.waitForConfirmation(client, txid, 4);
  
  // Debug: find the App ID field
  console.log('\n   Result keys:', Object.keys(result));
  console.log('   Result:', JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2).substring(0, 500));
  
  const appId = Number(result['application-index'] || result['applicationIndex'] || result.applicationIndex || 0);
  
  let appAddress = 'N/A';
  try {
    appAddress = algosdk.getApplicationAddress(appId).toString();
  } catch {
    try {
      appAddress = algosdk.getApplicationAddress(BigInt(appId)).toString();
    } catch {
      appAddress = '(use AlgoExplorer to view)';
    }
  }

  console.log('\n======================================================');
  console.log('          ✅ CONTRACT DEPLOYED SUCCESSFULLY!           ');
  console.log('======================================================\n');
  console.log(`   App ID:      ${appId}`);
  console.log(`   App Address: ${appAddress}`);
  console.log(`   TX ID:       ${txid}`);
  console.log(`   Explorer:    https://testnet.algoexplorer.io/application/${appId}`);
  console.log('\n------------------------------------------------------');
  console.log('   Add this to your .env.local:');
  console.log(`   NEXT_PUBLIC_CONTRACT_APP_ID=${appId}`);
  console.log('------------------------------------------------------\n');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
