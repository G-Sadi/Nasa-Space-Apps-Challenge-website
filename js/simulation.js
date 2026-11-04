/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — PHASE 3: ULTRA-REALISTIC 3D LIVING FIELD ENGINE
|--------------------------------------------------------------------------
| - 4K High-DPI PBR Three.js WebGLRenderer (ACESFilmic, sRGB, PCFSoftShadow)
| - Dense Agricultural Plot (81 Instances via InstancedMesh)
| - Textured Plowed Furrowed Soil Terrain (আল ও মাটির ভাঁজ)
| - Living Wind Shader / Wave Physics across the crop canopy
| - 15 Distinct Anatomical 3D Botanical Crops with smooth camera transitions
| - 100% Clutter-Free Cinema Mode by default vs Slide-in Data Drawer
| - Fullscreen & Touch Controls
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Core Scene Globals
let scene, camera, renderer, controls;
let containerEl, canvasEl;
let sunLight, hemiLight, rimLight;
let terrainMesh = null;
let currentCropGroup = null;

// Field Instances Globals
const ROWS = 9;
const COLS = 9;
const TOTAL_PLANTS = ROWS * COLS; // 81 plants
const ROW_SPACING = 1.2;          // Distance between furrow rows
const PLANT_SPACING = 1.2;        // Distance along row

let instanceData = [];            // Base positions, scale, rotation
let stemInstancedMesh = null;
let leafInstancedMesh = null;
let fruitInstancedMesh = null;

// Wind Physics State
let animationTime = 0;
let isDayMode = true;

// Active Crop & Transition State
let activeCropId = "rice";
let isTransitioningCrop = false;
let transitionProgress = 1.0;
let transitionScale = 1.0;

// Camera Framing State
let targetCameraPos = new THREE.Vector3(0, 3.4, 8.0);
let targetLookAt = new THREE.Vector3(0, 0.9, 0);
let isTransitioningCamera = false;

// Reusable Matrix & Math Objects
const dummy = new THREE.Object3D();
const tempBox = new THREE.Box3();
const tempVec = new THREE.Vector3();

// 15 Crop Metadata for Live Data Drawer (Bilingual & Agricultural)
const CROP_METRICS = {
    rice: {
        nameBn: "আমন ধান",
        nameEn: "Aman Rice Field",
        subtitle: "হাই-ইয়েল্ডিং স্থানীয় জাত · দানা গঠনের পর্যায়",
        npk: "১০০ - ২০ - ৪০ কেজি/হেক্টর",
        moisture: "৬৫% – ৭৫% (পরিমিত পানি)",
        ph: "৬.০ – ৬.৮",
        temp: "২৫°C – ৩২°C",
        duration: "১১০ – ১২৫ দিন",
        heightCategory: "medium",
        advisory: "শীষে দানা ভরার সময় জমিতে ২-৩ ইঞ্চি পানি রাখুন। পাতা ব্লাইট দমনে প্রয়োজনে কার্বেনডাজিম স্প্রে করুন।"
    },
    wheat: {
        nameBn: "উফশী গম",
        nameEn: "Wheat Field (Golden Triticum)",
        subtitle: "রবি শস্য · দানার বৃদ্ধি ও পুষ্টিকালীন পর্যায়",
        npk: "১২০ - ৬০ - ৬০ কেজি/হেক্টর",
        moisture: "৫৫% – ৬৫% (পর্যাপ্ত আর্দ্রতা)",
        ph: "৬.২ – ৭.০",
        temp: "১৮°C – ২৫°C",
        duration: "১০৫ – ১১৫ দিন",
        heightCategory: "medium",
        advisory: "শীষ আসার সময় হালকা সেচ দিন। ব্লাস্ট বা মরিচা রোগের লক্ষণ দেখা দিলে দ্রুত ছত্রাকনাশক ব্যবহার করুন।"
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
        heightCategory: "tall",
        advisory: "গাছের গোড়ায় মাটি তুলে দিন। ফল আর্মিওয়ার্ম পোকার আক্রমণ প্রতিহত করতে নিয়মিত পর্যবেক্ষণ করুন।"
    },
    jute: {
        nameBn: "তোষা পাট",
        nameEn: "Golden Jute Field",
        subtitle: "অর্থকরী আঁশ ফসল · পূর্ণাঙ্গ উদ্ভিদ বৃদ্ধি",
        npk: "৬০ - ৩০ - ৩০ কেজি/হেক্টর",
        moisture: "৭০% – ৮০% (উচ্চ আর্দ্রতা প্রিয়)",
        ph: "৬.০ – ৭.২",
        temp: "২৮°C – ৩৫°C",
        duration: "১০০ – ১২০ দিন",
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
        heightCategory: "tall",
        advisory: "গাছের গোড়ায় যাতে কখনোই পানি জমে না থাকে সেদিকে খেয়াল রাখুন। রিং পদ্ধতিতে সার প্রয়োগ করুন।"
    }
};

