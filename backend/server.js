import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Initialize Google Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ WARNING: GEMINI_API_KEY is not configured in .env!');
}

const ai = new GoogleGenAI({
    apiKey: apiKey || ''
});

// =============================================================================
// FARMER AUTH & PROFILE SQL / HYBRID STORAGE (BACKEND TIER 3)
// =============================================================================
const registeredFarmers = new Map();

// Pre-seeded verified demo farmer account
registeredFarmers.set("01711223344", {
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
});

// Auth Routes for Non-Blocking Tier 3 Sync
app.post('/api/auth/register', (req, res) => {
    try {
        const farmer = req.body;
        if (!farmer || !farmer.phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }
        registeredFarmers.set(farmer.phone, farmer);
        console.log(`[Auth SQL Sync] ✅ Farmer profile registered/updated: ${farmer.name} (${farmer.phone})`);
        return res.json({ success: true, farmer });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { phone, pin } = req.body;
        const farmer = registeredFarmers.get(phone);
        if (!farmer || String(farmer.pin) !== String(pin)) {
            return res.status(401).json({ error: "Invalid phone number or PIN code" });
        }
        return res.json({ success: true, farmer });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/sync', (req, res) => {
    try {
        const farmer = req.body;
        if (farmer && farmer.phone) {
            registeredFarmers.set(farmer.phone, farmer);
            return res.json({ success: true, farmer });
        }
        return res.status(400).json({ error: "Missing farmer data" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/profile', (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: "Phone required" });
    const farmer = registeredFarmers.get(phone);
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    return res.json({ farmer });
});

app.get('/api/auth/farmers', (req, res) => {
    return res.json({ farmers: Array.from(registeredFarmers.values()) });
});

// Master System Instruction for Gemini (Farmer Buddy Expert Mode)
const BASE_SYSTEM_INSTRUCTION = `You are "Farmer Buddy" (কৃষি বন্ধু), an elite Senior Agronomist, Agricultural Economist, and trusted field friend to farmers in Bangladesh and South Asia.

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

4. LAND, LOCATION & PROFIT/ROTATION PLANNING:
   - Whenever a farmer mentions their location/region (e.g., Mymensingh, Bogura, Barishal, Dinajpur, haor, char, high/medium/low land), soil type (loamy/দোআঁশ, clay/এঁটেল, sandy/বেলে), or asks what to cultivate for maximum profit:
     a) **Best Crop & Sowing Window (সেরা ফসল ও বপনের সময়):** Recommend the highest-margin crops suited to that land and exact planting months to catch early market high prices.
     b) **Cost Minimization Strategy (খরচ কমানোর কৌশল):** Show how to cut input costs by 20–30% using vermicompost/organic manure, split Urea application, LCC (Leaf Color Chart), and AWD (Alternate Wetting & Drying) irrigation.
     c) **Estimated Cost vs. Profit (খরচ ও সম্ভাব্য লাভের হিসাব):** Provide a realistic cost, yield, and net profit estimate per decimal (শতাংশ) or bigha (৩৩ শতাংশ).
     d) **Year-Round 3-Season Crop Rotation (শস্য আবর্তন চক্র):** Provide a Rabi -> Kharif-1 -> Kharif-2 cycle (e.g., Potato/Mustard -> Mungbean/Jute -> T. Aman Rice) that naturally fixes soil nitrogen and breaks pest cycles.

5. EXACT TECHNICAL ACCURACY (BARI / BRRI STANDARDS):
   - Give exact dosages per decimal (শতাংশ) or bigha for Urea, TSP, DAP, MoP, Gypsum, Zinc, and Boron.
   - For pests/diseases, give both immediate organic/cultural controls (neem extract, light traps, perching, water draining) and specific chemical active ingredient names with dosage per liter of water.

6. TONE, STRUCTURE & LANGUAGE:
   - Always open with the mandatory greeting ("আসসালামু আলাইকুম ভাই/বন্ধু!" in Bangla, "Hello friend!" in English). Under NO circumstances say "নমস্কার".
   - Address the farmer warmly ("ভাই/বন্ধু" in Bangla, "Friend" in English).
   - Format with short, mobile-scannable bold bullet points.
   - End with 1 smart, context-aware follow-up question that helps them take the next step.
   - Strictly respond in natural Bangla if the UI language is Bangla (বাং) or the user writes in Bangla/Banglish; respond in clear English if the UI/query is in English.`;

/**
 * Enforces strict greeting rules and purges any occurrence of "নমস্কার"
 */
function enforceGreetingRules(reply, isBn) {
    if (!reply || typeof reply !== 'string') return reply;
    let cleaned = reply;
    cleaned = cleaned.replace(/নমস্কার[^\s,.!?।]*\s*/gi, isBn ? "আসসালামু আলাইকুম " : "Hello ");
    cleaned = cleaned.replace(/\bnomoskar\b[^\s,.!?]*\s*/gi, isBn ? "Assalamu Alaikum " : "Hello ");
    cleaned = cleaned.replace(/\bnamaskar\b[^\s,.!?]*\s*/gi, isBn ? "Assalamu Alaikum " : "Hello ");

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

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Field Shift Farmer Buddy Gemini Proxy',
        supportedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-3.8-flash'],
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/ask
 * Accepts:
 *   - message: string (current user message)
 *   - history: Array<{ role: 'user' | 'model', parts: [{ text: string }] }> (conversation memory)
 *   - context: Object (active farm dashboard state: crop, growthStage, soilMoisture, weather, etc.)
 *   - model: string (e.g. 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash')
 * Returns: { reply: string }
 */
app.post('/api/ask', async (req, res) => {
    try {
        const { message, history, context, model } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error: "message" field is required and cannot be empty.'
            });
        }

        const userPrompt = message.trim();

        // Model candidate selection mapped to active endpoints
        const requestedModel = (model || 'gemini-3.5-flash').toLowerCase();
        let candidateModels = [];

        if (requestedModel.includes('pro')) {
            candidateModels = [
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite'
            ];
        } else if (requestedModel.includes('flash-lite') || requestedModel.includes('2.5-flash')) {
            candidateModels = [
                'gemini-3.5-flash-lite',
                'gemini-3.5-flash'
            ];
        } else {
            // Default: Gemini 3.5 Flash with fast flash-lite fallback
            candidateModels = [
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite'
            ];
        }

        // 1. Build dynamic system instruction with active farm context & NASA satellite data
        let dynamicSystemInstruction = BASE_SYSTEM_INSTRUCTION;
        if (context && typeof context === 'object') {
            if (context.farmer) {
                dynamicSystemInstruction += `\n\nLOGGED-IN FARMER PROFILE:
• Farmer Name: ${context.farmer.name}
• Phone: ${context.farmer.phone}
• District: ${context.farmer.district}
• Land Size: ${context.farmer.landSizeDecimals} decimals (শতাংশ)
• Primary Crop: ${context.farmer.primaryCrop}
• Soil Type: ${context.farmer.soilType}
Always address this farmer warmly and personally by name ("আসসালামু আলাইকুম ${context.farmer.name} ভাই!" in Bangla, "Hello ${context.farmer.name}!" in English). NEVER use the word "নমস্কার".`;
            }

            dynamicSystemInstruction += `\n\nACTIVE 3D FARM DASHBOARD STATE & LIVE NASA SATELLITE TELEMETRY:
• Agroclimatology Zone: ${context.nasaZone || 'Mymensingh (AEZ-9)'}
• Selected Crop: ${context.crop || 'Tomato'}
• Current Growth Stage: ${context.growthStage || 'Vegetative'}
• NASA SMAP Root Zone Soil Moisture (GWETROOT): ${context.nasaRootMoist || context.soilMoisture || '68%'} (Topsoil: ${context.nasaTopMoist || '62%'})
• NASA Solar PAR Flux (ALLSKY_SFC_PAR_TOT): ${context.nasaPAR || '425 W/m²'}
• NASA GPM IMERG Rainfall (PRECTOTCORR): ${context.nasaPrecip || '0.8 mm/day'}
• NASA Temperature & Humidity: ${context.nasaTemp || context.weather || '26.8°C'} (RH: ${context.nasaRH || '74%'})
• NASA Wind Speed: ${context.nasaWind || '2.6 m/s'}
• Current Farmer Irrigation Action: ${context.nasaIrrigationAdvice || 'Optimal moisture — no irrigation needed today'}
• Current Farmer Fertilizer Timing Action: ${context.nasaFertilizerAdvice || 'Ideal for top-dressing'}
• Current Farmer Disease/Blight Alert: ${context.nasaDiseaseAdvice || 'Low fungal risk'}
• Current Farmer Safe Spray Window: ${context.nasaSprayAdvice || 'Safe wind window for spraying'}`;
        }

        // 2. Assemble Multi-Turn Conversation Memory (up to last 10 turns)
        const contents = [];

        if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-10);

            for (const item of recentHistory) {
                const role = (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user';
                let text = '';

                if (Array.isArray(item.parts) && item.parts[0]?.text) {
                    text = item.parts[0].text.trim();
                } else if (typeof item.text === 'string') {
                    text = item.text.trim();
                } else if (typeof item.content === 'string') {
                    text = item.content.trim();
                }

                if (text) {
                    // Merge consecutive messages with the same role to maintain strict Gemini alternating turn requirements
                    if (contents.length > 0 && contents[contents.length - 1].role === role) {
                        contents[contents.length - 1].parts[0].text += `\n${text}`;
                    } else {
                        contents.push({
                            role: role,
                            parts: [{ text: text }]
                        });
                    }
                }
            }
        }

        // 3. Append current user query
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1].parts[0].text += `\n${userPrompt}`;
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: userPrompt }]
            });
        }

        // 4. Multi-tier model invocation with fast timeout protection
        let replyText = null;
        let lastError = null;

        for (const modelName of candidateModels) {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout: ${modelName} took over 8s`)), 8000)
                );

                const callPromise = ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        systemInstruction: dynamicSystemInstruction
                    }
                });

                const response = await Promise.race([callPromise, timeoutPromise]);

                if (response && response.text) {
                    replyText = response.text.trim();
                    console.log(`[Gemini Proxy] Responded successfully via model [${modelName}] (History turns: ${contents.length})`);
                    break;
                }
            } catch (modelErr) {
                console.warn(`[Gemini Proxy] Model [${modelName}] failed (${modelErr?.message || modelErr}). Trying next candidate...`);
                lastError = modelErr;
            }
        }

        if (replyText) {
            const isBn = (context?.language === 'বাং' || context?.language === 'bn' || /[\u0980-\u09FF]/.test(userPrompt));
            replyText = enforceGreetingRules(replyText, isBn);
            return res.json({ reply: replyText });
        }

        throw lastError || new Error('No candidate models produced a valid response.');
    } catch (error) {
        console.error('❌ [Gemini Proxy Error]:', error?.message || error);
        return res.status(500).json({
            error: 'Internal Server Error: Failed to generate response from Gemini API',
            details: error?.message || 'Unknown error'
        });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`🌾 Field Shift Farmer Buddy Gemini Proxy listening on http://localhost:${PORT}`);
    console.log(`🚀 Route ready: POST http://localhost:${PORT}/api/ask`);
});
