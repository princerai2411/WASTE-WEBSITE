/* ========================================
   WasteWise – Overhauled Marketplace & Free Items
   Features:
   - Drag & drop image upload with instant thumbnail preview & removal
   - Real-time scrap payout calculator (kg x ₹/kg) with dynamic rate suggestions
   - Category pill filters & instant keyword search
   - High-contrast WhatsApp connect links (wa.me)
   - Leaflet interactive map with custom scrap markers
   - Dual Supabase + LocalStorage fallback with realistic demo listings
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSellWasteForm();
    initDropzones();
    initPayoutCalculator();
    initSellFilters();
    initCollectorMap();
    initFreeItemForm();
    initFreeFilters();
    initFreeItemsGrid();
});

/* ---------- Shared Helpers ---------- */
function isSupabaseConfigured() {
    return typeof SUPABASE_URL !== 'undefined' &&
           typeof SUPABASE_ANON_KEY !== 'undefined' &&
           SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
           SUPABASE_URL.startsWith('http') &&
           typeof supabaseClient !== 'undefined' &&
           supabaseClient !== null;
}

function whatsappLink(phone, message) {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

async function uploadListingImage(file, folder) {
    if (!file) return null;
    if (!isSupabaseConfigured()) {
        return await readFileAsDataUrl(file);
    }
    try {
        const ext = file.name.split('.').pop();
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabaseClient.storage.from('listings').upload(path, file);
        if (error) {
            console.warn('Supabase storage upload failed, falling back to data URL:', error);
            return await readFileAsDataUrl(file);
        }
        const { data } = supabaseClient.storage.from('listings').getPublicUrl(path);
        return data.publicUrl;
    } catch (err) {
        console.warn('Error in uploadListingImage:', err);
        return await readFileAsDataUrl(file);
    }
}

/* ---------- Category Display Labels ---------- */
const CATEGORY_NAMES = {
    plastic: '🧴 Plastic Scrap',
    paper: '📰 Paper & Boxes',
    metal: '🔩 Metal & Iron',
    ewaste: '📱 E-Waste',
    glass: '🫙 Glass Bottles',
    mixed: '🗑️ Mixed Dry Scrap',
    furniture: '🪑 Furniture',
    appliance: '🔌 Appliances',
    other: '📦 Reusables'
};

/* ---------- Demo Seed Listings ---------- */
const DEFAULT_SELL_DEMO = [
    {
        id: 'scrap-1',
        type: 'sell',
        category: 'paper',
        title: '45kg Corrugated Packaging Boxes & Carton Flutes',
        quantity_kg: 45,
        price_per_kg: 14,
        image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
        latitude: 12.9784,
        longitude: 77.6408,
        contact_phone: '9876543210',
        area_text: 'Indiranagar, Bengaluru',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: 'scrap-2',
        type: 'sell',
        category: 'plastic',
        title: '28kg Sorted Clean PET Water & Oil Bottles',
        quantity_kg: 28,
        price_per_kg: 18,
        image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
        latitude: 12.9121,
        longitude: 77.6446,
        contact_phone: '9876543211',
        area_text: 'HSR Layout, Bengaluru',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
        id: 'scrap-3',
        type: 'sell',
        category: 'metal',
        title: '15kg Mixed Scrap Iron Rods & Aluminium Beverage Cans',
        quantity_kg: 15,
        price_per_kg: 35,
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=80',
        latitude: 12.9698,
        longitude: 77.7499,
        contact_phone: '9876543212',
        area_text: 'Whitefield, Bengaluru',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
        id: 'scrap-4',
        type: 'sell',
        category: 'ewaste',
        title: '8kg Old PC Motherboards, Power Supplies & Copper Cables',
        quantity_kg: 8,
        price_per_kg: 55,
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80',
        latitude: 12.9352,
        longitude: 77.6245,
        contact_phone: '9876543213',
        area_text: 'Koramangala, Bengaluru',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
        id: 'scrap-5',
        type: 'sell',
        category: 'glass',
        title: '30kg Sorted Amber & Clear Beverage Glass Bottles',
        quantity_kg: 30,
        price_per_kg: 6,
        image_url: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=500&auto=format&fit=crop&q=80',
        latitude: 12.9299,
        longitude: 77.5824,
        contact_phone: '9876543214',
        area_text: 'Jayanagar, Bengaluru',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 30).toISOString()
    }
];

