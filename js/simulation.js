/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — ULTRA-REALISTIC 3D AGRICULTURAL FIELD SIMULATOR
|--------------------------------------------------------------------------
| - Three.js Sky Shader (Rayleigh & Mie Atmospheric Scattering)
| - Procedural Animated 3D Volumetric Cloud Plane with GLSL Simplex Noise
| - Dynamic 'Time of Day' Slider (Morning, Noon, Golden Hour)
| - Authentic Farmland Terrain: Earthen Bunds (মাটির আল), Furrows & Grass Tufts
| - Paddy Water Layer for Rice & Jute (Reflective shallow water between ridges)
| - Dual Camera Modes: Drone Aerial View (🚁) vs Ground Field View (🌾)
| - 196 Plant Clusters via THREE.InstancedMesh (60-120 FPS Performance)
| - Custom GLSL Wind Vertex Shader (onBeforeCompile) with anchored roots
| - 15 Distinct Botanical Crops & On-Demand Glassmorphism Data Drawer
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// Core Scene Globals
let scene, camera, renderer, controls;
let containerEl, canvasEl;
let sky = null, sun = null;
let sunLight = null, hemiLight = null, ambientLight = null;
let terrainMesh = null, waterMesh = null, grassTuftsMesh = null;
let cloudMesh = null;
let currentCropGroup = null;

// Field Geometry & Instancing Configuration
const ROWS = 14;
const COLS = 14;
const TOTAL_PLANTS = ROWS * COLS; // 196 plant clusters
const ROW_SPACING = 0.95;         // Distance between furrow rows (meters)
const PLANT_SPACING = 0.95;       // Distance along rows

let instanceData = [];            // Base positions, scale, rotation
let stemInstancedMesh = null;
let leafInstancedMesh = null;
let fruitInstancedMesh = null;

// Global Wind & Time Uniforms for GLSL Shaders
const windUniforms = {
    uTime: { value: 0.0 },
    uWindStrength: { value: 1.0 }
};

const cloudUniforms = {
    uTime: { value: 0.0 },
    uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color(1.0, 0.98, 0.92) }
};

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
        waterRequired: false,
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
| INITIALIZE 3D FIELD SIMULATOR
|--------------------------------------------------------------------------
*/
export function init3DFieldSimulation() {
    containerEl = document.getElementById("farm3D");
    if (!containerEl) return;

    containerEl.classList.add("canvas-container");
    containerEl.innerHTML = "";

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 620;

    // 1. Scene Setup & Atmospheric Fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1e14, 0.018);

    // 2. Camera Setup (Default to Field Eye-Level View)
    camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 500);
    camera.position.set(0, 0.90, 5.2);

    // 3. 4K High-DPI WebGLRenderer with PBR & Color Science
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

    // 4. OrbitControls with Farmer-Safe Angle Limits
    controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.04; // Never flip soil upside down
    controls.minDistance = 1.6;
    controls.maxDistance = 24.0;
    controls.target.set(0, 0.65, 0);

    // 5. Realistic Sky, Atmospheric Scattering & Sun
    setupAtmosphericSky();

    // 6. Procedural Animated Cloud Plane (GLSL Fragment Shader)
    setupProceduralClouds();

    // 7. Authentic Farmland Terrain (মাটির আল, খাঁজ, পানি ও ঘাস)
    setupAuthenticTerrain();

    // 8. Compute 196 Crop Instance Positions
    computeFieldGridPositions();

    // 9. Build Initial Crop Field
    createCropField(activeCropId);

    // 10. Bind UI View Controls (Drone vs Field View, Time of Day, Drawer)
    bindUIControls();

    // 11. Handle Window Resize
    window.addEventListener("resize", onWindowResize);

    // 12. Start 60FPS Render Loop
    animate();
}

/*
|--------------------------------------------------------------------------
| 1. REALISTIC SKY SHADER & ATMOSPHERIC SUN (THREE.Sky)
|--------------------------------------------------------------------------
*/
function setupAtmosphericSky() {
    sun = new THREE.Vector3();

    // Sunlight (Directional with high-res soft shadows)
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

    // Natural sky-ground ambient bounce
    hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x223519, 1.15);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    // Three.js Atmospheric Sky Shader
    try {
        sky = new Sky();
        sky.scale.setScalar(450000);
        scene.add(sky);

        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 8.5;
        skyUniforms['rayleigh'].value = 2.0;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.82;

        updateTimeOfDay(45); // Default to bright afternoon (45%)
    } catch (err) {
        console.warn("Sky.js initialization note:", err);
        scene.background = new THREE.Color(0x06150f);
    }
}

