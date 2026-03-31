const { Keypair, TransactionBuilder, Asset, Operation, Networks, Account } = require('@stellar/stellar-sdk');

async function run() {
  const userSecret = process.argv[2];
  if (!userSecret) {
    console.error("Usage: node scripts/mint-usdc.js <YOUR_FREIGHTER_TESTNET_SECRET_KEY>");
    process.exit(1);
  }

  try {
    const userKeypair = Keypair.fromSecret(userSecret);
    const horizonUrl = 'https://horizon-testnet.stellar.org';
    
    console.log("Funding your account from friendbot...");
    const userFundRes = await fetch(`https://friendbot.stellar.org?addr=${userKeypair.publicKey()}`);
    const userFundData = await userFundRes.json();
    if (!userFundRes.ok) {
      throw new Error(`Failed to fund account: ${userFundData.detail || userFundData.title}`);
    }
    console.log("✓ Your account funded!");
    
    console.log("Creating an 'Issuer' account for our fake USDC...");
    const issuerKeypair = Keypair.random();
    
    // Fund issuer via friendbot
    const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${issuerKeypair.publicKey()}`);
    await friendbotRes.json();
    console.log("Issuer created! Public Key:", issuerKeypair.publicKey());

    const usdcAsset = new Asset('USDC', issuerKeypair.publicKey());

    console.log("Establishing trustline from your wallet to the Issuer for 'USDC'...");
    
    // Load user account
    let userAccountRes = await fetch(`${horizonUrl}/accounts/${userKeypair.publicKey()}`);
    if (!userAccountRes.ok) {
      throw new Error(`Failed to load user account: ${await userAccountRes.text()}`);
    }
    let userAccountData = await userAccountRes.json();
    console.log("User account seq:", userAccountData.sequence);
    let userAccount = new Account(userKeypair.publicKey(), String(userAccountData.sequence));
    
    // Create and sign trustline transaction
    let txTrust = new TransactionBuilder(userAccount, { fee: '10000', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({
        asset: usdcAsset,
      }))
      .setTimeout(30)
      .build();

    txTrust.sign(userKeypair);
    
    try {
      const submitRes = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        body: `tx=${encodeURIComponent(txTrust.toEnvelope().toXDR('base64'))}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.title || 'Failed to create trustline');
      }
      console.log("✓ Trustline created successfully");
    } catch (e) {
      console.error("Error creating trustline:", e?.message || e);
      process.exit(1);
    }

    console.log("Minting 10,000 USDC to your wallet...");
    
    // Load issuer account
    let issuerAccountRes = await fetch(`${horizonUrl}/accounts/${issuerKeypair.publicKey()}`);
    let issuerAccountData = await issuerAccountRes.json();
    let issuerAccount = new Account(issuerKeypair.publicKey(), String(issuerAccountData.sequence));

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
      const payRes = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        body: `tx=${encodeURIComponent(txPayment.toEnvelope().toXDR('base64'))}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.title || 'Failed to send payment');
      }
      console.log("✓ Success! You now have 10,000 Testnet USDC!");
      console.log("Account:", userKeypair.publicKey());
    } catch (e) {
      console.error("Error sending payment:", e?.message || e);
    }
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

run();