# 🛰️🌾 Field Shift — Smart Farm Intelligence & 3D Agricultural Digital Twin
### Translating NASA Earth Observation Telemetry into Proactive Farm Decisions for Smallholder Farmers

<div align="center">

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Global%20Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![Team ASL Spectra](https://img.shields.io/badge/Team-ASL__Spectra%20(Mymensingh%2C%20BD)-10b981?style=for-the-badge&logo=target&logoColor=white)](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/)
[![Live Prototype](https://img.shields.io/badge/Live%20Prototype-GitHub%20Pages-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)
[![NASA Telemetry](https://img.shields.io/badge/NASA%20Data-SMAP%20%7C%20MODIS%20%7C%20POWER%20%7C%20MERRA--2%20%7C%20ECOSTRESS-0284c7?style=for-the-badge&logo=nasa&logoColor=white)](https://earthdata.nasa.gov/)
[![3D Engine](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL%20(60FPS)-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GIS Engine](https://img.shields.io/badge/GIS-64--Zilla%20Esri%20Satellite-16a34a?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![AI Engine](https://img.shields.io/badge/AI-Farmer%20Buddy%20(EN%2F%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE)-8b5cf6?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

<br/>

> **Official Submission by Team ASL Spectra for the 2026 NASA International Space Apps Challenge**  
> *Track: Climate Resilience, Sustainable Agriculture & Earth Observation Data Democratization*

| 🌐 Live Interactive Web Prototype | 🚀 Official NASA Space Apps Team Page | 🎬 Official Video Demonstration |
| :---: | :---: | :---: |
| [**Launch Field Shift Live**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/) | [**View Team ASL Spectra Profile**](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) | [**Watch Official Pitch on YouTube**](https://www.youtube.com/@team-spectra_2026) |

</div>

---

## 🎯 Executive Summary & The Challenge (Impact & Relevance)

### The Real-World Agricultural Crisis in Bangladesh
Bangladesh is one of the most climate-vulnerable deltas on Earth. Over 65% of the rural population depends directly on agricultural livelihoods. In fertile agricultural belts like **Mymensingh** (Agro-Ecological Zone AEZ-9, Old Brahmaputra Floodplain), smallholder farmers—such as our representative persona **Sheikh Siraj**—operate on razor-thin margins across fragmented 1–3 bigha family plots.

Every agricultural cycle, smallholder farmers lose up to **30% of their potential harvest value** due to:
1. **Unpredictable Monsoon Shifts:** Late-arriving rains delay paddy transplanting, exposing emerging crops to flash floods or severe terminal heat.
2. **Subterranean Root Moisture Depletion:** Topsoil may appear moist while the vital root-zone (10–100 cm) is suffering from critical water depletion, or conversely, over-irrigation wastes diesel-pump fuel and leaches fertilizers.
3. **Heatwave Canopy Thermal Stress:** High humidity paired with sudden temperature spikes causes rapid flower abortion in vegetables and grain chalkiness in rice.
4. **Information Asymmetry & Untargeted Inputs:** Farmers purchase expensive synthetic fertilizers (Urea, TSP, MoP) without knowing whether current solar radiation (PAR Flux) and soil moisture allow crops to absorb nutrients.

```
       [ Rural Farming Reality ]                           [ The Field Shift Solution ]
+------------------------------------+             +-----------------------------------------+
| Smallholder Farmer (Sheikh Siraj)  |             |          FIELD SHIFT PLATFORM           |
| • Loses 30% yield to climate shock |  ===>>>     | • Translates raw NASA satellite bytes   |
| • Cannot read NetCDF / HDF5 files  |             | • Real-time 4-Zone Live Radar HUD       |
| • 2G/3G low-bandwidth smartphone  |             | • Photorealistic 3D Field Digital Twin  |
| • Needs immediate, tactile guidance|             | • 0ms 64-Zilla GIS Agro-Telemetry Engine|
+------------------------------------+             | • Bilingual AI Voice/Text Guidance      |
                                                   +-----------------------------------------+
```

### Why Existing NASA Portals Are Inaccessible to Smallholders
NASA, NOAA, and ESA maintain world-class Earth Observation missions generating petabytes of open telemetry daily (NASA SMAP, MODIS, ECOSTRESS, POWER, GPM). However, these data streams exist behind scientific portals (Earthdata, AppEEARS, Giovanni) in dense multidimensional formats with complex coordinate reference systems. 

**Field Shift** eliminates this barrier. It acts as an **intelligent, bidirectional translation bridge** that ingests orbital satellite telemetry and instantly converts it into tactile, actionable farm decisions: *When to irrigate, when to apply fertilizer, how to rotate crops across 4-year horizons, and how to maximize seasonal net profit in Bangladeshi Taka (৳).*

---

## ⚡ 30-Second Judge Quick-Test Guide (Live Evaluation)

Judges can evaluate the full application in under two minutes by following this 5-point walkthrough on our live website: [**https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/):

```
+--------------------------------------------------------------------------------------------------+
|                                5-POINT JUDGE EVALUATION WALKTHROUGH                              |
+--------------------------------------------------------------------------------------------------+
| 1. HERO 4-ZONE RADAR HUD  --> Tap Zone A, B, C, D to inspect SMAP moisture & ECOSTRESS thermal  |
| 2. 3D DIGITAL TWIN FIELD   --> Toggle Drone/Field/Root views, scrub growth days, click AR plant   |
| 3. 64-ZILLA SATELLITE GIS --> Search any Bangladesh district, drag pin to compute river proximity|
| 4. SCENARIO & ROTATION    --> Drag Rain/Temp/Water sliders, see crop & BDT (৳) profit adaptation |
| 5. BILINGUAL AI ADVISOR   --> Toggle EN/বাং in navbar, open Farmer Buddy AI for instant advice   |
+--------------------------------------------------------------------------------------------------+
```

1. **4-Zone NASA SMAP Live Radar HUD (Hero Section):**
   * Inspect real-time root-zone soil moisture (58%), MODIS NDVI (0.68–0.74), and ECOSTRESS canopy thermal data.
   * Tap any of the 4 plot cards (`Zone A: North Plot`, `Zone B: Canal Side`, `Zone C: High Ridge`, `Zone D: Clay Basin`) to observe instantaneous telemetry synchronization and agronomic action directives.
2. **Interactive 3D Digital Twin & Subterranean Root X-Ray (3D Live Field):**
   * Experience our locked 60 FPS Three.js WebGL simulation featuring realistic PBR crops, soft shadow mapping, and dynamic daytime lighting (`Morning 🌅` | `Noon ☀️` | `Night 🌙`).
   * Switch between camera presets: `🚁 Drone View`, `🌾 Field View`, and `🌱 Root & Soil View`.
   * Drag the **5-Stage Growth Scrubber (Day 1 to Day 130)** to watch crops dynamically germinate, vegetate, flower, and ripen.
   * Tap any crop plant (Tomato, Rice, Chili, Onion, Carrot) to open **AR Precision Scan**, reveal fruit count and chlorophyll indices, or enter **Subterranean Root X-Ray mode**.
3. **All 64 Bangladesh Zillas Satellite GIS Map (Land & Weather):**
   * Select from the quick-switch pills (`[📍 My Live GPS]`, `[🌾 Mymensingh]`, `[🏙️ Bakshibazar, Dhaka]`, `[🌱 Bogura]`, `[☀️ Rajshahi]`, `[🌊 Sylhet]`, `[🌴 Khulna]`) or search any upazila or district.
   * Click or drag the marker anywhere on the high-resolution Esri World Imagery satellite map to dynamically calculate nearest river/canal distance and 30-AEZ agro-meteorological metrics.
4. **Climate Scenario Simulator & 4-Year Crop Rotation Planner (2026–2029):**
   * Move the interactive sliders: **Rainfall change (-30% to +30%)**, **Temperature change (-3°C to +5°C)**, and **Water availability (-30% to +20%)**.
   * Watch the AI decision engine recompute crop survivability in real time, shifting recommendations (`Maize` ↔ `Sorghum` ↔ `Boro Rice`) and forecasting financial yield in **BDT (৳)**.
   * Explore the 4-Year Rotation Planner to analyze soil nitrogen regeneration and disease cycle interruption.
5. **Bilingual Farmer Buddy AI (English & বাংলা):**
   * Switch language using the `EN / বাং` toggle in the top navbar. Every heading, telemetry pill, badge, and label immediately updates into natural Bengali or English.
   * Click the floating **Farmer Buddy AI** launcher at the bottom-right to open the responsive assistant, featuring context-aware agronomic answers tailored to the active field coordinates.

---

## 🛰️ NASA Earth Observation Datasets & Scientific Validity

Field Shift integrates data products from five premier NASA and partner Earth Observation missions:

| NASA Mission / Dataset | Physical Parameter Ingested | Spatial / Temporal Resolution | Official Source Portal | How Field Shift Uses It in Production |
| :--- | :--- | :---: | :--- | :--- |
| **NASA SMAP**<br/>*(Soil Moisture Active Passive)* | Surface (0–5 cm) & Root-Zone (0–100 cm) Soil Moisture (`GWETROOT`, `GWETTOP`) | 9 km grid<br/>Updated 2–3 days | [NASA Earthdata](https://earthdata.nasa.gov/) / [SMAP JPL](https://smap.jpl.nasa.gov/) | Powers the 4-Zone Live Radar HUD, triggers precision irrigation alerts (Deficit vs. Optimal vs. Waterlogged), and drives 3D subterranean root moisture physics. |
| **NASA MODIS & VIIRS**<br/>*(Terra & Aqua Satellites)* | Normalized Difference Vegetation Index (NDVI) & Photosynthetically Active Radiation (`PAR Flux`) | 250 m – 1 km<br/>Daily / 8-day composite | [NASA Worldview](https://worldview.earthdata.nasa.gov/) / [Eyes on the Earth](https://eyes.nasa.gov/apps/earth/) | Evaluates vegetative vigor (0.52–0.76 NDVI), drives chlorophyll health indicators in the AR inspector, and calculates fertilizer uptake timing. |
| **NASA POWER & MERRA-2**<br/>*(GMAO Agroclimatology)* | Surface Solar Irradiance (`ALLSKY_SFC_SW_DWN`), 2m Air Temp (`T2M`), Wind Speed (`WS2M`), Relative Humidity (`RH2M`) | 0.5° × 0.625°<br/>Hourly / Daily API | [NASA POWER Portal](https://power.larc.nasa.gov/) / [GMAO Reanalysis](https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/) | Ingested by the 7-Day Hyper-Local Krishi Weather Forecast, safe spraying window calculator, and Climate Scenario Simulator. |
| **NASA ECOSTRESS**<br/>*(ISS Thermal Radiometer)* | Land Surface Temperature (LST), Evapotranspiration (ET) & Evaporative Stress Index (ESI) | 70 m pixel<br/>Variable ISS orbit | [NASA AppEEARS](https://appeears.earthdatacloud.nasa.gov/) / [ECOSTRESS JPL](https://ecostress.jpl.nasa.gov/) | Detects microclimate heatwave canopy stress days before visible crop wilting, warning farmers before irreversible yield damage occurs. |
| **NASA GPM IMERG**<br/>*(Global Precipitation Measurement)* | Multi-satellite High-Resolution Precipitation Rates (`PRECTOTCORR`, mm/day) | 0.1° (~10 km)<br/>Half-hourly / Daily | [NASA GPM Mission](https://gpm.nasa.gov/) / [GES DISC](https://disc.gsfc.nasa.gov/) | Calibrates localized rainfall baselines across all 64 Bangladesh districts, powering monsoon anomaly detection and haor flash-flood warnings. |

---

## 🏗️ System Architecture & Technology Stack

```
+----------------------------------------------------------------------------------------------------+
|                                    FIELD SHIFT ARCHITECTURE                                        |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ ORBITAL TELEMETRY LAYER ]                                                                      |
|   • NASA SMAP (Soil Moisture)    • NASA MODIS (NDVI & PAR)       • NASA ECOSTRESS (Canopy Temp)    |
|   • NASA POWER (Solar & Temp)    • NASA MERRA-2 (Agroclimate)    • NASA GPM IMERG (Precipitation)  |
|                                         |                                                          |
|                                         v                                                          |
|   [ BACKEND & AGRO-METEOROLOGICAL ENGINE ]                                                         |
|   • 64-Zilla Agro-Ecological Zone (AEZ) Database (0ms Latency Built-in Telemetry)                   |
|   • Dual Reverse Geocoding Engine (Photon API + OpenStreetMap Nominatim Fallback)                  |
|   • Node.js / Express Gemini API Proxy (`/api/gemini/chat` with Local Offline Fallback)            |
|                                         |                                                          |
|                                         v                                                          |
|   [ PRESENTATION & CLIENT-SIDE RUNTIME ]                                                           |
|   +------------------------------------+  +----------------------------------------------------+   |
|   | 3D Digital Twin Engine (Three.js)  |  | Interactive GIS & Satellite Mapping (Leaflet.js)   |   |
|   | • 60 FPS Locked Adaptive WebGL     |  | • Esri World Imagery Satellite Tiles               |   |
|   | • Viewport-Aware Observer (0% GPU) |  | • Real-Time Hydrological Distance Calculations     |   |
|   | • PBR Lighting, Wind Shader, AR    |  | • 64 District Coordinates & Dynamic Pins           |   |
|   +------------------------------------+  +----------------------------------------------------+   |
|   +------------------------------------+  +----------------------------------------------------+   |
|   | Decision Support & Simulation UI   |  | Bilingual AI Farmer Buddy Engine                   |   |
|   | • Climate Scenario Sliders (৳ BDT) |  | • Gemini Multimodal Agriculture System Prompt      |   |
|   | • 4-Year Crop Rotation Matrices    |  | • English ↔ বাংলা Instant UI Localization Engine   |   |
|   | • Responsive Glassmorphism         |  | • Mobile Bottom-Sheet Modal (82dvh, Touch Ergonomic|   |
|   +------------------------------------+  +----------------------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

### Key Engineering Highlights:
* **Zero-Lag 60 FPS Three.js WebGL Engine:** Equipped with smart adaptive pixel ratio (`1.5x` on mobile, `2.0x` on desktop), throttled pointermove raycasting (50ms gate), and an `IntersectionObserver` that completely pauses rendering when off-screen or tab-hidden to prevent mobile device overheating.
* **Ergonomic Responsive UI:** Zero horizontal overflow (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`) across all screens (iPhone 375px, Android 412px, iPad 768px, Tablet 1024px, Desktop 1366px, 1920px+).
* **High-Contrast Glassmorphic Aesthetics:** Emerald and dark-forest palettes engineered for outdoor readability under direct sunlight in agricultural fields.
* **Bilingual English & Bengali Localization:** Instant client-side state synchronization across all 15 crops, 64 districts, and simulated climate scenarios.

---

## 👥 Team ASL Spectra (Credits & Roles)

Proudly engineered for the **2026 NASA International Space Apps Challenge** by **Team ASL Spectra** from Mymensingh, Bangladesh:

| Team Member | Official Role & Core Technical Contribution | Profile / Attribution |
| :--- | :--- | :---: |
| **Monjir Bin Morshed Sadi** | **Frontend & AI/ML Developer**<br/>• 3D WebGL Digital Twin & Shader Architecture (Three.js)<br/>• System Architecture, Performance Engineering & Lead Maintainer | [![GitHub](https://img.shields.io/badge/GitHub-@g--sadi-181717?style=flat&logo=github)](https://github.com/g-sadi) |
| **Fahmida Ahmed** | **Full Stack & AI/ML Developer**<br/>• Agronomic Data Modeling & Climate Resilience Formulations<br/>• AI Assistant Integration & NASA Satellite Telemetry Pipelines | [Team ASL Spectra Profile](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) |
| **Fatima Tuzzohora** | **UI/UX Designer & Data Visualization Lead**<br/>• Agri-Tech Glassmorphic Interface Design & Accessibility<br/>• 4-Zone Telemetry Radar HUD & Visual Assets Architecture | [Team ASL Spectra Profile](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) |
| **Abdullah Bin Rakib** | **Media, Research & Documentation Lead**<br/>• Agro-Ecological Field Research & Farmer Persona Studies<br/>• Pitch Video Production, Voiceover & Scientific Storyboarding | [Team ASL Spectra Profile](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) |
| **Tachin Mahabub Tonoy** | **Researcher & Backend Developer**<br/>• NASA Earth Observation API Pipeline Architecture<br/>• Environmental Data Cleansing & Satellite Telemetry Processing | [Team ASL Spectra Profile](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) |
| **Md. Mahbub Alam** | **Frontend Developer**<br/>• Interactive 64-Zilla GIS Satellite Mapping (Leaflet / Esri)<br/>• Mobile Responsive Layouts & Climate Scenario Simulator Controls | [Team ASL Spectra Profile](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/) |

> **Repository Maintainer Note:** Code commits, technical deployment pipelines, and GitHub repository administration are managed by Monjir Bin Morshed Sadi ([@g-sadi](https://github.com/g-sadi)). All six team members are officially registered and verifiable on the [NASA Space Apps Challenge Team Page](https://www.spaceappschallenge.org/2026/find-a-team/asl_spectra/).

---

## 📜 License & Open-Source Attribution

This project is licensed under the **MIT License** — open-sourced for the benefit of smallholder farmers, researchers, and agronomists worldwide.

All NASA satellite data, products, and APIs utilized in Field Shift comply with the [NASA Open Data Policy](https://www.nasa.gov/open/data.html) and US Federal Open Science guidelines. Satellite basemaps are provided by Esri World Imagery under open GIS evaluation terms.

<div align="center">
<br/>

**Transforming NASA Earth Observations into Harvests of Hope.**  
*NASA International Space Apps Challenge 2026 • Team ASL Spectra*

</div>
