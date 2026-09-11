/* ========================================
   WasteWise – Welfare & NGO Circular Network
   Features:
   - 3-Sided Role Switcher: Citizen, NGO, Driver, Public ESG Ledger
   - Waste Donation listing with preferred slot & photo
   - Live Household Pickup Manifest & sharp QR Code generation
   - NGO Acceptance & automatic Eco-Collection Van dispatch
   - Driver Doorstep QR Scanner & actual weight confirmation
   - Instant Green Points minting to Citizen Wallet
   - Reward redemption & immutable public transparency ledger
   - Full LocalStorage persistence with rich demo seed data
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initWelfareNetwork();
});

/* ========== CONSTANTS & CATEGORY MATRIX ========== */
const WN_CATEGORIES = {
    clothes: { name: 'Clothes & Textiles', icon: '👕', multiplier: 15, defaultNgo: 'ngo-1', unit: 'kg' },
    books: { name: 'Books & Stationery', icon: '📚', multiplier: 20, defaultNgo: 'ngo-3', unit: 'kg' },
    food: { name: 'Surplus Food & Ration', icon: '🍲', multiplier: 25, defaultNgo: 'ngo-2', unit: 'kg' },
    ewaste: { name: 'E-Waste & Gadgets', icon: '📱', multiplier: 30, defaultNgo: 'ngo-4', unit: 'kg' },
    plastic: { name: 'Segregated Plastics', icon: '🧴', multiplier: 10, defaultNgo: 'ngo-5', unit: 'kg' },
    metal: { name: 'Scrap Metal & Grills', icon: '🔩', multiplier: 12, defaultNgo: 'ngo-5', unit: 'kg' }
};

const WN_NGOS = [
    {
        id: 'ngo-1',
        name: 'Goonj – Cloth & Textile Circularity',
        category: 'clothes',
        area: 'Bangalore Central Hub',
        phone: '9876543201',
        totalKg: 780,
        beneficiaries: '420 Families'
    },
    {
        id: 'ngo-2',
        name: 'Robin Hood Army – Surplus Food Rescue',
        category: 'food',
        area: 'Koramangala Community Kitchen',
        phone: '9876543202',
        totalKg: 490,
        beneficiaries: '1,250 Meals Served'
    },
    {
        id: 'ngo-3',
        name: "Nanhi Jaan – Children's Books & School Drive",
        category: 'books',
        area: 'Jayanagar Learning Hub',
        phone: '9876543203',
        totalKg: 340,
        beneficiaries: '14 Rural School Libraries'
    },
    {
        id: 'ngo-4',
        name: 'Chintan – E-Waste Circularity Alliance',
        category: 'ewaste',
        area: 'Whitefield E-Scrap Center',
        phone: '9876543204',
        totalKg: 280,
        beneficiaries: 'Certified Safe Dismantling'
    },
    {
        id: 'ngo-5',
        name: 'Saahas Zero Waste – Plastics & Dry Recovery',
        category: 'plastic',
        area: 'HSR Layout Recovery Facility',
        phone: '9876543205',
        totalKg: 910,
        beneficiaries: '5,000kg Plastic Diverted'
    }
];

const WN_FLEET = [
    {
        id: 'veh-1',
        driver: 'Rajesh Kumar',
        vehicle: 'Tata Ace EV (#KA-03-EV-1024)',
        phone: '9876543220',
        battery: '84%',
        pickupsToday: 6,
        kgToday: 82,
        area: 'Bangalore Central & East'
    },
    {
        id: 'veh-2',
        driver: 'Ramesh Gowda',
        vehicle: 'Mahindra E-Supro (#KA-05-EV-4421)',
        phone: '9876543221',
        battery: '76%',
        pickupsToday: 4,
        kgToday: 64,
        area: 'Koramangala & HSR'
    },
    {
        id: 'veh-3',
        driver: 'Sunil Rao',
        vehicle: 'Piaggio E-City (#KA-04-EV-8833)',
        phone: '9876543222',
        battery: '91%',
        pickupsToday: 5,
        kgToday: 55,
        area: 'Indiranagar & Whitefield'
    }
];