/*
|--------------------------------------------------------------------------
| INITIALIZE 3D ENGINE
|--------------------------------------------------------------------------
*/
export function init3DFieldSimulation() {
    containerEl = document.getElementById("farm3D");
    if (!containerEl) return;

    containerEl.classList.add("canvas-container");
    containerEl.innerHTML = "";

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 560;

    // 1. Scene Setup & Atmospheric Fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06150f);
    scene.fog = new THREE.FogExp2(0x0a1e14, 0.022); // Lifelike horizon atmospheric blending

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 80);
    camera.position.set(0, 3.4, 8.0);

    // 3. 4K High-DPI WebGLRenderer with PBR & Color Science
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 4K Crisp DPI
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ultra-smooth realistic shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    canvasEl = renderer.domElement;
    containerEl.appendChild(canvasEl);

    // 4. OrbitControls with Farmer-Safe Angle Limits
    controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping ground upside down
    controls.minDistance = 1.8;              // Prevent clipping into soil
    controls.maxDistance = 18.0;             // Limit maximum zoom out
    controls.target.set(0, 0.9, 0);

    // 5. Realistic Golden-Hour Environment & Lighting
    setupFieldLighting();

    // 6. Textured Plowed Furrowed Soil Terrain (আল ও মাটির ভাঁজ)
    buildFurrowedSoilTerrain();

    // 7. Calculate Grid Instance Positions (81 Plant Plots)
    computeGridPositions();

    // 8. Build Initial Crop Field
    createCropField(activeCropId);

    // 9. Bind UI Controls (Clean View vs Data Drawer, Fullscreen, Dropdown)
    bindViewControls();

    // 10. Handle Resize
    window.addEventListener("resize", onWindowResize);

    // 11. Start 60FPS Animation Loop
    animate();
}

/*
|--------------------------------------------------------------------------
| ENVIRONMENT & GOLDEN-HOUR LIGHTING SETUP
|--------------------------------------------------------------------------
*/
function setupFieldLighting() {
    // Warm natural sunlight (Golden-hour angle with soft shadows)
    sunLight = new THREE.DirectionalLight(0xffecd0, 2.8);
    sunLight.position.set(-9, 14, 11);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 40.0;
    sunLight.shadow.camera.left = -9.0;
    sunLight.shadow.camera.right = 9.0;
    sunLight.shadow.camera.top = 9.0;
    sunLight.shadow.camera.bottom = -9.0;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Sky & ground natural ambient bounce
    hemiLight = new THREE.HemisphereLight(0x8ad1f0, 0x25351a, 1.15);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Subtle horizon rim light for plant foliage translucency
    rimLight = new THREE.DirectionalLight(0x52ff9a, 0.45);
    rimLight.position.set(10, 6, -10);
    scene.add(rimLight);
}

