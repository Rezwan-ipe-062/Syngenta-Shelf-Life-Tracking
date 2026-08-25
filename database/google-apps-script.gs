// ==========================================================
// Google Apps Script — Shelf Life Tracking v3 Backend
// ==========================================================
// SETUP:
//   1. Open your Google Sheet
//   2. Extensions → Apps Script
//   3. Paste this entire file
//   4. Run setupSheet() once (Run menu → setupSheet)
//   5. Deploy: New deployment → Web app → Execute as: Me → Anyone access
//   6. Copy the deployment URL into sync.js
// ==========================================================

var DEFAULT_CONFIG = '{"operatorPins":[{"name":"Default","pin":"1234","warehouse":"Chittagong"}],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}';

function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var tabs = {
        'transactions': ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'type', 'operator', 'warehouse', 'client_timestamp', 'client_date', 'server_time'],
        'inventory': ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse'],
        'snapshots': ['snapshot_month', 'product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse', 'age_months'],
        'config': ['key', 'value']
    };

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

    var configSheet = ss.getSheetByName('config');
    if (configSheet.getLastRow() < 2) {
        configSheet.appendRow(['shelf-life-config', DEFAULT_CONFIG]);
        configSheet.appendRow(['product-list', '[]']);
    }

    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
        ss.deleteSheet(defaultSheet);
    }

    SpreadsheetApp.getUi().alert('Setup complete!\n\nTabs: transactions, inventory, snapshots, config\n\nNow deploy as web app.');
}

// ==========================================================
// GET
// ==========================================================

function doGet(e) {
    var action = e.parameter.action;

    if (action === 'read') {
        return readSheet(e.parameter.sheet);
    }

    if (action === 'readFiltered') {
        return readFiltered(e.parameter.sheet, e.parameter.key, e.parameter.value);
    }

    return jsonResponse({ error: 'Unknown GET action' });
}

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
        headers.forEach(function (h, i) { obj[h] = row[i]; });
        return obj;
    });
    return jsonResponse(rows);
}

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
            headers.forEach(function (h, j) { obj[h] = data[i][j]; });
            return jsonResponse(obj);
        }
    }
    return jsonResponse(null);
}

// ==========================================================
// POST
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

    return jsonResponse({ error: 'Unknown POST action' });
}

// ==========================================================
// batchInsert — append rows + server-side inventory update
// ==========================================================

function handleBatchInsert(body) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = body.sheet;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });

    var rows = body.rows || [];
    if (rows.length === 0) return jsonResponse({ success: true, count: 0 });

    var serverNow = new Date();
    var enriched = rows.map(function (r) { return r.concat([serverNow]); });

    sheet.getRange(sheet.getLastRow() + 1, 1, enriched.length, enriched[0].length).setValues(enriched);

    // Server-side inventory update when transactions arrive
    if (sheetName === 'transactions') {
        updateInventoryFromTransactions(ss, rows);
    }

    return jsonResponse({ success: true, count: rows.length });
}