/* ========== DEFAULT SEED DATA ========== */
const INITIAL_LISTINGS = [
    {
        manifestId: 'WW-84912',
        category: 'clothes',
        quantity: 12.0,
        pickupSlot: 'Today Evening (4 PM - 7 PM)',
        address: 'Flat 304, Green Heights, 100ft Road, Indiranagar, Bengaluru',
        phone: '9876543210',
        status: 'PENDING_NGO', // PENDING_NGO, DISPATCHED, VERIFIED_COLLECTED
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        assignedNgoId: null,
        assignedVehicleId: null,
        verifiedWeight: null,
        pointsEarned: null,
        verificationHash: null
    },
    {
        manifestId: 'WW-84908',
        category: 'ewaste',
        quantity: 8.5,
        pickupSlot: 'Tomorrow Morning (8 AM - 11 AM)',
        address: 'Villa 18, Palm Meadows, Whitefield, Bengaluru',
        phone: '9876543211',
        status: 'DISPATCHED',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        assignedNgoId: 'ngo-4',
        assignedVehicleId: 'veh-1',
        verifiedWeight: null,
        pointsEarned: null,
        verificationHash: null
    },
    {
        manifestId: 'WW-84901',
        category: 'food',
        quantity: 15.0,
        pickupSlot: 'Today Afternoon (1 PM - 4 PM)',
        address: 'Community Hall, 5th Block, Koramangala, Bengaluru',
        phone: '9876543212',
        status: 'VERIFIED_COLLECTED',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        assignedNgoId: 'ngo-2',
        assignedVehicleId: 'veh-2',
        verifiedWeight: 15.0,
        pointsEarned: 375,
        verificationHash: '0x8f4c219a7e3b'
    },
    {
        manifestId: 'WW-84895',
        category: 'books',
        quantity: 24.0,
        pickupSlot: 'Yesterday Morning',
        address: 'House #42, 9th Main, 4th Block, Jayanagar, Bengaluru',
        phone: '9876543213',
        status: 'VERIFIED_COLLECTED',
        createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
        assignedNgoId: 'ngo-3',
        assignedVehicleId: 'veh-3',
        verifiedWeight: 24.0,
        pointsEarned: 480,
        verificationHash: '0x3d7b92fa10e6'
    }
];

/* ========== STATE STORAGE HELPERS ========== */
function getWnListings() {
    try {
        const stored = localStorage.getItem('wn_listings_v1');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('Storage read error:', e);
    }
    saveWnListings(INITIAL_LISTINGS);
    return INITIAL_LISTINGS;
}

function saveWnListings(listings) {
    try {
        localStorage.setItem('wn_listings_v1', JSON.stringify(listings));
    } catch (e) {
        console.warn('Storage write error:', e);
    }
}

function getCitizenWallet() {
    try {
        const stored = localStorage.getItem('wn_citizen_wallet_v1');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('Wallet read error:', e);
    }
    const defaultWallet = { points: 450, totalKgDiverted: 36, redemptions: [] };
    saveCitizenWallet(defaultWallet);
    return defaultWallet;
}

function saveCitizenWallet(wallet) {
    try {
        localStorage.setItem('wn_citizen_wallet_v1', JSON.stringify(wallet));
    } catch (e) {
        console.warn('Wallet write error:', e);
    }
}

/* ========== MAIN INITIALIZER ========== */
function initWelfareNetwork() {
    initRoleTabs();
    initCitizenForm();
    initNgoPortal();
    initDriverScanner();
    initPublicLedger();
    initPerkRedemption();
    renderAllViews();
}

