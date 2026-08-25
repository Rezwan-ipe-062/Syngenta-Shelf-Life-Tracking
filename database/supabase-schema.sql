-- ==========================================================
-- Definitive Supabase Schema — 12M Shelf Life Inventory System
-- ==========================================================
-- Paste this entire SQL into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ytirmuuchcxzlwethvsg/sql/new
-- Then click "Run" to create all tables, RLS policies, and RPC functions.
-- Safe to re-run (uses IF NOT EXISTS and DROP POLICY IF EXISTS).
-- ==========================================================

-- 1. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  product TEXT NOT NULL,
  pack_size TEXT NOT NULL DEFAULT '',
  production_month TEXT NOT NULL DEFAULT '',
  expiry_month TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('receive', 'dispatch', 'adjustment')),
  operator_name TEXT DEFAULT '',
  warehouse TEXT DEFAULT '',
  client_timestamp TEXT DEFAULT '',
  client_date TEXT DEFAULT '',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVENTORY TABLE (aggregated stock snapshot)
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  product TEXT NOT NULL,
  pack_size TEXT NOT NULL DEFAULT '',
  production_month TEXT NOT NULL DEFAULT '',
  expiry_month TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  warehouse TEXT DEFAULT '',
  operator_name TEXT DEFAULT '',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product, pack_size, production_month, warehouse)
);

-- 3. MONTHLY SNAPSHOTS TABLE (for monthly comparison report)
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_month TEXT NOT NULL,
  product TEXT NOT NULL,
  pack_size TEXT NOT NULL DEFAULT '',
  production_month TEXT NOT NULL DEFAULT '',
  expiry_month TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  warehouse TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_month, product, pack_size, production_month, warehouse)
);

-- 4. CONFIG TABLE (app settings + synced product catalog)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default shelf-life config (safe to re-run)
INSERT INTO config (key, value) VALUES ('shelf-life-config', '{"operatorPins":[],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}') ON CONFLICT (key) DO NOTHING;

-- 4. ROW LEVEL SECURITY — allow full access for anon key
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all" ON transactions;
DROP POLICY IF EXISTS "Allow anon all" ON inventory;
DROP POLICY IF EXISTS "Allow anon all" ON monthly_snapshots;
DROP POLICY IF EXISTS "Allow anon all" ON config;

CREATE POLICY "Allow anon all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON monthly_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON config FOR ALL USING (true) WITH CHECK (true);

-- 5. RPC FUNCTION: clear_all_data_rpc
-- Called by admin "Clear Supabase Data" button.
-- Uses TRUNCATE (bypasses RLS) to delete all rows from all tables.
-- Config default row is re-inserted after truncate.
CREATE OR REPLACE FUNCTION clear_all_data_rpc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  TRUNCATE TABLE transactions CASCADE;
  TRUNCATE TABLE inventory CASCADE;
  TRUNCATE TABLE monthly_snapshots CASCADE;
  TRUNCATE TABLE config CASCADE;

  -- Re-insert default config rows
  INSERT INTO config (key, value) VALUES ('shelf-life-config', '{"operatorPins":[],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}');
  INSERT INTO config (key, value) VALUES ('product-list', '[]');
END;
$$;
