/*
|--------------------------------------------------------------------------
| FIELD SHIFT — COMPLETE 64-ZILLA BANGLADESH GIS SATELLITE MAP ENGINE
|--------------------------------------------------------------------------
| 1. High-Resolution Esri World Imagery Satellite Tile Layer
| 2. Draggable marker & click-to-select plot targeting anywhere in Bangladesh
| 3. Complete 64 Bangladesh Zillas Dataset with Agro-Meteorological Telemetry
| 4. 8-Division Interactive Dropdown Selector ("All 64 Districts (Zillas) ▾")
| 5. Multi-Engine Search:
|    - Engine A (Instant Local Match — 0ms): 64 Zillas + Popular Sub-Hubs + Aliases
|    - Engine B (Sub-Area / Upazila / Village / Road Live Geocoder): Photon + Nominatim
|    - Haversine Nearest Parent Zilla Matching with Micro-Variations
| 6. Real-Time Dynamic Plot Scaling (Acres / Bigha / Katha / Dec)
| 7. Full Ecosystem Live Sync:
|    - Map HUD badge & Right-side Telemetry cards with Scanning Pulse
|    - Navbar Farmer Profile Badge
|    - 7-Day Hyper-Local Weather Forecast (Open-Meteo)
|    - Scenario Simulator Baseline Sliders & Dual-Line Chart
|    - 3D Farm Simulation Location Selector
|--------------------------------------------------------------------------
*/

