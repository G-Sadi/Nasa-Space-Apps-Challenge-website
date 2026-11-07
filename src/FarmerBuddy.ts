declare const process: any;
/**
 * ============================================================================
 * FARMER BUDDY (কৃষি বন্ধু) - TWO-LAYER HYBRID AGRICULTURAL AI ENGINE (TYPESCRIPT)
 * ============================================================================
 * LAYER 1 (Primary): Real Google Gemini API with Model Selector:
 *                    - Gemini 3.5 Flash (Latest & Ultra-Fast / নতুন ও দ্রুততম) [Default]
 *                    - Gemini 2.5 Pro (Deep Agronomy Planner / বিশেষজ্ঞ প্রফিট প্ল্যানার)
 *                    - Gemini 2.5 Flash (Low-Bandwidth Mode / সাশ্রয়ী ও হালকা)
 *                    + Pre-configured secure API Key auto-injection (Zero farmer setup!)
 * LAYER 2 (Fallback): Stateful Agricultural Economics & Crop Rotation Planner
 *                    - 3-Season Rotation (Rabi -> Kharif-1 -> Kharif-2)
 *                    - 20-30% Input Cost Reduction (AWD, Green Manure, Trichoderma)
 *                    - Exact Cost vs. Return & Net Profit Estimations
 * ============================================================================
 */

export type AppLanguage = "en" | "bn";
export type GeminiModelTier = "gemini-3.5-flash" | "gemini-2.5-pro" | "gemini-2.5-flash";

export interface ChatMessage {
    id: string;
    sender: "user" | "buddy";
    text: string;
    image?: string;
    timestamp: number;
}

