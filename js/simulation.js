/*
|--------------------------------------------------------------------------
| FIELD SHIFT — PHOTOREALISTIC 3D & SPATIAL AR CROP ENGINE
|--------------------------------------------------------------------------
| - Hyper-Detailed PBR Botanical Morphology (Distinct Leaf Shapes, Organic
|   Tapered Stems, Zero Wooden Stakes, Calyx Stars, PBR Subsurface Translucency)
| - Crop-Accurate Phenological Growth Stages from window.CROPS_DATABASE
| - True In-Scene 3D Spatial AR Anchors (World-to-Screen Projected Pins)
| - 3D Crop Macro View / AR Holographic Inspection Callout Ring
| - Dynamic PBR Soil with Displacement Ridges & Live Moisture Specular Sheen
| - Physically Based Atmospheric Sky (ACESFilmicToneMapping, Rich Contrast)
| - High-Fidelity Slanted Rain Streaks, Aerosol Mist & Nutrient Glow Particles
| - Rotary Brass Sprinklers with Parabolic Water Jet Arcs
| - GPU Vertex-Shader Wind Sway (onBeforeCompile) Anchored at Ground (y = 0)
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { sketchfabService, CURATED_SKETCHFAB_MODELS } from "./sketchfabService.js";
import {
    fetchNasaAgriData,
    getCurrentNasaAgriData,
    translateNasaDataToFarmerActions,
    onNasaDataUpdated,
    BANGLADESH_FARM_PRESETS
} from "./nasaAgriService.js";

// =============================================================================
// GLOBAL SIMULATION STATE & CONFIGURATION
// =============================================================================

let scene, camera, renderer, controls;
let containerEl, canvasEl;
let sky = null, sun = null;
let sunLight = null, hemiLight = null, ambientLight = null;
let terrainMesh = null, waterMesh = null, grassTuftsMesh = null, soilVolumeMesh = null;
let rootInstancedMesh = null, currentRootMat = null;
let iotNodesGroup = null, iotLights = [], iotLedMaterials = [];
let gltfLoader = null;
let currentTimeOfDayMode = "noon";

// Device Detection for Mobile Responsiveness & 60 FPS Optimization
export function isMobileDevice() {
    return (
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

// Field Layout: Adaptive Grid (8x8 = 64 on mobile for high-FPS 60fps, 16x16 = 256 on desktop)
let ROWS = 16;
let COLS = 16;
let TOTAL_PLANTS = ROWS * COLS;
let ROW_SPACING = 0.88;
let PLANT_SPACING = 0.88;

/**
 * Normalizes incoming crop IDs from UI dropdowns, API, or Bangla labels
 */
export function normalizeCropId(rawId) {
    if (!rawId) return "tomato";
    const str = String(rawId).toLowerCase().trim();
    if (str.includes("rice") || str.includes("ধান")) return "rice";
    if (str.includes("wheat") || str.includes("গম")) return "wheat";
    if (str.includes("maize") || str.includes("corn") || str.includes("ভুট্টা")) return "maize";
    if (str.includes("jute") || str.includes("পাট")) return "jute";
    if (str.includes("potato") || str.includes("আলু")) return "potato";
    if (str.includes("mustard") || str.includes("সরিষা")) return "mustard";
    if (str.includes("tomato") || str.includes("টমেটো")) return "tomato";
    if (str.includes("eggplant") || str.includes("brinjal") || str.includes("বেগুন")) return "eggplant";
    if (str.includes("chili") || str.includes("chilli") || str.includes("pepper") || str.includes("মরিচ")) return "chili";
    if (str.includes("lentil") || str.includes("মসুর")) return "lentil";
    if (str.includes("cucumber") || str.includes("শসা")) return "cucumber";
    if (str.includes("cauliflower") || str.includes("ফুলকপি")) return "cauliflower";
    if (str.includes("onion") || str.includes("পেঁয়াজ") || str.includes("পিয়াজ")) return "onion";
    if (str.includes("carrot") || str.includes("গাজর")) return "carrot";
    if (str.includes("papaya") || str.includes("পেঁপে")) return "papaya";
    return str;
}
window.normalizeCropId = normalizeCropId;

// =============================================================================
// CROP DISPLAY NAMES & LOCALIZATION (BULLETPROOF FALLBACK MAPPING)
// =============================================================================
export const CROP_DISPLAY_NAMES = {
    tomato: { en: "Tomato", bn: "টমেটো", icon: "🍅" },
    rice: { en: "Rice", bn: "ধান", icon: "🌾" },
    wheat: { en: "Wheat", bn: "গম", icon: "🌾" },
    maize: { en: "Maize", bn: "ভুট্টা", icon: "🌽" },
    jute: { en: "Jute", bn: "পাট", icon: "🌿" },
    potato: { en: "Potato", bn: "আলু", icon: "🥔" },
    mustard: { en: "Mustard", bn: "সরিষা", icon: "🌼" },
    eggplant: { en: "Eggplant", bn: "বেগুন", icon: "🍆" },
    chili: { en: "Chili", bn: "মরিচ", icon: "🌶️" },
    lentil: { en: "Lentil", bn: "মসুর ডাল", icon: "🌱" },
    cucumber: { en: "Cucumber", bn: "শসা", icon: "🥒" },
    cauliflower: { en: "Cauliflower", bn: "ফুলকপি", icon: "🥦" },
    onion: { en: "Onion", bn: "পেঁয়াজ", icon: "🧅" },
    carrot: { en: "Carrot", bn: "গাজর", icon: "🥕" },
    papaya: { en: "Papaya", bn: "পেঁপে", icon: "🍈" }
};

export function getCropDisplayName(cropId, isBn = false) {
    if (!cropId) return isBn ? "ফসল" : "Crop";
    const key = normalizeCropId(cropId);
    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === key) : null;
    if (dbCrop) {
        if (isBn && (dbCrop.bangla_name || dbCrop.name_bn)) {
            return dbCrop.bangla_name || dbCrop.name_bn;
        }
        if (!isBn && (dbCrop.name || dbCrop.name_en)) {
            return dbCrop.name || dbCrop.name_en;
        }
    }
    const fallback = CROP_DISPLAY_NAMES[key];
    if (fallback) {
        return isBn ? fallback.bn : fallback.en;
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
}
window.getCropDisplayName = getCropDisplayName;
window.CROP_DISPLAY_NAMES = CROP_DISPLAY_NAMES;

/**
 * Returns exact terrain surface height at (x, z)
 */
export function getTerrainHeightAt(x, z) {
    const furrowFreq = Math.PI / ROW_SPACING;
    let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.22;
    y += Math.sin(x * 24.0 + z * 18.0) * 0.014;
    y += Math.sin(x * 48.0) * Math.cos(z * 36.0) * 0.007;

    const dist = Math.max(Math.abs(x), Math.abs(z));
    if (dist > 5.8) {
        const bundFactor = Math.min((dist - 5.8) / 1.6, 1.0);
        y += Math.sin(bundFactor * Math.PI * 0.5) * 0.38;
    }
    return y;
}
window.getTerrainHeightAt = getTerrainHeightAt;

/**
 * Universal placement helper guaranteeing plant root/stem base sits 100% on top of soil ridge
 */
export function placeOnSoilRidge(plantGroup, x, z) {
    if (!plantGroup) return;
    const terrainY = getTerrainHeightAt(x, z);
    const box = new THREE.Box3().setFromObject(plantGroup);
    const minY = isFinite(box.min.y) ? box.min.y : 0;
    plantGroup.position.set(x, terrainY - minY - 0.01, z);
}
window.placeOnSoilRidge = placeOnSoilRidge;

function updateFieldGridDimensions() {
    // Keep 100% full botanical plant density across all devices (zero quality drop)
    if (activeCropId === "papaya") {
        // Orchard spacing for large tropical papaya trees (7x7 = 49 trees)
        ROWS = 7;
        COLS = 7;
        TOTAL_PLANTS = ROWS * COLS;
        ROW_SPACING = 1.70;
        PLANT_SPACING = 1.70;
    } else {
        // Full lush field matrix (16x16 = 256 plants)
        ROWS = 16;
        COLS = 16;
        TOTAL_PLANTS = ROWS * COLS;
        ROW_SPACING = 0.88;
        PLANT_SPACING = 0.88;
    }
}

let instanceData = [];
let stemInstancedMesh = null;
let leafInstancedMesh = null;
let fruitInstancedMesh = null;
let calyxInstancedMesh = null;
let flowerInstancedMesh = null;
let currentCropGroup = null;

// Materials Cache for dynamic color/health updates
let currentStemMat = null;
let currentLeafMat = null;
let currentFruitMat = null;
let currentCalyxMat = null;
let currentFlowerMat = null;
let soilMaterial = null;

// Raycasting & Plot Inspection
let raycaster = null;
let mouse = new THREE.Vector2();

// Crop Lifecycle & Growth State
let activeCropId = "rice"; // Default to photorealistic Rice field
let currentGrowthDay = 68; // Default to mature fruiting & ripening stage so full crops are visible immediately
let maxCropDays = 105;
let currentGrowthStage = 4; // Default to Stage 4 (Fruit Ripening / Maturity)
let cropHealthState = "healthy"; // 'healthy' | 'deficiency' | 'pest'

// Simulation Playback
let isPlaying = false;
let playSpeed = 1;
let playbackTimer = null;

// Dynamic Soil & Microclimate State
let soilMoisturePercent = 78; // 0 - 100%
let npkLevelPercent = 86;
let pestRiskLevel = "low";
let currentActiveWeather = "sunny";

// Active Irrigation & Particle Systems
let isSprinklerActive = false;
let isRaining = false;
let rainLineSegments = null;
let rainPosArray = null;
let rainVelArray = null;
let sprayMistParticles = null;
let sprayMistGeo = null;
let fertilizerGlowParticles = null;
let fertilizerGlowGeo = null;
let sprinklerRisers = [];
let sprinklerWaterParticles = null;
let sprinklerWaterGeo = null;

// Animation & Shaders
let animationTime = 0;
let isTransitioningCrop = false;
let transitionProgress = 1.0;
let transitionScale = 1.0;

// Camera Transition State (Smooth 600ms Lerp Engine)
let currentCameraMode = "field"; // 'drone' | 'field' | 'root' | 'macro'
let isMacroViewActive = false;
let isXRayActive = false;
let activeInspectedPlantData = null;
let targetCameraPos = new THREE.Vector3(0, 0.90, 5.2);
let targetLookAt = new THREE.Vector3(0, 0.65, 0);
let startCameraPos = new THREE.Vector3(0, 0.90, 5.2);
let startLookAt = new THREE.Vector3(0, 0.65, 0);
let cameraTransitionStartTime = 0;
const CAMERA_TRANSITION_DURATION = 600; // 600ms smooth transition
let isTransitioningCamera = false;
let activeInspectedPlantPos = new THREE.Vector3(0, 0.45, 0);

export function startCameraTransition(newTargetPos, newTargetLookAt, duration = 600) {
    if (!camera || !controls) return;
    startCameraPos.copy(camera.position);
    startLookAt.copy(controls.target);
    targetCameraPos.copy(newTargetPos);
    targetLookAt.copy(newTargetLookAt);
    cameraTransitionStartTime = performance.now();
    isTransitioningCamera = true;
    requestShadowUpdate();
}
window.startCameraTransition = startCameraTransition;

// Smart Shadow Map Caching
export function requestShadowUpdate() {
    if (renderer && renderer.shadowMap) {
        renderer.shadowMap.needsUpdate = true;
    }
}
window.requestShadowUpdate = requestShadowUpdate;

// Zero-allocation scratch vector & cached metrics
const _projScratchVec = new THREE.Vector3();
let _ringEl = null;
let cachedContainerWidth = 0;
let cachedContainerHeight = 0;
let isSceneVisible = true;
let isDocumentVisible = true;
let isRenderLoopRunning = false;
let resizeDebounceTimer = null;

// Global Shader Uniforms
const windUniforms = {
    uTime: { value: 0.0 },
    uWindStrength: { value: 1.0 }
};

// Texture Cache
let monocotTexture = null, monocotBump = null;
let dicotTexture = null, dicotBump = null;
let soilTexture = null, soilBump = null;

// Math Helper
const dummy = new THREE.Object3D();

// World-Space Spatial AR Anchors
const SPATIAL_ANCHORS = [
    { id: "arPinZoneA", worldPos: new THREE.Vector3(-3.2, 0.95, -2.5) },
    { id: "arPinRow4", worldPos: new THREE.Vector3(0.0, 0.98, 0.0) },
    { id: "arPinSprinkler", worldPos: new THREE.Vector3(3.2, 1.15, -3.2) }
];

// =============================================================================
// 1. PROCEDURAL PBR TEXTURES (MOBILE-ACCELERATED & HIGH RESOLUTION)
// =============================================================================
function initProceduralTextures() {
    // Keep 100% full 512x512 razor-sharp resolution and dense venation on all devices
    const texSize = 512;

    // A. Monocot Leaf Texture (Rice, Wheat, Maize)
    const monoCanvas = document.createElement("canvas");
    monoCanvas.width = texSize;
    monoCanvas.height = texSize;
    const mCtx = monoCanvas.getContext("2d");
    if (mCtx) {
        const mGrad = mCtx.createLinearGradient(0, texSize, 0, 0);
        mGrad.addColorStop(0.00, "#18421c");
        mGrad.addColorStop(0.40, "#256f2d");
        mGrad.addColorStop(0.75, "#3ba83e");
        mGrad.addColorStop(0.95, "#6ebe48");
        mGrad.addColorStop(1.00, "#b0c946");
        mCtx.fillStyle = mGrad;
        mCtx.fillRect(0, 0, texSize, texSize);

        mCtx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        mCtx.lineWidth = 1.0;
        const step = 5;
        for (let x = 6; x < texSize; x += step) {
            mCtx.beginPath();
            mCtx.moveTo(x, 0);
            mCtx.lineTo(x, texSize);
            mCtx.stroke();
        }
        mCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        mCtx.lineWidth = 3.5;
        mCtx.beginPath();
        mCtx.moveTo(texSize / 2, 0);
        mCtx.lineTo(texSize / 2, texSize);
        mCtx.stroke();

        monocotTexture = new THREE.CanvasTexture(monoCanvas);
        monocotTexture.wrapS = THREE.RepeatWrapping;
        monocotTexture.wrapT = THREE.RepeatWrapping;
    }

    // B. Dicot Leaf Texture (Compound Serrated Tomato & Vegetables)
    const dicotCanvas = document.createElement("canvas");
    dicotCanvas.width = texSize;
    dicotCanvas.height = texSize;
    const dCtx = dicotCanvas.getContext("2d");
    if (dCtx) {
        const dGrad = dCtx.createRadialGradient(texSize / 2, texSize / 2, 30, texSize / 2, texSize / 2, texSize * 0.56);
        dGrad.addColorStop(0.0, "#3e8a32");
        dGrad.addColorStop(0.65, "#2a6723");
        dGrad.addColorStop(1.0, "#194215");
        dCtx.fillStyle = dGrad;
        dCtx.fillRect(0, 0, texSize, texSize);

        // Primary central midrib
        dCtx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        dCtx.lineWidth = 5.0;
        dCtx.beginPath();
        dCtx.moveTo(texSize / 2, texSize);
        dCtx.quadraticCurveTo(texSize / 2, texSize / 2, texSize / 2, 20);
        dCtx.stroke();

        // Lateral pinnate secondary veins
        dCtx.lineWidth = 2.0;
        dCtx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        const veinStep = 40;
        for (let y = 80; y < texSize - 20; y += veinStep) {
            dCtx.beginPath();
            dCtx.moveTo(texSize / 2, y);
            dCtx.quadraticCurveTo(texSize * 0.67, y - 22, texSize - 22, y - 58);
            dCtx.stroke();
            dCtx.beginPath();
            dCtx.moveTo(texSize / 2, y);
            dCtx.quadraticCurveTo(texSize * 0.33, y - 22, 22, y - 58);
            dCtx.stroke();
        }

        dicotTexture = new THREE.CanvasTexture(dicotCanvas);
    }

    // C. PBR Soil Furrow Bump Texture
    const soilCanvas = document.createElement("canvas");
    soilCanvas.width = texSize;
    soilCanvas.height = texSize;
    const sCtx = soilCanvas.getContext("2d");
    if (sCtx) {
        sCtx.fillStyle = "#2c1a0e";
        sCtx.fillRect(0, 0, texSize, texSize);

        const dotCount = 5000;
        for (let i = 0; i < dotCount; i++) {
            const x = Math.random() * texSize;
            const y = Math.random() * texSize;
            const r = Math.random() * 2.8 + 0.6;
            const shade = Math.floor(Math.random() * 60 + 35);
            sCtx.fillStyle = `rgb(${shade + 20}, ${shade + 8}, ${shade})`;
            sCtx.beginPath();
            sCtx.arc(x, y, r, 0, Math.PI * 2);
            sCtx.fill();
        }
        soilTexture = new THREE.CanvasTexture(soilCanvas);
        soilTexture.wrapS = THREE.RepeatWrapping;
        soilTexture.wrapT = THREE.RepeatWrapping;
        soilTexture.repeat.set(8, 8);
    }
}

// Procedural High-Resolution Cucumber Skin Texture (Dark Emerald Base & Pale Blossom-End Stripes)
let cucumberSkinTexture = null;
export function getCucumberSkinTexture() {
    if (cucumberSkinTexture) return cucumberSkinTexture;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Rich dark cucumber green gradient from stem neck (top) to blossom end (bottom)
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.00, "#0e3b1c");
    grad.addColorStop(0.35, "#14532d");
    grad.addColorStop(0.70, "#166534");
    grad.addColorStop(1.00, "#1e793d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // 2. Subtle dark & light mottled speckles
    for (let i = 0; i < 2200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 0.8 + Math.random() * 2.2;
        const isLight = Math.random() > 0.45;
        ctx.fillStyle = isLight ? "rgba(110, 231, 143, 0.16)" : "rgba(6, 32, 14, 0.28)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 8-10 Longitudinal pale yellow-green stripes tapering from blossom end (bottom) halfway up
    const stripeCount = 10;
    for (let s = 0; s < stripeCount; s++) {
        const cx = (s + 0.5) * (size / stripeCount);
        const stripeGrad = ctx.createLinearGradient(0, size, 0, size * 0.42);
        stripeGrad.addColorStop(0.00, "rgba(190, 242, 100, 0.85)"); // #bef264
        stripeGrad.addColorStop(0.35, "rgba(134, 239, 172, 0.58)"); // #86efac
        stripeGrad.addColorStop(0.70, "rgba(74, 222, 128, 0.22)");
        stripeGrad.addColorStop(1.00, "rgba(34, 197, 94, 0.00)");

        ctx.fillStyle = stripeGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 15, size);
        ctx.quadraticCurveTo(cx - 8, size * 0.72, cx - 1.5, size * 0.42);
        ctx.quadraticCurveTo(cx + 8, size * 0.72, cx + 15, size);
        ctx.closePath();
        ctx.fill();

        // Subtle lighter central pinstripe
        ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx, size);
        ctx.lineTo(cx, size * 0.50);
        ctx.stroke();
    }

    // 4. Pale spine / prickle dots on warts
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    for (let w = 0; w < 280; w++) {
        const wx = Math.random() * size;
        const wy = Math.random() * (size * 0.82);
        ctx.beginPath();
        ctx.arc(wx, wy, 0.9, 0, Math.PI * 2);
        ctx.fill();
    }

    cucumberSkinTexture = new THREE.CanvasTexture(canvas);
    cucumberSkinTexture.wrapS = THREE.RepeatWrapping;
    cucumberSkinTexture.wrapT = THREE.ClampToEdgeWrapping;
    return cucumberSkinTexture;
}

// Procedural High-Resolution Papaya Trunk Bark Texture (Olive-Tan with Diamond Leaf-Scar Markings)
let papayaBarkTexture = null;
export function getPapayaBarkTexture() {
    if (papayaBarkTexture) return papayaBarkTexture;
    const width = 256;
    const height = 512;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Organic vertical gradient: greyish-tan (#525e46) blending to lighter olive-green (#7a8966)
    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0.00, "#48533e");
    grad.addColorStop(0.35, "#5f6f52");
    grad.addColorStop(0.70, "#748364");
    grad.addColorStop(1.00, "#839272");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle fibrous bark striations
    for (let i = 0; i < 3200; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const len = 5 + Math.random() * 14;
        const isDark = Math.random() > 0.45;
        ctx.strokeStyle = isDark ? "rgba(35, 42, 28, 0.22)" : "rgba(164, 180, 142, 0.18)";
        ctx.lineWidth = 0.8 + Math.random() * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 3, y + len);
        ctx.stroke();
    }

    // 3. Realistic horizontal diamond-shaped leaf scar markings along trunk
    const scarRows = 14;
    for (let r = 0; r < scarRows; r++) {
        const sy = (r + 0.5) * (height / scarRows) + (Math.random() - 0.5) * 6;
        const numScars = 4;
        for (let s = 0; s < numScars; s++) {
            const sx = (s + ((r % 2) * 0.5)) * (width / numScars) + (Math.random() - 0.5) * 8;
            const dw = 16 + Math.random() * 6;
            const dh = 6 + Math.random() * 3;

            // Outer diamond scar rim
            ctx.fillStyle = "rgba(38, 44, 30, 0.58)";
            ctx.beginPath();
            ctx.moveTo(sx, sy - dh);
            ctx.lineTo(sx + dw, sy);
            ctx.lineTo(sx, sy + dh);
            ctx.lineTo(sx - dw, sy);
            ctx.closePath();
            ctx.fill();

            // Inner lighter scar center
            ctx.fillStyle = "rgba(142, 156, 124, 0.62)";
            ctx.beginPath();
            ctx.moveTo(sx, sy - dh * 0.55);
            ctx.lineTo(sx + dw * 0.65, sy);
            ctx.lineTo(sx, sy + dh * 0.55);
            ctx.lineTo(sx - dw * 0.65, sy);
            ctx.closePath();
            ctx.fill();

            // 3 tiny vascular bundle trace dots
            ctx.fillStyle = "rgba(42, 50, 34, 0.82)";
            ctx.beginPath();
            ctx.arc(sx - 3, sy, 0.9, 0, Math.PI * 2);
            ctx.arc(sx, sy - 1, 0.9, 0, Math.PI * 2);
            ctx.arc(sx + 3, sy, 0.9, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    papayaBarkTexture = new THREE.CanvasTexture(canvas);
    papayaBarkTexture.wrapS = THREE.RepeatWrapping;
    papayaBarkTexture.wrapT = THREE.RepeatWrapping;
    papayaBarkTexture.repeat.set(2, 4);
    return papayaBarkTexture;
}

// Procedural High-Resolution 7-Lobed Papaya Leaf Texture (Radiating Yellow-Green Veins #bef264)
let papayaLeafTexture = null;
export function getPapayaLeafTexture() {
    if (papayaLeafTexture) return papayaLeafTexture;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Tropical emerald green blade base with rich gradient
    const grad = ctx.createRadialGradient(size * 0.5, size * 0.45, 15, size * 0.5, size * 0.45, size * 0.68);
    grad.addColorStop(0.00, "#1e8438");
    grad.addColorStop(0.55, "#15803d");
    grad.addColorStop(1.00, "#14532d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle intercostal cellular mottling
    for (let i = 0; i < 2800; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 0.9 + Math.random() * 2.2;
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(34, 197, 94, 0.12)" : "rgba(10, 48, 22, 0.18)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 7 Radiating Main Veins (#bef264) from petiole hub (cx, cy)
    // Note: With Three.js flipY=true, v=0.07 maps to cy = size * (1 - 0.07) = 475 near canvas bottom
    const cx = size * 0.5;
    const cy = 475;

    const lobes = [
        { name: "central", deg: 0, len: 450, w: 4.2 },
        { name: "upper_r", deg: 28, len: 380, w: 3.6 },
        { name: "upper_l", deg: -28, len: 380, w: 3.6 },
        { name: "mid_r", deg: 56, len: 305, w: 3.0 },
        { name: "mid_l", deg: -56, len: 305, w: 3.0 },
        { name: "basal_r", deg: 84, len: 235, w: 2.6 },
        { name: "basal_l", deg: -84, len: 235, w: 2.6 }
    ];

    lobes.forEach(l => {
        const rad = l.deg * Math.PI / 180;
        const dx = Math.sin(rad);
        const dy = -Math.cos(rad);
        const tipX = cx + dx * l.len;
        const tipY = cy + dy * l.len;

        // Fine lateral pinnate veinlets branching at 42 degrees
        const numVeinlets = 7;
        for (let v = 1; v <= numVeinlets; v++) {
            const vt = v / (numVeinlets + 1);
            const vx = cx + dx * (l.len * vt);
            const vy = cy + dy * (l.len * vt);
            const vLen = (l.len * 0.20) * (1 - vt * 0.45);

            // Right lateral veinlet
            const rAng = rad + (42 * Math.PI / 180);
            ctx.strokeStyle = "rgba(190, 242, 100, 0.48)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(vx + Math.sin(rAng) * vLen, vy - Math.cos(rAng) * vLen);
            ctx.stroke();

            // Left lateral veinlet
            const lAng = rad - (42 * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(vx + Math.sin(lAng) * vLen, vy - Math.cos(lAng) * vLen);
            ctx.stroke();
        }

        // Crisp main yellow-green vein (#bef264)
        ctx.strokeStyle = "rgba(190, 242, 100, 0.94)";
        ctx.lineWidth = l.w;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
    });

    // Central petiole insert circle
    ctx.fillStyle = "#bef264";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    papayaLeafTexture = new THREE.CanvasTexture(canvas);
    papayaLeafTexture.wrapS = THREE.ClampToEdgeWrapping;
    papayaLeafTexture.wrapT = THREE.ClampToEdgeWrapping;
    return papayaLeafTexture;
}

// Procedural Feathery Tri-Pinnate Fern-like Carrot Foliage Texture (Compound Pinnae & Serrated Lobes)
let carrotFernTexture = null;
export function getCarrotFernTexture() {
    if (carrotFernTexture) return carrotFernTexture;
    const w = 256;
    const h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, w, h);
    const midX = w / 2;

    // 1. Slender central rachis (stalk) tapering from base (y = h in UV space) to apex (y = 0.08h)
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(midX, h);
    ctx.quadraticCurveTo(midX, h * 0.5, midX, h * 0.08);
    ctx.stroke();

    // 2. 9 Pairs of opposing compound pinnae branching off at ~45°
    const pinnaPairs = 9;
    for (let p = 0; p < pinnaPairs; p++) {
        const t = (p + 1) / (pinnaPairs + 1); // 0.1 to 0.9 from top to bottom
        const pinnaY = h * (1.0 - t * 0.88);
        const pinnaLen = (1.0 - Math.pow(t - 0.55, 2) * 1.8) * (w * 0.42);

        [-1, 1].forEach(dir => {
            const angle = dir * (0.65 + t * 0.2); // ~40° to 50°
            const endX = midX + Math.sin(angle) * pinnaLen;
            const endY = pinnaY - Math.cos(angle) * pinnaLen * 0.55;

            // Pinna rachis
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(midX, pinnaY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 5 pairs of tri-pinnate pinnules with feathery serrated lobes
            const pinnuleCount = 5;
            for (let k = 1; k <= pinnuleCount; k++) {
                const pk = k / (pinnuleCount + 0.5);
                const px = midX + (endX - midX) * pk;
                const py = pinnaY + (endY - pinnaY) * pk;
                const pLen = (1.0 - pk * 0.5) * (w * 0.09);

                [-1, 1].forEach(side => {
                    const leafAngle = angle + side * 0.75;
                    const lx = px + Math.cos(leafAngle) * pLen;
                    const ly = py - Math.sin(leafAngle) * pLen * 0.6;

                    ctx.fillStyle = k % 2 === 0 ? "#16a34a" : "#4ade80";
                    ctx.beginPath();
                    ctx.ellipse(lx, ly, Math.max(1.5, pLen * 0.45), Math.max(1, pLen * 0.2), leafAngle, 0, Math.PI * 2);
                    ctx.fill();

                    // Subtle serration tip highlight
                    ctx.fillStyle = "#86efac";
                    ctx.beginPath();
                    ctx.arc(lx + Math.cos(leafAngle) * pLen * 0.35, ly - Math.sin(leafAngle) * pLen * 0.2, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        });
    }

    // Terminal pinnule cluster at apex
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.ellipse(midX, h * 0.06, 5, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    carrotFernTexture = new THREE.CanvasTexture(canvas);
    carrotFernTexture.wrapS = THREE.ClampToEdgeWrapping;
    carrotFernTexture.wrapT = THREE.ClampToEdgeWrapping;
    carrotFernTexture.generateMipmaps = true;
    carrotFernTexture.minFilter = THREE.LinearMipmapLinearFilter;
    carrotFernTexture.needsUpdate = true;
    return carrotFernTexture;
}

// Procedural High-Resolution Nantes Carrot Taproot Skin Texture (Beta-Carotene Gradient & Lenticel Rings)
let carrotSkinTexture = null;
export function getCarrotSkinTexture() {
    if (carrotSkinTexture) return carrotSkinTexture;
    const w = 256;
    const h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Beta-carotene orange gradient with chlorophyll green collar at top
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, "#4d7c0f"); // Crown green shoulder
    grad.addColorStop(0.06, "#65a30d"); // Transition lime
    grad.addColorStop(0.14, "#c2410c"); // Rich reddish orange collar
    grad.addColorStop(0.40, "#ea580c"); // Vibrant Nantes carrot orange
    grad.addColorStop(0.75, "#f97316"); // Warm mid-root orange
    grad.addColorStop(0.95, "#fb923c"); // Lower taper
    grad.addColorStop(1.00, "#fdba74"); // Blunt root tip
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. 48 rows of horizontal lenticel dimples / micro-grooves
    for (let r = 0; r < 48; r++) {
        const y = (r / 48) * h;
        const count = 4 + Math.floor(Math.random() * 5);
        for (let j = 0; j < count; j++) {
            const x = Math.random() * w;
            const len = 6 + Math.random() * 14;
            // Shadow line
            ctx.fillStyle = "rgba(154, 52, 18, 0.55)";
            ctx.fillRect(x, y, len, 1.4);
            // Light highlight below
            ctx.fillStyle = "rgba(254, 215, 170, 0.40)";
            ctx.fillRect(x, y + 1.2, len, 1.0);
        }
    }

    // 3. Subtle fine longitudinal striations
    for (let i = 0; i < 60; i++) {
        const x = (i / 60) * w;
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(x, 0, 1.5, h);
    }

    carrotSkinTexture = new THREE.CanvasTexture(canvas);
    carrotSkinTexture.wrapS = THREE.RepeatWrapping;
    carrotSkinTexture.wrapT = THREE.ClampToEdgeWrapping;
    carrotSkinTexture.generateMipmaps = true;
    carrotSkinTexture.minFilter = THREE.LinearMipmapLinearFilter;
    carrotSkinTexture.needsUpdate = true;
    return carrotSkinTexture;
}

// =============================================================================
// 2. GEOMETRY MERGING UTILITY (WITH VERTEX COLOR ATTRIBUTE PRESERVATION)
// =============================================================================
function setGeometryColor(geom, hexColor) {
    if (!geom || !geom.attributes || !geom.attributes.position) return geom;
    const col = (hexColor instanceof THREE.Color) ? hexColor : new THREE.Color(hexColor);
    const count = geom.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
}

function mergeBufferGeometries(geometries) {
    if (!geometries || geometries.length === 0) return new THREE.BufferGeometry();
    let totalPositions = 0;
    let totalNormals = 0;
    let totalUvs = 0;
    let totalIndices = 0;
    let hasColors = false;

    for (const g of geometries) {
        if (!g || !g.attributes || !g.attributes.position) continue;
        totalPositions += g.attributes.position.array.length;
        if (g.attributes.normal) totalNormals += g.attributes.normal.array.length;
        if (g.attributes.uv) totalUvs += g.attributes.uv.array.length;
        if (g.attributes.color) hasColors = true;
        if (g.index) totalIndices += g.index.array.length;
    }

    if (totalPositions === 0) return new THREE.BufferGeometry();

    const mergedPos = new Float32Array(totalPositions);
    const mergedNorm = totalNormals > 0 ? new Float32Array(totalNormals) : null;
    const mergedUv = totalUvs > 0 ? new Float32Array(totalUvs) : null;
    const mergedColor = hasColors ? new Float32Array((totalPositions / 3) * 3) : null;
    const mergedIndex = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

    let posOffset = 0;
    let normOffset = 0;
    let uvOffset = 0;
    let colorOffset = 0;
    let indexOffset = 0;
    let vertexCountOffset = 0;

    for (const g of geometries) {
        if (!g || !g.attributes || !g.attributes.position) continue;
        const vCount = g.attributes.position.count;
        const pos = g.attributes.position.array;
        mergedPos.set(pos, posOffset);
        posOffset += pos.length;

        if (mergedNorm) {
            if (g.attributes.normal) {
                mergedNorm.set(g.attributes.normal.array, normOffset);
                normOffset += g.attributes.normal.array.length;
            } else {
                for (let i = 0; i < vCount; i++) {
                    mergedNorm[normOffset++] = 0;
                    mergedNorm[normOffset++] = 1;
                    mergedNorm[normOffset++] = 0;
                }
            }
        }

        if (mergedUv) {
            if (g.attributes.uv) {
                mergedUv.set(g.attributes.uv.array, uvOffset);
                uvOffset += g.attributes.uv.array.length;
            } else {
                for (let i = 0; i < vCount; i++) {
                    mergedUv[uvOffset++] = 0;
                    mergedUv[uvOffset++] = 0;
                }
            }
        }

        if (mergedColor) {
            if (g.attributes.color) {
                mergedColor.set(g.attributes.color.array, colorOffset);
            } else {
                for (let i = 0; i < vCount * 3; i++) {
                    mergedColor[colorOffset + i] = 1.0;
                }
            }
            colorOffset += vCount * 3;
        }

        if (mergedIndex) {
            if (g.index) {
                const idx = g.index.array;
                for (let i = 0; i < idx.length; i++) {
                    mergedIndex[indexOffset + i] = idx[i] + vertexCountOffset;
                }
                indexOffset += idx.length;
            } else {
                for (let i = 0; i < vCount; i++) {
                    mergedIndex[indexOffset + i] = i + vertexCountOffset;
                }
                indexOffset += vCount;
            }
        }
        vertexCountOffset += vCount;
    }

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
    if (mergedNorm) mergedGeo.setAttribute("normal", new THREE.BufferAttribute(mergedNorm, 3));
    if (mergedUv) mergedGeo.setAttribute("uv", new THREE.BufferAttribute(mergedUv, 2));
    if (mergedColor) mergedGeo.setAttribute("color", new THREE.BufferAttribute(mergedColor, 3));
    if (mergedIndex) mergedGeo.setIndex(new THREE.BufferAttribute(mergedIndex, 1));
    else mergedGeo.computeVertexNormals();

    return mergedGeo;
}

// =============================================================================
// 3. BOTANICAL PROCEDURAL GENERATORS (DISTINCT CROP MORPHOLOGIES & PBR SHADING)
// =============================================================================

/**
 * Procedural Botanical Blade Geometry with 3D Midrib Groove, Parabolic Gravity Droop & Downward Curvature
 * Used for Rice, Wheat, Maize, Jute, Onion and custom leaflets
 */
function createBotanicalBladeGeometry(options = {}) {
    const {
        length = 0.8,
        baseWidth = 0.015,
        midWidth = 0.035,
        tipWidth = 0.002,
        archX = 0.03,
        archY = 0.22,
        midribFold = 0.010, // 3D V-fold along central midrib
        wavyEdge = 0.0,     // Edge undulation
        segments = 16
    } = options;

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Natural parabolic gravity droop
        const y = Math.sin(t * Math.PI * 0.5) * length;
        const z = -Math.pow(t, 2.0) * archY;
        const xOffset = Math.sin(t * Math.PI) * archX;

        let w;
        if (t < 0.25) {
            w = THREE.MathUtils.lerp(baseWidth, midWidth, t / 0.25);
        } else {
            w = THREE.MathUtils.lerp(midWidth, tipWidth, (t - 0.25) / 0.75);
        }

        if (wavyEdge > 0.0) {
            w += Math.sin(t * Math.PI * 8.0) * wavyEdge;
        }

        // 3-point cross section: Left Margin, Central Midrib (groove), Right Margin
        const foldDepth = Math.sin(t * Math.PI) * midribFold;

        // Left vertex
        vertices.push(xOffset - w, y, z + foldDepth);
        uvs.push(0.0, t);

        // Center midrib vertex (sunken groove for venation)
        vertices.push(xOffset, y, z - foldDepth * 0.4);
        uvs.push(0.5, t);

        // Right vertex
        vertices.push(xOffset + w, y, z + foldDepth);
        uvs.push(1.0, t);

        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);

        if (i < segments) {
            const rowA = i * 3;
            const rowB = (i + 1) * 3;

            indices.push(rowA, rowA + 1, rowB + 1);
            indices.push(rowA, rowB + 1, rowB);

            indices.push(rowA + 1, rowA + 2, rowB + 2);
            indices.push(rowA + 1, rowB + 2, rowB + 1);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Backward-compatible blade helper
function createCurvedBladeGeometry(length, baseWidth, midWidth, archX, archY, segments = 16) {
    return createBotanicalBladeGeometry({
        length,
        baseWidth,
        midWidth,
        tipWidth: 0.002,
        archX,
        archY,
        midribFold: 0.008,
        segments
    });
}

/**
 * Organic Tapered Main Stem with Natural Bend
 * Completely replaces all wooden stakes / brown poles!
 */
function createOrganicMainStem(height = 0.85, baseRadius = 0.024, topRadius = 0.008, bendX = 0.03, bendZ = 0.02, segments = 14) {
    const points = [];
    const stepCount = 5;
    for (let i = 0; i <= stepCount; i++) {
        const t = i / stepCount;
        const y = t * height;
        const x = Math.sin(t * Math.PI) * bendX + Math.sin(t * Math.PI * 2.0) * (bendX * 0.35);
        const z = Math.cos(t * Math.PI * 0.8) * bendZ - bendZ;
        points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);

    const radialSegments = 7;
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const curvePoints = curve.getPoints(segments);
    const frenetFrames = curve.computeFrenetFrames(segments, false);

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentRadius = THREE.MathUtils.lerp(baseRadius, topRadius, t);
        const center = curvePoints[i];
        const normal = frenetFrames.normals[i];
        const binormal = frenetFrames.binormals[i];

        for (let j = 0; j <= radialSegments; j++) {
            const theta = (j / radialSegments) * Math.PI * 2;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            const vx = center.x + currentRadius * (cosT * normal.x + sinT * binormal.x);
            const vy = center.y + currentRadius * (cosT * normal.y + sinT * binormal.y);
            const vz = center.z + currentRadius * (cosT * normal.z + sinT * binormal.z);

            vertices.push(vx, vy, vz);
            normals.push(cosT * normal.x + sinT * binormal.x, cosT * normal.y + sinT * binormal.y, cosT * normal.z + sinT * binormal.z);
            uvs.push(j / radialSegments, t);
        }
    }

    const ring = radialSegments + 1;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * ring + j;
            const b = (i + 1) * ring + j;
            const c = (i + 1) * ring + (j + 1);
            const d = i * ring + (j + 1);

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/**
 * 5-Pointed Green Calyx Star (Sepals) on top of each tomato & eggplant
 */
function create5PointedCalyxGeometry(radius = 0.045) {
    const sepals = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const s = createBotanicalBladeGeometry({
            length: radius,
            baseWidth: 0.006,
            midWidth: 0.012,
            tipWidth: 0.002,
            archX: 0.003,
            archY: 0.008,
            midribFold: 0.003,
            segments: 8
        });
        s.rotateX(Math.PI * 0.5);
        s.rotateZ(angle);
        sepals.push(s);
    }
    return mergeBufferGeometries(sepals);
}

/**
 * Yellow 5-Petal Star Flower (Blossom)
 */
function createTomatoBlossomGeometry() {
    const petals = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const p = createBotanicalBladeGeometry({
            length: 0.024,
            baseWidth: 0.004,
            midWidth: 0.008,
            tipWidth: 0.002,
            archX: 0.002,
            archY: 0.006,
            midribFold: 0.002,
            segments: 6
        });
        p.rotateX(Math.PI * 0.5);
        p.rotateZ(angle);
        petals.push(p);
    }
    const cone = new THREE.ConeGeometry(0.005, 0.016, 6);
    cone.rotateX(-Math.PI * 0.5);
    petals.push(cone);
    return mergeBufferGeometries(petals);
}

/**
 * Compound Odd-Pinnate Leaf with Serrated/Crinkled Leaflets (Tomato & Potato)
 */
function createCompoundOddPinnateLeafGeometry(length = 0.42, spread = 0.22, isSerrated = true, isCrinkled = false) {
    const parts = [];

    const rachisCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, length * 0.35, -0.015),
        new THREE.Vector3(0, length * 0.70, -0.045),
        new THREE.Vector3(0, length, -0.080)
    ]);
    const rachis = new THREE.TubeGeometry(rachisCurve, 10, 0.005, 5, false);
    parts.push(rachis);

    const pairs = 3;
    for (let i = 0; i < pairs; i++) {
        const t = (i + 1) / (pairs + 1);
        const yPos = t * length;
        const zPos = -Math.pow(t, 1.8) * 0.07;
        const size = THREE.MathUtils.lerp(0.16, 0.24, t);
        const width = THREE.MathUtils.lerp(0.045, 0.075, t);

        const left = createBotanicalBladeGeometry({
            length: size,
            baseWidth: 0.008,
            midWidth: width,
            tipWidth: 0.002,
            archX: -0.02,
            archY: 0.035,
            midribFold: 0.006,
            wavyEdge: isSerrated ? 0.005 : (isCrinkled ? 0.004 : 0.0),
            segments: 10
        });
        left.rotateZ(0.75);
        left.rotateX(-0.15);
        left.translate(-0.012, yPos, zPos);
        parts.push(left);

        const right = createBotanicalBladeGeometry({
            length: size,
            baseWidth: 0.008,
            midWidth: width,
            tipWidth: 0.002,
            archX: 0.02,
            archY: 0.035,
            midribFold: 0.006,
            wavyEdge: isSerrated ? 0.005 : (isCrinkled ? 0.004 : 0.0),
            segments: 10
        });
        right.rotateZ(-0.75);
        right.rotateX(-0.15);
        right.translate(0.012, yPos, zPos);
        parts.push(right);
    }

    const terminal = createBotanicalBladeGeometry({
        length: 0.22,
        baseWidth: 0.009,
        midWidth: 0.078,
        tipWidth: 0.002,
        archX: 0,
        archY: 0.045,
        midribFold: 0.007,
        wavyEdge: isSerrated ? 0.005 : 0.0,
        segments: 10
    });
    terminal.rotateX(-0.25);
    terminal.translate(0, length, -0.08);
    parts.push(terminal);

    return mergeBufferGeometries(parts);
}

// Backward-compatible tomato leaf generator
function createCompoundTomatoLeafGeometry(length = 0.45, spread = 0.22) {
    return createCompoundOddPinnateLeafGeometry(length, spread, true, false);
}

/**
 * Broad Wavy-Lobed Leaf Geometry (Eggplant, Cucumber, Papaya)
 */
function createBroadWavyLeafGeometry(length = 0.35, width = 0.22, lobeCount = 5) {
    const parts = [];
    const petiole = new THREE.CylinderGeometry(0.006, 0.010, length * 0.35, 5);
    petiole.translate(0, length * 0.175, 0);
    petiole.rotateX(0.2);
    parts.push(petiole);

    const blade = createBotanicalBladeGeometry({
        length: length * 0.85,
        baseWidth: 0.02,
        midWidth: width * 0.5,
        tipWidth: 0.01,
        archX: 0.02,
        archY: 0.07,
        midribFold: 0.012,
        wavyEdge: 0.016, // Pronounced undulating lobes
        segments: 14
    });
    blade.translate(0, length * 0.30, 0);
    parts.push(blade);

    return mergeBufferGeometries(parts);
}

/**
 * Underground Botanical Root System Generator (Fibrous Crown & Branching Lateral Rootlets)
 * Strictly positioned below soil ridge surface (startY <= -0.045m, depth down to -0.32m)
 */
function createBotanicalRootSystem(depth = 0.24, spread = 0.13, rootCount = 10, startY = -0.045) {
    const roots = [];
    // Primary central taproot starting strictly underground
    const tapCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, startY, 0),
        new THREE.Vector3(0.008, startY - depth * 0.45, -0.008),
        new THREE.Vector3(-0.008, startY - depth * 0.80, 0.008),
        new THREE.Vector3(0, startY - depth, 0)
    ]);
    roots.push(new THREE.TubeGeometry(tapCurve, 8, 0.0055, 4, false));

    // Lateral spreading feeder rootlets strictly below the surface
    for (let r = 0; r < rootCount; r++) {
        const ang = (r / rootCount) * Math.PI * 2 + (r % 2) * 0.35;
        const rad = spread * (0.6 + (r % 3) * 0.22);
        const rDepth = depth * (0.4 + (r % 4) * 0.18);
        const latCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, startY - 0.008, 0),
            new THREE.Vector3(Math.cos(ang) * rad * 0.5, startY - rDepth * 0.45, Math.sin(ang) * rad * 0.5),
            new THREE.Vector3(Math.cos(ang) * rad, startY - rDepth, Math.sin(ang) * rad)
        ]);
        roots.push(new THREE.TubeGeometry(latCurve, 6, 0.0028, 3, false));
    }
    return mergeBufferGeometries(roots);
}

