# TradeVault

TradeVault is a decentralized escrow platform for peer-to-peer commerce, built with Next.js, Supabase, and Stellar Soroban.

## What It Does

- Creates escrow deals between a seller and a buyer
- Locks deal state transitions to on-chain actions (fund, confirm, dispute)
- Stores logistics evidence and delivery proofs
- Supports arbitrator-driven dispute resolution
- Verifies submitted transaction hashes against Stellar Horizon before allowing critical status updates

## Stack

- Frontend: Next.js App Router, React, Tailwind CSS, Framer Motion
- Backend: Next.js API routes, Supabase Auth/Postgres/Storage
- Chain: Stellar Soroban
- Tracking: TrackingMore

## Key Security Model

- API routes enforce role and participant authorization (seller, buyer, arbitrator)
- Deal status transitions requiring chain proof must include a valid Stellar tx hash
- Backend verifies the tx hash exists on Stellar testnet Horizon before persisting sensitive state transitions
- On-chain actions are performed server-side via configured relayer/runtime integration

## Project Structure

```text
src/
  app/
    api/
      deals/
        [id]/
          onchain/route.ts      # fund/confirm/dispute on Stellar
          route.ts              # deal read/update with tx-proof checks
    arbitrator/
    dashboard/
    deal/
    why-stellar/
  components/
  lib/
    stellar.ts                  # Soroban runtime/invocation helpers
    supabase/
```

## Environment Variables

Create a local `.env.local` with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

TRACKINGMORE_API_KEY=

STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_CONTRACT_ID=
STELLAR_PLATFORM_SECRET=
STELLAR_USDC_ASSET=
STELLAR_RELAYER_URL=
STELLAR_RELAYER_TOKEN=
STELLAR_REPUTATION_WEBHOOK_URL=

NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_CONTRACT_ID=
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Database

- SQL schema and migrations are under `supabase/`
- Ensure the required tables exist (`profiles`, `deals`, `evidence`, `arbitration`, etc.)
