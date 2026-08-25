-- Supabase SQL: Initialize tables for 12M Shelf Life Inventory Tracking
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/ytirmuuchcxzlwethvsg/sql/new)

-- 1. Transactions table (individual receive/dispatch records)
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

-- 2. Inventory table (aggregated stock snapshot)
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

-- 3. Products table (shared product catalog)
CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  pack TEXT DEFAULT '',
  prefix TEXT DEFAULT ''
);

-- 4. Config table (app settings)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Operators table
CREATE TABLE IF NOT EXISTS operators (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, for production)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon key (since this is a simple tool, not multi-tenant)
-- Drop existing policies first to allow re-running this script safely
DROP POLICY IF EXISTS "Allow public read products" ON products;
DROP POLICY IF EXISTS "Allow public insert products" ON products;
DROP POLICY IF EXISTS "Allow public update products" ON products;
DROP POLICY IF EXISTS "Allow public delete products" ON products;
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public update transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public delete transactions" ON transactions;
CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON transactions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public delete inventory" ON inventory;
CREATE POLICY "Allow public read inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert inventory" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update inventory" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Allow public delete inventory" ON inventory FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read config" ON config;
DROP POLICY IF EXISTS "Allow public insert config" ON config;
DROP POLICY IF EXISTS "Allow public update config" ON config;
DROP POLICY IF EXISTS "Allow public delete config" ON config;
CREATE POLICY "Allow public read config" ON config FOR SELECT USING (true);
CREATE POLICY "Allow public insert config" ON config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update config" ON config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete config" ON config FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read operators" ON operators;
DROP POLICY IF EXISTS "Allow public insert operators" ON operators;
DROP POLICY IF EXISTS "Allow public update operators" ON operators;
DROP POLICY IF EXISTS "Allow public delete operators" ON operators;
CREATE POLICY "Allow public read operators" ON operators FOR SELECT USING (true);
CREATE POLICY "Allow public insert operators" ON operators FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update operators" ON operators FOR UPDATE USING (true);
CREATE POLICY "Allow public delete operators" ON operators FOR DELETE USING (true);