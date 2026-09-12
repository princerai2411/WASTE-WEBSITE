/* ========================================
   WasteWise – Multi-Role Authentication System
   Supports:
   - 3 User Roles: Individual (Citizen), Driver (Staff), NGO / Organization
   - NGO Document Verification with upload dropzone & authenticity certification
   - Session Management in localStorage
   - Dynamic Navbar User Profile, Role Badges & Verified Checkmarks
   - Seamless cross-site synchronization with Welfare Network & Marketplace
   - 1-Click Quick Demo Sign-Ins for testing
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAuthSystem();
});

/* ========== DEFAULT PRE-SEEDED USERS ========== */
const DEFAULT_AUTH_USERS = [
    {
        id: 'usr-citizen-1',
        role: 'individual',
        name: 'Rahul Sharma',
        email: 'rahul@citizen.in',
        phone: '9876543210',
        address: 'Flat 304, Green Heights, Indiranagar, Bengaluru',
        password: 'password123',
        verified: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'usr-driver-1',
        role: 'driver',
        name: 'Rajesh Kumar',
        email: 'rajesh.driver@wastewise.in',
        phone: '9876543220',
        staffId: 'WW-STAFF-1024',
        vehicleNo: 'Tata Ace EV (#KA-03-EV-1024)',
        licenseNo: 'KA-04-2019-008491',
        password: 'password123',
        verified: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'usr-ngo-1',
        role: 'ngo',
        name: 'Anita Deshmukh',
        orgName: 'Goonj – Cloth & Textile Circularity',
        email: 'contact@goonj.org',
        phone: '9876543201',
        darpanId: 'DL/2018/019284',
        domain: 'clothes',
        docName: 'Goonj_80G_Darpan_Registration_Certificate.pdf',
        password: 'password123',
        verified: true,
        docVerified: true,
        createdAt: new Date().toISOString()
    }
];

/* ========== STORAGE HELPERS ========== */
function getAllUsers() {
    try {
        const stored = localStorage.getItem('wastewise_all_users');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('Storage read error:', e);
    }
    saveAllUsers(DEFAULT_AUTH_USERS);
    return DEFAULT_AUTH_USERS;
}

function saveAllUsers(users) {
    try {
        localStorage.setItem('wastewise_all_users', JSON.stringify(users));
    } catch (e) {
        console.warn('Storage write error:', e);
    }
}

function getCurrentUser() {
    try {
        const stored = localStorage.getItem('wastewise_user_session');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('Session read error:', e);
    }
    return null;
}

function setCurrentUser(user) {
    try {
        if (user) {
            localStorage.setItem('wastewise_user_session', JSON.stringify(user));
        } else {
            localStorage.removeItem('wastewise_user_session');
        }
    } catch (e) {
        console.warn('Session save error:', e);
    }
    updateNavAuthState();
    syncUserWithSite(user);
}

/* ========== AUTH STATE CONTROLLER ========== */
let authMode = 'login'; // 'login' | 'register'
let authRole = 'individual'; // 'individual' | 'driver' | 'ngo'
let uploadedNgoDoc = null; // { name, size, dataUrl, verified }

function initAuthSystem() {
    initNavTriggers();
    initModalControls();
    initModeAndRoleTabs();
    initDemoLogins();
    initAuthFormSubmit();
    updateNavAuthState();

    // If an active session exists, sync with site components
    const currentUser = getCurrentUser();
    if (currentUser) {
        syncUserWithSite(currentUser);
    }
}

/* ---------- 1. Navbar Triggers & Dropdown ---------- */
function initNavTriggers() {
    const openBtn = document.getElementById('openAuthModalBtn');
    const badgeBtn = document.getElementById('userBadgeBtn');
    const dropdown = document.getElementById('userDropdownContent');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardBtn = document.getElementById('goToDashboardBtn');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            openAuthModal('login', 'individual');
        });
    }

    if (badgeBtn && dropdown) {
        badgeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            badgeBtn.setAttribute('aria-expanded', dropdown.classList.contains('show'));
        });

        document.addEventListener('click', (e) => {
            if (!badgeBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                badgeBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setCurrentUser(null);
            if (dropdown) dropdown.classList.remove('show');
            showGlobalToast('👋 You have successfully signed out.');
        });
    }

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            if (dropdown) dropdown.classList.remove('show');
            const user = getCurrentUser();
            navigateToRoleDashboard(user ? user.role : 'individual');
        });
    }
}