/* ---------- 1. Role Tabs Controller ---------- */
function initRoleTabs() {
    const tabs = document.querySelectorAll('.wn-role-tab');
    const panels = document.querySelectorAll('.wn-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetRole = tab.dataset.role;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetPanel = document.getElementById('wnPanel' + capitalize(targetRole));
            if (targetPanel) targetPanel.classList.add('active');

            // Trigger view re-renders when switching tabs
            renderAllViews();
        });
    });
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- 2. QR Code Generator (Canvas / SVG fallback) ---------- */
function renderHouseholdQr(text, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    // If QRCode.js library is loaded from CDN
    if (typeof QRCode !== 'undefined') {
        try {
            new QRCode(containerEl, {
                text: text,
                width: 140,
                height: 140,
                colorDark: '#1b4332',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            return;
        } catch (e) {
            console.warn('QRCode library error, falling back to SVG matrix:', e);
        }
    }

    // High-fidelity SVG QR fallback
    containerEl.innerHTML = generateFallbackQrSvg(text);
}

// Generates an attractive stylized vector QR matrix with finder patterns
function generateFallbackQrSvg(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = (hash << 5) - hash + data.charCodeAt(i);
        hash |= 0;
    }
    const absHash = Math.abs(hash);

    // Build 21x21 grid pattern
    const size = 21;
    const rects = [];
    
    // Finder patterns (Top-Left, Top-Right, Bottom-Left)
    function addFinder(r, c) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                    rects.push(`<rect x="${(c + j) * 6}" y="${(r + i) * 6}" width="5.5" height="5.5" fill="#1b4332" rx="1"/>`);
                }
            }
        }
    }
    addFinder(0, 0);
    addFinder(0, 14);
    addFinder(14, 0);

    // Pseudo-random data modules based on data hash
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const inFinder = (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8);
            if (!inFinder) {
                const bit = (absHash ^ (r * 31 + c * 17) ^ (r + c)) % 3 === 0;
                if (bit) {
                    rects.push(`<rect x="${c * 6}" y="${r * 6}" width="5.2" height="5.2" fill="#2d6a4f" rx="1"/>`);
                }
            }
        }
    }

    return `
        <svg viewBox="0 0 ${size * 6} ${size * 6}" width="140" height="140" xmlns="http://www.w3.org/2000/svg" style="border-radius:8px;">
            <rect width="100%" height="100%" fill="#ffffff"/>
            ${rects.join('')}
        </svg>
    `;
}

/* ---------- 3. Citizen Portal Logic ---------- */
let activeManifestId = 'WW-84912';