const DEFAULT_FREE_DEMO = [
    {
        id: 'free-1',
        type: 'free',
        category: 'furniture',
        title: 'Solid Teak Wood Study Desk & Ergonomic Swivel Chair',
        area_text: 'Indiranagar 100ft Road, Bengaluru',
        image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80',
        contact_phone: '9876543215',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
        id: 'free-2',
        type: 'free',
        category: 'electronics',
        title: 'Dell 22" Full HD Monitor (Working, with HDMI cable)',
        area_text: 'Koramangala 4th Block, Bengaluru',
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80',
        contact_phone: '9876543216',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
        id: 'free-3',
        type: 'free',
        category: 'other',
        title: 'NCERT (Class 10-12) & IIT JEE Prep Book Bundle (24 Books)',
        area_text: 'Jayanagar 4th T Block, Bengaluru',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80',
        contact_phone: '9876543217',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
        id: 'free-4',
        type: 'free',
        category: 'appliance',
        title: 'Prestige Induction Cooktop 2000W (Clean & Fully Functional)',
        area_text: 'HSR Layout Sector 2, Bengaluru',
        image_url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
        contact_phone: '9876543218',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 22).toISOString()
    },
    {
        id: 'free-5',
        type: 'free',
        category: 'metal',
        title: '4 Iron Balcony Safety Grills & Steel Wire Mesh',
        area_text: 'Whitefield Inner Circle, Bengaluru',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=80',
        contact_phone: '9876543219',
        status: 'available',
        created_at: new Date(Date.now() - 3600000 * 40).toISOString()
    }
];

function getLocalListings(type) {
    const key = 'wastewise_' + type + '_items';
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Storage read error:', e);
    }
    const defaults = type === 'sell' ? DEFAULT_SELL_DEMO : DEFAULT_FREE_DEMO;
    saveLocalListings(type, defaults);
    return defaults;
}

function saveLocalListings(type, items) {
    const key = 'wastewise_' + type + '_items';
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
        console.warn('Storage save error:', e);
    }
}

function addLocalListing(type, item) {
    const items = getLocalListings(type);
    items.unshift(item);
    saveLocalListings(type, items);
    return items;
}

/* ========== DROPZONE IMAGE PREVIEWS ========== */
function initDropzones() {
    setupSingleDropzone({
        dropzoneId: 'sellDropzone',
        inputId: 'sellPhoto',
        previewContainerId: 'sellDropPreview',
        previewImgId: 'sellPreviewImg',
        removeBtnId: 'sellRemovePhotoBtn',
        promptId: 'sellDropPrompt'
    });

    setupSingleDropzone({
        dropzoneId: 'freeDropzone',
        inputId: 'freeItemPhoto',
        previewContainerId: 'freeDropPreview',
        previewImgId: 'freePreviewImg',
        removeBtnId: 'freeRemovePhotoBtn',
        promptId: 'freeDropPrompt'
    });
}

function setupSingleDropzone({ dropzoneId, inputId, previewContainerId, previewImgId, removeBtnId, promptId }) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImg = document.getElementById(previewImgId);
    const removeBtn = document.getElementById(removeBtnId);
    const prompt = document.getElementById(promptId);

    if (!dropzone || !input || !previewContainer || !previewImg) return;

    // Trigger file dialog on dropzone click
    dropzone.addEventListener('click', (e) => {
        if (e.target === removeBtn || (removeBtn && removeBtn.contains(e.target))) return;
        input.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            input.files = files;
            showPreview(files[0]);
        }
    });

    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            showPreview(input.files[0]);
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            previewImg.src = '';
            previewContainer.style.display = 'none';
            if (prompt) prompt.style.display = 'block';
        });
    }

    function showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
            if (prompt) prompt.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