function updateNavAuthState() {
    const user = getCurrentUser();
    const openBtn = document.getElementById('openAuthModalBtn');
    const profileMenu = document.getElementById('userProfileMenu');

    if (!user) {
        if (openBtn) openBtn.style.display = 'inline-flex';
        if (profileMenu) profileMenu.style.display = 'none';
        return;
    }

    if (openBtn) openBtn.style.display = 'none';
    if (profileMenu) profileMenu.style.display = 'block';

    const roleIconEl = document.getElementById('navUserRoleIcon');
    const nameEl = document.getElementById('navUserName');
    const fullNameEl = document.getElementById('dropdownFullName');
    const roleDetailEl = document.getElementById('dropdownRoleDetail');
    const statusTagEl = document.getElementById('dropdownStatusTag');

    let displayName = user.name;
    let icon = '🙋';
    let roleTitle = 'Individual Citizen';

    if (user.role === 'driver') {
        displayName = user.name.split(' ')[0] + ' (Staff)';
        icon = '🚚';
        roleTitle = `Driver • ${user.vehicleNo || 'Eco-Van'}`;
    } else if (user.role === 'ngo') {
        displayName = user.orgName ? user.orgName.split('–')[0].trim() : user.name;
        icon = '🏢';
        roleTitle = `NGO • ${user.darpanId || 'Verified Entity'}`;
    }

    if (roleIconEl) roleIconEl.textContent = icon;
    if (nameEl) nameEl.textContent = displayName;
    if (fullNameEl) fullNameEl.textContent = user.orgName || user.name;
    if (roleDetailEl) roleDetailEl.textContent = roleTitle;
    if (statusTagEl) {
        statusTagEl.textContent = user.verified ? 'Verified Active ✓' : 'Pending Verification';
    }
}

/* ---------- 2. Modal Show & Hide ---------- */
function openAuthModal(mode = 'login', role = 'individual') {
    authMode = mode;
    authRole = role;
    uploadedNgoDoc = null;

    const modal = document.getElementById('authModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Clear feedback
    const msgEl = document.getElementById('authFormMsg');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'auth-form-msg';
    }

    updateModalTabsUI();
    renderDynamicFields();
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function initModalControls() {
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const modal = document.getElementById('authModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAuthModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAuthModal();
    });
}

/* ---------- 3. Mode & Role Tabs Controller ---------- */
function initModeAndRoleTabs() {
    const tabLogin = document.getElementById('tabModeLogin');
    const tabRegister = document.getElementById('tabModeRegister');
    const roleCards = document.querySelectorAll('.auth-role-card');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            authMode = 'login';
            updateModalTabsUI();
            renderDynamicFields();
        });

        tabRegister.addEventListener('click', () => {
            authMode = 'register';
            updateModalTabsUI();
            renderDynamicFields();
        });
    }

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            authRole = card.dataset.role;
            updateModalTabsUI();
            renderDynamicFields();
        });
    });
}

