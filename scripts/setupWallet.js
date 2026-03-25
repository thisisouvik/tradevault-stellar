#!/usr/bin/env node

/**
 * Update .env.local with Stellar wallet keys.
 *
 * Usage:
 *   node scripts/setupWallet.js --secret S... --public G...
 *
 * Optional:
 *   --file <path>  (defaults to ../.env.local)
 */

const fs = require('fs');
const path = require('path');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function upsertLine(content, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, line);
  }

  const trimmed = content.trimEnd();
  return `${trimmed}\n${line}\n`;
}

function main() {
  const secret = getArg('--secret');
  const pub = getArg('--public');
  const fileArg = getArg('--file');
  const envPath = fileArg
    ? path.resolve(process.cwd(), fileArg)
    : path.join(__dirname, '..', '.env.local');

  if (!secret) {
    console.error('Missing --secret argument.');
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '', 'utf8');
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = upsertLine(envContent, 'STELLAR_PLATFORM_SECRET', secret);

  if (pub) {
    envContent = upsertLine(envContent, 'STELLAR_PLATFORM_PUBLIC', pub);
  }

  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log(`Updated ${envPath}`);
  console.log('Set: STELLAR_PLATFORM_SECRET');
  if (pub) {
    console.log('Set: STELLAR_PLATFORM_PUBLIC');
  }
}

main();
