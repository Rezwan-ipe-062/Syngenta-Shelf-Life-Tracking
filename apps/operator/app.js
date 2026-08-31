// app.js — Operator core logic
var state = {
    pin: '',
    operatorName: '',
    warehouse: '',
    currentScreen: 'login',
    selectedProduct: null,
    selectedPackSize: null,
    selectedYear: null,
    selectedMonth: null,
    selectedExpiryYear: null,
    selectedExpiryMonth: null,
    quantity: 0,
    inventory: [],
    transactions: []
};

var DEFAULT_CONFIG = {
    operatorPins: [{ name: 'Default', pin: '1234', warehouse: 'Chittagong' }],
    expiryYears: { start: 2025, end: 2030 },
    prodYears: { start: 5, end: 6 },
    warehouses: ['Chittagong', 'Gazipur', 'Jessore', 'Bogura']
};

function getConfig() {
    try {
        var saved = localStorage.getItem('shelf-life-config');
        if (saved) {
            var base = JSON.parse(saved);
            return {
                operatorPins: base.operatorPins || DEFAULT_CONFIG.operatorPins,
                expiryYears: base.expiryYears || DEFAULT_CONFIG.expiryYears,
                prodYears: base.prodYears || DEFAULT_CONFIG.prodYears,
                warehouses: base.warehouses || DEFAULT_CONFIG.warehouses
            };
        }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

// ==================== NAVIGATION ====================

var screens = {
    login: document.getElementById('screen-login'),
    products: document.getElementById('screen-products'),
    count: document.getElementById('screen-count'),
    confirm: document.getElementById('screen-confirm'),
    inventory: document.getElementById('screen-inventory'),
    'twelve-month': document.getElementById('screen-twelve-month')
};

function showScreen(name) {
    Object.values(screens).forEach(function (s) { s.classList.remove('active'); });
    screens[name].classList.add('active');
    state.currentScreen = name;
    var bottomNav = document.getElementById('bottom-nav');
    var withNav = ['products', 'inventory', 'twelve-month'];
    if (withNav.indexOf(name) !== -1) {
        bottomNav.style.display = 'flex';
        document.querySelectorAll('.nav-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.screen === name);
        });
    } else {
        bottomNav.style.display = 'none';
    }
    if (name === 'inventory') renderInventoryList();
    if (name === 'twelve-month') render12MonthList();
}

// ==================== PIN LOGIN ====================

function initPinLogin() {
    var pinBtns = document.querySelectorAll('.pin-btn[data-num]');
    var delBtn = document.querySelector('.pin-btn[data-action="delete"]');
    var pinDots = document.querySelectorAll('.pin-dot');

    pinBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (state.pin.length < 4) {
                state.pin += btn.dataset.num;
                updatePinDisplay();
                if (state.pin.length === 4) setTimeout(validatePin, 200);
            }
        });
    });

    delBtn.addEventListener('click', function () {
        state.pin = state.pin.slice(0, -1);
        updatePinDisplay();
    });

    function updatePinDisplay() {
        pinDots.forEach(function (dot, i) {
            dot.classList.toggle('filled', i < state.pin.length);
        });
    }

    function validatePin() {
        var cfg = getConfig();
        var match = (cfg.operatorPins || []).find(function (op) { return op.pin === state.pin; });
        if (match) {
            state.operatorName = match.name;
            state.warehouse = match.warehouse || cfg.warehouses[0];
            document.querySelectorAll('.wh-indicator').forEach(function (el) {
                el.textContent = state.operatorName + ' \u00b7 ' + state.warehouse;
            });
            showScreen('products');
            initProductList();
            startAutoRefresh();
        } else {
            state.pin = '';
            updatePinDisplay();
            document.querySelectorAll('.pin-dot').forEach(function (d) { d.style.background = '#DC2626'; });
            setTimeout(function () {
                document.querySelectorAll('.pin-dot').forEach(function (d) { d.style.background = ''; });
            }, 500);
        }
    }
}

// ==================== BOTTOM NAV ====================

function initBottomNav() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { showScreen(btn.dataset.screen); });
    });
}

// ==================== PRODUCT LIST ====================

