// ==========================================================
// Google Apps Script — Shelf Life Tracking v3 Backend
// ==========================================================
// This script acts as a REST API between the web apps and Google Sheets.
// The web apps (operator + admin) send HTTP requests here to read/write data.
//
// SETUP:
//   1. Open your Google Sheet
//   2. Extensions → Apps Script
//   3. Paste this entire file
//   4. Run setupSheet() once (Run menu → setupSheet)
//   5. Deploy: New deployment → Web app → Execute as: Me → Anyone access
//   6. Copy the deployment URL into sync.js
// ==========================================================

// Default config pushed to the sheet on first setup or after a clear.
// Operator PINs, year ranges, and warehouse names live here.
var DEFAULT_CONFIG = '{"operatorPins":[{"name":"Default","pin":"1234","warehouse":"Chittagong"}],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}';

// ==========================================================
// SETUP — creates all sheet tabs with correct headers
// ==========================================================
// Run this once from the Apps Script editor. It:
//   - Creates missing tabs (transactions, inventory, snapshots, config)
//   - Writes headers if tabs are empty
//   - Seeds default config if config tab is empty
//   - Deletes the blank default "Sheet1" if it exists
//   - Builds the dashboard tab with auto-refreshing formulas
// ==========================================================
function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Each tab and its column headers. Add new columns here if needed.
    var tabs = {
        'transactions': ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'type', 'operator', 'warehouse', 'client_timestamp', 'client_date', 'server_time'],
        'inventory': ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse'],
        'snapshots': ['snapshot_month', 'product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse', 'age_months'],
        'config': ['key', 'value']
    };

    // Create each tab if missing, write headers if they changed
    Object.keys(tabs).forEach(function (name) {
        var sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.insertSheet(name);
        }
        var headers = tabs[name];
        var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
        var needsHeaders = headers.some(function (h, i) { return existing[i] !== h; });
        if (needsHeaders || sheet.getLastRow() === 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
    });

    // Seed default config if the config tab is empty
    var configSheet = ss.getSheetByName('config');
    if (configSheet.getLastRow() < 2) {
        configSheet.appendRow(['shelf-life-config', DEFAULT_CONFIG]);
        configSheet.appendRow(['product-list', '[]']);
    }

    // Clean up the blank default sheet that Google creates with new spreadsheets
    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
        ss.deleteSheet(defaultSheet);
    }

    // Build the dashboard tab with QUERY formulas that auto-refresh
    buildDashboard(ss);

    SpreadsheetApp.getUi().alert('Setup complete!\n\nTabs: transactions, inventory, snapshots, config, dashboard\n\nNow deploy as web app.');
}

