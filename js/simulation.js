/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — BOTANICAL PROCEDURAL 3D FIELD SIMULATOR
|--------------------------------------------------------------------------
| - Strict Ban on Cartoon Primitives: Authentic Botanical Geometry Engine
| - Curved Ribbon Blades, CatmullRom Rachis, Compound Lobed Leaflets
| - Photorealistic PBR & Subsurface Scattering (MeshPhysicalMaterial, transmission)
| - Procedural Parallel & Reticulate Leaf Vein Maps + Organic Soil Bump
| - Dense 256 Plant Clusters (16x16 Grid via THREE.InstancedMesh)
| - Authentic Farmland Terrain: Earthen Bunds (মাটির আল), Furrows & Reflective Water
| - Three.js Sky Shader + Procedural GLSL Clouds + Sun Time of Day Slider
| - GPU Wind Vertex Shader (onBeforeCompile) with Anchored Root Bases
| - Dual Camera Modes: Drone Aerial Survey (🚁) vs Ground Field Eye-Level (🌾)
| - Zero-Clutter Viewport by Default & Slide-in Glassmorphism Data Drawer
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// Core Scene Globals
let scene, camera, renderer, controls;
let containerEl, canvasEl;
let sky = null, sun = null;
let sunLight = null, hemiLight = null;
let terrainMesh = null, waterMesh = null, grassTuftsMesh = null;
let cloudMesh = null;
let currentCropGroup = null;

// Field Grid Configuration (256 Clusters in 16x16 Furrow Grid)
const ROWS = 16;
const COLS = 16;
const TOTAL_PLANTS = ROWS * COLS; // 256 plant clusters
const ROW_SPACING = 0.88;         // Distance between furrow rows (meters)
const PLANT_SPACING = 0.88;       // Distance along rows

let instanceData = [];            // Base coordinates, rotation, scale
let stemInstancedMesh = null;
let leafInstancedMesh = null;
let fruitInstancedMesh = null;

// Global Shader Uniforms
const windUniforms = {
    uTime: { value: 0.0 },
    uWindStrength: { value: 1.0 }
};

const cloudUniforms = {
    uTime: { value: 0.0 },
    uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color(1.0, 0.98, 0.92) }
};

// Texture Cache
let monocotTexture = null, monocotBump = null;
let dicotTexture = null, dicotBump = null;
let soilTexture = null;

// Animation & Interaction State
let animationTime = 0;
let activeCropId = "rice";
let isTransitioningCrop = false;
let transitionProgress = 1.0;
let transitionScale = 1.0;

// Camera State & Modes
let currentCameraMode = "field"; // 'drone' | 'field' | 'custom'
let targetCameraPos = new THREE.Vector3(0, 0.90, 5.2);
let targetLookAt = new THREE.Vector3(0, 0.65, 0);
let isTransitioningCamera = false;

// Reusable Matrix & Math
const dummy = new THREE.Object3D();

// 15 Crop Metadata for Live Data Drawer (Bilingual & Agricultural)
const CROP_METRICS = {
    rice: {
        nameBn: "আমন ধান",
        nameEn: "Aman Rice (Wetland Paddy)",
        subtitle: "হাই-ইয়েল্ডিং জাত · দানা গঠন ও পরিপক্বতা পর্যায়",
        npk: "১০০ - ২০ - ৪০ কেজি/হেক্টর",
        moisture: "৭৫% – ৮৫% (প্লাবিত জমির নালা)",
        ph: "৬.০ – ৬.৮",
        temp: "২৫°C – ৩২°C",
        duration: "১১০ – ১২৫ দিন",
        waterRequired: true,
        heightCategory: "medium",
        advisory: "শীষে দানা ভরার সময় জমিতে ২-৩ ইঞ্চি পানি রাখুন। পাতা ব্লাইট দমনে প্রয়োজনে কার্বেনডাজিম স্প্রে করুন।"
    },
    wheat: {
        nameBn: "উফশী গম",
        nameEn: "Wheat Field (Golden Triticum)",
        subtitle: "রবি শস্য · দানার বৃদ্ধি ও পুষ্টিকালীন পর্যায়",
        npk: "১২০ - ৬০ - ৬০ কেজি/হেক্টর",
        moisture: "৫৫% – ৬৫% (সুনিষ্কাশিত দোআঁশ)",
        ph: "৬.২ – ৭.০",
        temp: "১৮°C – ২৫°C",
        duration: "১০৫ – ১১৫ দিন",
        waterRequired: false,
        heightCategory: "medium",
        advisory: "শীষ আসার সময় হালকা সেচ দিন। ব্লাস্ট বা মরিচা রোগের লক্ষণ দেখা দিলে উপযুক্ত ছত্রাকনাশক ব্যবহার করুন।"
    },
    maize: {
        nameBn: "হাইব্রিড ভুট্টা",
        nameEn: "Hybrid Maize Field",
        subtitle: "উচ্চফলনশীল খাদ্যশস্য · মোচা ও সিল্কিং পর্যায়",
        npk: "২৫০ - ১২০ - ১২০ কেজি/হেক্টর",
        moisture: "৬০% – ৭০% (উচ্চ পুষ্টি চাহিদা)",
        ph: "৫.৮ – ৭.২",
        temp: "২১°C – ৩০°C",
        duration: "১৩০ – ১৪৫ দিন",
        waterRequired: false,
        heightCategory: "tall",
        advisory: "গাছের গোড়ায় মাটি তুলে দিন। ফল আর্মিওয়ার্ম পোকার আক্রমণ প্রতিহত করতে নিয়মিত পর্যবেক্ষণ করুন।"
    },
    jute: {
        nameBn: "তোষা পাট",
        nameEn: "Golden Jute (Wetland Fibers)",
        subtitle: "অর্থকরী আঁশ ফসল · পূর্ণাঙ্গ উদ্ভিদ বৃদ্ধি",
        npk: "৬০ - ৩০ - ৩০ কেজি/হেক্টর",
        moisture: "৭০% – ৮০% (উচ্চ আর্দ্রতা প্রিয়)",
        ph: "৬.০ – ৭.২",
        temp: "২৮°C – ৩৫°C",
        duration: "১০০ – ১২০ দিন",
        waterRequired: true,
        heightCategory: "tall",
        advisory: "আগাছা পরিষ্কার রাখুন এবং ঘোড়া পোকার আক্রমণ দেখা দিলে বায়োপেস্টিসাইড স্প্রে করুন।"
    },
    potato: {
        nameBn: "ডায়মন্ড আলু",
        nameEn: "Diamond Potato Ridge Plot",
        subtitle: "কন্দ জাতীয় কন্দশস্য · টিউবার গঠন পর্যায়",
        npk: "৩০০ - ১৫০ - ২৫০ কেজি/হেক্টর",
        moisture: "৬৫% – ৭২% (সুনিষ্কাশিত মাটির ভাঁজ)",
        ph: "৫.৫ – ৬.৫",
        temp: "১৬°C – ২২°C",
        duration: "৮৫ – ৯৫ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "নাবিম ধসা (Late Blight) প্রতিরোধে ঘন কুয়াশার সময় উপযুক্ত ছত্রাকনাশক স্প্রে করুন ও গোড়া বেঁধে দিন।"
    },
    mustard: {
        nameBn: "টরি-৭ সরিষা",
        nameEn: "Mustard Flower Field",
        subtitle: "তৈলবীজ ফসল · হলুদ ফুল প্রস্ফুটন পর্যায়",
        npk: "৮০ - ৪০ - ৪০ কেজি/হেক্টর",
        moisture: "৫০% – ৬০% (সহনশীল আর্দ্রতা)",
        ph: "৬.০ – ৭.৫",
        temp: "১৫°C – ২২°C",
        duration: "৭৫ – ৮৫ দিন",
        waterRequired: false,
        heightCategory: "medium",
        advisory: "ফুল আসার পূর্বে একটি হালকা সেচ দিন। জাব পোকার উপদ্রব দেখা দিলে নিম তেলের মিশ্রণ স্প্রে করুন।"
    },
    tomato: {
        nameBn: "বারি টমেটো",
        nameEn: "Tomato Bush Field",
        subtitle: "উচ্চমূল্যের সবজি · পাকা ফল ও পুষ্পায়ন পর্যায়",
        npk: "১৫০ - ১০০ - ১২০ কেজি/হেক্টর",
        moisture: "৬০% – ৭০% (নিয়মিত হালকা সেচ)",
        ph: "৬.০ – ৬.৮",
        temp: "২০°C – ২৮°C",
        duration: "৯০ – ১১০ দিন",
        waterRequired: false,
        heightCategory: "medium",
        advisory: "গাছের ডালপালায় সাপোর্ট দিন। ঢলে পড়া রোগ ও ফল ছিদ্রকারী পোকা দমনে ফেরোমোন ফাঁদ ব্যবহার করুন।"
    },
    eggplant: {
        nameBn: "উত্তরা বেগুন",
        nameEn: "Eggplant / Brinjal Field",
        subtitle: "বারোমাসি সবজি · ফলন ও ফুল আসার পর্যায়",
        npk: "১৩০ - ৯০ - ১০০ কেজি/হেক্টর",
        moisture: "৬৫% – ৭২% (ভারী ও সুনিষ্কাশিত মাটি)",
        ph: "৫.৮ – ৬.৮",
        temp: "২২°C – ৩০°C",
        duration: "১১০ – ১৩০ দিন",
        waterRequired: false,
        heightCategory: "medium",
        advisory: "ডগা ও ফল ছিদ্রকারী পোকা দমনে নিয়মিত আক্রান্ত ডগা কেটে ধ্বংস করুন।"
    },
    chili: {
        nameBn: "বিন্দু মরিচ",
        nameEn: "Hot Chili Plantation",
        subtitle: "মসলা জাতীয় শস্য · ফল পরিপক্বতা পর্যায়",
        npk: "১০০ - ৬০ - ৮০ কেজি/হেক্টর",
        moisture: "৫৫% – ৬৫% (পানি নিষ্কাশন আবশ্যক)",
        ph: "৬.০ – ৭.০",
        temp: "২২°C – ৩২°C",
        duration: "৯০ – ১২০ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "গাছের পাতা কোকড়ানো রোগ (Leaf Curl Virus) রোধে সাদা মাছি দমন করুন।"
    },
    lentil: {
        nameBn: "বারি মসুর ডাল",
        nameEn: "Lentil Pulse Field",
        subtitle: "নাইট্রোজেন সংবন্ধনকারী ডাল ফসল · শুঁটি পুষ্টিকাল",
        npk: "২০ - ৪০ - ২০ কেজি/হেক্টর",
        moisture: "৪৫% – ৫৫% (কম পানি প্রয়োজন)",
        ph: "৬.২ – ৭.৫",
        temp: "১৮°C – ২৪°C",
        duration: "৯৫ – ১০৫ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "গাছের শিকড়ে রাইজোবিয়াম ব্যাকটেরিয়া বৃদ্ধি পায়। অতিরিক্ত সেচ পরিহার করুন।"
    },
    cucumber: {
        nameBn: "গ্রিন শসা",
        nameEn: "Cucumber Creeper Plot",
        subtitle: "লতানো সবজি ফসল · তরতাজা ফলন পর্যায়",
        npk: "৮০ - ৫০ - ৮০ কেজি/হেক্টর",
        moisture: "৭০% – ৮০% (উচ্চ পানি প্রিয়)",
        ph: "৬.০ – ৭.০",
        temp: "২৪°C – ৩২°C",
        duration: "৫৫ – ৭০ দিন",
        heightCategory: "low",
        advisory: "মাটির উপরে সমানভাবে ছড়িয়ে লতা বৃদ্ধি পায়; পাউডারি মিলডিউ প্রতিরোধে নজর রাখুন।"
    },
    cauliflower: {
        nameBn: "স্নোবল ফুলকপি",
        nameEn: "Cauliflower Field",
        subtitle: "শীতকালীন সবজি · সাদা কার্ড পুষ্টিকালীন পর্যায়",
        npk: "১০০ - ৮০ - ১০০ কেজি/হেক্টর",
        moisture: "৬৫% – ৭৫% (পর্যাপ্ত জৈবসার সমৃদ্ধ)",
        ph: "৬.৫ – ৭.২",
        temp: "১৫°C – ২২°C",
        duration: "৭৫ – ৯০ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "কার্ড যেন সূর্যের তীব্র আলোয় হলুদ না হয় সেজন্য পাতা দিয়ে ঢেকে (ব্লাঞ্চিং) রাখুন।"
    },
    onion: {
        nameBn: "তাহেরপুরী পেঁয়াজ",
        nameEn: "Onion Bulb Ridge",
        subtitle: "মসলা জাতীয় কন্দশস্য · কন্দ বৃদ্ধি পর্যায়",
        npk: "১০০ - ৮০ - ১০০ কেজি/হেক্টর",
        moisture: "৫০% – ৬০% (মাটির ভাজে উন্নত নিষ্কাশন)",
        ph: "৬.০ – ৬.৮",
        temp: "১৮°C – ২৬°C",
        duration: "৯০ – ১১০ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "কন্দ উঠানোর ১৫ দিন পূর্বে সেচ দেওয়া বন্ধ রাখুন যাতে পেঁয়াজের সংরক্ষণ ক্ষমতা বৃদ্ধি পায়।"
    },
    carrot: {
        nameBn: "কুঁজো গাজর",
        nameEn: "Carrot Fronds Field",
        subtitle: "মূল জাতীয় পুষ্টিকর সবজি · মূল স্ফীতি পর্যায়",
        npk: "৮০ - ৬০ - ৮০ কেজি/হেক্টর",
        moisture: "৬০% – ৭০% (ঝুরঝুরে বেলে দোআঁশ)",
        ph: "৬.০ – ৬.৮",
        temp: "১৬°C – ২৪°C",
        duration: "৮০ – ৯৫ দিন",
        waterRequired: false,
        heightCategory: "low",
        advisory: "মাটি নরম ও ঝুরঝুরে রাখুন যাতে গাজর সোজা ও মসৃণভাবে নিচের দিকে বৃদ্ধি পেতে পারে।"
    },
    papaya: {
        nameBn: "রেড লেডি পেঁপে",
        nameEn: "Papaya Orchard Field",
        subtitle: "উচ্চ ফলনশীল ফল ফসল · ফল ধারণ পর্যায়",
        npk: "১৫০ - ১৫০ - ২০০ গ্রাম/গাছ",
        moisture: "৬৫% – ৭৫% (গোড়ায় পানি জমা নিষেধ)",
        ph: "৬.০ – ৭.০",
        temp: "২৫°C – ৩৫°C",
        duration: "৮ – ১০ মাস",
        waterRequired: false,
        heightCategory: "tall",
        advisory: "গাছের গোড়ায় যাতে কখনোই পানি জমে না থাকে সেদিকে খেয়াল রাখুন। রিং পদ্ধতিতে সার প্রয়োগ করুন।"
    }
};