/**
 * Rice & Wheat Basal Tillering Clump Generator (গুছি)
 */
function createCerealTillerClusterGeometry(isRice = true) {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const roots = [];

    const tillerCount = isRice ? 12 : 9;
    const height = isRice ? 0.90 : 0.85;

    // Crown of fibrous roots penetrating into soil ridge
    const rootCount = isRice ? 16 : 12;
    for (let r = 0; r < rootCount; r++) {
        const rang = (r / rootCount) * Math.PI * 2 + Math.random() * 0.4;
        const rad = 0.035 + Math.random() * 0.06;
        const depth = 0.16 + Math.random() * 0.08;
        const rCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.01, 0),
            new THREE.Vector3(Math.cos(rang) * rad * 0.5, -depth * 0.5, Math.sin(rang) * rad * 0.5),
            new THREE.Vector3(Math.cos(rang) * rad, -depth, Math.sin(rang) * rad)
        ]);
        roots.push(new THREE.TubeGeometry(rCurve, 4, 0.0028, 3, false));
    }

    for (let i = 0; i < tillerCount; i++) {
        const angle = (i / tillerCount) * Math.PI * 2 + (Math.random() * 0.3);
        const radius = 0.02 + Math.random() * 0.03;
        const bx = Math.cos(angle) * radius;
        const bz = Math.sin(angle) * radius;

        // Slender culm/stem curving slightly outward
        const stemCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(bx, 0, bz),
            new THREE.Vector3(bx * 1.5, height * 0.4, bz * 1.5),
            new THREE.Vector3(bx * 2.0, height * 0.8, bz * 2.0),
            new THREE.Vector3(bx * 2.2, height, bz * 2.2)
        ]);
        const culm = new THREE.TubeGeometry(stemCurve, 8, 0.006, 5, false);
        stems.push(culm);

        // Arching grass blades with 3D central midrib
        const bladeCount = 2;
        for (let b = 0; b < bladeCount; b++) {
            const bladeLen = height * (0.75 + Math.random() * 0.35);
            const archY = isRice ? (0.24 + Math.random() * 0.12) : (0.16 + Math.random() * 0.08);
            const blade = createBotanicalBladeGeometry({
                length: bladeLen,
                baseWidth: 0.010,
                midWidth: isRice ? 0.024 : 0.018,
                tipWidth: 0.002,
                archX: (Math.random() - 0.5) * 0.04,
                archY: archY,
                midribFold: 0.007,
                segments: 16
            });
            const leafAngle = angle + (b - 0.5) * 0.8;
            blade.rotateY(leafAngle);
            blade.rotateX(0.35 + Math.random() * 0.25);
            blade.translate(bx, height * 0.25 + b * 0.22, bz);
            leaves.push(blade);
        }

        // Terminal Panicle (Rice) or Bearded Spike (Wheat)
        if (isRice) {
            // Drooping golden rice panicle
            const panicleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(bx * 2.2, height, bz * 2.2),
                new THREE.Vector3(bx * 2.5, height + 0.10, bz * 2.5),
                new THREE.Vector3(bx * 2.8, height + 0.06, bz * 2.8),
                new THREE.Vector3(bx * 3.1, height - 0.06, bz * 3.1)
            ]);
            const rachis = new THREE.TubeGeometry(panicleCurve, 8, 0.004, 4, false);
            fruits.push(rachis);

            for (let g = 0; g < 7; g++) {
                const gt = 0.3 + (g / 7) * 0.7;
                const pt = panicleCurve.getPoint(gt);
                const grain = new THREE.SphereGeometry(0.014, 5, 4);
                grain.scale(0.8, 1.8, 0.8);
                grain.translate(pt.x + (Math.random() - 0.5) * 0.02, pt.y - 0.02, pt.z + (Math.random() - 0.5) * 0.02);
                fruits.push(grain);
            }
        } else {
            // Bearded wheat spike with fine awns
            const spikeY = height + 0.08;
            const spike = new THREE.CylinderGeometry(0.016, 0.018, 0.16, 6);
            spike.translate(bx * 2.2, spikeY, bz * 2.2);
            fruits.push(spike);

            for (let a = 0; a < 6; a++) {
                const awn = new THREE.CylinderGeometry(0.001, 0.002, 0.14, 3);
                awn.rotateZ((a - 2.5) * 0.15);
                awn.translate(bx * 2.2 + (a - 2.5) * 0.005, spikeY + 0.12, bz * 2.2);
                fruits.push(awn);
            }
        }
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Maize / Corn Morphology Generator
 */
function createMaizeMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const flowers = [];
    const roots = [];

    const height = 2.30; // Tall segmented green stalk

    // Basal prop roots bracing the stalk into the soil
    for (let r = 0; r < 8; r++) {
        const rang = (r / 8) * Math.PI * 2;
        const pCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(rang) * 0.024, 0.08, Math.sin(rang) * 0.024),
            new THREE.Vector3(Math.cos(rang) * 0.07, 0.01, Math.sin(rang) * 0.07),
            new THREE.Vector3(Math.cos(rang) * 0.14, -0.18, Math.sin(rang) * 0.14)
        ]);
        roots.push(new THREE.TubeGeometry(pCurve, 5, 0.0048, 4, false));
    }

    // Segmented stalk with ringed nodes
    const nodeCount = 8;
    for (let i = 0; i < nodeCount; i++) {
        const segH = height / nodeCount;
        const yBase = i * segH;
        const t = i / nodeCount;
        const rBot = THREE.MathUtils.lerp(0.032, 0.016, t);
        const rTop = THREE.MathUtils.lerp(0.030, 0.014, (i + 1) / nodeCount);

        const internode = new THREE.CylinderGeometry(rTop, rBot, segH, 8);
        internode.translate(0, yBase + segH * 0.5, 0);
        stems.push(internode);

        const ring = new THREE.TorusGeometry(rTop * 1.15, 0.005, 4, 12);
        ring.rotateX(Math.PI * 0.5);
        ring.translate(0, yBase + segH, 0);
        stems.push(ring);
    }

    // Alternating broad wavy ribbon leaves
    for (let i = 1; i < nodeCount - 1; i++) {
        const angle = i % 2 === 0 ? 0 : Math.PI;
        const yPos = (i / nodeCount) * height;
        const leafLen = 0.95 + Math.random() * 0.20;

        const blade = createBotanicalBladeGeometry({
            length: leafLen,
            baseWidth: 0.040,
            midWidth: 0.095,
            tipWidth: 0.005,
            archX: 0.02,
            archY: 0.38,
            midribFold: 0.015,
            wavyEdge: 0.008,
            segments: 18
        });
        blade.rotateY(angle + (Math.random() - 0.5) * 0.2);
        blade.rotateX(0.40);
        blade.translate(0, yPos, 0);
        leaves.push(blade);
    }

    // Corn cobs wrapped in green husks with golden silk in leaf axils
    const cobHeights = [height * 0.42, height * 0.58];
    cobHeights.forEach((cy, idx) => {
        const cobAng = (idx * Math.PI) + 0.4;

        const husk = new THREE.CylinderGeometry(0.035, 0.042, 0.24, 7);
        husk.rotateZ(0.35);
        husk.rotateY(cobAng);
        husk.translate(Math.cos(cobAng) * 0.06, cy, Math.sin(cobAng) * 0.06);
        fruits.push(husk);

        for (let s = 0; s < 5; s++) {
            const silk = new THREE.CylinderGeometry(0.001, 0.003, 0.12, 3);
            silk.rotateZ(0.5 + (s * 0.05));
            silk.rotateY(cobAng + (s - 2) * 0.1);
            silk.translate(Math.cos(cobAng) * 0.14, cy + 0.11, Math.sin(cobAng) * 0.14);
            fruits.push(silk);
        }
    });

    // Terminal feathery tassel at apex
    for (let t = 0; t < 7; t++) {
        const tang = (t / 7) * Math.PI * 2;
        const branch = new THREE.CylinderGeometry(0.002, 0.005, 0.35, 4);
        branch.rotateZ(0.45);
        branch.rotateY(tang);
        branch.translate(Math.cos(tang) * 0.05, height + 0.15, Math.sin(tang) * 0.05);
        flowers.push(branch);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Tomato Morphology Generator (Organic Vine, Serrated Foliage, Multi-Stage Ripeness Fruits & Star Flowers)
 * ABSOLUTELY ZERO BROWN WOODEN STAKES!
 * Multi-Stage Ripening: 55% Ripe Crimson Red (#dc2626), 25% Half-Ripe Breaker (#f97316), 20% Unripe Green (#57962b)
 */
function createTomatoMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const calyces = [];
    const flowers = [];

    // Organic tapered main vine (height: 1.15m, NO wooden stake!)
    const mainStem = createOrganicMainStem(1.15, 0.024, 0.009, 0.04, 0.03, 16);
    stems.push(mainStem);

    // Lateral green branches
    const branchHeights = [0.26, 0.42, 0.58, 0.74, 0.90, 1.02];
    branchHeights.forEach((by, idx) => {
        const ang = (idx * 137.5) * (Math.PI / 180);
        const branchStem = createOrganicMainStem(0.40, 0.013, 0.005, 0.02, 0.015, 8);
        branchStem.rotateZ(0.68);
        branchStem.rotateY(ang);
        branchStem.translate(0, by, 0);
        stems.push(branchStem);

        const leaf = createCompoundOddPinnateLeafGeometry(0.42, 0.22, true, false);
        leaf.rotateX(0.40);
        leaf.rotateY(ang);
        leaf.translate(Math.cos(ang) * 0.16, by + 0.08, Math.sin(ang) * 0.16);
        leaves.push(leaf);
    });

    // 3-Stage Multi-Ripeness Fruit Trusses (Oblate spheroid tomatoes with 5-pointed calyces)
    const clusters = [
        { y: 0.36, count: 5, radius: 0.064 },
        { y: 0.56, count: 5, radius: 0.058 },
        { y: 0.76, count: 4, radius: 0.050 }
    ];

    clusters.forEach((c, cIdx) => {
        for (let i = 0; i < c.count; i++) {
            const ang = (i / c.count) * Math.PI * 1.5 + (cIdx * 1.25);
            const dist = 0.14 + (i * 0.02);
            const fx = Math.cos(ang) * dist;
            const fz = Math.sin(ang) * dist;
            const fy = c.y + (Math.sin(i * 1.7) * 0.03);

            const fg = new THREE.SphereGeometry(c.radius, 14, 12);
            fg.scale(1.08, 0.92, 1.08); // Oblate spheroid tomato shape
            fg.translate(fx, fy, fz);

            // Botanical Multi-Stage Ripeness Distribution:
            // 55% Ripe Crimson Red (0xdc2626), 25% Breaker Orange (0xf97316), 20% Unripe Green (0x57962b)
            let colorHex;
            if (cIdx === 0) {
                colorHex = (i < 4) ? 0xdc2626 : 0xf97316; // Lower truss: 80% ripe, 20% breaker
            } else if (cIdx === 1) {
                colorHex = (i < 2) ? 0xdc2626 : (i < 4 ? 0xf97316 : 0x57962b); // Mid truss: 40% ripe, 40% breaker, 20% green
            } else {
                colorHex = (i < 1) ? 0xf97316 : 0x57962b; // Upper truss: 25% breaker, 75% green
            }
            setGeometryColor(fg, colorHex);
            fruits.push(fg);

            const cg = create5PointedCalyxGeometry(c.radius * 0.65);
            cg.translate(fx, fy + c.radius * 0.90, fz);
            calyces.push(cg);
        }
    });

    // Yellow blossoms on the top vine
    for (let i = 0; i < 4; i++) {
        const b = createTomatoBlossomGeometry();
        b.translate(0.12 * Math.cos(i * 1.8), 0.88 + i * 0.05, 0.12 * Math.sin(i * 1.8));
        flowers.push(b);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        calyxGeom: mergeBufferGeometries(calyces),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Potato Morphology Generator (Spreading Bushy Ridge Canopy, Blossoms & Underground Tubers)
 */
function createPotatoMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];
    const tubers = [];
    const roots = [];

    const stemCount = 5;
    for (let i = 0; i < stemCount; i++) {
        const ang = (i / stemCount) * Math.PI * 2 + 0.2;
        const stem = createOrganicMainStem(0.52, 0.016, 0.007, 0.05, 0.04, 10);
        stem.rotateZ(0.35);
        stem.rotateY(ang);
        stems.push(stem);

        for (let l = 0; l < 4; l++) {
            const ly = 0.15 + l * 0.10;
            const pLeaf = createCompoundOddPinnateLeafGeometry(0.36, 0.24, false, true);
            pLeaf.rotateX(0.55);
            pLeaf.rotateY(ang + (l - 1.5) * 0.6);
            pLeaf.translate(Math.cos(ang) * 0.12, ly, Math.sin(ang) * 0.12);
            leaves.push(pLeaf);
        }
    }

    for (let f = 0; f < 5; f++) {
        const fang = (f / 5) * Math.PI * 2;
        const flower = createTomatoBlossomGeometry();
        flower.translate(Math.cos(fang) * 0.12, 0.54, Math.sin(fang) * 0.12);
        flowers.push(flower);
    }

    // Underground roots & 6-8 oval beige potato tubers inside soil ridge
    const tuberCount = 7;
    for (let t = 0; t < tuberCount; t++) {
        const tang = (t / tuberCount) * Math.PI * 2 + (t % 2) * 0.35;
        const trad = 0.08 + (t % 3) * 0.035;
        const tx = Math.cos(tang) * trad;
        const tz = Math.sin(tang) * trad;
        const ty = -0.06 - (t % 4) * 0.035;

        // Underground stolon
        const stolonCurve = new THREE.LineCurve3(new THREE.Vector3(0, -0.01, 0), new THREE.Vector3(tx, ty, tz));
        roots.push(new THREE.TubeGeometry(stolonCurve, 4, 0.0035, 4, false));

        // Oval potato tuber
        const tuber = new THREE.SphereGeometry(0.042, 9, 7);
        tuber.scale(1.35 + (t % 2) * 0.18, 0.85, 0.95);
        tuber.rotateY(tang);
        tuber.translate(tx, ty, tz);
        tubers.push(tuber);
    }

    // Fine fibrous rootlets branching deeper into soil
    for (let r = 0; r < 8; r++) {
        const rang = (r / 8) * Math.PI * 2;
        const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.02, 0),
            new THREE.Vector3(Math.cos(rang) * 0.12, -0.12, Math.sin(rang) * 0.12),
            new THREE.Vector3(Math.cos(rang) * 0.16, -0.22, Math.sin(rang) * 0.16)
        ]);
        roots.push(new THREE.TubeGeometry(rootCurve, 5, 0.0028, 3, false));
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers),
        fruitGeom: mergeBufferGeometries(tubers),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Eggplant / Brinjal Morphology Generator (Wavy Velvety Leaves & Glossy Purple Fruits)
 */
function createEggplantMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const calyces = [];
    const flowers = [];

    const height = 0.78;
    const mainStem = createOrganicMainStem(height, 0.026, 0.012, 0.03, 0.02, 12);
    stems.push(mainStem);

    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const by = 0.25 + i * 0.12;
        const branch = createOrganicMainStem(0.35, 0.014, 0.007, 0.03, 0.02, 8);
        branch.rotateZ(0.55);
        branch.rotateY(ang);
        branch.translate(0, by, 0);
        stems.push(branch);

        const leaf = createBroadWavyLeafGeometry(0.38, 0.26, 5);
        leaf.rotateX(0.35);
        leaf.rotateY(ang);
        leaf.translate(Math.cos(ang) * 0.18, by + 0.08, Math.sin(ang) * 0.18);
        leaves.push(leaf);
    }

    for (let i = 0; i < 3; i++) {
        const fang = (i / 3) * Math.PI * 2 + 0.5;
        const fx = Math.cos(fang) * 0.20;
        const fz = Math.sin(fang) * 0.20;
        const fy = 0.32 + (i * 0.08);

        const brinjal = new THREE.SphereGeometry(0.052, 12, 12);
        brinjal.scale(1.0, 2.2, 1.0);
        brinjal.translate(fx, fy - 0.08, fz);
        setGeometryColor(brinjal, (i === 1) ? 0x4c1d95 : 0x24103a);
        fruits.push(brinjal);

        const calyx = create5PointedCalyxGeometry(0.048);
        calyx.translate(fx, fy, fz);
        calyces.push(calyx);
    }

    const flower = createTomatoBlossomGeometry();
    flower.translate(0.10, 0.65, 0.10);
    flowers.push(flower);

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        calyxGeom: mergeBufferGeometries(calyces),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Curved Organic 3D Chili Fruit Geometry (Capsicum annuum)
 * Smoothly curves along a natural hanging J-curve (15°–35° bend)
 * Features an organic shoulder bulge, smooth taper, 5-6 soft longitudinal ribs, and rounded apex
 */
function createCurvedChiliFruitGeometry(length = 0.118, maxRadius = 0.0145, jCurveBend = 0.026) {
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(jCurveBend * 0.12, -length * 0.20, 0.002),
        new THREE.Vector3(jCurveBend * 0.44, -length * 0.50, 0.006),
        new THREE.Vector3(jCurveBend * 0.85, -length * 0.82, 0.012),
        new THREE.Vector3(jCurveBend * 1.08, -length, 0.016)
    ]);

    const numRings = 16;
    const radialSegs = 14;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const points = curve.getPoints(numRings);
    const frenetFrames = curve.computeFrenetFrames(numRings, false);

    function getRadiusAt(t) {
        if (t < 0.12) {
            return maxRadius * (0.75 + (t / 0.12) * 0.28);
        } else if (t < 0.45) {
            return maxRadius * (1.03 - Math.pow((t - 0.25) / 0.35, 2) * 0.08);
        } else if (t < 0.85) {
            const k = (t - 0.45) / 0.40;
            return maxRadius * (0.95 - k * 0.55);
        } else {
            const k = (t - 0.85) / 0.15;
            return maxRadius * Math.max(0.08, 0.40 * (1.0 - k * 0.85));
        }
    }

    positions.push(0, 0.002, 0);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0);

    for (let i = 0; i <= numRings; i++) {
        const t = i / numRings;
        const pt = points[i];
        const N = frenetFrames.normals[i];
        const B = frenetFrames.binormals[i];
        const baseR = getRadiusAt(t);

        for (let j = 0; j < radialSegs; j++) {
            const theta = (j / radialSegs) * Math.PI * 2;
            const rib = 1.0 + 0.065 * Math.sin(5 * theta);
            const r = baseR * rib;

            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);

            const rx = (N.x * cosT + B.x * sinT) * r;
            const ry = (N.y * cosT + B.y * sinT) * r;
            const rz = (N.z * cosT + B.z * sinT) * r;

            positions.push(pt.x + rx, pt.y + ry, pt.z + rz);
            const len = Math.hypot(rx, ry, rz) || 1;
            normals.push(rx / len, ry / len, rz / len);
            uvs.push(j / radialSegs, t);
        }
    }

    const tipPt = points[numRings];
    positions.push(tipPt.x, tipPt.y - 0.003, tipPt.z);
    normals.push(0, -1, 0);
    uvs.push(0.5, 1);

    const topCenterIdx = 0;
    const bottomCenterIdx = 1 + (numRings + 1) * radialSegs;

    for (let j = 0; j < radialSegs; j++) {
        const nextJ = (j + 1) % radialSegs;
        indices.push(topCenterIdx, 1 + nextJ, 1 + j);
    }

    for (let i = 0; i < numRings; i++) {
        const ringStart = 1 + i * radialSegs;
        const nextRingStart = 1 + (i + 1) * radialSegs;
        for (let j = 0; j < radialSegs; j++) {
            const nextJ = (j + 1) % radialSegs;
            const a = ringStart + j;
            const b = ringStart + nextJ;
            const c = nextRingStart + j;
            const d = nextRingStart + nextJ;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    const lastRingStart = 1 + numRings * radialSegs;
    for (let j = 0; j < radialSegs; j++) {
        const nextJ = (j + 1) % radialSegs;
        indices.push(bottomCenterIdx, lastRingStart + j, lastRingStart + nextJ);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
}

/**
 * Curved Green Pedicel Stalk & 5-Lobed Calyx Cap (মরিচের বোঁটা)
 * Connects the branch node (0, 0, 0) snugly to the shoulder of the chili pepper
 */
function createChiliPedicelAndCalyxGeometry(pedicelLength = 0.035, calyxRadius = 0.015) {
    const parts = [];

    // 1. Curved green pedicel stalk starting at branch node (0, 0, 0)
    const pedCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.005, -pedicelLength * 0.35, 0.002),
        new THREE.Vector3(0.008, -pedicelLength * 0.70, 0.004),
        new THREE.Vector3(0.005, -pedicelLength, 0.003)
    ]);
    const pedTube = new THREE.TubeGeometry(pedCurve, 8, 0.0028, 5, false);
    setGeometryColor(pedTube, 0x2d5a1e);
    parts.push(pedTube);

    // 2. 5-Lobed green calyx cup cupping the chili top
    const calyxBase = new THREE.CylinderGeometry(calyxRadius * 0.65, calyxRadius * 1.05, 0.011, 10);
    calyxBase.translate(0.005, -pedicelLength - 0.004, 0.003);
    setGeometryColor(calyxBase, 0x244f17);
    parts.push(calyxBase);

    // 5 pointed sepal tips cupping the shoulder
    for (let s = 0; s < 5; s++) {
        const theta = (s / 5) * Math.PI * 2;
        const sepal = new THREE.ConeGeometry(0.0040, 0.013, 4);
        sepal.rotateX(Math.PI);
        sepal.rotateZ(0.35);
        sepal.rotateY(theta);
        sepal.translate(
            0.005 + Math.cos(theta) * calyxRadius * 0.9,
            -pedicelLength - 0.010,
            0.003 + Math.sin(theta) * calyxRadius * 0.9
        );
        setGeometryColor(sepal, 0x366822);
        parts.push(sepal);
    }

    return mergeBufferGeometries(parts);
}