/*
|--------------------------------------------------------------------------
| REALISTIC FURROWED SOIL TERRAIN (আল ও মাটির ভাঁজ)
|--------------------------------------------------------------------------
*/
function buildFurrowedSoilTerrain() {
    const size = 15;
    const segments = 100;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Make horizontal

    const posAttr = geometry.attributes.position;
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);

    const furrowFreq = (Math.PI * 2) / ROW_SPACING;

    // Soil Color Palette (Plowed earth, moist trenches, border bunds)
    const colRidge = new THREE.Color(0x3e2c1d); // Aerated dry-top soil
    const colTrench = new THREE.Color(0x1e130a); // Moist rich humus furrow
    const colBund = new THREE.Color(0x2f3c22); // Grassy perimeter boundary (আইল)

    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        // Sinusoidal furrow ridges running along Z axis
        let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.18;

        // Micro-roughness clods and crumbs
        y += Math.sin(x * 12.0) * Math.cos(z * 9.0) * 0.02;

        // Raised Farm Perimeter Bunds (জমির আল)
        const distFromCenter = Math.max(Math.abs(x), Math.abs(z));
        if (distFromCenter > 5.4) {
            const bundFactor = Math.min((distFromCenter - 5.4) / 1.5, 1.0);
            y += Math.sin(bundFactor * Math.PI * 0.5) * 0.28;
        }

        posAttr.setY(i, y);

        // Vertex color interpolation based on height & furrow slope
        const tempCol = new THREE.Color();
        if (distFromCenter > 5.4) {
            tempCol.lerpColors(colRidge, colBund, 0.7);
        } else {
            const ridgeFactor = (y + 0.02) / 0.20;
            tempCol.lerpColors(colTrench, colRidge, Math.max(0, Math.min(1, ridgeFactor)));
        }

        colors[i * 3]     = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const soilMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.90,
        metalness: 0.04
    });

    terrainMesh = new THREE.Mesh(geometry, soilMaterial);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
}

/*
|--------------------------------------------------------------------------
| GRID POSITION GENERATOR (81 PLANT INSTANCES)
|--------------------------------------------------------------------------
*/
function computeGridPositions() {
    instanceData = [];
    const xStart = -((COLS - 1) / 2) * ROW_SPACING;
    const zStart = -((ROWS - 1) / 2) * PLANT_SPACING;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Position on top of furrow ridge
            const baseX = xStart + c * ROW_SPACING + (Math.random() - 0.5) * 0.10;
            const baseZ = zStart + r * PLANT_SPACING + (Math.random() - 0.5) * 0.10;

            // Height matching ridge elevation
            const baseY = 0.16 + (Math.random() - 0.5) * 0.02;

            // Organic natural variation
            const scale = 0.88 + Math.random() * 0.26;
            const baseRotY = Math.random() * Math.PI * 2;

            instanceData.push({ baseX, baseY, baseZ, scale, baseRotY });
        }
    }
}

