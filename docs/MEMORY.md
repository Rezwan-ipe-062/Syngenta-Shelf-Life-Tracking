# Session Memory — Shelf Life Tracking

## Session Date: 2026-07-15

## Overview
This session updated PROJECT_REQUIREMENTS.md to reflect Supabase cloud sync, AGI codes, multi-operator sharing, admin-priority product sync, and answered all open questions. Then implemented the corresponding code changes. Added chart filters (year pills + month dropdown) to the admin dashboard. Restructured the entire project folder into a clean layout. Fixed SQL bug and prepared for pilot launch.

## Key Design Decisions (updated in this session)

### Supabase Cloud Sync
- Supabase (PostgreSQL) added as central sync point between operator PWA and admin dashboard
- RLS policies: "Allow anon all" on `transactions`, `inventory`, `config` tables
- Anon key used; all auth is app-managed (operator PIN + admin password 9876)

### Multi-Operator at Same Warehouse
- Operators at the same warehouse share inventory via Supabase
- Quantities are re-aggregated per (product + packSize + productionMonth + warehouse) — they SUM, not overwrite
- `pullFromSupabase()` in syncManager.js now uses an aggregating IIFE that sums quantities by composite key

### Admin is Authoritative for Products
- Products added/edited/deleted in Admin are synced to Supabase `config` table as `product-list`
- Operator app calls `pullProducts()` on init, stores in localStorage as `synced-products`
- `loadSyncedProducts()` in products.js overrides the hardcoded `PRODUCTS` array if synced data exists
- products.js: `const PRODUCTS` → `let PRODUCTS`

### AGI Codes (5-digit numeric IDs)
- Auto-derived from product+pack lookup via `DEFAULT_AGI_CODES` mapping (48 entries in both apps)
- **Admin app only** — shows AGI Code in Product table and Activity Log
- **Operator app never shows AGI codes** — removed count screen AGI label, inventory Code column, and `colspan="5"` → `colspan="4"`
- AGI codes are not in the Supabase schema (stored locally in localStorage `product-agi-codes`)

### Clear Supabase Data
- Changed from `client.from('table').delete().neq('column', '')` to `client.rpc('clear_all_data_rpc')` which uses `SECURITY DEFINER` plpgsql function with `TRUNCATE` to bypass RLS
- RPC function re-inserts default config row after truncate

### Chart Title
- Changed "Stock by Production Month" → "Stock by Batch Code" in admin dashboard

### Chart Filters
- Year filter pills (All + each available year) generated dynamically from inventory data
- Month dropdown (A–L + All) narrows charts further
- Filters stack with existing warehouse filter: chart shows data matching warehouse + year + month
- Only months with data are shown in chart columns (no zero-filled)

## Changes Made This Session

### PROJECT_REQUIREMENTS.md
- Updated Data Flow (6.2) — added Supabase cloud sync, admin-priority, multi-operator, AGI codes
- Updated Tech Stack (6.3) — added Supabase
- Updated File Structure (7.1) — added syncManager.js, supabase-schema.sql, admin-app.js/css
- Updated Shared Data (7.2) — described 3-layer architecture (localStorage × 2 + Supabase)
- Updated Products section (9.7) — AGI Code column, delete safety note
- Updated Settings (9.8) — Clear Supabase Data button description
- Updated Dashboard (9.3) — chart title, chart filter bar design
- Updated Data Model (10) — added warehouse, sync_status fields; added Supabase table schemas
- Updated NOT in Scope (14) — removed server-side DB and multi-device sync (now implemented)
- Updated Open Questions (15) — all 11 questions resolved with answers
- Version bumped to 2.0

### supabase-schema.sql
- Rewritten as definitive schema: tables `transactions`, `inventory`, `config` (dropped `products`, `operators`)
- Added `clear_all_data_rpc()` RPC function using SECURITY DEFINER + TRUNCATE
- Consistent "Allow anon all" policy on all tables

### Deleted Files
- `supabase sql codes/init_tables.sql` (superseded)
- `supabase sql codes/migration_add_warehouse.sql` (superseded)
- `supabase sql codes/clear_all_data.sql` (superseded)

### admin-app.js
- Added `syncProducts()` — pushes `PRODUCTS` array to Supabase `config` as `product-list`
- `saveProduct()` now calls `syncProducts()` after saving
- `deleteProduct()` now calls `syncProducts()` after deleting
- `clearSupabaseData()` changed from `delete().neq()` to `client.rpc('clear_all_data_rpc')`
- Chart title comment and Chart.js title text: "Stock by Production Month" → "Stock by Batch Code"
- Added chart filter state: `chartYearFilter`, `chartMonthFilter`
- Added `setChartYearFilter()`, `setChartMonthFilter()` — update state + re-render
- `renderDashboard()` now calls `buildChartYearFilters()` (dynamic year pills) and `filterChartInventory()` (warehouse + year + month stacking) before `renderCharts()`
- Added `buildChartYearFilters()` — renders year pills and month dropdown into `#chart-filter-bar`
- Added `filterChartInventory()` — filters inventory by all active dashboard filters
- `renderCharts()` signature changed: `(opData)` → `(inventory)` — takes pre-filtered array