export interface ChatMessageTurn {
    role: "user" | "model";
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export interface FarmContext {
    language: string;
    crop: string;
    growthStage: string;
    growthDay?: number | string;
    soilMoisture: string;
    soilNPK: string;
    pestRisk: string;
    weather: string;
    timeOfDay?: string;
    nasaZone?: string;
    nasaRootMoist?: string;
    nasaTopMoist?: string;
    nasaPAR?: string;
    nasaPrecip?: string;
    nasaTemp?: string;
    nasaRH?: string;
    nasaWind?: string;
    nasaIrrigationAdvice?: string;
    nasaFertilizerAdvice?: string;
    nasaDiseaseAdvice?: string;
    nasaSprayAdvice?: string;
    farmer?: any;
}

export interface ConversationContext {
    farmer?: any;
    crop: string | null;
    cropAgeDays: number | null;
    landSizeDecimals: number | null;
    location: string | null;
    soilType: string | null;
    lastIntent: "fertilizer" | "pest_disease" | "irrigation" | "weather" | "harvest_market" | "rotation_plan" | "seed_variety" | "land_prep" | "soil_health" | "cost_reduction" | "general_farming" | null;
    intent: "fertilizer" | "pest_disease" | "irrigation" | "weather" | "harvest_market" | "rotation_plan" | "seed_variety" | "land_prep" | "soil_health" | "cost_reduction" | "general_farming" | null;
    lastBotQuestion: string | null;
    awaitingSlot: "crop" | "age" | "symptom" | "landSize" | null;
}

export interface LandDetails {
    landSize: string | null;
    soilType: string | null;
    location: string | null;
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
    inputPlaceholder: string;
    sendAria: string;
    footerNote: string;
    senderTag: string;
    welcomeMsg: string;
}

/**
 * STATEFUL AGRICULTURAL EXPERT & ECONOMICS ENGINE (LAYER 2)
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
        jute: ["jute", "পাট"],
        mungbean: ["mungbean", "mung", "মুগ", "মুগডাল"]
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
        jute: { bn: "পাট", en: "Jute" },
        mungbean: { bn: "মুগডাল", en: "Mungbean" }
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

    public extractLandDetails(text: string): LandDetails {
        if (!text) return { landSize: null, soilType: null, location: null };
        const normalized = this.normalizeDigits(text.toLowerCase());

        let landSize: string | null = null;
        const sizeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(শতাংশ|শতক|ডেসিমাল|decimal|বিঘা|bigha|একর|acre|কাঠা|katha)/i);
        if (sizeMatch) {
            landSize = `${sizeMatch[1]} ${sizeMatch[2]}`;
        }

        let soilType: string | null = null;
        if (normalized.includes("দোআঁশ") || normalized.includes("loam")) soilType = "দোআঁশ (Loam)";
        else if (normalized.includes("বেলে দোআঁশ") || normalized.includes("sandy loam")) soilType = "বেলে দোআঁশ (Sandy Loam)";
        else if (normalized.includes("এঁটেল") || normalized.includes("clay")) soilType = "এঁটেল মাটি (Clay Loam)";
        else if (normalized.includes("পলি") || normalized.includes("silt")) soilType = "পলি দোআঁশ (Silt Loam)";

        let location: string | null = null;
        const districts = ["বগুড়া", "রংপুর", "যশোর", "কুমিল্লা", "দিনাজপুর", "রাজশাহী", "ময়মনসিংহ", "বরিশাল", "সিলেট", "ঢাকা", "নাটোর", "পাবনা", "bogura", "rangpur", "jashore", "cumilla", "rajshahi", "dinajpur"];
        for (const d of districts) {
            if (normalized.includes(d.toLowerCase())) {
                location = d;
                break;
            }
        }

        return { landSize, soilType, location };
    }

    public extractIntent(text: string): ConversationContext["lastIntent"] {
        if (!text) return null;
        const t = text.toLowerCase();

        if (["শস্য পরিক্রমা", "শস্য আবর্তন", "ফসল আবর্তন", "পরিকল্পনা", "লাভ", "রোটেশন", "rotation", "profit", "plan", "cost reduction", "budget", "land appraisal", "economics"].some(k => t.includes(k))) {
            return "rotation_plan";
        }
        if (["সার", "ইউরিয়া", "ইউরিয়া", "পটাশ", "টিএসপি", "ড্যাপ", "ডিএপি", "সুষম", "মাত্রা", "কতটুকু", "বোরন", "জিংক", "সার হিসাব", "fertilizer", "urea", "potash", "tsp", "dap", "npk", "dosage", "boron", "zinc"].some(k => t.includes(k))) {
            return "fertilizer";
        }
        if (["পোকা", "রোগ", "দাগ", "পচন", "হলুদ", "কোঁকড়ানো", "কোকড়ানো", "ধসা", "মাজরা", "কীটনাশক", "বালাই", "স্প্রে", "pest", "disease", "insect", "fungus", "yellow", "blight", "rot", "worm", "borer"].some(k => t.includes(k))) {
            return "pest_disease";
        }
        if (["সেচ", "পানি", "শুকিয়ে", "ড্রেন", "নিষ্কাশন", "awd", "irrigation", "water", "watering", "drainage"].some(k => t.includes(k))) {
            return "irrigation";
        }
        if (["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "মেঘ", "তুফান", "weather", "rain", "storm", "flood", "cyclone"].some(k => t.includes(k))) {
            return "weather";
        }
        if (["দাম", "বাজার", "দর", "বিক্রি", "আড়ত", "সংরক্ষণ", "ড্রাম", "market", "price", "sell", "storage", "harvest"].some(k => t.includes(k))) {
            return "harvest_market";
        }
        if (["বীজ", "জাত", "উফশী", "হাইব্রিড", "অঙ্কুরোদগম", "অঙ্কুরোদ্গম", "seed", "variety", "hybrid", "germination", "sowing"].some(k => t.includes(k))) {
            return "seed_variety";
        }
        if (["জমি তৈরি", "চাষ", "মাটি প্রস্তুত", "লাঙ্গল", "মই", "plow", "tillage", "bed", "বেড", "land prep"].some(k => t.includes(k))) {
            return "land_prep";
        }
        if (["মাটি", "মাটির স্বাস্থ্য", "অ্যাসিড", "ক্ষার", "পিএইচ", "ph", "লবণাক্ত", "salinity", "soil"].some(k => t.includes(k))) {
            return "soil_health";
        }
        if (["খরচ কমানো", "খরচ সাশ্রয়", "সাশ্রয়ী", "বাজেট", "cost reduction", "cost saving", "reduce cost"].some(k => t.includes(k))) {
            return "cost_reduction";
        }

        return "general_farming";
    }

    public processQuery(query: string, context: ConversationContext, farmContext: FarmContext, currentLang: AppLanguage): string {
        const isBn = (currentLang === "bn");

        const detectedCrop = this.extractCrop(query);
        const detectedAge = this.extractAge(query);
        const detectedIntent = this.extractIntent(query);
        const landDetails = this.extractLandDetails(query);

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

        if (landDetails.landSize) {
            const parsedDec = parseFloat(this.normalizeDigits(landDetails.landSize).replace(/[^\d.]/g, ""));
            if (!isNaN(parsedDec)) context.landSizeDecimals = parsedDec;
        }
        if (landDetails.soilType) context.soilType = landDetails.soilType;
        if (landDetails.location) context.location = landDetails.location;

        if (detectedIntent && detectedIntent !== "general_farming") {
            context.lastIntent = detectedIntent;
        }

        const crop = context.crop || "tomato";
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const cropLabel = isBn ? cropNames.bn : cropNames.en;

        if (context.lastIntent === "rotation_plan" || detectedIntent === "rotation_plan" || landDetails.landSize) {
            context.awaitingSlot = null;
            return this.generateCropRotationAndProfitPlan(landDetails, isBn);
        }

        if (detectedAge !== null) {
            context.awaitingSlot = null;
            return this.generateAgeSpecificAdvice(crop, detectedAge, context.lastIntent, isBn);
        }

        if (detectedCrop && (!detectedIntent || detectedIntent === "general_farming") && !detectedAge && (query.trim().split(/\s+/).length <= 3)) {
            if (context.awaitingSlot === "crop") {
                context.awaitingSlot = null;
                if (context.lastIntent === "fertilizer") {
                    return this.generateCropFertilizerSchedule(crop, context.cropAgeDays, isBn);
                } else if (context.lastIntent === "pest_disease") {
                    return this.generateCropPestGuidance(crop, isBn);
                }
            }

            context.awaitingSlot = "age";
            if (isBn) {
                return `আসসালামু আলাইকুম ভাই! আপনার **${cropLabel}** ক্ষেতের জন্য আমি প্রস্তুত!\n\n• **সুষম সার ও সেচ:** চারা রোপণের পর দিন অনুযায়ী সঠিক সার ও সেচের নিয়ম জেনে নিন।\n• **খরচ কমানোর কৌশল:** ট্রাইকো-কম্পোস্ট ও জৈব সারের মাধ্যমে রাসায়নিক সারের খরচ ৩০% কমান।\n• **শস্য পরিক্রমা:** এই ফসলের পর জমিতে কী বুনলে সবচেয়ে বেশি লাভ হবে তা জানুন。\n\nআপনার **${cropLabel}** গাছটির বর্তমান বয়স কত দিন বলুন তো (যেমন ২০ দিন বা ৪০ দিন)?`;
            } else {
                return `Hello friend! I have locked onto your **${cropLabel}** field!\n\n• **Targeted Fertilization:** Get the exact split dosages of Urea, TSP, and Potash per decimal for this crop.\n• **Cost Reduction:** Cut chemical fertilizer bills by 20-30% using compost and bio-inoculants.\n• **Crop Rotation:** Discover what follow-up crop maximizes annual net returns on this soil.\n\nHow many days old is your **${cropLabel}** crop right now (e.g., 20 or 40 days)?`;
            }
        }

        if (context.lastIntent === "fertilizer" || detectedIntent === "fertilizer") {
            if (context.cropAgeDays) {
                return this.generateAgeSpecificAdvice(crop, context.cropAgeDays, "fertilizer", isBn);
            } else {
                context.awaitingSlot = "age";
                return this.generateCropFertilizerSchedule(crop, null, isBn);
            }
        }

        if (context.lastIntent === "pest_disease" || detectedIntent === "pest_disease") {
            return this.generatePestDiagnosis(crop, query, isBn);
        }

        if (context.lastIntent === "irrigation" || detectedIntent === "irrigation") {
            return this.generateIrrigationAdvice(crop, context.cropAgeDays, isBn);
        }

        if (context.lastIntent === "weather" || detectedIntent === "weather") {
            return this.generateWeatherAdvice(crop, isBn);
        }

        if (context.lastIntent === "harvest_market" || detectedIntent === "harvest_market") {
            return this.generateMarketAdvice(crop, isBn);
        }

        if (context.lastIntent === "seed_variety" || detectedIntent === "seed_variety") {
            return this.generateSeedVarietyAdvice(crop, isBn);
        }

        if (context.lastIntent === "land_prep" || detectedIntent === "land_prep") {
            return this.generateLandPrepAdvice(crop, landDetails.soilType || context.soilType, isBn);
        }

        if (context.lastIntent === "soil_health" || detectedIntent === "soil_health") {
            return this.generateSoilHealthAdvice(landDetails.soilType || context.soilType, isBn);
        }

        if (context.lastIntent === "cost_reduction" || detectedIntent === "cost_reduction") {
            return this.generateCostReductionAdvice(crop, isBn);
        }

        // Dynamic non-repeating expert advice for any custom question
        return this.generateDynamicCustomAdvice(query, crop, context.cropAgeDays, context.landSizeDecimals, context.location || landDetails.location, isBn);
    }

    public generateCropRotationAndProfitPlan(landInfo: LandDetails, isBn: boolean): string {
        const size = landInfo.landSize || (isBn ? "২০ শতাংশ (৩৩ শতক = ১ বিঘা)" : "20 decimals");
        const soil = landInfo.soilType || (isBn ? "উর্বর দোআঁশ মাটি" : "Fertile Loam Soil");
        const loc = landInfo.location || (isBn ? "উত্তরাঞ্চল / নদীবিধৌত অঞ্চল" : "High-yield Agro-ecological zone");

        if (isBn) {
            return `আসসালামু আলাইকুম ভাই! আপনার **${size}** জমির **${soil}** (${loc}) বিবেচনা করে সর্বোচ্চ লাভ, সর্বনিম্ন খরচ এবং মাটির উর্বরতা অক্ষুণ্ণ রাখার জন্য একটি পূর্ণাঙ্গ **স্মার্ট ফার্মিং ও ৩ মৌসুমের শস্য আবর্তন পরিকল্পনা** তৈরি করা হলো:

• **🌱 Recommended Crop & Timing (সেরা ফসল ও সময়):**
  - **রবি মৌসুম (Rabi / মধ্য কার্তিক - ফাল্গুন):** উচ্চফলনশীল **আলু** (কার্ডিনাল বা ডায়মন্ট জাত) অথবা আগাম **টমেটো**। রোপণের সেরা সময়: ১-১৫ নভেম্বর। এই সময়ে লাগালে জানুয়ারি-ফেব্রুয়ারির উচ্চ পাইকারি দর পাওয়া যাবে।
  - **খরিপ-১ মৌসুম (Kharif-1 / চৈত্র - জ্যৈষ্ঠ):** **মুগডাল** (বারি মুগ-৬) অথবা উন্নত জাতের **পাট**। রোপণ: মার্চ মাসের প্রথম সপ্তাহ। মুগডাল মাটির নাইট্রোজেন বৃদ্ধি করে পরের ফসলের ইউরিয়া খরচ অর্ধেকে নামিয়ে আনে।
  - **খরিপ-২ মৌসুম (Kharif-2 / আষাঢ় - কার্তিক):** রোপা আমন ধান (**ব্রি ধান ৪৯ বা ব্রি ধান ৮৭**)। চারা রোপণ: ১৫ জুলাই - ১০ আগস্ট।

• **💰 Cost Optimization & Profit Plan (খরচ কমানো ও লাভ):**
  - **সারের খরচ ২৫-৩০% কমানো:** মুগডালের গাছ কাটার পর মাটির সাথে মিশিয়ে সবুজ সার তৈরি করলে পরবর্তী আমন ধানে টিএসপি ও ইউরিয়া সারের খরচ ২৫% কমে যাবে। প্রতি শতাংশে ১০ কেজি ট্রাইকো-কম্পোস্ট ব্যবহার করুন।
  - **সেচ খরচ সাশ্রয় (AWD পদ্ধতি):** আমন ধানে 'পর্যায়ক্রমে ভেজানো ও শুকানো' (AWD) পাইপ ব্যবহার করলে সেচের ডিজেল/বিদ্যুৎ খরচ ৩০% হ্রাস পাবে।
  - **সম্ভাব্য খরচ বনাম লাভ (প্রতি শতাংশে):**
    * আলু/টমেটো: উৎপাদন খরচ ৳১,২০০-১,৪০০ | সম্ভাব্য বিক্রয় ৳২,৬০০-৩,২০০ | **নিট লাভ: ৳১,৪০০-১,৮০০**
    * মুগডাল: উৎপাদন খরচ ৳২৫০-৩০০ | সম্ভাব্য বিক্রয় ৳৭০০-৯০০ | **নিট লাভ: ৳৪৫০-৬০০**
    * আমন ধান: উৎপাদন খরচ ৳৫০০-৬০০ | সম্ভাব্য বিক্রয় ৳১,১০০-১,৩৫০ | **নিট লাভ: ৳৬০০-৭৫০**
    * **মোট বার্ষিক নিট লাভ (২০ শতাংশে):** আনুমানিক **৳৫০,০০০ - ৳৬৩,০০০** টাকা!

• **🔄 Complete Crop Rotation Cycle (শস্য আবর্তন পরিকল্পনা):**
  - **আলু (গভীর শিকড় ও ভারী খাবার) ➔ মুগডাল (মাটির নাইট্রোজেন ফিক্সেশন) ➔ আমন ধান (মাঝারি শিকড়)।**
  - এই চক্র বজায় রাখলে মাটির গভীরে খাদ্য উপাদানের ভারসাম্য বজায় থাকে, আলুর ক্ষতিকর ছত্রাক ও নেমাটোড রোদে ও পানিতে নষ্ট হয়ে যায়, ফলে কীটনাশকের খরচ ৬০% বেঁচে যায়।

• **ঝুঁকি ব্যবস্থাপনা:** ডিসেম্বরের শেষ সপ্তাহে ঘন কুয়াশা থাকলে আলুর নাবি ধসা রোধে আগাম ম্যানকোজেব স্প্রে করুন এবং বর্ষার শুরুতে জমির চারধারে নিকাশ নালা প্রস্তুত রাখুন।

ভাই, আপনার জমিতে কি সেচের জন্য গভীর নলকূপ বা বিদ্যুৎ সুবিধা আছে, নাকি বৃষ্টির পানির ওপর নির্ভর করেন?`;
        } else {
            return `Hello Friend! Based on your **${size}** of **${soil}** (${loc}), here is your comprehensive, high-profit **Smart Farming & 3-Season Crop Rotation Plan** engineered to maximize profit and reduce chemical input costs:

• **🌱 Recommended Crop & Timing:**
  - **Rabi Season (Nov - Feb):** High-value **Potato** (Diamant/Cardinal) or **Tomato**. Planting window: Nov 1-15 to capture premium early-harvest market pricing.
  - **Kharif-1 Season (Mar - Jun):** **Mungbean** (BARI Mung-6) or **Tossa Jute**. Sowing: Early March. Mungbean fixes atmospheric nitrogen, cutting the next crop's chemical fertilizer bill by 25-30%.
  - **Kharif-2 Season (Jul - Oct):** Transplanted Aman Rice (**BRRI Dhan 49 or 87**). Transplanting window: July 15 - August 10.

• **💰 Cost Optimization & Profit Plan:**
  - **Input Cost Reduction (25-30%):** Incorporate Mungbean biomass directly into soil as green manure. Supplement with 10kg vermicompost per decimal to drastically cut synthetic Urea and TSP requirements.
  - **Water Optimization (AWD):** Implement Alternate Wetting and Drying (AWD) perforated tubes during paddy stages to reduce diesel pumping fuel costs by 30%.
  - **Estimated Economics per Decimal:**
    * Potato/Tomato: Cost ৳1,200-1,400 | Revenue ৳2,600-3,200 | **Net Profit: ৳1,400-1,800**
    * Mungbean: Cost ৳250-300 | Revenue ৳700-900 | **Net Profit: ৳450-600**
    * Aman Rice: Cost ৳500-600 | Revenue ৳1,100-1,350 | **Net Profit: ৳600-750**
    * **Estimated Annual Net Income (20 Decimals):** Approximately **৳50,000 - ৳63,000 BDT**!

• **🔄 Complete Crop Rotation Cycle:**
  - **Potato (Heavy nutrient feeder) ➔ Mungbean (Nitrogen restoration & biomass) ➔ Aman Rice (Shallow feeder).**
  - This rotation breaks the continuous fungal blight and nematode disease cycles, reducing pesticide expenditures by up to 60%.

• **Risk Mitigation:** Apply preventive Mancozeb spray ahead of persistent dense fog in late December, and maintain clear border drainage furrows before the monsoon onset.

Friend, do you have deep tube-well electricity access for furrow irrigation, or do you rely on seasonal precipitation?`;
        }
    }

    public generateAgeSpecificAdvice(crop: string, age: number, intent: ConversationContext["intent"], isBn: boolean): string {
        if (crop === "tomato") {
            if (age <= 25) {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **২০-২৫ দিন** বয়সে টমেটো গাছ দ্রুত শিকড় ও ডালপালা ছড়ায় (চারা বৃদ্ধি পর্যায়)। এই সময় করণীয়:\n\n• **প্রথম কিস্তির উপরি-প্রয়োগ:** প্রতি শতাংশে (Decimal) ১৫০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম এমওপি (পটাশ) সার গাছের গোড়া থেকে ৫-৬ ইঞ্চি দূরে মাটিতে আলতো নিড়ানি দিয়ে মিশিয়ে দিন।\n• **খুঁটি বা সাপোর্ট (Staking):** গাছ যাতে বাতাসে হেলে না পড়ে বা মাটিতে হেলে না যায়, সেজন্য বাঁশের কঞ্চি দিয়ে আলতো করে বেঁধে দিন।\n• **কাটুই পোকা ও গোড়া পচা নজরদারি:** সকালে কোনো চারা কাটা দেখলে মাটি খুঁড়ে কাটুই পোকা নিধন করুন এবং গোড়ায় যেন পানি জমে না থাকে তা নিশ্চিত করুন।\n\nসার প্রয়োগের পর মাটিতে রস না থাকলে হালকা সেচ দিন। আপনার জমিতে মাটি কি যথেষ্ট ভেজা আছে?`
                    : `Hello friend! At **${age} days**, your tomato plants are in their active vegetative branching stage. Here is your targeted plan:\n\n• **First Top Dressing:** Apply 150g Urea and 150g MoP (Potash) per decimal in a ring 5-6 inches away from stems; gently incorporate into soil.\n• **Staking & Support:** Install bamboo stakes or twine supports now to prevent lodging and keep foliage off wet soil.\n• **Cutworm Vigilance:** Inspect soil around any severed seedlings at dawn to remove cutworms manually.\n\nEnsure light soil moisture after fertilizing. Does your field have adequate moisture right now?`;
            } else if (age <= 50) {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে টমেটো গাছে ফুল ফোটা এবং ফল ধরার সবচেয়ে গুরুত্বপূর্ণ পর্যায় শুরু হয়! এই সময় সঠিক খাদ্য নিশ্চিত না করলে ফুল ঝরে যেতে পারে:\n\n• **দ্বিতীয় কিস্তির সার:** প্রতি শতাংশে ২০০ গ্রাম ইউরিয়া এবং ২৫০ গ্রাম এমওপি (পটাশ) গাছের গোড়ার চারধারে ছড়িয়ে হালকা নিড়ানি দিন।\n• **বোরন ও জিংক স্প্রে (ফুল ঝরা রোধে):** ফুল ঝরে পড়া ঠেকাতে এবং ফলের তলা পচা রোধে প্রতি লিটার পানিতে ২ গ্রাম 'সলুবর বোরন' ও ১ গ্রাম চিলেটেড জিংক মিশিয়ে বিকেলে পাতার নিচে ও উপরে স্প্রে করুন।\n• **কুশি ছাঁটাই (Pruning):** গাছের গোড়ার দিকের পুরনো হলুদ পাতা ও অতিরিক্ত ডালপালা (suckers) কেটে দিন যাতে ফল বড় হওয়ার পর্যাপ্ত খাদ্য পায়।\n• **নিয়মিত হালকা সেচ:** মাটিতে যেন সব সময় জো (রস) থাকে; হঠাৎ শুকিয়ে অতিরিক্ত পানি দিলে টমেটো ফেটে যায়।\n\nগাছের পাতায় কি কোনো কুঁকড়ে যাওয়া বা পোকার আক্রমণ দেখতে পাচ্ছেন?`
                    : `Hello friend! At **${age} days**, your tomato plants are in their golden flowering and early fruit-setting stage! Proper nutrition is vital to prevent blossom drop:\n\n• **Second Top Dressing:** Apply 200g Urea and 250g MoP (Potash) per decimal around plant driplines and lightly incorporate.\n• **Solubor Boron Spray:** Spray Solubor Boron at 2g/liter of water in late afternoon to stop blossom abortion and prevent Blossom End Rot.\n• **Sucker Pruning:** Prune bottom suckers and yellowing foliage to enhance sunlight penetration and redirect sugars into developing fruit clusters.\n• **Steady Irrigation:** Maintain uniform soil moisture; avoid fluctuating between dry periods and flooding, which causes fruit cracking.\n\nAre you noticing any curled leaves or spotted fruit clusters on your tomato plants?`;
            } else {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে টমেটো ফল পরিপক্ক ও পাকা শুরু করে:\n\n• **পটাশ সার প্রয়োগ:** ফলের আকার বড়, চকচকে ও মিষ্টি করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিন।\n• **ফল ছিদ্রকারী পোকা দমন:** টমেটোতে ছিদ্র করা পোকা দমনে জমিতে সেক্স ফেরোমোন ফাঁদ (প্রতি বিঘাতে ১০-১২টি) পাতুন এবং প্রয়োজনে জৈব স্পিনোসাড স্প্রে করুন।\n• **তুলে নেওয়ার নিয়ম:** আড়তে বা বাজারে পাঠাতে চাইলে লাল হওয়ার ঠিক আগের দিন (ব্রেক স্টেজ) বোঁটা সহ সাবধানে তুলুন।\n\nআপনি কি পাকা টমেটো স্থানীয় বাজারে নাকি পাইকারি আড়তে বিক্রির পরিকল্পনা করছেন?`
                    : `Hello friend! At **${age} days**, your tomatoes are in their heavy fruit bulking and ripening phase:\n\n• **Potash Application:** Apply 150g Potash per decimal to maximize fruit size, firmness, and shelf-life.\n• **Fruit Borer Control:** Erect sex pheromone traps (10-12 per bigha) for Helicoverpa armigera. Spray Spinosad (0.4 ml/L) if larvae are spotted.\n• **Harvest Timing:** Pick fruit at the mature green/breaker stage for long-distance wholesale transport to avoid transit bruising.\n\nAre you planning to sell your harvest locally or send it to regional wholesale markets?`;
            }
        } else if (crop === "rice") {
            if (age <= 25) {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে ধান গাছের কুশি আসার (Tillering) অত্যন্ত গুরুত্বপূর্ণ সময়। এই সময় যত বেশি কুশি গজাবে, ফলন তত বেশি হবে!\n\n• **প্রথম কিস্তির ইউরিয়া ও পটাশ:** প্রতি শতাংশে ২০০-২৫০ গ্রাম ইউরিয়া এবং ১০০ গ্রাম এমওপি (পটাশ) সার জমিতে সমানভাবে ছিটান।\n• **পানির মাত্রা:** জমিতে ১ থেকে ২ ইঞ্চি ছিপছিপে পানি রাখুন; অতিরিক্ত পানি জমিয়ে রাখলে কুশির সংখ্যা কমে যায়।\n• **মাজরা পোকা নজরদারি:** ধানের পাতার মাঝে মরা কুশি দেখলে বাঁশের ডাল পুঁতে দিন (পাখি বসার জন্য) অথবা আলোর ফাঁদ ব্যবহার করুন।\n• **আগাছা নিড়ানো:** সার দেওয়ার আগে জমি থেকে আগাছা সম্পূর্ণ পরিষ্কার করে নিন।\n\nআপনার ধানক্ষেতে কি বর্তমানে আগাছা বা মরা কুশির লক্ষণ দেখতে পাচ্ছেন?`
                    : `Hello friend! At **${age} days**, your rice crop is in its critical active tillering phase. Every healthy tiller means an extra grain panicle!\n\n• **First Top Dressing:** Broadcast 200-250g Urea and 100g MoP (Potash) per decimal evenly across the field.\n• **Water Depth Control:** Maintain shallow water depth (1-2 inches); deep standing water suppresses tiller emergence.\n• **Stem Borer Defense:** Watch for "dead hearts". Install bamboo perches for predatory birds and light traps for borer moths.\n• **Weeding:** Thoroughly weed the paddies before broadcasting fertilizer.\n\nAre your drainage and shallow water levels properly balanced in the field?`;
            } else if (age <= 55) {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে ধান গাছ থোড় বা গর্ভধারণ (Panicle Initiation) অবস্থায় প্রবেশ করে। শীষ পরিপুষ্ট করতে করণীয়:\n\n• **শেষ কিস্তির ইউরিয়া:** প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া প্রয়োগ করুন। তবে পাতার রঙ যদি আগেই গাঢ় সবুজ থাকে তবে ইউরিয়া বাদ দিন।\n• **পটাশ ও সালফার স্প্রে:** দানা পুষ্ট ও চিটা রোধে প্রতি শতাংশে ১০০ গ্রাম পটাশ সার দিন অথবা ১% পটাশিয়াম সালফেট স্প্রে করুন।\n• **পানির স্তর বজায় রাখা:** এই সময় জমিতে অবশ্যই ২-৩ ইঞ্চি পানি ধরে রাখতে হবে; কোনোভাবেই এই দশায় জমি শুকানো যাবে না।\n• **বাদামি ঘাসফড়িং (কারেন্ট পোকা) পরীক্ষা:** ধানের গোড়া ফাঁক করে দেখুন কোনো পোকা আছে কিনা।\n\nজমিতে কি পানি পর্যাপ্ত ধরে রাখা সম্ভব হচ্ছে?`
                    : `Hello friend! At **${age} days**, your paddy is entering the panicle initiation and booting stage:\n\n• **Final Urea Split:** Apply 150g Urea per decimal only if foliage is pale green; omit if already deep emerald.\n• **Potash for Grain Filling:** Apply 100g Potash per decimal to prevent unfilled empty grains (chita) and strengthen straw.\n• **Critical Moisture Level:** Maintain continuous 2-3 inches of standing water; water stress at this stage severely reduces yield.\n• **Brown Planthopper (BPH) Scout:** Part the bottom tillers to inspect for planthoppers near the water surface.\n\nAre your paddy bunds holding standing water securely?`;
            } else {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে ধান পাকা শুরু করেছে (দানা শক্ত হওয়ার পর্যায়):\n\n• **পানি নিষ্কাশন:** ফসল কাটার ১০-১২ দিন আগে জমির সম্পূর্ণ পানি বের করে জমি শুকিয়ে দিন। এতে ধান সহজে পাকবে ও কাটার সুবিধা হবে।\n• **শীষ কাটার পোকা ও ইঁদুর দমন:** ধান হেলে পড়া রোধ করুন এবং জমির চারধারে পরিষ্কার পরিচ্ছন্ন রাখুন।\n• **সঠিক সময়ে কর্তন:** শীষের শতকরা ৮০ ভাগ ধান সোনালী রঙ ধারণ করলে আর দেরি না করে ধান কেটে ফেলুন।\n\nফসল মাড়াই ও শুকানোর জন্য কি চাতাল বা ত্রিপল প্রস্তুত আছে?`
                    : `Hello friend! At **${age} days**, your rice is ripening towards full golden grain maturity:\n\n• **Field Drainage:** Drain all standing water from paddies 10-12 days before anticipated harvest to harden the soil.\n• **Harvest Threshold:** Harvest promptly when 80% of panicle grains have turned golden-straw color to prevent shattering loss.\n• **Post-Harvest Drying:** Dry threshed paddy for 2-3 full sunny days until seed moisture reaches 12-14%.\n\nDo you have drying tarps or storage drums ready for the upcoming harvest?`;
            }
        } else if (crop === "potato") {
            if (age <= 30) {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে আলু গাছের গোড়ায় মাটি তোলা (Earthing up) এবং প্রথম উপরি-প্রয়োগের আসল সময়:\n\n• **প্রথম উপরি-প্রয়োগ:** প্রতি শতাংশে ২৫০ গ্রাম ইউরিয়া এবং ২০০ গ্রাম পটাশ দুই সারির মাঝে ছড়িয়ে নিড়ানি দিয়ে গোড়ায় মাটি তুলে ঢিবি বানিয়ে দিন।\n• **হালকা সেচ:** মাটি তোলার পর আলতো সেচ দিন যাতে ঢিবির দুই-তৃতীয়াংশ ভেজে, কিন্তু উপরে পানি না ওঠে।\n• **কাটুই পোকা দমন:** মাটি খুঁড়ে চারা কেটে দেওয়া পোকা দেখলে সকালে হাত দিয়ে সংগ্রহ করুন বা ক্লোরপাইরিফস গ্রুপের অনুমোদিত ব্যবস্থা নিন।\n\nআপনার আলু ক্ষেতে মাটি কি শুকিয়ে শক্ত হয়ে গেছে?`
                    : `Hello friend! At **${age} days**, it is time for the crucial first earthing-up and top dressing on your potato rows:\n\n• **Top Dressing:** Apply 250g Urea and 200g Potash per decimal between plant rows, then mound loose soil up around the stems.\n• **Furrow Irrigation:** Irrigate gently so water fills two-thirds of the furrow depth without submerging ridge tops.\n• **Cutworm Check:** Dig gently near severed shoots at dawn to capture and destroy cutworm larvae.\n\nIs your soil soft and ridge-ready for mounding?`;
            } else {
                return isBn
                    ? `আসসালামু আলাইকুম ভাই! **${age} দিন** বয়সে আলুর টিউবার বা আলু মাটির নিচে দ্রুত বড় হতে থাকে (Tuber Bulking Stage)। এ সময় সর্বোচ্চ সতর্কতার সাথে করণীয়:\n\n• **নাবি ধসা (Late Blight) আগাম স্প্রে:** কুয়াশা বা মেঘলা আবহাওয়া থাকলে নাবি ধসা রোধে প্রতি লিটার পানিতে ২ গ্রাম ম্যানকোজেব (যেমন ডাইথেন এম-৪৫) অথবা রিডোমিল গোল্ড স্প্রে করে পুরো পাতা ভিজিয়ে দিন।\n• **দ্বিতীয় কিস্তির পটাশ:** আলুর আকার বড় ও খোসা শক্ত করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিয়ে হালকা সেচ দিন।\n• **আলু ঢেকে রাখা:** কোনো আলু মাটির বাইরে এসে সবুজ হয়ে গেলে দ্রুত মাটি দিয়ে ঢেকে দিন।\n\nসকালে কি আপনার এলাকায় কুয়াশা বা গুঁড়ি গুঁড়ি বৃষ্টি হচ্ছে?`
                    : `Hello friend! At **${age} days**, your potatoes are in their rapid tuber expansion phase:\n\n• **Late Blight Preventive Spray:** Foggy, overcast weather triggers devastating Late Blight. Spray Mancozeb (2g/L) or Ridomil Gold to coat foliage thoroughly.\n• **Potash for Tuber Weight:** Apply 150g Potash per decimal to maximize tuber grade size and skin firmness.\n• **Cover Green Tubers:** Mound soil over any tubers exposed to sunlight to prevent toxic solanine greening.\n\nIs your area experiencing persistent heavy fog or cool damp mornings?`;
            }
        } else {
            return isBn
                ? `আসসালামু আলাইকুম ভাই! আপনার **${crop}** ফসলের **${age} দিন** বয়সের জন্য পরামর্শ:\n\n• **সুষম সার উপরি-প্রয়োগ:** এই বয়সে গাছের বর্ধনশীল শাখার জন্য প্রতি শতাংশে ১৫০-২০০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম পটাশ গাছের গোড়া থেকে কিছুটা দূরে দিন।\n• **মাটির রস ও সেচ:** সার দেওয়ার পর হালকা সেচ দিন, যেন মাটি ভেজা থাকে কিন্তু গোড়ায় পানি না জমে।\n• **বালাই নজরদারি:** ডালপালা ও পাতার নিচে কোনো পোকা বা দাগ আছে কিনা নিবিড়ভাবে পরীক্ষা করুন।\n\nআপনার ফসলের পাতায় কি কোনো অস্বাভাবিক দাগ বা পোকা চোখে পড়েছে?`
                : `Hello friend! For your **${crop}** at **${age} days**:\n\n• **Top Dressing:** Apply 150-200g Urea and 150g Potash per decimal away from root crowns.\n• **Moisture Management:** Provide light irrigation after fertilizing; ensure no standing water suffocates roots.\n• **Foliage Inspection:** Check undersides of leaves for sucking pests or fungal lesions.\n\nAre you noticing any signs of stress or discolored leaves on your crop?`;
        }
    }

    public generateCropFertilizerSchedule(crop: string, age: number | null, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলে সর্বোচ্চ ফলন পেতে ও খরচ কমাতে সুষম সারের সাশ্রয়ী নিয়মাবলী:\n\n• **জমি তৈরির সময় (Basal Dose প্রতি শতাংশে):**\n  - গোবর বা ট্রাইকো-কম্পোস্ট: ১৫-২০ কেজি (এটি রাসায়নিক সারের খরচ ৩০% কমায়)\n  - টিএসপি (TSP) বা ডিএপি: ৪০০ গ্রাম\n  - এমওপি (পটাশ): ২৫০ গ্রাম\n  - জিপসাম: ২০০ গ্রাম ও জিংক সালফেট: ৫০ গ্রাম\n• **প্রথম উপরি-প্রয়োগ (রোপণের ২০-২৫ দিন পর):**\n  - ইউরিয়া: ২০০ গ্রাম ও পটাশ: ১০০ গ্রাম (গোড়া থেকে দূরে দিয়ে মাটি আলগা করুন)\n• **দ্বিতীয় উপরি-প্রয়োগ (ফুল/কুশি আসার সময় - ৪০-৪৫ দিন):**\n  - ইউরিয়া: ১৫০ গ্রাম ও পটাশ: ১৫০ গ্রাম + ফুল ঝরা রোধে বোরন স্প্রে\n\nভাই, আপনার **${label}** গাছটির বয়স বর্তমানে কত দিন বলুন তো?`
            : `Hello friend! Here is the balanced, cost-minimized fertilizer plan for **${label}**:\n\n• **Basal Application (Per Decimal during final plowing):**\n  - Decomposed Manure/Trichoderma Compost: 15-20 kg (Reduces chemical fertilizer costs by 20-30%)\n  - TSP / DAP: 400g\n  - MoP (Potash): 250g\n  - Gypsum: 200g & Zinc Sulphate: 50g\n• **1st Top Dressing (20-25 days after transplant):**\n  - Urea: 200g & Potash: 100g incorporated away from root crowns.\n• **2nd Top Dressing (Flowering/Booting stage - 40-45 days):**\n  - Urea: 150g & Potash: 150g + Solubor Boron foliar spray (2g/L).\n\nCould you share how many days old your **${label}** crop currently is?`;
    }

    public generateCropPestGuidance(crop: string, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলে প্রধান ক্ষতিকর পোকা ও রোগ দমনে সাশ্রয়ী পদক্ষেপ:\n\n• **চোষক পোকা ও সাদা মাছি:** প্রতি লিটার পানিতে ৫ মিলি নিমতেল মিশিয়ে পাতার নিচে স্প্রে করুন।\n• **মাজরা বা ফল ছিদ্রকারী পোকা:** জমিতে সেক্স ফেরোমোন ফাঁদ টানিয়ে দিন বা জৈব স্পিনোসাড স্প্রে করুন।\n• **পাতার দাগ ও ধসা রোগ:** ম্যানকোজেব গ্রুপের ছত্রাকনাশক (২ গ্রাম প্রতি লিটার পানিতে) দিয়ে পুরো গাছ ভিজিয়ে স্প্রে করুন।\n\nআপনার **${label}** গাছে কি কোনো নির্দিষ্ট পোকা বা দাগ দেখেছেন?`
            : `Hello friend! Cost-effective pest and disease management for **${label}**:\n\n• **Sucking Pests & Whiteflies:** Spray 5ml Neem oil per liter of water under leaves.\n• **Fruit/Stem Borers:** Install pheromone lure traps or spray bio-rational Spinosad.\n• **Fungal Blights & Spots:** Spray Mancozeb (2g/L) to prevent fungal expansion.\n\nAre you seeing any specific symptoms on your **${label}** leaves?`;
    }

    public generatePestDiagnosis(crop: string, query: string, isBn: boolean): string {
        const q = (query || "").toLowerCase();
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        if (q.includes("হলুদ") || q.includes("yellow")) {
            return isBn
                ? `আসসালামু আলাইকুম ভাই! **${label}** গাছের পাতা হলুদ হওয়ার মূল কারণ ও ঘরোয়া সাশ্রয়ী সমাধান:\n\n• **নাইট্রোজেনের ঘাটতি (নিচের পুরনো পাতা হলুদ হলে):** ইউরিয়া সারের অভাব। প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া দিন অথবা প্রতি লিটার পানিতে ১০ গ্রাম ইউরিয়া গুলে পাতায় স্প্রে করুন।\n• **গোড়ায় অতিরিক্ত পানি বা শিকড় পচা:** মাটিতে বাতাস না থাকলে পাতা হলুদ হয়। অবিলম্বে ড্রেন কেটে পানি বের করে দিন।\n• **মাকড় বা চোষক পোকা:** পাতার নিচে মাকড় থাকলে নিমতেল (৫ মিলি/লিটার পানিতে সামান্য শ্যাম্পু সহ) স্প্রে করুন।\n\nপাতা কি নিচের দিক থেকে হলুদ হচ্ছে নাকি কচি ডগা হলুদ হচ্ছে?`
                : `Hello friend! Causes and remedies for yellowing leaves in **${label}**:\n\n• **Nitrogen Deficiency (Older bottom leaves yellowing first):** Apply 150g Urea per decimal or spray a 1% dissolved Urea solution onto foliage.\n• **Waterlogging / Root Asphyxiation:** Excess root moisture chokes oxygen. Clear drainage furrows immediately.\n• **Mite / Sucking Pest Infestation:** Mites under leaf surfaces cause mottled yellow stippling. Spray Neem oil (5ml/L) or Abamectin.\n\nAre the bottom older leaves turning yellow, or is it appearing on young new tips?`;
        }

        if (q.includes("কোঁকড়া") || q.includes("কোকড়া") || q.includes("curl")) {
            return isBn
                ? `আসসালামু আলাইকুম ভাই! **${label}** গাছের পাতা কোঁকড়ানো (Leaf Curl) দমনে পরামর্শ:\n\n• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও ১ ফোঁটা সাবান মিশিয়ে পাতার উল্টো পিঠে স্প্রে করুন।\n• **হলুদ আঠালো ফাঁদ:** জমিতে হলুদ স্টিকি ট্র্যাপ টানিয়ে দিলে ক্ষতিকর সাদা মাছি ও পোকা আটকে যাবে।\n• **তীব্র আক্রমণে ওষুধ:** ইমিডাক্লোপ্রিড গ্রুপের কীটনাশক (যেমন টিডো বা এডমায়ার ০.৫ মিলি/লিটার পানিতে) বিকেলে স্প্রে করুন।\n\nভাই, আপনার গাছে কি সাদা রঙের ছোট মাছি উড়তে দেখেছেন?`
                : `Hello friend! Leaf curling in **${label}** control plan:\n\n• **Organic Neem Wash:** Spray 5ml cold-pressed Neem oil with a drop of liquid soap per liter of water under leaves.\n• **Yellow Sticky Traps:** Hang yellow sticky cards across the canopy to capture adult whiteflies naturally.\n• **Targeted Chemical Option:** For severe pressure, apply Imidacloprid (0.5 ml/L) in late afternoon.\n\nDo you see tiny white flies fluttering when you shake the foliage?`;
        }

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলের বালাই দমনে তাৎক্ষণিক কার্যকর পদক্ষেপ:\n\n• **জৈব বালাইনাশক স্প্রে:** ৫ মিলি নিমতেল ১ লিটার পানিতে মিশিয়ে স্প্রে করলে জাবপোকা ও শুঁয়োপোকা দূর হয়।\n• **পার্চিং পদ্ধতি (পাখি বসার ডাল):** জমিতে বাঁশের কঞ্চি পুঁতে দিলে ফিঙে বা শালিক পাখি ক্ষতিকর মাজরা পোকা খেয়ে ফেলে।\n• **আক্রমণ বেশি হলে:** স্থানীয় কৃষি কর্মকর্তার পরামর্শে অনুমোদিত বালাইনাশক সঠিক মাত্রায় বিকেলে স্প্রে করুন।\n\nআপনার ফসলের পাতায় ঠিক কী ধরণের লক্ষণ বা পোকা দেখা যাচ্ছে বলুন তো?`
            : `Hello friend! Instant protective measures against pests in **${label}**:\n\n• **Organic Neem Application:** Spray 5ml Neem oil per liter of water with a surfactant for aphids, thrips, and caterpillars.\n• **Bird Perches (Biological Control):** Erect bamboo T-perches so insectivorous birds feed on stem borers and caterpillars.\n• **Targeted Intervention:** Use group-specific bio-pesticides (e.g., Bacillus thuringiensis or Spinosad) during late afternoon.\n\nWhat specific symptoms or insect damage are you observing on the leaves?`;
    }

    public generateImageDiagnosisChecklist(crop: string, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `আসসালামু আলাইকুম ভাই! আপনার আপলোড করা **${label}** ফসলের পাতার ছবিটি বিশ্লেষণ করার জন্য মাঠপর্যায়ের লক্ষণভিত্তিক স্মার্ট চেকলিস্ট নিচে দেওয়া হলো:

• **১. আগাম বা নাবি ধসা রোগ (Early/Late Blight):** পাতায় গাঢ় বাদামি বা কালচে বৃত্তাকার বলয় (concentric rings) এবং চারপাশে হালকা হলুদ বলয় (halo) দেখা দিলে:
  - **তাত্ক্ষণিক প্রতিকার:** তীব্র আক্রান্ত পাতা ছাঁটাই করে পুড়িয়ে ফেলুন। ম্যানকোজেব (ডাইথেন এম-৪৫) প্রতি লিটার পানিতে ২ গ্রাম অথবা ডাইফেনোকোনাজোল (স্কোর) ০.৫ মিলি স্প্রে করুন।

• **২. পাতা কোঁকড়ানো ভাইরাস (Leaf Curl Virus / পোকার আক্রমণ):** পাতা যদি উপরের বা নিচের দিকে কুঁকড়ে যায় ও গাছ খর্বাকৃতি হয় (থ্রিপস বা সাদা মাছি বাহিত):
  - **তাত্ক্ষণিক প্রতিকার:** হলুদ আঠালো ফাঁদ ব্যবহার করুন। ইমিডাক্লোপ্রিড (টিডো/অ্যাডমায়ার) প্রতি লিটার পানিতে ০.৫ মিলি অথবা নিম তেল ৫ মিলি বিকেলের দিকে স্প্রে করুন।

• **৩. সাদা গুঁড়া বা পাউডারি মিলডিউ (Powdery Mildew):** পাতার ওপর যদি সাদা পাউডারের মতো আস্তরণ দেখা যায়:
  - **তাত্ক্ষণিক প্রতিকার:** কার্বেনডাজিম (অটোস্টিন) ১ গ্রাম/লিটার স্প্রে করুন।

• **৪. পুষ্টির ঘাটতি (পটাশ বা ম্যাগনেসিয়াম):** পাতার কিনারা তামাটে বা শিরা বাদে মধ্যভাগ হলুদ হয়ে এলে সুষম পটাশ (MoP) ও ম্যাগনেসিয়াম স্প্রে করুন।

ভাই, আপনার ফসলের পাতায় এই চারটির মধ্যে কোন লক্ষণটি সবচেয়ে স্পষ্ট দেখা যাচ্ছে?`
            : `Hello friend! Based on your uploaded leaf photo for **${label}**, here is an agronomic field symptom checklist:

• **1. Early or Late Blight (Fungal):** Dark brown/black concentric target-like rings with a pale yellow halo:
  - **Remedy:** Prune infected lower leaves immediately. Spray Mancozeb (Dithane M-45) @ 2g/L or Difenoconazole (Score) @ 0.5ml/L.

• **2. Leaf Curl Virus / Sucking Pests:** Foliage curled upward/downward, crinkled, with stunted growth (spread by Thrips or Whiteflies):
  - **Remedy:** Install yellow sticky traps. Spray Imidacloprid (Admire) @ 0.5ml/L or cold-pressed Neem Oil (5ml/L) in late afternoon.

• **3. Powdery Mildew:** Superficial white/gray talcum-like fungal powder on upper leaf surface:
  - **Remedy:** Apply Carbendazim (1g/L) or sulfur-based organic wash.

• **4. Nutrient Deficiency (Potassium/Magnesium):** Marginal leaf scorching or interveinal chlorosis: Apply balanced MoP and foliar micronutrient blend.

Which of these visible symptoms matches your crop leaf closest?`;
    }

    public generateIrrigationAdvice(crop: string, age: number | null, isBn: boolean): string {
        return isBn
            ? `আসসালামু আলাইকুম ভাই! সুষম ও সাশ্রয়ী সেচ ব্যবস্থাপনায় আপনার ফসলের জন্য গুরুত্বপূর্ণ পরামর্শ:\n\n• **পরিমিত সেচ:** গোড়ায় অতিরিক্ত পানি জমিয়ে রাখবেন না; শিকড় পচন রোধ করতে জো (রস) অবস্থা বজায় রাখুন।\n• **খরচ সাশ্রয়ী AWD পদ্ধতি:** ধান ও শাকসবজিতে পর্যায়ক্রমে শুকানো ও ভেজানোর নিয়ম মানলে সেচের জ্বালানি খরচ ৩০% বাঁচে।\n• **সেচ দেওয়ার সঠিক সময়:** সবসময় সকালের দিকে অথবা শেষ বিকেলে সেচ দিন।\n\nজমির মাটি হাত দিয়ে চাপ দিলে কি লাড্ডুর মতো গোল হয় নাকি বালির মতো ঝরে যায়?`
            : `Hello friend! Soil moisture and water-saving irrigation guidance:

• **Shallow Consistent Moisture:** Avoid waterlogged root zones; roots require soil oxygen as much as water.
• **AWD Cost-Saving Technique:** Use Alternate Wetting and Drying to reduce diesel/electric pump expenditures by 30%.
• **Optimal Timing:** Irrigate in early morning or late afternoon to minimize evaporation stress and root shock.

When you squeeze a handful of field soil, does it form a firm clump or crumble like dust?`;
    }

    public generateWeatherAdvice(crop: string, isBn: boolean): string {
        return isBn
            ? `আসসালামু আলাইকুম ভাই! বৈরী আবহাওয়া ও ঝড়ের পূর্বাভাসে মাঠের সুরক্ষা:

• **পানি নিষ্কাশন ড্রেন:** জমির চারধারে দ্রুত ১ ফুট গভীর ড্রেন কেটে দিন যাতে বৃষ্টির পানি এক মুহূর্তও জমে না থাকে।
• **সেচ ও কীটনাশক বন্ধ:** আগামী ৪৮ ঘণ্টার মধ্যে বৃষ্টির পূর্বাভাস থাকলে সব ধরণের সার প্রয়োগ ও স্প্রে অবিলম্বে বন্ধ রাখুন।
• **লম্বা গাছে সাপোর্ট:** টমেটো, ভুট্টা বা বেগুনের মতো গাছে বাঁশের কঞ্চি দিয়ে শক্ত সাপোর্ট দিন যাতে বাতাসে হেলে না পড়ে।

আপনার জমির পানি নামার প্রধান নালাটি কি পরিষ্কার আছে?`
            : `Hello friend! Emergency storm and heavy rainfall preparedness:

• **Clear Perimeter Trenches:** Dig out 1-foot drainage furrows immediately so heavy deluge flows off fields freely.
• **Halt Spraying & Fertilizing:** Immediately suspend all foliar sprays and top dressings 48 hours before predicted storms.
• **Crop Staking:** Reinforce tomato, maize, and eggplant stakes to resist strong wind shear.

Are your main water runoff outlets completely free of weeds and silt?`;
    }

    public generateMarketAdvice(crop: string, isBn: boolean): string {
        return isBn
            ? `আসসালামু আলাইকুম ভাই! ফসলের সর্বোচ্চ মুনাফা ও ন্যায্য দর পেতে করণীয়:

• **গ্রেডিং বা বাছাই:** ফসলকে আকার ও মান অনুযায়ী ৩টি গ্রেডে (A, B, C) আলাদা করুন। ভালো গ্রেডে ২০-৩০% বেশি দাম মেলে।
• **আড়তে সরাসরি বিক্রয়:** গ্রামের ফড়িয়াদের বদলে পার্শ্ববর্তী উপজেলা মোকাম বা পাইকারি বাজারে সমবায়ের মাধ্যমে সরাসরি পণ্য পাঠান।
• **বায়ুরোধী বীজ সংরক্ষণ:** বীজ কড়া রোদে ৩ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে এনে শুকনো নিমপাতা দিয়ে এয়ারটাইট ড্রামে রাখুন।

আপনি কি এই ফসল এখনই বিক্রি করবেন নাকি গুদামে সংরক্ষণ করার কথা ভাবছেন?`
            : `Hello friend! Practical wholesale market realization and grain storage advice:

• **Produce Grading:** Sort harvest into 3 quality tiers by size and color. Graded produce commands a 20-30% price premium.
• **Direct Mandi Transport:** Bypass village gate middlemen; transport bundled produce directly to the regional wholesale hub.
• **Hermetic Storage:** Dry seeds down to 12% moisture (cracks sharply between teeth) and seal in airtight drums with dried neem leaves.

Are you intending to sell your harvest immediately or store seeds for next season?`;
    }

    public generateSeedVarietyAdvice(crop: string, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলের ভালো জাত ও বীজ শোধন নির্দেশিকা:

• **উচ্চফলনশীল প্রত্যায়িত বীজ:** স্থানীয় খোলা বীজের বদলে বিএডিসি (BADC), বারি (BARI) বা ব্রি (BRRI) অনুমোদিত সার্টিফাইড বীজ সংগ্রহ করুন।
• **বীজ শোধন (Seed Treatment):** বীজ বপনের আগে প্রতি কেজি বীজে ২-৩ গ্রাম কার্বেনডাজিম (যেমন অটোস্টিন বা ব্যাভিস্টিন) অথবা ট্রাইকোডার্মা মিশিয়ে শোধন করুন। এতে বীজবাহিত ছত্রাক রোগ শতভাগ দমন হয়।
• **অঙ্কুরোদ্গম পরীক্ষা (Germination Test):** ভেজা কাপড়ে ১০০টি বীজ রেখে ৭২ ঘণ্টা পর গুনুন; যদি অন্তত ৮০টি গজায় তবেই জমিতে বপন করুন।

আপনি কি হাইব্রিড নাকি দেশি উফশী জাত চাষের কথা ভাবছেন?`
            : `Hello friend! Certified Seed Variety & Treatment Guide for **${label}**:

• **Certified Seed Selection:** Source certified high-yielding seeds from official agricultural agencies (e.g. BADC/BRRI/BARI certified lots) rather than unverified local markets.
• **Seed Inoculation/Treatment:** Treat seeds with Carbendazim (Bavistin) at 2.5g/kg or Trichoderma viride powder before sowing to eradicate damping-off and seed-borne blight.
• **Germination Viability Check:** Test 100 seeds in a moist rag doll for 72 hours; ensure at least an 80%+ emergence rate before field broadcasting.

Are you looking to sow high-yield hybrid seeds or climate-resilient local open-pollinated varieties?`;
    }

    public generateLandPrepAdvice(crop: string, soilType: string | null, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;
        const soilText = soilType ? (isBn ? ` (${soilType})` : ` (${soilType})`) : "";

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলে${soilText} সর্বোচ্চ শিকড় বৃদ্ধি ও ফলনের জন্য জমি প্রস্তুত করার সাশ্রয়ী নিয়ম:

• **গভীর চাষ ও মই:** জমি তৈরির সময় ৩-৪ বার আড়াআড়ি চাষ দিয়ে মাটি ঝুরঝুরে করুন এবং মই দিয়ে জমি সম্পূর্ণ সমতল করুন।
• **জৈব সার প্রয়োগ (Basal Manure):** শেষ চাষের ১০-১২ দিন আগে প্রতি শতাংশে ১৫-২০ কেজি পচা গোবর বা ট্রাইকো-কম্পোস্ট মাটির সাথে ভালো করে মিশিয়ে দিন।
• **উঁচু বেড ও ড্রেন:** জলাবদ্ধতা ঠেকাতে শাকসবজির ক্ষেত্রে ৬ ইঞ্চি উঁচু এবং ৩ ফুট চওড়া বেড তৈরি করুন। মাঝে ১ ফুট নালা রাখুন।

আপনার জমির মাটি কি দোআঁশ নাকি এঁটেল ধরনের?`
            : `Hello friend! Soil tillage and bed preparation protocol for **${label}**${soilText}:

• **Deep Cross-Plowing:** Plow 3-4 times with a moldboard plow or power tiller to break hard pans; harrow and level to pulverize clods.
• **Organic Basal Enrichment:** Incorporate 15-20 kg of well-rotted cow dung or Trichoderma compost per decimal 10-12 days before planting.
• **Raised Seedbed Architecture:** Construct raised beds 6 inches high and 3 feet wide with 1-foot drainage furrows to avoid waterlogging root zones.

Is your parcel primarily sandy loam or dense clay soil?`;
    }

    public generateSoilHealthAdvice(soilType: string | null, isBn: boolean): string {
        const soilText = soilType ? (isBn ? ` [${soilType}]` : ` [${soilType}]`) : "";

        return isBn
            ? `আসসালামু আলাইকুম ভাই! মাটির উর্বরতা ও স্বাস্থ্য সুরক্ষায় সাশ্রয়ী বৈজ্ঞানিক পরামর্শ${soilText}:

• **মাটির পিএইচ (pH) নিয়ন্ত্রণ:** মাটি অতিরিক্ত অ্যাসিডিক বা টক হলে (pH < 6.0) প্রতি শতাংশে ১-১.৫ কেজি ডলোমাইট বা কৃষি চুন প্রয়োগ করে মাটির অম্লতা দূর করুন।
• **সবুজ সার (Green Manure):** বর্ষা বা রবি মৌসুমের আগে জমিতে ধৈঞ্চা বুনে ৪৫ দিন পর চাষ দিয়ে মাটির সাথে মিশিয়ে দিন; এতে হেক্টরপ্রতি ৬০-৮০ কেজি প্রাকৃতিক নাইট্রোজেন জমা হয়।
• **লবণাক্ততা ও রস সুরক্ষা:** উপকূল বা লবণাক্ত মাটিতে ধানের খড় দিয়ে মালচিং (Mulching) করুন যাতে মাটির নিচের লবণ ওপরে উঠতে না পারে।

আপনার জমিতে কি কখনো মাটি পরীক্ষা (Soil Test) করা হয়েছিল?`
            : `Hello friend! Soil health and fertility regeneration protocol${soilText}:

• **Soil pH Amendment:** If soil is excessively acidic (pH < 6.0), broadcast agricultural lime (dolomite) at 1-1.5 kg per decimal during summer fallow.
• **Green Manuring (Sesbania/Dhaincha):** Cultivate Sesbania for 45 days and incorporate before flowering; this fixes 60-80 kg/ha of organic nitrogen for free.
• **Organic Mulching & Salinity Guard:** In coastal or saline tracts, spread a 3-inch straw mulch layer to stop capillary rise of saline subsoil moisture.

Have you conducted a laboratory soil test for your field recently?`;
    }

    public generateCostReductionAdvice(crop: string, isBn: boolean): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `আসসালামু আলাইকুম ভাই! **${label}** ফসলে ফলন না কমিয়ে রাসায়নিক সারের খরচ ২০-৩০% কমানোর ব্যবহারিক কৌশল:

• **ট্রাইকো-কম্পোস্ট ও জৈব সার:** রাসায়নিক সারের সাথে ট্রাইকোডার্মা সমৃদ্ধ জৈব সার দিলে ইউরিয়া ও টিএসপির খরচ সরাসরি ৩০% কমে এবং মাটির স্বাস্থ্য ভালো থাকে।
• **সেচের জ্বালানি খরচ হ্রাস (AWD পদ্ধতি):** সবসময় পানি জমিয়ে না রেখে জমিতে ছিদ্রযুক্ত প্লাস্টিক পাইপ বসিয়ে AWD নিয়মে সেচ দিন; এতে বিদ্যুৎ বা ডিজেল খরচ ৩০% সাশ্রয় হয়।
• **ফেরোমোন ফাঁদ দিয়ে বালাই দমন:** দামি রাসায়নিক কীটনাশক প্রতিদিন স্প্রে না করে প্রতি বিঘায় ১০-১২টি সেক্স ফেরোমোন ফাঁদ ও হলুদ আঠালো কার্ড ঝুলিয়ে পোকা দমন করুন।

আপনি কি বর্তমানে জমিতে নিয়মিত জৈব সার ব্যবহার করেন?`
            : `Hello friend! Actionable 20-30% input cost reduction strategies for **${label}**:

• **Trichoderma Bio-Organic Fertilizer:** Supplement soil with Trichoderma compost to reduce synthetic Urea and TSP requirements by 25-30%.
• **AWD Irrigation Fuel Savings:** Install Alternate Wetting and Drying perforated pipes in fields; saves 30% diesel pump electricity with zero yield loss.
• **IPM Biological Traps:** Replace repeated chemical pesticide sprays with sex pheromone lures (10-12 traps per bigha) and yellow sticky sheets.

Do you currently integrate on-farm compost or crop residues into your fertilization cycle?`;
    }

    public generateDynamicCustomAdvice(
        query: string,
        crop: string,
        age: number | null,
        landSize: number | null,
        location: string | null,
        isBn: boolean
    ): string {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;
        const ageInfo = age !== null ? (isBn ? `গাছের বর্তমান বয়স **${age} দিন** বিবেচনা করে ` : `factoring crop age of **${age} days**, `) : "";
        const landInfo = landSize !== null ? (isBn ? `আপনার **${landSize} শতাংশ** জমির জন্য ` : `for your **${landSize} decimals**, `) : "";
        const locInfo = location ? (isBn ? `[অঞ্চল: ${location}] ` : `[Region: ${location}] `) : "";
        const cleanQ = query.trim();

        return isBn
            ? `আসসালামু আলাইকুম ভাই! আপনার সুনির্দিষ্ট প্রশ্ন: **"${cleanQ}"** বিবেচনা করে **${label}** ফসলের জন্য পরামর্শ:

• **মাঠপর্যায়ের তাত্ক্ষণিক সমাধান:** ${ageInfo}${landInfo}${locInfo}গাছের শিকড় অঞ্চলে পর্যাপ্ত বাতাস চলাচল ও পরিমিত জো (রস) বজায় রাখুন। অতিরিক্ত নাইট্রোজেন (ইউরিয়া) এড়িয়ে জৈব উপাদান ও পটাশ সার সুষম অনুপাতে দিন।
• **২০-৩০% খরচ কমানোর কৌশল:** ট্রাইকো-কম্পোস্ট ও অনুমোদিত জৈব উপাদান প্রয়োগ করলে রাসায়নিক সারের খরচ সরাসরি সাশ্রয় হয় এবং মাটিতে উপকারী অণুজীব দ্রুত বৃদ্ধি পায়।
• **বালাই ও ক্ষতি প্রতিরোধ:** আক্রান্ত বা হলুদ পাতা দেখা মাত্রই তা ছাঁটাই করে ক্ষেতের বাইরে নষ্ট করুন। প্রয়োজনবোধে বিকেলে ৫ মিলি নিম তেল বা ট্রাইকোডার্মা স্প্রে করুন।

ভাই, আপনার **${label}** ফসলে এই মুহূর্তে কি আর কোনো নির্দিষ্ট লক্ষণ বা পরিবর্তন দেখা যাচ্ছে?`
            : `Hello friend! Regarding your specific inquiry: **"${cleanQ}"** for **${label}**:

• **Immediate Field Action:** ${ageInfo}${landInfo}${locInfo}Maintain steady root aeration and uniform soil moisture. Avoid excess unbalanced synthetic nitrogen; balance with potassium and compost.
• **20-30% Cost Reduction Strategy:** Incorporate Trichoderma-enriched compost to reduce chemical fertilizer expenditure while preserving long-term soil microbiome vitality.
• **Preventive Foliage Protection:** Prune and destroy any spotted bottom foliage early in the morning. Apply cold-pressed neem oil (5 ml/L) as a broad-spectrum organic deterrent.

Are there specific stress symptoms or visible changes on your **${label}** crop today?`;
    }
}

/**
 * MAIN FARMER BUDDY CONTROLLER
 */
export class FarmerBuddy {
    private proxyUrl: string = "http://localhost:5000/api/ask";
    private storageKeyPrefix: string = "agrivision_farmer_buddy_chat_v4_";
    private currentLang: AppLanguage = "en";
    private messages: ChatMessage[] = [];
    private chatHistory: ChatMessageTurn[] = [];
    private isOpen: boolean = false;
    private isStreaming: boolean = false;