/*
|--------------------------------------------------------------------------
| 15 CROPS BOTANICAL GEOMETRIES (STALKS, LEAVES, FRUITS)
|--------------------------------------------------------------------------
*/
function generateCropBotanicalAssets(cropId) {
    let stemGeom, leafGeom, fruitGeom;
    let stemMat, leafMat, fruitMat;

    switch (cropId) {
        case "rice": {
            // Rice: Arching golden-green stems + curved heavy drooping grain panicles
            stemGeom = new THREE.CylinderGeometry(0.014, 0.025, 0.95, 6);
            stemGeom.translate(0, 0.47, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7c2b, roughness: 0.65 });

            leafGeom = new THREE.ConeGeometry(0.05, 0.85, 4);
            leafGeom.rotateZ(0.28);
            leafGeom.translate(0.12, 0.42, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x569632, roughness: 0.55, side: THREE.DoubleSide });

            // Curved heavy grain panicle (ধানের শীষ)
            fruitGeom = new THREE.TorusGeometry(0.22, 0.035, 6, 12, Math.PI * 0.65);
            fruitGeom.rotateZ(-Math.PI * 0.45);
            fruitGeom.translate(0.14, 0.82, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.45 });
            break;
        }

        case "wheat": {
            // Wheat: Upright amber hollow culms + compact bearded spike with bristly awns
            stemGeom = new THREE.CylinderGeometry(0.016, 0.024, 0.90, 6);
            stemGeom.translate(0, 0.45, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0xb5994b, roughness: 0.7 });

            leafGeom = new THREE.ConeGeometry(0.035, 0.70, 4);
            leafGeom.rotateZ(0.18);
            leafGeom.translate(0.08, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x9e8942, roughness: 0.6 });

            // Erect bearded spike with awns (গমের শিষ)
            fruitGeom = new THREE.CylinderGeometry(0.038, 0.045, 0.32, 7);
            fruitGeom.translate(0, 0.95, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xe6c875, roughness: 0.4 });
            break;
        }

        case "maize": {
            // Maize: Tall thick cane + broad arching ribbon leaves + corn cobs with silk
            stemGeom = new THREE.CylinderGeometry(0.045, 0.065, 2.2, 8);
            stemGeom.translate(0, 1.1, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7e2e, roughness: 0.65 });

            leafGeom = new THREE.PlaneGeometry(0.22, 1.1, 4, 4);
            leafGeom.rotateX(Math.PI * 0.3);
            leafGeom.translate(0, 1.2, 0.45);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x35872d, roughness: 0.5, side: THREE.DoubleSide });

            // Plump ear of corn in husk with golden silk
            fruitGeom = new THREE.CapsuleGeometry(0.08, 0.30, 4, 8);
            fruitGeom.rotateZ(0.35);
            fruitGeom.translate(0.14, 1.1, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
            break;
        }

        case "jute": {
            // Jute: Exceptionally tall slender fibrous cane + apex leaf canopy
            stemGeom = new THREE.CylinderGeometry(0.028, 0.042, 2.8, 7);
            stemGeom.translate(0, 1.4, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x398048, roughness: 0.7 });

            // Clustered canopy of ovate serrated leaves
            leafGeom = new THREE.SphereGeometry(0.42, 8, 6);
            leafGeom.scale(1.2, 0.45, 1.2);
            leafGeom.translate(0, 2.75, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });

            fruitGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 5);
            fruitGeom.translate(0.08, 2.4, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
            break;
        }

        case "potato": {
            // Potato: Low spreading lush bush + visible earthy brown tubers on furrow ridge
            stemGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.55, 6);
            stemGeom.translate(0, 0.28, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x29642e, roughness: 0.7 });

            leafGeom = new THREE.DodecahedronGeometry(0.38, 1);
            leafGeom.scale(1.3, 0.6, 1.3);
            leafGeom.translate(0, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });

            // Plump potato tubers nestled at soil surface
            fruitGeom = new THREE.SphereGeometry(0.09, 7, 6);
            fruitGeom.scale(1.3, 0.85, 1.0);
            fruitGeom.translate(0.14, 0.05, 0.12);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x92663b, roughness: 0.85 });
            break;
        }

        case "mustard": {
            // Mustard: Slender branching stems + radiant canary-yellow flowering canopy
            stemGeom = new THREE.CylinderGeometry(0.016, 0.026, 1.05, 6);
            stemGeom.translate(0, 0.52, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x48792c, roughness: 0.65 });

            leafGeom = new THREE.ConeGeometry(0.12, 0.55, 5);
            leafGeom.translate(0, 0.45, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7023, roughness: 0.6 });

            // Brilliant yellow inflorescence
            fruitGeom = new THREE.DodecahedronGeometry(0.28, 1);
            fruitGeom.scale(1.1, 0.8, 1.1);
            fruitGeom.translate(0, 1.02, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, emissive: 0x332600 });
            break;
        }

        case "tomato": {
            // Tomato: Multi-branched bush + glossy vibrant red tomatoes
            stemGeom = new THREE.CylinderGeometry(0.025, 0.038, 0.85, 6);
            stemGeom.translate(0, 0.42, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x326d30, roughness: 0.7 });

            leafGeom = new THREE.SphereGeometry(0.38, 7, 6);
            leafGeom.scale(1.1, 0.7, 1.1);
            leafGeom.translate(0, 0.55, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.55 });

            // Glossy red spherical tomatoes
            fruitGeom = new THREE.SphereGeometry(0.085, 10, 8);
            fruitGeom.translate(0.16, 0.45, 0.14);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.22, metalness: 0.1 });
            break;
        }

        case "eggplant": {
            // Eggplant: Broad velvety leaves + deep glossy purple teardrop brinjals
            stemGeom = new THREE.CylinderGeometry(0.03, 0.045, 0.80, 6);
            stemGeom.translate(0, 0.40, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e5938, roughness: 0.75 });

            leafGeom = new THREE.DodecahedronGeometry(0.40, 1);
            leafGeom.scale(1.2, 0.6, 1.2);
            leafGeom.translate(0, 0.52, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.6 });

            // Deep violet-purple glossy brinjal
            fruitGeom = new THREE.ConeGeometry(0.08, 0.24, 8);
            fruitGeom.rotateX(Math.PI);
            fruitGeom.translate(0.15, 0.38, 0.10);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.2, metalness: 0.15 });
            break;
        }

        case "chili": {
            // Chili: Compact branching bush + upright/drooping bright red & green peppers
            stemGeom = new THREE.CylinderGeometry(0.02, 0.032, 0.70, 6);
            stemGeom.translate(0, 0.35, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x346b33, roughness: 0.7 });

            leafGeom = new THREE.SphereGeometry(0.32, 7, 6);
            leafGeom.scale(1.1, 0.7, 1.1);
            leafGeom.translate(0, 0.48, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });

            // Conical pointed red chili
            fruitGeom = new THREE.ConeGeometry(0.028, 0.16, 6);
            fruitGeom.rotateZ(Math.PI * 0.2);
            fruitGeom.translate(0.12, 0.46, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
            break;
        }

        case "lentil": {
            // Lentil: Fine feathery pinnate foliage + miniature flat seed pods
            stemGeom = new THREE.CylinderGeometry(0.012, 0.02, 0.52, 5);
            stemGeom.translate(0, 0.26, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7e3d, roughness: 0.7 });

            leafGeom = new THREE.DodecahedronGeometry(0.26, 1);
            leafGeom.scale(1.2, 0.55, 1.2);
            leafGeom.translate(0, 0.34, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8a42, roughness: 0.6 });

            fruitGeom = new THREE.BoxGeometry(0.03, 0.08, 0.015);
            fruitGeom.translate(0.08, 0.32, 0.05);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5 });
            break;
        }

        case "cucumber": {
            // Cucumber: Low sprawling ground creeper vine + elongated dark green cucumbers
            stemGeom = new THREE.TorusGeometry(0.40, 0.022, 5, 10, Math.PI * 1.2);
            stemGeom.rotateX(Math.PI * 0.5);
            stemGeom.translate(0, 0.08, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e6b36, roughness: 0.7 });

            leafGeom = new THREE.CircleGeometry(0.16, 6);
            leafGeom.rotateX(-Math.PI * 0.45);
            leafGeom.translate(0.2, 0.12, 0.15);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55, side: THREE.DoubleSide });

            // Elongated cucumber fruit on soil
            fruitGeom = new THREE.CylinderGeometry(0.045, 0.048, 0.32, 8);
            fruitGeom.rotateZ(Math.PI * 0.48);
            fruitGeom.translate(0.16, 0.07, -0.12);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.35 });
            break;
        }

        case "cauliflower": {
            // Cauliflower: Large waxy wrapper leaves + dense domed creamy-white central curd
            stemGeom = new THREE.CylinderGeometry(0.04, 0.055, 0.38, 7);
            stemGeom.translate(0, 0.19, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x486b45, roughness: 0.8 });

            // Wrapper waxy blue-green leaves
            leafGeom = new THREE.ConeGeometry(0.44, 0.40, 7, 1, true);
            leafGeom.rotateX(Math.PI);
            leafGeom.translate(0, 0.32, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a54, roughness: 0.6, side: THREE.DoubleSide });

            // Creamy-white bumpy curd
            fruitGeom = new THREE.SphereGeometry(0.18, 10, 8);
            fruitGeom.scale(1.15, 0.75, 1.15);
            fruitGeom.translate(0, 0.28, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfaf5e4, roughness: 0.55 });
            break;
        }

        case "onion": {
            // Onion: Hollow upright tubular blue-green leaves + swollen bulb on furrow crest
            stemGeom = new THREE.CylinderGeometry(0.012, 0.024, 0.60, 6);
            stemGeom.translate(0, 0.32, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x237050, roughness: 0.6 });

            leafGeom = new THREE.ConeGeometry(0.02, 0.55, 5);
            leafGeom.rotateZ(0.12);
            leafGeom.translate(0.04, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a55, roughness: 0.55 });

            // Swollen onion bulb breaking topsoil
            fruitGeom = new THREE.SphereGeometry(0.09, 8, 8);
            fruitGeom.scale(1.1, 0.85, 1.1);
            fruitGeom.translate(0, 0.08, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.4 });
            break;
        }

        case "carrot": {
            // Carrot: Delicate feathery fern fronds + conical orange root shoulder at surface
            stemGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.50, 6);
            stemGeom.translate(0, 0.25, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x367e39, roughness: 0.7 });

            leafGeom = new THREE.DodecahedronGeometry(0.28, 1);
            leafGeom.scale(1.1, 0.6, 1.1);
            leafGeom.translate(0, 0.38, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });

            // Vibrant conical orange taproot shoulder
            fruitGeom = new THREE.ConeGeometry(0.065, 0.22, 8);
            fruitGeom.rotateX(Math.PI);
            fruitGeom.translate(0, 0.06, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
            break;
        }

        case "papaya": {
            // Papaya: Tall erect single trunk + crown of palmately lobed leaves + clustered fruits
            stemGeom = new THREE.CylinderGeometry(0.065, 0.095, 2.5, 8);
            stemGeom.translate(0, 1.25, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x635745, roughness: 0.8 });

            // Umbrella crown of palmately lobed leaves
            leafGeom = new THREE.ConeGeometry(0.75, 0.35, 8, 1, true);
            leafGeom.translate(0, 2.65, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5, side: THREE.DoubleSide });

            // Cluster of oblong papaya fruits
            fruitGeom = new THREE.SphereGeometry(0.12, 8, 8);
            fruitGeom.scale(0.8, 1.4, 0.8);
            fruitGeom.translate(0.12, 2.15, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.35 });
            break;
        }

        default:
            return generateCropBotanicalAssets("rice");
    }

    return { stemGeom, stemMat, leafGeom, leafMat, fruitGeom, fruitMat };
}

