// App State
const state = {
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
    inventory: [], // Aggregated inventory (received - dispatched)
    transactions: [] // Individual receive/dispatch records
};

// Load config from admin panel (localStorage)
var DEFAULT_OP_CONFIG = {
    operatorPins: [
        { name: 'Default', pin: '1234', warehouse: 'Chittagong' }
    ],
    expiryYears: { start: 2025, end: 2030 },
    prodYears: { start: 5, end: 6 },
    warehouses: ['Chittagong', 'Gazipur', 'Jessore', 'Bogura']
};
function loadOperatorConfig() {
    try {
        var saved = localStorage.getItem('shelf-life-config');
        if (saved) {
            var base = JSON.parse(saved);
            return {
                operatorPins: base.operatorPins || JSON.parse(JSON.stringify(DEFAULT_OP_CONFIG.operatorPins)),
                expiryYears: base.expiryYears || DEFAULT_OP_CONFIG.expiryYears,
                prodYears: base.prodYears || DEFAULT_OP_CONFIG.prodYears,
                warehouses: base.warehouses || DEFAULT_OP_CONFIG.warehouses
            };
        }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_OP_CONFIG));
}
function getConfig() { return loadOperatorConfig(); }

// DOM Elements
const screens = {
    login: document.getElementById('screen-login'),
    products: document.getElementById('screen-products'),
    count: document.getElementById('screen-count'),
    confirm: document.getElementById('screen-confirm'),
    inventory: document.getElementById('screen-inventory'),
    'twelve-month': document.getElementById('screen-twelve-month')
};

// ==================== NAVIGATION ====================
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
    state.currentScreen = screenName;
    
    // Show/hide bottom nav
    const bottomNav = document.getElementById('bottom-nav');
    const screensWithNav = ['products', 'inventory', 'twelve-month'];
    if (screensWithNav.includes(screenName)) {
        bottomNav.style.display = 'flex';
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });
    } else {
        bottomNav.style.display = 'none';
    }
    
    // Refresh lists when viewing
    if (screenName === 'inventory') {
        renderInventoryList();
    } else if (screenName === 'twelve-month') {
        render12MonthList();
    }
}

// ==================== PIN LOGIN ====================
function initPinLogin() {
    const pinBtns = document.querySelectorAll('.pin-btn[data-num]');
    const delBtn = document.querySelector('.pin-btn[data-action="delete"]');
    const pinDots = document.querySelectorAll('.pin-dot');

    pinBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.pin.length < 4) {
                state.pin += btn.dataset.num;
                updatePinDisplay();

                if (state.pin.length === 4) {
                    setTimeout(validatePin, 200);
                }
            }
        });
    });

    delBtn.addEventListener('click', () => {
        state.pin = state.pin.slice(0, -1);
        updatePinDisplay();
    });

    function updatePinDisplay() {
        pinDots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < state.pin.length);
        });
    }

    function validatePin() {
        const cfg = getConfig();
        const validPins = cfg.operatorPins || [];
        const match = validPins.find(op => op.pin === state.pin);
        if (match) {
            state.operatorName = match.name;
            state.warehouse = match.warehouse || (cfg.warehouses ? cfg.warehouses[0] : 'Chittagong');
            document.querySelectorAll('.wh-indicator').forEach(function(el) { el.textContent = state.operatorName + ' · ' + state.warehouse; });
            showScreen('products');
            initProductList();
        } else {
            state.pin = '';
            updatePinDisplay();
            // Show error feedback
            document.querySelectorAll('.pin-dot').forEach(d => d.style.background = '#DC2626');
            setTimeout(() => document.querySelectorAll('.pin-dot').forEach(d => d.style.background = ''), 500);
        }
    }
}

// ==================== BOTTOM NAVIGATION ====================
function initBottomNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            showScreen(screen);
        });
    });
}

// ==================== PRODUCT LIST ====================
let currentFilter = '';
let currentSearch = '';

