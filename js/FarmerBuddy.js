/**
 * ============================================================================
 * FARMER BUDDY (কৃষি বন্ধু) - JAVASCRIPT BROWSER RUNTIME MODULE
 * ============================================================================
 * Compiled/mirrored from src/FarmerBuddy.ts
 * ============================================================================
 */

export class FarmerBuddy {
    constructor() {
        this.apiUrl = "http://127.0.0.1:8000/api/chat/stream";
        this.storageKey = "agrivision_farmer_buddy_chat_v1";
        this.messages = [];
        this.isOpen = false;
        this.isStreaming = false;

        this.quickChips = [
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
        ];

        this.offlineFAQs = [
            {
                keywords: ["রোগ", "পোকা", "মাজরা", "পচন", "দাগ", "pest", "leaf", "disease"],
                answer: "ভাই, ইন্টারনেট না থাকলেও চিন্তা নেই! পোকা দমনে তাৎক্ষণিক করণীয়:\n\n• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও সামান্য শ্যাম্পু মিশিয়ে গাছে স্প্রে করুন।\n• **আলোর ফাঁদ ও ডাল পোঁতা:** জমিতে বাঁশের ডাল পুঁতে দিলে পাখি বসে ক্ষতিকর পোকা খেয়ে ফেলে (পার্চিং পদ্ধতি)।\n• **তীব্র আক্রমণ:** পাতা মোড়ানো বা মাজরা পোকার জন্য 'এমামেকটিন বেনজোয়েট' (১ গ্রাম প্রতি লিটার পানি) স্প্রে করুন।\n\nআপনার গাছের কোন অংশে আক্রমণ বেশি দেখা যাচ্ছে?"
            },
            {
                keywords: ["সার", "ইউরিয়া", "পটাশ", "টিএসপি", "fertilizer", "npk", "মাটি"],
                answer: "ভাই, মাটির উর্বরতা ও সুষম সারের নিয়ম:\n\n• **ইউরিয়া সার:** একবারে না দিয়ে সমান ৩ কিস্তিতে দিন (রোপণের ১৫ দিন, ৩০ দিন ও থোড় আসার ৫ দিন আগে)।\n• **টিএসপি ও পটাশ:** জমি তৈরির শেষ চাষের সময় পুরোটা মাটির সাথে ভালো করে মিশিয়ে দিন।\n• **জৈব সার:** প্রতি শতকে অন্তত ১৫ কেজি পচা গোবর বা কম্পোস্ট দিলে মাটির রস ধরে রাখার ক্ষমতা দ্বিগুণ হয়।\n\nআপনি বর্তমানে কোন ফসলটির জন্য সারের মাত্রা জানতে চান?"
            },
            {
                keywords: ["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "weather", "rain", "storm"],
                answer: "ভাই, দুর্যোগের পূর্বাভাসে মাঠের সুরক্ষা:\n\n• **পানি নিষ্কাশন:** জমির চারধারে দ্রুত ১ ফুট গভীর ড্রেন কেটে দিন যাতে পানি জমে শিকড় পচে না যায়।\n• **সেচ ও স্প্রে বন্ধ:** আকাশে মেঘ বা বৃষ্টির পূর্বাভাস থাকলে সব ধরণের কীটনাশক ও সেচ অবিলম্বে স্থগিত রাখুন।\n• **হেলে পড়া গাছ:** ভুট্টার মতো গাছ বাতাসে হেলে পড়লে ৪-৫টি গাছ একসাথে বেঁধে আলতো সাপোর্ট দিন।\n\nআপনার জমির পানি নামার ড্রেনটি কি প্রস্তুত আছে?"
            },
            {
                keywords: ["দাম", "বাজার", "বিক্রি", "পাইকারি", "market", "price", "টাকা"],
                answer: "ভাই, ন্যায্য মূল্য নিশ্চিত করতে করণীয়:\n\n• **গ্রেডিং বা বাছাই:** ফসলকে আকার ও রং অনুযায়ী ৩টি গ্রেডে আলাদা করুন। ভালো গ্রেডে ২০% বেশি দাম মেলে।\n• **আড়তে সরাসরি বিক্রয়:** গ্রামের ফড়িয়াদের বদলে উপজেলা পাইকারি মোকামে নিজে গিয়ে বা সমবায় ভিত্তিতে মাল পাঠান।\n• **ডিজিটাল তথ্য:** সরকারি 'কৃষি বাতায়ন' বা স্থানীয় কৃষি কর্মকর্তার সাথে পাইকারি দর যাচাই করে তবেই বিক্রি করুন।\n\nআপনি কোন হাটে ফসল বিক্রি করার পরিকল্পনা করছেন?"
            },
            {
                keywords: ["সংরক্ষণ", "বীজ", "ড্রাম", "storage", "harvest", "প্যাকেট"],
                answer: "ভাই, ফসল ও বীজ নষ্ট হওয়া রোধে করণীয়:\n\n• **আর্দ্রতা পরীক্ষা:** বীজ কড়া রোদে ৩ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে আনুন (দাঁতে কাটলে 'কট' শব্দ হবে)।\n• **এয়ারটাইট ড্রাম:** পরিষ্কার ড্রামে বীজ রেখে ওপরে শুকনো নিমপাতা বা তেজপাতা দিয়ে মুখ শক্তভাবে বায়ুরোধী করুন।\n• **মেঝে থেকে দূরে:** ড্রাম কখনো মাটির ওপর রাখবেন না, কাঠের তক্তার ওপর রাখুন যাতে নিচের ঠান্ডা না লাগে।\n\nআপনি কি খাবার দানা নাকি আগামী মৌসুমের বীজ সংরক্ষণ করছেন?"
            }
        ];

        this.loadSessionMessages();
        this.initDOM();
        this.renderHistory();
        this.bindEvents();
    }

    loadSessionMessages() {
        try {
            const raw = sessionStorage.getItem(this.storageKey);
            if (raw) {
                this.messages = JSON.parse(raw);
            }
        } catch (e) {
            this.messages = [];
        }

        if (this.messages.length === 0) {
            this.messages.push({
                id: "welcome-msg",
                sender: "buddy",
                text: "আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**।\n\nফসলের রোগবালাই, সার প্রয়োগের হিসাব, ঝড়ের সতর্কতা কিংবা ন্যায্য বাজারদর—যেকোনো প্রয়োজনে আমি আপনার পাশে আছি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?",
                timestamp: Date.now()
            });
        }
    }

    saveSessionMessages() {
        try {
            const trimmed = this.messages.slice(-20);
            sessionStorage.setItem(this.storageKey, JSON.stringify(trimmed));
        } catch (e) {}
    }

    initDOM() {
        this.widgetContainer = document.createElement("div");
        this.widgetContainer.id = "farmerBuddyWidget";
        this.widgetContainer.className = "farmer-buddy-widget";

        this.fabButton = document.createElement("button");
        this.fabButton.id = "farmerBuddyFAB";
        this.fabButton.className = "farmer-buddy-fab";
        this.fabButton.setAttribute("aria-label", "কৃষি বন্ধু চ্যাট খুলুন");
        this.fabButton.innerHTML = `
            <div class="fab-icon-wrap">
                <span class="fab-main-icon">🌾</span>
                <span class="fab-pulse-badge" title="অনলাইন"></span>
            </div>
            <span class="fab-hover-label">কৃষি বন্ধু AI</span>
        `;

        this.chatWindow = document.createElement("div");
        this.chatWindow.id = "farmerBuddyChatWindow";
        this.chatWindow.className = "farmer-buddy-window collapsed";

        const header = document.createElement("div");
        header.className = "fb-header";
        header.innerHTML = `
            <div class="fb-header-info">
                <div class="fb-avatar">
                    <span>👨‍🌾</span>
                    <span class="fb-online-dot"></span>
                </div>
                <div>
                    <h3 class="fb-title">কৃষি বন্ধু <span class="fb-badge">AI Assistant</span></h3>
                    <p class="fb-status">সহানুভূতিশীল মাঠপর্যায়ের কৃষি সহচর</p>
                </div>
            </div>
            <div class="fb-header-actions">
                <button id="fbResetBtn" class="fb-hdr-btn" title="নতুন আলাপ শুরু করুন">🔄</button>
                <button id="fbMinimizeBtn" class="fb-hdr-btn" title="মিনিমাইজ করুন">✕</button>
            </div>
        `;

        this.messagesContainer = document.createElement("div");
        this.messagesContainer.id = "fbMessagesContainer";
        this.messagesContainer.className = "fb-messages-body";

        this.chipsContainer = document.createElement("div");
        this.chipsContainer.className = "fb-chips-row";
        this.renderQuickChips();

        const inputArea = document.createElement("div");
        inputArea.className = "fb-input-area";
        inputArea.innerHTML = `
            <form id="fbChatForm" class="fb-form" onsubmit="return false;">
                <input
                    type="text"
                    id="fbInput"
                    class="fb-input-field"
                    placeholder="আপনার ফসলের সমস্যা বা প্রশ্ন লিখুন..."
                    autocomplete="off"
                />
                <button type="submit" id="fbSendBtn" class="fb-send-btn" aria-label="বার্তা পাঠান">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </form>
            <div class="fb-footer-note">
                ⚡ কম ব্যান্ডউইথ ও অফলাইন ব্যাকআপ সমর্থিত · আপনার বিশ্বস্ত বন্ধু
            </div>
        `;

        this.chatWindow.appendChild(header);
        this.chatWindow.appendChild(this.messagesContainer);
        this.chatWindow.appendChild(this.chipsContainer);
        this.chatWindow.appendChild(inputArea);

        this.widgetContainer.appendChild(this.fabButton);
        this.widgetContainer.appendChild(this.chatWindow);
        document.body.appendChild(this.widgetContainer);

        this.inputField = inputArea.querySelector("#fbInput");
        this.sendButton = inputArea.querySelector("#fbSendBtn");
    }

    renderQuickChips() {
        this.chipsContainer.innerHTML = "";
        this.quickChips.forEach(chip => {
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

        const minBtn = this.chatWindow.querySelector("#fbMinimizeBtn");
        if (minBtn) minBtn.addEventListener("click", () => this.toggleWindow(false));

        const resetBtn = this.chatWindow.querySelector("#fbResetBtn");
        if (resetBtn) resetBtn.addEventListener("click", () => this.resetConversation());

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
    }

    toggleWindow(forceState) {
        this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;

        if (this.isOpen) {
            this.chatWindow.classList.remove("collapsed");
            this.chatWindow.classList.add("expanded");
            this.fabButton.classList.add("active");
            this.scrollToBottom();
            setTimeout(() => this.inputField.focus(), 250);
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

        bubble.innerHTML = `
            <div class="msg-bubble-wrap">
                ${msg.sender === "buddy" ? '<span class="msg-sender-tag">👨‍🌾 কৃষি বন্ধু</span>' : ''}
                <div class="msg-text">${this.formatMarkdown(msg.text)}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;

        this.messagesContainer.appendChild(bubble);
        this.scrollToBottom();
        return bubble;
    }

    async handleUserSubmit(text) {
        const userMsg = {
            id: "u-" + Date.now(),
            sender: "user",
            text: text,
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

        textTarget.innerHTML = `<span class="fb-typing-dots"><span></span><span></span><span></span></span>`;

        this.isStreaming = true;
        this.setInputsDisabled(true);

        try {
            if (!navigator.onLine) {
                throw new Error("OFFLINE_NETWORK");
            }
            await this.streamFromBackend(text, textTarget, buddyMsg);
        } catch (err) {
            console.warn("[FarmerBuddy Info] Backend stream offline or unreachable. Using empathetic offline fallback.");
            await this.streamFromOfflineFallback(text, textTarget, buddyMsg);
        } finally {
            this.isStreaming = false;
            this.setInputsDisabled(false);
            this.saveSessionMessages();
            this.scrollToBottom();
        }
    }

    async streamFromBackend(message, textTarget, buddyMsg) {
        const trimmedHistory = this.messages.slice(-5, -1).map(m => ({
            sender: m.sender,
            text: m.text
        }));

        const payload = {
            message: message,
            history: trimmedHistory
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok || !response.body) {
            throw new Error(`HTTP_${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;

                const dataContent = trimmed.replace("data:", "").trim();
                if (dataContent === "[DONE]") {
                    break;
                }

                try {
                    const parsed = JSON.parse(dataContent);
                    if (parsed.text) {
                        accumulatedText += parsed.text;
                        buddyMsg.text = accumulatedText;
                        textTarget.innerHTML = this.formatMarkdown(accumulatedText);
                        this.scrollToBottom();
                    }
                } catch (e) {
                    accumulatedText += dataContent;
                    buddyMsg.text = accumulatedText;
                    textTarget.innerHTML = this.formatMarkdown(accumulatedText);
                    this.scrollToBottom();
                }
            }
        }

        if (!accumulatedText.trim()) {
            throw new Error("EMPTY_STREAM_RESPONSE");
        }
    }

    async streamFromOfflineFallback(userQuery, textTarget, buddyMsg) {
        const q = userQuery.toLowerCase();
        let fallbackText = "";

        for (const faq of this.offlineFAQs) {
            if (faq.keywords.some(k => q.includes(k))) {
                fallbackText = faq.answer;
                break;
            }
        }

        if (!fallbackText) {
            fallbackText = (
                "ভাই, আমি আপনার পাশে আছি! আপনার প্রশ্নটি পেয়েছি।\n\n" +
                "• **পরামর্শ:** ভালো ফলন পেতে সময়মতো সুষম সার, পরিমিত সেচ ও আগাছা দমন নিশ্চিত করুন।\n" +
                "• **জরুরি প্রয়োজনে:** আপনার উপজেলা কৃষি অফিসে বা স্থানীয় উপ-সহকারী কৃষি কর্মকর্তার সাথে পরামর্শ করুন।\n\n" +
                "আপনার জমির ফসলটির বর্তমান বয়স কত দিন বলুন তো?"
            );
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
        sessionStorage.removeItem(this.storageKey);
        this.loadSessionMessages();
        this.renderHistory();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        });
    }

    setInputsDisabled(disabled) {
        this.inputField.disabled = disabled;
        this.sendButton.disabled = disabled;
        if (!disabled) {
            this.inputField.focus();
        }
    }

    formatMarkdown(raw) {
        if (!raw) return "";
        let escaped = raw
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

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
        result = result.replace(/(<li class="fb-list-item">.*?<\/li>)+/g, '<ul class="fb-bullet-list">$&</ul>');

        return result;
    }
}

// Auto-run when DOM is loaded
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