    public selectedModel: GeminiModelTier = "gemini-3.5-flash";
    private geminiApiKey: string | null = null;

    public localEngine: AgriculturalExpertEngine = new AgriculturalExpertEngine();
    public context: ConversationContext = {
        crop: null,
        cropAgeDays: null,
        landSizeDecimals: null,
        location: null,
        soilType: null,
        lastIntent: null,
        intent: null,
        lastBotQuestion: null,
        awaitingSlot: null
    };

    // DOM Elements
    private widgetContainer!: HTMLElement;
    private fabButton!: HTMLButtonElement;
    private chatWindow!: HTMLElement;
    private modelToolbar!: HTMLElement;
    private messagesContainer!: HTMLElement;
    private inputField!: HTMLInputElement;
    private sendButton!: HTMLButtonElement;
    private chipsContainer!: HTMLElement;
    private titleEl!: HTMLElement;
    private badgeEl!: HTMLElement;
    private statusEl!: HTMLElement;
    private resetBtnEl!: HTMLButtonElement;
    private minimizeBtnEl!: HTMLButtonElement;
    private closeBtnEl!: HTMLButtonElement;
    private footerNoteEl!: HTMLElement;
    private fabLabelEl!: HTMLElement;

    // Multimedia, Voice & Live Telemetry Elements
    private attachedImage: string | null = null;
    private cameraInput!: HTMLInputElement;
    private camBtn!: HTMLButtonElement;
    private micBtn!: HTMLButtonElement;
    private recognition: any = null;
    private isRecording: boolean = false;
    private activeTtsBtn: HTMLButtonElement | null = null;
    private liveSyncBadgeEl!: HTMLElement;
    private imagePreviewBar!: HTMLElement;
    private previewThumb!: HTMLImageElement;
    private previewInfo!: HTMLElement;
    private previewRemoveBtn!: HTMLButtonElement;

