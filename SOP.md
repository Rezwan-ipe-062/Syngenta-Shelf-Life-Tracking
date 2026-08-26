# Standard Operating Procedure (SOP)
## Syngenta Shelf Life Tracking System v3.0

**Document ID:** SOP-SLT-001
**Version:** 3.0
**Effective Date:** August 2026
**Prepared for:** Syngenta Bangladesh — Supply Chain & Warehouse Operations

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Roles and Responsibilities](#3-roles-and-responsibilities)
4. [Initial System Setup](#4-initial-system-setup)
5. [Admin Panel Operations](#5-admin-panel-operations)
6. [Operator App Operations](#6-operator-app-operations)
7. [Data Flow and Sync](#7-data-flow-and-sync)
8. [Warehouse Management](#8-warehouse-management)
9. [Monthly Reporting and Snapshots](#9-monthly-reporting-and-snapshots)
10. [Data Management and Safety](#10-data-management-and-safety)
11. [Troubleshooting](#11-troubleshooting)
12. [Appendix A — Product Master List](#appendix-a--product-master-list)
13. [Appendix B — Configuration Reference](#appendix-b--configuration-reference)
14. [Appendix C — Color and Status Legend](#appendix-c--color-and-status-legend)

---

## 1. System Overview

### 1.1 Purpose

The Syngenta Shelf Life Tracking System is a digital inventory management tool designed to track agrochemical products across warehouses in Bangladesh. It enables real-time counting, dispatch/receipt tracking, expiry monitoring, and monthly shelf-life reporting.

### 1.2 Components

| Component | Type | URL | Access |
|-----------|------|-----|--------|
| **Operator App** | Mobile PWA | `https://rezwan-ipe-062.github.io/Syngenta-Shelf-Life-Tracking/apps/operator/` | Warehouse staff (PIN login) |
| **Admin Panel** | Desktop Web App | `https://rezwan-ipe-062.github.io/Syngenta-Shelf-Life-Tracking/apps/admin/admin-panel.html` | Administrators (password login) |
| **Backend** | Google Apps Script + Sheets | Google Sheets (linked) | Automated (REST API) |

### 1.3 Key Features

- **PIN-based operator login** — 4-digit PIN per operator, warehouse-assigned
- **Real-time inventory counting** — Receive, Dispatch, and Adjustment transaction types
- **Expiry monitoring** — Automatic shelf-life bucket classification (Critical, Warning, Notice, Distant)
- **FEFO tracking** — First-Expiry-First-Out visual highlights on inventory
- **Monthly snapshots** — Freeze inventory state for month-over-month comparison
- **Multi-warehouse support** — Chittagong, Gazipur, Jessore, Bogura (configurable)
- **Offline-first** — Works without internet via localStorage; syncs automatically when online
- **Cross-device sync** — All devices share a single Google Sheets backend

### 1.4 Default Credentials

| Role | Credential | Default Value |
|------|-----------|---------------|
| Admin | Login password | `9876` |
| Operator | 4-digit PIN | `1234` |
| Operator | Default warehouse | Chittagong |

> **Security Note:** Change default credentials immediately after first setup. PINs and passwords are configured in the Admin Panel under Settings.

---

## 2. System Architecture

### 2.1 Data Flow

```
Operator Device (PWA)                 Admin Panel (Desktop)              Google Sheets Backend
┌─────────────────────┐              ┌─────────────────────┐            ┌──────────────────────┐
│                     │              │                     │            │                      │
│  PIN Login          │              │  Password Login     │            │  transactions        │
│       ↓             │              │       ↓             │            │  inventory           │
│  Select Product     │   sync.js    │  Dashboard View     │  sync.js   │  snapshots           │
│  Enter Quantity     │◄────────────►│  Reports & Charts   │◄──────────►│  config              │
│  Receive/Dispatch   │  (REST API)  │  Settings Mgmt      │  (REST API)│  dashboard (QUERY)   │
│       ↓             │              │                     │            │                      │
│  localStorage       │              │  localStorage       │            │  Google Apps Script  │
│  (offline backup)   │              │  (cache)            │            │  (API layer)         │
└─────────────────────┘              └─────────────────────┘            └──────────────────────┘
```

### 2.2 Google Sheets Tab Structure

| Tab | Purpose | Key Columns |
|-----|---------|-------------|
| `transactions` | All count records | product, pack_size, production_month, expiry_month, quantity, type, operator, warehouse, client_timestamp, client_date, server_time |
| `inventory` | Computed current stock (server-maintained backup) | product, pack_size, production_month, expiry_month, quantity, warehouse |
| `snapshots` | Monthly inventory snapshots for MoM comparison | snapshot_month, product, pack_size, production_month, expiry_month, quantity, warehouse, age_months |
| `config` | System configuration and product list | key, value |
| `dashboard` | Auto-refreshing QUERY formulas (read-only) | Formulas referencing other tabs |

### 2.3 Sync Mechanism

- **Client-side inventory** is computed from transactions using `computeInventory()` in `sync.js`
- **Server-side inventory** is maintained as a backup by `updateInventoryFromTransactions()` in the Apps Script
- **Delta sync** — After initial full pull, subsequent syncs fetch only new transactions via `readSince` action
- **Auto-refresh** — Every 30 seconds (operator app) or 15 seconds (admin panel)
- **Offline resilience** — All transactions are saved to `localStorage` first; sync occurs when online

---

## 3. Roles and Responsibilities

### 3.1 Administrator

| Responsibility | Frequency |
|---------------|-----------|
| Configure operator PINs and warehouse assignments | As needed |
| Add/remove products from the master list | As needed |
| Monitor shelf-life status via Dashboard | Daily |
| Review and export monthly reports | Monthly |
| Capture inventory snapshots for MoM comparison | Monthly (1st of month) |
| Clear erroneous data (by warehouse, date range) | As needed |
| Manage warehouse list | As needed |
| Export data for external reporting | As needed |

### 3.2 Warehouse Operator

| Responsibility | Frequency |
|---------------|-----------|
| Log in via PIN | Each shift |
| Count received stock (Receive) | Each receipt |
| Count dispatched stock (Dispatch) | Each dispatch |
| Adjust inventory when discrepancies found | As needed |
| Verify inventory on the Inventory screen | Each shift |
| Check expiring stock on the Expiry screen | Daily |

---

## 4. Initial System Setup

### 4.1 Google Sheets Backend Setup

1. Create a new Google Sheet named **"Syngenta Shelf Life Tracking"**
2. Open **Extensions → Apps Script**
3. Delete any existing code in `Code.gs`
4. Paste the contents of `database/google-apps-script.gs`
5. **Run `setupSheet()`** from the Run menu (authorise when prompted)
   - This creates all 4 tabs (`transactions`, `inventory`, `snapshots`, `config`) with headers
   - Seeds default configuration and warehouse list
   - Builds the dashboard QUERY formulas
6. **Deploy as Web App:**
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - Copy the **deployment URL**
7. Paste the deployment URL into `apps/operator/sync.js` (line 4: `APPS_SCRIPT_URL`)
8. Paste the same URL into `apps/admin/admin-app.js` (search for `APPS_SCRIPT_URL`)

### 4.2 GitHub Pages Deployment

1. Push the repository to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch**
4. Branch: **master**, folder: **/(root)**
5. Save — the app will be live at `https://<username>.github.io/<repo>/apps/operator/`

### 4.3 First-Time Admin Configuration

1. Open the Admin Panel URL
2. Login with password `9876`
3. Navigate to **Settings** (gear icon in sidebar)
4. **Add operator PINs:** Enter name, 4-digit PIN, and assign warehouse
5. **Configure warehouses:** Add/remove warehouse locations as needed
6. **Set year ranges:**
   - Expiry Years: range shown to operators for expiry selection (default: 2025–2030)
   - Production Years: year digits for batch codes (default: 5–6 = 2025–2026)
7. **Verify products:** Navigate to Products screen to review the 71 built-in SKUs

---

## 5. Admin Panel Operations

### 5.1 Dashboard

The Dashboard is the landing screen and provides an at-a-glance overview.

**Stat Cards (clickable for drilldown):**
| Card | Meaning | Action |
|------|---------|--------|
| Critical (≤3mo) | Products expiring within 3 months | Click to see details — prioritize dispatch |
| Warning (4–6mo) | Products expiring in 4–6 months | Click to see details — plan movement |
| Notice (7–12mo) | Products expiring in 7–12 months | Click to see details — monitor |
| Distant (13–18mo) | Products expiring in 13–18 months | Click to see details — no action needed |

**Charts:**
- **Top Products by Quantity** — Horizontal bar chart of top 10 products
- **Stock by Batch Code** — Bar chart of stock grouped by production month code
- **Expiry Distribution** — Doughnut chart showing expiry bucket proportions
- **Daily Counting Activity** — Bar chart of transaction counts over last 30 days
- **Operator Activity** — Per-operator totals and today's count

**Filters:**
- Use year pills and month dropdown above charts to filter by time period
- Use warehouse chips in the top bar to filter all data by warehouse(s)

### 5.2 Shelf Life Report

1. Navigate to **Shelf Life** (warning triangle icon)
2. View the table showing all products with expiry timelines
3. Use filter buttons: **All | Critical | Warning | Notice | Distant**
4. Export to CSV using the **Export CSV** button

### 5.3 Monthly Report

1. Navigate to **Monthly Report** (bar chart icon)
2. **Capture Snapshot:** Click **Capture Snapshot** to freeze current inventory state
   - This saves a copy of all current inventory to the `snapshots` tab
   - Best done on the 1st of each month or before major inventory changes
3. **View Comparison:** The report automatically compares Last Month vs Current Month
4. **KPIs displayed:**
   - Total Count (items)
   - Expired Stock
   - ≤6 Months
   - 7–12 Months
   - Delta values and % change
5. **Bucket tabs:** Expired | ≤6 Months | 7–12 Months — each shows product-level comparison

### 5.4 Inventory View

1. Navigate to **Inventory** (list icon)
2. Full inventory table grouped by product, sorted by production month
3. FEFO highlights (yellow background) on older batches with lower quantity
4. Filter by warehouse using the top-bar chips
5. Search by product name using the search bar

### 5.5 Activity Log

1. Navigate to **Activity Log** (clock icon)
2. View all transactions with type filter: **All | Received | Dispatched | Adjusted**
3. Filter by warehouse
4. Export to CSV

### 5.6 Product Management

1. Navigate to **Products** (box icon)
2. **Add Product:** Click **+ Add Product**
   - Enter Product Name, Pack Size, select Prefix (SCH/SPL/JAK/EC/BG/DKC/RB/BWL/None), enter AGI Code
3. **Edit Product:** Click the edit icon on any row
4. **Delete Product:** Click the delete icon (confirm when prompted)
5. Product changes are pushed to operator devices on next sync

### 5.7 Settings Management

Navigate to **Settings** (gear icon) to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Operator PINs | Name + 4-digit PIN + warehouse assignment | Default / 1234 / Chittagong |
| Expiry Years | Year range for operator expiry selector | 2025–2030 |
| Production Years | Year digits for batch code | 5–6 (2025–2026) |
| Warehouses | Warehouse location names | Chittagong, Gazipur, Jessore, Bogura |

**Danger Zone operations (use with caution):**

| Action | Description |
|--------|-------------|
| Clear Warehouse Data | Removes all transactions and inventory for a specific warehouse |
| Clear Date Range | Removes transactions in a date range, rebuilds inventory |
| Reset to Defaults | Restores factory config (PINs, warehouses, year ranges) |
| Delete Local Data | Clears the admin panel's local cache |
| Clear All Cloud Data | **DESTROYS ALL DATA** — use only for fresh start |

### 5.8 Data Export

All screens offer CSV export. Exports are saved as `.csv` files and can be opened in Excel/Google Sheets.

| Screen | Export Button | Contents |
|--------|--------------|----------|
| Shelf Life | Export CSV | Expiry report filtered by current view |
| Dashboard | Export CSV | Dashboard summary data |
| Inventory | Export CSV | Full inventory list |
| Activity Log | Export CSV | Transaction history |
| Products | Export CSV | Product master list |
| Monthly Report | Export CSV | MoM comparison data |

---

## 6. Operator App Operations

### 6.1 Login

1. Open the Operator App URL on a mobile device
2. Enter the 4-digit PIN using the on-screen keypad
3. The operator name and warehouse are automatically determined by the PIN
4. The app loads instantly from local cache; background sync begins immediately

### 6.2 Counting Products (Receive / Dispatch / Adjust)

1. **Select Product:** Browse or search the product list
   - Use the **alphabet sidebar** (A–Z) to jump to products by first letter
   - Use the **search bar** to filter by product name
   - Use the **dropdown filter** to filter by specific product group
2. **Select Production Month:**
   - Tap the **year digit** (e.g., `5` = 2025, `6` = 2026)
   - Tap the **month letter** (A = Jan, B = Feb, ... L = Dec)
3. **Select Expiry Month:**
   - Tap the **full year** (2025–2030)
   - Tap the **month name** (Jan–Dec)
4. **Enter Quantity:**
   - Tap **quantity display** to open the numpad, enter number, confirm
   - OR use the **Stack Calculator** for large counts:
     - Enter Products per Layer
     - Enter Height (Layers)
     - Enter Number of Stacks
     - Enter Loose Cartons
     - Tap **Apply** to transfer the calculated total
5. **Submit:**
   - Tap **Receive +** to add stock (green)
   - Tap **Dispatch −** to remove stock (red)
   - Tap **Set** to set an exact quantity (black, requires confirmation)

### 6.3 Inventory Screen

1. Tap **Inventory** in the bottom navigation bar
2. View all products in the current warehouse, grouped by product name
3. **FEFO Highlights:** Older batches with lower quantity are highlighted in yellow
4. Use the **search bar** to filter by product name or pack size

### 6.4 Expiring Soon Screen

1. Tap **Expiry** in the bottom navigation bar
2. View all products expiring within 12 months
3. Color-coded by urgency:
   - **Red:** ≤3 months (Critical)
   - **Orange:** 4–6 months (Warning)
   - **Amber:** 7–12 months (Notice)

### 6.5 Logout

1. Tap **Logout** in the top-right corner of the product list screen
2. The app returns to the PIN login screen
3. Local data is preserved for the next login

---

## 7. Data Flow and Sync

### 7.1 How Data Travels

```
Step 1: Operator enters count
        ↓
Step 2: Saved to localStorage['operator-data']
        ↓ (immediately)
Step 3: Transaction pushed to Google Sheets (batchInsert)
        ↓
Step 4: Server-side inventory updated in 'inventory' tab
        ↓
Step 5: Other devices pull updated data (readSince / read)
        ↓
Step 6: Admin dashboard refreshes with new data
```

### 7.2 Offline Behaviour

- All transactions are saved to `localStorage` even without internet
- When connectivity is restored, `syncAll()` pushes pending transactions
- `pullAll()` fetches new transactions from other devices
- The operator app remains fully functional offline

### 7.3 Multi-Device Sync

- Each device independently syncs with the Google Sheets backend
- **Delta sync:** After the initial full pull, only new transactions are fetched
- **Conflict resolution:** Transactions are deduplicated by `client_timestamp`; the latest write wins
- **Auto-refresh:** Every 30 seconds (operator) / 15 seconds (admin)

### 7.4 Sync Status Indicator (Admin Panel)

| Indicator | Meaning |
|-----------|---------|
| Green dot + "Synced · N txs · Xs ago" | Successfully connected and synced |
| Red dot + "Sync failed · error message" | Connection error — data may be stale |
| Yellow dot + "Connecting..." | Sync in progress |

---

## 8. Warehouse Management

### 8.1 Default Warehouses

| # | Warehouse Name |
|---|---------------|
| 1 | Chittagong |
| 2 | Gazipur |
| 3 | Jessore |
| 4 | Bogura |

### 8.2 Adding a Warehouse

1. Open Admin Panel → **Settings**
2. Under **Warehouses**, type the new warehouse name
3. Click **Add**
4. The warehouse becomes immediately available for operator PIN assignment

### 8.3 Assigning Operators to Warehouses

1. Open Admin Panel → **Settings**
2. Under **Operator PINs**, edit the operator's entry
3. Select the warehouse from the dropdown
4. Click **Save**

> **Important:** Each operator is assigned to exactly one warehouse. Operators can only count and view inventory for their assigned warehouse.

### 8.4 Warehouse Data Isolation

- The operator app filters all inventory views by the logged-in operator's warehouse
- The admin panel can filter by any warehouse using the top-bar warehouse chips
- Transactions are tagged with the operator's warehouse at time of entry

---

## 9. Monthly Reporting and Snapshots

### 9.1 Snapshot Capture

**When:** On the 1st of each month, or before any major inventory change.

1. Open Admin Panel → **Monthly Report**
2. Click **Capture Snapshot**
3. Current inventory state is saved to the `snapshots` tab with a timestamp
4. The snapshot includes: product, pack size, production month, expiry month, quantity, warehouse, and age in months

### 9.2 Month-over-Month Comparison

After capturing two snapshots (previous month and current month):

1. Open Admin Panel → **Monthly Report**
2. The report shows:
   - **KPI cards:** Total Count, Expired Stock, ≤6 Months, 7–12 Months
   - **Delta values:** Absolute and percentage change from last month
   - **Color coding:** Green for improvement (reduction in expired/expiring), Red for deterioration
3. Navigate between **Expired | ≤6 Months | 7–12 Months** tabs for detail

### 9.3 Report Interpretation

| Metric | Good (Green) | Bad (Red) |
|--------|-------------|-----------|
| Expired Stock Delta | Negative (decreasing) | Positive (increasing) |
| ≤6 Months Delta | Negative (decreasing) | Positive (increasing) |
| 7–12 Months Delta | Negative or stable | Large increase |

---

## 10. Data Management and Safety

### 10.1 Data Redundancy

The system maintains data in three layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Primary** | Google Sheets (`transactions` tab) | Authoritative source of truth |
| **Server backup** | Google Sheets (`inventory` tab) | Server-computed inventory backup for dashboard |
| **Client cache** | `localStorage` on each device | Offline access + fast loading |

### 10.2 Backup Procedures

1. **Weekly CSV Export:** Admin → Activity Log → Export CSV → save to shared drive
2. **Monthly Snapshot:** Admin → Monthly Report → Capture Snapshot
3. **Full Sheet Backup:** Download the Google Sheet as `.xlsx` via File → Download

### 10.3 Data Recovery

| Scenario | Recovery Method |
|----------|----------------|
| Operator lost local data | App re-syncs from Google Sheets on next login |
| Single warehouse corrupted | Admin → Settings → Clear Warehouse Data → re-enter transactions |
| Date range corrupted | Admin → Settings → Clear Date Range → re-enter affected transactions |
| Complete data loss | Re-deploy Apps Script, run `setupSheet()`, operators re-enter all transactions |
| Wrong transactions entered | Admin → Activity Log → identify error → operator enters Adjustment to correct |

### 10.4 Data Retention

- **Transactions:** Permanent (never auto-deleted)
- **Inventory:** Computed from transactions (can be rebuilt)
- **Snapshots:** Permanent (each capture is a historical record)
- **Config:** Persistent (survives clear operations unless "Reset to Defaults" is used)

---

## 11. Troubleshooting

### 11.1 Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| PIN login rejected | Wrong PIN or config not synced | Verify PIN in Admin → Settings. Reload app to re-sync config. |
| App shows "Loading..." forever | Apps Script URL incorrect or deployment expired | Check `sync.js` for correct URL. Redeploy Apps Script. |
| Sync status shows red dot | Network issue or Apps Script error | Check internet connection. Open Apps Script URL in browser to test. |
| Inventory numbers don't match | Multiple devices offline simultaneously | All devices online → wait for sync → verify. Use Adjustment to correct. |
| Expiry dates show raw ISO strings | Google Sheets auto-conversion | Run `setupSheet()` after deploying updated Apps Script code. |
| Dashboard shows stale data | Admin auto-refresh paused (tab hidden) | Click the browser tab to trigger refresh. |
| Operator app is slow | Large transaction sheet | Delta sync should help. Clear old data via Admin → Settings if needed. |
| "No data" on dashboard | Inventory tab empty | Ensure transactions exist. Run `setupSheet()` to rebuild dashboard formulas. |

### 11.2 Apps Script Redeployment

If the backend needs updating:

1. Open Google Sheet → Extensions → Apps Script
2. Replace code with updated `google-apps-script.gs`
3. Click **Deploy → Manage deployments → Edit** (pencil icon)
4. New version → Deploy
5. Copy the new URL if changed → update `sync.js` and `admin-app.js`
6. Run `setupSheet()` to rebuild tabs and formulas

### 11.3 Browser Compatibility

| Browser | Platform | Status |
|---------|----------|--------|
| Chrome 90+ | Android | Fully supported |
| Safari 14+ | iOS | Fully supported |
| Edge 90+ | Windows | Fully supported (admin panel recommended) |
| Firefox 90+ | Any | Supported |

### 11.4 Performance Tips

- **Operator app:** Login is instant from cache — sync runs in background
- **Admin panel:** Keep the browser tab open for live auto-refresh
- **Multiple devices:** Each device syncs independently; 30-second intervals prevent overload
- **Large datasets:** Use warehouse filters to reduce data scope on admin panel

---

## Appendix A — Product Master List

Total: **71 products** across 9 prefix groups.

| Prefix | Products | Division |
|--------|----------|----------|
| **SCH** | Actara (25g, 140g), Amistar (50ml, 100ml, 500ml), Ampligo (100g), Arrivo (100ml, 250ml), Azoxystrobin (100ml), Base (100ml), Binagar (100ml),Calix (100ml), Captan (100g, 500g), Carbendazim (100ml, 500ml), Champion (100ml, 500ml), Coragen (100ml), Cypermethrin (100ml, 500ml), Decis (100ml, 500ml), Dictator (100ml), Duel (100ml), Folicur (100ml, 500ml), Fundazol (100ml), Gunner (100ml), Karate (50ml, 100ml, 500ml), Leon (100ml), Mikal (100g), Monceren (100g), Nativo (100g), Opera (100ml), Ortiva (100ml), Paracetamol (100ml), Raxil (100g), Regent (100ml), Score (50ml, 100ml, 500ml), Switch (100g), Synera (100ml), Thiovit (1kg, 2kg), Topas (100ml), Trip (100ml), Vertimec (50ml, 100ml, 500ml), Vizura (100ml), Voliam (100ml), Zebra (100ml) | Crop Protection |
| **SPL** | Cruiser 20g | Professional Lines |
| **JAK** | Atresia 50ml | Jakob |
| **EC** | Caliber 100g, 500g | EC |
| **BG** | Gayte 100g | BG |
| **DKC** | Jazz 100g, 500g, 1kg | DKC |
| **RB** | Laser 25g | RB |
| **BWL** | Protozim 50ml, 100ml, 500ml | BWL |
| *(none)* | PJ-16, XP-16 | Generic |

---

## Appendix B — Configuration Reference

### Default Configuration JSON

```json
{
  "operatorPins": [
    { "name": "Default", "pin": "1234", "warehouse": "Chittagong" }
  ],
  "expiryYears": { "start": 2025, "end": 2030 },
  "prodYears": { "start": 5, "end": 6 },
  "warehouses": ["Chittagong", "Gazipur", "Jessore", "Bogura"]
}
```

### Google Sheets Tab Headers

| Tab | Column A | B | C | D | E | F | G | H | I | J | K |
|-----|----------|---|---|---|---|---|---|---|---|---|---|
| transactions | product | pack_size | production_month | expiry_month | quantity | type | operator | warehouse | client_timestamp | client_date | server_time |
| inventory | product | pack_size | production_month | expiry_month | quantity | warehouse | | | | | |
| snapshots | snapshot_month | product | pack_size | production_month | expiry_month | quantity | warehouse | age_months | | | |
| config | key | value | | | | | | | | | |

### Transaction Types

| Type | Description | Inventory Effect |
|------|-------------|-----------------|
| `receive` | Stock received into warehouse | quantity += entered_qty |
| `dispatch` | Stock dispatched from warehouse | quantity -= entered_qty (min 0) |
| `adjustment` | Set inventory to exact count | quantity = entered_qty |

---

## Appendix C — Color and Status Legend

### Expiry Status Buckets

| Status | Months Remaining | Color | Hex | Background |
|--------|-----------------|-------|-----|------------|
| **Expired** | < 0 | Red | `#DC2626` | `#fce8e6` |
| **Critical** | 0–3 months | Red | `#DC2626` | `#fce8e6` |
| **Warning** | 4–6 months | Orange | `#F97316` | `#fff3e0` |
| **Notice** | 7–12 months | Amber | `#d97706` | `#fef7e0` |
| **Distant** | 13–18 months | Blue | `#2563EB` | — |
| **Future** | > 18 months | Gray | `#9CA3AF` | — |

### UI Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary (Syngenta Green) | Green | `#00843D` |
| Dark Green | Dark Green | `#005A2B` |
| Success | Green | `#16A34A` |
| Danger / Critical | Red | `#DC2626` |
| Warning | Orange | `#F97316` |
| Caution | Yellow | `#FACC15` |
| Page Background | Light Gray | `#F5F6F8` |
| Cards / Surfaces | White | `#FFFFFF` |
| Primary Text | Dark | `#1F2933` |
| Muted Text | Gray | `#99A5B0` |

### Transaction Type Indicators

| Type | Symbol | Color |
|------|--------|-------|
| Receive | `+` | Green |
| Dispatch | `−` | Red |
| Adjustment | `•` | Dark Gray |

### FEFO Highlight

- **Background:** `#FEF3C7` (light yellow)
- **Meaning:** Older batch has lower quantity than a newer batch — prioritize dispatching the older batch first

---

*End of Document*
*Document maintained by: System Administrator*
*Review schedule: Quarterly or upon system upgrade*