/*
|--------------------------------------------------------------------------
| 1. PROCEDURAL HIGH-RESOLUTION PBR TEXTURES (CANVAS-BASED)
|--------------------------------------------------------------------------
*/
function initProceduralTextures() {
    // A. Monocot Leaf Texture (Rice, Wheat, Maize: Parallel Veins & Chlorophyll Gradient)
    const monoCanvas = document.createElement("canvas");
    monoCanvas.width = 512;
    monoCanvas.height = 512;
    const mCtx = monoCanvas.getContext("2d");

    // Vertical chlorophyll gradient (Base: deep dark green -> Mid: vibrant sunlit green -> Tip: golden tint)
    const mGrad = mCtx.createLinearGradient(0, 512, 0, 0);
    mGrad.addColorStop(0.00, "#163c1a"); // Base
    mGrad.addColorStop(0.35, "#256b2c"); // Lower mid
    mGrad.addColorStop(0.70, "#3da33d"); // Vibrant sunlit
    mGrad.addColorStop(0.95, "#68b945"); // Upper
    mGrad.addColorStop(1.00, "#a8c042"); // Tip
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, 512, 512);

    // Fine parallel veins running along length
    mCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    mCtx.lineWidth = 1.0;
    for (let x = 8; x < 512; x += 6) {
        mCtx.beginPath();
        mCtx.moveTo(x, 512);
        mCtx.lineTo(x, 0);
        mCtx.stroke();
    }

    // Central Midrib Spine
    mCtx.strokeStyle = "rgba(180, 235, 140, 0.35)";
    mCtx.lineWidth = 4.0;
    mCtx.beginPath();
    mCtx.moveTo(256, 512);
    mCtx.lineTo(256, 0);
    mCtx.stroke();

    monocotTexture = new THREE.CanvasTexture(monoCanvas);
    monocotTexture.wrapS = THREE.RepeatWrapping;
    monocotTexture.wrapT = THREE.RepeatWrapping;

    // Bump map for monocot leaf
    const monoBumpCanvas = document.createElement("canvas");
    monoBumpCanvas.width = 512;
    monoBumpCanvas.height = 512;
    const mbCtx = monoBumpCanvas.getContext("2d");
    mbCtx.fillStyle = "#808080";
    mbCtx.fillRect(0, 0, 512, 512);
    mbCtx.strokeStyle = "#ffffff";
    mbCtx.lineWidth = 5.0;
    mbCtx.beginPath();
    mbCtx.moveTo(256, 512);
    mbCtx.lineTo(256, 0);
    mbCtx.stroke();
    mbCtx.strokeStyle = "#a0a0a0";
    mbCtx.lineWidth = 1.5;
    for (let x = 12; x < 512; x += 10) {
        mbCtx.beginPath();
        mbCtx.moveTo(x, 512);
        mbCtx.lineTo(x, 0);
        mbCtx.stroke();
    }
    monocotBump = new THREE.CanvasTexture(monoBumpCanvas);

    // B. Dicot Leaf Texture (Reticulate Netted Veins for Broadleaf Crops)
    const dicotCanvas = document.createElement("canvas");
    dicotCanvas.width = 512;
    dicotCanvas.height = 512;
    const dCtx = dicotCanvas.getContext("2d");

    const dGrad = dCtx.createLinearGradient(0, 512, 0, 0);
    dGrad.addColorStop(0.00, "#19431f");
    dGrad.addColorStop(0.50, "#2c7733");
    dGrad.addColorStop(0.90, "#489f41");
    dGrad.addColorStop(1.00, "#82b842");
    dCtx.fillStyle = dGrad;
    dCtx.fillRect(0, 0, 512, 512);

    // Strong Midrib
    dCtx.strokeStyle = "rgba(200, 240, 160, 0.45)";
    dCtx.lineWidth = 5.0;
    dCtx.beginPath();
    dCtx.moveTo(256, 512);
    dCtx.lineTo(256, 0);
    dCtx.stroke();

    // Lateral Reticulate Veins at 45 degree angles
    dCtx.strokeStyle = "rgba(180, 230, 140, 0.22)";
    dCtx.lineWidth = 2.0;
    for (let y = 480; y > 30; y -= 36) {
        // Left branch
        dCtx.beginPath();
        dCtx.moveTo(256, y);
        dCtx.quadraticCurveTo(160, y - 25, 40, y - 55);
        dCtx.stroke();
        // Right branch
        dCtx.beginPath();
        dCtx.moveTo(256, y);
        dCtx.quadraticCurveTo(352, y - 25, 472, y - 55);
        dCtx.stroke();
    }

    dicotTexture = new THREE.CanvasTexture(dicotCanvas);
    dicotTexture.wrapS = THREE.RepeatWrapping;
    dicotTexture.wrapT = THREE.RepeatWrapping;

    // Bump map for dicot leaf
    const dicotBumpCanvas = document.createElement("canvas");
    dicotBumpCanvas.width = 512;
    dicotBumpCanvas.height = 512;
    const dbCtx = dicotBumpCanvas.getContext("2d");
    dbCtx.fillStyle = "#808080";
    dbCtx.fillRect(0, 0, 512, 512);
    dbCtx.strokeStyle = "#ffffff";
    dbCtx.lineWidth = 6.0;
    dbCtx.beginPath();
    dbCtx.moveTo(256, 512);
    dbCtx.lineTo(256, 0);
    dbCtx.stroke();
    dbCtx.strokeStyle = "#b0b0b0";
    dbCtx.lineWidth = 2.5;
    for (let y = 480; y > 30; y -= 36) {
        dbCtx.beginPath();
        dbCtx.moveTo(256, y);
        dbCtx.quadraticCurveTo(160, y - 25, 40, y - 55);
        dbCtx.stroke();
        dbCtx.beginPath();
        dbCtx.moveTo(256, y);
        dbCtx.quadraticCurveTo(352, y - 25, 472, y - 55);
        dbCtx.stroke();
    }
    dicotBump = new THREE.CanvasTexture(dicotBumpCanvas);

    // C. Organic Plowed Soil Texture (Dark Organic Loam with Crumb & Mud Micro-cracks)
    const soilCanvas = document.createElement("canvas");
    soilCanvas.width = 512;
    soilCanvas.height = 512;
    const sCtx = soilCanvas.getContext("2d");
    sCtx.fillStyle = "#271b12";
    sCtx.fillRect(0, 0, 512, 512);

    // Specks of humus & soil crumbs
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const rad = 1.0 + Math.random() * 2.5;
        sCtx.fillStyle = Math.random() > 0.5 ? "rgba(60, 44, 30, 0.6)" : "rgba(18, 12, 8, 0.7)";
        sCtx.beginPath();
        sCtx.arc(x, y, rad, 0, Math.PI * 2);
        sCtx.fill();
    }
    soilTexture = new THREE.CanvasTexture(soilCanvas);
    soilTexture.wrapS = THREE.RepeatWrapping;
    soilTexture.wrapT = THREE.RepeatWrapping;
    soilTexture.repeat.set(8, 8);
}

