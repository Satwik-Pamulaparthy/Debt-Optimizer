-- ─────────────────────────────────────────────────────────────────────────────
-- Plaid integration migration
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. plaid_items: stores the access_token per connected institution
-- ⚠️  access_token is sensitive. Enable Supabase Vault in production to
--    encrypt it at rest: https://supabase.com/docs/guides/database/vault
CREATE TABLE IF NOT EXISTS plaid_items (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id          TEXT UNIQUE NOT NULL,
  access_token     TEXT NOT NULL,
  institution_name TEXT,
  institution_id   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plaid items"
  ON plaid_items FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_plaid_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_plaid_items_updated_at
  BEFORE UPDATE ON plaid_items
  FOR EACH ROW EXECUTE FUNCTION update_plaid_items_updated_at();

-- 2. Add Plaid columns to bank_accounts
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS plaid_account_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plaid_item_id    TEXT;

-- 3. Add Plaid column to debts
ALTER TABLE debts
  ADD COLUMN IF NOT EXISTS plaid_account_id TEXT UNIQUE;
