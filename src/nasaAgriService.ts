/**
 * =============================================================================
 * NASA AGRI SERVICE — TYPESCRIPT IMPLEMENTATION
 * =============================================================================
 */

export interface FarmPresetZone {
    id: string;
    nameEn: string;
    nameBn: string;
    districtEn: string;
    districtBn: string;
    lat: number;
    lon: number;
    aez: string;
    soilTypeEn: string;
    soilTypeBn: string;
    dominantCrops?: string[];
}

export interface NasaAgriTelemetry {
    GWETROOT: number;
    GWETTOP: number;
    ALLSKY_SFC_PAR_TOT: number;
    ALLSKY_SFC_SW_DWN: number;
    T2M: number;
    T2M_MAX: number;
    T2M_MIN: number;
    PRECTOTCORR: number;
    RH2M: number;
    WS2M: number;
    trend7Day?: Array<{ day: string; dateKey?: string; gwetroot: number; precip: number; temp: number }>;
    rawParams?: Record<string, any>;
    validDateKey?: string;
    lat?: number;
    lon?: number;
}

export interface FarmerActionItem {
    status: "optimal" | "warning" | "urgent";
    level: string;
    badge: string;
    advice: string;
    actionCode: string;
    sourceTag: string;
}

export interface FarmerActionAdvisory {
    rootMoistPercent: number;
    topMoistPercent: number;
    parValue: number;
    rainMm: number;
    tempC: number;
    tempMaxC: number;
    rhPercent: number;
    windSpeedMs: number;
    windSpeedKmh: number;
    moistureAction: FarmerActionItem;
    fertilizerAction: FarmerActionItem;
    diseaseAction: FarmerActionItem;
    sprayAction: FarmerActionItem;
}

