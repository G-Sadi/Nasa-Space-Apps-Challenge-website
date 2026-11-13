# 📑 FieldShift — NASA Earth Science Data Attribution & References Document
**NASA International Space Apps Challenge 2026**  
**Team Name:** Team ASL Spectra  
**Project:** FieldShift (Adaptive Smart Farming & Low-Bandwidth AI Assistant)  
**Authors:** Monjir Bin Morshed Sadi & Fahmida Ahmed  
**Live Application:** [https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/)  
**GitHub Repository:** [https://github.com/g-sadi/Nasa-Space-Apps-Challenge-website](https://github.com/g-sadi/Nasa-Space-Apps-Challenge-website)  

---

## 1. Executive Data Attribution Statement
FieldShift is engineered in strict compliance with the **NASA Open Data Policy**. All planetary, meteorological, and biophysical metrics presented across our 3D Living Field Digital Twin, 4-Zone Radar HUD, 64-Zilla GIS Satellite Map, and Climate Scenario Simulator derive from verified NASA Earth Science missions and peer-reviewed agro-ecological models.

---

## 2. NASA Missions, Datasets & Scientific Citations

### 2.1 NASA Soil Moisture Active Passive (SMAP)
- **Mission:** Soil Moisture Active Passive (SMAP)
- **Instruments:** L-Band Radar (1.26 GHz) & L-Band Radiometer (1.41 GHz)
- **Data Product:** SMAP L3 Enhanced Radiometer Global Daily 9 km EASE-Grid Soil Moisture (`SPL3SMP_E`) & Level 4 Surface/Root-Zone Soil Moisture (`SPL4SMAU`)
- **Parameters Used in FieldShift:** 
  - `soil_moisture_surface` ($0-5\text{ cm}$ volumetric fraction, $\text{m}^3/\text{m}^3$)
  - `soil_moisture_rootzone` ($0-100\text{ cm}$ root extraction potential)
- **Role in Solution:** Calibrates the 4-Zone Hero Radar HUD, defines root-zone strata hydration in the 3D plant twin, and triggers automated solar irrigation pump actuation thresholds.
- **Reference / DOI:** O'Neill, P. E., et al. (2021). *SMAP Enhanced L3 Radiometer Global Daily 9 km EASE-Grid Soil Moisture*. NASA National Snow and Ice Data Center Distributed Active Archive Center (NSIDC DAAC). [https://doi.org/10.5067/4DQASW1PGZYW](https://doi.org/10.5067/4DQASW1PGZYW)

---

### 2.2 NASA Prediction of Worldwide Energy Resources (POWER)
- **Mission / Program:** NASA Applied Sciences Program / Earth Science Division
- **Data Source:** MERRA-2 (Modern-Era Retrospective Analysis for Research and Applications, Version 2) & GEOS-5 FP-IT
- **API Endpoint Used:** `https://power.larc.nasa.gov/api/temporal/daily/point` with `community=AG` (Agroclimatology)
- **Parameters Used in FieldShift:**
  - `ALLSKY_SFC_SW_DWN`: All Sky Surface Downwelling Shortwave Irradiance ($\text{MJ}/\text{m}^2/\text{day}$)
  - `T2M_MAX` / `T2M_MIN`: Maximum and Minimum Air Temperature at 2 Meters ($^\circ\text{C}$)
  - `RH2M`: Relative Humidity at 2 Meters ($\%$)
  - `PRECTOTCORR`: Bias-corrected total precipitation ($\text{mm}/\text{day}$)
- **Role in Solution:** Powers the 7-day hyper-local Krishi weather forecast, diurnal Dawn-to-Night solar lighting model in Three.js, and growing degree-day (GDD) crop progression calculations.
- **Reference:** Stackhouse, P. W., et al. (2020). *NASA POWER Release 8 (Agroclimatology Methodology)*. NASA Langley Research Center. [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/)

---

### 2.3 NASA MODIS (Moderate Resolution Imaging Spectroradiometer) & VIIRS
- **Platform:** Terra (EOS AM-1) & Aqua (EOS PM-1) / Suomi NPP
- **Data Product:** MODIS Terra/Aqua 16-Day L3 Global 250m Vegetation Indices (`MOD13Q1` / `MYD13Q1`) & VIIRS Surface Reflectance (`VNP13A1`)
- **Parameters Used in FieldShift:**
  - Normalized Difference Vegetation Index (NDVI): $\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}}$
  - Enhanced Vegetation Index (EVI)