// ==========================================================
// DASHBOARD — builds a read-only summary tab with live formulas
// ==========================================================
// Creates 4 sections using QUERY/SUMIFS/COUNTIFS formulas:
//   1. Product Summary — total qty and batch count per product
//   2. Expiry Buckets — items grouped by months until expiry (Expired, Critical, Warning, Notice, Distant, Future)
//   3. Warehouse Summary — total qty per warehouse
//   4. Recent Transactions — last 20 transactions from the transactions tab
//
// All formulas reference the inventory and transactions tabs directly,
// so they auto-update when data changes. No manual refresh needed.
// ==========================================================
function buildDashboard(ss) {
    var dash = ss.getSheetByName('dashboard');
    if (!dash) dash = ss.insertSheet('dashboard');
    dash.clear();

    var green = '#00843D';
    var darkGreen = '#005A2B';
    var lightGreen = '#E8F5E9';
    var red = '#DC2626';
    var orange = '#F97316';
    var yellow = '#EAB308';

    // ---- Title row ----
    dash.getRange('A1').setValue('Shelf Life Tracking — Dashboard').setFontSize(16).setFontWeight('bold').setFontColor(darkGreen);
    dash.getRange('B1').setValue('Auto-refreshes when inventory data changes').setFontStyle('italic').setFontColor('#999999');
    dash.getRange('A1:B1').setBackground('#F0FFF4');

    // ---- Section 1: Product Summary (columns A-C) ----
    // Lists every product with total quantity and batch count, sorted by qty descending.
    // Uses QUERY to group inventory rows by product name.
    dash.getRange('A3').setValue('PRODUCT SUMMARY').setFontWeight('bold').setFontColor('#FFFFFF').setBackground(green);
    dash.getRange('A3:C3').setBackground(green).setFontColor('#FFFFFF');

    dash.getRange('A4').setValue('Product').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('B4').setValue('Total Qty').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('C4').setValue('Batches').setFontWeight('bold').setBackground(lightGreen);

    dash.getRange('A5').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT A, SUM(E) GROUP BY A ORDER BY SUM(E) DESC"),2,FALSE),"No data")');
    dash.getRange('B5').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT A, SUM(E) GROUP BY A ORDER BY SUM(E) DESC"),2,FALSE),0)');
    dash.getRange('C5').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT A, COUNT(A) GROUP BY A ORDER BY SUM(E) DESC"),2,FALSE),0)');
    dash.getRange('A5:C30').setBorder(true, true, true, true, true, true);

    // ---- Section 2: Expiry Buckets (columns E-G) ----
    // Counts items and total qty in each expiry bucket based on the expiry_month column (F).
    // The thresholds are relative to "today" — DATE() is baked in at setup time.
    // NOTE: Re-run setupSheet() periodically to refresh the date thresholds,
    //       or the buckets will become stale as months pass.
    dash.getRange('E3').setValue('EXPIRY SUMMARY').setFontWeight('bold').setFontColor('#FFFFFF').setBackground(green);
    dash.getRange('E3:G3').setBackground(green).setFontColor('#FFFFFF');

    dash.getRange('E4').setValue('Bucket').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('F4').setValue('Items').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('G4').setValue('Total Qty').setFontWeight('bold').setBackground(lightGreen);

    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1; // m is 1-indexed for DATE()

    // Expired: expiry_month before this month
    dash.getRange('E5').setValue('Expired');
    dash.getRange('F5').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,"<"&DATE(' + y + ',' + m + ',1)),0)');
    dash.getRange('G5').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,"<"&DATE(' + y + ',' + m + ',1)),0)');
    dash.getRange('E5:G5').setFontColor(red);

    // Critical: expiry within next 3 months
    dash.getRange('E6').setValue('Critical (≤3mo)');
    dash.getRange('F6').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,">="&DATE(' + y + ',' + m + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 3) + ',1)),0)');
    dash.getRange('G6').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,">="&DATE(' + y + ',' + m + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 3) + ',1)),0)');
    dash.getRange('E6:G6').setFontColor(orange);

    // Warning: expiry in 4-6 months
    dash.getRange('E7').setValue('Warning (4-6mo)');
    dash.getRange('F7').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,">="&DATE(' + y + ',' + (m + 3) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 6) + ',1)),0)');
    dash.getRange('G7').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,">="&DATE(' + y + ',' + (m + 3) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 6) + ',1)),0)');
    dash.getRange('E7:G7').setFontColor(yellow);

    // Notice: expiry in 7-12 months
    dash.getRange('E8').setValue('Notice (7-12mo)');
    dash.getRange('F8').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,">="&DATE(' + y + ',' + (m + 6) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 12) + ',1)),0)');
    dash.getRange('G8').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,">="&DATE(' + y + ',' + (m + 6) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 12) + ',1)),0)');

    // Distant: expiry in 13-18 months
    dash.getRange('E9').setValue('Distant (13-18mo)');
    dash.getRange('F9').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,">="&DATE(' + y + ',' + (m + 12) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 18) + ',1)),0)');
    dash.getRange('G9').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,">="&DATE(' + y + ',' + (m + 12) + ',1),inventory!F2:F,"<"&DATE(' + y + ',' + (m + 18) + ',1)),0)');

    // Future: expiry beyond 18 months
    dash.getRange('E10').setValue('Future (>18mo)');
    dash.getRange('F10').setFormula('=IFERROR(COUNTIFS(inventory!F2:F,">="&DATE(' + y + ',' + (m + 18) + ',1)),0)');
    dash.getRange('G10').setFormula('=IFERROR(SUMIFS(inventory!E2:E,inventory!F2:F,">="&DATE(' + y + ',' + (m + 18) + ',1)),0)');

    dash.getRange('E5:G10').setBorder(true, true, true, true, true, true);
    dash.getRange('G5:G10').setNumberFormat('#,##0');

    // ---- Section 3: Warehouse Summary (columns E-G, rows 12+) ----
    // Total items and quantity per warehouse from the inventory tab.
    dash.getRange('E12').setValue('WAREHOUSE SUMMARY').setFontWeight('bold').setFontColor('#FFFFFF').setBackground(green);
    dash.getRange('E12:G12').setBackground(green).setFontColor('#FFFFFF');

    dash.getRange('E13').setValue('Warehouse').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('F13').setValue('Items').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('G13').setValue('Total Qty').setFontWeight('bold').setBackground(lightGreen);

    dash.getRange('E14').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT F, COUNT(F), SUM(E) GROUP BY F ORDER BY SUM(E) DESC"),2,FALSE),"No data")');
    dash.getRange('F14').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT F, COUNT(F), SUM(E) GROUP BY F ORDER BY SUM(E) DESC"),3,FALSE),0)');
    dash.getRange('G14').setFormula('=IFERROR(SORT(QUERY(inventory!A2:F,"SELECT F, COUNT(F), SUM(E) GROUP BY F ORDER BY SUM(E) DESC"),3,FALSE),0)');
    dash.getRange('E14:G20').setBorder(true, true, true, true, true, true);
    dash.getRange('G14:G20').setNumberFormat('#,##0');

    // ---- Section 4: Recent Transactions (rows 33+, all 5 columns) ----
    // Last 20 rows from the transactions tab, sorted by server_time descending (column K).
    dash.getRange('A33').setValue('RECENT TRANSACTIONS (last 20)').setFontWeight('bold').setFontColor('#FFFFFF').setBackground(green);
    dash.getRange('A33:E33').setBackground(green).setFontColor('#FFFFFF');

    dash.getRange('A34').setValue('Date').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('B34').setValue('Product').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('C34').setValue('Type').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('D34').setValue('Qty').setFontWeight('bold').setBackground(lightGreen);
    dash.getRange('E34').setValue('Warehouse').setFontWeight('bold').setBackground(lightGreen);

    dash.getRange('A35').setFormula('=IFERROR(QUERY(transactions!A2:K,"SELECT TEXT(J,\'DD-MMM-YYYY\'), A, F, E, H ORDER BY K DESC LIMIT 20",0),"No data")');
    dash.getRange('A35:E54').setBorder(true, true, true, true, true, true);

    // ---- Column widths ----
    dash.setColumnWidth(1, 200); // Product / Date
    dash.setColumnWidth(2, 120); // Total Qty / Product
    dash.setColumnWidth(3, 100); // Batches / Type
    dash.setColumnWidth(4, 80);  // Items / Qty
    dash.setColumnWidth(5, 180); // Bucket / Warehouse
    dash.setColumnWidth(6, 80);  // Items
    dash.setColumnWidth(7, 100); // Total Qty

    dash.setFrozenRows(1);
}

