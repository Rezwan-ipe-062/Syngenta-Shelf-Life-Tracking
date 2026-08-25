-- Clear all data from all tables (keeps table structure intact)
-- Run this in Supabase SQL Editor to reset for testing

DELETE FROM transactions;
DELETE FROM inventory;
DELETE FROM products;
DELETE FROM config;
DELETE FROM operators;