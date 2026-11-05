"""
=============================================================================
FARMER BUDDY (কৃষি বন্ধু) - AI AGRICULTURAL ASSISTANT BACKEND
=============================================================================
FastAPI Streaming Server powered by Google Gemini API (gemini-3.8-flash).
Features:
- Low-latency Server-Sent Events (SSE) streaming token-by-token
- Context window trimmed to last 2 turns for ultra-low token & bandwidth consumption
- Empathetic rural agricultural advisor persona in colloquial Bengali (চলতি বাংলা)
- Organic-first pest management, NPK scheduling, weather defense & fair-market pricing
=============================================================================
"""

import os
import json
import asyncio
from typing import List, Literal, AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Load environment variables if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(
    title="Farmer Buddy API (কৃষি বন্ধু)",
    description="Empathetic, ultra-fast AI Agricultural Companion for Farmers",
    version="1.0.0"
)

# CORS Setup - Allows frontend connection
origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5500",
    "http://localhost:8080",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# PYDANTIC STRICT SCHEMAS
# =============================================================================

class ChatMessage(BaseModel):
    sender: Literal["user", "buddy"] = Field(..., description="Message author")
    text: str = Field(..., min_length=1, max_length=2000, description="Message content")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500, description="Farmer query")
    history: List[ChatMessage] = Field(default=[], description="Past conversation turns")

# =============================================================================
# SYSTEM PERSONA INSTRUCTION (FARMER BUDDY)
# =============================================================================

SYSTEM_PROMPT = """
আপনি 'Farmer Buddy' (কৃষি বন্ধু) — বাংলাদেশের একজন আন্তরিক, অভিজ্ঞ ও সহানুভূতিশীল মাঠপর্যায়ের কৃষি কর্মকর্তা এবং কৃষকের বিশ্বস্ত পরম বন্ধু।

আপনার কথা বলার ধরণ ও আচরণবিধি:
১. ভাষা: সহজ, মিষ্টি ও সাবলীল চলতি বাংলা (সহজ গ্রামীণ কৃষকের বোধগম্য)। কঠিন পারিভাষিক বা কেতাবি শব্দ পরিহার করুন।
২. সহমর্মিতা সবার আগে: কৃষক কোনো সমস্যা জানালে প্রথমেই তার কষ্ট ও দুশ্চিন্তা মন থেকে দূর করুন (যেমন: "ভাই, একদম দুশ্চিন্তা করবেন না, ইনশাআল্লাহ সমস্যাটা আমরা একসাথে দ্রুত সমাধান করবো...").
৩. রোগবালাই ও কীট দমনে জৈব পদ্ধতি আগে:
   - লক্ষণ অস্পষ্ট হলে মাত্র ১টি সহজ স্পষ্টকারী প্রশ্ন করুন।
   - সবসময় প্রথমে স্বল্প খরচের ঘরোয়া বা জৈব সমাধান দিন (যেমন: নিমপাতার রস, কাঠের ছাই, আলোর ফাঁদ, ডাল পোঁতা)।
   - তীব্র আক্রমণের ক্ষেত্রে নির্দিষ্ট কীটনাশক/ছত্রাকনাশকের নাম এবং সঠিক মাত্রা (যেমন: ১ মিলি প্রতি লিটার পানি) উল্লেখ করুন।
৪. সুষম সার ব্যবস্থাপনা: ইউরিয়া, টিএসপি, পটাশ (N-P-K) সঠিক অনুপাতে এবং কিস্তিতে প্রয়োগের সুনির্দিষ্ট পরামর্শ দিন।
৫. প্রাকৃতিক দুর্যোগ ও আবহাওয়া: অতিবৃষ্টি, ঝড় বা বন্যার আগে দ্রুত পানি নিষ্কাশনের নালা কাটা, চারা রক্ষা ও হেলে পড়া গাছ বাঁধার সহজ কৌশল দিন।
৬. ফসল সংরক্ষণ ও ন্যায্য বাজারদর: সঠিক আর্দ্রতা পরীক্ষা, রোদে শুকানো, ড্রাম/বায়ুরোধী ব্যাগে সংরক্ষণ এবং মধ্যস্বত্বভোগী এড়িয়ে স্থানীয় পাইকারি বা সমবায় বাজারে ন্যায্য দামে বিক্রির পরামর্শ দিন।
৭. ডেটা-সেভার বাধ্যবাধকতা:
   - উত্তর সবসময় পরিষ্কার বুলেট পয়েন্টে সাজাবেন।
   - মোট শব্দসংখ্যা অবশ্যই ৮০ থেকে ১১০ শব্দের মধ্যে সীমাবদ্ধ রাখবেন।
   - উত্তরের শেষে মাত্র ১টি অনুপ্রেরণামূলক বা খোঁজখবরমূলক সংক্ষিপ্ত প্রশ্ন রাখবেন।
"""

# =============================================================================
# GEMINI API INITIALIZATION (GOOGLE-GENAI WITH FALLBACK)
# =============================================================================

API_KEY = os.getenv("GEMINI_API_KEY", "")

# Determine which SDK is available
genai_client = None
legacy_model = None