/**
 * Realistic Ovate-Lanceolate Chili Leaf with Central Midrib Crease & V-Fold
 */
function createChiliLeafGeometry(length = 0.145, baseWidth = 0.006, midWidth = 0.050) {
    const segments = 10;
    const positions = [];
    const uvs = [];
    const indices = [];

    const petioleLen = 0.022;

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = Math.sin(t * Math.PI * 0.85) * length * 0.26 - (t > 0.65 ? Math.pow(t - 0.65, 2) * length * 0.60 : 0);
        const z = petioleLen + t * length;

        let w = (t < 0.38)
            ? baseWidth + (midWidth - baseWidth) * Math.sin((t / 0.38) * Math.PI * 0.5)
            : midWidth * Math.pow(1.0 - (t - 0.38) / 0.62, 0.75);

        const vFold = Math.sin(t * Math.PI) * 0.005;

        positions.push(-w * 0.5, y + vFold, z);
        positions.push(w * 0.5, y + vFold, z);

        uvs.push(0, t);
        uvs.push(1, t);

        if (i < segments) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
}

/**
 * 5-Petaled White Nodding Star Flower (Chili Blossom with Yellow Anthers)
 */
function createChiliBlossomGeometry() {
    const parts = [];
    const stalkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.003, -0.012, 0.003),
        new THREE.Vector3(0.004, -0.022, 0.006)
    ]);
    const stalk = new THREE.TubeGeometry(stalkCurve, 4, 0.0016, 4, false);
    setGeometryColor(stalk, 0x2d5a1e);
    parts.push(stalk);

    for (let p = 0; p < 5; p++) {
        const theta = (p / 5) * Math.PI * 2;
        const petal = new THREE.ConeGeometry(0.0045, 0.016, 4);
        petal.rotateX(1.4);
        petal.rotateZ(theta);
        petal.translate(0.004, -0.024, 0.006);
        setGeometryColor(petal, 0xf8fafc);
        parts.push(petal);
    }

    const anthers = new THREE.SphereGeometry(0.0035, 6, 6);
    anthers.translate(0.004, -0.026, 0.006);
    setGeometryColor(anthers, 0xfacc15);
    parts.push(anthers);

    return mergeBufferGeometries(parts);
}

/**
 * Botanically Accurate Chili Morphology Generator (Capsicum annuum)
 * - Sunk Main Stem at y = -0.06m (Zero floating gaps)
 * - Seamless Dichotomous Y-Forking Branches (Shared node coordinates)
 * - Pendant Curved Chili Peppers with Green Calyx Caps & Pedicels
 * - Multi-stage Harvest Crimson, Breaker Orange-Red & Fresh Glossy Green PBR Colors
 * - Sculpted Ovate-Lanceolate Foliage & White Nodding Blossoms
 * - Subterranean Root System starting at y = -0.06m
 */
function createChiliMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const calyces = [];
    const flowers = [];

    // 1. Continuous Main Stem: Starts at y = -0.06m (sunk into soil) up to primary fork node (0, 0.22, 0)
    const mainStemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.06, 0),
        new THREE.Vector3(0.004, 0.04, -0.002),
        new THREE.Vector3(-0.003, 0.14, 0.003),
        new THREE.Vector3(0, 0.22, 0)
    ]);
    const mainStem = new THREE.TubeGeometry(mainStemCurve, 10, 0.015, 6, false);
    setGeometryColor(mainStem, 0x2f5e24);
    stems.push(mainStem);

    // Primary Y-Fork Node
    const N0 = new THREE.Vector3(0, 0.22, 0);

    // 2. Primary Forking Branches from N0
    const primaryBranches = [
        { end: new THREE.Vector3(-0.12, 0.38, 0.05), mid: new THREE.Vector3(-0.06, 0.30, 0.02) },
        { end: new THREE.Vector3(0.13, 0.39, -0.04), mid: new THREE.Vector3(0.06, 0.31, -0.02) },
        { end: new THREE.Vector3(0.02, 0.41, 0.12), mid: new THREE.Vector3(0.01, 0.32, 0.06) },
        { end: new THREE.Vector3(-0.02, 0.43, -0.11), mid: new THREE.Vector3(-0.01, 0.33, -0.05) }
    ];

    primaryBranches.forEach(b => {
        const bCurve = new THREE.CatmullRomCurve3([N0, b.mid, b.end]);
        const branchTube = new THREE.TubeGeometry(bCurve, 8, 0.009, 5, false);
        setGeometryColor(branchTube, 0x2f5e24);
        stems.push(branchTube);
    });

    // 3. Secondary Branchlets extending to canopy
    const secondaryBranches = [
        { start: primaryBranches[0].end, end: new THREE.Vector3(-0.19, 0.52, 0.11), mid: new THREE.Vector3(-0.16, 0.45, 0.08) },
        { start: primaryBranches[0].end, end: new THREE.Vector3(-0.14, 0.55, -0.05), mid: new THREE.Vector3(-0.13, 0.46, 0.00) },
        { start: primaryBranches[1].end, end: new THREE.Vector3(0.20, 0.53, -0.09), mid: new THREE.Vector3(0.17, 0.46, -0.06) },
        { start: primaryBranches[1].end, end: new THREE.Vector3(0.16, 0.56, 0.08), mid: new THREE.Vector3(0.15, 0.47, 0.02) },
        { start: primaryBranches[2].end, end: new THREE.Vector3(0.04, 0.58, 0.21), mid: new THREE.Vector3(0.03, 0.50, 0.16) },
        { start: primaryBranches[2].end, end: new THREE.Vector3(-0.05, 0.56, 0.17), mid: new THREE.Vector3(-0.02, 0.48, 0.14) },
        { start: primaryBranches[3].end, end: new THREE.Vector3(0.00, 0.59, -0.18), mid: new THREE.Vector3(-0.01, 0.51, -0.14) },
        { start: primaryBranches[3].end, end: new THREE.Vector3(-0.06, 0.57, -0.14), mid: new THREE.Vector3(-0.04, 0.50, -0.12) }
    ];

    secondaryBranches.forEach(sb => {
        const sbCurve = new THREE.CatmullRomCurve3([sb.start, sb.mid, sb.end]);
        const sbTube = new THREE.TubeGeometry(sbCurve, 6, 0.0065, 4, false);
        setGeometryColor(sbTube, 0x366822);
        stems.push(sbTube);
    });

    // 4. Sculpted Ovate-Lanceolate Leaves attached at branch nodes
    const leafNodes = [
        { pos: new THREE.Vector3(-0.06, 0.30, 0.02), rotY: -0.6, rotX: 0.35, s: 0.95 },
        { pos: new THREE.Vector3(0.06, 0.31, -0.02), rotY: 0.7, rotX: 0.38, s: 0.95 },
        { pos: new THREE.Vector3(0.01, 0.32, 0.06), rotY: 1.8, rotX: 0.40, s: 0.90 },
        { pos: new THREE.Vector3(-0.01, 0.33, -0.05), rotY: -2.2, rotX: 0.36, s: 0.90 },
        { pos: primaryBranches[0].end, rotY: -0.8, rotX: 0.45, s: 1.05 },
        { pos: primaryBranches[1].end, rotY: 0.9, rotX: 0.42, s: 1.05 },
        { pos: primaryBranches[2].end, rotY: 2.1, rotX: 0.44, s: 1.00 },
        { pos: primaryBranches[3].end, rotY: -1.9, rotX: 0.40, s: 1.00 },
        { pos: secondaryBranches[0].mid, rotY: -0.4, rotX: 0.50, s: 0.90 },
        { pos: secondaryBranches[1].mid, rotY: -1.2, rotX: 0.48, s: 0.90 },
        { pos: secondaryBranches[2].mid, rotY: 0.5, rotX: 0.52, s: 0.90 },
        { pos: secondaryBranches[3].mid, rotY: 1.4, rotX: 0.46, s: 0.90 },
        { pos: secondaryBranches[4].mid, rotY: 2.4, rotX: 0.48, s: 0.85 },
        { pos: secondaryBranches[5].mid, rotY: -2.6, rotX: 0.50, s: 0.85 },
        { pos: secondaryBranches[6].mid, rotY: -1.7, rotX: 0.46, s: 0.85 },
        { pos: secondaryBranches[7].mid, rotY: 3.0, rotX: 0.48, s: 0.85 },
        { pos: secondaryBranches[0].end, rotY: -0.3, rotX: 0.55, s: 0.80 },
        { pos: secondaryBranches[2].end, rotY: 0.6, rotX: 0.55, s: 0.80 },
        { pos: secondaryBranches[4].end, rotY: 2.2, rotX: 0.52, s: 0.78 },
        { pos: secondaryBranches[6].end, rotY: -2.0, rotX: 0.54, s: 0.78 }
    ];

    leafNodes.forEach(ln => {
        const leaf = createChiliLeafGeometry(0.145 * ln.s, 0.006 * ln.s, 0.050 * ln.s);
        leaf.rotateX(ln.rotX);
        leaf.rotateY(ln.rotY);
        leaf.translate(ln.pos.x, ln.pos.y, ln.pos.z);
        setGeometryColor(leaf, 0x25591c);
        leaves.push(leaf);
    });

    // 5. Pendant Curved Chili Fruits + Calyx Caps & Pedicels (6 Fruit Nodes)
    const fruitNodes = [
        { pos: primaryBranches[0].end, color: 0xb50e16, len: 0.125, bend: 0.028, rotY: -0.5 },
        { pos: primaryBranches[1].end, color: 0xe01a22, len: 0.120, bend: 0.026, rotY: 0.6 },
        { pos: primaryBranches[2].end, color: 0xd94e1f, len: 0.115, bend: 0.024, rotY: 1.9 },
        { pos: primaryBranches[3].end, color: 0x855b1e, len: 0.110, bend: 0.025, rotY: -2.1 },
        { pos: secondaryBranches[1].mid, color: 0x387d22, len: 0.098, bend: 0.022, rotY: -1.3 },
        { pos: secondaryBranches[3].mid, color: 0x1f5c18, len: 0.095, bend: 0.020, rotY: 1.2 }
    ];

    fruitNodes.forEach(fn => {
        const pedLen = 0.034;
        const calyx = createChiliPedicelAndCalyxGeometry(pedLen, 0.015);
        calyx.rotateY(fn.rotY);
        calyx.translate(fn.pos.x, fn.pos.y, fn.pos.z);
        calyces.push(calyx);

        const fruit = createCurvedChiliFruitGeometry(fn.len, 0.0145, fn.bend);
        fruit.rotateY(fn.rotY);
        fruit.translate(fn.pos.x + Math.sin(fn.rotY) * 0.005, fn.pos.y - pedLen, fn.pos.z + Math.cos(fn.rotY) * 0.003);
        setGeometryColor(fruit, fn.color);
        fruits.push(fruit);
    });

    // 6. White Nodding Blossoms at Upper Nodes (4 Flower Nodes)
    const flowerNodes = [
        secondaryBranches[0].mid,
        secondaryBranches[2].mid,
        secondaryBranches[4].mid,
        secondaryBranches[6].mid
    ];
    flowerNodes.forEach(fPos => {
        const blossom = createChiliBlossomGeometry();
        blossom.translate(fPos.x, fPos.y, fPos.z);
        flowers.push(blossom);
    });

    // 7. Subterranean Root System starting at y = -0.06m (Meeting the sunk stem base)
    const roots = [createBotanicalRootSystem(0.24, 0.14, 10, -0.06)];

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        calyxGeom: mergeBufferGeometries(calyces),
        flowerGeom: mergeBufferGeometries(flowers),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Mustard Morphology Generator (Golden Canopy of 4-Petal Flowers & Siliques)
 */
function createMustardMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];

    const height = 0.98;
    const mainStem = createOrganicMainStem(height, 0.016, 0.005, 0.02, 0.02, 12);
    stems.push(mainStem);

    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const ly = 0.15 + i * 0.08;
        const leaf = createBotanicalBladeGeometry({
            length: 0.28,
            baseWidth: 0.015,
            midWidth: 0.065,
            tipWidth: 0.010,
            archX: 0.02,
            archY: 0.06,
            midribFold: 0.008,
            wavyEdge: 0.008,
            segments: 12
        });
        leaf.rotateX(0.5);
        leaf.rotateY(ang);
        leaf.translate(0, ly, 0);
        leaves.push(leaf);
    }

    // Dense vibrant yellow 4-petal flower clusters at apex (সরিষা ফুল)
    for (let f = 0; f < 18; f++) {
        const ang = f * 1.6;
        const dist = 0.03 + (f % 4) * 0.04;
        const fy = height - 0.22 + (f / 18) * 0.28;

        for (let p = 0; p < 4; p++) {
            const petal = new THREE.PlaneGeometry(0.024, 0.018);
            petal.rotateZ(p * (Math.PI * 0.5));
            petal.translate(Math.cos(ang) * dist, fy, Math.sin(ang) * dist);
            flowers.push(petal);
        }
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Onion Morphology Generator (Tubular Bluish-Green Leaves, Surface Bulb & Umbel)
 */
function createOnionMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const flowers = [];
    const roots = [];

    // Plump purple-white onion bulb half-buried in ridge
    const bulb = new THREE.SphereGeometry(0.062, 14, 12);
    bulb.scale(1.22, 0.95, 1.22);
    bulb.translate(0, 0.012, 0); // half above, half below ridge surface
    fruits.push(bulb);

    // Dense cluster of white fibrous roots extending down into soil
    const rootCount = 14;
    for (let r = 0; r < rootCount; r++) {
        const rang = (r / rootCount) * Math.PI * 2 + Math.random() * 0.35;
        const rad = 0.015 + Math.random() * 0.035;
        const rx = Math.cos(rang) * rad;
        const rz = Math.sin(rang) * rad;
        const rlen = 0.14 + Math.random() * 0.09;
        const rCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(rx, -0.03, rz),
            new THREE.Vector3(rx * 1.6, -0.03 - rlen * 0.5, rz * 1.6),
            new THREE.Vector3(rx * 2.2, -0.03 - rlen, rz * 2.2)
        ]);
        roots.push(new THREE.TubeGeometry(rCurve, 4, 0.0022, 3, false));
    }

    // Hollow tubular upright cylindrical leaves tapering to points
    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
        const ang = (i / leafCount) * Math.PI * 2 + (Math.random() * 0.3);
        const tubeLen = 0.48 + Math.random() * 0.15;
        const tube = new THREE.CylinderGeometry(0.002, 0.012, tubeLen, 6);
        tube.rotateZ(0.18 + Math.random() * 0.12);
        tube.rotateY(ang);
        tube.translate(Math.cos(ang) * 0.02, tubeLen * 0.48 + 0.04, Math.sin(ang) * 0.02);
        leaves.push(tube);
    }

    const scape = new THREE.CylinderGeometry(0.006, 0.010, 0.65, 6);
    scape.translate(0, 0.34, 0);
    stems.push(scape);

    const umbel = new THREE.SphereGeometry(0.042, 10, 8);
    umbel.translate(0, 0.68, 0);
    flowers.push(umbel);

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Ensures geometry base sits firmly at local y = 0
 */
function ensureBaseAtYZero(geometry) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position) return geometry;
    geometry.computeBoundingBox();
    if (geometry.boundingBox && geometry.boundingBox.min.y < -0.005) {
        geometry.translate(0, -geometry.boundingBox.min.y, 0);
    }
    return geometry;
}

/**
 * Jute Morphology Generator (Tall Straight Fibrous Green Stalk & Upper Canopy Leaves)
 */
function createJuteMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];

    const height = 2.55;
    // Tall slender upright fibrous green stalk, base at local y = 0
    const stalk = new THREE.CylinderGeometry(0.016, 0.030, height, 8);
    stalk.translate(0, height * 0.5, 0);
    stems.push(stalk);

    // Lush lance-shaped serrated leaves clustered along upper 40% of stalk
    const leafCount = 16;
    for (let i = 0; i < leafCount; i++) {
        const ang = (i * 137.5) * (Math.PI / 180);
        const ly = height * 0.58 + (i / leafCount) * (height * 0.40);

        const leaf = createBotanicalBladeGeometry({
            length: 0.36,
            baseWidth: 0.014,
            midWidth: 0.062,
            tipWidth: 0.004,
            archX: 0.02,
            archY: 0.07,
            midribFold: 0.008,
            wavyEdge: 0.005,
            segments: 12
        });
        leaf.rotateX(0.42);
        leaf.rotateY(ang);
        leaf.translate(0, ly, 0);
        leaves.push(leaf);
    }

    // Small yellow axillary blossoms
    for (let f = 0; f < 5; f++) {
        const fang = f * 1.4;
        const fl = createTomatoBlossomGeometry();
        fl.scale(0.5, 0.5, 0.5); // BufferGeometry scale fix
        fl.translate(0.04 * Math.cos(fang), height * 0.75 + f * 0.05, 0.04 * Math.sin(fang));
        flowers.push(fl);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Pyriform (Pear-Shaped) 5-Grooved Papaya Fruit Geometry (পেঁপে ফল)
 * Modeled with narrowed stalk neck, plump belly, blossom tip, and 5 longitudinal ridges
 */
function createPyriformPapayaFruitGeometry(length = 0.25, maxRadius = 0.082) {
    const points = [];
    const segmentsY = 24;
    for (let i = 0; i <= segmentsY; i++) {
        const t = i / segmentsY;
        const y = (t - 0.5) * length;
        let r;
        if (t < 0.08) {
            // blossom end pointed tip
            r = maxRadius * 0.22 * Math.sin((t / 0.08) * (Math.PI * 0.5));
        } else if (t < 0.45) {
            // lower plump belly
            const p = (t - 0.08) / 0.37;
            r = maxRadius * (0.22 + 0.78 * Math.sin(p * Math.PI * 0.5));
        } else if (t < 0.82) {
            // gentle taper toward neck
            const p = (t - 0.45) / 0.37;
            r = maxRadius * (1.00 - 0.45 * Math.pow(p, 1.2));
        } else {
            // narrowed neck near stem stalk
            const p = (t - 0.82) / 0.18;
            r = maxRadius * (0.55 - 0.25 * p);
        }
        points.push(new THREE.Vector2(Math.max(0.002, r), y));
    }

    const lathe = new THREE.LatheGeometry(points, 24);
    const pos = lathe.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const theta = Math.atan2(z, x);

        // 5 subtle longitudinal melon-like ridges (r *= 1 + 0.045 * Math.cos(5 * theta))
        const ridgeMod = 1.0 + 0.045 * Math.cos(5 * theta);
        pos.setX(i, x * ridgeMod);
        pos.setZ(i, z * ridgeMod);
    }
    lathe.computeVertexNormals();

    // Short curved peduncle stalk connecting fruit neck to trunk
    const stalkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, length * 0.5, 0),
        new THREE.Vector3(0.012, length * 0.5 + 0.018, 0.006),
        new THREE.Vector3(0.026, length * 0.5 + 0.038, 0.014)
    ]);
    const stalk = new THREE.TubeGeometry(stalkCurve, 6, Math.max(0.006, maxRadius * 0.14), 6, false);
    setGeometryColor(stalk, 0x4d6b2c);

    return mergeBufferGeometries([lathe, stalk]);
}

/**
 * Ridge-Aware Longitudinal Vertex Coloration for Papaya Fruits
 */
function colorPyriformFruitVertices(geom, baseHex, darkHex, highlightHex) {
    if (!geom || !geom.attributes || !geom.attributes.position) return geom;
    const pos = geom.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    const cBase = (baseHex instanceof THREE.Color) ? baseHex : new THREE.Color(baseHex);
    const cDark = (darkHex instanceof THREE.Color) ? darkHex : new THREE.Color(darkHex);
    const cHigh = (highlightHex instanceof THREE.Color) ? highlightHex : new THREE.Color(highlightHex);

    const tempCol = new THREE.Color();

    for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const theta = Math.atan2(z, x);

        // Highlight along longitudinal ridges (5 lobes)
        const ridgeVal = Math.cos(5 * theta); // -1 to +1
        const ridgeFactor = 0.5 + 0.5 * ridgeVal; // 0 to 1

        if (ridgeFactor > 0.60) {
            tempCol.copy(cBase).lerp(cHigh, (ridgeFactor - 0.60) / 0.40);
        } else {
            tempCol.copy(cDark).lerp(cBase, ridgeFactor / 0.60);
        }

        colors[i * 3] = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
}

/**
 * Deeply 7-Lobed Palmate Papaya Leaf Blade (পেঁপে পাতার ফলক)
 * Thin single-surface 3D leaf blade with dome curvature (zero thick bevels or white edge shading artifacts)
 */
function createPapayaPalmateBladeGeometry(size = 0.58) {
    const profile = [
        // Basal Right Lobe
        { dist: size * 0.08, deg: 105 },
        { dist: size * 0.32, deg: 92 },
        { dist: size * 0.28, deg: 88 },
        { dist: size * 0.52, deg: 84 },
        { dist: size * 0.35, deg: 80 },
        { dist: size * 0.30, deg: 76 },
        // Sinus 1
        { dist: size * 0.18, deg: 70 },
        // Mid Right Lobe
        { dist: size * 0.45, deg: 64 },
        { dist: size * 0.38, deg: 60 },
        { dist: size * 0.70, deg: 56 },
        { dist: size * 0.48, deg: 52 },
        { dist: size * 0.40, deg: 48 },
        // Sinus 2
        { dist: size * 0.22, deg: 42 },
        // Upper Right Lobe
        { dist: size * 0.55, deg: 35 },
        { dist: size * 0.48, deg: 32 },
        { dist: size * 0.85, deg: 28 },
        { dist: size * 0.60, deg: 24 },
        { dist: size * 0.52, deg: 20 },
        // Sinus 3
        { dist: size * 0.26, deg: 14 },
        // Central Lobe
        { dist: size * 0.65, deg: 8 },
        { dist: size * 0.58, deg: 5 },
        { dist: size * 1.00, deg: 0 },
        { dist: size * 0.58, deg: -5 },
        { dist: size * 0.65, deg: -8 },
        // Sinus 4
        { dist: size * 0.26, deg: -14 },
        // Upper Left Lobe
        { dist: size * 0.52, deg: -20 },
        { dist: size * 0.60, deg: -24 },
        { dist: size * 0.85, deg: -28 },
        { dist: size * 0.48, deg: -32 },
        { dist: size * 0.55, deg: -35 },
        // Sinus 5
        { dist: size * 0.22, deg: -42 },
        // Mid Left Lobe
        { dist: size * 0.40, deg: -48 },
        { dist: size * 0.48, deg: -52 },
        { dist: size * 0.70, deg: -56 },
        { dist: size * 0.38, deg: -60 },
        { dist: size * 0.45, deg: -64 },
        // Sinus 6
        { dist: size * 0.18, deg: -70 },
        // Basal Left Lobe
        { dist: size * 0.30, deg: -76 },
        { dist: size * 0.35, deg: -80 },
        { dist: size * 0.52, deg: -84 },
        { dist: size * 0.28, deg: -88 },
        { dist: size * 0.32, deg: -92 },
        { dist: size * 0.08, deg: -105 }
    ];

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    profile.forEach(p => {
        const rad = p.deg * Math.PI / 180;
        const x = p.dist * Math.sin(rad);
        const y = p.dist * Math.cos(rad);
        shape.lineTo(x, y);
    });
    shape.closePath();

    const geom = new THREE.ShapeGeometry(shape, 12);
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;
    const count = pos.count;

    const minX = -size * 0.52;
    const maxX = size * 0.52;
    const minY = -size * 0.08;
    const maxY = size * 1.02;

    for (let i = 0; i < count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const dist = Math.sqrt(vx * vx + vy * vy);
        const norm = dist / size;

        // Subtle 3D spherical dome curvature (leaves cup gently downward toward tips)
        pos.setZ(i, -0.045 * (norm * norm));

        // Precision UV coordinates matching getPapayaLeafTexture
        const u = (vx - minX) / (maxX - minX);
        const v = (vy - minY) / (maxY - minY);
        uv.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
    geom.computeVertexNormals();
    return geom;
}

/**
 * Botanically Authentic 3D Papaya Tree Morphology Generator (Carica papaya - পেঁপে গাছ)
 * 1. Organic tapered trunk planted firmly at local y = 0
 * 2. Capped at apex (y = 2.12m) with 4 emerging young shoot leaves
 * 3. 24 hollow petioles in 3D Fibonacci spiral (golden angle 2.39996 rad) across 3 tiers (upper upward, middle S-curve, lower drooping)
 * 4. 24 thin deeply 7-lobed palmate leaf blades with 3D dome curvature and yellow-green veins (#bef264)
 * 5. Cauliflorous spiral column of 16 pyriform 5-grooved papaya fruits (y = 1.16m to 1.68m) in 3 ripeness tiers + 6 white flowers
 * 6. Buried root system sunk firmly into the soil ridge
 */
function createPapayaMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const flowers = [];

    const height = 2.15;
    const baseSink = 0.05; // Sink 0.05m into soil ridge so root collar is buried and roots never float

    // Part A: Tapered Trunk (CylinderGeometry(0.065, 0.145, 2.15, 20, 12))
    const trunk = new THREE.CylinderGeometry(0.065, 0.145, height, 20, 12);
    trunk.translate(0, height * 0.5 - baseSink, 0);
    stems.push(trunk);

    // Trunk Apex shoot cluster: 4 upward-pointing emerging young shoot leaves at y = 2.12m
    for (let s = 0; s < 4; s++) {
        const shootAng = s * (Math.PI * 0.5) + 0.35;
        const shootBlade = createPapayaPalmateBladeGeometry(0.20);
        // Elevate upward +48 deg
        shootBlade.rotateX(-Math.PI * 0.5 + (48 * Math.PI / 180));
        shootBlade.rotateY(Math.PI * 0.5 - shootAng);
        shootBlade.translate(Math.cos(shootAng) * 0.025, height - baseSink - 0.02, Math.sin(shootAng) * 0.025);
        leaves.push(shootBlade);
    }

    // Part B & C: Multi-Tiered Fibonacci Spiral Petioles & 7-Lobed Palmate Leaf Blades
    // 24 hollow stalks from y = 1.62m to 2.10m (golden angle = 2.39996 rad)
    const petioleCount = 24;
    for (let i = 0; i < petioleCount; i++) {
        const t = i / (petioleCount - 1); // 0 at crown bottom (y = 1.62), 1 at crown top (y = 2.10)
        const angle = i * 2.39996;
        const py = 1.62 + t * 0.48 - baseSink;
        const trunkR = THREE.MathUtils.lerp(0.145, 0.065, (py + baseSink) / height);

        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);
        const startX = dirX * (trunkR * 0.95);
        const startZ = dirZ * (trunkR * 0.95);
        const startY = py;

        let curvePoints = [];
        let petioleLen = 0.75;
        let petioleRad = THREE.MathUtils.lerp(0.014, 0.009, t);
        let bladePitch = 0;
        let bladeSize = 0.58;

        if (t > 0.70) {
            // Tier 1: Upper Young Tier (t > 0.7) - Petiole length 0.38m–0.52m, angling UPWARD (+25° to +48°)
            const normT = (t - 0.70) / 0.30;
            petioleLen = THREE.MathUtils.lerp(0.40, 0.52, normT);
            const elevDeg = THREE.MathUtils.lerp(25, 48, normT);
            const elevRad = elevDeg * Math.PI / 180;
            bladePitch = elevRad;
            bladeSize = THREE.MathUtils.lerp(0.46, 0.52, normT);

            const p0 = new THREE.Vector3(startX, startY, startZ);
            const p1 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.50),
                startY + Math.sin(elevRad) * (petioleLen * 0.50),
                startZ + dirZ * (petioleLen * 0.50)
            );
            const p2 = new THREE.Vector3(
                startX + dirX * Math.cos(elevRad) * petioleLen,
                startY + Math.sin(elevRad) * petioleLen,
                startZ + dirZ * Math.cos(elevRad) * petioleLen
            );
            curvePoints = [p0, p1, p2];
        } else if (t >= 0.30) {
            // Tier 2: Middle Mature Tier (0.3 <= t <= 0.7) - Petiole length 0.65m–0.85m, extending OUTWARD & SLIGHTLY UP with S-curve (+25° to +5°)
            const normT = (t - 0.30) / 0.40;
            petioleLen = THREE.MathUtils.lerp(0.65, 0.85, normT);
            bladePitch = 5 * Math.PI / 180;
            bladeSize = THREE.MathUtils.lerp(0.60, 0.68, Math.sin(normT * Math.PI));

            const p0 = new THREE.Vector3(startX, startY, startZ);
            const p1 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.32),
                startY + petioleLen * 0.16,
                startZ + dirZ * (petioleLen * 0.32)
            );
            const p2 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.68),
                startY + petioleLen * 0.22,
                startZ + dirZ * (petioleLen * 0.68)
            );
            const p3 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.98),
                startY + petioleLen * 0.18,
                startZ + dirZ * (petioleLen * 0.98)
            );
            curvePoints = [p0, p1, p2, p3];
        } else {
            // Tier 3: Lower Older Tier (t < 0.3) - Petiole length 0.75m–0.90m, arching outward and gently drooping to -12° at tip
            const normT = t / 0.30;
            petioleLen = THREE.MathUtils.lerp(0.76, 0.90, 1 - normT);
            bladePitch = -12 * Math.PI / 180;
            bladeSize = THREE.MathUtils.lerp(0.56, 0.64, normT);

            const p0 = new THREE.Vector3(startX, startY, startZ);
            const p1 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.30),
                startY + petioleLen * 0.10,
                startZ + dirZ * (petioleLen * 0.30)
            );
            const p2 = new THREE.Vector3(
                startX + dirX * (petioleLen * 0.65),
                startY + petioleLen * 0.07,
                startZ + dirZ * (petioleLen * 0.65)
            );
            const p3 = new THREE.Vector3(
                startX + dirX * (petioleLen * 1.00),
                startY - petioleLen * 0.10,
                startZ + dirZ * (petioleLen * 1.00)
            );
            curvePoints = [p0, p1, p2, p3];
        }

        const petioleCurve = new THREE.CatmullRomCurve3(curvePoints);
        const petioleGeom = new THREE.TubeGeometry(petioleCurve, 10, petioleRad, 6, false);
        setGeometryColor(petioleGeom, 0x65a30d);
        stems.push(petioleGeom);

        // Attach thin 3D 7-lobed palmate leaf blade at petiole tip with dorsal surface facing skyward
        const tip = curvePoints[curvePoints.length - 1];
        const blade = createPapayaPalmateBladeGeometry(bladeSize);
        blade.rotateX(-Math.PI * 0.5 + bladePitch);
        blade.rotateY(Math.PI * 0.5 - angle);
        blade.translate(tip.x, tip.y, tip.z);
        leaves.push(blade);
    }

    // Part D: Cauliflorous Column of 16 Pyriform Papaya Fruits (y = 1.15m to 1.68m) in 3 Ripeness Tiers
    const fruitTiers = [
        { yMin: 1.16, yMax: 1.32, count: 5, colorHex: 0xf59e0b, length: 0.26, radius: 0.082, pitch: 0.36, tier: "ripe" },
        { yMin: 1.34, yMax: 1.50, count: 5, colorHex: 0x84cc16, length: 0.24, radius: 0.076, pitch: 0.30, tier: "turning" },
        { yMin: 1.52, yMax: 1.68, count: 6, colorHex: 0x15803d, length: 0.21, radius: 0.068, pitch: 0.24, tier: "unripe" }
    ];

    fruitTiers.forEach((tier, tIdx) => {
        for (let i = 0; i < tier.count; i++) {
            const fy = tier.yMin + ((i + 0.5) / tier.count) * (tier.yMax - tier.yMin) - baseSink;
            const ang = (tIdx * 2.1) + ((i / tier.count) * Math.PI * 2) + ((i % 2) * 0.22);
            const trunkR = THREE.MathUtils.lerp(0.145, 0.065, (fy + baseSink) / height);
            const dist = trunkR + tier.radius * 0.38;

            const fx = Math.cos(ang) * dist;
            const fz = Math.sin(ang) * dist;

            const fruit = createPyriformPapayaFruitGeometry(tier.length, tier.radius);
            // Fruit hangs blossom tip downward and outward
            fruit.rotateX(Math.PI + tier.pitch);
            fruit.rotateY(Math.PI * 0.5 - ang);
            fruit.translate(fx, fy, fz);

            // Realistic vertex coloration based on ripeness tier
            if (tier.tier === "ripe") {
                // Golden amber-orange #f59e0b to #ea580c
                colorPyriformFruitVertices(fruit, 0xf59e0b, 0xea580c, 0xfbbf24);
            } else if (tier.tier === "turning") {
                // Olive-green with longitudinal yellow-orange turning streaks #84cc16 / #eab308
                colorPyriformFruitVertices(fruit, 0x84cc16, 0x4d7c0f, 0xeab308);
            } else {
                // Glossy deep papaya green #15803d / #166534
                colorPyriformFruitVertices(fruit, 0x15803d, 0x166534, 0x14532d);
            }
            fruits.push(fruit);
        }
    });

    // 6 Tiny Cream-White 5-Petal Papaya Flowers at y = 1.70m
    for (let f = 0; f < 6; f++) {
        const fAng = (f / 6) * Math.PI * 2 + 0.35;
        const fy = 1.70 + (f % 2) * 0.025 - baseSink;
        const trunkR = THREE.MathUtils.lerp(0.145, 0.065, (fy + baseSink) / height);
        const fDist = trunkR + 0.015;

        const flower = createCucumberBlossomGeometry(0.026);
        flower.rotateX(Math.PI * 0.45);
        flower.rotateY(Math.PI * 0.5 - fAng);
        flower.translate(Math.cos(fAng) * fDist, fy, Math.sin(fAng) * fDist);
        setGeometryColor(flower, 0xfef9c3);
        flowers.push(flower);
    }

    const rootGeom = createBotanicalRootSystem(0.35, 0.22, 12);
    rootGeom.translate(0, -baseSink, 0);

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers),
        rootGeom
    };
}