// ==========================================================
// GET REQUESTS — read data from sheets
// ==========================================================
// Called by the web apps via: fetch(APPS_SCRIPT_URL + '?action=read&sheet=transactions')
// Supported actions:
//   ping          → { ok: true, time: "..." } — tests connectivity
//   read          → returns all rows from a sheet as JSON array
//   readFiltered  → returns first row matching a key=value filter (used for config)
//   readSince     → returns rows from transactions where client_timestamp > given value
// ==========================================================
function doGet(e) {
    var action = e.parameter.action;

    if (action === 'ping') {
        return jsonResponse({ ok: true, time: new Date().toISOString() });
    }

    if (action === 'read') {
        return readSheet(e.parameter.sheet);
    }

    if (action === 'readFiltered') {
        return readFiltered(e.parameter.sheet, e.parameter.key, e.parameter.value);
    }

    if (action === 'readSince') {
        return readSince(e.parameter.sheet, e.parameter.since);
    }

    return jsonResponse({ error: 'Unknown GET action' });
}

// Normalizes Date objects in date columns to "Mon YYYY" text format.
// Google Sheets auto-converts strings like "Jan 2027" to Date objects,
// which then serialize as ISO strings (e.g. "2027-01-31T18:00:00.000Z").
// This converts them back to human-readable "Mon YYYY" format.
var DATE_COLUMNS = ['expiry_month', 'production_month'];
function normalizeDateValue(val, columnName) {
    if (DATE_COLUMNS.indexOf(columnName) >= 0 && val instanceof Date) {
        var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return monthNames[val.getMonth()] + ' ' + val.getFullYear();
    }
    return val;
}

// Reads an entire sheet and returns rows as an array of objects.
// Each object's keys are the column headers from row 1.
// Returns [] if the sheet has only headers (no data rows).
function readSheet(sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse([]);
    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = data[0];
    var rows = data.slice(1).map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = normalizeDateValue(row[i], h); });
        return obj;
    });
    return jsonResponse(rows);
}

// Finds and returns the first row where the given key column matches value.
// Used to read config: ?action=readFiltered&sheet=config&key=key&value=shelf-life-config
// Returns null if no match found.
function readFiltered(sheetName, key, value) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse(null);
    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = data[0];
    var keyIndex = headers.indexOf(key);
    if (keyIndex < 0) return jsonResponse(null);
    for (var i = 1; i < data.length; i++) {
        if (String(data[i][keyIndex]) === String(value)) {
            var obj = {};
            headers.forEach(function (h, j) { obj[h] = normalizeDateValue(data[i][j], h); });
            return jsonResponse(obj);
        }
    }
    return jsonResponse(null);
}

// ==========================================================
// READ SINCE — delta sync for transactions
// ==========================================================
// Returns only rows where the client_timestamp column (I, index 8)
// is greater than the given `since` value. Used by the operator app
// to fetch only new transactions instead of the full sheet.
// Falls back to full read if `since` is empty or invalid.
// ==========================================================
function readSince(sheetName, since) {
    if (!since) return readSheet(sheetName);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse([]);
    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = data[0];
    var tsIdx = headers.indexOf('client_timestamp');
    if (tsIdx < 0) return readSheet(sheetName);
    var rows = data.slice(1).filter(function (row) {
        return String(row[tsIdx]) > String(since);
    }).map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = normalizeDateValue(row[i], h); });
        return obj;
    });
    return jsonResponse(rows);
}

