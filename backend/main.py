"""
=============================================================================
FARMER BUDDY (কৃষি বন্ধু) - AI AGRICULTURAL ASSISTANT BACKEND
=============================================================================
FastAPI Streaming Server powered by Google Gemini API.
Features:
- Bilingual Support: English (Default) and Bangla (বাংলা), dynamically toggled
- Low-latency Server-Sent Events (SSE) streaming word-by-word
- Context window limited to last 2 turns for ultra-low token & bandwidth consumption
- Empathetic agricultural officer persona
- Organic-first pest management, balanced NPK, weather defense & fair-market pricing
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

# Load environment variables if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(
    title="Farmer Buddy API (কৃষি বন্ধু)",
    description="Empathetic, ultra-fast AI Agricultural Companion for Farmers",
    version="1.1.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ChatMessage(BaseModel):
    sender: Literal["user", "buddy"] = Field(..., description="Message author")
    text: str = Field(..., min_length=1, max_length=2000, description="Message content")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500, description="Farmer query")
    history: List[ChatMessage] = Field(default=[], description="Past conversation turns")
    lang: Literal["en", "bn"] = Field(default="en", description="Language: 'en' for English, 'bn' for Bangla")

# =============================================================================
# SYSTEM PERSONA PROMPTS (ENGLISH & BANGLA)
# =============================================================================

SYSTEM_PROMPTS = {
    "en": """
You are 'Farmer Buddy' — an empathetic, deeply knowledgeable, and trusted agricultural extension officer and a farmer's best friend.

STRICT GREETING & LANGUAGE RULES:
1. ABSOLUTE GREETING RESTRICTION (NO "NOMOSKAR"):
   - NEVER use the word "নমস্কার" (Nomoskar) or any equivalent variant under any circumstances.
2. STRICT LANGUAGE-BASED GREETING RULE:
   - When communicating in English, ALWAYS start your response with "Hello" or "Hi" (e.g., "Hello friend! I am reviewing your field...").

Guidelines:
1. Tone: Warm, friendly, supportive, and practical. Speak like a real human agricultural advisor visiting their farm. Never sound like an academic textbook or dry manual.
2. Empathy First: If the farmer describes a loss, pest, or problem, always reassure them with genuine kindness first (e.g., "Hello friend! Don't worry, we'll solve this problem together step-by-step...").
3. Organic/Low-cost Solutions First:
   - If symptoms are vague, ask 1 simple clarifying question.
   - Always offer low-cost organic or home remedies first (neem oil spray, wood ash dusting, light traps, bird perches).
   - If severe, mention specific chemical controls with exact dosages (e.g., 1 ml per liter of water).
4. Balanced Fertilizer & Soil: Guide on Urea (N), TSP (P), and MOP (K) split-application timing and compost benefits.
5. Weather & Flood Prep: Quick drainage trenches, seedling protection, tying lodged plants.
6. Storage & Fair Market Price: Proper moisture limits (<12%), airtight grain bags/drums, grading produce to avoid predatory middlemen.
7. Data-Saver Constraint: Keep responses in clean bullet points, under 80–110 words, ending with exactly 1 supportive follow-up question.
""",
    "bn": """
আপনি 'Farmer Buddy' (কৃষি বন্ধু) — বাংলাদেশের একজন আন্তরিক, অভিজ্ঞ ও সহানুভূতিশীল মাঠপর্যায়ের কৃষি কর্মকর্তা এবং কৃষকের বিশ্বস্ত পরম বন্ধু।

কঠোর শুভেচ্ছা ও অভিবাদন নির্দেশিকা:
১. "নমস্কার" সম্পূর্ণ নিষিদ্ধ:
   - কোনো অবস্থাতেই "নমস্কার" (Nomoskar) বা এর কোনো রূপ ব্যবহার করবেন না।
২. ভাষাভিত্তিক বাধ্যতামূলক শুভেচ্ছা:
   - বাংলায় কথা বলার সময় উত্তরের শুরুতে অবশ্যই "আসসালামু আলাইকুম" অথবা "আসসালামু আলাইকুম ভাই/বন্ধু!" দিয়ে শুরু করবেন (যেমন: "আসসালামু আলাইকুম ভাই! আপনার দেওয়া তথ্য অনুযায়ী...").

