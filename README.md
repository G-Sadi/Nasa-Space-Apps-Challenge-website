<div align="center">

# 🌱 Field Shift
### NASA-Powered Photorealistic 3D Smart Farming & Multimodal AI Agronomist Platform
**Official Project for the 2026 NASA International Space Apps Challenge**  
*Developed with 💚 by **Team ASL Spectra** (Bangladesh)*

<br/>

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Global%20Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)
[![NASA POWER API](https://img.shields.io/badge/NASA%20POWER-Agroclimatology%20(community=AG)-0284c7?style=for-the-badge&logo=nasa&logoColor=white)](https://power.larc.nasa.gov/)
[![Three.js WebGL](https://img.shields.io/badge/Three.js-WebGL%203D%20PBR-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Google Gemini 2.5 Flash](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20Multimodal-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Performance](https://img.shields.io/badge/Mobile--First-60%20FPS%20%7C%20Sub--1s%20Load-10b981?style=for-the-badge)](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[🚀 **Launch Live Web App**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/) • [🛰️ **Interactive 3D Farm**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/#farmSimulation) • [🤖 **Farmer Buddy AI**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/#farmerBuddy) • [🎥 **YouTube Channel (ASL Spectra)**](https://www.youtube.com/@ASLSpectra)

</div>

---

## 📖 Executive Summary & The Problem We Solve

### The Climate Shift Crisis on Smallholder Agriculture
Over **500 million smallholder farmers** across the globe, including **16 million farming households in Bangladesh**, face unprecedented agricultural uncertainty driven by escalating climate shifts:
- **Erratic Monsoon Shifts:** Traditional seasonal crop calendars (Rabi, Kharif-1, Kharif-2) no longer align with erratic weather cycles. Untimely deluges wash away seeds, while prolonged dry spells deplete groundwater tables.
- **Blind Irrigation & Water Depletion:** Farmers irrigate on fixed calendar schedules rather than physiological root-zone demand, causing up to **45% irrigation water waste** and diesel pump overdrafts.
- **Costly Fertilizer Runoff:** Chemical fertilizers (Urea, DAP, MOP) applied immediately before unforecasted rains are flushed into river basins, causing catastrophic financial losses and severe eutrophication.
- **Sudden Blight & Pest Epidemics:** Fungal outbreaks such as **Late Blight** (*Phytophthora infestans*) in potato and tomato, or **Blast** (*Magnaporthe oryzae*) in paddy, devastate entire districts within 48 to 72 hours when microclimatic humidity and temperature cross critical thresholds.
- **The "Last-Mile Data Abyss":** Although NASA operates the world's most advanced constellation of Earth Observation satellites (SMAP, MODIS, GPM, ECOSTRESS), this petabyte-scale scientific telemetry remains locked behind complex GIS file formats, NetCDF grids, and academic English jargon that rural farmers cannot access or interpret.

### Our Solution: "Field Shift"
**Field Shift** is a breakthrough, web-based agricultural intelligence platform and photorealistic 3D botanical digital twin. Built for the **2026 NASA International Space Apps Challenge**, Field Shift acts as a direct bridge between NASA's spaceborne Earth observation infrastructure and rural farmers.

By ingesting real-time agroclimatology telemetry from the **NASA POWER API (`community=AG`)** and assimilating data from **SMAP**, **MODIS/VIIRS**, **GPM IMERG**, and **ECOSTRESS**, Field Shift converts complex satellite metrics into simple, high-impact farming decisions in localized **Bengali (বাংলা)** and **English**. Through an ultra-optimized, zero-quality-loss **Three.js WebGL engine** and a voice/vision multimodal agronomist powered by **Google Gemini 2.5 Flash**, farmers can view an exact 3D replica of their field, inspect underground root moisture in real time, diagnose leaf diseases with their phone camera, and plan high-profit multi-season crop rotations.

---

## 🛰️ NASA Satellites, Datasets & Feature Mapping

Field Shift directly integrates and translates authentic NASA Earth Observation missions and parameters into production features:

| NASA Mission / Dataset | Official Source & Access Points | Scientific Parameters Extracted | Exact Implementation in Field Shift |
| :--- | :--- | :--- | :--- |
| **NASA POWER Agroclimatology API** | [NASA Langley Research Center](https://power.larc.nasa.gov/)<br/>`power.larc.nasa.gov/api/temporal/daily/point?community=AG` | `GWETROOT`, `GWETTOP`, `ALLSKY_SFC_PAR_TOT`, `ALLSKY_SFC_SW_DWN`, `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `WS2M` | Powers the **Live District GPS Selector** (8 Bangladesh agro-ecological divisions + HTML5 GPS), drives all 4 farmer action cards, controls real-time **3D Wind Sway Physics**, and populates the **7-Day Trend Charts** in the NASA Data Hub. |
| **NASA SMAP** *(Soil Moisture Active Passive)* | [NASA JPL SMAP](https://smap.jpl.nasa.gov/) & [NSIDC DAAC](https://nsidc.org/data/smap)<br/>(L3/L4 Surface & Root-Zone Soil Moisture) | `GWETTOP` *(0–5 cm surface wetness fraction, 0.0–1.0)*<br/>`GWETROOT` *(0–100 cm root-zone soil wetness fraction, 0.0–1.0)* | Drives the **💧 Soil Moisture & Irrigation Advisory Card** (alerts at `<40%` for deficit and `>80%` for waterlogging). In the 3D field, dynamically alters soil bed PBR roughness/color, renders underground blue moisture particles in **Root & Soil X-Ray View**, and triggers 3D IoT sprinkler sprayers. |
| **NASA Terra & Aqua MODIS / Suomi NPP VIIRS** | [NASA GSFC MODIS](https://modis.gsfc.nasa.gov/) & [NASA Worldview](https://worldview.earthdata.nasa.gov/)<br/>(Vegetation Indices & Insolation) | `NDVI` *(Normalized Difference Vegetation Index, 0.20–0.90)*<br/>`ALLSKY_SFC_PAR_TOT` *(Photosynthetically Active Radiation, W/m²)* | Feeds the **🌿 Crop Vigor & NPK Card**, calculating exact top-dressing windows for Urea/DAP/MOP. In the 3D simulation, synchronizes leaf canopy chlorophyll greenness, vegetative biomass, and phenological stage progression. |
| **NASA GPM IMERG** *(Global Precipitation Measurement)* | [NASA GSFC GPM](https://gpm.nasa.gov/) & [NASA Giovanni](https://giovanni.gsfc.nasa.gov/)<br/>(Half-Hourly & Daily Precipitation) | `PRECTOTCORR` *(Bias-corrected daily precipitation, mm/day)*<br/>Heavy rainfall thresholds & storm alerts | Drives the **🌦️ Weather, Spraying & Harvest Guide Card**, warning farmers against chemical fertilizer or pesticide application before rainfall to avoid runoff waste, while alerting when dry harvest windows open. Triggers the 3D particle rain simulation. |
| **NASA ECOSTRESS** *(Thermal Radiometer on ISS)* | [NASA JPL ECOSTRESS](https://ecostress.jpl.nasa.gov/) & [NASA AppEEARS](https://appeears.earthdatacloud.nasa.gov/)<br/>(Evaporative Stress & Thermal Regimes) | `ESI` *(Evaporative Stress Index)*, `T2M_MAX` *(Canopy thermal stress)*,<br/>`RH2M` + `T2M` *(Microclimatic fungal incubation matrix)* | Powers the **🐛 Pest, Blight & Thermal Stress Card**. Predicts high-risk fungal incubation for Late Blight (Potato/Tomato) and Blast (Rice) when $RH > 82\%$ and $16^\circ\text{C} \le T \le 26^\circ\text{C}$, warning of plant thermal shock ($T > 35^\circ\text{C}$) days before visible leaf wilting. |
| **NASA Harvest & GEOGLAM CropMonitor** | [NASA Harvest](https://nasaharvest.org/) & [GEOGLAM](https://cropmonitor.org/)<br/>(Global Agricultural Monitoring Consortium) | Agro-climatic crop suitability calendars (Rabi, Kharif-1, Kharif-2), regional yield benchmarks, soil sustainability indices | Informs the **🎯 Stateful 3-Season Crop Rotation Planner**, recommending nitrogen-fixing legumes (Lentil) and low-water cash crops (Mustard, Potato) after high-nitrogen cereals (Rice, Maize) to restore soil fertility and maximize farmer net profit. |

---

### Detailed Scientific Parameter Breakdown

```
                             ┌─────────────────────────────────────────────────────────┐
                             │       NASA EARTH OBSERVATION CONSTELLATION             │
                             │  SMAP  •  MODIS  •  VIIRS  •  GPM  •  ECOSTRESS        │
                             └────────────────────────────┬────────────────────────────┘
                                                          │
                                                          ▼
                                     NASA POWER Agroclimatology API
                                     (Temporal Daily Point, community=AG)
                                                          │
               ┌───────────────────────────┬──────────────┴──────────────┬───────────────────────────┐
               ▼                           ▼                             ▼                           ▼
       [GWETROOT / GWETTOP]       [ALLSKY_SFC_PAR_TOT]             [PRECTOTCORR]               [T2M / RH2M / WS2M]
      SMAP Soil Moisture         MODIS Photosynthesis          GPM Precipitation           ECOSTRESS Microclimate
               │                           │                             │                           │
               ▼                           ▼                             ▼                           ▼
   💧 Soil Moisture Card       🌿 Crop Vigor & NPK           🌦️ Spraying & Rain Guide   🐛 Pest & Blight Warning
   • "<40%: Irrigate 25mm"     • "PAR 18.4 W/m²: Good"       • "Rain 28mm: Do NOT Spray" • "RH 88%, 22°C: Late Blight"
   • ">80%: Drain Furrow"      • "Apply 8kg Urea/decimal"    • "Fertilizer Runoff Alert" • "Canopy Heat-Shock Alert"
               │                           │                             │                           │
               └───────────────────────────┼─────────────────────────────┴───────────────────────────┘
                                           │
                                           ▼
               ┌─────────────────────────────────────────────────────────┐
               │       3D DIGITAL TWIN & MULTIMODAL AI INTEGRATION       │
               │  • Dynamic Soil Roughness & Underground Root X-Ray      │
               │  • Procedural Chlorophyll Shaders & 3D Wind Physics     │
               │  • Farmer Buddy Multimodal Agro-Advisory (Gemini 2.5)   │
               └─────────────────────────────────────────────────────────┘
```

1. **NASA POWER (`GWETROOT` & `GWETTOP`):**
   - Ingests root-zone moisture ($0\text{--}100\text{ cm}$) and surface wetness ($0\text{--}5\text{ cm}$). When root wetness drops below $0.40$ ($40\%$), the platform issues an urgent Bangla advisory: `"মাটির আর্দ্রতা কম (৩২%) — আজই সেচ দিন"` (*"Soil moisture low — irrigate today"*).
   - In the 3D scene, this dynamically shifts the soil shader from dry dusty umber (`#5c4033`, roughness 0.95) to rich moist loam (`#2d1e18`, roughness 0.45).
2. **NASA Terra/Aqua MODIS (`ALLSKY_SFC_PAR_TOT` & `ALLSKY_SFC_SW_DWN`):**
   - Photosynthetically Active Radiation ($400\text{--}700\text{ nm}$) measures actual energy available for vegetative carbon fixation. Combined with temperature, it pinpoints the metabolic peak of the crop to schedule fertilizer application when nutrient uptake efficiency is highest.
3. **NASA GPM IMERG (`PRECTOTCORR`):**
   - Quantifies bias-corrected daily rainfall down to $0.1\text{ mm/day}$. If rainfall forecast exceeds $10\text{ mm/day}$, the system locks the fertilizer action recommendation, preventing hundreds of dollars in chemical wash-off per acre.
4. **NASA ECOSTRESS Microclimatic Matrix (`RH2M` + `T2M`):**
   - Relative humidity above $82\%$ combined with moderate temperatures ($16^\circ\text{C}\text{ to }26^\circ\text{C}$) triggers an immediate algorithmic alert for *Phytophthora infestans* (Late Blight) in Solanaceae crops and *Pyricularia oryzae* (Blast) in rice, instructing farmers on preventative organic fungicides before spores establish.

---

## 🌟 Key Features & Technical Innovations

### 1. Photorealistic 15-Crop 3D Botanical Simulation Engine
- **Full Coverage of 15 Global & Bangladeshi Staples:**
  1. 🌾 **Rice (ধান)** — *Oryza sativa* (Aman, Boro, Aus)
  2. 🌾 **Wheat (গম)** — *Triticum aestivum*
  3. 🌽 **Maize (ভুট্টা)** — *Zea mays*
  4. 🌿 **Jute (পাট)** — *Corchorus olitorius* (Golden Fiber)
  5. 🥔 **Potato (আলু)** — *Solanum tuberosum*
  6. 🌼 **Mustard (সরিষা)** — *Brassica nigra*
  7. 🍅 **Tomato (টমেটো)** — *Solanum lycopersicum*
  8. 🍆 **Eggplant (বেগুন)** — *Solanum melongena*
  9. 🌶️ **Chili (মরিচ)** — *Capsicum annuum*
  10. 🌱 **Lentil (মসুর ডাল)** — *Lens culinaris*
  11. 🥒 **Cucumber (শসা)** — *Cucumis sativus*
  12. 🥦 **Cauliflower (ফুলকপি)** — *Brassica oleracea*
  13. 🧅 **Onion (পেঁয়াজ)** — *Allium cepa*
  14. 🥕 **Carrot (গাজর)** — *Daucus carota*
  15. 🍈 **Papaya (পেঁপে)** — *Carica papaya*
- **3 Interactive Camera Modes:**
  - `🚁 Drone Top View`: Broad landscape perspective for furrow alignment, zone moisture heatmaps, and spatial inspection.
  - `🌾 Crop Close-up View`: Eye-level inspection focusing on botanical leaf venation, flowering panicles, and fruit clusters.
  - `🥕 Underground Root & Soil X-Ray View`: Proprietary semi-transparent soil bed revealing subsurface biological dynamics: taproots, fibrous root branching, tuber clusters (potatoes, carrots, onions), and animated blue groundwater/NPK nutrient uptake particles.
- **1-Click Time-of-Day Atmospheric Switcher:**
  - `🌅 Morning`: Golden low-angle sunlight, warm horizon gradients (`#6fa8dc` $\to$ `#ffd966` $\to$ `#f6b26b`), and soft dawn mist.
  - `☀️ Noon`: High-intensity zenith sun, crisp `PCFSoftShadowMap` shadows, azure sky gradient, and subsurface leaf transmission.
  - `🌙 Night`: Midnight blue indigo sky (`#060d18` $\to$ `#112238`) populated with 180 procedural twinkling stars, lunar directional glow, and glowing IoT field sensor nodes.
- **Real-Time Environmental Shaders:**
  - GPU-accelerated vertex wind sways leaves proportionally to NASA `WS2M` wind speeds.
  - Dynamic 3D rain particle system activating when NASA `PRECTOTCORR` registers precipitation.

### 2. 👨🌾 "Farmer Buddy" (কৃষি বন্ধু) — Multimodal Bilingual AI Agronomist
- **Autonomous Context Ingestion:** Farmer Buddy automatically extracts live state from the 3D digital twin—active crop type, phonological growth day, selected district, and real-time NASA satellite numbers (`GWETROOT`, `PRECTOTCORR`, `T2M`, `RH2M`)—injecting them directly into the LLM system prompt on every turn.
- **2-Way Bangla & English Voice Interface:**
  - Speech-to-Text (`🎤` Web Speech API) recognizing spoken Bangla (`bn-BD`) and English (`en-US`).
  - Text-to-Speech (`🔊`) with automated markdown-tag stripping, allowing non-literate rural farmers to speak naturally and hear vocalized agronomic advice.
- **Client-Side Compressed Leaf & Soil Disease Vision (`📷`):**
  - Farmers take or upload a photo of a sick leaf or insect pest directly from the field.
  - An on-device HTML5 canvas pipeline compresses high-resolution camera photos to $<80\text{ KB}$ within milliseconds without server latency.
  - Powered by **Google Gemini 2.5 Flash**, the AI diagnoses symptoms, identifies the exact pathogen (e.g., Bacterial Leaf Blight, Early Blight, Aphid infestation), and prescribes actionable remedies aligned with Bangladesh Agricultural Research Institute (BARI) and BRRI standards.
- **Stateful 3-Season Crop Rotation & Profit Planner:**
  - Calculates precise per-decimal/bigha fertilizer dosages (Urea, TSP, DAP, MOP, Gypsum, Zinc).
  - Simulates 3-season rotations (e.g., *Rice $\to$ Mustard $\to$ Jute* or *Potato $\to$ Maize $\to$ Lentil*), computing net nitrogen fixation, water savings, and projected financial yields.

### 3. ⚡ High-Speed Phone Authentication & 1-Click Judge Auto-Fill
- **3-Tier Resilient Persistence:** Built on an architectural triad of `LocalStorage O(1) Cache` $\to$ `IndexedDB` $\to$ Cloud SQL/REST hook.
- **1-Click Judge Demo Profile:** Instant demo button pre-populates a verified farmer account (e.g., *Karim Ullah, Mymensingh, 45 Decimals, Cauliflower*), logging in under $50\text{ ms}$ with full NASA telemetry sync.
- **HTML5 Credential Management API:** Supports native mobile credential storage for passwordless return visits.

### 4. 📱 Mobile-First 60 FPS Zero-Quality-Loss Architecture
- **Retina Crispness & PBR Realism:** Enforces `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))` with adaptive `1024x1024` mobile and `2048x2048` desktop shadow cascades.
- **Master Geometry & Material Pooling:** Leaf, stem, fruit, and root geometries (`BufferGeometry`) and materials (`MeshPhysicalMaterial`) are instantiated **once per crop** and pooled across all plants, slashing field generation from $2,500\text{ ms}$ to $<60\text{ ms}$.
- **Non-Overlapping 2-Row Top HUD Dock:** Rebuilt for mobile viewports ($320\text{--}480\text{ px}$):
  - Row 1: Camera capsule on left, utility capsule on right.
  - Row 2: Location pill, crop selector, and compact Time-of-Day switcher without overflow.
- **Collision-Free Spatial Badges & Elevated FAB:** Floating 3D pins are dynamically centered under the HUD on mobile, and the Farmer Buddy AI button is elevated to `bottom: 148px`, keeping the growth range slider 100% accessible.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    subgraph SpaceLayer["🛰️ Space & Earth Observation Constellation"]
        SMAP["NASA SMAP Satellite<br/>(L3/L4 Root-Zone & Surface Soil Moisture)"]
        MODIS["NASA Terra & Aqua MODIS / VIIRS<br/>(NDVI Vegetation Index & PAR Solar Energy)"]
        GPM["NASA GPM IMERG Constellation<br/>(Daily Bias-Corrected Precipitation)"]
        ECOSTRESS["NASA ECOSTRESS on ISS<br/>(Evaporative Stress & Thermal Regimes)"]
    end

    subgraph DataIngestion["⚡ Ingestion & Agroclimatology Translation Layer"]
        NASA_API["NASA POWER Agroclimatology API<br/>(community=AG / Daily Point Endpoint)"]
        DistrictCache["Offline Resilient District Cache<br/>(8 Divisional Agro-Zones of Bangladesh)"]
        Translator["NASA-to-Farmer Action Translator<br/>(Soil Wetness, Crop Vigor, Rain Runoff, Blight)"]
    end

    subgraph CoreEngine["💻 Field Shift Core Application Engine"]
        ThreeJS["Three.js WebGL 3D Botanical Engine<br/>(15 Crops, PBR Shaders, InstancedMesh)"]
        CameraControl["3-Mode Camera System<br/>(Drone Top, Crop Close-up, Root X-Ray)"]
        SkyLighting["Atmospheric Lighting & Day/Night<br/>(PCFSoftShadows, Procedural Sky, Wind Physics)"]
        AuthEngine["Hybrid 3-Tier Phone Auth Engine<br/>(Credential API, LocalStorage, 1-Click Judge Demo)"]
    end

    subgraph MultimodalAI["🤖 Multimodal AI Agronomist (Farmer Buddy)"]
        Gemini["Google Gemini 2.5 Flash LLM<br/>(Multimodal Vision & Agronomic Reasoning)"]
        VoiceEngine["2-Way Web Speech Engine<br/>(Bangla bn-BD & English Voice STT/TTS)"]
        VisionCompress["Client-Side Camera Photo Compressor<br/>(Sub-80KB On-Device Canvas Pipeline)"]
        RotationEngine["3-Season Crop Rotation & NPK Calculator<br/>(BARI/BRRI Agronomic Recommendations)"]
    end

    subgraph FarmerUI["📱 Responsive Cross-Platform User Interface"]
        TopHUD["2-Row Glassmorphic Top HUD Dock<br/>(Cameras, Location, Crop, Day/Night)"]
        TelemetryCards["4 NASA Farmer Action Cards<br/>(Irrigation, Fertilizer, Spraying, Blight)"]
        BottomTimeline["3-Row Growth Scrubber & Weather Dock<br/>(Day Counter, Weather Sim, Range Slider)"]
        AIAssistantUI["Farmer Buddy Floating Interface<br/>(Voice Chat, Photo Diagnosis, Rotation Modal)"]
    end

    %% Data Connections
    SMAP --> NASA_API
    MODIS --> NASA_API
    GPM --> NASA_API
    ECOSTRESS --> NASA_API

    NASA_API --> Translator
    DistrictCache -.-> Translator

    Translator --> TelemetryCards
    Translator --> ThreeJS
    Translator --> Gemini

    ThreeJS --> SkyLighting
    ThreeJS --> CameraControl
    ThreeJS --> TopHUD

    AuthEngine --> TopHUD
    AuthEngine --> Gemini

    VisionCompress --> Gemini
    VoiceEngine <--> Gemini
    Gemini --> RotationEngine
    RotationEngine --> AIAssistantUI

    TelemetryCards --> FarmerUI
    TopHUD --> FarmerUI
    BottomTimeline --> FarmerUI
    AIAssistantUI --> FarmerUI
```

---

## 🤖 Mandatory NASA Space Apps 2026 "Use of AI" Disclosure

In strict adherence to the **NASA International Space Apps Challenge 2026 Rules & Guidelines**, Team ASL Spectra transparently discloses all AI models, tools, and methodologies utilized in Field Shift:

### 1. AI Models Integrated into the Application Architecture
- **Model Name:** Google Gemini 2.5 Flash (`gemini-2.5-flash`) via official Google Gen AI SDK.
- **Role in Solution:** Powers the **Farmer Buddy (কৃষি বন্ধু)** multimodal agronomist assistant.
  - **Leaf & Pest Vision Diagnosis:** Processes compressed camera images taken by farmers, identifying crop diseases (such as Late Blight, Blast, Leaf Curl Virus, Anthracnose) and insect damage.
  - **Context-Aware Agronomic Reasoning:** Analyzes live NASA satellite telemetry (`GWETROOT`, `T2M`, `RH2M`, `PRECTOTCORR`) alongside the crop's active growth day to formulate localized, dialect-sensitive Bangla and English farming advisories.
  - **Fertilizer & Rotation Formulation:** Generates precise NPK fertilization schedules and multi-season crop rotation strategies aligned with official Bangladesh Agricultural Research Institute (BARI) and Bangladesh Rice Research Institute (BRRI) literature.
- **Voice AI:** Browser-native Web Speech API (`SpeechRecognition` for spoken Bangla input; `SpeechSynthesis` for audio playback of advice after stripping markdown syntax).

### 2. AI Tools Used During Development
- **Coding & Architecture Assistance:** AI coding assistants (Gemini, Antigravity IDE) were utilized during development for:
  - Accelerating the drafting of procedural Three.js mathematical curves (Catmull-Rom spline calculations for curved crop panicles and leaf ribs).
  - Assisting in responsive CSS Grid/Flexbox calculations for the 2-Row mobile HUD dock and viewport touch boundaries.
  - Rapidly translating complex NASA POWER API parameter specifications into structured TypeScript/JavaScript interfaces.
- **Verification & Scientific Accuracy:** All AI-suggested agricultural advice, chemical thresholds, and NPK calculations were manually audited, cross-verified, and aligned with published research from **BARI**, **BRRI**, and the **NASA POWER Agroclimatology Methodology Guides**.

---

## 📁 Repository Structure & Tech Stack

```
f:/Frontend/
├── website/                         # Production Web Application (Deployed on GitHub Pages)
│   ├── index.html                   # Core Single-Page App (Canvas, Top HUD, Telemetry, AI UI)
│   ├── style.css                    # Glassmorphism, CSS Grid, 2-Row HUD, Responsive Media Queries
│   ├── tsconfig.json                # TypeScript Configuration
│   │
│   ├── js/                          # Production Optimized ES6 JavaScript Modules
│   │   ├── simulation.js            # Three.js 3D Engine (15 Botanical Crops, Shaders, PBR, Lighting)
│   │   ├── FarmerBuddy.js           # Multimodal AI Agronomist (Gemini 2.5 Flash, Voice, Vision)
│   │   ├── nasaAgriService.js       # NASA POWER API Client & Satellite-to-Action Translator
│   │   ├── authService.js           # 3-Tier Phone Auth Engine & 1-Click Judge Demo Auto-Fill
│   │   ├── crops_db.js              # Comprehensive Botanical & Agronomic Database (15 Crops)
│   │   ├── map.js                   # Interactive Leaflet / Mapbox GIS Field Mapper
│   │   ├── i18n.js                  # Dynamic Bilingual Localization Engine (Bangla & English)
│   │   ├── translation.js           # Comprehensive UI Vocabulary Translation Dictionaries
│   │   ├── weather.js               # Secondary Microclimatic Forecast Integration
│   │   └── data.js                  # Pre-seeded Agroclimatology Datasets & Division Benchmarks
│   │
│   ├── src/                         # Typed Source Files (TypeScript Implementations)
│   │   ├── FarmerBuddy.ts           # Type-safe Multimodal AI Agronomist implementation
│   │   ├── nasaAgriService.ts       # Type-safe NASA POWER & Satellite translation interfaces
│   │   └── authService.ts           # Type-safe Phone Authentication & Credential handlers
│   │
│   └── assets/                      # Static Media, Botanical Textures & 3D Assets
│       └── crops_3d/                # High-fidelity 3D GLTF/GLB models & botanical specimens
│
├── backend/                         # Optional Production AI Proxy & Streaming Server
│   ├── main.py                      # FastAPI Backend Server (SSE Gemini streaming, NASA cache)
│   ├── server.js                    # Node.js / Express alternative backend
│   ├── requirements.txt             # Python Dependencies (FastAPI, google-genai, uvicorn)
│   └── package.json                 # Node Dependencies
│
└── README.md                        # Master Project Documentation (This File)
```

### Complete Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **3D Graphics & Engine** | Three.js (r165), WebGL 2.0, GLSL | 15 procedural botanical crops, physical materials (`MeshPhysicalMaterial`), soft shadows, day/night lighting, underground root X-Ray |
| **Earth Data Integration** | NASA POWER API (`community=AG`), Fetch API | Real-time agroclimatology telemetry (`GWETROOT`, `PRECTOTCORR`, `T2M`, `PAR`) |
| **Multimodal Artificial Intelligence** | Google Gemini 2.5 Flash (`@google/genai`) | Bilingual leaf blight vision diagnosis, conversational farming advice, crop rotation calculations |
| **Voice Interaction** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) | 2-way spoken Bangla (`bn-BD`) and English speech input and vocal response |
| **Frontend Architecture** | Vanilla HTML5, Modern CSS3, TypeScript, ES6+ | Glassmorphic HUD, CSS Grid, mobile touch gestures, sub-1s load, zero framework overhead |
| **Authentication & Storage** | Credential Management API, IndexedDB, LocalStorage | 3-tier persistent phone authentication with 1-click instant demo profile auto-fill |
| **Backend (Optional Proxy)** | Python 3.11, FastAPI, Uvicorn / Node.js Express | Server-Sent Events (SSE) AI streaming and server-side NASA caching |
| **Hosting & Deployment** | GitHub Pages (Frontend), Cloud Run / Vercel (Backend) | 100% serverless, edge-cached global distribution |

---

## 🚀 Quick Start & Local Installation Guide

Field Shift is designed with **zero required build steps for the frontend**. The web application runs natively in any modern web browser with full WebGL 2.0 support.

### 1. Clone the Repository
```bash
git clone https://github.com/G-Sadi/Nasa-Space-Apps-Challenge-website.git
cd Nasa-Space-Apps-Challenge-website
```

### 2. Run the Frontend Locally (Instant Setup)
You can serve the `website/` directory using any local HTTP static server:

```bash
# Option A: Using Python built-in server (Recommended)
cd website
python -m http.server 8000

# Option B: Using Node.js npx serve
npx serve website -l 8000
```
Open your browser and navigate to:
```
http://localhost:8000
```

> [!TIP]
> **No API Key Required for Basic Demo:** Field Shift features pre-seeded authentic NASA POWER datasets for all 8 agricultural divisions of Bangladesh, as well as an intelligent offline fallback knowledge base for the AI Agronomist.

### 3. Run the Optional FastAPI AI Backend (For Live Gemini 2.5 Streaming)
To enable live custom Gemini 2.5 Flash streaming via the Python backend:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your Gemini API Key
cp .env.example .env
# Edit .env and insert your GEMINI_API_KEY="AIzaSy..."

# Start the FastAPI server
uvicorn main:app --reload --port 5000
```

---

## 👥 Team ASL Spectra (Credits & Roles)

Proudly developed for the **2026 NASA International Space Apps Challenge** by **Team ASL Spectra** (Bangladesh):

| Member Name | Role | Core Contributions |
| :--- | :--- | :--- |
| **Monjir Bin Morshed Sadi** | **Team Lead, Frontend & AI/ML Developer** | Architecture design, Three.js 3D botanical simulation engine, Google Gemini 2.5 Flash multimodal integration, mobile performance optimization. |
| **Fahmida Ahmed** | **Full Stack & AI/ML Developer** | Multimodal disease vision pipeline, client-side photo compressor, voice assistant integration, stateful crop rotation logic. |
| **Tachin Mahabub Tonoy** | **Backend Developer & NASA Data Specialist** | NASA POWER API integration, satellite parameter mathematical translation (`GWETROOT`, `PRECTOTCORR`), FastAPI streaming backend. |
| **Md. Mahbub Alam** | **Frontend Developer** | Glassmorphic 2-Row Top HUD dock, interactive 3-row growth timeline scrubber, responsive CSS Grid layout, WebGL touch controls. |
| **Fatima Tuzzohora** | **UI/UX Designer & Data Visualization Lead** | UI design system, color palettes (`#06150f` & `#43ef8c`), NASA Agri-Data Hub modal charts, accessibility and dialect UX research. |
| **Abdullah Bin Rakib** | **Media, Research & Documentation Lead** | Agronomic research (BARI/BRRI compliance), video presentation production, NASA mission documentation, project storytelling. |

---

## 📚 References & Scientific Citations

1. **NASA POWER Project:**
   - Stackhouse, P. W., et al. *NASA Prediction of Worldwide Energy Resources (POWER) Agroclimatology Methodology.* NASA Langley Research Center. Available at: [https://power.larc.nasa.gov](https://power.larc.nasa.gov)
2. **NASA SMAP Mission:**
   - Entekhabi, D., et al. (2010). *The Soil Moisture Active Passive (SMAP) Mission.* Proceedings of the IEEE, 98(5), 704-716. Available at: [https://smap.jpl.nasa.gov](https://smap.jpl.nasa.gov)
3. **NASA GPM IMERG:**
   - Huffman, G. J., et al. (2020). *Integrated Multi-satellitE Retrievals for GPM (IMERG) Technical Documentation.* NASA Goddard Space Flight Center. Available at: [https://gpm.nasa.gov](https://gpm.nasa.gov)
4. **NASA ECOSTRESS:**
   - Fisher, J. B., et al. (2020). *ECOSTRESS: NASA's Next-Generation High Spatial Resolution Evapotranspiration from the International Space Station.* Water Resources Research, 56(4). Available at: [https://ecostress.jpl.nasa.gov](https://ecostress.jpl.nasa.gov)
5. **NASA Harvest & GEOGLAM:**
   - Becker-Reshef, I., et al. (2020). *The NASA Harvest Program on Agriculture and Food Security.* Available at: [https://nasaharvest.org](https://nasaharvest.org)
6. **National Agricultural Research Systems of Bangladesh:**
   - **BARI (Bangladesh Agricultural Research Institute):** *Krishi Projukti Hatboi (Handbook on Agro-Technology), 9th Edition.* Gazipur, Bangladesh. Available at: [http://www.bari.gov.bd](http://www.bari.gov.bd)
   - **BRRI (Bangladesh Rice Research Institute):** *Modern Rice Cultivation Guidelines & Pest Management Protocols.* Gazipur, Bangladesh. Available at: [http://www.brri.gov.bd](http://www.brri.gov.bd)
7. **Three.js WebGL Documentation:**
   - Cabello, R. (Mr.doob), et al. *Three.js JavaScript 3D Library.* Available at: [https://threejs.org](https://threejs.org)

---

<div align="center">

### 🌾 Transforming Space Science into Earth Bounty
**Team ASL Spectra • NASA International Space Apps Challenge 2026**  
*Empowering smallholder farmers to thrive in a changing world.*

[![Live Website](https://img.shields.io/badge/Visit-Field%20Shift%20Live-22c55e?style=for-the-badge)](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)
[![YouTube ASL Spectra](https://img.shields.io/badge/YouTube-ASL%20Spectra-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@ASLSpectra)

</div>
