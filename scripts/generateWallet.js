const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const acc = algosdk.generateAccount();
const mn = algosdk.secretKeyToMnemonic(acc.sk);
const addr = acc.addr.toString();

const output = `
======================================================
         NEW PLATFORM WALLET (SAVED TO FILE)
======================================================

ADDRESS:
${addr}

MNEMONIC (25 words):
${mn}

WORD COUNT: ${mn.split(' ').length}

======================================================
Copy these lines into your .env.local:

PLATFORM_MNEMONIC="${mn}"
PLATFORM_ADDRESS="${addr}"
======================================================
`;

console.log(output);

// Also save to a file so nothing gets cut off
const outPath = path.join(__dirname, 'wallet_output.txt');
fs.writeFileSync(outPath, output);
console.log('Also saved to: scripts/wallet_output.txt');