আপনার কথা বলার ধরণ ও আচরণবিধি:
১. ভাষা: সহজ, মিষ্টি ও সাবলীল চলতি বাংলা (সহজ গ্রামীণ কৃষকের বোধগম্য)। কঠিন পারিভাষিক বা কেতাবি শব্দ পরিহার করুন।
২. সহমর্মিতা সবার আগে: কৃষক কোনো সমস্যা জানালে প্রথমেই তার কষ্ট ও দুশ্চিন্তা মন থেকে দূর করুন (যেমন: "আসসালামু আলাইকুম ভাই! একদম দুশ্চিন্তা করবেন না, সমস্যাটা আমরা একসাথে সমাধান করবো...").
৩. রোগবালাই ও কীট দমনে জৈব পদ্ধতি আগে:
   - লক্ষণ অস্পষ্ট হলে মাত্র ১টি সহজ স্পষ্টকারী প্রশ্ন করুন।
   - সবসময় প্রথমে স্বল্প খরচের ঘরোয়া বা জৈব সমাধান দিন (যেমন: নিমপাতার স্প্রে, কাঠের ছাই, আলোর ফাঁদ, পার্চিং বা ডাল পোঁতা)।
   - তীব্র আক্রমণের ক্ষেত্রে নির্দিষ্ট কীটনাশক/ছত্রাকনাশকের নাম এবং সঠিক মাত্রা (যেমন: ১ মিলি প্রতি লিটার পানি) উল্লেখ করুন।
৪. সুষম সার ব্যবস্থাপনা: ইউরিয়া, টিএসপি, পটাশ (N-P-K) সঠিক অনুপাতে এবং কিস্তিতে প্রয়োগের সুনির্দিষ্ট পরামর্শ দিন।
৫. প্রাকৃতিক দুর্যোগ ও আবহাওয়া: অতিবৃষ্টি, ঝড় বা বন্যার আগে দ্রুত পানি নিষ্কাশনের নালা কাটা, চারা রক্ষা ও হেলে পড়া গাছ বাঁধার সহজ কৌশল দিন।
৬. ফসল সংরক্ষণ ও ন্যায্য বাজারদর: সঠিক আর্দ্রতা পরীক্ষা, রোদে শুকানো, ড্রাম/বায়ুরোধী ব্যাগে সংরক্ষণ এবং মধ্যস্বত্বভোগী এড়িয়ে স্থানীয় পাইকারি বা সমবায় বাজারে ন্যায্য দামে বিক্রির পরামর্শ দিন।
৭. ডেটা-সেভার বাধ্যবাধকতা:
   - উত্তর সবসময় পরিষ্কার বুলেট পয়েন্টে সাজাবেন।
   - মোট শব্দসংখ্যা অবশ্যই ৮০ থেকে ১১০ শব্দের মধ্যে সীমাবদ্ধ রাখবেন।
   - উত্তরের শেষে মাত্র ১টি অনুপ্রেরণামূলক বা খোঁজখবরমূলক সংক্ষিপ্ত প্রশ্ন রাখবেন।
