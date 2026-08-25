# Google Sheet Setup — Shelf Life Tracking

## Quick Setup (3 minutes)

### Step 1: Open Your Google Sheet

Open the sheet your intern shared with you.

### Step 2: Open Apps Script

In the Google Sheet, go to **Extensions → Apps Script**

### Step 3: Paste the Script

1. Delete any default code in the editor
2. Open `database/google-apps-script.gs` from this project
3. Copy the **entire contents** and paste into the Apps Script editor
4. Click **Save** (Ctrl+S)

### Step 4: Run Setup

1. In the Apps Script editor, select `setupSheet` from the function dropdown (top toolbar)
2. Click **Run** (▶ button)
3. Authorize when prompted (one-time only)
4. You'll see "Setup complete!" — this creates all 4 tabs with headers and default config

### Step 5: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon → select **Web app**
3. Configure:
   - **Description:** `Shelf Life Tracking API`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. **Copy the Web app URL** (looks like `https://script.google.com/macros/s/AKfycbx.../exec`)

### Step 6: Configure the App

1. Open `apps/operator/syncManager.js`
2. Find line 5: `var APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';`
3. Replace with your URL from Step 5
4. Save

## That's It

No Firebase. No Supabase. No API keys. No 2FA setup.

- The Google Sheet **is** your database
- The Apps Script **is** your API
- Share the sheet with anyone who needs access

## What the Setup Creates

| Tab | Headers |
|---|---|
| `transactions` | product, pack_size, production_month, expiry_month, quantity, type, operator_name, warehouse, client_timestamp, client_date |
| `inventory` | product, pack_size, production_month, expiry_month, quantity, warehouse |
| `snapshots` | snapshot_month, product, pack_size, production_month, expiry_month, quantity, warehouse |
| `config` | key, value |

Plus two default config rows: `shelf-life-config` and `product-list`.

## Handover

To hand this to someone else:
1. Share the Google Sheet (Editor access)
2. Give them the `syncManager.js` with the Apps Script URL
3. Done — they own the sheet and all data