/**
 * Organic Tapered & Curved 3D Cucumber Mesh Generator (LatheGeometry with Peduncle Stalk)
 */
function createRealisticCucumberGeometry(length = 0.24, radius = 0.032, curveAmount = 0.016) {
    const points = [];
    const segmentsY = 22;
    for (let i = 0; i <= segmentsY; i++) {
        const t = i / segmentsY; // 0 at blossom tip (y = -length/2), 1 at stem neck (y = +length/2)
        const y = (t - 0.5) * length;
        let r;
        if (t < 0.08) {
            // Rounded blossom tip
            r = radius * Math.sin((t / 0.08) * (Math.PI * 0.5));
        } else if (t < 0.25) {
            // Lower body widening with blossom-end stripes
            const p = (t - 0.08) / 0.17;
            r = radius * (0.85 + 0.15 * Math.sin(p * Math.PI * 0.5));
        } else if (t < 0.80) {
            // Plump middle cylindrical body
            r = radius * (0.96 + 0.04 * Math.sin(((t - 0.25) / 0.55) * Math.PI));
        } else {
            // Tapered stem neck
            const p = (t - 0.80) / 0.20;
            r = radius * (0.96 - 0.48 * p);
        }
        points.push(new THREE.Vector2(Math.max(0.001, r), y));
    }

    const lathe = new THREE.LatheGeometry(points, 20);
    const pos = lathe.attributes.position;
    const count = pos.count;

    // Apply natural banana-like bend arc, longitudinal ribbing & surface warts
    for (let i = 0; i < count; i++) {
        const y = pos.getY(i);
        const ny = (y / length) + 0.5; // 0 to 1
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // 1. Natural gentle curvature (slight banana curve)
        const bend = Math.sin(ny * Math.PI) * curveAmount;
        const newX = x + bend;

        // 2. Longitudinal 10-rib radial modulation & realistic surface warts
        const angle = Math.atan2(z, x);
        const belly = Math.sin(ny * Math.PI);
        const ribMod = Math.cos(angle * 10) * (0.0025 * belly);
        const wartMod = (Math.sin(y * 85 + angle * 7) * Math.cos(y * 42 - angle * 5)) * (0.0020 * belly);

        const radialFactor = 1.0 + (ribMod + wartMod);
        pos.setX(i, newX * radialFactor);
        pos.setZ(i, z * radialFactor);
    }

    lathe.computeVertexNormals();

    // Peduncle stalk at stem neck (connecting cucumber to vine)
    const stalkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, length * 0.5, 0),
        new THREE.Vector3(0.006, length * 0.5 + 0.018, 0.008),
        new THREE.Vector3(0.015, length * 0.5 + 0.038, 0.018)
    ]);
    const stalk = new THREE.TubeGeometry(stalkCurve, 6, Math.max(0.004, radius * 0.22), 6, false);
    setGeometryColor(stalk, 0x3f7c28);

    return mergeBufferGeometries([lathe, stalk]);
}

/**
 * 5-Petal Star-Shaped Golden Yellow Cucumber Blossom (শসার হলুদ ফুল)
 */
function createCucumberBlossomGeometry(size = 0.034) {
    const parts = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petal = createBotanicalBladeGeometry({
            length: size,
            baseWidth: size * 0.18,
            midWidth: size * 0.42,
            tipWidth: size * 0.06,
            archX: 0.003,
            archY: size * 0.20,
            midribFold: size * 0.06,
            wavyEdge: size * 0.05,
            segments: 7
        });
        petal.rotateX(Math.PI * 0.42); // flared outward
        petal.rotateZ(angle);
        parts.push(petal);
    }
    const center = new THREE.ConeGeometry(size * 0.18, size * 0.32, 6);
    center.rotateX(-Math.PI * 0.5);
    parts.push(center);
    const blossom = mergeBufferGeometries(parts);
    setGeometryColor(blossom, 0xfacc15);
    return blossom;
}

/**
 * Spiral Climbing Tendril Generator (লতার আকর্ষী)
 */
function createCucumberTendrilGeometry(radius = 0.018, length = 0.14, coils = 3.5) {
    const pts = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = t * length;
        const coilT = Math.max(0, (t - 0.25) / 0.75);
        const ang = coilT * coils * Math.PI * 2;
        const r = radius * Math.min(1.0, coilT * 1.5);
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tendril = new THREE.TubeGeometry(curve, 18, 0.0024, 4, false);
    setGeometryColor(tendril, 0x84cc16);
    return tendril;
}

/**
 * Broad 5-Lobed Palmate Cordate Leaf with Cupped Curvature & Petiole (শসা পাতা)
 */
function createCucumberPalmateLeafGeometry(size = 0.32) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); // Petiole sinus notch
    // Left basal lobe
    shape.bezierCurveTo(-size * 0.18, -size * 0.08, -size * 0.38, size * 0.08, -size * 0.42, size * 0.25);
    // Left lateral lobe
    shape.bezierCurveTo(-size * 0.48, size * 0.45, -size * 0.38, size * 0.65, -size * 0.22, size * 0.78);
    // Notch to central apex
    shape.bezierCurveTo(-size * 0.16, size * 0.82, -size * 0.10, size * 0.88, -size * 0.05, size * 0.94);
    // Central terminal lobe apex
    shape.bezierCurveTo(-size * 0.02, size * 1.05, size * 0.02, size * 1.05, size * 0.05, size * 0.94);
    // Right side (symmetric)
    shape.bezierCurveTo(size * 0.10, size * 0.88, size * 0.16, size * 0.82, size * 0.22, size * 0.78);
    shape.bezierCurveTo(size * 0.38, size * 0.65, size * 0.48, size * 0.45, size * 0.42, size * 0.25);
    shape.bezierCurveTo(size * 0.38, size * 0.08, size * 0.18, -size * 0.08, 0, 0);

    const geom = new THREE.ShapeGeometry(shape, 12);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        const cup = -Math.sin(Math.min(1.0, dist / size) * Math.PI) * 0.038 - (Math.abs(x) / size) * 0.022;
        pos.setZ(i, cup);
    }
    geom.computeVertexNormals();

    // Curved Petiole holding leaf blade outward
    const petioleLen = size * 0.50;
    const petioleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -petioleLen, -0.015),
        new THREE.Vector3(0, -petioleLen * 0.45, 0.008),
        new THREE.Vector3(0, 0, 0)
    ]);
    const petiole = new THREE.TubeGeometry(petioleCurve, 6, 0.0055, 5, false);

    return mergeBufferGeometries([geom, petiole]);
}

/**
 * Cucumber Morphology Generator (Climbing Vine Trellis, Gravity-Hanging Striped Cucumbers, Tendrils & Blossoms)
 */
function createCucumberMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const flowers = [];

    // 1. Natural Bamboo Support Trellis Arch (Upright Stakes & Horizontal Crossbars)
    // Left Bamboo Stake (x = -0.16m, height = 0.98m)
    const leftStake = new THREE.CylinderGeometry(0.011, 0.013, 0.98, 8);
    leftStake.rotateZ(0.035);
    leftStake.translate(-0.16, 0.47, 0.0);
    setGeometryColor(leftStake, 0x8d7756);
    stems.push(leftStake);

    // Left bamboo nodal rings
    for (const ny of [0.26, 0.56, 0.86]) {
        const ring = new THREE.TorusGeometry(0.013, 0.0028, 4, 8);
        ring.rotateX(Math.PI * 0.5);
        ring.translate(-0.16 + (0.47 - ny) * 0.035, ny, 0.0);
        setGeometryColor(ring, 0x6e5d42);
        stems.push(ring);
    }

    // Right Bamboo Stake (x = +0.16m, height = 0.98m)
    const rightStake = new THREE.CylinderGeometry(0.011, 0.013, 0.98, 8);
    rightStake.rotateZ(-0.035);
    rightStake.translate(0.16, 0.47, 0.0);
    setGeometryColor(rightStake, 0x8d7756);
    stems.push(rightStake);

    // Right bamboo nodal rings
    for (const ny of [0.26, 0.56, 0.86]) {
        const ring = new THREE.TorusGeometry(0.013, 0.0028, 4, 8);
        ring.rotateX(Math.PI * 0.5);
        ring.translate(0.16 - (0.47 - ny) * 0.035, ny, 0.0);
        setGeometryColor(ring, 0x6e5d42);
        stems.push(ring);
    }

    // Lower Horizontal Bamboo Crossbar (y = 0.48m)
    const lowerBar = new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6);
    lowerBar.rotateZ(Math.PI * 0.5);
    lowerBar.translate(0.0, 0.48, 0.0);
    setGeometryColor(lowerBar, 0x7a6646);
    stems.push(lowerBar);

    // Upper Horizontal Bamboo Crossbar (y = 0.84m)
    const upperBar = new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6);
    upperBar.rotateZ(Math.PI * 0.5);
    upperBar.translate(0.0, 0.84, 0.0);
    setGeometryColor(upperBar, 0x7a6646);
    stems.push(upperBar);

    // 2. Climbing Main Vine Stem & Twining Shoots
    const mainVineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.00, 0.00, 0.00),
        new THREE.Vector3(-0.14, 0.18, 0.02),
        new THREE.Vector3(-0.16, 0.36, -0.01),
        new THREE.Vector3(-0.14, 0.48, 0.02),
        new THREE.Vector3(-0.02, 0.52, -0.02),
        new THREE.Vector3(0.12, 0.56, 0.02),
        new THREE.Vector3(0.16, 0.72, -0.01),
        new THREE.Vector3(0.14, 0.84, 0.02),
        new THREE.Vector3(0.02, 0.89, -0.02),
        new THREE.Vector3(-0.12, 0.94, 0.01)
    ]);
    const mainVine = new THREE.TubeGeometry(mainVineCurve, 28, 0.011, 6, false);
    setGeometryColor(mainVine, 0x2e6b22);
    stems.push(mainVine);

    // Lateral climbing shoot 1 (branching at y = 0.48m)
    const shoot1Curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.14, 0.48, 0.02),
        new THREE.Vector3(-0.06, 0.58, 0.04),
        new THREE.Vector3(0.02, 0.66, 0.02),
        new THREE.Vector3(0.10, 0.74, -0.02)
    ]);
    const shoot1 = new THREE.TubeGeometry(shoot1Curve, 12, 0.0075, 5, false);
    setGeometryColor(shoot1, 0x367c26);
    stems.push(shoot1);

    // Lateral climbing shoot 2 (branching at y = 0.84m)
    const shoot2Curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.14, 0.84, 0.02),
        new THREE.Vector3(0.04, 0.86, 0.05),
        new THREE.Vector3(-0.06, 0.84, 0.04),
        new THREE.Vector3(-0.15, 0.80, 0.02)
    ]);
    const shoot2 = new THREE.TubeGeometry(shoot2Curve, 12, 0.0070, 5, false);
    setGeometryColor(shoot2, 0x367c26);
    stems.push(shoot2);

    // 3. Delicate Spiral Tendrils (লতার আকর্ষী) Curling around Stakes & Crossbars
    const tendril1 = createCucumberTendrilGeometry(0.016, 0.12, 3.2);
    tendril1.rotateZ(0.6);
    tendril1.translate(-0.16, 0.38, 0.01);
    stems.push(tendril1);

    const tendril2 = createCucumberTendrilGeometry(0.015, 0.13, 3.5);
    tendril2.rotateX(0.7);
    tendril2.translate(0.02, 0.52, -0.02);
    stems.push(tendril2);

    const tendril3 = createCucumberTendrilGeometry(0.016, 0.14, 3.4);
    tendril3.rotateZ(-0.5);
    tendril3.translate(0.16, 0.72, 0.01);
    stems.push(tendril3);

    const tendril4 = createCucumberTendrilGeometry(0.014, 0.12, 3.0);
    tendril4.rotateY(0.9);
    tendril4.translate(0.04, 0.89, -0.02);
    stems.push(tendril4);

    // 4. Broad 5-Lobed Palmate Leaves along Trellis Nodes (Lush, Layered Canopy)
    const leafNodes = [
        { x: -0.12, y: 0.22, z: 0.04, rotX: 0.55, rotY: -0.4, rotZ: -0.2, s: 0.30 },
        { x: -0.16, y: 0.34, z: -0.03, rotX: 0.45, rotY: -1.2, rotZ: 0.1, s: 0.34 },
        { x: -0.14, y: 0.46, z: 0.05, rotX: 0.60, rotY: 0.3, rotZ: -0.3, s: 0.35 },
        { x: -0.06, y: 0.52, z: -0.04, rotX: 0.50, rotY: 1.8, rotZ: 0.2, s: 0.32 },
        { x: 0.04, y: 0.55, z: 0.05, rotX: 0.65, rotY: 0.1, rotZ: -0.1, s: 0.36 },
        { x: 0.12, y: 0.60, z: -0.03, rotX: 0.45, rotY: -0.6, rotZ: 0.3, s: 0.33 },
        { x: 0.16, y: 0.72, z: 0.04, rotX: 0.55, rotY: 0.8, rotZ: -0.2, s: 0.35 },
        { x: 0.14, y: 0.82, z: -0.04, rotX: 0.50, rotY: 2.1, rotZ: 0.1, s: 0.31 },
        { x: 0.04, y: 0.88, z: 0.05, rotX: 0.60, rotY: 0.2, rotZ: -0.1, s: 0.32 },
        { x: -0.08, y: 0.92, z: -0.03, rotX: 0.40, rotY: -1.5, rotZ: 0.2, s: 0.28 },
        { x: 0.00, y: 0.75, z: 0.06, rotX: 0.70, rotY: 0.0, rotZ: 0.0, s: 0.33 }
    ];

    for (const ln of leafNodes) {
        const lf = createCucumberPalmateLeafGeometry(ln.s);
        lf.rotateX(ln.rotX);
        lf.rotateY(ln.rotY);
        lf.rotateZ(ln.rotZ);
        lf.translate(ln.x, ln.y, ln.z);
        leaves.push(lf);
    }

    // 5. Gravity-Aligned Hanging Cucumbers (3 Growth Stages, 100% Vertical Droop)
    // Stage 1: Mature Harvest-Ready Cucumbers (50%) - Deep emerald with pale stripes
    // Cucumber 1: Hanging from node at (-0.12, 0.54, 0.04)
    const cuc1 = createRealisticCucumberGeometry(0.25, 0.032, 0.016);
    setGeometryColor(cuc1, 0xffffff); // Full rich texture with pale yellow-green stripes
    cuc1.rotateZ(-0.04);
    cuc1.rotateX(0.03);
    cuc1.translate(-0.12 - 0.015, 0.54 - (0.25 * 0.5 + 0.038), 0.04 - 0.018);
    fruits.push(cuc1);

    // Cucumber 2: Hanging from node at (0.13, 0.70, 0.03)
    const cuc2 = createRealisticCucumberGeometry(0.24, 0.031, -0.015);
    setGeometryColor(cuc2, 0xffffff);
    cuc2.rotateZ(0.05);
    cuc2.rotateX(-0.03);
    cuc2.translate(0.13 - 0.015, 0.70 - (0.24 * 0.5 + 0.038), 0.03 - 0.018);
    fruits.push(cuc2);

    // Stage 2: Medium Growing Cucumbers (30%) - Fresh bright green
    // Cucumber 3: Hanging from node at (0.02, 0.50, -0.04)
    const cuc3 = createRealisticCucumberGeometry(0.16, 0.024, 0.012);
    setGeometryColor(cuc3, 0x98f598); // Bright fresh green tint
    cuc3.rotateZ(0.03);
    cuc3.rotateX(-0.04);
    cuc3.translate(0.02 - 0.015, 0.50 - (0.16 * 0.5 + 0.038), -0.04 - 0.018);
    fruits.push(cuc3);

    // Cucumber 4: Hanging from node at (-0.08, 0.84, 0.03)
    const cuc4 = createRealisticCucumberGeometry(0.15, 0.023, -0.011);
    setGeometryColor(cuc4, 0x98f598);
    cuc4.rotateZ(-0.04);
    cuc4.rotateX(0.03);
    cuc4.translate(-0.08 - 0.015, 0.84 - (0.15 * 0.5 + 0.038), 0.03 - 0.018);
    fruits.push(cuc4);

    // Stage 3: Baby / Pin Cucumber (20%) - Pale lime with Attached Blossom
    // Cucumber 5: Hanging from node at (0.09, 0.58, -0.03)
    const cuc5 = createRealisticCucumberGeometry(0.08, 0.014, 0.007);
    setGeometryColor(cuc5, 0xd4ff88); // Pale lime baby tint
    cuc5.rotateZ(0.03);
    const cuc5X = 0.09 - 0.015;
    const cuc5Y = 0.58 - (0.08 * 0.5 + 0.038);
    const cuc5Z = -0.03 - 0.018;
    cuc5.translate(cuc5X, cuc5Y, cuc5Z);
    fruits.push(cuc5);

    // Baby yellow flower attached to the bottom blossom tip
    const babyFlower = createCucumberBlossomGeometry(0.022);
    babyFlower.rotateX(Math.PI); // Blossom facing downward from tip
    babyFlower.translate(cuc5X, cuc5Y - 0.042, cuc5Z);
    flowers.push(babyFlower);

    // 6. Vibrant 5-Petal Star-Shaped Yellow Canopy Blossoms
    const flowerNodes = [
        { x: -0.15, y: 0.44, z: 0.05, rotX: 0.3, rotY: 0.4 },
        { x: -0.02, y: 0.62, z: -0.03, rotX: 0.4, rotY: -0.8 },
        { x: 0.15, y: 0.78, z: 0.04, rotX: 0.2, rotY: 0.6 },
        { x: 0.02, y: 0.90, z: 0.04, rotX: 0.5, rotY: 0.1 }
    ];
    for (const fn of flowerNodes) {
        const fl = createCucumberBlossomGeometry(0.034);
        fl.rotateX(fn.rotX);
        fl.rotateY(fn.rotY);
        fl.translate(fn.x, fn.y, fn.z);
        flowers.push(fl);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Curved Ribbon Geometry for Feathery Carrot Fern Fronds
 * Creates an outward-arching parabolic compound ribbon with UV mapping for alpha-cutout textures
 */
function createCarrotFrondRibbonGeometry(length = 0.46, elevation = 0.55, widthMax = 0.09) {
    const segments = 12;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Graceful parabolic outward arch: ascends upward, curves outward, then droops near frond tip
        const y = Math.sin(t * Math.PI * 0.82) * length * Math.sin(elevation);
        const z = t * length * Math.cos(elevation);
        const w = (t < 0.20 ? (t / 0.20) : Math.pow(1 - t, 0.65)) * widthMax;

        // Two vertices across ribbon width
        positions.push(-w * 0.5, y, z);
        positions.push(w * 0.5, y, z);

        uvs.push(0, t);
        uvs.push(1, t);

        if (i < segments) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
}

/**
 * Botanically Authentic 24-Segment Lathe Nantes Carrot Taproot Geometry
 * Extends from rounded crown shoulder (y = +0.035m) down into soil bed (y = -0.25m)
 * with horizontal sinusoidal growth rings and blunt apex
 */
function createCarrotTaprootGeometry() {
    const points = [
        new THREE.Vector2(0.002, 0.035),  // Crown center (y = +0.035m peeking above ground)
        new THREE.Vector2(0.016, 0.033),
        new THREE.Vector2(0.034, 0.024),  // Rounded shoulder
        new THREE.Vector2(0.040, 0.008),
        new THREE.Vector2(0.041, -0.015), // Ground level embed
        new THREE.Vector2(0.039, -0.050),
        new THREE.Vector2(0.035, -0.090),
        new THREE.Vector2(0.030, -0.130),
        new THREE.Vector2(0.024, -0.170),
        new THREE.Vector2(0.017, -0.210),
        new THREE.Vector2(0.009, -0.238),
        new THREE.Vector2(0.002, -0.250)  // Blunt conical apex at y = -0.25m
    ];

    // Modulate points with subtle horizontal growth rings
    for (let i = 2; i < points.length - 1; i++) {
        const y = points[i].y;
        points[i].x *= (1.0 + 0.028 * Math.sin(y * 95));
    }

    const geom = new THREE.LatheGeometry(points, 24);
    geom.computeVertexNormals();
    return geom;
}

/**
 * Botanically Accurate Carrot Morphology Generator (Daucus carota)
 * - 14 Radiating Compound Feathery Fern Fronds (5 inner spring green + 9 outer lush emerald)
 * - 24-Segment Lathe Beta-Carotene Taproot with Rounded Crown Shoulder & 10 Feeder Rootlets
 */
function createCarrotMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const roots = [];

    // 1. Beta-Carotene Taproot (Lathe geometry from +0.035m down to -0.25m)
    const taprootGeom = createCarrotTaprootGeometry();
    setGeometryColor(taprootGeom, 0xffffff); // Uses high-res PBR skin texture
    fruits.push(taprootGeom);

    // 2. Crown rim collar (compact core at ground level)
    const crown = new THREE.CylinderGeometry(0.016, 0.026, 0.025, 8);
    crown.translate(0, 0.032, 0);
    setGeometryColor(crown, 0x4d7c0f);
    stems.push(crown);

    // 3. Fine feeder rootlets branching off the taproot into soil
    for (let r = 0; r < 10; r++) {
        const ry = -0.04 - (r / 10) * 0.18;
        const rang = (r / 10) * Math.PI * 2 + (r % 2) * 0.4;
        const rCurve = new THREE.LineCurve3(
            new THREE.Vector3(Math.cos(rang) * 0.024, ry, Math.sin(rang) * 0.024),
            new THREE.Vector3(Math.cos(rang) * 0.075, ry - 0.035, Math.sin(rang) * 0.075)
        );
        const rTube = new THREE.TubeGeometry(rCurve, 4, 0.0016, 3, false);
        setGeometryColor(rTube, 0xfde68a);
        roots.push(rTube);
    }

    // 4. Feathery Fern-like Fronds (14 Compound Radiating Fronds)
    // 5 Inner Young Fronds (elevated 20°–32°, height 0.32m–0.38m, vibrant spring lime)
    const innerCount = 5;
    for (let i = 0; i < innerCount; i++) {
        const ang = (i / innerCount) * Math.PI * 2 + 0.2;
        const frondGeom = createCarrotFrondRibbonGeometry(0.36, 0.38, 0.075);
        frondGeom.rotateY(ang);
        frondGeom.translate(0, 0.035, 0);
        setGeometryColor(frondGeom, 0x65a30d); // vibrant spring lime
        leaves.push(frondGeom);
    }

    // 9 Outer Mature Fronds (elevated 38°–65°, spread 0.45m–0.52m, lush emerald green)
    const outerCount = 9;
    for (let i = 0; i < outerCount; i++) {
        const ang = (i / outerCount) * Math.PI * 2 + 0.55;
        const frondGeom = createCarrotFrondRibbonGeometry(0.48, 0.65, 0.095);
        frondGeom.rotateY(ang);
        frondGeom.translate(0, 0.030, 0);
        setGeometryColor(frondGeom, 0x16a34a); // lush emerald green
        leaves.push(frondGeom);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        rootGeom: mergeBufferGeometries(roots)
    };
}

/**
 * Lentil Morphology Generator (Delicate Legume Cluster)
 */
function createLentilMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];

    for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const stem = createOrganicMainStem(0.40, 0.010, 0.004, 0.03, 0.02, 8);
        stem.rotateZ(0.35);
        stem.rotateY(ang);
        stems.push(stem);

        for (let l = 0; l < 4; l++) {
            const ly = 0.10 + l * 0.07;
            const leaf = createBotanicalBladeGeometry({
                length: 0.16,
                baseWidth: 0.004,
                midWidth: 0.022,
                tipWidth: 0.002,
                archX: 0.01,
                archY: 0.025,
                midribFold: 0.004,
                segments: 8
            });
            leaf.rotateX(0.35);
            leaf.rotateY(ang + (l - 1.5) * 0.4);
            leaf.translate(Math.cos(ang) * 0.06, ly, Math.sin(ang) * 0.06);
            leaves.push(leaf);
        }

        const flower = createTomatoBlossomGeometry();
        flower.scale(0.4, 0.4, 0.4);
        flower.translate(Math.cos(ang) * 0.10, 0.32, Math.sin(ang) * 0.10);
        flowers.push(flower);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Cauliflower Morphology Generator (ফুলকপি)
 * Robust right-side-up botanical architecture:
 * 1. Stout pale green stem at base (y = 0.0 to 0.14) firmly on the soil ridge
 * 2. Rosette of 14 broad cupping wrapper leaves cupping upward (#2b5b3c)
 * 3. Hyper-realistic creamy-white fractal curd dome nestled in center/top (y = 0.20 to 0.38)
 *    composed of core dome + 26 bumpy floret sphere clusters
 * 4. Deep white-green root system extending into soil
 */
function createCauliflowerMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];

    // 1. Stout Fleshy Stem Base (y = 0.0 to 0.14)
    const stem = new THREE.CylinderGeometry(0.032, 0.048, 0.14, 10);
    stem.translate(0, 0.07, 0);
    stems.push(stem);

    // Lateral stem ribs
    for (let r = 0; r < 4; r++) {
        const ry = 0.03 + r * 0.025;
        const rib = new THREE.TorusGeometry(0.042 - r * 0.003, 0.004, 4, 10);
        rib.rotateX(Math.PI * 0.5);
        rib.translate(0, ry, 0);
        stems.push(rib);
    }

    // 2. Rosette of 14 Broad Cupping Wrapper Leaves
    // Outer Ring (7 large leaves arching outward then curving upward)
    for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2;
        const wl = createBroadWavyLeafGeometry(0.42, 0.26, 4);
        wl.rotateX(0.92);
        wl.rotateY(ang);
        wl.translate(Math.cos(ang) * 0.04, 0.06, Math.sin(ang) * 0.04);
        leaves.push(wl);
    }

    // Inner Ring (7 upright/cupping leaves sheathing the curd dome)
    for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + 0.45;
        const wl = createBroadWavyLeafGeometry(0.34, 0.20, 3);
        wl.rotateX(0.55);
        wl.rotateY(ang);
        wl.translate(Math.cos(ang) * 0.03, 0.12, Math.sin(ang) * 0.03);
        leaves.push(wl);
    }

    // 3. Hyper-Realistic Bumpy Creamy-White Fractal Curd Dome (y = 0.20 to 0.38)
    const coreDome = new THREE.SphereGeometry(0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
    coreDome.scale(1.18, 0.82, 1.18);
    coreDome.translate(0, 0.22, 0);
    setGeometryColor(coreDome, 0xfbf8ee);
    fruits.push(coreDome);

    // 26 Bumpy Phyllotaxis Floret Clusters forming authentic fractal curd texture
    for (let i = 0; i < 26; i++) {
        const phi = Math.acos(1 - ((i + 0.5) / 26) * 0.78);
        const theta = i * 2.399963;
        const r = 0.132 + ((i % 3) * 0.007);
        const fx = r * Math.sin(phi) * Math.cos(theta);
        const fz = r * Math.sin(phi) * Math.sin(theta);
        const fy = 0.23 + r * Math.cos(phi) * 0.72;

        const floretRadius = 0.042 - (i * 0.0006);
        const floret = new THREE.SphereGeometry(floretRadius, 8, 8);
        floret.scale(1.05, 0.85, 1.05);
        floret.translate(fx, fy, fz);
        setGeometryColor(floret, 0xfbf8ee);
        fruits.push(floret);
    }

    const rootGeom = createBotanicalRootSystem(0.22, 0.14, 10);

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        rootGeom
    };
}

/**
 * Universal Crop Morphology Dispatcher
 */
export function createCropMesh(cropType, baseChlorophyll) {
    const crop = normalizeCropId(cropType);

    let stemGeom = null, stemMat = null;
    let leafGeom = null, leafMat = null;
    let fruitGeom = null, fruitMat = null;
    let calyxGeom = null, calyxMat = null;
    let flowerGeom = null, flowerMat = null;
    let rootGeom = null, rootMat = null;

    let isMonocot = false;

    switch (crop) {
        case "rice": {
            isMonocot = true;
            const res = createCerealTillerClusterGeometry(true);
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3e7529, roughness: 0.60 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4b238, roughness: 0.38 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xdfd7be, roughness: 0.88 });
            break;
        }

        case "wheat": {
            isMonocot = true;
            const res = createCerealTillerClusterGeometry(false);
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7e30, roughness: 0.60 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xc89f46, roughness: 0.42 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xdfd7be, roughness: 0.88 });
            break;
        }

        case "maize": {
            isMonocot = true;
            const res = createMaizeMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x478c2e, roughness: 0.55 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.40 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xc4b79b, roughness: 0.88 });
            break;
        }

        case "tomato": {
            const res = createTomatoMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            calyxGeom = res.calyxGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.24, 0.14, 8);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7426, roughness: 0.58 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                vertexColors: true, // Multi-stage ripe crimson (55%), breaker orange (25%), green (20%)
                roughness: 0.15,
                clearcoat: 0.88,
                clearcoatRoughness: 0.12,
                metalness: 0.02,
                transmission: 0.03
            });
            calyxMat = new THREE.MeshStandardMaterial({ color: 0x2e6f28, roughness: 0.6, side: THREE.DoubleSide });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, emissive: 0x332600 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        case "potato": {
            const res = createPotatoMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            fruitGeom = res.fruitGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x356920, roughness: 0.60 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf3e8ff, roughness: 0.30, emissive: 0x2a1b40 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xc89d66, roughness: 0.82, metalness: 0.02 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.90 });
            break;
        }

        case "eggplant":
        case "brinjal": {
            const res = createEggplantMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            calyxGeom = res.calyxGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.25, 0.15, 8);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x345424, roughness: 0.62 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                vertexColors: true, // Deep royal purple & breaker violet
                roughness: 0.18,
                clearcoat: 0.80,
                clearcoatRoughness: 0.15
            });
            calyxMat = new THREE.MeshStandardMaterial({ color: 0x2d5f26, roughness: 0.6, side: THREE.DoubleSide });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.35, emissive: 0x2e1065 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        case "chili": {
            const res = createChiliMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            calyxGeom = res.calyxGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2f5e24, roughness: 0.68 });
            leafMat = new THREE.MeshStandardMaterial({
                color: 0x25591c,
                roughness: 0.42,
                metalness: 0.05,
                side: THREE.DoubleSide
            });
            fruitMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, // Pure white base so vertexColors are NOT multiplied into pitch-black!
                vertexColors: true, // Multi-stage ripe crimson, breaker amber, and fresh glossy green
                roughness: 0.22,
                metalness: 0.02,
                clearcoat: 0.85,
                clearcoatRoughness: 0.12,
                reflectivity: 0.70,
                emissive: 0x0a0500,
                emissiveIntensity: 0.08 // Prevents pitch-black shadow silhouettes in dusk/sunset
            });
            calyxMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.45, side: THREE.DoubleSide });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        case "mustard": {
            const res = createMustardMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.22, 0.12, 8);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487f2e, roughness: 0.58 });
            flowerMat = new THREE.MeshStandardMaterial({
                color: 0xffea00,
                roughness: 0.30,
                emissive: 0x554400,
                emissiveIntensity: 0.35,
                side: THREE.DoubleSide
            });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        case "onion": {
            isMonocot = true;
            const res = createOnionMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2a5a4e, roughness: 0.50 });
            fruitMat = new THREE.MeshPhysicalMaterial({ color: 0x9e3b68, roughness: 0.35, clearcoat: 0.40 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.85 });
            break;
        }

        case "jute": {
            const res = createJuteMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.28, 0.12, 10);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3f7f2b, roughness: 0.55 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xcfc4a8, roughness: 0.88 });
            break;
        }

        case "papaya": {
            const res = createPapayaMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({
                map: getPapayaBarkTexture(),
                roughness: 0.82,
                metalness: 0.04
            });
            leafMat = new THREE.MeshPhysicalMaterial({
                map: getPapayaLeafTexture(),
                roughness: 0.42,
                metalness: 0.03,
                clearcoat: 0.25,
                clearcoatRoughness: 0.35,
                side: THREE.DoubleSide
            });
            fruitMat = new THREE.MeshPhysicalMaterial({
                vertexColors: true, // Multi-stage ripe amber (#f59e0b), breaker yellow-green (#84cc16), unripe green (#15803d)
                roughness: 0.28,
                clearcoat: 0.55,
                clearcoatRoughness: 0.18
            });
            flowerMat = new THREE.MeshStandardMaterial({
                color: 0xfef9c3,
                roughness: 0.40,
                side: THREE.DoubleSide
            });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xcfc4a8, roughness: 0.88 });
            break;
        }

        case "cauliflower": {
            const res = createCauliflowerMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487d35, roughness: 0.65 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                vertexColors: true, // Creamy ivory fractal curd dome
                roughness: 0.82,
                metalness: 0.01,
                clearcoat: 0.15,
                clearcoatRoughness: 0.40
            });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xdfd7be, roughness: 0.88 });
            break;
        }

        case "cucumber": {
            const res = createCucumberMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.24, 0.15, 8);
            stemMat = new THREE.MeshStandardMaterial({
                vertexColors: true, // Supports natural bamboo brown stakes & lush green climbing vines
                roughness: 0.65
            });
            fruitMat = new THREE.MeshPhysicalMaterial({
                map: getCucumberSkinTexture(),
                vertexColors: true, // Multi-stage ripe emerald (#ffffff on striped texture), breaker green (#98f598), baby lime (#d4ff88)
                roughness: 0.32,
                clearcoat: 0.45,
                clearcoatRoughness: 0.25
            });
            flowerMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.35,
                emissive: 0x422006,
                emissiveIntensity: 0.25,
                side: THREE.DoubleSide
            });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        case "carrot": {
            const res = createCarrotMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            rootGeom = res.rootGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.55 });
            leafMat = new THREE.MeshStandardMaterial({
                map: getCarrotFernTexture(),
                alphaTest: 0.35,
                transparent: true,
                side: THREE.DoubleSide,
                roughness: 0.38,
                metalness: 0.04,
                emissive: 0x14532d,
                emissiveIntensity: 0.30
            });
            fruitMat = new THREE.MeshStandardMaterial({
                map: getCarrotSkinTexture(),
                roughness: 0.46,
                metalness: 0.03,
                emissive: 0x7c2d12,
                emissiveIntensity: 0.16
            });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.82 });
            break;
        }

        case "lentil": {
            const res = createLentilMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            rootGeom = createBotanicalRootSystem(0.20, 0.10, 8);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x386a28, roughness: 0.58 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.35 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });
            break;
        }

        default: {
            // General robust botanical architecture for any unlisted crop
            const stems = [];
            const leaves = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const s = createOrganicMainStem(0.65, 0.016, 0.008, 0.03, 0.02, 8);
                s.rotateZ(0.25);
                s.rotateY(angle);
                stems.push(s);

                const l = createCompoundOddPinnateLeafGeometry(0.38, 0.20, true, false);
                l.rotateZ(0.35);
                l.rotateY(angle);
                l.translate(Math.cos(angle) * 0.10, 0.28, Math.sin(angle) * 0.10);
                leaves.push(l);
            }
            stemGeom = mergeBufferGeometries(stems);
            leafGeom = mergeBufferGeometries(leaves);
            rootGeom = createBotanicalRootSystem(0.22, 0.12, 8);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7528, roughness: 0.60 });
            rootMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb3, roughness: 0.88 });

            fruitGeom = new THREE.SphereGeometry(0.045, 10, 8);
            fruitGeom.translate(0, 0.58, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 });
            break;
        }
    }

    // Guarantee: Entire above-ground plant assembly sits firmly at local y = 0
    // (Papaya is purposefully sunk 0.05m so root collar is buried and roots never float)
    if (crop !== "papaya" && stemGeom && stemGeom.attributes && stemGeom.attributes.position) {
        stemGeom.computeBoundingBox();
        if (stemGeom.boundingBox && stemGeom.boundingBox.min.y < -0.002) {
            const shiftY = -stemGeom.boundingBox.min.y;
            stemGeom.translate(0, shiftY, 0);
            if (leafGeom) leafGeom.translate(0, shiftY, 0);
            if (fruitGeom) fruitGeom.translate(0, shiftY, 0);
            if (calyxGeom) calyxGeom.translate(0, shiftY, 0);
            if (flowerGeom) flowerGeom.translate(0, shiftY, 0);
        }
    }

    // Hyper-Realistic PBR Subsurface Scattering Material for Leaves (Sunlit & Vibrant across all 15 crops)
    if (!leafMat) {
        const leafColor = (crop === "cucumber") ? 0x228b22 : (baseChlorophyll || 0x489a28);
        const leafEmissive = (crop === "cucumber") ? 0x0d3b14 : 0x184814;
        leafMat = new THREE.MeshPhysicalMaterial({
            map: isMonocot ? monocotTexture : dicotTexture,
            color: leafColor,
            roughness: 0.40,
            metalness: 0.02,
            clearcoat: 0.20,
            clearcoatRoughness: 0.35,
            transmission: 0.16,
            emissive: new THREE.Color(leafEmissive),
            emissiveIntensity: 0.22,
            side: THREE.DoubleSide
        });
    }

    return {
        stemGeom, stemMat,
        leafGeom, leafMat,
        fruitGeom, fruitMat,
        calyxGeom, calyxMat,
        flowerGeom, flowerMat,
        rootGeom, rootMat
    };
}

