<div align="center">

# 🌾 FieldShift
### Adaptive Smart Farming & Low-Bandwidth AI Assistant
**Official Submission for the NASA International Space Apps Challenge 2026**  
*Engineered by **Team ASL Spectra** (Bangladesh)*

<br/>

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Global%20Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)
[![NASA Earth Observations](https://img.shields.io/badge/NASA%20Data-SMAP%20%7C%20POWER%20%7C%20MODIS-0284c7?style=for-the-badge&logo=nasa&logoColor=white)](https://power.larc.nasa.gov/)
[![3D Simulation](https://img.shields.io/badge/3D%20Engine-Three.js%20%2F%20WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![AI Engine](https://img.shields.io/badge/AI-Farmer%20Buddy%20(EN%2F%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE)-8b5cf6?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![YouTube Pitch](https://img.shields.io/badge/YouTube-240s%20Official%20Pitch-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=fh6zsdTMMQ8)

<br/>

### 🌐 Official Judge Showcase Links
[🚀 **Launch Live Web Application**](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/) • [🎥 **Watch 240s Official Pitch Video**](https://www.youtube.com/watch?v=fh6zsdTMMQ8) • [⚡ **Watch 30s Feature Shorts**](https://www.youtube.com/shorts/jdqRpXBAS44) • [📂 **GitHub Repository**](https://github.com/g-sadi/Nasa-Space-Apps-Challenge-website)

</div>

---

## 📌 Executive Summary & Challenge Solution

Across Bangladesh's **30 Agro-Ecological Zones (AEZ)**, smallholder farmers face severe climate challenges: unpredictable monsoon delays, flash floods in northeastern haor basins, and acute soil moisture depletion in the northwestern Barind Tract. 

**FieldShift** bridges the gap between petabytes of NASA Earth Observations and smallholder farmers in low-bandwidth rural environments. It translates raw multi-spectral satellite telemetry into actionable, field-level agronomic advisories through:
1. **Interactive 3D Digital Twin Crop Simulation** (Three.js WebGL)
2. **Instant 64-Zilla GIS Satellite Mapping & Land Selector** (Leaflet + Esri World Imagery)
3. **Multilingual Farmer Buddy AI Assistant** (Bengali/English agronomic advisor powered by Google Gemini API with native offline agronomy rule fallback)

---

## 🛰️ NASA Earth Observation Datasets & APIs Attribution

FieldShift relies on verified NASA Earth science missions and open data APIs:

| NASA Mission / Dataset | Sensor / Platform | Parameters Utilized | Application in FieldShift | Primary Reference / API Endpoint |
|:---|:---|:---|:---|:---|
| **NASA SMAP** *(Soil Moisture Active Passive)* | L-Band Radar / Radiometer (680 km SSO) | Surface Soil Moisture ($0-5\text{ cm}$), Root-Zone Moisture, Freeze/Thaw state | Drives 4-Zone Radar HUD, irrigation urgency alerts, and soil moisture stratum in 3D field twin | [NASA SMAP Mission](https://smap.jpl.nasa.gov/) / NSIDC DAAC (`SPL3SMP`) |
| **NASA POWER** *(Prediction of Worldwide Energy Resources)* | MERRA-2 Assimilation & GEOS-5 FP-IT | Solar Radiation (ALLSKY_SFC_SW_DWN), Daily Temp Max/Min, Dew/Frost Point, RH2M | Hyper-local 7-day Krishi weather forecast, solar pump feasibility, and growing degree-day models | [NASA POWER API](https://power.larc.nasa.gov/) (`community=AG`) |
| **NASA MODIS / VIIRS** | Terra & Aqua Satellites | NDVI (Normalized Difference Vegetation Index), EVI, Surface Reflectance | Real-time crop canopy vigor assessment across 4 plot zones and historical biomass health | [NASA Earthdata](https://earthdata.nasa.gov/) / LP DAAC (`MOD13Q1` / `VNP13A1`) |
| **NASA ECOSTRESS** | Thermal Radiometer on ISS | Evapotranspiration (ET), Evaporative Stress Index (ESI), Land Surface Temp (LST) | Identifies micro-scale canopy water stress before visible wilting occurs | [ECOSTRESS JPL](https://ecostress.jpl.nasa.gov/) |
| **GPM IMERG** | Global Precipitation Measurement Constellation | Multi-satellite precipitation accumulation rates (mm/hr) | Calibrates Scenario Simulator rainfall sliders and monsoon flood models | [NASA GPM IMERG](https://gpm.nasa.gov/data/imerg) |

---

## 🌟 Key Features & Architectural Innovations

### 1. Photorealistic 3D Crop Digital Twin Simulation (Three.js & WebGL)
- **Physics-Based Rendering (PBR):** Dynamically simulates vegetative growth stages for 15 indigenous crops across multiple soil strata (topsoil, root absorption layer, subsoil).
- **Multi-Angle Camera Modes:**
  - 🛸 **Drone Top View:** Orthographic canopy overview for spatial yield assessment.
  - 🌾 **Crop Close-Up:** Detailed botanical leaf transpiration and stem vigor inspection.
  - 🧪 **Subsoil Strata View:** NPK nutrient penetration and root moisture uptake depth.
- **Dynamic Lighting & Diurnal Cycle:** Seamlessly switches between Dawn, Noon, and Night celestial lighting with real-time shadow projection.
- **Smart Solar IoT Pump Sync:** Visualizes automated solar irrigation pump actuation when SMAP root-zone moisture drops below critical thresholds.

### 2. All 64 Bangladesh Zillas + Custom Plot GIS Satellite Map
- **High-Resolution Satellite Basemap:** Leaflet.js engine integrated with Esri World Imagery satellite layer (`24.7471° N, 90.4203° E`).
- **0ms Instant Fuzzy Multi-Engine Search:**
  - Instant district search across all **64 Zillas in 8 divisions** supporting English, Bangla, and alternative transliterations (*Chattogram/Chittagong*, *Cumilla/Comilla*, *Jashore/Jessore*, *Bogura/Bogra*, *Barishal/Barisal*).
  - Sub-district & Agricultural Hub resolution (*Bakshibazar Dhaka, Trishal Mymensingh, Srimangal Tea Belt, Gadkhali Flower Zone, Bhimruli Floating Market*).
  - 8-Division Quick Selector dropdown right in the map HUD.
- **Spatial Telemetry Interconnection:** Clicking any point on the Bangladesh landmass automatically measures proximity to the nearest river (e.g., *Old Brahmaputra, Buriganga, Gumti, Surma*), nearest water reservoir, soil condition, and agro-ecological zone (AEZ).

### 3. Multilingual "Farmer Buddy" AI Agronomist (কৃষি বন্ধু)
- **Bilingual Interface:** Converses naturally in native Bangla and English via speech and text.
- **Tier-3 Architecture:**
  - **Tier 1:** Native client-side agroclimatology rule engine with 0ms response time for low-bandwidth environments.
  - **Tier 2:** Enriched NASA SMAP, MODIS, and weather telemetry context injection.
  - **Tier 3:** High-speed Gemini API integration providing contextual pest control, fertilizer NPK ratio calculations, and climate adaptation strategies.

### 4. Climate Scenario Simulator & Dual-Axis Yield Model
- **Real-Time Dual-Line Visualization:** Interactive Chart.js canvas graphing **Monthly Rainfall (mm)** against **Water Availability (%)**.
- **Interactive Stress Sliders:**
  - 🌧️ *Rainfall Variance:* $-50\%$ drought to $+50\%$ flood conditions.
  - 🌡️ *Temperature Anomaly:* $-3^\circ\text{C}$ cooling to $+5^\circ\text{C}$ heatwave.
  - 💧 *Canal & Reservoir Capacity:* Real-time water table adjustment.
- **Predictive Crop Recommendation:** Automatically calculates shifting economic yield and advises switching to climate-resilient alternative crops.

### 5. 4-Year Multi-Season Field Rotation & 15-Crop Lifecycle Tracker
- **Soil Health Preservation (2026–2029):** Rotates nitrogen-fixing legumes, high-biomass cereals, and cash crops to rebuild soil nitrogen and interrupt pest life cycles.
- **15 Cultivars Supported:** *Rice (Aman, Boro, Aus), Wheat, Jute, Potato, Tomato, Mustard, Lentils, Maize, Eggplant, Onion, Chili, Carrot, Cauliflower, Cucumber, Papaya*.

---

## 🛠️ Technology Stack Breakdown

```text
Frontend Layer:       HTML5 (Semantic), Modern CSS3 (Dark Glassmorphism, CSS Grid/Flexbox), ES6+ Vanilla JS
3D Graphics:          Three.js (r160), WebGL Shader Materials, Procedural Botanical Geometry
GIS & Mapping:        Leaflet.js (v1.9.4), Esri World Imagery Satellite Tiles, Photon Geocoding API
Data Visualization:   Chart.js (v4.4), Custom Agro-Ecological Zone (AEZ) Telemetry Matrix
Backend (Optional):   Python 3.10+, FastAPI, Uvicorn, Pydantic, python-dotenv
AI & Machine Learning:Google Gemini Multimodal API (gemini-2.5-flash) + Native Agronomic Expert Rules
Deployment & CI/CD:   GitHub Pages, GitHub Actions (Decoupled Multi-Job Pipeline: Build & Deploy)
```

---

## 🚀 Quick Start & Local Execution Guide

### 1. Clone the Repository
```bash
git clone https://github.com/g-sadi/Nasa-Space-Apps-Challenge-website.git
cd Nasa-Space-Apps-Challenge-website
```

### 2. Run Frontend Web Application (Zero Installation Required)
FieldShift is a zero-build client-side application. Run with any local static HTTP server:

```bash
# Using Python built-in server
python -m http.server 8080

# Or using Node.js
npx serve -l 8080 .
```

Open your browser and visit: `http://localhost:8080`

### 3. (Optional) Run the Local FastAPI AI Backend
To enable the optional backend proxy for Gemini streaming:
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Windows
source venv/bin/activate    # On Linux/macOS
pip install -r requirements.txt
python main.py
```

---

## 👥 Team ASL Spectra (Credits & Roles)

*Proudly developed for the **2026 NASA International Space Apps Challenge** by **Team ASL Spectra** from Bangladesh:*

- **Monjir Bin Morshed Sadi**  
  *Team Lead, Principal Full-Stack Architect & 3D WebGL Visualization Engineer*  
  GitHub: [@g-sadi](https://github.com/g-sadi)

- **Fahmida Ahmed**  
  *Co-Lead, Agricultural Data Modeling, Agronomy Research & Space Telemetry Lead*  
  GitHub: [@FahmidaAhmed](https://github.com/FahmidaAhmed)

---

## 📄 License & Open-Source Attribution
This project is licensed under the **MIT License** — open-sourced for the global agricultural and space science community. All NASA satellite data and APIs are utilized under the [NASA Open Data Policy](https://www.nasa.gov/open/data.html).

<div align="center">
<br/>

**Transforming NASA Earth Observations into Harvests of Hope.**  
*NASA Space Apps Challenge 2026 • Team ASL Spectra*

</div>