function updateModalTabsUI() {
    const tabLogin = document.getElementById('tabModeLogin');
    const tabRegister = document.getElementById('tabModeRegister');
    const roleCards = document.querySelectorAll('.auth-role-card');
    const titleEl = document.getElementById('authModalTitle');
    const subEl = document.getElementById('authModalSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const demoBar = document.getElementById('quickDemoLogins');

    // Mode tabs
    if (tabLogin && tabRegister) {
        tabLogin.classList.toggle('active', authMode === 'login');
        tabRegister.classList.toggle('active', authMode === 'register');
    }

    // Role cards
    roleCards.forEach(card => {
        card.classList.toggle('active', card.dataset.role === authRole);
    });

    // Quick demo logins visible only in login mode
    if (demoBar) {
        demoBar.style.display = authMode === 'login' ? 'block' : 'none';
    }

    if (authMode === 'login') {
        if (titleEl) titleEl.textContent = `Sign In as ${getRoleName(authRole)}`;
        if (subEl) subEl.textContent = 'Enter your credentials or click a demo account below';
        if (submitBtn) submitBtn.textContent = 'Sign In to Portal ➔';
    } else {
        if (titleEl) titleEl.textContent = `Register as ${getRoleName(authRole)}`;
        if (subEl) subEl.textContent = authRole === 'ngo' 
            ? 'List your NGO and upload registration documents for verified partner status'
            : 'Create your account to start recycling, earning points, and managing routes';
        if (submitBtn) submitBtn.textContent = 'Complete Registration & Verify ➔';
    }
}

function getRoleName(role) {
    if (role === 'driver') return 'Driver (Collection Staff)';
    if (role === 'ngo') return 'NGO / Welfare Organization';
    return 'Individual (Citizen)';
}

/* ---------- 4. Dynamic Fields Generator ---------- */
function renderDynamicFields() {
    const container = document.getElementById('authDynamicFields');
    if (!container) return;

    if (authMode === 'login') {
        container.innerHTML = `
            <div class="calc-input-group">
                <label for="authLoginId">${authRole === 'ngo' ? 'NGO Email or Darpan ID' : authRole === 'driver' ? 'Staff ID or Mobile' : 'Email or WhatsApp Number'}</label>
                <input type="text" id="authLoginId" class="mp-text" placeholder="${authRole === 'ngo' ? 'contact@goonj.org or DL/2018/019284' : authRole === 'driver' ? 'WW-STAFF-1024 or 9876543220' : 'rahul@citizen.in or 9876543210'}" required>
            </div>
            <div class="calc-input-group">
                <label for="authPassword">Password</label>
                <input type="password" id="authPassword" class="mp-text" placeholder="••••••••" required value="password123">
            </div>
        `;
        return;
    }

    // Registration Mode Fields
    if (authRole === 'individual') {
        container.innerHTML = `
            <div class="calc-input-group">
                <label for="regName">Full Name</label>
                <input type="text" id="regName" class="mp-text" placeholder="e.g. Rahul Sharma" required>
            </div>
            <div class="mp-row">
                <div class="calc-input-group">
                    <label for="regPhone">WhatsApp Phone</label>
                    <div class="input-with-unit">
                        <span class="input-unit">🇮🇳 +91</span>
                        <input type="tel" id="regPhone" class="mp-text" placeholder="9876543210" pattern="[0-9]{10}" required>
                    </div>
                </div>
                <div class="calc-input-group">
                    <label for="regEmail">Email Address</label>
                    <input type="email" id="regEmail" class="mp-text" placeholder="rahul@example.com" required>
                </div>
            </div>
            <div class="calc-input-group">
                <label for="regAddress">City &amp; Locality</label>
                <input type="text" id="regAddress" class="mp-text" placeholder="e.g. Indiranagar, Bengaluru" required>
            </div>
            <div class="calc-input-group">
                <label for="authPassword">Create Password</label>
                <input type="password" id="authPassword" class="mp-text" placeholder="At least 6 characters" required>
            </div>
        `;
    } else if (authRole === 'driver') {
        container.innerHTML = `
            <div class="calc-input-group">
                <label for="regName">Driver Full Name</label>
                <input type="text" id="regName" class="mp-text" placeholder="e.g. Rajesh Kumar" required>
            </div>
            <div class="mp-row">
                <div class="calc-input-group">
                    <label for="regStaffId">Staff / Employee ID</label>
                    <input type="text" id="regStaffId" class="mp-text" placeholder="e.g. WW-STAFF-2048" required>
                </div>
                <div class="calc-input-group">
                    <label for="regLicenseNo">Commercial Driving License (DL)</label>
                    <input type="text" id="regLicenseNo" class="mp-text" placeholder="e.g. KA-04-2019-009182" required>
                </div>
            </div>
            <div class="mp-row">
                <div class="calc-input-group">
                    <label for="regVehicleNo">Assigned Electric Vehicle</label>
                    <select id="regVehicleNo" class="mp-select" required>
                        <option value="Tata Ace EV (#KA-03-EV-1024)">🚐 Tata Ace EV (#KA-03-EV-1024)</option>
                        <option value="Mahindra E-Supro (#KA-05-EV-4421)">🚐 Mahindra E-Supro (#KA-05-EV-4421)</option>
                        <option value="Piaggio E-City (#KA-04-EV-8833)">🛺 Piaggio E-City (#KA-04-EV-8833)</option>
                    </select>
                </div>
                <div class="calc-input-group">
                    <label for="regPhone">Contact Phone</label>
                    <input type="tel" id="regPhone" class="mp-text" placeholder="9876543220" pattern="[0-9]{10}" required>
                </div>
            </div>
            <div class="calc-input-group">
                <label for="authPassword">Create Password</label>
                <input type="password" id="authPassword" class="mp-text" placeholder="At least 6 characters" required>
            </div>
        `;
    } else if (authRole === 'ngo') {
        container.innerHTML = `
            <div class="calc-input-group">
                <label for="regOrgName">Official NGO / Organization Name</label>
                <input type="text" id="regOrgName" class="mp-text" placeholder="e.g. Vastra Care Foundation / Goonj" required>
            </div>
            <div class="mp-row">
                <div class="calc-input-group">
                    <label for="regName">Authorized Contact Person</label>
                    <input type="text" id="regName" class="mp-text" placeholder="e.g. Dr. Sunita Rao (Director)" required>
                </div>
                <div class="calc-input-group">
                    <label for="regDarpanId">NGO Darpan / 80G / Trust Reg No.</label>
                    <input type="text" id="regDarpanId" class="mp-text" placeholder="e.g. KA/2021/0049182" required>
                </div>
            </div>
            <div class="mp-row">
                <div class="calc-input-group">
                    <label for="regEmail">Official Email</label>
                    <input type="email" id="regEmail" class="mp-text" placeholder="help@vastracare.org" required>
                </div>
                <div class="calc-input-group">
                    <label for="regNgoDomain">Recycling &amp; Welfare Domain</label>
                    <select id="regNgoDomain" class="mp-select" required>
                        <option value="clothes">👕 Clothes &amp; Textile Upcycling</option>
                        <option value="food">🍲 Food Rescue &amp; Hunger Relief</option>
                        <option value="books">📚 Children's Books &amp; Stationery</option>
                        <option value="ewaste">📱 E-Waste Safe Circularity</option>
                        <option value="plastic">🧴 Plastic Waste Recovery</option>
                        <option value="metal">🔩 Metal &amp; Community Co-op</option>
                    </select>
                </div>
            </div>

            <!-- Mandatory Document Verification Dropzone -->
            <div class="calc-input-group">
                <label>📄 Mandatory Document Verification (80G / Darpan / Trust Deed)</label>
                <div class="ngo-doc-dropzone" id="ngoDocDropzone">
                    <input type="file" id="ngoDocFileInput" accept=".pdf,.png,.jpg,.jpeg" style="display:none;">
                    <div class="ngo-doc-prompt" id="ngoDocPrompt">
                        <span class="doc-icon">📁</span>
                        <strong>Click or drag registration certificate here</strong>
                        <small>Uploads are authenticated against the National NGO Darpan registry (PDF/JPG)</small>
                    </div>
                </div>

                <!-- Preview container when document is selected -->
                <div class="ngo-doc-preview-card" id="ngoDocPreviewCard" style="display:none;">
                    <div class="ngo-doc-file-info">
                        <span class="ngo-doc-file-icon">📑</span>
                        <div>
                            <strong id="ngoDocFileName">Registration_Certificate.pdf</strong>
                            <small id="ngoDocFileSize">1.2 MB • Ready for Verification</small>
                        </div>
                    </div>
                    <button type="button" class="ngo-doc-remove-btn" id="ngoDocRemoveBtn" title="Remove Document">✕</button>
                </div>

                <div class="ngo-verification-badge" id="ngoDocVerifiedBadge" style="display:none;">
                    <span class="shield-icon">🛡️</span>
                    <span>Document Verified • Authentic 80G / Darpan Registered Entity ✓</span>
                </div>
            </div>

            <div class="calc-input-group">
                <label for="authPassword">Create Password</label>
                <input type="password" id="authPassword" class="mp-text" placeholder="At least 6 characters" required>
            </div>
        `;

        setupNgoDocUpload();
    }
}

/* ---------- 5. NGO Document Upload & Verification Logic ---------- */
function setupNgoDocUpload() {
    const dropzone = document.getElementById('ngoDocDropzone');
    const fileInput = document.getElementById('ngoDocFileInput');
    const prompt = document.getElementById('ngoDocPrompt');
    const previewCard = document.getElementById('ngoDocPreviewCard');
    const fileNameEl = document.getElementById('ngoDocFileName');
    const fileSizeEl = document.getElementById('ngoDocFileSize');
    const removeBtn = document.getElementById('ngoDocRemoveBtn');
    const verifiedBadge = document.getElementById('ngoDocVerifiedBadge');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleDocFile(files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
            handleDocFile(fileInput.files[0]);
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedNgoDoc = null;
            fileInput.value = '';
            previewCard.style.display = 'none';
            verifiedBadge.style.display = 'none';
            dropzone.style.display = 'block';
        });
    }

    function handleDocFile(file) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        uploadedNgoDoc = {
            name: file.name,
            size: sizeMb + ' MB',
            verified: true
        };

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = `${sizeMb} MB • Authenticating Darpan Seal…`;

        dropzone.style.display = 'none';
        if (previewCard) previewCard.style.display = 'flex';

        // Simulate real-time cryptographic document verification
        setTimeout(() => {
            if (fileSizeEl) fileSizeEl.textContent = `${sizeMb} MB • Cryptographic Signature Verified ✓`;
            if (verifiedBadge) verifiedBadge.style.display = 'flex';
        }, 600);
    }
}

