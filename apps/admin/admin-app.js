// ==============================
// AUTH GATE — master PIN or per-warehouse PIN
// ==============================
// Master PIN (9504) unlocks every warehouse. A warehouse PIN binds the
// session to that warehouse (role 'officer'): data is scoped to it, and the
// Settings/Edit gates only accept the officer's own warehouse PIN or the
// master PIN.
const MASTER_PIN = '9504';
const WAREHOUSE_PINS = { Bogura: '2947', Chittagong: '5185', Jessore: '3639', Gazipur: '8274' };

const revealedPins = new Set();

function getSession() {
    try { return JSON.parse(sessionStorage.getItem('admin-session')); } catch (e) { return null; }
}

function setSession(s) { sessionStorage.setItem('admin-session', JSON.stringify(s)); }

function checkAdminAuth() {
    const s = getSession();
    const overlay = document.getElementById('admin-login-overlay');
    if (s && s.role) {
        if (overlay) overlay.style.display = 'none';
        return true;
    }
    if (overlay) overlay.style.display = 'flex';
    return false;
}

function adminLogin() {
    const input = document.getElementById('admin-login-pin');
    const error = document.getElementById('admin-login-error');
    const pin = input ? input.value.trim() : '';
    let session = null;
    if (pin === MASTER_PIN) {
        session = { role: 'master' };
    } else if (pin) {
        for (const wh in WAREHOUSE_PINS) {
            if (WAREHOUSE_PINS[wh] === pin) { session = { role: 'officer', warehouse: wh }; break; }
        }
    }
    if (session) {
        setSession(session);
        document.getElementById('admin-login-overlay').style.display = 'none';
        initApp();
    } else {
        if (error) {
            error.style.display = 'block';
            error.textContent = 'Incorrect PIN';
        }
        if (input) input.value = '';
    }
}

// Scope for warehouse-officer sessions; master sees everything.
function sessionScope() {
    const s = getSession();
    return (s && s.role === 'officer') ? s.warehouse : null;
}

// ==============================
// SETTINGS / EDIT CHANGE GATE
// ==============================
// Accepts the master PIN, or — for an officer session — only that officer's
// own warehouse PIN. An officer's PIN never unlocks a different warehouse.
function gateCheck(action) {
    const s = getSession();
    if (!s || !s.role) return false;
    if (s.role === 'master') return true;
    const code = prompt('Enter PIN to ' + action + ':');
    if (code === null) return false;
    if (code === MASTER_PIN) return true;
    if (s.warehouse && WAREHOUSE_PINS[s.warehouse] === code) return true;
    alert('Incorrect PIN.');
    return false;
}

function settingsCodeOk(action) {
    return gateCheck(action);
}

// Master-only gate: warehouse PINs are rejected. Used for products edits and
// central (clear-all / date-range) data actions.
function gateMaster(action) {
    const s = getSession();
    if (!s || !s.role) return false;
    if (s.role === 'master') return true;
    const code = prompt('Enter master PIN to ' + action + ':');
    if (code === null) return false;
    if (code === MASTER_PIN) return true;
    alert('Incorrect PIN — master code required.');
    return false;
}

// Target-warehouse gate: accepts the master PIN or the PIN of the given
// warehouse. Used so deleting one warehouse's data requires THAT warehouse's
// PIN, never a different one.
function gateWarehouse(action, warehouse) {
    const s = getSession();
    if (!s || !s.role) return false;
    if (s.role === 'master') return true;
    const code = prompt('Enter PIN to ' + action + ':');
    if (code === null) return false;
    if (code === MASTER_PIN) return true;
    if (warehouse && WAREHOUSE_PINS[warehouse] === code) return true;
    alert('Incorrect PIN for ' + (warehouse || 'this warehouse') + '.');
    return false;
}

// ==============================
// WAREHOUSE NORMALIZATION
// ==============================
// Only these warehouses belong to this project. The live config row once
// carried warehouses from a different project (Lalmonirhat/Dinajpur/etc.); on
// every admin load we force the 4 canonical warehouses and re-push the config
// so those foreign names stop re-surfacing through mergeConfig unions.
const CANONICAL_WAREHOUSES = ['Bogura', 'Chittagong', 'Jessore', 'Gazipur'];

function normalizeWarehouses() {
    CONFIG.warehouses = CANONICAL_WAREHOUSES.slice();
    saveConfig(CONFIG);
}

// ==============================
// DATA
// ==============================
const PRODUCTS = [
    { name: "Actara", pack: "5g", prefix: "SCH" },
    { name: "Amistar", pack: "50ml", prefix: "SCH" },
    { name: "Amistar", pack: "100ml", prefix: "SCH" },
    { name: "Amistar", pack: "500ml", prefix: "SCH" },
    { name: "Alika", pack: "50ml", prefix: "SCH" },
    { name: "Armure", pack: "100ml", prefix: "SCH" },
    { name: "Bingo", pack: "100g", prefix: "SCH" },
    { name: "Bingo", pack: "500g", prefix: "SCH" },
    { name: "Denim Fit", pack: "10g", prefix: "SCH" },
    { name: "Filia", pack: "50ml", prefix: "SCH" },
    { name: "Filia", pack: "100ml", prefix: "SCH" },
    { name: "Filia", pack: "500ml", prefix: "SCH" },
    { name: "Grozin", pack: "1kg", prefix: "SCH" },
    { name: "Grozin", pack: "2kg", prefix: "SCH" },
    { name: "Incipio", pack: "40ml", prefix: "SCH" },
    { name: "Incipio", pack: "100ml", prefix: "SCH" },
    { name: "Karate", pack: "50ml", prefix: "SCH" },
    { name: "Karate", pack: "100ml", prefix: "SCH" },
    { name: "Karate", pack: "500ml", prefix: "SCH" },
    { name: "Lanirat", pack: "100g", prefix: "SCH" },
    { name: "Magma", pack: "1kg", prefix: "SCH" },
    { name: "Magma", pack: "2kg", prefix: "SCH" },
    { name: "Miravis Duo", pack: "50ml", prefix: "SCH" },
    { name: "Miravis Duo", pack: "100ml", prefix: "SCH" },
    { name: "Pegasus", pack: "50ml", prefix: "SCH" },
    { name: "Pegasus", pack: "100ml", prefix: "SCH" },
    { name: "Proclam", pack: "10g", prefix: "SCH" },
    { name: "Proclam", pack: "30g", prefix: "SCH" },
    { name: "Revus", pack: "50ml", prefix: "SCH" },
    { name: "Revus", pack: "100ml", prefix: "SCH" },
    { name: "Ridomil", pack: "100g", prefix: "SCH" },
    { name: "Ridomil", pack: "500g", prefix: "SCH" },
    { name: "Rifit", pack: "100ml", prefix: "SCH" },
    { name: "Rifit", pack: "500ml", prefix: "SCH" },
    { name: "Score", pack: "50ml", prefix: "SCH" },
    { name: "Score", pack: "100ml", prefix: "SCH" },
    { name: "Score", pack: "500ml", prefix: "SCH" },
    { name: "Shobicron", pack: "50ml", prefix: "SCH" },
    { name: "Shobicron", pack: "100ml", prefix: "SCH" },
    { name: "Shobicron", pack: "500ml", prefix: "SCH" },
    { name: "Silika", pack: "1kg", prefix: "SCH" },
    { name: "Silika", pack: "2kg", prefix: "SCH" },
    { name: "Thiovit", pack: "1kg", prefix: "SCH" },
    { name: "Thiovit", pack: "2kg", prefix: "SCH" },
    { name: "Tilt", pack: "50ml", prefix: "SCH" },
    { name: "Tilt", pack: "100ml", prefix: "SCH" },
    { name: "Tilt", pack: "500ml", prefix: "SCH" },
    { name: "Vestoria", pack: "15g", prefix: "SCH" },
    { name: "Vertimec", pack: "50ml", prefix: "SCH" },
    { name: "Vertimec", pack: "100ml", prefix: "SCH" },
    { name: "Vertimec", pack: "500ml", prefix: "SCH" },
    { name: "Virtako", pack: "10g", prefix: "SCH" },
    { name: "Virtako", pack: "30g", prefix: "SCH" },
    { name: "Voliam", pack: "50ml", prefix: "SCH" },
    { name: "Plenum", pack: "50g", prefix: "SCH" },
    { name: "Atresia", pack: "50ml", prefix: "JAK" },
    { name: "Cruiser", pack: "20g", prefix: "SPL" },
    { name: "Caliber", pack: "100g", prefix: "EC" },
    { name: "Caliber", pack: "500g", prefix: "EC" },
    { name: "Gayte", pack: "100g", prefix: "BG" },
    { name: "Jazz", pack: "100g", prefix: "DKC" },
    { name: "Jazz", pack: "500g", prefix: "DKC" },
    { name: "Jazz", pack: "1kg", prefix: "DKC" },
    { name: "Laser", pack: "25g", prefix: "RB" },
    { name: "Protozim", pack: "50ml", prefix: "BWL" },
    { name: "Protozim", pack: "100ml", prefix: "BWL" },
    { name: "Protozim", pack: "500ml", prefix: "BWL" },
    { name: "PJ-16", pack: "", prefix: "" },
    { name: "XP-16", pack: "", prefix: "" }
];

// ==============================
// CONFIG (persisted in localStorage)
// ==============================
const DEFAULT_CONFIG = {
    operatorPins: [
        { name: 'Default', pin: '1234', warehouse: 'Chittagong' }
    ],
    expiryYears: { start: 2025, end: 2030 },
    prodYears: { start: 5, end: 6 },
    warehouses: ['Chittagong', 'Gazipur', 'Jessore', 'Bogura']
};

// ==============================
// AGI CODE HELPERS
// ==============================
const DEFAULT_AGI_CODES = {
    "Actara|5g": "34779",
    "Alika|50ml": "69667",
    "Amistar|50ml": "53294",
    "Armure|100ml": "85250",
    "Atresia|50ml": "88294",
    "Bingo|100g": "63728",
    "Bingo|500g": "63728",
    "Caliber|100g": "68507",
    "Caliber|500g": "68507",
    "Cruiser|20g": "63913",
    "Denim Fit|10g": "87224",
    "Filia|50ml": "55458",
    "Filia|100ml": "46420",
    "Filia|500ml": "57918",
    "Gayte|100g": "69037",
    "Grozin|1kg": "35440",
    "Grozin|2kg": "56655",
    "Incipio|40ml": "80926",
    "Jazz|100g": "52539",
    "Jazz|500g": "52537",
    "Karate|50ml": "58896",
    "Lanirat|100g": "35723",
    "Laser|25g": "43868",
    "Magma|1kg": "63731",
    "Miravis Duo|50ml": "80927",
    "Miravis Duo|100ml": "81359",
    "Pegasus|100ml": "61124",
    "Plenum|50g": "64213",
    "Proclam|10g": "70887",
    "Proclam|30g": "70897",
    "Protozim|50ml": "59703",
    "Revus|50ml": "58513",
    "Revus|100ml": "53508",
    "Revus|500ml": "53924",
    "Ridomil|100g": "38775",
    "Ridomil|500g": "38776",
    "Rifit|100ml": "35348",
    "Score|50ml": "34002",
    "Score|100ml": "30593",
    "Score|500ml": "34001",
    "Shobicron|50ml": "29568",
    "Silika|1kg": "58337",
    "Thiovit|1kg": "92798",
    "Tilt|50ml": "58888",
    "Vestoria|15g": "84793",
    "Vertimec|50ml": "63105",
    "Virtako|10g": "72598",
    "Voliam|50ml": "43978"
};

function getAgiCode(product, pack) {
    const codes = JSON.parse(localStorage.getItem('product-agi-codes') || '{}');
    const key = product + '|' + (pack || '');
    return codes[key] || DEFAULT_AGI_CODES[key] || '';
}
function setAgiCode(product, pack, code) {
    const codes = JSON.parse(localStorage.getItem('product-agi-codes') || '{}');
    codes[product + '|' + (pack || '')] = code;
    localStorage.setItem('product-agi-codes', JSON.stringify(codes));
}

// Merge persisted product edits into PRODUCTS array
(function loadCustomProducts() {
    try {
        const saved = localStorage.getItem('custom-products');
        if (saved) {
            const custom = JSON.parse(saved);
            PRODUCTS.length = 0;
            custom.forEach(p => PRODUCTS.push(p));
        }
    } catch(e) {}
})();

function loadConfig() {
    try {
        const saved = localStorage.getItem('shelf-life-config');
        const base = saved ? JSON.parse(saved) : {};
        return {
            operatorPins: base.operatorPins || JSON.parse(JSON.stringify(DEFAULT_CONFIG.operatorPins)),
            expiryYears: base.expiryYears || DEFAULT_CONFIG.expiryYears,
            prodYears: base.prodYears || DEFAULT_CONFIG.prodYears,
            warehouses: base.warehouses || DEFAULT_CONFIG.warehouses,
            // Allow any extra fields stored (forward-compat)
            ...base
        };
    } catch { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
}

function saveConfig(cfg) {
    localStorage.setItem('shelf-life-config', JSON.stringify(cfg));
    if (window.syncManager && window.syncManager.pushConfig) {
        window.syncManager.pushConfig(cfg);
    }
}

function syncProducts() {
    if (window.syncManager && window.syncManager.pushProducts) {
        var productList = PRODUCTS.map(function(p) {
            return { name: p.name, pack: p.pack, prefix: p.prefix };
        });
        window.syncManager.pushProducts(productList);
    }
}

let CONFIG = loadConfig();
let selectedWarehouses = new Set(CONFIG.warehouses);
let chartYearFilter = 'all';
let chartMonthFilter = 'all';

function rebuildWarehouseChips() {
    const bar = document.getElementById('warehouse-filter-bar');
    const chips = CONFIG.warehouses.map(w =>
        '<button class="wh-filter-chip ' + (selectedWarehouses.has(w) ? 'active' : '') + '" onclick="toggleWarehouse(\'' + w + '\', this)">' + w + '</button>'
    ).join('');
    bar.innerHTML = '<span class="filter-label">Warehouse</span>' + chips;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// ==============================
// OPERATOR DATA LOADER
// ==============================
function loadOperatorData() {
    try {
        const saved = localStorage.getItem('operator-data');
        if (saved) {
            const data = JSON.parse(saved);
            return data;
        }
    } catch {}
    return { transactions: [], inventory: [] };
}

// ==============================
// EXPIRY COMPUTATION
// ==============================
function parseExpiryDate(expiry) {
    if (expiry === undefined || expiry === null || expiry === '') return NaN;
    var v = String(expiry).trim();
    if (v.indexOf(' ') > -1) {
        var parts = v.split(' ');
        var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var mi = monthNames.indexOf(parts[0]);
        var y = parseInt(parts[1], 10);
        if (mi >= 0 && !isNaN(y)) {
            var d = new Date(y, mi, 1);
            return isNaN(d.getTime()) ? NaN : d.getTime();
        }
        return NaN;
    }
    if (v.indexOf('T') > -1) {
        var d2 = new Date(v);
        return isNaN(d2.getTime()) ? NaN : d2.getTime();
    }
    var n = parseFloat(v);
    if (!isNaN(n) && n >= 1 && n <= 100000) {
        // Excel serial date (epoch 1899-12-30) — cloud stores expiry_month this way
        return (new Date(Math.round(n * 86400000) - 2209161600000)).getTime();
    }
    return NaN;
}

function monthsUntilExpiry(expiryStr) {
    var now = new Date();
    var t = parseExpiryDate(expiryStr);
    if (isNaN(t)) return NaN;
    var expiry = new Date(t);
    return (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
}

function getExpiryLevel(months) {
    if (months <= 0) return 'expired';
    if (months <= 3) return 'critical';
    if (months <= 6) return 'warning';
    if (months <= 12) return 'notice';
    if (months <= 18) return 'distant';
    return 'future';
}

// ==============================
// WAREHOUSE FILTER
// ==============================

function toggleWarehouse(name, btn) {
    if (selectedWarehouses.has(name)) {
        if (selectedWarehouses.size === 1) return;
        selectedWarehouses.delete(name);
        btn.classList.remove('active');
    } else {
        selectedWarehouses.add(name);
        btn.classList.add('active');
    }
    refreshCurrentScreen();
}

function setChartYearFilter(year) {
    chartYearFilter = year;
    document.querySelectorAll('#chart-filter-bar .filter-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-year') === year);
    });
    renderDashboard();
}