- **Role in Solution:** Drives real-time plot health indicators ($0.52 - 0.74\text{ NDVI}$ across Zones A–D) and determines the vegetative biomass color palette in 3D crop leaf shaders.
- **Reference / DOI:** Didan, K. (2015). *MOD13Q1 MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V006*. NASA LP DAAC. [https://doi.org/10.5067/MODIS/MOD13Q1.006](https://doi.org/10.5067/MODIS/MOD13Q1.006)

---

### 2.4 NASA ECOsystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS)
- **Platform:** International Space Station (ISS)
- **Instruments:** Multispectral Thermal Infrared Radiometer (5 bands, $8-12.5\ \mu\text{m}$)
- **Data Products:** Evapotranspiration (`ECO3ETPTJPL`), Evaporative Stress Index (`ECO4ESIPTJPL`), Land Surface Temperature (`ECO2LSTE`)
- **Role in Solution:** Detects pre-visual canopy water stress, enabling our Farmer Buddy AI to advise water conservation 48–72 hours before visible crop wilting.
- **Reference:** Fisher, J. B., et al. (2020). *The ECOSTRESS mission: Evapotranspiration from the International Space Station*. Remote Sensing of Environment, 248, 111977. [https://doi.org/10.1016/j.rse.2020.111977](https://doi.org/10.1016/j.rse.2020.111977)

---

### 2.5 NASA Global Precipitation Measurement (GPM) IMERG
- **Constellation:** GPM Core Observatory & International Partner Satellites
- **Data Product:** GPM Level 3 Final Daily IMERG Precipitation (`GPM_3IMERGDF`)
- **Role in Solution:** Calibrates baseline precipitation curves in our Scenario Simulator dual-line chart and models flash-flood threshold risks across regional river basins.
- **Reference / DOI:** Huffman, G. J., et al. (2019). *GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V06*. NASA GES DISC. [https://doi.org/10.5067/GPM/IMERGDF/DAY/06](https://doi.org/10.5067/GPM/IMERGDF/DAY/06)

---

## 3. Bangladesh Regional & Agro-Ecological Ground Truth Sources
To ensure mathematical precision across Bangladesh's agricultural geography, NASA satellite metrics are cross-correlated with:
1. **Bangladesh Agricultural Research Council (BARC):**
   - *Agro-Ecological Zone (AEZ) Classification of Bangladesh (Zones 1–30)*.
   - Soil texture, flood vulnerability, and native crop suitability matrices for all 64 administrative districts.
2. **Soil Resource Development Institute (SRDI):**
   - General Soil Types of Bangladesh and regional NPK fertilizer recommendation handbooks.
3. **Bangladesh Meteorological Department (BMD):**
   - 30-year climatological rainfall and temperature baselines for Dhaka, Mymensingh, Sylhet, Chattogram, Rajshahi, Rangpur, Khulna, and Barishal.

---

## 4. Open-Source Libraries & Software Attribution

| Technology / Component | Version / Source | License | Purpose in Project |
|:---|:---|:---|:---|
| **Three.js** | `0.160.0` (ESM) | MIT License | Photorealistic 3D botanical rendering, PBR shaders, dynamic shadow mapping |
| **Leaflet.js** | `1.9.4` | BSD-2-Clause | GIS interactive map engine, polygon click coordinates, custom HUD badges |
| **Esri World Imagery** | ArcGIS Online TileServer | Proprietary Open-Tile Access | High-resolution satellite basemap photography |
| **Chart.js** | `4.4.0` | MIT License | Dual-axis real-time climate simulation graphing |
| **Google Gemini API** | `gemini-2.5-flash` | Google Cloud Terms | Multimodal agronomist reasoning for bilingual Farmer Buddy AI |
| **FastAPI** | `0.110.0` | MIT License | Low-latency asynchronous backend proxy |

---

## 5. Judge Verification Instructions
NASA Space Apps judges can independently verify our data integration:
1. **Live Web Inspection:** Open the [FieldShift Web Application](https://g-sadi.github.io/Nasa-Space-Apps-Challenge-website/).
2. **Inspect Satellite Mapping:** Navigate to **Land & Weather**, select any district (e.g., *Cumilla, Cox's Bazar, or Bogura*), and observe the instant Haversine river calculation and satellite layer reload.
3. **3D Scene Verification:** Open your browser's Developer Tools Console (`F12`), interact with the **3D Live Field**, switch between *Dawn*, *Noon*, and *Night*, and note the 0ms WebGL scene updates and live solar angle recalculations.
4. **NASA Telemetry Hub Modal:** Click **NASA কৃষি ডেটা** inside the 3D controls to review the embedded live telemetry source breakdown and community AG API mapping.

---

*Authored by Team ASL Spectra (Monjir Bin Morshed Sadi & Fahmida Ahmed) for the 2026 NASA International Space Apps Challenge.*
