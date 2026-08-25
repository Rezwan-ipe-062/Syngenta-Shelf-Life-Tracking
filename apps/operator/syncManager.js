// syncManager.js — Offline-first sync between localStorage and Google Sheets
(function () {
    // =====================================================
    // GOOGLE APPS SCRIPT CONFIGURATION
    // Replace this URL with your deployed Apps Script web app URL.
    // Deploy from: Google Sheet → Extensions → Apps Script → Deploy
    // =====================================================
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlnWuO0UQn62SE-RNxIJBhD4CTPXPSDrRFXTFi2HcBGNhs732zfFryF4ymRBbGOEG3uw/exec';

    var isSyncing = false;
    var syncCallbacks = [];

    function loadRaw(key) {
        try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch (e) { return null; }
    }

    // Generic fetch helper for the Apps Script backend
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

    var syncManager = {
        init: function () {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
                console.warn('syncManager: Apps Script URL not configured, running localStorage-only');
                return;
            }
            window.addEventListener('online', function () {
                syncManager.syncAll();
            });
        },

        onSync: function (cb) {
            syncCallbacks.push(cb);
        },

        saveLocal: function (key, data) {
            if (data && data.transactions) {
                var existing = loadRaw(key);
                var syncedTimestamps = {};
                if (existing && existing.transactions) {
                    existing.transactions.forEach(function (t) {
                        if (t.sync_status === 'synced') syncedTimestamps[t.timestamp] = true;
                    });
                }
                data.transactions = data.transactions.map(function (t) {
                    if (!t.sync_status) {
                        t.sync_status = syncedTimestamps[t.timestamp] ? 'synced' : 'pending';
                    }
                    return t;
                });
            }
            if (data && data.inventory) {
                var existingInv = loadRaw(key);
                var syncedInvKeys = {};
                if (existingInv && existingInv.inventory) {
                    existingInv.inventory.forEach(function (i) {
                        if (i.sync_status === 'synced') {
                            syncedInvKeys[(i.product || '') + '|' + (i.packSize || '') + '|' + (i.productionMonth || '') + '|' + (i.warehouse || '')] = true;
                        }
                    });
                }
                data.inventory = data.inventory.map(function (i) {
                    if (!i.sync_status) {
                        var k = (i.product || '') + '|' + (i.packSize || '') + '|' + (i.productionMonth || '') + '|' + (i.warehouse || '');
                        i.sync_status = syncedInvKeys[k] ? 'synced' : 'pending';
                    }
                    return i;
                });
            }
            localStorage.setItem(key, JSON.stringify(data));

            if (navigator.onLine && !isSyncing && APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
                syncManager.syncAll();
            } else if (navigator.onLine && isSyncing && APPS_SCRIPT_URL) {
                syncManager._retryNeeded = true;
            }
        },

        syncAll: function () {
            if (isSyncing || !APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return;
            isSyncing = true;

            var opData = loadRaw('operator-data');
            if (!opData) { isSyncing = false; return; }

            var pendingTx = (opData.transactions || []).filter(function (t) { return t.sync_status === 'pending'; });
            var pendingInv = (opData.inventory || []).filter(function (i) { return i.sync_status === 'pending'; });

            if (pendingTx.length === 0 && pendingInv.length === 0) {
                isSyncing = false;
                return;
            }

            var promises = [];

            if (pendingTx.length > 0) {
                var txHeaders = ['product', 'pack_size', 'production_month', 'expiry_month', 'quantity', 'type', 'operator_name', 'warehouse', 'client_timestamp', 'client_date'];
                var txRows = pendingTx.map(function (tx) {
                    return txHeaders.map(function (h) {
                        switch (h) {
                            case 'pack_size': return tx.packSize || '';
                            case 'production_month': return tx.productionMonth || '';
                            case 'expiry_month': return tx.expiryMonth || '';
                            case 'client_timestamp': return tx.timestamp || '';
                            case 'client_date': return tx.date || '';
                            case 'operator_name': return tx.operator_name || '';
                            default: return tx[h] || 0;
                        }
                    });
                });
                promises.push(apiPost({ action: 'batchInsert', sheet: 'transactions', rows: txRows }));
            }

            if (pendingInv.length > 0) {
                var invItems = pendingInv.map(function (inv) {
                    return {
                        product: inv.product,
                        pack_size: inv.packSize || '',
                        production_month: inv.productionMonth || '',
                        expiry_month: inv.expiryMonth || '',
                        quantity: inv.quantity || 0,
                        warehouse: inv.warehouse || ''
                    };
                });
                promises.push(apiPost({
                    action: 'batchUpsert',
                    sheet: 'inventory',
                    compositeKey: ['product', 'pack_size', 'production_month', 'warehouse'],
                    items: invItems
                }));
            }

            Promise.all(promises)
                .then(function () {
                    var currentData = loadRaw('operator-data') || opData;
                    var syncedTx = {};
                    pendingTx.forEach(function (t) { syncedTx[t.timestamp] = true; });
                    var syncedInv = {};
                    pendingInv.forEach(function (i) {
                        var k = (i.product || '') + '|' + (i.packSize || '') + '|' + (i.productionMonth || '') + '|' + (i.warehouse || '');
                        syncedInv[k] = true;
                    });
                    if (currentData.transactions) {
                        currentData.transactions.forEach(function (t) {
                            if (syncedTx[t.timestamp]) t.sync_status = 'synced';
                        });
                    }
                    if (currentData.inventory) {
                        currentData.inventory.forEach(function (i) {
                            var k = (i.product || '') + '|' + (i.packSize || '') + '|' + (i.productionMonth || '') + '|' + (i.warehouse || '');
                            if (syncedInv[k]) i.sync_status = 'synced';
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
                    if (syncManager._retryNeeded) {
                        syncManager._retryNeeded = false;
                        syncManager.syncAll();
                    }
                });
        }
    };

    syncManager.pullFromSupabase = function () {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return Promise.all([
            apiGet('read', { sheet: 'transactions' }),
            apiGet('read', { sheet: 'inventory' })
        ]).then(function (results) {
            var txRows = Array.isArray(results[0]) ? results[0] : (results[0].error ? [] : []);
            var invRows = Array.isArray(results[1]) ? results[1] : (results[1].error ? [] : []);

            var localData = loadRaw('operator-data');

            var hasCloudData = txRows.length > 0 || invRows.length > 0;
            var hasLocalData = localData && (
                (localData.transactions && localData.transactions.length > 0) ||
                (localData.inventory && localData.inventory.length > 0)
            );
            if (!hasCloudData && hasLocalData) {
                var cfg = loadRaw('shelf-life-config');
                if (cfg && cfg._lastReset) {
                    localStorage.removeItem('operator-data');
                    syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
                    return;
                } else {
                    syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
                    return;
                }
            }

            var pulled = {
                transactions: (function () {
                    var mapped = txRows.map(function (t) {
                        return {
                            product: t.product || '',
                            packSize: t.pack_size || '',
                            productionMonth: t.production_month || '',
                            expiryMonth: t.expiry_month || '',
                            quantity: parseInt(t.quantity) || 0,
                            type: t.type || 'receive',
                            operator_name: t.operator_name || '',
                            warehouse: t.warehouse || '',
                            timestamp: t.client_timestamp || '',
                            date: t.client_date || '',
                            sync_status: 'synced'
                        };
                    });
                    var seen = {};
                    return mapped.filter(function (t) {
                        if (seen[t.timestamp]) return false;
                        seen[t.timestamp] = true;
                        return true;
                    });
                })(),
                inventory: (function () {
                    var agg = {};
                    invRows.forEach(function (i) {
                        var key = (i.product || '') + '|' + (i.pack_size || '') + '|' + (i.production_month || '') + '|' + (i.warehouse || '');
                        if (!agg[key]) {
                            agg[key] = {
                                product: i.product || '',
                                packSize: i.pack_size || '',
                                productionMonth: i.production_month || '',
                                expiryMonth: i.expiry_month || '',
                                quantity: 0,
                                warehouse: i.warehouse || '',
                                sync_status: 'synced'
                            };
                        }
                        agg[key].quantity = (agg[key].quantity || 0) + (parseInt(i.quantity) || 0);
                    });
                    Object.keys(agg).forEach(function (key) {
                        if (agg[key].quantity <= 0) delete agg[key];
                    });
                    return Object.values(agg);
                })()
            };

            if (localData) {
                var localTxns = localData.transactions || [];
                var cloudTxKeys = {};
                pulled.transactions.forEach(function (t) { cloudTxKeys[t.timestamp] = true; });
                var unmatchedLocal = localTxns.filter(function (t) { return !cloudTxKeys[t.timestamp]; });
                pulled.transactions = pulled.transactions.concat(unmatchedLocal);

                var localPendingInv = (localData.inventory || []).filter(function (i) { return i.sync_status === 'pending'; });
                pulled.inventory = pulled.inventory.concat(localPendingInv);
            }

            localStorage.setItem('operator-data', JSON.stringify(pulled));
            syncCallbacks.forEach(function (cb) { try { cb(); } catch (e) {} });
        }).catch(function (e) {
            console.warn('syncManager: pullFromCloud failed', e.message || e);
        });
    };

    syncManager.pullConfig = function () {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return apiGet('readFiltered', { sheet: 'config', key: 'key', value: 'shelf-life-config' }).then(function (data) {
            if (data && data.value) {
                var val = data.value;
                var toStore = typeof val === 'string' ? val : JSON.stringify(val);
                localStorage.setItem('shelf-life-config', toStore);
            }
        }).catch(function (e) {
            console.warn('syncManager: pullConfig error', e.message || e);
        });
    };

    syncManager._apiPost = apiPost;

    window.syncManager = syncManager;

    syncManager.pullProducts = function () {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return apiGet('readFiltered', { sheet: 'config', key: 'key', value: 'product-list' }).then(function (data) {
            if (data && data.value) {
                var val = data.value;
                var list = typeof val === 'string' ? JSON.parse(val) : val;
                if (list && list.length > 0) {
                    localStorage.setItem('synced-products', JSON.stringify(list));
                }
            }
        }).catch(function (e) {
            console.warn('syncManager: pullProducts error', e.message || e);
        });
    };

    syncManager.saveSnapshot = function (rows) {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL' || !rows || rows.length === 0) return Promise.resolve();
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
        }).catch(function (e) {
            console.warn('syncManager: saveSnapshot error', e.message || e);
        });
    };

    syncManager.getMonthlySnapshots = function () {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve([]);
        return apiGet('read', { sheet: 'snapshots' }).then(function (data) {
            if (!Array.isArray(data)) return [];
            return data.sort(function (a, b) {
                return (a.snapshot_month || '').localeCompare(b.snapshot_month || '');
            });
        }).catch(function (e) {
            console.warn('syncManager: getMonthlySnapshots error', e.message || e);
            return [];
        });
    };

    syncManager.clearCloudData = function () {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return apiPost({ action: 'clear' }).catch(function (e) {
            console.warn('syncManager: clearCloudData error', e.message || e);
        });
    };

    syncManager.clearByWarehouse = function (warehouse) {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return apiPost({ action: 'clearByWarehouse', warehouse: warehouse }).catch(function (e) {
            console.warn('syncManager: clearByWarehouse error', e.message || e);
        });
    };

    syncManager.clearByDateRange = function (start, end) {
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve();
        return apiPost({ action: 'clearByDateRange', start: start, end: end }).catch(function (e) {
            console.warn('syncManager: clearByDateRange error', e.message || e);
        });
    };
})();
