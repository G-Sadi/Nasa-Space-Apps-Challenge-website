/*
|--------------------------------------------------------------------------
| FIELD SHIFT — FARM DATA CONFIGURATION (js/data.js)
|--------------------------------------------------------------------------
| Single Source of Truth for Global Farm Metadata across Field Shift.
|--------------------------------------------------------------------------
*/

const farmData = {

    // Single source farm info
    farm: {
        name: "Field Shift"
    },

    // Field info
    field: {
        name: "Field Shift • Mymensingh - Field 02",
        shortName: "Field 02",
        area: 25,
        bigha: 75,
        decimals: 2500,
        unit: "Acres (75 Bigha)",
        displayArea: "25 Acres (75 Bigha)",
        displayAreaBn: "২৫ একর (৭৫ বিঘা)",
        boundary: [
            [24.7480, 90.4195],
            [24.7482, 90.4210],
            [24.7468, 90.4214],
            [24.7464, 90.4198]
        ]
    },

    location: {
        name: "Field Shift • Mymensingh - Field 02",
        nameBn: "ফিল্ড শিফট • ময়মনসিংহ - ফিল্ড ০২",
        latitude: 24.7471,
        longitude: 90.4203,
        coordinates: "24.7471° N, 90.4203° E",
        coordinatesBn: "২৪.৭৪৭১° উ, ৯০.৪২০৩° পূ",
        area: "25 Acres (75 Bigha)",
        areaBn: "২৫ একর (৭৫ বিঘা)",
        unit: "Acres (75 Bigha)"
    },

    farmer: {
        name: "মোঃ রহিম উদ্দিন (Rahim Uddin)",
        phone: "01711223344",
        district: "Mymensingh",
        landSizeDecimals: 2500,
        primaryCrop: "rice"
    },

    soil: {
        health: 72,
        moisture: 68,
        nitrogen: 64,
        phosphorus: 52,
        potassium: 48,
        ph: 6.5
    },

    weather: {
        temperature: 27.4,
        humidity: 74,
        rainfall: 1842,
        windSpeed: 12
    },

    geography: {
        river: {
            nearby: true,
            distance: 420,
            name: "Nearest River"
        },
        pond: {
            nearby: true,
            distance: 180,
            name: "Farm Pond"
        }
    },

    river: {
        nearby: true,
        distance: 420
    },
    pond: {
        nearby: true,
        distance: 180
    },

    crop: {
        current: "Rice",
        nameBn: "ধান",
        year: 2026,
        growth: 68,
        yieldPotential: 91
    }

};

// Global Farm Configuration — Single Source of Truth
window.GLOBAL_FARM_CONFIG = {
    farmerName: "মোঃ রহিম উদ্দিন (Rahim Uddin)",
    farmerNameBn: "মোঃ রহিম উদ্দিন",
    farmerNameEn: "Rahim Uddin",
    fieldName: "Field Shift • Mymensingh - Field 02",
    fieldNameBn: "ফিল্ড শিফট • ময়মনসিংহ - ফিল্ড ০২",
    coordinates: "24.7471° N, 90.4203° E",
    coordinatesBn: "২৪.৭৪৭১° উ, ৯০.৪২০৩° পূ",
    latitude: 24.7471,
    longitude: 90.4203,
    area: "25 Acres (75 Bigha)",
    areaBn: "২৫ একর (৭৫ বিঘা)",
    acres: 25,
    bigha: 75,
    decimals: 2500,
    activeCrop: "Rice (ধান)",
    activeCropKey: "rice",
    activeCropBn: "ধান",
    activeCropEn: "Rice"
};
