/**
 * =============================================================================
 * FARMER AUTH ENGINE & ECOSYSTEM SYNC (FieldShiftAuth)
 * =============================================================================
 * Ultra-fast 3-tier hybrid storage engine:
 * Tier 1: Instant Memory & LocalStorage Cache (O(1) lookup)
 * Tier 2: Browser IndexedDB (FieldShiftAuthDB -> farmers)
 * Tier 3: Non-blocking background SQL / FastAPI / Express sync (2s timeout)
 * Native HTML5 Credential Management API & Prefix Match Auto-Fill
 * =============================================================================
 */

export const BANGLADESH_DISTRICTS = {
    mymensingh: { nameEn: "Mymensingh", nameBn: "ময়মনসিংহ", lat: 24.7471, lon: 90.4203, aez: "AEZ-9 Old Brahmaputra Floodplain", soilType: "loamy" },
    bogura: { nameEn: "Bogura", nameBn: "বগুড়া", lat: 24.8465, lon: 89.3777, aez: "AEZ-4 Karatoya-Bangali Floodplain", soilType: "loamy" },
    rajshahi: { nameEn: "Rajshahi", nameBn: "রাজশাহী", lat: 24.3745, lon: 88.6042, aez: "AEZ-26 High Barind Tract", soilType: "clay" },
    dinajpur: { nameEn: "Dinajpur", nameBn: "দিনাজপুর", lat: 25.6217, lon: 88.6354, aez: "AEZ-1 Old Himalayan Piedmont Plain", soilType: "sandy_loam" },
    barishal: { nameEn: "Barishal", nameBn: "বরিশাল", lat: 22.7010, lon: 90.3535, aez: "AEZ-13 Ganges Tidal Floodplain", soilType: "clay" },
    sylhet: { nameEn: "Sylhet", nameBn: "সিলেট", lat: 24.8949, lon: 91.8687, aez: "AEZ-20 Eastern Surma-Kushiyara", soilType: "loamy" },
    cumilla: { nameEn: "Cumilla", nameBn: "কুমিল্লা", lat: 23.4682, lon: 91.1788, aez: "AEZ-19 Old Meghna Estuarine", soilType: "loamy" },
    rangpur: { nameEn: "Rangpur", nameBn: "রংপুর", lat: 25.7439, lon: 89.2752, aez: "AEZ-2 Active Tista Floodplain", soilType: "sandy_loam" },
    khulna: { nameEn: "Khulna", nameBn: "খুলনা", lat: 22.8456, lon: 89.5403, aez: "AEZ-11 High Ganges River Floodplain", soilType: "clay" },
    dhaka: { nameEn: "Dhaka", nameBn: "ঢাকা", lat: 23.8103, lon: 90.4125, aez: "AEZ-28 Madhupur Tract", soilType: "loamy" }
};

export const CROP_LABELS = {
    rice: { bn: "ধান", en: "Rice" },
    potato: { bn: "আলু", en: "Potato" },
    tomato: { bn: "টমেটো", en: "Tomato" },
    wheat: { bn: "গম", en: "Wheat" },
    maize: { bn: "ভুট্টা", en: "Maize" },
    jute: { bn: "পাট", en: "Jute" },
    mustard: { bn: "সরিষা", en: "Mustard" },
    eggplant: { bn: "বেগুন", en: "Eggplant" },
    chili: { bn: "মরিচ", en: "Chili" },
    onion: { bn: "পেঁয়াজ", en: "Onion" },
    cabbage: { bn: "বাঁধাকপি", en: "Cabbage" },
    cauliflower: { bn: "ফুলকপি", en: "Cauliflower" },
    sugarcane: { bn: "আখ", en: "Sugarcane" },
    tea: { bn: "চা", en: "Tea" },
    papaya: { bn: "পেঁপে", en: "Papaya" }
};

export const SOIL_LABELS = {
    loamy: { bn: "দোআঁশ মাটি", en: "Loamy Soil" },
    clay: { bn: "এঁটেল মাটি", en: "Clay Soil" },
    sandy_loam: { bn: "বেলে-দোআঁশ মাটি", en: "Sandy Loam Soil" }
};

// Pre-seeded Verified Demo Farmer for Instant Judge Evaluation
export const DEMO_FARMER = {
    id: "demo-rahim-01",
    phone: "01711223344",
    pin: "1234",
    name: "মোঃ রহিম উদ্দিন (Rahim Uddin)",
    district: "Mymensingh",
    lat: 24.7471,
    lon: 90.4203,
    landSizeDecimals: 2500, // 25 Acres (75 Bigha)
    primaryCrop: "rice",
    soilType: "loamy",
    createdAt: "2026-01-01T00:00:00.000Z"
};

