/* ========================================
   WasteWise – Marketplace & Free Items
   Requires: supabase-client.js, Leaflet.js (loaded in index.html)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSellWasteForm();
    initCollectorMap();
    initFreeItemForm();
    initFreeItemsGrid();
});

/* ---------- Shared helpers ---------- */

// Upload a File to Supabase Storage bucket "listings", return its public URL (or null)
async function uploadListingImage(file, folder) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabaseClient.storage.from('listings').upload(path, file);
    if (error) {
        console.error('Image upload failed:', error);
        return null;
    }
    const { data } = supabaseClient.storage.from('listings').getPublicUrl(path);
    return data.publicUrl;
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function whatsappLink(phone, message) {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/* ========== SELL WASTE FORM ========== */
function initSellWasteForm() {
    const form = document.getElementById('sellWasteForm');
    if (!form) return;

    const shareBtn = document.getElementById('shareLocationBtn');
    const statusEl = document.getElementById('locationStatus');
    const msgEl = document.getElementById('sellFormMsg');
    let capturedLocation = null;

    shareBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            statusEl.textContent = '⚠️ Geolocation not supported on this browser.';
            return;
        }
        statusEl.textContent = '📡 Getting your location…';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                capturedLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                statusEl.textContent = `✅ Location shared (accuracy ~${Math.round(pos.coords.accuracy)}m)`;
                statusEl.classList.add('mp-location-ok');
            },
            (err) => {
                statusEl.textContent = '❌ Could not get location: ' + err.message;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!capturedLocation) {
            msgEl.textContent = '⚠️ Please share your location before listing.';
            msgEl.className = 'mp-form-msg mp-error';
            return;
        }

        const submitBtn = document.getElementById('sellSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting…';

        const wasteType = document.getElementById('sellWasteType').value;
        const quantity = parseFloat(document.getElementById('sellQuantity').value);
        const price = parseFloat(document.getElementById('sellPrice').value) || null;
        const phone = document.getElementById('sellPhone').value.trim();
        const photoFile = document.getElementById('sellPhoto').files[0];

        try {
            const imageUrl = await uploadListingImage(photoFile, 'sell');

            const { error } = await supabaseClient.from('listings').insert({
                type: 'sell',
                category: wasteType,
                title: `${quantity}kg ${wasteType}`,
                quantity_kg: quantity,
                price_per_kg: price,
                image_url: imageUrl,
                latitude: capturedLocation.lat,
                longitude: capturedLocation.lng,
                contact_phone: phone,
                status: 'available'
            });

            if (error) throw error;

            msgEl.textContent = '✅ Listed! Collectors nearby can now see and contact you.';
            msgEl.className = 'mp-form-msg mp-success';
            form.reset();
            statusEl.textContent = 'Location not shared yet';
            statusEl.classList.remove('mp-location-ok');
            capturedLocation = null;
            loadSellListings(); // refresh map + list
        } catch (err) {
            console.error(err);
            msgEl.textContent = '❌ Something went wrong. Please try again.';
            msgEl.className = 'mp-form-msg mp-error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'List for Pickup';
        }
    });
}

/* ========== COLLECTOR MAP + LISTINGS ========== */
let collectorMapInstance = null;
let collectorMarkers = [];

function initCollectorMap() {
    const mapEl = document.getElementById('collectorMap');
    if (!mapEl) return;

    collectorMapInstance = L.map('collectorMap').setView([20.5937, 78.9629], 5); // default: India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(collectorMapInstance);

    // Try to center on the viewer's own location (non-blocking)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => collectorMapInstance.setView([pos.coords.latitude, pos.coords.longitude], 12),
            () => { /* ignore — keep default view */ }
        );
    }

    loadSellListings();
}

