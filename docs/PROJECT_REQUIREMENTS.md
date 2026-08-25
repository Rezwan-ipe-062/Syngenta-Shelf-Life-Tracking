# Syngenta Bangladesh — Shelf Life Tracking

## Project Requirements & System Design Document

---

## 1. Project Overview

Syngenta Bangladesh manages the distribution of agricultural products (insecticides, fungicides, herbicides, seeds) across **4 warehouses** in Bangladesh. Each warehouse holds Finished Goods (FG) inventory — stacks of product cartons identified by batch codes and expiry dates.

The goal is to replace a manual, Excel-based monthly inventory counting and compilation process with a **digital system** consisting of two linked applications: a mobile app for warehouse assistants and a dashboard for the Warehouse Officer.

### Key Objectives

- Standardize inventory counting across all 4 warehouses
- Enforce FEFO (First Expiry, First Out) dispatch discipline
- Alert warehouse staff when FEFO rules are violated
- Track products expiring within 12 months
- Provide the Warehouse Officer with a real-time consolidated dashboard
- Eliminate manual Excel compilation from 4 separate warehouses

---

## 2. The Problem — Current Manual Process

### 2.1 Current Workflow (Monthly)

At the end of every month, the following happens:

```
Warehouse Assistant (phone in hand, walking through warehouse)
        |
        v
1. Goes to a stack of product
2. Reads the batch code printed on the carton (e.g., SCH6A123)
3. Reads the expiry date from the label (e.g., April 2027)
4. Counts the number of cartons in the stack
5. Writes it down on paper
6. Moves to the next stack
7. Repeats for ALL stacks in the warehouse
        |
        v
Hands paper to Warehouse Officer
        |
        v
8. Officer manually types data into Excel (Warehouse 1 sheet)
9. Repeat for all 4 warehouses
10. Officer manually compiles 4 sheets into a single dashboard
11. Dashboard categorizes products by expiry urgency
```

### 2.2 Pain Points

| Problem | Impact |
|---------|--------|
| Paper-based recording | Data can be lost, damaged, or illegible |
| Manual Excel entry | Typos, transcription errors |
| 4 separate Excel files | Time-consuming compilation, version conflicts |
| No real-time visibility | Officer sees data days after counting |
| No FEFO enforcement | Dispatchers pick whatever batch is convenient, leading to expiry losses |
| No alerting system | Products quietly expire in warehouse — financial loss |
| No operator accountability | Can't trace who entered which data |
| Inconsistent formats | Different warehouses may use different column names or formats |

### 2.3 Financial Impact

When FEFO is not followed, older batches sit in the warehouse while newer batches get dispatched. Eventually the older batches expire and must be written off — a direct financial loss to Syngenta Bangladesh.

---

## 3. Batch Code System

### 3.1 Format

Every product carton has a batch code printed on it. The format encodes the **production month**:

```
PREFIX + YEAR_DIGIT + MONTH_LETTER + BATCH_SERIAL
```

| Component | Description | Example |
|-----------|-------------|---------|
| **Prefix** | Product line identifier | `SCH`, `DKC`, `JAK`, `SPL`, `EC`, `BG`, `RB`, `BWL` |
| **Year Digit** | Last digit of production year | `5` = 2025, `6` = 2026, `7` = 2027 |
| **Month Letter** | Production month (A=Jan … L=Dec) | `A`=Jan, `B`=Feb, `C`=Mar, `D`=Apr, `E`=May, `F`=Jun, `G`=Jul, `H`=Aug, `I`=Sep, `J`=Oct, `K`=Nov, `L`=Dec |
| **Batch Serial** | Unique batch number within that month | `123`, `001`, `456` |

### 3.2 Month Letter Encoding

| Letter | Month | Letter | Month |
|--------|-------|--------|-------|
| A | January | G | July |
| B | February | H | August |
| C | March | I | September |
| D | April | J | October |
| E | May | K | November |
| F | June | L | December |

### 3.3 Worked Examples

**Example 1:** `SCH6A123`
- Prefix: `SCH` (Syngenta product line)
- Year digit: `6` → produced in **2026**
- Month letter: `A` → produced in **January**
- Batch serial: `123`
- **Production month: January 2026**

**Example 2:** `SCH5F045`
- Prefix: `SCH`
- Year digit: `5` → produced in **2025**
- Month letter: `F` → produced in **June**
- Batch serial: `045`
- **Production month: June 2025**

**Example 3:** `DKC5A012`
- Prefix: `DKC` (for Jazz products)
- Year digit: `5` → produced in **2025**
- Month letter: `A` → produced in **January**
- Batch serial: `012`
- **Production month: January 2025**

**Example 4:** `SCH6L999`
- Prefix: `SCH`
- Year digit: `6` → produced in **2026**
- Month letter: `L` → produced in **December**
- Batch serial: `999`
- **Production month: December 2026**

### 3.4 Expiry Date

The expiry date is generally **2 years after the production month**. However, the exact expiry month varies slightly per product, so the Warehouse Assistant reads the **actual expiry date printed on the label** — it is not calculated from the batch code.

| Production Month | Approximate Expiry |
|------------------|--------------------|
| January 2026 (6A) | ~January 2028 |
| June 2026 (6F) | ~June 2028 |
| December 2026 (6L) | ~December 2028 |