/* ========== PAYOUT ESTIMATOR ========== */
const SCRAP_SUGGESTIONS = {
    'plastic': { rate: 15, hint: 'Market rate: Plastic ~₹15/kg (clean bottles)' },
    'paper': { rate: 12, hint: 'Market rate: Paper & Cardboard ~₹12-16/kg' },
    'metal': { rate: 35, hint: 'Market rate: Mixed Metals ~₹35/kg, Copper ~₹300/kg' },
    'ewaste': { rate: 55, hint: 'Market rate: E-Waste & Circuitry ~₹50-65/kg' },
    'glass': { rate: 6, hint: 'Market rate: Whole Glass Bottles ~₹5-7/kg' },
    'mixed': { rate: 10, hint: 'Market rate: Mixed recyclables ~₹8-12/kg' }
};

function initPayoutCalculator() {
    const qtyInput = document.getElementById('sellQuantity');
    const priceInput = document.getElementById('sellPrice');
    const typeSelect = document.getElementById('sellWasteType');
    const pillBox = document.getElementById('sellPayoutPill');
    const totalEl = document.getElementById('sellEstimatedTotal');
    const hintEl = document.getElementById('sellRateHint');

    if (!qtyInput || !priceInput || !pillBox || !totalEl) return;

    function updatePayout() {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;

        if (qty > 0 && price > 0) {
            const total = Math.round(qty * price);
            totalEl.textContent = '₹' + total.toLocaleString('en-IN');
            pillBox.style.display = 'flex';
        } else {
            pillBox.style.display = 'none';
        }
    }

    qtyInput.addEventListener('input', updatePayout);
    priceInput.addEventListener('input', updatePayout);

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const val = typeSelect.value;
            const data = SCRAP_SUGGESTIONS[val];
            if (data) {
                if (!priceInput.value || priceInput.dataset.autoFilled === 'true') {
                    priceInput.value = data.rate;
                    priceInput.dataset.autoFilled = 'true';
                }
                if (hintEl) hintEl.textContent = data.hint;
                updatePayout();
            }
        });

        priceInput.addEventListener('input', () => {
            priceInput.dataset.autoFilled = 'false';
        });
    }
}

/* ========== SELL WASTE FORM & SUBMISSION ========== */
function initSellWasteForm() {
    const form = document.getElementById('sellWasteForm');
    if (!form) return;

    const shareBtn = document.getElementById('shareLocationBtn');
    const statusEl = document.getElementById('locationStatus');
    const msgEl = document.getElementById('sellFormMsg');
    let capturedLocation = null;

    if (shareBtn && statusEl) {
        shareBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                statusEl.textContent = '⚠️ Geolocation not supported. Using central Bengaluru default.';
                capturedLocation = { lat: 12.9716, lng: 77.5946 };
                statusEl.classList.add('mp-location-ok');
                return;
            }
            statusEl.textContent = '📡 Pinpointing your GPS location…';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    capturedLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    statusEl.textContent = `✅ Location captured (accuracy ~${Math.round(pos.coords.accuracy)}m)`;
                    statusEl.classList.add('mp-location-ok');
                },
                (err) => {
                    console.warn('Geolocation denied/failed:', err);
                    capturedLocation = { lat: 12.9716, lng: 77.5946 };
                    statusEl.textContent = '✅ Location set to City Center (Default)';
                    statusEl.classList.add('mp-location-ok');
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!capturedLocation) {
            capturedLocation = { lat: 12.9716, lng: 77.5946 };
        }

        const submitBtn = document.getElementById('sellSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing Scrap Listing…';

        const wasteType = document.getElementById('sellWasteType').value;
        const quantity = parseFloat(document.getElementById('sellQuantity').value);
        const price = parseFloat(document.getElementById('sellPrice').value) || null;
        const phone = document.getElementById('sellPhone').value.trim();
        const photoFile = document.getElementById('sellPhoto').files[0];

        try {
            const imageUrl = await uploadListingImage(photoFile, 'sell');
            const categoryLabel = CATEGORY_NAMES[wasteType] || wasteType;

            const newListing = {
                id: 'scrap-' + Date.now(),
                type: 'sell',
                category: wasteType,
                title: `${quantity}kg ${categoryLabel} for Pickup`,
                quantity_kg: quantity,
                price_per_kg: price,
                image_url: imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
                latitude: capturedLocation.lat,
                longitude: capturedLocation.lng,
                contact_phone: phone,
                area_text: 'Bangalore Metro Area',
                status: 'available',
                created_at: new Date().toISOString()
            };

            if (isSupabaseConfigured()) {
                const { error } = await supabaseClient.from('listings').insert(newListing);
                if (error) throw error;
            } else {
                addLocalListing('sell', newListing);
            }

            msgEl.textContent = '🎉 Successfully listed! Scrap buyers nearby can now view your listing and message you on WhatsApp.';
            msgEl.className = 'mp-form-msg mp-success';
            form.reset();

            // Clear photo preview
            const previewContainer = document.getElementById('sellDropPreview');
            if (previewContainer) previewContainer.style.display = 'none';
            const prompt = document.getElementById('sellDropPrompt');
            if (prompt) prompt.style.display = 'block';
            const pill = document.getElementById('sellPayoutPill');
            if (pill) pill.style.display = 'none';

            statusEl.textContent = 'Location not shared yet';
            statusEl.classList.remove('mp-location-ok');
            capturedLocation = null;

            loadSellListings();
        } catch (err) {
            console.error('Submission error:', err);
            msgEl.textContent = '❌ Failed to post listing. Please try again.';
            msgEl.className = 'mp-form-msg mp-error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 List Waste for Pickup';
        }
    });
}