/*
|--------------------------------------------------------------------------
| 2. BOTANICAL PROCEDURAL MESH GENERATORS (NO CARTOON PRIMITIVES)
|--------------------------------------------------------------------------
*/

/**
 * Creates a tapered, curved ribbon blade with V-shaped midrib crease
 * Width tapers smoothly to 0 at apex. Uses parabolic gravity curvature.
 */
function createCurvedBladeGeometry(length, baseWidth, midWidth, archX, archZ, creaseAngle) {
    const segments = 8;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const creaseRad = (creaseAngle || 20) * (Math.PI / 180);
    const cosC = Math.cos(creaseRad);
    const sinC = Math.sin(creaseRad);

    for (let i = 0; i <= segments; i++) {
        const t = i / segments; // 0 (base) to 1 (tip)

        // Width tapers: base -> midWidth -> 0 at apex
        const w = (t < 0.4)
            ? THREE.MathUtils.lerp(baseWidth, midWidth, t / 0.4)
            : THREE.MathUtils.lerp(midWidth, 0.001, (t - 0.4) / 0.6);

        // Parabolic gravity arch
        const y = length * (t - 0.35 * Math.pow(t, 2.2));
        const xOffset = archX * Math.pow(t, 1.8);
        const zOffset = archZ * Math.pow(t, 1.8);

        // 3 Vertices across cross-section: Left Margin (-w), Center Midrib (0), Right Margin (+w)
        // Left vertex (slightly folded up/down by creaseAngle)
        positions.push(xOffset - w * cosC, y, zOffset - w * sinC);
        uvs.push(0.0, t);
        normals.push(-sinC, cosC, 0);

        // Center spine vertex (midrib crease)
        positions.push(xOffset, y, zOffset);
        uvs.push(0.5, t);
        normals.push(0, 1, 0);

        // Right vertex
        positions.push(xOffset + w * cosC, y, zOffset + w * sinC);
        uvs.push(1.0, t);
        normals.push(sinC, cosC, 0);

        if (i < segments) {
            const baseIdx = i * 3;
            // Left quad: (L0, C0, C1) and (L0, C1, L1)
            indices.push(baseIdx, baseIdx + 1, baseIdx + 4);
            indices.push(baseIdx, baseIdx + 4, baseIdx + 3);

            // Right quad: (C0, R0, R1) and (C0, R1, C1)
            indices.push(baseIdx + 1, baseIdx + 2, baseIdx + 5);
            indices.push(baseIdx + 1, baseIdx + 5, baseIdx + 4);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
}

/**
 * Creates clustered grain panicle (ধানের ছড়া / গমের শিষ) along a drooping spline
 */
function createDroopingPanicleGeometry(spineLength, grainCount, isDrooping, awnLength) {
    const geometries = [];

    // 1. Central Rachis/Spine Curve
    const spinePts = [];
    const curveSegments = 12;
    for (let i = 0; i <= curveSegments; i++) {
        const t = i / curveSegments;
        const y = spineLength * (t - (isDrooping ? 0.6 : 0.15) * t * t);
        const x = (isDrooping ? 0.22 : 0.04) * Math.pow(t, 2);
        spinePts.push(new THREE.Vector3(x, y, 0));
    }
    const spineCurve = new THREE.CatmullRomCurve3(spinePts);
    const rachisGeo = new THREE.TubeGeometry(spineCurve, 10, 0.008, 4, false);
    geometries.push(rachisGeo);

    // 2. Micro-Grains attached along the rachis in alternate/spiral positions
    const grainSpindleGeo = new THREE.CylinderGeometry(0.010, 0.016, 0.055, 5);
    grainSpindleGeo.scale(1.0, 1.0, 0.7); // Flattened oval grain

    for (let i = 2; i < grainCount; i++) {
        const t = i / grainCount;
        const pt = spineCurve.getPoint(t);
        const tangent = spineCurve.getTangent(t);

        const side = (i % 2 === 0) ? 1 : -1;
        const grainClone = grainSpindleGeo.clone();

        // Orientation
        grainClone.rotateZ(side * 0.45);
        grainClone.translate(pt.x + side * 0.022, pt.y, pt.z + (Math.sin(i) * 0.01));
        geometries.push(grainClone);

        // Awn (লম্বা শুঙ / রোম)
        if (awnLength && awnLength > 0.01) {
            const awnGeo = new THREE.CylinderGeometry(0.001, 0.002, awnLength, 3);
            awnGeo.rotateZ(side * 0.3);
            awnGeo.translate(pt.x + side * 0.038, pt.y + 0.035, pt.z);
            geometries.push(awnGeo);
        }
    }

    // Merge into single BufferGeometry
    return mergeBufferGeometries(geometries);
}

/**
 * Compound Dicot Leaf (Rachis with 5-7 serrated/lobed leaflets)
 */
function createCompoundLeafGeometry(leafletsCount, rachisLength, leafletLength) {
    const geometries = [];

    // Central petiole/rachis
    const rachisCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.05, rachisLength * 0.5, 0.02),
        new THREE.Vector3(0.12, rachisLength, 0.05)
    ]);
    const petioleGeo = new THREE.TubeGeometry(rachisCurve, 8, 0.009, 4, false);
    geometries.push(petioleGeo);

    // Lateral Leaflets
    const pairs = Math.floor(leafletsCount / 2);
    for (let i = 1; i <= pairs; i++) {
        const t = i / (pairs + 1);
        const pt = rachisCurve.getPoint(t);

        const lBlade = createCurvedBladeGeometry(leafletLength * (1.1 - t * 0.3), 0.012, 0.055, 0.06, 0.02, 18);
        const rBlade = lBlade.clone();

        lBlade.rotateZ(0.75);
        lBlade.rotateY(-0.35);
        lBlade.translate(pt.x - 0.02, pt.y, pt.z);

        rBlade.rotateZ(-0.75);
        rBlade.rotateY(0.35);
        rBlade.translate(pt.x + 0.02, pt.y, pt.z);

        geometries.push(lBlade, rBlade);
    }

    // Terminal Apex Leaflet
    const apexPt = rachisCurve.getPoint(1.0);
    const apexBlade = createCurvedBladeGeometry(leafletLength * 1.1, 0.014, 0.06, 0.04, 0.0, 15);
    apexBlade.translate(apexPt.x, apexPt.y, apexPt.z);
    geometries.push(apexBlade);

    return mergeBufferGeometries(geometries);
}