function setChartMonthFilter(month) {
    chartMonthFilter = month;
    renderDashboard();
}

function isActiveScreen(id) {
    return document.getElementById(id).classList.contains('active');
}

function refreshCurrentScreen() {
    if (isActiveScreen('screen-dashboard')) renderDashboard();
    if (isActiveScreen('screen-12m')) render12M();
    if (isActiveScreen('screen-monthly')) renderMonthlyReport();
    if (isActiveScreen('screen-country')) renderCountrySummary();
    if (isActiveScreen('screen-inventory')) renderInventory();
    if (isActiveScreen('screen-activity')) renderActivity(currentActivityFilter);
    if (isActiveScreen('screen-products')) renderProducts();
}

function filterByWarehouse(data) {
    return data.filter(d => selectedWarehouses.has(d.warehouse));
}

// ==============================
// NAVIGATION
// ==============================
function showScreen(id, btn) {
    document.querySelectorAll('.admin-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const titles = { 'screen-dashboard': 'Dashboard', 'screen-country': 'Country Summary', 'screen-12m': 'Shelf Life Report', 'screen-monthly': 'Monthly Report', 'screen-inventory': 'Inventory', 'screen-activity': 'Activity Log', 'screen-edit': 'Edit Transactions', 'screen-products': 'Products', 'screen-settings': 'Settings' };
    document.getElementById('page-title').textContent = titles[id] || 'Dashboard';

    if (id === 'screen-dashboard') renderDashboard();
    if (id === 'screen-activity') { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
    if (id === 'screen-inventory') renderInventory();
    if (id === 'screen-12m') render12M();
    if (id === 'screen-country') renderCountrySummary();
    if (id === 'screen-monthly') renderMonthlyReport();
    if (id === 'screen-edit') {
        renderEditList();
        // Always full-pull so edits made elsewhere are reflected here
        if (window.syncManager && window.syncManager.pullAllForce) window.syncManager.pullAllForce().then(renderEditList);
    }
    if (id === 'screen-products') renderProducts();

    var filterBar = document.getElementById('warehouse-filter-bar');
    if (filterBar) filterBar.style.display = (id === 'screen-products' || id === 'screen-edit') ? 'none' : '';
}

// ==============================
// CLOCK
// ==============================
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short', year: 'numeric' });
}

function renderSyncStatus() {
    var dot = document.getElementById('sync-dot');
    var text = document.getElementById('sync-status-text');
    if (!dot || !text || !window.syncManager) return;

    var st = window.syncManager.getSyncStatus();
    if (!st) return;

    dot.className = 'sync-dot';

    if (st.ok) {
        dot.classList.add('ok');
        var ago = st.lastSync ? Math.round((Date.now() - st.lastSync) / 1000) : null;
        var agoStr = ago !== null ? (ago < 60 ? ago + 's ago' : Math.round(ago / 60) + 'm ago') : '';
        text.textContent = 'Synced \u00b7 ' + st.txCount + ' tx' + (st.txCount !== 1 ? 's' : '') + (agoStr ? ' \u00b7 ' + agoStr : '');
    } else if (st.error) {
        dot.classList.add('error');
        text.textContent = 'Sync failed \u00b7 ' + st.error.substring(0, 40);
    } else {
        dot.classList.add('pending');
        text.textContent = 'Connecting...';
    }
}

// ==============================
// DASHBOARD
// ==============================
let dashboardCharts = {};

function renderDashboard() {
    const opData = loadOperatorData();

    const expiryItems = filterByWarehouse((opData.inventory || []).filter(item => item.quantity > 0 && item.expiryMonth).map(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        return {
            product: item.product,
            pack: item.packSize,
            expiry: item.expiryMonth,
            qty: item.quantity,
            monthsLeft,
            level: getExpiryLevel(monthsLeft),
            warehouse: item.warehouse || ''
        };
    }));

    const critical = expiryItems.filter(d => d.level === 'critical').length;
    const warning = expiryItems.filter(d => d.level === 'warning').length;
    const notice = expiryItems.filter(d => d.level === 'notice').length;
    const distant = expiryItems.filter(d => d.level === 'distant').length;
    const expired = expiryItems.filter(d => d.level === 'expired').length;

    document.getElementById('stat-critical').textContent = critical || 0;
    document.getElementById('stat-warning').textContent = warning || 0;
    document.getElementById('stat-notice').textContent = notice || 0;
    document.getElementById('stat-distant').textContent = distant || 0;
    document.getElementById('stat-expired').textContent = expired || 0;

    const whList = document.getElementById('wh-list');
    document.getElementById('wh-count').textContent = CONFIG.warehouses.length + ' configured';
    whList.innerHTML = CONFIG.warehouses.map(w => {
        const hasData = expiryItems.some(d => d.warehouse === w);
        return '<div class="warehouse-row">' +
            '<span class="warehouse-name">' + w + '</span>' +
            '<span class="warehouse-status"><span class="status-dot ' + (hasData ? '' : 'inactive') + '"></span> ' +
            (hasData ? 'Active' : 'Not started') +
            '</span></div>';
    }).join('');

    const recentEl = document.getElementById('recent-counts');
    const txs = (opData.transactions || []).slice(-5).reverse();
    if (txs.length === 0) {
        recentEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">No counts recorded yet.<br>Start counting from the operator app.</div>';
    } else {
        recentEl.innerHTML = txs.map(tx =>
            '<div class="recent-count-item">' +
            '<span class="recent-count-product">' + tx.product + ' ' + tx.packSize + '</span>' +
            '<span class="recent-count-meta">' + (tx.type === 'receive' ? '+' : '-') + tx.quantity + ' · ' + (tx.date || '') + '</span>' +
            '</div>'
        ).join('');
    }

    // Build chart year filter pills from available data
    buildChartYearFilters(opData.inventory || []);

    // Apply all dashboard filters for chart rendering
    var chartInventory = filterChartInventory(opData.inventory || []);

    renderCharts(chartInventory);
    renderOperatorStats();
    renderDailyTrends();
}

function buildChartYearFilters(inventory) {
    var years = new Set();
    inventory.forEach(function(item) {
        if (item.productionMonth && item.productionMonth.length >= 1) {
            years.add(item.productionMonth[0]);
        }
    });
    var sortedYears = Array.from(years).sort();

    var bar = document.getElementById('chart-filter-bar');
    if (!bar) return;

    var html = '<span class="filter-label">Year:</span>';
    html += '<button class="filter-btn ' + (chartYearFilter === 'all' ? 'active' : '') + '" data-year="all" onclick="setChartYearFilter(\'all\')">All</button>';
    sortedYears.forEach(function(y) {
        html += '<button class="filter-btn ' + (chartYearFilter === y ? 'active' : '') + '" data-year="' + y + '" onclick="setChartYearFilter(\'' + y + '\')">' + y + '</button>';
    });
    html += '<span class="filter-separator"></span>';
    html += '<span class="filter-label">Month:</span>';
    html += '<select class="chart-month-select" id="chart-month-select" onchange="setChartMonthFilter(this.value)">';
    html += '<option value="all">All</option>';
    html += '<option value="A">Jan (A)</option><option value="B">Feb (B)</option><option value="C">Mar (C)</option>';
    html += '<option value="D">Apr (D)</option><option value="E">May (E)</option><option value="F">Jun (F)</option>';
    html += '<option value="G">Jul (G)</option><option value="H">Aug (H)</option><option value="I">Sep (I)</option>';
    html += '<option value="J">Oct (J)</option><option value="K">Nov (K)</option><option value="L">Dec (L)</option>';
    html += '</select>';

    bar.innerHTML = html;
    // Restore month dropdown selection
    var sel = document.getElementById('chart-month-select');
    if (sel) sel.value = chartMonthFilter;
}

function filterChartInventory(inventory) {
    return inventory.filter(function(item) {
        // Warehouse filter
        if (!selectedWarehouses.has(item.warehouse)) return false;
        // Year filter
        if (chartYearFilter !== 'all' && (!item.productionMonth || item.productionMonth[0] !== chartYearFilter)) return false;
        // Month filter
        if (chartMonthFilter !== 'all' && (!item.productionMonth || item.productionMonth.length < 2 || item.productionMonth[1] !== chartMonthFilter)) return false;
        return true;
    });
}

function renderCharts(inventory) {
    const isEmpty = inventory.length === 0;

    if (typeof Chart === 'undefined') return;

    Object.values(dashboardCharts).forEach(c => { if (c) c.destroy(); });
    dashboardCharts = {};

    if (isEmpty) {
        document.getElementById('chart-top-products').innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;margin-bottom:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><h3>No data yet</h3><p>Start counting products from the operator app to see charts here.</p></div>';
        document.getElementById('chart-stock-by-code').innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;margin-bottom:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><h3>No data yet</h3><p>Inventory data will appear here once you start tracking.</p></div>';
        document.getElementById('chart-expiry-distribution').innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;margin-bottom:16px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><h3>No data yet</h3><p>Products with expiry dates will appear here.</p></div>';
        return;
    }

    // Chart 1: Top Products (bar chart)
    const prodTotals = {};
    inventory.forEach(item => {
        const key = item.product + ' ' + (item.packSize || '');
        prodTotals[key] = (prodTotals[key] || 0) + item.quantity;
    });
    const topProducts = Object.entries(prodTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    document.getElementById('chart-top-products').innerHTML = '<canvas id="chart-top-products-canvas"></canvas>';
    dashboardCharts.topProducts = new Chart(document.getElementById('chart-top-products-canvas'), {
        type: 'bar',
        data: {
            labels: topProducts.map(d => d[0].length > 20 ? d[0].substring(0, 18) + '\u2026' : d[0]),
            datasets: [{
                label: 'Total Quantity',
                data: topProducts.map(d => d[1]),
                backgroundColor: '#00843D',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Top 10 Products by Quantity', font: { size: 13, weight: '600' }, padding: { bottom: 12 } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { ticks: { maxRotation: 45 } }
            }
        }
    });

    // Chart 2: Stock by Batch Code
    const monthTotals = {};
    inventory.forEach(item => {
        const m = item.productionMonth || 'N/A';
        monthTotals[m] = (monthTotals[m] || 0) + item.quantity;
    });
    const monthEntries = Object.entries(monthTotals).sort();

    document.getElementById('chart-stock-by-code').innerHTML = '<canvas id="chart-stock-by-code-canvas"></canvas>';
    dashboardCharts.stockByCode = new Chart(document.getElementById('chart-stock-by-code-canvas'), {
        type: 'bar',
        data: {
            labels: monthEntries.map(d => d[0]),
            datasets: [{
                label: 'Quantity',
                data: monthEntries.map(d => d[1]),
                backgroundColor: '#005A2B',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Stock by Batch Code', font: { size: 13, weight: '600' }, padding: { bottom: 12 } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { ticks: { maxRotation: 0 } }
            }
        }
    });

    // Chart 3: Expiry Distribution (doughnut)
    const expiryLevels = { expired: 0, critical: 0, warning: 0, notice: 0, distant: 0, future: 0 };
    inventory.filter(i => i.expiryMonth).forEach(item => {
        const ml = monthsUntilExpiry(item.expiryMonth);
        const level = getExpiryLevel(ml);
        expiryLevels[level] = (expiryLevels[level] || 0) + item.quantity;
    });

    var labels = ['Expired', 'Critical \u22643mo', 'Warning 4-6mo', 'Notice 7-12mo', 'Distant 13-18mo'];
    var data = [expiryLevels.expired, expiryLevels.critical, expiryLevels.warning, expiryLevels.notice, expiryLevels.distant];
    var colors = ['#1F2937', '#DC2626', '#F97316', '#d97706', '#2563EB'];
    if (expiryLevels.future > 0) { labels.push('Future >18mo'); data.push(expiryLevels.future); colors.push('#9CA3AF'); }

    document.getElementById('chart-expiry-distribution').innerHTML = '<canvas id="chart-expiry-distribution-canvas"></canvas>';
    dashboardCharts.expiryDist = new Chart(document.getElementById('chart-expiry-distribution-canvas'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Expiry Distribution', font: { size: 13, weight: '600' }, padding: { bottom: 12 } },
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }
            }
        }
    });
}

// ==============================
// 12M & 18M TABLE
// ==============================
let shelfLevels = new Set();
let currentInvLevels = new Set();

function render12M() {
    const tbody = document.getElementById('tbody-12m');
    const opData = loadOperatorData();

    let expiryItems = filterByWarehouse((opData.inventory || []).filter(item => item.quantity > 0 && item.expiryMonth).map(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        const level = getExpiryLevel(monthsLeft);
        return {
            product: item.product,
            pack: item.packSize,
            code: item.productionMonth || '',
            expiry: item.expiryMonth,
            qty: item.quantity,
            monthsLeft,
            level,
            warehouse: item.warehouse || ''
        };
    }));

    if (shelfLevels.size > 0) {
        expiryItems = expiryItems.filter(d => shelfLevels.has(d.level));
    }

    const search = (document.getElementById('life-search').value || '').toLowerCase();
    if (search) {
        expiryItems = expiryItems.filter(d => d.product.toLowerCase().includes(search) || (d.pack || '').toLowerCase().includes(search) || (d.code || '').toLowerCase().includes(search));
    }

    expiryItems.sort((a, b) => a.monthsLeft - b.monthsLeft);
    document.getElementById('filter-count').textContent = 'Showing ' + expiryItems.length + ' items';

    if (expiryItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' +
            (shelfLevels.size === 0 ? 'No inventory data yet. Start counting from the operator app.' : 'No items match these filters.') +
            '</td></tr>';
        return;
    }

    tbody.innerHTML = expiryItems.map(d => {
        const cls = d.level === 'distant' ? '' : 'row-' + d.level;
        const badgeLabel = d.level === 'expired' ? 'EXPIRED' : d.monthsLeft + 'M';
        const badgeCls = d.level === 'distant' ? 'badge-distant' : 'badge-' + d.level;
        return '<tr class="' + cls + '"><td>' + d.product + '</td><td>' + d.pack + '</td><td>' + (d.code || '\u2014') + '</td><td>' + d.expiry + '</td><td>' + d.qty + '</td><td><span class="badge ' + badgeCls + '">' + badgeLabel + '</span></td><td>' + (d.warehouse || '\u2014') + '</td></tr>';
    }).join('');
}

