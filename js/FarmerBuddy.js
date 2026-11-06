/**
 * ============================================================================
 * FARMER BUDDY (কৃষি বন্ধু) - TWO-LAYER HYBRID AGRICULTURAL AI ENGINE
 * ============================================================================
 * LAYER 1 (Primary): Real Google Gemini API with Model Selector:
 *                    - Gemini 2.5 Flash (Fast & Low-Bandwidth / দ্রুত ও হালকা)
 *                    - Gemini 2.5 Pro (Deep Crop & Profit Planner / বিশেষজ্ঞ প্রফিট প্ল্যানার)
 *                    + Pre-configured secure API Key auto-injection (Zero farmer setup!)
 * LAYER 2 (Fallback): Stateful Agricultural Economics & Crop Rotation Planner
 *                    - 3-Season Rotation (Rabi -> Kharif-1 -> Kharif-2)
 *                    - 20-30% Input Cost Reduction (AWD, Green Manure, Trichoderma)
 *                    - Exact Cost vs. Return & Net Profit Estimations
 * ============================================================================
 */

/**
 * STATEFUL AGRICULTURAL EXPERT & ECONOMICS ENGINE (LAYER 2)
 */
class AgriculturalExpertEngine {
    constructor() {
        this.cropAliases = {
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

        this.cropDisplayNames = {
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
    }

    normalizeDigits(str) {
        if (!str) return "";
        const bnDigits = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
        return str.replace(/[০-৯]/g, d => bnDigits[d]);
    }

    extractCrop(text) {
        if (!text) return null;
        const lower = text.toLowerCase();
        for (const [cropKey, aliases] of Object.entries(this.cropAliases)) {
            if (aliases.some(alias => lower.includes(alias))) {
                return cropKey;
            }
        }
        return null;
    }

    extractAge(text) {
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

    extractLandDetails(text) {
        if (!text) return { landSize: null, soilType: null, location: null };
        const normalized = this.normalizeDigits(text.toLowerCase());

        let landSize = null;
        const sizeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(শতাংশ|শতক|ডেসিমাল|decimal|বিঘা|bigha|একর|acre|কাঠা|katha)/i);
        if (sizeMatch) {
            landSize = `${sizeMatch[1]} ${sizeMatch[2]}`;
        }

        let soilType = null;
        if (normalized.includes("দোআঁশ") || normalized.includes("loam")) soilType = "দোআঁশ (Loam)";
        else if (normalized.includes("বেলে দোআঁশ") || normalized.includes("sandy loam")) soilType = "বেলে দোআঁশ (Sandy Loam)";
        else if (normalized.includes("এঁটেল") || normalized.includes("clay")) soilType = "এঁটেল মাটি (Clay Loam)";
        else if (normalized.includes("পলি") || normalized.includes("silt")) soilType = "পলি দোআঁশ (Silt Loam)";

        let location = null;
        const districts = ["বগুড়া", "রংপুর", "যশোর", "কুমিল্লা", "দিনাজপুর", "রাজশাহী", "ময়মনসিংহ", "বরিশাল", "সিলেট", "ঢাকা", "নাটোর", "পাবনা", "bogura", "rangpur", "jashore", "cumilla", "rajshahi", "dinajpur"];
        for (const d of districts) {
            if (normalized.includes(d.toLowerCase())) {
                location = d;
                break;
            }
        }

        return { landSize, soilType, location };
    }

    extractIntent(text) {
        if (!text) return null;
        const t = text.toLowerCase();

        // 1. Crop Rotation, Profit & Land Planning (Highest Priority)
        if (["শস্য পরিক্রমা", "শস্য আবর্তন", "ফসল আবর্তন", "পরিকল্পনা", "লাভ", "খরচ কমানো", "বাজেট", "রোটেশন", "rotation", "profit", "plan", "cost reduction", "budget", "land appraisal", "economics"].some(k => t.includes(k))) {
            return "rotation_plan";
        }

        // 2. Fertilizer & Soil Cost Minimization
        if (["সার", "ইউরিয়া", "ইউরিয়া", "পটাশ", "টিএসপি", "ড্যাপ", "ডিএপি", "সুষম", "মাত্রা", "কতটুকু", "বোরন", "জিংক", "সার হিসাব", "fertilizer", "urea", "potash", "tsp", "dap", "npk", "dosage", "boron", "zinc"].some(k => t.includes(k))) {
            return "fertilizer";
        }

        // 3. Pest, Disease & Symptoms
        if (["পোকা", "রোগ", "দাগ", "পচন", "হলুদ", "কোঁকড়ানো", "কোকড়ানো", "ধসা", "মাজরা", "কীটনাশক", "বালাই", "স্প্রে", "pest", "disease", "insect", "fungus", "yellow", "blight", "rot", "worm", "borer", "leaf curl", "spot"].some(k => t.includes(k))) {
            return "pest_disease";
        }

        // 4. Irrigation & Water (AWD)
        if (["সেচ", "পানি", "শুকিয়ে", "ড্রেন", "নিষ্কাশন", "পানিবদ্ধতা", "awd", "irrigation", "water", "watering", "drainage"].some(k => t.includes(k))) {
            return "irrigation";
        }

        // 5. Weather
        if (["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "মেঘ", "তুফান", "খরা", "weather", "rain", "storm", "flood", "cyclone"].some(k => t.includes(k))) {
            return "weather";
        }

        // 6. Market & Storage
        if (["দাম", "বাজার", "দর", "বিক্রি", "আড়ত", "ফড়িয়া", "সংরক্ষণ", "ড্রাম", "বীজ", "market", "price", "sell", "storage", "harvest"].some(k => t.includes(k))) {
            return "harvest_market";
        }

        return null;
    }

    processQuery(query, context, farmContext, currentLang) {
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

        if (detectedIntent) {
            context.intent = detectedIntent;
        }

        const crop = context.crop || "tomato";
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const cropLabel = isBn ? cropNames.bn : cropNames.en;

        // CASE 1: CROP ROTATION & PROFIT PLANNING INTENT
        if (context.intent === "rotation_plan" || detectedIntent === "rotation_plan" || landDetails.landSize) {
            context.awaitingSlot = null;
            return this.generateCropRotationAndProfitPlan(landDetails, isBn);
        }

        // CASE 2: AGE FOLLOW-UP (e.g., "20", "৪০", "40", "20 দিন")
        if (detectedAge !== null) {
            context.awaitingSlot = null;
            return this.generateAgeSpecificAdvice(crop, detectedAge, context.intent, isBn);
        }

        // CASE 3: CROP FOLLOW-UP (e.g., "Rice", "ধান", "Potato", "আলু")
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
                return `ভাই, আপনার **${cropLabel}** ক্ষেতের জন্য আমি প্রস্তুত!

• **সুষম সার ও সেচ:** চারা রোপণের পর দিন অনুযায়ী সঠিক সার ও সেচের নিয়ম জেনে নিন।
• **খরচ কমানোর কৌশল:** ট্রাইকো-কম্পোস্ট ও জৈব সারের মাধ্যমে রাসায়নিক সারের খরচ ৩০% কমান।
• **শস্য পরিক্রমা:** এই ফসলের পর জমিতে কী বুনলে সবচেয়ে বেশি লাভ হবে তা জানুন।

আপনার **${cropLabel}** গাছটির বর্তমান বয়স কত দিন বলুন তো (যেমন ২০ দিন বা ৪০ দিন)?`;
            } else {
                context.awaitingSlot = "age";
                return `Friend, I have locked onto your **${cropLabel}** field!

• **Targeted Fertilization:** Get the exact split dosages of Urea, TSP, and Potash per decimal for this crop.
• **Cost Reduction:** Cut chemical fertilizer bills by 20-30% using compost and bio-inoculants.
• **Crop Rotation:** Discover what follow-up crop maximizes annual net returns on this soil.

How many days old is your **${cropLabel}** crop right now (e.g., 20 or 40 days)?`;
            }
        }

        // CASE 4: FERTILIZER INTENT
        if (context.intent === "fertilizer" || detectedIntent === "fertilizer") {
            if (context.cropAgeDays) {
                return this.generateAgeSpecificAdvice(crop, context.cropAgeDays, "fertilizer", isBn);
            } else {
                context.awaitingSlot = "age";
                return this.generateCropFertilizerSchedule(crop, null, isBn);
            }
        }

        // CASE 5: PEST & DISEASE INTENT
        if (context.intent === "pest_disease" || detectedIntent === "pest_disease") {
            return this.generatePestDiagnosis(crop, query, isBn);
        }

        // CASE 6: IRRIGATION
        if (context.intent === "irrigation" || detectedIntent === "irrigation") {
            return this.generateIrrigationAdvice(crop, context.cropAgeDays, isBn);
        }

        // CASE 7: WEATHER
        if (context.intent === "weather" || detectedIntent === "weather") {
            return this.generateWeatherAdvice(crop, isBn);
        }

        // CASE 8: MARKET & STORAGE
        if (context.intent === "harvest_market" || detectedIntent === "harvest_market") {
            return this.generateMarketAdvice(crop, isBn);
        }

        // DEFAULT CONTEXTUAL APPRAISAL (Warm & Actionable)
        if (isBn) {
            context.awaitingSlot = "crop";
            return `আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু ও প্রফিট প্ল্যানার**। বর্তমানে আপনার ড্যাশবোর্ডে **${cropLabel}** নির্বাচিত আছে।

• **শস্য আবর্তন ও লাভ প্ল্যান:** আপনার জমির পরিমাণ ও জেলা জানালে ৩ মৌসুমের পূর্ণাঙ্গ প্রফিট চার্ট দেব।
• **সুষম সার ও খরচ হ্রাস:** রাসায়নিক সারের খরচ ৩০% কমিয়ে সর্বোচ্চ ফলনের সার শিডিউল নিন।
• **রোগবালাই দমন:** পাতায় হলুদ দাগ, কোঁকড়ানো বা পোকা থাকলে সাশ্রয়ী ঘরোয়া উপায় জানুন।

আজ আপনার **${cropLabel}** ক্ষেত বা জমির জন্য কোন বিষয়ে পরামর্শ চান বলুন তো?`;
        } else {
            context.awaitingSlot = "crop";
            return `Hello Friend! I am your **Farmer Buddy & Agricultural Profit Planner**. Your 3D farm is currently viewing **${cropLabel}**.

• **Crop Rotation & Profit Planner:** Share your land size and district for a 3-season high-return rotation cycle.
• **Input Cost Reduction:** Reduce chemical fertilizer expenditures by 25-30% while securing peak yields.
• **Pest & Disease Remedies:** Low-cost, organic solutions for yellowing leaves and borer pests.

Which aspect of your **${cropLabel}** crop or land planning would you like guidance on today?`;
        }
    }

    generateCropRotationAndProfitPlan(landInfo, isBn) {
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

    generateAgeSpecificAdvice(crop, age, intent, isBn) {
        if (crop === "tomato") {
            if (age <= 25) {
                return isBn
                    ? `ভাই! **২০-২৫ দিন** বয়সে টমেটো গাছ দ্রুত শিকড় ও ডালপালা ছড়ায় (চারা বৃদ্ধি পর্যায়)। এই সময় করণীয়:

• **প্রথম কিস্তির উপরি-প্রয়োগ:** প্রতি শতাংশে (Decimal) ১৫০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম এমওপি (পটাশ) সার গাছের গোড়া থেকে ৫-৬ ইঞ্চি দূরে মাটিতে আলতো নিড়ানি দিয়ে মিশিয়ে দিন।
• **খুঁটি বা সাপোর্ট (Staking):** গাছ যাতে বাতাসে হেলে না পড়ে বা মাটিতে হেলে না যায়, সেজন্য বাঁশের কঞ্চি দিয়ে আলতো করে বেঁধে দিন।
• **কাটুই পোকা ও গোড়া পচা নজরদারি:** সকালে কোনো চারা কাটা দেখলে মাটি খুঁড়ে কাটুই পোকা নিধন করুন এবং গোড়ায় যেন পানি জমে না থাকে তা নিশ্চিত করুন।

সার প্রয়োগের পর মাটিতে রস না থাকলে হালকা সেচ দিন। আপনার জমিতে মাটি কি যথেষ্ট ভেজা আছে?`
                    : `Friend! At **${age} days**, your tomato plants are in their active vegetative branching stage. Here is your targeted plan:

• **First Top Dressing:** Apply 150g Urea and 150g MoP (Potash) per decimal in a ring 5-6 inches away from stems; gently incorporate into soil.
• **Staking & Support:** Install bamboo stakes or twine supports now to prevent lodging and keep foliage off wet soil.
• **Cutworm Vigilance:** Inspect soil around any severed seedlings at dawn to remove cutworms manually.

Ensure light soil moisture after fertilizing. Does your field have adequate moisture right now?`;
            } else if (age <= 50) {
                return isBn
                    ? `আরে ভাই! **${age} দিন** বয়সে টমেটো গাছে ফুল ফোটা এবং ফল ধরার সবচেয়ে গুরুত্বপূর্ণ পর্যায় শুরু হয়! এই সময় সঠিক খাদ্য নিশ্চিত না করলে ফুল ঝরে যেতে পারে:

• **দ্বিতীয় কিস্তির সার:** প্রতি শতাংশে ২০০ গ্রাম ইউরিয়া এবং ২৫০ গ্রাম এমওপি (পটাশ) গাছের গোড়ার চারধারে ছড়িয়ে হালকা নিড়ানি দিন।
• **বোরন ও জিংক স্প্রে (ফুল ঝরা রোধে):** ফুল ঝরে পড়া ঠেকাতে এবং ফলের তলা পচা রোধে প্রতি লিটার পানিতে ২ গ্রাম 'সলুবর বোরন' ও ১ গ্রাম চিলেটেড জিংক মিশিয়ে বিকেলে পাতার নিচে ও উপরে স্প্রে করুন।
• **কুশি ছাঁটাই (Pruning):** গাছের গোড়ার দিকের পুরনো হলুদ পাতা ও অতিরিক্ত ডালপালা (suckers) কেটে দিন যাতে ফল বড় হওয়ার পর্যাপ্ত খাদ্য পায়।
• **নিয়মিত হালকা সেচ:** মাটিতে যেন সব সময় জো (রস) থাকে; হঠাৎ শুকিয়ে অতিরিক্ত পানি দিলে টমেটো ফেটে যায়।

গাছের পাতায় কি কোনো কুঁকড়ে যাওয়া বা পোকার আক্রমণ দেখতে পাচ্ছেন?`
                    : `Friend! At **${age} days**, your tomato plants are in their golden flowering and early fruit-setting stage! Proper nutrition is vital to prevent blossom drop:

• **Second Top Dressing:** Apply 200g Urea and 250g MoP (Potash) per decimal around plant driplines and lightly incorporate.
• **Solubor Boron Spray:** Spray Solubor Boron at 2g/liter of water in late afternoon to stop blossom abortion and prevent Blossom End Rot.
• **Sucker Pruning:** Prune bottom suckers and yellowing foliage to enhance sunlight penetration and redirect sugars into developing fruit clusters.
• **Steady Irrigation:** Maintain uniform soil moisture; avoid fluctuating between dry periods and flooding, which causes fruit cracking.

Are you noticing any curled leaves or spotted fruit clusters on your tomato plants?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে টমেটো ফল পরিপক্ক ও পাকা শুরু করে:

• **পটাশ সার প্রয়োগ:** ফলের আকার বড়, চকচকে ও মিষ্টি করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিন।
• **ফল ছিদ্রকারী পোকা দমন:** টমেটোতে ছিদ্র করা পোকা দমনে জমিতে সেক্স ফেরোমোন ফাঁদ (প্রতি বিঘাতে ১০-১২টি) পাতুন এবং প্রয়োজনে জৈব স্পিনোসাড স্প্রে করুন।
• **তুলে নেওয়ার নিয়ম:** আড়তে বা বাজারে পাঠাতে চাইলে লাল হওয়ার ঠিক আগের দিন (ব্রেক স্টেজ) বোঁটা সহ সাবধানে তুলুন।

আপনি কি পাকা টমেটো স্থানীয় বাজারে নাকি পাইকারি আড়তে বিক্রির পরিকল্পনা করছেন?`
                    : `Friend! At **${age} days**, your tomatoes are in their heavy fruit bulking and ripening phase:

• **Potash Application:** Apply 150g Potash per decimal to maximize fruit size, firmness, and shelf-life.
• **Fruit Borer Control:** Erect sex pheromone traps (10-12 per bigha) for Helicoverpa armigera. Spray Spinosad (0.4 ml/L) if larvae are spotted.
• **Harvest Timing:** Pick fruit at the mature green/breaker stage for long-distance wholesale transport to avoid transit bruising.

Are you planning to sell your harvest locally or send it to regional wholesale markets?`;
            }
        } else if (crop === "rice") {
            if (age <= 25) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান গাছের কুশি আসার (Tillering) অত্যন্ত গুরুত্বপূর্ণ সময়। এই সময় যত বেশি কুশি গজাবে, ফলন তত বেশি হবে!

• **প্রথম কিস্তির ইউরিয়া ও পটাশ:** প্রতি শতাংশে ২০০-২৫০ গ্রাম ইউরিয়া এবং ১০০ গ্রাম এমওপি (পটাশ) সার জমিতে সমানভাবে ছিটান।
• **পানির মাত্রা:** জমিতে ১ থেকে ২ ইঞ্চি ছিপছিপে পানি রাখুন; অতিরিক্ত পানি জমিয়ে রাখলে কুশির সংখ্যা কমে যায়।
• **মাজরা পোকা নজরদারি:** ধানের পাতার মাঝে মরা কুশি দেখলে বাঁশের ডাল পুঁতে দিন (পাখি বসার জন্য) অথবা আলোর ফাঁদ ব্যবহার করুন।
• **আগাছা নিড়ানো:** সার দেওয়ার আগে জমি থেকে আগাছা সম্পূর্ণ পরিষ্কার করে নিন।

আপনার ধানক্ষেতে কি বর্তমানে আগাছা বা মরা কুশির লক্ষণ দেখতে পাচ্ছেন?`
                    : `Friend! At **${age} days**, your rice crop is in its critical active tillering phase. Every healthy tiller means an extra grain panicle!

• **First Top Dressing:** Broadcast 200-250g Urea and 100g MoP (Potash) per decimal evenly across the field.
• **Water Depth Control:** Maintain shallow water depth (1-2 inches); deep standing water suppresses tiller emergence.
• **Stem Borer Defense:** Watch for "dead hearts". Install bamboo perches for predatory birds and light traps for borer moths.
• **Weeding:** Thoroughly weed the paddies before broadcasting fertilizer.

Are your drainage and shallow water levels properly balanced in the field?`;
            } else if (age <= 55) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান গাছ থোড় বা গর্ভধারণ (Panicle Initiation) অবস্থায় প্রবেশ করে। শীষ পরিপুষ্ট করতে করণীয়:

• **শেষ কিস্তির ইউরিয়া:** প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া প্রয়োগ করুন। তবে পাতার রঙ যদি আগেই গাঢ় সবুজ থাকে তবে ইউরিয়া বাদ দিন।
• **পটাশ ও সালফার স্প্রে:** দানা পুষ্ট ও চিটা রোধে প্রতি শতাংশে ১০০ গ্রাম পটাশ সার দিন অথবা ১% পটাশিয়াম সালফেট স্প্রে করুন।
• **পানির স্তর বজায় রাখা:** এই সময় জমিতে অবশ্যই ২-৩ ইঞ্চি পানি ধরে রাখতে হবে; কোনোভাবেই এই দশায় জমি শুকানো যাবে না।
• **বাদামি ঘাসফড়িং (কারেন্ট পোকা) পরীক্ষা:** ধানের গোড়া ফাঁক করে দেখুন কোনো পোকা আছে কিনা।

জমিতে কি পানি পর্যাপ্ত ধরে রাখা সম্ভব হচ্ছে?`
                    : `Friend! At **${age} days**, your paddy is entering the panicle initiation and booting stage:

• **Final Urea Split:** Apply 150g Urea per decimal only if foliage is pale green; omit if already deep emerald.
• **Potash for Grain Filling:** Apply 100g Potash per decimal to prevent unfilled empty grains (chita) and strengthen straw.
• **Critical Moisture Level:** Maintain continuous 2-3 inches of standing water; water stress at this stage severely reduces yield.
• **Brown Planthopper (BPH) Scout:** Part the bottom tillers to inspect for planthoppers near the water surface.

Are your paddy bunds holding standing water securely?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে ধান পাকা শুরু করেছে (দানা শক্ত হওয়ার পর্যায়):

• **পানি নিষ্কাশন:** ফসল কাটার ১০-১২ দিন আগে জমির সম্পূর্ণ পানি বের করে জমি শুকিয়ে দিন। এতে ধান সহজে পাকবে ও কাটার সুবিধা হবে।
• **শীষ কাটার পোকা ও ইঁদুর দমন:** ধান হেলে পড়া রোধ করুন এবং জমির চারধারে পরিষ্কার পরিচ্ছন্ন রাখুন।
• **সঠিক সময়ে কর্তন:** শীষের শতকরা ৮০ ভাগ ধান সোনালী রঙ ধারণ করলে আর দেরি না করে ধান কেটে ফেলুন।

ফসল মাড়াই ও শুকানোর জন্য কি চাতাল বা ত্রিপল প্রস্তুত আছে?`
                    : `Friend! At **${age} days**, your rice is ripening towards full golden grain maturity:

• **Field Drainage:** Drain all standing water from paddies 10-12 days before anticipated harvest to harden the soil.
• **Harvest Threshold:** Harvest promptly when 80% of panicle grains have turned golden-straw color to prevent shattering loss.
• **Post-Harvest Drying:** Dry threshed paddy for 2-3 full sunny days until seed moisture reaches 12-14%.

Do you have drying tarps or storage drums ready for the upcoming harvest?`;
            }
        } else if (crop === "potato") {
            if (age <= 30) {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে আলু গাছের গোড়ায় মাটি তোলা (Earthing up) এবং প্রথম উপরি-প্রয়োগের আসল সময়:

• **প্রথম উপরি-প্রয়োগ:** প্রতি শতাংশে ২৫০ গ্রাম ইউরিয়া এবং ২০০ গ্রাম পটাশ দুই সারির মাঝে ছড়িয়ে নিড়ানি দিয়ে গোড়ায় মাটি তুলে ঢিবি বানিয়ে দিন।
• **হালকা সেচ:** মাটি তোলার পর আলতো সেচ দিন যাতে ঢিবির দুই-তৃতীয়াংশ ভেজে, কিন্তু উপরে পানি না ওঠে।
• **কাটুই পোকা দমন:** মাটি খুঁড়ে চারা কেটে দেওয়া পোকা দেখলে সকালে হাত দিয়ে সংগ্রহ করুন বা ক্লোরপাইরিফস গ্রুপের অনুমোদিত ব্যবস্থা নিন।

আপনার আলু ক্ষেতে মাটি কি শুকিয়ে শক্ত হয়ে গেছে?`
                    : `Friend! At **${age} days**, it is time for the crucial first earthing-up and top dressing on your potato rows:

• **Top Dressing:** Apply 250g Urea and 200g Potash per decimal between plant rows, then mound loose soil up around the stems.
• **Furrow Irrigation:** Irrigate gently so water fills two-thirds of the furrow depth without submerging ridge tops.
• **Cutworm Check:** Dig gently near severed shoots at dawn to capture and destroy cutworm larvae.

Is your soil soft and ridge-ready for mounding?`;
            } else {
                return isBn
                    ? `ভাই! **${age} দিন** বয়সে আলুর টিউবার বা আলু মাটির নিচে দ্রুত বড় হতে থাকে (Tuber Bulking Stage)। এ সময় সর্বোচ্চ সতর্কতার সাথে করণীয়:

• **নাবি ধসা (Late Blight) আগাম স্প্রে:** কুয়াশা বা মেঘলা আবহাওয়া থাকলে নাবি ধসা রোধে প্রতি লিটার পানিতে ২ গ্রাম ম্যানকোজেব (যেমন ডাইথেন এম-৪৫) অথবা রিডোমিল গোল্ড স্প্রে করে পুরো পাতা ভিজিয়ে দিন।
• **দ্বিতীয় কিস্তির পটাশ:** আলুর আকার বড় ও খোসা শক্ত করতে প্রতি শতাংশে ১৫০ গ্রাম পটাশ সার দিয়ে হালকা সেচ দিন।
• **আলু ঢেকে রাখা:** কোনো আলু মাটির বাইরে এসে সবুজ হয়ে গেলে দ্রুত মাটি দিয়ে ঢেকে দিন।

সকালে কি আপনার এলাকায় কুয়াশা বা গুঁড়ি গুঁড়ি বৃষ্টি হচ্ছে?`
                    : `Friend! At **${age} days**, your potatoes are in their rapid tuber expansion phase:

• **Late Blight Preventive Spray:** Foggy, overcast weather triggers devastating Late Blight. Spray Mancozeb (2g/L) or Ridomil Gold to coat foliage thoroughly.
• **Potash for Tuber Weight:** Apply 150g Potash per decimal to maximize tuber grade size and skin firmness.
• **Cover Green Tubers:** Mound soil over any tubers exposed to sunlight to prevent toxic solanine greening.

Is your area experiencing persistent heavy fog or cool damp mornings?`;
            }
        } else {
            return isBn
                ? `ভাই! আপনার **${crop}** ফসলের **${age} দিন** বয়সের জন্য পরামর্শ:

• **সুষম সার উপরি-প্রয়োগ:** এই বয়সে গাছের বর্ধনশীল শাখার জন্য প্রতি শতাংশে ১৫০-২০০ গ্রাম ইউরিয়া এবং ১৫০ গ্রাম পটাশ গাছের গোড়া থেকে কিছুটা দূরে দিন।
• **মাটির রস ও সেচ:** সার দেওয়ার পর হালকা সেচ দিন, যেন মাটি ভেজা থাকে কিন্তু গোড়ায় পানি না জমে।
• **বালাই নজরদারি:** ডালপালা ও পাতার নিচে কোনো পোকা বা দাগ আছে কিনা নিবিড়ভাবে পরীক্ষা করুন।

আপনার ফসলের পাতায় কি কোনো অস্বাভাবিক দাগ বা পোকা চোখে পড়েছে?`
                : `Friend! For your **${crop}** at **${age} days**:

• **Top Dressing:** Apply 150-200g Urea and 150g Potash per decimal away from root crowns.
• **Moisture Management:** Provide light irrigation after fertilizing; ensure no standing water suffocates roots.
• **Foliage Inspection:** Check undersides of leaves for sucking pests or fungal lesions.

Are you noticing any signs of stress or discolored leaves on your crop?`;
        }
    }

    generateCropFertilizerSchedule(crop, age, isBn) {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `ভাই, **${label}** ফসলে সর্বোচ্চ ফলন পেতে ও খরচ কমাতে সুষম সারের সাশ্রয়ী নিয়মাবলী:

• **জমি তৈরির সময় (Basal Dose প্রতি শতাংশে):**
  - গোবর বা ট্রাইকো-কম্পোস্ট: ১৫-২০ কেজি (এটি রাসায়নিক সারের খরচ ৩০% কমায়)
  - টিএসপি (TSP) বা ডিএপি: ৪০০ গ্রাম
  - এমওপি (পটাশ): ২৫০ গ্রাম
  - জিপসাম: ২০০ গ্রাম ও জিংক সালফেট: ৫০ গ্রাম
• **প্রথম উপরি-প্রয়োগ (রোপণের ২০-২৫ দিন পর):**
  - ইউরিয়া: ২০০ গ্রাম ও পটাশ: ১০০ গ্রাম (গোড়া থেকে দূরে দিয়ে মাটি আলগা করুন)
• **দ্বিতীয় উপরি-প্রয়োগ (ফুল/কুশি আসার সময় - ৪০-৪৫ দিন):**
  - ইউরিয়া: ১৫০ গ্রাম ও পটাশ: ১৫০ গ্রাম + ফুল ঝরা রোধে বোরন স্প্রে

ভাই, আপনার **${label}** গাছটির বয়স বর্তমানে কত দিন বলুন তো?`
            : `Friend, here is the balanced, cost-minimized fertilizer plan for **${label}**:

• **Basal Application (Per Decimal during final plowing):**
  - Decomposed Manure/Trichoderma Compost: 15-20 kg (Reduces chemical fertilizer costs by 20-30%)
  - TSP / DAP: 400g
  - MoP (Potash): 250g
  - Gypsum: 200g & Zinc Sulphate: 50g
• **1st Top Dressing (20-25 days after transplant):**
  - Urea: 200g & Potash: 100g incorporated away from root crowns.
• **2nd Top Dressing (Flowering/Booting stage - 40-45 days):**
  - Urea: 150g & Potash: 150g + Solubor Boron foliar spray (2g/L).

Could you share how many days old your **${label}** crop currently is?`;
    }

    generateCropPestGuidance(crop, isBn) {
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        return isBn
            ? `ভাই! **${label}** ফসলে প্রধান ক্ষতিকর পোকা ও রোগ দমনে সাশ্রয়ী পদক্ষেপ:

• **চোষক পোকা ও সাদা মাছি:** প্রতি লিটার পানিতে ৫ মিলি নিমতেল মিশিয়ে পাতার নিচে স্প্রে করুন।
• **মাজরা বা ফল ছিদ্রকারী পোকা:** জমিতে সেক্স ফেরোমোন ফাঁদ টানিয়ে দিন বা জৈব স্পিনোসাড স্প্রে করুন।
• **পাতার দাগ ও ধসা রোগ:** ম্যানকোজেব গ্রুপের ছত্রাকনাশক (২ গ্রাম প্রতি লিটার পানিতে) দিয়ে পুরো গাছ ভিজিয়ে স্প্রে করুন।

আপনার **${label}** গাছে কি কোনো নির্দিষ্ট পোকা বা দাগ দেখেছেন?`
            : `Friend! Cost-effective pest and disease management for **${label}**:

• **Sucking Pests & Whiteflies:** Spray 5ml Neem oil per liter of water under leaves.
• **Fruit/Stem Borers:** Install pheromone lure traps or spray bio-rational Spinosad.
• **Fungal Blights & Spots:** Spray Mancozeb (2g/L) to prevent fungal expansion.

Are you seeing any specific symptoms on your **${label}** leaves?`;
    }

    generatePestDiagnosis(crop, query, isBn) {
        const q = (query || "").toLowerCase();
        const cropNames = this.cropDisplayNames[crop] || { bn: crop, en: crop };
        const label = isBn ? cropNames.bn : cropNames.en;

        if (q.includes("হলুদ") || q.includes("yellow")) {
            return isBn
                ? `ভাই! **${label}** গাছের পাতা হলুদ হওয়ার মূল কারণ ও ঘরোয়া সাশ্রয়ী সমাধান:

• **নাইট্রোজেনের ঘাটতি (নিচের পুরনো পাতা হলুদ হলে):** ইউরিয়া সারের অভাব। প্রতি শতাংশে ১৫০ গ্রাম ইউরিয়া দিন অথবা প্রতি লিটার পানিতে ১০ গ্রাম ইউরিয়া গুলে পাতায় স্প্রে করুন।
• **গোড়ায় অতিরিক্ত পানি বা শিকড় পচা:** মাটিতে বাতাস না থাকলে পাতা হলুদ হয়। অবিলম্বে ড্রেন কেটে পানি বের করে দিন।
• **মাকড় বা চোষক পোকা:** পাতার নিচে মাকড় থাকলে নিমতেল (৫ মিলি/লিটার পানিতে সামান্য শ্যাম্পু সহ) স্প্রে করুন।

পাতা কি নিচের দিক থেকে হলুদ হচ্ছে নাকি কচি ডগা হলুদ হচ্ছে?`
                : `Friend! Causes and remedies for yellowing leaves in **${label}**:

• **Nitrogen Deficiency (Older bottom leaves yellowing first):** Apply 150g Urea per decimal or spray a 1% dissolved Urea solution onto foliage.
• **Waterlogging / Root Asphyxiation:** Excess root moisture chokes oxygen. Clear drainage furrows immediately.
• **Mite / Sucking Pest Infestation:** Mites under leaf surfaces cause mottled yellow stippling. Spray Neem oil (5ml/L) or Abamectin.

Are the bottom older leaves turning yellow, or is it appearing on young new tips?`;
        }

        if (q.includes("কোঁকড়া") || q.includes("কোকড়া") || q.includes("curl")) {
            return isBn
                ? `ভাই! **${label}** গাছের পাতা কোঁকড়ানো (Leaf Curl) দমনে পরামর্শ:

• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও ১ ফোঁটা সাবান মিশিয়ে পাতার উল্টো পিঠে স্প্রে করুন।
• **হলুদ আঠালো ফাঁদ:** জমিতে হলুদ স্টিকি ট্র্যাপ টানিয়ে দিলে ক্ষতিকর সাদা মাছি ও পোকা আটকে যাবে।
• **তীব্র আক্রমণে ওষুধ:** ইমিডাক্লোপ্রিড গ্রুপের কীটনাশক (যেমন টিডো বা এডমায়ার ০.৫ মিলি/লিটার পানিতে) বিকেলে স্প্রে করুন।

ভাই, আপনার গাছে কি সাদা রঙের ছোট মাছি উড়তে দেখেছেন?`
                : `Friend! Leaf curling in **${label}** control plan:

• **Organic Neem Wash:** Spray 5ml cold-pressed Neem oil with a drop of liquid soap per liter of water under leaves.
• **Yellow Sticky Traps:** Hang yellow sticky cards across the canopy to capture adult whiteflies naturally.
• **Targeted Chemical Option:** For severe pressure, apply Imidacloprid (0.5 ml/L) in late afternoon.

Do you see tiny white flies fluttering when you shake the foliage?`;
        }

        return isBn
            ? `ভাই! **${label}** ফসলের বালাই দমনে তাৎক্ষণিক কার্যকর পদক্ষেপ:

• **জৈব বালাইনাশক স্প্রে:** ৫ মিলি নিমতেল ১ লিটার পানিতে মিশিয়ে স্প্রে করলে জাবপোকা ও শুঁয়োপোকা দূর হয়।
• **পার্চিং পদ্ধতি (পাখি বসার ডাল):** জমিতে বাঁশের কঞ্চি পুঁতে দিলে ফিঙে বা শালিক পাখি ক্ষতিকর মাজরা পোকা খেয়ে ফেলে।
• **আক্রমণ বেশি হলে:** স্থানীয় কৃষি কর্মকর্তার পরামর্শে অনুমোদিত বালাইনাশক সঠিক মাত্রায় বিকেলে স্প্রে করুন।

আপনার ফসলের পাতায় ঠিক কী ধরণের লক্ষণ বা পোকা দেখা যাচ্ছে বলুন তো?`
            : `Friend! Instant protective measures against pests in **${label}**:

• **Organic Neem Application:** Spray 5ml Neem oil per liter of water with a surfactant for aphids, thrips, and caterpillars.
• **Bird Perches (Biological Control):** Erect bamboo T-perches so insectivorous birds feed on stem borers and caterpillars.
• **Targeted Intervention:** Use group-specific bio-pesticides (e.g., Bacillus thuringiensis or Spinosad) during late afternoon.

What specific symptoms or insect damage are you observing on the leaves?`;
    }

    generateIrrigationAdvice(crop, age, isBn) {
        return isBn
            ? `ভাই! সুষম ও সাশ্রয়ী সেচ ব্যবস্থাপনায় আপনার ফসলের জন্য গুরুত্বপূর্ণ পরামর্শ:

• **পরিমিত সেচ:** গোড়ায় অতিরিক্ত পানি জমিয়ে রাখবেন না; শিকড় পচন রোধ করতে জো (রস) অবস্থা বজায় রাখুন।
• **খরচ সাশ্রয়ী AWD পদ্ধতি:** ধান ও শাকসবজিতে পর্যায়ক্রমে শুকানো ও ভেজানোর নিয়ম মানলে সেচের জ্বালানি খরচ ৩০% বাঁচে।
• **সেচ দেওয়ার সঠিক সময়:** সবসময় সকালের দিকে অথবা শেষ বিকেলে সেচ দিন।

জমির মাটি হাত দিয়ে চাপ দিলে কি লাড্ডুর মতো গোল হয় নাকি বালির মতো ঝরে যায়?`
            : `Friend! Soil moisture and water-saving irrigation guidance:

• **Shallow Consistent Moisture:** Avoid waterlogged root zones; roots require soil oxygen as much as water.
• **AWD Cost-Saving Technique:** Use Alternate Wetting and Drying to reduce diesel/electric pump expenditures by 30%.
• **Optimal Timing:** Irrigate in early morning or late afternoon to minimize evaporation stress and root shock.

When you squeeze a handful of field soil, does it form a firm clump or crumble like dust?`;
    }

    generateWeatherAdvice(crop, isBn) {
        return isBn
            ? `ভাই! বৈরী আবহাওয়া ও ঝড়ের পূর্বাভাসে মাঠের সুরক্ষা:

• **পানি নিষ্কাশন ড্রেন:** জমির চারধারে দ্রুত ১ ফুট গভীর ড্রেন কেটে দিন যাতে বৃষ্টির পানি এক মুহূর্তও জমে না থাকে।
• **সেচ ও কীটনাশক বন্ধ:** আগামী ৪৮ ঘণ্টার মধ্যে বৃষ্টির পূর্বাভাস থাকলে সব ধরণের সার প্রয়োগ ও স্প্রে অবিলম্বে বন্ধ রাখুন।
• **লম্বা গাছে সাপোর্ট:** টমেটো, ভুট্টা বা বেগুনের মতো গাছে বাঁশের কঞ্চি দিয়ে শক্ত সাপোর্ট দিন যাতে বাতাসে হেলে না পড়ে।

আপনার জমির পানি নামার প্রধান নালাটি কি পরিষ্কার আছে?`
            : `Friend! Emergency storm and heavy rainfall preparedness:

• **Clear Perimeter Trenches:** Dig out 1-foot drainage furrows immediately so heavy deluge flows off fields freely.
• **Halt Spraying & Fertilizing:** Immediately suspend all foliar sprays and top dressings 48 hours before predicted storms.
• **Crop Staking:** Reinforce tomato, maize, and eggplant stakes to resist strong wind shear.

Are your main water runoff outlets completely free of weeds and silt?`;
    }

    generateMarketAdvice(crop, isBn) {
        return isBn
            ? `ভাই! ফসলের সর্বোচ্চ মুনাফা ও ন্যায্য দর পেতে করণীয়:

• **গ্রেডিং বা বাছাই:** ফসলকে আকার ও মান অনুযায়ী ৩টি গ্রেডে (A, B, C) আলাদা করুন। ভালো গ্রেডে ২০-৩০% বেশি দাম মেলে।
• **আড়তে সরাসরি বিক্রয়:** গ্রামের ফড়িয়াদের বদলে পার্শ্ববর্তী উপজেলা মোকাম বা পাইকারি বাজারে সমবায়ের মাধ্যমে সরাসরি পণ্য পাঠান।
• **বায়ুরোধী বীজ সংরক্ষণ:** বীজ কড়া রোদে ৩ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে এনে শুকনো নিমপাতা দিয়ে এয়ারটাইট ড্রামে রাখুন।

আপনি কি এই ফসল এখনই বিক্রি করবেন নাকি গুদামে সংরক্ষণ করার কথা ভাবছেন?`
            : `Friend! Practical wholesale market realization and grain storage advice:

• **Produce Grading:** Sort harvest into 3 quality tiers by size and color. Graded produce commands a 20-30% price premium.
• **Direct Mandi Transport:** Bypass village gate middlemen; transport bundled produce directly to the regional wholesale hub.
• **Hermetic Storage:** Dry seeds down to 12% moisture (cracks sharply between teeth) and seal in airtight drums with dried neem leaves.

Are you intending to sell your harvest immediately or store seeds for next season?`;
    }
}

/**
 * FARMER BUDDY MAIN CONTROLLER CLASS
 */
class FarmerBuddy {
    constructor() {
        this.proxyUrl = "http://localhost:5000/api/ask";
        this.storageKeyPrefix = "agrivision_farmer_buddy_chat_v4_";
        this.currentLang = (typeof window !== "undefined" && window.currentAppLanguage === "bn") ? "bn" : "en";
        this.messages = [];
        this.chatHistory = [];
        this.isOpen = false;
        this.isStreaming = false;

        // Model Selector State (Default: Gemini 2.5 Flash)
        this.selectedModel = (typeof window !== "undefined" && localStorage.getItem("agrivision_selected_model")) || "gemini-2.5-flash";

        // Pre-configured secure API keys (injected automatically in code)
        this.geminiApiKey = this.getPreconfiguredApiKey();

        // LAYER 2: Stateful Agricultural Economics & Crop Rotation Context
        this.localEngine = new AgriculturalExpertEngine();
        this.context = {
            crop: null,
            cropAgeDays: null,
            intent: null,
            awaitingSlot: null
        };

        // Bilingual UI dictionary
        this.i18nDict = {
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

        // Upgraded Quick Action Chips focusing on Profit & Crop Rotation
        this.chipsDict = {
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

        if (typeof document !== "undefined") {
            this.initDOM();
            this.loadSessionMessages();
            this.renderHistory();
            this.bindEvents();
            this.updateModelUI();
        }
    }

    /**
     * Automatically retrieves pre-configured secure key from environment or storage
     */
    getPreconfiguredApiKey() {
        try {
            if (typeof window !== "undefined") {
                if (window.GEMINI_API_KEY && typeof window.GEMINI_API_KEY === "string") return window.GEMINI_API_KEY.trim();
                if (window.__GEMINI_API_KEY__ && typeof window.__GEMINI_API_KEY__ === "string") return window.__GEMINI_API_KEY__.trim();
                const stored = localStorage.getItem("GEMINI_API_KEY");
                if (stored && stored.trim() && stored.trim() !== "your_api_key_here") return stored.trim();
            }
            if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
                return import.meta.env.VITE_GEMINI_API_KEY.trim();
            }
            if (typeof process !== "undefined" && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
                return process.env.REACT_APP_GEMINI_API_KEY.trim();
            }
        } catch (e) {}
        return null;
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
            const trimmed = this.messages.slice(-25);
            sessionStorage.setItem(this.getStorageKey(), JSON.stringify(trimmed));
        } catch (e) {}
    }

    getRecentChatHistory(count = 10) {
        if (!Array.isArray(this.chatHistory)) return [];
        return this.chatHistory.slice(-count);
    }

    getActiveFarmContext() {
        const isBn = (typeof window !== "undefined" && window.currentAppLanguage === "bn") || (this.currentLang === "bn");

        const cropSelect = document.getElementById("cropSelect");
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

    /**
     * MASTER SYSTEM INSTRUCTION FOR GEMINI (FARMER BUDDY EXPERT MODE)
     */
    buildDynamicSystemInstruction(farmContext) {
        const isBn = (this.currentLang === "bn");
        let instruction = `You are "Farmer Buddy" (কৃষক বন্ধু), an expert rural agricultural economist, agronomist, and trusted friend to farmers in Bangladesh and South Asia.

CORE BEHAVIOR & TONE:
- Speak like a warm, caring, and experienced agricultural expert friend ("ভাই/বন্ধু" in Bangla, "Friend" in English).
- Be precise, highly practical, and focus heavily on **Maximizing Profit, Minimizing Cost (খরচ কমানো), and Sustainable Soil Health (মাটির উর্বরতা রক্ষা)**.

WHEN A FARMER PROVIDES LAND DETAILS (Location, Soil Type, Land Size, Season/Budget):
You must immediately generate a structured, comprehensive **Smart Farming & Crop Rotation Plan** containing:
1. **Optimal Crop Selection & Timing:** Recommend the best crops for that specific area/soil and exact sowing/planting dates to catch peak market prices.
2. **Cost Minimization & Input Management (খরচ কমানোর কৌশল):**
   - Suggest smart fertilizer management (e.g., using organic compost or green manuring to reduce chemical Urea/TSP cost by 20-30%).
   - Cost-effective irrigation methods (e.g., Alternate Wetting and Drying - AWD for rice).
3. **Yield & Profit Estimation (সম্ভাব্য ফল ও লাভ):** Give an estimated cost vs. return breakdown per decimal (শতাংশ) or bigha (বিঘা).
4. **Crop Rotation Cycle Plan (ফসল পরিক্রমা ও শস্য আবর্তন):** Design a 3-season rotation plan (e.g., Rabi -> Kharif-1 -> Kharif-2) to prevent soil exhaustion, break pest cycles, and ensure year-round income (e.g., Potato -> Mungbean/Jute -> Aman Rice).
5. **Risk Mitigation:** Brief warning on local weather risks (floods, droughts, fog) and organic preventive measures.

FOR SPECIFIC PEST, FERTILIZER, OR CROP AGE QUESTIONS:
- Provide immediate, actionable advice with exact dosages per decimal/bigha, organic remedies (e.g., neem oil), and practical steps tailored to that crop and plant age.

RESPONSE FORMAT (Keep it clean, beautifully formatted with bold headers, and mobile-friendly for rural users):
- Friendly greeting and brief land appraisal.
- **🌱 Recommended Crop & Timing (সেরা ফসল ও সময়)**
- **💰 Cost Optimization & Profit Plan (খরচ কমানো ও লাভ)**
- **🔄 Complete Crop Rotation Cycle (শস্য আবর্তন পরিকল্পনা)**
- 1 supportive, practical follow-up question.

LANGUAGE RULE:
${isBn ? "Always respond in natural, friendly, easy-to-understand Bangla." : "Always respond in clear, friendly English."}`;

        if (farmContext) {
            instruction += `\n\nCURRENT ACTIVE 3D FARM TELEMETRY:\n• Crop: ${farmContext.crop}\n• Growth Stage: ${farmContext.growthStage}\n• Soil Moisture: ${farmContext.soilMoisture}\n• Soil NPK: ${farmContext.soilNPK}\n• Weather: ${farmContext.weather}`;
        }

        return instruction;
    }

    initDOM() {
        const texts = this.i18nDict[this.currentLang];
        const isBn = (this.currentLang === "bn");

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

        // Chat Window
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

        // Model Selector Toolbar (Replaces Manual API Key Input Box!)
        this.modelToolbar = document.createElement("div");
        this.modelToolbar.id = "fbModelToolbar";
        this.modelToolbar.className = "fb-model-toolbar";
        this.modelToolbar.innerHTML = `
            <div class="fb-model-selector-group">
                <span class="fb-model-icon">🤖</span>
                <select id="fbModelSelect" class="fb-model-select" aria-label="Select AI Model">
                    <option value="gemini-2.5-flash" ${this.selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>
                        ${isBn ? "⚡ Gemini 2.5 Flash (দ্রুত ও হালকা · সার/বালাই দমন)" : "⚡ Gemini 2.5 Flash (Fast & Low-Bandwidth · Pest/Fertilizer)"}
                    </option>
                    <option value="gemini-2.5-pro" ${this.selectedModel === 'gemini-2.5-pro' ? 'selected' : ''}>
                        ${isBn ? "🎯 Gemini 2.5 Pro (বিশেষজ্ঞ প্রফিট প্ল্যানার · শস্য পরিক্রমা)" : "🎯 Gemini 2.5 Pro (Deep Crop & Profit Planner · Rotation)"}
                    </option>
                </select>
            </div>
            <div id="fbModelPill" class="fb-model-pill ${this.selectedModel === 'gemini-2.5-pro' ? 'pro' : 'flash'}" title="${isBn ? 'বর্তমান AI মোড' : 'Active AI Mode'}">
                <span class="fb-pulse-dot"></span>
                <span id="fbModelPillText">${this.selectedModel === 'gemini-2.5-pro' ? (isBn ? 'Pro · প্ল্যানার' : 'Pro · Planner') : (isBn ? 'Flash · দ্রুত' : 'Flash · Fast')}</span>
            </div>
        `;

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
        this.chatWindow.appendChild(this.modelToolbar);
        this.chatWindow.appendChild(this.messagesContainer);
        this.chatWindow.appendChild(this.chipsContainer);
        this.chatWindow.appendChild(inputArea);

        // Add to DOM
        this.widgetContainer.appendChild(this.fabButton);
        this.widgetContainer.appendChild(this.chatWindow);
        document.body.appendChild(this.widgetContainer);
    }

    updateModelUI() {
        const isBn = (this.currentLang === "bn");
        const pill = this.chatWindow ? this.chatWindow.querySelector("#fbModelPill") : null;
        const pillText = this.chatWindow ? this.chatWindow.querySelector("#fbModelPillText") : null;
        const badge = this.badgeEl;

        const isPro = this.selectedModel === "gemini-2.5-pro";

        if (pill) {
            pill.className = `fb-model-pill ${isPro ? 'pro' : 'flash'}`;
        }
        if (pillText) {
            pillText.textContent = isPro ? (isBn ? 'Pro · প্ল্যানার' : 'Pro · Planner') : (isBn ? 'Flash · দ্রুত' : 'Flash · Fast');
        }
        if (badge) {
            badge.textContent = isPro
                ? (isBn ? "AI প্রফিট প্ল্যানার" : "AI Profit Planner")
                : (isBn ? "AI কৃষিবিদ" : "AI Agronomist");
        }
    }

    setLanguage(lang) {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        const texts = this.i18nDict[lang];
        const isBn = (lang === "bn");

        if (this.fabButton) this.fabButton.setAttribute("aria-label", texts.fabAria);
        if (this.fabLabelEl) this.fabLabelEl.textContent = texts.fabLabel;
        if (this.titleEl) this.titleEl.textContent = texts.title;
        if (this.statusEl) this.statusEl.textContent = texts.status;
        if (this.resetBtnEl) this.resetBtnEl.title = texts.resetTitle;
        if (this.minimizeBtnEl) this.minimizeBtnEl.title = texts.minimizeTitle;
        if (this.inputField) this.inputField.placeholder = texts.inputPlaceholder;
        if (this.sendButton) this.sendButton.setAttribute("aria-label", texts.sendAria);
        if (this.footerNoteEl) this.footerNoteEl.innerHTML = texts.footerNote;

        // Update Model Dropdown labels
        const modelSelect = this.chatWindow ? this.chatWindow.querySelector("#fbModelSelect") : null;
        if (modelSelect) {
            modelSelect.innerHTML = `
                <option value="gemini-2.5-flash" ${this.selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>
                    ${isBn ? "⚡ Gemini 2.5 Flash (দ্রুত ও হালকা · সার/বালাই দমন)" : "⚡ Gemini 2.5 Flash (Fast & Low-Bandwidth · Pest/Fertilizer)"}
                </option>
                <option value="gemini-2.5-pro" ${this.selectedModel === 'gemini-2.5-pro' ? 'selected' : ''}>
                    ${isBn ? "🎯 Gemini 2.5 Pro (বিশেষজ্ঞ প্রফিট প্ল্যানার · শস্য পরিক্রমা)" : "🎯 Gemini 2.5 Pro (Deep Crop & Profit Planner · Rotation)"}
                </option>
            `;
        }

        this.renderQuickChips();
        this.loadSessionMessages();
        this.renderHistory();
        this.updateModelUI();
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

        // Model selection change
        const modelSelect = this.chatWindow.querySelector("#fbModelSelect");
        if (modelSelect) {
            modelSelect.addEventListener("change", (e) => {
                this.selectedModel = e.target.value;
                try { localStorage.setItem("agrivision_selected_model", this.selectedModel); } catch (err) {}
                this.updateModelUI();
                console.log(`[FarmerBuddy] Selected model switched to: ${this.selectedModel}`);
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

        // 1. Add User Message
        const userMsg = {
            id: "u-" + Date.now(),
            sender: "user",
            text: cleanText,
            timestamp: Date.now()
        };
        this.messages.push(userMsg);
        this.appendMessageDOM(userMsg);
        this.saveSessionMessages();

        // 2. Prepare Buddy Placeholder
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
        const thinkingLabel = this.selectedModel === "gemini-2.5-pro"
            ? (isBn ? "শস্য পরিক্রমা ও লাভ পরিকল্পনা হিসাব করছি..." : "Calculating Crop Rotation & Profit Plan...")
            : (isBn ? "কৃষি পরামর্শ বিশ্লেষণ করছি..." : "Analyzing Agricultural Advisory...");

        textTarget.innerHTML = `<span class="fb-typing-indicator"><span class="fb-typing-dots"><span></span><span></span><span></span></span> <span class="fb-thinking-text">${thinkingLabel}</span></span>`;

        this.isStreaming = true;
        this.setInputsDisabled(true);

        const recentHistory = this.getRecentChatHistory(10);
        const farmContext = this.getActiveFarmContext();
        let replyText = null;

        try {
            // LAYER 1: DIRECT GEMINI REST API (If pre-configured key is available)
            if (this.geminiApiKey && navigator.onLine) {
                try {
                    replyText = await this.callDirectGemini(cleanText, recentHistory, farmContext);
                } catch (directErr) {
                    console.warn("[FarmerBuddy] Direct Gemini API call failed:", directErr.message);
                }
            }

            // LAYER 1 (Secondary): LOCAL BACKEND PROXY (e.g. localhost:5000 with auto-injected secure .env key)
            if (!replyText && navigator.onLine) {
                try {
                    replyText = await this.callBackendProxy(cleanText, recentHistory, farmContext);
                } catch (proxyErr) {
                    console.warn("[FarmerBuddy] Backend proxy unreachable:", proxyErr.message);
                }
            }

            // LAYER 2: STATEFUL LOCAL AGRICULTURAL EXPERT & ROTATION ENGINE
            if (!replyText) {
                console.log(`[FarmerBuddy] Generating response via Layer 2 Stateful Agricultural Engine [${this.selectedModel}]...`);
                replyText = this.localEngine.processQuery(cleanText, this.context, farmContext, this.currentLang);
            }

            // Stream and render reply
            await this.streamReply(replyText, textTarget, buddyMsg);

            // Record conversation memory
            this.chatHistory.push({ role: "user", parts: [{ text: cleanText }] });
            this.chatHistory.push({ role: "model", parts: [{ text: buddyMsg.text }] });
            this.saveSessionMessages();
        } catch (err) {
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

    /**
     * Direct Google Gemini API Call with Model Selection
     */
    async callDirectGemini(message, recentHistory, farmContext) {
        const apiKey = this.geminiApiKey;
        if (!apiKey) throw new Error("NO_API_KEY");

        const dynamicSystemInstruction = this.buildDynamicSystemInstruction(farmContext);

        const contents = [];
        if (Array.isArray(recentHistory) && recentHistory.length > 0) {
            for (const item of recentHistory) {
                const role = (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user';
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

        // Candidate models list prioritizing user selected model
        const candidateModels = this.selectedModel === "gemini-2.5-pro"
            ? ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite']
            : ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

        let lastError = null;

        for (const model of candidateModels) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 9500);

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
                console.warn(`[FarmerBuddy] Direct Gemini model [${model}] failed: ${err.message}. Trying next...`);
                lastError = err;
            }
        }

        throw lastError || new Error("Direct Gemini API invocation failed.");
    }

    /**
     * Local Backend Proxy Call (Injects Model Choice)
     */
    async callBackendProxy(message, recentHistory, farmContext) {
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
            return data.reply.trim();
        }

        throw new Error("EMPTY_PROXY_REPLY");
    }

    async streamReply(fullText, textTarget, buddyMsg) {
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

    resetConversation() {
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

        // Bullet lists (• or - or *)
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

export default FarmerBuddy;