// =============================================================================
// 3B. SINGLETON GEOMETRY AND MATERIAL POOL & ASSET CACHE (85% DRAW CALL CUT, <60ms)
// =============================================================================
export class GeometryAndMaterialPool {
    constructor() {
        this.crops = new Map();
        this.glbModels = new Map();
    }

    has(cropId) {
        return this.crops.has(normalizeCropId(cropId));
    }

    get(cropId, baseChlorophyll) {
        const key = normalizeCropId(cropId);
        if (this.crops.has(key)) {
            const cached = this.crops.get(key);
            if (cached && cached.leafMat && baseChlorophyll) {
                cached.leafMat.color.copy(baseChlorophyll);
                cached.leafMat.needsUpdate = true;
            }
            return cached;
        }

        // Construct high-detail geometries and PBR materials ONCE per crop type
        const morphology = createCropMesh(key, baseChlorophyll);
        if (morphology.stemMat) injectWindShader(morphology.stemMat);
        if (morphology.leafMat) injectWindShader(morphology.leafMat);
        if (morphology.fruitMat) injectWindShader(morphology.fruitMat);
        if (morphology.calyxMat) injectWindShader(morphology.calyxMat);
        if (morphology.flowerMat) injectWindShader(morphology.flowerMat);
        if (morphology.rootMat) injectWindShader(morphology.rootMat);

        this.crops.set(key, morphology);
        return morphology;
    }

    cacheGlb(cropId, gltfScene) {
        this.glbModels.set(normalizeCropId(cropId), gltfScene);
    }

    getGlb(cropId) {
        return this.glbModels.get(normalizeCropId(cropId));
    }

    clear() {
        this.crops.clear();
        this.glbModels.clear();
    }
}

export const geometryAndMaterialPool = new GeometryAndMaterialPool();
export const cropPrototypeCache = geometryAndMaterialPool.crops;

export function getCropPrototype(cropId, baseChlorophyll) {
    return geometryAndMaterialPool.get(cropId, baseChlorophyll);
}
window.geometryAndMaterialPool = geometryAndMaterialPool;
window.cropPrototypeCache = cropPrototypeCache;
window.getCropPrototype = getCropPrototype;

/**
 * Strict GPU Memory Disposal on Crop Switch
 * Frees instance WebGL buffers from GPU VRAM while strictly preserving shared
 * geometries and PBR materials in GeometryAndMaterialPool for zero-allocation reuse.
 */
export function disposeFieldInstancedMeshes(group) {
    if (!group) return;
    group.traverse((child) => {
        if (child.isInstancedMesh) {
            if (child.instanceMatrix) {
                child.instanceMatrix.needsUpdate = false;
            }
            if (child.instanceColor) {
                child.instanceColor.needsUpdate = false;
            }
            if (typeof child.dispose === "function") {
                child.dispose();
            }
        }
    });
    group.clear();
}
window.disposeFieldInstancedMeshes = disposeFieldInstancedMeshes;

/**
 * Progressive GLB Streaming Engine with In-Memory Caching (0ms switch-back)
 */
async function streamCropGlbAsync(cropId) {
    const key = normalizeCropId(cropId);
    if (geometryAndMaterialPool.getGlb(key)) {
        console.log(`[3D FieldShift] 🌿 Instant 0ms retrieval of cached GLB asset for ${key}`);
        return;
    }

    if (!gltfLoader) {
        try {
            gltfLoader = new GLTFLoader();
        } catch (e) {
            return;
        }
    }
    const candidateUrls = [
        `assets/models/${key}.glb`,
        `assets/${key}.glb`,
        `assets/crops_3d/${key}.glb`
    ];

    for (const url of candidateUrls) {
        try {
            const gltf = await new Promise((resolve, reject) => {
                gltfLoader.load(url, resolve, undefined, reject);
            });
            if (gltf && gltf.scene && activeCropId === key) {
                gltf.scene.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                geometryAndMaterialPool.cacheGlb(key, gltf.scene);
                requestShadowUpdate();
                console.log(`[3D FieldShift] 🌿 Progressive GLB streamed & cached in pool: ${url}`);
                break;
            }
        } catch (e) {
            // High-detail cached botanical procedural mesh remains active at full 60 FPS
        }
    }
}

// =============================================================================
// 4. HYPER-DETAILED PHOTOREALISTIC PBR CROP FIELD BUILDER
// =============================================================================
export function createCropField(rawCropId = "tomato") {
    const cropId = normalizeCropId(rawCropId);
    activeCropId = cropId;
    if (isXRayActive || isMacroViewActive) {
        exitPlantInspection();
    }
    updateFieldGridDimensions();
    if (currentCropGroup) {
        disposeFieldInstancedMeshes(currentCropGroup);
        scene.remove(currentCropGroup);
        currentCropGroup = null;
    }

    currentCropGroup = new THREE.Group();
    currentCropGroup.name = `CropField_${cropId}`;

    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropId) : null;
    maxCropDays = dbCrop ? dbCrop.total_duration_days : 105;
    // Set default simulation lifecycle day to mature fruiting & ripening stage (~72% progress)
    currentGrowthDay = Math.round(maxCropDays * 0.72);

    const baseChlorophyll = getHealthColor(cropHealthState);

    // Retrieve high-detail morphology from Crop Master Prototype Cache
    const morphology = getCropPrototype(cropId, baseChlorophyll);
    const { stemGeom, stemMat, leafGeom, leafMat, fruitGeom, fruitMat, calyxGeom, calyxMat, flowerGeom, flowerMat, rootGeom, rootMat } = morphology;

    currentStemMat = stemMat;
    currentLeafMat = leafMat;
    currentFruitMat = fruitMat;
    currentCalyxMat = calyxMat;
    currentFlowerMat = flowerMat;
    currentRootMat = rootMat;

    // Instanced Rendering for 60 FPS Field
    stemInstancedMesh = new THREE.InstancedMesh(stemGeom, stemMat, TOTAL_PLANTS);
    stemInstancedMesh.castShadow = true;
    stemInstancedMesh.receiveShadow = true;

    leafInstancedMesh = new THREE.InstancedMesh(leafGeom, leafMat, TOTAL_PLANTS);
    leafInstancedMesh.castShadow = true;
    leafInstancedMesh.receiveShadow = true;

    if (fruitGeom && fruitMat) {
        fruitInstancedMesh = new THREE.InstancedMesh(fruitGeom, fruitMat, TOTAL_PLANTS);
        fruitInstancedMesh.castShadow = true;
    } else {
        fruitInstancedMesh = null;
    }

    if (calyxGeom && calyxMat) {
        calyxInstancedMesh = new THREE.InstancedMesh(calyxGeom, calyxMat, TOTAL_PLANTS);
        calyxInstancedMesh.castShadow = true;
    } else {
        calyxInstancedMesh = null;
    }

    if (flowerGeom && flowerMat) {
        flowerInstancedMesh = new THREE.InstancedMesh(flowerGeom, flowerMat, TOTAL_PLANTS);
    } else {
        flowerInstancedMesh = null;
    }

    if (rootGeom && rootMat) {
        rootInstancedMesh = new THREE.InstancedMesh(rootGeom, rootMat, TOTAL_PLANTS);
        rootInstancedMesh.castShadow = true;
        rootInstancedMesh.receiveShadow = true;
        rootInstancedMesh.visible = false; // Strictly hidden by default across ALL crops in normal view
    } else {
        rootInstancedMesh = null;
    }

    // Healthy chlorophyll palette for natural instance color variation
    const chlorophyllPalette = [
        new THREE.Color(0x2d5a18),
        new THREE.Color(0x3f7a24),
        new THREE.Color(0x529430),
        new THREE.Color(0x386d20),
        new THREE.Color(0x47852a)
    ];

    instanceData = [];
    let idx = 0;
    const furrowFreq = Math.PI / ROW_SPACING;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Integer column offset aligns plants precisely with raised soil ridge crests (where cos^2 = 1.0)
            const x = (c - Math.floor(COLS * 0.5)) * ROW_SPACING;
            const z = (r - (ROWS - 1) * 0.5) * PLANT_SPACING;

            // Exact terrain ridge crest height
            const terrainY = getTerrainHeightAt(x, z);
            const y = terrainY - 0.02; // slight 2cm embed for natural root tuck
            const rotY = Math.random() * Math.PI * 2;
            const s = 0.94 + Math.random() * 0.14;

            instanceData.push({
                baseX: x,
                baseY: y,
                baseZ: z,
                baseRotY: rotY,
                scale: s,
                rowIndex: r,
                colIndex: c
            });

            dummy.position.set(x, y, z);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();

            stemInstancedMesh.setMatrixAt(idx, dummy.matrix);
            leafInstancedMesh.setMatrixAt(idx, dummy.matrix);
            if (fruitInstancedMesh) fruitInstancedMesh.setMatrixAt(idx, dummy.matrix);
            if (calyxInstancedMesh) calyxInstancedMesh.setMatrixAt(idx, dummy.matrix);
            if (flowerInstancedMesh) flowerInstancedMesh.setMatrixAt(idx, dummy.matrix);
            if (rootInstancedMesh) rootInstancedMesh.setMatrixAt(idx, dummy.matrix);

            // Subtle color variation per instance so the field looks like a living ecosystem
            const leafCol = chlorophyllPalette[idx % chlorophyllPalette.length].clone();
            leafCol.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.04);
            leafInstancedMesh.setColorAt(idx, leafCol);

            idx++;
        }
    }

    stemInstancedMesh.instanceMatrix.needsUpdate = true;
    leafInstancedMesh.instanceMatrix.needsUpdate = true;
    if (leafInstancedMesh.instanceColor) leafInstancedMesh.instanceColor.needsUpdate = true;
    if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
    if (calyxInstancedMesh) calyxInstancedMesh.instanceMatrix.needsUpdate = true;
    if (flowerInstancedMesh) flowerInstancedMesh.instanceMatrix.needsUpdate = true;
    if (rootInstancedMesh) rootInstancedMesh.instanceMatrix.needsUpdate = true;

    currentCropGroup.add(stemInstancedMesh);
    currentCropGroup.add(leafInstancedMesh);
    if (fruitInstancedMesh) currentCropGroup.add(fruitInstancedMesh);
    if (calyxInstancedMesh) currentCropGroup.add(calyxInstancedMesh);
    if (flowerInstancedMesh) currentCropGroup.add(flowerInstancedMesh);
    if (rootInstancedMesh) currentCropGroup.add(rootInstancedMesh);

    scene.add(currentCropGroup);

    // Apply Growth Stage Morphing
    applyGrowthStage(currentGrowthDay, maxCropDays);

    // Reflective Furrow Water layer
    if (waterMesh) {
        waterMesh.visible = (cropId === "rice" || cropId === "jute" || soilMoisturePercent > 70);
    }

    isTransitioningCrop = true;
    transitionProgress = 0.0;

    updateHUDStatusCards();
    updateActionCardData(cropId);
    updateFieldSpatialPins(cropId);
    streamCropGlbAsync(cropId);
}

function getTomatoRipeningColor(day, totalDays) {
    const progress = Math.min(Math.max(day / totalDays, 0.0), 1.0);
    if (progress <= 0.45) return new THREE.Color(0x4ade80); // Fresh Green
    if (progress <= 0.70) return new THREE.Color(0xa3e635); // Light Yellow-Green
    if (progress <= 0.88) return new THREE.Color(0xf97316); // Breaker Orange
    return new THREE.Color(0xd91b1b); // Glossy Crimson Red
}

function getHealthColor(health) {
    if (health === "healthy") return new THREE.Color(0x288537);
    if (health === "deficiency") return new THREE.Color(0xb5a828);
    if (health === "pest") return new THREE.Color(0x73421d);
    return new THREE.Color(0x288537);
}