/*
|--------------------------------------------------------------------------
| TIME OF DAY UPDATE (MORNING, NOON, GOLDEN HOUR)
|--------------------------------------------------------------------------
*/
function updateTimeOfDay(val) {
    // val ranges from 0 to 100
    // 0 = Early Morning, 45 = Midday/Noon, 85 = Golden Hour, 100 = Sunset
    const t = val / 100.0;

    let elevation, azimuth;
    let sunColor, skyTurbidity, skyRayleigh, fogColor;
    let labelText = "দুপুর (Noon)";

    if (t < 0.30) {
        // Morning (সকাল): Low warm sun, long shadows
        const subT = t / 0.30;
        elevation = THREE.MathUtils.lerp(12, 38, subT);
        azimuth = THREE.MathUtils.lerp(50, 95, subT);
        sunColor = new THREE.Color(0xffe2b8);
        skyTurbidity = 9.0;
        skyRayleigh = 2.4;
        fogColor = new THREE.Color(0x132e22);
        labelText = "সকাল (Morning)";
    } else if (t < 0.70) {
        // Noon (দুপুর): High clear sun, sharp crisp lighting
        const subT = (t - 0.30) / 0.40;
        elevation = THREE.MathUtils.lerp(38, 74, subT);
        azimuth = THREE.MathUtils.lerp(95, 200, subT);
        sunColor = new THREE.Color(0xfff8ee);
        skyTurbidity = 7.0;
        skyRayleigh = 1.8;
        fogColor = new THREE.Color(0x0a1e14);
        labelText = "দুপুর (Noon)";
    } else {
        // Golden Hour / Sunset (গোধূলি): Dramatic warm orange/amber horizon
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

    if (scene.fog) {
        scene.fog.color.copy(fogColor);
    }

    cloudUniforms.uSunPosition.value.copy(sun);
    cloudUniforms.uSunColor.value.copy(sunColor);

    const lblEl = document.getElementById("timeOfDayLabel");
    if (lblEl) lblEl.textContent = labelText;
}

/*
|--------------------------------------------------------------------------
| 2. PROCEDURAL ANIMATED CLOUDS (GLSL FRAGMENT SHADER)
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

            // 2D Simplex / Perlin noise approximation
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
                // Drifting wind coordinates
                vec2 drift = vec2(uTime * 0.008, uTime * 0.005);
                vec2 uv = (vUv * 4.5) + drift;

                float density = fbm(uv);
                // Soft cumulus threshold
                float alpha = smoothstep(0.05, 0.45, density) * 0.75;

                // Subtle circular vignette to fade edges at horizon
                float dist = distance(vUv, vec2(0.5));
                alpha *= smoothstep(0.5, 0.15, dist);

                vec3 cloudBase = vec3(0.95, 0.97, 1.0);
                vec3 finalColor = mix(cloudBase, uSunColor, 0.28);

                gl_FragColor = vec4(finalColor, alpha);
            }
        `
    });

    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.position.set(0, 32, 0); // High in sky
    scene.add(cloudMesh);
}

/*
|--------------------------------------------------------------------------
| 3. AUTHENTIC FARMLAND TERRAIN (EARTHEN BUNDS, FURROWS & PADDY WATER)
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

    // Palette: Plowed furrow crests, moist troughs, and earthen perimeter bunds
    const colRidge = new THREE.Color(0x3e2b1c); // Aerated dry-top soil
    const colTrench = new THREE.Color(0x1a1109); // Dark moist humus
    const colBund = new THREE.Color(0x334024); // Grassy earthen bund (মাটির আল)

    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        // Sinusoidal furrow ridges
        let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.19;

        // Micro crumb soil roughness
        y += Math.sin(x * 14.0) * Math.cos(z * 11.0) * 0.018;

        // Raised Perimeter Earthen Bunds (জমির চারপাশের মাটির আল)
        const distFromCenter = Math.max(Math.abs(x), Math.abs(z));
        if (distFromCenter > 5.8) {
            const bundFactor = Math.min((distFromCenter - 5.8) / 1.6, 1.0);
            y += Math.sin(bundFactor * Math.PI * 0.5) * 0.36; // 0.36m high raised dike
        }

        posAttr.setY(i, y);

        // Soil vertex colors
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
        vertexColors: true,
        roughness: 0.90,
        metalness: 0.04
    });

    terrainMesh = new THREE.Mesh(geometry, soilMaterial);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // B. Paddy Water Layer (Shallow water plane between ridges for Rice & Jute)
    const waterGeo = new THREE.PlaneGeometry(11.8, 11.8, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1a2e24,
        roughness: 0.06,
        metalness: 0.15,
        transparent: true,
        opacity: 0.82
    });

    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 0.085, 0); // Just above furrow troughs
    waterMesh.receiveShadow = true;
    waterMesh.visible = (activeCropId === "rice" || activeCropId === "jute");
    scene.add(waterMesh);

    // C. Grass Tufts Along Perimeter Earthen Bunds (আল-এর ধারের ঘাস)
    setupBundGrassTufts();
}

/*
|--------------------------------------------------------------------------
| GRASS TUFTS ALONG EARTHEN BUNDS
|--------------------------------------------------------------------------
*/
function setupBundGrassTufts() {
    const tuftCount = 80;
    const grassBladeGeo = new THREE.ConeGeometry(0.04, 0.24, 3);
    grassBladeGeo.translate(0, 0.12, 0);

    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x48792c,
        roughness: 0.6,
        side: THREE.DoubleSide
    });

    grassTuftsMesh = new THREE.InstancedMesh(grassBladeGeo, grassMat, tuftCount);
    grassTuftsMesh.receiveShadow = true;

    for (let i = 0; i < tuftCount; i++) {
        // Place along the perimeter dike (5.9m to 6.8m from center)
        const angle = (i / tuftCount) * Math.PI * 2;
        const radius = 6.2 + (Math.random() - 0.5) * 0.6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        dummy.position.set(x, 0.32, z);
        dummy.rotation.set(
            (Math.random() - 0.5) * 0.3,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.3
        );
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
| FIELD GRID POSITIONS (196 PLANT CLUSTERS)
|--------------------------------------------------------------------------
*/
function computeFieldGridPositions() {
    instanceData = [];
    const xStart = -((COLS - 1) / 2) * ROW_SPACING;
    const zStart = -((ROWS - 1) / 2) * PLANT_SPACING;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Position on top of furrow ridge
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
| 4. GPU GLSL WIND VERTEX SHADER INJECTION (onBeforeCompile)
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
            float flexCurve = pow(heightRatio, 1.45);

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
| 15 BOTANICAL GEOMETRIES WITH ANATOMICAL ACCURACY
|--------------------------------------------------------------------------
*/
function generateCropAssets(cropId) {
    let stemGeom, leafGeom, fruitGeom;
    let stemMat, leafMat, fruitMat;
    let cropHeight = 1.0;

    switch (cropId) {
        case "rice": {
            cropHeight = 1.0;
            // Tillers radiating + arching narrow blades + nodding heavy grain panicles
            stemGeom = new THREE.CylinderGeometry(0.014, 0.024, 0.95, 6);
            stemGeom.translate(0, 0.47, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487a2d, roughness: 0.65 });

            leafGeom = new THREE.ConeGeometry(0.05, 0.85, 4);
            leafGeom.rotateZ(0.28);
            leafGeom.translate(0.12, 0.42, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x549630, roughness: 0.55, side: THREE.DoubleSide });

            // Drooping curved grain panicle (ধানের ছড়া/শীষ)
            fruitGeom = new THREE.TorusGeometry(0.22, 0.035, 6, 12, Math.PI * 0.68);
            fruitGeom.rotateZ(-Math.PI * 0.45);
            fruitGeom.translate(0.14, 0.82, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.45 });
            break;
        }

        case "wheat": {
            cropHeight = 0.95;
            // Straight erect amber-gold culms + compact bearded spike with stiff awns
            stemGeom = new THREE.CylinderGeometry(0.016, 0.024, 0.90, 6);
            stemGeom.translate(0, 0.45, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0xb5994b, roughness: 0.7 });

            leafGeom = new THREE.ConeGeometry(0.035, 0.70, 4);
            leafGeom.rotateZ(0.18);
            leafGeom.translate(0.08, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x9e8942, roughness: 0.6 });

            fruitGeom = new THREE.CylinderGeometry(0.038, 0.045, 0.32, 7);
            fruitGeom.translate(0, 0.95, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xe6c875, roughness: 0.4 });
            break;
        }

        case "maize": {
            cropHeight = 2.4;
            // Sturdy cane with nodes + arching ribbon leaves + cobs with golden silk
            stemGeom = new THREE.CylinderGeometry(0.045, 0.065, 2.2, 8);
            stemGeom.translate(0, 1.1, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7e2e, roughness: 0.65 });

            leafGeom = new THREE.PlaneGeometry(0.22, 1.1, 4, 4);
            leafGeom.rotateX(Math.PI * 0.3);
            leafGeom.translate(0, 1.2, 0.45);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x35872d, roughness: 0.5, side: THREE.DoubleSide });

            fruitGeom = new THREE.CapsuleGeometry(0.08, 0.30, 4, 8);
            fruitGeom.rotateZ(0.35);
            fruitGeom.translate(0.14, 1.1, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
            break;
        }

        case "jute": {
            cropHeight = 3.0;
            // Tall slender fibrous cane + clustered apex leaves
            stemGeom = new THREE.CylinderGeometry(0.028, 0.042, 2.8, 7);
            stemGeom.translate(0, 1.4, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x398048, roughness: 0.7 });

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
            cropHeight = 0.65;
            // Low spreading bush + visible tubers on furrow ridge
            stemGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.55, 6);
            stemGeom.translate(0, 0.28, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x29642e, roughness: 0.7 });

            leafGeom = new THREE.DodecahedronGeometry(0.38, 1);
            leafGeom.scale(1.3, 0.6, 1.3);
            leafGeom.translate(0, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });

            fruitGeom = new THREE.SphereGeometry(0.09, 7, 6);
            fruitGeom.scale(1.3, 0.85, 1.0);
            fruitGeom.translate(0.14, 0.05, 0.12);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x92663b, roughness: 0.85 });
            break;
        }

        case "mustard": {
            cropHeight = 1.15;
            // Branching stems + vibrant canary-yellow flower head
            stemGeom = new THREE.CylinderGeometry(0.016, 0.026, 1.05, 6);
            stemGeom.translate(0, 0.52, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x48792c, roughness: 0.65 });

            leafGeom = new THREE.ConeGeometry(0.12, 0.55, 5);
            leafGeom.translate(0, 0.45, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7023, roughness: 0.6 });

            fruitGeom = new THREE.DodecahedronGeometry(0.28, 1);
            fruitGeom.scale(1.1, 0.8, 1.1);
            fruitGeom.translate(0, 1.02, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, emissive: 0x332600 });
            break;
        }

        case "tomato": {
            cropHeight = 0.95;
            // Multi-branched bush + glossy vibrant red tomatoes
            stemGeom = new THREE.CylinderGeometry(0.025, 0.038, 0.85, 6);
            stemGeom.translate(0, 0.42, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x326d30, roughness: 0.7 });

            leafGeom = new THREE.SphereGeometry(0.38, 7, 6);
            leafGeom.scale(1.1, 0.7, 1.1);
            leafGeom.translate(0, 0.55, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.55 });

            fruitGeom = new THREE.SphereGeometry(0.085, 10, 8);
            fruitGeom.translate(0.16, 0.45, 0.14);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.22, metalness: 0.1 });
            break;
        }

        case "eggplant": {
            cropHeight = 0.90;
            // Velvety broad leaves + deep glossy purple teardrop brinjals
            stemGeom = new THREE.CylinderGeometry(0.03, 0.045, 0.80, 6);
            stemGeom.translate(0, 0.40, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e5938, roughness: 0.75 });

            leafGeom = new THREE.DodecahedronGeometry(0.40, 1);
            leafGeom.scale(1.2, 0.6, 1.2);
            leafGeom.translate(0, 0.52, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.6 });

            fruitGeom = new THREE.ConeGeometry(0.08, 0.24, 8);
            fruitGeom.rotateX(Math.PI);
            fruitGeom.translate(0.15, 0.38, 0.10);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.2, metalness: 0.15 });
            break;
        }

        case "chili": {
            cropHeight = 0.75;
            // Compact bush + pointed bright red & green peppers
            stemGeom = new THREE.CylinderGeometry(0.02, 0.032, 0.70, 6);
            stemGeom.translate(0, 0.35, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x346b33, roughness: 0.7 });

            leafGeom = new THREE.SphereGeometry(0.32, 7, 6);
            leafGeom.scale(1.1, 0.7, 1.1);
            leafGeom.translate(0, 0.48, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });

            fruitGeom = new THREE.ConeGeometry(0.028, 0.16, 6);
            fruitGeom.rotateZ(Math.PI * 0.2);
            fruitGeom.translate(0.12, 0.46, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
            break;
        }

        case "lentil": {
            cropHeight = 0.60;
            // Delicate feathery pinnate foliage + flat seed pods
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
            cropHeight = 0.50;
            // Ground creeper vine + elongated green cucumbers on soil
            stemGeom = new THREE.TorusGeometry(0.40, 0.022, 5, 10, Math.PI * 1.2);
            stemGeom.rotateX(Math.PI * 0.5);
            stemGeom.translate(0, 0.08, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e6b36, roughness: 0.7 });

            leafGeom = new THREE.CircleGeometry(0.16, 6);
            leafGeom.rotateX(-Math.PI * 0.45);
            leafGeom.translate(0.2, 0.12, 0.15);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55, side: THREE.DoubleSide });

            fruitGeom = new THREE.CylinderGeometry(0.045, 0.048, 0.32, 8);
            fruitGeom.rotateZ(Math.PI * 0.48);
            fruitGeom.translate(0.16, 0.07, -0.12);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.35 });
            break;
        }

        case "cauliflower": {
            cropHeight = 0.55;
            // Large waxy wrapper leaves + dense creamy-white curd
            stemGeom = new THREE.CylinderGeometry(0.04, 0.055, 0.38, 7);
            stemGeom.translate(0, 0.19, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x486b45, roughness: 0.8 });

            leafGeom = new THREE.ConeGeometry(0.44, 0.40, 7, 1, true);
            leafGeom.rotateX(Math.PI);
            leafGeom.translate(0, 0.32, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a54, roughness: 0.6, side: THREE.DoubleSide });

            fruitGeom = new THREE.SphereGeometry(0.18, 10, 8);
            fruitGeom.scale(1.15, 0.75, 1.15);
            fruitGeom.translate(0, 0.28, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfaf5e4, roughness: 0.55 });
            break;
        }

        case "onion": {
            cropHeight = 0.65;
            // Hollow upright tubular leaves + swollen onion bulbs on ridge
            stemGeom = new THREE.CylinderGeometry(0.012, 0.024, 0.60, 6);
            stemGeom.translate(0, 0.32, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x237050, roughness: 0.6 });

            leafGeom = new THREE.ConeGeometry(0.02, 0.55, 5);
            leafGeom.rotateZ(0.12);
            leafGeom.translate(0.04, 0.35, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a55, roughness: 0.55 });

            fruitGeom = new THREE.SphereGeometry(0.09, 8, 8);
            fruitGeom.scale(1.1, 0.85, 1.1);
            fruitGeom.translate(0, 0.08, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.4 });
            break;
        }

        case "carrot": {
            cropHeight = 0.60;
            // Feathery fern fronds + bright orange carrot root shoulders
            stemGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.50, 6);
            stemGeom.translate(0, 0.25, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x367e39, roughness: 0.7 });

            leafGeom = new THREE.DodecahedronGeometry(0.28, 1);
            leafGeom.scale(1.1, 0.6, 1.1);
            leafGeom.translate(0, 0.38, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });

            fruitGeom = new THREE.ConeGeometry(0.065, 0.22, 8);
            fruitGeom.rotateX(Math.PI);
            fruitGeom.translate(0, 0.06, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
            break;
        }

        case "papaya": {
            cropHeight = 3.1;
            // Columnar trunk + umbrella palmately lobed leaf crown + hanging fruits
            stemGeom = new THREE.CylinderGeometry(0.065, 0.095, 2.5, 8);
            stemGeom.translate(0, 1.25, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x635745, roughness: 0.8 });

            leafGeom = new THREE.ConeGeometry(0.75, 0.35, 8, 1, true);
            leafGeom.translate(0, 2.65, 0);
            leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5, side: THREE.DoubleSide });

            fruitGeom = new THREE.SphereGeometry(0.12, 8, 8);
            fruitGeom.scale(0.8, 1.4, 0.8);
            fruitGeom.translate(0.12, 2.15, 0.08);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.35 });
            break;
        }

        default:
            return generateCropAssets("rice");
    }

    // Inject GLSL Wind Shaders into materials
    injectGLSLWindShader(stemMat, cropHeight);
    injectGLSLWindShader(leafMat, cropHeight);
    if (fruitMat) injectGLSLWindShader(fruitMat, cropHeight);

    return { stemGeom, stemMat, leafGeom, leafMat, fruitGeom, fruitMat };
}

