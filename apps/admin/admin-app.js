// ==============================
// PASSWORD GATE
// ==============================
const ADMIN_PASSWORD = '9876';
const revealedPins = new Set();

function checkAdminAuth() {
    const authed = sessionStorage.getItem('admin-authenticated');
    if (authed === 'true') {
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) overlay.style.display = 'none';
        return true;
    }
    const overlay = document.getElementById('admin-login-overlay');
    if (overlay) overlay.style.display = 'flex';
    return false;
}

function adminLogin() {
    const input = document.getElementById('admin-login-pin');
    const error = document.getElementById('admin-login-error');
    if (input && input.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin-authenticated', 'true');
        document.getElementById('admin-login-overlay').style.display = 'none';
        initApp();
    } else {
        if (error) {
            error.style.display = 'block';
            error.textContent = 'Incorrect password';
        }
        if (input) input.value = '';
    }
}

// ==============================
// SETTINGS CHANGE GATE (Head of Customer Service only)
// ==============================
const SETTINGS_CODE = '9504';

function settingsCodeOk(action) {
    const code = prompt('Enter settings code to ' + action + ':');
    if (code === SETTINGS_CODE) return true;
    if (code !== null) alert('Incorrect code.');
    return false;
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
function monthsUntilExpiry(expiryStr) {
    var now = new Date();
    var expiry;
    if (typeof expiryStr === 'string' && expiryStr.indexOf(' ') > -1) {
        var parts = expiryStr.split(' ');
        var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        expiry = new Date(parseInt(parts[1]), monthNames.indexOf(parts[0]), 1);
    } else {
        expiry = new Date(expiryStr);
    }
    if (isNaN(expiry.getTime())) return NaN;
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
    if (isActiveScreen('screen-12m')) render12M(currentFilter);
    if (isActiveScreen('screen-monthly')) renderMonthlyReport();
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

    const titles = { 'screen-dashboard': 'Dashboard', 'screen-12m': 'Shelf Life Report', 'screen-monthly': 'Monthly Report', 'screen-inventory': 'Inventory', 'screen-activity': 'Activity Log', 'screen-products': 'Products', 'screen-settings': 'Settings' };
    document.getElementById('page-title').textContent = titles[id] || 'Dashboard';

    if (id === 'screen-dashboard') renderDashboard();
    if (id === 'screen-activity') { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
    if (id === 'screen-inventory') renderInventory();
    if (id === 'screen-12m') render12M(currentFilter || 'all');
    if (id === 'screen-monthly') renderMonthlyReport();
    if (id === 'screen-products') renderProducts();

    var filterBar = document.getElementById('warehouse-filter-bar');
    if (filterBar) filterBar.style.display = (id === 'screen-products') ? 'none' : '';
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
let currentFilter = 'all';
let currentInvFilter = 'all';

function render12M(filter) {
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

    if (filter !== 'all') {
        expiryItems = expiryItems.filter(d => d.level === filter);
    }

    expiryItems.sort((a, b) => a.monthsLeft - b.monthsLeft);
    document.getElementById('filter-count').textContent = 'Showing ' + expiryItems.length + ' items';

    if (expiryItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' +
            (filter === 'all' ? 'No inventory data yet. Start counting from the operator app.' : 'No items match this filter.') +
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

function filter12M(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('#screen-12m .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    render12M(filter);
}

function filterInventory(filter, btn) {
    currentInvFilter = filter;
    document.querySelectorAll('#screen-inventory .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderInventory(filter);
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
// INVENTORY TABLE
// ==============================
function renderInventory(filter) {
    const effFilter = filter || currentInvFilter;
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
            qty: item.quantity,
            warehouse: item.warehouse || '',
            monthsLeft: ml,
            level: ml !== null ? getExpiryLevel(ml) : null
        };
    }));

    if (search) {
        data = data.filter(d => d.product.toLowerCase().includes(search) || d.code.toLowerCase().includes(search));
    }

    if (effFilter !== 'all') {
        data = data.filter(d => d.level === effFilter);
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

    const highlighted = new Set();
    Object.values(groups).forEach(group => {
        let runningMin = group[group.length - 1].qty
        for (let i = group.length - 2; i >= 0; i--) {
            if (group[i].qty > runningMin) {
                highlighted.add(group[i].product + '|' + group[i].pack + '|' + group[i].prodMonth);
            }
            runningMin = Math.min(runningMin, group[i].qty)
        }
    });

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">' +
            (search ? 'No results found' : (effFilter !== 'all' ? 'No items match this filter.' : 'No inventory data yet. Start counting from the operator app.')) +
            '</td></tr>';
        return;
    }

    let html = '';
    for (const key in groups) {
        const items = groups[key];
        const first = items[0];
        html += '<tr style="background:var(--table-header)"><td colspan="8" style="padding:10px 16px;font-weight:600;font-size:14px;">' + first.product + ' ' + first.pack + '</td></tr>';
        items.forEach(d => {
            const fefoClass = highlighted.has(d.product + '|' + d.pack + '|' + d.prodMonth) ? ' style="background:#FEF3C7;"' : '';
            var mlDisplay = d.monthsLeft !== null ? '<span class="badge badge-' + (d.level === 'distant' ? 'distant' : d.level) + '">' + (d.level === 'expired' ? 'EXPIRED' : d.monthsLeft + 'M') + '</span>' : '\u2014';
            html += '<tr' + fefoClass + '><td>' + d.product + '</td><td>' + d.pack + '</td><td>' + (d.prefix || '\u2014') + '</td><td>' + (d.code || '\u2014') + '</td><td>' + d.prodMonth + '</td><td>' + mlDisplay + '</td><td>' + d.qty + '</td><td>' + (d.warehouse || '\u2014') + '</td></tr>';
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

    tbody.innerHTML = data.map((d, i) => {
        const originalIndex = PRODUCTS.indexOf(d);
        return '<tr><td><span class="badge badge-green">' + (d.prefix || '\u2014') + '</span></td><td>' + d.name + '</td><td>' + (d.pack || '\u2014') + '</td><td>' + (getAgiCode(d.name, d.pack) || '\u2014') + '</td><td><button class="action-btn" onclick="editProduct(' + originalIndex + ')">Edit</button> <button class="action-btn danger" onclick="deleteProduct(' + originalIndex + ')">Delete</button></td></tr>';
    }).join('');
}

function openProductModal(idx) {
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

function exportExcel() { exportCsv(currentFilter, 'Expiry_Report_'); }
function exportDashboard() { exportCsv(null, 'Dashboard_Expiry_'); }
function exportCsv(filter, prefix) {
    const opData = loadOperatorData();
    let data = filterByWarehouse((opData.inventory || []).filter(item => item.expiryMonth)).map(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        return { product: item.product, pack: item.packSize, code: item.productionMonth || '', expiry: item.expiryMonth, qty: item.quantity, monthsLeft, level: getExpiryLevel(monthsLeft), range: monthsLeft <= 12 ? '12m' : '18m', warehouse: item.warehouse || '' };
    });
    if (filter && filter !== 'all') data = data.filter(d => d.level === filter);
    let csv = 'Product,Pack,Code,Expiry,Qty,Months Left,Level,Range,Warehouse\n';
    data.forEach(d => { csv += d.product + ',' + d.pack + ',' + d.code + ',' + d.expiry + ',' + d.qty + ',' + d.monthsLeft + ',' + d.level + ',' + d.range + ',' + d.warehouse + '\n'; });
    downloadCSV(csv, prefix + new Date().toISOString().slice(0, 10) + '.csv');
}

function exportInventory() {
    const opData = loadOperatorData();
    const search = (document.getElementById('inv-search').value || '').toLowerCase();
    let data = filterByWarehouse(opData.inventory || []).map(item => ({
        product: item.product, pack: item.packSize, prefix: (PRODUCTS.find(p => p.name === item.product && p.pack === item.packSize) || {}).prefix || '', code: item.productionMonth || '', prodMonth: item.productionMonth || '', qty: item.quantity, warehouse: item.warehouse || ''
    }));
    if (search) data = data.filter(d => d.product.toLowerCase().includes(search));
    let csv = 'Product,Pack,Prefix,Code,Prod Month,Qty,Warehouse\n';
    data.forEach(d => { csv += d.product + ',' + d.pack + ',' + d.prefix + ',' + d.code + ',' + d.prodMonth + ',' + d.qty + ',' + d.warehouse + '\n'; });
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
// MONTHLY REPORT
// ==============================

function formatMonth(ym) {
    if (!ym) return '\u2014';
    var d = new Date(ym + '-01');
    if (isNaN(d.getTime())) return '\u2014';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getFullYear();
}

function initMonthlyReportDropdowns(availableMonths) {
    var startSel = document.getElementById('monthly-start');
    var endSel = document.getElementById('monthly-end');
    if (!startSel || !endSel || !availableMonths || availableMonths.length === 0) return;
    var currentOpts = Array.from(startSel.options).map(function (o) { return o.value; }).join(',');
    var newOpts = availableMonths.join(',');
    if (currentOpts === newOpts) return;
    startSel.innerHTML = availableMonths.map(function (m) {
        return '<option value="' + m + '">' + formatMonth(m) + '</option>';
    }).join('');
    endSel.innerHTML = availableMonths.map(function (m) {
        return '<option value="' + m + '">' + formatMonth(m) + '</option>';
    }).join('');
    if (availableMonths.length >= 2) {
        startSel.value = availableMonths[availableMonths.length - 2];
        endSel.value = availableMonths[availableMonths.length - 1];
    } else if (availableMonths.length === 1) {
        startSel.value = availableMonths[0];
        endSel.value = availableMonths[0];
    }
}

function indexByProduct(rows) {
    var idx = {};
    (rows || []).forEach(function (r) {
        var key = (r.product || '') + '|' + (r.pack_size || '') + '|' + (r.production_month || '');
        idx[key] = (idx[key] || 0) + (r.quantity || 0);
    });
    return idx;
}

function renderMonthlyReport() {
    var currentMonthEl = document.getElementById('monthly-current-month');
    if (currentMonthEl) currentMonthEl.textContent = 'Report: Month-over-Month Comparison';
    if (typeof syncManager === 'undefined' || !syncManager.getMonthlySnapshots) { showNoData(); return; }
    syncManager.getMonthlySnapshots().then(function (snapshots) {
        snapshots = snapshots || [];
        snapshots = filterByWarehouse(snapshots);
        var monthSet = {};
        snapshots.forEach(function (s) { monthSet[s.snapshot_month] = true; });
        var availableMonths = Object.keys(monthSet).sort();
        if (availableMonths.length === 0) { showNoData(); return; }
        initMonthlyReportDropdowns(availableMonths);
        var startSel = document.getElementById('monthly-start');
        var endSel = document.getElementById('monthly-end');
        var lmMonth = startSel ? startSel.value : availableMonths[0];
        var cmMonth = endSel ? endSel.value : availableMonths[availableMonths.length - 1];
        if (lmMonth === cmMonth) {
            renderSingleMonth(snapshots, lmMonth);
        } else {
            renderComparison(snapshots, lmMonth, cmMonth);
        }
    });
}

function showNoData() {
    setText('kpi-lm-total', '--');
    setText('kpi-lm-month', '');
    setText('kpi-cm-total', '--');
    setText('kpi-cm-month', '');
    setText('kpi-expired', '--');
    setText('kpi-expired-month', '');
    setText('kpi-short-total', '--');
    setText('kpi-medium-total', '--');
    var deltaEl = document.getElementById('kpi-mom-change');
    if (deltaEl) {
        var dv = deltaEl.querySelector('.delta-value');
        if (dv) dv.textContent = '--';
        var dl = deltaEl.querySelector('.delta-label');
        if (dl) dl.textContent = 'Change';
    }
    ['bucket-expired-body','bucket-short-body','bucket-medium-body'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">No snapshot data. Click "Capture Snapshot" to record inventory.</td></tr>';
    });
}

function renderSingleMonth(snapshots, month) {
    var monthSnaps = snapshots.filter(function (s) { return s.snapshot_month === month; });
    var expired = monthSnaps.filter(function (s) { return (s.age_months || 0) >= 12; });
    var short = monthSnaps.filter(function (s) { return (s.age_months || 0) >= 6 && (s.age_months || 0) < 12; });
    var medium = monthSnaps.filter(function (s) { return (s.age_months || 0) >= 0 && (s.age_months || 0) < 6; });
    updateKPIs_SingleMonth(monthSnaps, expired, short, medium, month);
    renderBucket_SingleMonth(expired, 'bucket-expired-body');
    renderBucket_SingleMonth(short, 'bucket-short-body');
    renderBucket_SingleMonth(medium, 'bucket-medium-body');
}

function renderComparison(snapshots, lmMonth, cmMonth) {
    var lmSnaps = snapshots.filter(function (s) { return s.snapshot_month === lmMonth; });
    var cmSnaps = snapshots.filter(function (s) { return s.snapshot_month === cmMonth; });
    var lmExpired = lmSnaps.filter(function (s) { return (s.age_months || 0) >= 12; });
    var lmShort = lmSnaps.filter(function (s) { return (s.age_months || 0) >= 6 && (s.age_months || 0) < 12; });
    var lmMedium = lmSnaps.filter(function (s) { return (s.age_months || 0) >= 0 && (s.age_months || 0) < 6; });
    var cmExpired = cmSnaps.filter(function (s) { return (s.age_months || 0) >= 12; });
    var cmShort = cmSnaps.filter(function (s) { return (s.age_months || 0) >= 6 && (s.age_months || 0) < 12; });
    var cmMedium = cmSnaps.filter(function (s) { return (s.age_months || 0) >= 0 && (s.age_months || 0) < 6; });
    updateKPIs_Comparison(lmSnaps, cmSnaps, lmExpired, cmExpired, lmShort, cmShort, lmMedium, cmMedium, lmMonth, cmMonth);
    renderBucket_Comparison(lmExpired, cmExpired, 'bucket-expired-body');
    renderBucket_Comparison(lmShort, cmShort, 'bucket-short-body');
    renderBucket_Comparison(lmMedium, cmMedium, 'bucket-medium-body');
}

function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateKPIs_SingleMonth(allSnaps, expired, short, medium, month) {
    var total = allSnaps.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var shortQty = short.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var medQty = medium.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var expQty = expired.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    setText('kpi-lm-total', '--');
    setText('kpi-lm-month', '');
    setText('kpi-cm-total', total.toLocaleString());
    setText('kpi-cm-month', formatMonth(month));
    var deltaEl = document.getElementById('kpi-mom-change');
    if (deltaEl) {
        var dv = deltaEl.querySelector('.delta-value');
        if (dv) { dv.textContent = 'Single Month'; dv.style.color = ''; }
        var dl = deltaEl.querySelector('.delta-label');
        if (dl) dl.textContent = 'Mode';
    }
    setText('kpi-expired', expQty.toLocaleString());
    setText('kpi-expired-month', '');
    setText('kpi-short-total', shortQty.toLocaleString());
    setText('kpi-medium-total', medQty.toLocaleString());
}

function updateKPIs_Comparison(lmSnaps, cmSnaps, lmExp, cmExp, lmShort, cmShort, lmMed, cmMed, lmMonth, cmMonth) {
    var lmTotal = lmSnaps.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var cmTotal = cmSnaps.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var diff = cmTotal - lmTotal;
    var pct = lmTotal > 0 ? ((diff / lmTotal) * 100) : 0;
    setText('kpi-lm-total', lmTotal.toLocaleString());
    setText('kpi-lm-month', formatMonth(lmMonth));
    setText('kpi-cm-total', cmTotal.toLocaleString());
    setText('kpi-cm-month', formatMonth(cmMonth));
    var deltaEl = document.getElementById('kpi-mom-change');
    if (deltaEl) {
        var dv = deltaEl.querySelector('.delta-value');
        if (dv) {
            var sign = diff >= 0 ? '+' : '';
            dv.textContent = sign + diff.toLocaleString() + ' (' + sign + pct.toFixed(1) + '%)';
            dv.style.color = diff <= 0 ? '#16A34A' : '#DC2626';
        }
        var dl = deltaEl.querySelector('.delta-label');
        if (dl) dl.textContent = diff <= 0 ? 'Reduction' : 'Increase';
    }
    var expLM = lmExp.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var expCM = cmExp.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
    var expStr = expLM.toLocaleString() + ' \u2192 ' + expCM.toLocaleString();
    if (expCM !== expLM) {
        var expDiff = expCM - expLM;
        expStr += ' (' + (expDiff >= 0 ? '+' : '') + expDiff.toLocaleString() + ')';
    }
    setText('kpi-expired', expStr);
    setText('kpi-expired-month', '');
    setText('kpi-short-total', lmShort.reduce(function (s, r) { return s + (r.quantity || 0); }, 0).toLocaleString() + ' \u2192 ' + cmShort.reduce(function (s, r) { return s + (r.quantity || 0); }, 0).toLocaleString());
    setText('kpi-medium-total', lmMed.reduce(function (s, r) { return s + (r.quantity || 0); }, 0).toLocaleString() + ' \u2192 ' + cmMed.reduce(function (s, r) { return s + (r.quantity || 0); }, 0).toLocaleString());
}

function renderBucket_Comparison(lmRows, cmRows, bodyId) {
    var body = document.getElementById(bodyId);
    if (!body) return;
    var lmIdx = indexByProduct(lmRows);
    var cmIdx = indexByProduct(cmRows);
    var allKeys = {};
    Object.keys(lmIdx).forEach(function (k) { allKeys[k] = true; });
    Object.keys(cmIdx).forEach(function (k) { allKeys[k] = true; });
    var keys = Object.keys(allKeys);
    if (keys.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">No stock in this bucket.</td></tr>';
        return;
    }
    var items = keys.map(function (key) {
        var parts = key.split('|');
        var lmQty = lmIdx[key] || 0;
        var cmQty = cmIdx[key] || 0;
        var delta = cmQty - lmQty;
        var deltaPct = lmQty > 0 ? ((delta / lmQty) * 100).toFixed(1) : (cmQty > 0 ? 'new' : '0.0');
        return { product: parts[0] || '', packSize: parts[1] || '', lmQty: lmQty, cmQty: cmQty, delta: delta, deltaPct: deltaPct };
    });
    items.sort(function (a, b) { return b.cmQty - a.cmQty; });
    var lmTotal = 0, cmTotal = 0;
    body.innerHTML = items.map(function (r) {
        lmTotal += r.lmQty; cmTotal += r.cmQty;
        var cls = r.delta > 0 ? 'movement-up' : (r.delta < 0 ? 'movement-down' : '');
        var dsp = '';
        if (r.deltaPct === 'new') dsp = 'New';
        else if (r.deltaPct === '0.0') dsp = '\u2014';
        else dsp = (r.delta > 0 ? '+' : '') + r.deltaPct + '%';
        var displayName = r.product ? r.product + ' ' + r.packSize : r.packSize;
        return '<tr><td>' + displayName + '</td><td>' + r.lmQty.toLocaleString() +
            '</td><td>' + r.cmQty.toLocaleString() + '</td><td class="' + cls + '">' + (r.delta > 0 ? '+' : '') +
            r.delta.toLocaleString() + '</td><td class="' + cls + '">' + dsp + '</td></tr>';
    }).join('') +
    '<tr class="total-row"><td><strong>Total</strong></td><td><strong>' + lmTotal.toLocaleString() +
    '</strong></td><td><strong>' + cmTotal.toLocaleString() + '</strong></td><td><strong>' +
    (cmTotal - lmTotal > 0 ? '+' : '') + (cmTotal - lmTotal).toLocaleString() + '</strong></td><td><strong>' +
    (lmTotal > 0 ? ((cmTotal - lmTotal) / lmTotal * 100).toFixed(1) + '%' : '\u2014') + '</strong></td></tr>';
}

function renderBucket_SingleMonth(rows, bodyId) {
    var body = document.getElementById(bodyId);
    if (!body) return;
    var idx = indexByProduct(rows);
    var keys = Object.keys(idx);
    if (keys.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">No stock in this bucket.</td></tr>';
        return;
    }
    var items = keys.map(function (k) {
        var parts = k.split('|');
        return { product: parts[0] || '', packSize: parts[1] || '', qty: idx[k] };
    });
    items.sort(function (a, b) { return b.qty - a.qty; });
    var total = 0;
    body.innerHTML = items.map(function (r) {
        total += r.qty;
        var displayName = r.product ? r.product + ' ' + r.packSize : r.packSize;
        return '<tr><td>' + displayName + '</td><td>\u2014</td><td>' +
            r.qty.toLocaleString() + '</td><td>\u2014</td><td>\u2014</td></tr>';
    }).join('') +
    '<tr class="total-row"><td><strong>Total</strong></td><td></td><td><strong>' +
    total.toLocaleString() + '</strong></td><td></td><td></td></tr>';
}

function exportMonthlyReport() {
    var sections = [
        { name: 'Expired Stock', bodyId: 'bucket-expired-body' },
        { name: '\u22646 Months', bodyId: 'bucket-short-body' },
        { name: '7-12 Months', bodyId: 'bucket-medium-body' }
    ];
    var csv = 'Monthly Report: MoM Comparison\nGenerated: ' + new Date().toLocaleString() + '\n\n';
    sections.forEach(function (sec) {
        csv += '### ' + sec.name + '\nProduct,LM Qty,CM Qty,Delta,Delta%\n';
        var body = document.getElementById(sec.bodyId);
        if (body) {
            body.querySelectorAll('tr').forEach(function (tr) {
                var cells = tr.querySelectorAll('td');
                if (cells.length >= 5) {
                    csv += Array.from(cells).map(function (c) {
                        return '"' + c.textContent.trim().replace(/"/g, '""') + '"';
                    }).join(',') + '\n';
                }
            });
        }
        csv += '\n';
    });
    downloadCSV(csv, 'Monthly_Report_' + new Date().toISOString().slice(0, 10) + '.csv');
}

(function initBucketTabs() {
    document.addEventListener('click', function (e) {
        var tab = e.target.closest('.bucket-tab');
        if (!tab) return;
        document.querySelectorAll('.bucket-tab').forEach(function (b) { b.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.bucket-section').forEach(function (s) { s.style.display = 'none'; });
        var target = document.getElementById('bucket-' + tab.dataset.bucket);
        if (target) target.style.display = '';
    });
})();

function captureMonthlySnapshot() {
    if (typeof syncManager === 'undefined' || !syncManager.saveSnapshot) {
        alert('Sync manager not available');
        return;
    }
    var opData = loadOperatorData();
    var inventory = opData.inventory || [];
    if (inventory.length === 0) {
        alert('No inventory data to snapshot');
        return;
    }
    var now = new Date();
    var snapshotMonth = now.toISOString().slice(0, 7);
    var warehouse = document.getElementById('settings-warehouse-select') ? document.getElementById('settings-warehouse-select').value : (opData.meta ? opData.meta.warehouse : '');
    var rows = [];
    var agg = {};
    inventory.filter(i => i.quantity > 0).forEach(item => {
        var key = (item.product || '') + '|' + item.packSize + '|' + (item.productionMonth || '');
        if (!agg[key]) agg[key] = { product: item.product || '', packSize: item.packSize, productionMonth: item.productionMonth || '', quantity: 0 };
        agg[key].quantity += (item.quantity || 0);
    });
    Object.values(agg).forEach(item => {
        var ageMonths = 0;
        if (item.productionMonth) {
            var prodDate = new Date(item.productionMonth + '-01');
            ageMonths = (now.getFullYear() - prodDate.getFullYear()) * 12 + (now.getMonth() - prodDate.getMonth());
        }
        var expiryMonth = '';
        if (item.productionMonth) {
            var prodParts = item.productionMonth.split('-');
            var expYear = parseInt(prodParts[0]) + 2;
            expiryMonth = expYear + '-' + prodParts[1];
        }
        rows.push({
            snapshot_month: snapshotMonth,
            product: item.product,
            pack_size: item.packSize,
            production_month: item.productionMonth,
            expiry_month: expiryMonth,
            warehouse: warehouse,
            quantity: item.quantity,
            age_months: ageMonths
        });
    });
    syncManager.saveSnapshot(rows).then(function () {
        var msg = document.getElementById('monthly-snapshot-msg');
        if (msg) {
            msg.style.display = 'inline';
            setTimeout(function () { msg.style.display = 'none'; }, 2000);
        }
        renderMonthlyReport();
    });
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
    if (whSelect) {
        whSelect.innerHTML = CONFIG.warehouses.map(w => '<option value="' + w + '">' + w + '</option>').join('');
    }
    if (!CONFIG.operatorPins) CONFIG.operatorPins = [];
    list.innerHTML = CONFIG.operatorPins.length === 0
        ? '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">No operators configured. Add one below to enable login.</div>'
        : CONFIG.operatorPins.map((op, i) =>
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
    if (revealedPins.has(op.pin)) {
        revealedPins.delete(op.pin);
        renderOperatorPinList();
        return;
    }
    const p = prompt('Enter admin password to reveal operator PIN');
    if (p === null) return;
    if (p === ADMIN_PASSWORD) {
        revealedPins.add(op.pin);
        renderOperatorPinList();
    } else {
        alert('Incorrect password.');
    }
}

function addOperatorPin() {
    if (!settingsCodeOk('add an operator PIN')) return;
    const nameEl = document.getElementById('new-op-name');
    const pinEl = document.getElementById('new-op-pin');
    const whEl = document.getElementById('new-op-warehouse');
    const name = nameEl.value.trim();
    const pin = pinEl.value.trim();
    const warehouse = whEl ? whEl.value : CONFIG.warehouses[0];
    if (!name) { alert('Enter operator name'); return; }
    if (!pin || pin.length < 4 || isNaN(pin)) { alert('Enter a valid 4-digit PIN'); return; }
    if (CONFIG.operatorPins.some(op => op.pin === pin)) { alert('PIN already exists'); return; }
    CONFIG.operatorPins.push({ name, pin, warehouse });
    saveConfig(CONFIG);
    nameEl.value = '';
    pinEl.value = '';
    renderOperatorPinList();
}

function removeOperatorPin(idx) {
    if (!settingsCodeOk('remove an operator')) return;
    if (!confirm('Remove operator "' + CONFIG.operatorPins[idx].name + '"?')) return;
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
    render12M('all');
    renderInventory();
    renderActivity('all');
    renderProducts();
    alert('Local data cleared. Note: auto-sync may re-download data from the cloud. Use "Clear Cloud Data" first to fully reset.');
}

function deleteLocalDataForWarehouse(warehouse) {
    if (!settingsCodeOk("delete this warehouse's data")) return;
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
    if (!settingsCodeOk('clear all cloud data')) return;
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
    if (!settingsCodeOk('clear warehouse data')) return;
    var sel = document.getElementById('clean-warehouse-select');
    if (!sel || !sel.value) { alert('Select a warehouse first'); return; }
    var warehouse = sel.value;
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
    if (!settingsCodeOk('clear date-range data')) return;
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
    render12M('all');
    renderInventory();
    renderActivityWarehouseChips();
    renderActivity('all');
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
            saveConfig(CONFIG);
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

// Initialize sync manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.syncManager) {
        window.syncManager.init();
        window.syncManager.onSync(() => {
            if (document.getElementById('screen-dashboard').classList.contains('active')) renderDashboard();
            if (document.getElementById('screen-12m').classList.contains('active')) render12M(currentFilter);
            if (document.getElementById('screen-inventory').classList.contains('active')) renderInventory();
            if (document.getElementById('screen-activity').classList.contains('active')) { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
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
        if (document.getElementById('screen-12m').classList.contains('active')) render12M(currentFilter);
        if (document.getElementById('screen-inventory').classList.contains('active')) renderInventory();
        if (document.getElementById('screen-activity').classList.contains('active')) { renderActivityWarehouseChips(); renderActivity(currentActivityFilter); }
        renderSyncStatus();
    }
});

// Initialize app (gated by password)
if (checkAdminAuth()) {
    initApp();
}