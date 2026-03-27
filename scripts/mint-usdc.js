const { Keypair, Server, TransactionBuilder, Asset, Operation, Networks } = require('@stellar/stellar-sdk');

async function run() {
  const userSecret = process.argv[2];
  if (!userSecret) {
    console.error("Usage: node scripts/mint-usdc.js <YOUR_FREIGHTER_TESTNET_SECRET_KEY>");
    process.exit(1);
  }

  const userKeypair = Keypair.fromSecret(userSecret);
  const server = new Server('https://horizon-testnet.stellar.org');
  
  console.log("Creating an 'Issuer' account for our fake USDC...");
  const issuerKeypair = Keypair.random();
  const res = await fetch(`https://friendbot.stellar.org?addr=${issuerKeypair.publicKey()}`);
  await res.json();
  console.log("Issuer created! Public Key:", issuerKeypair.publicKey());

  const usdcAsset = new Asset('USDC', issuerKeypair.publicKey());

  console.log("Establishing trustline from your wallet to the Issuer for 'USDC'...");
  let userAccount = await server.loadAccount(userKeypair.publicKey());
  
  let txTrust = new TransactionBuilder(userAccount, { fee: '10000', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({
      asset: usdcAsset,
    }))
    .setTimeout(30)
    .build();

  txTrust.sign(userKeypair);
  try {
    await server.submitTransaction(txTrust);
  } catch (e) {
    console.error("Error creating trustline", e?.response?.data || e.message);
    process.exit(1);
  }

  console.log("Minting 10,000 USDC to your wallet...");
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

  let txPayment = new TransactionBuilder(issuerAccount, { fee: '10000', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({
      destination: userKeypair.publicKey(),
      asset: usdcAsset,
      amount: "10000"
    }))
    .setTimeout(30)
    .build();

  txPayment.sign(issuerKeypair);
  try {
    await server.submitTransaction(txPayment);
    console.log("Success! You now have 10,000 Testnet USDC in your Freighter wallet.");
  } catch (e) {
    console.error("Error sending payment", e?.response?.data || e.message);
  }
}

run();