/* ---------- 6. Quick 1-Click Demo Sign-Ins ---------- */
function initDemoLogins() {
    const demoCitizenBtn = document.getElementById('demoCitizenBtn');
    const demoDriverBtn = document.getElementById('demoDriverBtn');
    const demoNgoBtn = document.getElementById('demoNgoBtn');

    if (demoCitizenBtn) {
        demoCitizenBtn.addEventListener('click', () => {
            const users = getAllUsers();
            const citizen = users.find(u => u.role === 'individual') || DEFAULT_AUTH_USERS[0];
            executeLogin(citizen);
        });
    }

    if (demoDriverBtn) {
        demoDriverBtn.addEventListener('click', () => {
            const users = getAllUsers();
            const driver = users.find(u => u.role === 'driver') || DEFAULT_AUTH_USERS[1];
            executeLogin(driver);
        });
    }

    if (demoNgoBtn) {
        demoNgoBtn.addEventListener('click', () => {
            const users = getAllUsers();
            const ngo = users.find(u => u.role === 'ngo') || DEFAULT_AUTH_USERS[2];
            executeLogin(ngo);
        });
    }
}

function executeLogin(user) {
    const msgEl = document.getElementById('authFormMsg');
    if (msgEl) {
        msgEl.innerHTML = `✅ Signed in successfully as <strong>${user.orgName || user.name}</strong> (${user.role.toUpperCase()})!`;
        msgEl.className = 'auth-form-msg msg-success';
    }

    setCurrentUser(user);

    setTimeout(() => {
        closeAuthModal();
        navigateToRoleDashboard(user.role);
    }, 800);
}