"""
}

# =============================================================================
# GEMINI API INITIALIZATION
# =============================================================================

API_KEY = os.getenv("GEMINI_API_KEY", "")

genai_client = None
legacy_model = None

try:
    from google import genai
    if API_KEY:
        genai_client = genai.Client(api_key=API_KEY)
except Exception:
    pass

if not genai_client:
    try:
        import google.generativeai as legacy_genai
        if API_KEY:
            legacy_genai.configure(api_key=API_KEY)
            legacy_model = legacy_genai.GenerativeModel(model_name="gemini-1.5-flash")
    except Exception:
        pass


def build_conversation_context(history: List[ChatMessage], new_message: str, lang: str) -> str:
    recent_history = history[-4:] if len(history) > 4 else history
    context_lines = []
    user_label = "Farmer" if lang == "en" else "কৃষক"
    buddy_label = "Farmer Buddy" if lang == "en" else "কৃষি বন্ধু"

    for turn in recent_history:
        role = user_label if turn.sender == "user" else buddy_label
        context_lines.append(f"{role}: {turn.text}")
    context_lines.append(f"{user_label}: {new_message}")
    context_lines.append(f"{buddy_label}:")
    return "\n".join(context_lines)


async def generate_gemini_stream(prompt_text: str, lang: str) -> AsyncGenerator[str, None]:
    sys_instruction = SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS["en"])

    if genai_client:
        try:
            loop = asyncio.get_event_loop()
            def fetch_stream():
                return genai_client.interactions.create(
                    model="gemini-3.8-flash",
                    input=prompt_text,
                    system_instruction=sys_instruction,
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

    if legacy_model:
        try:
            full_prompt = f"{sys_instruction}\n\n{prompt_text}"
            response = legacy_model.generate_content(full_prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            print(f"[FarmerBuddy Warning] google-generativeai error: {e}")

    fallback_response = generate_smart_fallback(prompt_text, lang)
    for word in fallback_response.split(" "):
        await asyncio.sleep(0.035)
        yield word + " "


def enforce_greeting_rules(reply: str, lang: str) -> str:
    if not reply:
        return reply
    import re
    cleaned = reply
    is_bn = (lang == "bn")
    # 1. Absolute restriction: never say Nomoskar
    cleaned = re.sub(r'নমস্কার[^\s,.!?।]*\s*', 'আসসালামু আলাইকুম ' if is_bn else 'Hello ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bnomoskar\b[^\s,.!?]*\s*', 'Assalamu Alaikum ' if is_bn else 'Hello ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bnamaskar\b[^\s,.!?]*\s*', 'Assalamu Alaikum ' if is_bn else 'Hello ', cleaned, flags=re.IGNORECASE)

    trimmed = cleaned.strip()
    if is_bn:
        if not trimmed.startswith("আসসালামু আলাইকুম"):
            if re.match(r'^(হ্যালো|হাই|নমস্কার|ভাই[,!]|বন্ধু[,!]|আরে ভাই[,!])\s*', trimmed, flags=re.IGNORECASE):
                cleaned = re.sub(r'^(হ্যালো|হাই|নমস্কার|ভাই[,!]|বন্ধু[,!]|আরে ভাই[,!])\s*', 'আসসালামু আলাইকুম ভাই! ', trimmed, flags=re.IGNORECASE)
            else:
                cleaned = f"আসসালামু আলাইকুম ভাই! {trimmed}"
    else:
        if not trimmed.lower().startswith("hello") and not trimmed.lower().startswith("hi"):
            if re.match(r'^(assalamu alaikum|salam|namaskar|nomoskar|hey|friend[,!])\s*', trimmed, flags=re.IGNORECASE):
                cleaned = re.sub(r'^(assalamu alaikum|salam|namaskar|nomoskar|hey|friend[,!])\s*', 'Hello friend! ', trimmed, flags=re.IGNORECASE)
            else:
                cleaned = f"Hello friend! {trimmed}"
    return cleaned


def generate_smart_fallback(query: str, lang: str) -> str:
    q = query.lower()

    if lang == "en":
        if any(k in q for k in ["pest", "disease", "insect", "leaf", "rot", "yellow", "stem"]):
            res = (
                "Hello friend! Don't worry, we will solve this pest issue together step-by-step.\n\n"
                "• **Low-Cost Organic Remedy:** Mix 5 ml neem oil with a drop of liquid soap in 1 liter of water and spray during early morning or late afternoon. Place bamboo perches in the field for birds to catch harmful moths.\n"
                "• **If Infestation is Severe:** For stem borers or leaf folders, apply Emamectin Benzoate (1 g per liter of water) targeting the foliage evenly.\n\n"
                "Are the leaves turning yellow with holes, or is the center shoot withering?"
            )
        elif any(k in q for k in ["fertilizer", "urea", "tsp", "potash", "npk", "soil"]):
            res = (
                "Hello friend! Balanced fertilizer will ensure vigorous plant growth and excellent yield!\n\n"
                "• **Urea (Nitrogen):** Split into 3 equal doses—15 days after planting, 30 days, and 5-7 days before flowering/heading. Never dump it all at once.\n"
                "• **TSP & Potash (P & K):** Apply the entire amount during the final land preparation so roots absorb it early.\n"
                "• **Organic Boost:** Adding well-rotted compost (15 kg per decimal) doubles soil moisture retention.\n\n"
                "What crop are you currently preparing the soil for?"
            )
        elif any(k in q for k in ["weather", "rain", "storm", "flood", "cloud"]):
            res = (
                "Hello friend! When storms or heavy rains are forecast, timely action saves the harvest:\n\n"
                "• **Emergency Drainage:** Cut 1-foot deep runoff trenches around field perimeter bunds immediately so water doesn't stagnate.\n"
                "• **Halt Irrigation & Sprays:** Postpone all chemical spraying and fertilizer top-dressing if rain is expected in 48 hours.\n"
                "• **Lodging Support:** If tall maize or vegetable plants lean in high winds, gently tie 4-5 stalks together for mutual support.\n\n"
                "Does your field have a clear outlet for excess rainwater to drain away?"
            )
        elif any(k in q for k in ["market", "price", "sell", "middlemen", "rate"]):
            res = (
                "Hello friend! You worked hard to grow this crop, and you deserve every penny of fair market value!\n\n"
                "• **Grading:** Sort your produce into Grade A, B, and C. Well-graded produce earns a 15–20% premium at wholesale.\n"
                "• **Bypass Middlemen:** Transport produce directly to the regional wholesale market or farmer cooperatives instead of selling at farmgate.\n"
                "• **Collective Shipping:** Partner with 2-3 neighboring farmers to share pickup or van costs, cutting freight expenses in half.\n\n"
                "Which crop are you preparing to take to market soon?"
            )
        elif any(k in q for k in ["storage", "seed", "drum", "grain", "harvest"]):
            res = (
                "Hello friend! Harvesting is just half the battle—proper storage protects your hard-earned grain!\n\n"
                "• **Moisture Testing:** Sun-dry grain for 3 consecutive days until moisture is under 12% (a seed should break with a crisp 'snap' between your teeth).\n"
                "• **Airtight Containers:** Store in clean plastic drums or hermetic grain bags. Keep containers on wooden planks, never directly on cold ground.\n"
                "• **Natural Pest Barrier:** Place dry neem or bay leaves at the bottom and top of the drum before sealing airtight.\n\n"
                "Are you storing grain for food consumption or saving seeds for next season?"
            )
        else:
            res = (
                "Hello friend! I am **Farmer Buddy**, your trusted farming companion. From sowing to selling, I am here by your side.\n\n"
                "• Pest and disease diagnosis with low-cost remedies\n"
                "• Balanced N-P-K fertilizer schedules\n"
                "• Storm and flood defense\n"
                "• Fair wholesale market pricing and storage\n\n"
                "Which crop are we working on in your field today?"
            )
    else: # Bangla
        if any(k in q for k in ["রোগ", "পোকা", "মাজরা", "পচন", "দাগ", "pest", "disease"]):
            res = (
                "আসসালামু আলাইকুম ভাই! একদম দুশ্চিন্তা করবেন না! সমস্যাটা আমরা ইনশাআল্লাহ দ্রুত সমাধান করবো।\n\n"
                "• **ঘরোয়া নিম স্প্রে:** ১ লিটার পানিতে ৫ মিলি নিমতেল ও সামান্য শ্যাম্পু মিশিয়ে গাছে স্প্রে করুন। জমিতে পাখি বসার জন্য ডাল পুঁতে দিন (পার্চিং পদ্ধতি)।\n"
                "• **তীব্র আক্রমণ:** পাতা মোড়ানো বা মাজরা পোকার জন্য 'এমামেকটিন বেনজোয়েট' (১ গ্রাম প্রতি লিটার পানি) স্প্রে করুন।\n\n"
                "আপনার আক্রান্ত গাছের পাতা কি হলুদ হয়ে শুকিয়ে যাচ্ছে, নাকি ভেতরে ছিদ্র দেখা যাচ্ছে?"
            )
        elif any(k in q for k in ["সার", "ইউরিয়া", "পটাশ", "টিএসপি", "fertilizer", "npk"]):
            res = (
                "আসসালামু আলাইকুম ভাই! ফসলের সুষম সার নিশ্চিত করলে ফলন চমৎকার হবে, ভরসা রাখুন!\n\n"
                "• **ইউরিয়া (N):** একবারে সব না দিয়ে সমান ৩ কিস্তিতে দিন—চারা রোপণের ১৫ দিন, ৩০ দিন এবং থোড় আসার ৫-৭ দিন আগে।\n"
                "• **টিএসপি ও পটাশ (P-K):** জমি তৈরির শেষ চাষের সময় পুরোটা মাটির সাথে ভালো করে মিশিয়ে দিন।\n"
                "• **জৈব সার:** প্রতি শতকে অন্তত ১৫ কেজি পচা গোবর বা কম্পোস্ট দিলে মাটির রস ধরে রাখার ক্ষমতা দ্বিগুণ হয়।\n\n"
                "আপনার জমিটি কোন ফসলের এবং মাটি কি বেলে নাকি এঁটেল দোআঁশ?"
            )
        elif any(k in q for k in ["বৃষ্টি", "ঝড়", "বন্যা", "আবহাওয়া", "weather", "rain"]):
            res = (
                "আসসালামু আলাইকুম ভাই! খারাপ আবহাওয়ার পূর্বাভাস পেলে শান্ত থাকুন, আগে থেকেই প্রস্তুতি নিলে ক্ষতি এড়ানো সম্ভব!\n\n"
                "• **ড্রেনেজ ব্যবস্থা:** জমির চারপাশে অন্তত ১ ফুট গভীর নালা কেটে রাখুন যাতে বৃষ্টির পানি দ্রুত নেমে যেতে পারে।\n"
                "• **সেচ ও স্প্রে স্থগিত:** আগামী ৪৮ ঘণ্টার মধ্যে বৃষ্টি হলে সব ধরণের সেচ এবং কীটনাশক স্প্রে বন্ধ রাখুন।\n"
                "• **হেলে পড়া গাছ:** বাতাসের তোড়ে ভুট্টা বা সবজি গাছ হেলে পড়লে ৪-৫টি গাছ একসাথে আলতো করে বেঁধে দিন।\n\n"
                "আপনার মাঠে কি এখন পাকা ধান বা ফসল কাটার উপযোগী আছে?"
            )
        elif any(k in q for k in ["দাম", "বাজার", "বিক্রি", "পাইকারি", "market", "price"]):
            res = (
                "আসসালামু আলাইকুম ভাই! রক্তপানি করা ফসলের ন্যায্য দাম পাওয়া আপনার অধিকার, আমরা ফড়িয়াদের ঠকাতে দেবো না!\n\n"
                "• **গ্রেডিং বা বাছাই:** আকার ও মান অনুযায়ী ফসল ৩টি গ্রেডে আলাদা করুন। ভালো গ্রেডের পণ্যে ১৫-২০% বেশি দাম পাওয়া যায়।\n"
                "• **সরাসরি বিক্রি:** গ্রামের মধ্যস্বত্বভোগী পরিহার করে সরাসরি উপজেলা বা জেলা পাইকারি আড়তে বিক্রি করুন।\n"
                "• **দলগত বিপণন:** কয়েকজন কৃষক মিলে যৌথভাবে পিকআপ বা ভ্যানে মাল পাঠালে পরিবহন খরচ অর্ধেকে নেমে আসে।\n\n"
                "আপনি কোন ফসলটি বর্তমানে বিক্রির জন্য প্রস্তুত করছেন?"
            )
        elif any(k in q for k in ["সংরক্ষণ", "বীজ", "ড্রাম", "storage", "harvest"]):
            res = (
                "আসসালামু আলাইকুম ভাই! সোনার ফসল ঘরে তোলার পর সঠিক সংরক্ষণে কোনো অপচয় হবে না, শুনুন:\n\n"
                "• **আর্দ্রতা পরীক্ষা:** ধান বা গম কড়া রোদে একটানা ৩-৪ দিন শুকিয়ে আর্দ্রতা ১২%-এর নিচে আনুন (দাঁতে কাটলে 'কট' শব্দ হবে)।\n"
                "• **বায়ুরোধী পাত্র:** পরিষ্কার প্লাস্টিক ড্রাম বা এয়ারটাইট সুপার গ্রেইন ব্যাগে বীজ সংরক্ষণ করুন।\n"
                "• **পোকা প্রতিরোধ:** পাত্রের নিচে ও উপরে শুকনো নিমপাতা বা তেজপাতা দিয়ে মুখ ভালো করে মোম বা পলিথিন দিয়ে এটে দিন।\n\n"
                "আপনি কি বীজ হিসেবে রাখবেন নাকি খাবার উদ্দেশ্যে সংরক্ষণ করছেন?"
            )
        else:
            res = (
                "আসসালামু আলাইকুম ভাই! আমি আপনার **কৃষি বন্ধু**। জমি প্রস্তুত থেকে শুরু করে ফসল ঘরে তোলা পর্যন্ত যেকোনো দরকারে আমি পাশে আছি।\n\n"
                "• রোগবালাই ও পোকা দমন\n"
                "• সুষম সার ও সেচ পরামর্শ\n"
                "• ঝড়-বৃষ্টিতে ফসলের সুরক্ষা\n"
                "• ন্যায্য বাজারদর ও ফসল সংরক্ষণ\n\n"
                "আজ আপনার কোন ফসলটি নিয়ে কথা বলবেন বলুন তো?"
            )
    return enforce_greeting_rules(res, lang)


@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    try:
        lang = request.lang or "en"
        prompt_text = build_conversation_context(request.history, request.message, lang)

        async def sse_event_stream():
            try:
                async for text_chunk in generate_gemini_stream(prompt_text, lang):
                    payload = json.dumps({"text": text_chunk}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
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

# =============================================================================
# FARMER AUTH SCHEMAS & HYBRID BACKEND STORAGE
# =============================================================================

class FarmerAuthPayload(BaseModel):
    id: str = "farmer-id"
    phone: str
    pin: str
    name: str
    district: str
    lat: float = 24.7471
    lon: float = 90.4203
    landSizeDecimals: float = 30.0
    primaryCrop: str = "rice"
    soilType: str = "loamy"
    createdAt: str = ""

class LoginPayload(BaseModel):
    phone: str
    pin: str

FARMERS_STORE = {
    "01711223344": {
        "id": "demo-rahim-01",
        "phone": "01711223344",
        "pin": "1234",
        "name": "মোঃ রহিম উদ্দিন (Rahim Uddin)",
        "district": "Mymensingh",
        "lat": 24.7471,
        "lon": 90.4203,
        "landSizeDecimals": 2500.0,  # 25 Acres (75 Bigha)
        "primaryCrop": "rice",
        "soilType": "loamy",
        "createdAt": "2026-01-01T00:00:00Z"
    }
}

@app.post("/api/auth/register")
async def register_farmer(payload: FarmerAuthPayload):
    FARMERS_STORE[payload.phone] = payload.dict()
    print(f"[FastAPI Auth Sync] ✅ Registered/Updated farmer: {payload.name} ({payload.phone})")
    return {"success": True, "farmer": payload.dict()}

@app.post("/api/auth/login")
async def login_farmer(creds: LoginPayload):
    farmer = FARMERS_STORE.get(creds.phone)
    if not farmer or str(farmer.get("pin")) != str(creds.pin):
        raise HTTPException(status_code=401, detail="Invalid phone number or PIN code")
    return {"success": True, "farmer": farmer}

@app.post("/api/auth/sync")
async def sync_farmer(payload: FarmerAuthPayload):
    FARMERS_STORE[payload.phone] = payload.dict()
    return {"success": True, "farmer": payload.dict()}

@app.get("/api/auth/profile")
async def get_profile(phone: str):
    farmer = FARMERS_STORE.get(phone)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {"farmer": farmer}

@app.get("/api/auth/farmers")
async def get_all_farmers():
    return {"farmers": list(FARMERS_STORE.values())}

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "Farmer Buddy AI Assistant",
        "gemini_configured": bool(API_KEY and (genai_client or legacy_model)),
        "default_lang": "en",
        "model": "gemini-3.8-flash"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🌾 Farmer Buddy Backend running on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