function filter12M(level) {
    if (level === 'all') {
        shelfLevels.clear();
    } else if (shelfLevels.has(level)) {
        shelfLevels.delete(level);
    } else {
        shelfLevels.add(level);
    }
    document.querySelectorAll('#screen-12m .filter-btn[data-level]').forEach(b => {
        var lv = b.getAttribute('data-level');
        b.classList.toggle('active', lv === 'all' ? shelfLevels.size === 0 : shelfLevels.has(lv));
    });
    render12M();
}

function filterInventory(level) {
    if (level === 'all') {
        currentInvLevels.clear();
    } else if (currentInvLevels.has(level)) {
        currentInvLevels.delete(level);
    } else {
        currentInvLevels.add(level);
    }
    document.querySelectorAll('#screen-inventory .filter-btn[data-level]').forEach(b => {
        var lv = b.getAttribute('data-level');
        b.classList.toggle('active', lv === 'all' ? currentInvLevels.size === 0 : currentInvLevels.has(lv));
    });
    renderInventory();
}

// ==============================
// ACTIVITY LOG
// ==============================
let currentActivityFilter = 'all';
let activityWhFilter = 'all';

function renderActivityWarehouseChips() {
    const container = document.getElementById('activity-wh-chips');
    if (!container) return;
    const chips = CONFIG.warehouses.map(w =>
        '<button class="wh-filter-chip ' + (activityWhFilter === w ? 'active' : '') + '" onclick="filterActivityWh(\'' + w + '\', this)">' + w + '</button>'
    ).join('');
    container.innerHTML = '<button class="wh-filter-chip ' + (activityWhFilter === 'all' ? 'active' : '') + '" onclick="filterActivityWh(\'all\', this)">All</button>' + chips;
}

function filterActivityWh(warehouse, btn) {
    activityWhFilter = warehouse;
    document.querySelectorAll('#screen-activity .wh-filter-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderActivity(currentActivityFilter);
}

function renderActivity(filter) {
    const tbody = document.getElementById('tbody-activity');
    const opData = loadOperatorData();
    let txs = opData.transactions || [];

    if (activityWhFilter !== 'all') {
        txs = txs.filter(d => d.warehouse && String(d.warehouse).trim().toLowerCase() === String(activityWhFilter).trim().toLowerCase());
    }

    if (filter !== 'all') {
        const typeMap = { 'add': 'receive', 'sub': 'dispatch', 'adjust': 'adjustment' };
        txs = txs.filter(d => d.type === typeMap[filter]);
    }

    const search = (document.getElementById('activity-search').value || '').toLowerCase();
    if (search) {
        txs = txs.filter(d => (d.product || '').toLowerCase().includes(search) || (d.packSize || '').toLowerCase().includes(search) || (d.productionMonth || '').toLowerCase().includes(search) || (getAgiCode(d.product, d.packSize || '') || '').toLowerCase().includes(search) || (d.operator || '').toLowerCase().includes(search));
    }

    document.getElementById('activity-count').textContent = 'Showing ' + txs.length + ' entries';

    if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">No activity recorded yet.</td></tr>';
        return;
    }

    txs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    tbody.innerHTML = txs.map(d => {
        let typeHtml;
        if (d.type === 'receive') {
            typeHtml = '<span style="color:#16A34A;font-weight:600;">+</span> Addition';
        } else if (d.type === 'dispatch') {
            typeHtml = '<span style="color:#DC2626;font-weight:600;">\u2212</span> Subtraction';
        } else {
            typeHtml = '<span style="color:#333;font-weight:600;">\u25CF</span> Set';
        }
        return '<tr><td>' + (d.date || d.timestamp || '') + '</td><td>' + d.product + '</td><td>' + (d.packSize || '') + '</td><td>' + (getAgiCode(d.product, d.packSize || '') || '\u2014') + '</td><td>' + (d.productionMonth || '') + '</td><td>' + (d.warehouse || '\u2014') + '</td><td>' + typeHtml + '</td><td>' + d.quantity + '</td><td>' + (d.operator || '\u2014') + '</td></tr>';
    }).join('');
}