/*
|--------------------------------------------------------------------------
| CREATE FULL CROP FIELD (81 INSTANCED PLANTS)
|--------------------------------------------------------------------------
*/
function createCropField(cropId) {
    // 1. Remove previous instanced meshes
    if (currentCropGroup) {
        scene.remove(currentCropGroup);
        if (stemInstancedMesh) stemInstancedMesh.dispose();
        if (leafInstancedMesh) leafInstancedMesh.dispose();
        if (fruitInstancedMesh) fruitInstancedMesh.dispose();
    }

    currentCropGroup = new THREE.Group();

    // 2. Build Botanical Geometries
    const assets = generateCropBotanicalAssets(cropId);

    // 3. Create Instanced Meshes
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

    // 4. Initial Matrix Population
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

    // 5. Trigger Transition Scale Animation
    transitionProgress = 0.0;
    isTransitioningCrop = true;

    // 6. Smooth Camera Height Adjustment based on Crop Anatomy
    adjustCameraForCrop(cropId);

    // 7. Update Live Data in Slide-in Drawer
    updateDrawerData(cropId);
}

/*
|--------------------------------------------------------------------------
| CAMERA FRAMING ADAPTATION (SMOOTH TWEEN)
|--------------------------------------------------------------------------
*/
function adjustCameraForCrop(cropId) {
    const meta = CROP_METRICS[cropId] || CROP_METRICS.rice;

    if (meta.heightCategory === "tall") {
        // Papaya, Maize, Jute
        targetCameraPos.set(0, 4.4, 9.2);
        targetLookAt.set(0, 1.6, 0);
    } else if (meta.heightCategory === "low") {
        // Potato, Onion, Carrot, Cucumber, Cauliflower, Lentil
        targetCameraPos.set(0, 2.2, 5.8);
        targetLookAt.set(0, 0.45, 0);
    } else {
        // Rice, Wheat, Tomato, Eggplant, Chili, Mustard
        targetCameraPos.set(0, 3.2, 7.6);
        targetLookAt.set(0, 0.85, 0);
    }

    isTransitioningCamera = true;
}