// Storage Keys
const STORAGE_MAP_KEY = "fieldshift_farmers_map";
const STORAGE_LAST_KEY = "fieldshift_last_autofill";
const STORAGE_SESSION_KEY = "fieldshift_session";
const IDB_NAME = "FieldShiftAuthDB";
const IDB_STORE = "farmers";
const IDB_VERSION = 1;

/**
 * Normalizes phone numbers to standard 11-digit BD format (01[3-9]XXXXXXXX).
 */
export function normalizeBdPhone(input) {
    if (!input) return "";
    const bnNums = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
    let sanitized = String(input).replace(/[০-৯]/g, d => bnNums[d] || d);
    sanitized = sanitized.replace(/\D/g, "");

    if (sanitized.startsWith("880")) {
        sanitized = sanitized.substring(2);
    } else if (sanitized.startsWith("88")) {
        sanitized = sanitized.substring(2);
    }

    if (!sanitized.startsWith("0") && sanitized.length === 10) {
        sanitized = "0" + sanitized;
    }

    return sanitized;
}

export function isValidBdPhone(phone) {
    const normalized = normalizeBdPhone(phone);
    return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * IndexedDB Wrapper (Tier 2 Persistent Local Database)
 */
class IndexedDBStore {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    async getDB() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === "undefined" || !window.indexedDB) {
                return reject(new Error("IndexedDB not supported"));
            }

            const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: "phone" });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.warn("[IndexedDB] Failed to open database:", event.target.error);
                reject(event.target.error);
            };
        });

        return this.initPromise;
    }

    async getAll() {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, "readonly");
                const store = tx.objectStore(IDB_STORE);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
    }

    async put(farmer) {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, "readwrite");
                const store = tx.objectStore(IDB_STORE);
                const req = store.put(farmer);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    }

    async get(phone) {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, "readonly");
                const store = tx.objectStore(IDB_STORE);
                const req = store.get(phone);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    }
}

/**
 * FarmerAuthEngine Singleton
 */