/**
 * Helper to merge array of BufferGeometries into one BufferGeometry
 */
function mergeBufferGeometries(geos) {
    let totalPos = 0, totalNorm = 0, totalUv = 0, totalIdx = 0;
    geos.forEach(g => {
        totalPos += g.attributes.position.array.length;
        if (g.attributes.normal) totalNorm += g.attributes.normal.array.length;
        if (g.attributes.uv) totalUv += g.attributes.uv.array.length;
        if (g.index) totalIdx += g.index.array.length;
    });

    const posArr = new Float32Array(totalPos);
    const normArr = new Float32Array(totalNorm);
    const uvArr = new Float32Array(totalUv);
    const idxArr = new Uint32Array(totalIdx);

    let posOff = 0, normOff = 0, uvOff = 0, idxOff = 0, vtxCount = 0;

    geos.forEach(g => {
        posArr.set(g.attributes.position.array, posOff);
        posOff += g.attributes.position.array.length;

        if (g.attributes.normal) {
            normArr.set(g.attributes.normal.array, normOff);
            normOff += g.attributes.normal.array.length;
        }

        if (g.attributes.uv) {
            uvArr.set(g.attributes.uv.array, uvOff);
            uvOff += g.attributes.uv.array.length;
        }

        if (g.index) {
            const idxs = g.index.array;
            for (let i = 0; i < idxs.length; i++) {
                idxArr[idxOff + i] = idxs[i] + vtxCount;
            }
            idxOff += idxs.length;
        }

        vtxCount += g.attributes.position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    if (totalNorm > 0) merged.setAttribute("normal", new THREE.BufferAttribute(normArr, 3));
    if (totalUv > 0) merged.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
    if (totalIdx > 0) merged.setIndex(new THREE.BufferAttribute(idxArr, 1));

    merged.computeVertexNormals();
    return merged;
}

/*
|--------------------------------------------------------------------------
| 3. ANATOMICAL 3D FRUIT & FLOWER BUILDERS (ZERO CARTOONS)
|--------------------------------------------------------------------------
*/

// Tomato: Lobed sphere with 5-pointed sepal calyx star
function createTomatoFruitGeometry() {
    const geos = [];
    const sphere = new THREE.SphereGeometry(0.08, 12, 10);
    sphere.scale(1.15, 0.95, 1.15); // Oblate tomato shape
    geos.push(sphere);

    // 5 Curved Sepals on top
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const sepal = createCurvedBladeGeometry(0.045, 0.005, 0.012, 0.02, 0.01, 15);
        sepal.rotateZ(Math.PI * 0.5);
        sepal.rotateY(angle);
        sepal.translate(0, 0.075, 0);
        geos.push(sepal);
    }
    return mergeBufferGeometries(geos);
}

// Eggplant: Elongated teardrop with enclosing fleshy green calyx cap
function createEggplantFruitGeometry() {
    const geos = [];
    const pts = [
        new THREE.Vector2(0.015, 0.0),
        new THREE.Vector2(0.040, -0.06),
        new THREE.Vector2(0.075, -0.16),
        new THREE.Vector2(0.070, -0.22),
        new THREE.Vector2(0.000, -0.26)
    ];
    const body = new THREE.LatheGeometry(pts, 12);
    geos.push(body);

    // Calyx Cap covering top
    const capPts = [
        new THREE.Vector2(0.018, 0.02),
        new THREE.Vector2(0.046, -0.04),
        new THREE.Vector2(0.000, -0.06)
    ];
    const cap = new THREE.LatheGeometry(capPts, 8);
    geos.push(cap);

    return mergeBufferGeometries(geos);
}

// Chili: Slender curved cone with hexagonal cap
function createChiliFruitGeometry() {
    const geos = [];
    const pts = [];
    for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const rad = Math.sin(t * Math.PI * 0.85) * 0.028;
        const x = Math.sin(t * 0.8) * 0.02;
        const y = -t * 0.18;
        pts.push(new THREE.Vector3(x, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const pod = new THREE.TubeGeometry(curve, 10, 0.022, 7, false);
    geos.push(pod);
    return mergeBufferGeometries(geos);
}

// Papaya: Oblong ribbed melon-like fruit
function createPapayaFruitGeometry() {
    const pts = [
        new THREE.Vector2(0.02, 0.12),
        new THREE.Vector2(0.075, 0.06),
        new THREE.Vector2(0.095, -0.04),
        new THREE.Vector2(0.065, -0.14),
        new THREE.Vector2(0.00, -0.18)
    ];
    return new THREE.LatheGeometry(pts, 10);
}

// Maize Cob with wrapped green husks & silk
function createMaizeCobGeometry() {
    const geos = [];
    const cob = new THREE.CylinderGeometry(0.05, 0.065, 0.32, 10);
    cob.translate(0, 0.16, 0);
    geos.push(cob);

    // Wrapped husk leaves
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const husk = createCurvedBladeGeometry(0.35, 0.04, 0.07, 0.04, 0.02, 25);
        husk.rotateY(angle);
        husk.translate(0, 0.04, 0);
        geos.push(husk);
    }
    return mergeBufferGeometries(geos);
}

// Cauliflower Curd: Faceted bumpy domed curd
function createCauliflowerCurdGeometry() {
    const geos = [];
    const baseCurd = new THREE.DodecahedronGeometry(0.18, 2);
    baseCurd.scale(1.15, 0.70, 1.15);
    geos.push(baseCurd);

    // Inward curling waxy wrapper leaves
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const wrap = createCurvedBladeGeometry(0.32, 0.06, 0.12, -0.08, 0.05, 30);
        wrap.rotateY(angle);
        wrap.translate(0, 0.02, 0);
        geos.push(wrap);
    }
    return mergeBufferGeometries(geos);
}

/*
|--------------------------------------------------------------------------
| 4. 15 CROPS BOTANICAL ENGINE (MULTI-PART PROCEDURAL ASSETS)
|--------------------------------------------------------------------------
*/
function buildBotanicalCropAssets(cropId) {
    let stemGeom, leafGeom, fruitGeom;
    let stemMat, leafMat, fruitMat;
    let maxCropHeight = 1.0;

    // Default High-Grade Leaf Material with Subsurface Scattering & Vein Textures
    const isMonocot = ["rice", "wheat", "maize", "jute", "onion"].includes(cropId);
    leafMat = new THREE.MeshPhysicalMaterial({
        map: isMonocot ? monocotTexture : dicotTexture,
        bumpMap: isMonocot ? monocotBump : dicotBump,
        bumpScale: 0.025,
        roughness: 0.44,
        clearcoat: 0.16,
        clearcoatRoughness: 0.32,
        transmission: 0.24, // Sun shines through thin leaf!
        thickness: 0.48,    // Subsurface translucency
        ior: 1.44,
        side: THREE.DoubleSide
    });

    switch (cropId) {
        case "rice": {
            maxCropHeight = 1.05;
            // Cluster of 6 curved tapering blades radiating from crown
            const blades = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + (Math.random() * 0.3);
                const b = createCurvedBladeGeometry(0.85 + Math.random() * 0.2, 0.018, 0.045, 0.18, 0.10, 22);
                b.rotateY(angle);
                blades.push(b);
            }
            leafGeom = mergeBufferGeometries(blades);

            // Basal tillers stem
            stemGeom = new THREE.CylinderGeometry(0.015, 0.028, 0.45, 6);
            stemGeom.translate(0, 0.22, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7023, roughness: 0.7 });

            // Drooping golden grain panicle (ধানের ছড়া/শীষ)
            fruitGeom = createDroopingPanicleGeometry(0.42, 18, true, 0.025);
            fruitGeom.rotateY(0.4);
            fruitGeom.translate(0.08, 0.65, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.42, metalness: 0.1 });
            break;
        }

        case "wheat": {
            maxCropHeight = 0.98;
            // Narrow upright amber/green linear blades
            const blades = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const b = createCurvedBladeGeometry(0.70 + Math.random() * 0.15, 0.014, 0.035, 0.10, 0.06, 18);
                b.rotateY(angle);
                blades.push(b);
            }
            leafGeom = mergeBufferGeometries(blades);

            stemGeom = new THREE.CylinderGeometry(0.014, 0.022, 0.85, 6);
            stemGeom.translate(0, 0.42, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0xb09848, roughness: 0.75 });

            // Compact erect bearded spike with bristly awns (গমের শিষ)
            fruitGeom = createDroopingPanicleGeometry(0.32, 14, false, 0.055);
            fruitGeom.translate(0, 0.78, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xe6c875, roughness: 0.4 });
            break;
        }

        case "maize": {
            maxCropHeight = 2.4;
            // Thick tall stalk with nodes
            stemGeom = new THREE.CylinderGeometry(0.045, 0.065, 2.2, 8);
            stemGeom.translate(0, 1.1, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3b772b, roughness: 0.65 });

            // Broad alternating ribbon leaves drooping gracefully
            const blades = [];
            for (let i = 0; i < 8; i++) {
                const y = 0.5 + i * 0.22;
                const angle = (i * 137.5) * (Math.PI / 180); // Golden angle
                const b = createCurvedBladeGeometry(1.05, 0.06, 0.15, 0.35, 0.12, 30);
                b.rotateY(angle);
                b.translate(0, y, 0);
                blades.push(b);
            }
            leafGeom = mergeBufferGeometries(blades);

            // Corn Cob in husk with silk
            fruitGeom = createMaizeCobGeometry();
            fruitGeom.rotateZ(0.3);
            fruitGeom.translate(0.12, 1.15, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 });
            break;
        }

        case "jute": {
            maxCropHeight = 3.1;
            // Tall slender fibrous stem
            stemGeom = new THREE.CylinderGeometry(0.028, 0.042, 2.8, 7);
            stemGeom.translate(0, 1.4, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x357842, roughness: 0.7 });

            // Clustered canopy of serrated ovate leaves at top
            const leaves = [];
            for (let i = 0; i < 10; i++) {
                const y = 2.1 + i * 0.08;
                const angle = (i * 137.5) * (Math.PI / 180);
                const l = createCurvedBladeGeometry(0.42, 0.02, 0.085, 0.14, 0.05, 20);
                l.rotateY(angle);
                l.translate(0, y, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);
            fruitGeom = null;
            break;
        }

        case "potato": {
            maxCropHeight = 0.65;
            // Low branching compound bushy canopy
            const stems = [];
            const leaves = [];
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const s = new THREE.CylinderGeometry(0.016, 0.026, 0.48, 5);
                s.rotateZ(0.25);
                s.rotateY(angle);
                s.translate(0, 0.22, 0);
                stems.push(s);

                const cLeaf = createCompoundLeafGeometry(5, 0.38, 0.14);
                cLeaf.rotateZ(0.3);
                cLeaf.rotateY(angle);
                cLeaf.translate(0, 0.28, 0);
                leaves.push(cLeaf);
            }
            stemGeom = mergeBufferGeometries(stems);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2b5e2d, roughness: 0.75 });
            leafGeom = mergeBufferGeometries(leaves);

            // Plump potato tubers peeking through furrow ridge
            const tubers = [];
            for (let i = 0; i < 3; i++) {
                const t = new THREE.SphereGeometry(0.08, 8, 6);
                t.scale(1.25, 0.85, 1.0);
                t.translate(0.12 * Math.cos(i * 2), 0.06, 0.12 * Math.sin(i * 2));
                tubers.push(t);
            }
            fruitGeom = mergeBufferGeometries(tubers);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x8d6238, roughness: 0.88 });
            break;
        }

        case "mustard": {
            maxCropHeight = 1.15;
            stemGeom = new THREE.CylinderGeometry(0.016, 0.026, 1.0, 6);
            stemGeom.translate(0, 0.5, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487a2d, roughness: 0.65 });

            // Lower lobed foliage
            const leaves = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const l = createCurvedBladeGeometry(0.32, 0.02, 0.07, 0.12, 0.04, 20);
                l.rotateY(angle);
                l.translate(0, 0.25 + i * 0.06, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Dense brilliant canary-yellow 4-petaled flower head
            const flowers = [];
            for (let i = 0; i < 16; i++) {
                const f = new THREE.DodecahedronGeometry(0.045, 1);
                f.translate((Math.random() - 0.5) * 0.22, 0.95 + Math.random() * 0.2, (Math.random() - 0.5) * 0.22);
                flowers.push(f);
            }
            fruitGeom = mergeBufferGeometries(flowers);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, emissive: 0x332600 });
            break;
        }

        case "tomato": {
            maxCropHeight = 1.0;
            // Branching vine bush
            const stems = [];
            const leaves = [];
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const s = new THREE.CylinderGeometry(0.018, 0.03, 0.65, 5);
                s.rotateZ(0.22);
                s.rotateY(angle);
                s.translate(0, 0.32, 0);
                stems.push(s);

                const cLeaf = createCompoundLeafGeometry(5, 0.45, 0.16);
                cLeaf.rotateZ(0.28);
                cLeaf.rotateY(angle + 0.3);
                cLeaf.translate(0, 0.38, 0);
                leaves.push(cLeaf);
            }
            stemGeom = mergeBufferGeometries(stems);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e652c, roughness: 0.7 });
            leafGeom = mergeBufferGeometries(leaves);

            // Glossy bright red tomatoes with green sepals
            const tomatoes = [];
            for (let i = 0; i < 3; i++) {
                const t = createTomatoFruitGeometry();
                t.translate(0.14 * Math.cos(i * 2.2), 0.42 + i * 0.08, 0.14 * Math.sin(i * 2.2));
                tomatoes.push(t);
            }
            fruitGeom = mergeBufferGeometries(tomatoes);
            fruitMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.22, clearcoat: 0.35 });
            break;
        }

        case "eggplant": {
            maxCropHeight = 0.95;
            stemGeom = new THREE.CylinderGeometry(0.026, 0.042, 0.75, 6);
            stemGeom.translate(0, 0.38, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2b5636, roughness: 0.75 });

            // Broad velvety lobed leaves
            const leaves = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * 137.5) * (Math.PI / 180);
                const l = createCurvedBladeGeometry(0.48, 0.03, 0.16, 0.22, 0.06, 25);
                l.rotateY(angle);
                l.translate(0, 0.3 + i * 0.08, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Hanging deep glossy purple brinjal
            fruitGeom = createEggplantFruitGeometry();
            fruitGeom.translate(0.12, 0.48, 0.08);
            fruitMat = new THREE.MeshPhysicalMaterial({ color: 0x36055a, roughness: 0.18, clearcoat: 0.45 });
            break;
        }

        case "chili": {
            maxCropHeight = 0.75;
            stemGeom = new THREE.CylinderGeometry(0.018, 0.03, 0.60, 5);
            stemGeom.translate(0, 0.3, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x326932, roughness: 0.7 });

            // Pointed leaves
            const leaves = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i * 137.5) * (Math.PI / 180);
                const l = createCurvedBladeGeometry(0.32, 0.015, 0.065, 0.12, 0.03, 16);
                l.rotateY(angle);
                l.translate(0, 0.22 + i * 0.05, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Red & green pointed chilies
            const chilies = [];
            for (let i = 0; i < 4; i++) {
                const c = createChiliFruitGeometry();
                c.rotateZ(0.25 * (i % 2 === 0 ? 1 : -1));
                c.translate(0.09 * Math.cos(i * 1.6), 0.45, 0.09 * Math.sin(i * 1.6));
                chilies.push(c);
            }
            fruitGeom = mergeBufferGeometries(chilies);
            fruitMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.25, clearcoat: 0.2 });
            break;
        }

        case "lentil": {
            maxCropHeight = 0.60;
            stemGeom = new THREE.CylinderGeometry(0.012, 0.02, 0.52, 5);
            stemGeom.translate(0, 0.26, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487d3a, roughness: 0.7 });

            const leaves = [];
            for (let i = 0; i < 4; i++) {
                const cLeaf = createCompoundLeafGeometry(7, 0.28, 0.08);
                cLeaf.rotateY((i / 4) * Math.PI * 2);
                cLeaf.translate(0, 0.22 + i * 0.06, 0);
                leaves.push(cLeaf);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Small flat seed pods
            const pods = [];
            for (let i = 0; i < 6; i++) {
                const p = new THREE.BoxGeometry(0.025, 0.065, 0.012);
                p.rotateZ(0.4);
                p.translate(0.07 * Math.cos(i), 0.32 + i * 0.03, 0.07 * Math.sin(i));
                pods.push(p);
            }
            fruitGeom = mergeBufferGeometries(pods);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5 });
            break;
        }

        case "cucumber": {
            maxCropHeight = 0.50;
            // Ground creeper trailing vine
            const s = new THREE.TorusGeometry(0.38, 0.018, 5, 12, Math.PI * 1.4);
            s.rotateX(Math.PI * 0.5);
            s.translate(0, 0.06, 0);
            stemGeom = s;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2b6833, roughness: 0.7 });

            const leaves = [];
            for (let i = 0; i < 5; i++) {
                const l = createCurvedBladeGeometry(0.35, 0.03, 0.14, 0.15, 0.05, 25);
                l.rotateY((i / 5) * Math.PI * 2);
                l.translate(0.2 * Math.cos(i), 0.08, 0.2 * Math.sin(i));
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Elongated green cucumber on soil
            const c = new THREE.CylinderGeometry(0.042, 0.045, 0.34, 8);
            c.rotateZ(Math.PI * 0.48);
            c.translate(0.18, 0.06, -0.1);
            fruitGeom = c;
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.35 });
            break;
        }

        case "cauliflower": {
            maxCropHeight = 0.55;
            stemGeom = new THREE.CylinderGeometry(0.038, 0.052, 0.35, 6);
            stemGeom.translate(0, 0.18, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x486b45, roughness: 0.8 });

            // Bumpy domed curd with outer waxy wrapper leaves
            fruitGeom = createCauliflowerCurdGeometry();
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfaf5e4, roughness: 0.55 });

            // Wrapper leaves
            const leaves = [];
            for (let i = 0; i < 6; i++) {
                const l = createCurvedBladeGeometry(0.38, 0.06, 0.14, -0.09, 0.06, 28);
                l.rotateY((i / 6) * Math.PI * 2);
                l.translate(0, 0.12, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);
            break;
        }

        case "onion": {
            maxCropHeight = 0.65;
            // Hollow upright tubular leaves
            const leaves = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const l = createCurvedBladeGeometry(0.55, 0.016, 0.032, 0.08, 0.04, 15);
                l.rotateY(angle);
                l.translate(0, 0.25, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);
            stemGeom = new THREE.CylinderGeometry(0.012, 0.02, 0.25, 5);
            stemGeom.translate(0, 0.12, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x24704f, roughness: 0.65 });

            // Swollen onion bulb on ridge
            const b = new THREE.SphereGeometry(0.095, 10, 8);
            b.scale(1.15, 0.85, 1.15);
            b.translate(0, 0.08, 0);
            fruitGeom = b;
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.42 });
            break;
        }

        case "carrot": {
            maxCropHeight = 0.58;
            // Feathery bipinnate fern fronds
            const leaves = [];
            for (let i = 0; i < 5; i++) {
                const cLeaf = createCompoundLeafGeometry(7, 0.42, 0.11);
                cLeaf.rotateY((i / 5) * Math.PI * 2);
                cLeaf.translate(0, 0.18, 0);
                leaves.push(cLeaf);
            }
            leafGeom = mergeBufferGeometries(leaves);
            stemGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.22, 5);
            stemGeom.translate(0, 0.11, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x367e39, roughness: 0.7 });

            // Tapered bright orange carrot root shoulder
            const cone = new THREE.ConeGeometry(0.065, 0.22, 8);
            cone.rotateX(Math.PI);
            cone.translate(0, 0.06, 0);
            fruitGeom = cone;
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
            break;
        }

        case "papaya": {
            maxCropHeight = 3.2;
            // Columnar trunk with leaf scar rings
            stemGeom = new THREE.CylinderGeometry(0.065, 0.095, 2.5, 8);
            stemGeom.translate(0, 1.25, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x625442, roughness: 0.8 });

            // Umbrella crown of palmately lobed leaf blades
            const leaves = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const l = createCurvedBladeGeometry(0.95, 0.04, 0.22, 0.45, 0.15, 28);
                l.rotateY(angle);
                l.translate(0, 2.5, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);

            // Oblong ribbed papaya fruits clustered below crown
            const papayas = [];
            for (let i = 0; i < 4; i++) {
                const p = createPapayaFruitGeometry();
                p.translate(0.12 * Math.cos(i * 1.5), 2.15, 0.12 * Math.sin(i * 1.5));
                papayas.push(p);
            }
            fruitGeom = mergeBufferGeometries(papayas);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.35 });
            break;
        }

        default:
            return buildBotanicalCropAssets("rice");
    }

    // Inject GLSL Wind Shaders into leaf & stem materials
    injectGLSLWindShader(stemMat, maxCropHeight);
    injectGLSLWindShader(leafMat, maxCropHeight);
    if (fruitMat) injectGLSLWindShader(fruitMat, maxCropHeight);

    return { stemGeom, stemMat, leafGeom, leafMat, fruitGeom, fruitMat };
}