// ==========================================================
// POST REQUESTS — write data to sheets
// ==========================================================
// Called by the web apps via: fetch(APPS_SCRIPT_URL, { method: 'POST', body: ... })
// Supported actions:
//   batchInsert     — append new rows (used for transactions)
//   batchUpsert     — insert or update rows by composite key (used for config/snapshots)
//   clear           — delete all data from transactions/inventory/snapshots + reset config
//   clearByWarehouse — delete rows matching a specific warehouse
//   clearByDateRange — delete transactions in a date range, then rebuild inventory
// ==========================================================
function doPost(e) {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'batchInsert') {
        return handleBatchInsert(body);
    }

    if (action === 'batchUpsert') {
        return handleBatchUpsert(body);
    }

    if (action === 'clear') {
        return handleClear();
    }

    if (action === 'clearByWarehouse') {
        return handleClearByWarehouse(body.warehouse);
    }

    if (action === 'clearByDateRange') {
        return handleClearByDateRange(body.start, body.end);
    }

    if (action === 'updateTransactions') {
        return handleUpdateTransactions(body);
    }

    if (action === 'deleteTransactions') {
        return handleDeleteTransactions(body);
    }

    return jsonResponse({ error: 'Unknown POST action' });
}

// ==========================================================
// BATCH INSERT — append rows to a sheet
// ==========================================================
// Used by the operator app to push new transactions.
// Appends a server timestamp to each row, then updates the inventory
// tab on the server side so the Sheets dashboard stays in sync.
//
// Body: { action: 'batchInsert', sheet: 'transactions', rows: [[...], ...] }
// Each row is an array matching the sheet's column order.
// ==========================================================
function handleBatchInsert(body) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = body.sheet;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });

    var rows = body.rows || [];
    if (rows.length === 0) return jsonResponse({ success: true, count: 0 });

    // Append server timestamp to each row (last column)
    var serverNow = new Date();
    var enriched = rows.map(function (r) { return r.concat([serverNow]); });

    // Write all rows at once for performance
    sheet.getRange(sheet.getLastRow() + 1, 1, enriched.length, enriched[0].length).setValues(enriched);

    // Keep the inventory tab in sync so the Sheets dashboard works
    if (sheetName === 'transactions') {
        updateInventoryFromTransactions(ss, rows);
    }

    return jsonResponse({ success: true, count: rows.length });
}

// ==========================================================
// INVENTORY SYNC — server-side inventory computation
// ==========================================================
// When new transactions are inserted, this function updates the inventory
// tab to match. It processes each transaction and applies it to the
// corresponding inventory row (keyed by product + pack + prodMonth + warehouse).
//
// Transaction types:
//   receive    → add qty to inventory (create row if new)
//   dispatch   → subtract qty from inventory (delete row if qty hits 0)
//   adjustment → set qty to exact value (delete row if qty is 0)
//
// NOTE: The admin panel computes inventory client-side from transactions
// using computeInventory() in sync.js. This server-side update is a
// backup that keeps the inventory tab and the Sheets dashboard in sync.
// ==========================================================
function updateInventoryFromTransactions(ss, newTxRows) {
    var invSheet = ss.getSheetByName('inventory');
    if (!invSheet) return;

    var invHeaders = ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse'];
    var headers_low = invHeaders.map(function (h) { return h.toLowerCase(); });

    // Read current inventory
    var lastRow = invSheet.getLastRow();
    var lastCol = invSheet.getLastColumn();
    var invData = lastRow >= 1 ? invSheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    if (invData.length === 0) {
        invSheet.getRange(1, 1, 1, invHeaders.length).setValues([invHeaders]);
        invData = [invHeaders];
    }

    // Build index: "product|pack|prodMonth|warehouse" → { row, data }
    var invIndex = {};
    for (var r = 1; r < invData.length; r++) {
        var key = (invData[r][0] || '') + '|' + (invData[r][1] || '') + '|' + (invData[r][2] || '') + '|' + (invData[r][5] || '');
        invIndex[key] = { row: r + 1, data: invData[r] };
    }

    // Process only the new transactions
    newTxRows.forEach(function (tx) {
        var product = tx[0] || '';
        var packSize = tx[1] || '';
        var prodMonth = tx[2] || '';
        var expiryMonth = tx[3] || '';
        var qty = parseInt(tx[4]) || 0;
        var type = tx[5] || 'receive';
        var warehouse = tx[7] || '';

        var key = product + '|' + packSize + '|' + prodMonth + '|' + warehouse;
        var existing = invIndex[key];

        if (type === 'receive') {
            if (existing) {
                var curQty = parseInt(existing.data[4]) || 0;
                invSheet.getRange(existing.row, 5).setValue(curQty + qty); // column E = quantity
            } else {
                var newRow = invHeaders.map(function () { return ''; });
                newRow[headers_low.indexOf('product')] = product;
                newRow[headers_low.indexOf('pack_size')] = packSize;
                newRow[headers_low.indexOf('production_month')] = prodMonth;
                newRow[headers_low.indexOf('expiry_month')] = expiryMonth;
                newRow[headers_low.indexOf('quantity')] = qty;
                newRow[headers_low.indexOf('warehouse')] = warehouse;
                invSheet.appendRow(newRow);
                var newLastRow = invSheet.getLastRow();
                var newData = invSheet.getRange(newLastRow, 1, 1, invHeaders.length).getValues()[0];
                invIndex[key] = { row: newLastRow, data: newData };
            }
        } else if (type === 'dispatch') {
            if (existing) {
                var curQty = parseInt(existing.data[4]) || 0;
                var newQty = Math.max(0, curQty - qty);
                if (newQty <= 0) {
                    invSheet.deleteRow(existing.row);
                    delete invIndex[key];
                    // Rebuild index: row numbers below deleted row shifted down by 1
                    for (var k in invIndex) {
                        if (invIndex[k].row > existing.row) invIndex[k].row--;
                    }
                } else {
                    invSheet.getRange(existing.row, 5).setValue(newQty);
                }
            }
        } else if (type === 'adjustment') {
            if (existing) {
                if (qty <= 0) {
                    invSheet.deleteRow(existing.row);
                    delete invIndex[key];
                    for (var k in invIndex) {
                        if (invIndex[k].row > existing.row) invIndex[k].row--;
                    }
                } else {
                    invSheet.getRange(existing.row, 5).setValue(qty);
                    // Update expiry if newer
                    if (expiryMonth) {
                        var curExpiry = existing.data[3] || '';
                        if (!curExpiry || String(curExpiry).trim() === '') {
                            invSheet.getRange(existing.row, 4).setValue(expiryMonth);
                        }
                    }
                }
            } else if (qty > 0) {
                var newRow = invHeaders.map(function () { return ''; });
                newRow[headers_low.indexOf('product')] = product;
                newRow[headers_low.indexOf('pack_size')] = packSize;
                newRow[headers_low.indexOf('production_month')] = prodMonth;
                newRow[headers_low.indexOf('expiry_month')] = expiryMonth;
                newRow[headers_low.indexOf('quantity')] = qty;
                newRow[headers_low.indexOf('warehouse')] = warehouse;
                invSheet.appendRow(newRow);
            }
        }
    });
}