/*
|--------------------------------------------------------------------------
| PUBLIC METHOD: UPDATE CROP SIMULATION
|--------------------------------------------------------------------------
*/
export function updateCropSimulation(cropId) {
    if (!cropId || (cropId === activeCropId && currentCropGroup)) return;
    activeCropId = cropId;

    // Synchronize UI dropdown in top bar
    const cropSelect = document.getElementById("cropSelect");
    if (cropSelect && cropSelect.value !== cropId) {
        cropSelect.value = cropId;
    }

    // Synchronize Lifecycle Tracker dropdown if present
    const lifecycleSelect = document.getElementById("cropLifecycleSelect");
    if (lifecycleSelect && lifecycleSelect.value !== cropId && window.selectLifecycleCrop) {
        window.selectLifecycleCrop(cropId);
    }

    createCropField(cropId);
}
window.updateCropSimulation = updateCropSimulation;

/*
|--------------------------------------------------------------------------
| UPDATE SLIDE-IN DATA DRAWER METRICS
|--------------------------------------------------------------------------
*/
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
| BIND VIEW CONTROLS (CINEMA MODE VS DATA DRAWER, FULLSCREEN, LIGHTING)
|--------------------------------------------------------------------------
*/
function bindViewControls() {
    const simSection = document.getElementById("farmSimulation");
    const dataDrawer = document.getElementById("farmDataDrawer");
    const btnClean = document.getElementById("btnCleanView");
    const btnData = document.getElementById("btnDataView");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const btnFullscreen = document.getElementById("btnFullscreen");
    const cropSelect = document.getElementById("cropSelect");

    // 1. Clean View (Cinema Mode - Default)
    function activateCleanView() {
        if (simSection) simSection.classList.add("cinema-mode");
        if (dataDrawer) {
            dataDrawer.classList.remove("active");
            dataDrawer.setAttribute("aria-hidden", "true");
        }
        if (btnClean) btnClean.classList.add("active");
        if (btnData) btnData.classList.remove("active");
    }

    // 2. Data Mode (Slide in Glassmorphic Drawer)
    function activateDataView() {
        if (simSection) simSection.classList.remove("cinema-mode");
        if (dataDrawer) {
            dataDrawer.classList.add("active");
            dataDrawer.setAttribute("aria-hidden", "false");
        }
        if (btnData) btnData.classList.add("active");
        if (btnClean) btnClean.classList.remove("active");
    }

    if (btnClean) btnClean.addEventListener("click", activateCleanView);
    if (btnData) {
        btnData.addEventListener("click", () => {
            const isOpen = dataDrawer && dataDrawer.classList.contains("active");
            if (isOpen) {
                activateCleanView();
            } else {
                activateDataView();
            }
        });
    }
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", activateCleanView);

    // 3. Dropdown selection
    if (cropSelect) {
        cropSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    // 4. Fullscreen Toggle
    if (btnFullscreen && simSection) {
        btnFullscreen.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                simSection.requestFullscreen?.() || simSection.webkitRequestFullscreen?.();
            } else {
                document.exitFullscreen?.() || document.webkitExitFullscreen?.();
            }
        });
    }

    // 5. Drone & Eye Level Camera Presets
    const btnDrone = document.getElementById("hudResetView");
    if (btnDrone) {
        btnDrone.addEventListener("click", () => {
            targetCameraPos.set(0, 7.5, 9.5);
            targetLookAt.set(0, 0.4, 0);
            isTransitioningCamera = true;
        });
    }

    const btnEye = document.getElementById("hudFieldView");
    if (btnEye) {
        btnEye.addEventListener("click", () => {
            targetCameraPos.set(0, 1.2, 4.6);
            targetLookAt.set(0, 0.8, 0);
            isTransitioningCamera = true;
        });
    }

    // 6. Day / Sunset / Night Lighting
    const sunBtn = document.getElementById("hudToggleSun");
    const sunBtnText = document.getElementById("sunBtnText");
    if (sunBtn) {
        sunBtn.addEventListener("click", () => {
            isDayMode = !isDayMode;
            if (isDayMode) {
                scene.background.set(0x06150f);
                scene.fog.color.set(0x0a1e14);
                sunLight.color.set(0xffecd0);
                sunLight.intensity = 2.8;
                hemiLight.intensity = 1.15;
                if (sunBtnText) sunBtnText.textContent = "দিন";
            } else {
                scene.background.set(0x040b08);
                scene.fog.color.set(0x06110b);
                sunLight.color.set(0xff7733);
                sunLight.intensity = 1.4;
                hemiLight.intensity = 0.55;
                if (sunBtnText) sunBtnText.textContent = "গোধূলি";
            }
        });
    }
}