function filterActivity(filter, btn) {
    currentActivityFilter = filter;
    document.querySelectorAll('#screen-activity .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderActivity(filter);
}

// ==============================
// EDIT TRANSACTIONS
// ==============================
// Edits the source transaction (matched by timestamp, which never changes)
// via the backend, then forces a full pull back so every device converges.
let editRow = null;

function editScopeText() {
    const scope = sessionScope();
    const el = document.getElementById('edit-scope');
    if (el) el.textContent = (scope ? scope : 'All warehouses');
}

function renderEditList() {
    editScopeText();
    const tbody = document.getElementById('tbody-edit');
    const countEl = document.getElementById('edit-count');
    const opData = loadOperatorData();
    const scope = sessionScope();

    let txs = (opData.transactions || []).filter(t => !scope || (t.warehouse || '') === scope);
    const search = document.getElementById('edit-search').value.toLowerCase();
    if (search) {
        txs = txs.filter(t => (t.product || '').toLowerCase().includes(search) || (getAgiCode(t.product, t.packSize || '') || '').toLowerCase().includes(search));
    }
    txs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    if (countEl) countEl.textContent = txs.length + (txs.length === 1 ? ' transaction' : ' transactions');

    if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">No transactions to edit.</td></tr>';
        return;
    }

    tbody.innerHTML = txs.map(d => {
        const code = d.productionMonth || '';
        return '<tr><td>' + (d.date || d.timestamp || '') + '</td><td>' + d.product + '</td><td>' + (d.packSize || '') + '</td><td>' + (code || '\u2014') + '</td><td>' + (getAgiCode(d.product, d.packSize || '') || '\u2014') + '</td><td>' + (d.warehouse || '\u2014') + '</td><td>' + d.type + '</td><td>' + d.quantity + '</td><td>' + (d.operator || '\u2014') + '</td>' +
            '<td><button class="add-product-btn" onclick="openEditModal(\'' + d.timestamp.replace(/'/g, "\\'") + '\')">Edit</button></td></tr>';
    }).join('');
}

function openEditModal(ts) {
    if (!gateCheck('edit this transaction')) return;
    const opData = loadOperatorData();
    editRow = (opData.transactions || []).find(t => t.timestamp === ts);
    if (!editRow) { alert('Transaction not found'); return; }

    document.getElementById('edit-readonly').textContent =
        (editRow.date || editRow.timestamp || '') + ' \u00b7 ' + (editRow.type || '') + ' \u00b7 ' + (editRow.operator || '') + ' \u00b7 ' + (editRow.warehouse || '');

    // Product + pack selects (ensure the current product is present)
    const prodSel = document.getElementById('edit-product');
    const names = PRODUCTS.map(p => p.name).filter((v, i, a) => a.indexOf(v) === i);
    if (names.indexOf(editRow.product) === -1) names.push(editRow.product);
    prodSel.innerHTML = names.map(n => '<option value="' + n.replace(/"/g, '&quot;') + '"' + (n === editRow.product ? ' selected' : '') + '>' + n + '</option>').join('');

    // Production code: '5A' → year '5', month 'A'
    const pm = editRow.productionMonth || '';
    const prodYearSel = document.getElementById('edit-prod-year');
    const years = [];
    for (let y = CONFIG.prodYears.start; y <= CONFIG.prodYears.end; y++) years.push(String(y));
    prodYearSel.innerHTML = years.map(y => '<option value="' + y + '"' + (y === pm.charAt(0) ? ' selected' : '') + '>' + y + '</option>').join('');
    document.getElementById('edit-prod-month').innerHTML = MONTH_LETTERS.map(m => '<option value="' + m + '"' + (m === pm.slice(1) ? ' selected' : '') + '>' + m + '</option>').join('');

    // Expiry: 'Jan 2027' → month 'Jan', year '2027'
    const expParts = String(editRow.expiryMonth || '').split(' ');
    const expYearSel = document.getElementById('edit-exp-year');
    const exps = [];
    for (let y = CONFIG.expiryYears.start; y <= CONFIG.expiryYears.end; y++) exps.push(String(y));
    expYearSel.innerHTML = exps.map(y => '<option value="' + y + '"' + (y === (expParts[1] || CONFIG.expiryYears.end) ? ' selected' : '') + '>' + y + '</option>').join('');
    document.getElementById('edit-exp-month').innerHTML = MONTHS.map(m => '<option value="' + m + '"' + (m === expParts[0] ? ' selected' : '') + '>' + m + '</option>').join('');

    onEditProductChange(editRow.packSize);
    document.getElementById('edit-qty').value = editRow.quantity || 0;
    document.getElementById('edit-modal').classList.add('open');
}

function onEditProductChange(packOverride) {
    const product = document.getElementById('edit-product').value;
    const packSel = document.getElementById('edit-pack');
    const packs = PRODUCTS.filter(p => p.name === product).map(p => p.pack);
    const cur = packOverride || (packSel.value || '');
    if (packs.indexOf(cur) === -1 && cur) packs.push(cur);
    if (packs.length === 0) packs.push('');
    packSel.innerHTML = packs.map(p => '<option value="' + p.replace(/"/g, '&quot;') + '"' + (p === cur ? ' selected' : '') + '>' + p + '</option>').join('');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('open');
    editRow = null;
}

function saveEditTransaction() {
    if (!editRow) return;
    if (!navigator.onLine) { alert('An online connection is needed to edit transactions.'); return; }
    if (!window.syncManager || !window.syncManager.updateTransactions) { alert('Sync not available.'); return; }

    const product = document.getElementById('edit-product').value;
    const pack = document.getElementById('edit-pack').value;
    const prodCode = document.getElementById('edit-prod-year').value + document.getElementById('edit-prod-month').value;
    const expiry = document.getElementById('edit-exp-month').value + ' ' + document.getElementById('edit-exp-year').value;
    const qty = parseInt(document.getElementById('edit-qty').value);
    if (!product || !pack) { alert('Select a product and pack.'); return; }
    if (isNaN(qty) || qty < 0) { alert('Enter a valid quantity.'); return; }

    const item = {
        client_timestamp: editRow.timestamp,
        product: product,
        pack_size: pack,
        production_month: prodCode,
        expiry_month: expiry,
        quantity: qty
    };

    closeEditModal();
    window.syncManager.updateTransactions([item]).then(function (res) {
        if (res && res.success) {
            // Force a full pull so this edit propagates to every device/tab
            return window.syncManager.pullAllForce().then(function () {
                renderEditList();
                renderInventory();
                renderActivity(currentActivityFilter);
                renderDashboard();
                alert('Transaction updated.');
            });
        }
        alert('Save failed' + (res && res.error ? ': ' + res.error : ' — try again.'));
    });
}

function deleteEditTransaction() {
    if (!editRow) return;
    if (!gateCheck('delete this transaction')) return;
    if (!navigator.onLine) { alert('An online connection is needed to delete transactions.'); return; }
    if (!window.syncManager || !window.syncManager.deleteTransactions) { alert('Sync not available.'); return; }

    var opData = loadOperatorData();
    var lotKey = [editRow.product, editRow.packSize || '', editRow.productionMonth || '', editRow.warehouse || ''].join('|');
    var withRow = (window.syncManager.computeInventory(opData.transactions || [])).find(function (i) {
        return [i.product, i.packSize || '', i.productionMonth || '', i.warehouse || ''].join('|') === lotKey;
    });
    var without = (window.syncManager.computeInventory((opData.transactions || []).filter(function (t) { return t.timestamp !== editRow.timestamp; }))).find(function (i) {
        return [i.product, i.packSize || '', i.productionMonth || '', i.warehouse || ''].join('|') === lotKey;
    });
    var beforeQty = withRow ? withRow.quantity : 0;
    var afterQty = without ? without.quantity : 0;

    var head = editRow.product + ' ' + (editRow.packSize || '') + ' \u00b7 ' + (editRow.type || '') + ' ' + editRow.quantity +
        ' \u00b7 ' + (editRow.productionMonth || '\u2014') + ' \u00b7 ' + (editRow.warehouse || '\u2014') + ' \u00b7 ' + (editRow.date || editRow.timestamp || '');
    var impact = beforeQty === afterQty
        ? 'No stock exists for this lot \u2014 inventory unchanged. Removes the ledger/Activity record only.'
        : 'Stock for this lot: ' + beforeQty + ' \u2192 ' + afterQty + (afterQty > beforeQty ? ' (+' + (afterQty - beforeQty) + ' restored).' : ' (' + (afterQty - beforeQty) + ').');
    if (!confirm('Delete this transaction?\n\n' + head + '\n\n' + impact + '\n\nThis cannot be undone.')) return;

    var deleteTs = editRow.timestamp;
    closeEditModal();
    window.syncManager.deleteTransactions([{ client_timestamp: deleteTs }]).then(function (res) {
        if (res && res.success) {
            return window.syncManager.pullAllForce().then(function () {
                renderEditList();
                renderInventory();
                renderActivity(currentActivityFilter);
                renderDashboard();
                alert('Transaction deleted. ' + impact);
            });
        }
        alert('Delete failed' + (res && res.error ? ': ' + res.error : ' — try again.'));
    });
}

// ==============================
// INVENTORY TABLE
// ==============================
function renderInventory() {
    const search = document.getElementById('inv-search').value.toLowerCase();
    const tbody = document.getElementById('tbody-inventory');
    const countEl = document.getElementById('inv-filter-count');
    const opData = loadOperatorData();
    let data = filterByWarehouse((opData.inventory || []).map(item => {
        var ml = item.expiryMonth ? monthsUntilExpiry(item.expiryMonth) : null;
        return {
            product: item.product,
            pack: item.packSize,
            prefix: (PRODUCTS.find(p => p.name === item.product && p.pack === item.packSize) || {}).prefix || '',
            code: getAgiCode(item.product, item.packSize || ''),
            prodMonth: item.productionMonth || '',
            expiry: item.expiryMonth || '',
            qty: item.quantity,
            warehouse: item.warehouse || '',
            monthsLeft: ml,
            level: ml !== null ? getExpiryLevel(ml) : null
        };
    }));

    if (search) {
        data = data.filter(d => d.product.toLowerCase().includes(search) || d.code.toLowerCase().includes(search));
    }

    if (currentInvLevels.size > 0) {
        data = data.filter(d => d.level && currentInvLevels.has(d.level));
    }

    if (countEl) countEl.textContent = 'Showing ' + data.length + ' items';

    data.sort((a, b) => {
        const nameCmp = a.product.localeCompare(b.product);
        if (nameCmp !== 0) return nameCmp;
        const packCmp = a.pack.localeCompare(b.pack);
        if (packCmp !== 0) return packCmp;
        return a.prodMonth.localeCompare(b.prodMonth);
    });

    const groups = {};
    data.forEach(d => {
        const key = d.product + '|' + d.pack;
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
    });

    const whGroups = {};
    data.forEach(d => {
        const key = d.product + '|' + d.pack + '|' + d.warehouse;
        if (!whGroups[key]) whGroups[key] = [];
        whGroups[key].push(d);
    });

    const highlighted = new Set();
    Object.values(whGroups).forEach(group => {
        let runningMin = group[group.length - 1].qty
        for (let i = group.length - 2; i >= 0; i--) {
            if (group[i].qty > runningMin) {
                highlighted.add(group[i].product + '|' + group[i].pack + '|' + group[i].prodMonth + '|' + group[i].warehouse);
            }
            runningMin = Math.min(runningMin, group[i].qty)
        }
    });

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">' +
            (search ? 'No results found' : (currentInvLevels.size > 0 ? 'No items match these filters.' : 'No inventory data yet. Start counting from the operator app.')) +
            '</td></tr>';
        return;
    }

    let html = '';
    for (const key in groups) {
        const items = groups[key];
        const first = items[0];
        html += '<tr style="background:var(--table-header)"><td colspan="9" style="padding:10px 16px;font-weight:600;font-size:14px;">' + first.product + ' ' + first.pack + '</td></tr>';
        items.forEach(d => {
            const fefoClass = highlighted.has(d.product + '|' + d.pack + '|' + d.prodMonth + '|' + d.warehouse) ? ' style="background:#FEF3C7;"' : '';
            var mlDisplay = d.monthsLeft !== null ? '<span class="badge badge-' + (d.level === 'distant' ? 'distant' : d.level) + '">' + (d.level === 'expired' ? 'EXPIRED' : d.monthsLeft + 'M') + '</span>' : '\u2014';
            html += '<tr' + fefoClass + '><td>' + d.product + '</td><td>' + d.pack + '</td><td>' + (d.prefix || '\u2014') + '</td><td>' + (d.code || '\u2014') + '</td><td>' + d.prodMonth + '</td><td>' + (d.expiry || '\u2014') + '</td><td>' + mlDisplay + '</td><td>' + d.qty + '</td><td>' + (d.warehouse || '\u2014') + '</td></tr>';
        });
    }

    tbody.innerHTML = html;
}

// ==============================
// PRODUCTS TABLE
// ==============================
let editingIndex = -1;

function renderProducts() {
    const search = document.getElementById('prod-search').value.toLowerCase();
    const tbody = document.getElementById('tbody-products');
    let data = PRODUCTS;

    if (search) {
        data = data.filter(d => d.name.toLowerCase().includes(search) || d.prefix.toLowerCase().includes(search));
    }

    const canEdit = !sessionScope();
    var addBtn = document.getElementById('btn-add-product');
    if (addBtn) addBtn.style.display = canEdit ? '' : 'none';
    tbody.innerHTML = data.map((d, i) => {
        const originalIndex = PRODUCTS.indexOf(d);
        var actions = canEdit
            ? '<td><button class="action-btn" onclick="editProduct(' + originalIndex + ')">Edit</button> <button class="action-btn danger" onclick="deleteProduct(' + originalIndex + ')">Delete</button></td>'
            : '<td style="color:var(--text-muted);font-size:12px;">View only</td>';
        return '<tr><td><span class="badge badge-green">' + (d.prefix || '\u2014') + '</span></td><td>' + d.name + '</td><td>' + (d.pack || '\u2014') + '</td><td>' + (getAgiCode(d.name, d.pack) || '\u2014') + '</td>' + actions + '</tr>';
    }).join('');
}

function openProductModal(idx) {
    if (!gateMaster('change products')) return;
    editingIndex = idx !== undefined ? idx : -1;
    document.getElementById('modal-title').textContent = editingIndex >= 0 ? 'Edit Product' : 'Add Product';
    if (editingIndex >= 0) {
        const p = PRODUCTS[editingIndex];
        document.getElementById('modal-name').value = p.name;
        document.getElementById('modal-pack').value = p.pack;
        document.getElementById('modal-prefix').value = p.prefix;
        document.getElementById('modal-agi').value = getAgiCode(p.name, p.pack);
    } else {
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-pack').value = '';
        document.getElementById('modal-prefix').value = 'SCH';
        document.getElementById('modal-agi').value = '';
    }
    document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('open');
}

function saveProduct() {
    const name = document.getElementById('modal-name').value.trim();
    const pack = document.getElementById('modal-pack').value.trim();
    const prefix = document.getElementById('modal-prefix').value;
    const agi = document.getElementById('modal-agi').value.trim();
    if (!name) { alert('Product name is required'); return; }

    if (editingIndex >= 0) {
        const old = PRODUCTS[editingIndex];
        if (old.name !== name || old.pack !== pack) {
            const oldKey = old.name + '|' + (old.pack || '');
            const codes = JSON.parse(localStorage.getItem('product-agi-codes') || '{}');
            delete codes[oldKey];
            localStorage.setItem('product-agi-codes', JSON.stringify(codes));
        }
        PRODUCTS[editingIndex] = { name, pack, prefix };
    } else {
        PRODUCTS.push({ name, pack, prefix });
    }
    setAgiCode(name, pack, agi);
    localStorage.setItem('custom-products', JSON.stringify(PRODUCTS));
    closeProductModal();
    renderProducts();
    syncProducts();
}

function editProduct(idx) {
    openProductModal(idx);
}

function deleteProduct(idx) {
    if (!gateMaster('change products')) return;
    if (!confirm('Delete ' + PRODUCTS[idx].name + ' ' + PRODUCTS[idx].pack + '?')) return;
    const old = PRODUCTS[idx];
    const oldKey = old.name + '|' + (old.pack || '');
    const codes = JSON.parse(localStorage.getItem('product-agi-codes') || '{}');
    delete codes[oldKey];
    localStorage.setItem('product-agi-codes', JSON.stringify(codes));
    PRODUCTS.splice(idx, 1);
    localStorage.setItem('custom-products', JSON.stringify(PRODUCTS));
    renderProducts();
    syncProducts();
}

// ==============================
// CSV EXPORT HELPERS
// ==============================
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportExcel() { exportCsv(shelfLevels, 'Expiry_Report_'); }
function exportDashboard() { exportCsv(null, 'Dashboard_Expiry_'); }
function exportCsv(filter, prefix) {
    const opData = loadOperatorData();
    let data = filterByWarehouse((opData.inventory || []).filter(item => item.expiryMonth)).map(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        return { product: item.product, pack: item.packSize, code: item.productionMonth || '', expiry: item.expiryMonth, qty: item.quantity, monthsLeft, level: getExpiryLevel(monthsLeft), range: monthsLeft <= 12 ? '12m' : '18m', warehouse: item.warehouse || '' };
    });
    if (filter && filter.size) data = data.filter(d => filter.has(d.level));
    const search = (document.getElementById('life-search').value || '').toLowerCase();
    if (search) data = data.filter(d => d.product.toLowerCase().includes(search) || (d.pack || '').toLowerCase().includes(search) || (d.code || '').toLowerCase().includes(search));
    let csv = 'Product,Pack,Code,Expiry,Qty,Months Left,Level,Range,Warehouse\n';
    data.forEach(d => { csv += d.product + ',' + d.pack + ',' + d.code + ',' + d.expiry + ',' + d.qty + ',' + d.monthsLeft + ',' + d.level + ',' + d.range + ',' + d.warehouse + '\n'; });
    downloadCSV(csv, prefix + new Date().toISOString().slice(0, 10) + '.csv');
}

function exportInventory() {
    const opData = loadOperatorData();
    const search = (document.getElementById('inv-search').value || '').toLowerCase();
    let data = filterByWarehouse(opData.inventory || []).map(item => {
        const ml = item.expiryMonth ? monthsUntilExpiry(item.expiryMonth) : null;
        return {
            product: item.product, pack: item.packSize,
            prefix: (PRODUCTS.find(p => p.name === item.product && p.pack === item.packSize) || {}).prefix || '',
            code: getAgiCode(item.product, item.packSize || ''),
            prodMonth: item.productionMonth || '',
            expiry: item.expiryMonth || '',
            qty: item.quantity,
            warehouse: item.warehouse || '',
            monthsLeft: ml,
            level: ml !== null ? getExpiryLevel(ml) : null
        };
    });
    if (search) {
        data = data.filter(d => d.product.toLowerCase().includes(search) || d.code.toLowerCase().includes(search));
    }
    if (currentInvLevels.size > 0) {
        data = data.filter(d => d.level && currentInvLevels.has(d.level));
    }
    const quote = v => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
    const fmtLeft = ml => ml === null ? '' : ml;
    let csv = 'Product,Pack,Prefix,AGI Code,Prod Month,Expiry,Months Left,Qty,Warehouse\n';
    data.forEach(d => {
        csv += [d.product, d.pack, d.prefix, d.code, d.prodMonth, d.expiry, fmtLeft(d.monthsLeft), d.qty, d.warehouse].map(quote).join(',') + '\n';
    });
    downloadCSV(csv, 'Inventory_' + new Date().toISOString().slice(0, 10) + '.csv');
}

function exportActivity() {
    const opData = loadOperatorData();
    let filtered = opData.transactions || [];
    if (activityWhFilter !== 'all') {
        filtered = filtered.filter(d => d.warehouse && String(d.warehouse).trim().toLowerCase() === String(activityWhFilter).trim().toLowerCase());
    }
    if (currentActivityFilter !== 'all') {
        const typeMap = { 'add': 'receive', 'sub': 'dispatch', 'adjust': 'adjustment' };
        filtered = filtered.filter(d => d.type === typeMap[currentActivityFilter]);
    }
    const search = (document.getElementById('activity-search').value || '').toLowerCase();
    if (search) filtered = filtered.filter(d => (d.product || '').toLowerCase().includes(search) || (d.packSize || '').toLowerCase().includes(search) || (d.productionMonth || '').toLowerCase().includes(search) || (getAgiCode(d.product, d.packSize || '') || '').toLowerCase().includes(search) || (d.operator || '').toLowerCase().includes(search));
    let csv = 'Date & Time,Product,Pack,AGI Code,Code,Warehouse,Type,Qty,Operator\n';
    filtered.forEach(d => {
        const typeLabels = { 'receive': 'Addition', 'dispatch': 'Subtraction', 'adjustment': 'Set' };
        const typeText = typeLabels[d.type] || d.type;
        csv += (d.date || '') + ',' + d.product + ',' + (d.packSize || '') + ',' + (getAgiCode(d.product, d.packSize || '') || '') + ',' + (d.productionMonth || '') + ',' + (d.warehouse || '') + ',' + typeText + ',' + d.quantity + ',' + (d.operator || '') + '\n';
    });
    downloadCSV(csv, 'Activity_Log_' + new Date().toISOString().slice(0, 10) + '.csv');
}

function exportProducts() {
    let csv = 'Prefix,Product Name,Pack Size,AGI Code\n';
    PRODUCTS.forEach(d => {
        csv += (d.prefix || '\u2014') + ',' + d.name + ',' + (d.pack || '\u2014') + ',' + (getAgiCode(d.name, d.pack) || '') + '\n';
    });
    downloadCSV(csv, 'Products_' + new Date().toISOString().slice(0, 10) + '.csv');
}

// ==============================
// MONTHLY REPORT — INVENTORY EXPIRY AGEING + SKU COHORT FOLLOW-UP
// ==============================
// Reads ONLY localStorage['operator-data'] (the transaction ledger). The
// last-month and current-month snapshots are rebuilt from that ledger using
// the operator app's exact merge semantics — nothing here stores or mutates
// data, every entered count keeps its source transaction.

const AGE_BUCKET_LABELS = { expired: 'Expired', crit: 'Expiring \u22643mo', warn: 'Expiring 4-6mo', notc: 'Expiring 7-12mo', dist: 'Expiring 13-18mo', futr: 'Future >18mo' };
const AGE_BUCKET_ORDER = ['expired', 'crit', 'warn', 'notc', 'dist', 'futr'];
const AGE_BUCKET_RANK = { expired: 0, crit: 1, warn: 2, notc: 3, dist: 4, futr: 5 };

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatMonth(ym) {
    if (!ym) return '\u2014';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d = new Date(ym + '-01');
    if (isNaN(d.getTime())) return '\u2014';
    return months[d.getMonth()] + ' ' + d.getFullYear();
}

function parseEntryDate(tx) {
    var ts = tx.timestamp;
    if (ts) { var d = new Date(ts); if (!isNaN(d.getTime())) return d.getTime(); }
    if (tx.date) { var d2 = new Date(tx.date); if (!isNaN(d2.getTime())) return d2.getTime(); }
    return 0; // undated → treated as earliest, present in every snapshot
}

function monthEndOf(ym) {
    if (!ym) return 0;
    var d = new Date(parseInt(ym.slice(0, 4)), parseInt(ym.slice(5, 7)) - 1, 1);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

function monthStartOf(ym) {
    if (!ym) return 0;
    return new Date(parseInt(ym.slice(0, 4)), parseInt(ym.slice(5, 7)) - 1, 1, 0, 0, 0, 0).getTime();
}

// Rebuild inventory at a cutoff from the ledger, mirroring the operator
// app's merge: key = product|pack|productionMonth|warehouse.
// Undated transactions (ts === 0) are anchored to the current-month cutoff
// (anchorEnd) only — they never appear in historical snapshots, so a first
// month of input shows last month as 0.
function rebuildInventoryAt(cutoffTs, anchorEnd) {
    var opData = loadOperatorData();
    var allTxs = (opData.transactions || []);
    var txs = allTxs.filter(function (t) { var ts = parseEntryDate(t); return ts === 0 ? cutoffTs >= anchorEnd : ts <= cutoffTs; });
    txs.sort(function (a, b) { return parseEntryDate(a) - parseEntryDate(b); });
    var inv = {};
    txs.forEach(function (t) {
        var qty = t.quantity || 0;
        var key = (t.product || '') + '|' + (t.packSize || '') + '|' + (t.productionMonth || '') + '|' + (t.warehouse || '');
        var cur = inv[key];
        if (t.type === 'receive') {
            if (cur) cur.qty += qty;
            else inv[key] = { product: t.product, pack: t.packSize, productionMonth: t.productionMonth || '', expiryMonth: t.expiryMonth || '', qty: qty, warehouse: t.warehouse || '' };
        } else if (t.type === 'dispatch') {
            if (cur) { cur.qty = Math.max(0, cur.qty - qty); if (cur.qty === 0) delete inv[key]; }
        } else if (t.type === 'adjustment') {
            if (cur) cur.qty = qty;
            else if (qty > 0) inv[key] = { product: t.product, pack: t.packSize, productionMonth: t.productionMonth || '', expiryMonth: t.expiryMonth || '', qty: qty, warehouse: t.warehouse || '' };
        }
    });
    return Object.values(inv).filter(function (i) { return i.qty > 0; });
}

function monthOf(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

function prevMonthOf(ym) {
    var d = new Date(ym + '-01');
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

function computeMonthSnapshots() {
    var txs = (loadOperatorData().transactions || []);
    var first = 0, latest = 0, skipped = 0;
    txs.forEach(function (t) {
        var ts = parseEntryDate(t);
        if (ts === 0) { skipped++; return; }
        if (!first || ts < first) first = ts;
        if (ts > latest) latest = ts;
    });
    var empty = { lmMonth: '', cmMonth: '', lmEnd: 0, cmEnd: 0, lmStart: 0, cmStart: 0, lmSnapshot: [], cmSnapshot: [], skipped: skipped, isFirstMonth: false, lmHasRecords: false, hasData: false };
    if (!latest) return empty;

    var autoCm = monthOf(latest);
    var cmSel = document.getElementById('monthly-cm-month-select');
    var lmSel = document.getElementById('monthly-lm-month-select');
    var cmMonth = cmSel && cmSel.value && cmSel.value !== 'auto' ? cmSel.value : autoCm;
    var lmMonth = lmSel && lmSel.value && lmSel.value !== 'auto' ? lmSel.value : prevMonthOf(cmMonth);
    if (lmMonth >= cmMonth) lmMonth = prevMonthOf(cmMonth);

    var cmEnd = monthEndOf(cmMonth);
    var lmEnd = monthEndOf(lmMonth);
    var lmHasRecords = txs.some(function (t) { var ts = parseEntryDate(t); return ts > 0 && monthOf(ts) === lmMonth; });
    var isFirstMonth = !txs.some(function (t) { var ts = parseEntryDate(t); return ts > 0 && monthOf(ts) < cmMonth; });

    return {
        lmMonth: lmMonth, cmMonth: cmMonth, lmEnd: lmEnd, cmEnd: cmEnd,
        lmStart: monthStartOf(lmMonth), cmStart: monthStartOf(cmMonth),
        lmSnapshot: rebuildInventoryAt(lmEnd, cmEnd), cmSnapshot: rebuildInventoryAt(cmEnd, cmEnd),
        skipped: skipped, isFirstMonth: isFirstMonth, lmHasRecords: lmHasRecords, hasData: true
    };
}

function expiryMonthTs(expiryStr) {
    var t = parseExpiryDate(expiryStr);
    if (isNaN(t)) return NaN;
    var d = new Date(t);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

function ageBucketOf(expiryStr, refEnd) {
    var ee = expiryMonthTs(expiryStr);
    if (isNaN(ee)) return null;
    var a = new Date(ee), b = new Date(refEnd);
    var months = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
    if (months < 0) return 'expired';
    if (months <= 3) return 'crit';
    if (months <= 6) return 'warn';
    if (months <= 12) return 'notc';
    if (months <= 18) return 'dist';
    return 'futr';
}

function monthsLeftFrom(expiryStr, refEnd) {
    var ee = expiryMonthTs(expiryStr);
    if (isNaN(ee)) return null;
    var a = new Date(ee), b = new Date(refEnd);
    return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}

function ageBadgeClass(b) {
    return { expired: 'badge-expired', crit: 'badge-critical', warn: 'badge-warning', notc: 'badge-notice', dist: 'badge-distant', futr: 'badge-distant' }[b] || 'badge-notice';
}

function ageRowClass(b) {
    return { expired: 'row-expired', crit: 'row-critical', warn: 'row-warning', notc: 'row-notice' }[b] || '';
}

function populateMonthlyPicker() {
    var txs = (loadOperatorData().transactions || []);
    var months = {};
    txs.forEach(function (t) {
        var ts = parseEntryDate(t);
        if (ts > 0) months[monthOf(ts)] = true;
    });
    var cmSel = document.getElementById('monthly-cm-month-select');
    var lmSel = document.getElementById('monthly-lm-month-select');
    if (!cmSel || !lmSel) return;
    var chosenCm = cmSel.value || 'auto';
    var chosenLm = lmSel.value || 'auto';
    var sorted = Object.keys(months).sort();
    cmSel.innerHTML = ['auto'].concat(sorted).map(function (m) {
        return '<option value="' + m + '">' + (m === 'auto' ? 'Auto (latest)' : formatMonth(m)) + '</option>';
    }).join('');
    lmSel.innerHTML = ['auto'].concat(sorted.filter(function (m) { return m < chosenCm; })).map(function (m) {
        return '<option value="' + m + '">' + (m === 'auto' ? 'Auto (month before)' : formatMonth(m)) + '</option>';
    }).join('');
    if (cmSel.querySelector('option[value="' + chosenCm + '"]')) cmSel.value = chosenCm;
    if (lmSel.querySelector('option[value="' + chosenLm + '"]')) lmSel.value = chosenLm;
}

function resetMonthlyPicker() {
    var cmSel = document.getElementById('monthly-cm-month-select');
    var lmSel = document.getElementById('monthly-lm-month-select');
    if (cmSel) cmSel.value = 'auto';
    if (lmSel) lmSel.value = 'auto';
    renderMonthlyReport();
}

function renderMonthlyReport() {
    populateMonthlyPicker();
    renderAgeingSummary();
    renderCohortFollowup();
}

function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderAgeingSummary() {
    var snap = computeMonthSnapshots();
    if (!snap.hasData) {
        setText('ageing-reference', 'Inventory Expiry Ageing Summary \u2014 no data yet');
        var strip0 = document.getElementById('ageing-summary-strip');
        if (strip0) strip0.style.display = 'none';
        var cards0 = document.getElementById('ageing-cards');
        if (cards0) cards0.innerHTML = '';
        var en = document.getElementById('ageing-excluded-note');
        if (en) en.style.display = 'none';
        var tb = document.getElementById('tbody-ageing');
        if (tb) tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No transaction data yet. Start counting from the operator app.</td></tr>';
        return;
    }
    var lmItems = filterByWarehouse(snap.lmSnapshot);
    var cmItems = filterByWarehouse(snap.cmSnapshot);
    var lm = {}, cm = {}, lmExcluded = 0, cmExcluded = 0;
    lmItems.forEach(function (i) {
        if (!i.expiryMonth) { lmExcluded += i.qty; return; }
        var b = ageBucketOf(i.expiryMonth, snap.lmEnd) || 'futr';
        lm[b] = (lm[b] || 0) + i.qty;
    });
    cmItems.forEach(function (i) {
        if (!i.expiryMonth) { cmExcluded += i.qty; return; }
        var b = ageBucketOf(i.expiryMonth, snap.cmEnd) || 'futr';
        cm[b] = (cm[b] || 0) + i.qty;
    });
    var lmTotal = lmItems.reduce(function (s, i) { return s + i.qty; }, 0);
    var cmTotal = cmItems.reduce(function (s, i) { return s + i.qty; }, 0);
    var atRisk = ['expired', 'crit', 'warn', 'notc'].reduce(function (s, b) { return s + (cm[b] || 0); }, 0);

    setText('ageing-reference', 'Inventory Expiry Ageing Summary \u2014 ' + formatMonth(snap.lmMonth) + ' vs ' + formatMonth(snap.cmMonth));

    var strip = document.getElementById('ageing-summary-strip');
    if (strip) {
        strip.style.display = 'flex';
        strip.innerHTML =
            '<span class="ageing-strip-item"><span class="ageing-strip-label">Current Month (' + formatMonth(snap.cmMonth) + ')</span><span class="ageing-strip-value">' + cmTotal.toLocaleString() + ' ctns</span></span>' +
            '<span class="ageing-strip-item"><span class="ageing-strip-label">At risk \u226412 mo</span><span class="ageing-strip-value ageing-strip-danger">' + atRisk.toLocaleString() + ' (' + (cmTotal > 0 ? (atRisk / cmTotal * 100).toFixed(1) : 0) + '%)</span></span>' +
            '<span class="ageing-strip-item"><span class="ageing-strip-label">Expired</span><span class="ageing-strip-value ageing-strip-bad">' + (cm['expired'] || 0).toLocaleString() + '</span></span>';
    }

    var cards = document.getElementById('ageing-cards');
    if (cards) {
        cards.innerHTML = AGE_BUCKET_ORDER.map(function (b) {
            var cmq = cm[b] || 0, lmq = lm[b] || 0;
            var share = cmTotal > 0 ? (cmq / cmTotal * 100) : 0;
            return '<div class="ageing-card ac-' + b + '" role="button" tabindex="0" aria-label="' + AGE_BUCKET_LABELS[b] + ', current month ' + cmq.toLocaleString() + ', last month ' + lmq.toLocaleString() + '" onclick="showAgeingDrilldown(\'' + b + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();showAgeingDrilldown(\'' + b + '\');}">' +
                '<div class="ageing-card-top"><span class="badge ' + ageBadgeClass(b) + '">' + AGE_BUCKET_LABELS[b] + '</span><span class="ageing-card-share">' + share.toFixed(1) + '%</span></div>' +
                '<div class="ageing-card-cm">' + cmq.toLocaleString() + '</div>' +
                '<div class="ageing-card-lm">Last Month (' + formatMonth(snap.lmMonth) + '): ' + lmq.toLocaleString() + '</div>' +
                '</div>';
        }).join('');
    }

    var excludedNote = document.getElementById('ageing-excluded-note');
    if (excludedNote) {
        var ex = lmExcluded + cmExcluded;
        var noteParts = [];
        if (ex > 0) noteParts.push(ex.toLocaleString() + ' carton' + (ex === 1 ? '' : 's') + ' across the two snapshots have no expiry date and are excluded from bucketing (still counted in the totals)');
        if (snap.skipped > 0) noteParts.push(snap.skipped + ' entr' + (snap.skipped === 1 ? 'y has' : 'ies have') + ' no usable date and are counted in the current-month totals only');
        if (noteParts.length > 0) {
            excludedNote.style.display = 'block';
            excludedNote.textContent = noteParts.join('. ') + '.';
        } else {
            excludedNote.style.display = 'none';
        }
    }

    var tbody = document.getElementById('tbody-ageing');
    tbody.innerHTML = AGE_BUCKET_ORDER.map(function (b) {
        var lmq = lm[b] || 0, cmq = cm[b] || 0;
        var change = cmq - lmq;
        var changeCls = change > 0 ? 'movement-up' : (change < 0 ? 'movement-down' : '');
        var changeHtml = '<span class="' + changeCls + '">' + (change > 0 ? '+' : '') + change.toLocaleString() + '</span>';
        var changePctHtml;
        if (lmq > 0) {
            var pct = change / lmq * 100;
            changePctHtml = '<span class="' + changeCls + '">' + (change > 0 ? '+' : '') + pct.toFixed(1) + '%</span>';
        } else {
            changePctHtml = '<span class="' + changeCls + '">' + (cmq > 0 ? 'New' : '\u2014') + '</span>';
        }
        var share = cmTotal > 0 ? (cmq / cmTotal * 100) : 0;
        var shareHtml = cmTotal > 0
            ? '<div class="ageing-pct"><div class="ageing-bar"><div class="ageing-bar-fill" style="width:' + share.toFixed(1) + '%"></div></div><span class="ageing-pct-num">' + share.toFixed(1) + '%</span></div>'
            : '<span style="color:var(--text-muted);">\u2014</span>';
        return '<tr class="' + ageRowClass(b) + '"><td><span class="badge ' + ageBadgeClass(b) + '">' + AGE_BUCKET_LABELS[b] + '</span>' +
            ' <a href="javascript:void(0)" onclick="showAgeingDrilldown(\'' + b + '\')" style="font-size:12px;color:#16A34A;margin-left:6px;">view \u2192</a>' +
            '</td><td>' + lmq.toLocaleString() + '</td><td>' + cmq.toLocaleString() + '</td><td>' + changeHtml + '</td><td>' + changePctHtml + '</td><td>' + shareHtml + '</td></tr>';
    }).join('');
}

function showAgeingDrilldown(bucket) {
    var snap = computeMonthSnapshots();
    var items = filterByWarehouse(snap.cmSnapshot).filter(function (i) { return i.expiryMonth && ageBucketOf(i.expiryMonth, snap.cmEnd) === bucket; });
    document.getElementById('drilldown-title').textContent = AGE_BUCKET_LABELS[bucket] + ' \u2014 current month stock (' + items.length + ' lot' + (items.length === 1 ? '' : 's') + ')';
    var tbody = document.getElementById('tbody-drilldown');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No lots in this bucket for the current month.</td></tr>';
    } else {
        tbody.innerHTML = items.map(function (i) {
            var ml = monthsLeftFrom(i.expiryMonth, snap.cmEnd);
            var badge = ml === null ? '\u2014' : '<span class="badge ' + ageBadgeClass(ml < 0 ? 'expired' : (ml <= 3 ? 'crit' : (ml <= 6 ? 'warn' : (ml <= 12 ? 'notc' : 'dist')))) + '">' + (ml < 0 ? 'EXPIRED' : ml + 'M') + '</span>';
            return '<tr class="' + ageRowClass(bucket) + '"><td>' + i.product + '</td><td>' + (i.pack || '\u2014') + '</td><td>' + (i.productionMonth || '\u2014') + '</td><td>' + i.expiryMonth + '</td><td>' + i.qty.toLocaleString() + '</td><td>' + badge + '</td><td>' + (i.warehouse || '\u2014') + '</td></tr>';
        }).join('');
    }
    document.getElementById('drilldown-modal').classList.add('open');
}

function exportAgeingSummary() {
    var snap = computeMonthSnapshots();
    var lmItems = filterByWarehouse(snap.lmSnapshot);
    var cmItems = filterByWarehouse(snap.cmSnapshot);
    var lm = {}, cm = {};
    lmItems.forEach(function (i) { if (i.expiryMonth) { var b = ageBucketOf(i.expiryMonth, snap.lmEnd) || 'futr'; lm[b] = (lm[b] || 0) + i.qty; } });
    cmItems.forEach(function (i) { if (i.expiryMonth) { var b = ageBucketOf(i.expiryMonth, snap.cmEnd) || 'futr'; cm[b] = (cm[b] || 0) + i.qty; } });
    var lmTotal = lmItems.reduce(function (s, i) { return s + i.qty; }, 0);
    var cmTotal = cmItems.reduce(function (s, i) { return s + i.qty; }, 0);
    var quote = function (v) { return '"' + String(v === undefined || v === null ? '' : v).trim().replace(/"/g, '""') + '"'; };
    var csv = 'Inventory Expiry Ageing Summary\nReference: ' + formatMonth(snap.lmMonth) + ' vs ' + formatMonth(snap.cmMonth) + '\n\n';
    csv += 'Category,Last Month Qty,Current Month Qty,% of Current Month\n';
    AGE_BUCKET_ORDER.forEach(function (b) {
        var lmq = lm[b] || 0, cmq = cm[b] || 0;
        var share = cmTotal > 0 ? (cmq / cmTotal * 100).toFixed(1) : '0.0';
        csv += quote(AGE_BUCKET_LABELS[b]) + ',' + lmq + ',' + cmq + ',' + share + '\n';
    });
    csv += 'Total,' + lmTotal + ',' + cmTotal + ',100.0\n';
    downloadCSV(csv, 'Ageing_Summary_' + new Date().toISOString().slice(0, 10) + '.csv');
}

// ==============================
// SECTION 2 — SKU-LEVEL FOLLOW-UP COHORT (last month's \u226412-month risk)
// ==============================

function buildCohort() {
    var snap = computeMonthSnapshots();
    var lmItems = filterByWarehouse(snap.lmSnapshot);
    var cmItems = filterByWarehouse(snap.cmSnapshot);
    var cohort = {};
    lmItems.forEach(function (i) {
        if (!i.expiryMonth) return;
        var b = ageBucketOf(i.expiryMonth, snap.lmEnd);
        if (b === null || b === 'dist' || b === 'futr') return;
        var key = (i.product || '') + '|' + (i.pack || '') + '|' + (i.productionMonth || '');
        var row = cohort[key];
        if (!row) cohort[key] = { product: i.product, pack: i.pack, code: i.productionMonth || '', expiry: i.expiryMonth, lmQty: 0, lmBucket: b };
        cohort[key].lmQty += i.qty;
        if (expiryMonthTs(i.expiryMonth) < expiryMonthTs(cohort[key].expiry)) cohort[key].expiry = i.expiryMonth;
    });
    if (Object.keys(cohort).length === 0 && snap.isFirstMonth) {
        cmItems.forEach(function (i) {
            if (!i.expiryMonth) return;
            var b = ageBucketOf(i.expiryMonth, snap.cmEnd);
            if (b === null || b === 'dist' || b === 'futr') return;
            var key = (i.product || '') + '|' + (i.pack || '') + '|' + (i.productionMonth || '');
            var row = cohort[key];
            if (!row) cohort[key] = { product: i.product, pack: i.pack, code: i.productionMonth || '', expiry: i.expiryMonth, lmQty: 0, lmBucket: b };
            cohort[key].lmQty += 0;
            if (expiryMonthTs(i.expiryMonth) < expiryMonthTs(cohort[key].expiry)) cohort[key].expiry = i.expiryMonth;
        });
    }
    var cmQtyByKey = {}, cmTouchedByKey = {};
    cmItems.forEach(function (i) {
        var key = (i.product || '') + '|' + (i.pack || '') + '|' + (i.productionMonth || '');
        cmQtyByKey[key] = (cmQtyByKey[key] || 0) + i.qty;
        cmTouchedByKey[key] = true;
    });
    filterByWarehouse(loadOperatorData().transactions).forEach(function (t) {
        var ts = parseEntryDate(t);
        if (ts >= snap.cmStart && ts <= snap.cmEnd) {
            var key = (t.product || '') + '|' + (t.packSize || '') + '|' + (t.productionMonth || '');
            cmTouchedByKey[key] = true;
        }
    });
    var rows = Object.keys(cohort).map(function (key) {
        var r = cohort[key];
        var cmQty = cmQtyByKey[key] || 0;
        var cmBucket = ageBucketOf(r.expiry, snap.cmEnd) || 'futr';
        var net = cmQty - r.lmQty;
        var cleared = cmQty === 0;
        var absent = cleared && !cmTouchedByKey[key];
        var increased = cmQty > r.lmQty;
        var reduced = cmQty > 0 && cmQty < r.lmQty;
        var statusText = cleared ? (absent ? 'Absent in CM \u2014 verify cleared' : 'Fully cleared from inventory') : (increased ? 'Exposure increased' : (reduced ? 'Exposure reduced' : 'No change'));
        var statusCls = cleared ? (absent ? '' : 'movement-down') : (increased ? 'movement-up' : (reduced ? 'movement-down' : ''));
        return { r: r, key: key, cmQty: cmQty, cmBucket: cmBucket, net: net, redPct: r.lmQty > 0 ? ((r.lmQty - cmQty) / r.lmQty * 100) : 0, ml: monthsLeftFrom(r.expiry, snap.cmEnd), statusText: statusText, statusCls: statusCls, absent: absent, cleared: cleared, increased: increased };
    });
    rows.sort(function (a, b) {
        var ra = AGE_BUCKET_RANK[a.cmBucket], rb = AGE_BUCKET_RANK[b.cmBucket];
        if (ra !== rb) return ra - rb;
        if (b.cmQty !== a.cmQty) return b.cmQty - a.cmQty;
        return b.net - a.net;
    });
    var stats = {
        snap: snap, rows: rows,
        riskBatches: rows.length,
        lmRisk: rows.reduce(function (s, r) { return s + r.r.lmQty; }, 0),
        cmRemain: rows.reduce(function (s, r) { return s + r.cmQty; }, 0),
        cleared: rows.filter(function (r) { return r.cleared; }).length,
        increased: rows.filter(function (r) { return r.increased; }).length
    };
    stats.reduction = stats.lmRisk - stats.cmRemain;
    stats.redPct = stats.lmRisk > 0 ? (stats.reduction / stats.lmRisk * 100) : null;
    return stats;
}

function cohortKpiChip(title, value, extra, color, kind) {
    var clickable = kind ? ' style="cursor:pointer;" onclick="showCohortChipBreakdown(\'' + kind + '\')" tabindex="0" role="button" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){showCohortChipBreakdown(\'' + kind + '\');}"' : '';
    return '<div class="bucket-change-card"' + clickable + '><div class="bucket-change-title">' + title + '</div>' +
        '<div class="bucket-change-values"' + (color ? ' style="color:' + color + ';"' : '') + '>' + value + '</div>' +
        (extra ? '<div class="bucket-change-delta">' + extra + '</div>' : '') + '</div>';
}

function renderCohortFollowup() {
    var c = buildCohort();
    setText('cohort-reference', 'SKU-Level Follow-up: ' + formatMonth(c.snap.lmMonth) + ' \u226412-Month Expiry-Risk Cohort \u2014 vs ' + formatMonth(c.snap.cmMonth));

    var kpis = document.getElementById('cohort-kpis');
    var redPctStr = c.redPct === null ? '\u2014' : c.redPct.toFixed(1) + '%';
    var baseline = c.snap.isFirstMonth;
    kpis.innerHTML =
        cohortKpiChip('Risk Batches', c.riskBatches, baseline ? 'this month' : 'from last month', '', 'risk') +
        cohortKpiChip(formatMonth(c.snap.lmMonth) + ' Risk Qty', c.lmRisk.toLocaleString(), '', '', 'lm') +
        cohortKpiChip(formatMonth(c.snap.cmMonth) + ' Remaining', c.cmRemain.toLocaleString(), '', '', 'cm') +
        cohortKpiChip('Qty Reduction', (baseline ? 0 : c.reduction).toLocaleString(), redPctStr, baseline ? '' : (c.reduction < 0 ? '#DC2626' : (c.reduction > 0 ? '#16A34A' : '')), 'reduction') +
        cohortKpiChip('Fully Cleared \u2713', c.cleared, 'green status', '#16A34A', 'cleared') +
        cohortKpiChip('Increased Exposure \u25B2', baseline ? '\u2014' : c.increased, baseline ? '' : 'red status', baseline ? '' : (c.increased > 0 ? '#DC2626' : ''), 'increased');

    var tbody = document.getElementById('tbody-cohort');
    if (c.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">' +
            (c.snap.isFirstMonth ? 'No prior-month \u226412-month cohort yet. Baseline builds from the first full month of operation.' : 'No last-month items fell inside the \u226412-month expiry window.') +
            '</td></tr>';
        return;
    }
    tbody.innerHTML = c.rows.map(function (d) {
        var statusColor = d.statusCls === 'movement-up' ? '#DC2626' : (d.statusCls === 'movement-down' ? '#16A34A' : '');
        var netHtml = '<span class="' + (d.net > 0 ? 'movement-up' : (d.net < 0 ? 'movement-down' : '')) + '">' + (d.net > 0 ? '+' : '') + d.net.toLocaleString() + '</span>';
        var statusHtml = '<span style="' + (statusColor ? 'color:' + statusColor + ';' : '') + 'font-weight:600;">' + d.statusText + '</span>';
        if (d.absent) statusHtml += '<br><span style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;padding:1px 6px;border-radius:4px;font-size:11px;display:inline-block;margin-top:3px;">Absent in CM \u2014 verify</span>';
        return '<tr class="' + ageRowClass(d.cmBucket) + '" style="cursor:pointer;" onclick="showCohortDetail(\'' + escQuote(d.r.product) + '\',\'' + escQuote(d.r.pack || '') + '\',\'' + escQuote(d.r.code || '') + '\')">' +
            '<td>' + d.r.product + '</td><td>' + (d.r.pack || '\u2014') + '</td>' +
            '<td style="' + (d.cmBucket === 'expired' ? 'color:#DC2626;font-weight:600;' : (d.cmBucket === 'crit' ? 'color:#EA580C;font-weight:600;' : '')) + '">' + d.r.expiry + '</td>' +
            '<td>' + d.r.lmQty.toLocaleString() + '</td><td>' + d.cmQty.toLocaleString() + '</td><td>' + netHtml + '</td>' +
            '<td>' + (d.r.lmQty > 0 ? d.redPct.toFixed(1) + '%' : '\u2014') + '</td><td>' + statusHtml + '</td></tr>';
    }).join('');
}

function showCohortChipBreakdown(kind) {
    var c = buildCohort();
    var snap = c.snap;
    var titles = {
        risk: 'Risk batches \u2014 ' + formatMonth(snap.lmMonth) + ' cohort tracked vs ' + formatMonth(snap.cmMonth),
        lm: formatMonth(snap.lmMonth) + ' risk qty \u2014 batches from last month',
        cm: formatMonth(snap.cmMonth) + ' remaining \u2014 batches still on hand',
        reduction: 'Qty reduction \u2014 batches with net decrease',
        cleared: 'Fully cleared \u2014 batches at 0 in ' + formatMonth(snap.cmMonth),
        increased: 'Increased exposure \u2014 batches with more this month'
    };
    var empties = {
        risk: 'No batches in the risk cohort.',
        lm: 'No prior-month risk qty (baseline month \u2014 baseline builds this month).',
        cm: 'No batches remain on hand this month.',
        reduction: 'No batch reduced yet \u2014 all are new this month.',
        cleared: 'No batches fully cleared yet this month.',
        increased: snap.isFirstMonth ? 'Baseline month \u2014 all at-risk SKUs are listed under Risk Batches.' : 'No batch increased this month.'
    };
    var rows = c.rows.filter(function (d) {
        if (kind === 'lm') return d.r.lmQty > 0;
        if (kind === 'cm') return d.cmQty > 0;
        if (kind === 'reduction') return d.net < 0;
        if (kind === 'cleared') return d.cleared;
        if (kind === 'increased') return d.increased;
        return true;
    });
    document.getElementById('drilldown-title').textContent = titles[kind] + ' (' + rows.length + ')';
    document.getElementById('thead-drilldown').innerHTML = '<tr><th>SKU / Product</th><th>Pack</th><th>Code</th><th>Expiry</th><th>LM Qty</th><th>CM Qty</th><th>Net</th><th>Status</th></tr>';
    var tbody = document.getElementById('tbody-drilldown');
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">' + empties[kind] + '</td></tr>';
    } else {
        tbody.innerHTML = rows.map(function (d) {
            var statusColor = d.statusCls === 'movement-up' ? '#DC2626' : (d.statusCls === 'movement-down' ? '#16A34A' : '');
            var netHtml = '<span class="' + (d.net > 0 ? 'movement-up' : (d.net < 0 ? 'movement-down' : '')) + '">' + (d.net > 0 ? '+' : '') + d.net.toLocaleString() + '</span>';
            var statusHtml = '<span style="' + (statusColor ? 'color:' + statusColor + ';' : '') + 'font-weight:600;">' + d.statusText + '</span>';
            return '<tr class="' + ageRowClass(d.cmBucket) + '" style="cursor:pointer;" onclick="showCohortDetail(\'' + escQuote(d.r.product) + '\',\'' + escQuote(d.r.pack || '') + '\',\'' + escQuote(d.r.code || '') + '\')">' +
                '<td>' + d.r.product + '</td><td>' + (d.r.pack || '\u2014') + '</td>' +
                '<td style="' + (d.cmBucket === 'expired' ? 'color:#DC2626;font-weight:600;' : (d.cmBucket === 'crit' ? 'color:#EA580C;font-weight:600;' : '')) + '">' + d.r.expiry + '</td>' +
                '<td>' + d.r.lmQty.toLocaleString() + '</td><td>' + d.cmQty.toLocaleString() + '</td><td>' + netHtml + '</td>' +
                '<td>' + (d.r.lmQty > 0 ? d.redPct.toFixed(1) + '%' : '\u2014') + '</td><td>' + statusHtml + '</td></tr>';
        }).join('');
    }
    document.getElementById('drilldown-modal').classList.add('open');
}

function showCohortDetail(product, pack, code) {
    var snap = computeMonthSnapshots();
    var key = product + '|' + pack + '|' + code;
    var lmRows = snap.lmSnapshot.filter(function (i) { return (i.product || '') + '|' + (i.pack || '') + '|' + (i.productionMonth || '') === key; });
    var cmRows = snap.cmSnapshot.filter(function (i) { return (i.product || '') + '|' + (i.pack || '') + '|' + (i.productionMonth || '') === key; });
    document.getElementById('drilldown-title').textContent = product + (pack ? ' ' + pack : '') + ' \u2014 Batch ' + (code || '\u2014') + ' \u2014 per warehouse';
    var tbody = document.getElementById('tbody-drilldown');
    var whSet = {};
    lmRows.concat(cmRows).forEach(function (i) { whSet[i.warehouse || '\u2014'] = true; });
    var whs = Object.keys(whSet);
    if (whs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No lot records found.</td></tr>';
    } else {
        tbody.innerHTML = whs.map(function (w) {
            var lm = lmRows.filter(function (i) { return (i.warehouse || '\u2014') === w; }).reduce(function (s, i) { return s + i.qty; }, 0);
            var cm = cmRows.filter(function (i) { return (i.warehouse || '\u2014') === w; }).reduce(function (s, i) { return s + i.qty; }, 0);
            var expiry = (lmRows[0] ? lmRows[0].expiryMonth : '') || (cmRows[0] ? cmRows[0].expiryMonth : '') || '\u2014';
            return '<tr><td>' + product + '</td><td>' + (pack || '\u2014') + '</td><td>' + (code || '\u2014') + '</td><td>' + expiry + '</td><td>' + cm.toLocaleString() + '</td><td>' + formatMonth(snap.lmMonth) + ': ' + lm.toLocaleString() + ' \u2192 ' + formatMonth(snap.cmMonth) + ': ' + cm.toLocaleString() + '</td><td>' + w + '</td></tr>';
        }).join('');
    }
    document.getElementById('drilldown-modal').classList.add('open');
}

function exportCohortFollowup() {
    var c = buildCohort();
    var quote = function (v) { return '"' + String(v === undefined || v === null ? '' : v).trim().replace(/"/g, '""') + '"'; };
    var csv = 'SKU-Level Follow-up Cohort\n' + formatMonth(c.snap.lmMonth) + ' \u226412-month expiry risk vs ' + formatMonth(c.snap.cmMonth) + '\n';
    csv += (c.snap.isFirstMonth ? 'First month on record - no prior-month cohort yet.\n' : '') + '\n';
    csv += 'SKU / Product,Pack Size,Expiry Date,' + formatMonth(c.snap.lmMonth) + ' Qty,' + formatMonth(c.snap.cmMonth) + ' Qty,Net Change,Reduction %,Current Status / Action\n';
    c.rows.forEach(function (d) {
        csv += [d.r.product, d.r.pack || '', d.r.expiry, d.r.lmQty, d.cmQty, (d.net > 0 ? '+' : '') + d.net, d.r.lmQty > 0 ? d.redPct.toFixed(1) + '%' : '', d.statusText].map(quote).join(',') + '\n';
    });
    downloadCSV(csv, 'Cohort_Followup_' + new Date().toISOString().slice(0, 10) + '.csv');
}

function escQuote(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const COUNTRY_LEVEL_TO_BUCKET = { expired: 'expired', critical: 'crit', warning: 'warn', notice: 'notc', distant: 'dist', future: 'futr' };

function renderCountrySummary() {
    var opData = loadOperatorData();
    var items = filterByWarehouse((opData.inventory || []).filter(function (i) { return i.quantity > 0; }));
    var search = ((document.getElementById('country-search') || {}).value || '').trim().toLowerCase();
    var codeData = {};
    items.forEach(function (i) {
        var k = (i.product || '') + '|' + (i.packSize || '');
        codeData[k] = (codeData[k] || '') + ' ' + (i.productionMonth || '');
    });
    var agg = {};
    items.forEach(function (i) {
        var key = (i.product || '') + '|' + (i.packSize || '');
        if (!agg[key]) agg[key] = { product: i.product, pack: i.packSize, agi: (i.product ? getAgiCode(i.product, i.packSize || '') : '') || '', buckets: { expired: 0, crit: 0, warn: 0, notc: 0, dist: 0, futr: 0 }, total: 0, warehouses: {}, nearest: '' };
        var a = agg[key];
        var ml = i.expiryMonth ? monthsUntilExpiry(i.expiryMonth) : null;
        var lvl = (ml !== null && !isNaN(ml)) ? getExpiryLevel(ml) : null;
        var b = COUNTRY_LEVEL_TO_BUCKET[lvl] || 'futr';
        a.buckets[b] += (i.quantity || 0);
        a.total += (i.quantity || 0);
        if (i.warehouse) a.warehouses[i.warehouse] = true;
        if (i.expiryMonth) {
            var e = expiryMonthTs(i.expiryMonth);
            var ne = a.nearest ? expiryMonthTs(a.nearest) : NaN;
            if (isNaN(ne) || (!isNaN(e) && e < ne)) a.nearest = i.expiryMonth;
        }
    });
    var rows = Object.values(agg).filter(function (a) {
        if (!search) return true;
        return (a.product + ' ' + a.pack + ' ' + a.agi).toLowerCase().indexOf(search) !== -1 ||
            (codeData[a.product + '|' + a.pack] || '').toLowerCase().indexOf(search) !== -1;
    });
    rows.sort(function (a, b) {
        if (b.total !== a.total) return b.total - a.total;
        var ea = a.nearest ? expiryMonthTs(a.nearest) : NaN;
        var eb = b.nearest ? expiryMonthTs(b.nearest) : NaN;
        if (isNaN(ea)) return 1;
        if (isNaN(eb)) return -1;
        return ea - eb;
    });
    var body = document.getElementById('tbody-country');
    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted);">' + (items.length === 0 ? 'No inventory recorded yet.' : 'No products match the search.') + '</td></tr>';
        return;
    }
    body.innerHTML = rows.map(function (a) {
        var le12 = a.buckets.crit + a.buckets.warn + a.buckets.notc;
        var critColor = a.buckets.crit > 0 ? ' style="color:#DC2626;font-weight:600;"' : '';
        return '<tr style="cursor:pointer;" onclick="showCountryDetail(\'' + escQuote(a.product) + '\',\'' + escQuote(a.pack || '') + '\')">' +
            '<td>' + a.product + '</td><td>' + (a.pack || '\u2014') + '</td><td>' + (a.agi || '\u2014') + '</td>' +
            '<td style="' + (a.buckets.expired > 0 ? 'color:#DC2626;font-weight:600;' : '') + '">' + a.buckets.expired.toLocaleString() + '</td>' +
            '<td' + critColor + '>' + a.buckets.crit.toLocaleString() + '</td>' +
            '<td>' + a.buckets.warn.toLocaleString() + '</td>' +
            '<td>' + a.buckets.notc.toLocaleString() + '</td>' +
            '<td class="expiry-12m-col">' + le12.toLocaleString() + '</td>' +
            '<td>' + a.buckets.dist.toLocaleString() + '</td>' +
            '<td>' + a.buckets.futr.toLocaleString() + '</td>' +
            '<td><strong>' + a.total.toLocaleString() + '</strong></td></tr>';
    }).join('');
}

function showCountryDetail(product, pack) {
    var opData = loadOperatorData();
    var lots = filterByWarehouse((opData.inventory || []).filter(function (i) { return i.quantity > 0 && i.product === product && i.packSize === pack; }));
    lots.sort(function (a, b) {
        var ea = a.expiryMonth ? expiryMonthTs(a.expiryMonth) : Number.MAX_SAFE_INTEGER;
        var eb = b.expiryMonth ? expiryMonthTs(b.expiryMonth) : Number.MAX_SAFE_INTEGER;
        if (ea !== eb) return ea - eb;
        return String(a.warehouse || '').localeCompare(String(b.warehouse || ''));
    });
    document.getElementById('drilldown-title').textContent = product + (pack ? ' ' + pack : '') + ' \u2014 stock lots';
    var tbody = document.getElementById('tbody-drilldown');
    if (lots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No stock lots for this SKU.</td></tr>';
    } else {
        tbody.innerHTML = lots.map(function (i) {
            var ml = i.expiryMonth ? monthsUntilExpiry(i.expiryMonth) : null;
            var lvl = (ml !== null && !isNaN(ml)) ? getExpiryLevel(ml) : null;
            var badge = lvl ? '<span class="badge ' + ageBadgeClass(COUNTRY_LEVEL_TO_BUCKET[lvl] || 'futr') + '">' + (lvl === 'expired' ? 'EXPIRED' : ml + 'M') + '</span>' : '\u2014';
            return '<tr><td>' + i.product + '</td><td>' + (i.packSize || '\u2014') + '</td><td>' + (i.productionMonth || '\u2014') + '</td><td>' + (i.expiryMonth || '\u2014') + '</td><td>' + (i.quantity || 0).toLocaleString() + '</td><td>' + badge + '</td><td>' + (i.warehouse || '\u2014') + '</td></tr>';
        }).join('');
    }
    document.getElementById('drilldown-modal').classList.add('open');
}

function exportCountrySummary() {
    var opData = loadOperatorData();
    var items = filterByWarehouse((opData.inventory || []).filter(function (i) { return i.quantity > 0; }));
    var agg = {};
    items.forEach(function (i) {
        var key = (i.product || '') + '|' + (i.packSize || '');
        if (!agg[key]) agg[key] = { product: i.product, pack: i.packSize, agi: (i.product ? getAgiCode(i.product, i.packSize || '') : '') || '', buckets: { expired: 0, crit: 0, warn: 0, notc: 0, dist: 0, futr: 0 }, total: 0, warehouses: {}, nearest: '' };
        var a = agg[key];
        var ml = i.expiryMonth ? monthsUntilExpiry(i.expiryMonth) : null;
        var lvl = (ml !== null && !isNaN(ml)) ? getExpiryLevel(ml) : null;
        var b = COUNTRY_LEVEL_TO_BUCKET[lvl] || 'futr';
        a.buckets[b] += (i.quantity || 0);
        a.total += (i.quantity || 0);
        if (i.warehouse) a.warehouses[i.warehouse] = true;
        if (i.expiryMonth) {
            var e = expiryMonthTs(i.expiryMonth);
            var ne = a.nearest ? expiryMonthTs(a.nearest) : NaN;
            if (isNaN(ne) || (!isNaN(e) && e < ne)) a.nearest = i.expiryMonth;
        }
    });
    var quote = function (v) { return '"' + String(v === undefined || v === null ? '' : v).trim().replace(/"/g, '""') + '"'; };
    var csv = 'Country Summary\nGenerated: ' + new Date().toLocaleString() + '\n\n';
    csv += 'Product,Pack,AGI Code,Expired,\u22643mo,4-6mo,7-12mo,\u226412 Month,13-18mo,Future,Total Qty,Warehouses,Nearest Expiry\n';
    Object.values(agg).forEach(function (a) {
        var le12 = a.buckets.crit + a.buckets.warn + a.buckets.notc;
        csv += [a.product, a.pack || '', a.agi || '', a.buckets.expired, a.buckets.crit, a.buckets.warn, a.buckets.notc, le12, a.buckets.dist, a.buckets.futr, a.total, Object.keys(a.warehouses).join('; '), a.nearest || ''].map(quote).join(',') + '\n';
    });
    downloadCSV(csv, 'Country_Summary_' + new Date().toISOString().slice(0, 10) + '.csv');
}

// ==============================
// DRILLDOWN
// ==============================
const DRILLDOWN_LABELS = { expired: 'Expired stock', critical: 'Expiring \u22643mo', warning: 'Expiring 4-6mo', notice: 'Expiring 7-12mo', distant: 'Expiring 13-18mo' };

function showDrilldown(level) {
    const opData = loadOperatorData();
    const data = filterByWarehouse((opData.inventory || []).filter(item => item.expiryMonth).map(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        return { product: item.product, pack: item.packSize, code: item.productionMonth || '', expiry: item.expiryMonth, qty: item.quantity, monthsLeft, level: getExpiryLevel(monthsLeft), warehouse: item.warehouse || '' };
    })).filter(d => d.level === level);

    document.getElementById('drilldown-title').textContent = DRILLDOWN_LABELS[level] + ' (' + data.length + ' items)';
    const tbody = document.getElementById('tbody-drilldown');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);">No items in this category</td></tr>';
    } else {
        tbody.innerHTML = data.map(d => {
            const cls = d.level === 'distant' ? '' : 'row-' + d.level;
            const badgeLabel = d.level === 'expired' ? 'EXPIRED' : d.monthsLeft + 'M';
            const badgeCls = d.level === 'distant' ? 'badge-distant' : 'badge-' + d.level;
            return '<tr class="' + cls + '"><td>' + d.product + '</td><td>' + d.pack + '</td><td>' + d.code + '</td><td>' + d.expiry + '</td><td>' + d.qty + '</td><td><span class="badge ' + badgeCls + '">' + badgeLabel + '</span></td><td>' + (d.warehouse || '\u2014') + '</td></tr>';
        }).join('');
    }

    document.getElementById('drilldown-modal').classList.add('open');
}

function closeDrilldown() {
    document.getElementById('thead-drilldown').innerHTML = '<tr><th>Product</th><th>Pack</th><th>Code</th><th>Expiry</th><th>Qty</th><th>Left</th><th>Warehouse</th></tr>';
    document.getElementById('drilldown-modal').classList.remove('open');
}

// ==============================
// SETTINGS
// ==============================
function populateYearSelects() {
    const yearNow = new Date().getFullYear();
    const expiryStart = document.getElementById('setting-expiry-start');
    const expiryEnd = document.getElementById('setting-expiry-end');
    const prodStart = document.getElementById('setting-prod-start');
    const prodEnd = document.getElementById('setting-prod-end');

    [expiryStart, expiryEnd].forEach(sel => { sel.innerHTML = ''; });
    for (let y = yearNow - 1; y <= yearNow + 10; y++) {
        const o1 = new Option(y, y);
        const o2 = new Option(y, y);
        expiryStart.appendChild(o1);
        expiryEnd.appendChild(o2);
    }
    expiryStart.value = CONFIG.expiryYears.start;
    expiryEnd.value = CONFIG.expiryYears.end;

    [prodStart, prodEnd].forEach(sel => { sel.innerHTML = ''; });
    for (let y = 1; y <= 20; y++) {
        const o1 = new Option(y + ' (' + (2020 + y) + ')', y);
        const o2 = new Option(y + ' (' + (2020 + y) + ')', y);
        prodStart.appendChild(o1);
        prodEnd.appendChild(o2);
    }
    prodStart.value = CONFIG.prodYears.start;
    prodEnd.value = CONFIG.prodYears.end;
}

function updateSettingsPreviews() {
    const sy = parseInt(document.getElementById('setting-expiry-start').value);
    const ey = parseInt(document.getElementById('setting-expiry-end').value);
    const years = [];
    for (let y = sy; y <= ey; y++) years.push(y);
    document.getElementById('expiry-preview').textContent = years.join(', ');

    const ps = parseInt(document.getElementById('setting-prod-start').value);
    const pe = parseInt(document.getElementById('setting-prod-end').value);
    const prodYears = [];
    for (let y = ps; y <= pe; y++) prodYears.push(y + ' (' + (2020 + y) + ')');
    document.getElementById('prod-preview').textContent = prodYears.join(', ');
}

function renderSettings() {
    renderOperatorPinList();
    populateYearSelects();
    updateSettingsPreviews();
    renderWarehouseList();

    document.querySelectorAll('#screen-settings select').forEach(sel => {
        sel.onchange = updateSettingsPreviews;
    });
}

function renderOperatorPinList() {
    const list = document.getElementById('operator-pin-list');
    const whSelect = document.getElementById('new-op-warehouse');
    const scope = sessionScope();
    if (whSelect) {
        var whOpts = scope ? [scope] : CONFIG.warehouses;
        whSelect.innerHTML = whOpts.map(w => '<option value="' + w + '">' + w + '</option>').join('');
        if (scope && whSelect.value !== scope) whSelect.value = scope;
        if (scope) whSelect.disabled = true;
    }
    if (!CONFIG.operatorPins) CONFIG.operatorPins = [];
    // Show every operator so PIN collisions across warehouses stay visible.
    // Reveal/Remove are still scoped to the officer's own warehouse below.
    var visible = CONFIG.operatorPins.map((op, i) => ({ op, i }));
    list.innerHTML = visible.length === 0
        ? '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">No operators configured yet.</div>'
        : visible.map(({ op, i }) =>
            '<div class="settings-wh-row">' +
            '<span class="wh-name">' + op.name + ' \u2014 <code>' + (revealedPins.has(op.pin) ? op.pin : '****') + '</code> \u2014 ' + (op.warehouse || CONFIG.warehouses[0]) + '</span>' +
            '<button class="wh-show" onclick="togglePinVisibility(' + i + ')">' + (revealedPins.has(op.pin) ? 'Hide' : 'Show') + '</button>' +
            '<button class="wh-remove" onclick="removeOperatorPin(' + i + ')">Remove</button>' +
            '</div>'
        ).join('');
}

function togglePinVisibility(i) {
    const op = CONFIG.operatorPins && CONFIG.operatorPins[i];
    if (!op) return;
    // Officers may only reveal operators in their own warehouse.
    const scope = sessionScope();
    if (scope && (op.warehouse || CONFIG.warehouses[0]) !== scope) { alert('You can only reveal PINs for ' + scope + ' operators.'); return; }
    if (revealedPins.has(op.pin)) {
        revealedPins.delete(op.pin);
        renderOperatorPinList();
        return;
    }
    if (!gateCheck('reveal operator PIN')) return;
    revealedPins.add(op.pin);
    renderOperatorPinList();
}

function addOperatorPin() {
    if (!settingsCodeOk('add an operator PIN')) return;
    const nameEl = document.getElementById('new-op-name');
    const pinEl = document.getElementById('new-op-pin');
    const whEl = document.getElementById('new-op-warehouse');
    const name = nameEl.value.trim();
    const pin = pinEl.value.trim();
    const scope = sessionScope();
    // Officers can only add operators to their own warehouse; master can pick.
    const warehouse = scope || (whEl ? whEl.value : CONFIG.warehouses[0]);
    if (!name) { alert('Enter operator name'); return; }
    if (!pin || pin.length < 4 || isNaN(pin)) { alert('Enter a valid 4-digit PIN'); return; }
    if (CONFIG.operatorPins.some(op => op.pin === pin)) { alert('PIN already exists'); return; }
    if (Object.values(WAREHOUSE_PINS).includes(pin)) { alert('This PIN is reserved for warehouse access'); return; }
    if (pin === MASTER_PIN) { alert('This PIN is reserved for admin access'); return; }
    CONFIG.operatorPins.push({ name, pin, warehouse });
    saveConfig(CONFIG);
    nameEl.value = '';
    pinEl.value = '';
    renderOperatorPinList();
}

function removeOperatorPin(idx) {
    if (!settingsCodeOk('remove an operator')) return;
    const op = CONFIG.operatorPins[idx];
    const scope = sessionScope();
    if (scope && op && (op.warehouse || CONFIG.warehouses[0]) !== scope) { alert('You can only remove ' + scope + ' operators.'); return; }
    if (!confirm('Remove operator "' + (op ? op.name : '') + '"?')) return;
    CONFIG.operatorPins.splice(idx, 1);
    saveConfig(CONFIG);
    renderOperatorPinList();
}

function saveExpiryYears() {
    if (!settingsCodeOk('change expiry years')) return;
    const start = parseInt(document.getElementById('setting-expiry-start').value);
    const end = parseInt(document.getElementById('setting-expiry-end').value);
    if (start >= end) { alert('End year must be after start year'); return; }
    CONFIG.expiryYears = { start, end };
    saveConfig(CONFIG);
    document.getElementById('expiry-save-msg').style.display = 'inline';
    setTimeout(() => document.getElementById('expiry-save-msg').style.display = 'none', 2000);
}

function saveProdYears() {
    if (!settingsCodeOk('change production years')) return;
    const start = parseInt(document.getElementById('setting-prod-start').value);
    const end = parseInt(document.getElementById('setting-prod-end').value);
    if (start >= end) { alert('End year must be after start year'); return; }
    CONFIG.prodYears = { start, end };
    saveConfig(CONFIG);
    document.getElementById('prod-save-msg').style.display = 'inline';
    setTimeout(() => document.getElementById('prod-save-msg').style.display = 'none', 2000);
}

function renderWarehouseList() {
    const list = document.getElementById('warehouse-list');
    list.innerHTML = CONFIG.warehouses.map((w, i) =>
        '<div class="settings-wh-row"><span class="wh-name">' + w + '</span>' +
        '<div style="display:flex;gap:6px;">' +
        '<button class="wh-delete-data" onclick="deleteLocalDataForWarehouse(\'' + w.replace(/'/g, "\\'") + '\')">Delete Data</button>' +
        '<button class="wh-remove" onclick="removeWarehouse(' + i + ')">Remove</button></div></div>'
    ).join('');

    var cleanSel = document.getElementById('clean-warehouse-select');
    if (cleanSel) {
        cleanSel.innerHTML = CONFIG.warehouses.map(function (w) {
            return '<option value="' + w + '">' + w + '</option>';
        }).join('');
    }
}

function addWarehouse() {
    if (!settingsCodeOk('add a warehouse')) return;
    const input = document.getElementById('new-warehouse');
    const name = input.value.trim();
    if (!name) return;
    if (CONFIG.warehouses.includes(name)) { alert('Warehouse already exists'); return; }
    CONFIG.warehouses.push(name);
    saveConfig(CONFIG);
    input.value = '';
    renderWarehouseList();
}

function removeWarehouse(idx) {
    if (!settingsCodeOk('remove a warehouse')) return;
    if (CONFIG.warehouses.length <= 1) { alert('Must have at least one warehouse'); return; }
    if (!confirm('Remove "' + CONFIG.warehouses[idx] + '"?')) return;
    CONFIG.warehouses.splice(idx, 1);
    saveConfig(CONFIG);
    renderWarehouseList();
}

function resetConfig() {
    if (!settingsCodeOk('reset settings to defaults')) return;
    if (!confirm('Reset all settings to defaults?')) return;
    localStorage.removeItem('shelf-life-config');
    CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    selectedWarehouses = new Set(CONFIG.warehouses);
    renderSettings();
    rebuildWarehouseChips();
}

// ==============================
// DANGER ZONE: Clear data actions
// ==============================
function clearLocalData() {
    if (!settingsCodeOk('delete local data')) return;
    if (!confirm('Delete ALL local data (inventory, transactions) from this browser? This cannot be undone.')) return;
    if (!confirm('Are you sure? All counting data will be permanently removed from this device.')) return;
    localStorage.removeItem('operator-data');
    document.querySelectorAll('.admin-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-dashboard').classList.add('active');
    renderDashboard();
    filter12M('all', null);
    renderInventory();
    renderActivity('all');
    renderProducts();
    alert('Local data cleared. Note: auto-sync may re-download data from the cloud. Use "Clear Cloud Data" first to fully reset.');
}

function deleteLocalDataForWarehouse(warehouse) {
    if (!gateWarehouse("delete this warehouse's data", warehouse)) return;
    clearLocalDataForWarehouse(warehouse);
}

function clearLocalDataForWarehouse(warehouse) {
    if (!confirm('Delete all local data for "' + warehouse + '"? This cannot be undone.')) return;
    try {
        var raw = localStorage.getItem('operator-data');
        if (!raw) { alert('No local data found.'); return; }
        var data = JSON.parse(raw);
        data.transactions = (data.transactions || []).filter(function(t) { return t.warehouse !== warehouse; });
        data.inventory = (data.inventory || []).filter(function(i) { return i.warehouse !== warehouse; });
        localStorage.setItem('operator-data', JSON.stringify(data));
        renderAll();
        alert('Cleared local data for "' + warehouse + '".');
    } catch (e) {
        alert('Error clearing data: ' + e.message);
    }
}

function clearCloudData() {
    if (!gateMaster('clear all cloud data')) return;
    if (!confirm('Delete ALL data from the cloud? This will clear: transactions, inventory, monthly_snapshots, config.')) return;
    if (!confirm('FINAL WARNING: This removes ALL data from the cloud database. Continue?')) return;

    if (!window.syncManager || !window.syncManager.clearCloud) {
        alert('Cloud not connected. Data may already be cleared, or the app needs a reload.');
        return;
    }

    var btn = document.querySelector('button[onclick*="clearCloudData"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Clearing...'; }

    window.syncManager.clearCloud().then(function() {
        alert('All cloud data cleared successfully! Re-saving config and products.');
        localStorage.removeItem('operator-data');
        saveConfig(CONFIG);
        syncProducts();
    }).catch(function(e) {
        alert('Failed to clear: ' + (e.message || e));
    }).finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'Clear Cloud Data'; }
    });
}

function clearCloudByWarehouse() {
    var sel = document.getElementById('clean-warehouse-select');
    if (!sel || !sel.value) { alert('Select a warehouse first'); return; }
    var warehouse = sel.value;
    if (!gateWarehouse('clear warehouse data', warehouse)) return;
    if (!confirm('Delete ALL cloud data for "' + warehouse + '"? This removes transactions, inventory, and snapshots for this warehouse.')) return;
    if (!confirm('FINAL: Remove all "' + warehouse + '" data from cloud?')) return;

    var btn = document.getElementById('btn-clean-warehouse');
    if (btn) { btn.disabled = true; btn.textContent = 'Clearing...'; }

    window.syncManager.clearByWarehouse(warehouse).then(function(result) {
        alert('Cleared ' + (result && result.cleared ? result.cleared : 0) + ' rows for "' + warehouse + '".');
        clearLocalDataForWarehouse(warehouse);
        if (btn) { btn.disabled = false; btn.textContent = 'Clear Warehouse'; }
    }).catch(function(e) {
        alert('Failed: ' + (e.message || e));
        if (btn) { btn.disabled = false; btn.textContent = 'Clear Warehouse'; }
    });
}

function clearCloudByDateRange() {
    if (!gateMaster('clear date-range data')) return;
    var startEl = document.getElementById('clean-date-start');
    var endEl = document.getElementById('clean-date-end');
    if (!startEl || !endEl || !startEl.value || !endEl.value) { alert('Select start and end dates'); return; }
    var start = startEl.value;
    var end = endEl.value;
    if (new Date(start) > new Date(end)) { alert('Start date must be before end date'); return; }
    if (!confirm('Delete transactions between ' + start + ' and ' + end + '? Inventory will be re-aggregated.')) return;

    var btn = document.getElementById('btn-clean-daterange');
    if (btn) { btn.disabled = true; btn.textContent = 'Clearing...'; }

    window.syncManager.clearByDateRange(start, end).then(function(result) {
        alert('Removed ' + (result && result.transactionsRemoved ? result.transactionsRemoved : 0) + ' transactions in date range.');
        localStorage.removeItem('operator-data');
        if (btn) { btn.disabled = false; btn.textContent = 'Clear Date Range'; }
    }).catch(function(e) {
        alert('Failed: ' + (e.message || e));
        if (btn) { btn.disabled = false; btn.textContent = 'Clear Date Range'; }
    });
}

// ==============================
// OPERATOR STATS
// ==============================
function renderOperatorStats() {
    var el = document.getElementById('operator-stats');
    if (!el) return;
    var opData = loadOperatorData();
    var txs = opData.transactions || [];
    if (txs.length === 0) {
        el.innerHTML = '<div class="empty-state" style="padding:20px;color:var(--text-muted);font-size:13px;">No operator activity yet.</div>';
        return;
    }
    var byOperator = {};
    var today = new Date().toISOString().slice(0, 10);
    txs.forEach(function (tx) {
        var name = tx.operator || 'Unknown';
        if (!byOperator[name]) byOperator[name] = { total: 0, today: 0, lastDate: '' };
        byOperator[name].total += (tx.quantity || 0);
        if (tx.date && tx.date.slice(0, 10) === today) byOperator[name].today += (tx.quantity || 0);
        if (tx.date > byOperator[name].lastDate) byOperator[name].lastDate = tx.date;
    });
    var sorted = Object.entries(byOperator).sort(function (a, b) { return b[1].total - a[1].total; });
    el.innerHTML = '<div class="operator-stats-list">' + sorted.map(function (entry) {
        return '<div class="operator-stat-row">' +
            '<span class="operator-stat-name">' + entry[0] + '</span>' +
            '<span class="operator-stat-count">' + entry[1].total.toLocaleString() + ' items</span>' +
            '<span class="operator-stat-today">' + (entry[1].today > 0 ? entry[1].today + ' today' : '') + '</span>' +
            '</div>';
    }).join('') + '</div>';
}

// ==============================
// DAILY TRENDS
// ==============================
function renderDailyTrends() {
    var el = document.getElementById('chart-daily-trends');
    if (!el || typeof Chart === 'undefined') return;
    var opData = loadOperatorData();
    var txs = opData.transactions || [];
    if (txs.length === 0) {
        el.innerHTML = '<div class="empty-state" style="padding:20px;color:var(--text-muted);font-size:13px;">No activity data yet.</div>';
        return;
    }
    var byDay = {};
    txs.forEach(function (tx) {
        var day = (tx.date || '').slice(0, 10);
        if (!day) return;
        if (!byDay[day]) byDay[day] = 0;
        byDay[day] += (tx.quantity || 0);
    });
    var days = Object.keys(byDay).sort();
    if (days.length > 30) days = days.slice(-30);
    if (dashboardCharts.dailyTrends) dashboardCharts.dailyTrends.destroy();
    el.innerHTML = '<canvas id="chart-daily-trends-canvas"></canvas>';
    dashboardCharts.dailyTrends = new Chart(document.getElementById('chart-daily-trends-canvas'), {
        type: 'bar',
        data: {
            labels: days.map(function (d) { return d.slice(5); }),
            datasets: [{
                label: 'Items Counted',
                data: days.map(function (d) { return byDay[d]; }),
                backgroundColor: '#00843D',
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Daily Counting Activity (last 30 days)', font: { size: 13, weight: '600' }, padding: { bottom: 12 } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { ticks: { maxRotation: 45, font: { size: 10 } } }
            }
        }
    });
}

// ==============================
// INIT
// ==============================
function renderAll() {
    CONFIG = loadConfig();
    selectedWarehouses = new Set(CONFIG.warehouses);
    rebuildWarehouseChips();
    renderDashboard();
    filter12M('all', null);
    renderInventory();
    renderActivityWarehouseChips();
    renderActivity('all');
    renderCountrySummary();
    renderProducts();
    renderSettings();
    updateClock();
    setInterval(updateClock, 60000);
}

function initApp() {
    renderAll(); // Show localStorage data immediately before async pull
    renderSyncStatus();
    if (window.syncManager) {
        window.syncManager.init();
        // Ping first to verify Apps Script is reachable
        window.syncManager.ping().then(function (result) {
            if (result && result.ok) {
                console.log('Apps Script ping OK:', result.time);
            } else {
                console.error('Apps Script ping failed — GET endpoint may be unreachable');
            }
            // Pull + merge first so a stale local copy can't wipe newer cloud operators
            return window.syncManager.pullConfig ? window.syncManager.pullConfig() : Promise.resolve();
        }).then(function() {
            // Reload merged config, then re-push to fix any corrupted rows
            CONFIG = loadConfig();
            normalizeWarehouses();
            if (window.syncManager.pullAll) {
                return window.syncManager.pullAll().then(function() {
                    renderAll();
                    renderSyncStatus();
                    startAutoRefresh();
                });
            }
            renderAll();
            renderSyncStatus();
            startAutoRefresh();
        });
    } else {
        renderAll();
    }
}

var _refreshInterval = null;
function startAutoRefresh() {
    if (_refreshInterval) clearInterval(_refreshInterval);
    _refreshInterval = setInterval(function() {
        if (window.syncManager && window.syncManager.pullAll) {
            window.syncManager.pullAll().then(function() {
                refreshCurrentScreen();
                renderSyncStatus();
            });
        }
    }, 15000);
}

function manualRefresh() {
    if (window.syncManager && window.syncManager.pullAll) {
        window.syncManager.pullAll().then(function() {
            refreshCurrentScreen();
            renderSyncStatus();
        });
    }
}

// Close modal on overlay click
document.getElementById('product-modal').addEventListener('click', function(e) {
    if (e.target === this) closeProductModal();
});
document.getElementById('drilldown-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDrilldown();
});
document.getElementById('edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

// Initialize sync manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.syncManager) {
        window.syncManager.init();
        window.syncManager.onSync(() => {
            if (document.getElementById('screen-dashboard').classList.contains('active')) renderDashboard();
            if (document.getElementById('screen-12m').classList.contains('active')) render12M();
            if (document.getElementById('screen-inventory').classList.contains('active')) renderInventory();
            if (document.getElementById('screen-activity').classList.contains('active')) { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
            if (document.getElementById('screen-monthly').classList.contains('active')) renderMonthlyReport();
            if (document.getElementById('screen-country').classList.contains('active')) renderCountrySummary();
            renderSyncStatus();
        });
    }
    // Update sync status "Xs ago" every 10s
    setInterval(renderSyncStatus, 10000);
});

// Auto-refresh when operator saves data in another tab
window.addEventListener('storage', function(e) {
    if (e.key === 'operator-data') {
        if (document.getElementById('screen-dashboard').classList.contains('active')) renderDashboard();
        if (document.getElementById('screen-12m').classList.contains('active')) render12M();
        if (document.getElementById('screen-inventory').classList.contains('active')) renderInventory();
        if (document.getElementById('screen-activity').classList.contains('active')) { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
        if (document.getElementById('screen-monthly').classList.contains('active')) renderMonthlyReport();
        if (document.getElementById('screen-country').classList.contains('active')) renderCountrySummary();
        renderSyncStatus();
    }
});

// Initialize app (gated by password)
if (checkAdminAuth()) {
    initApp();
}