// =============================================================================
// 5. CROP-ACCURATE GROWTH MORPHING & PHENOLOGICAL STAGES
// =============================================================================
export function applyGrowthStage(day, totalDays = 105) {
    currentGrowthDay = Math.max(1, Math.min(day, totalDays));
    const progress = currentGrowthDay / totalDays;

    if (progress <= 0.18) currentGrowthStage = 1;
    else if (progress <= 0.45) currentGrowthStage = 2;
    else if (progress <= 0.70) currentGrowthStage = 3;
    else if (progress <= 0.88) currentGrowthStage = 4;
    else currentGrowthStage = 5;

    const stageScale = 0.22 + 0.78 * Math.pow(progress, 0.75);

    if (stemInstancedMesh) {
        for (let i = 0; i < TOTAL_PLANTS; i++) {
            const d = instanceData[i];
            dummy.position.set(d.baseX, d.baseY, d.baseZ);
            dummy.rotation.set(0, d.baseRotY, 0);

            const s = d.scale * stageScale;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();

            stemInstancedMesh.setMatrixAt(i, dummy.matrix);
            leafInstancedMesh.setMatrixAt(i, dummy.matrix);

            // Fruit & Calyx Growth
            if (fruitInstancedMesh) {
                if (activeCropId === "papaya") {
                    // Papaya trees prominently display a cauliflorous column of fruits at all viewing stages
                    const fruitScale = s * (0.65 + 0.35 * Math.pow(progress, 0.5));
                    dummy.scale.set(fruitScale, fruitScale, fruitScale);
                } else if (activeCropId === "carrot") {
                    // Carrot taproot is an underground storage organ developing throughout growth stages
                    const rootScale = s * (0.55 + 0.45 * Math.pow(progress, 0.65));
                    dummy.scale.set(rootScale, rootScale, rootScale);
                } else if (activeCropId === "chili") {
                    if (currentGrowthStage < 3) {
                        dummy.scale.set(0.001, 0.001, 0.001); // Fruits hidden in early vegetative stages
                    } else if (currentGrowthStage === 3) {
                        const fruitScale = s * 0.50; // Young developing chilies
                        dummy.scale.set(fruitScale, fruitScale, fruitScale);
                    } else if (currentGrowthStage === 4) {
                        const fruitScale = s * 0.85; // Breaker stage chilies
                        dummy.scale.set(fruitScale, fruitScale, fruitScale);
                    } else {
                        dummy.scale.set(s, s, s); // Harvest-ready full-size chilies
                    }
                } else if (currentGrowthStage < 3) {
                    dummy.scale.set(0.001, 0.001, 0.001); // Fruit hidden at early stages
                } else {
                    const fruitScale = currentGrowthStage === 3 ? s * 0.45 : (currentGrowthStage === 4 ? s * 0.85 : s);
                    dummy.scale.set(fruitScale, fruitScale, fruitScale);
                }
                dummy.updateMatrix();
                fruitInstancedMesh.setMatrixAt(i, dummy.matrix);
                if (calyxInstancedMesh) calyxInstancedMesh.setMatrixAt(i, dummy.matrix);
            }

            // Flower blossoms visible at Stage 3 (and throughout fruiting for continuous bloomers like Papaya)
            if (flowerInstancedMesh) {
                if (activeCropId === "papaya") {
                    dummy.scale.set(s, s, s);
                } else if (currentGrowthStage === 3) {
                    dummy.scale.set(s, s, s);
                } else {
                    dummy.scale.set(0.001, 0.001, 0.001);
                }
                dummy.updateMatrix();
                flowerInstancedMesh.setMatrixAt(i, dummy.matrix);
            }

            // Root Growth (Underground expansion)
            if (rootInstancedMesh) {
                const rScale = d.scale * (0.35 + 0.65 * Math.pow(progress, 0.65));
                dummy.scale.set(rScale, rScale, rScale);
                dummy.updateMatrix();
                rootInstancedMesh.setMatrixAt(i, dummy.matrix);
            }
        }

        stemInstancedMesh.instanceMatrix.needsUpdate = true;
        leafInstancedMesh.instanceMatrix.needsUpdate = true;
        if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
        if (calyxInstancedMesh) calyxInstancedMesh.instanceMatrix.needsUpdate = true;
        if (flowerInstancedMesh) flowerInstancedMesh.instanceMatrix.needsUpdate = true;
        if (rootInstancedMesh) rootInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Dynamic Fruit Ripening Color
    if (currentFruitMat) {
        if (activeCropId === "tomato") {
            currentFruitMat.color.copy(getTomatoRipeningColor(currentGrowthDay, maxCropDays));
            currentFruitMat.needsUpdate = true;
        } else if (activeCropId === "chili") {
            currentFruitMat.color.setHex(0xffffff); // Pure white base so multi-stage vertex colors shine through with 100% PBR accuracy!
            currentFruitMat.needsUpdate = true;
        } else if (activeCropId === "papaya") {
            currentFruitMat.color.setHex(0xffffff); // Full vertex color fidelity for multi-tier ripening
            currentFruitMat.needsUpdate = true;
        } else if (activeCropId === "carrot") {
            currentFruitMat.color.setHex(0xffffff); // Allow vibrant beta-carotene & green collar texture to show fully
            currentFruitMat.needsUpdate = true;
        }
    }

    updateTimelineUI();
    updateFieldSpatialPins(activeCropId);
    requestShadowUpdate();
}

/**
 * Returns crop-accurate stage name based on window.CROPS_DATABASE
 */
function getCropStageName(cropId, stageId, isBn = true) {
    if (window.CROPS_DATABASE) {
        const crop = window.CROPS_DATABASE.find(c => c.id === cropId);
        if (crop && crop.stages && crop.stages[stageId - 1]) {
            const st = crop.stages[stageId - 1];
            return isBn ? `${stageId}. ${st.stage_name_bn}` : `${stageId}. ${st.stage_name}`;
        }
    }
    // Fallback names
    const fallbackBn = ["১. বীজতলা ও চারা", "২. অঙ্গজ বৃদ্ধি", "৩. ফুল ও ফল গঠন", "৪. ফল পুষ্ট ও পাকা", "৫. ফসল সংগ্রহ"];
    const fallbackEn = ["1. Seedling", "2. Vegetative Growth", "3. Flowering & Fruit Set", "4. Fruit Ripening", "5. Harvest Ready"];
    return isBn ? fallbackBn[stageId - 1] : fallbackEn[stageId - 1];
}

// =============================================================================
// 6. GPU VERTEX-SHADER WIND SWAY
// =============================================================================
function injectWindShader(material) {
    if (!material) return;
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = windUniforms.uTime;
        shader.uniforms.uWindStrength = windUniforms.uWindStrength;

        shader.vertexShader = `
            uniform float uTime;
            uniform float uWindStrength;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `
            #include <begin_vertex>
            float hFactor = clamp(transformed.y * 1.15, 0.0, 3.2);
            // Smooth natural wind sway wave: Math.sin(time * 2.0 + x * 0.5 + z * 0.3) * 0.06
            float wavePhase = uTime * 2.0 + transformed.x * 0.5 + transformed.z * 0.3;
            float gust = sin(wavePhase) * 0.06 * hFactor * uWindStrength;
            float flutter = sin(uTime * 4.2 + transformed.y * 5.0) * 0.014 * hFactor * uWindStrength;
            float swayZ = cos(uTime * 1.7 + transformed.z * 0.6) * 0.042 * hFactor * uWindStrength;

            transformed.x += (gust + flutter);
            transformed.z += swayZ;
            transformed.y -= (abs(gust) + abs(swayZ)) * 0.08;
            `
        );
    };
}

// =============================================================================
// 7. DYNAMIC PBR SOIL SYSTEM
// =============================================================================
function initTerrain() {
    const mobile = isMobileDevice();
    const size = 16;
    const segments = mobile ? 64 : 128;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const count = posAttr.count;
    const furrowFreq = Math.PI / ROW_SPACING;

    const colors = new Float32Array(count * 3);
    const colRidge = new THREE.Color(0x3a2414); // Rich moist loamy ridge crest (মাটির আইল)
    const colTrench = new THREE.Color(0x190e06); // Dark wet drainage furrow trench (সেচ নালা)
    const colBund = new THREE.Color(0x4a301a); // Field border perimeter bund

    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        // Exact terrain height from shared elevation function
        const y = getTerrainHeightAt(x, z);
        posAttr.setY(i, y);

        const dist = Math.max(Math.abs(x), Math.abs(z));
        const tempCol = new THREE.Color();
        if (dist > 5.8) {
            tempCol.lerpColors(colRidge, colBund, 0.75);
        } else {
            const factor = (y + 0.02) / 0.24;
            tempCol.lerpColors(colTrench, colRidge, Math.max(0, Math.min(1, factor)));
        }

        colors[i * 3]     = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    soilMaterial = new THREE.MeshStandardMaterial({
        map: soilTexture,
        vertexColors: true,
        roughness: 0.90, // PBR hyper-realistic matte moist delta soil
        metalness: 0.02
    });

    terrainMesh = new THREE.Mesh(geometry, soilMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.matrixAutoUpdate = false;
    terrainMesh.updateMatrix();
    scene.add(terrainMesh);

    // Solid 3D Dark Earth Volume Block / Skirt extending from y = -4.0 up to y = 0.0
    const soilBoxGeo = new THREE.BoxGeometry(size, 4.0, size);
    soilBoxGeo.translate(0, -2.0, 0);
    const soilBoxMat = new THREE.MeshStandardMaterial({
        color: 0x23160a,
        roughness: 0.95,
        metalness: 0.02
    });
    soilVolumeMesh = new THREE.Mesh(soilBoxGeo, soilBoxMat);
    soilVolumeMesh.position.set(0, 0, 0);
    soilVolumeMesh.receiveShadow = true;
    soilVolumeMesh.matrixAutoUpdate = false;
    soilVolumeMesh.updateMatrix();
    scene.add(soilVolumeMesh);

    // Reflective Furrow Water layer
    const waterGeo = new THREE.PlaneGeometry(12.0, 12.0, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x142b1f,
        roughness: 0.06,
        metalness: 0.92,
        transparent: true,
        opacity: 0.88
    });

    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 0.088, 0);
    waterMesh.receiveShadow = true;
    waterMesh.visible = (activeCropId === "rice" || soilMoisturePercent > 70);
    waterMesh.matrixAutoUpdate = false;
    waterMesh.updateMatrix();
    scene.add(waterMesh);
}

export function updateSoilMoisture(percent) {
    soilMoisturePercent = Math.max(10, Math.min(100, percent));

    if (soilMaterial) {
        const t = (soilMoisturePercent - 10) / 90;
        soilMaterial.roughness = THREE.MathUtils.lerp(0.92, 0.22, t);
        soilMaterial.metalness = THREE.MathUtils.lerp(0.02, 0.28, t);
        soilMaterial.needsUpdate = true;
    }

    if (waterMesh) {
        waterMesh.visible = (activeCropId === "rice" || soilMoisturePercent >= 68);
    }

    requestShadowUpdate();
    updateFieldSpatialPins(activeCropId, percent);
    updateHUDStatusCards();
}
window.updateSoilMoisture = updateSoilMoisture;

// =============================================================================
// 8. REALISTIC WEATHER & PARTICLE VFX (SLANTED RAIN, MIST, FERTILIZER GLOW)
// =============================================================================

function initRealisticRainSystem() {
    const mobile = isMobileDevice();
    const streakCount = mobile ? 500 : 1800;
    const positions = new Float32Array(streakCount * 6);
    rainPosArray = positions;
    rainVelArray = new Float32Array(streakCount);

    for (let i = 0; i < streakCount; i++) {
        const x = (Math.random() - 0.5) * 16.0;
        const y = Math.random() * 12.0;
        const z = (Math.random() - 0.5) * 16.0;

        positions[i * 6]     = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;

        positions[i * 6 + 3] = x + 0.04;
        positions[i * 6 + 4] = y - 0.45;
        positions[i * 6 + 5] = z + 0.02;

        rainVelArray[i] = 0.28 + Math.random() * 0.16;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.LineBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.65,
        linewidth: 1.5
    });

    rainLineSegments = new THREE.LineSegments(rainGeo, rainMat);
    rainLineSegments.visible = false;
    scene.add(rainLineSegments);
}

function initSprayMistSystem() {
    const mobile = isMobileDevice();
    const count = mobile ? 180 : 400;
    sprayMistGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 8.0;
        pos[i * 3 + 1] = 0.4 + Math.random() * 0.6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8.0;
        life[i] = Math.random();
    }

    sprayMistGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sprayMistGeo.setAttribute("life", new THREE.BufferAttribute(life, 1));

    const mistMat = new THREE.PointsMaterial({
        color: 0xa7f3d0,
        size: 0.16,
        transparent: true,
        opacity: 0.45
    });

    sprayMistParticles = new THREE.Points(sprayMistGeo, mistMat);
    sprayMistParticles.visible = false;
    scene.add(sprayMistParticles);
}

function initFertilizerGlowSystem() {
    const mobile = isMobileDevice();
    const count = mobile ? 150 : 350;
    fertilizerGlowGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 8.0;
        pos[i * 3 + 1] = 0.1 + Math.random() * 0.7;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8.0;
        life[i] = Math.random();
    }

    fertilizerGlowGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    fertilizerGlowGeo.setAttribute("life", new THREE.BufferAttribute(life, 1));

    const glowMat = new THREE.PointsMaterial({
        color: 0x4ade80,
        size: 0.14,
        transparent: true,
        opacity: 0.8
    });

    fertilizerGlowParticles = new THREE.Points(fertilizerGlowGeo, glowMat);
    fertilizerGlowParticles.visible = false;
    scene.add(fertilizerGlowParticles);
}

function initSprinklerSystem() {
    const positions = [
        new THREE.Vector3(-3.2, 0.2, -3.2),
        new THREE.Vector3(3.2, 0.2, -3.2),
        new THREE.Vector3(-3.2, 0.2, 3.2),
        new THREE.Vector3(3.2, 0.2, 3.2)
    ];

    sprinklerRisers = [];

    positions.forEach((pos) => {
        const group = new THREE.Group();
        group.position.copy(pos);

        const riserGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.65, 8);
        const riserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        const riser = new THREE.Mesh(riserGeo, riserMat);
        riser.position.y = 0.32;
        riser.matrixAutoUpdate = false;
        riser.updateMatrix();
        group.add(riser);

        const headGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.08, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.68;

        const armGeo = new THREE.BoxGeometry(0.24, 0.02, 0.02);
        const arm = new THREE.Mesh(armGeo, headMat);
        arm.position.y = 0.68;
        head.add(arm);

        group.add(head);
        group.matrixAutoUpdate = false;
        group.updateMatrix();
        scene.add(group);

        sprinklerRisers.push({ group, head });
    });

    const particleCount = 1400;
    sprinklerWaterGeo = new THREE.BufferGeometry();
    const dropletPos = new Float32Array(particleCount * 3);
    const dropletLife = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        dropletPos[i * 3]     = 0;
        dropletPos[i * 3 + 1] = -10;
        dropletPos[i * 3 + 2] = 0;
        dropletLife[i] = Math.random();
    }

    sprinklerWaterGeo.setAttribute("position", new THREE.BufferAttribute(dropletPos, 3));
    sprinklerWaterGeo.setAttribute("life", new THREE.BufferAttribute(dropletLife, 1));

    const dropletMat = new THREE.PointsMaterial({
        color: 0x67e8f9,
        size: 0.09,
        transparent: true,
        opacity: 0.85
    });

    sprinklerWaterParticles = new THREE.Points(sprinklerWaterGeo, dropletMat);
    sprinklerWaterParticles.visible = false;
    scene.add(sprinklerWaterParticles);
}

export function setWeatherMode(mode) {
    currentActiveWeather = mode;

    const btnSunny = document.getElementById("btnWeatherSunny");
    const btnRain = document.getElementById("btnWeatherRain");
    const btnWind = document.getElementById("btnWeatherWind");
    const btnSprinkler = document.getElementById("btnWeatherSprinkler");

    [btnSunny, btnRain, btnWind, btnSprinkler].forEach(b => b?.classList.remove("active"));

    if (mode === "sunny") {
        isRaining = false;
        isSprinklerActive = false;
        windUniforms.uWindStrength.value = 1.0;
        if (rainLineSegments) rainLineSegments.visible = false;
        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = false;
        updateSkyTimeOfDay(45);
        btnSunny?.classList.add("active");
    } else if (mode === "rain") {
        isRaining = true;
        isSprinklerActive = false;
        windUniforms.uWindStrength.value = 2.4;
        if (rainLineSegments) rainLineSegments.visible = true;
        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = false;
        updateSkyTimeOfDay(68);
        updateSoilMoisture(soilMoisturePercent + 15);
        btnRain?.classList.add("active");
    } else if (mode === "wind") {
        isRaining = false;
        isSprinklerActive = false;
        windUniforms.uWindStrength.value = 3.6;
        if (rainLineSegments) rainLineSegments.visible = false;
        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = false;
        btnWind?.classList.add("active");
    } else if (mode === "sprinkler") {
        isSprinklerActive = !isSprinklerActive;
        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = isSprinklerActive;
        if (isSprinklerActive) {
            updateSoilMoisture(Math.min(95, soilMoisturePercent + 20));
            btnSprinkler?.classList.add("active");
        } else {
            btnSprinkler?.classList.remove("active");
        }
    }

    requestShadowUpdate();
    updateFieldSpatialPins(activeCropId, soilMoisturePercent);
    updateHUDStatusCards();
}
window.setWeatherMode = setWeatherMode;

// =============================================================================
// 9. PHOTOREALISTIC LIGHTING & SKY (RICH ATMOSPHERIC GRADIENTS, ZERO WASHOUT)
// =============================================================================
function createSkyGradientTexture(zenithColor, midColor, horizonColor, hasStars = false) {
    const canvas = document.createElement("canvas");
    canvas.width = hasStars ? 512 : 128;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.Color(horizonColor || zenithColor);

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, zenithColor);
    if (midColor) {
        grad.addColorStop(0.38, midColor);
        grad.addColorStop(0.72, horizonColor || midColor);
    }
    grad.addColorStop(1.0, horizonColor || midColor || zenithColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 512);

    if (hasStars) {
        ctx.fillStyle = "#ffffff";
        for (let s = 0; s < 180; s++) {
            const sx = Math.random() * canvas.width;
            const sy = Math.random() * 340;
            const sr = 0.5 + Math.random() * 1.4;
            ctx.globalAlpha = 0.35 + Math.random() * 0.65;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

export function initSmartFarmIoTNodes() {
    if (iotNodesGroup) {
        scene.remove(iotNodesGroup);
    }
    iotNodesGroup = new THREE.Group();
    iotNodesGroup.name = "SmartFarmIoTNodes";
    iotLights = [];
    iotLedMaterials = [];

    const nodePositions = [
        { x: -3.6, z: -2.8, color: 0x22c55e },
        { x: 3.6, z: -3.2, color: 0x38bdf8 },
        { x: -3.6, z: 2.8, color: 0x38bdf8 },
        { x: 3.6, z: 2.8, color: 0x22c55e }
    ];

    const poleMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.35
    });

    const solarMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2
    });

    nodePositions.forEach((pos) => {
        const nodeG = new THREE.Group();
        const y = getTerrainHeightAt(pos.x, pos.z);
        nodeG.position.set(pos.x, y, pos.z);

        // Slender Weatherproof Pole
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 1.15, 8), poleMat);
        pole.position.y = 1.15 * 0.5;
        pole.castShadow = true;
        pole.matrixAutoUpdate = false;
        pole.updateMatrix();
        nodeG.add(pole);

        // Sensor Hub Box
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.09), poleMat);
        box.position.y = 0.92;
        box.matrixAutoUpdate = false;
        box.updateMatrix();
        nodeG.add(box);

        // Solar Collector Panel
        const solar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.16), solarMat);
        solar.position.set(0, 1.16, 0.02);
        solar.rotation.x = 0.35;
        solar.matrixAutoUpdate = false;
        solar.updateMatrix();
        nodeG.add(solar);

        // Dual IoT Status LEDs (Green & Cyan)
        const ledMat1 = new THREE.MeshStandardMaterial({
            color: pos.color,
            emissive: pos.color,
            emissiveIntensity: 0.6,
            roughness: 0.2
        });
        const ledMat2 = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x22c55e,
            emissiveIntensity: 0.6,
            roughness: 0.2
        });
        iotLedMaterials.push(ledMat1, ledMat2);

        const led1 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), ledMat1);
        led1.position.set(-0.03, 0.92, 0.05);
        led1.matrixAutoUpdate = false;
        led1.updateMatrix();
        nodeG.add(led1);

        const led2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), ledMat2);
        led2.position.set(0.03, 0.92, 0.05);
        led2.matrixAutoUpdate = false;
        led2.updateMatrix();
        nodeG.add(led2);

        // Ground illumination PointLight (Activated at Night)
        const pLight = new THREE.PointLight(pos.color, 0.0, 4.8, 2.0);
        pLight.position.set(0, 1.05, 0);
        pLight.matrixAutoUpdate = false;
        pLight.updateMatrix();
        nodeG.add(pLight);
        iotLights.push(pLight);

        nodeG.matrixAutoUpdate = false;
        nodeG.updateMatrix();
        iotNodesGroup.add(nodeG);
    });

    iotNodesGroup.matrixAutoUpdate = false;
    iotNodesGroup.updateMatrix();
    scene.add(iotNodesGroup);
}
window.initSmartFarmIoTNodes = initSmartFarmIoTNodes;

export function setTimeOfDayMode(mode = "noon") {
    const normalizedMode = (mode || "noon").toString().trim().toLowerCase();
    currentTimeOfDayMode = normalizedMode;

    // 1. Sync Segmented UI Buttons Across All Matching Selectors
    const buttons = document.querySelectorAll(".tod-segment-btn, .time-btn, [data-time]");
    buttons.forEach((btn) => {
        const btnTime = (btn.dataset.time || btn.getAttribute("data-time") || "").trim().toLowerCase();
        if (btnTime === normalizedMode) {
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
        } else {
            btn.classList.remove("active");
            btn.setAttribute("aria-pressed", "false");
        }
    });

    if (!scene) return;

    // 2. Configure Dynamic Atmosphere, Lights & Sky (Vibrant, Zero Washout)
    if (normalizedMode === "morning") {
        // 🌅 Morning Mode (Warm amber sunrise: deep azure zenith #2c5282 -> rich orange #dd6b20 -> warm golden horizon #fbd38d)
        const skyTexture = createSkyGradientTexture("#2c5282", "#dd6b20", "#fbd38d", false);
        scene.background = skyTexture;
        if (scene.fog) {
            scene.fog.color.setHex(0xfbd38d);
            scene.fog.density = 0.005;
        }
        if (sunLight) {
            sunLight.position.set(45, 18, 25);
            sunLight.color.setHex(0xffaa5e);
            sunLight.intensity = 2.2;
            sunLight.castShadow = true;
        }
        if (hemiLight) {
            hemiLight.color.setHex(0xffd966);
            hemiLight.groundColor.setHex(0x5c4028);
            hemiLight.intensity = 1.25;
        }
        if (ambientLight) {
            ambientLight.color.setHex(0xffeedd);
            ambientLight.intensity = 0.70;
        }
        if (renderer) {
            renderer.toneMappingExposure = 1.0;
            renderer.setClearColor(0xfbd38d, 1.0);
        }
        if (sky) {
            sky.visible = false;
        }
        // IoT Night Glow OFF
        iotLights.forEach(l => { l.intensity = 0.0; });
        iotLedMaterials.forEach(m => { m.emissiveIntensity = 0.5; });

    } else if (normalizedMode === "night") {
        // 🌙 Night Mode (Deep starry midnight #050b14 -> dark indigo #0f1c30 -> dusk horizon #1a2e4a)
        const skyTexture = createSkyGradientTexture("#050b14", "#0f1c30", "#1a2e4a", true);
        scene.background = skyTexture;
        if (scene.fog) {
            scene.fog.color.setHex(0x0f1c30);
            scene.fog.density = 0.008;
        }
        if (sunLight) {
            // Reused as directional moonlight
            sunLight.position.set(-30, 45, -20);
            sunLight.color.setHex(0x8ab4f8);
            sunLight.intensity = 0.95;
            sunLight.castShadow = true;
        }
        if (hemiLight) {
            hemiLight.color.setHex(0x284268);
            hemiLight.groundColor.setHex(0x101820);
            hemiLight.intensity = 0.70;
        }
        if (ambientLight) {
            ambientLight.color.setHex(0x1e293b);
            ambientLight.intensity = 0.40;
        }
        if (renderer) {
            renderer.toneMappingExposure = 0.90;
            renderer.setClearColor(0x050b14, 1.0);
        }
        if (sky) {
            sky.visible = false; // Starry canvas takes over
        }
        // IoT Night Glow ON (Warm glowing LEDs & ground point lights)
        iotLights.forEach(l => { l.intensity = 1.6; });
        iotLedMaterials.forEach(m => { m.emissiveIntensity = 2.8; });

    } else {
        // ☀️ Noon Mode (Rich cobalt-azure zenith #1b5ea8 -> cerulean mid #4299e1 -> soft cyan horizon #bee3f8)
        const skyTexture = createSkyGradientTexture("#1b5ea8", "#4299e1", "#bee3f8", false);
        scene.background = skyTexture;
        if (scene.fog) {
            scene.fog.color.setHex(0xa0d2eb);
            scene.fog.density = 0.0035;
        }
        if (sunLight) {
            sunLight.position.set(15, 65, 20);
            sunLight.color.setHex(0xfff8e7);
            sunLight.intensity = 2.5;
            sunLight.castShadow = true;
        }
        if (hemiLight) {
            hemiLight.color.setHex(0x9ad1f5);
            hemiLight.groundColor.setHex(0x5c4028);
            hemiLight.intensity = 1.50;
        }
        if (ambientLight) {
            ambientLight.color.setHex(0xdceefb);
            ambientLight.intensity = 0.78;
        }
        if (renderer) {
            renderer.toneMappingExposure = 0.98;
            renderer.setClearColor(0xa0d2eb, 1.0);
        }
        if (sky) {
            sky.visible = false;
        }
        // IoT Night Glow OFF
        iotLights.forEach(l => { l.intensity = 0.0; });
        iotLedMaterials.forEach(m => { m.emissiveIntensity = 0.5; });
    }
    requestShadowUpdate();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
window.setTimeOfDayMode = setTimeOfDayMode;

function initEnvironmentLighting() {
    ambientLight = new THREE.AmbientLight(0xdceefb, 0.78);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0x9ad1f5, 0x5c4028, 1.50);
    scene.add(hemiLight);

    const mobile = isMobileDevice();
    sunLight = new THREE.DirectionalLight(0xfff8e8, 2.6);
    sunLight.position.set(15, 65, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = mobile ? 1024 : 2048;
    sunLight.shadow.mapSize.height = mobile ? 1024 : 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 32;
    sunLight.shadow.camera.left = -9;
    sunLight.shadow.camera.right = 9;
    sunLight.shadow.camera.top = 9;
    sunLight.shadow.camera.bottom = -9;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    sky = new Sky();
    sky.scale.setScalar(450000);
    sky.visible = false; // Disabled so rich gradient canvas texture is never obscured by Rayleigh wash
    scene.add(sky);

    sun = new THREE.Vector3();

    // Soft daylight atmospheric fog with subtle horizon mist
    scene.fog = new THREE.FogExp2(0xdceefb, 0.005);

    setTimeOfDayMode("noon");
}

export function updateSkyTimeOfDay(sliderVal) {
    if (sliderVal < 30) setTimeOfDayMode("morning");
    else if (sliderVal > 75) setTimeOfDayMode("night");
    else setTimeOfDayMode("noon");
}
window.updateSkyTimeOfDay = updateSkyTimeOfDay;

// =============================================================================
// 10. TRUE SPATIAL AR ANCHORS & 3D MACRO INSPECTION MODE (ZERO ALLOCATION)
// =============================================================================
function updateSpatialArAnchors() {
    if (!containerEl || !camera) return;

    const width = cachedContainerWidth || containerEl.clientWidth || window.innerWidth;
    const height = cachedContainerHeight || containerEl.clientHeight || 640;
    const isMobile = width < 768;

    if (isMobile) {
        // On mobile (<768px), badges are docked cleanly in top flex row below HUD dock without overlap
        for (let i = 0; i < SPATIAL_ANCHORS.length; i++) {
            const anchor = SPATIAL_ANCHORS[i];
            if (!anchor.el) {
                anchor.el = document.getElementById(anchor.id);
            }
            if (anchor.el) {
                anchor.el.style.transform = "none";
                anchor.el.style.left = "";
                anchor.el.style.top = "";
                anchor.el.style.display = "inline-flex";
            }
        }
    } else {
        // On desktop, project into 3D world space with viewport boundary clamping and anti-collision separation (minimum 165px separation!)
        let lastX = -999, lastY = -999;
        for (let i = 0; i < SPATIAL_ANCHORS.length; i++) {
            const anchor = SPATIAL_ANCHORS[i];
            if (!anchor.el) {
                anchor.el = document.getElementById(anchor.id);
            }
            const el = anchor.el;
            if (!el) continue;

            _projScratchVec.copy(anchor.worldPos).project(camera);

            // Check if anchor is in front of camera
            if (_projScratchVec.z < 1.0 && _projScratchVec.x >= -1.1 && _projScratchVec.x <= 1.1 && _projScratchVec.y >= -1.1 && _projScratchVec.y <= 1.1) {
                let screenX = (_projScratchVec.x * 0.5 + 0.5) * width;
                let screenY = (-_projScratchVec.y * 0.5 + 0.5) * height;

                const pillWidth = el.offsetWidth || 230;
                const pillHeight = el.offsetHeight || 34;

                // Viewport boundary clamping so pills never bleed off canvas or collide with Top HUD
                screenX = Math.min(Math.max(16 + pillWidth * 0.5, screenX), width - pillWidth * 0.5 - 16);
                screenY = Math.min(Math.max(115, screenY), height - pillHeight - 20);

                // Anti-collision separation between adjacent pins (minimum horizontal separation!)
                if (Math.abs(screenX - lastX) < (pillWidth * 0.85) && Math.abs(screenY - lastY) < 42) {
                    if (screenY + 44 < height - pillHeight - 20) {
                        screenY += 44;
                    } else if (screenX - (pillWidth * 0.85) > (16 + pillWidth * 0.5)) {
                        screenX -= (pillWidth * 0.85);
                    }
                }
                lastX = screenX;
                lastY = screenY;

                el.style.left = "";
                el.style.top = "";
                el.style.transform = `translate3d(${Math.round(screenX - pillWidth * 0.5)}px, ${Math.round(screenY - pillHeight)}px, 0)`;
                el.style.display = "inline-flex";
            } else {
                el.style.display = "none";
            }
        }
    }

    // Update Macro Holographic Ring position dynamically anchored to inspected plant
    if (isMacroViewActive) {
        if (!_ringEl) {
            _ringEl = document.getElementById("arMacroInspectionRing");
        }
        if (_ringEl) {
            _projScratchVec.copy(activeInspectedPlantPos).project(camera);

            if (_projScratchVec.z < 1.0 && _projScratchVec.x >= -1.2 && _projScratchVec.x <= 1.2 && _projScratchVec.y >= -1.2 && _projScratchVec.y <= 1.2) {
                const screenX = (_projScratchVec.x * 0.5 + 0.5) * width;
                const screenY = (-_projScratchVec.y * 0.5 + 0.5) * height;
                _ringEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
                _ringEl.style.display = "flex";
            } else {
                _ringEl.style.display = "none";
            }
        }
    }
}

/**
 * Dynamically updates 3D Field Spatial Pins (Row 4 crop icon & label, Zone A moisture)
 * based on selected crop and active growth stage
 */
export function updateFieldSpatialPins(cropId = "tomato", soilMoist = null) {
    const isBn = (window.currentAppLanguage === "bn");
    const key = normalizeCropId(cropId);
    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === key) : null;
    const icon = CROP_FALLBACK_ICONS[key] || (dbCrop ? dbCrop.icon : "🌱") || "🌱";
    const cropName = getCropDisplayName(key, isBn);

    // Dynamic Row 4 Crop Callout
    const cropIconEl = document.getElementById("arPinCropIcon") || document.querySelector("#arPinRow4 .ar-pin-icon");
    if (cropIconEl) cropIconEl.textContent = icon;

    const cropLabelEl = document.getElementById("arPinCropLabel") || document.querySelector("#arPinRow4 .ar-pin-label");
    if (cropLabelEl) {
        if (key === "cucumber") {
            if (isBn) {
                cropLabelEl.textContent = currentGrowthStage >= 4
                    ? "সারি ৪: তোলাযোগ্য শসা (ফসল তোলার উপযোগী)"
                    : "সারি ৪: পরিপক্ক শসা (৬ দিনে পরিপক্ক)";
            } else {
                cropLabelEl.textContent = currentGrowthStage >= 4
                    ? "Row 4: Crisp Cucumber (Harvest-Ready)"
                    : "Row 4: Crisp Cucumber (Ready in 6 Days)";
            }
        } else if (key === "papaya") {
            if (isBn) {
                cropLabelEl.textContent = currentGrowthStage >= 4
                    ? "সারি ৪: পরিপক্ক পেঁপে (ফসল তোলার উপযোগী)"
                    : (currentGrowthStage === 3
                        ? "সারি ৪: পেঁপে গাছে ফলন (৬ দিনে পরিপক্ক)"
                        : "সারি ৪: বাড়ন্ত পেঁপে গাছ (সুস্থ)");
            } else {
                cropLabelEl.textContent = currentGrowthStage >= 4
                    ? "Row 4: Harvest-Ready Papaya (Optimal)"
                    : (currentGrowthStage === 3
                        ? "Row 4: Ripening Papaya (Ready in 6 Days)"
                        : "Row 4: Vegetative Papaya (Healthy)");
            }
        } else if (isBn) {
            if (currentGrowthStage >= 4) {
                cropLabelEl.textContent = `সারি ৪: পাকা ${cropName} (ফসল তোলার উপযোগী)`;
            } else if (currentGrowthStage === 3) {
                cropLabelEl.textContent = `সারি ৪: ${cropName} ফুল ও ফলন (৬ দিনে পরিপক্ক)`;
            } else {
                cropLabelEl.textContent = `সারি ৪: বাড়ন্ত ${cropName} (সুস্থ চারা)`;
            }
        } else {
            if (currentGrowthStage >= 4) {
                cropLabelEl.textContent = `Row 4: Harvest-Ready ${cropName} (Optimal)`;
            } else if (currentGrowthStage === 3) {
                cropLabelEl.textContent = `Row 4: ${cropName} Ripening (Ready in 6 Days)`;
            } else {
                cropLabelEl.textContent = `Row 4: Vegetative ${cropName} (Healthy)`;
            }
        }
    }

    // Dynamic Zone A Soil Moisture Callout
    const moistPct = Math.round(soilMoist !== null ? soilMoist : soilMoisturePercent);
    const moistLabelEl = document.getElementById("arPinZoneALabel") || document.querySelector("#arPinZoneA .ar-pin-label");
    if (moistLabelEl) {
        const bnMoist = isBn ? String(moistPct).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]) : moistPct;
        moistLabelEl.textContent = isBn
            ? `Zone A: ${bnMoist}% আর্দ্রতা (${moistPct >= 60 ? 'অনুকূল' : 'সেচ প্রয়োজন'})`
            : `Zone A: ${moistPct}% Moisture (${moistPct >= 60 ? 'Optimal' : 'Low'})`;
    }
}
window.updateFieldSpatialPins = updateFieldSpatialPins;

let isSprinklerActiveState = true;

export function initSpatialMarkerInteractions() {
    const pinZoneA = document.getElementById("arPinZoneA");
    const pinRow4 = document.getElementById("arPinRow4");
    const pinSprinkler = document.getElementById("arPinSprinkler");
    const popover = document.getElementById("spatialMarkerPopover");
    const closeBtn = document.getElementById("btnMarkerPopoverClose");
    const iconEl = document.getElementById("markerPopoverIcon");
    const titleEl = document.getElementById("markerPopoverTitle");
    const subEl = document.getElementById("markerPopoverSub");
    const bodyEl = document.getElementById("markerPopoverBody");
    const footerEl = document.getElementById("markerPopoverFooter");

    if (!popover) return;

    function hidePopover() {
        popover.style.display = "none";
        [pinZoneA, pinRow4, pinSprinkler].forEach(p => p?.classList.remove("active-spatial-pin"));
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", hidePopover);
    }

    function showPopover(markerType) {
        const isBn = (window.currentAppLanguage === "bn");
        [pinZoneA, pinRow4, pinSprinkler].forEach(p => p?.classList.remove("active-spatial-pin"));

        if (markerType === "zoneA") {
            pinZoneA?.classList.add("active-spatial-pin");
            if (iconEl) iconEl.textContent = "💧";
            if (titleEl) titleEl.textContent = isBn ? "জোন এ: মাটির আর্দ্রতা টেলিমেট্রি" : "Zone A: Soil Moisture Telemetry";
            if (subEl) subEl.textContent = isBn ? "ময়মনসিংহ ফিল্ড ০২ · নাসা SMAP লাইভ" : "Mymensingh Field 02 · NASA SMAP Live";
            if (bodyEl) {
                const moist = Math.round(soilMoisturePercent || 58);
                const moistStatus = moist >= 60 ? (isBn ? "অনুকূল (Optimal)" : "Optimal") : (isBn ? "কম (Low)" : "Low");
                bodyEl.innerHTML = `
                    <div class="popover-metric-row">
                        <span>${isBn ? "মাটির আর্দ্রতা:" : "Soil Moisture:"}</span>
                        <strong style="color: ${moist >= 60 ? '#43ef8c' : '#fbbf24'};">${moist}% (${moistStatus})</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "শিকড় অঞ্চল গভীরতা:" : "Root Zone Depth:"}</span>
                        <strong>15–30 cm (GWETROOT)</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "পানি প্রবেশ হার:" : "Infiltration Rate:"}</span>
                        <strong>14 mm/hr (${isBn ? "উত্তম নিষ্কাশন" : "Good"})</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "সেচ পরামর্শ:" : "Irrigation Advisory:"}</span>
                        <strong style="color: #43ef8c;">${isBn ? "বর্তমানে সেচের প্রয়োজন নেই" : "No Irrigation Needed"}</strong>
                    </div>
                `;
            }
            if (footerEl) {
                footerEl.innerHTML = `
                    <button type="button" class="popover-btn popover-btn-primary" id="btnTestMoistureBoost">
                        ${isBn ? "💧 +১০% আর্দ্রতা যোগ করুন" : "💧 +10% Test Water"}
                    </button>
                    <button type="button" class="popover-btn popover-btn-secondary" id="btnPopCloseInner">
                        ${isBn ? "বন্ধ করুন" : "Close"}
                    </button>
                `;
                document.getElementById("btnTestMoistureBoost")?.addEventListener("click", () => {
                    updateSoilMoisture(Math.min(100, (soilMoisturePercent || 58) + 10));
                    updateFieldSpatialPins(activeCropId);
                    showPopover("zoneA");
                });
                document.getElementById("btnPopCloseInner")?.addEventListener("click", hidePopover);
            }
        } else if (markerType === "row4") {
            pinRow4?.classList.add("active-spatial-pin");
            if (iconEl) iconEl.textContent = "🌾";
            const cropName = getCropDisplayName(activeCropId, isBn);
            if (titleEl) titleEl.textContent = isBn ? `সারি ৪: ${cropName} পরিপক্কতা` : `Row 4: ${cropName} Ripening Cluster`;
            if (subEl) subEl.textContent = isBn ? "ডিজিটাল টুইন ক্রপ সেন্সর ক্লাস্টার" : "Digital Twin Crop Sensor Cluster";
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <div class="popover-metric-row">
                        <span>${isBn ? "বর্তমান ফসল:" : "Active Crop:"}</span>
                        <strong style="color: #43ef8c;">${cropName}</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "বৃদ্ধির পর্যায়:" : "Growth Stage:"}</span>
                        <strong>${isBn ? "পরিপক্কতা (Maturity)" : "Maturity (92%)"}</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "উদ্ভিদ স্বাস্থ্য সূচক:" : "Canopy NDVI:"}</span>
                        <strong style="color: #43ef8c;">0.68 NDVI (${isBn ? "সবুজ ও পুষ্ট" : "Optimal"})</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "সম্ভাব্য কর্তন:" : "Harvest Est.:"}</span>
                        <strong>${isBn ? "৬–৮ দিনের মধ্যে প্রস্তুত" : "Ready in 6–8 Days"}</strong>
                    </div>
                `;
            }
            if (footerEl) {
                footerEl.innerHTML = `
                    <button type="button" class="popover-btn popover-btn-primary" id="btnMacroInspect">
                        ${isBn ? "🔍 ক্লোজ-আপ দেখুন" : "🔍 Crop Close-Up"}
                    </button>
                    <button type="button" class="popover-btn popover-btn-secondary" id="btnPopCloseInner">
                        ${isBn ? "বন্ধ করুন" : "Close"}
                    </button>
                `;
                document.getElementById("btnMacroInspect")?.addEventListener("click", () => {
                    const btnMacro = document.getElementById("btnViewCloseup");
                    if (btnMacro) btnMacro.click();
                    hidePopover();
                });
                document.getElementById("btnPopCloseInner")?.addEventListener("click", hidePopover);
            }
        } else if (markerType === "sprinkler") {
            pinSprinkler?.classList.add("active-spatial-pin");
            if (iconEl) iconEl.textContent = "💦";
            if (titleEl) titleEl.textContent = isBn ? "নোড #২: স্মার্ট সেচ পাম্প" : "Node #2: IoT Irrigation Pump";
            if (subEl) subEl.textContent = isBn ? "স্বয়ংক্রিয় সৌরচালিত ড্রিপ/স্প্রিংকলার" : "Solar Automated Drip & Sprinkler Node";
            if (bodyEl) {
                const statusTxt = isSprinklerActiveState
                    ? (isBn ? "সক্রিয় (Active)" : "Active")
                    : (isBn ? "বিশ্রাম (Standby)" : "Standby");
                const statusCol = isSprinklerActiveState ? "#43ef8c" : "#94a99f";
                bodyEl.innerHTML = `
                    <div class="popover-metric-row">
                        <span>${isBn ? "পাম্পের অবস্থা:" : "Pump Status:"}</span>
                        <strong style="color: ${statusCol};">${statusTxt}</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "পানি প্রবাহ হার:" : "Flow Rate:"}</span>
                        <strong>18.5 L/min · 2.4 Bar</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "সৌর ব্যাটারি:" : "Solar Battery:"}</span>
                        <strong>94% · LoRaWAN Connected</strong>
                    </div>
                    <div class="popover-metric-row">
                        <span>${isBn ? "সেচ কাভারেজ:" : "Coverage:"}</span>
                        <strong>Zone A & Row 4 (Field 02)</strong>
                    </div>
                `;
            }
            if (footerEl) {
                const toggleBtnText = isSprinklerActiveState
                    ? (isBn ? "⏸️ পাম্প স্ট্যান্ডবাই করুন" : "⏸️ Switch to Standby")
                    : (isBn ? "▶️ পাম্প চালু করুন" : "▶️ Activate Pump");
                footerEl.innerHTML = `
                    <button type="button" class="popover-btn popover-btn-primary" id="btnToggleSprinkler">
                        ${toggleBtnText}
                    </button>
                    <button type="button" class="popover-btn popover-btn-secondary" id="btnPopCloseInner">
                        ${isBn ? "বন্ধ করুন" : "Close"}
                    </button>
                `;
                document.getElementById("btnToggleSprinkler")?.addEventListener("click", () => {
                    isSprinklerActiveState = !isSprinklerActiveState;
                    const spLabel = document.getElementById("arPinSprinklerLabel");
                    if (isSprinklerActiveState) {
                        executeActionIrrigate();
                        if (spLabel) spLabel.textContent = isBn ? "Node #2: সেচ পাম্প (Active)" : "Node #2: Irrigation Pump (Active)";
                    } else {
                        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = false;
                        if (spLabel) spLabel.textContent = isBn ? "Node #2: সেচ পাম্প (Standby)" : "Node #2: Irrigation Pump (Standby)";
                    }
                    showPopover("sprinkler");
                });
                document.getElementById("btnPopCloseInner")?.addEventListener("click", hidePopover);
            }
        }

        popover.style.display = "block";
    }

    pinZoneA?.addEventListener("click", () => showPopover("zoneA"));
    pinRow4?.addEventListener("click", () => showPopover("row4"));
    pinSprinkler?.addEventListener("click", () => showPopover("sprinkler"));

    // Keyboard support
    [pinZoneA, pinRow4, pinSprinkler].forEach(pin => {
        pin?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pin.click();
            }
        });
    });
}
window.initSpatialMarkerInteractions = initSpatialMarkerInteractions;

/**
 * Mobile-responsive dropdown label optimizer (<480px width: concise labels without mid-word cuts)
 */
export function formatDropdownLabelsForMobile() {
    const isMobile = (window.innerWidth <= 480);
    const isBn = (window.currentAppLanguage === "bn");

    const cropSelect = document.getElementById("cropSelect");
    if (cropSelect) {
        Array.from(cropSelect.options).forEach(opt => {
            const cropKey = opt.value;
            const icon = CROP_FALLBACK_ICONS[cropKey] || "🌱";
            const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropKey) : null;
            if (isMobile) {
                const shortName = dbCrop ? (isBn ? dbCrop.bangla_name : dbCrop.name) : cropKey;
                opt.textContent = `${icon} ${shortName}`;
            } else {
                const fullName = dbCrop
                    ? (isBn ? `${icon} ${dbCrop.bangla_name} (${dbCrop.name})` : `${icon} ${dbCrop.name} Field`)
                    : `${icon} ${cropKey}`;
                opt.textContent = fullName;
            }
        });
    }

    const locSelect = document.getElementById("farmLocationSelect");
    if (locSelect) {
        const shortNames = {
            mymensingh: isBn ? "📍 ময়মনসিংহ" : "📍 Mymensingh",
            bogura: isBn ? "📍 বগুড়া" : "📍 Bogura",
            rajshahi: isBn ? "📍 রাজশাহী" : "📍 Rajshahi",
            dinajpur: isBn ? "📍 দিনাজপুর" : "📍 Dinajpur",
            barishal: isBn ? "📍 বরিশাল" : "📍 Barishal",
            sylhet: isBn ? "📍 সিলেট" : "📍 Sylhet",
            cumilla: isBn ? "📍 কুমিল্লা" : "📍 Cumilla",
            rangpur: isBn ? "📍 রংপুর" : "📍 Rangpur",
            gps: isBn ? "📡 GPS খামার" : "📡 GPS Farm"
        };
        Array.from(locSelect.options).forEach(opt => {
            const locKey = opt.value;
            if (isMobile && shortNames[locKey]) {
                opt.textContent = shortNames[locKey];
            } else if (!isMobile) {
                if (locKey === "gps") {
                    opt.textContent = isBn ? "📡 আমার খামার GPS (My Farm GPS)" : "📡 My Farm GPS";
                } else if (shortNames[locKey]) {
                    opt.textContent = isBn
                        ? `${shortNames[locKey]} (${locKey.charAt(0).toUpperCase() + locKey.slice(1)})`
                        : `${shortNames[locKey]}`;
                }
            }
        });
    }
}
window.formatDropdownLabelsForMobile = formatDropdownLabelsForMobile;

/**
 * Updates floating live telemetry badge for the specifically tapped plant
 */
export function updatePlantInspectionBadge(instanceId = 0, cropId = "tomato") {
    const isBn = (window.currentAppLanguage === "bn");
    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropId) : null;
    const cropName = getCropDisplayName(cropId, isBn);

    const plant = instanceData[instanceId] || { rowIndex: 0, colIndex: 0, scale: 1.0 };
    const rowNum = (plant.rowIndex !== undefined ? plant.rowIndex : 0) + 1;
    const colNum = (plant.colIndex !== undefined ? plant.colIndex : 0) + 1;
    const plantNum = instanceId + 1;

    activeInspectedPlantData = { plantNum, rowNum, colNum, cropName, cropId, instanceId };

    const titleEl = document.getElementById("arCalloutCropTitle");
    if (titleEl) {
        titleEl.textContent = isBn
            ? `${cropName} • গাছ #${plantNum} (সারি ${rowNum}, প্লট ${colNum})`
            : `${cropName} • Plant #${plantNum} (Row ${rowNum}, Plot ${colNum})`;
    }

    const fruitEl = document.getElementById("arFruitCount");
    if (fruitEl) {
        if (cropId === "carrot") {
            fruitEl.textContent = isBn ? "১টি প্রধান কন্দমূল (Taproot) • ১৯.৫ সেমি" : "1 Primary Taproot • 19.5 cm";
        } else if (cropId === "chili") {
            fruitEl.textContent = isBn ? "৬টি / গাছ (ঝুলন্ত বাঁকা মরিচ)" : "6 / plant (Pendent curved chilies)";
        } else if (currentGrowthStage < 3) {
            fruitEl.textContent = isBn ? "বৃদ্ধি পর্যায় (Pre-Bloom)" : "Vegetative (Pre-Bloom)";
        } else {
            const count = Math.round(8 + ((plant.scale || 1.0) * 6));
            fruitEl.textContent = isBn ? `${count}টি / থোকা` : `${count} fruits / cluster`;
        }
    }

    const ripenessEl = document.getElementById("arRipeness");
    if (ripenessEl) {
        const pct = Math.min(100, Math.round((currentGrowthDay / maxCropDays) * 100));
        if (cropId === "tomato") {
            ripenessEl.textContent = isBn
                ? "৫৫% পাকা (লাল) · ২৫% ব্রেকার · ২০% কাঁচা"
                : "55% Ripe (Red) · 25% Breaker · 20% Green";
        } else if (cropId === "chili") {
            ripenessEl.textContent = isBn
                ? "৫০% পাকা (গাঢ় লাল) · ৩৩% ব্রেকার (কমলা) · ১৭% কাঁচা (সবুজ)"
                : "50% Ripe (Crimson) · 33% Breaker (Amber) · 17% Immature (Green)";
        } else if (cropId === "papaya") {
            ripenessEl.textContent = isBn
                ? "৪টি পাকা · ৫টি আধাপাকা · ৫টি কাঁচা"
                : "4 Ripe Amber · 5 Breaker · 5 Green";
        } else if (cropId === "cauliflower") {
            ripenessEl.textContent = isBn
                ? "১০০% ভরাট কুঁড়ি (Fractal Curd Ready)"
                : "100% Fully Formed Curd";
        } else if (cropId === "carrot") {
            ripenessEl.textContent = isBn
                ? "৯২% পরিপক্ব (মাটি থেকে উত্তোলনের উপযোগী)"
                : "92% Mature (Ready for Taproot Harvest)";
        } else {
            ripenessEl.textContent = isBn ? `${pct}% (পরিপক্বতা অনুপাত)` : `${pct}% (Ripeness Index)`;
        }
    }

    // Estimated Yield Metric
    const yieldEl = document.getElementById("arEstimatedYield");
    if (yieldEl) {
        const yields = {
            tomato: isBn ? "২.৮ - ৩.৪ কেজি / গাছ" : "2.8 - 3.4 kg / plant",
            cauliflower: isBn ? "১.২ - ১.৫ কেজি / মাথা" : "1.2 - 1.5 kg / head",
            papaya: isBn ? "৩৫ - ৪২ কেজি / গাছ" : "35 - 42 kg / plant",
            rice: isBn ? "৪.২ - ৪.৮ টন / হেক্টর" : "4.2 - 4.8 t / ha",
            wheat: isBn ? "৩.৮ - ৪.৪ টন / হেক্টর" : "3.8 - 4.4 t / ha",
            maize: isBn ? "৭.৫ - ৮.৫ টন / হেক্টর" : "7.5 - 8.5 t / ha",
            potato: isBn ? "১.৮ - ২.৪ কেজি / ঝাঁক" : "1.8 - 2.4 kg / hill",
            chili: isBn ? "৬৫০ - ৮৫০ গ্রাম / গাছ" : "650 - 850 g / plant",
            eggplant: isBn ? "৩.২ - ৪.০ কেজি / গাছ" : "3.2 - 4.0 kg / plant",
            cucumber: isBn ? "২.৫ - ৩.২ কেজি / গাছ" : "2.5 - 3.2 kg / plant",
            carrot: isBn ? "২০ - ২৫ টন / হেক্টর" : "20 - 25 t / ha",
            onion: isBn ? "১৮ - ২২ টন / হেক্টর" : "18 - 22 t / ha",
            mustard: isBn ? "১.৪ - ১.৮ টন / হেক্টর" : "1.4 - 1.8 t / ha",
            lentil: isBn ? "১.২ - ১.৫ টন / হেক্টর" : "1.2 - 1.5 t / ha",
            jute: isBn ? "৩.০ - ৩.৬ টন / হেক্টর (আঁশ)" : "3.0 - 3.6 t / ha (Fiber)"
        };
        yieldEl.textContent = yields[cropId] || (isBn ? "অনুকূল ফলন সম্ভাবনা" : "Optimal Expected Yield");
    }

    const chloroEl = document.getElementById("arChlorophyll");
    if (chloroEl) {
        const spad = (46.2 + ((plant.scale || 1.0) - 1.0) * 8).toFixed(1);
        chloroEl.textContent = isBn ? `SPAD ${spad} (উত্তম ক্লোরোফিল)` : `SPAD ${spad} (Optimal PBR)`;
    }

    const pestEl = document.getElementById("arPestStatus");
    if (pestEl) {
        pestEl.textContent = isBn ? "০% (ঝুঁকিমুক্ত · সুস্থ পাতা)" : "0% (Healthy & Pest-Free)";
    }
}
window.updatePlantInspectionBadge = updatePlantInspectionBadge;

