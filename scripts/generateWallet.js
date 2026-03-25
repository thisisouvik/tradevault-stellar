#!/usr/bin/env node

/**
 * Generate a Stellar keypair for TradeVault server/runtime use.
 *
 * Usage:
 *   node scripts/generateWallet.js
 */

const fs = require('fs');
const path = require('path');
const { Keypair } = require('@stellar/stellar-sdk');

function main() {
  const pair = Keypair.random();
  const publicKey = pair.publicKey();
  const secretKey = pair.secret();

  const output = [
    '======================================================',
    '      NEW STELLAR PLATFORM WALLET (SAVED TO FILE)     ',
    '======================================================',
    '',
    'PUBLIC KEY:',
    publicKey,
    '',
    'SECRET KEY:',
    secretKey,
    '',
    'Copy these lines into your .env.local:',
    `STELLAR_PLATFORM_SECRET=${secretKey}`,
    `STELLAR_PLATFORM_PUBLIC=${publicKey}`,
    '======================================================',
    '',
  ].join('\n');

  console.log(output);

  const outPath = path.join(__dirname, 'wallet_output.txt');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`Also saved to: ${outPath}`);
}

main();
