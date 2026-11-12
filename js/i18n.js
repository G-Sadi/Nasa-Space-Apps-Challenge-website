/*
|--------------------------------------------------------------------------
| FIELD SHIFT — INTERNATIONALIZATION (i18n) ENGINE
|--------------------------------------------------------------------------
| English ↔ বাংলা Dynamic Translation System
| Default: English | Toggle Switch → বাংলা
|--------------------------------------------------------------------------
*/

const i18nData = {
    // ===== NAVBAR =====
    "logo-subtitle":    { en: "NASA EARTH OBSERVATION", bn: "নাসা আর্থ অবজারভেশন" },
    "nav-3d": { en: "3D Live Field", bn: "৩ডি লাইভ ফিল্ড" },
    "nav-land-weather": { en: "Land & Weather", bn: "জমি ও আবহাওয়া" },
    "nav-simulator": { en: "Simulator", bn: "সিমুলেটর" },
    "nav-rotation": { en: "Rotation", bn: "শস্য আবর্তন" },
    "nav-lifecycle": { en: "Crop Lifecycle", bn: "ফসল জীবনচক্র" },
    "nav-ai-advisor": { en: "AI Advisor", bn: "কৃষি এআই" },
    "nav-nasa-hub": { en: "NASA Hub", bn: "নাসা হাব" },
    "nav-how": { en: "How it works", bn: "কিভাবে কাজ করে" },
    "nav-analyze": { en: "Analyze", bn: "বিশ্লেষণ" },
    "nav-simulation": { en: "Simulation", bn: "সিমুলেশন" },
    "nav-btn": { en: "Start analysis", bn: "বিশ্লেষণ শুরু করুন" },

    // ===== HERO =====
    "hero-eyebrow": { en: "SMART FARM INTELLIGENCE", bn: "স্মার্ট কৃষি বুদ্ধিমত্তা" },
    "hero-h1-1": { en: "Adapt your", bn: "আপনার খামারকে" },
    "hero-h1-2": { en: "farm to", bn: "পরিবর্তনের সাথে" },
    "hero-h1-span": { en: "change.", bn: "মানিয়ে নিন।" },
    "hero-desc": {
        en: "Analyze climate, water, soil and crop conditions to build smarter and more resilient farming plans.",
        bn: "জলবায়ু, পানি, মাটি এবং ফসলের অবস্থা বিশ্লেষণ করে আরও স্মার্ট ও টেকসই কৃষি পরিকল্পনা তৈরি করুন।"
    },
    "hero-btn-primary": { en: "Analyze my field →", bn: "আমার জমি বিশ্লেষণ করুন →" },
    "hero-btn-secondary": { en: "Explore 3D Field ↓", bn: "৩ডি ফিল্ড দেখুন ↓" },
    "hero-step-1": { en: "Select Field", bn: "জমি নির্বাচন" },
    "hero-step-2": { en: "NASA Sync", bn: "নাসা সিঙ্ক" },
    "hero-step-3": { en: "Adaptive Plan", bn: "অভিযোজিত পরিকল্পনা" },

    // ===== HERO SATELLITE SCANNER =====
    "scanner-live-status": { en: "LIVE SATELLITE SCAN",    bn: "লাইভ স্যাটেলাইট স্ক্যান" },
    "scanner-hud-eyebrow": { en: "NASA TELEMETRY HUD • FIELD 02", bn: "নাসা টেলিমেট্রি এইচইউডি • ফিল্ড ০২" },
    "scanner-lbl-smap":    { en: "SMAP SOIL MOISTURE",     bn: "SMAP মাটির আর্দ্রতা" },
    "scanner-lbl-modis":   { en: "MODIS NDVI",             bn: "MODIS উদ্ভিদ সূচক" },
    "scanner-lbl-eco":     { en: "ECOSTRESS CANOPY",       bn: "ECOSTRESS পাতার তাপমাত্রা" },
    "scanner-lbl-advisory":{ en: "RECOMMENDED ACTION",     bn: "প্রয়োজনীয় পরামর্শ" },
    "pill-smap":           { en: "NASA SMAP Live Sync",    bn: "নাসা এসএমএপি লাইভ সিঙ্ক" },
    "pill-ndvi":           { en: "NDVI 0.68",              bn: "এনডিভিআই ০.৬৮" },
    "pill-moisture":       { en: "Moisture 52%",           bn: "আর্দ্রতা ৫২%" },
    "zone-a-name":         { en: "Zone A: North Plot",     bn: "জোন এ: উত্তরের প্লট" },
    "zone-b-name":         { en: "Zone B: Canal Side",     bn: "জোন বি: খাল সংলগ্ন প্লট" },
    "zone-c-name":         { en: "Zone C: Lowland Basin",  bn: "জোন সি: নিচু জমি অববাহিকা" },
    "zone-d-name":         { en: "Zone D: High Terrace",   bn: "জোন ডি: উঁচু টিলা প্লট" },
    "zone-a-crop":         { en: "Rice (আমন ধান)",         bn: "আমন ধান (Rice)" },
    "zone-b-crop":         { en: "Boro Rice (বোরো)",       bn: "বোরো ধান (Boro)" },
    "zone-c-crop":         { en: "Deepwater (গভীর আমন)",   bn: "গভীর আমন ধান" },
    "zone-d-crop":         { en: "Mustard/Pulses (রবি)",   bn: "সরিষা ও ডাল ফসল" },
    "field-analysis":      { en: "FIELD ANALYSIS",         bn: "জমি বিশ্লেষণ" },
    "field-name":          { en: "Field Shift • Mymensingh - Field 02", bn: "ফিল্ড শিফট • ময়মনসিংহ - ফিল্ড ০২" },

    // ===== HOW IT WORKS =====
    "how-eyebrow": { en: "HOW IT WORKS", bn: "কিভাবে কাজ করে" },
    "how-h2-1": { en: "Turn field data into", bn: "জমির ডেটাকে রূপান্তর করুন" },
    "how-h2-span": { en: "better decisions.", bn: "কার্যকর সিদ্ধান্তে।" },
    "step1-title": { en: "Select your field", bn: "আপনার জমি নির্বাচন করুন" },
    "step1-desc": {
        en: "Enter your location and field conditions.",
        bn: "আপনার অবস্থান এবং জমির অবস্থা ইনপুট দিন।"
    },
    "step2-title": { en: "Analyze conditions", bn: "অবস্থা বিশ্লেষণ করুন" },
    "step2-desc": {
        en: "Combine climate, water and crop information.",
        bn: "জলবায়ু, ভূগর্ভস্থ পানি এবং ফসলের তথ্য পর্যালোচনা করুন।"
    },
    "step3-title": { en: "Get your plan", bn: "পরিকল্পনা গ্রহণ করুন" },
    "step3-desc": {
        en: "Generate an adaptive crop recommendation.",
        bn: "একটি নিখুঁত পরিবেশ-বান্ধব ফসল পরামর্শ তৈরি করুন।"
    },

    // ===== ANALYSIS =====
    "analysis-eyebrow": { en: "FIELD ANALYSIS", bn: "জমি বিশ্লেষণ" },
    "analysis-h2-1": { en: "Your field,", bn: "আপনার জমি," },
    "analysis-h2-span": { en: "in real time.", bn: "রিয়েল টাইমে।" },
    "weather-title": { en: "7-Day Hyper-Local Forecast", bn: "৭-দিনের হাইপার-লোকাল পূর্বাভাস" },
    "weather-refresh-btn": { en: "Refresh", bn: "রিফ্রেশ" },
    "krishi-alert-title": { en: "KRISHI WEATHER ADVISORY", bn: "কৃষি আবহাওয়া সতর্কতা" },
    "nasa-obs": { en: "NASA OBSERVATION ZONE", bn: "নাসা পর্যবেক্ষণ জোন" },
    "live-data": { en: "● LIVE DATA", bn: "● লাইভ ডেটা" },
    "map-aez": { en: "AEZ-9 Old Brahmaputra", bn: "কৃষি পরিবেশ অঞ্চল-৯ পুরাতন ব্রহ্মপুত্র" },
    "map-scanning-text": { en: "🛰️ NASA SATELLITE SCANNING LAND...", bn: "🛰️ নাসা স্যাটেলাইট জমি বিশ্লেষণ করছে..." },
    "opt-500m": { en: "500 meters", bn: "৫০০ মিটার" },
    "opt-1km": { en: "1 kilometer", bn: "১ কিলোমিটার" },
    "opt-2km": { en: "2 kilometers", bn: "২ কিলোমিটার" },
    "opt-5km": { en: "5 kilometers", bn: "৫ কিলোমিটার" },
    "analyze-land-btn": { en: "Analyze this land", bn: "জমি বিশ্লেষণ করুন" },
    "rainfall-label": { en: "RAINFALL", bn: "বৃষ্টিপাত" },
    "temp-label": { en: "AVG TEMPERATURE", bn: "গড় তাপমাত্রা" },
    "water-label": { en: "WATER AVAILABILITY", bn: "পানির প্রাপ্যতা" },
    "veg-label": { en: "VEGETATION INDEX", bn: "উদ্ভিদ সূচক" },
    "field-cond-label": { en: "FIELD CONDITION", bn: "জমির অবস্থা" },
    "field-cond-text": {
        en: "Moderate water pressure with good soil compatibility.",
        bn: "মাঝারি পানির চাপ এবং চমৎকার মাটির উর্বরতা বিদ্যমান।"
    },

    // ===== SIMULATOR =====
    "sim-eyebrow": { en: "SCENARIO SIMULATOR", bn: "দৃশ্যপট সিমুলেটর" },
    "sim-h2-1": { en: "Stress-test your", bn: "আপনার পরবর্তী মৌসুম" },
    "sim-h2-span": { en: "next season.", bn: "যাচাই করুন।" },
    "climate-ctrl": { en: "Climate controls", bn: "জলবায়ু নিয়ন্ত্রণ" },
    "rain-change": { en: "Rainfall change", bn: "বৃষ্টিপাতের পরিবর্তন" },
    "temp-change": { en: "Temperature change", bn: "তাপমাত্রার পরিবর্তন" },
    "water-avail": { en: "Water availability", bn: "পানির প্রাপ্যতা" },
    "reset-scenario": { en: "Reset scenario", bn: "দৃশ্যপট রিসেট" },
    "sim-outcome": { en: "SIMULATED OUTCOME", bn: "সিমুলেটেড ফলাফল" },
    "rec-crop": { en: "Recommended crop", bn: "প্রস্তাবিত ফসল" },
    "water-pressure": { en: "WATER PRESSURE", bn: "পানির চাপ" },
    "climate-fit": { en: "CLIMATE FIT", bn: "জলবায়ু উপযোগিতা" },
    "expected-return": { en: "EXPECTED RETURN", bn: "প্রত্যাশিত আয়" },

    // ===== CHART =====
    "chart-eyebrow": { en: "DATA VISUALIZATION", bn: "ডেটা ভিজ্যুয়ালাইজেশন" },
    "chart-h2-1": { en: "See how conditions", bn: "পরিবেশ কীভাবে পরিবর্তিত" },
    "chart-h2-span": { en: "change.", bn: "হচ্ছে দেখুন।" },

    // ===== FIELD ROTATION =====
    "rot-eyebrow": { en: "FIELD ROTATION", bn: "ফসল পর্যায়ক্রম (রোটেশন)" },
    "rot-h2-1": { en: "Plan your field", bn: "বিভিন্ন মৌসুমে ফসলের" },
    "rot-h2-span": { en: "across seasons.", bn: "পরিকল্পনা করুন।" },
    "rot-desc": {
        en: "Rotate crops strategically to protect soil health, manage water pressure and improve long-term productivity.",
        bn: "মাটির উর্বরতা বজায় রাখতে, পানির চাপ সামলাতে এবং দীর্ঘমেয়াদী ফলন বৃদ্ধিতে কৌশলগতভাবে ফসল পর্যায়ক্রম করুন।"
    },
    "selected-field": { en: "SELECTED FIELD", bn: "নির্বাচিত জমি" },
    "rot-optimized": { en: "Rotation optimized", bn: "পর্যায়ক্রম অপ্টিমাইজড" },

    // Rotation cards
    "crop-maize": { en: "Maize", bn: "ভুট্টা" },
    "crop-rice": { en: "Rice", bn: "ধান" },
    "crop-wheat": { en: "Wheat", bn: "গম" },
    "crop-legume": { en: "Legume", bn: "ডাল ফসল" },
    "high-yield": { en: "High yield crop", bn: "উচ্চ ফলনশীল ফসল" },
    "water-intensive": { en: "Water intensive", bn: "অধিক পানি প্রয়োজন" },
    "moderate-demand": { en: "Moderate demand", bn: "মাঝারি পানির চাহিদা" },
    "soil-restoration": { en: "Soil restoration", bn: "মাটির উর্বরতা বৃদ্ধি" },

    "soil-impact": { en: "Soil impact", bn: "মাটিতে প্রভাব" },
    "impact-medium": { en: "Medium", bn: "মাঝারি" },
    "impact-high": { en: "High", bn: "উচ্চ" },
    "impact-low": { en: "Low", bn: "স্বল্প" },
    "impact-very-low": { en: "Very Low", bn: "অত্যন্ত কম" },

    "selected-year-lbl": { en: "SELECTED YEAR", bn: "নির্বাচিত বছর" },
    "soil-health-lbl": { en: "Soil Health", bn: "মাটির স্বাস্থ্য" },
    "water-demand-lbl": { en: "Water Demand", bn: "পানির চাহিদা" },
    "yield-pot-lbl": { en: "Yield Potential", bn: "ফলন সম্ভাবনা" },

    "sim-rotation-btn": { en: "▶ Simulate Rotation", bn: "▶ পর্যায়ক্রম সিমুলেট করুন" },
    "reset-rotation-btn": { en: "Reset", bn: "রিসেট" },
    "rot-complete-title": { en: "Rotation analysis complete", bn: "পর্যায়ক্রম বিশ্লেষণ সম্পন্ন" },

    // ===== LAND LOCATION =====
    "land-eyebrow": { en: "LAND INTELLIGENCE", bn: "ভূমি বুদ্ধিমত্তা" },
    "land-h2-1": { en: "Understand your", bn: "আপনার কৃষিজমি" },
    "land-h2-span": { en: "land.", bn: "নিখুঁতভাবে জানুন।" },
    "land-desc": {
        en: "Analyze the geographic conditions around your agricultural field.",
        bn: "আপনার জমির আশেপাশের ভৌগোলিক ও পরিবেশগত উপাত্ত বিশ্লেষণ করুন।"
    },
    "selected-land": { en: "SELECTED LAND", bn: "নির্বাচিত জমি" },
    "location-label": { en: "📍 LOCATION", bn: "📍 অবস্থান" },
    "river-label": { en: "🌊 NEAREST RIVER", bn: "🌊 নিকটতম নদী" },
    "pond-label": { en: "💧 NEAREST POND", bn: "💧 নিকটতম জলাশয়" },
    "area-label": { en: "📐 FIELD AREA", bn: "📐 জমির আয়তন" },
    "lat-label": { en: "LATITUDE", bn: "অক্ষাংশ (LAT)" },
    "lon-label": { en: "LONGITUDE", bn: "দ্রাঘিমাংশ (LNG)" },
    "search-rad-label": { en: "SEARCH RADIUS", bn: "অনুসন্ধান পরিধি" },
    "opt-500m": { en: "500 meters", bn: "৫০০ মিটার" },
    "opt-1km": { en: "1 kilometer", bn: "১ কিলোমিটার" },
    "opt-2km": { en: "2 kilometers", bn: "২ কিলোমিটার" },
    "opt-5km": { en: "5 kilometers", bn: "৫ কিলোমিটার" },
    "analyze-land-btn": { en: "Analyze this land", bn: "এই জমি বিশ্লেষণ করুন" },

    // ===== 3D SIMULATION HUD (Default English) =====
    "hud-title": { en: "Mymensingh Farm 3D Simulation", bn: "ময়মনসিংহ খামার ৩ডি সিমুলেশন" },
    "hud-status": { en: "Live Real-Time Conditions", bn: "রিয়েল-টাইম ক্ষেত্র পর্যবেক্ষণ" },
    "hud-drone-btn": { en: "🚁 Drone View", bn: "🚁 ড্রোন ভিউ" },
    "hud-field-btn": { en: "🚜 Field View", bn: "🚜 মাঠ ভিউ" },
    "hud-sun-btn": { en: "☀️ Day", bn: "☀️ দিন" },

    // Soil Panel
    "hud-soil-title": { en: "Soil Quality & Health", bn: "মাটির গুণমান ও স্বাস্থ্য" },
    "hud-npk-header": { en: "N - P - K Nutrients", bn: "এন - পি - কে পুষ্টি উপাদান" },
    "hud-nitrogen": { en: "Nitrogen", bn: "নাইট্রোজেন" },
    "hud-phosphorus": { en: "Phosphorus", bn: "ফসফরাস" },
    "hud-potassium": { en: "Potassium", bn: "পটাশিয়াম" },

    "hud-moisture-title": { en: "Soil Moisture", bn: "মাটির আর্দ্রতা" },
    "hud-depth-0cm": { en: "0 cm", bn: "০ সেমি" },
    "hud-depth-5cm": { en: "5 cm", bn: "৫ সেমি" },
    "hud-depth-10cm": { en: "10 cm", bn: "১০ সেমি" },

    "hud-ph-title": { en: "Soil pH", bn: "মাটির pH" },
    "hud-texture-title": { en: "Soil Texture", bn: "মাটির গঠন" },
    "hud-texture-desc": {
        en: "Loamy soil with rich organic nutrients and adequate natural drainage for maximum crop yield.",
        bn: "উর্বর দোআঁশ মাটি, পর্যাপ্ত জৈব পুষ্টি এবং সুষম নিষ্কাশন ব্যবস্থা বিদ্যমান।"
    },
    "hud-soil-temp-lbl": { en: "Soil Temperature", bn: "মাটির তাপমাত্রা" },

    // Crop Recommendations Panel
    "hud-crop-title": { en: "Crop Advisory", bn: "ফসল পরামর্শ" },
    "hud-best-crops": { en: "Optimal Seasonal Crops", bn: "মৌসুমের সেরা ফসল" },
    "hud-crop1-name": { en: "1. Aman Paddy", bn: "১. আমন ধান" },
    "hud-crop1-badge": { en: "Optimal", bn: "উপযুক্ত" },
    "hud-crop2-name": { en: "2. Eggplant / Brinjal", bn: "২. বেগুন" },
    "hud-crop2-badge": { en: "High Yield", bn: "উচ্চ ফলন" },
    "hud-crop3-name": { en: "3. Papaya", bn: "৩. পেঁপে" },
    "hud-crop3-badge": { en: "Favorable", bn: "অনুকূল" },
    "hud-crop4-name": { en: "4. Lentils / Pulses", bn: "৪. মসুর ডাল" },
    "hud-crop4-badge": { en: "Soil Revitalizer", bn: "মাটিবান্ধব" },

    // Weather Panel
    "hud-weather-title": { en: "Weather Forecast", bn: "আবহাওয়া পূর্বাভাস" },
    "hud-weather-sub": { en: "5-Day Outlook · Mymensingh", bn: "৫ দিনের পূর্বাভাস · ময়মনসিংহ" },
    "hud-day-today": { en: "Today", bn: "আজ" },
    "hud-day-fri": { en: "Fri", bn: "শুক্র" },
    "hud-day-sat": { en: "Sat", bn: "শনি" },
    "hud-day-sun": { en: "Sun", bn: "রবি" },
    "hud-day-mon": { en: "Mon", bn: "সোম" },
    "hud-wind-lbl": { en: "Wind Speed", bn: "বাতাসের গতি" },
    "hud-rain-prob-lbl": { en: "Precipitation", bn: "বৃষ্টির সম্ভাবনা" },
    "hud-rain-status": { en: "Moderate Rain", bn: "মাঝারি বৃষ্টি" },
    "hud-rain-time": { en: "In 48 Hours", bn: "পরশুদিন" },

    // ===== 3D AGRICULTURAL HUD & TRAFFIC LIGHT INDICATORS =====
    "hud-dock-moisture": { en: "Soil Moisture", bn: "মাটির আর্দ্রতা" },
    "hud-dock-moisture-sub": { en: "Root Zone 0-15cm", bn: "মূল অঞ্চল ০-১৫ সেমি" },
    "hud-dock-moist-good": { en: "Optimal", bn: "পর্যাপ্ত রস" },
    "hud-dock-moist-warn": { en: "Needs Irrigation", bn: "সেচ দিন" },
    "hud-dock-moist-bad": { en: "Severe Drought", bn: "খরা / দ্রুত সেচ" },

    "hud-dock-npk": { en: "Fertilizer N-P-K", bn: "সার ও পুষ্টির মাত্রা" },
    "hud-dock-npk-sub": { en: "Soil Balance", bn: "মাটির পুষ্টি স্থিতি" },
    "hud-dock-npk-good": { en: "Balanced", bn: "সুষম পুষ্টি" },
    "hud-dock-npk-warn": { en: "Low Nitrogen", bn: "নাইট্রোজেন ঘাটতি" },
    "hud-dock-npk-bad": { en: "Deficient", bn: "তীব্র সার ঘাটতি" },

    "hud-dock-pest": { en: "Pest & Disease Risk", bn: "রোগ ও বালাই ঝুঁকি" },
    "hud-dock-pest-sub": { en: "Field Health Sentinel", bn: "ফসল স্বাস্থ্য পর্যবেক্ষণ" },
    "hud-dock-pest-good": { en: "Safe & Healthy", bn: "ঝুঁকিমুক্ত" },
    "hud-dock-pest-warn": { en: "Watch Closely", bn: "সতর্ক দৃষ্টি রাখুন" },
    "hud-dock-pest-bad": { en: "Urgent Spray", bn: "দ্রুত স্প্রে করুন" },

    "hud-dock-weather": { en: "Field Climate", bn: "মাঠের আবহাওয়া" },
    "hud-dock-weather-sub": { en: "Solar & Wind", bn: "সূর্য ও বাতাস" },

    // ===== BOTTOM GROWTH TIMELINE SCRUBBER =====
    "timeline-label": { en: "Growth Timeline:", bn: "ফসল জীবনচক্র:" },
    "timeline-day-prefix": { en: "Day", bn: "দিন" },
    "timeline-speed": { en: "Speed", bn: "গতি" },
    "timeline-play": { en: "Play", bn: "চালান" },
    "timeline-pause": { en: "Pause", bn: "থামান" },

    "weather-label": { en: "Weather Switcher:", bn: "আবহাওয়া নির্বাচন:" },
    "weather-sunny": { en: "☀️ Sunny", bn: "☀️ রোদ" },
    "weather-rain": { en: "🌧️ Rain", bn: "🌧️ বৃষ্টি" },
    "weather-wind": { en: "💨 Windy", bn: "💨 বাতাস" },
    "weather-sprinkler": { en: "💦 Sprinkler", bn: "💦 সেচ" },

    "cam-drone": { en: "🚁 Drone Top View", bn: "🚁 ড্রোন ভিউ" },
    "cam-field": { en: "🌾 Crop Close-up", bn: "🌾 কাছ থেকে দেখুন" },
    "cam-root": { en: "🌱 Root & Soil View", bn: "🌱 মাটির গভীরে" },

    // ===== TIME OF DAY SEGMENTS =====
    "tod-morning": { en: "Morning", bn: "সকাল" },
    "tod-noon": { en: "Noon", bn: "দুপুর" },
    "tod-night": { en: "Night", bn: "রাত" },

    // ===== 5 GROWTH STAGES =====
    "stage-1-name": { en: "1. Sprout / Seedling", bn: "১. অঙ্কুরোদগম ও চারা" },
    "stage-2-name": { en: "2. Vegetative Growth", bn: "২. অঙ্গজ বৃদ্ধি" },
    "stage-3-name": { en: "3. Flowering / Panicle", bn: "৩. ফুল ও শীষ আসা" },
    "stage-4-name": { en: "4. Grain / Fruit Filling", bn: "৪. ফল ও দানা গঠন" },
    "stage-5-name": { en: "5. Harvest Ready", bn: "৫. ফসল কাটার সময়" },

    // ===== FARMER ACTION CARD =====
    "action-card-heading": { en: "Spatial AR Dock", bn: "স্পেশিয়াল এআর ডক" },
    "action-macro-btn": { en: "3D Crop Macro View / AR X-Ray", bn: "৩ডি ম্যাক্রো ভিউ / এআর এক্স-রে" },
    "action-advice-title": { en: "Field Guidance:", bn: "মাঠের নির্দেশিকা:" },
    "action-btn-irrigate": { en: "💦 Start Irrigation", bn: "💦 সেচ চালু করুন" },
    "action-btn-fertilize": { en: "🌿 Apply Fertilizer", bn: "🌿 সার প্রয়োগ করুন" },
    "action-btn-spray": { en: "🛡️ Spray Protection", bn: "🛡️ ওষুধ স্প্রে করুন" },
    "action-inspect-3d": { en: "🔍 Sketchfab 3D Inspect", bn: "🔍 Sketchfab 3D মডেল" },
    "action-crop-health": { en: "Crop Health Status:", bn: "ফসলের বর্তমান অবস্থা:" },
    "action-health-lush": { en: "🟢 Lush & Thriving", bn: "🟢 তরতাজা ও সুস্থ" },
    "action-health-droop": { en: "🟡 Nutrient / Water Deficit", bn: "🟡 অপুষ্টি বা পানিস্বল্পতা" },
    "action-health-pest": { en: "🔴 Pest / Blight Alert", bn: "🔴 বালাই বা রোগের লক্ষণ" },
    "ar-root-xray": { en: "Subterranean Root X-Ray", bn: "মাটির নিচের এক্স-রে" },
    "ar-root-xray-exit": { en: "Exit Root X-Ray", bn: "এক্স-রে বন্ধ করুন" },
    "ar-ask-buddy-btn": { en: "Consult Farmer Buddy AI", bn: "কৃষি বন্ধু AI পরামর্শ নিন" },
    "ar-close-macro": { en: "Exit AR Close-up", bn: "স্বাভাবিক দৃশ্য" },
    "xray-pill-active": { en: "Subterranean Root X-Ray Active", bn: "মাটির নিচের মূল এক্স-রে সক্রিয়" },
    "xray-pill-exit": { en: "Exit X-Ray (Esc)", bn: "এক্স-রে বন্ধ (Esc)" },

    // ===== SKETCHFAB ASSET EXPLORER =====
    "sf-explorer-btn": { en: "Sketchfab 3D Models", bn: "Sketchfab 3D মডেল" },
    "sf-explorer-title": { en: "Sketchfab Agricultural Assets", bn: "Sketchfab কৃষি ৩ডি লাইব্রেরি" },

    // ===== CROP LIFECYCLE TRACKER =====
    "lifecycle-eyebrow": { en: "PRECISION CROP INTELLIGENCE", bn: "নির্ভুল ফসল চাষাবাদ বুদ্ধিমত্তা" },
    "lifecycle-h2-1": { en: "Interactive", bn: "ইন্টারেক্টিভ" },
    "lifecycle-h2-span": { en: "Crop Lifecycle Tracker.", bn: "ফসল জীবনচক্র ট্র্যাকার।" },
    "lifecycle-desc": {
        en: "Comprehensive 5-stage agronomic roadmaps for 15 essential crops: track timeline days, precision N-P-K fertilizer schedules, critical pest/disease alerts, and actionable management tips.",
        bn: "১৫টি প্রধান ফসলের ৫-ধাপবিশিষ্ট পূর্ণাঙ্গ চাষাবাদ গাইডলাইন: সময়কাল, সুষম এন-পি-কে সার সুপারিশ, বালাই ও রোগ সতর্কতা এবং কার্যকর পরিচর্যা পরামর্শ।"
    },
    "lifecycle-crop-label": { en: "Select Target Crop:", bn: "উদ্দিষ্ট ফসল নির্বাচন করুন:" },
    "lifecycle-stat-duration": { en: "Total Duration", bn: "মোট জীবনকাল" },
    "lifecycle-stat-temp": { en: "Optimal Temp", bn: "অনুকূল তাপমাত্রা" },
    "lifecycle-stat-water": { en: "Water Demand", bn: "পানির চাহিদা" },
    "lifecycle-stat-soil": { en: "Soil Suitability", bn: "মাটির উপযোগিতা" },
    "lifecycle-stat-season": { en: "Ideal Season", bn: "উপযুক্ত মৌসুম" },
    "lifecycle-card-npk": { en: "Recommended N-P-K Advice", bn: "সুপারিশকৃত এন-পি-কে সার পরামর্শ" },
    "lifecycle-card-pest": { en: "Pest & Disease Threat Alerts", bn: "রোগবালাই ও কীটশত্রু সতর্কতা" },
    "lifecycle-card-tips": { en: "Actionable Stage Guidelines", bn: "কার্যকর পরিচর্যা ও ব্যবস্থাপনা" },
    "lifecycle-btn-prev": { en: "← Previous Stage", bn: "← পূর্ববর্তী ধাপ" },
    "lifecycle-btn-next": { en: "Next Stage →", bn: "পরবর্তী ধাপ →" },
    "lifecycle-btn-play": { en: "▶ Auto Tour", bn: "▶ অটো ট্যুর" },
    "lifecycle-btn-pause": { en: "❚❚ Pause", bn: "❚❚ থামান" },
    "lifecycle-category-all": { en: "All Crops", bn: "সকল ফসল" },
    "lifecycle-category-cereal": { en: "Cereals", bn: "দানাশস্য" },
    "lifecycle-category-veg": { en: "Vegetables", bn: "সবজি" },
    "lifecycle-category-cash": { en: "Cash Crops", bn: "অর্থকরী" },
    "lifecycle-category-pulse": { en: "Pulses", bn: "ডাল ফসল" },
    "lifecycle-category-oil": { en: "Oilseeds & Spices", bn: "তৈল ও মসলা" },
    "lifecycle-category-fruit": { en: "Fruits", bn: "ফলমূল" },

    // ===== CTA & FOOTER =====
    "cta-eyebrow": { en: "READY TO ADAPT?", bn: "অভিযোজনে প্রস্তুত?" },
    "cta-h2-1": { en: "Build a smarter", bn: "আরও আধুনিক ও টেকসই" },
    "cta-h2-span": { en: "farm plan.", bn: "খামার পরিকল্পনা সাজান।" },
    "cta-btn": { en: "Start analysis →", bn: "বিশ্লেষণ শুরু করুন →" },
    "footer-brand": { en: "Field Shift", bn: "ফিল্ড শিফট" },
    "footer-tagline": {
        en: "Smart agricultural intelligence platform for sustainable farming.",
        bn: "টেকসই কৃষির জন্য স্মার্ট কৃষি বুদ্ধিমত্তা প্ল্যাটফর্ম।"
    },
    "nasa-sources-title": { en: "NASA Earth Observation Telemetry Sources", bn: "নাসা আর্থ অবজারভেশন টেলিমেট্রি উৎসসমূহ" },
    "smap-desc": { en: "Soil Moisture Active Passive · Root/Topsoil Moisture", bn: "মাটির মূল ও উপরিভাগের আর্দ্রতা" },
    "modis-desc": { en: "Terra/Aqua · 250m NDVI Vegetation Index & Solar PAR", bn: "উদ্ভিদ স্বাস্থ্য সূচক ও সৌর বিকিরণ" },
    "ecostress-desc": { en: "Thermal Radiometer · Evapotranspiration & Drought Stress", bn: "বাষ্পীভবন ও খরা চাপ সূচক" },
    "merra-desc": { en: "GMAO Reanalysis · Temperature, Humidity & Wind Vectors", bn: "বায়ুমণ্ডলীয় তাপমাত্রা ও আর্দ্রতা" },
    "gpm-desc": { en: "IMERG Satellite Constellation · Precipitation Rates", bn: "বৃষ্টিপাত ও বর্ষণ পরিমাপ" }
};

// Global active language ('en' | 'bn')
window.currentAppLanguage = "en";

// Translation helper
window.t = function (key) {
    if (i18nData[key]) {
        return i18nData[key][window.currentAppLanguage] || i18nData[key]["en"];
    }
    return key;
};

// Main function to switch application language
window.setAppLanguage = function (lang) {
    window.currentAppLanguage = lang;
    document.documentElement.lang = lang;

    // Apply translations to all DOM elements marked with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (i18nData[key] && i18nData[key][lang]) {
            element.textContent = i18nData[key][lang];
        }
    });

    // Update Body Typography for proper Bengali script rendering
    if (lang === "bn") {
        document.body.classList.add("lang-bn");
    } else {
        document.body.classList.remove("lang-bn");
    }

    // Synchronize toggle switch checkboxes
    const toggle = document.getElementById("langToggle");
    if (toggle) {
        toggle.checked = (lang === "bn");
    }

    // Notify other components (Scenario Simulator, Crop Rotation, 3D Engine, Map)
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
};

// Initialize listeners on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("langToggle");
    if (toggle) {
        toggle.addEventListener("change", function () {
            window.setAppLanguage(this.checked ? "bn" : "en");
        });
    }

    // Default to English as requested
    window.setAppLanguage("en");
});
