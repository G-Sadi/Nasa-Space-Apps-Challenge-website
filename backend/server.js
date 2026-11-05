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

// Priority list: gemini-3.5-flash-lite connects instantly; gemini-3.8-flash as fallback
const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-2.5-flash'
].filter(Boolean);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AgriVision Gemini Proxy',
        models: CANDIDATE_MODELS,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/ask
 * Accepts { message: string }
 * Calls Gemini API with fast timeout & model fallback, returns { reply: string }
 */
app.post('/api/ask', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error: "message" field is required and cannot be empty.'
            });
        }

        const userPrompt = message.trim();
        const systemInstruction = 
            'You are "Farmer Buddy" (কৃষি বন্ধু), an empathetic, expert agricultural advisor for AgriVision. ' +
            'Provide practical, accurate, and concise guidance on crops, pests, disease treatment, soil health, fertilizers, and weather. ' +
            'Answer naturally in fluent Bengali or English matching the user\'s language. Format advice clearly with short bullet points when appropriate.';

        let replyText = null;
        let lastError = null;

        for (const modelName of CANDIDATE_MODELS) {
            try {
                // 9-second timeout per candidate to prevent hanging on overloaded models
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout: ${modelName} took over 9s`)), 9000)
                );

                const callPromise = ai.models.generateContent({
                    model: modelName,
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction
                    }
                });

                const response = await Promise.race([callPromise, timeoutPromise]);

                if (response && response.text) {
                    replyText = response.text.trim();
                    console.log(`[Gemini Proxy] Successfully responded using model [${modelName}]`);
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
    console.log(`🌾 AgriVision Gemini Backend Proxy listening on http://localhost:${PORT}`);
    console.log(`🚀 Route ready: POST http://localhost:${PORT}/api/ask`);
});
