-- Migration: add on_chain_deal_id column to deals table
-- This stores the Soroban Symbol key used to identify this deal on-chain.
-- It must be passed to fund(), release_funds(), raise_dispute(), resolve_dispute().

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS on_chain_deal_id TEXT;

-- Optional: index for on-chain lookups
CREATE INDEX IF NOT EXISTS idx_deals_on_chain_deal_id ON public.deals(on_chain_deal_id);
