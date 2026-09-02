# Replication Guide: CP → Seeds

Step-by-step kit to stand up the Shelf Life Tracking system for the Seeds business, copied from the working Crop Protection (CP) deployment. Read `ARCHITECTURE.md` (root) first — this guide assumes you know the system's shape.

**Goal of this document:** enumerate everything that changes for Seeds, everything that stays, and the exact run order so a fresh instance works the first time.

---

## 1. What maps 1:1 (no change)

Take these files unchanged:

| File | Why |
|---|---|
| `apps/operator/index.html` | 5-screen layout, PWA manifest ref, load order |
| `apps/operator/sync.js` | sync manager — **only line 1 changes** (URL) |
| `apps/operator/app.js` | counting flow, PIN login, merge, auto-refresh (warehouses come from config, not code) |
| `apps/admin/admin-panel.html` | page shell + all modals (only `?v=` tokens + title/branding text change) |
| `apps/admin/admin-app.js` | auth gates, all report logic — reads configs and products from data layers, not hardcoded CP values |
| `apps/admin/admin-style.css` | all badge/row classes are width-agnostic |
| `database/google-apps-script.gs` | backend + snapshot engine — config is seeded in `setupSheet`, not code |

The two screens that are 100% data-driven are the **Monthly Report** and **Cohort Follow-up** — they compute from the ledger and snapshots, never from product names. **Seeds gets them for free.**

---

## 2. What changes for Seeds

### 2.1 Product master — `apps/operator/products.js`
`PRODUCTS` (line 2) lists CP SKUs (`Actara`, `Amistar`, `Alika`, ... `SCH` prefix). Replace with the Seeds SKU list, same shape:

```js
const PRODUCTS = [
  { name: 'Product A', pack: '1Kg', prefix: 'SDH' },
  ...
];
```

- `prefix`: printed as the batch-code prefix on the operator UI; e.g. CP uses `SCH`. Per business line this is usually 3 letters.
- `AGI_CODES` (line 74): key = `"Name|Pack"`, value = the crop/biological-group code. Replace the map with whatever Seeds wants as its "code" column (e.g. seed technology codes). If unused, ship an empty object — every lookup path already tolerates missing codes (`getAgiCode`, line 94).

### 2.2 Users, years, warehouses — seeded config in `google-apps-script.gs`

`setupSheet` (line 30) seeds `DEFAULT_CONFIG` (line 18). For Seeds, change **inside the script before running `setupSheet`**:

| Key | CP value | Seeds change |
|---|---|---|
| `operatorPins` | CP operator map `{pin, name, sessionWarehouse?}` | Seeds warehouse officer list — keep the same JSON shape |
| `expiryYears` | `["2026","2027","2028","2029","2030"]` | window to today + ~5 seasons |
| `prodYears` | `["2024","2025","2026","2027","2028"]` | window back to current season |
| `warehouses` | `["Bogura","Chittagong","Jessore","Gazipur"]` | Seeds region/warehouse list |

Warehouse PINs also affect the frontend: `WAREHOUSE_PINS` in `admin-app.js:9` and the login tab keys. The long-lived rule is they ship in `DEFAULT_CONFIG.warehouses` (which carries the pins per admin edit flow when the admin adds a warehouse from Settings).

### 2.3 Warehouse PINs — `apps/admin/admin-app.js:9`
```js
const WAREHOUSE_PINS = { Bogura: '2947', Chittagong: '5185', Jessore: '3639', Gazipur: '8274' };
```
Replace keys with the Seeds warehouse names (must match config `warehouses` exactly and lowercase-normalize the same way), and set fresh 4-digit pins. `MASTER_PIN` (line 8) should also rotate to a Seeds value.

### 2.4 Hardened warehouse names — `admin-app.js:119`
`normalizeWarehouses` uses `CANONICAL_WAREHOUSES = ['Bogura','Chittagong','Jessore','Gazipur']`. Change these four strings to the Seeds list. **Do not skip this** — otherwise a previously-seeded CP warehouse name can re-enter the config via `mergeConfig` unions on the first load.

### 2.5 Branding / titles
- Operator: `index.html` title, header logo text, `manifest.json` name/short_name/icons.
- Admin: `admin-panel.html` title + document title in code.
- Not required for function; cosmetic only.

---

## 3. Fresh-instance run book (do in this order)

1. **Spreadsheet**: create a new Google Spreadsheet. Note its URL.
2. **Apps Script project**: attach a script via *Extensions → Apps Script*. Paste the **unchanged** `google-apps-script.gs`. In `setupSheet`, point `SpreadsheetApp` at your spreadsheet (or keep `getActiveSpreadsheet()` if you paste into the bound project).
   - Edit `DEFAULT_CONFIG` for Seeds users/years/warehouses (2.2).