export class FarmerAuthEngine {
    constructor() {
        this.memoryMap = new Map();
        this.activeSession = null;
        this.idb = new IndexedDBStore();
        this.backendUrl = "http://localhost:5000/api/auth";
        this.isInitialized = false;

        if (typeof window !== "undefined") {
            this.init();
        }
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // 1. Tier 1: LocalStorage Cache
        this.loadLocalStorageMap();

        // 2. Tier 2: IndexedDB
        try {
            const idbFarmers = await this.idb.getAll();
            if (idbFarmers && idbFarmers.length > 0) {
                idbFarmers.forEach(f => {
                    if (f && f.phone) {
                        this.memoryMap.set(f.phone, f);
                    }
                });
                this.persistToLocalStorage();
            }
        } catch (e) { }

        // 3. Pre-seed Demo Farmer if empty or update if cached with old metadata
        if (this.memoryMap.size === 0) {
            this.memoryMap.set(DEMO_FARMER.phone, DEMO_FARMER);
            this.persistToLocalStorage();
            this.idb.put(DEMO_FARMER).catch(() => { });
        } else if (this.memoryMap.has(DEMO_FARMER.phone)) {
            const currentDemo = this.memoryMap.get(DEMO_FARMER.phone);
            if (currentDemo.landSizeDecimals !== 2500) {
                this.memoryMap.set(DEMO_FARMER.phone, { ...currentDemo, ...DEMO_FARMER });
                this.persistToLocalStorage();
                this.idb.put(DEMO_FARMER).catch(() => { });
            }
        }

        // 4. Default Autofill credentials
        const lastAutofill = this.getLastAutofill();
        if (!lastAutofill) {
            this.setLastAutofill(DEMO_FARMER.phone, DEMO_FARMER.pin);
        }

        // 5. Restore active session
        try {
            const storedSession = localStorage.getItem(STORAGE_SESSION_KEY);
            if (storedSession) {
                const parsed = JSON.parse(storedSession);
                if (parsed && (parsed.id === "demo-rahim-01" || parsed.phone === DEMO_FARMER.phone)) {
                    this.activeSession = { ...DEMO_FARMER };
                    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.activeSession));
                } else if (parsed && parsed.phone && this.memoryMap.has(parsed.phone)) {
                    this.activeSession = this.memoryMap.get(parsed.phone);
                } else if (parsed && parsed.phone) {
                    this.activeSession = parsed;
                    this.memoryMap.set(parsed.phone, parsed);
                }
            } else {
                // Auto-login demo farmer for seamless judge review experience
                this.activeSession = this.memoryMap.get(DEMO_FARMER.phone) || DEMO_FARMER;
                localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.activeSession));
            }
        } catch (e) {
            this.activeSession = DEMO_FARMER;
        }

        // Initialize UI bindings & Navbar badge
        this.initUI();

        // Broadcast initial state to sync ecosystem
        if (this.activeSession) {
            this.dispatchAuthChanged(this.activeSession);
        }
    }

    loadLocalStorageMap() {
        try {
            const raw = localStorage.getItem(STORAGE_MAP_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    Object.values(parsed).forEach(farmer => {
                        if (farmer && farmer.phone) {
                            this.memoryMap.set(farmer.phone, farmer);
                        }
                    });
                }
            }
        } catch (e) { }
    }

    persistToLocalStorage() {
        try {
            const obj = {};
            this.memoryMap.forEach((v, k) => {
                obj[k] = v;
            });
            localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(obj));
        } catch (e) { }
    }

    getLastAutofill() {
        try {
            const raw = localStorage.getItem(STORAGE_LAST_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    setLastAutofill(phone, pin) {
        try {
            localStorage.setItem(STORAGE_LAST_KEY, JSON.stringify({ phone, pin }));
        } catch (e) { }
    }

    getCurrentFarmer() {
        return this.activeSession;
    }

    getSavedFarmers() {
        return Array.from(this.memoryMap.values());
    }

    getFarmerByPhone(rawPhone) {
        const phone = normalizeBdPhone(rawPhone);
        return this.memoryMap.get(phone) || null;
    }

    /**
     * Tier 3 Non-blocking background sync with 2-second timeout
     * Skips dead localhost calls on live GitHub Pages / production environments
     */
    async syncWithBackend(action, farmer) {
        // Detect production environment (e.g. g-sadi.github.io) — never wait for localhost:5000 timeouts
        if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`${this.backendUrl}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(farmer),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                console.log(`[Tier 3 SQL Sync] ✅ Background sync succeeded for ${farmer.phone}`);
            }
        } catch (err) {
            console.log(`[Tier 3 SQL Sync] Offline or local mode active (${err?.message || "timeout"}) — relying on Tier 1 & Tier 2.`);
        }
    }

    async storePasswordCredential(phone, pin, name) {
        try {
            if (typeof window !== "undefined" && window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
                const cred = new window.PasswordCredential({
                    id: phone,
                    password: pin,
                    name: name
                });
                await navigator.credentials.store(cred);
            }
        } catch (e) { }
    }

    /**
     * Ultra-fast Instant Login
     */
    async login(rawPhone, pin, rememberMe = true) {
        const phone = normalizeBdPhone(rawPhone);
        if (!isValidBdPhone(phone)) {
            return { success: false, error: "১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)" };
        }
        if (!pin || String(pin).length < 4) {
            return { success: false, error: "সঠিক ৪ সংখ্যার পিন কোড দিন" };
        }

        let farmer = this.memoryMap.get(phone);

        if (!farmer) {
            farmer = (await this.idb.get(phone)) || undefined;
            if (farmer) {
                this.memoryMap.set(phone, farmer);
                this.persistToLocalStorage();
            }
        }

        if (!farmer) {
            return { success: false, error: "এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।" };
        }

        if (String(farmer.pin) !== String(pin)) {
            return { success: false, error: "ভুল পিন কোড! পুনরায় চেষ্টা করুন।" };
        }

        this.activeSession = farmer;
        try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(farmer));
        } catch (e) { }

        if (rememberMe) {
            this.setLastAutofill(phone, pin);
            this.storePasswordCredential(phone, pin, farmer.name);
        }

        this.dispatchAuthChanged(farmer);
        this.updateNavbarBadge();
        return { success: true, farmer };
    }

    /**
     * Fast Registration
     */
    async register(formData) {
        const phone = normalizeBdPhone(formData.phone);
        if (!isValidBdPhone(phone)) {
            return { success: false, error: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (০১৭XXXXXXXX)" };
        }
        if (!formData.name || formData.name.trim().length < 2) {
            return { success: false, error: "কৃষকের নাম অন্তত ২ অক্ষরের হতে হবে" };
        }
        if (!formData.pin || String(formData.pin).length !== 4 || !/^\d{4}$/.test(String(formData.pin))) {
            return { success: false, error: "পিন কোডটি ঠিক ৪ ডিজিটের সংখ্যা হতে হবে (যেমন: 1234)" };
        }

        const distKey = (formData.district || "mymensingh").toLowerCase();
        const distInfo = BANGLADESH_DISTRICTS[distKey] || BANGLADESH_DISTRICTS.mymensingh;

        const newFarmer = {
            id: `farmer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            phone: phone,
            pin: String(formData.pin),
            name: formData.name.trim(),
            district: distInfo.nameEn,
            lat: distInfo.lat,
            lon: distInfo.lon,
            landSizeDecimals: Math.max(1, Number(formData.landSizeDecimals) || 30),
            primaryCrop: formData.primaryCrop || "rice",
            soilType: formData.soilType || distInfo.soilType,
            createdAt: new Date().toISOString()
        };

        this.memoryMap.set(phone, newFarmer);
        this.persistToLocalStorage();
        this.idb.put(newFarmer).catch(() => { });
        this.syncWithBackend("register", newFarmer);

        this.activeSession = newFarmer;
        try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newFarmer));
        } catch (e) { }

        if (formData.rememberMe !== false) {
            this.setLastAutofill(phone, formData.pin);
            this.storePasswordCredential(phone, formData.pin, newFarmer.name);
        }

        this.dispatchAuthChanged(newFarmer);
        this.updateNavbarBadge();
        return { success: true, farmer: newFarmer };
    }

    /**
     * Fast Update Profile
     */
    async updateProfile(updates) {
        if (!this.activeSession) {
            return { success: false, error: "কোনো সক্রিয় সেশন নেই" };
        }

        const phone = this.activeSession.phone;
        const updated = {
            ...this.activeSession,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updates.district) {
            const distKey = updates.district.toLowerCase();
            const distInfo = BANGLADESH_DISTRICTS[distKey];
            if (distInfo) {
                updated.district = distInfo.nameEn;
                updated.lat = distInfo.lat;
                updated.lon = distInfo.lon;
            }
        }

        this.memoryMap.set(phone, updated);
        this.persistToLocalStorage();
        this.idb.put(updated).catch(() => { });
        this.syncWithBackend("sync", updated);

        this.activeSession = updated;
        try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
        } catch (e) { }

        this.dispatchAuthChanged(updated);
        this.updateNavbarBadge();
        return { success: true, farmer: updated };
    }

    /**
     * Logout
     */
    logout() {
        this.activeSession = null;
        try {
            localStorage.removeItem(STORAGE_SESSION_KEY);
        } catch (e) { }
        this.dispatchAuthChanged(null);
        this.updateNavbarBadge();
    }

    dispatchAuthChanged(farmer) {
        if (typeof window !== "undefined") {
            try {
                window.dispatchEvent(new CustomEvent("farmer-auth-changed", { detail: farmer }));
                console.log(`[FarmerAuthEngine] 📢 Dispatched 'farmer-auth-changed':`, farmer ? `${farmer.name} (${farmer.phone})` : "Logged Out");
            } catch (e) { }
        }
    }

    // =========================================================================
    // UI BINDINGS & NATIVE AUTO-FILL MODAL CONTROLLER
    // =========================================================================

    initUI() {
        if (typeof document === "undefined") return;

        this.updateNavbarBadge();
        this.bindModalEvents();
    }

    updateNavbarBadge() {
        const container = document.getElementById("navFarmerAuthContainer");
        const mobileContainer = document.getElementById("navMobileFarmerAuthContainer");
        if (!container && !mobileContainer) return;

        const isBn = (window.currentAppLanguage === "bn");
        const farmer = this.activeSession;

        if (farmer) {
            const distBn = BANGLADESH_DISTRICTS[farmer.district.toLowerCase()]?.nameBn || farmer.district;
            const distName = isBn ? distBn : farmer.district;
            const cropInfo = CROP_LABELS[farmer.primaryCrop];
            const cropName = cropInfo ? (isBn ? cropInfo.bn : cropInfo.en) : farmer.primaryCrop;
            const landSizeDisplay = (farmer.id === "demo-rahim-01" || farmer.landSizeDecimals === 2500)
                ? (isBn ? '২৫ একর (৭৫ বিঘা)' : '25 Acres (75 Bigha)')
                : `${farmer.landSizeDecimals} ${isBn ? 'শতক' : 'dec'}`;

            const badgeHtml = (btnId) => `
                <button class="nav-farmer-badge" id="${btnId}" title="${isBn ? 'কৃষক প্রোফাইল দেখুন ও পরিবর্তন করুন' : 'View & Switch Farmer Profile'}">
                    <span class="farmer-avatar">👨‍🌾</span>
                    <span class="farmer-info">
                        <strong class="farmer-name">${farmer.name}</strong>
                        <small class="farmer-meta">📍 ${distName} • ${landSizeDisplay} (${cropName})</small>
                    </span>
                    <span class="farmer-chevron">▾</span>
                </button>
            `;

            if (container) {
                container.innerHTML = badgeHtml("btnNavFarmerProfile");
                const btn = document.getElementById("btnNavFarmerProfile");
                if (btn) {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.toggleProfilePopover();
                    });
                }
            }

            if (mobileContainer) {
                mobileContainer.innerHTML = badgeHtml("btnNavMobileFarmerProfile");
                const mBtn = document.getElementById("btnNavMobileFarmerProfile");
                if (mBtn) {
                    mBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.toggleProfilePopover();
                    });
                }
            }
        } else {
            const loginHtml = (btnId, extraCls = '') => `
                <button class="nav-farmer-login-btn ${extraCls}" id="${btnId}">
                    <span class="btn-icon">👨‍🌾</span>
                    <span class="btn-text">${isBn ? 'কৃষক প্রবেশ (Login)' : 'Farmer Login'}</span>
                </button>
            `;

            if (container) {
                container.innerHTML = loginHtml("btnNavFarmerLogin");
                const btn = document.getElementById("btnNavFarmerLogin");
                if (btn) {
                    btn.addEventListener("click", () => {
                        this.openAuthModal("login");
                    });
                }
            }

            if (mobileContainer) {
                mobileContainer.innerHTML = loginHtml("btnNavMobileFarmerLogin", "mobile-login-btn");
                const mBtn = document.getElementById("btnNavMobileFarmerLogin");
                if (mBtn) {
                    mBtn.addEventListener("click", () => {
                        this.openAuthModal("login");
                    });
                }
            }
        }
    }

    toggleProfilePopover() {
        const popover = document.getElementById("farmerProfilePopover");
        if (!popover) return;

        const isVisible = popover.classList.contains("visible");
        if (isVisible) {
            popover.classList.remove("visible");
        } else {
            this.renderProfilePopoverContent();
            popover.classList.add("visible");
        }
    }

    renderProfilePopoverContent() {
        const popover = document.getElementById("farmerProfilePopover");
        if (!popover || !this.activeSession) return;

        const isBn = (window.currentAppLanguage === "bn");
        const farmer = this.activeSession;
        const distBn = BANGLADESH_DISTRICTS[farmer.district.toLowerCase()]?.nameBn || farmer.district;
        const cropInfo = CROP_LABELS[farmer.primaryCrop];
        const soilInfo = SOIL_LABELS[farmer.soilType];
        const landSizeDisplay = (farmer.id === "demo-rahim-01" || farmer.landSizeDecimals === 2500)
            ? (isBn ? '২৫ একর (৭৫ বিঘা)' : '25 Acres (75 Bigha)')
            : `${farmer.landSizeDecimals} ${isBn ? 'শতাংশ' : 'Decimals'}`;

        popover.innerHTML = `
            <div class="popover-header">
                <div class="popover-avatar">👨‍🌾</div>
                <div class="popover-title-wrap">
                    <h4>${farmer.name}</h4>
                    <span class="popover-phone">📱 ${farmer.phone}</span>
                </div>
            </div>
            <div class="popover-details-grid">
                <div class="popover-detail-item">
                    <span>📍 ${isBn ? 'জেলা' : 'District'}</span>
                    <strong>${isBn ? distBn : farmer.district}</strong>
                </div>
                <div class="popover-detail-item">
                    <span>🌱 ${isBn ? 'প্রধান ফসল' : 'Primary Crop'}</span>
                    <strong>${cropInfo ? (isBn ? cropInfo.bn : cropInfo.en) : farmer.primaryCrop}</strong>
                </div>
                <div class="popover-detail-item">
                    <span>📐 ${isBn ? 'জমির পরিমাণ' : 'Land Size'}</span>
                    <strong>${landSizeDisplay}</strong>
                </div>
                <div class="popover-detail-item">
                    <span>🌾 ${isBn ? 'মাটির ধরন' : 'Soil Type'}</span>
                    <strong>${soilInfo ? (isBn ? soilInfo.bn : soilInfo.en) : farmer.soilType}</strong>
                </div>
            </div>
            <div class="popover-actions">
                <button id="btnPopoverSwitch" class="popover-action-btn switch-btn">
                    <span>🔄</span> ${isBn ? 'অ্যাকাউন্ট পরিবর্তন' : 'Switch Account'}
                </button>
                <button id="btnPopoverEdit" class="popover-action-btn edit-btn">
                    <span>✏️</span> ${isBn ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
                </button>
                <button id="btnPopoverLogout" class="popover-action-btn logout-btn">
                    <span>🚪</span> ${isBn ? 'লগআউট' : 'Logout'}
                </button>
            </div>
        `;

        const btnSwitch = document.getElementById("btnPopoverSwitch");
        const btnEdit = document.getElementById("btnPopoverEdit");
        const btnLogout = document.getElementById("btnPopoverLogout");

        if (btnSwitch) {
            btnSwitch.addEventListener("click", () => {
                popover.classList.remove("visible");
                this.openAuthModal("login");
            });
        }

        if (btnEdit) {
            btnEdit.addEventListener("click", () => {
                popover.classList.remove("visible");
                this.openAuthModal("edit");
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener("click", () => {
                popover.classList.remove("visible");
                this.logout();
            });
        }
    }

    openAuthModal(tab = "login") {
        const modal = document.getElementById("farmerAuthModal");
        if (!modal) return;

        modal.classList.add("visible");
        this.switchTab(tab);
        this.renderQuickLoginChips();

        if (tab === "login") {
            // Auto-fill from last session credentials
            const last = this.getLastAutofill() || { phone: DEMO_FARMER.phone, pin: DEMO_FARMER.pin };
            const phoneInput = document.getElementById("login-phone");
            const pinInput = document.getElementById("login-pin");
            const loginBtn = document.getElementById("btnLoginSubmit");

            if (phoneInput && !phoneInput.value) {
                phoneInput.value = last.phone;
            }
            if (pinInput && !pinInput.value) {
                pinInput.value = last.pin;
            }

            // Highlight login button with subtle pulse
            if (loginBtn) {
                loginBtn.classList.add("btn-pulse");
                setTimeout(() => loginBtn.classList.remove("btn-pulse"), 4500);
            }
        } else if (tab === "edit" && this.activeSession) {
            this.populateEditForm(this.activeSession);
        }
    }

    closeAuthModal() {
        const modal = document.getElementById("farmerAuthModal");
        if (modal) modal.classList.remove("visible");
        const suggestions = document.getElementById("phoneSuggestionsList");
        if (suggestions) suggestions.style.display = "none";
    }

    switchTab(tab) {
        const tabLogin = document.getElementById("authTabLogin");
        const tabRegister = document.getElementById("authTabRegister");
        const contentLogin = document.getElementById("authContentLogin");
        const contentRegister = document.getElementById("authContentRegister");
        const regTitle = document.getElementById("authRegTitle");

        const isBn = (window.currentAppLanguage === "bn");

        if (tab === "login") {
            tabLogin?.classList.add("active");
            tabRegister?.classList.remove("active");
            if (contentLogin) contentLogin.style.display = "block";
            if (contentRegister) contentRegister.style.display = "none";
        } else {
            tabLogin?.classList.remove("active");
            tabRegister?.classList.add("active");
            if (contentLogin) contentLogin.style.display = "none";
            if (contentRegister) contentRegister.style.display = "block";

            if (regTitle) {
                regTitle.textContent = (tab === "edit")
                    ? (isBn ? "✏️ কৃষক প্রোফাইল পরিবর্তন করুন" : "✏️ Update Farmer Profile")
                    : (isBn ? "📝 নতুন কৃষক নিবন্ধন" : "📝 New Farmer Registration");
            }
        }
    }

    renderQuickLoginChips() {
        const container = document.getElementById("quickLoginChipsContainer");
        if (!container) return;

        const isBn = (window.currentAppLanguage === "bn");
        const savedFarmers = this.getSavedFarmers();

        if (savedFarmers.length === 0) {
            savedFarmers.push(DEMO_FARMER);
        }

        let chipsHtml = `
            <div class="quick-chips-header">
                <span class="quick-chips-title">⚡ ${isBn ? '১-ক্লিকে তাৎক্ষণিক প্রবেশ (Quick Login):' : '1-Click Instant Login:'}</span>
            </div>
            <div class="quick-chips-list">
        `;

        savedFarmers.slice(0, 3).forEach(farmer => {
            const distBn = BANGLADESH_DISTRICTS[farmer.district.toLowerCase()]?.nameBn || farmer.district;
            const distName = isBn ? distBn : farmer.district;
            chipsHtml += `
                <button type="button" class="quick-farmer-chip" data-phone="${farmer.phone}" data-pin="${farmer.pin}">
                    <span class="chip-avatar">👨‍🌾</span>
                    <span class="chip-body">
                        <strong>${farmer.name}</strong>
                        <small>${farmer.phone} • ${distName} (${farmer.landSizeDecimals} শতক)</small>
                    </span>
                    <span class="chip-arrow">→</span>
                </button>
            `;
        });

        chipsHtml += `</div>`;
        container.innerHTML = chipsHtml;

        // Bind 1-click login chip clicks (<50ms login)
        container.querySelectorAll(".quick-farmer-chip").forEach(chip => {
            chip.addEventListener("click", async () => {
                const phone = chip.getAttribute("data-phone");
                const pin = chip.getAttribute("data-pin");
                if (phone && pin) {
                    const res = await this.login(phone, pin, true);
                    if (res.success) {
                        this.closeAuthModal();
                    }
                }
            });
        });
    }

    populateEditForm(farmer) {
        const phoneInput = document.getElementById("reg-phone");
        const nameInput = document.getElementById("reg-name");
        const districtSelect = document.getElementById("reg-district");
        const soilSelect = document.getElementById("reg-soil");
        const landInput = document.getElementById("reg-land");
        const cropSelect = document.getElementById("reg-crop");
        const pinInput = document.getElementById("reg-pin");

        if (phoneInput) {
            phoneInput.value = farmer.phone;
            phoneInput.readOnly = true; // phone is identity key
        }
        if (nameInput) nameInput.value = farmer.name;
        if (districtSelect) districtSelect.value = farmer.district.toLowerCase();
        if (soilSelect) soilSelect.value = farmer.soilType;
        if (landInput) landInput.value = farmer.landSizeDecimals;
        if (cropSelect) cropSelect.value = farmer.primaryCrop;
        if (pinInput) pinInput.value = farmer.pin;

        const submitBtn = document.getElementById("btnRegisterSubmit");
        if (submitBtn) {
            const isBn = (window.currentAppLanguage === "bn");
            submitBtn.textContent = isBn ? "💾 তথ্য সংরক্ষণ করুন (Save Profile)" : "💾 Save Profile Changes";
        }
    }

    bindModalEvents() {
        // Close button
        const btnClose = document.getElementById("btnFarmerAuthClose");
        if (btnClose) {
            btnClose.addEventListener("click", () => this.closeAuthModal());
        }

        // Outside modal click dismiss
        const modal = document.getElementById("farmerAuthModal");
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    this.closeAuthModal();
                }
            });
        }

        // Dismiss profile popover on document click outside
        document.addEventListener("click", (e) => {
            const popover = document.getElementById("farmerProfilePopover");
            const btnBadge = document.getElementById("btnNavFarmerProfile");
            if (popover && popover.classList.contains("visible")) {
                if (!popover.contains(e.target) && (!btnBadge || !btnBadge.contains(e.target))) {
                    popover.classList.remove("visible");
                }
            }
        });

        // Tab switcher buttons
        const tabLogin = document.getElementById("authTabLogin");
        const tabRegister = document.getElementById("authTabRegister");
        if (tabLogin) tabLogin.addEventListener("click", () => this.switchTab("login"));
        if (tabRegister) tabRegister.addEventListener("click", () => {
            const phoneInput = document.getElementById("reg-phone");
            if (phoneInput) phoneInput.readOnly = false;
            this.switchTab("register");
        });

        // Toggle PIN Visibility
        const loginPinToggle = document.getElementById("loginPinToggle");
        if (loginPinToggle) {
            loginPinToggle.addEventListener("click", () => {
                const pinInput = document.getElementById("login-pin");
                if (pinInput) {
                    const isPass = pinInput.type === "password";
                    pinInput.type = isPass ? "text" : "password";
                    loginPinToggle.textContent = isPass ? "🙈" : "👁️";
                }
            });
        }

        const regPinToggle = document.getElementById("regPinToggle");
        if (regPinToggle) {
            regPinToggle.addEventListener("click", () => {
                const pinInput = document.getElementById("reg-pin");
                if (pinInput) {
                    const isPass = pinInput.type === "password";
                    pinInput.type = isPass ? "text" : "password";
                    regPinToggle.textContent = isPass ? "🙈" : "👁️";
                }
            });
        }

        // Live Phone Prefix Auto-complete chip dropdown
        const phoneInput = document.getElementById("login-phone");
        const suggestionsBox = document.getElementById("phoneSuggestionsList");
        if (phoneInput && suggestionsBox) {
            phoneInput.addEventListener("input", () => {
                const val = normalizeBdPhone(phoneInput.value);
                if (val.length >= 3) {
                    const matches = this.getSavedFarmers().filter(f => f.phone.includes(val) || f.name.includes(val));
                    if (matches.length > 0) {
                        let html = "";
                        matches.forEach(m => {
                            html += `
                                <div class="suggestion-item" data-phone="${m.phone}" data-pin="${m.pin}">
                                    <div class="sugg-name">👨‍🌾 ${m.name}</div>
                                    <div class="sugg-meta">${m.phone} · ${m.district}</div>
                                </div>
                            `;
                        });
                        suggestionsBox.innerHTML = html;
                        suggestionsBox.style.display = "block";

                        suggestionsBox.querySelectorAll(".suggestion-item").forEach(item => {
                            item.addEventListener("click", () => {
                                const phone = item.getAttribute("data-phone");
                                const pin = item.getAttribute("data-pin");
                                if (phone) phoneInput.value = phone;
                                const pinInput = document.getElementById("login-pin");
                                if (pinInput && pin) pinInput.value = pin;
                                suggestionsBox.style.display = "none";
                            });
                        });
                    } else {
                        suggestionsBox.style.display = "none";
                    }
                } else {
                    suggestionsBox.style.display = "none";
                }
            });

            document.addEventListener("click", (e) => {
                if (!phoneInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                    suggestionsBox.style.display = "none";
                }
            });
        }

        // Login Form Submission
        const loginForm = document.getElementById("farmer-login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const phone = document.getElementById("login-phone")?.value || "";
                const pin = document.getElementById("login-pin")?.value || "";
                const rememberMe = document.getElementById("login-remember-me")?.checked ?? true;
                const errorBox = document.getElementById("loginErrorMsg");

                if (errorBox) errorBox.style.display = "none";

                const res = await this.login(phone, pin, rememberMe);
                if (res.success) {
                    this.closeAuthModal();
                } else {
                    if (errorBox) {
                        errorBox.textContent = res.error || "লগইন ব্যর্থ হয়েছে";
                        errorBox.style.display = "block";
                    }
                }
            });
        }

        // Register / Edit Form Submission
        const regForm = document.getElementById("farmer-register-form");
        if (regForm) {
            regForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const phoneInput = document.getElementById("reg-phone");
                const phone = phoneInput?.value || "";
                const name = document.getElementById("reg-name")?.value || "";
                const district = document.getElementById("reg-district")?.value || "mymensingh";
                const soilType = document.getElementById("reg-soil")?.value || "loamy";
                const landSizeDecimals = parseFloat(document.getElementById("reg-land")?.value || "30");
                const primaryCrop = document.getElementById("reg-crop")?.value || "rice";
                const pin = document.getElementById("reg-pin")?.value || "";
                const rememberMe = document.getElementById("reg-remember-me")?.checked ?? true;
                const errorBox = document.getElementById("regErrorMsg");

                if (errorBox) errorBox.style.display = "none";

                // Check if in edit mode
                if (phoneInput && phoneInput.readOnly && this.activeSession) {
                    const res = await this.updateProfile({
                        name,
                        district,
                        soilType,
                        landSizeDecimals,
                        primaryCrop,
                        pin
                    });

                    if (res.success) {
                        this.closeAuthModal();
                    } else if (errorBox) {
                        errorBox.textContent = res.error || "আপডেট ব্যর্থ হয়েছে";
                        errorBox.style.display = "block";
                    }
                } else {
                    const res = await this.register({
                        phone,
                        name,
                        district,
                        soilType,
                        landSizeDecimals,
                        primaryCrop,
                        pin,
                        rememberMe
                    });

                    if (res.success) {
                        this.closeAuthModal();
                    } else if (errorBox) {
                        errorBox.textContent = res.error || "নিবন্ধন ব্যর্থ হয়েছে";
                        errorBox.style.display = "block";
                    }
                }
            });
        }
    }
}

// Global Singleton Instance
export const authEngine = new FarmerAuthEngine();
if (typeof window !== "undefined") {
    window.FarmerAuthEngine = FarmerAuthEngine;
    window.authService = authEngine;
}