---

## 4. FEFO Principle (First Expiry, First Out)

### 4.1 What is FEFO?

FEFO means **dispatching the oldest stock first** — products that were produced earliest should be shipped out first, because they will expire earliest.

Since expiry is tied to production month (approximately 2 years after production), **FEFO dispatch is based on production month** — older production months get dispatched first.

### 4.2 Why Production Month = Expiry Proxy

In this warehouse, the shelf life is generally 2 years for all products. So:

- Product produced in **January 2026 (6A)** → expires ~January 2028
- Product produced in **April 2026 (6D)** → expires ~April 2028

The product from January 2026 will expire **3 months earlier** than the one from April 2026. Therefore, January 2026 stock should be dispatched **first**.

### 4.3 Same Product, Different Batches

Multiple batches can share the same production month code. They are treated as **one group** for FEFO purposes.

**Example:**

| Product | Pack | Batch Code | Production Month | Quantity |
|---------|------|------------|------------------|----------|
| Actara | 5g | SCH6A123 | 6A (Jan 2026) | 300 |
| Actara | 5g | SCH6A124 | 6A (Jan 2026) | 200 |
| Actara | 5g | SCH6D125 | 6D (Apr 2026) | 100 |

Even though batch SCH6A123 and SCH6A124 have different batch numbers, they are the **same production month (6A)**. Combined inventory for Actara 5g, code 6A = **300 + 200 = 500 cartons**.

### 4.4 Dispatch Priority

For dispatch, the priority is:

1. **First:** Actara 5g, code 6A (500 cartons) — oldest production month
2. **Then:** Actara 5g, code 6D (100 cartons) — newer production month

If code 6D gets dispatched before code 6A is depleted, that is a **FEFO violation** — the system must alert the warehouse assistant.

### 4.5 FEFO Violation Example

| Product | Pack | Code | Qty | Status |
|---------|------|------|-----|--------|
| Actara | 5g | 6A | 300 | Oldest — should go first |
| Actara | 5g | 6D | 100 | Newer — should go later |

If the warehouse dispatches 100 cartons from code 6D while code 6A still has 300 cartons remaining, that is a FEFO violation. The system should flag this with a **yellow highlight** on the inventory list.

---

## 5. The 12-Month Expiry Report

### 5.1 What is it?

At the end of each month, the Warehouse Assistant must also identify which SKUs have an **expiry date within 12 months** from today. This list is handed to the Warehouse Officer so action can be taken — prioritized dispatch, promotions, or inter-warehouse transfers.

### 5.2 Color Coding

Products are categorized by urgency based on months remaining until expiry:

| Category | Months Remaining | Color | Action |
|----------|------------------|-------|--------|
| Critical | ≤ 3 months | Red | Immediate dispatch required |
| Warning | 4–6 months | Amber | Plan for dispatch soon |
| Notice | 7–12 months | Yellow | Monitor, plan ahead |
| Safe | > 12 months | — | No action needed (not shown in report) |

### 5.3 Compiling from 4 Warehouses

Currently, 4 separate Excel files from 4 warehouses are manually compiled. The dashboard should consolidate:

| Warehouse | Critical (≤6M) | Warning (7-12M) | Notice (13-18M) |
|-----------|-----------------|------------------|------------------|
| Chittagong | 3 SKUs | 5 SKUs | 8 SKUs |
| Gazipur | 2 SKUs | 4 SKUs | 6 SKUs |
| Jessore | 1 SKU | 3 SKUs | 5 SKUs |
| Bogura | 4 SKUs | 2 SKUs | 7 SKUs |
| **Total** | **10 SKUs** | **14 SKUs** | **26 SKUs** |

---

## 6. Proposed Solution — Overview

### 6.1 Two Linked Applications

| Application | Device | User | Purpose |
|-------------|--------|------|---------|
| **Operator App** | Mobile phone (PWA) | Warehouse Assistant | Monthly counting, receive/dispatch, inventory view |
| **Admin Dashboard** | Laptop (web app) | Warehouse Officer | Dashboard, reports, product management, settings |

### 6.2 Data Flow

```
Warehouse Assistant (phone)
    |
    | Counts inventory using Operator App
    | Records Receive / Dispatch transactions
    | Views inventory with FEFO highlighting
    | Views 12M expiry report
    |
    ├──→ Data saved to localStorage (offline-first)
    |
    v
Supabase (PostgreSQL cloud)
    |
    ├──↕── Operator App syncs pending data when online
    |
    |──↕── Admin Dashboard reads/writes via Supabase
    |
    v
Warehouse Officer (laptop)
    |
    | Opens Admin Dashboard (PIN-gated)
    | Sees consolidated data from all 4 warehouses
    | Manages products (synced to operator app)
    | Manages settings and operator PINs
    | Exports Excel reports
    | Clears cloud data via RPC function
    |
    v
Dashboard / Reports / Excel Export
```

**Key Principles:**
- **Admin is authoritative:** Products added/edited/deleted in Admin are synced to Supabase `config` table as `product-list`. Operator app reads this on startup and overrides its hardcoded catalog.
- **Multi-operator at same warehouse:** All operators at the same warehouse share inventory via Supabase. Quantities are re-aggregated per `(product, packSize, productionMonth, warehouse)` — they sum, not overwrite.
- **AGI codes:** 5-digit numeric IDs auto-derived from product+pack lookup. Displayed in admin only (Product table, Activity Log). The warehouse assistant never sees or enters AGI codes.