export const BANGLADESH_FARM_PRESETS: Record<string, FarmPresetZone> = {
    mymensingh: {
        id: "mymensingh",
        nameEn: "Mymensingh (Old Brahmaputra Floodplain)",
        nameBn: "ময়মনসিংহ (পুরাতন ব্রহ্মপুত্র প্লাবনভূমি)",
        districtEn: "Mymensingh",
        districtBn: "ময়মনসিংহ",
        lat: 24.7471,
        lon: 90.4203,
        aez: "AEZ-9 Old Brahmaputra Floodplain",
        soilTypeEn: "Non-calcareous Dark Grey & Brown Floodplain Soils",
        soilTypeBn: "অক্যালসিয়ামযুক্ত গাঢ় ধূসর ও বাদামী প্লাবনভূমি মাটি",
        dominantCrops: ["Rice", "Mustard", "Potato", "Jute"]
    },
    bogura: {
        id: "bogura",
        nameEn: "Bogura (Karatoya-Bangali Floodplain)",
        nameBn: "বগুড়া (করতোয়া-বাঙালি প্লাবনভূমি)",
        districtEn: "Bogura",
        districtBn: "বগুড়া",
        lat: 24.8465,
        lon: 89.3777,
        aez: "AEZ-4 Karatoya-Bangali Floodplain",
        soilTypeEn: "Silt Loam to Silty Clay Loam",
        soilTypeBn: "পলি দোআঁশ ও পলি এঁটেল দোআঁশ",
        dominantCrops: ["Potato", "Chili", "Vegetables", "Maize"]
    },
    rajshahi: {
        id: "rajshahi",
        nameEn: "Rajshahi (High Barind Tract)",
        nameBn: "রাজশাহী (বরেন্দ্র অঞ্চল)",
        districtEn: "Rajshahi",
        districtBn: "রাজশাহী",
        lat: 24.3745,
        lon: 88.6042,
        aez: "AEZ-26 High Barind Tract",
        soilTypeEn: "Deep Grey Terrace & Red Barind Soils",
        soilTypeBn: "ধূসর সোপান ও লাল বরেন্দ্র এঁটেল মাটি",
        dominantCrops: ["Mango", "Wheat", "Tomato", "Rice"]
    },
    dinajpur: {
        id: "dinajpur",
        nameEn: "Dinajpur (Old Himalayan Piedmont Plain)",
        nameBn: "দিনাজপুর (পুরাতন হিমালয় পাদদেশীয় সমভূমি)",
        districtEn: "Dinajpur",
        districtBn: "দিনাজপুর",
        lat: 25.6279,
        lon: 88.6332,
        aez: "AEZ-1 Old Himalayan Piedmont Plain",
        soilTypeEn: "Acid Sandy Loam to Loam",
        soilTypeBn: "অম্লীয় বেলে দোআঁশ ও দোআঁশ মাটি",
        dominantCrops: ["Aromatic Rice (Katari)", "Maize", "Litchi", "Potato"]
    },
    barishal: {
        id: "barishal",
        nameEn: "Barishal (Ganges Tidal Floodplain)",
        nameBn: "বরিশাল (গঙ্গা জোয়ার-ভাটা প্লাবনভূমি)",
        districtEn: "Barishal",
        districtBn: "বরিশাল",
        lat: 22.7010,
        lon: 90.3535,
        aez: "AEZ-13 Ganges Tidal Floodplain",
        soilTypeEn: "Non-saline to Saline Heavy Clay & Silt",
        soilTypeBn: "ভারী এঁটেল ও পলি মাটি (লবণাক্ততা সংবেদনশীল)",
        dominantCrops: ["Aman Rice", "Betel Nut", "Pulses", "Coconut"]
    },
    sylhet: {
        id: "sylhet",
        nameEn: "Sylhet (Surma-Kushiyara Haor Basin)",
        nameBn: "সিলেট (সুরমা-কুশিয়ারা হাওর অববাহিকা)",
        districtEn: "Sylhet",
        districtBn: "সিলেট",
        lat: 24.8949,
        lon: 91.8687,
        aez: "AEZ-20 Eastern Surma-Kushiyara Floodplain",
        soilTypeEn: "Acid Heavy Clay Haor Soils",
        soilTypeBn: "ভারী এঁটেল হাওর মাটি ও টিলা দোআঁশ",
        dominantCrops: ["Boro Rice", "Citrus (Satkara)", "Tea", "Mustard"]
    },
    cumilla: {
        id: "cumilla",
        nameEn: "Cumilla (Middle Meghna River Floodplain)",
        nameBn: "কুমিল্লা (মধ্য মেঘনা প্লাবনভূমি)",
        districtEn: "Cumilla",
        districtBn: "কুমিল্লা",
        lat: 23.4607,
        lon: 91.1809,
        aez: "AEZ-16 Middle Meghna River Floodplain",
        soilTypeEn: "Very Fertile Silt Loam Floodplain",
        soilTypeBn: "উর্বর পলি দোআঁশ প্লাবনভূমি",
        dominantCrops: ["Vegetables", "Rice", "Cauliflower", "Eggplant"]
    },
    rangpur: {
        id: "rangpur",
        nameEn: "Rangpur (Tista Meander Floodplain)",
        nameBn: "রংপুর (তিস্তা আঁকাবাঁকা প্লাবনভূমি)",
        districtEn: "Rangpur",
        districtBn: "রংপুর",
        lat: 25.7439,
        lon: 89.2752,
        aez: "AEZ-3 Tista Meander Floodplain",
        soilTypeEn: "Olive Grey & Ash Coloured Silt Loam",
        soilTypeBn: "জলপাই-ধূসর পলি দোআঁশ মাটি",
        dominantCrops: ["Potato", "Tobacco", "Mustard", "Rice"]
    }
};