function initProductList() {
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-product');
    const logoutBtn = document.getElementById('btn-logout');

    // Populate product filter dropdown
    const uniqueNames = getUniqueProductNames();
    filterSelect.innerHTML = '<option value="">All Products</option>';
    uniqueNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        filterSelect.appendChild(opt);
    });

    // Event listeners
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderProductList();
    });

    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderProductList();
    });

    logoutBtn.addEventListener('click', () => {
        state.pin = '';
        showScreen('login');
        document.getElementById('bottom-nav').style.display = 'none';
        document.querySelectorAll('.pin-dot').forEach(d => d.classList.remove('filled'));
    });

    renderAlphaJump();
    renderProductList();
}

function renderAlphaJump() {
    const alphaJump = document.getElementById('alpha-jump');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    const productLetters = new Set(PRODUCTS.map(p => p.name[0].toUpperCase()));
    
    alphaJump.innerHTML = letters.map(letter => {
        const hasProducts = productLetters.has(letter);
        return `<button class="alpha-btn ${hasProducts ? '' : 'disabled'}" data-letter="${letter}">${letter}</button>`;
    }).join('');
    
    alphaJump.querySelectorAll('.alpha-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const letter = btn.dataset.letter;
            scrollToLetter(letter);
        });
    });
}

function scrollToLetter(letter) {
    const productList = document.getElementById('product-list');
    const headers = productList.querySelectorAll('.letter-separator');
    
    for (const el of headers) {
        if (el.textContent.trim() === letter) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        }
    }
}

function renderProductList() {
    const productList = document.getElementById('product-list');
    const filtered = filterProducts(currentSearch, currentFilter);

    const grouped = {};
    filtered.forEach(product => {
        if (!grouped[product.name]) {
            grouped[product.name] = [];
        }
        grouped[product.name].push(product);
    });

    let html = '';
    const sortedNames = Object.keys(grouped).sort();
    let lastLetter = '';

    sortedNames.forEach(name => {
        const products = grouped[name];
        const firstLetter = name[0].toUpperCase();
        
        if (firstLetter !== lastLetter) {
            html += `<div class="letter-separator" id="letter-${firstLetter}">${firstLetter}</div>`;
            lastLetter = firstLetter;
        }

        if (products.length === 1) {
            const p = products[0];
            const displayName = p.packSize ? `${p.name} ${p.packSize}` : p.name;
            html += `
                <div class="product-item" data-name="${p.name}" data-pack="${p.packSize}">
                    <div class="product-item-left">
                        <span class="product-item-name">${displayName}</span>
                        ${p.prefix ? `<span class="product-item-sku">${p.prefix}</span>` : ''}
                    </div>
                    <span class="product-item-arrow">›</span>
                </div>
            `;
        } else {
            html += `<div class="product-group-header">${name}</div>`;
            products.forEach(p => {
                const displayName = p.packSize ? `${p.name} ${p.packSize}` : p.name;
                html += `
                    <div class="product-item" data-name="${p.name}" data-pack="${p.packSize}">
                        <div class="product-item-left">
                            <span class="product-item-name">${displayName}</span>
                            ${p.prefix ? `<span class="product-item-sku">${p.prefix}</span>` : ''}
                        </div>
                        <span class="product-item-arrow">›</span>
                    </div>
                `;
            });
        }
    });

    if (html === '') {
        html = '<div style="padding: 32px; text-align: center; color: var(--text-secondary);">No products found</div>';
    }

    productList.innerHTML = html;

    productList.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const pack = item.dataset.pack;
            selectProduct(name, pack);
        });
    });
}