var currentFilter = '';
var currentSearch = '';

function initProductList() {
    var searchInput = document.getElementById('search-input');
    var filterSelect = document.getElementById('filter-product');
    var logoutBtn = document.getElementById('btn-logout');

    var uniqueNames = getUniqueProductNames();
    filterSelect.innerHTML = '<option value="">All Products</option>';
    uniqueNames.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        filterSelect.appendChild(opt);
    });

    searchInput.addEventListener('input', function (e) { currentSearch = e.target.value; renderProductList(); });
    filterSelect.addEventListener('change', function (e) { currentFilter = e.target.value; renderProductList(); });
    logoutBtn.addEventListener('click', function () {
        state.pin = '';
        state.operatorName = '';
        stopAutoRefresh();
        showScreen('login');
        document.getElementById('bottom-nav').style.display = 'none';
        document.querySelectorAll('.pin-dot').forEach(function (d) { d.classList.remove('filled'); });
    });

    renderAlphaJump();
    renderProductList();
}

function renderAlphaJump() {
    var alphaJump = document.getElementById('alpha-jump');
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var productLetters = new Set(PRODUCTS.map(function (p) { return p.name[0].toUpperCase(); }));
    alphaJump.innerHTML = letters.map(function (letter) {
        return '<button class="alpha-btn ' + (productLetters.has(letter) ? '' : 'disabled') + '" data-letter="' + letter + '">' + letter + '</button>';
    }).join('');
    alphaJump.querySelectorAll('.alpha-btn:not(.disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var el = document.getElementById('letter-' + btn.dataset.letter);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function renderProductList() {
    var productList = document.getElementById('product-list');
    var filtered = filterProducts(currentSearch, currentFilter);
    var grouped = {};
    filtered.forEach(function (p) {
        if (!grouped[p.name]) grouped[p.name] = [];
        grouped[p.name].push(p);
    });

    var html = '';
    var sortedNames = Object.keys(grouped).sort();
    var lastLetter = '';

    sortedNames.forEach(function (name) {
        var products = grouped[name];
        var firstLetter = name[0].toUpperCase();
        if (firstLetter !== lastLetter) {
            html += '<div class="letter-separator" id="letter-' + firstLetter + '">' + firstLetter + '</div>';
            lastLetter = firstLetter;
        }
        if (products.length === 1) {
            var p = products[0];
            var displayName = p.packSize ? p.name + ' ' + p.packSize : p.name;
            html += '<div class="product-item" data-name="' + p.name + '" data-pack="' + p.packSize + '">'
                + '<div class="product-item-left"><span class="product-item-name">' + displayName + '</span>'
                + (p.prefix ? '<span class="product-item-sku">' + p.prefix + '</span>' : '')
                + '</div><span class="product-item-arrow">\u203a</span></div>';
        } else {
            html += '<div class="product-group-header">' + name + '</div>';
            products.forEach(function (p) {
                var displayName = p.packSize ? p.name + ' ' + p.packSize : p.name;
                html += '<div class="product-item" data-name="' + p.name + '" data-pack="' + p.packSize + '">'
                    + '<div class="product-item-left"><span class="product-item-name">' + displayName + '</span>'
                    + (p.prefix ? '<span class="product-item-sku">' + p.prefix + '</span>' : '')
                    + '</div><span class="product-item-arrow">\u203a</span></div>';
            });
        }
    });

    if (!html) html = '<div style="padding:32px;text-align:center;color:var(--text-secondary);">No products found</div>';
    productList.innerHTML = html;

    productList.querySelectorAll('.product-item').forEach(function (item) {
        item.addEventListener('click', function () {
            selectProduct(item.dataset.name, item.dataset.pack);
        });
    });
}

function selectProduct(name, packSize) {
    var product = findProduct(name, packSize);
    if (!product) return;
    state.selectedProduct = product.name;
    state.selectedPackSize = product.packSize;
    state.selectedYear = null;
    state.selectedMonth = null;
    state.selectedExpiryYear = null;
    state.selectedExpiryMonth = null;
    state.quantity = 0;

    document.getElementById('count-product-name').textContent = product.name;
    document.getElementById('count-pack-size').textContent = product.packSize || '';

    // Reset production month
    document.querySelectorAll('#year-buttons .year-btn').forEach(function (b) { b.classList.remove('selected'); });
    document.querySelectorAll('#month-buttons .month-btn').forEach(function (b) { b.classList.remove('selected'); });
    document.getElementById('month-buttons').style.display = 'none';
    document.getElementById('selected-month').classList.remove('visible');
    document.getElementById('selected-month').textContent = '';

    // Reset expiry month
    document.querySelectorAll('#expiry-year-buttons .year-btn').forEach(function (b) { b.classList.remove('selected'); });
    document.querySelectorAll('#expiry-month-buttons .month-btn').forEach(function (b) { b.classList.remove('selected'); });
    document.getElementById('expiry-month-buttons').style.display = 'none';
    document.getElementById('selected-expiry-month').classList.remove('visible');
    document.getElementById('selected-expiry-month').textContent = '';

    document.getElementById('qty-total-value').textContent = '0';
    document.getElementById('stack-l').value = '0';
    document.getElementById('stack-h').value = '0';
    document.getElementById('stack-n').value = '1';
    document.getElementById('stack-loose').value = '0';
    document.getElementById('stack-result-value').textContent = '0';
    document.getElementById('stack-calc-body').style.display = 'none';
    document.getElementById('toggle-arrow').classList.remove('open');

    showScreen('count');
    initCountScreen();
}

// ==================== COUNT SCREEN ====================

var numpadValue = '0';
var numpadTarget = 'qty';

function initCountScreen() {
    var yearButtons = document.getElementById('year-buttons');
    var monthButtons = document.getElementById('month-buttons');
    var selectedMonthDisplay = document.getElementById('selected-month');
    var expiryYearButtons = document.getElementById('expiry-year-buttons');
    var expiryMonthButtons = document.getElementById('expiry-month-buttons');
    var selectedExpiryMonthDisplay = document.getElementById('selected-expiry-month');
    var qtyTotalValue = document.getElementById('qty-total-value');
    var numpadOverlay = document.getElementById('numpad-overlay');
    var numpadDisplay = document.getElementById('numpad-display');
    var numpadLabel = document.querySelector('.numpad-label');

    state.quantity = 0;
    qtyTotalValue.textContent = '0';

    document.getElementById('qty-total-tap').onclick = function () {
        numpadTarget = 'qty-total';
        numpadLabel.textContent = 'Enter Correct Quantity';
        numpadValue = qtyTotalValue.textContent === '0' ? '' : qtyTotalValue.textContent;
        numpadDisplay.textContent = numpadValue || '0';
        numpadOverlay.style.display = 'flex';
    };

    var cfg = getConfig();
    var prodYears = [];
    for (var y = cfg.prodYears.start; y <= cfg.prodYears.end; y++) prodYears.push(y);
    var expiryYears = [];
    for (var y = cfg.expiryYears.start; y <= cfg.expiryYears.end; y++) expiryYears.push(y);

    function buildYearButtons(container, years, isExpiry) {
        container.innerHTML = '';
        years.forEach(function (y) {
            var btn = document.createElement('button');
            btn.className = 'year-btn';
            btn.dataset.year = isExpiry ? String(y - 2020) : String(y);
            btn.textContent = String(y);
            container.appendChild(btn);
        });
    }

    buildYearButtons(yearButtons, prodYears, false);
    buildYearButtons(expiryYearButtons, expiryYears, true);

    yearButtons.querySelectorAll('.year-btn').forEach(function (btn) {
        btn.onclick = function () {
            yearButtons.querySelectorAll('.year-btn').forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            state.selectedYear = btn.dataset.year;
            monthButtons.style.display = 'grid';
            state.selectedMonth = null;
            monthButtons.querySelectorAll('.month-btn').forEach(function (b) { b.classList.remove('selected'); });
            selectedMonthDisplay.classList.remove('visible');
        };
    });

    monthButtons.querySelectorAll('.month-btn').forEach(function (btn) {
        btn.onclick = function () {
            monthButtons.querySelectorAll('.month-btn').forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            state.selectedMonth = btn.dataset.month;
            selectedMonthDisplay.textContent = 'Production Month: ' + state.selectedYear + state.selectedMonth;
            selectedMonthDisplay.classList.add('visible');
        };
    });

    expiryYearButtons.querySelectorAll('.year-btn').forEach(function (btn) {
        btn.onclick = function () {
            expiryYearButtons.querySelectorAll('.year-btn').forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            state.selectedExpiryYear = btn.dataset.year;
            expiryMonthButtons.style.display = 'grid';
            state.selectedExpiryMonth = null;
            expiryMonthButtons.querySelectorAll('.month-btn').forEach(function (b) { b.classList.remove('selected'); });
            selectedExpiryMonthDisplay.classList.remove('visible');
        };
    });

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    expiryMonthButtons.querySelectorAll('.month-btn').forEach(function (btn) {
        btn.onclick = function () {
            expiryMonthButtons.querySelectorAll('.month-btn').forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            state.selectedExpiryMonth = btn.dataset.month;
            var fullYear = 2020 + parseInt(state.selectedExpiryMonth);
            var monthName = monthNames[parseInt(state.selectedExpiryMonth)];
            // Use the selected year button value for expiry year display
            var expiryYearBtn = document.querySelector('#expiry-year-buttons .year-btn.selected');
            if (expiryYearBtn) fullYear = parseInt(expiryYearBtn.textContent);
            selectedExpiryMonthDisplay.textContent = 'Expiry: ' + monthNames[parseInt(state.selectedExpiryMonth)] + ' ' + fullYear;
            selectedExpiryMonthDisplay.classList.add('visible');
        };
    });

    document.getElementById('qty-plus').onclick = function () {
        var qty = parseInt(qtyTotalValue.textContent) || 0;
        if (qty === 0) { showToast('Set the quantity first'); return; }
        doTransaction('receive', qty);
    };

    document.getElementById('qty-minus').onclick = function () {
        var qty = parseInt(qtyTotalValue.textContent) || 0;
        if (qty === 0) { showToast('Set the quantity first'); return; }
        doTransaction('dispatch', qty);
    };

    document.getElementById('qty-set').onclick = function () {
        var qty = parseInt(qtyTotalValue.textContent);
        if (qty < 0) return;
        if (qty === 0) { showToast('Set the quantity first'); return; }
        if (confirm('Set ' + state.selectedProduct + ' ' + state.selectedPackSize + ' to ' + qty + ' cartons?')) {
            doTransaction('adjustment', qty);
        }
    };

    // Stack calculator
    document.getElementById('stack-calc-toggle').onclick = function () {
        var body = document.getElementById('stack-calc-body');
        var isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        document.getElementById('toggle-arrow').classList.toggle('open', !isOpen);
    };

    function openStackNumpad(target, label) {
        return function () {
            numpadTarget = target;
            numpadLabel.textContent = label;
            var field = document.getElementById(target);
            numpadValue = field.value === '0' ? '' : field.value;
            numpadDisplay.textContent = numpadValue || '0';
            numpadOverlay.style.display = 'flex';
        };
    }

    var stackL = document.getElementById('stack-l');
    var stackH = document.getElementById('stack-h');
    var stackN = document.getElementById('stack-n');
    var stackLoose = document.getElementById('stack-loose');

    stackL.onclick = openStackNumpad('stack-l', 'Products per Layer');
    stackH.onclick = openStackNumpad('stack-h', 'Height (Layers)');
    stackN.onclick = openStackNumpad('stack-n', 'Number of Stacks');
    stackLoose.onclick = openStackNumpad('stack-loose', 'Loose Cartons');

    function updateStackResult() {
        var perLayer = parseInt(stackL.value) || 0;
        var height = parseInt(stackH.value) || 0;
        var n = parseInt(stackN.value) || 1;
        var loose = parseInt(stackLoose.value) || 0;
        document.getElementById('stack-result-value').textContent = (perLayer * height * n) + loose;
    }

    [stackL, stackH, stackN, stackLoose].forEach(function (input) {
        input.oninput = updateStackResult;
        input.onchange = updateStackResult;
    });

    document.getElementById('stack-apply-btn').onclick = function () {
        var value = parseInt(document.getElementById('stack-result-value').textContent) || 0;
        state.quantity = value;
        qtyTotalValue.textContent = value;
    };

    // Numpad
    document.getElementById('numpad-close').onclick = function () {
        numpadOverlay.style.display = 'none';
        numpadValue = '0';
    };

    document.querySelectorAll('.numpad-btn').forEach(function (btn) {
        btn.onclick = function () {
            var num = btn.dataset.num;
            if (num === 'clear') numpadValue = '';
            else if (num === 'back') numpadValue = numpadValue.slice(0, -1);
            else if (numpadValue.length < 6) numpadValue += num;
            numpadDisplay.textContent = numpadValue || '0';
        };
    });

    document.getElementById('numpad-confirm').onclick = function () {
        var value = parseInt(numpadValue) || 0;
        if (numpadTarget === 'qty-total') {
            qtyTotalValue.textContent = value;
        } else {
            var field = document.getElementById(numpadTarget);
            if (field) { field.value = value; updateStackResult(); }
        }
        numpadOverlay.style.display = 'none';
        numpadValue = '0';
    };

    document.getElementById('btn-save').style.display = 'none';
    document.getElementById('btn-back').onclick = function () { showScreen('products'); };
}

// ==================== INVENTORY LIST (FEFO) ====================

function renderInventoryList() {
    var tbody = document.getElementById('inventory-tbody');
    var emptyMsg = document.getElementById('inventory-empty');
    var searchInput = document.getElementById('inv-search');
    var search = searchInput ? searchInput.value.toLowerCase() : '';

    var data = state.inventory.filter(function (d) { return d.warehouse === state.warehouse; });
    if (search) {
        data = data.filter(function (d) {
            return d.product.toLowerCase().includes(search) || d.packSize.toLowerCase().includes(search);
        });
    }

    if (data.length === 0) { tbody.innerHTML = ''; emptyMsg.style.display = 'flex'; return; }
    emptyMsg.style.display = 'none';

    data.sort(function (a, b) {
        var c = a.product.localeCompare(b.product);
        if (c !== 0) return c;
        c = a.packSize.localeCompare(b.packSize);
        if (c !== 0) return c;
        var ya = parseInt(a.productionMonth[0]), yb = parseInt(b.productionMonth[0]);
        if (ya !== yb) return ya - yb;
        return a.productionMonth[1].localeCompare(b.productionMonth[1]);
    });

    var groups = {};
    data.forEach(function (d) {
        var key = d.product + '|' + d.packSize;
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
    });

    var highlighted = new Set();
    Object.values(groups).forEach(function (group) {
        var runningMin = group[group.length - 1].quantity;
        for (var i = group.length - 2; i >= 0; i--) {
            if (group[i].quantity > runningMin) {
                highlighted.add(group[i].product + '|' + group[i].packSize + '|' + group[i].productionMonth);
            }
            runningMin = Math.min(runningMin, group[i].quantity);
        }
    });

    var html = '';
    for (var key in groups) {
        var items = groups[key];
        var first = items[0];
        html += '<tr class="inv-group-header"><td colspan="5">' + first.product + ' ' + first.packSize + '</td></tr>';
        items.forEach(function (d) {
            var cls = highlighted.has(d.product + '|' + d.packSize + '|' + d.productionMonth) ? ' row-fefo-highlight' : '';
            html += '<tr class="' + cls + '"><td>' + d.product + '</td><td>' + d.packSize + '</td><td>' + d.productionMonth + '</td><td>' + (d.expiryMonth || '—') + '</td><td>' + d.quantity + '</td></tr>';
        });
    }
    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No results</td></tr>';
}

// ==================== TRANSACTIONS ====================

function showToast(message) {
    var existing = document.getElementById('slt-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'slt-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(20,30,25,0.95);color:#fff;padding:12px 20px;border-radius:10px;font-size:15px;font-weight:600;z-index:10000;max-width:85%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadein 0.2s;';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2500);
}

function doTransaction(type, qty) {
    var missing = [];
    if (state.selectedYear === null) missing.push('Production Year');
    if (state.selectedMonth === null) missing.push('Production Month');
    if (state.selectedExpiryYear === null) missing.push('Expiry Year');
    if (state.selectedExpiryMonth === null) missing.push('Expiry Month');
    if (missing.length) {
        showToast('Select: ' + missing.join(', '));
        return;
    }

    var prodMonthCode = state.selectedYear + state.selectedMonth;
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var expiryFullYear = 2020 + parseInt(state.selectedExpiryYear);
    var expiryMonthName = monthNames[parseInt(state.selectedExpiryMonth)];
    var expiryDate = expiryMonthName + ' ' + expiryFullYear;

    var tx = {
        product: state.selectedProduct,
        packSize: state.selectedPackSize,
        productionMonth: prodMonthCode,
        expiryMonth: expiryDate,
        quantity: qty,
        type: type,
        operator: state.operatorName,
        warehouse: state.warehouse,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: false, day: '2-digit', month: 'short', year: 'numeric' })
    };
    state.transactions.push(tx);

    // Update local inventory
    var idx = state.inventory.findIndex(function (item) {
        return item.product === state.selectedProduct && item.packSize === state.selectedPackSize
            && item.productionMonth === prodMonthCode && item.warehouse === state.warehouse;
    });

    if (type === 'receive') {
        if (idx >= 0) {
            state.inventory[idx].quantity += qty;
        } else {
            state.inventory.push({ product: state.selectedProduct, packSize: state.selectedPackSize, productionMonth: prodMonthCode, expiryMonth: expiryDate, quantity: qty, warehouse: state.warehouse });
        }
    } else if (type === 'dispatch') {
        if (idx >= 0) {
            state.inventory[idx].quantity = Math.max(0, state.inventory[idx].quantity - qty);
            if (state.inventory[idx].quantity === 0) state.inventory.splice(idx, 1);
        }
    } else if (type === 'adjustment') {
        if (idx >= 0) {
            state.inventory[idx].quantity = qty;
        } else if (qty > 0) {
            state.inventory.push({ product: state.selectedProduct, packSize: state.selectedPackSize, productionMonth: prodMonthCode, expiryMonth: expiryDate, quantity: qty, warehouse: state.warehouse });
        }
    }

    state.inventory = state.inventory.filter(function (item) { return item.quantity > 0; });
    syncToStorage();

    var typeLabel = type === 'receive' ? 'Received' : type === 'dispatch' ? 'Dispatched' : 'Set';
    document.getElementById('confirm-details').textContent =
        typeLabel + ': ' + state.selectedProduct + ' ' + state.selectedPackSize + ' \u00d7 ' + qty + ' (' + prodMonthCode + ', exp ' + expiryDate + ')';
    showScreen('confirm');
    document.getElementById('btn-continue').onclick = function () { showScreen('products'); };
}

