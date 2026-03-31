#!/usr/bin/env node

/**
 * Derive a Stellar secret key from a BIP39 seed phrase
 * 
 * Usage:
 *   node scripts/derive-key-from-seed.js "word1 word2 word3 ... word12"
 */

const { Keypair } = require('@stellar/stellar-sdk');

// Helper function to derive Stellar keypair from seed phrase
function deriveKeypairFromSeed(seedPhrase) {
  try {
    const bip39 = require('bip39');
    const hdkey = require('hdkey');
    
    // Convert seed phrase to seed buffer
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    
    // Derive using Stellar's standard derivation path: m/44'/148'/0'
    const root = hdkey.fromMasterSeed(seed);
    const path = "m/44'/148'/0'";
    const child = root.derive(path);
    
    // Create keypair from the derived private key
    const keypair = Keypair.fromRawEd25519Seed(child.privateKey);
    
    return keypair;
  } catch (error) {
    throw new Error(`Failed to derive keypair: ${error.message}`);
  }
}

async function main() {
  const seedPhrase = process.argv[2];
  
  if (!seedPhrase) {
    console.error('Usage: node scripts/derive-key-from-seed.js "your seed phrase here"');
    process.exit(1);
  }
  
  try {
    const keypair = deriveKeypairFromSeed(seedPhrase);
    
    console.log('\n✅ Successfully derived Stellar keypair from seed phrase:\n');
    console.log('Public Key:', keypair.publicKey());
    console.log('Secret Key:', keypair.secret());
    console.log('\n⚠️  Keep your secret key safe! Never share it publicly.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