/**
 * Subterranean Root X-Ray State Machine (Two-Way Toggle & Strict Subterranean Visibility)
 */
export function setXRayMode(enabled, targetPlant = null) {
    isXRayActive = !!enabled;

    if (rootInstancedMesh) {
        rootInstancedMesh.visible = isXRayActive;
        if (isXRayActive && currentRootMat) {
            // High-contrast bioluminescent cyan glow for root inspection
            currentRootMat.emissive.setHex(0x06b6d4);
            currentRootMat.emissiveIntensity = 0.55;
            currentRootMat.needsUpdate = true;
        } else if (currentRootMat) {
            currentRootMat.emissive.setHex(0x000000);
            currentRootMat.emissiveIntensity = 0.0;
            currentRootMat.needsUpdate = true;
        }
    }

    if (terrainMesh && terrainMesh.material) {
        if (isXRayActive) {
            terrainMesh.material.transparent = true;
            terrainMesh.material.opacity = 0.28;
            terrainMesh.material.depthWrite = false;
        } else {
            terrainMesh.material.transparent = false;
            terrainMesh.material.opacity = 1.0;
            terrainMesh.material.depthWrite = true;
        }
        terrainMesh.material.needsUpdate = true;
    }

    if (soilVolumeMesh && soilVolumeMesh.material) {
        if (isXRayActive) {
            soilVolumeMesh.material.transparent = true;
            soilVolumeMesh.material.opacity = 0.22;
            soilVolumeMesh.material.depthWrite = false;
        } else {
            soilVolumeMesh.material.transparent = false;
            soilVolumeMesh.material.opacity = 1.0;
            soilVolumeMesh.material.depthWrite = true;
        }
        soilVolumeMesh.material.needsUpdate = true;
    }

    // When inspecting plant and activating X-Ray, lower camera target Y to clearly frame subterranean root architecture
    if (isXRayActive && (isMacroViewActive || targetPlant)) {
        const pX = activeInspectedPlantPos.x;
        const pY = activeInspectedPlantPos.y;
        const pZ = activeInspectedPlantPos.z;
        startCameraTransition(
            new THREE.Vector3(pX + 0.24, Math.max(pY + 0.15, 0.25), pZ + 1.10),
            new THREE.Vector3(pX, Math.max(pY - 0.20, -0.05), pZ),
            550
        );
    }

    syncXRayUIState();
    requestShadowUpdate();
}
window.setXRayMode = setXRayMode;

/**
 * Synchronize UI controls and floating indicators with X-Ray and Macro state
 */
export function syncXRayUIState() {
    const isBn = (window.currentAppLanguage === "bn");
    const btnArRootXray = document.getElementById("btnArRootXray");
    const pill = document.getElementById("xrayActiveFloatingPill");
    const btnRootView = document.getElementById("btnRootView");
    const btnToggleMacro = document.getElementById("btnToggleMacroView");

    if (btnArRootXray) {
        if (isXRayActive) {
            btnArRootXray.classList.add("active-xray");
            btnArRootXray.setAttribute("aria-pressed", "true");
            const txtEl = btnArRootXray.querySelector(".btn-txt");
            if (txtEl) {
                txtEl.textContent = isBn ? "এক্স-রে বন্ধ করুন (Exit Root X-Ray)" : "Exit Root X-Ray";
            }
        } else {
            btnArRootXray.classList.remove("active-xray");
            btnArRootXray.setAttribute("aria-pressed", "false");
            const txtEl = btnArRootXray.querySelector(".btn-txt");
            if (txtEl) {
                txtEl.textContent = isBn ? "মাটির নিচের এক্স-রে (Root X-Ray)" : "Subterranean Root X-Ray";
            }
        }
    }

    if (pill) {
        pill.style.display = isXRayActive ? "inline-flex" : "none";
    }

    if (btnRootView) {
        if (isXRayActive && currentCameraMode === "root") {
            btnRootView.classList.add("active");
        } else if (currentCameraMode !== "root") {
            btnRootView.classList.remove("active");
        }
    }

    if (btnToggleMacro) {
        if (isMacroViewActive || isXRayActive) {
            btnToggleMacro.classList.add("active");
            btnToggleMacro.setAttribute("aria-pressed", "true");
        } else {
            btnToggleMacro.classList.remove("active");
            btnToggleMacro.setAttribute("aria-pressed", "false");
        }
    }
}
window.syncXRayUIState = syncXRayUIState;

/**
 * 5-Path Exit Dismissal Lifecycle (Exit Plant Inspection & Subterranean X-Ray)
 */
export function exitPlantInspection() {
    isMacroViewActive = false;
    setXRayMode(false);
    currentCameraMode = "field";

    const ringEl = document.getElementById("arMacroInspectionRing");
    if (ringEl) ringEl.style.display = "none";

    closeFarmerActionCard();

    // Smooth return to default field overview
    startCameraTransition(new THREE.Vector3(0, 0.90, 5.2), new THREE.Vector3(0, 0.65, 0), 600);

    const btnField = document.getElementById("btnFieldView");
    const btnDrone = document.getElementById("btnDroneView");
    const btnRoot = document.getElementById("btnRootView");
    [btnDrone, btnRoot].forEach(b => b?.classList.remove("active"));
    btnField?.classList.add("active");

    syncXRayUIState();
}
window.exitPlantInspection = exitPlantInspection;

/**
 * Toggle 3D Crop Macro View / AR Close-Up
 */
export function toggleMacroView(activate = true) {
    if (!activate) {
        exitPlantInspection();
        return;
    }

    isMacroViewActive = true;
    const ringEl = document.getElementById("arMacroInspectionRing");

    startCameraTransition(
        new THREE.Vector3(activeInspectedPlantPos.x + 0.20, Math.max(activeInspectedPlantPos.y + 0.45, 0.55), activeInspectedPlantPos.z + 1.20),
        new THREE.Vector3(activeInspectedPlantPos.x, activeInspectedPlantPos.y + 0.35, activeInspectedPlantPos.z),
        600
    );
    currentCameraMode = "macro";
    if (ringEl) ringEl.style.display = "flex";
    openFarmerActionCard(activeCropId);
    syncXRayUIState();
}
window.toggleMacroView = toggleMacroView;

// =============================================================================
// 10B. GAMIFIED CARROT PULL-TO-HARVEST & SOIL BURST SYSTEM
// =============================================================================
let pulledCarrotInstanceId = null;
let pulledCarrotAnim = null;
let soilBurstGroup = null;
let soilBurstParticles = [];

function initSoilBurstSystem() {
    if (soilBurstGroup || !scene) return;
    soilBurstGroup = new THREE.Group();
    scene.add(soilBurstGroup);
}

export function spawnSoilBurst(x, y, z) {
    initSoilBurstSystem();
    if (!soilBurstGroup) return;
    const count = 18;
    const crumbGeom = new THREE.DodecahedronGeometry(0.012, 0);
    const crumbColors = [0x78350f, 0x92400e, 0x451a03, 0xb45309];

    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshLambertMaterial({
            color: crumbColors[i % crumbColors.length],
            roughness: 0.95
        });
        const crumb = new THREE.Mesh(crumbGeom, mat);
        crumb.position.set(
            x + (Math.random() - 0.5) * 0.08,
            y + (Math.random() - 0.5) * 0.04,
            z + (Math.random() - 0.5) * 0.08
        );
        const s = 0.5 + Math.random() * 0.8;
        crumb.scale.set(s, s, s);

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.7 + Math.random() * 1.2;
        const vx = Math.cos(angle) * speed * 0.35;
        const vy = 1.1 + Math.random() * 1.4;
        const vz = Math.sin(angle) * speed * 0.35;

        soilBurstGroup.add(crumb);
        soilBurstParticles.push({
            mesh: crumb,
            vx, vy, vz,
            life: 1.0,
            decay: 1.4 + Math.random() * 0.8
        });
    }
}

export function updateSoilBurstParticles(dt = 0.016) {
    if (!soilBurstParticles.length || !soilBurstGroup) return;
    for (let i = soilBurstParticles.length - 1; i >= 0; i--) {
        const p = soilBurstParticles[i];
        p.vy -= 9.8 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += 4 * dt;
        p.mesh.rotation.y += 6 * dt;
        p.life -= p.decay * dt;

        const s = Math.max(0.01, p.life);
        p.mesh.scale.set(s, s, s);

        if (p.life <= 0 || p.mesh.position.y < 0.05) {
            soilBurstGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            soilBurstParticles.splice(i, 1);
        }
    }
}

export function handleCarrotPullInteraction(instanceId, plantData) {
    if (activeCropId !== "carrot") return;
    const now = performance.now();
    const d = instanceData[instanceId];
    if (!d) return;

    if (pulledCarrotInstanceId === instanceId) {
        // Replant carrot smoothly back into the ridge crest
        pulledCarrotAnim = {
            instanceId,
            startTime: now,
            duration: 380,
            startY: d.baseY + 0.22,
            targetY: d.baseY,
            startRotX: 0.35,
            targetRotX: 0.0,
            isPulled: false
        };
        pulledCarrotInstanceId = null;
    } else {
        // Reset previously pulled carrot if clicking another one
        if (pulledCarrotInstanceId !== null && pulledCarrotInstanceId !== instanceId) {
            const prevD = instanceData[pulledCarrotInstanceId];
            if (prevD) {
                dummy.position.set(prevD.baseX, prevD.baseY, prevD.baseZ);
                dummy.rotation.set(0, prevD.baseRotY, 0);
                dummy.scale.set(prevD.scale, prevD.scale, prevD.scale);
                dummy.updateMatrix();
                if (stemInstancedMesh) stemInstancedMesh.setMatrixAt(pulledCarrotInstanceId, dummy.matrix);
                if (leafInstancedMesh) leafInstancedMesh.setMatrixAt(pulledCarrotInstanceId, dummy.matrix);
                if (fruitInstancedMesh) fruitInstancedMesh.setMatrixAt(pulledCarrotInstanceId, dummy.matrix);
            }
        }

        pulledCarrotInstanceId = instanceId;
        pulledCarrotAnim = {
            instanceId,
            startTime: now,
            duration: 450,
            startY: d.baseY,
            targetY: d.baseY + 0.22,
            startRotX: 0.0,
            targetRotX: 0.35,
            isPulled: true
        };

        // Trigger dynamic soil burst particles at the carrot crown
        spawnSoilBurst(d.baseX, d.baseY + 0.18, d.baseZ);
    }
}

export function updatePulledCarrotAnimation() {
    if (!pulledCarrotAnim) return;
    const now = performance.now();
    const elapsed = now - pulledCarrotAnim.startTime;
    const t = Math.min(1.0, elapsed / pulledCarrotAnim.duration);
    const ease = 1 - Math.pow(1 - t, 2.5);

    const d = instanceData[pulledCarrotAnim.instanceId];
    if (!d) {
        pulledCarrotAnim = null;
        return;
    }

    const curY = THREE.MathUtils.lerp(pulledCarrotAnim.startY, pulledCarrotAnim.targetY, ease);
    const curRotX = THREE.MathUtils.lerp(pulledCarrotAnim.startRotX, pulledCarrotAnim.targetRotX, ease);

    dummy.position.set(d.baseX, curY, d.baseZ);
    dummy.rotation.set(curRotX, d.baseRotY, 0);
    dummy.scale.set(d.scale, d.scale, d.scale);
    dummy.updateMatrix();

    if (stemInstancedMesh) {
        stemInstancedMesh.setMatrixAt(pulledCarrotAnim.instanceId, dummy.matrix);
        stemInstancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (leafInstancedMesh) {
        leafInstancedMesh.setMatrixAt(pulledCarrotAnim.instanceId, dummy.matrix);
        leafInstancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (fruitInstancedMesh) {
        fruitInstancedMesh.setMatrixAt(pulledCarrotAnim.instanceId, dummy.matrix);
        fruitInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    requestShadowUpdate();

    if (t >= 1.0) {
        pulledCarrotAnim = null;
    }
}

// =============================================================================
// 11. INTERACTIVE RAYCASTING ON 3D CROPS
// =============================================================================
function initRaycasting() {
    raycaster = new THREE.Raycaster();

    let startX = 0, startY = 0, startTime = 0;

    const onPointerDown = (event) => {
        startX = event.clientX;
        startY = event.clientY;
        startTime = performance.now();
    };

    const onPointerUp = (event) => {
        const moveDist = Math.hypot(event.clientX - startX, event.clientY - startY);
        const duration = performance.now() - startTime;

        // Discard camera rotation / pinch-zoom drags - only genuine taps inspect crops
        if (moveDist > 10 || duration > 450) {
            return;
        }

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const targets = [];
        if (fruitInstancedMesh) targets.push(fruitInstancedMesh);
        if (stemInstancedMesh) targets.push(stemInstancedMesh);
        if (leafInstancedMesh) targets.push(leafInstancedMesh);

        const intersects = raycaster.intersectObjects(targets, false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const hitPoint = hit.point;
            const instanceId = (hit.instanceId !== undefined && hit.instanceId >= 0) ? hit.instanceId : 0;
            const plantData = instanceData[instanceId] || { baseX: hitPoint.x, baseY: hitPoint.y, baseZ: hitPoint.z, rowIndex: 0, colIndex: 0, scale: 1.0 };

            if (activeCropId === "carrot") {
                handleCarrotPullInteraction(instanceId, plantData);
            }

            activeInspectedPlantPos.set(plantData.baseX, plantData.baseY + 0.45, plantData.baseZ);

            startCameraTransition(
                new THREE.Vector3(plantData.baseX + 0.22, Math.max(plantData.baseY + 0.48, 0.58), plantData.baseZ + 1.25),
                new THREE.Vector3(plantData.baseX, plantData.baseY + 0.38, plantData.baseZ),
                600
            );

            updatePlantInspectionBadge(instanceId, activeCropId);
            isMacroViewActive = true;
            currentCameraMode = "macro";
            const ringEl = document.getElementById("arMacroInspectionRing");
            if (ringEl) ringEl.style.display = "flex";

            openFarmerActionCard(activeCropId);
            syncXRayUIState();
        } else {
            // Path 3: Dismiss inspection & subterranean X-Ray if clicking outside on empty ground or sky
            if (isMacroViewActive || isXRayActive) {
                exitPlantInspection();
            }
        }
    };

    const onPointerMove = (event) => {
        if (!renderer || !camera || isTransitioningCamera) return;
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hoverTargets = [];
        if (fruitInstancedMesh) hoverTargets.push(fruitInstancedMesh);
        if (stemInstancedMesh) hoverTargets.push(stemInstancedMesh);
        if (leafInstancedMesh) hoverTargets.push(leafInstancedMesh);

        const hits = raycaster.intersectObjects(hoverTargets, false);
        renderer.domElement.style.cursor = (hits.length > 0) ? "pointer" : "default";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown, { passive: true });
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
}

export function openFarmerActionCard(cropId = "tomato") {
    const card = document.getElementById("farmerActionCard");
    if (!card) return;

    updateActionCardData(cropId);
    card.classList.add("active");
    card.setAttribute("aria-hidden", "false");
}
window.openFarmerActionCard = openFarmerActionCard;

export function closeFarmerActionCard() {
    const card = document.getElementById("farmerActionCard");
    if (!card) return;
    card.classList.remove("active");
    card.setAttribute("aria-hidden", "true");
}
window.closeFarmerActionCard = closeFarmerActionCard;

function updateActionCardData(cropId) {
    const isBn = (window.currentAppLanguage === "bn");
    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropId) : null;

    const nameEl = document.getElementById("actionCardCropName");
    if (nameEl) {
        if (dbCrop) {
            nameEl.textContent = isBn ? `${dbCrop.bangla_name} (PBR ${dbCrop.name})` : `PBR ${dbCrop.name} (${dbCrop.scientific_name})`;
        } else {
            nameEl.textContent = isBn ? "বারি টমেটো (PBR Tomato)" : "PBR Tomato Field";
        }
    }

    const stageEl = document.getElementById("actionCardGrowthStage");
    if (stageEl) {
        const stageName = getCropStageName(cropId, currentGrowthStage, isBn);
        stageEl.textContent = `${isBn ? "দিন" : "Day"} ${currentGrowthDay} / ${maxCropDays} — ${stageName}`;
    }

    const adviceEl = document.getElementById("actionCardAdviceText");
    if (adviceEl && dbCrop && dbCrop.stages && dbCrop.stages[currentGrowthStage - 1]) {
        const st = dbCrop.stages[currentGrowthStage - 1];
        adviceEl.textContent = isBn
            ? (st.actionable_tips_bn ? st.actionable_tips_bn.join(" ") : st.npk_advice.description_bn)
            : (st.actionable_tips ? st.actionable_tips.join(" ") : st.npk_advice.description);
    }
}

// =============================================================================
// 12. 1-CLICK TACTILE ACTION HANDLERS (IRRIGATE, FERTILIZE, SPRAY) - 4.5s ANIMATIONS
// =============================================================================
let _irrigateTimeout = null;
let _fertilizeTimeout = null;
let _sprayTimeout = null;

export function executeActionIrrigate() {
    isSprinklerActive = true;
    if (sprinklerWaterParticles) sprinklerWaterParticles.visible = true;
    updateSoilMoisture(86);

    if (cropHealthState === "deficiency") {
        setCropHealthState("healthy");
    }

    const btn = document.getElementById("btnActIrrigate");
    if (btn) btn.classList.add("active-pulse");

    if (_irrigateTimeout) clearTimeout(_irrigateTimeout);
    _irrigateTimeout = setTimeout(() => {
        isSprinklerActive = false;
        if (sprinklerWaterParticles) sprinklerWaterParticles.visible = false;
        if (btn) btn.classList.remove("active-pulse");
        requestShadowUpdate();
        updateFieldSpatialPins(activeCropId, soilMoisturePercent);
        updateHUDStatusCards();
    }, 4500);

    requestShadowUpdate();
    updateFieldSpatialPins(activeCropId, soilMoisturePercent);
    updateHUDStatusCards();
}
window.executeActionIrrigate = executeActionIrrigate;

export function executeActionFertilize() {
    npkLevelPercent = 94;
    if (cropHealthState === "deficiency") {
        setCropHealthState("healthy");
    }

    const btn = document.getElementById("btnActFertilize");
    if (btn) btn.classList.add("active-pulse");

    if (fertilizerGlowParticles) {
        fertilizerGlowParticles.visible = true;
    }

    if (_fertilizeTimeout) clearTimeout(_fertilizeTimeout);
    _fertilizeTimeout = setTimeout(() => {
        if (fertilizerGlowParticles) fertilizerGlowParticles.visible = false;
        if (btn) btn.classList.remove("active-pulse");
        requestShadowUpdate();
        updateFieldSpatialPins(activeCropId, soilMoisturePercent);
        updateHUDStatusCards();
    }, 4500);

    requestShadowUpdate();
    updateFieldSpatialPins(activeCropId, soilMoisturePercent);
    updateHUDStatusCards();
}
window.executeActionFertilize = executeActionFertilize;

export function executeActionSpray() {
    pestRiskLevel = "low";
    setCropHealthState("healthy");

    const btn = document.getElementById("btnActSpray");
    if (btn) btn.classList.add("active-pulse");

    if (sprayMistParticles) {
        sprayMistParticles.visible = true;
    }

    if (_sprayTimeout) clearTimeout(_sprayTimeout);
    _sprayTimeout = setTimeout(() => {
        if (sprayMistParticles) sprayMistParticles.visible = false;
        if (btn) btn.classList.remove("active-pulse");
        requestShadowUpdate();
        updateFieldSpatialPins(activeCropId, soilMoisturePercent);
        updateHUDStatusCards();
    }, 4500);

    requestShadowUpdate();
    updateFieldSpatialPins(activeCropId, soilMoisturePercent);
    updateHUDStatusCards();
}
window.executeActionSpray = executeActionSpray;

export function setCropHealthState(state) {
    cropHealthState = state;
    const col = getHealthColor(state);

    if (currentLeafMat) {
        currentLeafMat.color.copy(col);
        currentLeafMat.needsUpdate = true;
    }
    if (currentStemMat) {
        currentStemMat.color.copy(col);
        currentStemMat.needsUpdate = true;
    }

    updateHUDStatusCards();
    updateActionCardData(activeCropId);
}
window.setCropHealthState = setCropHealthState;

// =============================================================================
// 13. LEFT HUD DOCK (NASA-TO-FARMER ACTION TRANSLATOR CARDS)
// =============================================================================
function updateHUDStatusCards() {
    const isBn = (window.currentAppLanguage === "bn");
    const nasaPayload = getCurrentNasaAgriData();
    const nasaData = (nasaPayload && nasaPayload.data) ? nasaPayload.data : {};
    const actions = translateNasaDataToFarmerActions(nasaData, isBn ? "bn" : "en");

    // 1. 💧 Soil Moisture & Irrigation Card
    const moistValEl = document.getElementById("hudDockMoistVal");
    const topMoistValEl = document.getElementById("hudDockTopMoistVal");
    const moistAdviceEl = document.getElementById("hudDockMoistAdvice");

    if (moistValEl) moistValEl.textContent = `${actions.rootMoistPercent}%`;
    if (topMoistValEl) topMoistValEl.textContent = isBn ? `${actions.topMoistPercent}% উপরিভাগ` : `${actions.topMoistPercent}% Topsoil`;
    if (moistAdviceEl) {
        moistAdviceEl.className = `dock-action-badge ${actions.moistureAction.status}`;
        moistAdviceEl.textContent = actions.moistureAction.badge;
        moistAdviceEl.title = actions.moistureAction.advice;
    }

    // 2. 🌿 Crop Growth, Sunlight & Fertilizer Card
    const npkValEl = document.getElementById("hudDockNPKVal");
    const ndviValEl = document.getElementById("hudDockNDVIVal");
    const fertAdviceEl = document.getElementById("hudDockFertilizerAdvice");

    if (npkValEl) npkValEl.textContent = `${actions.parValue} W/m²`;
    if (ndviValEl) {
        const ndviVal = (actions.rootMoistPercent > 50 && actions.parValue > 250) ? 0.74 : 0.62;
        ndviValEl.textContent = `${ndviVal.toFixed(2)} NDVI`;
    }
    if (fertAdviceEl) {
        fertAdviceEl.className = `dock-action-badge ${actions.fertilizerAction.status}`;
        fertAdviceEl.textContent = actions.fertilizerAction.badge;
        fertAdviceEl.title = actions.fertilizerAction.advice;
    }

    // 3. 🐛 Disease, Blight & Heat Stress Card
    const diseaseRiskEl = document.getElementById("hudDockDiseaseRisk");
    const microClimateEl = document.getElementById("hudDockMicroClimate");
    const diseaseAdviceEl = document.getElementById("hudDockDiseaseAdvice");

    if (diseaseRiskEl) {
        diseaseRiskEl.textContent = actions.diseaseAction.level;
        diseaseRiskEl.className = `dock-val text-${actions.diseaseAction.status}`;
    }
    if (microClimateEl) {
        microClimateEl.textContent = isBn
            ? `${actions.rhPercent}% আর্দ্রতা · ${actions.tempC}°C`
            : `${actions.rhPercent}% RH · ${actions.tempC}°C`;
    }
    if (diseaseAdviceEl) {
        diseaseAdviceEl.className = `dock-action-badge ${actions.diseaseAction.status}`;
        diseaseAdviceEl.textContent = actions.diseaseAction.badge;
        diseaseAdviceEl.title = actions.diseaseAction.advice;
    }

    // 4. 🌦️ Weather, Spraying & Harvest Guide Card
    const weatherStatusEl = document.getElementById("hudDockWeatherStatus");
    const windValEl = document.getElementById("hudDockWindVal");
    const sprayAdviceEl = document.getElementById("hudDockSprayAdvice");

    if (weatherStatusEl) {
        weatherStatusEl.textContent = isBn
            ? `${actions.tempC}°C · ${actions.rainMm} মিমি`
            : `${actions.tempC}°C · ${actions.rainMm} mm`;
    }
    if (windValEl) {
        windValEl.textContent = isBn
            ? `${actions.windSpeedKmh} কিমি/ঘ বাতাস`
            : `${actions.windSpeedKmh} km/h Wind`;
    }
    if (sprayAdviceEl) {
        sprayAdviceEl.className = `dock-action-badge ${actions.sprayAction.status}`;
        sprayAdviceEl.textContent = actions.sprayAction.badge;
        sprayAdviceEl.title = actions.sprayAction.advice;
    }
}
window.updateHUDStatusCards = updateHUDStatusCards;

export function syncSimulationWithNasaData() {
    const cur = getCurrentNasaAgriData();
    const data = cur.data;
    if (!data) return;

    // 1. Soil moisture sync (GWETTOP -> 0 to 100%)
    if (data.GWETTOP !== undefined) {
        updateSoilMoisture(data.GWETTOP * 100);
    }

    // 2. Wind speed sync (WS2M -> GPU shader uWindStrength)
    if (data.WS2M !== undefined && windUniforms && windUniforms.uWindStrength) {
        windUniforms.uWindStrength.value = Math.max(0.6, Math.min(3.8, (data.WS2M / 3.0) * 1.5));
    }

    // 3. Update the 4 Left Telemetry Cards
    updateHUDStatusCards();

    // 4. Update Header Indicator if present
    const sourceBadge = document.getElementById("nasaHubDataSourceBadge");
    if (sourceBadge) {
        if (cur.sourceType === "LIVE_API") {
            sourceBadge.className = "nasa-hub-status-badge live";
            sourceBadge.textContent = "● LIVE API (community=AG)";
        } else if (cur.sourceType === "LOCAL_CACHE") {
            sourceBadge.className = "nasa-hub-status-badge cached";
            sourceBadge.textContent = "● NASA CACHED";
        } else {
            sourceBadge.className = "nasa-hub-status-badge prebundled";
            sourceBadge.textContent = "● NASA CALIBRATED (Offline Ready)";
        }
    }
}
window.syncSimulationWithNasaData = syncSimulationWithNasaData;

function renderNasaHubModal() {
    const isBn = (window.currentAppLanguage === "bn");
    const cur = getCurrentNasaAgriData();
    const data = cur.data;
    const actions = translateNasaDataToFarmerActions(data, isBn ? "bn" : "en");

    const subtitleEl = document.getElementById("nasaHubSubtitle");
    if (subtitleEl) {
        const zone = cur.zoneInfo;
        const name = isBn ? zone.nameBn : zone.nameEn;
        subtitleEl.textContent = `📍 ${name} (${zone.lat.toFixed(4)}°N, ${zone.lon.toFixed(4)}°E) • ${zone.aez || 'Agro-Ecological Zone'}`;
    }

    // Tab 1: Checklist Cards
    const checkIrrStatus = document.getElementById("checkIrrStatusBadge");
    const checkIrrRoot = document.getElementById("checkIrrRootVal");
    const checkIrrTop = document.getElementById("checkIrrTopVal");
    const checkIrrText = document.getElementById("checkIrrText");

    if (checkIrrStatus) {
        checkIrrStatus.className = `checklist-pill ${actions.moistureAction.status}`;
        checkIrrStatus.textContent = actions.moistureAction.badge;
    }
    if (checkIrrRoot) checkIrrRoot.textContent = `${actions.rootMoistPercent}%`;
    if (checkIrrTop) checkIrrTop.textContent = `${actions.topMoistPercent}%`;
    if (checkIrrText) checkIrrText.textContent = actions.moistureAction.advice;

    const checkFertStatus = document.getElementById("checkFertStatusBadge");
    const checkFertPAR = document.getElementById("checkFertPARVal");
    const checkFertRain = document.getElementById("checkFertRainVal");
    const checkFertText = document.getElementById("checkFertText");

    if (checkFertStatus) {
        checkFertStatus.className = `checklist-pill ${actions.fertilizerAction.status}`;
        checkFertStatus.textContent = actions.fertilizerAction.badge;
    }
    if (checkFertPAR) checkFertPAR.textContent = `${actions.parValue} W/m²`;
    if (checkFertRain) checkFertRain.textContent = `${actions.rainMm} mm`;
    if (checkFertText) checkFertText.textContent = actions.fertilizerAction.advice;

    const checkDiseaseStatus = document.getElementById("checkDiseaseStatusBadge");
    const checkDiseaseRH = document.getElementById("checkDiseaseRHVal");
    const checkDiseaseTempMax = document.getElementById("checkDiseaseTempMaxVal");
    const checkDiseaseText = document.getElementById("checkDiseaseText");

    if (checkDiseaseStatus) {
        checkDiseaseStatus.className = `checklist-pill ${actions.diseaseAction.status}`;
        checkDiseaseStatus.textContent = actions.diseaseAction.badge;
    }
    if (checkDiseaseRH) checkDiseaseRH.textContent = `${actions.rhPercent}%`;
    if (checkDiseaseTempMax) checkDiseaseTempMax.textContent = `${actions.tempMaxC}°C`;
    if (checkDiseaseText) checkDiseaseText.textContent = actions.diseaseAction.advice;

    const checkHarvestStatus = document.getElementById("checkHarvestStatusBadge");
    const checkHarvestWind = document.getElementById("checkHarvestWindVal");
    const checkHarvestRain = document.getElementById("checkHarvestRainVal");
    const checkHarvestText = document.getElementById("checkHarvestText");

    if (checkHarvestStatus) {
        checkHarvestStatus.className = `checklist-pill ${actions.sprayAction.status}`;
        checkHarvestStatus.textContent = actions.sprayAction.badge;
    }
    if (checkHarvestWind) checkHarvestWind.textContent = `${actions.windSpeedMs} m/s (${actions.windSpeedKmh} km/h)`;
    if (checkHarvestRain) checkHarvestRain.textContent = `${actions.rainMm} mm/day`;
    if (checkHarvestText) checkHarvestText.textContent = actions.sprayAction.advice;

    renderNasaTelemetryTab();
}

function renderNasaTelemetryTab() {
    const cur = getCurrentNasaAgriData();
    const data = cur.data;

    const elRoot = document.getElementById("telemetryGWETROOT");
    const elTop = document.getElementById("telemetryGWETTOP");
    const elPAR = document.getElementById("telemetryPAR");
    const elPrecip = document.getElementById("telemetryPrecip");
    const elTemp = document.getElementById("telemetryTemp");
    const elRH = document.getElementById("telemetryRH");
    const elWind = document.getElementById("telemetryWind");
    const elSW = document.getElementById("telemetrySW");

    if (elRoot) elRoot.textContent = `${(data.GWETROOT || 0.65).toFixed(2)}`;
    if (elTop) elTop.textContent = `${(data.GWETTOP || 0.61).toFixed(2)}`;
    if (elPAR) elPAR.textContent = `${(data.ALLSKY_SFC_PAR_TOT || 425.0).toFixed(1)}`;
    if (elPrecip) elPrecip.textContent = `${(data.PRECTOTCORR || 0.8).toFixed(1)}`;
    if (elTemp) elTemp.textContent = `${(data.T2M || 26.8).toFixed(1)}°C (${(data.T2M_MAX || 31.4).toFixed(1)} / ${(data.T2M_MIN || 21.8).toFixed(1)})`;
    if (elRH) elRH.textContent = `${(data.RH2M || 74.2).toFixed(1)}%`;
    if (elWind) elWind.textContent = `${(data.WS2M || 2.6).toFixed(1)} m/s (${Math.round((data.WS2M || 2.6) * 3.6)} km/h)`;
    if (elSW) elSW.textContent = `${(data.ALLSKY_SFC_SW_DWN || 5.12).toFixed(2)}`;

    // Render 7-day trend bars
    const trendContainer = document.getElementById("nasaTrendBars");
    if (trendContainer && data.trend7Day && data.trend7Day.length > 0) {
        trendContainer.innerHTML = "";
        data.trend7Day.forEach((item) => {
            const barWrapper = document.createElement("div");
            barWrapper.className = "trend-bar-column";

            const moistHeight = Math.min(100, Math.max(15, Math.round(item.gwetroot * 100)));
            const rainHeight = Math.min(80, Math.round(item.precip * 5));

            barWrapper.innerHTML = `
                <div class="trend-bar-track">
                    <div class="trend-bar-fill moist" style="height: ${moistHeight}%;" title="Root Wetness: ${Math.round(item.gwetroot * 100)}%"></div>
                    ${rainHeight > 0 ? `<div class="trend-bar-fill rain" style="height: ${rainHeight}%;" title="Rain: ${item.precip}mm"></div>` : ""}
                </div>
                <span class="trend-bar-val">${Math.round(item.gwetroot * 100)}%</span>
                <span class="trend-bar-day">${item.day}</span>
            `;
            trendContainer.appendChild(barWrapper);
        });
    }
}

// =============================================================================
// 14. BOTTOM TIMELINE SCRUBBER
// =============================================================================
function updateTimelineUI() {
    const slider = document.getElementById("growthTimelineSlider");
    if (slider) {
        slider.max = maxCropDays;
        slider.value = currentGrowthDay;
    }

    const dayLabel = document.getElementById("timelineDayLabel");
    const isBn = (window.currentAppLanguage === "bn");
    if (dayLabel) {
        dayLabel.textContent = `${isBn ? "দিন" : "Day"} ${currentGrowthDay} / ${maxCropDays}`;
    }

    const stageBadge = document.getElementById("timelineStageBadge");
    if (stageBadge) {
        stageBadge.textContent = getCropStageName(activeCropId, currentGrowthStage, isBn);
    }
}

export function togglePlayback() {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById("btnTimelinePlay");
    const isBn = (window.currentAppLanguage === "bn");

    if (isPlaying) {
        if (playBtn) playBtn.innerHTML = `<span>❚❚</span> <span>${isBn ? "থামান" : "Pause"}</span>`;
        startPlaybackLoop();
    } else {
        if (playBtn) playBtn.innerHTML = `<span>▶</span> <span>${isBn ? "চালান" : "Play"}</span>`;
        stopPlaybackLoop();
    }
}
window.togglePlayback = togglePlayback;

function startPlaybackLoop() {
    stopPlaybackLoop();
    playbackTimer = setInterval(() => {
        if (!isPlaying) return;
        let nextDay = currentGrowthDay + playSpeed;
        if (nextDay > maxCropDays) {
            nextDay = 1;
        }
        applyGrowthStage(nextDay, maxCropDays);
    }, 180);
}

function stopPlaybackLoop() {
    if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
    }
}

export function setPlaybackSpeed(speed) {
    playSpeed = speed;
    ["btnSpeed1x", "btnSpeed2x", "btnSpeed5x"].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("active");
    });
    const activeBtn = document.getElementById(`btnSpeed${speed}x`);
    if (activeBtn) activeBtn.classList.add("active");
}
window.setPlaybackSpeed = setPlaybackSpeed;