// ==========================================================
// BATCH UPSERT — insert or update rows by composite key
// ==========================================================
// For each item, searches for a row where all compositeKey columns match.
// If found → updates that row. If not → appends a new row.
//
// Used for:
//   - Config tab: upsert by key=["key"] to update shelf-life-config
//   - Snapshots tab: upsert by [snapshot_month, product, pack_size, production_month, warehouse]
//
// Body: { action: 'batchUpsert', sheet: 'config', compositeKey: ['key'], items: [{key: "...", value: "..."}] }
// ==========================================================
function handleBatchUpsert(body) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(body.sheet);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + body.sheet });

    var compositeKey = body.compositeKey || [];
    var items = body.items || [];
    if (items.length === 0) return jsonResponse({ success: true, updated: 0, inserted: 0 });

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var data = lastRow >= 1 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    var headers = data.length > 0 ? data[0] : [];
    var updated = 0, inserted = 0;

    // Process each item — re-read sheet each time since inserts change row count
    items.forEach(function (item) {
        var curLastRow = sheet.getLastRow();
        var curData = curLastRow >= 1 ? sheet.getRange(1, 1, curLastRow, lastCol).getValues() : [];
        var curHeaders = curData.length > 0 ? curData[0] : headers;

        // Search for matching row by composite key
        var foundRow = -1;
        for (var r = 1; r < curData.length; r++) {
            var match = true;
            for (var k = 0; k < compositeKey.length; k++) {
                var colIdx = curHeaders.indexOf(compositeKey[k]);
                if (colIdx < 0 || String(curData[r][colIdx]) !== String(item[compositeKey[k]] || '')) {
                    match = false;
                    break;
                }
            }
            if (match) { foundRow = r + 1; break; }
        }

        if (foundRow > 0) {
            // Update existing row — only overwrite columns present in the item
            curHeaders.forEach(function (h, ci) {
                if (item[h] !== undefined) {
                    sheet.getRange(foundRow, ci + 1).setValue(item[h]);
                }
            });
            updated++;
        } else {
            // Append new row
            var newRow = curHeaders.map(function (h) { return item[h] !== undefined ? item[h] : ''; });
            sheet.appendRow(newRow);
            inserted++;
        }
    });

    return jsonResponse({ success: true, updated: updated, inserted: inserted });
}

// ==========================================================
// CLEAR ACTIONS — delete data from sheets
// ==========================================================

// Deletes all data rows from transactions, inventory, and snapshots.
// Resets config to defaults. Called by admin "Clear Cloud Data" button.
function handleClear() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ['transactions', 'inventory', 'snapshots'].forEach(function (name) {
        var sheet = ss.getSheetByName(name);
        if (sheet && sheet.getLastRow() > 1) {
            sheet.deleteRows(2, sheet.getLastRow() - 1);
        }
    });
    var configSheet = ss.getSheetByName('config');
    if (configSheet) {
        if (configSheet.getLastRow() > 1) configSheet.deleteRows(2, configSheet.getLastRow() - 1);
        configSheet.appendRow(['shelf-life-config', DEFAULT_CONFIG]);
        configSheet.appendRow(['product-list', '[]']);
    }
    return jsonResponse({ success: true });
}