### admin-panel.html
- Chart title: "Stock by Production Month" → "Stock by Batch Code"
- Added `<div class="filter-bar chart-filter-bar" id="chart-filter-bar">` between stat grid and chart grid

### admin-style.css
- Added `.chart-filter-bar` styles
- Added `.filter-separator` (vertical divider between year pills and month dropdown)
- Added `.chart-month-select` (styled `<select>` for month filter)

### operator-app/syncManager.js
- Added `pullProducts()` — fetches `product-list` from Supabase `config`, stores as `synced-products` in localStorage
- `pullFromSupabase()` inventory aggregation: re-aggregates by (product+packSize+productionMonth+warehouse), sums quantities (multi-operator fix)

### operator-app/products.js
- `const PRODUCTS` → `let PRODUCTS`
- Added `loadSyncedProducts()` — loads `synced-products` from localStorage, overrides PRODUCTS array
- Auto-called on module load via IIFE

### operator-app/app.js
- Init: calls `pullProducts()` and `loadSyncedProducts()` before `pullFromSupabase()`
- Calls `initProductList()` after sync to rebuild product UI
- Count screen: removed AGI code display (`getProductAgiCode` + `#count-agi-code`)
- Inventory list: removed AGI `<td>`, removed Code column, `colspan="5"` → `colspan="4"`

### operator-app/index.html
- Removed `<p id="count-agi-code" class="agi-code-label">` from count screen
- Removed `<th>Code</th>` from inventory table header

### operator-app/style.css
- Removed `.agi-code-label` CSS block

### Folder Restructuring
- **`admin-app/` → `apps/admin/`** — all admin dashboard files
- **`operator-app/` → `apps/operator/`** — all operator PWA files
- **`supabase-schema.sql` → `database/supabase-schema.sql`** — SQL schema
- **`supabase sql codes/` → `database/legacy/`** — archived SQL scripts
- **`reference-data/` → `reference/`** — spreadsheets, photos, reference docs
- **`PROJECT_REQUIREMENTS.md`, `MEMORY.md` → `docs/`** — documentation
- **`.md files/` → `docs/planning/`** — early design drafts (Architecture.md, PRD.md, etc.)
- **`graphify-out/`** added to `.gitignore` (auto-generated, not source)
- Updated `README.md` and `docs/PROJECT_REQUIREMENTS.md` with new file paths

### GitHub Pages Setup
- Added `.github/workflows/pages.yml` — deploys root to Pages on push to `main`
- User must enable Pages in repo Settings → Pages → Source: GitHub Actions

## Important Notes for Future Sessions

### Supabase Info
- URL: https://ytirmuuchcxzlwethvsg.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aXJtdXVjaGN4emx3ZXRodnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MzU1NzMsImV4cCI6MjA5OTUxMTU3M30.qJTqCNTScbkSHvISLJKhKR0e-_4qdb-7QvVyYQIKRog

### Important Schema Notes
- `inventory` table has UNIQUE(product, pack_size, production_month, warehouse)
- `config` has 2 rows: `shelf-life-config` (app settings), `product-list` (synced product catalog)
- `products` and `operators` tables were DELETED from schema — they're locally managed
- The RPC function `clear_all_data_rpc()` handles clearing all data

### Product List Sync Flow
1. Admin: saveProduct/deleteProduct → `syncProducts()` → upserts to `config.key='product-list'`
2. Operator init: `pullProducts()` → reads from `config.key='product-list'` → stores in localStorage
3. Products.js: `loadSyncedProducts()` at load time overrides the hardcoded array
4. Both apps at `apps/admin/` and `apps/operator/` respectively

### AGI Codes (admin only)
- DEFAULT_AGI_CODES in both apps (48 entries from reference data)
- Admin can edit AGI codes per product in the modal
- Stored in localStorage `product-agi-codes` (not in Supabase)
- Operator app: AGI code functions exist in products.js (`getProductAgiCode`) but are no longer rendered in the UI

### Chart Filters
- `chartYearFilter` / `chartMonthFilter` are global state variables in admin-app.js
- `filterChartInventory()` applies all three dashboard filters: warehouse (selectedWarehouses), year, month
- `buildChartYearFilters()` reads inventory data to show available years as clickable pills
- Year pills use `data-year` attribute for DOM identification
- Month dropdown selection restored after `renderDashboard()` rebuilds the bar
- Charts only show columns for months with data (the existing Chart.js logic was already filtering zero months)

### Next Likely Work
- Enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions
- Run `database/supabase-schema.sql` in Supabase SQL Editor
- Testing the Supabase RPC function
- Testing multi-operator sync behavior
- Testing product sync from admin to operator
- Testing chart filters with various data combinations
- Any UI polish or bug fixes from testing