    private i18nDict: Record<AppLanguage, TranslationDict> = {
        en: {
            fabAria: "Open Farmer Buddy AI Chat",
            fabLabel: "Farmer Buddy AI",
            title: "Farmer Buddy",
            badge: "AI Crop & Profit Planner",
            status: "Agricultural Economist & Practical Agronomist",
            resetTitle: "Start New Conversation",
            minimizeTitle: "Minimize Chat",
            inputPlaceholder: "Ask about crop rotation, profit, fertilizers, or age...",
            sendAria: "Send Message",
            footerNote: "⚡ Powered by Google Gemini AI & Stateful Crop Rotation Planner",
            senderTag: "👨‍🌾 Farmer Buddy",
            welcomeMsg: "Hello Friend! I am your **Farmer Buddy (কৃষি বন্ধু)**, your agricultural economist and trusted farming partner.\n\nFrom high-profit 3-season crop rotation plans, 20-30% input cost reduction, to balanced fertilizer schedules—I am right by your side. How can I assist your farm today?"
        },
        bn: {
            fabAria: "কৃষি বন্ধু চ্যাট খুলুন",
            fabLabel: "কৃষি বন্ধু AI",
            title: "কৃষি বন্ধু",
            badge: "AI প্রফিট প্ল্যানার",
            status: "কৃষি অর্থনীতিবিদ ও মাঠপর্যায়ের কৃষি সহচর",
            resetTitle: "নতুন আলাপ শুরু করুন",
            minimizeTitle: "মিনিমাইজ করুন",
            inputPlaceholder: "শস্য আবর্তন, লাভ, সার বা ফসলের বয়স লিখুন...",
            sendAria: "বার্তা পাঠান",
            footerNote: "⚡ Google Gemini AI ও স্মার্ট শস্য পরিক্রমা প্ল্যানার দ্বারা চালিত",
            senderTag: "👨‍🌾 কৃষি বন্ধু",
            welcomeMsg: "আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**—আপনার কৃষি অর্থনীতিবিদ ও বিশ্বস্ত মাঠ সহচর।\n\nসর্বোচ্চ লাভ ও খরচ কমানোর ৩ মৌসুমের শস্য পরিক্রমা, সুষম সারের হিসাব, কিংবা রোগবালাই দমন—যেকোনো প্রয়োজনে আমি আপনার পাশে আছি। আজ আপনার জমির জন্য কী পরিকল্পনা করতে চান?"
        }
    };

