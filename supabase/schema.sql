
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE deal_status AS ENUM (
  'PROPOSED',
  'ACCEPTED',
  'FUNDED',
  'DELIVERED',
  'COMPLETED',
  'DISPUTED',
  'RESOLVED',
  'CANCELLED'
);

-- Users table (synced from Supabase Auth)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'buyer', 'arbitrator')),
  wallet_address TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Deals table
CREATE TABLE public.deals (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  seller_id           UUID NOT NULL REFERENCES public.profiles(id),
  buyer_email         TEXT NOT NULL,
  buyer_wallet        TEXT NOT NULL,
  item_name           TEXT NOT NULL,
  item_description    TEXT,
  amount_usdc         INTEGER NOT NULL,
  delivery_days       INTEGER NOT NULL,
  dispute_window_days INTEGER NOT NULL,
  status              deal_status DEFAULT 'PROPOSED',
  contract_app_id     TEXT,
  contract_address    TEXT,
  tracking_id         TEXT,
  courier             TEXT,
  tracking_hash       TEXT,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their deals" ON public.deals
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view deal by ID" ON public.deals
  FOR SELECT USING (true);

CREATE POLICY "Sellers can create deals" ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their deals" ON public.deals
  FOR UPDATE USING (auth.uid() = seller_id);

-- Evidence table
CREATE TABLE public.evidence (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  deal_id       TEXT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  submitted_by  TEXT NOT NULL, -- 'seller' or 'buyer'
  submitter_id  UUID NOT NULL REFERENCES public.profiles(id),
  description   TEXT NOT NULL,
  photo_urls    TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence visible to deal parties" ON public.evidence
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit evidence" ON public.evidence
  FOR INSERT WITH CHECK (auth.uid() = submitter_id);

-- Arbitration table
CREATE TABLE public.arbitration (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  deal_id         TEXT NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  arbitrator_id   UUID NOT NULL REFERENCES public.profiles(id),
  seller_pct      INTEGER NOT NULL,
  buyer_pct       INTEGER NOT NULL,
  notes           TEXT,
  resolved_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.arbitration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Arbitrations are viewable" ON public.arbitration
  FOR SELECT USING (true);

CREATE POLICY "Arbitrators can insert" ON public.arbitration
  FOR INSERT WITH CHECK (auth.uid() = arbitrator_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'seller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for evidence photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Users can upload evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Users can view evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidence');

-- Index for faster deal lookups
CREATE INDEX idx_deals_seller_id ON public.deals(seller_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_buyer_email ON public.deals(buyer_email);
CREATE INDEX idx_evidence_deal_id ON public.evidence(deal_id);
