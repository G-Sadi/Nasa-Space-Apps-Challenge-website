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

// Master System Instruction for Gemini (Farmer Buddy Expert Mode)
const BASE_SYSTEM_INSTRUCTION = `You are "Farmer Buddy" (কৃষক বন্ধু), an expert rural agricultural economist, agronomist, and trusted friend to farmers in Bangladesh and South Asia.

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
- If the app toggle is in Bangla (বাং), respond in natural, easy-to-understand Bangla. If English, respond in simple English.`;

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AgriVision Farmer Buddy Gemini Proxy',
        supportedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'],
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
        const { message, history, context, model } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error: "message" field is required and cannot be empty.'
            });
        }

        const userPrompt = message.trim();

        // Model candidate selection based on user tier
        const requestedModel = (model || 'gemini-2.5-flash').toLowerCase();
        let candidateModels = [];

        if (requestedModel.includes('pro')) {
            candidateModels = [
                'gemini-2.5-pro',
                'gemini-1.5-pro',
                'gemini-3.8-flash',
                'gemini-2.5-flash',
                'gemini-3.5-flash-lite'
            ];
        } else {
            candidateModels = [
                'gemini-2.5-flash',
                'gemini-3.5-flash-lite',
                'gemini-3.8-flash'
            ];
        }

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