/*
|--------------------------------------------------------------------------
| ANIMATION LOOP & LIVING WIND WAVE PHYSICS
|--------------------------------------------------------------------------
*/
function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.016;

    // 1. Crop Model Fade/Scale Transition
    if (isTransitioningCrop) {
        transitionProgress += 0.065;
        const t = Math.min(transitionProgress, 1.0);
        transitionScale = 1.0 - Math.pow(1.0 - t, 3); // Ease-out cubic
        if (t >= 1.0) {
            isTransitioningCrop = false;
            transitionScale = 1.0;
        }
    }

    // 2. Living Wind Wave Physics Across 81 Plants
    if (stemInstancedMesh && instanceData.length > 0) {
        const t = animationTime * 2.3;

        for (let i = 0; i < TOTAL_PLANTS; i++) {
            const d = instanceData[i];

            // Diagonal traveling wind wave (real breeze blowing across paddy field)
            const wavePhase = t + d.baseX * 0.45 + d.baseZ * 0.65;
            const gust = Math.sin(t * 0.45 + d.baseX * 0.22) * 0.35 + 0.85;
            const tilt = (Math.sin(wavePhase) * 0.085 + Math.cos(wavePhase * 1.5) * 0.035) * gust;

            dummy.position.set(d.baseX, d.baseY, d.baseZ);
            dummy.rotation.set(tilt * 0.4, d.baseRotY + tilt * 0.15, tilt);

            const currentScale = d.scale * transitionScale;
            dummy.scale.set(currentScale, currentScale, currentScale);
            dummy.updateMatrix();

            stemInstancedMesh.setMatrixAt(i, dummy.matrix);
            leafInstancedMesh.setMatrixAt(i, dummy.matrix);
            if (fruitInstancedMesh) fruitInstancedMesh.setMatrixAt(i, dummy.matrix);
        }

        stemInstancedMesh.instanceMatrix.needsUpdate = true;
        leafInstancedMesh.instanceMatrix.needsUpdate = true;
        if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Smooth Camera Tweening
    if (isTransitioningCamera) {
        camera.position.lerp(targetCameraPos, 0.065);
        controls.target.lerp(targetLookAt, 0.065);

        if (camera.position.distanceTo(targetCameraPos) < 0.04 && controls.target.distanceTo(targetLookAt) < 0.04) {
            camera.position.copy(targetCameraPos);
            controls.target.copy(targetLookAt);
            isTransitioningCamera = false;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

/*
|--------------------------------------------------------------------------
| RESIZE HANDLER
|--------------------------------------------------------------------------
*/
function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 560;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Auto-run when DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DFieldSimulation);
} else {
    init3DFieldSimulation();
}