/* ---------- 7. Form Submission Handler ---------- */
function initAuthFormSubmit() {
    const form = document.getElementById('authForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('authFormMsg');
        const submitBtn = document.getElementById('authSubmitBtn');

        // -- LOGIN SUBMISSION --
        if (authMode === 'login') {
            const identifier = document.getElementById('authLoginId').value.trim().toLowerCase();
            const password = document.getElementById('authPassword').value;

            const users = getAllUsers();
            const user = users.find(u => 
                (u.role === authRole) &&
                (
                    (u.email && u.email.toLowerCase() === identifier) ||
                    (u.phone && u.phone === identifier) ||
                    (u.staffId && u.staffId.toLowerCase() === identifier) ||
                    (u.darpanId && u.darpanId.toLowerCase() === identifier) ||
                    (u.name && u.name.toLowerCase() === identifier)
                )
            );

            if (!user) {
                msgEl.textContent = '❌ Account not found. Check your details or use the 1-click demo buttons above!';
                msgEl.className = 'auth-form-msg msg-error';
                return;
            }

            executeLogin(user);
            return;
        }

        // -- REGISTRATION SUBMISSION --
        const name = document.getElementById('regName')?.value.trim();
        const password = document.getElementById('authPassword')?.value;

        if (authRole === 'ngo') {
            const orgName = document.getElementById('regOrgName')?.value.trim();
            const darpanId = document.getElementById('regDarpanId')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const domain = document.getElementById('regNgoDomain')?.value;

            // Enforce document verification
            if (!uploadedNgoDoc) {
                msgEl.textContent = '⚠️ Registration certificate upload is required for NGO verification!';
                msgEl.className = 'auth-form-msg msg-error';
                return;
            }

            const newNgo = {
                id: 'ngo-' + Date.now(),
                role: 'ngo',
                name,
                orgName,
                email,
                phone: '9876543299',
                darpanId,
                domain,
                docName: uploadedNgoDoc.name,
                password,
                verified: true,
                docVerified: true,
                createdAt: new Date().toISOString()
            };

            const users = getAllUsers();
            users.push(newNgo);
            saveAllUsers(users);

            // Also register this new NGO into the Welfare Network
            registerNgoIntoWelfareNetwork(newNgo);

            msgEl.innerHTML = `🎉 <strong>${orgName}</strong> verified &amp; registered! Redirecting to NGO Welfare Hub…`;
            msgEl.className = 'auth-form-msg msg-success';

            setCurrentUser(newNgo);
            setTimeout(() => {
                closeAuthModal();
                navigateToRoleDashboard('ngo');
            }, 1000);

        } else if (authRole === 'driver') {
            const staffId = document.getElementById('regStaffId')?.value.trim();
            const licenseNo = document.getElementById('regLicenseNo')?.value.trim();
            const vehicleNo = document.getElementById('regVehicleNo')?.value;
            const phone = document.getElementById('regPhone')?.value.trim();

            const newDriver = {
                id: 'driver-' + Date.now(),
                role: 'driver',
                name,
                staffId,
                licenseNo,
                vehicleNo,
                phone,
                password,
                verified: true,
                createdAt: new Date().toISOString()
            };

            const users = getAllUsers();
            users.push(newDriver);
            saveAllUsers(users);

            msgEl.innerHTML = `🎉 Staff profile created for <strong>${name}</strong>! Redirecting to Route Scanner…`;
            msgEl.className = 'auth-form-msg msg-success';

            setCurrentUser(newDriver);
            setTimeout(() => {
                closeAuthModal();
                navigateToRoleDashboard('driver');
            }, 1000);

        } else {
            // Individual Citizen
            const phone = document.getElementById('regPhone')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const address = document.getElementById('regAddress')?.value.trim();

            const newCitizen = {
                id: 'citizen-' + Date.now(),
                role: 'individual',
                name,
                phone,
                email,
                address,
                password,
                verified: true,
                createdAt: new Date().toISOString()
            };

            const users = getAllUsers();
            users.push(newCitizen);
            saveAllUsers(users);

            msgEl.innerHTML = `🎉 Welcome <strong>${name}</strong>! Your account has been created.`;
            msgEl.className = 'auth-form-msg msg-success';

            setCurrentUser(newCitizen);
            setTimeout(() => {
                closeAuthModal();
                navigateToRoleDashboard('individual');
            }, 1000);
        }
    });
}