/*
|--------------------------------------------------------------------------
| 5. GPU GLSL WIND VERTEX SHADER INJECTION (onBeforeCompile)
|--------------------------------------------------------------------------
*/
function injectGLSLWindShader(material, maxCropHeight) {
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = windUniforms.uTime;
        shader.uniforms.uWindStrength = windUniforms.uWindStrength;
        shader.uniforms.uMaxHeight = { value: maxCropHeight || 1.1 };

        shader.vertexShader = `
            uniform float uTime;
            uniform float uWindStrength;
            uniform float uMaxHeight;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>

            // Roots anchored: displacement curve starts at y=0 and flexes quadratically
            float heightRatio = clamp(position.y / uMaxHeight, 0.0, 1.0);
            float flexCurve = pow(heightRatio, 1.5);

            #ifdef USE_INSTANCING
                vec4 worldInst = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                float wavePhase = uTime * 2.5 + worldInst.x * 0.48 + worldInst.z * 0.62;
            #else
                float wavePhase = uTime * 2.5 + position.x * 0.48 + position.z * 0.62;
            #endif

            // Main traveling wind wave + high-frequency foliage flutter
            float sway = (sin(wavePhase) * 0.13 + cos(wavePhase * 1.6) * 0.035) * uWindStrength * flexCurve;
            float flutter = sin(uTime * 4.2 + position.x * 3.5 + position.y * 2.5) * 0.018 * flexCurve;

            transformed.x += sway + flutter;
            transformed.z += sway * 0.55;
            `
        );
    };
}

