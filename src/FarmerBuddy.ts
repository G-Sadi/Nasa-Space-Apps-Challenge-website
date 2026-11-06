/**
 * ============================================================================
 * FARMER BUDDY (কৃষি বন্ধু) - TWO-LAYER HYBRID AGRICULTURAL AI ENGINE (TYPESCRIPT)
 * ============================================================================
 * LAYER 1 (Primary): Direct Google Gemini API with multi-turn history & system instructions
 *                    + Local backend proxy auto-detection (localhost:5000).
 * LAYER 2 (Fallback): Rich, Stateful, Context-Aware Agricultural Expert Engine
 *                    Tracking conversation state (crop, cropAgeDays, intent, awaitingSlot).
 *                    Zero generic catch-all responses!
 * ============================================================================
 */

export type AppLanguage = "en" | "bn";

export interface ChatMessage {
    id: string;
    sender: "user" | "buddy";
    text: string;
    timestamp: number;
}

export interface ChatMessageTurn {
    role: "user" | "model";
    parts: Array<{ text: string }>;
}

export interface FarmContext {
    language: string;
    crop: string;
    growthStage: string;
    soilMoisture: string;
    soilNPK: string;
    pestRisk: string;
    weather: string;
}

export interface ConversationContext {
    crop: string | null;
    cropAgeDays: number | null;
    intent: "fertilizer" | "pest_disease" | "irrigation" | "weather" | "harvest_market" | null;
    awaitingSlot: "crop" | "age" | "symptom" | null;
}

export interface QuickActionChip {
    id: string;
    label: string;
    prompt: string;
    icon: string;
}

export interface TranslationDict {
    fabAria: string;
    fabLabel: string;
    title: string;
    badge: string;
    status: string;
    resetTitle: string;
    minimizeTitle: string;
    settingsTitle: string;
    inputPlaceholder: string;
    sendAria: string;
    footerNote: string;
    senderTag: string;
    welcomeMsg: string;
}

/**
 * STATEFUL AGRICULTURAL EXPERT ENGINE (LAYER 2)
 */
export class AgriculturalExpertEngine {
    private cropAliases: Record<string, string[]> = {
        tomato: ["tomato", "টমেটো", "টমেটু"],
        rice: ["rice", "paddy", "ধান", "বোরো", "আমন", "আউশ"],
        potato: ["potato", "আলু"],
        wheat: ["wheat", "গম"],
        maize: ["maize", "corn", "ভুট্টা"],
        eggplant: ["eggplant", "brinjal", "বেগুন"],
        chili: ["chili", "chilli", "pepper", "মরিচ", "লঙ্কা"],
        onion: ["onion", "পেঁয়াজ", "পিয়াজ"],
        mustard: ["mustard", "সরিষা", "সর্ষে"],
        jute: ["jute", "পাট"]
    };

    private cropDisplayNames: Record<string, { bn: string; en: string }> = {
        tomato: { bn: "টমেটো", en: "Tomato" },
        rice: { bn: "ধান", en: "Rice" },
        potato: { bn: "আলু", en: "Potato" },
        wheat: { bn: "গম", en: "Wheat" },
        maize: { bn: "ভুট্টা", en: "Maize" },
        eggplant: { bn: "বেগুন", en: "Eggplant (Brinjal)" },
        chili: { bn: "মরিচ", en: "Chili" },
        onion: { bn: "পেঁয়াজ", en: "Onion" },
        mustard: { bn: "সরিষা", en: "Mustard" },
        jute: { bn: "পাট", en: "Jute" }
    };

    public normalizeDigits(str: string): string {
        if (!str) return "";
        const bnDigits: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
        return str.replace(/[০-৯]/g, d => bnDigits[d] || d);
    }

    public extractCrop(text: string): string | null {
        if (!text) return null;
        const lower = text.toLowerCase();
        for (const [cropKey, aliases] of Object.entries(this.cropAliases)) {
            if (aliases.some(alias => lower.includes(alias))) {
                return cropKey;
            }
        }
        return null;
    }

    public extractAge(text: string): number | null {
        if (!text) return null;
        const normalized = this.normalizeDigits(text.toLowerCase());

        const match = normalized.match(/\b(\d+)\s*(?:দিন|days|day|din)?\b/i);
        if (match) {
            const age = parseInt(match[1], 10);
            if (age > 0 && age < 365) return age;
        }

        if (normalized.includes("এক মাস") || normalized.includes("1 month")) return 30;
        if (normalized.includes("দেড় মাস") || normalized.includes("1.5 month")) return 45;
        if (normalized.includes("দুই মাস") || normalized.includes("2 month") || normalized.includes("২ মাস")) return 60;
        if (normalized.includes("তিন সপ্তাহ") || normalized.includes("3 weeks")) return 21;
        if (normalized.includes("দুই সপ্তাহ") || normalized.includes("2 weeks") || normalized.includes("২ সপ্তাহ")) return 14;

        return null;
    }