/* ---------- 8. Seamless Cross-Site Synchronization ---------- */
function syncUserWithSite(user) {
    if (!user) return;

    // 1. If Citizen: Auto-fill Welfare & Marketplace forms
    if (user.role === 'individual') {
        const wnPhone = document.getElementById('wnPhone');
        const wnAddress = document.getElementById('wnAddress');
        const sellPhone = document.getElementById('sellPhone');

        if (wnPhone && user.phone) wnPhone.value = user.phone;
        if (wnAddress && user.address) wnAddress.value = user.address;
        if (sellPhone && user.phone) sellPhone.value = user.phone;
    }

    // 2. If Driver: Update Driver profile card
    if (user.role === 'driver') {
        const driverNameEl = document.getElementById('wnDriverName');
        const driverBadgeEl = document.querySelector('.driver-vehicle-badge');
        if (driverNameEl) driverNameEl.textContent = user.name;
        if (driverBadgeEl && user.vehicleNo) driverBadgeEl.textContent = `🚐 ${user.vehicleNo}`;
    }

    // 3. If NGO: Add NGO to Welfare select and select it
    if (user.role === 'ngo') {
        registerNgoIntoWelfareNetwork(user);
    }
}

function registerNgoIntoWelfareNetwork(ngoUser) {
    const select = document.getElementById('wnNgoSelect');
    if (!select) return;

    // Check if already in options
    let existingOpt = Array.from(select.options || []).find(o => o.value === ngoUser.id);
    if (!existingOpt) {
        const newOpt = document.createElement('option');
        newOpt.value = ngoUser.id;
        if (typeof select.prepend === 'function') {
            select.prepend(newOpt);
        } else if (typeof select.appendChild === 'function') {
            select.appendChild(newOpt);
        }
    }

    select.value = ngoUser.id;

    // Trigger welfare render if function exists
    if (typeof renderNgoView === 'function') {
        window.activeNgoId = ngoUser.id;
        renderNgoView();
    }
}

/* ---------- 9. Navigation to Role Dashboard ---------- */
function navigateToRoleDashboard(role) {
    const section = document.getElementById('welfare-network');
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Switch Welfare Network tab to match the user's role
    const tabRole = role === 'individual' ? 'citizen' : role === 'driver' ? 'driver' : 'ngo';
    const roleTabBtn = document.querySelector(`.wn-role-tab[data-role="${tabRole}"]`);
    if (roleTabBtn) {
        roleTabBtn.click();
    }
}

function showGlobalToast(msg) {
    let toast = document.getElementById('authGlobalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'authGlobalToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #1b4332;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 999999;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.display = 'none';
    }, 3200);
}