function selectProduct(name, packSize) {
    const product = findProduct(name, packSize);
    if (product) {
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
        document.querySelectorAll('#year-buttons .year-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('#month-buttons .month-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('month-buttons').style.display = 'none';
        document.getElementById('selected-month').classList.remove('visible');
        document.getElementById('selected-month').textContent = '';

        // Reset expiry month
        document.querySelectorAll('#expiry-year-buttons .year-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('#expiry-month-buttons .month-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('expiry-month-buttons').style.display = 'none';
        document.getElementById('selected-expiry-month').classList.remove('visible');
        document.getElementById('selected-expiry-month').textContent = '';

        // Reset quantity
        document.getElementById('qty-total-value').textContent = '0';

        // Reset stack calculator
        document.getElementById('stack-l').value = '0';
        document.getElementById('stack-h').value = '0';
        document.getElementById('stack-n').value = '1';
        document.getElementById('stack-loose').value = '0';
        document.getElementById('stack-result-value').textContent = '0';
        document.getElementById('stack-calc-body').style.display = 'none';
        document.getElementById('toggle-arrow').classList.remove('open');

        updateSaveButton();

        showScreen('count');
        initCountScreen();
    }
}

// ==================== COUNT SCREEN ====================
let numpadValue = '0';
let numpadTarget = 'qty'; // 'qty-total', 'stack-l', 'stack-h', 'stack-n', 'stack-loose'

function initCountScreen() {
    const yearButtons = document.getElementById('year-buttons');
    const monthButtons = document.getElementById('month-buttons');
    const selectedMonthDisplay = document.getElementById('selected-month');
    
    const expiryYearButtons = document.getElementById('expiry-year-buttons');
    const expiryMonthButtons = document.getElementById('expiry-month-buttons');
    const selectedExpiryMonthDisplay = document.getElementById('selected-expiry-month');
    
    const saveBtn = document.getElementById('btn-save');
    const backBtn = document.getElementById('btn-back');
    
    // Quantity controls
    const qtyTotalValue = document.getElementById('qty-total-value');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtySet = document.getElementById('qty-set');
    
    // Stack calculator
    const stackToggle = document.getElementById('stack-calc-toggle');
    const stackBody = document.getElementById('stack-calc-body');
    const toggleArrow = document.getElementById('toggle-arrow');
    const stackL = document.getElementById('stack-l');
    const stackH = document.getElementById('stack-h');
    const stackN = document.getElementById('stack-n');
    const stackLoose = document.getElementById('stack-loose');
    const stackResult = document.getElementById('stack-result-value');
    const stackApplyBtn = document.getElementById('stack-apply-btn');
    
    // Numpad
    const numpadOverlay = document.getElementById('numpad-overlay');
    const numpadDisplay = document.getElementById('numpad-display');
    const numpadClose = document.getElementById('numpad-close');
    const numpadConfirm = document.getElementById('numpad-confirm');
    const numpadBtns = document.querySelectorAll('.numpad-btn');
    const numpadLabel = document.querySelector('.numpad-label');

    // Initialize total display
    state.quantity = 0;
    qtyTotalValue.textContent = '0';

    // Tap total display to open numpad for direct editing
    document.getElementById('qty-total-tap').onclick = () => {
        numpadTarget = 'qty-total';
        numpadLabel.textContent = 'Enter Correct Quantity';
        numpadValue = qtyTotalValue.textContent === '0' ? '' : qtyTotalValue.textContent;
        numpadDisplay.textContent = numpadValue || '0';
        numpadOverlay.style.display = 'flex';
    };

    // Build year buttons from config
    function buildYearButtons(container, years, isExpiry) {
        container.innerHTML = '';
        years.forEach(y => {
            const btn = document.createElement('button');
            btn.className = 'year-btn';
            if (isExpiry) {
                btn.dataset.year = String(y - 2020);
                btn.textContent = String(y);
            } else {
                btn.dataset.year = String(y);
                btn.textContent = String(y);
            }
            container.appendChild(btn);
        });
    }

    const cfg = getConfig();
    const prodYears = [];
    for (let y = cfg.prodYears.start; y <= cfg.prodYears.end; y++) prodYears.push(y);
    const expiryYears = [];
    for (let y = cfg.expiryYears.start; y <= cfg.expiryYears.end; y++) expiryYears.push(y);
    buildYearButtons(yearButtons, prodYears, false);
    buildYearButtons(expiryYearButtons, expiryYears, true);

    // Re-attach year button handlers
    yearButtons.querySelectorAll('.year-btn').forEach(btn => {
        btn.onclick = () => {
            yearButtons.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedYear = btn.dataset.year;
            monthButtons.style.display = 'grid';
            state.selectedMonth = null;
            monthButtons.querySelectorAll('.month-btn').forEach(b => b.classList.remove('selected'));
            selectedMonthDisplay.classList.remove('visible');
            updateSaveButton();
        };
    });

    monthButtons.querySelectorAll('.month-btn').forEach(btn => {
        btn.onclick = () => {
            monthButtons.querySelectorAll('.month-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedMonth = btn.dataset.month;

            const monthCode = state.selectedYear + state.selectedMonth;
            selectedMonthDisplay.textContent = `Production Month: ${monthCode}`;
            selectedMonthDisplay.classList.add('visible');
            updateSaveButton();
        };
    });

    // Expiry month handlers
    expiryYearButtons.querySelectorAll('.year-btn').forEach(btn => {
        btn.onclick = () => {
            expiryYearButtons.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedExpiryYear = btn.dataset.year;
            expiryMonthButtons.style.display = 'grid';
            state.selectedExpiryMonth = null;
            expiryMonthButtons.querySelectorAll('.month-btn').forEach(b => b.classList.remove('selected'));
            selectedExpiryMonthDisplay.classList.remove('visible');
            updateSaveButton();
        };
    });

    expiryMonthButtons.querySelectorAll('.month-btn').forEach(btn => {
        btn.onclick = () => {
            expiryMonthButtons.querySelectorAll('.month-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedExpiryMonth = btn.dataset.month;

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const fullYear = 2020 + parseInt(state.selectedExpiryYear);
            const monthName = monthNames[parseInt(state.selectedExpiryMonth)];
            selectedExpiryMonthDisplay.textContent = `Expiry: ${monthName} ${fullYear}`;
            selectedExpiryMonthDisplay.classList.add('visible');
            updateSaveButton();
        };
    });

    // Receive button: saves as addition to inventory
    qtyPlus.onclick = () => {
        const qty = parseInt(qtyTotalValue.textContent) || 0;
        if (qty === 0) return;
        doTransaction('receive', qty);
    };

    // Dispatch button: saves as removal from inventory
    qtyMinus.onclick = () => {
        const qty = parseInt(qtyTotalValue.textContent) || 0;
        if (qty === 0) return;
        doTransaction('dispatch', qty);
    };

    // Set button: sets inventory quantity directly (adjustment)
    qtySet.onclick = () => {
        const qty = parseInt(qtyTotalValue.textContent);
        if (qty < 0) return;
        const prodMonthCode = state.selectedYear && state.selectedMonth ? state.selectedYear + state.selectedMonth : '';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const expiryFullYear = state.selectedExpiryYear ? 2020 + parseInt(state.selectedExpiryYear) : '';
        const expiryMonthName = state.selectedExpiryMonth !== null ? monthNames[parseInt(state.selectedExpiryMonth)] : '';
        const expiryDate = expiryMonthName && expiryFullYear ? `${expiryMonthName} ${expiryFullYear}` : '';
        if (confirm(`Set ${state.selectedProduct} ${state.selectedPackSize} (${prodMonthCode}) to ${qty} cartons?`)) {
            doTransaction('adjustment', qty);
        }
    };

    // Stack calculator toggle
    stackToggle.onclick = () => {
        const isOpen = stackBody.style.display !== 'none';
        stackBody.style.display = isOpen ? 'none' : 'block';
        toggleArrow.classList.toggle('open', !isOpen);
    };

    // Stack field inputs (open numpad)
    function openStackNumpad(target, label) {
        return () => {
            numpadTarget = target;
            numpadLabel.textContent = label;
            const field = document.getElementById(target);
            numpadValue = field.value === '0' ? '' : field.value;
            numpadDisplay.textContent = numpadValue || '0';
            numpadOverlay.style.display = 'flex';
        };
    }

    stackL.onclick = openStackNumpad('stack-l', 'Products per Layer');
    stackH.onclick = openStackNumpad('stack-h', 'Height (Layers)');
    stackN.onclick = openStackNumpad('stack-n', 'Number of Stacks');
    stackLoose.onclick = openStackNumpad('stack-loose', 'Loose Cartons');

    // Update stack result when any field changes
    function updateStackResult() {
        const perLayer = parseInt(stackL.value) || 0;
        const height = parseInt(stackH.value) || 0;
        const n = parseInt(stackN.value) || 1;
        const loose = parseInt(stackLoose.value) || 0;
        
        // Formula: (perLayer × height × n) + loose
        const perStack = perLayer * height;
        const total = (perStack * n) + loose;
        stackResult.textContent = total;
    }

    [stackL, stackH, stackN, stackLoose].forEach(input => {
        input.oninput = updateStackResult;
        input.onchange = updateStackResult;
    });

    // Apply stack result to quantity display
    stackApplyBtn.onclick = () => {
        const value = parseInt(stackResult.textContent) || 0;
        state.quantity = value;
        qtyTotalValue.textContent = value;
        updateSaveButton();
    };

    // Numpad handlers
    numpadClose.onclick = () => {
        numpadOverlay.style.display = 'none';
        numpadValue = '0';
    };

    numpadBtns.forEach(btn => {
        btn.onclick = () => {
            const num = btn.dataset.num;
            
            if (num === 'clear') {
                numpadValue = '';
            } else if (num === 'back') {
                numpadValue = numpadValue.slice(0, -1);
            } else {
                if (numpadValue.length < 6) {
                    numpadValue += num;
                }
            }
            
            numpadDisplay.textContent = numpadValue || '0';
        };
    });

    numpadConfirm.onclick = () => {
        const value = parseInt(numpadValue) || 0;
        
        // Apply to the correct target
        if (numpadTarget === 'qty-total') {
            qtyTotalValue.textContent = value;
        } else {
            const field = document.getElementById(numpadTarget);
            if (field) {
                field.value = value;
                updateStackResult();
            }
        }
        
        numpadOverlay.style.display = 'none';
        numpadValue = '0';
    };

    // Hide the old save button
    saveBtn.style.display = 'none';

    backBtn.onclick = () => {
        showScreen('products');
    };
}

// ==================== INVENTORY LIST (FEFO) ====================
function renderInventoryList() {
    const tbody = document.getElementById('inventory-tbody');
    const emptyMsg = document.getElementById('inventory-empty');
    const searchInput = document.getElementById('inv-search');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    let data = state.inventory.filter(d => d.warehouse === state.warehouse);

    // Search filter (matches admin panel)
    if (search) {
        data = data.filter(d =>
            d.product.toLowerCase().includes(search) ||
            d.packSize.toLowerCase().includes(search)
        );
    }

    if (data.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'flex';
        return;
    }

    emptyMsg.style.display = 'none';

    // Sort by product, pack, then prodMonth ascending (matches admin panel)
    data.sort((a, b) => {
        const nameCmp = a.product.localeCompare(b.product);
        if (nameCmp !== 0) return nameCmp;
        const packCmp = a.packSize.localeCompare(b.packSize);
        if (packCmp !== 0) return packCmp;
        // prodMonth: year digit first, then month letter
        const yearA = parseInt(a.productionMonth[0]), yearB = parseInt(b.productionMonth[0]);
        if (yearA !== yearB) return yearA - yearB;
        return a.productionMonth[1].localeCompare(b.productionMonth[1]);
    });

    // Group by product + pack for FEFO logic (matches admin panel)
    const groups = {};
    data.forEach(d => {
        const key = d.product + '|' + d.packSize;
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
    });

    // Determine FEFO highlight: older batch highlighted when qty > any later batch
    const highlighted = new Set();
    Object.values(groups).forEach(group => {
        let runningMin = group[group.length - 1].quantity
        for (let i = group.length - 2; i >= 0; i--) {
            if (group[i].quantity > runningMin) {
                highlighted.add(group[i].product + '|' + group[i].packSize + '|' + group[i].productionMonth);
            }
            runningMin = Math.min(runningMin, group[i].quantity)
        }
    });

    // Render with group headers (matches admin panel layout)
    let html = '';
    for (const key in groups) {
        const items = groups[key];
        const first = items[0];
        // Group header row
        html += '<tr class="inv-group-header"><td colspan="4">' + first.product + ' ' + first.packSize + '</td></tr>';
        items.forEach(d => {
            const fefoClass = highlighted.has(d.product + '|' + d.packSize + '|' + d.productionMonth) ? ' row-fefo-highlight' : '';
            html += '<tr class="' + fefoClass + '"><td>' + d.product + '</td><td>' + d.packSize + '</td><td>' + d.productionMonth + '</td><td>' + d.quantity + '</td></tr>';
        });
    }

    tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">No results found</td></tr>';
}

// ==================== TRANSACTIONS (Receive / Dispatch) ====================
function canSave() {
    return state.selectedYear !== null &&
           state.selectedMonth !== null &&
           state.selectedExpiryYear !== null &&
           state.selectedExpiryMonth !== null;
}

function updateSaveButton() {
    // no-op: Receive/Dispatch buttons validate on click
}

function doTransaction(type, qty) {
    if (!canSave()) return;

    const prodMonthCode = state.selectedYear + state.selectedMonth;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const expiryFullYear = 2020 + parseInt(state.selectedExpiryYear);
    const expiryMonthName = monthNames[parseInt(state.selectedExpiryMonth)];
    const expiryDate = `${expiryMonthName} ${expiryFullYear}`;

    // Create transaction record
    const tx = {
        product: state.selectedProduct,
        packSize: state.selectedPackSize,
        productionMonth: prodMonthCode,
        expiryMonth: expiryDate,
        quantity: qty,
        type: type,
        operator_name: state.operatorName,
        warehouse: state.warehouse,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: false, day: '2-digit', month: 'short', year: 'numeric' })
    };
    state.transactions.push(tx);

    // Update aggregated inventory (scoped to warehouse)
    const existingIndex = state.inventory.findIndex(item => 
        item.product === state.selectedProduct &&
        item.packSize === state.selectedPackSize &&
        item.productionMonth === prodMonthCode &&
        item.warehouse === state.warehouse
    );

    if (type === 'receive') {
        if (existingIndex >= 0) {
            state.inventory[existingIndex].quantity += qty;
            state.inventory[existingIndex].warehouse = state.warehouse;
        } else {
            state.inventory.push({
                product: state.selectedProduct,
                packSize: state.selectedPackSize,
                productionMonth: prodMonthCode,
                expiryMonth: expiryDate,
                quantity: qty,
                warehouse: state.warehouse
            });
        }
    } else if (type === 'dispatch') {
        // Dispatch: subtract from inventory, remove if zero
        if (existingIndex >= 0) {
            state.inventory[existingIndex].quantity = Math.max(0, state.inventory[existingIndex].quantity - qty);
            if (state.inventory[existingIndex].quantity === 0) {
                state.inventory.splice(existingIndex, 1);
            }
        }
    } else if (type === 'adjustment') {
        // Set: directly set quantity
        if (existingIndex >= 0) {
            state.inventory[existingIndex].quantity = qty;
            state.inventory[existingIndex].warehouse = state.warehouse;
        } else {
            state.inventory.push({
                product: state.selectedProduct,
                packSize: state.selectedPackSize,
                productionMonth: prodMonthCode,
                expiryMonth: expiryDate,
                quantity: qty,
                warehouse: state.warehouse
            });
        }
    }

    // Auto-delete zero-quantity inventory rows
    state.inventory = state.inventory.filter(item => item.quantity > 0);

    // Sync to localStorage for admin panel
    syncToStorage();

    // Show confirmation
    const typeLabel = type === 'receive' ? 'Received' : type === 'dispatch' ? 'Dispatched' : 'Set';
    document.getElementById('confirm-details').textContent =
        `${typeLabel}: ${state.selectedProduct} ${state.selectedPackSize} × ${qty} packs (${prodMonthCode}, exp ${expiryDate})`;

    showScreen('confirm');

    document.getElementById('btn-continue').onclick = () => {
        showScreen('products');
    };
}

function syncToStorage() {
    try {
        const data = { transactions: state.transactions, inventory: state.inventory };
        if (window.syncManager) {
            window.syncManager.saveLocal('operator-data', data);
        } else {
            localStorage.setItem('operator-data', JSON.stringify(data));
        }
    } catch {}
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem('operator-data');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.transactions) state.transactions = data.transactions;
            if (data.inventory) state.inventory = data.inventory;
            return;
        }
    } catch {}
    state.transactions = [];
    state.inventory = [];
}

