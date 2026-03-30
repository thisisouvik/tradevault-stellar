-- Add assigned arbitrator wallet to deals for strict dispute authorization
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS arbitrator_wallet TEXT;

-- Backfill existing rows with seller wallet as temporary fallback for legacy data.
-- New rows must provide explicit arbitrator wallet from create-deal flow.
UPDATE public.deals d
SET arbitrator_wallet = p.wallet_address
FROM public.profiles p
WHERE d.arbitrator_wallet IS NULL
	AND d.seller_id = p.id
	AND p.wallet_address IS NOT NULL;

UPDATE public.deals
SET arbitrator_wallet = buyer_wallet
WHERE arbitrator_wallet IS NULL;

ALTER TABLE public.deals
ALTER COLUMN arbitrator_wallet SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_arbitrator_wallet
ON public.deals(arbitrator_wallet);