### 6.3 Technology Stack

- **Frontend:** HTML, CSS, JavaScript (no framework — simple, fast, no build step)
- **Storage:** localStorage (browser-based, works offline)
- **Cloud Sync:** Supabase (PostgreSQL via anon key, RLS policies for public access)
- **PWA:** Installable to home screen, works without internet
- **Design:** Syngenta green (#00843D), Inter font, SVG icons

---

## 7. System Architecture

### 7.1 File Structure

```
12M Inventory Tracking Folder/
├── apps/
│   ├── admin/                     ← Warehouse Officer Dashboard
│   │   ├── admin-panel.html       ← Single-page admin dashboard
│   │   ├── admin-app.js           ← Admin application logic
│   │   └── admin-style.css        ← Admin dashboard styles
│   └── operator/                  ← Warehouse Assistant PWA
│       ├── index.html             ← Main HTML (6 screens)
│       ├── style.css              ← Syngenta-branded mobile CSS
│       ├── app.js                 ← All application logic
│       ├── products.js            ← 69 SKU product catalog
│       ├── syncManager.js         ← Offline-first Google Sheets sync layer
│       └── manifest.json          ← PWA manifest
├── database/
│   ├── google-apps-script.gs      ← Apps Script backend (paste into Google Sheet)
│   ├── GOOGLE_SHEET_SETUP.md      ← Step-by-step setup guide
│   └── legacy/                    ← Archived SQL scripts (for reference)
│       ├── init_tables.sql        ← (superseded by supabase-schema.sql)
│       ├── migration_add_warehouse.sql
│       └── clear_all_data.sql
├── docs/
│   ├── PROJECT_REQUIREMENTS.md    ← This document
│   ├── MEMORY.md                  ← Development history
│   └── planning/                  ← Early design drafts
├── reference/                     ← Reference documents
│   ├── 12_Month_Shelf_Life_Data.md
│   └── System_Export_Data.md
├── .github/workflows/             ← CI/CD (GitHub Pages)
├── README.md                      ← Project overview & setup guide
└── .gitignore
```

### 7.2 Data Layer Architecture

**Three storage layers work together:**

1. **localStorage (`operator-data`)** — Primary data store for the operator app. Contains `transactions[]` and `inventory[]` arrays. Works fully offline.
2. **localStorage (`shelf-life-config`)** — Shared configuration written by admin, read by operator. Contains operator PINs, warehouses, year ranges.
3. **Supabase (PostgreSQL cloud)** — Central sync point. Tables: `transactions`, `inventory`, `config`. Operator app syncs pending data when online. Admin app reads/writes directly via Supabase JS client.

**Sync Flow:**
- Operator app marks new transactions as `sync_status: 'pending'`
- On next network availability, `syncManager.syncAll()` pushes pending records to Supabase
- `syncManager.pullFromSupabase()` downloads all cloud data, merges with local pending items
- Admin app reads/writes directly — no pending queue needed
- Products managed in Admin are synced to Supabase `config` table as key `product-list`; operator reads this on init

---

## 8. Warehouse Operator App — Detailed Design

### 8.1 Screen 1: PIN Login

**Purpose:** Authenticate the Warehouse Assistant. Each assistant has a unique 4-digit PIN.

**Flow:**
1. Assistant opens the app on their phone
2. Sees a green login screen with 4 blank dots
3. Types their 4-digit PIN on the number pad
4. On the 4th digit, the app validates the PIN
5. If valid → navigates to Product List
6. If invalid → dots flash red for 0.5 seconds, then reset

**PIN Configuration:**

| Operator Name | PIN |
|---------------|-----|
| Karim | 1234 |
| Rahim | 5678 |
| Jamal | 9012 |

**Example:**
- Karim opens the app, types `1`, `2`, `3`, `4`
- App checks: does `1234` match any configured PIN?
- Yes → matches "Karim" → navigates to Product List

**Design:**
- Green gradient background (#00843D to #005A2B)
- White PIN dots (16px circles), fill white when digit entered
- Circular number pad (72px buttons), white on green
- Backspace button (⌫) to correct mistakes

---

### 8.2 Screen 2: Product List

**Purpose:** Browse and select a product to count.

**Features:**

#### 8.2.1 Product List
All 69 SKUs displayed as a scrollable list. Each item shows:
- Product name (e.g., "Karate 50ml")
- Prefix badge (e.g., "SCH")

Products are grouped alphabetically with letter separator headers (A, B, C…).

#### 8.2.2 Alphabet Quick-Jump
A vertical bar on the right edge with letters A–Z. Tap a letter to scroll to that section. Letters with no products are greyed out.

**Example:**
- Tap "K" → list scrolls to the "K" section showing Karate 50ml, Karate 100ml, Karate 500ml

#### 8.2.3 Search Bar
Type to filter products by name or pack size. Matching is prefix-based (starts with).

**Example:**
- Type "kar" → shows all Karate products
- Type "100" → shows all products with pack size starting with "100" (Amistar 100ml, Score 100ml, etc.)

#### 8.2.4 Dropdown Filter
Select a specific product name from a dropdown to see only its pack sizes.

**Example:**
- Select "Karate" from dropdown → shows Karate 50ml, Karate 100ml, Karate 500ml only

#### 8.2.5 Logout Button
Tapping Logout clears the PIN and returns to the login screen.

**Example Interaction:**
1. Karim sees the product list
2. Types "score" in the search bar
3. List filters to show: Score 50ml, Score 100ml, Score 500ml
4. Taps "Score 50ml"
5. Navigates to Count Screen with "Score 50ml" pre-filled

---

### 8.3 Screen 3: Count Screen

**Purpose:** The main working screen where the assistant records inventory counts.

This is the most important screen. It has 4 sections:

#### 8.3.1 Production Month Selection

Two-step selection:

**Step 1 — Select Year Digit:**
Buttons show single digits (e.g., "5" for 2025, "6" for 2026).

**Step 2 — Select Month Letter:**
After selecting the year, a grid of month buttons appears: A, B, C, D, E, F, G, H, I, J, K, L, Other.

**Example:**
- Assistant taps "6" (year 2026)
- Month buttons appear
- Assistant taps "F" (June)
- Display shows: "Production Month: 6F"

#### 8.3.2 Expiry Month Selection

Two-step selection:

**Step 1 — Select Expiry Year:**
Buttons show full years: 2025, 2026, 2027, 2028, 2029, 2030.

**Step 2 — Select Expiry Month:**
After selecting the year, a grid of month buttons appears: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec.

**Example:**
- Assistant taps "2028" (expiry year)
- Month buttons appear
- Assistant taps "Jun" (June)
- Display shows: "Expiry: Jun 2028"

#### 8.3.3 Quantity Entry

**Option A — Direct Entry:**
1. Tap the large green quantity display (shows "0")
2. Numpad overlay slides up from bottom
3. Type the quantity (e.g., `367`)
4. Tap "Done"
5. Green display now shows "367"

**Option B — Stack Calculator:**
1. Tap "Stack Calculator" to expand
2. Enter values in 4 fields (each opens numpad):
   - **Products per Layer** — cartons in one layer (e.g., 24)
   - **Height (Layers)** — layers tall (e.g., 5)
   - **Number of Stacks** — identical stacks (e.g., 3)
   - **Loose** — loose cartons (e.g., 7)
3. Formula: `(perLayer × height) × stacks + loose`
4. Result shown: `(24 × 5) × 3 + 7 = 367`
5. Tap "Use This Value" → fills quantity as 367

**Stack Calculator Worked Example:**

The assistant is counting a stack of Karate 50ml:
- He counts 24 cartons in one layer
- The stack is 5 layers tall
- There are 3 identical stacks side by side
- There are 7 loose cartons next to the stacks

Calculation:
```
Products per Layer: 24
Height (Layers):    5
Number of Stacks:   3
Loose:              7

= (24 × 5) × 3 + 7
= 120 × 3 + 7
= 360 + 7
= 367 cartons
```

The assistant taps "Use This Value" and the quantity shows 367.

#### 8.3.4 Receive / Dispatch Buttons

Two buttons below the quantity display:

- **"Receive +"** — green, saves as an incoming stock addition
- **"Dispatch −"** — red, saves as an outgoing stock removal

**How it works:**
1. Assistant sets the quantity (e.g., 367)
2. Taps "Receive +" or "Dispatch −"
3. App validates: is production month selected? Is expiry month selected? Is quantity > 0?
4. If valid → saves transaction, updates inventory, shows confirmation screen
5. If invalid → shows error (e.g., "Select production month first")

**Transaction Record:**

```json
{
  "product": "Karate",
  "packSize": "50ml",
  "productionMonth": "6F",
  "expiryMonth": "Jun 2028",
  "quantity": 367,
  "type": "receive",
  "timestamp": "2026-07-13T10:30:00.000Z",
  "operator": "Karim"
}
```

---

### 8.4 Screen 4: Confirmation

**Purpose:** Show the operator what was just saved.

**Display:**
- Green checkmark icon
- "Saved" heading
- Details: "Received: Karate 50ml × 367 packs (6F, exp Jun 2028)"
- "Continue Counting" button → returns to Product List

---

### 8.5 Screen 5: Inventory List (FEFO View)

**Purpose:** Show current inventory with FEFO highlighting.

**Features:**

#### 8.5.1 Search Bar
Filter by product name or pack size. Same logic as admin panel.

#### 8.5.2 Group Headers
Products are grouped by product name + pack size. Each group has a bold header row.

**Example:**
```
┌─────────────────────────────────────┐
│ Karate 50ml                         │  ← Group header
├──────────┬──────┬───────┬───────────┤
│ Product  │ Pack │ Month │ Qty       │
├──────────┼──────┼───────┼───────────┤
│ Karate   │ 50ml │ 6F    │ 125       │  ← Yellow highlight (FEFO)
│ Karate   │ 50ml │ 6G    │ 200       │
│ Karate   │ 50ml │ 6H    │ 80        │
├──────────┼──────┼───────┼───────────┤
│ Score    │ 50ml │ 6A    │ 250       │  ← Group header
│ Score    │ 50ml │ 6B    │ 180       │
└──────────┴──────┴───────┴───────────┘
```

#### 8.5.3 FEFO Highlighting Rule

Within each product+pack group, sorted by production month (oldest first):

**Highlight the OLDER batch when its quantity is LOWER than the next newer batch.**

This signals that the older batch was supposed to be dispatched first (FEFO), but it still has stock remaining while newer stock was added — a potential FEFO violation.

**Worked Example:**

| Product | Pack | Month | Qty | Highlight? |
|---------|------|-------|-----|------------|
| Karate | 50ml | 6F | 125 | **YES** (125 < 200) |
| Karate | 50ml | 6G | 200 | No |
| Karate | 50ml | 6H | 80 | No |

- 6F (125) < 6G (200) → 6F is highlighted (older batch has lower qty)
- 6G (200) > 6H (80) → 6G is NOT highlighted (newer batch has lower qty — correct FEFO)

**Why this rule works:**
- If FEFO was followed perfectly, older batches should have HIGHER or EQUAL quantity than newer batches (because they haven't been dispatched yet while newer ones were received)
- When an older batch has LOWER quantity, it means either:
  - FEFO was followed and the older batch was properly dispatched (good), but the highlight serves as a reminder to check
  - OR FEFO was partially followed but some newer stock was dispatched first (violation)

#### 8.5.4 Sort Order
Sorted ascending by: Product name → Pack size → Production month (year digit, then month letter)

**Example sort:**
```
Actara 5g    5A   100
Actara 5g    6A   200
Amistar 50ml 5F   150
Amistar 50ml 6A   300
Amistar 100ml 6A  180
```

---

### 8.6 Screen 6: 12M Expiry Report

**Purpose:** Show products expiring within 12 months, sorted by urgency.

**Sorting:** Ascending by months remaining (fewest months first — most urgent at top).

**Color Coding:**

| Months Left | Color | Badge |
|-------------|-------|-------|
| ≤ 3 | Red | `3M` (red background) |
| 4–6 | Amber | `5M` (amber background) |
| 7–12 | Yellow | `10M` (yellow background) |

**Example:**

```
┌──────────┬──────┬───────────┬─────┬───────┐
│ Product  │ Pack │ Expiry    │ Qty │ Left  │
├──────────┼──────┼───────────┼─────┼───────┤
│ Score    │ 50ml │ Aug 2026  │ 250 │ 1M    │ ← Red
│ Karate   │ 50ml │ Oct 2026  │ 125 │ 3M    │ ← Red
│ Amistar  │ 50ml │ Jan 2027  │ 200 │ 6M    │ ← Amber
│ Bingo    │ 100g │ Jun 2027  │ 300 │ 11M   │ ← Yellow
└──────────┴──────┴───────────┴─────┴───────┘
```

---

## 9. Admin Dashboard — Detailed Design

### 9.1 Key Design Decision: No Login

The Admin Dashboard opens **directly to the dashboard** — no login screen. The Warehouse Officer is the only user, and he trusts his physical laptop. Adding login would be unnecessary friction.

### 9.2 Navigation

A left sidebar with 6 sections:

| Section | Icon | Purpose |
|---------|------|---------|
| Dashboard | Grid | Overview metrics and charts |
| 12M Report | Warning triangle | Expiry tracking |
| Inventory | Table | Current stock levels |
| Activity Log | Clipboard | Audit trail |
| Products | Box | Product catalog management |
| Settings | Gear | System configuration |

### 9.3 Dashboard

**Top metrics row:**

| Metric | Example Value | Description |
|--------|---------------|-------------|
| Total SKUs | 24 | Number of unique product+pack+code combinations |
| Total Qty | 3,450 | Sum of all carton quantities |
| FEFO Violations | 5 | Number of items with FEFO highlighting |
| Expiring Soon | 8 | Products with expiry ≤ 12 months |

**Charts:**

1. **Top Products by Quantity** — horizontal bar chart showing the 5 products with highest total quantity
2. **Stock by Batch Code** — bar chart showing quantity distribution across production batches (5A, 5B, 6A, 6B, etc.)
3. **Warehouse Breakdown** — when multiple warehouses sync data, shows quantity per warehouse

**Chart Filters:**

A filter bar sits between the stat cards and the chart grid with:

- **Year pills:** dynamically generated from available production years in inventory data. Includes an "All" option that shows every year. Clicking a year refreshes all charts to show only data from that year.
- **Month dropdown:** months A (Jan) through L (Dec) with an "All" option. Selecting a month narrows charts further to only that month's data.
- Filters stack: the warehouse filter (from the top-bar) also applies to charts, so the chart shows data matching all active warehouse + year + month selections simultaneously.
- Only months with data are shown in the chart (no zero-filled columns).

**Recent Activity** — last 5 transactions with operator name, product, type, quantity, and time.

---

### 9.4 12M Report (Admin)

**Features:**

- **Filter buttons:** All, Critical (≤3M), Warning (4-6M), Notice (7-12M)
- **Warehouse dropdown:** Filter by specific warehouse
- **Sort:** Ascending by "Left" column (fewest months first)
- **FEFO highlighting:** Same yellow highlight rule as operator panel
- **Export Excel:** Downloads CSV with all visible data

**Table columns:** Product, Pack, Prefix, Code, Warehouse, Expiry, Qty, Left

**Example row:**
```
Score | 50ml | SCH | SCH6A | Chittagong | Aug 2026 | 250 | 1M
```

---

### 9.5 Inventory (Admin)

**Features:**

- **Search bar:** Filter by product name or code
- **Warehouse dropdown:** Filter by warehouse
- **Group headers:** Each product+pack group has a bold header row
- **FEFO highlighting:** Same yellow highlight rule as operator panel
- **Sort:** Product → Pack → ProdMonth ascending
- **Export Excel:** Downloads CSV

**Table columns:** Product, Pack, Prefix, Code, ProdMonth, Qty

**Example with grouping:**
```
┌──────────────────────────────────────────────┐
│ Amistar 50ml                                 │  ← Group header
├──────────┬──────┬───────┬────────┬─────┬─────┤
│ Product  │ Pack │ Prefix│ Code   │Month│ Qty │
├──────────┼──────┼───────┼────────┼─────┼─────┤
│ Amistar  │ 50ml │ SCH   │ SCH6A  │ 6A  │ 200 │
│ Amistar  │ 50ml │ SCH   │ SCH6B  │ 6B  │ 150 │  ← Yellow (6A < 6B? No: 200>150, not highlighted)
│ Amistar  │ 50ml │ SCH   │ SCH6C  │ 6C  │ 180 │
├──────────┼──────┼───────┼────────┼─────┼─────┤
│ Amistar  │ 100ml│ SCH   │ SCH6A  │ 6A  │ 100 │  ← Group header
│ Amistar  │ 100ml│ SCH   │ SCH6C  │ 6C  │ 180 │  ← Yellow (100 < 180)
```

---

### 9.6 Activity Log

**Purpose:** Complete audit trail of every inventory transaction.

**Table columns:** Date & Time, Product, Pack, Code, Warehouse, Type, Qty, Operator

**Filter buttons:** All, Additions (+), Subtractions (−)

**Example rows:**
```
2026-07-13 10:30 | Karate | 50ml | SCH6F | Chittagong | + Addition  | 125 | Rahim
2026-07-14 08:30 | Karate | 50ml | SCH6F | Chittagong | − Subtraction | 25 | Rahim
2026-07-14 09:00 | Score  | 50ml | SCH6A | Chittagong | − Subtraction | 50 | Jamal
```

**Export Excel:** Downloads CSV with filtered data.

---

### 9.7 Products

**Purpose:** Manage the product catalog (69 SKUs).

**Features:**
- Searchable table: Prefix, Product Name, Pack Size, AGI Code
- **AGI Code column** — Shows the 5-digit AGI code for each product+pack. Auto-populated from a default mapping (48 entries) when the product is first created. Editable per-row in the modal.
- Add Product button → opens modal with fields: Name, Pack Size, Prefix, AGI Code
- Edit button per row → opens modal pre-filled with all fields including AGI Code
- Delete button per row → confirms before removing; deletes the AGI code mapping but preserves inventory records (existing data has fallback AGI lookup)
- Products are synced to Supabase (`config` table as `product-list`) so the operator app stays up to date

**Example:**
```
Prefix │ Product Name │ Pack Size │ AGI Code │ Actions
───────┼──────────────┼───────────┼──────────┼──────────────────
SCH    │ Karate       │ 50ml      │ 58896    │ [Edit] [Delete]
SCH    │ Karate       │ 100ml     │ —        │ [Edit] [Delete]
SCH    │ Karate       │ 500ml     │ —        │ [Edit] [Delete]
DKC    │ Jazz         │ 100g      │ 52539    │ [Edit] [Delete]
```

**Delete Safety:** Deleting a product from the catalog does NOT delete existing inventory records. It only removes the product from the product list and its AGI code mapping. Existing inventory records persist — the AGI code is looked up at render time and falls back to an empty string if the mapping is gone.

---

### 9.8 Settings

**Configuration options:**

#### Operator PINs
| Name | PIN | Actions |
|------|-----|---------|
| Karim | 1234 | [Remove] |
| Rahim | 5678 | [Remove] |
| Jamal | 9012 | [Remove] |

Add new operator: Enter name + 4-digit PIN → Add button.

#### Expiry Year Range
Start Year: [2025] End Year: [2030]
(Controls which years appear in the expiry month selector on operator app)

#### Production Year Range
Start: [5] End: [6]
(Controls which year digits appear in the production month selector — 5 = 2025, 6 = 2026)

#### Warehouses
| Warehouse | Actions |
|-----------|---------|
| Chittagong | [Remove] |
| Gazipur | [Remove] |
| Jessore | [Remove] |
| Bogura | [Remove] |

Add new warehouse: Enter name → Add button.

#### Clear Cloud Data
A **"Clear Supabase Data"** button (red) in the settings footer. Deletes all data from `transactions`, `inventory`, and `config` tables via a Supabase RPC function (`clear_all_data_rpc`) that bypasses RLS, instead of the client-side `delete().neq()` approach.

**Why RPC:** The client-side approach fails on type-mismatch columns. The RPC function uses `TRUNCATE` or `DELETE FROM` with full table privileges.

**Console warning:** Also clears local `operator-data` from localStorage to keep things in sync.

---

## 10. Data Model

### 10.1 Inventory Item

**LocalStorage format:**
```json
{
  "product": "Karate",
  "packSize": "50ml",
  "productionMonth": "6F",
  "expiryMonth": "Jun 2028",
  "quantity": 125,
  "warehouse": "Chittagong",
  "sync_status": "synced"
}
```

| Field | Type | Description |
|-------|------|-------------|
| product | string | Product name (e.g., "Karate") |
| packSize | string | Pack size (e.g., "50ml") |
| productionMonth | string | 2-character code: year digit + month letter (e.g., "6F") |
| expiryMonth | string | Full expiry string (e.g., "Jun 2028") |
| quantity | number | Current carton count (received minus dispatched) |
| warehouse | string | Warehouse name (e.g., "Chittagong") |
| sync_status | string | "synced" or "pending" |

**Supabase `inventory` table (UNIQUE on product, pack_size, production_month, warehouse):**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| product | TEXT | Product name |
| pack_size | TEXT | Pack size |
| production_month | TEXT | Production month code |
| expiry_month | TEXT | Expiry date string |
| quantity | INTEGER | Current carton count |
| warehouse | TEXT | Warehouse name |
| operator_name | TEXT | Last operator who modified |
| sync_status | TEXT | Default 'synced' |
| created_at | TIMESTAMPTZ | Auto-generated timestamp |

### 10.2 Transaction Record

**LocalStorage format:**
```json
{
  "product": "Karate",
  "packSize": "50ml",
  "productionMonth": "6F",
  "expiryMonth": "Jun 2028",
  "quantity": 125,
  "type": "receive",
  "timestamp": "2026-07-13T10:30:00.000Z",
  "operator_name": "Karim",
  "warehouse": "Chittagong",
  "sync_status": "pending"
}
```

| Field | Type | Description |
|-------|------|-------------|
| product | string | Product name |
| packSize | string | Pack size |
| productionMonth | string | Production month code |
| expiryMonth | string | Expiry date string |
| quantity | number | Quantity transacted |
| type | string | "receive" or "dispatch" |
| timestamp | string | ISO 8601 timestamp |
| operator_name | string | Name of the operator who performed the count |
| warehouse | string | Warehouse where the transaction occurred |
| sync_status | string | "synced" or "pending" (pending items get pushed to Supabase) |

**Supabase `transactions` table:**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| product | TEXT | Product name |
| pack_size | TEXT | Pack size |
| production_month | TEXT | Production month code |
| expiry_month | TEXT | Expiry date string |
| quantity | INTEGER | Quantity transacted |
| type | TEXT | 'receive' or 'dispatch' (CHECK constraint) |
| operator_name | TEXT | Operator name |
| warehouse | TEXT | Warehouse name |
| client_timestamp | TEXT | Original timestamp from client |
| client_date | TEXT | Original date string from client |
| sync_status | TEXT | Default 'synced' |
| created_at | TIMESTAMPTZ | Auto-generated timestamp |

### 10.3 Configuration

```json
{
  "operatorPins": [
    { "name": "Karim", "pin": "1234" },
    { "name": "Rahim", "pin": "5678" }
  ],
  "expiryYears": { "start": 2025, "end": 2030 },
  "prodYears": { "start": 5, "end": 6 },
  "warehouses": ["Chittagong", "Gazipur", "Jessore", "Bogura"]
}
```

---

## 11. FEFO Highlighting Rule — Exact Algorithm

### Input
- Array of inventory items for a given product+pack group
- Sorted by production month ascending (oldest first)

### Algorithm

```
for i = 1 to group.length - 1:
    if group[i-1].quantity < group[i].quantity:
        highlight group[i-1]  // older batch has lower qty
```

### Why This Works

In perfect FEFO:
- Older batches should have **higher** quantity (they haven't been dispatched yet)
- Newer batches should have **lower** quantity (they were just received)

When the pattern reverses (older has lower qty), it signals either:
1. FEFO was followed and the older batch was properly dispatched — **good**, but the highlight serves as a visual check
2. FEFO was violated — newer stock was dispatched while older stock remains — **needs attention**

### Worked Example

Inventory for Score 50ml, sorted by production month:

| Month | Qty | vs Next | Highlight? |
|-------|-----|---------|------------|
| 6A | 250 | 250 > 180 | No |
| 6B | 180 | 180 < 300 | **YES** |
| 6C | 300 | (last) | No |

- 6A (250) > 6B (180) → Not highlighted (older has more — correct FEFO)
- 6B (180) < 6C (300) → **Highlighted** (older has less — potential FEFO violation)

---

## 12. Product Catalog (69 SKUs)

### SCH Products (Prefix: SCH)

| # | Product | Pack Size |
|---|---------|-----------|
| 1 | Actara | 5g |
| 2 | Amistar | 50ml |
| 3 | Amistar | 100ml |
| 4 | Amistar | 500ml |
| 5 | Alika | 50ml |
| 6 | Armure | 100ml |
| 7 | Bingo | 100g |
| 8 | Bingo | 500g |
| 9 | Denim Fit | 10g |
| 10 | Filia | 50ml |
| 11 | Filia | 100ml |
| 12 | Filia | 500ml |
| 13 | Grozin | 1kg |
| 14 | Grozin | 2kg |
| 15 | Incipio | 40ml |
| 16 | Incipio | 100ml |
| 17 | Karate | 50ml |
| 18 | Karate | 100ml |
| 19 | Karate | 500ml |
| 20 | Lanirat | 100g |
| 21 | Magma | 1kg |
| 22 | Magma | 2kg |
| 23 | Miravis Duo | 50ml |
| 24 | Miravis Duo | 100ml |
| 25 | Pegasus | 50ml |
| 26 | Pegasus | 100ml |
| 27 | Proclam | 10g |
| 28 | Proclam | 30g |
| 29 | Revus | 50ml |
| 30 | Revus | 100ml |
| 31 | Ridomil | 100g |
| 32 | Ridomil | 500g |
| 33 | Rifit | 100ml |
| 34 | Rifit | 500ml |
| 35 | Score | 50ml |
| 36 | Score | 100ml |
| 37 | Score | 500ml |
| 38 | Shobicron | 50ml |
| 39 | Shobicron | 100ml |
| 40 | Shobicron | 500ml |
| 41 | Silika | 1kg |
| 42 | Silika | 2kg |
| 43 | Thiovit | 1kg |
| 44 | Thiovit | 2kg |
| 45 | Tilt | 50ml |
| 46 | Tilt | 100ml |
| 47 | Tilt | 500ml |
| 48 | Vestoria | 15g |
| 49 | Vertimec | 50ml |
| 50 | Vertimec | 100ml |
| 51 | Vertimec | 500ml |
| 52 | Virtako | 10g |
| 53 | Virtako | 30g |
| 54 | Voliam | 50ml |
| 55 | Plenum | 50g |

### Non-SCH Products

| # | Product | Pack Size | Prefix |
|---|---------|-----------|--------|
| 56 | Atresia | 50ml | JAK |
| 57 | Cruiser | 20g | SPL |
| 58 | Caliber | 100g | EC |
| 59 | Caliber | 500g | EC |
| 60 | Gayte | 100g | BG |
| 61 | Jazz | 100g | DKC |
| 62 | Jazz | 500g | DKC |
| 63 | Jazz | 1kg | DKC |
| 64 | Laser | 25g | RB |
| 65 | Protozim | 50ml | BWL |
| 66 | Protozim | 100ml | BWL |
| 67 | Protozim | 500ml | BWL |

### No Prefix Products

| # | Product | Pack Size |
|---|---------|-----------|
| 68 | PJ-16 | — |
| 69 | XP-16 | — |

---

## 13. Warehouse Configuration

| Warehouse | Location |
|-----------|----------|
| Chittagong | Port city, southeastern Bangladesh |
| Gazipur | Industrial area near Dhaka |
| Jessore | Southwestern Bangladesh |
| Bogura | Northern Bangladesh |

All 4 warehouses share the same product catalog and counting process. The admin dashboard can filter data by warehouse.

---

## 14. What's NOT in Scope

| Item | Reason |
|------|--------|
| Full user authentication | PIN-only for operator accountability; admin has a single shared password (9876) |
| Barcode scanning | Operator manually reads batch codes from cartons |
| Photo capture | Not required — operator reads codes visually |
| GPS/location tracking | Not needed — operator is physically in the warehouse |
| Automated reorder | Outside scope — this is an inventory visibility tool |
| Financial accounting | No pricing, invoicing, or monetary calculations |
| Product images | Not needed — operators know the products visually |
| Multi-language support | English only (Bangla not required for batch codes) |

---

## 15. Open Questions / Decisions Needed

| # | Question | Current State | Decision |
|---|----------|---------------|----------|
| 1 | How does data get from operator phones to admin dashboard? | ✅ **Supabase cloud sync** — offline-first localStorage, syncs pending records when online | Operators and officer can be on different devices. Admin reads/writes directly to Supabase. |
| 2 | Should the operator app work fully offline? | ✅ **Yes** — PWA with localStorage. Syncs when online. | Confirmed — warehouses have poor/unreliable internet. |
| 3 | Should there be a "Back to Product List" button after confirmation? | ✅ Goes to Product List | Confirmed — operators count one product, then move to the next. |
| 4 | Can an operator edit/delete a previous count? | ❌ **No** — only receive/dispatch adds new transactions | Edit capability not needed. Corrections are done via dispatch (negative) or new receive. |
| 5 | Should the 12M report show ALL products or only those with inventory > 0? | ✅ Only products with inventory | Confirmed. |
| 6 | Should the admin dashboard auto-refresh or require manual refresh? | ✅ Manual (on screen switch or refresh button) | Confirmed. |
| 7 | Is the "Other" production month option needed? | ✅ Button exists but no special logic — treated as a separate code | "Other" covers non-standard batch codes. Stored as-is. |
| 8 | Should products without a prefix (PJ-16, XP-16) have batch codes? | ✅ They exist without prefix. AGI codes not defined for these. | These are non-chemical items. |
| 9 | How are AGI codes handled? | ✅ Auto-derived from product+pack lookup in both apps | Admin can edit AGI codes per product. Operator never sees them. |
| 10 | Can multiple operators count at the same warehouse at the same time? | ✅ **Yes** — inventory sums per (product, pack, prodMonth, warehouse) | Quantities from all operators at the same warehouse are aggregated, not overwritten. |
| 11 | What happens when admin deletes a product that has inventory? | ✅ **Delete is catalog-only** — existing inventory records persist with fallback AGI lookup | Inventory records reference product name+pack, not a foreign key. No orphan data. |

---

*Document version: 2.0*
*Last updated: 2026-07-15*
*Prepared for: App development team*