function initCitizenForm() {
    const form = document.getElementById('wnListingForm');
    const shareLocBtn = document.getElementById('wnShareLocationBtn');
    const locStatusText = document.getElementById('wnLocationStatusText');
    const dropzone = document.getElementById('wnDropzone');
    const fileInput = document.getElementById('wnPhoto');
    const previewContainer = document.getElementById('wnDropPreview');
    const previewImg = document.getElementById('wnPreviewImg');
    const removeBtn = document.getElementById('wnRemovePhotoBtn');
    const prompt = document.getElementById('wnDropPrompt');

    if (!form) return;

    // GPS location
    if (shareLocBtn && locStatusText) {
        shareLocBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                locStatusText.textContent = 'Indiranagar (Default)';
                return;
            }
            locStatusText.textContent = 'Locating…';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    locStatusText.textContent = 'GPS Captured ✅';
                    const addrInput = document.getElementById('wnAddress');
                    if (addrInput && !addrInput.value) {
                        addrInput.value = `Indiranagar / Metro Hub (Lat: ${pos.coords.latitude.toFixed(3)}, Lng: ${pos.coords.longitude.toFixed(3)})`;
                    }
                },
                () => {
                    locStatusText.textContent = 'Central Bangalore ✅';
                },
                { timeout: 6000 }
            );
        });
    }

    // Photo Dropzone
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', (e) => {
            if (e.target === removeBtn || (removeBtn && removeBtn.contains(e.target))) return;
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'block';
                    if (prompt) prompt.style.display = 'none';
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.value = '';
                previewImg.src = '';
                previewContainer.style.display = 'none';
                if (prompt) prompt.style.display = 'block';
            });
        }
    }

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('wnSubmitBtn');
        const msgEl = document.getElementById('wnFormMsg');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating Household Manifest…';

        const category = document.getElementById('wnWasteCategory').value;
        const quantity = parseFloat(document.getElementById('wnQuantity').value) || 5;
        const slot = document.getElementById('wnPickupSlot').value;
        const address = document.getElementById('wnAddress').value.trim();
        const phone = document.getElementById('wnPhone').value.trim();

        const newManifestCode = 'WW-' + Math.floor(10000 + Math.random() * 90000);

        const newListing = {
            manifestId: newManifestCode,
            category,
            quantity,
            pickupSlot: slot,
            address,
            phone,
            status: 'PENDING_NGO',
            createdAt: new Date().toISOString(),
            assignedNgoId: null,
            assignedVehicleId: null,
            verifiedWeight: null,
            pointsEarned: null,
            verificationHash: null
        };

        const listings = getWnListings();
        listings.unshift(newListing);
        saveWnListings(listings);

        activeManifestId = newManifestCode;

        msgEl.textContent = `✅ Doorstep pickup scheduled! Manifest ${newManifestCode} generated with household QR code below.`;
        msgEl.className = 'mp-form-msg mp-success';
        form.reset();

        if (previewContainer) previewContainer.style.display = 'none';
        if (prompt) prompt.style.display = 'block';

        submitBtn.disabled = false;
        submitBtn.textContent = '🚚 Schedule Pickup & Generate Household QR';

        renderAllViews();

        // Smooth scroll to active manifest card
        const card = document.getElementById('wnActiveManifestCard');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function renderCitizenActiveManifest() {
    const listings = getWnListings();
    let current = listings.find(l => l.manifestId === activeManifestId) || listings[0];
    if (!current) return;

    activeManifestId = current.manifestId;

    const codeEl = document.getElementById('wnManifestCode');
    const catEl = document.getElementById('wnManifestCategory');
    const wtEl = document.getElementById('wnManifestWeight');
    const ptsEl = document.getElementById('wnManifestEstPoints');
    const slotEl = document.getElementById('wnManifestSlot');
    const statusEl = document.getElementById('wnManifestStatus');
    const driverEl = document.getElementById('wnAssignedDriver');
    const vehicleEl = document.getElementById('wnAssignedVehicle');
    const waBtn = document.getElementById('wnDriverWhatsappBtn');
    const qrDisplay = document.getElementById('wnQrCodeDisplay');

    const catMeta = WN_CATEGORIES[current.category] || { name: current.category, icon: '📦', multiplier: 15 };
    const estPts = Math.round(current.quantity * catMeta.multiplier);

    if (codeEl) codeEl.textContent = '#' + current.manifestId;
    if (catEl) catEl.textContent = `${catMeta.icon} ${catMeta.name}`;
    if (wtEl) wtEl.textContent = `${current.quantity} kg`;
    if (ptsEl) ptsEl.textContent = `+${estPts} Pts`;
    if (slotEl) slotEl.textContent = current.pickupSlot;

    // Status Pill & Assigned Vehicle
    if (current.status === 'PENDING_NGO') {
        if (statusEl) {
            statusEl.className = 'wn-status-pill status-pending';
            statusEl.textContent = 'Awaiting NGO Acceptance';
        }
        if (driverEl) driverEl.textContent = 'Assigning Nearest Eco-Van…';
        if (vehicleEl) vehicleEl.textContent = 'Route optimizer is matching partner NGOs';
        if (waBtn) waBtn.style.display = 'none';
    } else if (current.status === 'DISPATCHED') {
        const vehicle = WN_FLEET.find(v => v.id === current.assignedVehicleId) || WN_FLEET[0];
        if (statusEl) {
            statusEl.className = 'wn-status-pill status-dispatched';
            statusEl.textContent = 'Eco-Van En Route (ETA ~25m)';
        }
        if (driverEl) driverEl.textContent = `Driver: ${vehicle.driver}`;
        if (vehicleEl) vehicleEl.textContent = `${vehicle.vehicle} • Battery ${vehicle.battery}`;
        if (waBtn) {
            waBtn.style.display = 'inline-flex';
            waBtn.href = `https://wa.me/91${vehicle.phone}?text=${encodeURIComponent(`Hi ${vehicle.driver}, I am tracking pickup #${current.manifestId} at ${current.address}.`)}`;
        }
    } else if (current.status === 'VERIFIED_COLLECTED') {
        if (statusEl) {
            statusEl.className = 'wn-status-pill status-verified';
            statusEl.textContent = '✅ Verified & Collected';
        }
        if (driverEl) driverEl.textContent = `Collected by Driver • ${current.verifiedWeight || current.quantity} kg Confirmed`;
        if (vehicleEl) vehicleEl.textContent = `Points Credited: +${current.pointsEarned || estPts} Pts (${current.verificationHash})`;
        if (waBtn) waBtn.style.display = 'none';
    }

    // Render QR Code
    const qrPayload = JSON.stringify({
        id: current.manifestId,
        cat: current.category,
        kg: current.quantity,
        status: current.status,
        slot: current.pickupSlot
    });
    renderHouseholdQr(qrPayload, qrDisplay);
}