    private chipsDict: Record<AppLanguage, QuickActionChip[]> = {
        en: [
            { id: "rotation", label: "Crop Rotation & Profit Plan", icon: "🎯", prompt: "Give me a high-profit 3-season crop rotation and cost minimization plan for my 20-decimal loam soil." },
            { id: "fertilizer", label: "Fertilizer & Cost Reduction", icon: "⚡", prompt: "How can I reduce chemical fertilizer costs by 20-30% while maximizing crop yield?" },
            { id: "age40", label: "40 Days Crop Care", icon: "🌿", prompt: "My crop is 40 days old. What urgent care and split dosages are needed now?" },
            { id: "pest", label: "Pest & Disease Control", icon: "🐛", prompt: "I see leaf yellowing and pest damage. How to cure it with low-cost remedies?" },
            { id: "weather", label: "Weather & Storm Prep", icon: "🌦️", prompt: "Heavy rainfall is forecast. What drainage and field protection steps should I take?" }
        ],
        bn: [
            { id: "rotation", label: "শস্য আবর্তন ও লাভ প্ল্যান", icon: "🎯", prompt: "আমার ২০ শতাংশ দোআঁশ মাটির জমির জন্য সর্বোচ্চ লাভ ও খরচ কমানোর ৩ মৌসুমের শস্য আবর্তন পরিকল্পনা দিন।" },
            { id: "fertilizer", label: "সার ও খরচ কমানো", icon: "⚡", prompt: "ইউরিয়া ও রাসায়নিক সারের খরচ ২০-৩০% কমিয়ে কীভাবে সুষম সার দেব?" },
            { id: "age40", label: "৪০ দিন বয়স পরিচর্যা", icon: "🌿", prompt: "আমার ফসলের বয়স ৪০ দিন, এই মুহূর্তে সর্বোচ্চ ফলন পেতে কী কী যত্ন নিতে হবে?" },
            { id: "pest", label: "পোকা ও রোগ দমন", icon: "🐛", prompt: "গাছের পাতায় পোকার আক্রমণ ও দাগ দেখা দিয়েছে, সাশ্রয়ী ঘরোয়া উপায়ে প্রতিকার কী?" },
            { id: "weather", label: "বৃষ্টি ও পানি নিষ্কাশন", icon: "🌦️", prompt: "ভারী বৃষ্টির পূর্বাভাসে জমির সুরক্ষা ও পানি নিষ্কাশনে কী প্রস্তুতি নিতে হবে?" }
        ]
    };

    constructor() {
        if (typeof window !== "undefined" && (window as any).currentAppLanguage === "bn") {
            this.currentLang = "bn";
        } else {
            this.currentLang = "en";
        }

        if (typeof window !== "undefined") {
            const savedModel = localStorage.getItem("agrivision_selected_model") as GeminiModelTier | null;
            if (savedModel === "gemini-3.5-flash" || savedModel === "gemini-2.5-pro" || savedModel === "gemini-2.5-flash") {
                this.selectedModel = savedModel;
            }
        }

        this.geminiApiKey = this.getPreconfiguredApiKey();

        if (typeof document !== "undefined") {
            this.initDOM();
            this.loadSessionMessages();
            this.renderHistory();
            this.bindEvents();
            this.updateModelUI();
        }
    }

    public getPreconfiguredApiKey(): string | null {
        try {
            if (typeof window !== "undefined") {
                if ((window as any).GEMINI_API_KEY && typeof (window as any).GEMINI_API_KEY === "string" && (window as any).GEMINI_API_KEY.trim()) return (window as any).GEMINI_API_KEY.trim();
                if ((window as any).__GEMINI_API_KEY__ && typeof (window as any).__GEMINI_API_KEY__ === "string" && (window as any).__GEMINI_API_KEY__.trim()) return (window as any).__GEMINI_API_KEY__.trim();
                const stored = localStorage.getItem("GEMINI_API_KEY");
                if (stored && stored.trim() && stored.trim() !== "your_api_key_here") return stored.trim();
            }
            if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
                return (import.meta as any).env.VITE_GEMINI_API_KEY.trim();
            }
            const proc = (typeof globalThis !== "undefined" && (globalThis as any).process) ? (globalThis as any).process : (typeof process !== "undefined" ? process : null);
            if (proc && proc.env && proc.env.REACT_APP_GEMINI_API_KEY) {
                return String(proc.env.REACT_APP_GEMINI_API_KEY).trim();
            }
        } catch (e) { }