/*
|--------------------------------------------------------------------------
| 6. INITIALIZE 3D FIELD SIMULATOR
|--------------------------------------------------------------------------
*/
export function init3DFieldSimulation() {
    containerEl = document.getElementById("farm3D");
    if (!containerEl) return;

    containerEl.classList.add("canvas-container");
    containerEl.innerHTML = "";

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 620;

    // 1. Scene Setup & Fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1e14, 0.018);

    // 2. Camera Setup (Default to Field Eye-Level View)
    camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 500);
    camera.position.set(0, 0.90, 5.2);

    // 3. High-DPI WebGLRenderer with PBR & Color Science
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.20;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    canvasEl = renderer.domElement;
    containerEl.appendChild(canvasEl);

    // 4. OrbitControls with Angle Limits
    controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.04;
    controls.minDistance = 1.6;
    controls.maxDistance = 24.0;
    controls.target.set(0, 0.65, 0);

    // 5. Initialize Procedural Canvas Textures
    initProceduralTextures();

    // 6. Atmospheric Sky & Sun
    setupAtmosphericSky();

    // 7. Procedural Drifting Clouds (GLSL)
    setupProceduralClouds();

    // 8. Authentic Farmland Terrain (Bunds, Furrows, Water & Grass)
    setupAuthenticTerrain();

    // 9. Compute 256 Plant Instance Grid Coordinates
    computeFieldGridPositions();

    // 10. Build Initial Crop Field
    createCropField(activeCropId);

    // 11. Bind UI Controls (Drone vs Field, Sun Slider, Data Drawer)
    bindUIControls();

    // 12. Handle Resize
    window.addEventListener("resize", onWindowResize);

    // 13. Start 60FPS Render Loop
    animate();
}

/*
|--------------------------------------------------------------------------
| 7. SKY & TIME OF DAY SYSTEM
|--------------------------------------------------------------------------
*/
function setupAtmosphericSky() {
    sun = new THREE.Vector3();

    sunLight = new THREE.DirectionalLight(0xfff1dc, 2.8);
    sunLight.position.set(-10, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 50.0;
    sunLight.shadow.camera.left = -11.0;
    sunLight.shadow.camera.right = 11.0;
    sunLight.shadow.camera.top = 11.0;
    sunLight.shadow.camera.bottom = -11.0;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x223519, 1.15);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    try {
        sky = new Sky();
        sky.scale.setScalar(450000);
        scene.add(sky);

        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 8.5;
        skyUniforms['rayleigh'].value = 2.0;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.82;

        updateTimeOfDay(45);
    } catch (err) {
        console.warn("Sky.js note:", err);
        scene.background = new THREE.Color(0x06150f);
    }
}