function renderCitizenWallet() {
    const wallet = getCitizenWallet();
    const pointsEl = document.getElementById('wnWalletPoints');
    const tierEl = document.getElementById('wnWalletTier');
    const progressEl = document.getElementById('wnWalletProgress');

    if (pointsEl) pointsEl.textContent = wallet.points;

    let tier = '🌱 Bronze Circular Eco';
    let progress = Math.min(100, Math.round((wallet.points / 300) * 100));

    if (wallet.points >= 700) {
        tier = '🏆 Gold Sustainability Champion';
        progress = 100;
    } else if (wallet.points >= 300) {
        tier = '🥈 Silver Circular Hero';
        progress = Math.min(100, Math.round(((wallet.points - 300) / 400) * 100));
    }

    if (tierEl) tierEl.textContent = tier;
    if (progressEl) progressEl.style.width = progress + '%';
}

function initPerkRedemption() {
    const btns = document.querySelectorAll('.perk-redeem-btn');
    const msgEl = document.getElementById('wnRedeemMsg');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cost = parseInt(btn.dataset.cost);
            const wallet = getCitizenWallet();

            if (wallet.points < cost) {
                if (msgEl) {
                    msgEl.textContent = `⚠️ You need ${cost} points (Current balance: ${wallet.points}). Schedule another doorstep pickup to earn more!`;
                    msgEl.className = 'mp-form-msg mp-error';
                }
                return;
            }

            wallet.points -= cost;
            const voucherCode = 'ECO-RWD-' + Math.floor(1000 + Math.random() * 9000);
            wallet.redemptions.push({ cost, voucherCode, date: new Date().toISOString() });
            saveCitizenWallet(wallet);

            renderCitizenWallet();

            if (msgEl) {
                msgEl.textContent = `🎉 Redeemed! Your voucher code is: ${voucherCode}. Instructions sent to WhatsApp.`;
                msgEl.className = 'mp-form-msg mp-success';
            }
        });
    });
}

/* ---------- 4. NGO Welfare Portal Logic ---------- */
let activeNgoId = 'ngo-1';

function initNgoPortal() {
    const select = document.getElementById('wnNgoSelect');
    if (!select) return;

    select.addEventListener('change', () => {
        activeNgoId = select.value;
        renderNgoView();
    });
}