/* ========== COLLECTOR MAP & SELL LISTINGS WITH FILTERS ========== */
let collectorMapInstance = null;
let collectorMarkers = [];
let allSellListings = [];
let activeSellCategory = 'all';
let sellSearchQuery = '';

function initSellFilters() {
    const filterPills = document.querySelectorAll('#sellCategoryFilters .mp-filter-pill');
    const searchInput = document.getElementById('sellSearchInput');

    filterPills.forEach(btn => {
        btn.addEventListener('click', () => {
            filterPills.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSellCategory = btn.dataset.cat || 'all';
            renderFilteredSellListings();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            sellSearchQuery = e.target.value.toLowerCase().trim();
            renderFilteredSellListings();
        });
    }
}

function initCollectorMap() {
    const mapEl = document.getElementById('collectorMap');
    if (!mapEl) return;

    collectorMapInstance = L.map('collectorMap').setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(collectorMapInstance);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (collectorMapInstance) {
                    collectorMapInstance.setView([pos.coords.latitude, pos.coords.longitude], 12);
                }
            },
            () => { /* keep default Bengaluru view */ }
        );
    }

    loadSellListings();
}

async function loadSellListings() {
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabaseClient
                .from('listings')
                .select('*')
                .eq('type', 'sell')
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                allSellListings = data;
            } else {
                allSellListings = getLocalListings('sell');
            }
        } catch (err) {
            console.warn('Supabase fetch failed, using local demo data:', err);
            allSellListings = getLocalListings('sell');
        }
    } else {
        allSellListings = getLocalListings('sell');
    }

    renderFilteredSellListings();
}

