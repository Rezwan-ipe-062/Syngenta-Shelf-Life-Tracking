// sync.js — Offline-first sync between localStorage and Google Sheets
// Shared by operator app and admin panel
(function () {
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_URL/exec';

    var isSyncing = false;
    var syncCallbacks = [];

    function loadRaw(key) {
        try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch (e) { return null; }
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

        pullAll: function () {
            return Promise.all([
                sync.pullTransactions(),
                sync.pullInventory()
            ]).then(function (results) {
                var txRows = results[0];
                var invRows = results[1];

                var localData = loadRaw('operator-data') || { transactions: [], inventory: [] };

                // Build cloud transactions (deduped by timestamp)
                var cloudTx = {};
                txRows.forEach(function (t) {
                    var ts = t.client_timestamp || '';
                    if (ts && !cloudTx[ts]) {
                        cloudTx[ts] = {
                            product: t.product || '',
                            packSize: t.pack_size || '',
                            productionMonth: t.production_month || '',
                            expiryMonth: t.expiry_month || '',
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

                // Build cloud inventory (deduped and aggregated)
                var cloudInv = {};
                invRows.forEach(function (i) {
                    var key = (i.product || '') + '|' + (i.pack_size || '') + '|' + (i.production_month || '') + '|' + (i.warehouse || '');
                    if (!cloudInv[key]) {
                        cloudInv[key] = {
                            product: i.product || '',
                            packSize: i.pack_size || '',
                            productionMonth: i.production_month || '',
                            expiryMonth: i.expiry_month || '',
                            quantity: 0,
                            warehouse: i.warehouse || ''
                        };
                    }
                    cloudInv[key].quantity += (parseInt(i.quantity) || 0);
                });

                // Merge: cloud transactions + unmatched local pending
                var localPendingTx = (localData.transactions || []).filter(function (t) { return !t.synced; });
                var mergedTx = Object.values(cloudTx);
                localPendingTx.forEach(function (t) {
                    if (!cloudTx[t.timestamp]) mergedTx.push(t);
                });

                // Merge: cloud inventory + local pending inventory
                var mergedInv = Object.values(cloudInv);
                var localPendingInv = (localData.inventory || []).filter(function (i) { return !i.synced; });
                localPendingInv.forEach(function (i) {
                    mergedInv.push(i);
                });

                var merged = { transactions: mergedTx, inventory: mergedInv };
                localStorage.setItem('operator-data', JSON.stringify(merged));
                syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
                return merged;
            }).catch(function (e) {
                console.warn('pullAll failed:', e.message || e);
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