3. **Run `setupSheet` once** from the editor (run dialog → allow auth → permissions). Verify tabs: `transactions`, `inventory`, `config`, `snapshots`, `dashboard` (dashboard appears after `buildDashboard`).
4. **Deploy the web app** (*Deploy → New deployment → Web app*, execute as *me*, access *anyone*), copy the `/exec` URL.
5. **Paste that URL** into `apps/operator/sync.js` line 4 (`APPS_SCRIPT_URL`). **Also update `ARCHITECTURE.md` §4** with the new URL (it documents the live deployment).
6. **Deploy frontend**: commit + push the entire `apps/` tree with cache-bust tokens bumped (see 3.2) to the site host.
7. **Install the trigger**: run `installAutoSnapshotTrigger` once from the editor. It registers day-1 00:00 monthly `autoSnapshotMonthEnd` and self-deletes any prior trigger, so it's safe to re-run. Snapshots begin with the next full month end.
8. **Smoke test** from a private window:
   - Operator: PIN login → do 1 receive + 1 dispatch → inventory shows it → wait ≤15s → confirm (`syncStatus` toast) → verify the row appears in the spreadsheet `transactions`.
   - Admin: login (master) → dashboard redraws → paste a second, already-dated test batch to *check the monthly report actually covers it* (e.g. backdate 2 transactions' `client_timestamp` to last month) → reload → Monthly Report shows LM numbers; Cohort Follow-up shows a baseline or the SKUs.
   - Kill the tab mid-edit, reload from another device mid-edit → `readSince` delta pull converges both.
9. **Hand over CFed**: point on-device PWA (operator) and admin bookmark at the new URLs.

---

## 4. Checklist for the Seeds clone — per screen

| Screen | CP→Seeds identical | Change needed | Notes |
|---|---|---|---|
| Operator login | yes | — (config-driven) | warehouse names render from config |
| Operator products | — | `products.js` | new SKU list + AGI map |
| Operator count | yes | — | year ranges come from config |
| Operator inventory / 12-month | yes | — | FEFO + bucket classes unchanged |
| Admin login/PIN gates | — | `MASTER_PIN`, `WAREHOUSE_PINS` | also `CANONICAL_WAREHOUSES` |
| Dashboard | yes | — | Chart.js, no Seeds-specific refs |
| 12/18m expiry, Inventory | yes | — | AGI badges read products map |
| Activity / Edit transactions | yes | — | officer scoping is warehouse-based |
| Monthly Report | yes | — | ledger-based only |
| Cohort Follow-up + drilldowns | yes | — | ledger/snapshot-based only |
| Country Summary | yes | — | aggregates across warehouses |
| Products (admin) | — | seeds master via UI on first boot | master-only; or edit `products.js` before push |
| Settings (PINs, years, warehouses) | yes | — | ship in `DEFAULT_CONFIG` |
| Danger zone clears | yes | — | warehouse/date/master gates unchanged |

---

## 5. Known traps (all already survived in CP — don't rediscover them)

1. **`?v=` cache-busting.** Every frontend change must ride a bumped token in `admin-panel.html` (`admin-app.js?v=15`, `admin-style.css?v=9`) and `index.html` (`sync.js?v=15`, `app.js?v=15`). Forgetting = users run stale JS with an old bug forever.
2. **Month-end off-by-one.** `monthEndOf` (admin-app.js:1322) and `monthStartOf` (:1330) use `new Date(y, m-1, 1)`. If they look different when you paste this for Seeds, STOP — the `-1` is load-bearing (git `6a96924`). Motors of reason: snapshot engine already uses `bdMonthEndTs` correct math; keep them in lockstep.
3. **Deploy lags repo.** The web-app URL serves the deployed backend (may be old) but the newest frontend. The monthly time trigger runs **editor Head code** — unaffected by web deploys. Plan: deploy backend once after any `.gs` change; don't debug "why no snapshot" before confirming the trigger exists.
4. **`clearCloudData` resurrection.** After clearing cloud data, a pull with stale local mirrors can re-upload. The UI already warns; for Seeds keep the two-step order: wipe browser then call cloud clear.
5. **Google date coercion.** Months typed as `"Jan 2027"` often become Date objects in Sheets. `normalizeDateValue` (google-apps-script.gs:247) converts back. Never "fix" a cell by hand to a different type than the writer does.
6. **`batchUpsert` column-mixing.** Upsert overwrites only columns present in the payload. Snapshot rows are always full rows, so missing columns never silently stale — but the edit-transactions transfer must stay whole-row too.
7. **`last-sync-ts` staleness after manual edits.** `updateTransactions` and the cloud clears force `pullAllForce` server-side on purpose. If a Seeds dev "hand-syncs" a sheet to fix a typo, a browser with a future `last-sync-ts` will overwrite it — always let `updateTransactions` do row fixes.
8. **Phantom dispatch (operator guard exists — don't remove it).** The operator `doTransaction` dispatch guard warns when a dispatch targets a lot with no local stock. This prevents the "dispatch against a lot that was never received" incident. The admin Delete button includes an impact preview that explicitly calls out the phantom case (stock unchanged) so officers understand the true effect. If replicating without the guard, log the risk — officers will see phantom rows in Edit with no inventory context.

---

## 6. Estimated touch points, minimized

- Files edited: `products.js`, `google-apps-script.gs` (DEFAULT_CONFIG + warehouse canonical list via `admin-app.js`), `admin-app.js` (pins), `admin-panel.html` (delete button + version refs), `admin-style.css` (`.modal-btn.danger`), `sync.js` (URL), `apps/operator/app.js` (dispatch guard), `index.html` (version refs), `manifest.json` + two titles (cosmetic).
- Files untouched: `app.js`, `index.html`, `admin-panel.html`, `admin-style.css`, all report logic.

That's the whole story — the report engine, snapshot freezer, and sync core are business-line agnostic and carry over unchanged.