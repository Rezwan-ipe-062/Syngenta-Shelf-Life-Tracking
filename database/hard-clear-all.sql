-- HARD CLEAR: Truncates ALL data from all tables with no re-inserts.
-- Run this directly in Supabase SQL Editor when you need a complete reset.
-- WARNING: This cannot be undone. All transactions, inventory, and config will be lost.

TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE inventory CASCADE;
TRUNCATE TABLE config CASCADE;