function updateInventoryFromTransactions(ss, txRows) {
    var invSheet = ss.getSheetByName('inventory');
    if (!invSheet) return;

    var headers = ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'warehouse'];
    var lastRow = invSheet.getLastRow();
    var lastCol = invSheet.getLastColumn();
    var invData = lastRow >= 1 ? invSheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    var invHeaders = invData.length > 0 ? invData[0] : headers;

    // If sheet is empty (header only or no data), write headers first
    if (invData.length === 0) {
        invSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        invHeaders = headers;
    }

    // Build inventory index: key → {row, quantity}
    var invIndex = {};
    for (var r = 1; r < invData.length; r++) {
        var key = buildInvKey(invData[r], invHeaders);
        invIndex[key] = { row: r + 1, data: invData[r] };
    }

    var invHeaders_low = invHeaders.map(function (h) { return h.toLowerCase(); });

    txRows.forEach(function (tx) {
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
                var curQty = getQty(existing.data, invHeaders);
                setQty(invSheet, existing.row, invHeaders, curQty + qty);
                // Update expiry month if provided
                updateExpiryIfNewer(invSheet, existing.row, invHeaders, expiryMonth);
            } else {
                var newRow = headers.map(function () { return ''; });
                newRow[invHeaders_low.indexOf('product')] = product;
                newRow[invHeaders_low.indexOf('pack_size')] = packSize;
                newRow[invHeaders_low.indexOf('production_month')] = prodMonth;
                newRow[invHeaders_low.indexOf('expiry_month')] = expiryMonth;
                newRow[invHeaders_low.indexOf('quantity')] = qty;
                newRow[invHeaders_low.indexOf('warehouse')] = warehouse;
                invSheet.appendRow(newRow);
                // Update index
                var newLastRow = invSheet.getLastRow();
                var newData = invSheet.getRange(newLastRow, 1, 1, invHeaders.length).getValues()[0];
                invIndex[key] = { row: newLastRow, data: newData };
            }
        } else if (type === 'dispatch') {
            if (existing) {
                var curQty = getQty(existing.data, invHeaders);
                var newQty = Math.max(0, curQty - qty);
                if (newQty <= 0) {
                    invSheet.deleteRow(existing.row);
                } else {
                    setQty(invSheet, existing.row, invHeaders, newQty);
                }
            }
        } else if (type === 'adjustment') {
            if (existing) {
                if (qty <= 0) {
                    invSheet.deleteRow(existing.row);
                } else {
                    setQty(invSheet, existing.row, invHeaders, qty);
                    updateExpiryIfNewer(invSheet, existing.row, invHeaders, expiryMonth);
                }
            } else if (qty > 0) {
                var newRow = headers.map(function () { return ''; });
                newRow[invHeaders_low.indexOf('product')] = product;
                newRow[invHeaders_low.indexOf('pack_size')] = packSize;
                newRow[invHeaders_low.indexOf('production_month')] = prodMonth;
                newRow[invHeaders_low.indexOf('expiry_month')] = expiryMonth;
                newRow[invHeaders_low.indexOf('quantity')] = qty;
                newRow[invHeaders_low.indexOf('warehouse')] = warehouse;
                invSheet.appendRow(newRow);
            }
        }
    });
}

function buildInvKey(row, headers) {
    var pIdx = headers.indexOf('product');
    var psIdx = headers.indexOf('pack_size');
    var pmIdx = headers.indexOf('production_month');
    var wIdx = headers.indexOf('warehouse');
    return (row[pIdx] || '') + '|' + (row[psIdx] || '') + '|' + (row[pmIdx] || '') + '|' + (row[wIdx] || '');
}

function getQty(row, headers) {
    var idx = headers.indexOf('quantity');
    return idx >= 0 ? (parseInt(row[idx]) || 0) : 0;
}

function setQty(sheet, rowNum, headers, qty) {
    var idx = headers.indexOf('quantity');
    if (idx >= 0) sheet.getRange(rowNum, idx + 1).setValue(qty);
}

function updateExpiryIfNewer(sheet, rowNum, headers, expiryMonth) {
    if (!expiryMonth) return;
    var idx = headers.indexOf('expiry_month');
    if (idx >= 0) {
        var current = sheet.getRange(rowNum, idx + 1).getValue();
        if (!current || String(current).trim() === '') {
            sheet.getRange(rowNum, idx + 1).setValue(expiryMonth);
        }
    }
}

// ==========================================================
// batchUpsert — upsert rows by composite key
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

    items.forEach(function (item) {
        var curLastRow = sheet.getLastRow();
        var curData = curLastRow >= 1 ? sheet.getRange(1, 1, curLastRow, lastCol).getValues() : [];
        var curHeaders = curData.length > 0 ? curData[0] : headers;

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
            curHeaders.forEach(function (h, ci) {
                if (item[h] !== undefined) {
                    sheet.getRange(foundRow, ci + 1).setValue(item[h]);
                }
            });
            updated++;
        } else {
            var newRow = curHeaders.map(function (h) { return item[h] !== undefined ? item[h] : ''; });
            sheet.appendRow(newRow);
            inserted++;
        }
    });

    return jsonResponse({ success: true, updated: updated, inserted: inserted });
}

// ==========================================================
// Clear actions
// ==========================================================

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
        var keep = [headers];
        for (var r = 1; r < data.length; r++) {
            if (String(data[r][whIdx]) !== wh) keep.push(data[r]);
            else cleared++;
        }
        sheet.deleteRows(2, lastRow - 1);
        if (keep.length > 1) {
            sheet.getRange(2, 1, keep.length - 1, keep[0].length).setValues(keep.slice(1));
        }
    });
    return jsonResponse({ success: true, cleared: cleared });
}

function handleClearByDateRange(startDate, endDate) {
    if (!startDate || !endDate) return jsonResponse({ error: 'start and end dates required' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var startMs = new Date(startDate).getTime();
    var endMs = new Date(endDate).getTime();
    var txSheet = ss.getSheetByName('transactions');
    var removedCount = 0;
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
// Helpers
// ==========================================================

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
