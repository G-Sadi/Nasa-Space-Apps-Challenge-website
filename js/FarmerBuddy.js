/**
 * ============================================================================
 * FARMER BUDDY (কৃষি বন্ধু) - BILINGUAL AI ASSISTANT FRONTEND (ES6 RUNTIME)
 * ============================================================================
 * Default: English ("en")
 * Dynamic: Switches to Bangla ("bn") upon website #langToggle click
 * Theme: Strictly matched with AgriVision's deep dark-forest green (#06150f)
 *        and glowing neon emerald (#43ef8c) aesthetic.
 * ============================================================================
 */

class FarmerBuddy {
    constructor() {
        this.apiUrl = "http://localhost:5000/api/ask";
        this.storageKeyPrefix = "agrivision_farmer_buddy_chat_v2_";
        this.currentLang = (typeof window !== "undefined" && window.currentAppLanguage === "bn") ? "bn" : "en";
        this.messages = [];
        this.chatHistory = []; // Multi-turn Gemini memory: Array<{ role: 'user' | 'model', parts: [{ text: string }] }>
        this.isOpen = false;
        this.isStreaming = false;

        // Bilingual UI dictionary
        this.i18nDict = {
            en: {
                fabAria: "Open Farmer Buddy AI Chat",
                fabLabel: "Farmer Buddy AI",
                title: "Farmer Buddy",
                badge: "AI Assistant",
                status: "Empathetic Rural Agricultural Advisor",
                resetTitle: "Start New Conversation",
                minimizeTitle: "Minimize Chat",
                inputPlaceholder: "Ask about crops, pests, fertilizers, or weather...",
                sendAria: "Send Message",
                footerNote: "⚡ Low-Bandwidth & Offline Backup Enabled · Your Trusted Friend",
                senderTag: "👨‍🌾 Farmer Buddy",
                welcomeMsg: "Hello! I am your **Farmer Buddy (কৃষি বন্ধু)**.\n\nFrom crop disease diagnosis, balanced fertilizer calculation, weather alerts, to fair wholesale market prices—I am right by your side. How can I help you with your field today?"
            },
            bn: {
                fabAria: "কৃষি বন্ধু চ্যাট খুলুন",
                fabLabel: "কৃষি বন্ধু AI",
                title: "কৃষি বন্ধু",
                badge: "AI সহচর",
                status: "সহানুভূতিশীল মাঠপর্যায়ের কৃষি সহচর",
                resetTitle: "নতুন আলাপ শুরু করুন",
                minimizeTitle: "মিনিমাইজ করুন",
                inputPlaceholder: "আপনার ফসলের সমস্যা বা প্রশ্ন লিখুন...",
                sendAria: "বার্তা পাঠান",
                footerNote: "⚡ কম ব্যান্ডউইথ ও অফলাইন ব্যাকআপ সমর্থিত · আপনার বিশ্বস্ত বন্ধু",
                senderTag: "👨‍🌾 কৃষি বন্ধু",
                welcomeMsg: "আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**।\n\nফসলের রোগবালাই, সার প্রয়োগের হিসাব, ঝড়ের সতর্কতা কিংবা ন্যায্য বাজারদর—যেকোনো প্রয়োজনে আমি আপনার পাশে আছি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?"
            }
        };

        // Bilingual Quick Chips
        this.chipsDict = {
            en: [
                {
                    id: "pest",
                    label: "Leaf Disease / Pest",
                    icon: "🌱",
                    prompt: "I see yellow spots and insect damage on my crop leaves. How can I treat them with safe low-cost remedies?"
                },
                {
                    id: "fertilizer",
                    label: "Fertilizer & Irrigation",
                    icon: "💧",
                    prompt: "When and how much Urea, TSP, and Potash should I apply for optimal yield?"
                },
                {
                    id: "weather",
                    label: "Storm & Rain Prep",
                    icon: "🌦️",
                    prompt: "Heavy rainfall is forecast in the next 48 hours. What protective measures should I take in my field right now?"
                },
                {
                    id: "market",
                    label: "Fair Wholesale Price",
                    icon: "💰",
                    prompt: "How can I avoid middlemen and get the best fair wholesale market price for my harvest?"
                },
                {
                    id: "storage",
                    label: "Post-Harvest Storage",
                    icon: "📦",
                    prompt: "How should I store seeds in drums after harvest to prevent pest infestation and moisture damage?"
                }
            ],
            bn: [
                {
                    id: "pest",
                    label: "পাতার রোগ নির্ণয়",
                    icon: "🌱",
                    prompt: "আমার ফসলের পাতায় পোকা ও হলুদ দাগ দেখা দিয়েছে, কীভাবে ঘরোয়া উপায়ে দমন করবো?"
                },
                {
                    id: "fertilizer",
                    label: "সার ও সেচ হিসাব",
                    icon: "💧",
                    prompt: "ইউরিয়া, টিএসপি ও পটাশ সার কোন সময় কতটুকু দিলে ভালো ফলন পাবো?"
                },
                {
                    id: "weather",
                    label: "ঝড়ের প্রস্তুতি",
                    icon: "🌦️",
                    prompt: "আগামী দুদিন পর অতিবৃষ্টির সম্ভাবনা আছে, এখন মাঠে কী কী সতর্কতা নিতে হবে?"
                },
                {
                    id: "market",
                    label: "পাইকারি বাজার দর",
                    icon: "💰",
                    prompt: "মধ্যস্বত্বভোগী ফড়িয়াদের এড়িয়ে কীভাবে ফসলের ন্যায্য পাইকারি দাম পেতে পারি?"
                },
                {
                    id: "storage",
                    label: "ফসল সংরক্ষণ",
                    icon: "📦",
                    prompt: "ফসল ঘরে তোলার পর পোকার আক্রমণ ছাড়া কীভাবে ড্রামে বীজ সংরক্ষণ করবো?"
                }
            ]
        };

        // Bilingual Offline FAQs
        this.offlineFAQs = [
            {
                keywords: ["রোগ", "পোকা", "মাজরা", "পচন", "দাগ", "pest", "leaf", "disease", "insect", "fungus", "worm"],
                answerEn: "Friend, don't worry even if you are offline! Immediate actions for crop pests:\n\n• **Organic Neem Spray:** Mix 5ml neem oil with a drop of mild soap in 1 liter of water and spray thoroughly.\n• **Bird Perching:** Erect bamboo sticks across the field so birds can perch and eat harmful stem borers naturally.\n• **Severe Infestation:** For severe leaf rollers or stem borers, consult your local agricultural officer for Emamectin Benzoate (1g per liter).\n\nWhich crop and what specific symptoms are you noticing?",
                answerBn: "ভাই, ইন্টারনেট না থাকলেও চিন্তা নেই! পোকা দমনে তাৎক্ষণিক করণীয়:\n\n• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও সামান্য শ্যাম্পু মিশিয়ে গাছে স্প্রে করুন।\n• **আলোর ফাঁদ ও ডাল পোঁতা:** জমিতে বাঁশের ডাল পুঁতে দিলে পাখি বসে ক্ষতিকর পোকা খেয়ে ফেলে (পার্চিং পদ্ধতি)।\n• **তীব্র আক্রমণ:** পাতা মোড়ানো বা মাজরা পোকার জন্য 'এমামেকটিন বেনজোয়েট' (১ গ্রাম প্রতি লিটার পানি) স্প্রে করুন।\n\nআপনার গাছের কোন অংশে আক্রমণ বেশি দেখা যাচ্ছে?"
            },
            {
                keywords: ["সার", "ইউরিয়া", "পটাশ", "টিএসপি", "fertilizer", "npk", "মাটি", "urea", "potash", "tsp", "soil"],
                answerEn: "Friend, balanced fertilizer management for your soil:\n\n• **Urea Application:** Never apply Urea all at once. Split into 3 equal doses (15 days, 30 days, and 5 days before panicle initiation).\n• **TSP & Potash:** Thoroughly incorporate full doses into the soil during the final land preparation.\n• **Organic Compost:** Apply at least 15 kg well-decomposed manure or vermicompost per decimal to boost soil moisture retention.\n\nWhich crop are you currently fertilizing?",
                answerBn: "ভাই, মাটির উর্বরতা ও সুষম সারের নিয়ম:\n\n• **ইউরিয়া সার:** একবারে না দিয়ে সমান ৩ কিস্তিতে দিন (রোপণের ১৫ দিন, ৩০ দিন ও থোড় আসার ৫ দিন আগে)।\n• **টিএসপি ও পটাশ:** জমি তৈরির শেষ চাষের সময় পুরোটা মাটির সাথে ভালো করে মিশিয়ে দিন।\n• **জৈব সার:** প্রতি শতকে অন্তত ১৫ কেজি পচা গোবর বা কম্পোস্ট দিলে মাটির রস ধরে রাখার ক্ষমতা দ্বিগুণ হয়।\n\nআপনি বর্তমানে কোন ফসলটির জন্য সারের মাত্রা জানতে চান?"
            },
            {
                keywords: ["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "weather", "rain", "storm", "flood", "cyclone", "forecast"],
                answerEn: "Friend, field protection guidelines ahead of bad weather:\n\n• **Drainage Trenches:** Immediately dig 1-foot drainage trenches around the field borders to prevent root asphyxiation.\n• **Halt Spraying & Irrigation:** If rain or heavy cloud cover is forecast in 48 hours, immediately halt all pesticide spraying and irrigation.\n• **Crop Staking:** For tall crops like maize or vegetables, bundle 4-5 adjacent stalks gently with twine for wind stability.\n\nAre your perimeter drainage channels clear and unobstructed?",
                answerBn: "ভাই, দুর্যোগের পূর্বাভাসে মাঠের সুরক্ষা:\n\n• **পানি নিষ্কাশন:** জমির চারধারে দ্রুত ১ ফুট গভীর ড্রেন কেটে দিন যাতে পানি জমে শিকড় পচে না যায়।\n• **সেচ ও স্প্রে বন্ধ:** আকাশে মেঘ বা বৃষ্টির পূর্বাভাস থাকলে সব ধরণের কীটনাশক ও সেচ অবিলম্বে স্থগিত রাখুন।\n• **হেলে পড়া গাছ:** ভুট্টার মতো গাছ বাতাসে হেলে পড়লে ৪-৫টি গাছ একসাথে বেঁধে আলতো সাপোর্ট দিন।\n\nআপনার জমির পানি নামার ড্রেনটি কি প্রস্তুত আছে?"
            },
            {
                keywords: ["দাম", "বাজার", "বিক্রি", "পাইকারি", "market", "price", "টাকা", "wholesale", "sell", "trader"],
                answerEn: "Friend, practical advice to maximize your wholesale profit:\n\n• **Grade & Sort:** Separate produce into 3 grades by size and color. Graded produce commands a 20-30% premium.\n• **Direct Wholesale Hub:** Avoid middlemen at the village gate; take produce together with neighboring farmers to the regional wholesale market.\n• **Official Market Check:** Verify daily wholesale mandi prices via the government Agri portal or local extension officer before setting your price.\n\nWhich wholesale marketplace are you planning to sell at?",
                answerBn: "ভাই, ন্যায্য মূল্য নিশ্চিত করতে করণীয়:\n\n• **গ্রেডিং বা বাছাই:** ফসলকে আকার ও রং অনুযায়ী ৩টি গ্রেডে আলাদা করুন। ভালো গ্রেডে ২০% বেশি দাম মেলে।\n• **আড়তে সরাসরি বিক্রয়:** গ্রামের ফড়িয়াদের বদলে উপজেলা পাইকারি মোকামে নিজে গিয়ে বা সমবায় ভিত্তিতে মাল পাঠান।\n• **ডিজিটাল তথ্য:** সরকারি 'কৃষি বাতায়ন' বা স্থানীয় কৃষি কর্মকর্তার সাথে পাইকারি দর যাচাই করে তবেই বিক্রি করুন।\n\nআপনি কোন হাটে ফসল বিক্রি করার পরিকল্পনা করছেন?"
            },
            {
                keywords: ["সংরক্ষণ", "বীজ", "ড্রাম", "storage", "harvest", "প্যাকেট", "seed", "grain", "moisture"],
                answerEn: "Friend, grain and seed preservation tips:\n\n• **Sun-Drying:** Thoroughly dry seeds in strong sunlight for 3 days until moisture drops below 12% (a seed cracks cleanly between teeth).\n• **Airtight Drums:** Pack dried seeds in plastic/metal drums with dry neem leaves on top and seal the rim airtight.\n• **Elevate from Floor:** Keep storage containers on wooden pallets at least 6 inches above concrete or earthen floors.\n\nAre you preserving eating grains or seeds for the upcoming season?",
                answerBn: "ভাই, ফসল ও বীজ নষ্ট হওয়া রোধে করণীয়:\n\n• **আর্দ্রতা পরীক্ষা:** বীজ কড়া রোদে ৩ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে আনুন (দাঁতে কাটলে 'কট' শব্দ হবে)।\n• **এয়ারটাইট ড্রাম:** পরিষ্কার ড্রামে বীজ রেখে ওপরে শুকনো নিমপাতা বা তেজপাতা দিয়ে মুখ শক্তভাবে বায়ুরোধী করুন।\n• **মেঝে থেকে দূরে:** ড্রাম কখনো মাটির ওপর রাখবেন না, কাঠের তক্তার ওপর রাখুন যাতে নিচের ঠান্ডা না লাগে।\n\nআপনি কি খাবার দানা নাকি আগামী মৌসুমের বীজ সংরক্ষণ করছেন?"
            }
        ];

        this.initDOM();
        this.loadSessionMessages();
        this.renderHistory();
        this.bindEvents();
    }

    getStorageKey() {
        return `${this.storageKeyPrefix}${this.currentLang}`;
    }

    loadSessionMessages() {
        try {
            const raw = sessionStorage.getItem(this.getStorageKey());
            if (raw) {
                this.messages = JSON.parse(raw);
            } else {
                this.messages = [];
            }
        } catch (e) {
            this.messages = [];
        }

        if (this.messages.length === 0) {
            const texts = this.i18nDict[this.currentLang];
            this.messages.push({
                id: `welcome-${this.currentLang}`,
                sender: "buddy",
                text: texts.welcomeMsg,
                timestamp: Date.now()
            });
        }

        // Reconstruct multi-turn chatHistory from session messages (excluding welcome banner)
        this.chatHistory = [];
        this.messages.forEach(m => {
            if (m.id && m.id.startsWith("welcome-")) return;
            if (m.text && typeof m.text === "string" && m.text.trim()) {
                this.chatHistory.push({
                    role: m.sender === "user" ? "user" : "model",
                    parts: [{ text: m.text.trim() }]
                });
            }
        });
    }

    saveSessionMessages() {
        try {
            const trimmed = this.messages.slice(-20);
            sessionStorage.setItem(this.getStorageKey(), JSON.stringify(trimmed));
        } catch (e) {}
    }

    /**
     * Retrieve the last N turns of conversation memory for multi-turn Gemini reasoning
     * @param {number} count 
     * @returns {Array<{ role: 'user' | 'model', parts: [{ text: string }] }>}
     */
    getRecentChatHistory(count = 10) {
        if (!Array.isArray(this.chatHistory)) return [];
        return this.chatHistory.slice(-count);
    }

    /**
     * Dynamically extract active farm telemetry and dashboard state
     * @returns {Object} Active field context (crop, growth stage, soil, weather, language)
     */
    getActiveFarmContext() {
        const isBn = (typeof window !== "undefined" && window.currentAppLanguage === "bn") || (this.currentLang === "bn");

        // Selected crop from 3D field selector
        const cropSelect = document.getElementById("cropSelect");
        let selectedCrop = isBn ? "টমেটো (Tomato)" : "Tomato";
        if (cropSelect && cropSelect.selectedIndex >= 0) {
            selectedCrop = cropSelect.options[cropSelect.selectedIndex]?.text?.trim() || cropSelect.value;
        }

        // Live HUD Telemetry
        const soilMoisture = document.getElementById("hudDockMoistVal")?.textContent?.trim() || "68%";
        const soilNPK = document.getElementById("hudDockNPKVal")?.textContent?.trim() || "84%";
        const pestRisk = document.getElementById("hudDockPestBadge")?.textContent?.trim() || (isBn ? "🟢 ঝুঁকিমুক্ত" : "🟢 Low Risk");
        const weather = document.getElementById("hudDockWeatherStatus")?.textContent?.trim() || (isBn ? "☀️ রোদ · ২৬°C" : "☀️ Sunny · 26°C");
        const growthStage = document.getElementById("timelineStageBadge")?.textContent?.trim() ||
                            document.getElementById("actionCardGrowthStage")?.textContent?.trim() ||
                            (isBn ? "৩. ফুল ও ফল গঠন" : "3. Flowering & Fruit Set");

        return {
            language: isBn ? "বাং" : "EN",
            crop: selectedCrop,
            growthStage: growthStage,
            soilMoisture: soilMoisture,
            soilNPK: soilNPK,
            pestRisk: pestRisk,
            weather: weather
        };
    }

    initDOM() {
        const texts = this.i18nDict[this.currentLang];

        // Container
        this.widgetContainer = document.createElement("div");
        this.widgetContainer.id = "farmerBuddyWidget";
        this.widgetContainer.className = "farmer-buddy-widget";

        // Floating Action Button (FAB)
        this.fabButton = document.createElement("button");
        this.fabButton.id = "farmerBuddyFAB";
        this.fabButton.className = "farmer-buddy-fab";
        this.fabButton.setAttribute("aria-label", texts.fabAria);
        this.fabButton.innerHTML = `
            <div class="fab-icon-wrap">
                <span class="fab-main-icon">🌾</span>
                <span class="fab-pulse-badge" title="Online"></span>
            </div>
            <span class="fab-hover-label" id="fbFabLabel">${texts.fabLabel}</span>
        `;
        this.fabLabelEl = this.fabButton.querySelector("#fbFabLabel");

        // Chat Window Container
        this.chatWindow = document.createElement("div");
        this.chatWindow.id = "farmerBuddyChatWindow";
        this.chatWindow.className = "farmer-buddy-window collapsed";

        // Chat Header
        const header = document.createElement("div");
        header.className = "fb-header";
        header.innerHTML = `
            <div class="fb-header-info">
                <div class="fb-avatar">
                    <span>👨‍🌾</span>
                    <span class="fb-online-dot"></span>
                </div>
                <div>
                    <h3 class="fb-title">
                        <span id="fbTitleText">${texts.title}</span>
                        <span id="fbBadgeText" class="fb-badge">${texts.badge}</span>
                    </h3>
                    <p id="fbStatusText" class="fb-status">${texts.status}</p>
                </div>
            </div>
            <div class="fb-header-actions">
                <button id="fbResetBtn" class="fb-hdr-btn" title="${texts.resetTitle}">🔄</button>
                <button id="fbMinimizeBtn" class="fb-hdr-btn" title="${texts.minimizeTitle}">✕</button>
            </div>
        `;

        this.titleEl = header.querySelector("#fbTitleText");
        this.badgeEl = header.querySelector("#fbBadgeText");
        this.statusEl = header.querySelector("#fbStatusText");
        this.resetBtnEl = header.querySelector("#fbResetBtn");
        this.minimizeBtnEl = header.querySelector("#fbMinimizeBtn");

        // Messages Container
        this.messagesContainer = document.createElement("div");
        this.messagesContainer.id = "fbMessagesContainer";
        this.messagesContainer.className = "fb-messages-body";

        // Quick Action Chips Row
        this.chipsContainer = document.createElement("div");
        this.chipsContainer.className = "fb-chips-row";
        this.renderQuickChips();

        // Chat Input Form
        const inputArea = document.createElement("div");
        inputArea.className = "fb-input-area";
        inputArea.innerHTML = `
            <form id="fbChatForm" class="fb-form" onsubmit="return false;">
                <input
                    type="text"
                    id="fbInput"
                    class="fb-input-field"
                    placeholder="${texts.inputPlaceholder}"
                    autocomplete="off"
                />
                <button type="submit" id="fbSendBtn" class="fb-send-btn" aria-label="${texts.sendAria}">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </form>
            <div id="fbFooterNote" class="fb-footer-note">
                ${texts.footerNote}
            </div>
        `;

        this.inputField = inputArea.querySelector("#fbInput");
        this.sendButton = inputArea.querySelector("#fbSendBtn");
        this.footerNoteEl = inputArea.querySelector("#fbFooterNote");

        // Assemble Window
        this.chatWindow.appendChild(header);
        this.chatWindow.appendChild(this.messagesContainer);
        this.chatWindow.appendChild(this.chipsContainer);
        this.chatWindow.appendChild(inputArea);

        // Add to DOM
        this.widgetContainer.appendChild(this.fabButton);
        this.widgetContainer.appendChild(this.chatWindow);
        document.body.appendChild(this.widgetContainer);
    }

    setLanguage(lang) {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        const texts = this.i18nDict[lang];

        if (this.fabButton) this.fabButton.setAttribute("aria-label", texts.fabAria);
        if (this.fabLabelEl) this.fabLabelEl.textContent = texts.fabLabel;
        if (this.titleEl) this.titleEl.textContent = texts.title;
        if (this.badgeEl) this.badgeEl.textContent = texts.badge;
        if (this.statusEl) this.statusEl.textContent = texts.status;
        if (this.resetBtnEl) this.resetBtnEl.title = texts.resetTitle;
        if (this.minimizeBtnEl) this.minimizeBtnEl.title = texts.minimizeTitle;
        if (this.inputField) this.inputField.placeholder = texts.inputPlaceholder;
        if (this.sendButton) this.sendButton.setAttribute("aria-label", texts.sendAria);
        if (this.footerNoteEl) this.footerNoteEl.innerHTML = texts.footerNote;

        this.renderQuickChips();
        this.loadSessionMessages();
        this.renderHistory();
    }

    renderQuickChips() {
        this.chipsContainer.innerHTML = "";
        const chips = this.chipsDict[this.currentLang] || this.chipsDict.en;
        chips.forEach(chip => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "fb-chip-btn";
            btn.innerHTML = `<span class="chip-icon">${chip.icon}</span> <span>${chip.label}</span>`;
            btn.addEventListener("click", () => {
                this.handleUserSubmit(chip.prompt);
            });
            this.chipsContainer.appendChild(btn);
        });
    }