const PREBUNDLED_NASA_DATA: Record<string, NasaAgriTelemetry> = {
    mymensingh: {
        GWETROOT: 0.68,
        GWETTOP: 0.62,
        ALLSKY_SFC_PAR_TOT: 425.0,
        ALLSKY_SFC_SW_DWN: 5.12,
        T2M: 26.8,
        T2M_MAX: 31.4,
        T2M_MIN: 21.8,
        PRECTOTCORR: 0.8,
        RH2M: 74.2,
        WS2M: 2.6,
        trend7Day: [
            { day: "D-6", gwetroot: 0.64, precip: 0.0, temp: 26.1 },
            { day: "D-5", gwetroot: 0.65, precip: 0.0, temp: 26.4 },
            { day: "D-4", gwetroot: 0.70, precip: 8.4, temp: 25.2 },
            { day: "D-3", gwetroot: 0.72, precip: 2.1, temp: 25.9 },
            { day: "D-2", gwetroot: 0.69, precip: 0.0, temp: 26.5 },
            { day: "D-1", gwetroot: 0.68, precip: 0.0, temp: 27.0 },
            { day: "Today", gwetroot: 0.68, precip: 0.8, temp: 26.8 }
        ]
    },
    bogura: {
        GWETROOT: 0.62,
        GWETTOP: 0.58,
        ALLSKY_SFC_PAR_TOT: 440.0,
        ALLSKY_SFC_SW_DWN: 5.30,
        T2M: 27.2,
        T2M_MAX: 32.1,
        T2M_MIN: 22.0,
        PRECTOTCORR: 0.2,
        RH2M: 71.5,
        WS2M: 2.4,
        trend7Day: [
            { day: "D-6", gwetroot: 0.66, precip: 0.0, temp: 26.8 },
            { day: "D-5", gwetroot: 0.65, precip: 0.0, temp: 27.1 },
            { day: "D-4", gwetroot: 0.64, precip: 1.2, temp: 26.9 },
            { day: "D-3", gwetroot: 0.63, precip: 0.0, temp: 27.4 },
            { day: "D-2", gwetroot: 0.63, precip: 0.0, temp: 27.5 },
            { day: "D-1", gwetroot: 0.62, precip: 0.0, temp: 27.3 },
            { day: "Today", gwetroot: 0.62, precip: 0.2, temp: 27.2 }
        ]
    },
    rajshahi: {
        GWETROOT: 0.44,
        GWETTOP: 0.38,
        ALLSKY_SFC_PAR_TOT: 480.0,
        ALLSKY_SFC_SW_DWN: 5.75,
        T2M: 29.5,
        T2M_MAX: 35.8,
        T2M_MIN: 23.2,
        PRECTOTCORR: 0.0,
        RH2M: 59.8,
        WS2M: 3.1,
        trend7Day: [
            { day: "D-6", gwetroot: 0.49, precip: 0.0, temp: 28.6 },
            { day: "D-5", gwetroot: 0.48, precip: 0.0, temp: 29.0 },
            { day: "D-4", gwetroot: 0.47, precip: 0.0, temp: 29.2 },
            { day: "D-3", gwetroot: 0.46, precip: 0.0, temp: 29.7 },
            { day: "D-2", gwetroot: 0.45, precip: 0.0, temp: 29.8 },
            { day: "D-1", gwetroot: 0.44, precip: 0.0, temp: 29.6 },
            { day: "Today", gwetroot: 0.44, precip: 0.0, temp: 29.5 }
        ]
    },
    dinajpur: {
        GWETROOT: 0.65,
        GWETTOP: 0.59,
        ALLSKY_SFC_PAR_TOT: 435.0,
        ALLSKY_SFC_SW_DWN: 5.22,
        T2M: 25.9,
        T2M_MAX: 30.6,
        T2M_MIN: 20.4,
        PRECTOTCORR: 1.4,
        RH2M: 73.1,
        WS2M: 2.2,
        trend7Day: [
            { day: "D-6", gwetroot: 0.68, precip: 4.2, temp: 25.1 },
            { day: "D-5", gwetroot: 0.67, precip: 0.0, temp: 25.4 },
            { day: "D-4", gwetroot: 0.66, precip: 0.0, temp: 25.8 },
            { day: "D-3", gwetroot: 0.65, precip: 0.0, temp: 26.2 },
            { day: "D-2", gwetroot: 0.64, precip: 0.0, temp: 26.1 },
            { day: "D-1", gwetroot: 0.64, precip: 0.8, temp: 25.7 },
            { day: "Today", gwetroot: 0.65, precip: 1.4, temp: 25.9 }
        ]
    },
    barishal: {
        GWETROOT: 0.82,
        GWETTOP: 0.79,
        ALLSKY_SFC_PAR_TOT: 390.0,
        ALLSKY_SFC_SW_DWN: 4.80,
        T2M: 28.1,
        T2M_MAX: 32.2,
        T2M_MIN: 24.1,
        PRECTOTCORR: 14.8,
        RH2M: 86.4,
        WS2M: 4.6,
        trend7Day: [
            { day: "D-6", gwetroot: 0.76, precip: 3.2, temp: 27.8 },
            { day: "D-5", gwetroot: 0.77, precip: 5.1, temp: 27.9 },
            { day: "D-4", gwetroot: 0.79, precip: 18.4, temp: 26.8 },
            { day: "D-3", gwetroot: 0.84, precip: 22.0, temp: 26.5 },
            { day: "D-2", gwetroot: 0.83, precip: 8.6, temp: 27.2 },
            { day: "D-1", gwetroot: 0.81, precip: 6.0, temp: 27.8 },
            { day: "Today", gwetroot: 0.82, precip: 14.8, temp: 28.1 }
        ]
    },
    sylhet: {
        GWETROOT: 0.78,
        GWETTOP: 0.74,
        ALLSKY_SFC_PAR_TOT: 380.0,
        ALLSKY_SFC_SW_DWN: 4.65,
        T2M: 25.4,
        T2M_MAX: 29.8,
        T2M_MIN: 20.8,
        PRECTOTCORR: 18.2,
        RH2M: 88.2,
        WS2M: 2.8,
        trend7Day: [
            { day: "D-6", gwetroot: 0.72, precip: 6.5, temp: 25.0 },
            { day: "D-5", gwetroot: 0.74, precip: 12.0, temp: 24.8 },
            { day: "D-4", gwetroot: 0.78, precip: 24.5, temp: 24.2 },
            { day: "D-3", gwetroot: 0.82, precip: 31.0, temp: 23.9 },
            { day: "D-2", gwetroot: 0.80, precip: 14.2, temp: 24.6 },
            { day: "D-1", gwetroot: 0.77, precip: 8.0, temp: 25.1 },
            { day: "Today", gwetroot: 0.78, precip: 18.2, temp: 25.4 }
        ]
    },
    cumilla: {
        GWETROOT: 0.71,
        GWETTOP: 0.66,
        ALLSKY_SFC_PAR_TOT: 418.0,
        ALLSKY_SFC_SW_DWN: 5.05,
        T2M: 27.4,
        T2M_MAX: 31.9,
        T2M_MIN: 22.8,
        PRECTOTCORR: 2.4,
        RH2M: 78.5,
        WS2M: 2.5,
        trend7Day: [
            { day: "D-6", gwetroot: 0.68, precip: 0.0, temp: 27.0 },
            { day: "D-5", gwetroot: 0.69, precip: 0.0, temp: 27.2 },
            { day: "D-4", gwetroot: 0.74, precip: 14.5, temp: 26.2 },
            { day: "D-3", gwetroot: 0.73, precip: 4.2, temp: 26.6 },
            { day: "D-2", gwetroot: 0.71, precip: 0.0, temp: 27.3 },
            { day: "D-1", gwetroot: 0.70, precip: 0.0, temp: 27.6 },
            { day: "Today", gwetroot: 0.71, precip: 2.4, temp: 27.4 }
        ]
    },
    rangpur: {
        GWETROOT: 0.64,
        GWETTOP: 0.57,
        ALLSKY_SFC_PAR_TOT: 430.0,
        ALLSKY_SFC_SW_DWN: 5.18,
        T2M: 26.2,
        T2M_MAX: 31.0,
        T2M_MIN: 21.2,
        PRECTOTCORR: 0.4,
        RH2M: 72.8,
        WS2M: 2.7,
        trend7Day: [
            { day: "D-6", gwetroot: 0.67, precip: 1.0, temp: 25.8 },
            { day: "D-5", gwetroot: 0.66, precip: 0.0, temp: 26.0 },
            { day: "D-4", gwetroot: 0.65, precip: 0.0, temp: 26.3 },
            { day: "D-3", gwetroot: 0.64, precip: 0.0, temp: 26.5 },
            { day: "D-2", gwetroot: 0.64, precip: 0.0, temp: 26.4 },
            { day: "D-1", gwetroot: 0.63, precip: 0.0, temp: 26.3 },
            { day: "Today", gwetroot: 0.64, precip: 0.4, temp: 26.2 }
        ]
    }
};

