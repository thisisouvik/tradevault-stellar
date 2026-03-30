#!/usr/bin/env node

/**
 * Deploy a Soroban contract using Stellar CLI and sync contract ID to .env.local.
 *
 * Usage:
 *   node scripts/deploy.js --wasm <path-to-wasm> --source <identity> [--network testnet]
 *
 * Example:
 *   node scripts/deploy.js --wasm ./contract/target/wasm32v1-none/release/tradevault_escrow.wasm --source tv-deployer --network testnet
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function upsertLine(content, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function extractContractId(text) {
  const normalized = text || '';

  const direct = normalized.match(/\bC[A-Z0-9]{20,}\b/);
  if (direct) return direct[0];

  const labeled = normalized.match(/contract\s*id\s*[:=]\s*([A-Z0-9]+)/i);
  if (labeled) return labeled[1];

  return null;
}

function main() {
  const wasmPath = getArg('--wasm', process.env.STELLAR_WASM_PATH || '');
  const source = getArg('--source', process.env.STELLAR_CLI_SOURCE || '');
  const network = getArg('--network', process.env.STELLAR_CLI_NETWORK || 'testnet');
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!wasmPath) {
    console.error('Missing --wasm argument (or STELLAR_WASM_PATH).');
    process.exit(1);
  }

  if (!source) {
    console.error('Missing --source argument (or STELLAR_CLI_SOURCE).');
    process.exit(1);
  }

  const defaultWasmCandidates = [
    path.resolve(__dirname, '..', 'contract/target/wasm32v1-none/release/tradevault_escrow.wasm'),
    path.resolve(__dirname, '..', 'contract/target/wasm32-unknown-unknown/release/escrow.wasm'),
  ];

  const candidates = wasmPath
    ? [
        path.resolve(process.cwd(), wasmPath),
        path.resolve(__dirname, '..', wasmPath),
      ]
    : defaultWasmCandidates;
  const resolvedWasm = candidates.find((p) => fs.existsSync(p));

  if (!resolvedWasm) {
    console.error(`WASM file not found. Tried:\n- ${candidates.join('\n- ')}`);
    process.exit(1);
  }

  console.log('Deploying Soroban contract...');
  console.log(`WASM:    ${resolvedWasm}`);
  console.log(`Source:  ${source}`);
  console.log(`Network: ${network}`);

  const args = ['contract', 'deploy', '--wasm', resolvedWasm, '--source', source, '--network', network];
  const result = spawnSync('stellar', args, { encoding: 'utf8' });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';

  if (result.status !== 0) {
    console.error('Stellar CLI deployment failed.');
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    process.exit(result.status || 1);
  }

  const contractId = extractContractId(`${stdout}\n${stderr}`);
  if (!contractId) {
    console.error('Deployment succeeded but contract ID could not be parsed.');
    console.error('CLI output:');
    console.error(stdout);
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '', 'utf8');
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = upsertLine(envContent, 'STELLAR_CONTRACT_ID', contractId);
  envContent = upsertLine(envContent, 'NEXT_PUBLIC_STELLAR_CONTRACT_ID', contractId);
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('======================================================');
  console.log('Contract deployed successfully');
  console.log(`Contract ID: ${contractId}`);
  console.log(`Updated: ${envPath}`);
  console.log('======================================================');
}

main();
