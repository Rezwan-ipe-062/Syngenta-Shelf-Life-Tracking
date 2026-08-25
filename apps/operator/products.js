// products.js — Product master data and helpers
var PRODUCTS = [
    { name: "Actara", packSize: "5g", prefix: "SCH" },
    { name: "Amistar", packSize: "50ml", prefix: "SCH" },
    { name: "Amistar", packSize: "100ml", prefix: "SCH" },
    { name: "Amistar", packSize: "500ml", prefix: "SCH" },
    { name: "Alika", packSize: "50ml", prefix: "SCH" },
    { name: "Armure", packSize: "100ml", prefix: "SCH" },
    { name: "Bingo", packSize: "100g", prefix: "SCH" },
    { name: "Bingo", packSize: "500g", prefix: "SCH" },
    { name: "Denim Fit", packSize: "10g", prefix: "SCH" },
    { name: "Filia", packSize: "50ml", prefix: "SCH" },
    { name: "Filia", packSize: "100ml", prefix: "SCH" },
    { name: "Filia", packSize: "500ml", prefix: "SCH" },
    { name: "Grozin", packSize: "1kg", prefix: "SCH" },
    { name: "Grozin", packSize: "2kg", prefix: "SCH" },
    { name: "Incipio", packSize: "40ml", prefix: "SCH" },
    { name: "Incipio", packSize: "100ml", prefix: "SCH" },
    { name: "Karate", packSize: "50ml", prefix: "SCH" },
    { name: "Karate", packSize: "100ml", prefix: "SCH" },
    { name: "Karate", packSize: "500ml", prefix: "SCH" },
    { name: "Lanirat", packSize: "100g", prefix: "SCH" },
    { name: "Magma", packSize: "1kg", prefix: "SCH" },
    { name: "Magma", packSize: "2kg", prefix: "SCH" },
    { name: "Miravis Duo", packSize: "50ml", prefix: "SCH" },
    { name: "Miravis Duo", packSize: "100ml", prefix: "SCH" },
    { name: "Pegasus", packSize: "50ml", prefix: "SCH" },
    { name: "Pegasus", packSize: "100ml", prefix: "SCH" },
    { name: "Proclam", packSize: "10g", prefix: "SCH" },
    { name: "Proclam", packSize: "30g", prefix: "SCH" },
    { name: "Revus", packSize: "50ml", prefix: "SCH" },
    { name: "Revus", packSize: "100ml", prefix: "SCH" },
    { name: "Ridomil", packSize: "100g", prefix: "SCH" },
    { name: "Ridomil", packSize: "500g", prefix: "SCH" },
    { name: "Rifit", packSize: "100ml", prefix: "SCH" },
    { name: "Rifit", packSize: "500ml", prefix: "SCH" },
    { name: "Score", packSize: "50ml", prefix: "SCH" },
    { name: "Score", packSize: "100ml", prefix: "SCH" },
    { name: "Score", packSize: "500ml", prefix: "SCH" },
    { name: "Shobicron", packSize: "50ml", prefix: "SCH" },
    { name: "Shobicron", packSize: "100ml", prefix: "SCH" },
    { name: "Shobicron", packSize: "500ml", prefix: "SCH" },
    { name: "Silika", packSize: "1kg", prefix: "SCH" },
    { name: "Silika", packSize: "2kg", prefix: "SCH" },
    { name: "Thiovit", packSize: "1kg", prefix: "SCH" },
    { name: "Thiovit", packSize: "2kg", prefix: "SCH" },
    { name: "Tilt", packSize: "50ml", prefix: "SCH" },
    { name: "Tilt", packSize: "100ml", prefix: "SCH" },
    { name: "Tilt", packSize: "500ml", prefix: "SCH" },
    { name: "Vestoria", packSize: "15g", prefix: "SCH" },
    { name: "Vertimec", packSize: "50ml", prefix: "SCH" },
    { name: "Vertimec", packSize: "100ml", prefix: "SCH" },
    { name: "Vertimec", packSize: "500ml", prefix: "SCH" },
    { name: "Virtako", packSize: "10g", prefix: "SCH" },
    { name: "Virtako", packSize: "30g", prefix: "SCH" },
    { name: "Voliam", packSize: "50ml", prefix: "SCH" },
    { name: "Plenum", packSize: "50g", prefix: "SCH" },
    { name: "Atresia", packSize: "50ml", prefix: "JAK" },
    { name: "Cruiser", packSize: "20g", prefix: "SPL" },
    { name: "Caliber", packSize: "100g", prefix: "EC" },
    { name: "Caliber", packSize: "500g", prefix: "EC" },
    { name: "Gayte", packSize: "100g", prefix: "BG" },
    { name: "Jazz", packSize: "100g", prefix: "DKC" },
    { name: "Jazz", packSize: "500g", prefix: "DKC" },
    { name: "Jazz", packSize: "1kg", prefix: "DKC" },
    { name: "Laser", packSize: "25g", prefix: "RB" },
    { name: "Protozim", packSize: "50ml", prefix: "BWL" },
    { name: "Protozim", packSize: "100ml", prefix: "BWL" },
    { name: "Protozim", packSize: "500ml", prefix: "BWL" },
    { name: "PJ-16", packSize: "", prefix: "" },
    { name: "XP-16", packSize: "", prefix: "" }
];

