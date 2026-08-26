// sync.js — Offline-first sync between localStorage and Google Sheets
// Shared by operator app and admin panel
(function () {
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEJY8ckQ0BaQr_14xav_K5MtMVFra2bq74xWy9Q9TogJ_roWR64xI9iSgLvS5xRck_bg/exec';

    var isSyncing = false;
    var syncCallbacks = [];
    var syncStatus = { lastSync: null, error: null, txCount: 0, ok: false };

    function loadRaw(key) {
        try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch (e) { return null; }
    }

    function computeInventory(transactions) {
        var inv = {};
        transactions.forEach(function (tx) {
            var key = (tx.product || '') + '|' + (tx.packSize || '') + '|' + (tx.productionMonth || '') + '|' + (tx.warehouse || '');
            if (!inv[key]) {
                inv[key] = { product: tx.product || '', packSize: tx.packSize || '', productionMonth: tx.productionMonth || '', expiryMonth: tx.expiryMonth || '', quantity: 0, warehouse: tx.warehouse || '' };
            }
            if (tx.type === 'receive') inv[key].quantity += tx.quantity || 0;
            else if (tx.type === 'dispatch') inv[key].quantity = Math.max(0, inv[key].quantity - (tx.quantity || 0));
            else if (tx.type === 'adjustment') inv[key].quantity = tx.quantity || 0;
        });
        return Object.values(inv).filter(function (i) { return i.quantity > 0; });
    }

    function apiGet(action, params) {
        var qs = 'action=' + encodeURIComponent(action);
        if (params) {
            Object.keys(params).forEach(function (k) {
                qs += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            });
        }
        return fetch(APPS_SCRIPT_URL + '?' + qs)
            .then(function (r) { return r.json(); });
    }

    function apiPost(payload) {
        return fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); });
    }

    var sync = {
        init: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) {
                console.warn('sync: Apps Script URL not configured, running localStorage-only');
                return;
            }
            window.addEventListener('online', function () { sync.syncAll(); });
        },

        onSync: function (cb) { syncCallbacks.push(cb); },

        getSyncStatus: function () { return syncStatus; },

        ping: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve({ ok: false });
            return apiGet('ping').catch(function () { return { ok: false }; });
        },

        _apiPost: apiPost,

        // =====================================================
        // LOCAL STORAGE — tag pending items
        // =====================================================

        saveLocal: function (key, data) {
            if (data && data.transactions) {
                var existing = loadRaw(key);
                var syncedTs = {};
                if (existing && existing.transactions) {
                    existing.transactions.forEach(function (t) {
                        if (t.synced) syncedTs[t.timestamp] = true;
                    });
                }
                data.transactions = data.transactions.map(function (t) {
                    if (t.synced === undefined) {
                        t.synced = syncedTs[t.timestamp] ? true : false;
                    }
                    return t;
                });
            }
            localStorage.setItem(key, JSON.stringify(data));

            if (navigator.onLine && !isSyncing && APPS_SCRIPT_URL && APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') === -1) {
                sync.syncAll();
            } else if (navigator.onLine && isSyncing) {
                sync._retryNeeded = true;
            }
        },

        // =====================================================
        // PUSH — send pending transactions to Google Sheets
        // =====================================================

        syncAll: function () {
            if (isSyncing || !APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return;
            isSyncing = true;

            var opData = loadRaw('operator-data');
            if (!opData) { isSyncing = false; return; }

            var pendingTx = (opData.transactions || []).filter(function (t) { return !t.synced; });
            if (pendingTx.length === 0) { isSyncing = false; return; }

            var txHeaders = ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'type', 'operator', 'warehouse', 'client_timestamp', 'client_date'];
            var txRows = pendingTx.map(function (tx) {
                return txHeaders.map(function (h) {
                    switch (h) {
                        case 'pack_size': return tx.packSize || '';
                        case 'production_month': return tx.productionMonth || '';
                        case 'expiry_month': return tx.expiryMonth || '';
                        case 'client_timestamp': return tx.timestamp || '';
                        case 'client_date': return tx.date || '';
                        case 'operator': return tx.operator || '';
                        default: return tx[h] || '';
                    }
                });
            });

            apiPost({ action: 'batchInsert', sheet: 'transactions', rows: txRows })
                .then(function () {
                    var currentData = loadRaw('operator-data') || opData;
                    var syncedSet = {};
                    pendingTx.forEach(function (t) { syncedSet[t.timestamp] = true; });
                    if (currentData.transactions) {
                        currentData.transactions.forEach(function (t) {
                            if (syncedSet[t.timestamp]) t.synced = true;
                        });
                    }
                    localStorage.setItem('operator-data', JSON.stringify(currentData));
                    syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
                })
                .catch(function (e) {
                    console.warn('Sync failed (will retry):', e.message || e);
                })
                .finally(function () {
                    isSyncing = false;
                    if (sync._retryNeeded) {
                        sync._retryNeeded = false;
                        sync.syncAll();
                    }
                });
        },

        // =====================================================
        // PULL — read from Google Sheets
        // =====================================================

        pullInventory: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve([]);
            return apiGet('read', { sheet: 'inventory' }).then(function (data) {
                return Array.isArray(data) ? data : [];
            }).catch(function () { return []; });
        },

        pullTransactions: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve([]);
            return apiGet('read', { sheet: 'transactions' }).then(function (data) {
                return Array.isArray(data) ? data : [];
            }).catch(function () { return []; });
        },

        pullTransactionsSince: function (since) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve([]);
            if (!since) return sync.pullTransactions();
            return apiGet('readSince', { sheet: 'transactions', since: since }).then(function (data) {
                return Array.isArray(data) ? data : [];
            }).catch(function () { return []; });
        },

        pullAll: function () {
            var lastSyncTs = loadRaw('last-sync-ts') || '';
            var isFullPull = !lastSyncTs;

            var fetchFn = isFullPull
                ? sync.pullTransactions()
                : sync.pullTransactionsSince(lastSyncTs);

            return fetchFn.then(function (txRows) {
                var localData = loadRaw('operator-data') || { transactions: [], inventory: [] };
                var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

                if (isFullPull) {
                    // Full pull: replace all cloud transactions
                    var cloudTx = {};
                    txRows.forEach(function (t) {
                        var ts = t.client_timestamp || '';
                        var exp = t.expiry_month || '';
                        if (typeof exp === 'string' && exp.indexOf('T') > -1) {
                            var d = new Date(exp);
                            if (!isNaN(d.getTime())) exp = monthNames[d.getMonth()] + ' ' + d.getFullYear();
                        }
                        if (ts && !cloudTx[ts]) {
                            cloudTx[ts] = {
                                product: t.product || '',
                                packSize: t.pack_size || '',
                                productionMonth: t.production_month || '',
                                expiryMonth: exp,
                                quantity: parseInt(t.quantity) || 0,
                                type: t.type || 'receive',
                                operator: t.operator || '',
                                warehouse: t.warehouse || '',
                                timestamp: ts,
                                date: t.client_date || '',
                                synced: true
                            };
                        }
                    });
                    var localPendingTx = (localData.transactions || []).filter(function (t) { return !t.synced; });
                    var mergedTx = Object.values(cloudTx);
                    localPendingTx.forEach(function (t) {
                        if (!cloudTx[t.timestamp]) mergedTx.push(t);
                    });
                } else {
                    // Delta pull: append new cloud txs, replace existing synced ones
                    var existingTx = localData.transactions || [];
                    var existingTs = {};
                    existingTx.forEach(function (t) { existingTs[t.timestamp] = t; });

                    txRows.forEach(function (t) {
                        var ts = t.client_timestamp || '';
                        if (!ts) return;
                        var exp = t.expiry_month || '';
                        if (typeof exp === 'string' && exp.indexOf('T') > -1) {
                            var d = new Date(exp);
                            if (!isNaN(d.getTime())) exp = monthNames[d.getMonth()] + ' ' + d.getFullYear();
                        }
                        existingTs[ts] = {
                            product: t.product || '',
                            packSize: t.pack_size || '',
                            productionMonth: t.production_month || '',
                            expiryMonth: exp,
                            quantity: parseInt(t.quantity) || 0,
                            type: t.type || 'receive',
                            operator: t.operator || '',
                            warehouse: t.warehouse || '',
                            timestamp: ts,
                            date: t.client_date || '',
                            synced: true
                        };
                    });
                    var mergedTx = Object.values(existingTs);
                }

                var mergedInv = computeInventory(mergedTx);
                var merged = { transactions: mergedTx, inventory: mergedInv };
                localStorage.setItem('operator-data', JSON.stringify(merged));

                // Track the latest timestamp for next delta sync
                var maxTs = '';
                mergedTx.forEach(function (t) {
                    if (t.synced && t.timestamp > maxTs) maxTs = t.timestamp;
                });
                if (maxTs) localStorage.setItem('last-sync-ts', maxTs);

                syncStatus.lastSync = Date.now();
                syncStatus.error = null;
                syncStatus.txCount = mergedTx.length;
                syncStatus.ok = true;
                syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
                return merged;
            }).catch(function (e) {
                console.error('pullAll failed:', e.message || e, e);
                syncStatus.error = e.message || String(e);
                syncStatus.ok = false;
                return loadRaw('operator-data') || { transactions: [], inventory: [] };
            });
        },

        // =====================================================
        // CONFIG
        // =====================================================

        pullConfig: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiGet('readFiltered', { sheet: 'config', key: 'key', value: 'shelf-life-config' }).then(function (data) {
                if (data && data.value) {
                    var val = data.value;
                    if (typeof val === 'string') {
                        try { JSON.parse(val); localStorage.setItem('shelf-life-config', val); } catch (e) {}
                    } else if (typeof val === 'object' && val !== null) {
                        localStorage.setItem('shelf-life-config', JSON.stringify(val));
                    }
                }
            }).catch(function (e) {
                console.warn('pullConfig error', e.message || e);
            });
        },

        pullProducts: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiGet('readFiltered', { sheet: 'config', key: 'key', value: 'product-list' }).then(function (data) {
                if (data && data.value) {
                    var val = data.value;
                    var list = typeof val === 'string' ? JSON.parse(val) : val;
                    if (list && list.length > 0) {
                        localStorage.setItem('synced-products', JSON.stringify(list));
                    }
                }
            }).catch(function (e) {
                console.warn('pullProducts error', e.message || e);
            });
        },

        pushConfig: function (cfg) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiPost({
                action: 'batchUpsert',
                sheet: 'config',
                compositeKey: ['key'],
                items: [{ key: 'shelf-life-config', value: JSON.stringify(cfg) }]
            }).catch(function (e) { console.warn('pushConfig error', e.message || e); });
        },

        pushProducts: function (productList) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiPost({
                action: 'batchUpsert',
                sheet: 'config',
                compositeKey: ['key'],
                items: [{ key: 'product-list', value: JSON.stringify(productList) }]
            }).catch(function (e) { console.warn('pushProducts error', e.message || e); });
        },

        // =====================================================
        // SNAPSHOTS
        // =====================================================

        saveSnapshot: function (rows) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1 || !rows || rows.length === 0) return Promise.resolve();
            var items = rows.map(function (row) {
                return {
                    snapshot_month: row.snapshot_month || '',
                    product: row.product || '',
                    pack_size: row.pack_size || '',
                    production_month: row.production_month || '',
                    expiry_month: row.expiry_month || '',
                    quantity: row.quantity || 0,
                    warehouse: row.warehouse || '',
                    age_months: row.age_months || 0
                };
            });
            return apiPost({
                action: 'batchUpsert',
                sheet: 'snapshots',
                compositeKey: ['snapshot_month', 'product', 'pack_size', 'production_month', 'warehouse'],
                items: items
            }).catch(function (e) { console.warn('saveSnapshot error', e.message || e); });
        },

        getMonthlySnapshots: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve([]);
            return apiGet('read', { sheet: 'snapshots' }).then(function (data) {
                if (!Array.isArray(data)) return [];
                return data.sort(function (a, b) {
                    return (a.snapshot_month || '').localeCompare(b.snapshot_month || '');
                });
            }).catch(function () { return []; });
        },

        // =====================================================
        // CLEAR
        // =====================================================

        clearCloud: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiPost({ action: 'clear' }).catch(function (e) { console.warn('clearCloud error', e.message || e); });
        },

        clearByWarehouse: function (warehouse) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiPost({ action: 'clearByWarehouse', warehouse: warehouse }).catch(function (e) { console.warn('clearByWarehouse error', e.message || e); });
        },

        clearByDateRange: function (start, end) {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('YOUR_DEPLOYMENT_URL') !== -1) return Promise.resolve();
            return apiPost({ action: 'clearByDateRange', start: start, end: end }).catch(function (e) { console.warn('clearByDateRange error', e.message || e); });
        }
    };

    window.syncManager = sync;
})();