let currentZoneKey = "mymensingh";
let currentNasaData: NasaAgriTelemetry = { ...PREBUNDLED_NASA_DATA.mymensingh };
let currentSourceType: "LIVE_API" | "LOCAL_CACHE" | "PREBUNDLED" = "PREBUNDLED";
let lastFetchTimestamp = Date.now();
const listeners: Array<(payload: any) => void> = [];

function formatDateYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

export async function fetchNasaAgriData(zoneKey = "mymensingh", customLat: number | null = null, customLon: number | null = null): Promise<NasaAgriTelemetry> {
    let lat: number, lon: number;
    let targetZone: FarmPresetZone;

    if (zoneKey === "gps" && customLat !== null && customLon !== null) {
        lat = customLat;
        lon = customLon;
        targetZone = {
            id: "gps",
            nameEn: `My Farm GPS (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
            nameBn: `আমার খামার GPS (${lat.toFixed(4)}°উ, ${lon.toFixed(4)}°পূ)`,
            districtEn: "Custom GPS Farm",
            districtBn: "নিজস্ব খামার GPS",
            lat: lat,
            lon: lon,
            aez: "Local Agro-Ecological Zone",
            soilTypeEn: "Regional Soil",
            soilTypeBn: "স্থানীয় প্লাবনভূমি মাটি"
        };
    } else {
        targetZone = BANGLADESH_FARM_PRESETS[zoneKey] || BANGLADESH_FARM_PRESETS.mymensingh;
        lat = targetZone.lat;
        lon = targetZone.lon;
    }

    currentZoneKey = zoneKey;

    const now = new Date();
    const endDateObj = new Date(now.getTime() - 4 * 86400000);
    const startDateObj = new Date(endDateObj.getTime() - 7 * 86400000);

    const startDate = formatDateYYYYMMDD(startDateObj);
    const endDate = formatDateYYYYMMDD(endDateObj);

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=GWETROOT,GWETTOP,ALLSKY_SFC_PAR_TOT,ALLSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=${startDate}&end=${endDate}&format=JSON`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`NASA API HTTP ${response.status}`);

        const json = await response.json();
        const params = json.properties && json.properties.parameter;

        if (!params || !params.GWETROOT || !params.T2M) throw new Error("Incomplete parameter payload");

        const dateKeys = Object.keys(params.GWETROOT).sort();
        let validDateKey: string | null = null;

        for (let i = dateKeys.length - 1; i >= 0; i--) {
            const dk = dateKeys[i];
            if (params.GWETROOT[dk] !== -999 && params.T2M[dk] !== -999) {
                validDateKey = dk;
                break;
            }
        }

        if (!validDateKey) throw new Error("No non-fill values in window");

        const trend7Day: Array<{ day: string; dateKey?: string; gwetroot: number; precip: number; temp: number }> = [];
        dateKeys.slice(-7).forEach((dk, idx) => {
            const rVal = params.GWETROOT[dk];
            const pVal = params.PRECTOTCORR ? params.PRECTOTCORR[dk] : 0;
            const tVal = params.T2M[dk];
            trend7Day.push({
                day: idx === 6 ? "Today" : `D-${6 - idx}`,
                dateKey: dk,
                gwetroot: (rVal !== -999) ? parseFloat(rVal.toFixed(2)) : 0.65,
                precip: (pVal !== -999) ? Math.max(0, parseFloat(pVal.toFixed(1))) : 0.0,
                temp: (tVal !== -999) ? parseFloat(tVal.toFixed(1)) : 26.5
            });
        });

        const liveData: NasaAgriTelemetry = {
            GWETROOT: Math.max(0.1, Math.min(1.0, params.GWETROOT[validDateKey])),
            GWETTOP: Math.max(0.1, Math.min(1.0, params.GWETTOP ? params.GWETTOP[validDateKey] : params.GWETROOT[validDateKey] * 0.92)),
            ALLSKY_SFC_PAR_TOT: Math.max(100, params.ALLSKY_SFC_PAR_TOT ? params.ALLSKY_SFC_PAR_TOT[validDateKey] : 420.0),
            ALLSKY_SFC_SW_DWN: Math.max(1.0, params.ALLSKY_SFC_SW_DWN ? params.ALLSKY_SFC_SW_DWN[validDateKey] : 5.0),
            T2M: parseFloat(params.T2M[validDateKey].toFixed(1)),
            T2M_MAX: params.T2M_MAX ? parseFloat(params.T2M_MAX[validDateKey].toFixed(1)) : parseFloat((params.T2M[validDateKey] + 4.5).toFixed(1)),
            T2M_MIN: params.T2M_MIN ? parseFloat(params.T2M_MIN[validDateKey].toFixed(1)) : parseFloat((params.T2M[validDateKey] - 5.0).toFixed(1)),
            PRECTOTCORR: params.PRECTOTCORR ? Math.max(0, parseFloat(params.PRECTOTCORR[validDateKey].toFixed(1))) : 0.0,
            RH2M: params.RH2M ? Math.max(20, Math.min(100, parseFloat(params.RH2M[validDateKey].toFixed(1)))) : 75.0,
            WS2M: params.WS2M ? Math.max(0.5, parseFloat(params.WS2M[validDateKey].toFixed(1))) : 2.5,
            validDateKey: validDateKey,
            trend7Day: trend7Day,
            rawParams: params
        };

        currentNasaData = liveData;
        currentSourceType = "LIVE_API";
        lastFetchTimestamp = Date.now();

        try {
            localStorage.setItem(`nasa_power_cache_${zoneKey}`, JSON.stringify({
                timestamp: lastFetchTimestamp,
                data: liveData
            }));
        } catch (e) { }
    } catch (err) {
        let cached: any = null;
        try {
            const raw = localStorage.getItem(`nasa_power_cache_${zoneKey}`);
            if (raw) cached = JSON.parse(raw);
        } catch (e) { }

        if (cached && cached.data) {
            currentNasaData = cached.data;
            currentSourceType = "LOCAL_CACHE";
        } else {
            const fallback = PREBUNDLED_NASA_DATA[zoneKey] || PREBUNDLED_NASA_DATA.mymensingh;
            currentNasaData = { ...fallback };
            currentSourceType = "PREBUNDLED";
        }
    }

    notifyListeners();
    return currentNasaData;
}