// Deletes all rows matching a specific warehouse name across
// transactions, inventory, and snapshots. Returns the count of cleared rows.
function handleClearByWarehouse(wh) {
    if (!wh) return jsonResponse({ error: 'warehouse required' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var cleared = 0;
    ['transactions', 'inventory', 'snapshots'].forEach(function (name) {
        var sheet = ss.getSheetByName(name);
        if (!sheet || sheet.getLastRow() < 2) return;
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
        var headers = data[0];
        var whIdx = headers.indexOf('warehouse');
        if (whIdx < 0) return;
        // Keep rows that DON'T match the warehouse
        var keep = [headers];
        for (var r = 1; r < data.length; r++) {
            if (String(data[r][whIdx]) !== wh) keep.push(data[r]);
            else cleared++;
        }
        // Delete all data rows, then re-write the kept rows
        sheet.deleteRows(2, lastRow - 1);
        if (keep.length > 1) {
            sheet.getRange(2, 1, keep.length - 1, keep[0].length).setValues(keep.slice(1));
        }
    });
    return jsonResponse({ success: true, cleared: cleared });
}

// Deletes transactions within a date range (by client_timestamp),
// then rebuilds the inventory tab from the remaining transactions.
function handleClearByDateRange(startDate, endDate) {
    if (!startDate || !endDate) return jsonResponse({ error: 'start and end dates required' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var startMs = new Date(startDate).getTime();
    var endMs = new Date(endDate).getTime();
    var txSheet = ss.getSheetByName('transactions');
    var removedCount = 0;

    // Filter out transactions within the date range
    if (txSheet && txSheet.getLastRow() >= 2) {
        var lastRow = txSheet.getLastRow();
        var lastCol = txSheet.getLastColumn();
        var data = txSheet.getRange(1, 1, lastRow, lastCol).getValues();
        var headers = data[0];
        var tsIdx = headers.indexOf('client_timestamp');
        var keep = [headers];
        for (var r = 1; r < data.length; r++) {
            var cellMs = new Date(data[r][tsIdx]).getTime();
            if (cellMs >= startMs && cellMs <= endMs) {
                removedCount++;
            } else {
                keep.push(data[r]);
            }
        }
        txSheet.deleteRows(2, lastRow - 1);
        if (keep.length > 1) {
            txSheet.getRange(2, 1, keep.length - 1, keep[0].length).setValues(keep.slice(1));
        }
    }

    // Rebuild inventory from remaining transactions
    var invSheet = ss.getSheetByName('inventory');
    if (invSheet && invSheet.getLastRow() > 1) {
        invSheet.deleteRows(2, invSheet.getLastRow() - 1);
    }
    if (txSheet && txSheet.getLastRow() >= 2) {
        var allTx = txSheet.getRange(2, 1, txSheet.getLastRow() - 1, txSheet.getLastColumn()).getValues();
        updateInventoryFromTransactions(ss, allTx);
    }

    return jsonResponse({ success: true, transactionsRemoved: removedCount });
}

// ==========================================================
// UPDATE TRANSACTIONS — edit an existing transaction in place
// ==========================================================
// The admin "Edit Transactions" screen edits the source transaction:
// rows are matched by client_timestamp (unchanged, so history order is
// preserved) and only product/pack_size/production_month/expiry_month/
// quantity are overwritten. server_time is bumped so the Sheets dashboard
// reflects the edit. The inventory tab is then rebuilt from all
// transactions because product/pack/productionMonth changes move quantity
// between inventory rows.
//
// Body: { action: 'updateTransactions', items: [{ client_timestamp, product, ... }] }
// ==========================================================
function rebuildInventoryTab(ss, txSheet) {
    var allTx = [];
    if (txSheet.getLastRow() >= 2) {
        allTx = txSheet.getRange(2, 1, txSheet.getLastRow() - 1, txSheet.getLastColumn()).getValues();
    }
    var invSheet = ss.getSheetByName('inventory');
    if (invSheet && invSheet.getLastRow() > 1) {
        invSheet.deleteRows(2, invSheet.getLastRow() - 1);
    }
    if (allTx.length > 0) {
        updateInventoryFromTransactions(ss, allTx);
    }
}

function handleUpdateTransactions(body) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var txSheet = ss.getSheetByName('transactions');
    if (!txSheet) return jsonResponse({ error: 'Sheet not found: transactions' });

    var items = body.items || [];
    if (items.length === 0) return jsonResponse({ success: true, updated: 0 });

    var lastRow = txSheet.getLastRow();
    var lastCol = txSheet.getLastColumn();
    var data = lastRow >= 1 ? txSheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    var headers = data[0];
    var tsIdx = headers.indexOf('client_timestamp');
    if (tsIdx < 0) return jsonResponse({ error: 'client_timestamp column missing' });

    var FIELDS = ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity'];
    var writeCols = {};
    var writeVals = [];
    var updated = 0;

    FIELDS.forEach(function (f) { writeCols[f] = headers.indexOf(f); });
    var serverIdx = headers.indexOf('server_time');

    items.forEach(function (item) {
        var ts = String(item.client_timestamp || '');
        if (!ts) return;
        var found = -1;
        for (var r = 1; r < data.length; r++) {
            if (String(data[r][tsIdx]) === ts) { found = r; break; }
        }
        if (found < 0) return;

        FIELDS.concat(['server_time']).forEach(function (f) {
            var idx = f === 'server_time' ? serverIdx : writeCols[f];
            if (idx < 0) return;
            writeVals.push({ r: found + 1, c: idx + 1, v: f === 'server_time' ? new Date() : item[f] });
        });
        updated++;
    });

    // Batch-write all cells in one go for speed
    writeVals.forEach(function (v) { txSheet.getRange(v.r, v.c).setValue(v.v); });

    rebuildInventoryTab(ss, txSheet);

    return jsonResponse({ success: true, updated: updated });
}

// ==========================================================
// DELETE TRANSACTIONS — remove rows from the transactions
// ledger by client_timestamp, then rebuild the inventory tab.
// Used by the admin Edit screen's Delete button.
//
// Body: { action: 'deleteTransactions', items: [{ client_timestamp }] }
// ==========================================================
function handleDeleteTransactions(body) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var txSheet = ss.getSheetByName('transactions');
    if (!txSheet) return jsonResponse({ error: 'Sheet not found: transactions' });

    var items = body.items || [];
    if (items.length === 0) return jsonResponse({ success: true, deleted: 0 });

    var lastRow = txSheet.getLastRow();
    var lastCol = txSheet.getLastColumn();
    var data = lastRow >= 1 ? txSheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    if (data.length < 2) return jsonResponse({ success: true, deleted: 0 });

    var headers = data[0];
    var tsIdx = headers.indexOf('client_timestamp');
    if (tsIdx < 0) return jsonResponse({ error: 'client_timestamp column missing' });

    var deleteRows = {};
    items.forEach(function (item) {
        var ts = String(item.client_timestamp || '');
        if (!ts) return;
        for (var r = 1; r < data.length; r++) {
            if (String(data[r][tsIdx]) === ts) { deleteRows[r] = true; break; }
        }
    });

    var rows = Object.keys(deleteRows).map(Number).sort(function (a, b) { return b - a; });
    rows.forEach(function (r) { txSheet.deleteRow(r + 1); });

    rebuildInventoryTab(ss, txSheet);

    return jsonResponse({ success: true, deleted: rows.length });
}

// ==========================================================
// AUTO MONTH-END SNAPSHOTS — time-triggered month-end freezer
// ==========================================================
// On the 1st of each month, stores the prior month's closing inventory
// (product-wise, mirroring the admin report's cumulative rebuild) into
// the snapshots tab. Idempotent: months already stored are skipped.
// Writes ONLY to snapshots — never touches transactions/inventory.
// Month boundaries use Bangladesh time (+6) to match the report.
// ==========================================================
var SNAPSHOT_BD_OFFSET_MS = 6 * 60 * 60 * 1000;

// End of month m (1-12) of year y in BD local time, as a UTC ms instant.
function bdMonthEndTs(y, m) {
    return Date.UTC(y, m, 1) - SNAPSHOT_BD_OFFSET_MS - 1;
}

// Returns { y, m } of the end of the expiry month, or null if unparseable.
// Accepts "Mar 2028" (as stored on the sheet) or a Date object.
function snapshotExpiryYearMonth_(expiryStr) {
    var s = expiryStr instanceof Date
        ? normalizeDateValue(expiryStr, 'expiry_month')
        : String(expiryStr || '').trim();
    var p = s.split(' ');
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var mi = monthNames.indexOf(p[0]);
    var y = parseInt(p[1], 10);
    if (mi < 0 || isNaN(y) || String(y).length !== 4) return null;
    return { y: y, m: mi };
}

// Whole months from snapshot month-end to expiry month-end (matches report age buckets).
function snapshotAgeMonths_(expiryStr, refY, refM) {
    var e = snapshotExpiryYearMonth_(expiryStr);
    if (!e) return null;
    return (e.y - refY) * 12 + (e.m - refM);
}

// Prompts are the months (BD) from minMs to maxMs — never empty.
function snapshotCandidateMonths_(minMs, maxMs) {
    var y1, m1, y2, m2, months = [];
    var d1 = new Date(minMs + SNAPSHOT_BD_OFFSET_MS), d2 = new Date(maxMs + SNAPSHOT_BD_OFFSET_MS);
    y1 = d1.getUTCFullYear(); m1 = d1.getUTCMonth();
    y2 = d2.getUTCFullYear(); m2 = d2.getUTCMonth();
    while (y1 < y2 || (y1 === y2 && m1 <= m2)) {
        months.push({ y: y1, m: m1 });
        m1++; if (m1 > 11) { m1 = 0; y1++; }
    }
    return months;
}

// Builds one month's closing inventory rows using the same cumulative rules
// the admin report uses: receive +, dispatch -, adjustment = ; expiry of the
// first lot per key wins. Key: product|pack_size|production_month|warehouse.
function snapshotBuildRows_(txs, y, m) {
    var cutoff = bdMonthEndTs(y, m);
    var sorted = txs.filter(function (t) { return t.ts <= cutoff; });
    sorted.sort(function (a, b) { return a.ts - b.ts; });
    var inv = {};
    sorted.forEach(function (t) {
        var key = t.product + '|' + t.pack + '|' + t.prod + '|' + t.wh;
        var cur = inv[key];
        if (t.type === 'receive') {
            if (cur) { cur.qty += t.qty; }
            else { inv[key] = { product: t.product, pack: t.pack, prod: t.prod, expiry: t.expiry, qty: t.qty, wh: t.wh }; }
        } else if (t.type === 'dispatch') {
            if (cur) { cur.qty = Math.max(0, cur.qty - t.qty); if (cur.qty === 0) delete inv[key]; }
        } else if (t.type === 'adjustment') {
            if (cur) { cur.qty = t.qty; }
            else if (t.qty > 0) { inv[key] = { product: t.product, pack: t.pack, prod: t.prod, expiry: t.expiry, qty: t.qty, wh: t.wh }; }
        }
    });
    var snapshotMonth = y + '-' + ('0' + (m + 1)).slice(-2);
    var rows = [];
    Object.keys(inv).forEach(function (k) {
        var i = inv[k];
        if (i.qty > 0) {
            rows.push({
                snapshot_month: snapshotMonth,
                product: i.product,
                pack_size: i.pack,
                production_month: i.prod,
                expiry_month: i.expiry,
                quantity: i.qty,
                warehouse: i.wh,
                age_months: snapshotAgeMonths_(i.expiry, y, m)
            });
        }
    });
    return rows;
}

// Scheduled entry point (time trigger, 1st of month). Also safe to run
// manually from the editor — it only writes months that have ended and are
// not already stored, so re-runs are harmless.
function autoSnapshotMonthEnd() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var txSheet = ss.getSheetByName('transactions');
    if (!txSheet || txSheet.getLastRow() < 2) return { success: false, reason: 'no transactions' };

    var data = txSheet.getRange(1, 1, txSheet.getLastRow(), txSheet.getLastColumn()).getValues();
    var headers = data[0];
    function col(h) { return headers.indexOf(h); }
    var cProd = col('product'), cPack = col('pack_size'), cProdM = col('production_month'),
        cExp = col('expiry_month'), cQty = col('quantity'), cType = col('type'),
        cWh = col('warehouse'), cTs = col('client_timestamp');
    if (cTs < 0) return { success: false, reason: 'client_timestamp column missing' };

    var txs = [], minMs = Infinity, maxMs = 0;
    for (var r = 1; r < data.length; r++) {
        var ts = new Date(data[r][cTs]).getTime();
        if (isNaN(ts)) continue; // undated rows never belong to a completed month
        txs.push({
            product: String(data[r][cProd] || ''),
            pack: String(data[r][cPack] || ''),
            prod: String(data[r][cProdM] || ''),
            expiry: data[r][cExp] instanceof Date ? normalizeDateValue(data[r][cExp], 'expiry_month') : String(data[r][cExp] || ''),
            qty: Number(data[r][cQty] || 0),
            type: String(data[r][cType] || ''),
            wh: String(data[r][cWh] || ''),
            ts: ts
        });
        if (ts < minMs) minMs = ts;
        if (ts > maxMs) maxMs = ts;
    }
    if (txs.length === 0) return { success: false, reason: 'no dated transactions' };

    // Months (BD) already frozen in the snapshots tab
    var snapSheet = ss.getSheetByName('snapshots');
    var stored = {};
    if (snapSheet && snapSheet.getLastRow() >= 2) {
        var sData = snapSheet.getRange(1, 1, snapSheet.getLastRow(), snapSheet.getLastColumn()).getValues();
        var sMi = sData[0].indexOf('snapshot_month');
        for (var s = 1; s < sData.length; s++) { stored[String(sData[s][sMi] || '')] = true; }
    }

    var nowMs = Date.now();
    var wrote = { months: [], rows: 0 };
    snapshotCandidateMonths_(minMs, maxMs).forEach(function (mo) {
        var snapshotMonth = mo.y + '-' + ('0' + (mo.m + 1)).slice(-2);
        if (stored[snapshotMonth]) return;                      // already frozen
        if (bdMonthEndTs(mo.y, mo.m) >= nowMs) return;          // month not ended yet
        var rows = snapshotBuildRows_(txs, mo.y, mo.m);
        if (rows.length === 0) return;                          // no inventory at that month end
        handleBatchUpsert({
            sheet: 'snapshots',
            compositeKey: ['snapshot_month', 'product', 'pack_size', 'production_month', 'expiry_month', 'warehouse'],
            items: rows
        });
        wrote.months.push(snapshotMonth);
        wrote.rows += rows.length;
    });

    return { success: true, stored: wrote };
}

// One-time install (run manually from the editor): creates a monthly time
// trigger for autoSnapshotMonthEnd, removing any duplicate triggers first.
function installAutoSnapshotTrigger() {
    ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'autoSnapshotMonthEnd') ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('autoSnapshotMonthEnd').timeBased().onMonthDay(1).atHour(0).create();
    return jsonResponse({ success: true, message: 'autoSnapshotMonthEnd trigger scheduled for 1st of each month at 00:00' });
}

// ==========================================================
// HELPERS
// ==========================================================

// Wraps data in a JSON response with the correct content type.
function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