/*
|--------------------------------------------------------------------------
| CREATE FULL CROP FIELD (196 INSTANCED PLANTS)
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

    // 1. Build Botanical Assets with GLSL wind vertex shader
    const assets = generateCropAssets(cropId);

    // 2. Create Instanced Meshes (196 plants)
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

/*
|--------------------------------------------------------------------------
| CAMERA FRAMING ADAPTATION
|--------------------------------------------------------------------------
*/
function adjustFieldCameraForCrop(cropId) {
    const meta = CROP_METRICS[cropId] || CROP_METRICS.rice;

    if (meta.heightCategory === "tall") {
        // Papaya, Maize, Jute
        targetCameraPos.set(0, 1.45, 5.8);
        targetLookAt.set(0, 1.25, 0);
    } else if (meta.heightCategory === "low") {
        // Potato, Onion, Carrot, Cucumber, Cauliflower, Lentil
        targetCameraPos.set(0, 0.72, 4.4);
        targetLookAt.set(0, 0.35, 0);
    } else {
        // Rice, Wheat, Tomato, Eggplant, Chili, Mustard
        targetCameraPos.set(0, 0.90, 5.2);
        targetLookAt.set(0, 0.65, 0);
    }

    isTransitioningCamera = true;
}

/*
|--------------------------------------------------------------------------
| CINEMATIC CAMERA MODES: DRONE AERIAL VIEW VS GROUND FIELD VIEW
|--------------------------------------------------------------------------
*/
export function switchCameraMode(mode) {
    currentCameraMode = mode;

    const btnDrone = document.getElementById("btnDroneView");
    const btnField = document.getElementById("btnFieldView");

    if (mode === "drone") {
        // 🚁 Drone Aerial View: High altitude, 55° top-down perspective
        targetCameraPos.set(0, 9.8, 12.2);
        targetLookAt.set(0, 0.2, 0);
        isTransitioningCamera = true;

        if (btnDrone) btnDrone.classList.add("active");
        if (btnField) btnField.classList.remove("active");
    } else {
        // 🌾 Ground Field View: Human eye-level right at the earthen bund
        adjustFieldCameraForCrop(activeCropId);

        if (btnField) btnField.classList.add("active");
        if (btnDrone) btnDrone.classList.remove("active");
    }
}
window.switchCameraMode = switchCameraMode;