(function () {
    'use strict';

    // Global Map References
    let farmMap = null;
    let farmMarker = null;
    let fieldPolygon = null;
    let searchRadiusCircle = null;
    let detectedWaterLayer = null;

    // Active Selection State
    let currentLat = 24.7471;
    let currentLng = 90.4203;
    let currentNameEn = "Field Shift • Mymensingh - Field 02";
    let currentNameBn = "ফিল্ড শিফট • ময়মনসিংহ - ফিল্ড ০২";
    let currentAezEn = "AEZ-9 Old Brahmaputra Floodplain";
    let currentAezBn = "কৃষি পরিবেশ অঞ্চল-৯ পুরাতন ব্রহ্মপুত্র";
    let currentRadiusMeters = 1000;
    let currentAreaAcres = 25;
    let currentAreaUnit = "acre";

    // Search Debounce & Abort Controllers
    let searchDebounceTimer = null;
    let currentSearchAbortController = null;

    /*
    |--------------------------------------------------------------------------
    | COMPLETE 64 BANGLADESH ZILLAS DATASET WITH AGRO-METEOROLOGICAL TELEMETRY
    |--------------------------------------------------------------------------
    */
    const BD_64_ZILLAS_DATA = [
    {
        "id": "dhaka",
        "nameEn": "Dhaka",
        "nameBn": "ঢাকা",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.8103,
        "lng": 90.4125,
        "aezEn": "AEZ-28 Madhupur Tract",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৮ মধুপুর ট্র্যাক্ট",
        "riverEn": "Buriganga River",
        "riverBn": "বুড়িগঙ্গা নদী",
        "riverDist": 650,
        "pondEn": "Urban Agri-Retention Reservoir",
        "pondBn": "নগর কৃষি ড্রেনেজ ও রিটেনশন পুকুর",
        "pondDist": 280,
        "rainfall": 2050,
        "temp": 28.2,
        "water": 68,
        "ndvi": 0.58,
        "soilEn": "Urban/peri-urban high terrace; ideal for high-value horticulture & winter vegetables.",
        "soilBn": "উচ্চ লালচে সমতল ভূমি · নগর ও শহরতলি কৃষি · উচ্চমূল্যের শাকসবজি, ছাদবাগান ও উদ্যান ফসলের জন্য অত্যন্ত উপযোগী।",
        "cropsEn": "Horticulture, Leafy Greens, Hydroponics, Winter Vegetables",
        "cropsBn": "শাকসবজি, ছাদবাগান, হাইড্রোপনিক্স, শীতকালীন সবজি",
        "keywords": [
            "dhaka",
            "ঢাকা",
            "bakshibazar",
            "savar",
            "dhamrai",
            "mirpur",
            "uttara",
            "lalbagh",
            "কেরানীগঞ্জ",
            "তেজগাঁও"
        ]
    },
    {
        "id": "gazipur",
        "nameEn": "Gazipur",
        "nameBn": "গাজীপুর",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 24.0023,
        "lng": 90.4264,
        "aezEn": "AEZ-28 Madhupur Tract",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৮ মধুপুর ট্র্যাক্ট",
        "riverEn": "Turag River",
        "riverBn": "তুরাগ নদী",
        "riverDist": 520,
        "pondEn": "Bhawal Agro-Forestry Reservoir",
        "pondBn": "ভাওয়াল কৃষি-বনজ জলাশয়",
        "pondDist": 210,
        "rainfall": 2120,
        "temp": 27.8,
        "water": 71,
        "ndvi": 0.69,
        "soilEn": "Reddish terrace clay-loam; optimal for jackfruit, Boro rice & summer vegetables.",
        "soilBn": "লালচে দোআঁশ ও এঁটেল মাটি · কাঁঠাল, বোরো ধান, গ্রীষ্মকালীন শাকসবজি ও পেঁপে উৎপাদনের প্রধান কেন্দ্র।",
        "cropsEn": "Jackfruit, Boro Rice, Papaya, Summer Vegetables",
        "cropsBn": "কাঁঠাল, বোরো ধান, পেঁপে, গ্রীষ্মকালীন সবজি",
        "keywords": [
            "gazipur",
            "গাজীপুর",
            "টঙ্গী",
            "কালিয়াকৈর",
            "শ্রীপুর",
            "ভাওয়াল",
            "কাপাসিয়া"
        ]
    },
    {
        "id": "narayanganj",
        "nameEn": "Narayanganj",
        "nameBn": "নারায়ণগঞ্জ",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.6238,
        "lng": 90.5,
        "aezEn": "AEZ-19 Old Meghna Estuarine Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৯ পুরাতন মেঘনা মোহনা প্লাবনভূমি",
        "riverEn": "Shitalakshya River",
        "riverBn": "শীতলক্ষ্যা নদী",
        "riverDist": 310,
        "pondEn": "Riverine Agriculture Basin",
        "pondBn": "নদী তীরবর্তী কৃষি সেচ পুকুর",
        "pondDist": 160,
        "rainfall": 2080,
        "temp": 28.1,
        "water": 76,
        "ndvi": 0.62,
        "soilEn": "Alluvial river basin with rich silt; suited for Boro rice, potato & mustard.",
        "soilBn": "নদী অববাহিকার উর্বর পলিমাটি · বোরো ধান, গোলআলু ও সরিষা উৎপাদনের ঐতিহ্যবাহী অঞ্চল।",
        "cropsEn": "Boro Rice, Potato, Mustard, Cauliflower",
        "cropsBn": "বোরো ধান, আলু, সরিষা, ফুলকপি",
        "keywords": [
            "narayanganj",
            "নারায়ণগঞ্জ",
            "সোনারগাঁও",
            "আড়াইহাজার",
            "রূপগঞ্জ",
            "শীতলক্ষ্যা"
        ]
    },
    {
        "id": "narsingdi",
        "nameEn": "Narsingdi",
        "nameBn": "নরসিংদী",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.9229,
        "lng": 90.7177,
        "aezEn": "AEZ-9 Old Brahmaputra Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৯ পুরাতন ব্রহ্মপুত্র প্লাবনভূমি",
        "riverEn": "Meghna River",
        "riverBn": "মেঘনা নদী",
        "riverDist": 480,
        "pondEn": "Fertile Alluvial Irrigation Pond",
        "pondBn": "উর্বর পলিময় সেচ জলাশয়",
        "pondDist": 190,
        "rainfall": 2150,
        "temp": 27.6,
        "water": 78,
        "ndvi": 0.72,
        "soilEn": "Fertile loamy soil; prime zone for banana, vegetables, Aman & Boro rice.",
        "soilBn": "উর্বর দোআঁশ মাটি · কলা (অমৃতসাগর), লটকন, শাকসবজি ও আমন/বোরো ধানের মডেল অঞ্চল।",
        "cropsEn": "Amritsagar Banana, Lotkon, Aman Rice, Boro Rice, Vegetables",
        "cropsBn": "অমৃতসাগর কলা, লটকন, আমন ধান, বোরো ধান, সবজি",
        "keywords": [
            "narsingdi",
            "নরসিংদী",
            "বেলাব",
            "মনোহরদী",
            "পলাশ",
            "রায়পুরা",
            "শিবপুর",
            "লটকন"
        ]
    },
    {
        "id": "manikganj",
        "nameEn": "Manikganj",
        "nameBn": "মানিকগঞ্জ",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.8617,
        "lng": 90.0003,
        "aezEn": "AEZ-8 Young Brahmaputra & Jamuna",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৮ তরুণ ব্রহ্মপুত্র ও যমুনা প্লাবনভূমি",
        "riverEn": "Padma-Jamuna Basin",
        "riverBn": "পদ্মা-যমুনা নদী অববাহিকা",
        "riverDist": 390,
        "pondEn": "Char Agro Wetland Basin",
        "pondBn": "চর কৃষি জলাশয় ও খাঁড়ি",
        "pondDist": 175,
        "rainfall": 1920,
        "temp": 27.9,
        "water": 75,
        "ndvi": 0.7,
        "soilEn": "Silty char & floodplain soil; top producer of mustard, maize, onion & pulses.",
        "soilBn": "পলিযুক্ত চর ও প্লাবনভূমির উর্বর দোআঁশ মাটি · সরিষা, ভুট্টা, পেঁয়াজ ও ডাল ফসলের অন্যতম প্রধান হাব।",
        "cropsEn": "Mustard, Maize, Onion, Pulses, Jute",
        "cropsBn": "সরিষা, ভুট্টা, পেঁয়াজ, ডাল, তোষা পাট",
        "keywords": [
            "manikganj",
            "মানিকগঞ্জ",
            "ঘিওরে",
            "দৌলতপুর",
            "সাটুরিয়া",
            "হরিরামপুর",
            "ঝিটকা"
        ]
    },
    {
        "id": "munshiganj",
        "nameEn": "Munshiganj",
        "nameBn": "মুন্সিগঞ্জ",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.5422,
        "lng": 90.5305,
        "aezEn": "AEZ-10 Active Ganges Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১০ সক্রিয় গাঙ্গেয় প্লাবনভূমি",
        "riverEn": "Dhaleshwari & Padma",
        "riverBn": "ধলেশ্বরী ও পদ্মা নদী",
        "riverDist": 280,
        "pondEn": "Deep Potato Cold-Storage Canal",
        "pondBn": "আলু অঞ্চল গভীর সেচ খাল",
        "pondDist": 140,
        "rainfall": 2140,
        "temp": 27.7,
        "water": 82,
        "ndvi": 0.73,
        "soilEn": "Deep nutrient-rich silt; Bangladesh's premier potato, gourd & Boro rice belt.",
        "soilBn": "গভীর পুষ্টিসমৃদ্ধ গাঙ্গেয় পলিমাটি · বাংলাদেশের প্রধান আলু বেল্ট, মিষ্টি কুমড়া, লাউ ও বোরো ধান।",
        "cropsEn": "Diamond Potato, Sweet Gourd, Boro Rice, Bottle Gourd",
        "cropsBn": "ডায়মন্ড আলু, মিষ্টি কুমড়া, বোরো ধান, লাউ",
        "keywords": [
            "munshiganj",
            "মুন্সিগঞ্জ",
            "বিক্রমপুর",
            "টঙ্গীবাড়ী",
            "সিরাজদিখান",
            "লৌহজং",
            "গজারিয়া"
        ]
    },
    {
        "id": "tangail",
        "nameEn": "Tangail",
        "nameBn": "টাঙ্গাইল",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 24.2513,
        "lng": 89.9167,
        "aezEn": "AEZ-8 Young Jamuna Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৮ তরুণ যমুনা প্লাবনভূমি",
        "riverEn": "Jamuna & Louhajang",
        "riverBn": "যমুনা ও লৌহজং নদী",
        "riverDist": 450,
        "pondEn": "Pineapple Valley Water Reservoir",
        "pondBn": "মধুপুর আনারস উপত্যকা জলাশয়",
        "pondDist": 220,
        "rainfall": 1980,
        "temp": 27.5,
        "water": 74,
        "ndvi": 0.71,
        "soilEn": "Mixed floodplain and Madhupur terrace; ideal for pineapple, Aman rice & mustard.",
        "soilBn": "যমুনা প্লাবনভূমি ও মধুপুর গড়ের মিশ্র মাটি · মধুপুরের আনারস, সরিষা ও আমন ধানের সুপরিচিত ক্ষেত্র।",
        "cropsEn": "Giant Kew Pineapple, Aman Rice, Mustard, Ginger",
        "cropsBn": "জায়ান্ট কিউ আনারস, আমন ধান, সরিষা, আদা",
        "keywords": [
            "tangail",
            "টাঙ্গাইল",
            "মধুপুর",
            "ঘাটাইল",
            "মির্জাপুর",
            "কালিহাতী",
            "সখিপুর",
            "নাগরপুর"
        ]
    },
    {
        "id": "kishoreganj",
        "nameEn": "Kishoreganj",
        "nameBn": "কিশোরগঞ্জ",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 24.4449,
        "lng": 90.7766,
        "aezEn": "AEZ-21 Sylhet Basin / Haor",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২১ সিলেট বেসিন / হাওর",
        "riverEn": "Dhanu & Old Brahmaputra",
        "riverBn": "ধনু ও পুরাতন ব্রহ্মপুত্র নদ",
        "riverDist": 340,
        "pondEn": "Nikli Haor Basin Channel",
        "pondBn": "নিকলী হাওর অববাহিকা খাঁড়ি",
        "pondDist": 120,
        "rainfall": 2450,
        "temp": 26.9,
        "water": 88,
        "ndvi": 0.75,
        "soilEn": "Low-lying haor & floodplain; rich Boro rice, maize & floating agriculture zone.",
        "soilBn": "হাওর ও প্লাবনভূমি জলাশয় বাস্তুতন্ত্র · প্রচুর পৃষ্ঠীয় পানি · বাম্পার বোরো ধান, ভুট্টা ও ভাসমান ধাপ চাষ।",
        "cropsEn": "HYV Boro Rice, Maize, Floating Vegetables, Mustard",
        "cropsBn": "উচ্চফলনশীল বোরো ধান, ভুট্টা, ভাসমান সবজি, সরিষা",
        "keywords": [
            "kishoreganj",
            "কিশোরগঞ্জ",
            "নিকলী",
            "অষ্টগ্রাম",
            "ইটনা",
            "মিঠামইন",
            "ভৈরব",
            "বাজিতপুর"
        ]
    },
    {
        "id": "faridpur",
        "nameEn": "Faridpur",
        "nameBn": "ফরিদপুর",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.607,
        "lng": 89.8429,
        "aezEn": "AEZ-12 Low Ganges River Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১২ নিম্ন গাঙ্গেয় নদী প্লাবনভূমি",
        "riverEn": "Padma & Kumar River",
        "riverBn": "পদ্মা ও কুমার নদী",
        "riverDist": 410,
        "pondEn": "Jute Retting Community Basin",
        "pondBn": "পাট জাগ দেওয়ার কৃষি জলাশয়",
        "pondDist": 180,
        "rainfall": 1840,
        "temp": 28.0,
        "water": 73,
        "ndvi": 0.69,
        "soilEn": "Calcareous loamy soil; premier belt for jute, onion, garlic, wheat & pulses.",
        "soilBn": "চুনযুক্ত উর্বর দোআঁশ পলিমাটি · বাংলাদেশের পাট ও পেঁয়াজের রাজধানী, গম, রসুন ও মসুর ডাল।",
        "cropsEn": "Toshas Jute, King Onion, Garlic, Wheat, Lentils",
        "cropsBn": "তোষা পাট, কিং পেঁয়াজ, রসুন, গম, মসুর ডাল",
        "keywords": [
            "faridpur",
            "ফরিদপুর",
            "বোয়ালমারী",
            "মধুখালী",
            "ভাঙ্গা",
            "সালথা",
            "নগরকান্দা"
        ]
    },
    {
        "id": "gopalganj",
        "nameEn": "Gopalganj",
        "nameBn": "গোপালগঞ্জ",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.0051,
        "lng": 89.8266,
        "aezEn": "AEZ-14 Gopalganj-Khulna Beels",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৪ গোপালগঞ্জ-খুলনা বিল অঞ্চল",
        "riverEn": "Madhumati River",
        "riverBn": "মধুমতি নদী",
        "riverDist": 330,
        "pondEn": "Floating Bed Dhap Beel Waterway",
        "pondBn": "ভাসমান ধাপ কৃষি বিল চ্যানেল",
        "pondDist": 110,
        "rainfall": 2060,
        "temp": 27.8,
        "water": 84,
        "ndvi": 0.74,
        "soilEn": "Peat basin & wetland beels; ideal for floating dhap cultivation & Boro rice.",
        "soilBn": "পিট কয়লা মিশ্রিত জৈবসমৃদ্ধ জলাভূমি · ঐতিহ্যবাহী ভাসমান ধাপ চাষ (Dhap Cultivation) ও বোরো ধান।",
        "cropsEn": "Floating Vegetables (Dhap), Boro Rice, Watermelon, Pulses",
        "cropsBn": "ভাসমান ধাপ সবজি, বোরো ধান, তরমুজ, খেসারি ডাল",
        "keywords": [
            "gopalganj",
            "gopalgonj",
            "গোপালগঞ্জ",
            "টুঙ্গিপাড়া",
            "কোটালীপাড়া",
            "মুকসুদপুর",
            "কাশিয়ানী"
        ]
    },
    {
        "id": "madaripur",
        "nameEn": "Madaripur",
        "nameBn": "মাদারীপুর",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.1641,
        "lng": 90.1897,
        "aezEn": "AEZ-12 Low Ganges Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১২ নিম্ন গাঙ্গেয় প্লাবনভূমি",
        "riverEn": "Arial Khan River",
        "riverBn": "আড়িয়াল খাঁ নদী",
        "riverDist": 360,
        "pondEn": "Arial Khan Floodplain Reservoir",
        "pondBn": "আড়িয়াল খাঁ প্লাবনভূমি জলাশয়",
        "pondDist": 165,
        "rainfall": 2090,
        "temp": 27.9,
        "water": 79,
        "ndvi": 0.71,
        "soilEn": "Fertile riverine silt; high yield for jute, mustard, pulses & Aman rice.",
        "soilBn": "নদীবিধৌত উর্বর পলিমাটি · উন্নত মানের তোষা পাট, সরিষা, খেসারি/মসুর ডাল ও রোপা আমন ধান।",
        "cropsEn": "Jute, Mustard, Khesari Pulses, Aman Rice",
        "cropsBn": "তোষা পাট, সরিষা, খেসারি ডাল, রোপা আমন",
        "keywords": [
            "madaripur",
            "মাদারীপুর",
            "শিবচর",
            "কালকিনি",
            "রাজৈর",
            "আড়িয়াল খাঁ"
        ]
    },
    {
        "id": "rajbari",
        "nameEn": "Rajbari",
        "nameBn": "রাজবাড়ী",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.7574,
        "lng": 89.6445,
        "aezEn": "AEZ-11 High Ganges River Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় নদী প্লাবনভূমি",
        "riverEn": "Padma River",
        "riverBn": "পদ্মা নদী",
        "riverDist": 290,
        "pondEn": "Padma Char Agro Basin",
        "pondBn": "পদ্মা চর কৃষি সেচ পুকুর",
        "pondDist": 150,
        "rainfall": 1790,
        "temp": 28.1,
        "water": 70,
        "ndvi": 0.67,
        "soilEn": "Sandy-loam char & floodplain; strong yield for onion, jute, wheat & sugarcane.",
        "soilBn": "বেলে-দোআঁশ চর ও নদী সমভূমি · লাল তীর পেঁয়াজ, পাট, গম, আখ ও বাদাম চাষের উপযোগী।",
        "cropsEn": "Winter Onion, Jute, Sugarcane, Groundnut, Wheat",
        "cropsBn": "শীতকালীন পেঁয়াজ, পাট, আখ, চীনা বাদাম, গম",
        "keywords": [
            "rajbari",
            "রাজবাড়ী",
            "পাংশা",
            "বালিয়াকান্দি",
            "গোয়ালন্দ",
            "কালুখালী"
        ]
    },
    {
        "id": "shariatpur",
        "nameEn": "Shariatpur",
        "nameBn": "শরীয়তপুর",
        "divisionEn": "Dhaka",
        "divisionBn": "ঢাকা",
        "lat": 23.2423,
        "lng": 90.4348,
        "aezEn": "AEZ-10 Active Padma Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১০ সক্রিয় পদ্মা প্লাবনভূমি",
        "riverEn": "Padma & Meghna Confluence",
        "riverBn": "পদ্মা-মেঘনা সঙ্গম নদী",
        "riverDist": 260,
        "pondEn": "Confluence Riverine Silt Channel",
        "pondBn": "নদী মোহনা পলি সেচ নালা",
        "pondDist": 130,
        "rainfall": 2180,
        "temp": 27.8,
        "water": 83,
        "ndvi": 0.72,
        "soilEn": "Active alluvial floodplain; rich in garlic, coriander, chili, jute & rice.",
        "soilBn": "সক্রিয় পলিময় পদ্মা-মেঘনা মোহনা · রসুন, ধনেপাতা, কাঁচামরিচ, পাট ও আমন ধানের সমৃদ্ধ ক্ষেত্র।",
        "cropsEn": "Garlic, Coriander, Green Chili, Jute, T. Aman Rice",
        "cropsBn": "রসুন, ধনেপাতা, কাঁচামরিচ, তোষা পাট, রোপা আমন",
        "keywords": [
            "shariatpur",
            "শরীয়তপুর",
            "জাজিরা",
            "নড়িয়া",
            "ভেদরগঞ্জ",
            "ডামুড্যা",
            "গোসাইরহাট"
        ]
    },
    {
        "id": "mymensingh",
        "nameEn": "Mymensingh",
        "nameBn": "ময়মনসিংহ",
        "divisionEn": "Mymensingh",
        "divisionBn": "ময়মনসিংহ",
        "lat": 24.7471,
        "lng": 90.4203,
        "aezEn": "AEZ-9 Old Brahmaputra Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৯ পুরাতন ব্রহ্মপুত্র প্লাবনভূমি",
        "riverEn": "Old Brahmaputra River",
        "riverBn": "পুরাতন ব্রহ্মপুত্র নদ",
        "riverDist": 420,
        "pondEn": "BAU Aquaculture & Irrigation Canal",
        "pondBn": "কৃষি বিশ্ববিদ্যালয় সেচ খাল ও মৎস্য হ্যাচারি",
        "pondDist": 135,
        "rainfall": 2240,
        "temp": 27.1,
        "water": 79,
        "ndvi": 0.76,
        "soilEn": "Prime non-calcareous dark grey floodplain; top zone for Aman/Boro rice, fish & vegetables.",
        "soilBn": "উচ্চ উর্বর অ-চুনযুক্ত ধূসর পলিমাটি · রোপা আমন ও বোরো ধান, উন্নত মৎস্য ও সবজির প্রধান উৎপাদন কেন্দ্র।",
        "cropsEn": "Aman Rice, Boro Rice, Fish Hatchery, Vegetables, Mustard",
        "cropsBn": "রোপা আমন, বোরো ধান, মৎস্য চাষ, শাকসবজি, সরিষা",
        "keywords": [
            "mymensingh",
            "ময়মনসিংহ",
            "trishal",
            "haluaghat",
            "ত্রিশাল",
            "হালুয়াঘাট",
            "ফুলপুর",
            "মুক্তাগাছা",
            "গৌরীপুর",
            "ভালুকা"
        ]
    },
    {
        "id": "jamalpur",
        "nameEn": "Jamalpur",
        "nameBn": "জামালপুর",
        "divisionEn": "Mymensingh",
        "divisionBn": "ময়মনসিংহ",
        "lat": 24.9375,
        "lng": 89.9378,
        "aezEn": "AEZ-8 Young Brahmaputra & Jamuna",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৮ তরুণ ব্রহ্মপুত্র ও যমুনা প্লাবনভূমি",
        "riverEn": "Jamuna & Brahmaputra",
        "riverBn": "যমুনা ও পুরাতন ব্রহ্মপুত্র নদ",
        "riverDist": 350,
        "pondEn": "Jamuna Char Agro Irrigation Canal",
        "pondBn": "যমুনা চর কৃষি সেচ খাল",
        "pondDist": 155,
        "rainfall": 2190,
        "temp": 27.2,
        "water": 77,
        "ndvi": 0.74,
        "soilEn": "Fertile sandy-loam & silt; exceptional for maize, chili, mustard & fine rice.",
        "soilBn": "উর্বর বেলে-দোআঁশ পলিমাটি · হাইব্রিড ভুট্টা, লাল মরিচ, সরিষা ও সুগন্ধি চিনিরগুঁড়া ধান।",
        "cropsEn": "Hybrid Maize, Dried Red Chili, Mustard, Fine Rice, Jute",
        "cropsBn": "হাইব্রিড ভুট্টা, শুকনো লাল মরিচ, সরিষা, সুগন্ধি ধান, পাট",
        "keywords": [
            "jamalpur",
            "জামালপুর",
            "সরিষাবাড়ী",
            "মেলান্দহ",
            "ইসলামপুর",
            "দেওয়ানগঞ্জ",
            "বকশীগঞ্জ",
            "মাদারগঞ্জ"
        ]
    },
    {
        "id": "sherpur",
        "nameEn": "Sherpur",
        "nameBn": "শেরপুর",
        "divisionEn": "Mymensingh",
        "divisionBn": "ময়মনসিংহ",
        "lat": 25.0205,
        "lng": 90.0153,
        "aezEn": "AEZ-22 Northern & Eastern Piedmont",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২২ উত্তর ও পূর্ব পাদদেশীয় সমভূমি",
        "riverEn": "Bhogai & Kangsha River",
        "riverBn": "ভোগাই ও কংস নদী",
        "riverDist": 490,
        "pondEn": "Garo Piedmont Natural Reservoir",
        "pondBn": "গারো পাদদেশীয় পাহাড়ি ছড়া জলাশয়",
        "pondDist": 210,
        "rainfall": 2520,
        "temp": 26.6,
        "water": 76,
        "ndvi": 0.77,
        "soilEn": "Garo hills piedmont plain; high fertility for aromatic Tulshimala rice, potato & vegetables.",
        "soilBn": "গারো পাহাড়ের পাদদেশীয় অম্লীয় ও দোআঁশ মাটি · সুগন্ধি তুলশীমালা ধান, আলু ও সবজি চাষ।",
        "cropsEn": "Aromatic Tulshimala Rice, Potato, Ginger, Seasonal Vegetables",
        "cropsBn": "সুগন্ধি তুলশীমালা ধান, আলু, আদা, মৌসুমী সবজি",
        "keywords": [
            "sherpur",
            "শেরপুর",
            "নকলা",
            "নালিতাবাড়ী",
            "শ্রীবরদী",
            "ঝিনাইগাতী",
            "তুলশীমালা"
        ]
    },
    {
        "id": "netrokona",
        "nameEn": "Netrokona",
        "nameBn": "নেত্রকোনা",
        "divisionEn": "Mymensingh",
        "divisionBn": "ময়মনসিংহ",
        "lat": 24.871,
        "lng": 90.7279,
        "aezEn": "AEZ-21 Sylhet Haor Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২১ সিলেট হাওর অববাহিকা",
        "riverEn": "Someshwari & Kangsha",
        "riverBn": "সোমেশ্বরী ও কংস নদী",
        "riverDist": 380,
        "pondEn": "Dingar Pota Haor Basin Waterway",
        "pondBn": "ডিঙ্গারপোতা হাওর অববাহিকা নালা",
        "pondDist": 115,
        "rainfall": 2680,
        "temp": 26.5,
        "water": 86,
        "ndvi": 0.78,
        "soilEn": "Haor & piedmont ecosystem; high-yield Boro rice hub with abundant surface water.",
        "soilBn": "হাওর ও কংস-সোমেশ্বরী অববাহিকা · পর্যাপ্ত মিষ্টি পানি · উচ্চফলনশীল বোরো ধান ও মিঠাপানির মাছ।",
        "cropsEn": "Early Boro Rice, Deepwater Aman, Haor Fishery, Maize",
        "cropsBn": "আগাম বোরো ধান, গভীর আমন, হাওর মৎস্য, ভুট্টা",
        "keywords": [
            "netrokona",
            "নেত্রকোনা",
            "মোহনগঞ্জ",
            "কেন্দুয়া",
            "দুর্গাপুর",
            "কলমাকান্দা",
            "মদন",
            "খালিয়াজুড়ি"
        ]
    },
    {
        "id": "chattogram",
        "nameEn": "Chattogram",
        "nameBn": "চট্টগ্রাম",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 22.3569,
        "lng": 91.7832,
        "aezEn": "AEZ-23 Chittagong Coastal Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৩ চট্টগ্রাম উপকূলীয় সমভূমি",
        "riverEn": "Karnaphuli & Halda River",
        "riverBn": "কর্ণফুলী ও হালদা নদী",
        "riverDist": 410,
        "pondEn": "Halda Natural Carp Breeding Basin",
        "pondBn": "হালদা প্রাকৃতিক কার্প প্রজনন অববাহিকা",
        "pondDist": 190,
        "rainfall": 2890,
        "temp": 27.6,
        "water": 80,
        "ndvi": 0.74,
        "soilEn": "Coastal plain & hill valley; ideal for HYV rice, winter vegetables & agro-forestry.",
        "soilBn": "উপকূলীয় সমভূমি ও পাহাড়ি উপত্যকা · উচ্চফলনশীল ধান, শীতকালীন সবজি ও সমন্বিত কৃষি-বন।",
        "cropsEn": "HYV Rice, Winter Vegetables, Agro-Forestry, Watermelon",
        "cropsBn": "উচ্চফলনশীল ধান, শীতকালীন সবজি, কৃষিবন, তরমুজ",
        "keywords": [
            "chattogram",
            "chittagong",
            "চট্টগ্রাম",
            "মিরসরাই",
            "সীতাকুণ্ড",
            "ফটিকছড়ি",
            "রাউজান",
            "পটিয়া",
            "আনোয়ারা"
        ]
    },
    {
        "id": "coxs_bazar",
        "nameEn": "Cox's Bazar",
        "nameBn": "কক্সবাজার",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 21.4272,
        "lng": 92.0058,
        "aezEn": "AEZ-23 Coastal Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৩ উপকূলীয় সমভূমি",
        "riverEn": "Matamuhuri & Bakkhali",
        "riverBn": "মাতামুহুরী ও বাঁকখালী নদী",
        "riverDist": 370,
        "pondEn": "Coastal Saline-Safe Sweet Pond",
        "pondBn": "উপকূলীয় মিষ্টি পানির কৃষি পুকুর",
        "pondDist": 145,
        "rainfall": 3420,
        "temp": 27.9,
        "water": 78,
        "ndvi": 0.7,
        "soilEn": "Coastal saline-tolerant belt; suited for salt-tolerant rice (BRRI dhan67), betel leaf & watermelon.",
        "soilBn": "উপকূলীয় মৃদু লবণাক্ত মাটি · লবণসহনশীল ধান (ব্রি ধান৬৭), মিষ্টি পান ও রসালো তরমুজ চাষ।",
        "cropsEn": "Salt-Tolerant Rice (BRRI dhan67), Sweet Betel Leaf, Watermelon, Groundnut",
        "cropsBn": "লবণসহনশীল ধান, মিষ্টি পান, তরমুজ, চিনাবাদাম",
        "keywords": [
            "cox's bazar",
            "coxs bazar",
            "কক্সবাজার",
            "চকোরিয়া",
            "মহেশখালী",
            "টেকনাফ",
            "উখিয়া",
            "পেকুয়া"
        ]
    },
    {
        "id": "cumilla",
        "nameEn": "Cumilla",
        "nameBn": "কুমিল্লা",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 23.4607,
        "lng": 91.1809,
        "aezEn": "AEZ-19 Old Meghna Estuarine Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৯ পুরাতন মেঘনা মোহনা প্লাবনভূমি",
        "riverEn": "Gumti River",
        "riverBn": "গোমতী নদী",
        "riverDist": 390,
        "pondEn": "BARD Intensive Crop Canal",
        "pondBn": "বার্ড বহুমুখী নিবিড় সেচ খাল",
        "pondDist": 170,
        "rainfall": 2160,
        "temp": 27.5,
        "water": 79,
        "ndvi": 0.75,
        "soilEn": "Highly intensive triple-cropping floodplain; model zone for Boro/Aman rice & vegetables.",
        "soilBn": "নিবিড় তিন-ফসলি উর্বর প্লাবনভূমি · বার্ড মডেল সমৃদ্ধ বোরো/আমন ধান ও আধুনিক শাকসবজি।",
        "cropsEn": "Boro Rice, Aman Rice, Pointed Gourd, Potato, Tomato",
        "cropsBn": "বোরো ধান, আমন ধান, পটল, আলু, টমেটো",
        "keywords": [
            "cumilla",
            "comilla",
            "কুমিল্লা",
            "দাউদকান্দি",
            "চান্দিনা",
            "বুড়িচং",
            "দেবীদ্বার",
            "লাকসাম",
            "চৌদ্দগ্রাম"
        ]
    },
    {
        "id": "brahmanbaria",
        "nameEn": "Brahmanbaria",
        "nameBn": "ব্রাহ্মণবাড়িয়া",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 23.9571,
        "lng": 91.1119,
        "aezEn": "AEZ-19 Meghna Estuarine Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৯ মেঘনা মোহনা প্লাবনভূমি",
        "riverEn": "Titas & Meghna River",
        "riverBn": "তিতাস ও মেঘনা নদী",
        "riverDist": 320,
        "pondEn": "Titas Basin Agro Drainage Canal",
        "pondBn": "তিতাস অববাহিকা কৃষি ড্রেনেজ নালা",
        "pondDist": 130,
        "rainfall": 2210,
        "temp": 27.4,
        "water": 82,
        "ndvi": 0.73,
        "soilEn": "Deeply flooded Titas basin; strong Boro rice, mustard & lentil production.",
        "soilBn": "গভীর প্লাবিত তিতাস অববাহিকা · উচ্চ ফলনশীল বোরো ধান, সরিষা ও মসুর ডাল উৎপাদন।",
        "cropsEn": "Boro Rice, Yellow Mustard, Black Gram, Lentil",
        "cropsBn": "বোরো ধান, হলুদ সরিষা, মাসকলাই, মসুর ডাল",
        "keywords": [
            "brahmanbaria",
            "ব্রাহ্মণবাড়িয়া",
            "সরাইল",
            "আশুগঞ্জ",
            "কসবা",
            "নবীনগর",
            "নাসিরনগর",
            "তিতাস"
        ]
    },
    {
        "id": "chandpur",
        "nameEn": "Chandpur",
        "nameBn": "চাঁদপুর",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 23.2333,
        "lng": 90.6713,
        "aezEn": "AEZ-19 Lower Meghna Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৯ নিম্ন মেঘনা প্লাবনভূমি",
        "riverEn": "Meghna-Padma Confluence",
        "riverBn": "মেঘনা-পদ্মা সঙ্গম নদী",
        "riverDist": 240,
        "pondEn": "Meghna-Dhonagoda Irrigation Channel",
        "pondBn": "মেঘনা-ধনাগোদা সেচ প্রকল্প খাঁড়ি",
        "pondDist": 105,
        "rainfall": 2310,
        "temp": 27.7,
        "water": 87,
        "ndvi": 0.74,
        "soilEn": "Irrigated Meghna-Dhonagoda project zone; high yield for potato, maize & rice.",
        "soilBn": "মেঘনা-ধনাগোদা সেচ প্রকল্প এলাকা · আলু, হাইব্রিড ভুট্টা ও আধুনিক ধান চাষে শীর্ষ ফলন।",
        "cropsEn": "Cardinal Potato, Hybrid Maize, HYV Boro Rice, Soybean",
        "cropsBn": "কার্ডিনাল আলু, হাইব্রিড ভুট্টা, বোরো ধান, সয়াবিন",
        "keywords": [
            "chandpur",
            "চাঁদপুর",
            "মতলব",
            "হাজীগঞ্জ",
            "ফরিদগঞ্জ",
            "কচুয়া",
            "শাহরাস্তি"
        ]
    },
    {
        "id": "noakhali",
        "nameEn": "Noakhali",
        "nameBn": "নোয়াখালী",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 22.8696,
        "lng": 91.0994,
        "aezEn": "AEZ-18 Young Meghna Estuarine Char",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৮ তরুণ মেঘনা মোহনা চর",
        "riverEn": "Lower Meghna Channel",
        "riverBn": "নিম্ন মেঘনা চ্যানেল",
        "riverDist": 540,
        "pondEn": "Hatiya Coastal Sweetwater Basin",
        "pondBn": "হাতিয়া উপকূলীয় মিষ্টি পানি জলাশয়",
        "pondDist": 185,
        "rainfall": 2780,
        "temp": 27.8,
        "water": 74,
        "ndvi": 0.68,
        "soilEn": "Coastal char land; ideal for soybean, mungbean, groundnut & salt-tolerant Aman.",
        "soilBn": "উপকূলীয় নবীন চর ও পলিমাটি · সয়াবিন, মুগডাল, চীনা বাদাম ও লবণসহনশীল আমন ধান।",
        "cropsEn": "Soybean, Mungbean, Groundnut, Salt-Tolerant T. Aman",
        "cropsBn": "সয়াবিন, মুগডাল, চীনা বাদাম, লবণসহনশীল আমন",
        "keywords": [
            "noakhali",
            "নোয়াখালী",
            "হাতিয়া",
            "সুবর্ণচর",
            "বেগমগঞ্জ",
            "সেনবাগ",
            "কোম্পানীগঞ্জ"
        ]
    },
    {
        "id": "lakshmipur",
        "nameEn": "Lakshmipur",
        "nameBn": "লক্ষ্মীপুর",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 22.9447,
        "lng": 90.8282,
        "aezEn": "AEZ-18 Young Meghna Estuarine",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৮ তরুণ মেঘনা মোহনা ভূমি",
        "riverEn": "Meghna Estuary",
        "riverBn": "মেঘনা মোহনা নদী",
        "riverDist": 360,
        "pondEn": "Soybean Belt Agro Canal",
        "pondBn": "সয়াবিন অঞ্চল কৃষি সেচ নালা",
        "pondDist": 140,
        "rainfall": 2640,
        "temp": 27.8,
        "water": 79,
        "ndvi": 0.71,
        "soilEn": "Bangladesh's soybean capital; rich estuarine silt for soybean, betel nut, coconut & rice.",
        "soilBn": "বাংলাদেশের সয়াবিন রাজধানী · মোহনার সমৃদ্ধ পলিমাটি · সয়াবিন, সুপারি, নারিকেল ও আমন ধান।",
        "cropsEn": "Soybean (75% National Production), Betel Nut, Coconut, Aman Rice",
        "cropsBn": "সয়াবিন (জাতীয় উৎপাদনের ৭৫%), সুপারি, নারিকেল, আমন ধান",
        "keywords": [
            "lakshmipur",
            "laxmipur",
            "লক্ষ্মীপুর",
            "রায়পুর",
            "রামগঞ্জ",
            "রামগতি",
            "কমলনগর"
        ]
    },
    {
        "id": "feni",
        "nameEn": "Feni",
        "nameBn": "ফেনী",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 23.0159,
        "lng": 91.3976,
        "aezEn": "AEZ-23 Coastal & Piedmont Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৩ উপকূল ও পাদদেশীয় সমভূমি",
        "riverEn": "Feni & Muhuri River",
        "riverBn": "ফেনী ও মুহুরী নদী",
        "riverDist": 350,
        "pondEn": "Muhuri Irrigation Project Canal",
        "pondBn": "মুহুরী সেচ প্রকল্প প্রধান খাল",
        "pondDist": 120,
        "rainfall": 2710,
        "temp": 27.6,
        "water": 81,
        "ndvi": 0.73,
        "soilEn": "Muhuri irrigation belt; high productivity for Aman/Aus/Boro rice & winter vegetables.",
        "soilBn": "মুহুরী সেচ প্রকল্প বেষ্টিত উর্বর মাটি · আউশ, আমন, বোরো ও শীতকালীন আগাম সবজি চাষ।",
        "cropsEn": "Triple Cropped Rice (Aus/Aman/Boro), Winter Vegetables, Watermelon",
        "cropsBn": "তিন ফসলি ধান (আউশ/আমন/বোরো), শীতকালীন সবজি, তরমুজ",
        "keywords": [
            "feni",
            "ফেনী",
            "মুহুরী",
            "দাগনভূঞা",
            "সোনাগাজী",
            "পরশুরাম",
            "ছাগলনাইয়া",
            "ফুলগাজী"
        ]
    },
    {
        "id": "khagrachhari",
        "nameEn": "Khagrachhari",
        "nameBn": "খাগড়াছড়ি",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 23.1193,
        "lng": 91.9847,
        "aezEn": "AEZ-29 Northern & Eastern Hills",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৯ উত্তর ও পূর্ব পাহাড়ি অঞ্চল",
        "riverEn": "Chengi River",
        "riverBn": "চেঙ্গী নদী",
        "riverDist": 460,
        "pondEn": "Chengi Valley Natural Creek",
        "pondBn": "চেঙ্গী উপত্যকা পাহাড়ি ছড়া",
        "pondDist": 195,
        "rainfall": 2690,
        "temp": 26.4,
        "water": 69,
        "ndvi": 0.82,
        "soilEn": "Sloping hill terrain & valleys; premier zone for turmeric, ginger, mango, Malta & valley rice.",
        "soilBn": "ঢালু পাহাড়ি লালচে মাটি ও উপত্যকা · হলুদ, আদা, পাহাড়ি আম্রপালি, মাল্টা ও উপত্যকা ধান।",
        "cropsEn": "Hill Turmeric, Ginger, Amrapali Mango, Malta, Valley Rice",
        "cropsBn": "পাহাড়ি হলুদ, আদা, আম্রপালি আম, মাল্টা, উপত্যকা ধান",
        "keywords": [
            "khagrachhari",
            "khagrachari",
            "খাগড়াছড়ি",
            "দীঘিনালা",
            "পানছড়ি",
            "মহালছড়ি",
            "মাটিরাঙ্গা",
            "রামগড়",
            "মানিকছড়ি"
        ]
    },
    {
        "id": "rangamati",
        "nameEn": "Rangamati",
        "nameBn": "রাঙ্গামাটি",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 22.6533,
        "lng": 92.1789,
        "aezEn": "AEZ-29 Chittagong Hill Tracts",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৯ পার্বত্য চট্টগ্রাম পাহাড়",
        "riverEn": "Kaptai Lake & Karnaphuli",
        "riverBn": "কাপ্তাই হ্রদ ও কর্ণফুলী নদী",
        "riverDist": 190,
        "pondEn": "Kaptai Lake Shoreline Orchard Basin",
        "pondBn": "কাপ্তাই হ্রদ তীরবর্তী বাগান জলাশয়",
        "pondDist": 90,
        "rainfall": 2750,
        "temp": 26.5,
        "water": 83,
        "ndvi": 0.84,
        "soilEn": "Lake valley & hill horticulture; ideal for pineapple, cashew nut, coffee, ginger & banana.",
        "soilBn": "হ্রদ উপত্যকা ও পাহাড়ি উদ্যান কৃষি · জলডুবি আনারস, কাজুবাদাম, কফি, আদা ও পাহাড়িকা কলা।",
        "cropsEn": "Honey Queen Pineapple, Cashew Nut, Arabica Coffee, Ginger, Hill Banana",
        "cropsBn": "হানি কুইন আনারস, কাজুবাদাম, অ্যারাবিকা কফি, আদা, পাহাড়িকা কলা",
        "keywords": [
            "rangamati",
            "রাঙ্গামাটি",
            "কাপ্তাই",
            "বাঘাইছড়ি",
            "বরকল",
            "লংগদু",
            "নানিয়ারচর",
            "রাজস্থলী"
        ]
    },
    {
        "id": "bandarban",
        "nameEn": "Bandarban",
        "nameBn": "বান্দরবান",
        "divisionEn": "Chattogram",
        "divisionBn": "চট্টগ্রাম",
        "lat": 22.1953,
        "lng": 92.2184,
        "aezEn": "AEZ-29 High Eastern Hills",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৯ উচ্চ পূর্ব পাহাড়ি অঞ্চল",
        "riverEn": "Sangu River",
        "riverBn": "সাঙ্গু নদী",
        "riverDist": 410,
        "pondEn": "Sangu Mountain Spring Reservoir",
        "pondBn": "সাঙ্গু পাহাড়ি ঝর্ণা জলাশয়",
        "pondDist": 230,
        "rainfall": 2940,
        "temp": 26.1,
        "water": 67,
        "ndvi": 0.85,
        "soilEn": "High hill agro-forestry; suited for mango (Amrapali), dragon fruit, cashew, cotton & spices.",
        "soilBn": "উঁচু পাহাড়ি কৃষিবন বাস্তুতন্ত্র · আম্রপালি আম, ড্রাগন ফল, কাজুবাদাম, জুম তুলা ও মসলা।",
        "cropsEn": "Amrapali Mango, Dragon Fruit, Hill Cotton, Cashew Nut, Spices",
        "cropsBn": "আম্রপালি আম, ড্রাগন ফল, পাহাড়ি তুলা, কাজুবাদাম, দারুচিনি/মসলা",
        "keywords": [
            "bandarban",
            "বান্দরবান",
            "রোয়াংছড়ি",
            "রুমা",
            "থানচি",
            "লামা",
            "আলীকদম",
            "নাইক্ষ্যংছড়ি"
        ]
    },
    {
        "id": "rajshahi",
        "nameEn": "Rajshahi",
        "nameBn": "রাজশাহী",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.3745,
        "lng": 88.6042,
        "aezEn": "AEZ-26 High Barind Tract & AEZ-11 Ganges",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৬ উচ্চ বরেন্দ্র ও গাঙ্গেয় সমভূমি",
        "riverEn": "Padma River",
        "riverBn": "পদ্মা নদী",
        "riverDist": 620,
        "pondEn": "Barind Deep Tube-Well Reservoir",
        "pondBn": "বরেন্দ্র গভীর নলকূপ ও পুনর্ভরণ পুকুর",
        "pondDist": 240,
        "rainfall": 1420,
        "temp": 28.9,
        "water": 54,
        "ndvi": 0.63,
        "soilEn": "Low-rainfall Barind clay & Ganges silt; famous for mango, silk, wheat, lentil & drought-tolerant rice.",
        "soilBn": "স্বল্প বৃষ্টির শক্ত বরেন্দ্র এঁটেল ও পদ্মা পলিমাটি · সুমিষ্ট আম, রেশম, গম, মসুর ও খরাসহনশীল ধান।",
        "cropsEn": "Fazli/Gopalbhog Mango, Wheat, Lentil, Mulberry Silk, BRRI dhan56",
        "cropsBn": "ফজলি/গোপালভোগ আম, গম, মসুর ডাল, তুত রেশম, ব্রি ধান৫৬",
        "keywords": [
            "rajshahi",
            "রাজশাহী",
            "বাঘা",
            "চারঘাট",
            "পুঠিয়া",
            "গোদাগাড়ী",
            "তানোর",
            "মোহনপুর",
            "বাগমারা"
        ]
    },
    {
        "id": "bogura",
        "nameEn": "Bogura",
        "nameBn": "বগুড়া",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.8481,
        "lng": 89.373,
        "aezEn": "AEZ-4 Karatoya-Bangali & AEZ-25 Barind",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৪ করতোয়া-বাঙালি ও বরেন্দ্র সমভূমি",
        "riverEn": "Karatoya & Jamuna",
        "riverBn": "করতোয়া ও যমুনা নদী",
        "riverDist": 430,
        "pondEn": "Spice Research Center Irrigation Canal",
        "pondBn": "মসলা গবেষণা কেন্দ্র সেচ খাল",
        "pondDist": 160,
        "rainfall": 1760,
        "temp": 27.6,
        "water": 73,
        "ndvi": 0.75,
        "soilEn": "Northern agricultural powerhouse; triple-cropped zone for potato, red chili, maize & fine rice.",
        "soilBn": "উত্তরবঙ্গের কৃষিশক্তি · তিন ফসলি উর্বর মাটি · গোলআলু, লাল মরিচ, হাইব্রিড ভুট্টা ও কাটারিভোগ ধান।",
        "cropsEn": "Export Quality Potato, Red Chili, Hybrid Maize, Kataribhog Rice",
        "cropsBn": "রপ্তানিযোগ্য গোলআলু, লাল মরিচ, হাইব্রিড ভুট্টা, কাটারিভোগ ধান",
        "keywords": [
            "bogura",
            "bogra",
            "বগুড়া",
            "শেরপুর",
            "শিবগঞ্জ",
            "শাজাহানপুর",
            "দুপচাঁচিয়া",
            "আদমদিঘী",
            "সারিয়াকান্দি",
            "ধুনট"
        ]
    },
    {
        "id": "pabna",
        "nameEn": "Pabna",
        "nameBn": "পাবনা",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.0063,
        "lng": 89.2372,
        "aezEn": "AEZ-11 High Ganges & Jamuna Confluence",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় ও যমুনা সঙ্গম",
        "riverEn": "Padma & Ichamati",
        "riverBn": "পদ্মা ও ইছামতি নদী",
        "riverDist": 470,
        "pondEn": "Ishwardi Sugarcane Research Reservoir",
        "pondBn": "ঈশ্বরদী আখ গবেষণা সেচ পুকুর",
        "pondDist": 180,
        "rainfall": 1610,
        "temp": 28.2,
        "water": 70,
        "ndvi": 0.7,
        "soilEn": "Rich calcareous floodplain; major hub for onion, litchi (Ishwardi), pulses, wheat & cattle.",
        "soilBn": "চুনযুক্ত উর্বর পদ্মা অববাহিকা · ঈশ্বরদীর লিচু, তাহেরপুরী পেঁয়াজ, ডাল, গম ও উন্নত দুগ্ধ খামার।",
        "cropsEn": "Ishwardi Bombay Litchi, Taherpuri Onion, Sugarcane, Pulses, Wheat",
        "cropsBn": "ঈশ্বরদী বোম্বাই লিচু, তাহেরপুরী পেঁয়াজ, আখ, ডাল, গম",
        "keywords": [
            "pabna",
            "পাবনা",
            "ঈশ্বরদী",
            "সাঁথিয়া",
            "সুজানগর",
            "চাটমোহর",
            "ফরিদপুর",
            "বেড়া",
            "ভাঙ্গুড়া"
        ]
    },
    {
        "id": "sirajganj",
        "nameEn": "Sirajganj",
        "nameBn": "সিরাজগঞ্জ",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.4534,
        "lng": 89.7007,
        "aezEn": "AEZ-8 Jamuna Floodplain & Chalan Beel",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৮ যমুনা প্লাবনভূমি ও চলনবিল",
        "riverEn": "Jamuna River",
        "riverBn": "যমুনা নদী",
        "riverDist": 290,
        "pondEn": "Chalan Beel Milk-Vita Fodder Canal",
        "pondBn": "চলনবিল মিল্কভিটা ঘাস ও সেচ নালা",
        "pondDist": 125,
        "rainfall": 1850,
        "temp": 27.7,
        "water": 80,
        "ndvi": 0.73,
        "soilEn": "Alluvial Jamuna basin; top yield for mustard, Boro rice, maize & dairy fodder.",
        "soilBn": "যমুনা অববাহিকার উর্বর পলিমাটি · দেশের অন্যতম শীর্ষ সরিষা অঞ্চল, বোরো ধান ও নেপিয়ার ঘাস।",
        "cropsEn": "Yellow/Tori Mustard, Boro Rice, Maize, Dairy Fodder (Napier)",
        "cropsBn": "হলুদ/টরি সরিষা, বোরো ধান, ভুট্টা, নেপিয়ার ঘাস",
        "keywords": [
            "sirajganj",
            "সিরাজগঞ্জ",
            "শাহজাদপুর",
            "উল্লাপাড়া",
            "বেলকুচি",
            "রায়গঞ্জ",
            "তাড়াশ",
            "কাজীপুর"
        ]
    },
    {
        "id": "natore",
        "nameEn": "Natore",
        "nameBn": "নাটোর",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.4206,
        "lng": 89.0006,
        "aezEn": "AEZ-12 Chalan Beel & Lower Atrai Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১২ চলনবিল ও নিম্ন আত্রাই অববাহিকা",
        "riverEn": "Narod & Atrai River",
        "riverBn": "নারদ ও আত্রাই নদী",
        "riverDist": 380,
        "pondEn": "Chalan Beel Wetland Waterway",
        "pondBn": "চলনবিল প্রাকৃতিক আর্দ্রভূমি খাঁড়ি",
        "pondDist": 140,
        "rainfall": 1580,
        "temp": 28.3,
        "water": 74,
        "ndvi": 0.72,
        "soilEn": "Chalan Beel wetland & plain; renowned for zero-tillage garlic, wheat, sugarcane & medicinal herbs.",
        "soilBn": "চলনবিলের পলি ও এঁটেল মাটি · বিনা চাষে রসুন আবাদ, গম, আখ ও ঔষধি গ্রাম (খোলাবাড়িয়া)।",
        "cropsEn": "Zero-Tillage Garlic, Sugarcane, Medicinal Plants, Boro Rice",
        "cropsBn": "বিনা চাষে রসুন, আখ, ঔষধি উদ্ভিদ, বোরো ধান",
        "keywords": [
            "natore",
            "নাটোর",
            "সিংড়া",
            "গুরুদাসপুর",
            "বড়াইগ্রাম",
            "লালপুর",
            "বাগাতিপাড়া",
            "চলনবিল"
        ]
    },
    {
        "id": "naogaon",
        "nameEn": "Naogaon",
        "nameBn": "নওগাঁ",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.7936,
        "lng": 88.9318,
        "aezEn": "AEZ-25 Level Barind Tract",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৫ সমতল বরেন্দ্র ট্র্যাক্ট",
        "riverEn": "Atrai & Little Jamuna",
        "riverBn": "আত্রাই ও ছোট যমুনা নদী",
        "riverDist": 440,
        "pondEn": "Barind Rice Bowl Irrigation Deep Pond",
        "pondBn": "বরেন্দ্র শস্যভাণ্ডার সেচ দিঘি",
        "pondDist": 190,
        "rainfall": 1490,
        "temp": 28.4,
        "water": 62,
        "ndvi": 0.71,
        "soilEn": "Rice bowl of North Bengal; supreme producer of fine aromatic rice, mango & wheat.",
        "soilBn": "উত্তরবঙ্গের শস্যভাণ্ডার · সূক্ষ্ম সুগন্ধি চাল (জিরাভোগ/চিনিগুঁড়া), আম্রপালি আম ও গম।",
        "cropsEn": "Jirashail/Chinigura Aromatic Rice, Amrapali Mango, Wheat, Mustard",
        "cropsBn": "জিরাশাইল/চিনিগুঁড়া সুগন্ধি ধান, আম্রপালি আম, গম, সরিষা",
        "keywords": [
            "naogaon",
            "নওগাঁ",
            "সাপাহার",
            "পোরশা",
            "পত্নীতলা",
            "মহাদেবপুর",
            "বদলগাছী",
            "ধামইরহাট",
            "রানীনগর"
        ]
    },
    {
        "id": "chapainawabganj",
        "nameEn": "Chapainawabganj",
        "nameBn": "চাঁপাইনবাবগঞ্জ",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 24.5965,
        "lng": 88.2775,
        "aezEn": "AEZ-26 High Barind & Mahananda Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৬ উচ্চ বরেন্দ্র ও মহানন্দা প্লাবনভূমি",
        "riverEn": "Mahananda & Padma",
        "riverBn": "মহানন্দা ও পদ্মা নদী",
        "riverDist": 510,
        "pondEn": "Kansat Mango Orchard Irrigation Basin",
        "pondBn": "কানসাট আম বাগান সেচ জলাশয়",
        "pondDist": 210,
        "rainfall": 1380,
        "temp": 29.1,
        "water": 52,
        "ndvi": 0.64,
        "soilEn": "Dry Barind & river terrace; mango capital of Bangladesh, plus black gram, wheat & mustard.",
        "soilBn": "বাংলাদেশের আমের রাজধানী (ফজলি/ল্যাংড়া/খিরশাপাত) · শক্ত বরেন্দ্র দোআঁশ, মাসকলাই ও গম।",
        "cropsEn": "Heritage Mango (Khirsapat/Lengra/Fazli), Black Gram, Wheat, Tomato",
        "cropsBn": "ঐতিহ্যবাহী আম (ক্ষীরশাপাত/ল্যাংড়া/ফজলি), মাসকলাই ডাল, গম, টমেটো",
        "keywords": [
            "chapainawabganj",
            "nawabganj",
            "চাঁপাইনবাবগঞ্জ",
            "শিবগঞ্জ",
            "কানসাট",
            "গোমস্তাপুর",
            "নাচোল",
            "ভোলাহাট"
        ]
    },
    {
        "id": "joypurhat",
        "nameEn": "Joypurhat",
        "nameBn": "জয়পুরহাট",
        "divisionEn": "Rajshahi",
        "divisionBn": "রাজশাহী",
        "lat": 25.0968,
        "lng": 89.0227,
        "aezEn": "AEZ-25 Level Barind Tract",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৫ সমতল বরেন্দ্র অঞ্চল",
        "riverEn": "Little Jamuna & Tulshiganga",
        "riverBn": "ছোট যমুনা ও তুলসীগঙ্গা নদী",
        "riverDist": 460,
        "pondEn": "Feed-Maize Agro Irrigation Reservoir",
        "pondBn": "ভুট্টা ও পোল্ট্রি ফিড কৃষি সেচ পুকুর",
        "pondDist": 175,
        "rainfall": 1710,
        "temp": 27.4,
        "water": 71,
        "ndvi": 0.75,
        "soilEn": "Intensive double/triple cropping loamy clay; top yields in potato, Boro rice & poultry feed maize.",
        "soilBn": "নিবিড় দোআঁশ এঁটেল মাটি · আলু ও ফিড ভুট্টার সর্বোচ্চ ফলন, উন্নত বোরো ধান।",
        "cropsEn": "High-Yield Potato, Yellow Maize, Boro Rice, Mustard",
        "cropsBn": "উচ্চফলনশীল আলু, হলুদ ভুট্টা, বোরো ধান, সরিষা",
        "keywords": [
            "joypurhat",
            "জয়পুরহাট",
            "পাঁচবিবি",
            "কালাই",
            "ক্ষেতলাল",
            "আক্কেলপুর"
        ]
    },
    {
        "id": "rangpur",
        "nameEn": "Rangpur",
        "nameBn": "রংপুর",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.7439,
        "lng": 89.2752,
        "aezEn": "AEZ-3 Tista Meander Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৩ তিস্তা সর্পিল প্লাবনভূমি",
        "riverEn": "Teesta & Ghaghat River",
        "riverBn": "তিস্তা ও ঘাঘট নদী",
        "riverDist": 410,
        "pondEn": "Haribhanga Orchard Deep Irrigation Pond",
        "pondBn": "হাঁড়িভাঙা আম বাগান গভীর সেচ পুকুর",
        "pondDist": 160,
        "rainfall": 2150,
        "temp": 26.3,
        "water": 75,
        "ndvi": 0.76,
        "soilEn": "Fertile non-calcareous Teesta loam; prime for Haribhanga mango, potato, maize & tobacco-free crops.",
        "soilBn": "উর্বর অ-চুনযুক্ত তিস্তা দোআঁশ মাটি · ঐতিহ্যবাহী হাঁড়িভাঙা আম, আলু, ভুট্টা ও শাকসবজি।",
        "cropsEn": "GI Haribhanga Mango, Granola Potato, Maize, Winter Vegetables",
        "cropsBn": "জিআই হাঁড়িভাঙা আম, গ্র্যানোলা আলু, ভুট্টা, শীতকালীন সবজি",
        "keywords": [
            "rangpur",
            "রংপুর",
            "মিঠাপুকুর",
            "পীরগঞ্জ",
            "বদরগঞ্জ",
            "গঙ্গাচড়া",
            "তারাগঞ্জ",
            "কাউনিয়া",
            "পীরগাছা"
        ]
    },
    {
        "id": "dinajpur",
        "nameEn": "Dinajpur",
        "nameBn": "দিনাজপুর",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.6217,
        "lng": 88.6354,
        "aezEn": "AEZ-1 Old Himalayan Piedmont Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১ পুরাতন হিমালয় পাদদেশীয় সমভূমি",
        "riverEn": "Punarbhaba & Atrai",
        "riverBn": "পুনর্ভবা ও আত্রাই নদী",
        "riverDist": 450,
        "pondEn": "Bedana Litchi Irrigation Reservoir",
        "pondBn": "বেদানা লিচু বাগান সেচ জলাশয়",
        "pondDist": 175,
        "rainfall": 1980,
        "temp": 26.2,
        "water": 70,
        "ndvi": 0.75,
        "soilEn": "Permeable sandy-loam piedmont; famous for Kataribhog rice, litchi, wheat & hybrid maize.",
        "soilBn": "সহজে পানি নিষ্কাশনযোগ্য বেলে-দোআঁশ · সুগন্ধি কাটারিভোগ ও ব্রি ধান৩৪, বেদানা লিচু ও গম।",
        "cropsEn": "GI Kataribhog Rice, Bedana/China-3 Litchi, Wheat, Hybrid Maize",
        "cropsBn": "জিআই কাটারিভোগ চাল, বেদানা/চায়না-৩ লিচু, গম, হাইব্রিড ভুট্টা",
        "keywords": [
            "dinajpur",
            "দিনাজপুর",
            "বিরল",
            "বীরগঞ্জ",
            "কাহারোল",
            "বোচাগঞ্জ",
            "ফুলবাড়ী",
            "বিরামপুর",
            "নবাবগঞ্জ"
        ]
    },
    {
        "id": "kurigram",
        "nameEn": "Kurigram",
        "nameBn": "কুড়িগ্রাম",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.8054,
        "lng": 89.6362,
        "aezEn": "AEZ-2 Active Tista & Brahmaputra Char",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২ সক্রিয় তিস্তা ও ব্রহ্মপুত্র চর",
        "riverEn": "Brahmaputra & Dharla",
        "riverBn": "ব্রহ্মপুত্র ও ধরলা নদী",
        "riverDist": 270,
        "pondEn": "Sandbar Pit Cropping Groundwater Reservoir",
        "pondBn": "স্যান্ডবার পিট ক্রপিং ভূগর্ভস্থ জলাশয়",
        "pondDist": 110,
        "rainfall": 2380,
        "temp": 26.1,
        "water": 82,
        "ndvi": 0.71,
        "soilEn": "Riverine char & floodplain; strong potential for groundnut, maize, pumpkin on sandbars & Aman rice.",
        "soilBn": "নদীবিধৌত বালুচর ও প্লাবনভূমি · মিষ্টি কুমড়া (স্যান্ডবার ক্রপিং), চীনা বাদাম, ভুট্টা ও আমন।",
        "cropsEn": "Sandbar Sweet Pumpkin, Groundnut, Maize, T. Aman Rice",
        "cropsBn": "স্যান্ডবার মিষ্টি কুমড়া, চীনা বাদাম, ভুট্টা, রোপা আমন",
        "keywords": [
            "kurigram",
            "কুড়িগ্রাম",
            "চিলমারী",
            "উলিপুর",
            "নাগেশ্বরী",
            "ভুরুঙ্গামারী",
            "রৌমারী",
            "রাজিবপুর"
        ]
    },
    {
        "id": "gaibandha",
        "nameEn": "Gaibandha",
        "nameBn": "গাইবান্ধা",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.3297,
        "lng": 89.543,
        "aezEn": "AEZ-3 Tista & Brahmaputra Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৩ তিস্তা ও ব্রহ্মপুত্র প্লাবনভূমি",
        "riverEn": "Jamuna & Ghaghat",
        "riverBn": "যমুনা ও ঘাঘট নদী",
        "riverDist": 340,
        "pondEn": "Brahmaputra Floodplain Agro Canal",
        "pondBn": "ব্রহ্মপুত্র প্লাবনভূমি কৃষি নালা",
        "pondDist": 150,
        "rainfall": 2040,
        "temp": 26.7,
        "water": 78,
        "ndvi": 0.73,
        "soilEn": "Silty alluvial plain; high productivity for maize, chili, banana, mustard & Boro rice.",
        "soilBn": "পলি সমৃদ্ধ তিস্তা-যমুনা সমতল · ভুট্টা, কাঁচামরিচ, কলা, হলুদ ও উন্নত বোরো ধান।",
        "cropsEn": "Maize, Green Chili, Malbhog Banana, Mustard, Boro Rice",
        "cropsBn": "ভুট্টা, কাঁচামরিচ, মালভোগ কলা, সরিষা, বোরো ধান",
        "keywords": [
            "gaibandha",
            "গাইবান্ধা",
            "গোবিন্দগঞ্জ",
            "পলাশবাড়ী",
            "সুন্দরগঞ্জ",
            "সাদুল্লাপুর",
            "ফুলছড়ি",
            "সাঘাটা"
        ]
    },
    {
        "id": "nilphamari",
        "nameEn": "Nilphamari",
        "nameBn": "নীলফামারী",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.9318,
        "lng": 88.856,
        "aezEn": "AEZ-3 Tista Barrage Irrigated Zone",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-৩ তিস্তা ব্যারেজ সেচ অঞ্চল",
        "riverEn": "Teesta Canal Network",
        "riverBn": "তিস্তা ব্যারেজ সেচ ক্যানেল",
        "riverDist": 380,
        "pondEn": "Teesta Irrigation Command Pond",
        "pondBn": "তিস্তা কমান্ড এরিয়া সেচ দিঘি",
        "pondDist": 140,
        "rainfall": 2190,
        "temp": 26.0,
        "water": 74,
        "ndvi": 0.74,
        "soilEn": "Teesta irrigation command area; thriving maize, potato, ginger & HYV rice cultivation.",
        "soilBn": "তিস্তা সেচ প্রকল্পের সুফলভোগী এলাকা · আগাম আলু, ভুট্টা, আদা ও উচ্চফলনশীল ধান।",
        "cropsEn": "Early Potato, Ginger, Maize, HYV Boro Rice",
        "cropsBn": "আগাম গোলআলু, আদা, ভুট্টা, উচ্চফলনশীল বোরো ধান",
        "keywords": [
            "nilphamari",
            "নীলফামারী",
            "সৈয়দপুর",
            "ডোমার",
            "ডিমলা",
            "জলঢাকা",
            "কিশোরগঞ্জ"
        ]
    },
    {
        "id": "lalmonirhat",
        "nameEn": "Lalmonirhat",
        "nameBn": "লালমনিরহাট",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 25.9923,
        "lng": 89.2847,
        "aezEn": "AEZ-2 Active Tista Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২ সক্রিয় তিস্তা প্লাবনভূমি",
        "riverEn": "Teesta & Dharla River",
        "riverBn": "তিস্তা ও ধরলা নদী",
        "riverDist": 310,
        "pondEn": "Dharla Alluvial Irrigation Basin",
        "pondBn": "ধরলা পলল সেচ জলাশয়",
        "pondDist": 130,
        "rainfall": 2290,
        "temp": 26.0,
        "water": 76,
        "ndvi": 0.72,
        "soilEn": "Sandy-loam Teesta basin; #1 maize belt alongside potato, vegetables & betel nut.",
        "soilBn": "বেলে-দোআঁশ তিস্তা অববাহিকা · শীর্ষ ভুট্টা অঞ্চল, আলু, শীতকালীন সবজি ও সুপারি বাগান।",
        "cropsEn": "Commercial Maize (#1 Production), Potato, Betel Nut, Cabbage",
        "cropsBn": "বাণিজ্যিক ভুট্টা (শীর্ষ ফলন), আলু, সুপারি, বাঁধাকপি",
        "keywords": [
            "lalmonirhat",
            "লালমনিরহাট",
            "হাতীবান্ধা",
            "পাটগ্রাম",
            "কালীগঞ্জ",
            "আদিতমারী",
            "বুড়িমারী"
        ]
    },
    {
        "id": "thakurgaon",
        "nameEn": "Thakurgaon",
        "nameBn": "ঠাকুরগাঁও",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 26.0337,
        "lng": 88.4617,
        "aezEn": "AEZ-1 Old Himalayan Piedmont Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১ পুরাতন হিমালয় পাদদেশীয় সমভূমি",
        "riverEn": "Tangon River",
        "riverBn": "টাঙ্গন নদী",
        "riverDist": 490,
        "pondEn": "Tangon Valley Agro Reservoir",
        "pondBn": "টাঙ্গন উপত্যকা কৃষি জলাশয়",
        "pondDist": 190,
        "rainfall": 1890,
        "temp": 25.8,
        "water": 68,
        "ndvi": 0.74,
        "soilEn": "Deep sandy-loam soil; premier zone for wheat, Suryapuri mango, potato & winter maize.",
        "soilBn": "উচ্চমাত্রায় উর্বর গভীর বেলে-দোআঁশ মাটি · উন্নত মানের গম, সূর্যপুরী আম, আলু ও রবি ভুট্টা।",
        "cropsEn": "Wheat, Suryapuri Mango, Seed Potato, Winter Maize",
        "cropsBn": "গম, সূর্যপুরী আম, বীজ আলু, রবি ভুট্টা",
        "keywords": [
            "thakurgaon",
            "ঠাকুরগাঁও",
            "পীরগঞ্জ",
            "বালিয়াডাঙ্গী",
            "রাণীশংকৈল",
            "হরিপুর"
        ]
    },
    {
        "id": "panchagarh",
        "nameEn": "Panchagarh",
        "nameBn": "পঞ্চগড়",
        "divisionEn": "Rangpur",
        "divisionBn": "রংপুর",
        "lat": 26.3411,
        "lng": 88.5542,
        "aezEn": "AEZ-1 Himalayan Piedmont Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১ হিমালয় পাদদেশীয় সমভূমি",
        "riverEn": "Mahananda & Karatoya",
        "riverBn": "মহানন্দা ও করতোয়া নদী",
        "riverDist": 430,
        "pondEn": "Plain-Land Organic Tea Estate Pond",
        "pondBn": "সমতল অর্গানিক চা বাগান সেচ দিঘি",
        "pondDist": 155,
        "rainfall": 2540,
        "temp": 25.1,
        "water": 73,
        "ndvi": 0.78,
        "soilEn": "Acidic well-drained piedmont soil; Bangladesh's plain-land tea hub, orange, chili & watermelon.",
        "soilBn": "অনুকূল অম্লীয় নিষ্কাশিত মাটি · সমতলের অর্গানিক চা বিপ্লব, কমলা, মরিচ ও আগাম তরমুজ।",
        "cropsEn": "Plain-Land Organic Tea, Mandarin Orange, Green Chili, Watermelon",
        "cropsBn": "সমতলের অর্গানিক চা, দার্জিলিং কমলা, কাঁচামরিচ, আগাম তরমুজ",
        "keywords": [
            "panchagarh",
            "পঞ্চগড়",
            "তেঁতুলিয়া",
            "দেবীগঞ্জ",
            "বোদা",
            "আটোয়ারী",
            "বাংলাবান্ধা"
        ]
    },
    {
        "id": "khulna",
        "nameEn": "Khulna",
        "nameBn": "খুলনা",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 22.8456,
        "lng": 89.5403,
        "aezEn": "AEZ-13 Ganges Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ গাঙ্গেয় জোয়ার-ভাটা প্লাবনভূমি",
        "riverEn": "Rupsha & Bhairab River",
        "riverBn": "রূপসা ও ভৈরব নদী",
        "riverDist": 360,
        "pondEn": "Integrated Gher-Dyke Agri Pond",
        "pondBn": "সমন্বিত ঘের-আইল কৃষি পুকুর",
        "pondDist": 120,
        "rainfall": 1890,
        "temp": 28.4,
        "water": 72,
        "ndvi": 0.67,
        "soilEn": "Tidal floodplain with seasonal salinity; suited for salt-tolerant rice, sesame, sunflower & gher aquaculture.",
        "soilBn": "জোয়ার-ভাটা প্লাবনভূমি ও ঘের কৃষি · লবণসহনশীল ধান (ব্রি ধান৭৩), তিল, সূর্যমুখী ও গলদা ঘের।",
        "cropsEn": "Salt-Tolerant Rice (BRRI 73), Sesame, Sunflower, Gher Vegetables",
        "cropsBn": "লবণসহনশীল ধান (ব্রি ৭৩), তিল, সূর্যমুখী, ঘেরের আইলে সবজি",
        "keywords": [
            "khulna",
            "খুলনা",
            "ডুমুরিয়া",
            "বটিয়াঘাটা",
            "পাইকগাছা",
            "কয়রা",
            "দাকোপ",
            "রূপসা",
            "ফুলতলা"
        ]
    },
    {
        "id": "jashore",
        "nameEn": "Jashore",
        "nameBn": "যশোর",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.1664,
        "lng": 89.2081,
        "aezEn": "AEZ-11 High Ganges River Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় নদী প্লাবনভূমি",
        "riverEn": "Bhairab & Kapotaksha",
        "riverBn": "ভৈরব ও কপোতাক্ষ নদী",
        "riverDist": 440,
        "pondEn": "Gadkhali Floriculture Irrigation Reservoir",
        "pondBn": "গদখালি ফুল চাষ সেচ জলাশয়",
        "pondDist": 140,
        "rainfall": 1680,
        "temp": 28.3,
        "water": 71,
        "ndvi": 0.74,
        "soilEn": "Vegetable & flower capital (Gadkhali); year-round high-value vegetables, papaya, lentil & rice.",
        "soilBn": "দেশের ফুল ও সবজির রাজধানী (গদখালি) · বারোমাসি বাণিজ্যিক শাকসবজি, পেঁপে, মসুর ও আমন।",
        "cropsEn": "Commercial Flowers (Rose/Gerbera/Gladiolus), Pointed Gourd, Date Palm, Lentil",
        "cropsBn": "বাণিজ্যিক ফুল (গোলাপ/জার্বেরা), পটল, খেজুর গুড়, মসুর ডাল",
        "keywords": [
            "jashore",
            "jessore",
            "যশোর",
            "ঝিকরগাছা",
            "গদখালি",
            "মনিরামপুর",
            "কেশবপুর",
            "শার্শা",
            "বাঘারপাড়া",
            "বেনাপোল"
        ]
    },
    {
        "id": "satkhira",
        "nameEn": "Satkhira",
        "nameBn": "সাতক্ষীরা",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 22.7185,
        "lng": 89.0705,
        "aezEn": "AEZ-13 Coastal Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ উপকূলীয় জোয়ার-ভাটা সমভূমি",
        "riverEn": "Kapotaksha & Ichamati",
        "riverBn": "কপোতাক্ষ ও ইছামতি নদী",
        "riverDist": 390,
        "pondEn": "Himsagar Orchard Sweetwater Channel",
        "pondBn": "হিমসাগর আম বাগান মিষ্টি পানির খাল",
        "pondDist": 165,
        "rainfall": 1790,
        "temp": 28.5,
        "water": 69,
        "ndvi": 0.66,
        "soilEn": "Coastal brackish & sweet-water mosaic; famous for Himsagar mango, kul (jujube), salt-tolerant rice & shrimp.",
        "soilBn": "উপকূলীয় জলবায়ু সমৃদ্ধ উর্বর এলাকা · বিশ্বখ্যাত হিমসাগর ও ল্যাংড়া আম, থাই কুল, লবণসহনশীল ধান।",
        "cropsEn": "GI Himsagar Mango, Apple Kul (Jujube), BRRI dhan67, Mustard",
        "cropsBn": "জিআই হিমসাগর আম, আপেল কুল, ব্রি ধান৬৭, সরিষা",
        "keywords": [
            "satkhira",
            "সাতক্ষীরা",
            "কলারোয়া",
            "তালা",
            "কালীগঞ্জ",
            "শ্যামনগর",
            "আশাশুনি",
            "দেবহাটা"
        ]
    },
    {
        "id": "bagerhat",
        "nameEn": "Bagerhat",
        "nameBn": "বাগেরহাট",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 22.6516,
        "lng": 89.7859,
        "aezEn": "AEZ-13 Ganges Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ গাঙ্গেয় জোয়ার-ভাটা সমভূমি",
        "riverEn": "Pasur & Madhumati",
        "riverBn": "পশুর ও মধুমতি নদী",
        "riverDist": 340,
        "pondEn": "Gher-Dyke Integrated Water Basin",
        "pondBn": "ঘেরের আইল সমন্বিত পানির খাঁড়ি",
        "pondDist": 125,
        "rainfall": 2050,
        "temp": 28.3,
        "water": 77,
        "ndvi": 0.69,
        "soilEn": "Tidal river basin; ideal for gher-dyke vegetables, coconut, betel nut, watermelon & Aman rice.",
        "soilBn": "জোয়ার-ভাটার মিঠা-লোনা পানি অববাহিকা · ঘেরের আইলে সবজি, নারিকেল, সুপারি, তরমুজ ও আমন ধান।",
        "cropsEn": "Coconut, Betel Nut, Dyke Watermelon, Salt-Tolerant Rice",
        "cropsBn": "নারিকেল, সুপারি, ঘেরের আইলে তরমুজ, আমন ধান",
        "keywords": [
            "bagerhat",
            "বাগেরহাট",
            "ফকিরহাট",
            "মোংলা",
            "মোরেলগঞ্জ",
            "কচুয়া",
            "চিতলমারী",
            "রামপাল"
        ]
    },
    {
        "id": "kushtia",
        "nameEn": "Kushtia",
        "nameBn": "কুষ্টিয়া",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.9013,
        "lng": 89.1204,
        "aezEn": "AEZ-11 High Ganges Floodplain (GK Project)",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় সমভূমি (জিকে প্রকল্প)",
        "riverEn": "Padma & Gorai River",
        "riverBn": "পদ্মা ও গড়াই নদী",
        "riverDist": 370,
        "pondEn": "Ganges-Kobadak Main Irrigation Canal",
        "pondBn": "গঙ্গা-কপোতাক্ষ (জিকে) প্রধান সেচ খাল",
        "pondDist": 130,
        "rainfall": 1560,
        "temp": 28.5,
        "water": 69,
        "ndvi": 0.7,
        "soilEn": "Ganges-Kobadak irrigated loam; high yield for banana, maize, onion, pulses & fine rice.",
        "soilBn": "গঙ্গা-কপোতাক্ষ (জিকে) সেচ পুষ্ট উর্বর দোআঁশ · সাগর কলা, ভুট্টা, পেঁয়াজ, তিল ও বোরো ধান।",
        "cropsEn": "Sagar Banana, Hybrid Maize, Winter Onion, Sesame, Boro Rice",
        "cropsBn": "সাগর কলা, হাইব্রিড ভুট্টা, শীতকালীন পেঁয়াজ, তিল, বোরো ধান",
        "keywords": [
            "kushtia",
            "কুষ্টিয়া",
            "কুমারখালী",
            "ভেড়ামারা",
            "মিরপুর",
            "দৌলতপুর",
            "খোকসা",
            "শিলাইদহ"
        ]
    },
    {
        "id": "jhenaidah",
        "nameEn": "Jhenaidah",
        "nameBn": "ঝিনাইদহ",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.545,
        "lng": 89.1726,
        "aezEn": "AEZ-11 High Ganges River Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় নদী প্লাবনভূমি",
        "riverEn": "Nabaganga & Kumar",
        "riverBn": "নবগঙ্গা ও কুমার নদী",
        "riverDist": 460,
        "pondEn": "Dragon Fruit Agro Orchard Reservoir",
        "pondBn": "ড্রাগন ফল বাগান ড্রিপ সেচ পুকুর",
        "pondDist": 180,
        "rainfall": 1640,
        "temp": 28.3,
        "water": 70,
        "ndvi": 0.73,
        "soilEn": "Fertile upland loam; major producer of banana, betel leaf, dragon fruit, lentil & rice.",
        "soilBn": "উঁচু উর্বর সমতল মাটি · বাণিজ্যিক ড্রাগন ফল, মিষ্টি পান, কলা, মসুর ডাল ও উচ্চফলনশীল ধান।",
        "cropsEn": "Dragon Fruit, Sweet Betel Leaf, Robusta Banana, Lentil",
        "cropsBn": "ড্রাগন ফল, মিষ্টি পান, মেহের সাগর কলা, মসুর ডাল",
        "keywords": [
            "jhenaidah",
            "ঝিনাইদহ",
            "কালীগঞ্জ",
            "কোটচাঁদপুর",
            "মহেশপুর",
            "শৈলকুপা",
            "হরিণাকুণ্ডু"
        ]
    },
    {
        "id": "magura",
        "nameEn": "Magura",
        "nameBn": "মাগুরা",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.4873,
        "lng": 89.4199,
        "aezEn": "AEZ-11 High Ganges Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় প্লাবনভূমি",
        "riverEn": "Madhumati & Nabaganga",
        "riverBn": "মধুমতি ও নবগঙ্গা নদী",
        "riverDist": 390,
        "pondEn": "Spice & Litchi Irrigation Canal",
        "pondBn": "মসলা ও লিচু বাগান সেচ নালা",
        "pondDist": 150,
        "rainfall": 1720,
        "temp": 28.2,
        "water": 73,
        "ndvi": 0.72,
        "soilEn": "Silt-loam plain; high productivity for spice crops, onion, lentil, mustard & Hazari litchi.",
        "soilBn": "পলি-দোআঁশ সমভূমি · সুগন্ধি মসলা ফসল, পেঁয়াজ, ডাল, সরিষা ও ঐতিহ্যবাহী হাজারী লিচু।",
        "cropsEn": "Hazari Litchi, King Onion, Mustard, Lentil, Wheat",
        "cropsBn": "হাজারী লিচু, কিং পেঁয়াজ, সরিষা, মসুর ডাল, গম",
        "keywords": [
            "magura",
            "মাগুরা",
            "শ্রীপুর",
            "শালিখা",
            "মহম্মদপুর"
        ]
    },
    {
        "id": "narail",
        "nameEn": "Narail",
        "nameBn": "নড়াইল",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.1725,
        "lng": 89.5127,
        "aezEn": "AEZ-12 & AEZ-14 Low Ganges Beel Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১২ ও ১৪ নিম্ন গাঙ্গেয় বিল অববাহিকা",
        "riverEn": "Chitra & Madhumati",
        "riverBn": "চিত্রা ও মধুমতি নদী",
        "riverDist": 320,
        "pondEn": "Chitra River Agro Drainage Canal",
        "pondBn": "চিত্রা নদী কৃষি নিষ্কাশন খাল",
        "pondDist": 120,
        "rainfall": 1810,
        "temp": 28.2,
        "water": 78,
        "ndvi": 0.73,
        "soilEn": "Low-lying river & beel floodplain; strong Boro rice, mustard, betel leaf & pulse cultivation.",
        "soilBn": "চিত্রা ও মধুমতি নদী বেষ্টিত নিচু বিল অঞ্চল · বোরো ধান, সরিষা, মিষ্টি পান ও রবি ডাল।",
        "cropsEn": "Boro Rice, Tori Mustard, Betel Leaf, Khesari Pulses",
        "cropsBn": "বোরো ধান, টরি সরিষা, মিষ্টি পান, খেসারি ডাল",
        "keywords": [
            "narail",
            "নড়াইল",
            "লোহাগড়া",
            "কালিয়া",
            "চিত্রা"
        ]
    },
    {
        "id": "chuadanga",
        "nameEn": "Chuadanga",
        "nameBn": "চুয়াডাঙ্গা",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.6402,
        "lng": 88.8418,
        "aezEn": "AEZ-11 High Ganges Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় প্লাবনভূমি",
        "riverEn": "Mathabhanga River",
        "riverBn": "মাথাভাঙ্গা নদী",
        "riverDist": 480,
        "pondEn": "Corn-Belt Deep Irrigation Reservoir",
        "pondBn": "ভুট্টা হাব গভীর নলকূপ সেচ পুকুর",
        "pondDist": 190,
        "rainfall": 1480,
        "temp": 28.8,
        "water": 61,
        "ndvi": 0.69,
        "soilEn": "Warm calcareous sandy-loam; commercial hub for hybrid maize, dragon fruit, mango & winter vegetables.",
        "soilBn": "উষ্ণ চুনযুক্ত বেলে-দোআঁশ মাটি · ভুট্টার বাণিজ্যিক হাব, ড্রাগন ফল, আম ও আগাম শীতকালীন সবজি।",
        "cropsEn": "Hybrid Yellow Maize, Dragon Fruit, Himsagar Mango, Early Cabbage",
        "cropsBn": "হাইব্রিড হলুদ ভুট্টা, ড্রাগন ফল, হিমসাগর আম, আগাম বাঁধাকপি",
        "keywords": [
            "chuadanga",
            "চুয়াডাঙ্গা",
            "আলমডাঙ্গা",
            "দামুড়হুদা",
            "জীবননগর",
            "দর্শনা"
        ]
    },
    {
        "id": "meherpur",
        "nameEn": "Meherpur",
        "nameBn": "মেহেরপুর",
        "divisionEn": "Khulna",
        "divisionBn": "খুলনা",
        "lat": 23.7622,
        "lng": 88.6318,
        "aezEn": "AEZ-11 High Ganges Terrace",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১১ উচ্চ গাঙ্গেয় সোপান",
        "riverEn": "Bhairab River",
        "riverBn": "ভৈরব নদী",
        "riverDist": 510,
        "pondEn": "Bhairab Basin Vegetable Irrigation Pond",
        "pondBn": "ভৈরব অববাহিকা সবজি সেচ দিঘি",
        "pondDist": 200,
        "rainfall": 1450,
        "temp": 28.9,
        "water": 60,
        "ndvi": 0.68,
        "soilEn": "Well-drained loamy soil; renowned for mango, cauliflower, cabbage, wheat, lentil & maize.",
        "soilBn": "উন্নত নিষ্কাশিত দোআঁশ মাটি · বিখ্যাত হিমসাগর আম, আগাম ফুলকপি, বাঁধাকপি, গম ও ভুট্টা।",
        "cropsEn": "Export Mango, Early Cauliflower, Cabbage, Wheat, Lentil",
        "cropsBn": "রপ্তানিযোগ্য আম, আগাম ফুলকপি, বাঁধাকপি, গম, মসুর ডাল",
        "keywords": [
            "meherpur",
            "মেহেরপুর",
            "গাংনী",
            "মুজিবনগর"
        ]
    },
    {
        "id": "barishal",
        "nameEn": "Barishal",
        "nameBn": "বরিশাল",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.701,
        "lng": 90.3535,
        "aezEn": "AEZ-13 Ganges Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ গাঙ্গেয় জোয়ার-ভাটা প্লাবনভূমি",
        "riverEn": "Kirtankhola & Arial Khan",
        "riverBn": "কীর্তনখোলা ও আড়িয়াল খাঁ নদী",
        "riverDist": 290,
        "pondEn": "Bhimruli Floating Guava Canal",
        "pondBn": "ভিমরুলী ভাসমান পেয়ারা হাট খাল",
        "pondDist": 110,
        "rainfall": 2260,
        "temp": 27.9,
        "water": 86,
        "ndvi": 0.75,
        "soilEn": "Non-saline tidal freshwater basin; famous for floating guava gardens, Amra (hog plum), Aman & Boro rice.",
        "soilBn": "লবণমুক্ত মিঠাপানির জোয়ার-ভাটা প্লাবনভূমি · ভাসমান পেয়ারা বাজার (ভিমরুলী), আমড়া ও বালাম ধান।",
        "cropsEn": "Swarupkathi Guava, Barishal Amra (Hog Plum), Balam Rice, Betel Leaf",
        "cropsBn": "স্বরূপকাঠি পেয়ারা, বরিশালের আমড়া, ঐতিহ্যবাহী বালাম ধান, পান",
        "keywords": [
            "barishal",
            "barisal",
            "বরিশাল",
            "উজিরপুর",
            "বাবুগঞ্জ",
            "বাকেরগঞ্জ",
            "বানারীপাড়া",
            "গৌরনদী",
            "আগৈলঝাড়া",
            "মেহেন্দিগঞ্জ"
        ]
    },
    {
        "id": "patuakhali",
        "nameEn": "Patuakhali",
        "nameBn": "পটুয়াখালী",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.3596,
        "lng": 90.3299,
        "aezEn": "AEZ-13 Coastal Tidal Plain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ উপকূলীয় জোয়ার-ভাটা সমভূমি",
        "riverEn": "Payra & Lohalia River",
        "riverBn": "পায়রা ও লোহালিয়া নদী",
        "riverDist": 350,
        "pondEn": "Mungbean Delta Agro Canal",
        "pondBn": "মুগডাল ডেল্টা কৃষি সেচ খাঁড়ি",
        "pondDist": 140,
        "rainfall": 2590,
        "temp": 28.1,
        "water": 81,
        "ndvi": 0.7,
        "soilEn": "Coastal deltaic plain; top producer of mungbean, watermelon, sunflower & T. Aman rice.",
        "soilBn": "উপকূলীয় বদ্বীপ পলি সমভূমি · দেশের বৃহত্তম মুগডাল বেল্ট, মিষ্টি তরমুজ, সূর্যমুখী ও আমন ধান।",
        "cropsEn": "BARI Mungbean (#1 National Belt), Sweet Watermelon, Sunflower, T. Aman",
        "cropsBn": "বারি মুগডাল (দেশের শীর্ষ), মিষ্টি তরমুজ, সূর্যমুখী, রোপা আমন",
        "keywords": [
            "patuakhali",
            "পটুয়াখালী",
            "কলাপাড়া",
            "গলাচিপা",
            "বাউফল",
            "দুমকি",
            "মির্জাগঞ্জ",
            "কুয়াকাটা",
            "রাঙ্গাবালী"
        ]
    },
    {
        "id": "bhola",
        "nameEn": "Bhola",
        "nameBn": "ভোলা",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.6859,
        "lng": 90.6482,
        "aezEn": "AEZ-18 Young Meghna Estuarine Island",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৮ তরুণ মেঘনা মোহনা দ্বীপ",
        "riverEn": "Meghna & Tetulia Channel",
        "riverBn": "মেঘনা ও তেঁতুলিয়া চ্যানেল",
        "riverDist": 250,
        "pondEn": "Island Alluvial Sweetwater Reservoir",
        "pondBn": "দ্বীপের উর্বর পলল মিষ্টি পানির দিঘি",
        "pondDist": 115,
        "rainfall": 2480,
        "temp": 28.0,
        "water": 85,
        "ndvi": 0.74,
        "soilEn": "Nutrient-rich alluvial island; bumper yields of potato, chili, mustard, mungbean, betel nut & rice.",
        "soilBn": "দেশের বৃহত্তম দ্বীপের উর্বর পলল মাটি · গোলআলু, লাল মরিচ, সরিষা, মুগডাল, সুপারি ও ধান।",
        "cropsEn": "Potato, Red Chili, Mungbean, Betel Nut, Mustard, Buffalo Dairy Fodder",
        "cropsBn": "গোলআলু, লাল মরিচ, মুগডাল, সুপারি, সরিষা, মহিষের চারণ ঘাস",
        "keywords": [
            "bhola",
            "ভোলা",
            "চরফ্যাশন",
            "বোরহানউদ্দিন",
            "দৌলতখান",
            "লালমোহন",
            "তজুমদ্দিন",
            "মনপুরা"
        ]
    },
    {
        "id": "pirojpur",
        "nameEn": "Pirojpur",
        "nameBn": "পিরোজপুর",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.5791,
        "lng": 89.9759,
        "aezEn": "AEZ-13 & AEZ-14 Tidal & Peat Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ ও ১৪ জোয়ার-ভাটা ও পিট অববাহিকা",
        "riverEn": "Baleshwar & Swarupkathi",
        "riverBn": "বলেশ্বর ও স্বরূপকাঠি নদী",
        "riverDist": 280,
        "pondEn": "Floating Nursery Bed Waterway",
        "pondBn": "ভাসমান বেড চারা নার্সারি নালা",
        "pondDist": 95,
        "rainfall": 2340,
        "temp": 27.9,
        "water": 87,
        "ndvi": 0.76,
        "soilEn": "Floating bed (Dhap) seedling & guava/malta orchard belt with abundant fresh tidal creeks.",
        "soilBn": "ঐতিহ্যবাহী ভাসমান বেড চারা উৎপাদন (স্বরূপকাঠি) · পেয়ারা ও মাল্টা বাগান, প্রচুর জোয়ারের মিষ্টি পানি।",
        "cropsEn": "Dhap Seedlings (Floating Nursery), BARI Malta-1, Guava, Hog Plum",
        "cropsBn": "ভাসমান ধাপ চারা, বারি মাল্টা-১, পেয়ারা, আমড়া",
        "keywords": [
            "pirojpur",
            "পিরোজপুর",
            "স্বরূপকাঠি",
            "নেছারাবাদ",
            "মঠবাড়িয়া",
            "ভাণ্ডারিয়া",
            "নাজিরপুর",
            "কাউখালী",
            "ইন্দুরকানী"
        ]
    },
    {
        "id": "barguna",
        "nameEn": "Barguna",
        "nameBn": "বরগুনা",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.1592,
        "lng": 90.1256,
        "aezEn": "AEZ-13 Southern Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ দক্ষিণ জোয়ার-ভাটা প্লাবনভূমি",
        "riverEn": "Bishkhali & Payra River",
        "riverBn": "বিষখালী ও পায়রা নদী",
        "riverDist": 330,
        "pondEn": "Coastal Tidal Embankment Sweet Reservoir",
        "pondBn": "উপকূলীয় বেড়িবাঁধ মিষ্টি পানি সংরক্ষণাগার",
        "pondDist": 145,
        "rainfall": 2680,
        "temp": 28.1,
        "water": 79,
        "ndvi": 0.68,
        "soilEn": "Coastal tidal soil; suited for salt/submergence-tolerant rice, mungbean, groundnut & sunflower.",
        "soilBn": "উপকূলীয় জোয়ার-ভাটার মাটি · লবণ ও জলমগ্নতা সহনশীল ধান, মুগডাল, চিনাবাদাম ও সূর্যমুখী।",
        "cropsEn": "Submergence Rice (BRRI 52), Mungbean, Sunflower, Sweet Melon",
        "cropsBn": "জলমগ্নতাসহনশীল ধান (ব্রি ৫২), মুগডাল, সূর্যমুখী, বাঙ্গি",
        "keywords": [
            "barguna",
            "বরগুনা",
            "আমতলী",
            "পাথরঘাটা",
            "তালতলী",
            "বামনা",
            "বেতাগী"
        ]
    },
    {
        "id": "jhalokati",
        "nameEn": "Jhalokati",
        "nameBn": "ঝালকাঠি",
        "divisionEn": "Barishal",
        "divisionBn": "বরিশাল",
        "lat": 22.6406,
        "lng": 90.1987,
        "aezEn": "AEZ-13 Non-Saline Tidal Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-১৩ লবণমুক্ত জোয়ার-ভাটা প্লাবনভূমি",
        "riverEn": "Sugandha & Gabkhan Channel",
        "riverBn": "সুগন্ধা ও গাবখান চ্যানেল",
        "riverDist": 260,
        "pondEn": "Bhimruli Canal Interconnection Basin",
        "pondBn": "ভিমরুলী খাল সংযোগ মিষ্টি জলাশয়",
        "pondDist": 100,
        "rainfall": 2290,
        "temp": 27.9,
        "water": 86,
        "ndvi": 0.76,
        "soilEn": "Freshwater tidal clay-loam; ideal for floating guava (Bhimruli), hog plum, betel leaf & Aman rice.",
        "soilBn": "মিঠাপানির জোয়ার-ভাটা দোআঁশ এঁটেল মাটি · ভিমরুলীর পেয়ারা, সুমিষ্ট আমড়া, পান ও রোপা আমন।",
        "cropsEn": "Floating Guava, Amra (Hog Plum), Betel Leaf, T. Aman Rice",
        "cropsBn": "ভাসমান পেয়ারা, সুস্বাদু আমড়া, পান, রোপা আমন",
        "keywords": [
            "jhalokati",
            "jhalokathi",
            "ঝালকাঠি",
            "নলছিটি",
            "রাজাপুর",
            "কাঁঠালিয়া",
            "ভিমরুলী"
        ]
    },
    {
        "id": "sylhet",
        "nameEn": "Sylhet",
        "nameBn": "সিলেট",
        "divisionEn": "Sylhet",
        "divisionBn": "সিলেট",
        "lat": 24.8949,
        "lng": 91.8687,
        "aezEn": "AEZ-20 Eastern Surma-Kushiyara Floodplain",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২০ পূর্ব সুরমা-কুশিয়ারা প্লাবনভূমি",
        "riverEn": "Surma & Kushiyara River",
        "riverBn": "সুরমা ও কুশিয়ারা নদী",
        "riverDist": 380,
        "pondEn": "Surma Basin Tea & Citrus Waterway",
        "pondBn": "সুরমা অববাহিকা চা ও সাইট্রাস নালা",
        "pondDist": 150,
        "rainfall": 3850,
        "temp": 25.9,
        "water": 85,
        "ndvi": 0.8,
        "soilEn": "High-rainfall Surma basin & hillocks; suited for tea estates, citrus, Aman/Boro rice & winter vegetables.",
        "soilBn": "সুরমা অববাহিকা ও টিলার উচ্চ বৃষ্টিপাত যুক্ত মাটি · চা বাগান, সাতকড়া/লেবু, বোরো ধান ও সবজি।",
        "cropsEn": "Black Tea, Satkora (Citrus macroptera), Zara Lemon, Boro Rice",
        "cropsBn": "কালো চা, সাতকড়া, জারা লেবু, বোরো ধান",
        "keywords": [
            "sylhet",
            "সিলেট",
            "বিয়ানীবাজার",
            "গোলাপগঞ্জ",
            "জৈন্তাপুর",
            "গোয়াইনঘাট",
            "কোম্পানীগঞ্জ",
            "জাফলং",
            "বিশ্বনাথ"
        ]
    },
    {
        "id": "moulvibazar",
        "nameEn": "Moulvibazar",
        "nameBn": "মৌলভীবাজার",
        "divisionEn": "Sylhet",
        "divisionBn": "সিলেট",
        "lat": 24.4829,
        "lng": 91.7774,
        "aezEn": "AEZ-29 Northern & Eastern Hills & Haor",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২৯ উত্তর ও পূর্ব পাহাড় এবং হাওর",
        "riverEn": "Manu & Dhalai River",
        "riverBn": "মনু ও ধলাই নদী",
        "riverDist": 410,
        "pondEn": "Srimangal BTRI Tea Irrigation Reservoir",
        "pondBn": "শ্রীমঙ্গল বিটিআরআই চা সেচ লেক",
        "pondDist": 170,
        "rainfall": 3450,
        "temp": 25.7,
        "water": 83,
        "ndvi": 0.83,
        "soilEn": "Tea & pineapple capital of Bangladesh; acidic hillock loam & Hakaluki haor Boro rice.",
        "soilBn": "বাংলাদেশের চায়ের রাজধানী (শ্রীমঙ্গল) · আনারস, রাবার, হাকালুকি হাওরের বোরো ধান ও মিষ্টি লেবু।",
        "cropsEn": "Premium Tea (Srimangal Capital), Calendar Pineapple, Rubber, Hakaluki Boro Rice",
        "cropsBn": "প্রিমিয়াম চা (শ্রীমঙ্গল রাজধানী), ক্যালেন্ডার আনারস, রাবার, হাকালুকির বোরো ধান",
        "keywords": [
            "moulvibazar",
            "maulvibazar",
            "মৌলভীবাজার",
            "srimangal",
            "শ্রীমঙ্গল",
            "কুলাউড়া",
            "কমলগঞ্জ",
            "জুড়ী",
            "বড়লেখা",
            "হাকালুকি"
        ]
    },
    {
        "id": "habiganj",
        "nameEn": "Habiganj",
        "nameBn": "হবিগঞ্জ",
        "divisionEn": "Sylhet",
        "divisionBn": "সিলেট",
        "lat": 24.3749,
        "lng": 91.4155,
        "aezEn": "AEZ-20 & AEZ-21 Surma-Haor Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২০ ও ২১ সুরমা-হাওর অববাহিকা",
        "riverEn": "Khowai & Kushiyara River",
        "riverBn": "খোয়াই ও কুশিয়ারা নদী",
        "riverDist": 390,
        "pondEn": "Khowai Riverine Agro Water Basin",
        "pondBn": "খোয়াই নদী কৃষি সেচ অববাহিকা",
        "pondDist": 160,
        "rainfall": 2950,
        "temp": 26.3,
        "water": 84,
        "ndvi": 0.78,
        "soilEn": "Dual ecosystem of tea hills and rich haor plains; strong Boro/Aman rice, tea & lemon yields.",
        "soilBn": "চা বাগান ও বিস্তীর্ণ হাওর বাস্তুতন্ত্র · প্রচুর পৃষ্ঠীয় মিঠা পানি · উচ্চফলনশীল বোরো ধান ও লেবু।",
        "cropsEn": "Tea, Boro Rice, Kagzi Lemon, Summer Vegetables",
        "cropsBn": "চা, বোরো ধান, কাগজি লেবু, গ্রীষ্মকালীন সবজি",
        "keywords": [
            "habiganj",
            "হবিগঞ্জ",
            "নবীগঞ্জ",
            "বাহুবল",
            "মাধবপুর",
            "চুনারুঘাট",
            "বানিয়াচং",
            "আজমিরীগঞ্জ"
        ]
    },
    {
        "id": "sunamganj",
        "nameEn": "Sunamganj",
        "nameBn": "সুনামগঞ্জ",
        "divisionEn": "Sylhet",
        "divisionBn": "সিলেট",
        "lat": 25.0658,
        "lng": 91.395,
        "aezEn": "AEZ-21 Sylhet Haor Basin",
        "aezBn": "কৃষি পরিবেশ অঞ্চল-২১ সিলেট হাওর অববাহিকা",
        "riverEn": "Surma & Jadukata River",
        "riverBn": "সুরমা ও যাদুকাটা নদী",
        "riverDist": 280,
        "pondEn": "Tanguar Haor Wetland Channel",
        "pondBn": "টাঙ্গুয়ার হাওর জলাভূমি চ্যানেল",
        "pondDist": 90,
        "rainfall": 4120,
        "temp": 25.8,
        "water": 92,
        "ndvi": 0.77,
        "soilEn": "Deep haor wetland ecosystem; crucial early-maturing Boro rice (BRRI dhan88/96) & freshwater fishery zone.",
        "soilBn": "টাঙ্গুয়ার হাওরসহ গভীর হাওর অঞ্চল · স্বল্পমেয়াদী আগাম বোরো ধান (ব্রি ধান৮৮/৯৬) ও দেশীয় মাছের রাজ্য।",
        "cropsEn": "Early Flash-Flood Escaping Boro Rice (BRRI 88/96), Freshwater Indigenous Fish, Duck Farming",
        "cropsBn": "আগাম বন্যা সহনশীল বোরো ধান (ব্রি ৮৮/৯৬), দেশীয় মিঠাপানির মাছ, হাঁস পালন",
        "keywords": [
            "sunamganj",
            "সুনামগঞ্জ",
            "তাহিরপুর",
            "ধর্মপাশা",
            "শাল্লা",
            "দিরাই",
            "জগন্নাথপুর",
            "দোয়ারাবাজার",
            "টাঙ্গুয়ার"
        ]
    }
];

    /*
    |--------------------------------------------------------------------------
    | POPULAR BANGLADESH AGRICULTURAL & RESEARCH HUBS
    |--------------------------------------------------------------------------
    */
    const BD_POPULAR_HUBS = [
    {
        "id": "hub_bakshibazar",
        "nameEn": "Field Shift • Bakshibazar, Dhaka",
        "nameBn": "ফিল্ড শিফট • বকশীবাজার, ঢাকা",
        "subtitleEn": "Lalbagh, Old Dhaka Division",
        "subtitleBn": "লালবাগ, পুরান ঢাকা",
        "lat": 23.7231,
        "lng": 90.3956,
        "parentZillaId": "dhaka",
        "riverEn": "Buriganga River",
        "riverBn": "বুড়িগঙ্গা নদী",
        "riverDist": 850,
        "pondEn": "Lalbagh Waterbody / Tank",
        "pondBn": "লালবাগ জলাশয়",
        "pondDist": 480,
        "keywords": [
            "bakshibazar",
            "dhaka",
            "lalbagh",
            "old dhaka",
            "বকশীবাজার",
            "ঢাকা",
            "orphanage road"
        ]
    },
    {
        "id": "hub_du",
        "nameEn": "Field Shift • Dhaka University / Shahbagh",
        "nameBn": "ফিল্ড শিফট • ঢাকা বিশ্ববিদ্যালয় / শাহবাগ",
        "subtitleEn": "Ramna / Shahbagh, Dhaka",
        "subtitleBn": "রমনা / শাহবাগ, ঢাকা",
        "lat": 23.734,
        "lng": 90.3928,
        "parentZillaId": "dhaka",
        "riverEn": "Buriganga River",
        "riverBn": "বুড়িগঙ্গা নদী",
        "riverDist": 1420,
        "pondEn": "Curzon Hall Botanical Pond",
        "pondBn": "কার্জন হল বোটানিক্যাল পুকুর",
        "pondDist": 310,
        "keywords": [
            "dhaka university",
            "shahbagh",
            "du",
            "curzon hall",
            "ঢাকা বিশ্ববিদ্যালয়",
            "শাহবাগ"
        ]
    },
    {
        "id": "hub_savar",
        "nameEn": "Field Shift • Savar Agri Hub",
        "nameBn": "ফিল্ড শিফট • সাভার কৃষি হাব",
        "subtitleEn": "Savar, Dhaka Division",
        "subtitleBn": "সাভার, ঢাকা",
        "lat": 23.8583,
        "lng": 90.2667,
        "parentZillaId": "dhaka",
        "riverEn": "Bangshi River",
        "riverBn": "বংশী নদী",
        "riverDist": 510,
        "pondEn": "Savar Horticulture Canal",
        "pondBn": "সাভার উদ্যান সেচ নালা",
        "pondDist": 180,
        "keywords": [
            "savar",
            "dhaka",
            "সাভার",
            "জাতীয় স্মৃতিসৌধ",
            "নবীনগর"
        ]
    },
    {
        "id": "hub_dhamrai",
        "nameEn": "Field Shift • Dhamrai Horticulture",
        "nameBn": "ফিল্ড শিফট • ধামরাই উদ্যান কৃষি",
        "subtitleEn": "Dhamrai, Dhaka Division",
        "subtitleBn": "ধামরাই, ঢাকা",
        "lat": 23.9167,
        "lng": 90.2167,
        "parentZillaId": "dhaka",
        "riverEn": "Gazikhali River",
        "riverBn": "গাজীখালী নদী",
        "riverDist": 430,
        "pondEn": "Dhamrai Agro Reservoir",
        "pondBn": "ধামরাই কৃষি জলাশয়",
        "pondDist": 170,
        "keywords": [
            "dhamrai",
            "ধামরাই"
        ]
    },
    {
        "id": "hub_trishal",
        "nameEn": "Field Shift • Trishal, Mymensingh",
        "nameBn": "ফিল্ড শিফট • ত্রিশাল, ময়মনসিংহ",
        "subtitleEn": "Sutia Basin, Mymensingh",
        "subtitleBn": "সুতিয়া অববাহিকা, ত্রিশাল",
        "lat": 24.5826,
        "lng": 90.3948,
        "parentZillaId": "mymensingh",
        "riverEn": "Sutia & Old Brahmaputra",
        "riverBn": "সুতিয়া ও পুরাতন ব্রহ্মপুত্র",
        "riverDist": 490,
        "pondEn": "Fishery Research Canal",
        "pondBn": "মৎস্য গবেষণা সেচ খাল",
        "pondDist": 115,
        "keywords": [
            "trishal",
            "ত্রিশাল",
            "নজরুল বিশ্ববিদ্যালয়",
            "মাছের খামার"
        ]
    },
    {
        "id": "hub_haluaghat",
        "nameEn": "Field Shift • Haluaghat Border Plain",
        "nameBn": "ফিল্ড শিফট • হালুয়াঘাট সমভূমি",
        "subtitleEn": "Garo Hills Foothills, Mymensingh",
        "subtitleBn": "গারো পাহাড় পাদদেশ, হালুয়াঘাট",
        "lat": 25.1245,
        "lng": 90.3524,
        "parentZillaId": "mymensingh",
        "riverEn": "Kongsa Tributary",
        "riverBn": "কংস শাখা নদী",
        "riverDist": 560,
        "pondEn": "Foothills Irrigation Creek",
        "pondBn": "পাদদেশীয় পাহাড়ি ছড়া",
        "pondDist": 180,
        "keywords": [
            "haluaghat",
            "হালুয়াঘাট"
        ]
    },
    {
        "id": "hub_muktagachha",
        "nameEn": "Field Shift • Muktagachha",
        "nameBn": "ফিল্ড শিফট • মুক্তাগাছা",
        "subtitleEn": "Mymensingh Division",
        "subtitleBn": "মুক্তাগাছা, ময়মনসিংহ",
        "lat": 24.7583,
        "lng": 90.2667,
        "parentZillaId": "mymensingh",
        "riverEn": "Aiman River",
        "riverBn": "আয়মান নদী",
        "riverDist": 480,
        "pondEn": "Muktagachha Monda Basin",
        "pondBn": "মুক্তাগাছা কৃষি পুকুর",
        "pondDist": 140,
        "keywords": [
            "muktagachha",
            "muktagacha",
            "মুক্তাগাছা"
        ]
    },
    {
        "id": "hub_srimangal",
        "nameEn": "Field Shift • Srimangal Tea Belt",
        "nameBn": "ফিল্ড শিফট • শ্রীমঙ্গল চা বেল্ট",
        "subtitleEn": "BTRI Hills, Moulvibazar",
        "subtitleBn": "বিটিআরআই টিলা, শ্রীমঙ্গল",
        "lat": 24.3065,
        "lng": 91.7296,
        "parentZillaId": "moulvibazar",
        "riverEn": "Bilash River",
        "riverBn": "বিলাস নদী",
        "riverDist": 410,
        "pondEn": "BTRI Tea Irrigation Lake",
        "pondBn": "বিটিআরআই চা সেচ লেক",
        "pondDist": 170,
        "keywords": [
            "srimangal",
            "shreemangal",
            "শ্রীমঙ্গল",
            "চা বাগান",
            "btri"
        ]
    },
    {
        "id": "hub_ishwardi",
        "nameEn": "Field Shift • Ishwardi Agri Hub",
        "nameBn": "ফিল্ড শিফট • ঈশ্বরদী কৃষি হাব",
        "subtitleEn": "Padma Basin, Pabna",
        "subtitleBn": "পদ্মা অববাহিকা, ঈশ্বরদী",
        "lat": 24.1294,
        "lng": 89.0655,
        "parentZillaId": "pabna",
        "riverEn": "Padma River",
        "riverBn": "পদ্মা নদী",
        "riverDist": 530,
        "pondEn": "BSRI Sugarcane Reservoir",
        "pondBn": "ইক্ষু গবেষণা সেচ জলাশয়",
        "pondDist": 160,
        "keywords": [
            "ishwardi",
            "ishurdi",
            "ঈশ্বরদী",
            "লিচু বাগান",
            "আখ গবেষণা"
        ]
    },
    {
        "id": "hub_gadkhali",
        "nameEn": "Field Shift • Gadkhali Flower Zone",
        "nameBn": "ফিল্ড শিফট • গদখালি ফুল জোন",
        "subtitleEn": "Jhikargachha, Jashore",
        "subtitleBn": "ঝিকরগাছা, যশোর",
        "lat": 23.0333,
        "lng": 89.0833,
        "parentZillaId": "jashore",
        "riverEn": "Kapotaksha River",
        "riverBn": "কপোতাক্ষ নদী",
        "riverDist": 490,
        "pondEn": "Floriculture Drip Pond",
        "pondBn": "ফুল চাষ ড্রিপ সেচ পুকুর",
        "pondDist": 130,
        "keywords": [
            "gadkhali",
            "godkhali",
            "গদখালি",
            "ফুল চাষ",
            "ঝিকরগাছা"
        ]
    },
    {
        "id": "hub_bhimruli",
        "nameEn": "Field Shift • Bhimruli Floating Market",
        "nameBn": "ফিল্ড শিফট • ভিমরুলী ভাসমান বাজার",
        "subtitleEn": "Guava & Hog Plum Belt, Jhalokati",
        "subtitleBn": "পেয়ারা ও আমড়া বেল্ট, ঝালকাঠি",
        "lat": 22.6841,
        "lng": 90.1342,
        "parentZillaId": "jhalokati",
        "riverEn": "Gabkhan & Kirtankhola Canal",
        "riverBn": "গাবখান ও কীর্তনখোলা চ্যানেল",
        "riverDist": 220,
        "pondEn": "Floating Orchard Tidal Creek",
        "pondBn": "ভাসমান বাগান জোয়ারের খাঁড়ি",
        "pondDist": 85,
        "keywords": [
            "bhimruli",
            "ভিমরুলী",
            "ভাসমান বাজার",
            "পেয়ারা বাগান"
        ]
    },
    {
        "id": "hub_beanibazar",
        "nameEn": "Field Shift • Beanibazar Haor Hub",
        "nameBn": "ফিল্ড শিফট • বিয়ানীবাজার হাওর হাব",
        "subtitleEn": "Surma Basin, Sylhet",
        "subtitleBn": "সুরমা অববাহিকা, বিয়ানীবাজার",
        "lat": 24.825,
        "lng": 92.1611,
        "parentZillaId": "sylhet",
        "riverEn": "Kushiyara River",
        "riverBn": "কুশিয়ারা নদী",
        "riverDist": 390,
        "pondEn": "Haor Floodplain Channel",
        "pondBn": "হাওর প্লাবনভূমি নালা",
        "pondDist": 140,
        "keywords": [
            "beanibazar",
            "বিয়ানীবাজার",
            "কুশিয়ারা"
        ]
    },
    {
        "id": "hub_sherpur_bogra",
        "nameEn": "Field Shift • Sherpur, Bogura",
        "nameBn": "ফিল্ড শিফট • শেরপুর, বগুড়া",
        "subtitleEn": "Karatoya Plain, Bogura",
        "subtitleBn": "করতোয়া সমভূমি, শেরপুর বগুড়া",
        "lat": 24.6736,
        "lng": 89.4183,
        "parentZillaId": "bogura",
        "riverEn": "Karatoya River",
        "riverBn": "করতোয়া নদী",
        "riverDist": 430,
        "pondEn": "Agro-Feed Irrigation Reservoir",
        "pondBn": "কৃষি ফিড সেচ জলাশয়",
        "pondDist": 150,
        "keywords": [
            "sherpur bogura",
            "sherpur bogra",
            "শেরপুর বগুড়া"
        ]
    },
    {
        "id": "hub_mirpur",
        "nameEn": "Field Shift • Mirpur Urban Zone",
        "nameBn": "ফিল্ড শিফট • মিরপুর নগর জোন",
        "subtitleEn": "Dhaka North, Dhaka Division",
        "subtitleBn": "মিরপুর, ঢাকা",
        "lat": 23.8071,
        "lng": 90.3686,
        "parentZillaId": "dhaka",
        "riverEn": "Turag River",
        "riverBn": "তুরাগ নদী",
        "riverDist": 780,
        "pondEn": "Botanical Garden Lake Reservoir",
        "pondBn": "বোটানিক্যাল গার্ডেন লেক",
        "pondDist": 290,
        "keywords": [
            "mirpur",
            "মিরপুর",
            "মিরপুর ১০",
            "মিরপুর ১"
        ]
    },
    {
        "id": "hub_uttara",
        "nameEn": "Field Shift • Uttara Urban Zone",
        "nameBn": "ফিল্ড শিফট • উত্তরা নগর জোন",
        "subtitleEn": "Dhaka North, Dhaka Division",
        "subtitleBn": "উত্তরা, ঢাকা",
        "lat": 23.8759,
        "lng": 90.3795,
        "parentZillaId": "dhaka",
        "riverEn": "Turag River",
        "riverBn": "তুরাগ নদী",
        "riverDist": 910,
        "pondEn": "Uttara Lake Park Basin",
        "pondBn": "উত্তরা লেক পার্ক জলাশয়",
        "pondDist": 240,
        "keywords": [
            "uttara",
            "উত্তরা",
            "দিয়াবাড়ী"
        ]
    }
];

    // Fast Lookup Map for O(1) Access
    const ZILLA_MAP = new Map(BD_64_ZILLAS_DATA.map(z => [z.id, z]));

    /*
    |--------------------------------------------------------------------------
    | HAVERSINE SPHERICAL DISTANCE & NEAREST ZILLA INFERENCE ENGINE
    |--------------------------------------------------------------------------
    */
    function calculateSphericalDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function findNearestZilla(lat, lng) {
        let nearest = BD_64_ZILLAS_DATA[0];
        let minDist = Infinity;
        for (let i = 0; i < BD_64_ZILLAS_DATA.length; i++) {
            const z = BD_64_ZILLAS_DATA[i];
            const dist = calculateSphericalDistance(lat, lng, z.lat, z.lng);
            if (dist < minDist) {
                minDist = dist;
                nearest = z;
            }
        }
        return { zilla: nearest, distance: minDist };
    }

    function inferGeographicAttributes(lat, lng, customTitleEn = null, customTitleBn = null) {
        // 1. Check if coordinates match a popular hub (< 1500m)
        for (const h of BD_POPULAR_HUBS) {
            const d = calculateSphericalDistance(lat, lng, h.lat, h.lng);
            if (d < 1500) {
                const pz = ZILLA_MAP.get(h.parentZillaId) || BD_64_ZILLAS_DATA[0];
                return {
                    id: h.id,
                    parentZillaId: pz.id,
                    nameEn: customTitleEn || h.nameEn,
                    nameBn: customTitleBn || h.nameBn,
                    subtitleEn: `${h.subtitleEn} · ${pz.aezEn}`,
                    subtitleBn: `${h.subtitleBn} · ${pz.aezBn}`,
                    lat: lat,
                    lng: lng,
                    aezEn: pz.aezEn,
                    aezBn: pz.aezBn,
                    riverEn: h.riverEn || pz.riverEn,
                    riverBn: h.riverBn || pz.riverBn,
                    riverDist: h.riverDist || pz.riverDist,
                    pondEn: h.pondEn || pz.pondEn,
                    pondBn: h.pondBn || pz.pondBn,
                    pondDist: h.pondDist || pz.pondDist,
                    rainfall: pz.rainfall,
                    temp: pz.temp,
                    water: pz.water,
                    ndvi: pz.ndvi,
                    soilEn: pz.soilEn,
                    soilBn: pz.soilBn,
                    cropsEn: pz.cropsEn,
                    cropsBn: pz.cropsBn
                };
            }
        }

        // 2. Find nearest parent district among all 64 Zillas
        const { zilla, distance } = findNearestZilla(lat, lng);

        // If directly at the district headquarters (< 2000m), return clean district ground truth
        if (distance < 2000) {
            return {
                id: zilla.id,
                parentZillaId: zilla.id,
                nameEn: customTitleEn || `Field Shift • ${zilla.nameEn}`,
                nameBn: customTitleBn || `ফিল্ড শিফট • ${zilla.nameBn}`,
                subtitleEn: `${zilla.divisionEn} Division · ${zilla.aezEn}`,
                subtitleBn: `${zilla.divisionBn} বিভাগ · ${zilla.aezBn}`,
                lat: lat,
                lng: lng,
                aezEn: zilla.aezEn,
                aezBn: zilla.aezBn,
                riverEn: zilla.riverEn,
                riverBn: zilla.riverBn,
                riverDist: zilla.riverDist,
                pondEn: zilla.pondEn,
                pondBn: zilla.pondBn,
                pondDist: zilla.pondDist,
                rainfall: zilla.rainfall,
                temp: zilla.temp,
                water: zilla.water,
                ndvi: zilla.ndvi,
                soilEn: zilla.soilEn,
                soilBn: zilla.soilBn,
                cropsEn: zilla.cropsEn,
                cropsBn: zilla.cropsBn
            };
        }

        // 3. Sub-Area / Village / Road: Apply realistic micro-variations based on coordinate offsets
        const latOffset = (lat - zilla.lat);
        const lngOffset = (lng - zilla.lng);

        const rainfall = Math.max(1100, Math.min(4500, Math.round(zilla.rainfall + (latOffset * 48) + (lngOffset * 72))));
        const temp = parseFloat(Math.max(20, Math.min(38, zilla.temp - (latOffset * 0.32) + (lng < 89 ? 0.3 : -0.2))).toFixed(1));
        const water = Math.max(40, Math.min(98, Math.round(zilla.water + (lngOffset * 2.2) - (temp - zilla.temp) * 2.2)));
        const ndvi = parseFloat(Math.max(0.35, Math.min(0.88, (zilla.ndvi + (water > 75 ? 0.02 : -0.02))).toFixed(2)));

        const riverDist = Math.max(220, Math.min(3500, Math.round(zilla.riverDist + (Math.abs(latOffset) * 6000))));
        const pondDist = Math.max(80, Math.min(550, Math.round(zilla.pondDist + (Math.abs(Math.sin(lat * 40) + Math.cos(lng * 40)) * 50))));

        return {
            id: zilla.id,
            parentZillaId: zilla.id,
            nameEn: customTitleEn || `Field Shift • Plot (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
            nameBn: customTitleBn || `ফিল্ড শিফট • প্লট (${lat.toFixed(4)}°উ, ${lng.toFixed(4)}°পূ)`,
            subtitleEn: `${zilla.divisionEn} Division · ${zilla.aezEn}`,
            subtitleBn: `${zilla.divisionBn} বিভাগ · ${zilla.aezBn}`,
            lat: lat,
            lng: lng,
            aezEn: zilla.aezEn,
            aezBn: zilla.aezBn,
            riverEn: zilla.riverEn,
            riverBn: zilla.riverBn,
            riverDist: riverDist,
            pondEn: zilla.pondEn,
            pondBn: zilla.pondBn,
            pondDist: pondDist,
            rainfall: rainfall,
            temp: temp,
            water: water,
            ndvi: ndvi,
            soilEn: zilla.soilEn,
            soilBn: zilla.soilBn,
            cropsEn: zilla.cropsEn,
            cropsBn: zilla.cropsBn
        };
    }

    /*
    |--------------------------------------------------------------------------
    | POLYGON SIZING (ACRES / BIGHA / KATHA / DECIMAL)
    |--------------------------------------------------------------------------
    */
    function calculateFieldBounds(lat, lng, areaValue, unit) {
        let areaSqMeters = 101171; // default 25 acres

        const val = parseFloat(areaValue) || 25;
        switch (unit) {
            case 'acre':
                areaSqMeters = val * 4046.86;
                break;
            case 'bigha':
                areaSqMeters = val * 1337.8;
                break;
            case 'katha':
                areaSqMeters = val * 66.89;
                break;
            case 'decimal':
            case 'dec':
                areaSqMeters = val * 40.47;
                break;
            default:
                areaSqMeters = val * 4046.86;
        }

        const sideMeters = Math.sqrt(areaSqMeters);
        const halfSide = sideMeters / 2;

        const dLat = halfSide / 111320;
        const dLng = halfSide / (111320 * Math.cos(lat * Math.PI / 180));

        return [
            [lat + dLat, lng - dLng],
            [lat + dLat, lng + dLng],
            [lat - dLat, lng + dLng],
            [lat - dLat, lng - dLng]
        ];
    }

    function formatFieldAreaString(val, unit, isBn) {
        const num = parseFloat(val) || 25;
        let acres = num;
        let bigha = num * 3;

        if (unit === 'bigha') {
            bigha = num;
            acres = (num / 3);
        } else if (unit === 'katha') {
            bigha = (num / 20);
            acres = (num / 60);
        } else if (unit === 'decimal') {
            acres = (num / 100);
            bigha = (acres * 3);
        }

        const acresFormatted = acres < 1 ? acres.toFixed(2) : (acres % 1 === 0 ? acres.toFixed(0) : acres.toFixed(1));
        const bighaFormatted = bigha < 1 ? bigha.toFixed(2) : (bigha % 1 === 0 ? bigha.toFixed(0) : bigha.toFixed(1));

        if (isBn) {
            return `${acresFormatted} একর (${bighaFormatted} বিঘা)`;
        }
        return `${acresFormatted} Acres (${bighaFormatted} Bigha)`;
    }

    /*
    |--------------------------------------------------------------------------
    | MAP INITIALIZATION
    |--------------------------------------------------------------------------
    */
    function initializeFarmMap() {
        const mapContainer = document.getElementById("farmMap") || document.getElementById("map");
        if (!mapContainer) return;

        currentLat = window.GLOBAL_FARM_CONFIG?.latitude || 24.7471;
        currentLng = window.GLOBAL_FARM_CONFIG?.longitude || 90.4203;

        // Leaflet Map with Esri World Imagery
        farmMap = L.map(mapContainer.id, {
            center: [currentLat, currentLng],
            zoom: 14,
            zoomControl: true,
            attributionControl: true
        });

        // Satellite Tile Layer
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                maxZoom: 19,
                attribution: "Tiles &copy; Esri &mdash; NASA, USDA, USGS, Earthstar Geographics"
            }
        ).addTo(farmMap);

        // Water Features Layer Group
        detectedWaterLayer = L.layerGroup().addTo(farmMap);

        // Initial Search Radius Circle
        updateSearchRadiusCircle(currentLat, currentLng, currentRadiusMeters);

        // Draggable Marker
        farmMarker = L.marker([currentLat, currentLng], {
            draggable: true,
            title: "Drag to select exact agricultural plot"
        }).addTo(farmMap);

        farmMarker.bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;color:#04160e;padding:2px 4px;">
                <strong style="color:#0f5132;font-size:13px;display:block;margin-bottom:3px;">Field Shift • Plot Target</strong>
                <span>Drag pin or click map to move target plot.</span>
            </div>
        `);

        // Farm Polygon Boundary
        const initialBounds = calculateFieldBounds(currentLat, currentLng, currentAreaAcres, currentAreaUnit);
        fieldPolygon = L.polygon(initialBounds, {
            color: "#2ed573",
            fillColor: "#2ed573",
            fillOpacity: 0.28,
            weight: 2.5
        }).addTo(farmMap);

        // Marker Drag Listener
        farmMarker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            handleLocationSelected(pos.lat, pos.lng, "Dragged Map Pin", "ম্যাপে পিন দ্বারা চিহ্নিত প্লট");
        });

        // Map Click Listener
        farmMap.on('click', function (e) {
            handleLocationSelected(e.latlng.lat, e.latlng.lng, "Clicked Map Location", "ম্যাপে ক্লিক করে নির্বাচিত প্লট");
        });

        // Setup DOM Listeners
        setup64ZillasDropdown();
        setupLocationSearchUI();
        setupPresetPills();
        setupControlBarInputs();

        // Initial Telemetry Sync
        syncTelemetryPanel(inferGeographicAttributes(currentLat, currentLng));

        // Invalidate map sizing after DOM stabilizes
        setTimeout(() => {
            if (farmMap) farmMap.invalidateSize();
        }, 200);
        setTimeout(() => {
            if (farmMap) farmMap.invalidateSize();
        }, 800);
        window.addEventListener('resize', () => {
            if (farmMap) farmMap.invalidateSize();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CIRCLE & POLYGON UPDATES
    |--------------------------------------------------------------------------
    */
    function updateSearchRadiusCircle(lat, lng, radiusMeters) {
        if (!farmMap) return;
        if (searchRadiusCircle) {
            farmMap.removeLayer(searchRadiusCircle);
        }
        searchRadiusCircle = L.circle([lat, lng], {
            radius: radiusMeters,
            color: "#2ed573",
            fillColor: "#2ed573",
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: "5, 6"
        }).addTo(farmMap);
    }

    function updateFieldPolygon(lat, lng) {
        if (!fieldPolygon || !farmMap) return;
        const val = parseFloat(document.getElementById("landSizeValue")?.value) || currentAreaAcres;
        const unit = document.getElementById("landSizeUnit")?.value || currentAreaUnit;
        const newBounds = calculateFieldBounds(lat, lng, val, unit);
        fieldPolygon.setLatLngs(newBounds);
    }

    /*
    |--------------------------------------------------------------------------
    | 64-ZILLAS INTERACTIVE DROPDOWN SELECTOR
    |--------------------------------------------------------------------------
    */
    function setup64ZillasDropdown() {
        const zillaSelect = document.getElementById("zillasDropdown");
        if (!zillaSelect) return;

        zillaSelect.addEventListener("change", function () {
            const zillaId = this.value;
            const zilla = ZILLA_MAP.get(zillaId);
            if (!zilla) return;

            const isBn = (window.currentAppLanguage === "bn");
            const searchInput = document.getElementById("mapSearchInput");
            if (searchInput) {
                searchInput.value = isBn ? zilla.nameBn : zilla.nameEn;
            }

            // Update active pill styling
            document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));

            handleLocationSelected(zilla.lat, zilla.lng, `Field Shift • ${zilla.nameEn}`, `ফিল্ড শিফট • ${zilla.nameBn}`);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION SELECTION DISPATCHER & GLOBAL PAGE ECOSYSTEM SYNC
    |--------------------------------------------------------------------------
    */
    function handleLocationSelected(lat, lng, sourceLabel = null, sourceLabelBn = null) {
        currentLat = parseFloat(lat);
        currentLng = parseFloat(lng);

        // Update coordinate input fields
        const latInput = document.getElementById("latitudeInput");
        const lngInput = document.getElementById("longitudeInput");
        if (latInput) latInput.value = currentLat.toFixed(6);
        if (lngInput) lngInput.value = currentLng.toFixed(6);

        // Fly smoothly to target plot
        if (farmMap) {
            farmMap.flyTo([currentLat, currentLng], 14, { duration: 1.2 });
        }

        // Move marker
        if (farmMarker) {
            farmMarker.setLatLng([currentLat, currentLng]);
        }

        // Update polygon & radius circle
        updateFieldPolygon(currentLat, currentLng);
        updateSearchRadiusCircle(currentLat, currentLng, currentRadiusMeters);

        // Infer geographic attributes & telemetry
        const geoAttr = inferGeographicAttributes(currentLat, currentLng, sourceLabel, sourceLabelBn);
        currentNameEn = geoAttr.nameEn;
        currentNameBn = geoAttr.nameBn;
        currentAezEn = geoAttr.aezEn;
        currentAezBn = geoAttr.aezBn;

        // 1. Update top-left Map HUD badge
        updateMapHUD(currentLat, currentLng, currentAezEn, currentAezBn);

        // 2. Trigger right-side telemetry update with 400ms scanning pulse
        syncTelemetryPanel(geoAttr);

        // 3. Sync 64-Zillas Dropdown if matching
        const zillaSelect = document.getElementById("zillasDropdown");
        if (zillaSelect) {
            if (geoAttr.parentZillaId && zillaSelect.querySelector(`option[value="${geoAttr.parentZillaId}"]`)) {
                zillaSelect.value = geoAttr.parentZillaId;
            } else if (geoAttr.id && zillaSelect.querySelector(`option[value="${geoAttr.id}"]`)) {
                zillaSelect.value = geoAttr.id;
            }
        }

        // 4. Sync with Global Farm Config
        if (window.GLOBAL_FARM_CONFIG) {
            window.GLOBAL_FARM_CONFIG.fieldName = currentNameEn;
            window.GLOBAL_FARM_CONFIG.fieldNameBn = currentNameBn;
            window.GLOBAL_FARM_CONFIG.coordinates = `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E`;
            window.GLOBAL_FARM_CONFIG.coordinatesBn = `${currentLat.toFixed(4)}° উ, ${currentLng.toFixed(4)}° পূ`;
            window.GLOBAL_FARM_CONFIG.latitude = currentLat;
            window.GLOBAL_FARM_CONFIG.longitude = currentLng;
        }

        // 5. Sync with Navbar Farmer Profile Pill
        const shortName = currentNameEn.replace("Field Shift • ", "").split(",")[0].trim();
        const shortNameBn = currentNameBn.replace("ফিল্ড শিফট • ", "").split(",")[0].trim();

        if (window.authService && window.authService.activeSession) {
            window.authService.activeSession.district = shortName;
            window.authService.updateNavbarBadge();
        } else {
            const farmerMeta = document.querySelector(".farmer-meta");
            if (farmerMeta) {
                const isBn = (window.currentAppLanguage === "bn");
                farmerMeta.innerHTML = `📍 ${isBn ? shortNameBn : shortName} • 25 ${isBn ? 'একর' : 'Acres'} (${isBn ? 'ধান' : 'Rice'})`;
            }
        }

        // 6. Sync with 7-Day Hyper-Local Weather Forecast
        if (typeof window.setWeatherLocation === 'function') {
            window.setWeatherLocation(currentLat, currentLng, currentNameEn, currentNameBn);
        }

        // 7. Sync with Climate Scenario Simulator Baseline & Dual-Line Chart
        if (typeof window.syncSimulatorToDistrict === 'function') {
            window.syncSimulatorToDistrict(geoAttr.rainfall, geoAttr.temp, geoAttr.water, geoAttr.soilEn);
        }

        // 8. Sync with 3D Farm Simulation Location Dropdown
        const farmLocSelect = document.getElementById("farmLocationSelect");
        if (farmLocSelect) {
            const targetKey = (geoAttr.parentZillaId || geoAttr.id || "").toLowerCase();
            const optionMatch = Array.from(farmLocSelect.options).find(opt => 
                opt.value.toLowerCase() === targetKey ||
                opt.textContent.toLowerCase().includes(shortName.toLowerCase()) ||
                opt.textContent.includes(shortNameBn)
            );
            if (optionMatch) {
                farmLocSelect.value = optionMatch.value;
                farmLocSelect.dispatchEvent(new Event("change"));
            }
        }

        // Background reverse geocoding to enrich name if clicked on an empty map spot
        if (!sourceLabel || sourceLabel.includes("Plot") || sourceLabel.includes("প্লট")) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLng}&zoom=18&addressdetails=1`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.address) {
                        const addr = data.address;
                        const place = addr.suburb || addr.neighbourhood || addr.village || addr.road || addr.county || addr.city || "Plot";
                        const district = addr.state_district || addr.district || addr.state || "Bangladesh";
                        currentNameEn = `Field Shift • ${place}, ${district}`;
                        currentNameBn = `ফিল্ড শিফট • ${place}, ${district}`;
                        const nameEl = document.getElementById("locationName");
                        if (nameEl) {
                            const isBn = (window.currentAppLanguage === "bn");
                            nameEl.textContent = isBn ? currentNameBn : currentNameEn;
                        }
                    }
                })
                .catch(() => {});
        }

        // Fetch live water features in background via Overpass API
        fetchOverpassWaterFeatures(currentLat, currentLng, currentRadiusMeters);
    }

    /*
    |--------------------------------------------------------------------------
    | SATELLITE HUD & TELEMETRY PANEL LIVE SYNC
    |--------------------------------------------------------------------------
    */
    function updateMapHUD(lat, lng, aezEn, aezBn) {
        const isBn = (window.currentAppLanguage === "bn");
        const coordsEl = document.getElementById("hudCoords");
        const aezEl = document.getElementById("hudAez");

        if (coordsEl) {
            coordsEl.textContent = isBn
                ? `${lat.toFixed(4)}° উ, ${lng.toFixed(4)}° পূ`
                : `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
        }
        if (aezEl) {
            aezEl.textContent = isBn ? (aezBn || aezEn) : aezEn;
        }
    }

    function syncTelemetryPanel(geoAttr) {
        const isBn = (window.currentAppLanguage === "bn");

        // 1. Scanning Pulse Effect (400ms visual feedback)
        const panelCards = document.querySelectorAll(
            "#geoCardLocation, #geoCardArea, #geoCardRiver, #geoCardPond, " +
            "#telemetryCardRain, #telemetryCardTemp, #telemetryCardWater, #telemetryCardVeg, #telemetryCardCondition"
        );
        panelCards.forEach(c => {
            c.classList.remove("telemetry-sync-pulse");
            void c.offsetWidth;
            c.classList.add("telemetry-sync-pulse");
        });

        // 2. Selected Land Title
        const locNameEl = document.getElementById("locationName");
        if (locNameEl) {
            locNameEl.textContent = isBn ? (geoAttr.nameBn || geoAttr.nameEn) : geoAttr.nameEn;
        }

        // 3. Coordinates
        const coordsEl = document.getElementById("coordinates");
        if (coordsEl) {
            coordsEl.textContent = isBn
                ? `${geoAttr.lat.toFixed(4)}° উ, ${geoAttr.lng.toFixed(4)}° পূ`
                : `${geoAttr.lat.toFixed(4)}° N, ${geoAttr.lng.toFixed(4)}° E`;
        }

        // 4. Field Area
        const areaVal = document.getElementById("landSizeValue")?.value || currentAreaAcres;
        const areaUnit = document.getElementById("landSizeUnit")?.value || currentAreaUnit;
        const fieldAreaEl = document.getElementById("fieldArea");
        if (fieldAreaEl) {
            fieldAreaEl.textContent = formatFieldAreaString(areaVal, areaUnit, isBn);
        }

        // 5. Nearest River
        const riverStatusEl = document.getElementById("riverStatus");
        const riverDistEl = document.getElementById("riverDistance");
        if (riverStatusEl) {
            riverStatusEl.textContent = isBn ? (geoAttr.riverBn || geoAttr.riverEn) : geoAttr.riverEn;
        }
        if (riverDistEl) {
            riverDistEl.textContent = isBn ? `${geoAttr.riverDist} মিটার দূরত্বে` : `${geoAttr.riverDist} m away`;
        }

        // 6. Nearest Pond / Basin
        const pondStatusEl = document.getElementById("pondStatus");
        const pondDistEl = document.getElementById("pondDistance");
        if (pondStatusEl) {
            pondStatusEl.textContent = isBn ? (geoAttr.pondBn || geoAttr.pondEn) : geoAttr.pondEn;
        }
        if (pondDistEl) {
            pondDistEl.textContent = isBn ? `${geoAttr.pondDist} মিটার দূরত্বে` : `${geoAttr.pondDist} m away`;
        }

        // 7. NASA Telemetry Metrics
        const rainEl = document.getElementById("rainfall");
        const tempEl = document.getElementById("temperature");
        const waterEl = document.getElementById("water");
        const vegEl = document.getElementById("vegIndex");
        const conditionEl = document.getElementById("fieldCondition");

        if (rainEl) rainEl.textContent = `${geoAttr.rainfall} mm`;
        if (tempEl) tempEl.textContent = `${geoAttr.temp}°C`;
        if (waterEl) waterEl.textContent = `${geoAttr.water}%`;
        if (vegEl) vegEl.textContent = `${geoAttr.ndvi} NDVI`;

        if (conditionEl) {
            const desc = isBn ? (geoAttr.soilBn || geoAttr.soilEn) : geoAttr.soilEn;
            const crops = isBn ? (geoAttr.cropsBn || geoAttr.cropsEn) : geoAttr.cropsEn;
            conditionEl.textContent = crops ? `${desc} (অনুকূল ফসল / Crops: ${crops})` : desc;
        }

        // Update central farmData object if defined
        if (typeof farmData !== 'undefined') {
            farmData.location.latitude = geoAttr.lat;
            farmData.location.longitude = geoAttr.lng;
            farmData.location.name = geoAttr.nameEn;
            farmData.location.nameBn = geoAttr.nameBn;
            farmData.weather.rainfall = geoAttr.rainfall;
            farmData.weather.temperature = geoAttr.temp;
            farmData.geography.river.name = geoAttr.riverEn;
            farmData.geography.river.distance = geoAttr.riverDist;
            farmData.geography.pond.name = geoAttr.pondEn;
            farmData.geography.pond.distance = geoAttr.pondDist;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | OVERPASS API REAL WATERBODY RETRIEVAL
    |--------------------------------------------------------------------------
    */
    async function fetchOverpassWaterFeatures(lat, lng, radius) {
        if (!detectedWaterLayer) return;

        try {
            const query = `[out:json][timeout:4];(way["waterway"="river"](around:${radius},${lat},${lng});way["waterway"="stream"](around:${radius},${lat},${lng});way["natural"="water"](around:${radius},${lat},${lng});node["natural"="water"](around:${radius},${lat},${lng}););out geom;`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);

            const resp = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: query,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!resp.ok) return;
            const data = await resp.json();
            if (!data || !data.elements || data.elements.length === 0) return;

            detectedWaterLayer.clearLayers();

            data.elements.forEach(el => {
                if (el.geometry && el.geometry.length > 1) {
                    const pts = el.geometry.map(p => [p.lat, p.lon]);
                    const isRiver = (el.tags?.waterway === "river" || el.tags?.waterway === "stream");
                    const name = el.tags?.name || (isRiver ? "River / Stream" : "Waterbody");

                    if (isRiver) {
                        L.polyline(pts, {
                            color: "#38bdf8",
                            weight: 4,
                            opacity: 0.85
                        }).bindPopup(`<strong>${name}</strong>`).addTo(detectedWaterLayer);
                    } else {
                        L.polygon(pts, {
                            color: "#38bdf8",
                            fillColor: "#38bdf8",
                            fillOpacity: 0.35,
                            weight: 2
                        }).bindPopup(`<strong>${name}</strong>`).addTo(detectedWaterLayer);
                    }
                }
            });
        } catch (e) {
            // Overpass is optional; local fallback is already present
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FUZZY MULTI-ENGINE SEARCH (0ms Instant Local Match + Photon & Nominatim)
    |--------------------------------------------------------------------------
    */
    function setupLocationSearchUI() {
        const input = document.getElementById("mapSearchInput");
        const clearBtn = document.getElementById("mapSearchClearBtn");
        const spinner = document.getElementById("mapSearchSpinner");
        const dropdown = document.getElementById("mapSearchResults");

        if (!input || !dropdown) return;

        input.addEventListener("input", function () {
            const query = this.value.trim();
            if (clearBtn) clearBtn.style.display = query.length > 0 ? "flex" : "none";

            if (query.length < 2) {
                dropdown.style.display = "none";
                dropdown.innerHTML = "";
                return;
            }

            // 1. Execute local instant match immediately (0ms)
            performLocationSearch(query, true);

            // 2. Debounce online sub-area geocoding lookup
            clearTimeout(searchDebounceTimer);
            if (spinner) spinner.style.display = "block";

            searchDebounceTimer = setTimeout(() => {
                performLocationSearch(query, false);
            }, 300);
        });

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                input.value = "";
                clearBtn.style.display = "none";
                dropdown.style.display = "none";
                dropdown.innerHTML = "";
                input.focus();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
    }

    // Normalizes query string and resolves known alternate spellings
    function normalizeQueryTokens(q) {
        let norm = q.toLowerCase();
        // Common alternate transliterations
        norm = norm.replace(/chittagong/g, "chattogram")
                   .replace(/comilla/g, "cumilla")
                   .replace(/jessore/g, "jashore")
                   .replace(/bogra/g, "bogura")
                   .replace(/barisal/g, "barishal")
                   .replace(/cox's bazar/g, "coxs bazar")
                   .replace(/maulvibazar/g, "moulvibazar")
                   .replace(/khagrachari/g, "khagrachhari")
                   .replace(/laxmipur/g, "lakshmipur")
                   .replace(/jhalokathi/g, "jhalokati")
                   .replace(/nawabganj/g, "chapainawabganj");
        return norm;
    }

    async function performLocationSearch(query, localOnly = false) {
        const dropdown = document.getElementById("mapSearchResults");
        const spinner = document.getElementById("mapSearchSpinner");
        const qNorm = normalizeQueryTokens(query);
        const qLower = query.toLowerCase();
        const isBn = (window.currentAppLanguage === "bn");

        // -------------------------------------------------------------
        // ENGINE A: Instant Local Match (0ms Offline Guaranteed)
        // -------------------------------------------------------------
        // Search 64 Zillas
        const zillaMatches = BD_64_ZILLAS_DATA.filter(z => {
            if (z.nameEn.toLowerCase().includes(qLower) || z.nameEn.toLowerCase().includes(qNorm)) return true;
            if (z.nameBn.includes(query)) return true;
            if (z.divisionEn.toLowerCase().includes(qLower) || z.divisionBn.includes(query)) return true;
            return z.keywords.some(k => k.toLowerCase().includes(qLower) || k.toLowerCase().includes(qNorm) || k.includes(query));
        }).map(z => ({
            title: isBn ? z.nameBn : z.nameEn,
            subtitle: isBn ? `${z.divisionBn} বিভাগ · ${z.aezBn}` : `${z.divisionEn} Division · ${z.aezEn}`,
            lat: z.lat,
            lng: z.lng,
            nameEn: `Field Shift • ${z.nameEn}`,
            nameBn: `ফিল্ড শিফট • ${z.nameBn}`,
            isLocal: true,
            isZilla: true
        }));

        // Search Popular Sub-Hubs
        const hubMatches = BD_POPULAR_HUBS.filter(h => {
            if (h.nameEn.toLowerCase().includes(qLower) || h.nameEn.toLowerCase().includes(qNorm)) return true;
            if (h.nameBn.includes(query)) return true;
            return h.keywords.some(k => k.toLowerCase().includes(qLower) || k.toLowerCase().includes(qNorm) || k.includes(query));
        }).map(h => ({
            title: isBn ? h.nameBn : h.nameEn,
            subtitle: isBn ? h.subtitleBn : h.subtitleEn,
            lat: h.lat,
            lng: h.lng,
            nameEn: h.nameEn,
            nameBn: h.nameBn,
            isLocal: true,
            isZilla: false
        }));

        const localMatches = [...hubMatches, ...zillaMatches];
        localMatches.sort((a, b) => {
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const aNameEn = (a.nameEn || '').toLowerCase();
            const bNameEn = (b.nameEn || '').toLowerCase();

            // 1. Exact match
            const aExact = aTitle === qLower || aTitle === qNorm;
            const bExact = bTitle === qLower || bTitle === qNorm;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            // 2. Starts with query
            const aStarts = aTitle.startsWith(qLower) || aTitle.startsWith(qNorm) || aNameEn.startsWith(qLower) || aNameEn.startsWith(qNorm);
            const bStarts = bTitle.startsWith(qLower) || bTitle.startsWith(qNorm) || bNameEn.startsWith(qLower) || bNameEn.startsWith(qNorm);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // 3. Includes query in title or name
            const aDirect = aTitle.includes(qLower) || aTitle.includes(qNorm) || aNameEn.includes(qLower) || aNameEn.includes(qNorm);
            const bDirect = bTitle.includes(qLower) || bTitle.includes(qNorm) || bNameEn.includes(qLower) || bNameEn.includes(qNorm);
            if (aDirect && !bDirect) return -1;
            if (!aDirect && bDirect) return 1;

            return 0;
        });

        if (localMatches.length > 0) {
            renderSearchResults(localMatches);
        }

        if (localOnly) return;

        // -------------------------------------------------------------
        // ENGINE B: Sub-Area / Upazila / Village / Road Live Geocoder
        // -------------------------------------------------------------
        try {
            if (currentSearchAbortController) currentSearchAbortController.abort();
            currentSearchAbortController = new AbortController();
            const signal = currentSearchAbortController.signal;

            // Timeout after 2500ms so UI stays ultra snappy
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));

            // Photon Komoot API
            const photonPromise = fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query + ' Bangladesh')}&limit=6`, { signal })
                .then(r => r.ok ? r.json() : { features: [] })
                .catch(() => ({ features: [] }));

            // OpenStreetMap Nominatim API
            const nominatimPromise = fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bd&addressdetails=1&limit=6`, { signal })
                .then(r => r.ok ? r.json() : [])
                .catch(() => []);

            const [photonRes, nominatimRes] = await Promise.race([
                Promise.all([photonPromise, nominatimPromise]),
                timeoutPromise
            ]);

            const geocodedMatches = [];

            // Parse Photon features
            if (photonRes && photonRes.features) {
                photonRes.features.forEach(f => {
                    const props = f.properties || {};
                    const coords = f.geometry?.coordinates;
                    if (coords && coords.length >= 2) {
                        const lng = parseFloat(coords[0]);
                        const lat = parseFloat(coords[1]);
                        const name = props.name || props.street || props.city || query;
                        const sub = [props.district, props.state, "Bangladesh"].filter(Boolean).join(", ");
                        geocodedMatches.push({
                            title: name,
                            subtitle: sub,
                            lat: lat,
                            lng: lng,
                            nameEn: `Field Shift • ${name}`,
                            nameBn: `ফিল্ড শিফট • ${name}`,
                            isLocal: false
                        });
                    }
                });
            }

            // Parse Nominatim results
            if (Array.isArray(nominatimRes)) {
                nominatimRes.forEach(r => {
                    const title = r.display_name.split(",")[0].trim();
                    const sub = r.display_name.split(",").slice(1, 4).join(",").trim();
                    const lat = parseFloat(r.lat);
                    const lng = parseFloat(r.lon);
                    geocodedMatches.push({
                        title: title,
                        subtitle: sub,
                        lat: lat,
                        lng: lng,
                        nameEn: `Field Shift • ${title}`,
                        nameBn: `ফিল্ড শিফট • ${title}`,
                        isLocal: false
                    });
                });
            }

            // Deduplicate and merge with local matches
            const combined = [...localMatches];
            geocodedMatches.forEach(gm => {
                const isDup = combined.some(c =>
                    (Math.abs(c.lat - gm.lat) < 0.004 && Math.abs(c.lng - gm.lng) < 0.004) ||
                    (c.title.toLowerCase() === gm.title.toLowerCase())
                );
                if (!isDup) {
                    combined.push(gm);
                }
            });

            renderSearchResults(combined);

        } catch (e) {
            // If network timed out or failed, localMatches remain visible
        } finally {
            if (spinner) spinner.style.display = "none";
        }
    }

    function renderSearchResults(results) {
        const dropdown = document.getElementById("mapSearchResults");
        const isBn = (window.currentAppLanguage === "bn");
        if (!dropdown) return;

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 14px; color: #8da499; font-size: 13px; text-align: center;">
                    ${isBn ? 'কোনো ফলাফল পাওয়া যায়নি। বাংলাদেশের যেকোনো জেলা, উপজেলা বা গ্রাম লিখুন।' : 'No land results found. Try another district, upazila, or village in Bangladesh.'}
                </div>
            `;
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = results.slice(0, 10).map((r, idx) => `
            <div class="map-search-item" data-index="${idx}" data-lat="${r.lat}" data-lng="${r.lng}" data-name-en="${r.nameEn || r.title}" data-name-bn="${r.nameBn || r.title}">
                <span class="item-icon">${r.isZilla ? '🌾' : (r.isLocal ? '🌱' : '📍')}</span>
                <div class="item-details">
                    <span class="item-title">${r.title}</span>
                    <span class="item-subtitle">${r.subtitle || 'Bangladesh'}</span>
                </div>
            </div>
        `).join("");

        dropdown.style.display = "block";

        dropdown.querySelectorAll(".map-search-item").forEach(item => {
            item.addEventListener("click", function () {
                const lat = parseFloat(this.getAttribute("data-lat"));
                const lng = parseFloat(this.getAttribute("data-lng"));
                const nameEn = this.getAttribute("data-name-en");
                const nameBn = this.getAttribute("data-name-bn");

                const input = document.getElementById("mapSearchInput");
                if (input) input.value = isBn ? nameBn : nameEn;
                dropdown.style.display = "none";

                // Update active pill styling
                document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));

                handleLocationSelected(lat, lng, nameEn, nameBn);
            });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | QUICK-SWITCH PRESET PILLS & LIVE GPS BUTTON
    |--------------------------------------------------------------------------
    */
    function setupPresetPills() {
        const pills = document.querySelectorAll(".preset-pill:not(.gps-pill)");
        pills.forEach(pill => {
            pill.addEventListener("click", function () {
                pills.forEach(p => p.classList.remove("active"));
                this.classList.add("active");

                const lat = parseFloat(this.getAttribute("data-lat"));
                const lng = parseFloat(this.getAttribute("data-lng"));
                const nameEn = this.getAttribute("data-name");
                const nameBn = this.getAttribute("data-name-bn");

                const input = document.getElementById("mapSearchInput");
                if (input) input.value = "";

                handleLocationSelected(lat, lng, nameEn, nameBn);
            });
        });

        // "📍 My Live GPS" Button
        const gpsBtn = document.getElementById("btnLiveGps");
        if (gpsBtn) {
            gpsBtn.addEventListener("click", function () {
                const isBn = (window.currentAppLanguage === "bn");
                const label = this.querySelector(".pill-label");
                const originalText = label ? label.textContent : "My Live GPS";

                if (!navigator.geolocation) {
                    alert(isBn ? "আপনার ব্রাউজার জিপিএস সাপোর্ট করে না।" : "Geolocation is not supported by your browser.");
                    return;
                }

                if (label) label.textContent = isBn ? "শনাক্ত হচ্ছে..." : "Detecting GPS...";
                this.classList.add("active");

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        if (label) label.textContent = originalText;

                        document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
                        this.classList.add("active");

                        handleLocationSelected(lat, lng, "Live GPS Farm Location", "লাইভ জিপিএস খামার অবস্থান");
                    },
                    (err) => {
                        if (label) label.textContent = originalText;
                        this.classList.remove("active");
                        console.warn("[GPS Error]:", err);
                        alert(isBn
                            ? "জিপিএস অবস্থান শনাক্ত করা সম্ভব হয়নি। লোকেশন পারমিশন সক্রিয় রাখুন।"
                            : "Could not access GPS location. Please allow browser location access.");
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
                );
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BOTTOM CONTROL BAR INPUTS
    |--------------------------------------------------------------------------
    */
    function setupControlBarInputs() {
        const latInput = document.getElementById("latitudeInput");
        const lngInput = document.getElementById("longitudeInput");
        const landSizeInput = document.getElementById("landSizeValue");
        const landSizeUnitSelect = document.getElementById("landSizeUnit");
        const radiusSelect = document.getElementById("searchRadius");
        const analyzeBtn = document.getElementById("analyzeLand");

        // Custom Land Area Real-Time Polygon Scaling
        if (landSizeInput) {
            landSizeInput.addEventListener("input", () => {
                currentAreaAcres = parseFloat(landSizeInput.value) || 25;
                updateFieldPolygon(currentLat, currentLng);
                const fieldAreaEl = document.getElementById("fieldArea");
                if (fieldAreaEl) {
                    const isBn = (window.currentAppLanguage === "bn");
                    fieldAreaEl.textContent = formatFieldAreaString(currentAreaAcres, currentAreaUnit, isBn);
                }
            });
        }

        if (landSizeUnitSelect) {
            landSizeUnitSelect.addEventListener("change", function () {
                currentAreaUnit = this.value;
                updateFieldPolygon(currentLat, currentLng);
                const fieldAreaEl = document.getElementById("fieldArea");
                if (fieldAreaEl) {
                    const isBn = (window.currentAppLanguage === "bn");
                    fieldAreaEl.textContent = formatFieldAreaString(currentAreaAcres, currentAreaUnit, isBn);
                }
            });
        }

        // Search Radius Circle Real-Time Sizing
        if (radiusSelect) {
            radiusSelect.addEventListener("change", function () {
                currentRadiusMeters = parseInt(this.value, 10) || 1000;
                updateSearchRadiusCircle(currentLat, currentLng, currentRadiusMeters);
                analyzeCurrentLand();
            });
        }

        // Manual Latitude / Longitude Changes
        [latInput, lngInput].forEach(inp => {
            if (inp) {
                inp.addEventListener("change", () => {
                    const newLat = parseFloat(latInput?.value);
                    const newLng = parseFloat(lngInput?.value);
                    if (!isNaN(newLat) && !isNaN(newLng)) {
                        handleLocationSelected(newLat, newLng, "Coordinate Input", "স্থানাঙ্ক ইনপুট");
                    }
                });
            }
        });

        // "Analyze this land" Button
        if (analyzeBtn) {
            analyzeBtn.addEventListener("click", () => {
                analyzeCurrentLand();
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ANALYZE LAND WORKFLOW & SATELLITE SCAN LASER
    |--------------------------------------------------------------------------
    */
    async function analyzeCurrentLand() {
        const isBn = (window.currentAppLanguage === "bn");
        const scanOverlay = document.getElementById("mapScanningOverlay");
        const btn = document.getElementById("analyzeLand");

        if (scanOverlay) scanOverlay.style.display = "flex";
        if (btn) {
            btn.textContent = isBn ? "🛰️ নাসা স্ক্যানিং..." : "🛰️ NASA Scanning...";
            btn.disabled = true;
        }

        if (farmMap) farmMap.invalidateSize();
        if (farmMap) {
            farmMap.flyTo([currentLat, currentLng], 14, { duration: 0.9 });
        }

        try {
            await new Promise(r => setTimeout(r, 600));

            const geoAttr = inferGeographicAttributes(currentLat, currentLng);
            geoAttr.nameEn = currentNameEn;
            geoAttr.nameBn = currentNameBn;
            syncTelemetryPanel(geoAttr);

            await fetchOverpassWaterFeatures(currentLat, currentLng, currentRadiusMeters);

        } finally {
            setTimeout(() => {
                if (scanOverlay) scanOverlay.style.display = "none";
                if (btn) {
                    btn.textContent = isBn ? "জমি বিশ্লেষণ করুন" : "Analyze this land";
                    btn.disabled = false;
                }
            }, 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LANGUAGE CHANGE HANDLER
    |--------------------------------------------------------------------------
    */
    window.addEventListener("languageChanged", () => {
        updateMapHUD(currentLat, currentLng, currentAezEn, currentAezBn);
        const geoAttr = inferGeographicAttributes(currentLat, currentLng);
        geoAttr.nameEn = currentNameEn;
        geoAttr.nameBn = currentNameBn;
        syncTelemetryPanel(geoAttr);

        // Update placeholder of 64 zillas dropdown
        const zillaSelect = document.getElementById("zillasDropdown");
        if (zillaSelect && zillaSelect.options.length > 0) {
            const isBn = (window.currentAppLanguage === "bn");
            zillaSelect.options[0].textContent = isBn ? "🇧🇩 সকল ৬৪টি জেলা (Zilla) ▾" : "🇧🇩 All 64 Districts (Zillas) ▾";
        }
    });

    // Auto-init on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFarmMap);
    } else {
        initializeFarmMap();
    }

})();