var AGI_CODES = {
    "Actara|5g": "34779", "Alika|50ml": "69667", "Amistar|50ml": "53294",
    "Armure|100ml": "85250", "Atresia|50ml": "88294", "Bingo|100g": "63728",
    "Bingo|500g": "63728", "Caliber|100g": "68507", "Caliber|500g": "68507",
    "Cruiser|20g": "63913", "Denim Fit|10g": "87224", "Filia|50ml": "55458",
    "Filia|100ml": "46420", "Filia|500ml": "57918", "Gayte|100g": "69037",
    "Grozin|1kg": "35440", "Grozin|2kg": "56655", "Incipio|40ml": "80926",
    "Jazz|100g": "52539", "Jazz|500g": "52537", "Karate|50ml": "58896",
    "Lanirat|100g": "35723", "Laser|25g": "43868", "Magma|1kg": "63731",
    "Miravis Duo|50ml": "80927", "Miravis Duo|100ml": "81359",
    "Pegasus|100ml": "61124", "Plenum|50g": "64213", "Proclam|10g": "70887",
    "Proclam|30g": "70897", "Protozim|50ml": "59703", "Revus|50ml": "58513",
    "Revus|100ml": "53508", "Revus|500ml": "53924", "Ridomil|100g": "38775",
    "Ridomil|500g": "38776", "Rifit|100ml": "35348", "Score|50ml": "34002",
    "Score|100ml": "30593", "Score|500ml": "34001", "Shobicron|50ml": "29568",
    "Silika|1kg": "58337", "Thiovit|1kg": "92798", "Tilt|50ml": "58888",
    "Vestoria|15g": "84793", "Vertimec|50ml": "63105", "Virtako|10g": "72598",
    "Voliam|50ml": "43978"
};

function getAgiCode(name, packSize) {
    return AGI_CODES[name + '|' + (packSize || '')] || '';
}

function getUniqueProductNames() {
    return [...new Set(PRODUCTS.map(function (p) { return p.name; }))].sort();
}

function findProduct(name, packSize) {
    return PRODUCTS.find(function (p) { return p.name === name && p.packSize === packSize; });
}

function filterProducts(searchTerm, selectedName) {
    var filtered = PRODUCTS;
    if (selectedName) filtered = filtered.filter(function (p) { return p.name === selectedName; });
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        filtered = filtered.filter(function (p) {
            return p.name.toLowerCase().startsWith(term) || p.packSize.toLowerCase().startsWith(term);
        });
    }
    return filtered;
}

function loadSyncedProducts() {
    try {
        var saved = localStorage.getItem('synced-products');
        if (saved) {
            var list = JSON.parse(saved);
            if (list && list.length > 0) {
                PRODUCTS.length = 0;
                list.forEach(function (p) {
                    PRODUCTS.push({ name: p.name, packSize: p.pack || p.packSize || '', prefix: p.prefix || '' });
                });
            }
        }
    } catch (e) {}
}

(function () { loadSyncedProducts(); })();
