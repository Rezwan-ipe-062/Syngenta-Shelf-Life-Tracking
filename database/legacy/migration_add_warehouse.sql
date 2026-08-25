-- Migration: Drop old schema, create tables matching the app
-- Run this in Supabase SQL Editor
-- Existing products table (name, sku, category, unit) is kept as-is

-- 1. Drop old inventory table (FK to products.sku — incompatible with app)
DROP TABLE IF EXISTS inventory CASCADE;

-- 2. Create inventory (matches app's data model)
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product TEXT NOT NULL,
  pack_size TEXT DEFAULT '',
  production_month TEXT DEFAULT '',
  expiry_month TEXT DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  warehouse TEXT DEFAULT '',
  sync_status TEXT DEFAULT 'synced',
  UNIQUE(product, pack_size, production_month, warehouse)
);

-- 3. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product TEXT NOT NULL,
  pack_size TEXT DEFAULT '',
  production_month TEXT DEFAULT '',
  expiry_month TEXT DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('receive', 'dispatch')),
  operator_name TEXT DEFAULT '',
  warehouse TEXT DEFAULT '',
  client_timestamp TEXT DEFAULT '',
  client_date TEXT DEFAULT '',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  warehouse TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create config table
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insert default config (safe to re-run)
INSERT INTO config (key, value) VALUES ('shelf-life-config',
  '{"operatorPins":[],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}')
ON CONFLICT (key) DO NOTHING;

-- 7. Row Level Security — allow full access for anon key
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all" ON inventory;
DROP POLICY IF EXISTS "Allow anon all" ON transactions;
DROP POLICY IF EXISTS "Allow anon all" ON operators;
DROP POLICY IF EXISTS "Allow anon all" ON config;

CREATE POLICY "Allow anon all" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON operators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON config FOR ALL USING (true) WITH CHECK (true);
