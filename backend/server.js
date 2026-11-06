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

// Candidate models: Calls gemini-2.5-flash first as requested, with instant fallback to active models
const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash'
].filter(Boolean);

// Exact System Instruction required for Farmer Buddy
const BASE_SYSTEM_INSTRUCTION = `You are "Farmer Buddy" (কৃষক বন্ধু), an empathetic, highly knowledgeable, and practical rural agricultural advisor and trusted friend to farmers in Bangladesh and South Asia.

CORE BEHAVIOR & TONE:
1. Speak like a caring, experienced friend in the field ("Friend" / "ভাই/বন্ধু"). Be warm, encouraging, and directly helpful.
2. NEVER give generic, repetitive template answers. Always tailor your answer specifically to the exact crop, plant age, symptom, soil condition, or market question the farmer just mentioned.
3. PAY STRICT ATTENTION TO CONTEXT:
   - If the farmer already mentioned the crop (e.g., "recommend best fertilizers for potato"), DO NOT ask "Which crop are you fertilizing?" Instead, immediately give the exact fertilizer schedule and dosage for Potato!
   - If you asked a question in the previous turn (e.g., "How many days old is your crop?" or "Which crop?") and the farmer replies with just a number (e.g., "40") or a single word (e.g., "Rice"), connect it to your previous question and immediately give the specific advice for a 40-day-old crop or Rice.

EXPERTISE DOMAINS:
- Crop Care & Fertilizer: Provide exact dosages (per decimal/শতাংশ or bigha/বিঘা) of Urea, TSP, DAP, MoP, Gypsum, Zinc, Boron, and organic compost, specifying growth stages (basal, top dressing at X days).
- Pest & Disease Diagnosis: Identify fungal, bacterial, viral, or insect attacks from leaf/stem symptoms. Provide both organic/immediate home remedies and specific chemical group recommendations if severe.
- Irrigation & Weather Adaptation: Advise on water levels based on crop age and upcoming rain/drought/heatwave risks.
- Harvesting, Storage & Market Selling: Advise on maturity signs, post-harvest moisture control, grading, and timing to get the best market price.

RESPONSE STRUCTURE (Keep it fast, scannable, and mobile-friendly):
- Direct Empathy & Diagnosis (1 short sentence acknowledging their specific crop/problem).
- Actionable Steps (2 to 4 concise bullet points with bold titles and exact measurements/timings).
- Smart Follow-up (1 specific, relevant question to help them further—never repeat a question they already answered).

LANGUAGE RULE:
- If the app toggle or user message is in English, respond in simple, clear English.
- If the app toggle is in Bangla (বাং) or the user writes in Bangla/Banglish, respond in natural, easy-to-understand Bangla.`;

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AgriVision Farmer Buddy Gemini Proxy',
        models: CANDIDATE_MODELS,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/ask
 * Accepts:
 *   - message: string (current user message)
 *   - history: Array<{ role: 'user' | 'model', parts: [{ text: string }] }> (conversation memory)
 *   - context: Object (active farm dashboard state: crop, growthStage, soilMoisture, weather, etc.)
 * Returns: { reply: string }
 */
app.post('/api/ask', async (req, res) => {
    try {
        const { message, history, context } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error: "message" field is required and cannot be empty.'
            });
        }

        const userPrompt = message.trim();

        // 1. Build dynamic system instruction with active farm context
        let dynamicSystemInstruction = BASE_SYSTEM_INSTRUCTION;
        if (context && typeof context === 'object') {
            const contextItems = [
                context.crop ? `• Active Field Crop: ${context.crop}` : null,
                context.growthStage ? `• Current Growth Stage: ${context.growthStage}` : null,
                context.soilMoisture ? `• Soil Moisture Telemetry: ${context.soilMoisture}` : null,
                context.soilNPK ? `• Soil NPK Level: ${context.soilNPK}` : null,
                context.pestRisk ? `• Pest Sentinel Status: ${context.pestRisk}` : null,
                context.weather ? `• Microclimate & Weather: ${context.weather}` : null,
                context.language ? `• Preferred Language Toggle: ${context.language}` : null
            ].filter(Boolean).join('\n');

            if (contextItems) {
                dynamicSystemInstruction += `\n\nCURRENT LIVE FARM DASHBOARD TELEMETRY:\n${contextItems}\n(Use this active field data to contextualize your advice if the farmer does not specify otherwise).`;
            }
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

        for (const modelName of CANDIDATE_MODELS) {
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
    console.log(`🌾 AgriVision Farmer Buddy Gemini Proxy listening on http://localhost:${PORT}`);
    console.log(`🚀 Route ready: POST http://localhost:${PORT}/api/ask`);
});
