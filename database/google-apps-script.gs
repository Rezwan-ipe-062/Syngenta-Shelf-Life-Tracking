// ==========================================================
// Google Apps Script — Shelf Life Tracking Backend (v2.0)
// ==========================================================
// SETUP: Paste this into your Google Sheet → Extensions → Apps Script
//        Then run setupSheet() from the Run menu (once, to create tabs)
//        Then deploy: New deployment → Web app → Execute as: Me → Anyone access
//        Copy the deployment URL into syncManager.js
// ==========================================================

function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var tabs = {
        'transactions': ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'type', 'operator_name', 'warehouse', 'client_timestamp', 'client_date', 'server_timestamp'],
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
        configSheet.appendRow(['shelf-life-config', '{"operatorPins":[],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}']);
        configSheet.appendRow(['product-list', '[]']);
    }

    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
        ss.deleteSheet(defaultSheet);
    }

    Logger.log('Setup complete! Tabs created: transactions, inventory, snapshots, config');
    SpreadsheetApp.getUi().alert('Setup complete!\n\nTabs created: transactions, inventory, snapshots, config\n\nNow deploy as web app (Deploy → New deployment → Web app).');
}

function doGet(e) {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'read') {
        var sheetName = e.parameter.sheet;
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) return jsonResponse([]);
        var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
        var headers = data[0];
        var rows = data.slice(1).map(function (row) {
            var obj = {};
            headers.forEach(function (h, i) { obj[h] = row[i]; });
            return obj;
        });
        return jsonResponse(rows);
    }

    if (action === 'readFiltered') {
        var sheetName = e.parameter.sheet;
        var key = e.parameter.key;
        var value = e.parameter.value;
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) return jsonResponse(null);
        var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
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

    return jsonResponse({ error: 'Unknown GET action' });
}

function doPost(e) {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'batchInsert') {
        var sheet = ss.getSheetByName(body.sheet);
        if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + body.sheet });
        var rows = body.rows || [];
        if (rows.length > 0) {
            var serverNow = new Date();
            var enriched = rows.map(function (r) { return r.concat([serverNow]); });
            sheet.getRange(sheet.getLastRow() + 1, 1, enriched.length, enriched[0].length).setValues(enriched);
        }
        return jsonResponse({ success: true, count: rows.length });
    }

    if (action === 'batchUpsert') {
        var sheet = ss.getSheetByName(body.sheet);
        if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + body.sheet });
        var compositeKey = body.compositeKey || [];
        var items = body.items || [];
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        var data = lastRow >= 2 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
        var headers = data.length > 0 ? data[0] : [];
        var updated = 0, inserted = 0;

        items.forEach(function (item) {
            var curLastRow = sheet.getLastRow();
            var curData = curLastRow >= 2 ? sheet.getRange(1, 1, curLastRow, lastCol).getValues() : [];
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

    if (action === 'clear') {
        var sheetNames = ['transactions', 'inventory', 'snapshots', 'config'];
        sheetNames.forEach(function (name) {
            var sheet = ss.getSheetByName(name);
            if (sheet && sheet.getLastRow() > 1) {
                sheet.deleteRows(2, sheet.getLastRow() - 1);
            }
        });
        var configSheet = ss.getSheetByName('config');
        if (configSheet) {
            configSheet.appendRow(['shelf-life-config', '{"operatorPins":[],"expiryYears":{"start":2025,"end":2030},"prodYears":{"start":5,"end":6},"warehouses":["Chittagong","Gazipur","Jessore","Bogura"]}']);
            configSheet.appendRow(['product-list', '[]']);
        }
        return jsonResponse({ success: true });
    }

    if (action === 'clearByWarehouse') {
        var wh = body.warehouse;
        if (!wh) return jsonResponse({ error: 'warehouse required' });
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

    if (action === 'clearByDateRange') {
        var startDate = body.start;
        var endDate = body.end;
        if (!startDate || !endDate) return jsonResponse({ error: 'start and end dates required' });
        var startMs = new Date(startDate).getTime();
        var endMs = new Date(endDate).getTime();
        var txSheet = ss.getSheetByName('transactions');
        if (txSheet && txSheet.getLastRow() >= 2) {
            var lastRow = txSheet.getLastRow();
            var lastCol = txSheet.getLastColumn();
            var data = txSheet.getRange(1, 1, lastRow, lastCol).getValues();
            var headers = data[0];
            var tsIdx = headers.indexOf('client_timestamp');
            var keep = [headers];
            var removedCount = 0;
            for (var r = 1; r < data.length; r++) {
                var cellVal = data[r][tsIdx];
                var cellMs = new Date(cellVal).getTime();
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
            var invSheet = ss.getSheetByName('inventory');
            if (invSheet && invSheet.getLastRow() >= 2) {
                invSheet.deleteRows(2, invSheet.getLastRow() - 1);
            }
            return jsonResponse({ success: true, transactionsRemoved: removedCount });
        }
        return jsonResponse({ success: true, transactionsRemoved: 0 });
    }

    return jsonResponse({ error: 'Unknown POST action' });
}

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