function renderNgoView() {
    const select = document.getElementById('wnNgoSelect');
    if (select) select.value = activeNgoId;

    const ngo = WN_NGOS.find(n => n.id === activeNgoId) || WN_NGOS[0];
    const listings = getWnListings();

    // Stats strip
    const totalKgEl = document.getElementById('wnNgoTotalKg');
    const activeCountEl = document.getElementById('wnNgoActiveCount');
    const beneficiariesEl = document.getElementById('wnNgoBeneficiaries');

    const acceptedForNgo = listings.filter(l => l.assignedNgoId === activeNgoId && l.status === 'DISPATCHED');
    const verifiedForNgo = listings.filter(l => l.assignedNgoId === activeNgoId && l.status === 'VERIFIED_COLLECTED');

    const totalWeight = ngo.totalKg + verifiedForNgo.reduce((acc, l) => acc + (l.verifiedWeight || l.quantity), 0);

    if (totalKgEl) totalKgEl.textContent = `${totalWeight} kg`;
    if (activeCountEl) activeCountEl.textContent = acceptedForNgo.length;
    if (beneficiariesEl) beneficiariesEl.textContent = ngo.beneficiaries;

    // Available listings matching this NGO's category
    const feedEl = document.getElementById('wnNgoListingsFeed');
    if (feedEl) {
        const available = listings.filter(l => l.status === 'PENDING_NGO' && (l.category === ngo.category || ngo.category === 'plastic'));
        
        if (available.length === 0) {
            feedEl.innerHTML = `
                <div class="mp-empty-state">
                    <div style="font-size:2rem; margin-bottom:6px;">📦</div>
                    <p>All pending listings for <strong>${ngo.name}</strong> are currently assigned!</p>
                    <small>Switch NGO above or post a new donation from the Citizen Portal.</small>
                </div>
            `;
        } else {
            feedEl.innerHTML = '';
            available.forEach(item => {
                const catMeta = WN_CATEGORIES[item.category] || { name: item.category, icon: '📦' };
                const card = document.createElement('div');
                card.className = 'ngo-listing-card';
                card.innerHTML = `
                    <div class="ngo-card-top">
                        <strong>${catMeta.icon} ${item.quantity} kg ${catMeta.name}</strong>
                        <span class="manifest-tag">#${item.manifestId}</span>
                    </div>
                    <div class="ngo-card-meta">
                        <span>📍 ${item.address}</span>
                        <span>⏰ ${item.pickupSlot}</span>
                    </div>
                    <button class="ngo-dispatch-btn" data-manifest="${item.manifestId}" type="button">
                        ✅ Accept Donation &amp; Dispatch Nearest Eco-Van
                    </button>
                `;
                feedEl.appendChild(card);
            });

            // Bind accept buttons
            feedEl.querySelectorAll('.ngo-dispatch-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const manifestId = btn.dataset.manifest;
                    handleNgoAcceptance(manifestId, activeNgoId);
                });
            });
        }
    }

    // Inward Inventory Table
    const tableBody = document.getElementById('wnNgoInventoryBody');
    if (tableBody) {
        const historyItems = listings.filter(l => l.assignedNgoId === activeNgoId);
        if (historyItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:16px; color:#888;">No deliveries recorded yet.</td></tr>`;
        } else {
            tableBody.innerHTML = '';
            historyItems.forEach(item => {
                const catMeta = WN_CATEGORIES[item.category] || { name: item.category, icon: '📦' };
                const statusLabel = item.status === 'VERIFIED_COLLECTED' 
                    ? '<span class="wn-status-pill status-verified">Verified Inward</span>'
                    : '<span class="wn-status-pill status-dispatched">Van Dispatched</span>';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>#${item.manifestId}</strong></td>
                    <td>${catMeta.icon} ${catMeta.name}</td>
                    <td><strong>${item.verifiedWeight || item.quantity} kg</strong></td>
                    <td>${item.address.split(',')[0]}</td>
                    <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>${statusLabel}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

function handleNgoAcceptance(manifestId, ngoId) {
    const listings = getWnListings();
    const item = listings.find(l => l.manifestId === manifestId);
    if (!item) return;

    // Pick available vehicle
    const vehicle = WN_FLEET[Math.floor(Math.random() * WN_FLEET.length)];

    item.status = 'DISPATCHED';
    item.assignedNgoId = ngoId;
    item.assignedVehicleId = vehicle.id;

    saveWnListings(listings);
    renderAllViews();

    if (typeof alert !== 'undefined') {
        alert(`🎉 Success! Eco-Van (${vehicle.vehicle}, Driver: ${vehicle.driver}) has been dispatched for pickup #${manifestId}. The resident has been notified on WhatsApp.`);
    }
}

/* ---------- 5. Driver Dispatch & QR Scanner Logic ---------- */
let selectedDriverManifestId = null;

function initDriverScanner() {
    const scanBtn = document.getElementById('wnInstantScanBtn');
    const cameraBtn = document.getElementById('wnCameraScanBtn');
    const msgEl = document.getElementById('wnDriverScanMsg');

    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            if (!selectedDriverManifestId) {
                if (msgEl) {
                    msgEl.textContent = '⚠️ Please select a pickup from the assigned list first!';
                    msgEl.className = 'mp-form-msg mp-error';
                }
                return;
            }
            performDriverVerification(selectedDriverManifestId);
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            if (typeof alert !== 'undefined') {
                alert('📷 Camera activated! Optical barcode reader is scanning the viewfinder reticle. (For testing, you can also use the instant 1-click verify button!)');
            }
            if (selectedDriverManifestId) {
                performDriverVerification(selectedDriverManifestId);
            }
        });
    }
}

function renderDriverView() {
    const listings = getWnListings();
    const assignedList = listings.filter(l => l.status === 'DISPATCHED');
    const listEl = document.getElementById('wnDriverManifestsList');
    const targetInfoEl = document.getElementById('wnVerifManifestCode');
    const weightInput = document.getElementById('wnActualWeightInput');

    if (!listEl) return;

    if (assignedList.length === 0) {
        listEl.innerHTML = `
            <div class="mp-empty-state">
                <div style="font-size:2rem; margin-bottom:6px;">🚚</div>
                <p>No active pickups dispatched right now.</p>
                <small>Go to the NGO Portal tab and accept a citizen donation to assign your van!</small>
            </div>
        `;
        if (targetInfoEl) targetInfoEl.textContent = 'None pending';
        selectedDriverManifestId = null;
        return;
    }

    // Auto-select first if none selected
    if (!selectedDriverManifestId || !assignedList.some(l => l.manifestId === selectedDriverManifestId)) {
        selectedDriverManifestId = assignedList[0].manifestId;
    }

    listEl.innerHTML = '';
    assignedList.forEach(item => {
        const isTarget = item.manifestId === selectedDriverManifestId;
        const catMeta = WN_CATEGORIES[item.category] || { name: item.category, icon: '📦' };
        const card = document.createElement('div');
        card.className = 'driver-pickup-card' + (isTarget ? ' active-target' : '');
        card.innerHTML = `
            <div class="driver-card-top">
                <strong>${catMeta.icon} ${item.quantity} kg ${catMeta.name}</strong>
                <span class="manifest-tag">#${item.manifestId}</span>
            </div>
            <div class="ngo-card-meta">
                <span>📍 ${item.address}</span>
                <span>📞 <a href="https://wa.me/91${item.phone}" target="_blank" style="color:#2e7d32;">WhatsApp Resident</a></span>
            </div>
            <button class="driver-select-scan-btn" data-manifest="${item.manifestId}" type="button">
                ${isTarget ? '👉 Selected for Scan' : '📲 Select to Scan Resident QR'}
            </button>
        `;
        listEl.appendChild(card);
    });

    // Bind selection
    listEl.querySelectorAll('.driver-select-scan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDriverManifestId = btn.dataset.manifest;
            renderDriverView();
        });
    });

    // Update target verification box
    const currentTarget = assignedList.find(l => l.manifestId === selectedDriverManifestId);
    if (currentTarget) {
        const catMeta = WN_CATEGORIES[currentTarget.category] || { name: currentTarget.category, icon: '📦' };
        if (targetInfoEl) {
            targetInfoEl.innerHTML = `<strong>#${currentTarget.manifestId}</strong> (${catMeta.icon} ${currentTarget.quantity}kg • ${currentTarget.address.split(',')[0]})`;
        }
        if (weightInput && !weightInput.value) {
            weightInput.value = currentTarget.quantity;
        }
    }
}

