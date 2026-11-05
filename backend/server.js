import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Google Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ WARNING: GEMINI_API_KEY is not set or using placeholder in .env!');
}

const ai = new GoogleGenAI({
    apiKey: apiKey || ''
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AgriVision Gemini Proxy',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/ask
 * Accepts { message: string }
 * Calls Gemini API and returns { reply: string }
 */
app.post('/api/ask', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error: "message" field is required and cannot be empty.'
            });
        }

        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
            model: model,
            contents: message.trim(),
            config: {
                systemInstruction: 'You are a helpful AI assistant. Answer clearly and concisely in Bengali or English based on the user query.'
            }
        });

        return res.json({
            reply: response.text || ''
        });
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