    bindEvents() {
        this.fabButton.addEventListener("click", () => this.toggleWindow());

        if (this.minimizeBtnEl) {
            this.minimizeBtnEl.addEventListener("click", () => this.toggleWindow(false));
        }
        if (this.resetBtnEl) {
            this.resetBtnEl.addEventListener("click", () => this.resetConversation());
        }

        const form = this.chatWindow.querySelector("#fbChatForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const val = this.inputField.value.trim();
                if (val && !this.isStreaming) {
                    this.inputField.value = "";
                    this.handleUserSubmit(val);
                }
            });
        }

        // Synchronize with website language toggle custom event
        window.addEventListener("languageChanged", (e) => {
            const targetLang = (e && e.detail && e.detail.lang === "bn") ? "bn" : "en";
            this.setLanguage(targetLang);
        });

        const langToggle = document.getElementById("langToggle");
        if (langToggle) {
            langToggle.addEventListener("change", () => {
                const targetLang = langToggle.checked ? "bn" : "en";
                this.setLanguage(targetLang);
            });
        }
    }

    toggleWindow(forceState) {
        this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;

        if (this.isOpen) {
            this.chatWindow.classList.remove("collapsed");
            this.chatWindow.classList.add("expanded");
            this.fabButton.classList.add("active");
            this.scrollToBottom();
            setTimeout(() => this.inputField && this.inputField.focus(), 250);
        } else {
            this.chatWindow.classList.remove("expanded");
            this.chatWindow.classList.add("collapsed");
            this.fabButton.classList.remove("active");
        }
    }

    renderHistory() {
        this.messagesContainer.innerHTML = "";
        this.messages.forEach(msg => {
            this.appendMessageDOM(msg);
        });
        this.scrollToBottom();
    }

    appendMessageDOM(msg) {
        const bubble = document.createElement("div");
        bubble.id = `msg-${msg.id}`;
        bubble.className = `fb-message ${msg.sender === "user" ? "msg-user" : "msg-buddy"}`;

        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const senderTag = this.i18nDict[this.currentLang].senderTag;

        bubble.innerHTML = `
            <div class="msg-bubble-wrap">
                ${msg.sender === "buddy" ? `<span class="msg-sender-tag">${senderTag}</span>` : ''}
                <div class="msg-text">${this.formatMarkdown(msg.text)}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;

        this.messagesContainer.appendChild(bubble);
        this.scrollToBottom();
        return bubble;
    }

    async handleUserSubmit(text) {
        if (!text || !text.trim() || this.isStreaming) return;
        const cleanText = text.trim();

        const userMsg = {
            id: "u-" + Date.now(),
            sender: "user",
            text: cleanText,
            timestamp: Date.now()
        };
        this.messages.push(userMsg);
        this.appendMessageDOM(userMsg);
        this.saveSessionMessages();

        const buddyMsgId = "b-" + Date.now();
        const buddyMsg = {
            id: buddyMsgId,
            sender: "buddy",
            text: "",
            timestamp: Date.now()
        };
        this.messages.push(buddyMsg);
        const buddyBubble = this.appendMessageDOM(buddyMsg);
        const textTarget = buddyBubble.querySelector(".msg-text");

        const isBn = (this.currentLang === "bn");
        textTarget.innerHTML = `<span class="fb-typing-indicator"><span class="fb-typing-dots"><span></span><span></span><span></span></span> <span class="fb-thinking-text">${isBn ? "ভাবছি..." : "Thinking..."}</span></span>`;

        this.isStreaming = true;
        this.setInputsDisabled(true);

        try {
            // Strictly check connectivity: only fallback offline if truly disconnected
            if (!navigator.onLine) {
                console.warn("[FarmerBuddy] Browser is offline (navigator.onLine === false). Running offline fallback.");
                throw new Error("OFFLINE_NETWORK");
            }

            // Always call real Gemini API proxy with full conversation memory and farm context
            await this.askGeminiBackend(cleanText, textTarget, buddyMsg);

            // Record conversation turns into multi-turn memory state
            this.chatHistory.push({ role: "user", parts: [{ text: cleanText }] });
            this.chatHistory.push({ role: "model", parts: [{ text: buddyMsg.text }] });
            this.saveSessionMessages();
        } catch (err) {
            console.error("[FarmerBuddy API Error]:", err);

            const isBn = (this.currentLang === "bn");
            const isOffline = (err.message === "OFFLINE_NETWORK" || !navigator.onLine);

            const notice = isOffline
                ? (isBn ? `📡 *আপনি বর্তমানে অফলাইনে আছেন। সংরক্ষিত অফলাইন পরামর্শ:* \n\n` : `📡 *You appear to be offline. Displaying saved offline guidance:* \n\n`)
                : (isBn ? `⚠️ *সার্ভারে সংযোগ করা যায়নি (${err.message})। সার্ভার চালু করতে \`npm start\` রান করুন। সংরক্ষিত পরামর্শ:* \n\n` : `⚠️ *Unable to reach Gemini backend proxy (${err.message}). Ensure Node server is running with \`npm start\`. Saved guidance:* \n\n`);

            buddyMsg.text = notice;
            textTarget.innerHTML = this.formatMarkdown(notice);
            await this.streamFromOfflineFallback(cleanText, textTarget, buddyMsg);
        } finally {
            this.isStreaming = false;
            this.setInputsDisabled(false);
            this.saveSessionMessages();
            this.scrollToBottom();
        }
    }

    async askGeminiBackend(message, textTarget, buddyMsg) {
        // Multi-turn history (last 10 turns) & active dashboard context
        const recentHistory = this.getRecentChatHistory(10);
        const farmContext = this.getActiveFarmContext();

        console.log(`[FarmerBuddy] Calling Gemini API proxy (History: ${recentHistory.length} turns, Crop: ${farmContext.crop})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: recentHistory,
                context: farmContext
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorText = `HTTP_${response.status} ${response.statusText}`;
            try {
                const errData = await response.json();
                if (errData?.error) errorText = errData.error;
            } catch (_) {}
            throw new Error(errorText);
        }

        const data = await response.json();
        if (!data || typeof data.reply !== "string") {
            throw new Error("EMPTY_REPLY");
        }

        const replyText = data.reply.trim();
        buddyMsg.text = replyText;
        textTarget.innerHTML = this.formatMarkdown(replyText);
        this.scrollToBottom();
    }

    async streamFromOfflineFallback(userQuery, textTarget, buddyMsg) {
        const q = userQuery.toLowerCase();
        let fallbackText = "";

        for (const faq of this.offlineFAQs) {
            if (faq.keywords.some(k => q.includes(k.toLowerCase()))) {
                fallbackText = (this.currentLang === "en") ? faq.answerEn : faq.answerBn;
                break;
            }
        }

        if (!fallbackText) {
            if (this.currentLang === "en") {
                fallbackText = (
                    "Friend, I am right here by your side! I received your inquiry.\n\n" +
                    "• **Key Advice:** Ensure timely balanced fertilization, measured irrigation, and regular weeding to protect your crop.\n" +
                    "• **Official Support:** For immediate disease diagnosis, visit your local Upazila Agriculture Extension office.\n\n" +
                    "Could you tell me how many days old your crop currently is?"
                );
            } else {
                fallbackText = (
                    "ভাই, আমি আপনার পাশে আছি! আপনার প্রশ্নটি পেয়েছি।\n\n" +
                    "• **পরামর্শ:** ভালো ফলন পেতে সময়মতো সুষম সার, পরিমিত সেচ ও আগাছা দমন নিশ্চিত করুন।\n" +
                    "• **জরুরি প্রয়োজনে:** আপনার উপজেলা কৃষি অফিসে বা স্থানীয় উপ-সহকারী কৃষি কর্মকর্তার সাথে পরামর্শ করুন।\n\n" +
                    "আপনার জমির ফসলটির বর্তমান বয়স কত দিন বলুন তো?"
                );
            }
        }

        const words = fallbackText.split(" ");
        let streamed = "";

        for (const w of words) {
            streamed += w + " ";
            buddyMsg.text = streamed;
            textTarget.innerHTML = this.formatMarkdown(streamed);
            this.scrollToBottom();
            await new Promise(r => setTimeout(r, 30));
        }
    }

    resetConversation() {
        this.messages = [];
        this.chatHistory = [];
        sessionStorage.removeItem(this.getStorageKey());
        this.loadSessionMessages();
        this.renderHistory();
        console.log("[FarmerBuddy] Multi-turn conversation history reset.");
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            if (this.messagesContainer) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        });
    }

    setInputsDisabled(disabled) {
        if (this.inputField) this.inputField.disabled = disabled;
        if (this.sendButton) this.sendButton.disabled = disabled;
        if (!disabled && this.inputField) {
            this.inputField.focus();
        }
    }

    formatMarkdown(raw) {
        if (!raw) return "";
        let escaped = raw
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Bold (**text**)
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Bullet lists
        const lines = escaped.split("\n");
        const formattedLines = lines.map(line => {
            const trim = line.trim();
            if (trim.startsWith("•") || trim.startsWith("-") || trim.startsWith("*")) {
                const content = trim.replace(/^[•\-\*]\s*/, "");
                return `<li class="fb-list-item">${content}</li>`;
            }
            return line;
        });

        let result = formattedLines.join("<br/>");
        result = result.replace(/(<li class="fb-list-item">.*?<\/li>)(<br\/>)?/g, "$1");
        result = result.replace(/(<li class="fb-list-item">.*?<\/li>)+/g, "<ul class=\"fb-bullet-list\">$&</ul>");

        return result;
    }
}

// Auto-instantiate when DOM is ready
if (typeof window !== "undefined") {
    const initBuddy = () => {
        if (!window.farmerBuddyInstance) {
            window.farmerBuddyInstance = new FarmerBuddy();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initBuddy);
    } else {
        initBuddy();
    }
}

/**
 * Standalone asynchronous helper function to query the Gemini API via the Node.js Express proxy.
 * Can be called programmatically from anywhere: const reply = await askGemini("What fertilizer for corn?");
 * @param {string} userInput - The user's query or agronomic question
 * @returns {Promise<string>} The AI response from Gemini
 */
export async function askGemini(userInput) {
    if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
        throw new Error("Message parameter is required and cannot be empty.");
    }

    try {
        const response = await fetch("http://localhost:5000/api/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userInput.trim() })
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `Server responded with HTTP status ${response.status}`);
        }

        const data = await response.json();
        return data.reply;
    } catch (err) {
        console.error("[askGemini Error]:", err);
        throw err;
    }
}

if (typeof window !== "undefined") {
    window.askGemini = askGemini;
}