    public extractIntent(text: string): ConversationContext["intent"] {
        if (!text) return null;
        const t = text.toLowerCase();

        if (["সার", "ইউরিয়া", "ইউরিয়া", "পটাশ", "টিএসপি", "ড্যাপ", "ডিএপি", "সুষম", "মাত্রা", "কতটুকু", "বোরন", "জিংক", "সার হিসাব", "fertilizer", "urea", "potash", "tsp", "dap", "npk", "dosage", "boron", "zinc"].some(k => t.includes(k))) {
            return "fertilizer";
        }
        if (["পোকা", "রোগ", "দাগ", "পচন", "হলুদ", "কোঁকড়ানো", "কোকড়ানো", "ধসা", "মাজরা", "কীটনাশক", "বালাই", "স্প্রে", "pest", "disease", "insect", "fungus", "yellow", "blight", "rot", "worm", "borer"].some(k => t.includes(k))) {
            return "pest_disease";
        }
        if (["সেচ", "পানি", "শুকিয়ে", "ড্রেন", "নিষ্কাশন", "irrigation", "water", "watering", "drainage"].some(k => t.includes(k))) {
            return "irrigation";
        }
        if (["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "মেঘ", "তুফান", "weather", "rain", "storm", "flood", "cyclone"].some(k => t.includes(k))) {
            return "weather";
        }
        if (["দাম", "বাজার", "দর", "বিক্রি", "আড়ত", "সংরক্ষণ", "ড্রাম", "বীজ", "market", "price", "sell", "storage", "harvest"].some(k => t.includes(k))) {
            return "harvest_market";
        }

        return null;
    }

    public processQuery(query: string, context: ConversationContext, farmContext: FarmContext, currentLang: AppLanguage): string {
        const isBn = (currentLang === "bn");

        const detectedCrop = this.extractCrop(query);
        const detectedAge = this.extractAge(query);
        const detectedIntent = this.extractIntent(query);

        if (detectedCrop) {
            context.crop = detectedCrop;
        } else if (!context.crop && farmContext && farmContext.crop) {
            const activeDashboardCrop = this.extractCrop(farmContext.crop);
            if (activeDashboardCrop) {
                context.crop = activeDashboardCrop;
            }
        }

        if (detectedAge !== null) {
            context.cropAgeDays = detectedAge;
        }

        if (detectedIntent) {
            context.intent = detectedIntent;
        }

        const crop = context.crop || "tomato";
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const cropLabel = isBn ? cropNames.bn : cropNames.en;

        // CASE 1: Age follow-up
        if (detectedAge !== null) {
            context.awaitingSlot = null;
            return this.generateAgeSpecificAdvice(crop, detectedAge, context.intent, isBn);
        }

        // CASE 2: Crop follow-up
        if (detectedCrop && !detectedIntent && !detectedAge && (query.trim().split(/\s+/).length <= 3)) {
            if (context.awaitingSlot === "crop") {
                context.awaitingSlot = null;
                if (context.intent === "fertilizer") {
                    return this.generateCropFertilizerSchedule(crop, context.cropAgeDays, isBn);
                } else if (context.intent === "pest_disease") {
                    return this.generateCropPestGuidance(crop, isBn);
                }
            }

            if (isBn) {
                context.awaitingSlot = "age";
                return `ভাই, আপনার **${cropLabel}** ক্ষেতের জন্য আমি প্রস্তুত!\n\n• **সুষম সার ও সেচ:** চারা রোপণের পর দিন অনুযায়ী সঠিক সার ও সেচের নিয়ম জেনে নিন।\n• **রোগ ও পোকা দমন:** গাছে কোনো পোকার আক্রমণ বা দাগ দেখলে ঘরোয়া বা ওষুধ স্প্রে করতে পারেন。\n\nআপনার **${cropLabel}** গাছটির বর্তমান বয়স কত দিন বলুন তো (যেমন ২০ দিন বা ৪০ দিন)?`;
            } else {
                context.awaitingSlot = "age";
                return `Friend, I have locked onto your **${cropLabel}** field!\n\n• **Targeted Fertilization:** Get the exact split dosages of Urea, TSP, and Potash per decimal for this crop.\n• **Pest Vigilance:** Diagnose and treat leaf curl, stem borers, and blights with organic or approved solutions.\n\nHow many days old is your **${cropLabel}** crop right now (e.g., 20 or 40 days)?`;
            }
        }

        // CASE 3: FERTILIZER
        if (context.intent === "fertilizer" || detectedIntent === "fertilizer") {
            if (context.cropAgeDays) {
                return this.generateAgeSpecificAdvice(crop, context.cropAgeDays, "fertilizer", isBn);
            } else {
                context.awaitingSlot = "age";
                return this.generateCropFertilizerSchedule(crop, null, isBn);
            }
        }

        // CASE 4: PEST & DISEASE
        if (context.intent === "pest_disease" || detectedIntent === "pest_disease") {
            return this.generatePestDiagnosis(crop, query, isBn);
        }

        // CASE 5: IRRIGATION
        if (context.intent === "irrigation" || detectedIntent === "irrigation") {
            return this.generateIrrigationAdvice(crop, context.cropAgeDays, isBn);
        }

        // CASE 6: WEATHER
        if (context.intent === "weather" || detectedIntent === "weather") {
            return this.generateWeatherAdvice(crop, isBn);
        }

        // CASE 7: MARKET
        if (context.intent === "harvest_market" || detectedIntent === "harvest_market") {
            return this.generateMarketAdvice(crop, isBn);
        }

        // CASE 8: Contextual greeting
        if (isBn) {
            context.awaitingSlot = "crop";
            return `আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**। বর্তমানে আপনার ড্যাশবোর্ডে **${cropLabel}** নির্বাচিত আছে।\n\n• **সুষম সার প্রয়োগ:** আপনার জমির চারা কত দিনের, জানালে সঠিক সার ও মাত্রা বলে দেব।\n• **রোগবালাই দমন:** পাতায় হলুদ দাগ, পাতা কোঁকড়ানো বা পোকা থাকলে লক্ষণ জানান।\n• **আবহাওয়া ও সেচ:** সেচ বা বৃষ্টির আগে কী প্রস্তুতি নেবেন তা জানতে পারেন।\n\nআজ আপনার **${cropLabel}** ক্ষেতের জন্য কোন পরামর্শটি দরকার বলুন তো?`;
        } else {
            context.awaitingSlot = "crop";
            return `Hello Friend! I am your trusted **Farmer Buddy**. Your 3D farm is currently viewing **${cropLabel}**.\n\n• **Balanced Fertilization:** Tell me your crop age (e.g., 20 or 40 days) for exact split dosages.\n• **Pest & Disease Control:** Describe any yellowing, leaf curls, or insect damage for instant remedies.\n• **Water & Weather Protection:** Practical soil moisture and drainage planning.\n\nWhich aspect of your **${cropLabel}** crop would you like advice on today?`;
        }
    }

    public generateAgeSpecificAdvice(crop: string, age: number, intent: ConversationContext["intent"], isBn: boolean): string {
        if (crop === "tomato") {
            if (age <= 25) {
                return isBn
                    ? `ভাই! **২০-২৫ দিন** বয়সে টমেটো গাছ দ্রুত শিকড় ও ডালপালা ছড়ায় (চারা বৃদ্ধি পর্যায়)। এই সময় করণীয়:\n\n• **প্রথম কিস্তির উপরি-প্রয়োগ:** প্রতি শতাংশে (Decimal) ১৫০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম এমওপি (পটাশ) সার গাছের গোড়া থেকে ৫-৬ ইঞ্চি দূরে মাটিতে আলতো নিড়ানি দিয়ে মিশিয়ে দিন।\n• **খুঁটি বা সাপোর্ট (Staking):** গাছ যাতে বাতাসে হেলে না পড়ে বা মাটিতে হেলে না যায়, সেজন্য বাঁশের কঞ্চি দিয়ে আলতো করে বেঁধে দিন।\n• **কাটুই পোকা ও গোড়া পচা নজরদারি:** সকালে কোনো চারা কাটা দেখলে মাটি খুঁড়ে কাটুই পোকা নিধন করুন এবং গোড়ায় যেন পানি জমে না থাকে তা নিশ্চিত করুন।\n\nসার প্রয়োগের পর মাটিতে রস না থাকলে হালকা সেচ দিন। আপনার জমিতে মাটি কি যথেষ্ট ভেজা আছে?`
                    : `Friend! At **${age} days**, your tomato plants are in their active vegetative branching stage. Here is your targeted plan:\n\n• **First Top Dressing:** Apply 150g Urea and 150g MoP (Potash) per decimal in a ring 5-6 inches away from stems; gently incorporate into soil.\n• **Staking & Support:** Install bamboo stakes or twine supports now to prevent lodging and keep foliage off wet soil.\n• **Cutworm Vigilance:** Inspect soil around any severed seedlings at dawn to remove cutworms manually.\n\nEnsure light soil moisture after fertilizing. Does your field have adequate moisture right now?`;
            } else if (age <= 50) {
                return isBn
                    ? `আরে ভাই! **${age} দিন** বয়সে টমেটো গাছে ফুল ফোটা এবং ফল ধরার সবচেয়ে গুরুত্বপূর্ণ পর্যায় শুরু হয়! এই সময় সঠিক খাদ্য নিশ্চিত না করলে ফুল ঝরে যেতে পারে:\n\n• **দ্বিতীয় কিস্তির সার:** প্রতি শতাংশে ২০০ গ্রাম ইউরিয়া এবং ২৫০ গ্রাম এমওপি (পটাশ) গাছের গোড়ার চারধারে ছড়িয়ে হালকা নিড়ানি দিন।\n• **বোরন ও জিংক স্প্রে (ফুল ঝরা রোধে):** ফুল ঝরে পড়া ঠেকাতে এবং ফলের তলা পচা রোধে প্রতি লিটার পানিতে ২ গ্রাম 'সলুবর বোরন' ও ১ গ্রাম চিলেটেড জিংক মিশিয়ে বিকেলে পাতার নিচে ও উপরে স্প্রে করুন।\n• **কুশি ছাঁটাই (Pruning):** গাছের গোড়ার দিকের পুরনো হলুদ পাতা ও অতিরিক্ত ডালপালা (suckers) কেটে দিন যাতে ফল বড় হওয়ার পর্যাপ্ত খাদ্য পায়।\n• **নিয়মিত হালকা সেচ:** মাটিতে যেন সব সময় জো (রস) থাকে; হঠাৎ শুকিয়ে অতিরিক্ত পানি দিলে টমেটো ফেটে যায়।\n\nগাছের পাতায় কি কোনো কুঁকড়ে যাওয়া বা পোকার আক্রমণ দেখতে পাচ্ছেন?`
                    : `Friend! At **${age} days**, your tomato plants are in their golden flowering and early fruit-setting stage! Proper nutrition is vital to prevent blossom drop:\n\n• **Second Top Dressing:** Apply 200g Urea and 250g MoP (Potash) per decimal around plant driplines and lightly incorporate.\n• **Solubor Boron Spray:** Spray Solubor Boron at 2g/liter of water in late afternoon to stop blossom abortion and prevent Blossom End Rot.\n• **Sucker Pruning:** Prune bottom suckers and yellowing foliage to enhance sunlight penetration and redirect sugars into developing fruit clusters.\n• **Steady Irrigation:** Maintain uniform soil moisture; avoid fluctuating between dry periods and flooding, which causes fruit cracking.\n\nAre you noticing any curled leaves or spotted fruit clusters on your tomato plants?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে টমেটো ফল পরিপক্ক ও পাকা শুরু করে:\n\n• **পটাশ সার প্রয়োগ:** ফলের আকার বড়, চকচকে ও মিষ্টি করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিন।\n• **ফল ছিদ্রকারী পোকা দমন:** টমেটোতে ছিদ্র করা পোকা দমনে জমিতে সেক্স ফেরোমোন ফাঁদ (প্রতি বিঘাতে ১০-১২টি) পাতুন এবং প্রয়োজনে জৈব স্পিনোসাড স্প্রে করুন।\n• **তুলে নেওয়ার নিয়ম:** আড়তে বা বাজারে পাঠাতে চাইলে লাল হওয়ার ঠিক আগের দিন (ব্রেক স্টেজ) বোঁটা সহ সাবধানে তুলুন।\n\nআপনি কি পাকা টমেটো স্থানীয় বাজারে নাকি পাইকারি আড়তে বিক্রির পরিকল্পনা করছেন?`
                    : `Friend! At **${age} days**, your tomatoes are in their heavy fruit bulking and ripening phase:\n\n• **Potash Application:** Apply 150g Potash per decimal to maximize fruit size, firmness, and shelf-life.\n• **Fruit Borer Control:** Erect sex pheromone traps (10-12 per bigha) for Helicoverpa armigera. Spray Spinosad (0.4 ml/L) if larvae are spotted.\n• **Harvest Timing:** Pick fruit at the mature green/breaker stage for long-distance wholesale transport to avoid transit bruising.\n\nAre you planning to sell your harvest locally or send it to regional wholesale markets?`;
            }
        } else if (crop === "rice") {
            if (age <= 25) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান গাছের কুশি আসার (Tillering) অত্যন্ত গুরুত্বপূর্ণ সময়। এই সময় যত বেশি কুশি গজাবে, ফলন তত বেশি হবে!\n\n• **প্রথম কিস্তির ইউরিয়া ও পটাশ:** প্রতি শতাংশে ২০০-২৫০ গ্রাম ইউরিয়া এবং ১০০ গ্রাম এমওপি (পটাশ) সার জমিতে সমানভাবে ছিটান।\n• **পানির মাত্রা:** জমিতে ১ থেকে ২ ইঞ্চি ছিপছিপে পানি রাখুন; অতিরিক্ত পানি জমিয়ে রাখলে কুশির সংখ্যা কমে যায়।\n• **মাজরা পোকা নজরদারি:** ধানের পাতার মাঝে মরা কুশি দেখলে বাঁশের ডাল পুঁতে দিন (পাখি বসার জন্য) অথবা আলোর ফাঁদ ব্যবহার করুন।\n• **আগাছা নিড়ানো:** সার দেওয়ার আগে জমি থেকে আগাছা সম্পূর্ণ পরিষ্কার করে নিন।\n\nআপনার ধানক্ষেতে কি বর্তমানে আগাছা বা মরা কুশির লক্ষণ দেখতে পাচ্ছেন?`
                    : `Friend! At **${age} days**, your rice crop is in its critical active tillering phase. Every healthy tiller means an extra grain panicle!\n\n• **First Top Dressing:** Broadcast 200-250g Urea and 100g MoP (Potash) per decimal evenly across the field.\n• **Water Depth Control:** Maintain shallow water depth (1-2 inches); deep standing water suppresses tiller emergence.\n• **Stem Borer Defense:** Watch for "dead hearts". Install bamboo perches for predatory birds and light traps for borer moths.\n• **Weeding:** Thoroughly weed the paddies before broadcasting fertilizer.\n\nAre your drainage and shallow water levels properly balanced in the field?`;
            } else if (age <= 55) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান গাছ থোড় বা গর্ভধারণ (Panicle Initiation) অবস্থায় প্রবেশ করে। শীষ পরিপুষ্ট করতে করণীয়:\n\n• **শেষ কিস্তির ইউরিয়া:** প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া প্রয়োগ করুন। তবে পাতার রঙ যদি আগেই গাঢ় সবুজ থাকে তবে ইউরিয়া বাদ দিন।\n• **পটাশ ও সালফার স্প্রে:** দানা পুষ্ট ও চিটা রোধে প্রতি শতাংশে ১০০ গ্রাম পটাশ সার দিন অথবা ১% পটাশিয়াম সালফেট স্প্রে করুন।\n• **পানির স্তর বজায় রাখা:** এই সময় জমিতে অবশ্যই ২-৩ ইঞ্চি পানি ধরে রাখতে হবে; কোনোভাবেই এই দশায় জমি শুকানো যাবে না।\n• **বাদামি ঘাসফড়িং (কারেন্ট পোকা) পরীক্ষা:** ধানের গোড়া ফাঁক করে দেখুন কোনো পোকা আছে কিনা।\n\nজমিতে কি পানি পর্যাপ্ত ধরে রাখা সম্ভব হচ্ছে?`
                    : `Friend! At **${age} days**, your paddy is entering the panicle initiation and booting stage:\n\n• **Final Urea Split:** Apply 150g Urea per decimal only if foliage is pale green; omit if already deep emerald.\n• **Potash for Grain Filling:** Apply 100g Potash per decimal to prevent unfilled empty grains (chita) and strengthen straw.\n• **Critical Moisture Level:** Maintain continuous 2-3 inches of standing water; water stress at this stage severely reduces yield.\n• **Brown Planthopper (BPH) Scout:** Part the bottom tillers to inspect for planthoppers near the water surface.\n\nAre your paddy bunds holding standing water securely?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান পাকা শুরু করেছে (দানা শক্ত হওয়ার পর্যায়):\n\n• **পানি নিষ্কাশন:** ফসল কাটার ১০-১২ দিন আগে জমির সম্পূর্ণ পানি বের করে জমি শুকিয়ে দিন। এতে ধান সহজে পাকবে ও কাটার সুবিধা হবে।\n• **শীষ কাটার পোকা ও ইঁদুর দমন:** ধান হেলে পড়া রোধ করুন এবং জমির চারধারে পরিষ্কার পরিচ্ছন্ন রাখুন।\n• **সঠিক সময়ে কর্তন:** শীষের শতকরা ৮০ ভাগ ধান সোনালী রঙ ধারণ করলে আর দেরি না করে ধান কেটে ফেলুন।\n\nফসল মাড়াই ও শুকানোর জন্য কি চাতাল বা ত্রিপল প্রস্তুত আছে?`
                    : `Friend! At **${age} days**, your rice is ripening towards full golden grain maturity:\n\n• **Field Drainage:** Drain all standing water from paddies 10-12 days before anticipated harvest to harden the soil.\n• **Harvest Threshold:** Harvest promptly when 80% of panicle grains have turned golden-straw color to prevent shattering loss.\n• **Post-Harvest Drying:** Dry threshed paddy for 2-3 full sunny days until seed moisture reaches 12-14%.\n\nDo you have drying tarps or storage drums ready for the upcoming harvest?`;
            }
        } else if (crop === "potato") {
            if (age <= 30) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে আলু গাছের গোড়ায় মাটি তোলা (Earthing up) এবং প্রথম উপরি-প্রয়োগের আসল সময়:\n\n• **প্রথম উপরি-প্রয়োগ:** প্রতি শতাংশে ২৫০ গ্রাম ইউরিয়া এবং ২০০ গ্রাম পটাশ দুই সারির মাঝে ছড়িয়ে নিড়ানি দিয়ে গোড়ায় মাটি তুলে ঢিবি বানিয়ে দিন।\n• **হালকা সেচ:** মাটি তোলার পর আলতো সেচ দিন যাতে ঢিবির দুই-তৃতীয়াংশ ভেজে, কিন্তু উপরে পানি না ওঠে।\n• **কাটুই পোকা দমন:** মাটি খুঁড়ে চারা কেটে দেওয়া পোকা দেখলে সকালে হাত দিয়ে সংগ্রহ করুন বা ক্লোরপাইরিফস গ্রুপের অনুমোদিত ব্যবস্থা নিন।\n\nআপনার আলু ক্ষেতে মাটি কি শুকিয়ে শক্ত হয়ে গেছে?`
                    : `Friend! At **${age} days**, it is time for the crucial first earthing-up and top dressing on your potato rows:\n\n• **Top Dressing:** Apply 250g Urea and 200g Potash per decimal between plant rows, then mound loose soil up around the stems.\n• **Furrow Irrigation:** Irrigate gently so water fills two-thirds of the furrow depth without submerging ridge tops.\n• **Cutworm Check:** Dig gently near severed shoots at dawn to capture and destroy cutworm larvae.\n\nIs your soil soft and ridge-ready for mounding?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে আলুর টিউবার বা আলু মাটির নিচে দ্রুত বড় হতে থাকে (Tuber Bulking Stage)। এ সময় সর্বোচ্চ সতর্কতার সাথে করণীয়:\n\n• **নাবি ধসা (Late Blight) আগাম স্প্রে:** কুয়াশা বা মেঘলা আবহাওয়া থাকলে নাবি ধসা রোধে প্রতি লিটার পানিতে ২ গ্রাম ম্যানকোজেব (যেমন ডাইথেন এম-৪৫) অথবা রিডোমিল গোল্ড স্প্রে করে পুরো পাতা ভিজিয়ে দিন।\n• **দ্বিতীয় কিস্তির পটাশ:** আলুর আকার বড় ও খোসা শক্ত করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিয়ে হালকা সেচ দিন।\n• **আলু ঢেকে রাখা:** কোনো আলু মাটির বাইরে এসে সবুজ হয়ে গেলে দ্রুত মাটি দিয়ে ঢেকে দিন।\n\nসকালে কি আপনার এলাকায় কুয়াশা বা গুঁড়ি গুঁড়ি বৃষ্টি হচ্ছে?`
                    : `Friend! At **${age} days**, your potatoes are in their rapid tuber expansion phase:\n\n• **Late Blight Preventive Spray:** Foggy, overcast weather triggers devastating Late Blight. Spray Mancozeb (2g/L) or Ridomil Gold to coat foliage thoroughly.\n• **Potash for Tuber Weight:** Apply 150g Potash per decimal to maximize tuber grade size and skin firmness.\n• **Cover Green Tubers:** Mound soil over any tubers exposed to sunlight to prevent toxic solanine greening.\n\nIs your area experiencing persistent heavy fog or cool damp mornings?`;
            }
        } else {
            return isBn
                ? `ভাই! আপনার **${crop}** ফসলের **${age} দিন** বয়সের জন্য পরামর্শ:\n\n• **সুষম সার উপরি-প্রয়োগ:** এই বয়সে গাছের বর্ধনশীল শাখার জন্য প্রতি শতাংশে ১৫০-২০০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম পটাশ গাছের গোড়া থেকে কিছুটা দূরে দিন।\n• **মাটির রস ও সেচ:** সার দেওয়ার পর হালকা সেচ দিন, যেন মাটি ভেজা থাকে কিন্তু গোড়ায় পানি না জমে।\n• **বালাই নজরদারি:** ডালপালা ও পাতার নিচে কোনো পোকা বা দাগ আছে কিনা নিবিড়ভাবে পরীক্ষা করুন।\n\nআপনার ফসলের পাতায় কি কোনো অস্বাভাবিক দাগ বা পোকা চোখে পড়েছে?`
                : `Friend! For your **${crop}** at **${age} days**:\n\n• **Top Dressing:** Apply 150-200g Urea and 150g Potash per decimal away from root crowns.\n• **Moisture Management:** Provide light irrigation after fertilizing; ensure no standing water suffocates roots.\n• **Foliage Inspection:** Check undersides of leaves for sucking pests or fungal lesions.\n\nAre you noticing any signs of stress or discolored leaves on your crop?`;
        }
    }

    public generateCropFertilizerSchedule(crop: string, age: number | null, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `ভাই, **${label}** ফসলে সর্বোচ্চ ফলন পেতে সুষম সার প্রয়োগের আদর্শ নিয়মাবলী:\n\n• **জমি তৈরির সময় (Basal Dose প্রতি শতাংশে):**\n  - গোবর বা ট্রাইকো-কম্পোস্ট: ১৫-২০ কেজি\n  - টিএসপি (TSP) বা ডিএপি: ৪০০ গ্রাম\n  - এমওপি (পটাশ): ২৫০ গ্রাম\n  - জিপসাম: ২০০ গ্রাম ও জিংক সালফেট: ৫০ গ্রাম\n• **প্রথম উপরি-প্রয়োগ (রোপণের ২০-২৫ দিন পর):**\n  - ইউরিয়া: ২০০ গ্রাম ও পটাশ: ১০০ গ্রাম (গোড়া থেকে দূরে দিয়ে মাটি আলগা করুন)\n• **দ্বিতীয় উপরি-প্রয়োগ (ফুল/কুশি আসার সময় - ৪০-৪৫ দিন):**\n  - ইউরিয়া: ১৫০ গ্রাম ও পটাশ: ১৫০ গ্রাম + ফুল ঝরা রোধে বোরন স্প্রে\n\nভাই, আপনার **${label}** গাছটির বয়স বর্তমানে কত দিন বলুন তো?`
            : `Friend, here is the balanced agronomist fertilization plan for **${label}**:\n\n• **Basal Application (Per Decimal during final plowing):**\n  - Decomposed Manure/Compost: 15-20 kg\n  - TSP / DAP: 400g\n  - MoP (Potash): 250g\n  - Gypsum: 200g & Zinc Sulphate: 50g\n• **1st Top Dressing (20-25 days after transplant):**\n  - Urea: 200g & Potash: 100g incorporated away from root crowns.\n• **2nd Top Dressing (Flowering/Booting stage - 40-45 days):**\n  - Urea: 150g & Potash: 150g + Solubor Boron foliar spray (2g/L).\n\nCould you share how many days old your **${label}** crop currently is?`;
    }

    public generateCropPestGuidance(crop: string, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `ভাই! **${label}** ফসলে প্রধান ক্ষতিকর পোকা ও রোগ দমনে করণীয়:\n\n• **চোষক পোকা ও সাদা মাছি:** প্রতি লিটার পানিতে ৫ মিলি নিমতেল মিশিয়ে পাতার নিচে স্প্রে করুন।\n• **মাজরা বা ফল ছিদ্রকারী পোকা:** জমিতে সেক্স ফেরোমোন ফাঁদ টানিয়ে দিন বা জৈব স্পিনোসাড স্প্রে করুন।\n• **পাতার দাগ ও ধসা রোগ:** ম্যানকোজেব গ্রুপের ছত্রাকনাশক (২ গ্রাম প্রতি লিটার পানিতে) দিয়ে পুরো গাছ ভিজিয়ে স্প্রে করুন।\n\nআপনার **${label}** গাছে কি কোনো নির্দিষ্ট পোকা বা দাগ দেখেছেন?`
            : `Friend! Common pest and disease management for **${label}**:\n\n• **Sucking Pests & Whiteflies:** Spray 5ml Neem oil per liter of water under leaves.\n• **Fruit/Stem Borers:** Install pheromone lure traps or spray bio-rational Spinosad.\n• **Fungal Blights & Spots:** Spray Mancozeb (2g/L) to prevent fungal expansion.\n\nAre you seeing any specific symptoms on your **${label}** leaves?`;
    }

    public generatePestDiagnosis(crop: string, query: string, isBn: boolean): string {
        const q = (query || "").toLowerCase();
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        if (q.includes("হলুদ") || q.includes("yellow")) {
            return isBn
                ? `ভাই! **${label}** গাছের পাতা হলুদ হওয়ার ৩টি মূল কারণ ও সমাধান:\n\n• **নাইট্রোজেনের ঘাটতি (নিচের পুরনো পাতা হলুদ হলে):** জমিতে ইউরিয়া সারের অভাব হলে নিচের পাতা আগে হলুদ হয়। প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া দিন অথবা প্রতি লিটার পানিতে ১০ গ্রাম ইউরিয়া মিশিয়ে পাতায় স্প্রে করুন।\n• **গোড়ায় অতিরিক্ত পানি বা শিকড় পচা:** মাটিতে বাতাস না থাকলে পাতা হলুদ হয়। অবিলম্বে ড্রেন কেটে অতিরিক্ত পানি বের করে দিন।\n• **মাকড় বা চোষক পোকা:** পাতার নিচে মাকড় থাকলে পাতা হালকা হলুদ ও খসখসে হয়। ঘরোয়া নিমতেল (৫ মিলি/লিটার পানিতে সামান্য শ্যাম্পু সহ) অথবা ওমাইট/ভার্টিমেক স্প্রে করুন।\n\nপাতা কি নিচের দিক থেকে হলুদ হচ্ছে নাকি কচি ডগা হলুদ হচ্ছে?`
                : `Friend! Here are the 3 main causes and remedies for yellowing leaves in **${label}**:\n\n• **Nitrogen Deficiency (Older bottom leaves yellowing first):** Apply 150g Urea per decimal or spray a 1% dissolved Urea solution directly onto foliage.\n• **Waterlogging / Root Asphyxiation:** Excess root moisture chokes oxygen. Clear drainage furrows immediately.\n• **Mite / Sucking Pest Infestation:** Mites under leaf surfaces cause mottled yellow stippling. Spray Neem oil (5ml/L) or Abamectin.\n\nAre the bottom older leaves turning yellow, or is it appearing on young new tips?`;
        }

        if (q.includes("কোঁকড়া") || q.includes("কোকড়া") || q.includes("curl")) {
            return isBn
                ? `ভাই! **${label}** গাছের পাতা কোঁকড়ানো (Leaf Curl) সাধারণত সাদা মাছি বা থ্রিপস পোকার আক্রমণে হয়:\n\n• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও ১ ফোঁটা তরল সাবান মিশিয়ে পাতার উল্টো পিঠে ভালোভাবে স্প্রে করুন।\n• **হলুদ আঠালো ফাঁদ:** জমিতে হলুদ স্টিকি ট্র্যাপ (Yellow Sticky Trap) টানিয়ে দিন, এতে ক্ষতিকর সাদা মাছি ও পোকা আটকে যাবে।\n• **তীব্র আক্রমণে ওষুধ:** পোকা বেশি থাকলে ইমিডাক্লোপ্রিড গ্রুপের কীটনাশক (যেমন টিডো বা এডমায়ার ০.৫ মিলি প্রতি লিটার পানিতে) বিকেলে স্প্রে করুন।\n\nভাই, আপনার গাছে কি সাদা রঙের ছোট মাছি উড়তে দেখেছেন?`
                : `Friend! Leaf curling in **${label}** is caused by viral transmission via sucking whiteflies, thrips, or mites:\n\n• **Organic Neem Wash:** Spray 5ml cold-pressed Neem oil with a drop of liquid soap per liter of water under leaves.\n• **Yellow Sticky Traps:** Hang yellow sticky cards across the canopy to capture adult whiteflies naturally.\n• **Targeted Chemical Option:** For severe pressure, apply Imidacloprid (0.5 ml/L) in late afternoon.\n\nDo you see tiny white flies fluttering when you shake the foliage?`;
        }

        return isBn
            ? `ভাই! **${label}** ফসলের বালাই দমনে তাৎক্ষণিক কার্যকর পদক্ষেপ:\n\n• **জৈব বালাইনাশক স্প্রে:** ৫ মিলি নিমতেল ১ লিটার পানিতে মিশিয়ে স্প্রে করলে জাবপোকা, সাদা মাছি ও শুঁয়োপোকা দ্রুত দূর হয়।\n• **পার্চিং পদ্ধতি (পাখি বসার ডাল):** জমিতে বাঁশের কঞ্চি পুঁতে দিলে ফিঙে বা শালিক পাখি বসে ক্ষতিকর মাজরা ও লেদা পোকা খেয়ে ফেলে।\n• **আক্রমণ বেশি হলে:** স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিয়ে অনুমোদিত বালাইনাশক সঠিক মাত্রায় বিকেলে স্প্রে করুন।\n\nআপনার ফসলের পাতায় ঠিক কী ধরণের লক্ষণ বা পোকা দেখা যাচ্ছে বলুন তো?`
            : `Friend! Instant protective measures against pests in **${label}**:\n\n• **Organic Neem Application:** Spray 5ml Neem oil per liter of water with a surfactant for aphids, thrips, and caterpillars.\n• **Bird Perches (Biological Control):** Erect bamboo T-perches so insectivorous birds feed on stem borers and caterpillars.\n• **Targeted Intervention:** Use group-specific bio-pesticides (e.g., Bacillus thuringiensis or Spinosad) during late afternoon.\n\nWhat specific symptoms or insect damage are you observing on the leaves?`;
    }

    public generateIrrigationAdvice(crop: string, age: number | null, isBn: boolean): string {
        return isBn
            ? `ভাই! সুষম সেচ ব্যবস্থাপনায় আপনার ফসলের জন্য গুরুত্বপূর্ণ পরামর্শ:\n\n• **পরিমিত সেচ:** গাছে কখনই অতিরিক্ত পানি জমিয়ে রাখবেন না; গোড়ায় পানি জমলে শিকড় পচে যায়।\n• **সেচ দেওয়ার সঠিক সময়:** সবসময় সকালের দিকে অথবা শেষ বিকেলে সেচ দিন, কড়া রোদে সেচ দিলে গাছ ঝলসে যেতে পারে।\n• **ড্রেনেজ ব্যবস্থা:** সেচের অতিরিক্ত পানি যাতে ২০ মিনিটের মধ্যে বের হয়ে যেতে পারে, সেজন্য ড্রেন পরিষ্কার রাখুন।\n\nজমির মাটি হাত দিয়ে চাপ দিলে কি লাড্ডুর মতো গোল হয় নাকি বালির মতো ঝরে যায়?`
            : `Friend! Soil moisture and irrigation guidance for healthy root uptake:\n\n• **Shallow Consistent Moisture:** Avoid waterlogged root zones; roots require soil oxygen as much as water.\n• **Optimal Timing:** Irrigate in early morning or late afternoon to minimize evaporation stress and root shock.\n• **Drainage Trenches:** Ensure perimeter drainage ditches allow excess irrigation or rainwater to vacate within 30 minutes.\n\nWhen you squeeze a handful of field soil, does it form a firm clump or crumble like dust?`;
    }

    public generateWeatherAdvice(crop: string, isBn: boolean): string {
        return isBn
            ? `ভাই! বৈরী আবহাওয়া ও ঝড়ের পূর্বাভাসে মাঠের সুরক্ষা:\n\n• **পানি নিষ্কাশন ড্রেন:** জমির চারধারে দ্রুত ১ ফুট গভীর ড্রেন কেটে দিন যাতে বৃষ্টির পানি এক মুহূর্তও জমে না থাকে।\n• **সেচ ও কীটনাশক বন্ধ:** আগামী ৪৮ ঘণ্টার মধ্যে বৃষ্টির পূর্বাভাস থাকলে সব ধরণের সার প্রয়োগ ও স্প্রে অবিলম্বে বন্ধ রাখুন।\n• **লম্বা গাছে সাপোর্ট:** টমেটো, ভুট্টা বা বেগুনের মতো গাছে বাঁশের কঞ্চি দিয়ে শক্ত সাপোর্ট দিন যাতে বাতাসে হেলে না পড়ে।\n\nআপনার জমির পানি নামার প্রধান নালাটি কি পরিষ্কার আছে?`
            : `Friend! Emergency storm and heavy rainfall preparedness:\n\n• **Clear Perimeter Trenches:** Dig out 1-foot drainage furrows immediately so heavy deluge flows off fields freely.\n• **Halt Spraying & Fertilizing:** Immediately suspend all foliar sprays and top dressings 48 hours before predicted storms.\n• **Crop Staking:** Reinforce tomato, maize, and eggplant stakes to resist strong wind shear.\n\nAre your main water runoff outlets completely free of weeds and silt?`;
    }

    public generateMarketAdvice(crop: string, isBn: boolean): string {
        return isBn
            ? `ভাই! ফসলের ন্যায্য পাইকারি দর পেতে ও ফসল সংরক্ষণে করণীয়:\n\n• **গ্রেডিং বা বাছাই:** ফসলকে আকার ও মান অনুযায়ী ৩টি গ্রেডে (A, B, C) আলাদা করুন। ভালো গ্রেডে ২০-৩০% বেশি দাম পাওয়া যায়।\n• **আড়তে সরাসরি বিক্রয়:** গ্রামের ফড়িয়াদের কাছে কম দামে না দিয়ে পার্শ্ববর্তী উপজেলা মোকাম বা পাইকারি বাজারে নিজে যান।\n• **বীজ সংরক্ষণ:** বীজ কড়া রোদে ৩ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে এনে শুকনো নিমপাতা দিয়ে এয়ারটাইট ড্রামে রাখুন।\n\nআপনি কি এই ফসল এখনই বিক্রি করবেন নাকি গুদামে সংরক্ষণ করার কথা ভাবছেন?`
            : `Friend! Practical wholesale market realization and grain storage advice:\n\n• **Produce Grading:** Sort harvest into 3 quality tiers by size and color. Graded produce commands a 20-30% price premium.\n• **Direct Mandi Transport:** Bypass village gate middlemen; transport bundled produce directly to the regional wholesale hub.\n• **Hermetic Storage:** Dry seeds down to 12% moisture (cracks sharply between teeth) and seal in airtight drums with dried neem leaves.\n\nAre you intending to sell your harvest immediately or store seeds for next season?`;
    }
}

/**
 * MAIN FARMER BUDDY CONTROLLER
 */
export class FarmerBuddy {
    private proxyUrl: string = "http://localhost:5000/api/ask";
    private storageKeyPrefix: string = "agrivision_farmer_buddy_chat_v3_";
    private currentLang: AppLanguage = "en";
    private messages: ChatMessage[] = [];
    private chatHistory: ChatMessageTurn[] = [];
    private isOpen: boolean = false;
    private isStreaming: boolean = false;
    private isSettingsOpen: boolean = false;

    public localEngine: AgriculturalExpertEngine = new AgriculturalExpertEngine();
    public context: ConversationContext = {
        crop: null,
        cropAgeDays: null,
        intent: null,
        awaitingSlot: null
    };

    private geminiApiKey: string | null = null;

    // DOM Elements
    private widgetContainer!: HTMLElement;
    private fabButton!: HTMLButtonElement;
    private chatWindow!: HTMLElement;
    private settingsDrawer!: HTMLElement;
    private messagesContainer!: HTMLElement;
    private inputField!: HTMLInputElement;
    private sendButton!: HTMLButtonElement;
    private chipsContainer!: HTMLElement;
    private titleEl!: HTMLElement;
    private badgeEl!: HTMLElement;
    private statusEl!: HTMLElement;
    private apiKeyBtnEl!: HTMLButtonElement;
    private resetBtnEl!: HTMLButtonElement;
    private minimizeBtnEl!: HTMLButtonElement;
    private footerNoteEl!: HTMLElement;
    private fabLabelEl!: HTMLElement;

    private i18nDict: Record<AppLanguage, TranslationDict> = {
        en: {
            fabAria: "Open Farmer Buddy AI Chat",
            fabLabel: "Farmer Buddy AI",
            title: "Farmer Buddy",
            badge: "AI Agronomist",
            status: "Empathetic Rural Agricultural Advisor",
            resetTitle: "Start New Conversation",
            minimizeTitle: "Minimize Chat",
            settingsTitle: "AI Settings & API Key",
            inputPlaceholder: "Ask about crops, pests, fertilizers, or crop age...",
            sendAria: "Send Message",
            footerNote: "⚡ Hybrid Cloud & Stateful Local Agronomist · Always Online",
            senderTag: "👨‍🌾 Farmer Buddy",
            welcomeMsg: "Hello Friend! I am your **Farmer Buddy (কৃষি বন্ধু)**.\n\nFrom crop disease diagnosis, balanced fertilizer dosages (per decimal or bigha), to irrigation alerts—I am right by your side. How can I help your field today?"
        },
        bn: {
            fabAria: "কৃষি বন্ধু চ্যাট খুলুন",
            fabLabel: "কৃষি বন্ধু AI",
            title: "কৃষি বন্ধু",
            badge: "AI কৃষিবিদ",
            status: "সহানুভূতিশীল মাঠপর্যায়ের কৃষি সহচর",
            resetTitle: "নতুন আলাপ শুরু করুন",
            minimizeTitle: "মিনিমাইজ করুন",
            settingsTitle: "AI সেটিংস ও API কী",
            inputPlaceholder: "ফসলের সমস্যা বা বয়স লিখুন (যেমন: ৪০ দিন, সার, পোকা)...",
            sendAria: "বার্তা পাঠান",
            footerNote: "⚡ হাইব্রিড ক্লাউড ও স্মার্ট লোকাল কৃষি বিশেষজ্ঞ · সবসময় সক্রিয়",
            senderTag: "👨‍🌾 কৃষি বন্ধু",
            welcomeMsg: "আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**।\n\nফসলের রোগবালাই, সুষম সারের হিসাব (শতাংশ বা বিঘা প্রতি মাত্রা), সেচ কিংবা বাজারদর—যেকোনো প্রয়োজনে আমি আপনার পাশে আছি। আজ আপনার ক্ষেতের জন্য কী তথ্য প্রয়োজন?"
        }
    };

    private chipsDict: Record<AppLanguage, QuickActionChip[]> = {
        en: [
            { id: "fertilizer", label: "Fertilizer Schedule", icon: "💧", prompt: "What are the exact fertilizer split doses for my crop?" },
            { id: "age40", label: "Crop at 40 Days", icon: "🌿", prompt: "My crop is 40 days old. What urgent care is needed now?" },
            { id: "age20", label: "Crop at 20 Days", icon: "🌱", prompt: "My crop is 20 days old. What fertilizer and irrigation should I apply?" },
            { id: "pest", label: "Leaf Pest & Yellowing", icon: "🐛", prompt: "I see yellow leaves and insect damage on my plants. How to cure it?" },
            { id: "weather", label: "Rain & Storm Prep", icon: "🌦️", prompt: "Heavy rain is forecast. How to protect my field and drainage?" }
        ],
        bn: [
            { id: "fertilizer", label: "সুষম সার হিসাব", icon: "💧", prompt: "আমার ফসলের জন্য কোন সময়ে কতটুকু সার দিতে হবে?" },
            { id: "age40", label: "৪০ দিন বয়স", icon: "🌿", prompt: "আমার গাছের বয়স ৪০ দিন, এখন কী সার ও স্প্রে দিতে হবে?" },
            { id: "age20", label: "২০ দিন বয়স", icon: "🌱", prompt: "আমার চারাগাছের বয়স ২০ দিন, এখন কী পরিচর্যা দরকার?" },
            { id: "pest", label: "পোকা ও হলুদ পাতা", icon: "🐛", prompt: "গাছের পাতা হলুদ হয়ে কোঁকড়ে যাচ্ছে, কীভাবে ঘরোয়া উপায়ে দূর করবো?" },
            { id: "weather", label: "ঝড় ও বৃষ্টির প্রস্তুতি", icon: "🌦️", prompt: "ভারী বৃষ্টির পূর্বাভাসে জমির সুরক্ষা ও পানি নিষ্কাশনে কী করণীয়?" }
        ]
    };

    constructor() {
        if (typeof window !== "undefined" && (window as any).currentAppLanguage === "bn") {
            this.currentLang = "bn";
        } else {
            this.currentLang = "en";
        }

        this.geminiApiKey = this.getStoredApiKey();

        if (typeof document !== "undefined") {
            this.initDOM();
            this.loadSessionMessages();
            this.renderHistory();
            this.bindEvents();
            this.updateEngineStatusUI();
        }
    }

    public getStoredApiKey(): string | null {
        try {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem("GEMINI_API_KEY");
                if (stored && stored.trim() && stored.trim() !== "your_api_key_here") {
                    return stored.trim();
                }
                if ((window as any).GEMINI_API_KEY && typeof (window as any).GEMINI_API_KEY === "string") {
                    return (window as any).GEMINI_API_KEY.trim();
                }
                if ((window as any).__GEMINI_API_KEY__ && typeof (window as any).__GEMINI_API_KEY__ === "string") {
                    return (window as any).__GEMINI_API_KEY__.trim();
                }
            }
            if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
                return (import.meta as any).env.VITE_GEMINI_API_KEY.trim();
            }
            if (typeof process !== "undefined" && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
                return process.env.REACT_APP_GEMINI_API_KEY.trim();
            }
        } catch (e) {}
        return null;
    }

    public setApiKey(key: string): void {
        const cleanKey = (key || "").trim();
        if (cleanKey) {
            localStorage.setItem("GEMINI_API_KEY", cleanKey);
            this.geminiApiKey = cleanKey;
        } else {
            localStorage.removeItem("GEMINI_API_KEY");
            this.geminiApiKey = null;
        }
        this.updateEngineStatusUI();
    }

    public updateEngineStatusUI(): void {
        const isBn = (this.currentLang === "bn");
        const badge = this.chatWindow ? this.chatWindow.querySelector("#fbEngineBadge") : null;
        if (!badge) return;

        if (this.geminiApiKey) {
            badge.className = "fb-engine-badge cloud";
            badge.innerHTML = `⚡ ${isBn ? "Gemini ক্লাউড AI সক্রিয়" : "Gemini Cloud AI Active"}`;
        } else {
            badge.className = "fb-engine-badge local";
            badge.innerHTML = `🧠 ${isBn ? "স্মার্ট লোকাল বিশেষজ্ঞ সক্রিয়" : "Smart Local Expert Active"}`;
        }
    }

    private getStorageKey(): string {
        return `${this.storageKeyPrefix}${this.currentLang}`;
    }

    private loadSessionMessages(): void {
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

    private saveSessionMessages(): void {
        try {
            const trimmed = this.messages.slice(-25);
            sessionStorage.setItem(this.getStorageKey(), JSON.stringify(trimmed));
        } catch (e) {}
    }

    public getRecentChatHistory(count: number = 10): ChatMessageTurn[] {
        if (!Array.isArray(this.chatHistory)) return [];
        return this.chatHistory.slice(-count);
    }

    public getActiveFarmContext(): FarmContext {
        const isBn = (typeof window !== "undefined" && (window as any).currentAppLanguage === "bn") || (this.currentLang === "bn");

        const cropSelect = document.getElementById("cropSelect") as HTMLSelectElement | null;
        let selectedCrop = isBn ? "টমেটো (Tomato)" : "Tomato";
        if (cropSelect && cropSelect.selectedIndex >= 0) {
            selectedCrop = cropSelect.options[cropSelect.selectedIndex]?.text?.trim() || cropSelect.value;
        }

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

    private buildDynamicSystemInstruction(farmContext: FarmContext): string {
        const isBn = (this.currentLang === "bn");
        let instruction = `You are "Farmer Buddy" (কৃষক বন্ধু), an empathetic, highly knowledgeable, and practical rural agricultural advisor and trusted friend to farmers in Bangladesh and South Asia.

CORE BEHAVIOR & TONE:
1. Speak like a caring, experienced friend in the field ("Friend" in English, "ভাই/বন্ধু" in Bangla). Be warm, encouraging, and directly helpful.
2. NEVER give generic, repetitive template answers. Always tailor your answer specifically to the exact crop, plant age, symptom, soil condition, or market question the farmer just mentioned.
3. PAY STRICT ATTENTION TO CONTEXT:
   - If the farmer already mentioned the crop (e.g., "Potato" or "Tomato"), DO NOT ask "Which crop are you fertilizing?" Instead, immediately give the exact fertilizer schedule and dosage for that crop!
   - If you asked a question in the previous turn (e.g., "How many days old is your crop?") and the farmer replies with just a number (e.g., "20" or "40") or a single word, immediately connect it to your previous question and give the specific stage advice for a 20- or 40-day-old crop.

EXPERTISE DOMAINS:
- Fertilizer Dosages: Provide exact dosages (per decimal/শতাংশ or bigha/বিঘা) of Urea, TSP, DAP, MoP, Gypsum, Zinc, Boron, and compost.
- Pest & Disease: Identify fungal, viral, and insect attacks. Give immediate home/organic remedies (e.g. neem oil) and specific chemical recommendations if severe.
- Irrigation & Weather: Advise on water depth and drainage furrows.

RESPONSE STRUCTURE:
- Direct Empathy & Specific Diagnosis (1 short sentence).
- Actionable Steps (2 to 4 concise bullet points with bold titles and exact measurements).
- Smart Follow-up (1 relevant question to help them further—never repeat what they answered).

LANGUAGE RULE:
${isBn ? "Always respond in natural, friendly, easy-to-understand Bangla." : "Always respond in clear, friendly English."}`;

        if (farmContext) {
            instruction += `\n\nCURRENT ACTIVE 3D FARM TELEMETRY:\n• Crop: ${farmContext.crop}\n• Growth Stage: ${farmContext.growthStage}\n• Soil Moisture: ${farmContext.soilMoisture}\n• Soil NPK: ${farmContext.soilNPK}\n• Weather: ${farmContext.weather}`;
        }

        return instruction;
    }

    private initDOM(): void {
        const texts = this.i18nDict[this.currentLang];
        const isBn = (this.currentLang === "bn");

        this.widgetContainer = document.createElement("div");
        this.widgetContainer.id = "farmerBuddyWidget";
        this.widgetContainer.className = "farmer-buddy-widget";

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
        this.fabLabelEl = this.fabButton.querySelector("#fbFabLabel") as HTMLElement;

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
                    <h3 class="fb-title">
                        <span id="fbTitleText">${texts.title}</span>
                        <span id="fbBadgeText" class="fb-badge">${texts.badge}</span>
                    </h3>
                    <p id="fbStatusText" class="fb-status">${texts.status}</p>
                </div>
            </div>
            <div class="fb-header-actions">
                <button id="fbApiKeyBtn" class="fb-hdr-btn" title="${texts.settingsTitle}">🔑</button>
                <button id="fbResetBtn" class="fb-hdr-btn" title="${texts.resetTitle}">🔄</button>
                <button id="fbMinimizeBtn" class="fb-hdr-btn" title="${texts.minimizeTitle}">✕</button>
            </div>
        `;

        this.titleEl = header.querySelector("#fbTitleText") as HTMLElement;
        this.badgeEl = header.querySelector("#fbBadgeText") as HTMLElement;
        this.statusEl = header.querySelector("#fbStatusText") as HTMLElement;
        this.apiKeyBtnEl = header.querySelector("#fbApiKeyBtn") as HTMLButtonElement;
        this.resetBtnEl = header.querySelector("#fbResetBtn") as HTMLButtonElement;
        this.minimizeBtnEl = header.querySelector("#fbMinimizeBtn") as HTMLButtonElement;

        this.settingsDrawer = document.createElement("div");
        this.settingsDrawer.id = "fbSettingsDrawer";
        this.settingsDrawer.className = "fb-settings-drawer";
        this.settingsDrawer.innerHTML = `
            <div class="fb-engine-status-row">
                <span><strong>${isBn ? "কৃষি AI ইঞ্জিন মোড:" : "Agri AI Engine Mode:"}</strong></span>
                <span id="fbEngineBadge" class="fb-engine-badge local">
                    🧠 ${isBn ? "স্মার্ট লোকাল বিশেষজ্ঞ" : "Smart Local Expert"}
                </span>
            </div>
            <div class="fb-api-input-wrap">
                <input
                    type="password"
                    id="fbApiKeyInput"
                    class="fb-api-key-input"
                    placeholder="${isBn ? 'Google Gemini API Key পেস্ট করুন...' : 'Paste Google Gemini API Key...'}"
                    value="${this.geminiApiKey || ''}"
                    autocomplete="off"
                />
                <button type="button" id="fbSaveKeyBtn" class="fb-settings-action-btn">${isBn ? "সংরক্ষণ" : "Save"}</button>
                <button type="button" id="fbClearKeyBtn" class="fb-settings-clear-btn" title="Clear Key">✕</button>
            </div>
            <div class="fb-settings-footer">
                <span>${isBn ? "কী না থাকলে লোকাল মোডে স্বয়ংক্রিয়ভাবে চলবে" : "Runs on Smart Local Engine if key omitted"}</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="fb-settings-link">
                    ${isBn ? "ফ্রি API Key নিন ↗" : "Get Free API Key ↗"}
                </a>
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

        this.inputField = inputArea.querySelector("#fbInput") as HTMLInputElement;
        this.sendButton = inputArea.querySelector("#fbSendBtn") as HTMLButtonElement;
        this.footerNoteEl = inputArea.querySelector("#fbFooterNote") as HTMLElement;

        this.chatWindow.appendChild(header);
        this.chatWindow.appendChild(this.settingsDrawer);
        this.chatWindow.appendChild(this.messagesContainer);
        this.chatWindow.appendChild(this.chipsContainer);
        this.chatWindow.appendChild(inputArea);

        this.widgetContainer.appendChild(this.fabButton);
        this.widgetContainer.appendChild(this.chatWindow);
        document.body.appendChild(this.widgetContainer);
    }

    public toggleSettingsDrawer(force?: boolean): void {
        this.isSettingsOpen = (force !== undefined) ? force : !this.isSettingsOpen;
        if (this.settingsDrawer) {
            if (this.isSettingsOpen) {
                this.settingsDrawer.classList.add("open");
                const input = this.settingsDrawer.querySelector("#fbApiKeyInput") as HTMLInputElement | null;
                if (input) setTimeout(() => input.focus(), 150);
            } else {
                this.settingsDrawer.classList.remove("open");
            }
        }
    }

    public setLanguage(lang: AppLanguage): void {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        const texts = this.i18nDict[lang];

        if (this.fabButton) this.fabButton.setAttribute("aria-label", texts.fabAria);
        if (this.fabLabelEl) this.fabLabelEl.textContent = texts.fabLabel;
        if (this.titleEl) this.titleEl.textContent = texts.title;
        if (this.badgeEl) this.badgeEl.textContent = texts.badge;
        if (this.statusEl) this.statusEl.textContent = texts.status;
        if (this.apiKeyBtnEl) this.apiKeyBtnEl.title = texts.settingsTitle;
        if (this.resetBtnEl) this.resetBtnEl.title = texts.resetTitle;
        if (this.minimizeBtnEl) this.minimizeBtnEl.title = texts.minimizeTitle;
        if (this.inputField) this.inputField.placeholder = texts.inputPlaceholder;
        if (this.sendButton) this.sendButton.setAttribute("aria-label", texts.sendAria);
        if (this.footerNoteEl) this.footerNoteEl.innerHTML = texts.footerNote;

        this.renderQuickChips();
        this.loadSessionMessages();
        this.renderHistory();
        this.updateEngineStatusUI();
    }

    private renderQuickChips(): void {
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

    private bindEvents(): void {
        this.fabButton.addEventListener("click", () => this.toggleWindow());

        if (this.apiKeyBtnEl) {
            this.apiKeyBtnEl.addEventListener("click", () => this.toggleSettingsDrawer());
        }
        if (this.minimizeBtnEl) {
            this.minimizeBtnEl.addEventListener("click", () => this.toggleWindow(false));
        }
        if (this.resetBtnEl) {
            this.resetBtnEl.addEventListener("click", () => this.resetConversation());
        }

        const saveKeyBtn = this.settingsDrawer.querySelector("#fbSaveKeyBtn");
        const clearKeyBtn = this.settingsDrawer.querySelector("#fbClearKeyBtn");
        const keyInput = this.settingsDrawer.querySelector("#fbApiKeyInput") as HTMLInputElement | null;

        if (saveKeyBtn && keyInput) {
            saveKeyBtn.addEventListener("click", () => {
                const key = keyInput.value.trim();
                this.setApiKey(key);
                const isBn = (this.currentLang === "bn");
                alert(key ? (isBn ? "✅ Gemini API কী সফলভাবে সংরক্ষিত হয়েছে!" : "✅ Gemini API Key saved successfully!") : (isBn ? "কী মুছে ফেলা হয়েছে।" : "API Key cleared."));
                this.toggleSettingsDrawer(false);
            });
        }

        if (clearKeyBtn && keyInput) {
            clearKeyBtn.addEventListener("click", () => {
                keyInput.value = "";
                this.setApiKey("");
            });
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

        window.addEventListener("languageChanged", (e: any) => {
            const targetLang = (e && e.detail && e.detail.lang === "bn") ? "bn" : "en";
            this.setLanguage(targetLang);
        });

        const langToggle = document.getElementById("langToggle") as HTMLInputElement | null;
        if (langToggle) {
            langToggle.addEventListener("change", () => {
                const targetLang = langToggle.checked ? "bn" : "en";
                this.setLanguage(targetLang);
            });
        }
    }

    public toggleWindow(forceState?: boolean): void {
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
            this.toggleSettingsDrawer(false);
        }
    }

    private renderHistory(): void {
        this.messagesContainer.innerHTML = "";
        this.messages.forEach(msg => {
            this.appendMessageDOM(msg);
        });
        this.scrollToBottom();
    }

    private appendMessageDOM(msg: ChatMessage): HTMLElement {
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

    public async handleUserSubmit(text: string): Promise<void> {
        if (!text || !text.trim() || this.isStreaming) return;
        const cleanText = text.trim();

        const userMsg: ChatMessage = {
            id: "u-" + Date.now(),
            sender: "user",
            text: cleanText,
            timestamp: Date.now()
        };
        this.messages.push(userMsg);
        this.appendMessageDOM(userMsg);
        this.saveSessionMessages();

        const buddyMsgId = "b-" + Date.now();
        const buddyMsg: ChatMessage = {
            id: buddyMsgId,
            sender: "buddy",
            text: "",
            timestamp: Date.now()
        };
        this.messages.push(buddyMsg);
        const buddyBubble = this.appendMessageDOM(buddyMsg);
        const textTarget = buddyBubble.querySelector(".msg-text") as HTMLElement;

        const isBn = (this.currentLang === "bn");
        textTarget.innerHTML = `<span class="fb-typing-indicator"><span class="fb-typing-dots"><span></span><span></span><span></span></span> <span class="fb-thinking-text">${isBn ? "ভাবছি..." : "Thinking..."}</span></span>`;

        this.isStreaming = true;
        this.setInputsDisabled(true);

        const recentHistory = this.getRecentChatHistory(10);
        const farmContext = this.getActiveFarmContext();
        let replyText: string | null = null;

        try {
            // LAYER 1: DIRECT GEMINI REST API
            if (this.geminiApiKey && navigator.onLine) {
                try {
                    replyText = await this.callDirectGemini(cleanText, recentHistory, farmContext);
                } catch (directErr: any) {
                    console.warn("[FarmerBuddy] Direct Gemini API failed:", directErr.message);
                }
            }

            // LAYER 1 (Secondary): LOCAL BACKEND PROXY
            if (!replyText && navigator.onLine) {
                try {
                    replyText = await this.callBackendProxy(cleanText, recentHistory, farmContext);
                } catch (proxyErr: any) {
                    console.warn("[FarmerBuddy] Backend proxy unavailable:", proxyErr.message);
                }
            }

            // LAYER 2: STATEFUL LOCAL AGRICULTURAL EXPERT ENGINE
            if (!replyText) {
                console.log("[FarmerBuddy] Generating response via Layer 2 Stateful Agricultural Engine...");
                replyText = this.localEngine.processQuery(cleanText, this.context, farmContext, this.currentLang);
            }

            await this.streamReply(replyText, textTarget, buddyMsg);

            this.chatHistory.push({ role: "user", parts: [{ text: cleanText }] });
            this.chatHistory.push({ role: "model", parts: [{ text: buddyMsg.text }] });
            this.saveSessionMessages();
        } catch (err: any) {
            console.error("[FarmerBuddy Critical Error]:", err);
            const safeText = this.localEngine.processQuery(cleanText, this.context, farmContext, this.currentLang);
            await this.streamReply(safeText, textTarget, buddyMsg);
        } finally {
            this.isStreaming = false;
            this.setInputsDisabled(false);
            this.saveSessionMessages();
            this.scrollToBottom();
        }
    }

    private async callDirectGemini(message: string, recentHistory: ChatMessageTurn[], farmContext: FarmContext): Promise<string> {
        const apiKey = this.geminiApiKey;
        if (!apiKey) throw new Error("NO_API_KEY");

        const dynamicSystemInstruction = this.buildDynamicSystemInstruction(farmContext);

        const contents: any[] = [];
        if (Array.isArray(recentHistory) && recentHistory.length > 0) {
            for (const item of recentHistory) {
                const role = (item.role === 'model' || (item as any).role === 'assistant') ? 'model' : 'user';
                const text = (item.parts && item.parts[0]?.text) ? item.parts[0].text.trim() : "";
                if (text) {
                    if (contents.length > 0 && contents[contents.length - 1].role === role) {
                        contents[contents.length - 1].parts[0].text += `\n${text}`;
                    } else {
                        contents.push({ role: role, parts: [{ text: text }] });
                    }
                }
            }
        }

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1].parts[0].text += `\n${message}`;
        } else {
            contents.push({ role: 'user', parts: [{ text: message }] });
        }

        const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-1.5-flash'];
        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 9000);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: contents,
                        systemInstruction: {
                            parts: [{ text: dynamicSystemInstruction }]
                        }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData?.error?.message || `HTTP_${response.status}`);
                }

                const data = await response.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply && reply.trim()) {
                    console.log(`[FarmerBuddy] Direct Gemini responded successfully via [${model}]`);
                    return reply.trim();
                }
            } catch (err) {
                console.warn(`[FarmerBuddy] Direct Gemini model [${model}] failed: ${(err as any).message}. Trying next...`);
                lastError = err;
            }
        }

        throw lastError || new Error("Direct Gemini API invocation failed.");
    }

    private async callBackendProxy(message: string, recentHistory: ChatMessageTurn[], farmContext: FarmContext): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(this.proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                history: recentHistory,
                context: farmContext
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP_${response.status}`);
        }