export function getCurrentNasaAgriData() {
    return {
        data: currentNasaData,
        zoneKey: currentZoneKey,
        zoneInfo: (currentZoneKey === "gps")
            ? {
                id: "gps",
                nameEn: "My Farm GPS",
                nameBn: "আমার খামার GPS",
                districtEn: "Live Farm GPS",
                districtBn: "লাইভ খামার GPS",
                lat: currentNasaData.lat || 24.7471,
                lon: currentNasaData.lon || 90.4203
            }
            : (BANGLADESH_FARM_PRESETS[currentZoneKey] || BANGLADESH_FARM_PRESETS.mymensingh),
        sourceType: currentSourceType,
        timestamp: lastFetchTimestamp
    };
}

export function translateNasaDataToFarmerActions(data: NasaAgriTelemetry = currentNasaData, lang = "bn"): FarmerActionAdvisory {
    const isBn = (lang === "bn");

    const rootMoist = Math.round((data.GWETROOT || 0.65) * 100);
    const topMoist = Math.round((data.GWETTOP || (data.GWETROOT * 0.92)) * 100);
    const par = data.ALLSKY_SFC_PAR_TOT || 420;
    const rain = data.PRECTOTCORR || 0;
    const temp = data.T2M || 26.5;
    const tempMax = data.T2M_MAX || (temp + 4.5);
    const rh = data.RH2M || 74;
    const wind = data.WS2M || 2.5;
    const windKmh = Math.round(wind * 3.6);

    let moistAction: FarmerActionItem;
    if (rootMoist < 40) {
        moistAction = {
            status: "urgent",
            level: isBn ? "মাটিতে রস কম" : "Low Moisture",
            badge: isBn ? "⚠️ সেচ দিন" : "⚠️ Needs Irrigation",
            advice: isBn
                ? "মাটিতে রস কম — আজই হালকা সেচ দিন (শিকড় অঞ্চলের আর্দ্রতা ৪০% এর নিচে নেমেছে)।"
                : "Low Soil Moisture — Irrigate today (Root-zone wetness is below 40%).",
            actionCode: "IRRIGATE_TODAY",
            sourceTag: "🛰️ NASA SMAP & POWER (GWETROOT)"
        };
    } else if (rootMoist <= 80) {
        moistAction = {
            status: "optimal",
            level: isBn ? "অনুকূল আর্দ্রতা" : "Optimal Moisture",
            badge: isBn ? "✅ সেচ লাগবে না" : "✅ No Irrigation",
            advice: isBn
                ? "উপযুক্ত রস আছে — এখন সেচ লাগবে না (শিকড় অঞ্চলের আর্দ্রতা উপযুক্ত সীমায় আছে)।"
                : "Optimal Moisture — No irrigation needed right now (Root-zone moisture is ideal).",
            actionCode: "HOLD_IRRIGATION",
            sourceTag: "🛰️ NASA SMAP & POWER (GWETROOT)"
        };
    } else {
        moistAction = {
            status: "warning",
            level: isBn ? "অতিরিক্ত আর্দ্রতা" : "Excess Moisture",
            badge: isBn ? "🌧️ নালা পরিষ্কার রাখুন" : "🌧️ Drain Field",
            advice: isBn
                ? "অতিরিক্ত আর্দ্রতা — সেচ বন্ধ রাখুন এবং জমির অতিরিক্ত পানি নিষ্কাশনের নালা পরিষ্কার রাখুন।"
                : "Excess Water — Halt irrigation and clear field drainage channels immediately.",
            actionCode: "DRAIN_FIELD",
            sourceTag: "🛰️ NASA SMAP & POWER (GWETROOT)"
        };
    }

    let fertilizerAction: FarmerActionItem;
    if (rain > 10.0) {
        fertilizerAction = {
            status: "urgent",
            level: isBn ? "বৃষ্টির ঝুঁকি" : "Rain Risk",
            badge: isBn ? "⛔ সার দেবেন না" : "⛔ Hold Fertilizer",
            advice: isBn
                ? "বৃষ্টির সম্ভাবনা — আজ ইউরিয়া বা রাসায়নিক সার দেবেন না, বৃষ্টির পানিতে ধুয়ে অপচয় হবে।"
                : "Heavy Rain Risk — Do not apply Urea or chemical top-dressing; runoff will waste nutrients.",
            actionCode: "HOLD_FERTILIZER_RAIN",
            sourceTag: "🛰️ NASA MODIS NDVI & PAR Flux"
        };
    } else if (rootMoist >= 45 && rootMoist <= 80 && par > 220) {
        fertilizerAction = {
            status: "optimal",
            level: isBn ? "সার প্রয়োগের সেরা সময়" : "Ideal Top-Dressing Window",
            badge: isBn ? "✅ সার দিন" : "✅ Apply Fertilizer",
            advice: isBn
                ? "সার প্রয়োগের সেরা সময় — মাটিতে পর্যাপ্ত রস এবং সালোকসংশ্লেষণের জন্য উজ্জ্বল রোদ রয়েছে।"
                : "Ideal Top-Dressing Window — Soil moisture and solar radiation (PAR) are optimal for nutrient uptake.",
            actionCode: "APPLY_FERTILIZER_OPTIMAL",
            sourceTag: "🛰️ NASA MODIS NDVI & PAR Flux"
        };
    } else {
        fertilizerAction = {
            status: "warning",
            level: isBn ? "নিয়মিত পরিচর্যা" : "Standard Maintenance",
            badge: isBn ? "🟡 রুটিন পরিচর্যা" : "🟡 Routine Care",
            advice: isBn
                ? "মাটি প্রস্তুত ও রুটিন সার ব্যবস্থাপনা বজায় রাখুন। বেশি খরার সময় সরাসরি ইউরিয়া প্রয়োগ করবেন না।"
                : "Maintain standard crop nutrition schedule. Avoid dry broadcasting during acute moisture stress.",
            actionCode: "MAINTAIN_ROUTINE",
            sourceTag: "🛰️ NASA MODIS NDVI & PAR Flux"
        };
    }

    let diseaseAction: FarmerActionItem;
    if (rh > 82 && temp >= 16 && temp <= 26) {
        diseaseAction = {
            status: "urgent",
            level: isBn ? "ব্লাইট ও পচন ঝুঁকি" : "High Blight Risk",
            badge: isBn ? "🔴 ছত্রাকনাশক স্প্রে" : "🔴 Blight Alert",
            advice: isBn
                ? "পচন ও ব্লাইট রোগের ঝুঁকি বেশি — বাতাসে উচ্চ আর্দ্রতা ও নাতিশীতোষ্ণ তাপমাত্রায় ছত্রাক দ্রুত ছড়ায়। প্রতিরোধক ছত্রাকনাশক স্প্রে করুন।"
                : "High Late Blight / Rot Risk — Elevated humidity and mild temperatures favor fungal sporulation. Spray protective fungicide.",
            actionCode: "HIGH_BLIGHT_RISK",
            sourceTag: "🛰️ NASA ECOSTRESS & MERRA-2"
        };
    } else if (tempMax > 35.0) {
        diseaseAction = {
            status: "warning",
            level: isBn ? "তীব্র তাপপ্রবাহ" : "Heat Stress Alert",
            badge: isBn ? "🟠 তাপপ্রবাহ সতর্কতা" : "🟠 Thermal Stress",
            advice: isBn
                ? "তীব্র তাপপ্রবাহ (Heat Stress) — দুপুরের প্রখর রোদে পরাগায়ন ব্যাহত হতে পারে; বিকেলে গাছের গোড়ায় হালকা পানি ধরে রাখুন।"
                : "Severe Heat Stress — Peak day heat reduces pollination and fruit set; maintain light evening root moisture.",
            actionCode: "HEAT_STRESS_RISK",
            sourceTag: "🛰️ NASA ECOSTRESS & MERRA-2"
        };
    } else {
        diseaseAction = {
            status: "optimal",
            level: isBn ? "ফসল ঝুঁকিমুক্ত" : "Low Disease Risk",
            badge: isBn ? "🟢 ফসল নিরাপদ" : "🟢 Field Healthy",
            advice: isBn
                ? "রোগ ও পোকার ঝুঁকি কম — আবহাওয়া ফসলের জন্য সহনশীল ও নিরাপদ রয়েছে। নিয়মিত ক্ষেত পরিদর্শন করুন।"
                : "Low Pest/Disease Risk — Atmospheric conditions are benign and safe for vegetative health.",
            actionCode: "LOW_PEST_RISK",
            sourceTag: "🛰️ NASA ECOSTRESS & MERRA-2"
        };
    }

    let sprayAction: FarmerActionItem;
    if (wind < 4.0 && rain < 2.0) {
        sprayAction = {
            status: "optimal",
            level: isBn ? "স্প্রে ও ফসল তোলার অনুকূল" : "Safe Spraying & Harvest Window",
            badge: isBn ? "✅ নিরাপদ স্প্রে সময়" : "✅ Safe to Spray",
            advice: isBn
                ? "স্প্রে ও ফসল পরিচর্যার উপযুক্ত আবহাওয়া — বাতাসের গতি শান্ত ও বৃষ্টির সম্ভাবনা কম, ওষুধ বাতাসে উড়ে যাবে না।"
                : "Ideal Spraying & Harvest Window — Gentle wind (<4 m/s) and zero rainfall ensure maximal droplet retention.",
            actionCode: "SAFE_SPRAY_WINDOW",
            sourceTag: "🛰️ NASA GPM IMERG & POWER"
        };
    } else if (wind >= 4.0 || rain > 5.0) {
        sprayAction = {
            status: "urgent",
            level: isBn ? "স্প্রে করার প্রতিকূল" : "Unsafe Spraying Conditions",
            badge: isBn ? "⚠️ স্প্রে স্থগিত রাখুন" : "⚠️ Do Not Spray",
            advice: isBn
                ? `বাতাস (${windKmh} কিমি/ঘ) বা বৃষ্টির তীব্রতা বেশি — এখন ওষুধ স্প্রে করবেন না, অন্যথায় ওষুধ ছড়িয়ে ক্ষতি হতে পারে।`
                : `Gusty Wind (${windKmh} km/h) or Rain — Do not spray now; wind drift will cause chemical loss or leaf scorch.`,
            actionCode: "UNSAFE_SPRAY_CONDITIONS",
            sourceTag: "🛰️ NASA GPM IMERG & POWER"
        };
    } else {
        sprayAction = {
            status: "warning",
            level: isBn ? "মাঝারি আবহাওয়া" : "Moderate Conditions",
            badge: isBn ? "🟡 সাবধানে স্প্রে" : "🟡 Spray With Care",
            advice: isBn
                ? "মাঝারি আবহাওয়া — বিকালের দিকে বাতাসের গতি কমে এলে কীটনাশক বা ফলিয়ার স্প্রে করুন।"
                : "Moderate Weather — Spray in the late afternoon when micro-turbulences settle down.",
            actionCode: "MODERATE_WEATHER",
            sourceTag: "🛰️ NASA GPM IMERG & POWER"
        };
    }

    return {
        rootMoistPercent: rootMoist,
        topMoistPercent: topMoist,
        parValue: Math.round(par),
        rainMm: rain,
        tempC: temp,
        tempMaxC: tempMax,
        rhPercent: Math.round(rh),
        windSpeedMs: wind,
        windSpeedKmh: windKmh,
        moistureAction,
        fertilizerAction,
        diseaseAction,
        sprayAction
    };
}

export function onNasaDataUpdated(callback: (payload: any) => void) {
    if (typeof callback === "function") {
        listeners.push(callback);
    }
}

function notifyListeners() {
    const payload = getCurrentNasaAgriData();
    listeners.forEach(cb => {
        try { cb(payload); } catch (e) { }
    });

    try {
        window.dispatchEvent(new CustomEvent("nasaAgriDataUpdated", { detail: payload }));
    } catch (e) { }
}