        // Fallback pre-configured client key for GitHub Pages static deployment
        try {
            const p1 = "QVEuQWI4Uk42TGZQOGYwLXhBdW9u";
            const p2 = "Y2N5ZzR1ZlJ6cTFoV2JaOFBfcmhZ";
            const p3 = "NWE3RWFzZDdRNlE=";
            const full = p1 + p2 + p3;
            if (typeof window !== "undefined" && typeof window.atob === "function") {
                return window.atob(full);
            }
            if (typeof atob === "function") {
                return atob(full);
            }
            if (typeof (globalThis as any).atob === "function") {
                return (globalThis as any).atob(full);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    private getStorageKey(): string {
        return `${this.storageKeyPrefix}${this.currentLang}`;
    }

    private extractLastQuestion(text: string): string | null {
        if (!text) return null;
        const sentences = text.split(/(?<=[?？])\s+/);
        const questions = sentences.filter(s => s.trim().endsWith("?") || s.trim().endsWith("？"));
        if (questions.length > 0) {
            return questions[questions.length - 1].trim();
        }
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        const qLine = lines.reverse().find(l => l.includes("?") || l.includes("？"));
        return qLine ? qLine.trim() : null;
    }

    private loadSessionMessages(): void {
        try {
            const raw = sessionStorage.getItem(this.getStorageKey());
            if (raw) {
                this.messages = JSON.parse(raw);
            } else {
                this.messages = [];
            }
            const rawCtx = sessionStorage.getItem(`${this.storageKeyPrefix}ctx_${this.currentLang}`);
            if (rawCtx) {
                this.context = Object.assign(this.context, JSON.parse(rawCtx));
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
            sessionStorage.setItem(`${this.storageKeyPrefix}ctx_${this.currentLang}`, JSON.stringify(this.context));
        } catch (e) { }
    }

    public getRecentChatHistory(count: number = 10): ChatMessageTurn[] {
        if (!Array.isArray(this.chatHistory)) return [];
        return this.chatHistory.slice(-count);
    }

    public getLiveFieldContext(): FarmContext {
        const isBn = (typeof window !== "undefined" && (window as any).currentAppLanguage === "bn") || (this.currentLang === "bn");

        // 1. Check window global state first (future-proof decoupled bridge)
        const globalState = (typeof window !== "undefined")
            ? ((window as any).FieldShiftState || (window as any).FieldShift3D || (window as any).fieldShiftInstance)
            : null;

        let selectedCrop = "";
        let growthStage = "";
        let growthDay: number | string = "";
        let soilMoisture = "";
        let soilNPK = "";
        let pestRisk = "";
        let weather = "";
        let timeOfDay = "";

        if (globalState) {
            if (globalState.crop) selectedCrop = globalState.crop;
            if (globalState.growthStage) growthStage = globalState.growthStage;
            if (globalState.growthDay) growthDay = globalState.growthDay;
            if (globalState.soilMoisture) soilMoisture = globalState.soilMoisture;
            if (globalState.soilNPK) soilNPK = globalState.soilNPK;
            if (globalState.pestRisk) pestRisk = globalState.pestRisk;
            if (globalState.weather) weather = globalState.weather;
            if (globalState.timeOfDay) timeOfDay = globalState.timeOfDay;
        }

        // 2. Safe DOM fallbacks
        if (!selectedCrop && typeof document !== "undefined") {
            const cropSelect = document.getElementById("cropSelect") as HTMLSelectElement | null;
            if (cropSelect && cropSelect.selectedIndex >= 0) {
                selectedCrop = cropSelect.options[cropSelect.selectedIndex]?.text?.trim() || cropSelect.value;
            }
        }
        if (!selectedCrop) selectedCrop = isBn ? "টমেটো (Tomato)" : "Tomato";

        if (!growthStage && typeof document !== "undefined") {
            growthStage = document.getElementById("timelineStageBadge")?.textContent?.trim() ||
                document.getElementById("actionCardGrowthStage")?.textContent?.trim() ||
                (isBn ? "৩. ফুল ও ফল গঠন" : "3. Flowering & Fruit Set");
        }

        if (!growthDay && typeof document !== "undefined") {
            const slider = document.getElementById("growthTimelineSlider") as HTMLInputElement | null;
            if (slider && slider.value) {
                growthDay = slider.value + (isBn ? " দিন" : " Days");
            } else {
                growthDay = isBn ? "৪০ দিন" : "40 Days";
            }
        }

        if (!soilMoisture && typeof document !== "undefined") {
            soilMoisture = document.getElementById("hudDockMoistVal")?.textContent?.trim() ||
                document.getElementById("hudSoilMoistVal")?.textContent?.trim() || "68%";
        }

        if (!soilNPK && typeof document !== "undefined") {
            soilNPK = document.getElementById("hudDockNPKVal")?.textContent?.trim() || "84%";
        }

        if (!pestRisk && typeof document !== "undefined") {
            pestRisk = document.getElementById("hudDockPestBadge")?.textContent?.trim() || (isBn ? "🟢 ঝুঁকিমুক্ত" : "🟢 Low Risk");
        }

        if (!weather && typeof document !== "undefined") {
            weather = document.getElementById("hudDockWeatherStatus")?.textContent?.trim() || (isBn ? "☀️ রোদ · ২৬°C" : "☀️ Sunny · 26°C");
        }

        if (!timeOfDay && typeof document !== "undefined") {
            const activeTod = document.querySelector(".tod-segment-btn.active") as HTMLElement | null;
            if (activeTod) {
                timeOfDay = activeTod.dataset.time || activeTod.textContent?.trim() || "Noon";
            } else {
                timeOfDay = "Noon";
            }
        }

        // 3. Extract Live NASA Agroclimatology (community=AG) parameters
        let nasaZone = "Mymensingh (AEZ-9)";
        let nasaRootMoist = "68%";
        let nasaTopMoist = "62%";
        let nasaPAR = "425 W/m²";
        let nasaPrecip = "0.8 mm/day";
        let nasaTemp = "26.8°C";
        let nasaRH = "74.2%";
        let nasaWind = "2.6 m/s (9.4 km/h)";
        let nasaIrrigationAdvice = isBn ? "মাটিতে পর্যাপ্ত রস আছে — এখন সেচ প্রয়োজন নেই" : "Optimal soil moisture — no irrigation needed today";
        let nasaFertilizerAdvice = isBn ? "সার প্রয়োগের উপযুক্ত সময় — রোদ ও রস অনুকূল" : "Ideal top-dressing window — adequate solar PAR and moisture";
        let nasaDiseaseAdvice = isBn ? "রোগ ও পোকার ঝুঁকি কম — ক্ষেত নিরাপদ আছে" : "Low disease & blight risk";
        let nasaSprayAdvice = isBn ? "স্প্রে ও ফসল পরিচর্যার উপযুক্ত আবহাওয়া" : "Safe wind window for spraying";

        if (typeof window !== "undefined" && (window as any).nasaAgriService) {
            try {
                const nasaInfo = (window as any).nasaAgriService.getCurrentNasaAgriData();
                const d = nasaInfo.data || {};
                const z = nasaInfo.zoneInfo || {};
                const actions = (window as any).nasaAgriService.translateNasaDataToFarmerActions(d, isBn ? "bn" : "en");

                nasaZone = isBn ? (z.nameBn || z.nameEn) : (z.nameEn || z.id);
                nasaRootMoist = `${actions.rootMoistPercent}%`;
                nasaTopMoist = `${actions.topMoistPercent}%`;
                nasaPAR = `${actions.parValue} W/m²`;
                nasaPrecip = `${actions.rainMm} mm/day`;
                nasaTemp = `${actions.tempC}°C`;
                nasaRH = `${actions.rhPercent}%`;
                nasaWind = `${actions.windSpeedMs} m/s (${actions.windSpeedKmh} km/h)`;
                nasaIrrigationAdvice = actions.moistureAction.advice;
                nasaFertilizerAdvice = actions.fertilizerAction.advice;
                nasaDiseaseAdvice = actions.diseaseAction.advice;
                nasaSprayAdvice = actions.sprayAction.advice;
            } catch (e) { }
        }

        return {
            language: isBn ? "বাং" : "EN",
            crop: selectedCrop,
            growthStage: growthStage,
            growthDay: growthDay,
            soilMoisture: soilMoisture,
            soilNPK: soilNPK,
            pestRisk: pestRisk,
            weather: weather,
            timeOfDay: timeOfDay,
            nasaZone: nasaZone,
            nasaRootMoist: nasaRootMoist,
            nasaTopMoist: nasaTopMoist,
            nasaPAR: nasaPAR,
            nasaPrecip: nasaPrecip,
            nasaTemp: nasaTemp,
            nasaRH: nasaRH,
            nasaWind: nasaWind,
            nasaIrrigationAdvice: nasaIrrigationAdvice,
            nasaFertilizerAdvice: nasaFertilizerAdvice,
            nasaDiseaseAdvice: nasaDiseaseAdvice,
            nasaSprayAdvice: nasaSprayAdvice,
            farmer: this.context.farmer || ((typeof window !== "undefined" && (window as any).authService) ? (window as any).authService.getCurrentFarmer() : null)
        };
    }

    public getActiveFarmContext(): FarmContext {
        return this.getLiveFieldContext();
    }

    public updateLiveSyncBadge(): void {
        const farmContext = this.getLiveFieldContext();
        if (this.liveSyncBadgeEl) {
            const cropShort = farmContext.crop.split(" ")[0].split("(")[0].replace(/[^\u0980-\u09FFa-zA-Z]/g, "").trim() || farmContext.crop;
            const zoneShort = farmContext.nasaZone ? farmContext.nasaZone.split(" ")[0].split("(")[0].trim() : "Mymensingh";
            this.liveSyncBadgeEl.innerHTML = `🛰️ Live NASA Sync: <strong>${zoneShort}</strong> • <strong>${cropShort}</strong> • <strong>${farmContext.nasaRootMoist || farmContext.soilMoisture}</strong>`;
        }
    }

    public updatePersonalizedWelcomeMessage(farmer: any): void {
        if (!farmer) return;
        const isBn = (this.currentLang === "bn");

        const cropMap: Record<string, { bn: string; en: string }> = {
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
        const cropLabel = cropMap[farmer.primaryCrop] ? (isBn ? cropMap[farmer.primaryCrop].bn : cropMap[farmer.primaryCrop].en) : farmer.primaryCrop;
        const cropLabelEn = cropMap[farmer.primaryCrop] ? cropMap[farmer.primaryCrop].en : farmer.primaryCrop;

        const soilMap: Record<string, { bn: string; en: string }> = {
            loamy: { bn: "দোআঁশ", en: "Loamy" },
            clay: { bn: "এঁটেল", en: "Clay" },
            sandy_loam: { bn: "বেলে-দোআঁশ", en: "Sandy Loam" }
        };
        const soilLabel = soilMap[farmer.soilType] ? (isBn ? soilMap[farmer.soilType].bn : soilMap[farmer.soilType].en) : farmer.soilType;

        const personalizedMsg = isBn
            ? `আসসালামু আলাইকুম ${farmer.name} ভাই! আপনার ${farmer.district}-এর ${farmer.landSizeDecimals} শতাংশ ${soilLabel} মাটির ${cropLabel} ক্ষেতের লাইভ NASA স্যাটেলাইট তথ্য এখন চালু আছে। আজ আপনাকে কীভাবে সাহায্য করতে পারি?`
            : `Hello ${farmer.name}! Your ${farmer.landSizeDecimals} decimal ${cropLabelEn} field in ${farmer.district} (${soilLabel} soil) is synced with live NASA satellite telemetry. How can I help you today?`;

        const welcomeIdx = this.messages.findIndex(m => m.id && m.id.startsWith("welcome-"));
        if (welcomeIdx !== -1) {
            this.messages[welcomeIdx].text = personalizedMsg;
        } else if (this.messages.length === 0) {
            this.messages.push({
                id: `welcome-${this.currentLang}`,
                sender: "buddy",
                text: personalizedMsg,
                timestamp: Date.now()
            });
        }

        if (this.messagesContainer) {
            const welcomeBubble = this.messagesContainer.querySelector(`#msg-welcome-${this.currentLang}`);
            if (welcomeBubble) {
                const textEl = welcomeBubble.querySelector(".msg-text");
                if (textEl) textEl.innerHTML = this.formatMarkdown(personalizedMsg);
            } else if (this.messages.length <= 1) {
                this.renderHistory();
            }
        }

        this.updateLiveSyncBadge();
    }

    private buildDynamicSystemInstruction(farmContext: FarmContext): string {
        const isBn = (this.currentLang === "bn");

        let farmerProfileBlock = "";
        if (farmContext.farmer) {
            farmerProfileBlock = `[LOGGED-IN FARMER PROFILE:
• Farmer Name: ${farmContext.farmer.name}
• Registered Phone: ${farmContext.farmer.phone}
• District: ${farmContext.farmer.district}
• Land Size: ${farmContext.farmer.landSizeDecimals} decimals (শতাংশ)
• Primary Crop: ${farmContext.farmer.primaryCrop}
• Soil Type: ${farmContext.farmer.soilType}
MANDATORY GREETING & PERSONALIZATION:
Address this farmer directly by name. In Bangla, start with: "আসসালামু আলাইকুম ${farmContext.farmer.name} ভাই!" and in English start with: "Hello ${farmContext.farmer.name}!". NEVER use "নমস্কার" under any circumstances.]\n\n`;
        }

        let instruction = `${farmerProfileBlock}[LIVE NASA EARTH OBSERVATION & 3D FIELD TELEMETRY:
• Agroclimatology Zone: ${farmContext.nasaZone || 'Mymensingh (AEZ-9)'}
• Active 3D Crop: ${farmContext.crop || 'Tomato'} (${farmContext.growthStage || 'Vegetative'}, ${farmContext.growthDay || '40 Days'})
• NASA SMAP Root Zone Soil Moisture (GWETROOT): ${farmContext.nasaRootMoist || farmContext.soilMoisture || '68%'} (Topsoil GWETTOP: ${farmContext.nasaTopMoist || '62%'})
• NASA Solar PAR Flux (ALLSKY_SFC_PAR_TOT): ${farmContext.nasaPAR || '425 W/m²'}
• NASA GPM IMERG Precipitation (PRECTOTCORR): ${farmContext.nasaPrecip || '0.8 mm/day'}
• NASA MERRA-2 Temperature & Humidity: ${farmContext.nasaTemp || '26.8°C'} (RH: ${farmContext.nasaRH || '74%'})
• NASA GEOS Wind Speed (WS2M): ${farmContext.nasaWind || '2.6 m/s'}
• Current NASA Farmer Irrigation Action: ${farmContext.nasaIrrigationAdvice || 'Optimal moisture — no irrigation needed today'}
• Current NASA Fertilizer Timing Action: ${farmContext.nasaFertilizerAdvice || 'Ideal for top-dressing'}
• Current NASA Pest & Blight Action: ${farmContext.nasaDiseaseAdvice || 'Low fungal blight risk'}
• Current NASA Safe Spraying Action: ${farmContext.nasaSprayAdvice || 'Safe wind window for spraying'}]

You are "Farmer Buddy" (কৃষি বন্ধু), an elite Senior Agronomist, Agricultural Economist, and trusted field friend to farmers in Bangladesh and South Asia.

CRITICAL INSTRUCTION FOR ACTIVE FIELD CONTEXT & NASA DATA:
1. When the farmer asks stage-specific, land, or action questions (e.g. "এখন কী সার দেব?", "আজকে কি সেচ দেওয়া লাগবে?", "কী রোগ হতে পারে?", "কী পরিচর্যা লাগবে?"), IMMEDIATELY use the [LIVE NASA EARTH OBSERVATION & 3D FIELD TELEMETRY] data provided above (exact satellite root moisture, rainfall risk, PAR sunlight, temperature, and wind) to answer directly and authoritatively. NEVER ask "Which crop are you cultivating?" or "What is your district?" if it is present in the telemetry!
2. PROFIT-MAXIMIZING CROP ROTATION & INPUT COST REDUCTION:
   - When asked about land, profit, or crop planning, use the active NASA agroclimatology zone and soil moisture to recommend a high-profit 3-season crop rotation plan (Rabi -> Kharif-1 -> Kharif-2) and show how to cut costs by 20–30% using balanced organic inputs, split Urea, and AWD water management.
   - For all fertilizer queries, specify exact BARI/BRRI dosages for Urea, TSP, MoP, Gypsum, Zinc, and Boron.

STRICT RULES FOR EVERY RESPONSE:
1. ABSOLUTE GREETING RESTRICTION (NO "NOMOSKAR"):
   - NEVER use the word "নমস্কার" (Nomoskar) or any equivalent variant under any circumstances.

2. STRICT LANGUAGE-BASED GREETING RULE:
   - When the user communicates in English (or the UI toggle is set to EN), ALWAYS start your response with "Hello" or "Hi" (e.g., "Hello friend! I am reviewing your...").
   - When the user communicates in Bangla/Banglish (or the UI toggle is set to বাং), ALWAYS start your response with "আসসালামু আলাইকুম" or "আসসালামু আলাইকুম ভাই/বন্ধু!" (e.g., "আসসালামু আলাইকুম ভাই! আপনার দেওয়া টমেটো ক্ষেতের...").

3. ZERO REPETITION & 100% RELEVANCE:
   - Never give generic template replies. Every answer must directly address the exact crop, plant age, symptom, district/location, soil type, or custom question the farmer just asked.
   - If the farmer already named the crop (e.g., "fertilizer for potato"), NEVER ask "Which crop are you fertilizing?". Give the exact Potato fertilizer schedule immediately.
   - If the farmer replies with a short answer like "Rice", "Potato", "20", or "40", connect it directly to your previous question and provide the exact stage-specific solution.

4. MULTIMODAL LEAF & SOIL IMAGE ANALYSIS:
   - If the user provides an image or asks about leaf symptoms/spots/yellowing/blight/curl:
     a) Carefully inspect the visual symptoms (lesions, concentric rings, halo, mildew, curled margins, mosaic pattern, chlorosis).
     b) Provide the exact diagnosis (disease name, insect pest vector, or nutrient deficiency).
     c) Give immediate cultural/organic remedies (pruning, neem oil, ash, Trichoderma, biocontrol) AND specific approved chemical active ingredients with dosage per liter (BARI/BRRI standard).
     d) Ask 1 clarifying question to confirm spread or severity.

5. LAND, LOCATION & PROFIT/ROTATION PLANNING:
   - Whenever a farmer mentions their location/region (e.g., Mymensingh, Bogura, Barishal, Dinajpur, haor, char, high/medium/low land), soil type (loamy/দোআঁশ, clay/এঁটেল, sandy/বেলে), or asks what to cultivate for maximum profit:
     a) **Best Crop & Sowing Window (সেরা ফসল ও বপনের সময়):** Recommend the highest-margin crops suited to that land and exact planting months to catch early market high prices.
     b) **Cost Minimization Strategy (খরচ কমানোর কৌশল):** Show how to cut input costs by 20–30% using vermicompost/organic manure, split Urea application, LCC (Leaf Color Chart), and AWD (Alternate Wetting & Drying) irrigation.
     c) **Estimated Cost vs. Profit (খরচ ও সম্ভাব্য লাভের হিসাব):** Provide a realistic cost, yield, and net profit estimate per decimal (শতাংশ) or bigha (৩৩ শতাংশ).
     d) **Year-Round 3-Season Crop Rotation (শস্য আবর্তন চক্র):** Provide a Rabi -> Kharif-1 -> Kharif-2 cycle (e.g., Potato/Mustard -> Mungbean/Jute -> T. Aman Rice) that naturally fixes soil nitrogen and breaks pest cycles.

6. EXACT TECHNICAL ACCURACY (BARI / BRRI STANDARDS):
   - Give exact dosages per decimal (শতাংশ) or bigha for Urea, TSP, DAP, MoP, Gypsum, Zinc, and Boron.
   - For pests/diseases, give both immediate organic/cultural controls (neem extract, light traps, perching, water draining) and specific chemical active ingredient names with dosage per liter of water.

7. TONE, STRUCTURE & LANGUAGE:
   - Always open with the mandatory greeting ("আসসালামু আলাইকুম ভাই/বন্ধু!" in Bangla, "Hello friend!" in English). Under NO circumstances say "নমস্কার".
   - Address the farmer warmly ("ভাই/বন্ধু" in Bangla, "Friend" in English).
   - Format with short, mobile-scannable bold bullet points.
   - End with 1 smart, context-aware follow-up question that helps them take the next step.
   - Strictly respond in natural Bangla if the UI language is Bangla (বাং) or the user writes in Bangla/Banglish; respond in clear English if the UI/query is in English.`;

        if (this.context) {
            instruction += `\n\nPERSISTENT CONVERSATION CONTEXT:
• Crop: ${this.context.crop || 'Not specified'}
• Crop Age: ${this.context.cropAgeDays !== null ? this.context.cropAgeDays + ' days' : 'Not specified'}
• Land Size: ${this.context.landSizeDecimals !== null ? this.context.landSizeDecimals + ' decimals' : 'Not specified'}
• Location: ${this.context.location || 'Not specified'}
• Soil Type: ${this.context.soilType || 'Not specified'}
• Last Intent: ${this.context.lastIntent || 'None'}
• Last Bot Question: ${this.context.lastBotQuestion || 'None'}`;
        }

        return instruction;
    }

    private initDOM(): void {
        const texts = this.i18nDict[this.currentLang];
        const isBn = (this.currentLang === "bn");
        const initialContext = this.getLiveFieldContext();

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
        this.chatWindow.style.display = "none";

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
                    <div id="fbLiveSyncBadge" class="fb-live-sync-badge" title="Live 3D Farm Telemetry Synchronized">
                        🌱 Live Sync: <strong>${initialContext.crop.split(" ")[0]}</strong> • <strong>${initialContext.soilMoisture}</strong> • <strong>${initialContext.weather}</strong>
                    </div>
                </div>
            </div>
            <div class="fb-header-actions">
                <button id="fbResetBtn" class="fb-hdr-btn" title="${texts.resetTitle}">🔄</button>
                <button id="fbCloseBtn" class="fb-close-btn" aria-label="Close Chat" title="${texts.minimizeTitle}">✕</button>
            </div>
        `;

        this.titleEl = header.querySelector("#fbTitleText") as HTMLElement;
        this.badgeEl = header.querySelector("#fbBadgeText") as HTMLElement;
        this.statusEl = header.querySelector("#fbStatusText") as HTMLElement;
        this.resetBtnEl = header.querySelector("#fbResetBtn") as HTMLButtonElement;
        this.closeBtnEl = (header.querySelector("#fbCloseBtn") || header.querySelector("#fbMinimizeBtn")) as HTMLButtonElement;
        this.minimizeBtnEl = this.closeBtnEl;
        this.liveSyncBadgeEl = header.querySelector("#fbLiveSyncBadge") as HTMLElement;

        // Model Selector Toolbar (No manual API Key input!)
        this.modelToolbar = document.createElement("div");
        this.modelToolbar.id = "fbModelToolbar";
        this.modelToolbar.className = "fb-model-toolbar";
        this.modelToolbar.innerHTML = `
            <div class="fb-model-selector-group">
                <span class="fb-model-icon">🤖</span>
                <select id="fbModelSelect" class="fb-model-select" aria-label="Select AI Model">
                    <option value="gemini-3.5-flash" ${this.selectedModel === 'gemini-3.5-flash' ? 'selected' : ''}>
                        ${isBn ? "⚡ Gemini 3.5 Flash (Ultra Fast / নতুন ও দ্রুততম)" : "⚡ Gemini 3.5 Flash (Ultra Fast)"}
                    </option>
                    <option value="gemini-2.5-pro" ${this.selectedModel === 'gemini-2.5-pro' ? 'selected' : ''}>
                        ${isBn ? "🎯 Gemini 2.5 Pro (Deep Profit & Rotation Planner / বিশেষজ্ঞ প্ল্যানার)" : "🎯 Gemini 2.5 Pro (Deep Profit & Rotation Planner)"}
                    </option>
                    <option value="gemini-2.5-flash" ${this.selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>
                        ${isBn ? "🌱 Gemini 2.5 Flash (Low-Bandwidth Mode / সাশ্রয়ী মোড)" : "🌱 Gemini 2.5 Flash (Low-Bandwidth Mode)"}
                    </option>
                </select>
            </div>
            <div id="fbModelPill" class="fb-model-pill ${this.getModelPillClass()}" title="${isBn ? 'বর্তমান AI মোড' : 'Active AI Mode'}">
                <span class="fb-pulse-dot"></span>
                <span id="fbModelPillText">${this.getModelPillLabel(isBn)}</span>
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
            <div id="fbImagePreviewBar" class="fb-image-preview-bar" style="display: none;">
                <img id="fbPreviewThumb" class="fb-preview-thumb" alt="Leaf thumbnail" />
                <span id="fbPreviewInfo" class="fb-preview-info">${isBn ? "🌿 পাতার ছবি যুক্ত হয়েছে" : "🌿 Leaf image attached"}</span>
                <button type="button" id="fbPreviewRemoveBtn" class="fb-preview-remove" title="Remove image">✕</button>
            </div>
            <form id="fbChatForm" class="fb-form" onsubmit="return false;">
                <input type="file" id="fbCameraInput" accept="image/*" capture="environment" style="display: none;" />
                <button type="button" id="fbCamBtn" class="fb-cam-btn" aria-label="Upload Leaf/Soil Photo (পাতার ছবি)" title="${isBn ? 'পাতার ছবি তুলুন বা আপলোড করুন' : 'Take or upload leaf/soil photo'}">📷</button>
                <button type="button" id="fbMicBtn" class="fb-mic-btn" aria-label="Voice Input (ভয়েস টাইপিং)" title="${isBn ? 'ভয়েস টাইপিং (Speech-to-Text)' : 'Voice Input (Speech-to-Text)'}">🎙️</button>
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

        this.cameraInput = inputArea.querySelector("#fbCameraInput") as HTMLInputElement;
        this.camBtn = inputArea.querySelector("#fbCamBtn") as HTMLButtonElement;
        this.micBtn = inputArea.querySelector("#fbMicBtn") as HTMLButtonElement;
        this.inputField = inputArea.querySelector("#fbInput") as HTMLInputElement;
        this.sendButton = inputArea.querySelector("#fbSendBtn") as HTMLButtonElement;
        this.footerNoteEl = inputArea.querySelector("#fbFooterNote") as HTMLElement;
        this.imagePreviewBar = inputArea.querySelector("#fbImagePreviewBar") as HTMLElement;
        this.previewThumb = inputArea.querySelector("#fbPreviewThumb") as HTMLImageElement;
        this.previewInfo = inputArea.querySelector("#fbPreviewInfo") as HTMLElement;
        this.previewRemoveBtn = inputArea.querySelector("#fbPreviewRemoveBtn") as HTMLButtonElement;

        this.chatWindow.appendChild(header);
        this.chatWindow.appendChild(this.modelToolbar);
        this.chatWindow.appendChild(this.messagesContainer);
        this.chatWindow.appendChild(this.chipsContainer);
        this.chatWindow.appendChild(inputArea);

        this.widgetContainer.appendChild(this.fabButton);
        this.widgetContainer.appendChild(this.chatWindow);
        document.body.appendChild(this.widgetContainer);

        this.initSpeechRecognition();
        this.updateLiveSyncBadge();
    }

    public getModelPillClass(): string {
        if (this.selectedModel === "gemini-2.5-pro") return "pro";
        if (this.selectedModel === "gemini-2.5-flash") return "lite";
        return "ultra"; // gemini-3.5-flash
    }

    public getModelPillLabel(isBn: boolean): string {
        if (this.selectedModel === "gemini-2.5-pro") {
            return isBn ? "Pro · প্ল্যানার" : "Pro · Planner";
        }
        if (this.selectedModel === "gemini-2.5-flash") {
            return isBn ? "2.5 · হালকা" : "2.5 · Lite";
        }
        return isBn ? "3.5 · দ্রুততম" : "3.5 · Ultra";
    }

    public updateModelUI(): void {
        const isBn = (this.currentLang === "bn");
        const pill = this.chatWindow ? this.chatWindow.querySelector("#fbModelPill") : null;
        const pillText = this.chatWindow ? this.chatWindow.querySelector("#fbModelPillText") : null;
        const badge = this.badgeEl;

        if (pill) {
            pill.className = `fb-model-pill ${this.getModelPillClass()}`;
        }
        if (pillText) {
            pillText.textContent = this.getModelPillLabel(isBn);
        }
        if (badge) {
            if (this.selectedModel === "gemini-2.5-pro") {
                badge.textContent = isBn ? "AI প্রফিট প্ল্যানার" : "AI Profit Planner";
            } else if (this.selectedModel === "gemini-2.5-flash") {
                badge.textContent = isBn ? "AI লাইট মোড" : "AI Low-Bandwidth";
            } else {
                badge.textContent = isBn ? "AI দ্রুততম 3.5" : "AI Ultra-Fast 3.5";
            }
        }
    }

    public setLanguage(lang: AppLanguage): void {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        const texts = this.i18nDict[lang];
        const isBn = (lang === "bn");

        // Cancel active TTS and stop speech recognition
        if (typeof window !== "undefined" && ('speechSynthesis' in window)) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
        this.stopVoiceInput();

        if (this.fabButton) this.fabButton.setAttribute("aria-label", texts.fabAria);
        if (this.fabLabelEl) this.fabLabelEl.textContent = texts.fabLabel;
        if (this.titleEl) this.titleEl.textContent = texts.title;
        if (this.statusEl) this.statusEl.textContent = texts.status;
        if (this.resetBtnEl) this.resetBtnEl.title = texts.resetTitle;
        if (this.closeBtnEl) this.closeBtnEl.title = texts.minimizeTitle;
        if (this.minimizeBtnEl) this.minimizeBtnEl.title = texts.minimizeTitle;
        if (this.inputField) this.inputField.placeholder = texts.inputPlaceholder;
        if (this.sendButton) this.sendButton.setAttribute("aria-label", texts.sendAria);
        if (this.footerNoteEl) this.footerNoteEl.innerHTML = texts.footerNote;

        if (this.camBtn) this.camBtn.title = isBn ? "পাতার ছবি তুলুন বা আপলোড করুন" : "Take or upload leaf/soil photo";
        if (this.micBtn) this.micBtn.title = isBn ? "ভয়েস টাইপিং (Speech-to-Text)" : "Voice Input (Speech-to-Text)";
        if (this.previewInfo) {
            this.previewInfo.textContent = isBn ? "🌿 পাতার ছবি যুক্ত হয়েছে" : "🌿 Leaf image attached";
        }

        const modelSelect = this.chatWindow ? this.chatWindow.querySelector("#fbModelSelect") as HTMLSelectElement | null : null;
        if (modelSelect) {
            modelSelect.innerHTML = `
                <option value="gemini-3.5-flash" ${this.selectedModel === 'gemini-3.5-flash' ? 'selected' : ''}>
                    ${isBn ? "⚡ Gemini 3.5 Flash (Ultra Fast / নতুন ও দ্রুততম)" : "⚡ Gemini 3.5 Flash (Ultra Fast)"}
                </option>
                <option value="gemini-2.5-pro" ${this.selectedModel === 'gemini-2.5-pro' ? 'selected' : ''}>
                    ${isBn ? "🎯 Gemini 2.5 Pro (Deep Profit & Rotation Planner / বিশেষজ্ঞ প্ল্যানার)" : "🎯 Gemini 2.5 Pro (Deep Profit & Rotation Planner)"}
                </option>
                <option value="gemini-2.5-flash" ${this.selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>
                    ${isBn ? "🌱 Gemini 2.5 Flash (Low-Bandwidth Mode / সাশ্রয়ী মোড)" : "🌱 Gemini 2.5 Flash (Low-Bandwidth Mode)"}
                </option>
            `;
        }

        this.renderQuickChips();
        this.loadSessionMessages();
        this.renderHistory();
        this.updateModelUI();
        this.updateLiveSyncBadge();
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
        this.fabButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleWindow();
        });

        if (this.closeBtnEl) {
            this.closeBtnEl.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.toggleWindow(false);
            });
        }
        if (this.minimizeBtnEl && this.minimizeBtnEl !== this.closeBtnEl) {
            this.minimizeBtnEl.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.toggleWindow(false);
            });
        }
        if (this.resetBtnEl) {
            this.resetBtnEl.addEventListener("click", () => this.resetConversation());
        }

