// Generate wallet and write directly to .env.local
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const acc = algosdk.generateAccount();
const mn = algosdk.secretKeyToMnemonic(acc.sk);
const addr = acc.addr.toString();

// Read current .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');

// Remove old PLATFORM lines if they exist
envContent = envContent.replace(/\n?# Platform.*\n/g, '\n');
envContent = envContent.replace(/\n?PLATFORM_MNEMONIC=.*\n?/g, '\n');
envContent = envContent.replace(/\n?PLATFORM_ADDRESS=.*\n?/g, '\n');

// Clean up extra newlines at end
envContent = envContent.trimEnd() + '\n';

// Append new wallet
envContent += `\n# Platform server wallet\nPLATFORM_MNEMONIC="${mn}"\nPLATFORM_ADDRESS="${addr}"\n`;

fs.writeFileSync(envPath, envContent);

console.log('Done! Updated .env.local with:');
console.log('ADDRESS:', addr);
console.log('MNEMONIC word count:', mn.split(' ').length);
console.log('Open .env.local to verify.');
