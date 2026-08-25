# Shelf Life Tracking

Digital inventory tracking for Syngenta Bangladesh — two static web apps sharing a Google Sheets backend.

## System Architecture

```
Admin App (desktop dashboard)    ←→ Google Sheets ←→    Operator App (mobile PWA)
  apps/admin/                                          apps/operator/
```

- **Admin App** — manager dashboard: charts, inventory tables, 12-month reports, product/operator config
- **Operator App** — mobile PWA for warehouse staff: scan products, record receipts/dispatches, track expiry
- **Google Sheets** (via Apps Script) — cloud sync layer; all data shared between apps

## Prerequisites

- A Google account
- Static file hosting (Netlify, Vercel, GitHub Pages, any web server — no build step required)
- Modern browser (Chrome/Firefox/Safari on desktop + mobile)

## Setup

### 1. Set Up Google Sheets Backend

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Paste the contents of `database/google-apps-script.gs`
4. Select `setupSheet` from the function dropdown → click **Run**
5. Authorize when prompted
6. Click **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the **Web app URL**

### 2. Configure the Apps Script URL

Paste the URL into `apps/operator/syncManager.js` line 8:
```javascript
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_URL/exec';
```

### 3. Deploy the Apps

Both apps are **pure static files** — no build step, no package managers needed.

| App | Folder | How to Deploy |
|-----|--------|--------------|
| **Admin** | `apps/admin/` | Upload to any static host. Open `admin-panel.html` in browser. |
| **Operator** | `apps/operator/` | Upload to any static host. Open `index.html` on mobile. Can also run from local file server. |

**Quick deploy options:**
- **Netlify:** Drag the project folder to [https://app.netlify.com/drop](https://app.netlify.com/drop)
- **GitHub Pages:** Push to repo → enable Pages from `main` root
- **Any web server:** Copy `apps/admin/` and `apps/operator/` to your web root

### 4. Initial Configuration

1. Open Admin App → Settings tab
2. **Operator PINs:** Add real operator names and 4-digit PINs (default: `1234` for "Default")
3. **Products tab:** Verify the 69 SKUs are loaded. Click **Sync Products** to push to Google Sheets
4. **Password:** Default admin password is `9876`

### 5. Test the Pilot

1. Open Operator App on a mobile device
2. Enter PIN `1234`
3. Select a product and record a receipt or dispatch
4. Open Admin App → Dashboard — data should appear after sync
5. Try multi-operator: open Operator App on two devices, same warehouse → quantities sum on dashboard

## Default Credentials

| Role | Credential |
|------|-----------|
| Admin password | `9876` (change in Settings) |
| Operator PIN | `1234` (for "Default" operator — change before going live) |

## Project Structure

```
├── apps/
│   ├── admin/                 # Admin dashboard (desktop)
│   │   ├── admin-panel.html   # Main HTML
│   │   ├── admin-app.js       # All logic + charts
│   │   └── admin-style.css    # Styling
│   └── operator/              # Operator mobile PWA
│       ├── index.html         # Main HTML
│       ├── app.js             # App logic
│       ├── products.js        # Product catalog (69 SKUs)
│       ├── syncManager.js     # Google Sheets sync engine
│       ├── style.css          # Styling
│       └── manifest.json      # PWA manifest
├── database/
│   ├── google-apps-script.gs  # Apps Script backend (paste into Google Sheet)
│   ├── GOOGLE_SHEET_SETUP.md  # Step-by-step setup guide
│   ├── supabase-schema.sql    # Legacy Supabase schema (for reference)
│   └── legacy/                # Superseded SQL scripts
├── docs/
│   ├── PROJECT_REQUIREMENTS.md   # Full system design document
│   └── MEMORY.md                 # Development history
└── README.md
```

## License

Internal — Syngenta Bangladesh