        const data = await response.json();
        if (data && typeof data.reply === "string" && data.reply.trim()) {
            console.log("[FarmerBuddy] Backend proxy responded successfully.");
            return data.reply.trim();
        }

        throw new Error("EMPTY_PROXY_REPLY");
    }

    private async streamReply(fullText: string, textTarget: HTMLElement, buddyMsg: ChatMessage): Promise<void> {
        const words = fullText.split(" ");
        let streamed = "";

        for (let i = 0; i < words.length; i++) {
            streamed += (i > 0 ? " " : "") + words[i];
            buddyMsg.text = streamed;
            textTarget.innerHTML = this.formatMarkdown(streamed);
            this.scrollToBottom();

            if (i % 3 === 0) {
                await new Promise(r => setTimeout(r, 12));
            }
        }
    }

    public resetConversation(): void {
        this.messages = [];
        this.chatHistory = [];
        this.context = {
            crop: null,
            cropAgeDays: null,
            intent: null,
            awaitingSlot: null
        };
        sessionStorage.removeItem(this.getStorageKey());
        this.loadSessionMessages();
        this.renderHistory();
        console.log("[FarmerBuddy] Conversation context and memory reset.");
    }

    private scrollToBottom(): void {
        requestAnimationFrame(() => {
            if (this.messagesContainer) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        });
    }

    private setInputsDisabled(disabled: boolean): void {
        if (this.inputField) this.inputField.disabled = disabled;
        if (this.sendButton) this.sendButton.disabled = disabled;
        if (!disabled && this.inputField) {
            this.inputField.focus();
        }
    }

    private formatMarkdown(raw: string): string {
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
        result = result.replace(/(<li class="fb-list-item">.*?<\/li>)+/g, "<ul class=\"fb-bullet-list\">$&</ul>");

        return result;
    }
}

// Auto-instantiate when DOM is ready
if (typeof window !== "undefined") {
    const initBuddy = () => {
        if (!(window as any).farmerBuddyInstance) {
            (window as any).farmerBuddyInstance = new FarmerBuddy();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initBuddy);
    } else {
        initBuddy();
    }
}

export default FarmerBuddy;