async function loadSellListings() {
    const listEl = document.getElementById('sellListings');
    if (!listEl) return;

    const { data, error } = await supabaseClient
        .from('listings')
        .select('*')
        .eq('type', 'sell')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

    if (error) {
        listEl.innerHTML = '<p class="mp-empty-state">Could not load listings.</p>';
        console.error(error);
        return;
    }

    // Clear old markers
    collectorMarkers.forEach(m => collectorMapInstance.removeLayer(m));
    collectorMarkers = [];

    if (!data || data.length === 0) {
        listEl.innerHTML = '<p class="mp-empty-state">No listings yet — be the first to list your waste!</p>';
        return;
    }

    listEl.innerHTML = '';
    data.forEach(item => {
        // Map marker
        if (item.latitude && item.longitude) {
            const marker = L.marker([item.latitude, item.longitude]).addTo(collectorMapInstance);
            marker.bindPopup(`<strong>${item.title}</strong><br>${item.quantity_kg}kg ${item.category}${item.price_per_kg ? ' • ₹' + item.price_per_kg + '/kg' : ''}`);
            collectorMarkers.push(marker);
        }

        // List card
        const card = document.createElement('div');
        card.className = 'mp-listing-card';
        card.innerHTML = `
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.category}" class="mp-listing-img">` : '<div class="mp-listing-img mp-listing-img-placeholder">🗑️</div>'}
            <div class="mp-listing-info">
                <strong>${item.quantity_kg}kg — ${item.category}</strong>
                <span>${item.price_per_kg ? '₹' + item.price_per_kg + '/kg expected' : 'Price negotiable'}</span>
                <a href="${whatsappLink(item.contact_phone, `Hi! I saw your ${item.category} listing on WasteWise and I'd like to collect it.`)}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">💬 Contact on WhatsApp</a>
            </div>`;
        listEl.appendChild(card);
    });
}

/* ========== FREE BIG ITEMS ========== */
function initFreeItemForm() {
    const form = document.getElementById('freeItemForm');
    if (!form) return;
    const msgEl = document.getElementById('freeItemFormMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('freeItemSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting…';

        const name = document.getElementById('freeItemName').value.trim();
        const category = document.getElementById('freeItemCategory').value;
        const area = document.getElementById('freeItemArea').value.trim();
        const phone = document.getElementById('freeItemPhone').value.trim();
        const photoFile = document.getElementById('freeItemPhoto').files[0];

        if (!photoFile) {
            msgEl.textContent = '⚠️ A photo is required.';
            msgEl.className = 'mp-form-msg mp-error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Item';
            return;
        }

        try {
            const imageUrl = await uploadListingImage(photoFile, 'free');

            const { error } = await supabaseClient.from('listings').insert({
                type: 'free',
                category,
                title: name,
                area_text: area,
                image_url: imageUrl,
                contact_phone: phone,
                status: 'available'
            });

            if (error) throw error;

            msgEl.textContent = '✅ Posted! Someone nearby might just need it.';
            msgEl.className = 'mp-form-msg mp-success';
            form.reset();
            loadFreeItems();
        } catch (err) {
            console.error(err);
            msgEl.textContent = '❌ Something went wrong. Please try again.';
            msgEl.className = 'mp-form-msg mp-error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Item';
        }
    });
}

function initFreeItemsGrid() {
    if (!document.getElementById('freeItemsGrid')) return;
    loadFreeItems();
}

async function loadFreeItems() {
    const gridEl = document.getElementById('freeItemsGrid');
    if (!gridEl) return;

    const { data, error } = await supabaseClient
        .from('listings')
        .select('*')
        .eq('type', 'free')
        .order('created_at', { ascending: false });

    if (error) {
        gridEl.innerHTML = '<p class="mp-empty-state">Could not load items.</p>';
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        gridEl.innerHTML = '<p class="mp-empty-state">No items posted yet — share something you no longer need!</p>';
        return;
    }

    gridEl.innerHTML = '';
    data.forEach(item => {
        const claimed = item.status === 'claimed';
        const card = document.createElement('div');
        card.className = 'free-item-card' + (claimed ? ' claimed' : '');
        card.innerHTML = `
            <img src="${item.image_url}" alt="${item.title}" class="free-item-img">
            <div class="free-item-body">
                <span class="free-item-badge">${item.category}</span>
                <h4>${item.title}</h4>
                <span class="free-item-location">📍 ${item.area_text}</span>
                ${claimed
                    ? '<span class="free-item-claimed-label">✅ Claimed</span>'
                    : `<a href="${whatsappLink(item.contact_phone, `Hi! I'm interested in the "${item.title}" you posted on WasteWise.`)}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">I'm Interested</a>`
                }
            </div>`;
        gridEl.appendChild(card);
    });
}