/*
|--------------------------------------------------------------------------
| PUBLIC METHOD: UPDATE CROP SIMULATION
|--------------------------------------------------------------------------
*/
export function updateCropSimulation(cropId) {
    if (!cropId || (cropId === activeCropId && currentCropGroup)) return;
    activeCropId = cropId;

    // Sync UI selector
    const cropSelect = document.getElementById("cropSelect");
    if (cropSelect && cropSelect.value !== cropId) {
        cropSelect.value = cropId;
    }

    // Sync Lifecycle Tracker if present
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
| BIND VIEW CONTROLS (CAMERA PRESETS, SLIDER, FULLSCREEN, DRAWER)
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

    // 1. Dual Camera Mode Buttons
    const btnDrone = document.getElementById("btnDroneView") || document.getElementById("hudResetView");
    const btnField = document.getElementById("btnFieldView") || document.getElementById("hudFieldView");

    if (btnDrone) {
        btnDrone.addEventListener("click", () => switchCameraMode("drone"));
    }
    if (btnField) {
        btnField.addEventListener("click", () => switchCameraMode("field"));
    }

    // 2. Time of Day Slider
    if (timeSlider) {
        timeSlider.addEventListener("input", (e) => {
            updateTimeOfDay(parseFloat(e.target.value));
        });
    }

    // 3. Slide-in Data Drawer Toggle (Zero Clutter by Default)
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

    if (btnDataToggle) {
        btnDataToggle.addEventListener("click", () => toggleDataDrawer());
    }
    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener("click", () => toggleDataDrawer(false));
    }
    if (btnClean) {
        btnClean.addEventListener("click", () => toggleDataDrawer(false));
    }

    // 4. Crop Dropdown Listener
    if (cropSelect) {
        cropSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    // 5. Fullscreen Toggle
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
| ANIMATION LOOP (GLSL UNIFORMS & TWEENS)
|--------------------------------------------------------------------------
*/
function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.016;

    // 1. Update GLSL Shader Uniforms (Wind & Moving Clouds)
    windUniforms.uTime.value = animationTime;
    cloudUniforms.uTime.value = animationTime;

    // 2. Crop Transition Scaling
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

    // 3. Smooth Camera Tweening
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

/*
|--------------------------------------------------------------------------
| WINDOW RESIZE HANDLER
|--------------------------------------------------------------------------
*/
function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 620;

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
