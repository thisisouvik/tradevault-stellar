#!/usr/bin/env node

/**
 * Check Stellar account balance including all assets
 * 
 * Usage:
 *   node scripts/check-balance.js <ACCOUNT_ADDRESS>
 * 
 * Example:
 *   node scripts/check-balance.js GAIHYEEUHYCUAFGZUBDAJNXMKJOUKS4F4CE4JHW7LHUP62RZ3VBDFGJ6
 */

async function checkBalance() {
  const accountAddress = process.argv[2];
  
  if (!accountAddress) {
    console.error('Usage: node scripts/check-balance.js <ACCOUNT_ADDRESS>');
    console.error('Example: node scripts/check-balance.js GAIHYEEUHYCUAFGZUBDAJNXMKJOUKS4F4CE4JHW7LHUP62RZ3VBDFGJ6');
    process.exit(1);
  }

  try {
    const horizonUrl = 'https://horizon-testnet.stellar.org';
    
    console.log(`\nFetching account details for: ${accountAddress}\n`);
    
    const response = await fetch(`${horizonUrl}/accounts/${accountAddress}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error('❌ Account not found or not funded on testnet');
      } else {
        console.error(`❌ Error: ${response.statusText}`);
      }
      process.exit(1);
    }
    
    const accountData = await response.json();
    
    console.log('📊 ACCOUNT BALANCES:');
    console.log('─'.repeat(60));
    
    if (accountData.balances && accountData.balances.length > 0) {
      accountData.balances.forEach((balance, index) => {
        const assetCode = balance.asset_code || 'XLM';
        const issuer = balance.asset_issuer ? ` (${balance.asset_issuer})` : '';
        const amount = parseFloat(balance.balance).toLocaleString();
        console.log(`${index + 1}. ${assetCode}: ${amount}${issuer}`);
      });
    } else {
      console.log('No balances found');
    }
    
    console.log('─'.repeat(60));
    console.log(`\nAccount ID: ${accountData.id}`);
    console.log(`Sequence: ${accountData.sequence}`);
    console.log(`Subentry Count: ${accountData.subentry_count}`);
    console.log(`Last Modified Ledger: ${accountData.last_modified_ledger}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalance();