function updateTimeOfDay(val) {
    const t = val / 100.0;
    let elevation, azimuth;
    let sunColor, skyTurbidity, skyRayleigh, fogColor;
    let labelText = "দুপুর (Noon)";

    if (t < 0.30) {
        const subT = t / 0.30;
        elevation = THREE.MathUtils.lerp(12, 38, subT);
        azimuth = THREE.MathUtils.lerp(50, 95, subT);
        sunColor = new THREE.Color(0xffe2b8);
        skyTurbidity = 9.0;
        skyRayleigh = 2.4;
        fogColor = new THREE.Color(0x132e22);
        labelText = "সকাল (Morning)";
    } else if (t < 0.70) {
        const subT = (t - 0.30) / 0.40;
        elevation = THREE.MathUtils.lerp(38, 74, subT);
        azimuth = THREE.MathUtils.lerp(95, 200, subT);
        sunColor = new THREE.Color(0xfff8ee);
        skyTurbidity = 7.0;
        skyRayleigh = 1.8;
        fogColor = new THREE.Color(0x0a1e14);
        labelText = "দুপুর (Noon)";
    } else {
        const subT = (t - 0.70) / 0.30;
        elevation = THREE.MathUtils.lerp(38, 8, subT);
        azimuth = THREE.MathUtils.lerp(200, 265, subT);
        sunColor = new THREE.Color(0xff7b33);
        skyTurbidity = 12.0;
        skyRayleigh = 3.6;
        fogColor = new THREE.Color(0x1b1812);
        labelText = "গোধূলি (Golden Hour)";
    }

    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    if (sky && sky.material.uniforms['sunPosition']) {
        sky.material.uniforms['sunPosition'].value.copy(sun);
        sky.material.uniforms['turbidity'].value = skyTurbidity;
        sky.material.uniforms['rayleigh'].value = skyRayleigh;
    }

    if (sunLight) {
        sunLight.position.copy(sun).multiplyScalar(30);
        sunLight.color.copy(sunColor);
        sunLight.intensity = (elevation < 15) ? 1.6 : 2.8;
    }

    if (scene.fog) scene.fog.color.copy(fogColor);

    cloudUniforms.uSunPosition.value.copy(sun);
    cloudUniforms.uSunColor.value.copy(sunColor);

    const lblEl = document.getElementById("timeOfDayLabel");
    if (lblEl) lblEl.textContent = labelText;
}