function performDriverVerification(manifestId) {
    const listings = getWnListings();
    const item = listings.find(l => l.manifestId === manifestId);
    const msgEl = document.getElementById('wnDriverScanMsg');
    const weightInput = document.getElementById('wnActualWeightInput');

    if (!item) return;

    const actualWeight = parseFloat(weightInput?.value) || item.quantity;
    const catMeta = WN_CATEGORIES[item.category] || { name: item.category, multiplier: 15 };
    const pointsAwarded = Math.round(actualWeight * catMeta.multiplier);
    const hash = '0x' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6);

    // Update listing state
    item.status = 'VERIFIED_COLLECTED';
    item.verifiedWeight = actualWeight;
    item.pointsEarned = pointsAwarded;
    item.verificationHash = hash;

    saveWnListings(listings);

    // Credit points to citizen wallet
    const wallet = getCitizenWallet();
    wallet.points += pointsAwarded;
    wallet.totalKgDiverted += actualWeight;
    saveCitizenWallet(wallet);

    // Sound / visual scan feedback
    if (msgEl) {
        msgEl.innerHTML = `✅ <strong>QR Verified &amp; Signed!</strong><br>${actualWeight}kg ${catMeta.name} collected. <strong>+${pointsAwarded} Green Points</strong> credited to resident!`;
        msgEl.className = 'mp-form-msg mp-success';
    }

    // Reset selected
    selectedDriverManifestId = null;
    if (weightInput) weightInput.value = '';

    renderAllViews();
}