// =============================================================================
// 15. CAMERA MODES & PRESETS
// =============================================================================
export function switchCameraMode(mode) {
    currentCameraMode = mode;
    isMacroViewActive = false;
    const ringEl = document.getElementById("arMacroInspectionRing");
    if (ringEl) ringEl.style.display = "none";

    const btnDrone = document.getElementById("btnDroneView");
    const btnField = document.getElementById("btnFieldView");
    const btnRoot = document.getElementById("btnRootView");

    [btnDrone, btnField, btnRoot].forEach(b => b?.classList.remove("active"));

    if (controls) {
        controls.maxPolarAngle = (mode === "root") ? (Math.PI * 0.85) : (Math.PI * 0.5 - 0.03);
    }

    if (mode === "root") {
        setXRayMode(true);
        startCameraTransition(new THREE.Vector3(0, -0.18, 2.5), new THREE.Vector3(0, -0.10, 0), 600);
        btnRoot?.classList.add("active");
    } else {
        setXRayMode(false);
        if (mode === "drone") {
            startCameraTransition(new THREE.Vector3(0, 11.0, 13.0), new THREE.Vector3(0, 0.2, 0), 600);
            btnDrone?.classList.add("active");
        } else {
            startCameraTransition(new THREE.Vector3(0, 0.90, 5.2), new THREE.Vector3(0, 0.65, 0), 600);
            btnField?.classList.add("active");
        }
    }
    syncXRayUIState();
    requestShadowUpdate();
}
window.switchCameraMode = switchCameraMode;

// =============================================================================
// 15B. 2D FARM INTERACTIVE FALLBACK ENGINE
// =============================================================================
export const CROP_FALLBACK_ICONS = {
    tomato: "🍅",
    rice: "🌾",
    wheat: "🌾",
    maize: "🌽",
    jute: "🌿",
    potato: "🥔",
    mustard: "🌼",
    eggplant: "🍆",
    chili: "🌶️",
    lentil: "🌱",
    cucumber: "🥒",
    cauliflower: "🥦",
    onion: "🧅",
    carrot: "🥕",
    papaya: "🍈"
};

let is2DFallbackActive = false;

export function show2DFarmFallback() {
    is2DFallbackActive = true;
    containerEl = containerEl || document.getElementById("farm3D");
    if (!containerEl) return;

    let fallbackEl = document.getElementById("farm2DFallback");
    if (!fallbackEl) {
        fallbackEl = document.createElement("div");
        fallbackEl.id = "farm2DFallback";
        fallbackEl.className = "farm-2d-fallback";
        containerEl.appendChild(fallbackEl);
    }

    const currentCrop = activeCropId || "rice";
    const icon = CROP_FALLBACK_ICONS[currentCrop] || "🌱";
    const cropName = currentCrop.charAt(0).toUpperCase() + currentCrop.slice(1);

    fallbackEl.innerHTML = `
        <div class="fallback-sky">
            <div class="fallback-sun">☀️</div>
            <div class="fallback-clouds">☁️ ☁️</div>
        </div>
        <div class="fallback-soil-container">
            <div class="fallback-ridge">
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
            </div>
            <div class="fallback-ridge">
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
            </div>
            <div class="fallback-ridge">
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
                <span class="crop-icon">${icon}</span>
            </div>
        </div>
        <div class="fallback-badge">
            <span class="fallback-dot"></span>
            <strong>2D Farm Mode (Active: ${cropName})</strong>
            <small>WebGL Accelerated Fallback</small>
        </div>
    `;
    fallbackEl.style.display = "flex";
}

export function hide2DFarmFallback() {
    is2DFallbackActive = false;
    const fallbackEl = document.getElementById("farm2DFallback");
    if (fallbackEl) {
        fallbackEl.style.display = "none";
    }
}
window.show2DFarmFallback = show2DFarmFallback;
window.hide2DFarmFallback = hide2DFarmFallback;

export function updateCropSimulation(rawCropId) {
    if (!rawCropId) return;
    const cropId = normalizeCropId(rawCropId);
    activeCropId = cropId;

    const cropSelect = document.getElementById("cropSelect");
    if (cropSelect && cropSelect.value !== cropId) cropSelect.value = cropId;

    const lifecycleSelect = document.getElementById("cropLifecycleSelect");
    if (lifecycleSelect && lifecycleSelect.value !== cropId && window.selectLifecycleCrop) {
        window.selectLifecycleCrop(cropId);
    }

    if (is2DFallbackActive) {
        show2DFarmFallback();
    } else {
        createCropField(cropId);
    }
}
window.updateCropSimulation = updateCropSimulation;
window.createCropField = createCropField;

// =============================================================================
// 16. BIND UI EVENT LISTENERS
// =============================================================================
function bindUIControls() {
    const simSection = document.getElementById("farmSimulation");
    const btnFullscreen = document.getElementById("btnFullscreen");
    const cropSelect = document.getElementById("cropSelect");
    const timeSlider = document.getElementById("timeOfDaySlider");

    const btnDrone = document.getElementById("btnDroneView");
    const btnField = document.getElementById("btnFieldView");
    const btnRoot = document.getElementById("btnRootView");

    if (btnDrone) btnDrone.addEventListener("click", () => switchCameraMode("drone"));
    if (btnField) btnField.addEventListener("click", () => switchCameraMode("field"));
    if (btnRoot) btnRoot.addEventListener("click", () => switchCameraMode("root"));

    // Segmented Time-of-Day Mode Switcher (Multi-layered direct listeners, container delegation, & document delegation)
    const todBtns = document.querySelectorAll(".tod-segment-btn, .time-btn, [data-time]");
    todBtns.forEach((btn) => {
        const handleTimeSwitch = (e) => {
            if (e) {
                e.stopPropagation();
            }
            const timeMode = btn.dataset.time || btn.getAttribute("data-time") || "noon";
            setTimeOfDayMode(timeMode);
        };
        btn.addEventListener("click", handleTimeSwitch);
        btn.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
        });
        btn.addEventListener("touchend", (e) => {
            if (e.cancelable) e.preventDefault();
            handleTimeSwitch(e);
        }, { passive: false });
    });

    // Container Delegation on #todSegmentedControl
    const todContainer = document.getElementById("todSegmentedControl");
    if (todContainer) {
        ["click", "touchend"].forEach(evtType => {
            todContainer.addEventListener(evtType, (e) => {
                const btn = e.target.closest(".tod-segment-btn, [data-time], .time-btn");
                if (btn) {
                    e.stopPropagation();
                    if (e.cancelable && evtType === "touchend") e.preventDefault();
                    const timeVal = btn.dataset.time || btn.getAttribute("data-time") || "noon";
                    setTimeOfDayMode(timeVal);
                }
            }, { passive: false });
        });
    }

    // Document-level fallback delegation
    document.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest && e.target.closest(".tod-segment-btn, [data-time], .time-btn");
        if (btn) {
            e.stopPropagation();
            const timeVal = btn.dataset.time || btn.getAttribute("data-time") || "noon";
            setTimeOfDayMode(timeVal);
        }
    });

    if (timeSlider) {
        timeSlider.addEventListener("input", (e) => {
            updateSkyTimeOfDay(parseFloat(e.target.value));
        });
    }

    if (cropSelect) {
        cropSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    // 📍 Farm Location Selector (NASA POWER Presets & GPS)
    const locSelect = document.getElementById("farmLocationSelect");
    if (locSelect) {
        locSelect.addEventListener("change", async (e) => {
            const locKey = e.target.value;
            if (locKey === "gps") {
                if ("geolocation" in navigator) {
                    locSelect.disabled = true;
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            locSelect.disabled = false;
                            const lat = pos.coords.latitude;
                            const lon = pos.coords.longitude;
                            console.log(`[Farm Location] GPS position: ${lat}, ${lon}`);
                            await fetchNasaAgriData("gps", lat, lon);
                            syncSimulationWithNasaData();
                        },
                        async (err) => {
                            locSelect.disabled = false;
                            console.warn("[Farm Location] GPS error:", err.message);
                            const msg = (window.currentAppLanguage === "bn")
                                ? "GPS অবস্থান পাওয়া যায়নি। ময়মনসিংহ অঞ্চল নির্বাচন করা হচ্ছে।"
                                : "Could not retrieve GPS coordinates. Defaulting to Mymensingh.";
                            alert(msg);
                            locSelect.value = "mymensingh";
                            await fetchNasaAgriData("mymensingh");
                            syncSimulationWithNasaData();
                        },
                        { timeout: 7000 }
                    );
                } else {
                    alert("Geolocation is not supported by your browser.");
                    locSelect.value = "mymensingh";
                }
            } else {
                await fetchNasaAgriData(locKey);
                syncSimulationWithNasaData();
            }
        });
    }

    // 🛰️ NASA Farming Data Hub Modal Controls
    const btnNasaHub = document.getElementById("btnNasaAgriHub");
    const nasaModal = document.getElementById("nasaAgriHubModal");
    const btnCloseNasaModal = document.getElementById("btnCloseNasaHub");
    const tabFarmer = document.getElementById("tabBtnFarmerGuidance");
    const tabTelemetry = document.getElementById("tabBtnNasaTelemetry");
    const panelFarmer = document.getElementById("nasaTabFarmer");
    const panelTelemetry = document.getElementById("nasaTabTelemetry");
    const btnRefreshNasa = document.getElementById("btnRefreshNasaLive");

    if (btnNasaHub && nasaModal) {
        btnNasaHub.addEventListener("click", () => {
            renderNasaHubModal();
            nasaModal.style.display = "flex";
            nasaModal.setAttribute("aria-hidden", "false");
        });
    }

    if (btnCloseNasaModal && nasaModal) {
        btnCloseNasaModal.addEventListener("click", () => {
            nasaModal.style.display = "none";
            nasaModal.setAttribute("aria-hidden", "true");
        });
    }

    if (nasaModal) {
        nasaModal.addEventListener("click", (e) => {
            if (e.target === nasaModal) {
                nasaModal.style.display = "none";
                nasaModal.setAttribute("aria-hidden", "true");
            }
        });
    }

    if (tabFarmer && tabTelemetry && panelFarmer && panelTelemetry) {
        tabFarmer.addEventListener("click", () => {
            tabFarmer.classList.add("active");
            tabFarmer.setAttribute("aria-selected", "true");
            tabTelemetry.classList.remove("active");
            tabTelemetry.setAttribute("aria-selected", "false");
            panelFarmer.style.display = "block";
            panelTelemetry.style.display = "none";
        });

        tabTelemetry.addEventListener("click", () => {
            tabTelemetry.classList.add("active");
            tabTelemetry.setAttribute("aria-selected", "true");
            tabFarmer.classList.remove("active");
            tabFarmer.setAttribute("aria-selected", "false");
            panelTelemetry.style.display = "block";
            panelFarmer.style.display = "none";
            renderNasaTelemetryTab();
        });
    }

    if (btnRefreshNasa) {
        btnRefreshNasa.addEventListener("click", async () => {
            btnRefreshNasa.disabled = true;
            btnRefreshNasa.textContent = (window.currentAppLanguage === "bn") ? "⏳ লোড হচ্ছে..." : "⏳ Fetching NASA API...";
            const cur = getCurrentNasaAgriData();
            await fetchNasaAgriData(cur.zoneKey, cur.zoneInfo.lat, cur.zoneInfo.lon);
            syncSimulationWithNasaData();
            renderNasaHubModal();
            btnRefreshNasa.disabled = false;
            btnRefreshNasa.textContent = (window.currentAppLanguage === "bn") ? "🔄 রিফ্রেশ লাইভ ডেটা (Refresh NASA API)" : "🔄 Refresh NASA API Data";
        });
    }



    // Macro View & Subterranean Root X-Ray Toggle Buttons
    const btnToggleMacro = document.getElementById("btnToggleMacroView");
    if (btnToggleMacro) {
        btnToggleMacro.addEventListener("click", () => {
            if (isMacroViewActive || isXRayActive) {
                exitPlantInspection();
            } else {
                toggleMacroView(true);
            }
        });
    }

    const btnCloseMacro = document.getElementById("btnCloseMacroView");
    if (btnCloseMacro) {
        btnCloseMacro.addEventListener("click", () => exitPlantInspection());
    }

    const btnRootXray = document.getElementById("btnArRootXray");
    if (btnRootXray) {
        btnRootXray.addEventListener("click", (e) => {
            e.stopPropagation();
            setXRayMode(!isXRayActive, activeInspectedPlantData?.instanceId);
        });
    }

    const btnDismissXRayPill = document.getElementById("btnDismissXRayPill");
    if (btnDismissXRayPill) {
        btnDismissXRayPill.addEventListener("click", (e) => {
            e.stopPropagation();
            setXRayMode(false);
        });
    }

    // Keyboard Escape to dismiss inspection / X-Ray (Path 4)
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && (isMacroViewActive || isXRayActive)) {
            exitPlantInspection();
        }
    });

    const btnAskBuddyAr = document.getElementById("btnAskFarmerBuddyFromAr");
    if (btnAskBuddyAr) {
        btnAskBuddyAr.addEventListener("click", () => {
            const isBn = (window.currentAppLanguage === "bn");
            const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === activeCropId) : null;
            const cName = getCropDisplayName(activeCropId, isBn);
            const pData = activeInspectedPlantData;
            const plantCtx = pData ? (isBn ? `গাছ #${pData.plantNum} (সারি ${pData.rowNum})` : `Plant #${pData.plantNum} (Row ${pData.rowNum})`) : "";
            const prompt = isBn
                ? `৩ডি মাঠের পরিদর্শনে ${cName} ${plantCtx} ফসলের ফলন ও পরিপক্বতা স্ক্যান করা হয়েছে। বর্তমান আবহাওয়া ও মাটির অবস্থা বিবেচনা করে আগামী ৭ দিনের জন্য সেরা কৃষি পরামর্শ এবং ফসল তোলার প্রস্তুতি জানান।`
                : `Based on the 3D in-field precision inspection for ${cName} ${plantCtx}, please provide actionable agronomist recommendations for irrigation, nutrient management, and optimal harvesting time.`;

            if (window.farmerBuddyInstance) {
                if (typeof window.farmerBuddyInstance.openWithMessage === "function") {
                    window.farmerBuddyInstance.openWithMessage(prompt);
                } else {
                    window.farmerBuddyInstance.toggleWindow(true);
                    window.farmerBuddyInstance.handleUserSubmit(prompt);
                }
            } else {
                const fab = document.getElementById("farmerBuddyFAB");
                if (fab) fab.click();
            }
        });
    }

    const btnCloseAction = document.getElementById("btnCloseActionCard");
    if (btnCloseAction) {
        btnCloseAction.addEventListener("click", closeFarmerActionCard);
    }

    const btnActInspect3D = document.getElementById("btnActInspect3D");
    if (btnActInspect3D) {
        btnActInspect3D.addEventListener("click", () => {
            sketchfabService.openModelInspector(activeCropId, window.currentAppLanguage || "bn");
        });
    }

    const btnActIrrigate = document.getElementById("btnActIrrigate");
    if (btnActIrrigate) btnActIrrigate.addEventListener("click", executeActionIrrigate);

    const btnActFertilize = document.getElementById("btnActFertilize");
    if (btnActFertilize) btnActFertilize.addEventListener("click", executeActionFertilize);

    const btnActSpray = document.getElementById("btnActSpray");
    if (btnActSpray) btnActSpray.addEventListener("click", executeActionSpray);

    const timelineSlider = document.getElementById("growthTimelineSlider");
    if (timelineSlider) {
        timelineSlider.addEventListener("input", (e) => {
            applyGrowthStage(parseInt(e.target.value, 10), maxCropDays);
        });
    }

    const btnPlay = document.getElementById("btnTimelinePlay");
    if (btnPlay) btnPlay.addEventListener("click", togglePlayback);

    const btnSpeed1x = document.getElementById("btnSpeed1x");
    if (btnSpeed1x) btnSpeed1x.addEventListener("click", () => setPlaybackSpeed(1));

    const btnSpeed2x = document.getElementById("btnSpeed2x");
    if (btnSpeed2x) btnSpeed2x.addEventListener("click", () => setPlaybackSpeed(2));

    const btnSpeed5x = document.getElementById("btnSpeed5x");
    if (btnSpeed5x) btnSpeed5x.addEventListener("click", () => setPlaybackSpeed(5));

    const btnWeatherSunny = document.getElementById("btnWeatherSunny");
    if (btnWeatherSunny) btnWeatherSunny.addEventListener("click", () => setWeatherMode("sunny"));

    const btnWeatherRain = document.getElementById("btnWeatherRain");
    if (btnWeatherRain) btnWeatherRain.addEventListener("click", () => setWeatherMode("rain"));

    const btnWeatherWind = document.getElementById("btnWeatherWind");
    if (btnWeatherWind) btnWeatherWind.addEventListener("click", () => setWeatherMode("wind"));

    const btnWeatherSprinkler = document.getElementById("btnWeatherSprinkler");
    if (btnWeatherSprinkler) btnWeatherSprinkler.addEventListener("click", () => setWeatherMode("sprinkler"));

    if (btnFullscreen && simSection) {
        btnFullscreen.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                simSection.requestFullscreen?.() || simSection.webkitRequestFullscreen?.();
            } else {
                document.exitFullscreen?.() || document.webkitExitFullscreen?.();
            }
        });
    }

    window.addEventListener("languageChanged", (e) => {
        updateHUDStatusCards();
        updateActionCardData(activeCropId);
        updateFieldSpatialPins(activeCropId);
        formatDropdownLabelsForMobile();
        updateTimelineUI();
    });

    formatDropdownLabelsForMobile();
    updateFieldSpatialPins(activeCropId);
}

// =============================================================================
// 17. ANIMATION LOOP & PARTICLE DYNAMICS (ZERO RUNTIME ALLOCATIONS)
// =============================================================================
function animate() {
    if (!isRenderLoopRunning) return;
    requestAnimationFrame(animate);
    animationTime += 0.016;

    windUniforms.uTime.value = animationTime;

    // Smart Shadow Map Caching: update shadow maps when dynamic motion occurs
    if (isTransitioningCamera || isTransitioningCrop || isSprinklerActive || isRaining) {
        requestShadowUpdate();
    }

    // A. Slanted Rain Streaks Animation
    if (isRaining && rainLineSegments && rainPosArray && rainVelArray) {
        const count = rainVelArray.length;
        for (let i = 0; i < count; i++) {
            const vy = rainVelArray[i];
            rainPosArray[i * 6 + 1] -= vy;
            rainPosArray[i * 6 + 4] -= vy;

            // Wind inclination
            rainPosArray[i * 6] += 0.018;
            rainPosArray[i * 6 + 3] += 0.018;

            if (rainPosArray[i * 6 + 1] < 0.05) {
                const nx = (Math.random() - 0.5) * 16.0;
                const ny = 11.5;
                const nz = (Math.random() - 0.5) * 16.0;

                rainPosArray[i * 6]     = nx;
                rainPosArray[i * 6 + 1] = ny;
                rainPosArray[i * 6 + 2] = nz;

                rainPosArray[i * 6 + 3] = nx + 0.04;
                rainPosArray[i * 6 + 4] = ny - 0.45;
                rainPosArray[i * 6 + 5] = nz + 0.02;
            }
        }
        rainLineSegments.geometry.attributes.position.needsUpdate = true;
    }

    // B. Rotating Sprinkler Jets
    if (sprinklerRisers.length > 0) {
        sprinklerRisers.forEach((s) => {
            if (isSprinklerActive) {
                s.head.rotation.y += 0.09;
            }
        });
    }

    if (isSprinklerActive && sprinklerWaterParticles && sprinklerWaterGeo) {
        const pos = sprinklerWaterGeo.attributes.position.array;
        const life = sprinklerWaterGeo.attributes.life.array;
        const count = life.length;

        for (let i = 0; i < count; i++) {
            life[i] += 0.035;
            if (life[i] > 1.0) {
                life[i] = 0.0;
                const sIdx = i % sprinklerRisers.length;
                const sp = sprinklerRisers[sIdx];
                const angle = sp.head.rotation.y + (Math.random() - 0.5) * 0.35;
                pos[i * 3]     = sp.group.position.x;
                pos[i * 3 + 1] = 0.68;
                pos[i * 3 + 2] = sp.group.position.z;
            } else {
                const t = life[i];
                const sIdx = i % sprinklerRisers.length;
                const sp = sprinklerRisers[sIdx];
                const angle = sp.head.rotation.y;
                const dist = t * 3.4;
                pos[i * 3]     = sp.group.position.x + Math.cos(angle) * dist;
                pos[i * 3 + 1] = 0.68 + Math.sin(t * Math.PI) * 0.85 - t * 0.55;
                pos[i * 3 + 2] = sp.group.position.z + Math.sin(angle) * dist;
            }
        }
        sprinklerWaterGeo.attributes.position.needsUpdate = true;
    }

    // C. Billowing Spray Mist Particles
    if (sprayMistParticles && sprayMistParticles.visible && sprayMistGeo) {
        const pos = sprayMistGeo.attributes.position.array;
        const count = pos.length / 3;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] += 0.003;
            pos[i * 3] += Math.sin(animationTime + i) * 0.004;
        }
        sprayMistGeo.attributes.position.needsUpdate = true;
    }

    // D. Nutrient Glow Particles
    if (fertilizerGlowParticles && fertilizerGlowParticles.visible && fertilizerGlowGeo) {
        const pos = fertilizerGlowGeo.attributes.position.array;
        const count = pos.length / 3;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] += 0.006;
            if (pos[i * 3 + 1] > 0.95) pos[i * 3 + 1] = 0.1;
        }
        fertilizerGlowGeo.attributes.position.needsUpdate = true;
    }

    // E. Smooth 600ms Camera Lerp with Cubic Ease-In-Out
    if (isTransitioningCamera) {
        const elapsed = performance.now() - cameraTransitionStartTime;
        const t = Math.min(1.0, elapsed / CAMERA_TRANSITION_DURATION);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        camera.position.lerpVectors(startCameraPos, targetCameraPos, ease);
        controls.target.lerpVectors(startLookAt, targetLookAt, ease);

        if (t >= 1.0) {
            camera.position.copy(targetCameraPos);
            controls.target.copy(targetLookAt);
            isTransitioningCamera = false;
        }
    }

    // F. Carrot Pull Animation & Soil Particle Dynamics
    updatePulledCarrotAnimation();
    updateSoilBurstParticles(0.016);

    // G. In-Scene Spatial AR World-to-Screen Projection
    updateSpatialArAnchors();

    controls.update();
    renderer.render(scene, camera);
}

// =============================================================================
// 18. INITIALIZATION
// =============================================================================
export function init3DFieldSimulation() {
    containerEl = document.getElementById("farm3D");
    if (!containerEl || renderer) return;

    updateFieldGridDimensions();
    const mobile = isMobileDevice();

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || (mobile ? 560 : 680);

    scene = new THREE.Scene();

    // Daylight atmospheric sky gradient (#1b5ea8 azure -> #4299e1 soft blue -> #bee3f8 horizon, zero washout)
    scene.background = createSkyGradientTexture("#1b5ea8", "#4299e1", "#bee3f8", false);

    camera = new THREE.PerspectiveCamera(mobile ? 52 : 45, width / height, 0.1, 1000);
    if (mobile) {
        // Elevated & pulled back for perfect framing on vertical mobile screens
        camera.position.set(0, 1.45, 6.8);
    } else {
        camera.position.set(0, 0.90, 5.2);
    }

    try {
        renderer = new THREE.WebGLRenderer({
            antialias: window.devicePixelRatio < 2,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        renderer.setClearColor(0xdceefb, 1.0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
    } catch (webglErr) {
        console.warn("[3D FieldShift] ⚠️ WebGL initialization failed! Activating 2D farm fallback:", webglErr);
        show2DFarmFallback();
        return;
    }

    cachedContainerWidth = width;
    cachedContainerHeight = height;

    containerEl.innerHTML = "";
    containerEl.appendChild(renderer.domElement);
    canvasEl = renderer.domElement;
    canvasEl.style.touchAction = "none";

    // Passive touch and wheel listeners for smooth 60fps scrolling & touch response
    canvasEl.addEventListener("touchstart", () => {}, { passive: true });
    canvasEl.addEventListener("touchmove", () => {}, { passive: true });
    canvasEl.addEventListener("wheel", () => {}, { passive: true });

    // WebGL Context Lost & Restored Error Boundary Recovery
    canvasEl.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        console.warn("[3D FieldShift] ⚠️ WebGL Context Lost! Switching to 2D Farm canvas fallback.");
        show2DFarmFallback();
    }, false);

    canvasEl.addEventListener("webglcontextrestored", () => {
        console.log("[3D FieldShift] 🔄 WebGL Context Restored! Re-initializing 3D scene.");
        hide2DFarmFallback();
        if (activeCropId) {
            createCropField(activeCropId);
        }
    }, false);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 0.8;
    controls.maxDistance = 24.0;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.enablePan = true;
    controls.panSpeed = 0.6;
    controls.target.set(0, 0.65, 0);
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.addEventListener("change", () => requestShadowUpdate());

    try {
        initProceduralTextures();
        initEnvironmentLighting();
        initTerrain();
        initSmartFarmIoTNodes();

        // Particle Systems
        initRealisticRainSystem();
        initSprayMistSystem();
        initFertilizerGlowSystem();
        initSprinklerSystem();

        // Build Default Crop (Tomato)
        createCropField("tomato");

        initRaycasting();
        bindUIControls();
        setTimeOfDayMode("noon");
    } catch (sysErr) {
        console.warn("[3D FieldShift] Subsystem initialization warning:", sysErr);
    }

    // Initialize Live NASA Agroclimatology Engine & Sync 3D Environment with Active Farmer
    try {
        const initialFarmer = (typeof window !== "undefined" && window.authService) ? window.authService.getCurrentFarmer() : null;
        const initialCrop = (initialFarmer && initialFarmer.primaryCrop) ? initialFarmer.primaryCrop : "rice";
        const initialZone = (initialFarmer && initialFarmer.district) ? initialFarmer.district.toLowerCase() : "mymensingh";
        const initialLat = initialFarmer ? initialFarmer.lat : null;
        const initialLon = initialFarmer ? initialFarmer.lon : null;

        if (initialCrop) {
            updateCropSimulation(initialCrop);
        }

        fetchNasaAgriData(initialZone, initialLat, initialLon).then(() => {
            syncSimulationWithNasaData();
        }).catch((e) => console.warn("[NASA] Initial fetch fallback:", e));

        onNasaDataUpdated(() => {
            syncSimulationWithNasaData();
        });
    } catch (nasaErr) {
        console.warn("[3D FieldShift] NASA sync init warning:", nasaErr);
    }

    // Real-Time Ecosystem Synchronization with Farmer Authentication
    window.addEventListener("farmer-auth-changed", (e) => {
        try {
            const farmer = e.detail;
            if (!farmer) return;

            console.log(`[3D Simulation] 🔄 Real-time sync for ${farmer.name}: Crop -> ${farmer.primaryCrop}, District -> ${farmer.district}`);

            // 1. Switch 3D Crop Simulation
            if (farmer.primaryCrop) {
                updateCropSimulation(farmer.primaryCrop);
            }

            // 2. Sync Location Controller Dropdown
            const distKey = (farmer.district || "").toLowerCase();
            const locSelect = document.getElementById("fctrlLocSelect");
            if (locSelect) {
                const hasOption = Array.from(locSelect.options).some(opt => opt.value === distKey);
                if (hasOption) {
                    locSelect.value = distKey;
                }
            }

            // 3. Fetch Live NASA Agroclimatology for Farmer GPS
            fetchNasaAgriData(distKey, farmer.lat, farmer.lon).then(() => {
                syncSimulationWithNasaData();
            }).catch((err) => console.warn("[NASA] Farmer sync fetch error:", err));
        } catch (authSyncErr) {
            console.warn("[3D FieldShift] Real-time auth sync warning:", authSyncErr);
        }
    });

    // Auto-dismiss gesture hint on first touch or after 4s
    const hintEl = document.getElementById("mobileGestureHint");
    if (hintEl) {
        const dismissHint = () => {
            hintEl.style.opacity = "0";
            setTimeout(() => {
                if (hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
            }, 400);
            window.removeEventListener("pointerdown", dismissHint);
        };
        window.addEventListener("pointerdown", dismissHint, { passive: true });
        setTimeout(dismissHint, 4000);
    }

    formatDropdownLabelsForMobile();
    updateFieldSpatialPins(activeCropId || "tomato");

    window.addEventListener("resize", onWindowResize, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(onWindowResize, 150), { passive: true });

    // Viewport-aware rendering to eliminate 100% idle GPU/CPU battery drain when scrolled away or tab hidden
    setupViewportAwareRendering(containerEl);
    initSpatialMarkerInteractions();
    isRenderLoopRunning = true;
    requestShadowUpdate();
    requestAnimationFrame(animate);

    console.log("🍅 [Field Shift] Photorealistic 3D & Spatial AR Crop Simulation Engine initialized (Mobile Optimized).");
}
window.init3DFieldSimulation = init3DFieldSimulation;

// =============================================================================
// 19. VIEWPORT-AWARE RENDERING (PAUSE OFF-SCREEN & ON INACTIVE TABS)
// =============================================================================
function setupViewportAwareRendering(container) {
    if (!container) return;
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                isSceneVisible = entry.isIntersecting;
                handleVisibilityChange();
            }
        }, { threshold: 0.05 });
        observer.observe(container);
    }
    document.addEventListener("visibilitychange", () => {
        isDocumentVisible = (document.visibilityState === "visible");
        handleVisibilityChange();
    });
}

function handleVisibilityChange() {
    const shouldRender = isSceneVisible && isDocumentVisible;
    if (shouldRender && !isRenderLoopRunning) {
        isRenderLoopRunning = true;
        requestShadowUpdate();
        requestAnimationFrame(animate);
    } else if (!shouldRender && isRenderLoopRunning) {
        isRenderLoopRunning = false;
    }
}

function onWindowResize() {
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        if (!containerEl || !renderer || !camera) return;
        const mobile = isMobileDevice();
        const width = containerEl.clientWidth || window.innerWidth;
        const height = containerEl.clientHeight || (mobile ? 560 : 680);
        cachedContainerWidth = width;
        cachedContainerHeight = height;

        camera.aspect = width / height;
        if (mobile && width < height) {
            camera.fov = 52;
        } else {
            camera.fov = 45;
        }
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        formatDropdownLabelsForMobile();
        requestShadowUpdate();
    }, 100);
}

function scheduleNonBlockingInit() {
    // Mount top navbar, controls, and telemetry UI in first frame,
    // and initialize Three.js canvas inside requestAnimationFrame for <1s instant first paint
    requestAnimationFrame(() => {
        init3DFieldSimulation();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleNonBlockingInit);
} else {
    scheduleNonBlockingInit();
}