/*
|--------------------------------------------------------------------------
| 8. PROCEDURAL CLOUD PLANE (GLSL SHADER)
|--------------------------------------------------------------------------
*/
function setupProceduralClouds() {
    const cloudGeo = new THREE.PlaneGeometry(160, 160, 2, 2);
    cloudGeo.rotateX(-Math.PI / 2);

    const cloudMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: cloudUniforms.uTime,
            uSunPosition: cloudUniforms.uSunPosition,
            uSunColor: cloudUniforms.uSunColor
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
                vUv = uv;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uSunPosition;
            uniform vec3 uSunColor;
            varying vec2 vUv;
            varying vec3 vWorldPos;

            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                   -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            float fbm(vec2 uv) {
                float total = 0.0;
                float amp = 0.5;
                for (int i = 0; i < 4; i++) {
                    total += snoise(uv) * amp;
                    uv *= 2.02;
                    amp *= 0.5;
                }
                return total;
            }

            void main() {
                vec2 drift = vec2(uTime * 0.008, uTime * 0.005);
                vec2 uv = (vUv * 4.5) + drift;
                float density = fbm(uv);
                float alpha = smoothstep(0.05, 0.45, density) * 0.75;
                float dist = distance(vUv, vec2(0.5));
                alpha *= smoothstep(0.5, 0.15, dist);

                vec3 cloudBase = vec3(0.95, 0.97, 1.0);
                vec3 finalColor = mix(cloudBase, uSunColor, 0.28);
                gl_FragColor = vec4(finalColor, alpha);
            }
        `
    });

    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.position.set(0, 32, 0);
    scene.add(cloudMesh);
}

/*
|--------------------------------------------------------------------------
| 9. AUTHENTIC FARMLAND TERRAIN & WATER
|--------------------------------------------------------------------------
*/
function setupAuthenticTerrain() {
    const size = 16.0;
    const segments = 120;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);
    const furrowFreq = (Math.PI * 2) / ROW_SPACING;

    const colRidge = new THREE.Color(0x3e2b1c);
    const colTrench = new THREE.Color(0x1a1109);
    const colBund = new THREE.Color(0x334024);

    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.19;
        y += Math.sin(x * 14.0) * Math.cos(z * 11.0) * 0.018;

        const distFromCenter = Math.max(Math.abs(x), Math.abs(z));
        if (distFromCenter > 5.8) {
            const bundFactor = Math.min((distFromCenter - 5.8) / 1.6, 1.0);
            y += Math.sin(bundFactor * Math.PI * 0.5) * 0.36;
        }

        posAttr.setY(i, y);

        const tempCol = new THREE.Color();
        if (distFromCenter > 5.8) {
            tempCol.lerpColors(colRidge, colBund, 0.75);
        } else {
            const factor = (y + 0.02) / 0.21;
            tempCol.lerpColors(colTrench, colRidge, Math.max(0, Math.min(1, factor)));
        }

        colors[i * 3]     = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const soilMaterial = new THREE.MeshStandardMaterial({
        map: soilTexture,
        vertexColors: true,
        roughness: 0.90,
        metalness: 0.04
    });

    terrainMesh = new THREE.Mesh(geometry, soilMaterial);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Paddy Water Layer (Reflective Waterlogged Surface for Rice & Jute)
    const waterGeo = new THREE.PlaneGeometry(11.8, 11.8, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1a2e24,
        roughness: 0.10,
        metalness: 0.85, // Highly reflective mirroring sky and crops
        transparent: true,
        opacity: 0.88
    });

    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 0.088, 0);
    waterMesh.receiveShadow = true;
    waterMesh.visible = (activeCropId === "rice" || activeCropId === "jute");
    scene.add(waterMesh);

    // Grass Tufts on Earthen Bunds
    setupBundGrassTufts();
}

function setupBundGrassTufts() {
    const tuftCount = 80;
    const blades = [];
    for (let i = 0; i < 4; i++) {
        const b = createCurvedBladeGeometry(0.24, 0.008, 0.022, 0.06, 0.03, 15);
        b.rotateY((i / 4) * Math.PI * 2);
        blades.push(b);
    }
    const tuftGeo = mergeBufferGeometries(blades);

    const tuftMat = new THREE.MeshStandardMaterial({
        color: 0x48792c,
        roughness: 0.6,
        side: THREE.DoubleSide
    });

    grassTuftsMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
    grassTuftsMesh.receiveShadow = true;

    for (let i = 0; i < tuftCount; i++) {
        const angle = (i / tuftCount) * Math.PI * 2;
        const radius = 6.2 + (Math.random() - 0.5) * 0.6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        dummy.position.set(x, 0.32, z);
        dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
        const s = 0.8 + Math.random() * 0.5;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();

        grassTuftsMesh.setMatrixAt(i, dummy.matrix);
    }

    grassTuftsMesh.instanceMatrix.needsUpdate = true;
    scene.add(grassTuftsMesh);
}

/*
|--------------------------------------------------------------------------
| 10. FIELD GRID POSITIONS (256 PLANT CLUSTERS)
|--------------------------------------------------------------------------
*/
function computeFieldGridPositions() {
    instanceData = [];
    const xStart = -((COLS - 1) / 2) * ROW_SPACING;
    const zStart = -((ROWS - 1) / 2) * PLANT_SPACING;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const baseX = xStart + c * ROW_SPACING + (Math.random() - 0.5) * 0.08;
            const baseZ = zStart + r * PLANT_SPACING + (Math.random() - 0.5) * 0.08;
            const baseY = 0.17 + (Math.random() - 0.5) * 0.02;

            const scale = 0.88 + Math.random() * 0.24;
            const baseRotY = Math.random() * Math.PI * 2;

            instanceData.push({ baseX, baseY, baseZ, scale, baseRotY });
        }
    }
}

/*
|--------------------------------------------------------------------------
| 11. CREATE CROP FIELD (256 INSTANCED BOTANICAL PLANTS)
|--------------------------------------------------------------------------
*/
function createCropField(cropId) {
    if (currentCropGroup) {
        scene.remove(currentCropGroup);
        if (stemInstancedMesh) stemInstancedMesh.dispose();
        if (leafInstancedMesh) leafInstancedMesh.dispose();
        if (fruitInstancedMesh) fruitInstancedMesh.dispose();
    }

    currentCropGroup = new THREE.Group();

    // 1. Build Botanical Multi-Part Assets
    const assets = buildBotanicalCropAssets(cropId);

    // 2. Create Instanced Meshes (256 plants)
    stemInstancedMesh = new THREE.InstancedMesh(assets.stemGeom, assets.stemMat, TOTAL_PLANTS);
    stemInstancedMesh.castShadow = true;
    stemInstancedMesh.receiveShadow = true;
    currentCropGroup.add(stemInstancedMesh);

    leafInstancedMesh = new THREE.InstancedMesh(assets.leafGeom, assets.leafMat, TOTAL_PLANTS);
    leafInstancedMesh.castShadow = true;
    leafInstancedMesh.receiveShadow = true;
    currentCropGroup.add(leafInstancedMesh);

    if (assets.fruitGeom && assets.fruitMat) {
        fruitInstancedMesh = new THREE.InstancedMesh(assets.fruitGeom, assets.fruitMat, TOTAL_PLANTS);
        fruitInstancedMesh.castShadow = true;
        fruitInstancedMesh.receiveShadow = true;
        currentCropGroup.add(fruitInstancedMesh);
    } else {
        fruitInstancedMesh = null;
    }

    // 3. Populate Instance Matrices
    for (let i = 0; i < TOTAL_PLANTS; i++) {
        const d = instanceData[i];
        dummy.position.set(d.baseX, d.baseY, d.baseZ);
        dummy.rotation.set(0, d.baseRotY, 0);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();

        stemInstancedMesh.setMatrixAt(i, dummy.matrix);
        leafInstancedMesh.setMatrixAt(i, dummy.matrix);
        if (fruitInstancedMesh) fruitInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    stemInstancedMesh.instanceMatrix.needsUpdate = true;
    leafInstancedMesh.instanceMatrix.needsUpdate = true;
    if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;

    scene.add(currentCropGroup);

    // 4. Paddy Water Layer Toggle
    if (waterMesh) {
        waterMesh.visible = (cropId === "rice" || cropId === "jute");
    }

    // 5. Trigger Transition Scale Animation
    transitionProgress = 0.0;
    isTransitioningCrop = true;

    // 6. Smooth Camera Height Adaptation
    if (currentCameraMode === "field") {
        adjustFieldCameraForCrop(cropId);
    }

    // 7. Update Live Data in Slide-in Drawer
    updateDrawerData(cropId);
}

function adjustFieldCameraForCrop(cropId) {
    const meta = CROP_METRICS[cropId] || CROP_METRICS.rice;

    if (meta.heightCategory === "tall") {
        targetCameraPos.set(0, 1.45, 5.8);
        targetLookAt.set(0, 1.25, 0);
    } else if (meta.heightCategory === "low") {
        targetCameraPos.set(0, 0.72, 4.4);
        targetLookAt.set(0, 0.35, 0);
    } else {
        targetCameraPos.set(0, 0.90, 5.2);
        targetLookAt.set(0, 0.65, 0);
    }

    isTransitioningCamera = true;
}

export function switchCameraMode(mode) {
    currentCameraMode = mode;
    const btnDrone = document.getElementById("btnDroneView");
    const btnField = document.getElementById("btnFieldView");

    if (mode === "drone") {
        targetCameraPos.set(0, 9.8, 12.2);
        targetLookAt.set(0, 0.2, 0);
        isTransitioningCamera = true;
        if (btnDrone) btnDrone.classList.add("active");
        if (btnField) btnField.classList.remove("active");
    } else {
        adjustFieldCameraForCrop(activeCropId);
        if (btnField) btnField.classList.add("active");
        if (btnDrone) btnDrone.classList.remove("active");
    }
}
window.switchCameraMode = switchCameraMode;

export function updateCropSimulation(cropId) {
    if (!cropId || (cropId === activeCropId && currentCropGroup)) return;
    activeCropId = cropId;

    const cropSelect = document.getElementById("cropSelect");
    if (cropSelect && cropSelect.value !== cropId) cropSelect.value = cropId;

    const lifecycleSelect = document.getElementById("cropLifecycleSelect");
    if (lifecycleSelect && lifecycleSelect.value !== cropId && window.selectLifecycleCrop) {
        window.selectLifecycleCrop(cropId);
    }

    createCropField(cropId);
}
window.updateCropSimulation = updateCropSimulation;

function updateDrawerData(cropId) {
    const meta = CROP_METRICS[cropId] || CROP_METRICS.rice;

    const nameEl = document.getElementById("drawerCropName");
    if (nameEl) nameEl.textContent = `${meta.nameBn} (${meta.nameEn})`;

    const subEl = document.getElementById("drawerCropSubtitle");
    if (subEl) subEl.textContent = meta.subtitle;

    const npkEl = document.getElementById("drawerCropNPK");
    if (npkEl) npkEl.textContent = meta.npk;

    const moistEl = document.getElementById("drawerCropMoist");
    if (moistEl) moistEl.textContent = meta.moisture;

    const daysEl = document.getElementById("drawerCropDays");
    if (daysEl) daysEl.textContent = meta.duration;

    const iconEl = document.getElementById("drawerCropIcon");
    if (iconEl) {
        const iconMap = {
            rice: "🌾", wheat: "🌾", maize: "🌽", jute: "🌿", potato: "🥔",
            mustard: "🌼", tomato: "🍅", eggplant: "🍆", chili: "🌶️", lentil: "🌱",
            cucumber: "🥒", cauliflower: "🥦", onion: "🧅", carrot: "🥕", papaya: "🍈"
        };
        iconEl.textContent = iconMap[cropId] || "🌱";
    }
}

/*
|--------------------------------------------------------------------------
| 12. BIND VIEW CONTROLS (CAMERA MODES, SUN SLIDER, DATA DRAWER)
|--------------------------------------------------------------------------
*/
function bindUIControls() {
    const simSection = document.getElementById("farmSimulation");
    const dataDrawer = document.getElementById("farmDataDrawer");
    const btnDataToggle = document.getElementById("btnDataToggle") || document.getElementById("btnDataView");
    const btnClean = document.getElementById("btnCleanView");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const btnFullscreen = document.getElementById("btnFullscreen");
    const cropSelect = document.getElementById("cropSelect");
    const timeSlider = document.getElementById("timeOfDaySlider");

    const btnDrone = document.getElementById("btnDroneView") || document.getElementById("hudResetView");
    const btnField = document.getElementById("btnFieldView") || document.getElementById("hudFieldView");

    if (btnDrone) btnDrone.addEventListener("click", () => switchCameraMode("drone"));
    if (btnField) btnField.addEventListener("click", () => switchCameraMode("field"));

    if (timeSlider) {
        timeSlider.addEventListener("input", (e) => {
            updateTimeOfDay(parseFloat(e.target.value));
        });
    }

    function toggleDataDrawer(open) {
        if (!dataDrawer) return;
        const willOpen = (open !== undefined) ? open : !dataDrawer.classList.contains("active");

        if (willOpen) {
            dataDrawer.classList.add("active");
            dataDrawer.setAttribute("aria-hidden", "false");
            if (btnDataToggle) btnDataToggle.classList.add("active");
        } else {
            dataDrawer.classList.remove("active");
            dataDrawer.setAttribute("aria-hidden", "true");
            if (btnDataToggle) btnDataToggle.classList.remove("active");
        }
    }

    if (btnDataToggle) btnDataToggle.addEventListener("click", () => toggleDataDrawer());
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", () => toggleDataDrawer(false));
    if (btnClean) btnClean.addEventListener("click", () => toggleDataDrawer(false));

    if (cropSelect) {
        cropSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    if (btnFullscreen && simSection) {
        btnFullscreen.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                simSection.requestFullscreen?.() || simSection.webkitRequestFullscreen?.();
            } else {
                document.exitFullscreen?.() || document.webkitExitFullscreen?.();
            }
        });
    }
}

/*
|--------------------------------------------------------------------------
| 13. ANIMATION LOOP
|--------------------------------------------------------------------------
*/
function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.016;

    windUniforms.uTime.value = animationTime;
    cloudUniforms.uTime.value = animationTime;

    if (isTransitioningCrop) {
        transitionProgress += 0.065;
        const t = Math.min(transitionProgress, 1.0);
        transitionScale = 1.0 - Math.pow(1.0 - t, 3);
        if (t >= 1.0) {
            isTransitioningCrop = false;
            transitionScale = 1.0;
        }

        if (stemInstancedMesh) {
            for (let i = 0; i < TOTAL_PLANTS; i++) {
                const d = instanceData[i];
                dummy.position.set(d.baseX, d.baseY, d.baseZ);
                dummy.rotation.set(0, d.baseRotY, 0);
                const s = d.scale * transitionScale;
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();

                stemInstancedMesh.setMatrixAt(i, dummy.matrix);
                leafInstancedMesh.setMatrixAt(i, dummy.matrix);
                if (fruitInstancedMesh) fruitInstancedMesh.setMatrixAt(i, dummy.matrix);
            }
            stemInstancedMesh.instanceMatrix.needsUpdate = true;
            leafInstancedMesh.instanceMatrix.needsUpdate = true;
            if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
        }
    }

    if (isTransitioningCamera) {
        camera.position.lerp(targetCameraPos, 0.065);
        controls.target.lerp(targetLookAt, 0.065);

        if (camera.position.distanceTo(targetCameraPos) < 0.03 && controls.target.distanceTo(targetLookAt) < 0.03) {
            camera.position.copy(targetCameraPos);
            controls.target.copy(targetLookAt);
            isTransitioningCamera = false;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 620;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DFieldSimulation);
} else {
    init3DFieldSimulation();
}