try:
    from google import genai
    if API_KEY:
        genai_client = genai.Client(api_key=API_KEY)
except Exception as e:
    pass

if not genai_client:
    try:
        import google.generativeai as legacy_genai
        if API_KEY:
            legacy_genai.configure(api_key=API_KEY)
            legacy_model = legacy_genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=SYSTEM_PROMPT
            )
    except Exception:
        pass


def build_conversation_context(history: List[ChatMessage], new_message: str) -> str:
    """Limits conversation history to last 2 turns to minimize token payload."""
    recent_history = history[-4:] if len(history) > 4 else history
    context_lines = []
    for turn in recent_history:
        role = "কৃষক" if turn.sender == "user" else "কৃষি বন্ধু"
        context_lines.append(f"{role}: {turn.text}")
    context_lines.append(f"কৃষক: {new_message}")
    context_lines.append("কৃষি বন্ধু:")
    return "\n".join(context_lines)


async def generate_gemini_stream(prompt_text: str) -> AsyncGenerator[str, None]:
    """Streams response word-by-word from Gemini API with fallback."""
    # Option 1: google-genai modern client
    if genai_client:
        try:
            loop = asyncio.get_event_loop()
            # Run generator in thread pool since SDK might be synchronous iterator
            def fetch_stream():
                return genai_client.interactions.create(
                    model="gemini-3.8-flash",
                    input=prompt_text,
                    system_instruction=SYSTEM_PROMPT,
                    stream=True
                )
            stream_iter = await loop.run_in_executor(None, fetch_stream)
            for event in stream_iter:
                if hasattr(event, "event_type") and event.event_type == "step.delta":
                    if hasattr(event.delta, "type") and event.delta.type == "text":
                        text_chunk = event.delta.text
                        if text_chunk:
                            yield text_chunk
                elif hasattr(event, "text"):
                    yield event.text
            return
        except Exception as e:
            print(f"[FarmerBuddy Warning] google-genai stream error: {e}")

    # Option 2: google-generativeai fallback
    if legacy_model:
        try:
            response = legacy_model.generate_content(prompt_text, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            print(f"[FarmerBuddy Warning] google-generativeai error: {e}")

    # Option 3: Intelligent Knowledge-Based Fallback (When API key is not yet set)
    fallback_response = generate_smart_fallback(prompt_text)
    for word in fallback_response.split(" "):
        await asyncio.sleep(0.04) # Simulate natural live streaming
        yield word + " "


def generate_smart_fallback(query: str) -> str:
    """Empathetic, structured fallback responses matching Farmer Buddy persona."""
    q = query.lower()

    if any(k in q for k in ["রোগ", "পোকা", "মাজরা", "পচন", "দাগ", "pest", "disease"]):
        return (
            "ভাই, একদম দুশ্চিন্তা করবেন না! সমস্যাটা আমরা ইনশাআল্লাহ দ্রুত সমাধান করবো।\n\n"
            "• প্রাথমিক ঘরোয়া সমাধান: ১ লিটার পানিতে ৫ মিলি নিমতেল ও সামান্য ডিটারজেন্ট মিশিয়ে ভোরে বা বিকেলে স্প্রে করুন। জমিতে পাখি বসার জন্য বাঁশের কঞ্চি বা ডাল পুঁতে দিন (পার্চিং পদ্ধতি)।\n"
            "• আক্রমণ বেশি হলে: মাজরা বা লেদা পোকার জন্য 'কার্বোফিউরান' বা পাতা মোড়ানো পোকার জন্য 'এমামেকটিন বেনজোয়েট' (১ গ্রাম প্রতি লিটার পানি) স্প্রে করুন।\n\n"
            "আপনার আক্রান্ত গাছের পাতা কি হলুদ হয়ে শুকিয়ে যাচ্ছে, নাকি ভেতরে ছিদ্র দেখা যাচ্ছে?"
        )
    elif any(k in q for k in ["সার", "ইউরিয়া", "পটাশ", "টিএসপি", "fertilizer", "npk"]):
        return (
            "ভাই, ফসলের সুষম সার নিশ্চিত করলে ফলন চমৎকার হবে, ভরসা রাখুন!\n\n"
            "• ইউরিয়া (N): একবারে সব না দিয়ে সমান ৩ কিস্তিতে দিন—চারা রোপণের ১৫ দিন, ৩০ দিন এবং থোড় আসার ৫-৭ দিন আগে।\n"
            "• টিএসপি ও পটাশ (P-K): জমি তৈরির শেষ চাষের সময় পুরোটা মাটির সাথে ভালো করে মিশিয়ে দিন।\n"
            "• বিশেষ টিপস: প্রতি শতকে অন্তত ১৫ কেজি পচা গোবর বা কম্পোস্ট দিলে মাটির রস ধরে রাখার ক্ষমতা দ্বিগুণ হয়।\n\n"
            "আপনার জমিটি কোন ফসলের এবং মাটি কি বেলে নাকি এঁটেল দোআঁশ?"
        )
    elif any(k in q for k in ["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "weather", "rain"]):
        return (
            "ভাই, খারাপ আবহাওয়ার পূর্বাভাস পেলে শান্ত থাকুন, আগে থেকেই প্রস্তুতি নিলে ক্ষতি এড়ানো সম্ভব!\n\n"
            "• ড্রেনেজ ব্যবস্থা: জমির চারপাশে অন্তত ১ ফুট গভীর নালা কেটে রাখুন যাতে বৃষ্টির পানি দ্রুত নেমে যেতে পারে।\n"
            "• সেচ ও স্প্রে স্থগিত: আগামী ৪৮ ঘণ্টার মধ্যে বৃষ্টি হলে সব ধরণের সেচ এবং কীটনাশক স্প্রে বন্ধ রাখুন।\n"
            "• হেলে পড়া গাছ: বাতাসের তোড়ে ভুট্টা বা সবজি গাছ হেলে পড়লে ৪-৫টি গাছ একসাথে আলতো করে বেঁধে দিন।\n\n"
            "আপনার মাঠে কি এখন পাকা ধান বা ফসল কাটার উপযোগী আছে?"
        )
    elif any(k in q for k in ["দাম", "বাজার", "বিক্রি", "পাইকারি", "market", "price"]):
        return (
            "ভাই, রক্তপানি করা ফসলের ন্যায্য দাম পাওয়া আপনার অধিকার, আমরা ফড়িয়াদের ঠকাতে দেবো না!\n\n"
            "• গ্রেডিং বা বাছাই: আকার ও মান অনুযায়ী ফসল ৩টি গ্রেডে আলাদা করুন। ভালো গ্রেডের পণ্যে ১৫-২০% বেশি দাম পাওয়া যায়।\n"
            "• সরাসরি বিক্রি: গ্রামের মধ্যস্বত্বভোগী পরিহার করে সরাসরি উপজেলা বা জেলা পাইকারি আড়তে বিক্রি করুন।\n"
            "• দলগত বিপণন: কয়েকজন কৃষক মিলে যৌথভাবে পিকআপ বা ভ্যানে মাল পাঠালে পরিবহন খরচ অর্ধেকে নেমে আসে।\n\n"
            "আপনি কোন ফসলটি বর্তমানে বিক্রির জন্য প্রস্তুত করছেন?"
        )
    elif any(k in q for k in ["সংরক্ষণ", "বীজ", "ড্রাম", "storage", "harvest"]):
        return (
            "ভাই, সোনার ফসল ঘরে তোলার পর সঠিক সংরক্ষণে কোনো অপচয় হবে না, শুনুন:\n\n"
            "• আর্দ্রতা পরীক্ষা: ধান বা গম কড়া রোদে একটানা ৩-৪ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে আনুন (দাঁতে কাটলে 'কট' শব্দ হবে)।\n"
            "• বায়ুরোধী পাত্র: পরিষ্কার প্লাস্টিক ড্রাম বা এয়ারটাইট সুপার গ্রেইন ব্যাগে বীজ সংরক্ষণ করুন।\n"
            "• পোকা প্রতিরোধ: পাত্রের নিচে ও উপরে শুকনো নিমপাতা বা তেজপাতা দিয়ে মুখ ভালো করে মোম বা পলিথিন দিয়ে এটে দিন।\n\n"
            "আপনি কি বীজ হিসেবে রাখবেন নাকি খাবার উদ্দেশ্যে সংরক্ষণ করছেন?"
        )
    else:
        return (
            "আসসালামু আলাইকুম ভাই! আমি আপনার কৃষক বন্ধু। জমি প্রস্তুত থেকে শুরু করে ফসল ঘরে তোলা পর্যন্ত যেকোনো দরকারে আমি পাশে আছি।\n\n"
            "• রোগবালাই ও পোকা দমন\n"
            "• সুষম সার ও সেচ পরামর্শ\n"
            "• ঝড়-বৃষ্টিতে ফসলের সুরক্ষা\n"
            "• ন্যায্য বাজারদর ও ফসল সংরক্ষণ\n\n"
            "আজ আপনার কোন ফসলটি নিয়ে কথা বলবেন বলুন তো?"
        )

# =============================================================================
# STREAMING ENDPOINT (POST /api/chat/stream)
# =============================================================================

@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Accepts farmer message and context history.
    Streams Server-Sent Events (SSE) word-by-word.
    """
    try:
        prompt_text = build_conversation_context(request.history, request.message)

        async def sse_event_stream():
            try:
                async for text_chunk in generate_gemini_stream(prompt_text):
                    payload = json.dumps({"text": text_chunk}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                # Signal completion
                yield "data: [DONE]\n\n"
            except Exception as stream_err:
                err_payload = json.dumps({"error": str(stream_err)}, ensure_ascii=False)
                yield f"data: {err_payload}\n\n"

        return StreamingResponse(
            sse_event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check status endpoint."""
    return {
        "status": "online",
        "service": "Farmer Buddy AI Assistant",
        "gemini_configured": bool(API_KEY and (genai_client or legacy_model)),
        "model": "gemini-3.8-flash"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🌾 Farmer Buddy Backend running on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