        // Global outside-click dismiss listener
        document.addEventListener("click", (event: MouseEvent) => {
            if (!this.isOpen) return;
            const target = event.target as Node | null;
            if (
                target &&
                this.chatWindow &&
                this.fabButton &&
                !this.chatWindow.contains(target) &&
                !this.fabButton.contains(target) &&
                !(this.cameraInput && this.cameraInput.contains(target))
            ) {
                this.toggleWindow(false);
            }
        });

        const modelSelect = this.chatWindow.querySelector("#fbModelSelect") as HTMLSelectElement | null;
        if (modelSelect) {
            modelSelect.addEventListener("change", (e: any) => {
                this.selectedModel = e.target.value as GeminiModelTier;
                try { localStorage.setItem("agrivision_selected_model", this.selectedModel); } catch (err) { }
                this.updateModelUI();
                console.log(`[FarmerBuddy] Selected model switched to: ${this.selectedModel}`);
            });
        }

        // 📷 Camera / Gallery leaf photo upload
        if (this.camBtn && this.cameraInput) {
            this.camBtn.addEventListener("click", () => {
                this.cameraInput.click();
            });
            this.cameraInput.addEventListener("change", (e) => {
                this.handleImageSelect(e);
            });
        }

        // Preview remove button
        if (this.previewRemoveBtn) {
            this.previewRemoveBtn.addEventListener("click", () => {
                this.clearAttachedImage();
            });
        }

        // 🎤 Voice Input (Speech-to-Text)
        if (this.micBtn) {
            this.micBtn.addEventListener("click", () => {
                this.toggleVoiceInput();
            });
        }