function renderFilteredSellListings() {
    const listEl = document.getElementById('sellListings');
    const countEl = document.getElementById('sellListingsCount');
    if (!listEl) return;

    const filtered = allSellListings.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        const matchesCategory = activeSellCategory === 'all' || itemCat === activeSellCategory.toLowerCase();
        const matchesSearch = !sellSearchQuery ||
            (item.title && item.title.toLowerCase().includes(sellSearchQuery)) ||
            (item.category && item.category.toLowerCase().includes(sellSearchQuery)) ||
            (item.area_text && item.area_text.toLowerCase().includes(sellSearchQuery));
        return matchesCategory && matchesSearch;
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} Available Scrap Listing${filtered.length === 1 ? '' : 's'}`;
    }

    // Update map markers
    if (collectorMapInstance) {
        collectorMarkers.forEach(m => collectorMapInstance.removeLayer(m));
        collectorMarkers = [];

        filtered.forEach(item => {
            if (item.latitude && item.longitude) {
                const marker = L.marker([item.latitude, item.longitude]).addTo(collectorMapInstance);
                const catName = CATEGORY_NAMES[item.category] || item.category;
                const popupContent = `
                    <div style="font-family: 'Inter', sans-serif; min-width: 170px;">
                        <span style="display:inline-block; padding: 2px 7px; background:#e8f5e9; color:#2d6a4f; border-radius:12px; font-size:11px; font-weight:700; margin-bottom:4px;">${catName}</span>
                        <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1b4332;">${item.title}</h4>
                        <div style="font-size: 12px; color: #555; margin-bottom: 8px;">
                            <strong>${item.quantity_kg} kg</strong> ${item.price_per_kg ? '• ₹' + item.price_per_kg + '/kg' : '• Negotiable'}
                        </div>
                        <a href="${whatsappLink(item.contact_phone, `Hi! I found your scrap listing (${item.title}) on WasteWise and want to arrange pickup.`)}" target="_blank" rel="noopener" style="display:inline-block; padding: 5px 10px; background:#25D366; color:#fff; border-radius:6px; text-decoration:none; font-size:11px; font-weight:600;">
                            💬 WhatsApp Seller
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);
                collectorMarkers.push(marker);
            }
        });
    }

    // Render list cards
    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="mp-empty-state">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
                <p>No scrap listings match your criteria.</p>
                <button class="btn btn-sm btn-secondary" onclick="document.querySelector('#sellCategoryFilters .mp-filter-pill[data-cat=all]').click(); document.getElementById('sellSearchInput').value='';">Show All Scrap</button>
            </div>`;
        return;
    }

    listEl.innerHTML = '';
    filtered.forEach(item => {
        const estTotal = item.price_per_kg ? Math.round(item.quantity_kg * item.price_per_kg) : null;
        const catName = CATEGORY_NAMES[item.category] || item.category;
        const card = document.createElement('div');
        card.className = 'mp-listing-card';
        card.innerHTML = `
            <div class="mp-listing-img-wrapper">
                ${item.image_url ? `<img src="${item.image_url}" alt="${catName}" class="mp-listing-img" onerror="this.src='https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80'">` : '<div class="mp-listing-img mp-listing-img-placeholder">♻️</div>'}
                <span class="mp-listing-badge">${catName}</span>
            </div>
            <div class="mp-listing-info">
                <div class="mp-listing-header">
                    <h4>${item.title}</h4>
                    <span class="mp-listing-qty">${item.quantity_kg} kg</span>
                </div>
                <div class="mp-listing-price-row">
                    <span class="mp-unit-price">${item.price_per_kg ? '₹' + item.price_per_kg + '/kg' : 'Negotiable'}</span>
                    ${estTotal ? `<span class="mp-total-payout">Est. Total: <strong>₹${estTotal.toLocaleString('en-IN')}</strong></span>` : ''}
                </div>
                ${item.area_text ? `<div class="mp-listing-location">📍 ${item.area_text}</div>` : ''}
                <div class="mp-listing-actions">
                    <a href="${whatsappLink(item.contact_phone, `Hi! I saw your ${catName} (${item.quantity_kg}kg) listing on WasteWise and I would like to arrange pickup.`)}" target="_blank" rel="noopener" class="btn btn-sm btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> Chat on WhatsApp
                    </a>
                </div>
            </div>`;

        if (item.latitude && item.longitude && collectorMapInstance) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                collectorMapInstance.flyTo([item.latitude, item.longitude], 14, { duration: 1.2 });
            });
        }

        listEl.appendChild(card);
    });
}

/* ========== FREE BIG ITEMS WITH FILTERS & SEARCH ========== */
let allFreeItems = [];
let activeFreeCategory = 'all';
let freeSearchQuery = '';

function initFreeFilters() {
    const filterPills = document.querySelectorAll('#freeCategoryFilters .mp-filter-pill');
    const searchInput = document.getElementById('freeSearchInput');

    filterPills.forEach(btn => {
        btn.addEventListener('click', () => {
            filterPills.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFreeCategory = btn.dataset.cat || 'all';
            renderFilteredFreeItems();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            freeSearchQuery = e.target.value.toLowerCase().trim();
            renderFilteredFreeItems();
        });
    }
}

function initFreeItemForm() {
    const form = document.getElementById('freeItemForm');
    if (!form) return;
    const msgEl = document.getElementById('freeItemFormMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('freeItemSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting Free Item…';

        const name = document.getElementById('freeItemName').value.trim();
        const category = document.getElementById('freeItemCategory').value;
        const area = document.getElementById('freeItemArea').value.trim();
        const phone = document.getElementById('freeItemPhone').value.trim();
        const photoFile = document.getElementById('freeItemPhoto').files[0];

        try {
            const imageUrl = await uploadListingImage(photoFile, 'free');

            const newItem = {
                id: 'free-' + Date.now(),
                type: 'free',
                category,
                title: name,
                area_text: area,
                image_url: imageUrl || 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80',
                contact_phone: phone,
                status: 'available',
                created_at: new Date().toISOString()
            };

            if (isSupabaseConfigured()) {
                const { error } = await supabaseClient.from('listings').insert(newItem);
                if (error) throw error;
            } else {
                addLocalListing('free', newItem);
            }

            msgEl.textContent = '🎉 Item posted! Neighbors can now contact you on WhatsApp to claim and reuse it.';
            msgEl.className = 'mp-form-msg mp-success';
            form.reset();

            const previewContainer = document.getElementById('freeDropPreview');
            if (previewContainer) previewContainer.style.display = 'none';
            const prompt = document.getElementById('freeDropPrompt');
            if (prompt) prompt.style.display = 'block';

            loadFreeItems();
        } catch (err) {
            console.error('Free item posting error:', err);
            msgEl.textContent = '❌ Something went wrong. Please try again.';
            msgEl.className = 'mp-form-msg mp-error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🎁 Post Item for Free Pickup';
        }
    });
}

function initFreeItemsGrid() {
    loadFreeItems();
}

async function loadFreeItems() {
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabaseClient
                .from('listings')
                .select('*')
                .eq('type', 'free')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                allFreeItems = data;
            } else {
                allFreeItems = getLocalListings('free');
            }
        } catch (err) {
            console.warn('Supabase free items fetch failed, using local demo data:', err);
            allFreeItems = getLocalListings('free');
        }
    } else {
        allFreeItems = getLocalListings('free');
    }

    renderFilteredFreeItems();
}

function renderFilteredFreeItems() {
    const gridEl = document.getElementById('freeItemsGrid');
    const countEl = document.getElementById('freeListingsCount');
    if (!gridEl) return;

    const filtered = allFreeItems.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        const matchesCategory = activeFreeCategory === 'all' || itemCat === activeFreeCategory.toLowerCase();
        const matchesSearch = !freeSearchQuery ||
            (item.title && item.title.toLowerCase().includes(freeSearchQuery)) ||
            (item.category && item.category.toLowerCase().includes(freeSearchQuery)) ||
            (item.area_text && item.area_text.toLowerCase().includes(freeSearchQuery));
        return matchesCategory && matchesSearch;
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} Free Item${filtered.length === 1 ? '' : 's'} Available`;
    }

    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div class="mp-empty-state" style="grid-column: 1 / -1;">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🎁</div>
                <p>No free items match your selected filter.</p>
                <button class="btn btn-sm btn-secondary" onclick="document.querySelector('#freeCategoryFilters .mp-filter-pill[data-cat=all]').click(); document.getElementById('freeSearchInput').value='';">View All Free Items</button>
            </div>`;
        return;
    }

    gridEl.innerHTML = '';
    filtered.forEach(item => {
        const claimed = item.status === 'claimed';
        const catName = CATEGORY_NAMES[item.category] || item.category;
        const card = document.createElement('div');
        card.className = 'free-item-card' + (claimed ? ' claimed' : '');
        card.innerHTML = `
            <div class="free-item-img-container">
                <img src="${item.image_url}" alt="${item.title}" class="free-item-img" onerror="this.src='https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80'">
                <span class="free-item-badge">${catName}</span>
                <span class="free-item-cost-tag">FREE</span>
            </div>
            <div class="free-item-body">
                <h4 class="free-item-title">${item.title}</h4>
                <div class="free-item-location">
                    <i class="fas fa-map-marker-alt"></i> ${item.area_text || 'Bangalore'}
                </div>
                <div class="free-item-footer">
                    ${claimed
                        ? '<span class="free-item-claimed-label"><i class="fas fa-check-circle"></i> Claimed & Reused</span>'
                        : `<a href="${whatsappLink(item.contact_phone, `Hi! I saw the "${item.title}" you listed for FREE on WasteWise. Is it still available for pickup?`)}" target="_blank" rel="noopener" class="btn btn-sm btn-whatsapp">
                            <i class="fab fa-whatsapp"></i> Claim via WhatsApp
                           </a>`
                    }
                </div>
            </div>`;
        gridEl.appendChild(card);
    });
}