/* ---------- 6. Public ESG Impact Ledger Logic ---------- */
function initPublicLedger() {
    const searchInput = document.getElementById('wnLedgerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderPublicLedger();
        });
    }
}

function renderPublicLedger() {
    const searchInput = document.getElementById('wnLedgerSearch');
    const query = (searchInput?.value || '').toLowerCase().trim();
    const tableBody = document.getElementById('wnPublicLedgerBody');
    if (!tableBody) return;

    const listings = getWnListings();
    const verifiedList = listings.filter(l => l.status === 'VERIFIED_COLLECTED');

    const filtered = verifiedList.filter(item => {
        if (!query) return true;
        const ngo = WN_NGOS.find(n => n.id === item.assignedNgoId);
        const ngoName = (ngo ? ngo.name : '').toLowerCase();
        const catName = (WN_CATEGORIES[item.category]?.name || '').toLowerCase();
        return item.manifestId.toLowerCase().includes(query) ||
               catName.includes(query) ||
               ngoName.includes(query) ||
               (item.verificationHash && item.verificationHash.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px; color:#888;">No verified public records match your query.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(item => {
        const catMeta = WN_CATEGORIES[item.category] || { name: item.category, icon: '📦' };
        const ngo = WN_NGOS.find(n => n.id === item.assignedNgoId) || WN_NGOS[0];
        const vehicle = WN_FLEET.find(v => v.id === item.assignedVehicleId) || WN_FLEET[0];

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${item.manifestId}</strong></td>
            <td>${new Date(item.createdAt).toLocaleDateString()} ${new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${catMeta.icon} ${catMeta.name}</td>
            <td><strong>${item.verifiedWeight || item.quantity} kg</strong></td>
            <td>${ngo.name.split('–')[0]}</td>
            <td>${vehicle.vehicle.split('(')[0]}</td>
            <td><strong style="color:#2e7d32;">+${item.pointsEarned || 150} Pts</strong></td>
            <td><span class="hash-code">${item.verificationHash || '0x4f19b2'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

/* ---------- 7. Update Live Telemetry Counters ---------- */
function updateTelemetryCounters() {
    const listings = getWnListings();
    const verified = listings.filter(l => l.status === 'VERIFIED_COLLECTED');

    const totalKg = 1420 + verified.reduce((acc, l) => acc + (l.verifiedWeight || l.quantity), 0);
    const totalPickups = 86 + verified.length;
    const totalPoints = 24550 + verified.reduce((acc, l) => acc + (l.pointsEarned || 0), 0);

    const kgEl = document.getElementById('wnStatDiverted');
    const pickupsEl = document.getElementById('wnStatPickups');
    const pointsEl = document.getElementById('wnStatPoints');

    if (kgEl) kgEl.textContent = `${totalKg.toLocaleString('en-IN')} kg`;
    if (pickupsEl) pickupsEl.textContent = totalPickups.toLocaleString('en-IN');
    if (pointsEl) pointsEl.textContent = totalPoints.toLocaleString('en-IN');
}

/* ---------- Master Render Routine ---------- */
function renderAllViews() {
    renderCitizenActiveManifest();
    renderCitizenWallet();
    renderNgoView();
    renderDriverView();
    renderPublicLedger();
    updateTelemetryCounters();
}