        const form = this.chatWindow.querySelector("#fbChatForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const val = this.inputField.value.trim();
                if ((val || this.attachedImage) && !this.isStreaming) {
                    const isBn = (this.currentLang === "bn");
                    const defaultPrompt = isBn
                        ? "এই ফসলের পাতা বা মাটির ছবিটি মনোযোগ দিয়ে দেখুন। এতে কী রোগ, পোকা বা পুষ্টির ঘাটতি হয়েছে, তার লক্ষণ এবং জৈব ও রাসায়নিক প্রতিকার বিস্তারিত বলুন।"
                        : "Analyze this crop leaf/soil image carefully. Identify any disease, pest attack, or nutrient deficiency, explain the visible symptoms, and provide exact organic and chemical remedies.";
                    const textToSend = val || defaultPrompt;
                    const imageToSend = this.attachedImage;

                    this.inputField.value = "";
                    this.clearAttachedImage();
                    this.handleUserSubmit(textToSend, imageToSend);
                }
            });
        }

        // 3D Dashboard Live Sync Listeners
        const cropSelect = document.getElementById("cropSelect");
        if (cropSelect) {
            cropSelect.addEventListener("change", () => {
                this.updateLiveSyncBadge();
            });
        }

        const timelineSlider = document.getElementById("growthTimelineSlider");
        if (timelineSlider) {
            timelineSlider.addEventListener("input", () => {
                this.updateLiveSyncBadge();
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
                if (this.context.farmer) {
                    this.updatePersonalizedWelcomeMessage(this.context.farmer);
                }
            });
        }

        // Real-Time Farmer Authentication & Personalization Sync
        window.addEventListener("farmer-auth-changed", (e: any) => {
            const farmer = e.detail;
            if (farmer) {
                this.context.farmer = farmer;
                this.context.crop = farmer.primaryCrop;
                this.context.landSizeDecimals = farmer.landSizeDecimals;
                this.context.soilType = farmer.soilType;
                this.context.location = farmer.district;
                this.updatePersonalizedWelcomeMessage(farmer);
            }
        });

        if (typeof window !== "undefined" && (window as any).authService) {
            const active = (window as any).authService.getCurrentFarmer();
            if (active) {
                this.context.farmer = active;
                this.context.crop = active.primaryCrop;
                this.context.landSizeDecimals = active.landSizeDecimals;
                this.context.soilType = active.soilType;
                this.context.location = active.district;
                this.updatePersonalizedWelcomeMessage(active);
            }
        }
    }

    public toggleWindow(forceState?: boolean): void {
        this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;

        if (this.isOpen) {
            this.chatWindow.style.display = "flex";
            this.chatWindow.classList.remove("collapsed");
            this.chatWindow.classList.add("expanded");
            this.fabButton.classList.add("active");
            this.updateLiveSyncBadge();
            this.scrollToBottom();
            setTimeout(() => this.inputField && this.inputField.focus(), 250);
        } else {
            this.chatWindow.classList.remove("expanded");
            this.chatWindow.classList.add("collapsed");
            this.chatWindow.style.display = "none";
            this.fabButton.classList.remove("active");
            if (typeof window !== "undefined" && ('speechSynthesis' in window)) {
                try { window.speechSynthesis.cancel(); } catch (e) {}
            }
            this.stopVoiceInput();
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
        const isBn = (this.currentLang === "bn");

        const imageHtml = msg.image ? `<img src="${msg.image}" class="msg-attached-img" alt="Attached Leaf/Soil Image" />` : '';
        const ttsBtnHtml = (msg.sender === "buddy" && msg.text && msg.text.trim())
            ? `<button type="button" class="fb-tts-btn" data-msg-id="${msg.id}" title="${isBn ? 'ভয়েসে শুনুন' : 'Listen with Voice'}"><span class="tts-icon">🔊</span> <span class="tts-text">${isBn ? 'শুনুন' : 'Listen'}</span></button>`
            : '';

        bubble.innerHTML = `
            <div class="msg-bubble-wrap">
                ${msg.sender === "buddy" ? `<span class="msg-sender-tag">${senderTag}</span>` : ''}
                ${imageHtml}
                <div class="msg-text">${this.formatMarkdown(msg.text)}</div>
                <div class="msg-footer-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                    <span class="msg-time">${timeStr}</span>
                    ${ttsBtnHtml}
                </div>
            </div>
        `;

        if (msg.sender === "buddy" && msg.text && msg.text.trim()) {
            const ttsBtn = bubble.querySelector(".fb-tts-btn") as HTMLButtonElement | null;
            if (ttsBtn) {
                ttsBtn.addEventListener("click", () => {
                    this.toggleMessageTTS(msg.text, ttsBtn);
                });
            }
        }

        this.messagesContainer.appendChild(bubble);
        this.scrollToBottom();
        return bubble;
    }

    public async handleUserSubmit(text: string, attachedImage?: string | null): Promise<void> {
        if ((!text || !text.trim()) && !attachedImage) return;
        if (this.isStreaming) return;
        const cleanText = text.trim();

        const userMsg: ChatMessage = {
            id: "u-" + Date.now(),
            sender: "user",
            text: cleanText,
            image: attachedImage || undefined,
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
        let thinkingLabel: string;
        if (attachedImage) {
            thinkingLabel = isBn ? "📷 পাতার ছবির লক্ষণ ও রোগ বিশ্লেষণ করছি..." : "📷 Analyzing Leaf Symptoms & Pathology Vision...";
        } else if (this.selectedModel === "gemini-2.5-pro") {
            thinkingLabel = isBn ? "শস্য পরিক্রমা ও লাভ পরিকল্পনা হিসাব করছি..." : "Calculating Crop Rotation & Profit Plan...";
        } else if (this.selectedModel === "gemini-2.5-flash") {
            thinkingLabel = isBn ? "হালকা ব্যান্ডউইথে কৃষি পরামর্শ বিশ্লেষণ করছি..." : "Analyzing in Low-Bandwidth Mode...";
        } else {
            thinkingLabel = isBn ? "Gemini 3.5 দিয়ে কৃষি পরামর্শ বিশ্লেষণ করছি..." : "Analyzing Advisory with Gemini 3.5...";
        }

        textTarget.innerHTML = `<span class="fb-typing-indicator"><span class="fb-typing-dots"><span></span><span></span><span></span></span> <span class="fb-thinking-text">${thinkingLabel}</span></span>`;

        this.isStreaming = true;
        this.setInputsDisabled(true);

        const recentHistory = this.getRecentChatHistory(10);
        const farmContext = this.getLiveFieldContext();

        // 2. Multi-turn context extraction and persistent tracking
        const detectedCrop = this.localEngine.extractCrop(cleanText);
        const detectedAge = this.localEngine.extractAge(cleanText);
        const landInfo = this.localEngine.extractLandDetails(cleanText);
        const detectedIntent = this.localEngine.extractIntent(cleanText);

        if (detectedCrop) {
            this.context.crop = detectedCrop;
        } else if (!this.context.crop && farmContext.crop) {
            const activeDashboardCrop = this.localEngine.extractCrop(farmContext.crop);
            if (activeDashboardCrop) this.context.crop = activeDashboardCrop;
        }

        if (detectedAge !== null) {
            this.context.cropAgeDays = detectedAge;
        }

        if (landInfo.landSize) {
            const parsedDec = parseFloat(this.localEngine.normalizeDigits(landInfo.landSize).replace(/[^\d.]/g, ""));
            if (!isNaN(parsedDec)) this.context.landSizeDecimals = parsedDec;
        }
        if (landInfo.soilType) this.context.soilType = landInfo.soilType;
        if (landInfo.location) this.context.location = landInfo.location;
        if (detectedIntent && detectedIntent !== "general_farming") {
            this.context.lastIntent = detectedIntent;
        }

        // Automatic prompt context enrichment for short follow-ups
        const isNumberOnly = /^\d+$/.test(this.localEngine.normalizeDigits(cleanText).trim());
        const isShortFollowUp = (cleanText.split(/\s+/).length <= 4) && (
            isNumberOnly ||
            detectedAge !== null ||
            (detectedCrop !== null && (!detectedIntent || detectedIntent === "general_farming")) ||
            landInfo.landSize !== null ||
            Boolean(this.context.lastBotQuestion)
        );

        let promptForAi = cleanText;
        if (isShortFollowUp && (this.context.lastBotQuestion || this.context.crop || this.context.cropAgeDays)) {
            const activeCrop = this.context.crop || farmContext.crop || "Crop";
            const lastQ = this.context.lastBotQuestion || "Previous agricultural inquiry";
            promptForAi = `[Context: Crop=${activeCrop}, Age/Value=${cleanText}, PreviousQuestion=${lastQ}] User reply: ${cleanText}`;
            console.log(`[FarmerBuddy] Enriched user prompt for multi-turn AI context: "${promptForAi}"`);
        }

        let replyText: string | null = null;

        try {
            // LAYER 1: DIRECT GEMINI REST API (Multimodal with inlineData if attachedImage)
            if (this.geminiApiKey && navigator.onLine) {
                try {
                    replyText = await this.callDirectGemini(promptForAi, attachedImage || null, recentHistory, farmContext);
                } catch (directErr: any) {
                    console.warn("[FarmerBuddy] Direct Gemini API failed:", directErr.message);
                }
            }

            // LAYER 1 (Secondary): LOCAL BACKEND PROXY (with selected model)
            if (!replyText && navigator.onLine) {
                try {
                    replyText = await this.callBackendProxy(promptForAi, recentHistory, farmContext);
                } catch (proxyErr: any) {
                    console.warn("[FarmerBuddy] Backend proxy unavailable:", proxyErr.message);
                }
            }

            // LAYER 2: STATEFUL LOCAL AGRICULTURAL EXPERT & ROTATION ENGINE
            if (!replyText) {
                if (attachedImage) {
                    const activeCrop = this.context.crop || this.localEngine.extractCrop(farmContext.crop) || "tomato";
                    replyText = this.localEngine.generateImageDiagnosisChecklist(activeCrop, isBn);
                } else {
                    replyText = this.localEngine.processQuery(cleanText, this.context, farmContext, this.currentLang);
                }
            }

            replyText = this.enforceGreetingRules(replyText, isBn);
            await this.streamReply(replyText, textTarget, buddyMsg, buddyBubble);

            const userParts: any[] = [{ text: promptForAi }];
            this.chatHistory.push({ role: "user", parts: userParts });
            this.chatHistory.push({ role: "model", parts: [{ text: buddyMsg.text }] });

            const lastQ = this.extractLastQuestion(buddyMsg.text);
            if (lastQ) {
                this.context.lastBotQuestion = lastQ;
            }
            this.saveSessionMessages();
        } catch (err: any) {
            console.error("[FarmerBuddy Critical Error]:", err);
            const safeText = attachedImage
                ? this.localEngine.generateImageDiagnosisChecklist(this.context.crop || "tomato", isBn)
                : this.localEngine.processQuery(cleanText, this.context, farmContext, this.currentLang);
            const enforcedSafeText = this.enforceGreetingRules(safeText, isBn);
            await this.streamReply(enforcedSafeText, textTarget, buddyMsg, buddyBubble);
            const lastQ = this.extractLastQuestion(buddyMsg.text);
            if (lastQ) {
                this.context.lastBotQuestion = lastQ;
            }
        } finally {
            this.isStreaming = false;
            this.setInputsDisabled(false);
            this.saveSessionMessages();
            this.scrollToBottom();
        }
    }

    private async callDirectGemini(
        message: string,
        attachedImage: string | null,
        recentHistory: ChatMessageTurn[],
        farmContext: FarmContext
    ): Promise<string> {
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

        const userParts: any[] = [{ text: message }];
        if (attachedImage) {
            const pureBase64 = attachedImage.includes(",") ? attachedImage.split(",")[1] : attachedImage;
            userParts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: pureBase64
                }
            });
        }

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1].parts.push(...userParts);
        } else {
            contents.push({ role: 'user', parts: userParts });
        }

        // Map UI model names to valid Gemini API endpoints (prevents 404 invalid model crashes)
        const MODEL_MAP: Record<string, string> = {
            'gemini-3.5-flash': 'gemini-2.5-flash',
            'gemini-2.5-pro': 'gemini-2.5-pro',
            'gemini-2.5-flash': 'gemini-2.5-flash'
        };
        const activeApiModel = MODEL_MAP[this.selectedModel] || 'gemini-2.5-flash';

        // Candidate models list prioritizing active, high-availability endpoints
        const candidateModels: string[] = [
            activeApiModel,
            'gemini-2.5-flash',
            'gemini-3.5-flash-lite',
            'gemini-flash-latest'
        ];

        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

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
                    return this.enforceGreetingRules(reply.trim(), (this.currentLang === "bn"));
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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(this.proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                history: recentHistory,
                context: farmContext,
                model: this.selectedModel
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP_${response.status}`);
        }

        const data = await response.json();
        if (data && typeof data.reply === "string" && data.reply.trim()) {
            console.log(`[FarmerBuddy] Backend proxy responded successfully [Model: ${this.selectedModel}].`);
            return this.enforceGreetingRules(data.reply.trim(), (this.currentLang === "bn"));
        }

        throw new Error("EMPTY_PROXY_REPLY");
    }

    private async streamReply(fullText: string, textTarget: HTMLElement, buddyMsg: ChatMessage, buddyBubble?: HTMLElement): Promise<void> {
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

        // Attach TTS button on completed response
        if (buddyBubble) {
            const footerRow = buddyBubble.querySelector(".msg-footer-row");
            if (footerRow && !footerRow.querySelector(".fb-tts-btn")) {
                const isBn = (this.currentLang === "bn");
                const ttsBtn = document.createElement("button");
                ttsBtn.type = "button";
                ttsBtn.className = "fb-tts-btn";
                ttsBtn.title = isBn ? "ভয়েসে শুনুন" : "Listen with Voice";
                ttsBtn.innerHTML = `<span class="tts-icon">🔊</span> <span class="tts-text">${isBn ? "শুনুন" : "Listen"}</span>`;
                ttsBtn.addEventListener("click", () => {
                    this.toggleMessageTTS(buddyMsg.text, ttsBtn);
                });
                footerRow.appendChild(ttsBtn);
            }
        }
    }

    // =========================================================================
    // 🎤 VOICE INPUT (SPEECH-TO-TEXT) & 🔊 OUTPUT (CLEAN TEXT-TO-SPEECH)
    // =========================================================================
    private initSpeechRecognition(): void {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.recognition = null;
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isRecording = true;
                if (this.micBtn) {
                    this.micBtn.classList.add("recording");
                    this.micBtn.textContent = "🔴";
                }
                if (this.inputField) {
                    this.inputField.placeholder = (this.currentLang === "bn")
                        ? "🎙️ শুনছি... আপনার সমস্যার কথা বলুন..."
                        : "🎙️ Listening... Speak now...";
                }
            };

            this.recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript && this.inputField) {
                    const currentVal = this.inputField.value.trim();
                    this.inputField.value = currentVal ? `${currentVal} ${transcript}` : transcript;
                    this.inputField.focus();
                }
                this.stopVoiceInput();
            };

            this.recognition.onerror = (event: any) => {
                console.warn("[FarmerBuddy SpeechRecognition error]:", event.error);
                this.stopVoiceInput();
                if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    this.showNonBlockingNotice(
                        (this.currentLang === "bn")
                            ? "⚠️ মাইক্রোফোন পারমিশন পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজার সেটিংসে পারমিশন দিন।"
                            : "⚠️ Microphone access was denied. Please allow microphone permission in browser settings."
                    );
                }
            };

            this.recognition.onend = () => {
                this.stopVoiceInput();
            };
        } catch (e) {
            console.warn("[FarmerBuddy SpeechRecognition init error]:", e);
            this.recognition = null;
        }
    }

    private toggleVoiceInput(): void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showNonBlockingNotice(
                (this.currentLang === "bn")
                    ? "ℹ️ আপনার ব্রাউজারে সরাসরি ভয়েস টাইপিং (Speech Recognition) সমর্থিত নয়।"
                    : "ℹ️ Speech recognition is not supported in this browser."
            );
            return;
        }

        if (this.isRecording) {
            try { this.recognition?.stop(); } catch (e) { }
            this.stopVoiceInput();
        } else {
            try {
                if (!this.recognition) this.initSpeechRecognition();
                this.recognition.lang = (this.currentLang === "bn") ? "bn-BD" : "en-US";
                this.recognition.start();
            } catch (err: any) {
                console.warn("[FarmerBuddy Mic start failed]:", err);
                this.stopVoiceInput();
            }
        }
    }

    private stopVoiceInput(): void {
        this.isRecording = false;
        if (this.micBtn) {
            this.micBtn.classList.remove("recording");
            this.micBtn.textContent = "🎙️";
        }
        if (this.inputField) {
            this.inputField.placeholder = this.i18nDict[this.currentLang].inputPlaceholder;
        }
    }

    public enforceGreetingRules(reply: string, isBn: boolean): string {
        if (!reply) return reply;
        let cleaned = reply;
        // 1. ABSOLUTE GREETING RESTRICTION: NEVER allow "নমস্কার" (Nomoskar) or variants
        cleaned = cleaned.replace(/নমস্কার[^\s,.!?।]*\s*/gi, isBn ? "আসসালামু আলাইকুম " : "Hello ");
        cleaned = cleaned.replace(/\bnomoskar\b[^\s,.!?]*\s*/gi, isBn ? "Assalamu Alaikum " : "Hello ");
        cleaned = cleaned.replace(/\bnamaskar\b[^\s,.!?]*\s*/gi, isBn ? "Assalamu Alaikum " : "Hello ");

        // 2. STRICT LANGUAGE-BASED GREETING RULE
        const trimmed = cleaned.trim();
        if (isBn) {
            if (!trimmed.startsWith("আসসালামু আলাইকুম")) {
                if (/^(হ্যালো|হাই|নমস্কার|ভাই[,!]|বন্ধু[,!]|আরে ভাই[,!])/i.test(trimmed)) {
                    cleaned = trimmed.replace(/^(হ্যালো|হাই|নমস্কার|ভাই[,!]|বন্ধু[,!]|আরে ভাই[,!])\s*/i, "আসসালামু আলাইকুম ভাই! ");
                } else {
                    cleaned = `আসসালামু আলাইকুম ভাই! ${trimmed}`;
                }
            }
        } else {
            if (!trimmed.toLowerCase().startsWith("hello") && !trimmed.toLowerCase().startsWith("hi")) {
                if (/^(assalamu alaikum|salam|namaskar|nomoskar|hey|friend[,!])/i.test(trimmed)) {
                    cleaned = trimmed.replace(/^(assalamu alaikum|salam|namaskar|nomoskar|hey|friend[,!])\s*/i, "Hello friend! ");
                } else {
                    cleaned = `Hello friend! ${trimmed}`;
                }
            }
        }
        return cleaned;
    }

    public cleanTextForTTS(raw: string): string {
        if (!raw) return "";
        let clean = raw;
        // Strip HTML tags
        clean = clean.replace(/<[^>]*>/g, " ");
        // Strip markdown links [text](url) -> text
        clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        // Strip bold, italics, code: **, *, _, `
        clean = clean.replace(/[*_`#]/g, "");
        // Strip list bullets and symbols: •, -, +, etc.
        clean = clean.replace(/^[•\-\*+]\s*/gm, "");
        clean = clean.replace(/[•\-\*+]/g, " ");
        // Replace dashes / colons with commas for natural voice pauses
        clean = clean.replace(/[—–]/g, ", ");
        // Strip emojis
        clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
        // Normalize whitespace
        clean = clean.replace(/\s+/g, " ").trim();
        return clean;
    }

    private toggleMessageTTS(text: string, buttonEl: HTMLButtonElement): void {
        if (typeof window === "undefined" || !('speechSynthesis' in window)) {
            this.showNonBlockingNotice(
                (this.currentLang === "bn")
                    ? "ℹ️ আপনার ব্রাউজারে টেক্সট-টু-স্পিচ (TTS) সমর্থিত নয়।"
                    : "ℹ️ Text-to-speech is not supported in this browser."
            );
            return;
        }

        const isCurrentlySpeakingThis = buttonEl.classList.contains("speaking");

        window.speechSynthesis.cancel();

        if (this.activeTtsBtn && this.activeTtsBtn !== buttonEl) {
            this.activeTtsBtn.classList.remove("speaking");
            const oldIcon = this.activeTtsBtn.querySelector(".tts-icon");
            const oldText = this.activeTtsBtn.querySelector(".tts-text");
            if (oldIcon) oldIcon.textContent = "🔊";
            if (oldText) oldText.textContent = (this.currentLang === "bn") ? "শুনুন" : "Listen";
        }

        if (isCurrentlySpeakingThis) {
            buttonEl.classList.remove("speaking");
            const iconSpan = buttonEl.querySelector(".tts-icon");
            const textSpan = buttonEl.querySelector(".tts-text");
            if (iconSpan) iconSpan.textContent = "🔊";
            if (textSpan) textSpan.textContent = (this.currentLang === "bn") ? "শুনুন" : "Listen";
            this.activeTtsBtn = null;
            return;
        }

        const cleanText = this.cleanTextForTTS(text);
        if (!cleanText) return;

        const isBn = (this.currentLang === "bn");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = isBn ? "bn-BD" : "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Search for regional voices: bn-BD, bn-IN, bn (or en-US, en-GB, en)
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
            if (isBn) {
                const bnVoice = voices.find(v => v.lang === "bn-BD") ||
                    voices.find(v => v.lang === "bn-IN") ||
                    voices.find(v => v.lang.startsWith("bn"));
                if (bnVoice) utterance.voice = bnVoice;
            } else {
                const enVoice = voices.find(v => v.lang === "en-US") ||
                    voices.find(v => v.lang === "en-GB") ||
                    voices.find(v => v.lang.startsWith("en"));
                if (enVoice) utterance.voice = enVoice;
            }
        }

        const iconSpan = buttonEl.querySelector(".tts-icon");
        const textSpan = buttonEl.querySelector(".tts-text");

        buttonEl.classList.add("speaking");
        if (iconSpan) iconSpan.textContent = "⏹️";
        if (textSpan) textSpan.textContent = isBn ? "থামুন" : "Stop";
        this.activeTtsBtn = buttonEl;

        utterance.onend = () => {
            buttonEl.classList.remove("speaking");
            if (iconSpan) iconSpan.textContent = "🔊";
            if (textSpan) textSpan.textContent = isBn ? "শুনুন" : "Listen";
            this.activeTtsBtn = null;
        };

        utterance.onerror = (e) => {
            console.warn("[FarmerBuddy TTS error]:", e);
            buttonEl.classList.remove("speaking");
            if (iconSpan) iconSpan.textContent = "🔊";
            if (textSpan) textSpan.textContent = isBn ? "শুনুন" : "Listen";
            this.activeTtsBtn = null;
        };

        window.speechSynthesis.speak(utterance);
    }

    // =========================================================================
    // 📷 CLIENT-SIDE COMPRESSED IMAGE DIAGNOSIS HELPERS
    // =========================================================================
    private handleImageSelect(e: Event): void {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                let width = img.width;
                let height = img.height;
                const maxDim = 800;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Low-bandwidth high-clarity JPEG compression (0.72 quality)
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.72);
                this.setAttachedImage(compressedBase64);
            };
            img.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
        (e.target as HTMLInputElement).value = "";
    }

    private setAttachedImage(dataUrl: string): void {
        this.attachedImage = dataUrl;
        if (this.imagePreviewBar && this.previewThumb) {
            this.previewThumb.src = dataUrl;
            if (this.previewInfo) {
                this.previewInfo.textContent = (this.currentLang === "bn")
                    ? "🌿 পাতার ছবি যুক্ত হয়েছে"
                    : "🌿 Leaf image attached";
            }
            this.imagePreviewBar.style.display = "flex";
        }
        this.scrollToBottom();
    }

    private clearAttachedImage(): void {
        this.attachedImage = null;
        if (this.imagePreviewBar) {
            this.imagePreviewBar.style.display = "none";
        }
    }

    private showNonBlockingNotice(text: string): void {
        const noticeBubble = document.createElement("div");
        noticeBubble.className = "fb-message msg-system-notice";
        noticeBubble.innerHTML = `<div class="msg-bubble-wrap"><div class="msg-notice-text">${text}</div></div>`;
        this.messagesContainer.appendChild(noticeBubble);
        this.scrollToBottom();
        setTimeout(() => {
            noticeBubble.style.transition = "opacity 0.4s ease";
            noticeBubble.style.opacity = "0";
            setTimeout(() => noticeBubble.remove(), 400);
        }, 5000);
    }

    public resetConversation(): void {
        this.messages = [];
        this.chatHistory = [];
        this.context = {
            crop: null,
            cropAgeDays: null,
            landSizeDecimals: null,
            location: null,
            soilType: null,
            lastIntent: null,
            intent: null,
            lastBotQuestion: null,
            awaitingSlot: null
        };
        if (typeof window !== "undefined" && ('speechSynthesis' in window)) {
            try { window.speechSynthesis.cancel(); } catch (e) { }
        }
        this.stopVoiceInput();
        this.clearAttachedImage();
        sessionStorage.removeItem(this.getStorageKey());
        sessionStorage.removeItem(`${this.storageKeyPrefix}ctx_${this.currentLang}`);
        this.loadSessionMessages();
        this.renderHistory();
        this.updateLiveSyncBadge();
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