function syncToStorage() {
    try {
        var data = { transactions: state.transactions, inventory: state.inventory };
        if (window.syncManager) window.syncManager.saveLocal('operator-data', data);
        else localStorage.setItem('operator-data', JSON.stringify(data));
    } catch (e) {}
}

function loadFromStorage() {
    try {
        var saved = localStorage.getItem('operator-data');
        if (saved) {
            var data = JSON.parse(saved);
            if (data.transactions) state.transactions = data.transactions;
            if (data.inventory) state.inventory = data.inventory;
            return;
        }
    } catch (e) {}
    state.transactions = [];
    state.inventory = [];
}

// ==================== 12M EXPIRY LOGIC ====================

function expiryStringToDate(str) {
    if (typeof str === 'string' && str.indexOf(' ') > -1) {
        var parts = str.split(' ');
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return new Date(parseInt(parts[1]), monthNames.indexOf(parts[0]), 1);
    }
    return new Date(str);
}

function monthsUntilExpiry(expiryStr) {
    var now = new Date();
    var expiry = expiryStringToDate(expiryStr);
    return (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
}

function getUrgencyClass(months) {
    if (months < 0) return 'expired';
    if (months <= 3) return 'critical';
    if (months <= 6) return 'warning';
    if (months <= 12) return 'notice';
    return 'normal';
}

function render12MonthList() {
    var tbody = document.getElementById('twelve-month-tbody');
    var emptyMsg = document.getElementById('twelve-month-empty');

    var expiringItems = state.inventory.filter(function (item) {
        if (item.warehouse !== state.warehouse || !item.expiryMonth) return false;
        var ml = monthsUntilExpiry(item.expiryMonth);
        return ml <= 12;
    });

    if (expiringItems.length === 0) { tbody.innerHTML = ''; emptyMsg.style.display = 'flex'; return; }
    emptyMsg.style.display = 'none';

    expiringItems.sort(function (a, b) {
        var mA = monthsUntilExpiry(a.expiryMonth), mB = monthsUntilExpiry(b.expiryMonth);
        if (mA !== mB) return mA - mB;
        return a.product.localeCompare(b.product);
    });

    var html = '';
    expiringItems.forEach(function (item) {
        var ml = monthsUntilExpiry(item.expiryMonth);
        var urgency = getUrgencyClass(ml);
        var badgeLabel = urgency === 'expired' ? 'EXPIRED' : ml + 'M';
        html += '<tr class="row-' + urgency + '"><td>' + item.product + '</td><td>' + item.packSize + '</td><td>' + item.expiryMonth + '</td><td>' + item.quantity + '</td><td><span class="shelf-badge shelf-badge-' + urgency + '">' + badgeLabel + '</span></td></tr>';
    });
    tbody.innerHTML = html;
}

// ==================== INIT ====================

var _autoRefreshInterval = null;
var _autoRefreshCount = 0;

function startAutoRefresh() {
    if (_autoRefreshInterval) clearInterval(_autoRefreshInterval);
    _autoRefreshInterval = setInterval(function () {
        if (window.syncManager && window.syncManager.pullAll) {
            // Skip if synced less than 30s ago
            var status = window.syncManager.getSyncStatus();
            if (status.lastSync && Date.now() - status.lastSync < 30000) return;
            // Full pull every 5th refresh so edits made in the admin panel
            // (which keep their client_timestamp) eventually reach every device.
            var forceFull = (_autoRefreshCount++ % 5) === 4;
            window.syncManager.pullAll(forceFull).then(function () {
                loadFromStorage();
                if (state.currentScreen === 'inventory') renderInventoryList();
                if (state.currentScreen === 'twelve-month') render12MonthList();
            });
        }
    }, 30000);
}

function stopAutoRefresh() {
    if (_autoRefreshInterval) { clearInterval(_autoRefreshInterval); _autoRefreshInterval = null; }
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.syncManager) {
        window.syncManager.init();
        window.syncManager.onSync(function () {
            if (state.currentScreen === 'inventory') renderInventoryList();
            if (state.currentScreen === 'twelve-month') render12MonthList();
        });
    }

    // Phase 1: Load from localStorage FIRST — app is instantly usable
    loadFromStorage();
    initProductList();
    initPinLogin();
    initBottomNav();
    var invSearch = document.getElementById('inv-search');
    if (invSearch) invSearch.addEventListener('input', function () { renderInventoryList(); });

    // Phase 1: Sync in background — don't block login
    function backgroundSync() {
        if (!window.syncManager) return Promise.resolve();
        return window.syncManager.pullConfig().then(function () {
            return window.syncManager.pullProducts();
        }).then(function () {
            loadSyncedProducts();
            return window.syncManager.pullAll();
        }).then(function () {
            loadFromStorage();
            if (state.currentScreen === 'products') renderProductList();
            if (state.currentScreen === 'inventory') renderInventoryList();
            if (state.currentScreen === 'twelve-month') render12MonthList();
            if (navigator.onLine) window.syncManager.syncAll();
        }).catch(function () {});
    }
    backgroundSync();

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && state.operatorName && window.syncManager && window.syncManager.pullAll) {
            window.syncManager.pullAll().then(function () {
                loadFromStorage();
                if (state.currentScreen === 'inventory') renderInventoryList();
                if (state.currentScreen === 'twelve-month') render12MonthList();
            });
        }
    });
});