// ====================12M EXPIRY LOGIC ====================
// Convert "Mon YYYY" string (e.g., "Jun 2027") to Date object
function expiryStringToDate(str) {
    const parts = str.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(parts[0]);
    const year = parseInt(parts[1]);
    return new Date(year, monthIndex, 1);
}

// Calculate months remaining between now and expiry string
function monthsUntilExpiry(expiryStr) {
    const now = new Date();
    const expiry = expiryStringToDate(expiryStr);
    
    const years = expiry.getFullYear() - now.getFullYear();
    const months = expiry.getMonth() - now.getMonth();
    
    return years * 12 + months;
}

// Get urgency class based on months remaining
function getUrgencyClass(months) {
    if (months <= 3) return 'critical';
    if (months <= 6) return 'warning';
    if (months <= 12) return 'notice';
    return 'normal';
}

// ====================12M LIST RENDERING ====================
function render12MonthList() {
    const tbody = document.getElementById('twelve-month-tbody');
    const emptyMsg = document.getElementById('twelve-month-empty');
    
    // Filter inventory to only items expiring within 12 months for this warehouse
    const expiringItems = state.inventory.filter(item => {
        if (item.warehouse !== state.warehouse) return false;
        if (!item.expiryMonth) return false;
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        return monthsLeft >= 0 && monthsLeft <= 12;
    });
    
    if (expiringItems.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'flex';
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    // Sort by expiry (soonest first), then by product name
    expiringItems.sort((a, b) => {
        const monthsA = monthsUntilExpiry(a.expiryMonth);
        const monthsB = monthsUntilExpiry(b.expiryMonth);
        
        if (monthsA !== monthsB) {
            return monthsA - monthsB; // Ascending: least months first
        }
        
        return a.product.localeCompare(b.product);
    });
    
    // Render rows
    let html = '';
    
    expiringItems.forEach(item => {
        const monthsLeft = monthsUntilExpiry(item.expiryMonth);
        const urgency = getUrgencyClass(monthsLeft);
        
        html += `
            <tr class="row-${urgency}">
                <td>${item.product}</td>
                <td>${item.packSize}</td>
                <td>${item.expiryMonth}</td>
                <td>${item.quantity}</td>
                <td><span class="shelf-badge shelf-badge-${urgency}">${monthsLeft}M</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    if (window.syncManager) {
        window.syncManager.init();
        window.syncManager.pullConfig().then(function() {
            return window.syncManager.pullProducts();
        }).then(function() {
            loadSyncedProducts();
            return window.syncManager.pullFromSupabase().then(function() {
                loadFromStorage();
                // Rebuild product list UI after loading synced products
                initProductList();
                // Sync any pending items only after pull completes
                if (navigator.onLine) window.syncManager.syncAll();
            });
        });
        window.syncManager.onSync(() => {
            if (state.currentScreen === 'inventory') renderInventoryList();
            if (state.currentScreen === 'twelve-month') render12MonthList();
        });
    }
    initPinLogin();
    initBottomNav();

    // Inventory search input
    const invSearch = document.getElementById('inv-search');
    if (invSearch) {
        invSearch.addEventListener('input', () => renderInventoryList());
    }
});
