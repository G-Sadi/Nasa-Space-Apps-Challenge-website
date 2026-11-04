/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — ADVANCED 3D CROP SIMULATION ENGINE
|--------------------------------------------------------------------------
| - Three.js WebGLRenderer with ACESFilmicToneMapping & sRGB output
| - Warm natural sunlight, hemisphere sky-ground lighting, 3D soil mound
| - 15 Procedural Anatomical 3D Crops + GLTF/DRACO Loader Fallback
| - Dynamic smooth crop switching (fade-scale transition) & auto-framing
| - 3 Farmer-Centric Interactive 3D HTML Hotspots (Leaf, Soil, Fruit)
| - Procedural wind swaying animation & Touch controls with angle limits
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// Core Three.js State
let scene, camera, renderer, controls;
let containerEl, hotspotsOverlayEl;
let sunLight, hemiLight, fillLight;
let moundGroup, currentCropGroup, surroundingFarmGroup;
let isDayMode = true;
let animationTime = 0;

// Switching & Camera Animation State
let activeCropId = "rice";
let isTransitioningCrop = false;
let transitionProgress = 0;
let oldCropMesh = null;
let newCropMesh = null;

let targetCameraPos = new THREE.Vector3(0, 5, 8.5);
let targetLookAt = new THREE.Vector3(0, 1.6, 0);
let isTransitioningCamera = false;

// Hotspots State & World Anchors
const hotspotAnchors = {
    leaf:  new THREE.Vector3(0.5, 2.2, 0.2),
    soil:  new THREE.Vector3(-0.6, 0.45, 0.8),
    fruit: new THREE.Vector3(0.2, 1.4, 0.4)
};

// 15 Crop Metadata for Hotspots (Bilingual)
const CROP_HOTSPOT_INFO = {
    rice: {
        leaf: { badge: "স্বাভাবিক / Normal", status: "good", desc: "ধানের পাতায় ক্লোরোফিল ঘনত্ব চমৎকার। কোনো ব্লাস্ট বা খোলপোড়া রোগের লক্ষণ নেই।" },
        soil: { badge: "আর্দ্র / 68% Moisture", status: "good", desc: "দোআঁশ মাটিতে ২-৩ সেমি পানির পরিমিত রস বজায় আছে। শিকড় সতেজ।" },
        fruit: { badge: "শীষ বৃদ্ধি / Panicle Set", status: "good", desc: "সুষম ধান শীষ গজানো পর্যায়; দানার দুধ পূর্ণতা পাচ্ছে।" }
    },
    wheat: {
        leaf: { badge: "সতেজ / Healthy", status: "good", desc: "গমের পাতায় কোনো মরিচা বা ব্লাইট নেই। রোদে সালোকসংশ্লেষণ সক্রিয়।" },
        soil: { badge: "পরিমিত / 55% Moisture", status: "good", desc: "মুকুট শিকড় অঞ্চলে পর্যাপ্ত রস রয়েছে; জলাবদ্ধতামুক্ত।" },
        fruit: { badge: "দানা গঠন / Grain Filling", status: "good", desc: "গমের শীষে পুষ্ট দানা তৈরি হচ্ছে। গরম বাতাস থেকে সুরক্ষিত রাখুন।" }
    },
    maize: {
        leaf: { badge: "চমৎকার / Vigorous", status: "good", desc: "প্রশস্ত সবুজ পাতা। ফল আর্মিওয়ার্মের কোনো উপস্থিতি পাওয়া যায়নি।" },
        soil: { badge: "অনুকূল / 65% Moisture", status: "good", desc: "আইলে গোড়ায় মাটি উঁচু করে শক্তভাবে নোঙর করা রয়েছে।" },
        fruit: { badge: "মোচা ধারণ / Tassel & Silk", status: "good", desc: "মোচায় রেশম বের হয়েছে; পরাগায়নের জন্য আবহাওয়া উপযুক্ত।" }
    },
    jute: {
        leaf: { badge: "স্বাভাবিক / Normal", status: "good", desc: "কচি পাতায় কোনো বিছা পোকা বা হলুদ মাকড়ের আক্রমণ নেই।" },
        soil: { badge: "উর্বর / High Moisture", status: "good", desc: "পলি মাটিতে দ্রুত কান্ড লম্বা হওয়ার জন্য নাইট্রোজেন সক্রিয়।" },
        fruit: { badge: "কান্ড বৃদ্ধি / Bast Fibers", status: "good", desc: "পাটের আঁশের গুণগত শক্তি দ্রুত বৃদ্ধি পাচ্ছে।" }
    },
    potato: {
        leaf: { badge: "সতর্কতা / Monitored", status: "warn", desc: "কুয়াশাচ্ছন্ন রাতে নাবি ধসা (Late Blight) প্রতিরোধে আগাম ছত্রাকনাশক স্প্রে করুন।" },
        soil: { badge: "ঝুরঝুরে / Loamy Ridge", status: "good", desc: "গোড়ায় মাটি তুলে আলু সম্পূর্ণ ঢেকে রাখা হয়েছে; আলু সবুজ হবে না।" },
        fruit: { badge: "আলু স্ফীতি / Tuber Bulking", status: "good", desc: "মাটির নিচে আলুর সাইজ বাড়ছে; পরিমিত আর্দ্রতা বজায় রাখুন।" }
    },
    mustard: {
        leaf: { badge: "উত্তম / Good", status: "good", desc: "পাতার নিচে জাবপোকা নেই; লেডিবার্ড বিটল পোকা প্রাকৃতিকভাবে রক্ষা করছে।" },
        soil: { badge: "শুকনো-মাঝারি / 45%", status: "good", desc: "হালকা দোআঁশ মাটিতে শিকড় দৃঢ়ভাবে প্রতিষ্ঠিত।" },
        fruit: { badge: "হলুদ ফুল / Full Bloom", status: "good", desc: "মৌমাছির দ্বারা ব্যাপক পরাগায়ন হচ্ছে; ফলন বৃদ্ধির লক্ষণ।" }
    },
    tomato: {
        leaf: { badge: "সংরক্ষিত / Staked", status: "good", desc: "বাঁশের খুঁটিতে বাঁধা রয়েছে; ভেজা মাটি থেকে পাতা সম্পূর্ণ ওপরে।" },
        soil: { badge: "সুনিষ্কাশিত / 60%", status: "good", desc: "ক্যালসিয়াম ও বোরনের সুষম সরবরাহ রয়েছে; তলা পচা রোধ হয়েছে।" },
        fruit: { badge: "ফল ধরা / Fruiting", status: "good", desc: "পুষ্ট টমেটোর থোকায় রঙ ধরছে (ব্রেকার স্টেজ); উজ্জ্বল ত্বক।" }
    },
    eggplant: {
        leaf: { badge: "ঝোপালো / Bushy", status: "good", desc: "ডগা ছিদ্রকারী পোকার কোনো সংক্রমণ নেই; ডগা সোজা ও তাজা।" },
        soil: { badge: "সমৃদ্ধ / Rich Humus", status: "good", desc: "গোড়ায় পচা গোবর ও পটাশের সুষম বলয় রয়েছে।" },
        fruit: { badge: "চকচকে বেগুন / Glossy", status: "good", desc: "নরম বীজসহ আকর্ষণীয় বেগুন সংগ্রহের উপযোগী হচ্ছে।" }
    },
    chili: {
        leaf: { badge: "কোঁকড়ামুক্ত / Clean", status: "good", desc: "থ্রিপস ও হলুদ মাকড়মুক্ত সমতল সবুজ পাতা।" },
        soil: { badge: "উঁচু বেড / Raised Bed", status: "good", desc: "পানি জমে থাকার কোনো সুযোগ নেই; শিকড় শ্বাস নিচ্ছে।" },
        fruit: { badge: "ঝাল মরিচ / Pod Setting", status: "good", desc: "গাঢ় সবুজ ও লাল টুকটুকে মরিচে ভরা ডালপালা।" }
    },
    lentil: {
        leaf: { badge: "সূক্ষ্ম / Feathery", status: "good", desc: "স্টেমফাইলিয়াম ব্লাইটমুক্ত মসুরের চিকন পাতা।" },
        soil: { badge: "নাইট্রোজেন গুটি / Nodules", status: "good", desc: "শিকড়ে প্রচুর সক্রিয় গোলাপী রাইজোবিয়াম গুটি বিদ্যমান।" },
        fruit: { badge: "শুঁটি গঠন / Podding", status: "good", desc: "প্রতিটি ডালে প্রচুর মসুরের ছোট শুঁটি আসছে।" }
    },
    cucumber: {
        leaf: { badge: "মাচায় বিস্তৃত / Trellis", status: "good", desc: "বাঁশের মাচায় লতা সুষমভাবে প্রসারিত; ডাউনি মিলডিউ নেই।" },
        soil: { badge: "রসালো মাদা / Moist Pit", status: "good", desc: "মাদায় খড়ের মালচিং থাকায় মাটির রস শুকিয়ে যাচ্ছে না।" },
        fruit: { badge: "খাস্তা শসা / Crisp Fruit", status: "good", desc: "সোজা ও মসৃণ সবুজ শসা ঝুলছে; কোনো মাছি পোকা নেই।" }
    },
    cauliflower: {
        leaf: { badge: "ব্লাঞ্চিং ঢাকা / Blanched", status: "good", desc: "ভেতরের জ্যাকেট পাতা দিয়ে সাদা কপিটিকে আলতো করে ঢেকে রাখা হয়েছে।" },
        soil: { badge: "বোরন সমৃদ্ধ / 65%", status: "good", desc: "বোরনের পর্যাপ্ততায় ফাঁপা কান্ড ও বাদামি দাগ পুরোপুরি মুক্ত।" },
        fruit: { badge: "ধবধবে কার্ড / Snow Curd", status: "good", desc: "নিবিড় নিরেট দুধ-সাদা ফুলকপির আকার বাড়ছে।" }
    },
    onion: {
        leaf: { badge: "নলাকার সবুজ / Tubular", status: "good", desc: "প্রতিটি পাতা কন্দের এক একটি খোসা তৈরি করছে।" },
        soil: { badge: "সালফার মিশ্রিত / Friable", status: "good", desc: "ঝুরঝুরে মাটিতে পেঁয়াজের ঝাঁঝ ও খোসার শক্তি বাড়ছে।" },
        fruit: { badge: "কন্দ স্ফীতি / Bulb Swelling", status: "good", desc: "মাটির উপরিভাগে বড় গোল পেঁয়াজের কন্দ দৃশ্যমান হচ্ছে।" }
    },
    carrot: {
        leaf: { badge: "ঘন ফার্ন পাতা / Lacy", status: "good", desc: "সবুজ পাতার ছাউনি মাটির রস ধরে রাখছে।" },
        soil: { badge: "পাথরহীন বেলে / Deep Tilth", status: "good", desc: "৩০ সেমি গভীর ঝুরঝুরে মাটি; গাজর বাঁকা বা ফাটলমুক্ত।" },
        fruit: { badge: "কমলা মূল / Orange Taproot", status: "good", desc: "মিষ্টতা ও বিটা-ক্যারোটিন সমৃদ্ধ মোটা রসালো গাজর তৈরি হচ্ছে।" }
    },
    papaya: {
        leaf: { badge: "ছাতার মতো ছাউনি / Canopy", status: "good", desc: "রিং স্পট ভাইরাসমুক্ত সুস্থ বড় পেঁপে পাতা।" },
        soil: { badge: "উঁচু ঢিবি / Mounded Soil", status: "good", desc: "গোড়া থেকে পানি দ্রুত নেমে যাওয়ার জন্য ঢিবি করা।" },
        fruit: { badge: "থোকায় ফল / Heavy Clusters", status: "good", desc: "কান্ডের উপরিভাগে ঘন থোকায় সুষম পেঁপে বড় হচ্ছে।" }
    }
};

// DRACO & GLTF Loaders Setup
let gltfLoader = null;
function setupLoaders() {
    try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/");
        gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);
    } catch (e) {
        console.warn("[3D Engine] DRACOLoader initialize fallback:", e);
    }
}

/*
|--------------------------------------------------------------------------
| INITIALIZE 3D REALISTIC SCENE
|--------------------------------------------------------------------------
*/
export function initializeFarmSimulation() {
    containerEl = document.getElementById("farm3D");
    if (!containerEl) return;

    // Ensure container has canvas-container class for styling hooks
    containerEl.classList.add("canvas-container");
    containerEl.innerHTML = "";

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 650;

    // 1. Scene & Atmosphere
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06150f); // Matching authentic Field Shift theme
    scene.fog = new THREE.FogExp2(0x0c251a, 0.025);

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(0, 5, 8.5);

    // 3. WebGLRenderer with Hyper-Realistic ToneMapping & ColorSpace
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Lifelike vibrancy per specification
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Soft Shadow mapping
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.appendChild(renderer.domElement);

    // 4. Subtle Touch OrbitControls with Rotation Limits
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.2;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping under ground!
    controls.minPolarAngle = Math.PI / 12;
    controls.target.set(0, 1.4, 0);
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    // 5. Farm Lighting Environment
    setupAtmosphericLighting();

    // 6. Base Soil Mound & Groups
    moundGroup = createMoundBase();
    scene.add(moundGroup);

    surroundingFarmGroup = createAmbientFarmSurroundings();
    scene.add(surroundingFarmGroup);

    currentCropGroup = new THREE.Group();
    scene.add(currentCropGroup);

    // 7. Setup Loaders & HTML Hotspot Overlay
    setupLoaders();
    createHotspotOverlay();

    // 8. Connect Dropdown Selectors
    bindCropDropdowns();

    // 9. Load Initial Crop Model (Rice by default)
    loadCropModel(activeCropId);

    // 10. Start Animation Loop
    animate();

    // Window Resize Handler
    window.addEventListener("resize", onWindowResize);
}

/*
|--------------------------------------------------------------------------
| REALISTIC LIGHTING SETUP
|--------------------------------------------------------------------------
*/
function setupAtmosphericLighting() {
    // Warm natural sunlight with soft shadows
    sunLight = new THREE.DirectionalLight(0xfff6df, 2.5);
    sunLight.position.set(12, 22, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Gentle sky ambient light (Sky cyan-blue blending to earthy ground green)
    hemiLight = new THREE.HemisphereLight(0x7ec8e3, 0x1f3818, 1.25);
    scene.add(hemiLight);

    // Soft bounce fill light for dark foliage underside
    fillLight = new THREE.DirectionalLight(0x43ef8c, 0.45);
    fillLight.position.set(-14, 8, -10);
    scene.add(fillLight);
}

/*
|--------------------------------------------------------------------------
| SUBTLE CIRCULAR 3D SOIL BASE & FARM BED
|--------------------------------------------------------------------------
*/
function createMoundBase() {
    const group = new THREE.Group();

    // Raised circular furrowed soil mound
    const moundGeo = new THREE.CylinderGeometry(2.6, 3.1, 0.5, 36);
    const moundMat = new THREE.MeshStandardMaterial({
        color: 0x22160d,
        roughness: 0.92,
        metalness: 0.05
    });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.y = 0.25;
    mound.receiveShadow = true;
    group.add(mound);

    // Top moist furrow bed with circular ridges
    const topBedGeo = new THREE.CylinderGeometry(2.55, 2.55, 0.08, 36);
    const topBedMat = new THREE.MeshStandardMaterial({
        color: 0x181008,
        roughness: 0.8
    });
    const topBed = new THREE.Mesh(topBedGeo, topBedMat);
    topBed.position.y = 0.52;
    topBed.receiveShadow = true;
    group.add(topBed);

    // Terracotta / Earthy perimeter collar
    const collarGeo = new THREE.TorusGeometry(2.65, 0.08, 12, 40);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshStandardMaterial({
        color: 0x3d2b1f,
        roughness: 0.75
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 0.5;
    group.add(collar);

    // Gentle ground terrain surrounding mound
    const groundGeo = new THREE.CircleGeometry(26, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x091c13,
        roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    ground.receiveShadow = true;
    group.add(ground);

    return group;
}

function createAmbientFarmSurroundings() {
    const group = new THREE.Group();
    // Distant soft green hedge / perimeter rows
    for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 14 + Math.sin(i * 3) * 2;
        const hedgeGeo = new THREE.SphereGeometry(0.7 + (i % 3) * 0.25, 7, 7);
        const hedgeMat = new THREE.MeshStandardMaterial({
            color: (i % 2 === 0) ? 0x1b4324 : 0x15351c,
            roughness: 0.9
        });
        const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
        hedge.position.set(Math.cos(angle) * dist, 0.4, Math.sin(angle) * dist);
        group.add(hedge);
    }
    return group;
}

/*
|--------------------------------------------------------------------------
| PROCEDURAL ANATOMICAL 3D CROP GENERATORS (15 CROPS)
|--------------------------------------------------------------------------
*/
function createProceduralCrop(cropId) {
    const root = new THREE.Group();
    root.name = `crop_${cropId}`;

    switch (cropId) {
        case "rice":
            // Rice (ধান): Curved green stalks & golden drooping panicles
            const stalkMat = new THREE.MeshStandardMaterial({ color: 0x48a832, roughness: 0.6 });
            const grainMat = new THREE.MeshStandardMaterial({ color: 0xd9b33a, roughness: 0.5 });
            for (let i = 0; i < 18; i++) {
                const angle = (i / 18) * Math.PI * 2;
                const r = 0.15 + (i % 3) * 0.1;
                const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.8, 6), stalkMat);
                stalk.position.set(Math.cos(angle) * r, 1.4, Math.sin(angle) * r);
                stalk.rotation.z = (Math.cos(angle) * 0.25);
                stalk.rotation.x = (Math.sin(angle) * 0.25);
                stalk.castShadow = true;
                root.add(stalk);

                // Grain Panicle drooping
                const panicle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 6), grainMat);
                panicle.position.set(Math.cos(angle) * (r + 0.35), 2.2, Math.sin(angle) * (r + 0.35));
                panicle.rotation.z = Math.cos(angle) * 0.7;
                panicle.castShadow = true;
                root.add(panicle);
            }
            break;

        case "wheat":
            // Wheat (গম): Upright golden-amber stalks with awned spikelets
            const wheatStalk = new THREE.MeshStandardMaterial({ color: 0x8fb84b, roughness: 0.7 });
            const earMat = new THREE.MeshStandardMaterial({ color: 0xe0b448, roughness: 0.45 });
            for (let i = 0; i < 22; i++) {
                const angle = (i / 22) * Math.PI * 2;
                const r = 0.2 + (i % 4) * 0.12;
                const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.9, 6), wheatStalk);
                stalk.position.set(Math.cos(angle) * r, 1.45, Math.sin(angle) * r);
                stalk.castShadow = true;
                root.add(stalk);

                // Awned Wheat Head
                const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.55, 6), earMat);
                ear.position.set(Math.cos(angle) * (r + 0.05), 2.45, Math.sin(angle) * (r + 0.05));
                ear.castShadow = true;
                root.add(ear);
            }
            break;

        case "maize":
            // Maize (ভুট্টা): Tall jointed stalk, broad leaves, cobs with silk & tassel
            const maizeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x4d8a2d }));
            maizeStem.position.y = 1.9;
            maizeStem.castShadow = true;
            root.add(maizeStem);

            // Broad arching leaves
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7e22, side: THREE.DoubleSide });
            for (let l = 0; l < 8; l++) {
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 1.4), leafMat);
                leaf.position.set(0, 1.2 + l * 0.22, 0.55);
                leaf.rotation.x = 0.45;
                const lg = new THREE.Group();
                lg.add(leaf);
                lg.rotation.y = l * 1.6;
                root.add(lg);
            }

            // Corn cobs
            const cobMat = new THREE.MeshStandardMaterial({ color: 0xf5b82e });
            for (let c = 0; c < 2; c++) {
                const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8), cobMat);
                cob.position.set(0.18, 1.5 + c * 0.4, 0.1);
                cob.rotation.z = -0.4;
                cob.castShadow = true;
                root.add(cob);
            }

            // Top tassel
            const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xd4a037 }));
            tassel.position.y = 3.5;
            root.add(tassel);
            break;

        case "jute":
            // Jute (পাট): Tall slender reddish-green bast stems & serrated foliage
            const juteMat = new THREE.MeshStandardMaterial({ color: 0x5e913a });
            for (let j = 0; j < 12; j++) {
                const a = (j / 12) * Math.PI * 2;
                const dist = 0.2 + (j % 2) * 0.15;
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 3.1, 6), juteMat);
                stem.position.set(Math.cos(a) * dist, 2.0, Math.sin(a) * dist);
                stem.castShadow = true;
                root.add(stem);

                const topLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), new THREE.MeshStandardMaterial({ color: 0x4a822b }));
                topLeaf.position.set(Math.cos(a) * dist, 3.4, Math.sin(a) * dist);
                root.add(topLeaf);
            }
            break;

        case "potato":
            // Potato (আলু): Bushy canopy + half-visible potato tubers in soil!
            const potBush = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), new THREE.MeshStandardMaterial({ color: 0x3d702a, roughness: 0.8 }));
            potBush.position.y = 1.35;
            potBush.castShadow = true;
            root.add(potBush);

            // Tubers nestled on soil mound
            const tuberMat = new THREE.MeshStandardMaterial({ color: 0xa87e4f, roughness: 0.85 });
            for (let tb = 0; tb < 6; tb++) {
                const a = (tb / 6) * Math.PI * 2;
                const tuber = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), tuberMat);
                tuber.scale.set(1.4, 0.9, 1.1);
                tuber.position.set(Math.cos(a) * 0.9, 0.58, Math.sin(a) * 0.9);
                tuber.castShadow = true;
                root.add(tuber);
            }
            break;

        case "mustard":
            // Mustard (সরিষা): Bright vibrant yellow flower head clusters
            const mStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0x528236 }));
            mStem.position.y = 1.4;
            root.add(mStem);

            const yellowFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
            for (let f = 0; f < 14; f++) {
                const a = (f / 14) * Math.PI * 2;
                const fl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), yellowFlowerMat);
                fl.position.set(Math.cos(a) * 0.45, 2.0 + (f % 4) * 0.15, Math.sin(a) * 0.45);
                root.add(fl);
            }
            break;

        case "tomato":
            // Tomato (টমেটো): Stake prop, leafy bush & bright red tomato clusters
            const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), new THREE.MeshStandardMaterial({ color: 0x755938 }));
            stake.position.set(0.08, 1.5, 0);
            root.add(stake);

            const tomBush = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2e6b21 }));
            tomBush.position.y = 1.5;
            tomBush.castShadow = true;
            root.add(tomBush);

            const redTomMat = new THREE.MeshStandardMaterial({ color: 0xdd2c1c, roughness: 0.25 });
            for (let t = 0; t < 5; t++) {
                const ta = (t / 5) * Math.PI * 2;
                const redTom = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), redTomMat);
                redTom.position.set(Math.cos(ta) * 0.5, 1.25 + (t % 2) * 0.3, Math.sin(ta) * 0.5);
                redTom.castShadow = true;
                root.add(redTom);
            }
            break;

        case "eggplant":
            // Eggplant (বেগুন): Velvety leaves & deep glossy purple fruits
            const brinjalBush = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), new THREE.MeshStandardMaterial({ color: 0x326127 }));
            brinjalBush.position.y = 1.45;
            brinjalBush.castShadow = true;
            root.add(brinjalBush);

            const eggMat = new THREE.MeshStandardMaterial({ color: 0x2a0845, roughness: 0.18 });
            for (let e = 0; e < 3; e++) {
                const ea = (e / 3) * Math.PI * 2;
                const egg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.65, 8), eggMat);
                egg.position.set(Math.cos(ea) * 0.55, 1.1, Math.sin(ea) * 0.55);
                egg.rotation.z = Math.cos(ea) * 0.3;
                egg.castShadow = true;
                root.add(egg);
            }
            break;

        case "chili":
            // Chili (মরিচ): Dark bush with glossy red & green peppers
            const chiliBush = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshStandardMaterial({ color: 0x25571c }));
            chiliBush.position.y = 1.35;
            root.add(chiliBush);

            const redPepper = new THREE.MeshStandardMaterial({ color: 0xd61818, roughness: 0.2 });
            const greenPepper = new THREE.MeshStandardMaterial({ color: 0x2bb01c, roughness: 0.2 });
            for (let ch = 0; ch < 8; ch++) {
                const ca = (ch / 8) * Math.PI * 2;
                const mat = (ch % 2 === 0) ? redPepper : greenPepper;
                const pod = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 6), mat);
                pod.position.set(Math.cos(ca) * 0.45, 1.2 + (ch % 3) * 0.15, Math.sin(ca) * 0.45);
                pod.rotation.x = Math.PI; // pointing down
                root.add(pod);
            }
            break;

        case "lentil":
            // Lentil (মসুর ডাল): Delicate pinnate leaflets and pods
            const lentilMat = new THREE.MeshStandardMaterial({ color: 0x4f8737 });
            for (let lt = 0; lt < 16; lt++) {
                const la = (lt / 16) * Math.PI * 2;
                const lr = 0.2 + (lt % 3) * 0.12;
                const lstem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.2, 5), lentilMat);
                lstem.position.set(Math.cos(la) * lr, 1.05, Math.sin(la) * lr);
                root.add(lstem);
            }
            break;

        case "cucumber":
            // Cucumber (শসা): Mini A-frame trellis with hanging cucumbers
            const cVine = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 7), new THREE.MeshStandardMaterial({ color: 0x367a26, wireframe: false }));
            cVine.position.y = 1.3;
            root.add(cVine);

            const cucMat = new THREE.MeshStandardMaterial({ color: 0x236924, roughness: 0.35 });
            for (let cc = 0; cc < 4; cc++) {
                const cca = (cc / 4) * Math.PI * 2;
                const cuc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8), cucMat);
                cuc.position.set(Math.cos(cca) * 0.6, 1.1, Math.sin(cca) * 0.6);
                cuc.rotation.z = Math.cos(cca) * 0.2;
                root.add(cuc);
            }
            break;

        case "cauliflower":
            // Cauliflower (ফুলকপি): Spreading jacket leaves & compact snow-white curd
            const curd = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf5f8f5, roughness: 0.8 }));
            curd.position.y = 0.85;
            curd.scale.set(1.1, 0.75, 1.1);
            root.add(curd);

            const jacketMat = new THREE.MeshStandardMaterial({ color: 0x336b28, side: THREE.DoubleSide });
            for (let j = 0; j < 8; j++) {
                const jf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.75), jacketMat);
                jf.position.set(0, 0.75, 0.45);
                jf.rotation.x = -0.35;
                const jg = new THREE.Group();
                jg.add(jf);
                jg.rotation.y = (j / 8) * Math.PI * 2;
                root.add(jg);
            }
            break;

        case "onion":
            // Onion (পেঁয়াজ): Bulb half-exposed in soil with hollow tubular scapes
            const onionBulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshStandardMaterial({ color: 0x822d3d, roughness: 0.4 }));
            onionBulb.position.y = 0.68;
            onionBulb.scale.set(1.2, 0.9, 1.2);
            root.add(onionBulb);

            const scapeMat = new THREE.MeshStandardMaterial({ color: 0x347d2b });
            for (let sc = 0; sc < 6; sc++) {
                const scape = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.4, 5), scapeMat);
                scape.position.set((sc - 2.5) * 0.06, 1.45, 0);
                scape.rotation.z = (sc - 2.5) * 0.08;
                root.add(scape);
            }
            break;

        case "carrot":
            // Carrot (গাজর): Feathery fern canopy & conical orange crown in soil
            const carrotRoot = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xed6e1a, roughness: 0.4 }));
            carrotRoot.position.y = 0.55;
            carrotRoot.rotation.x = Math.PI; // taproot in soil
            root.add(carrotRoot);

            const fernMat = new THREE.MeshStandardMaterial({ color: 0x2e8020 });
            const fernTop = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.1, 7), fernMat);
            fernTop.position.y = 1.35;
            root.add(fernTop);
            break;

        case "papaya":
            // Papaya (পেঁপে): Straight textured trunk, umbrella canopy & fruit cluster
            const papTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x6e6353, roughness: 0.85 }));
            papTrunk.position.y = 1.75;
            root.add(papTrunk);

            // Large palm-like umbrella leaves
            const papLeafMat = new THREE.MeshStandardMaterial({ color: 0x2b6e1f, side: THREE.DoubleSide });
            for (let pl = 0; pl < 6; pl++) {
                const pleaf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.1), papLeafMat);
                pleaf.position.set(0, 3.0, 0.6);
                pleaf.rotation.x = 0.25;
                const plg = new THREE.Group();
                plg.add(pleaf);
                plg.rotation.y = (pl / 6) * Math.PI * 2;
                root.add(plg);
            }

            // Papaya fruits clustered below canopy
            const papFruitMat = new THREE.MeshStandardMaterial({ color: 0x949e28, roughness: 0.35 });
            for (let pf = 0; pf < 5; pf++) {
                const pfa = (pf / 5) * Math.PI * 2;
                const pfruit = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 7), papFruitMat);
                pfruit.position.set(Math.cos(pfa) * 0.25, 2.35, Math.sin(pfa) * 0.25);
                root.add(pfruit);
            }
            break;

        default:
            // Generic lush plant fallback
            const genBush = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x3d7e22 }));
            genBush.position.y = 1.4;
            root.add(genBush);
    }

    return root;
}

/*
|--------------------------------------------------------------------------
| LOAD CROP MODEL (GLTF WITH PROCEDURAL FALLBACK)
|--------------------------------------------------------------------------
*/
function loadCropModel(cropId) {
    if (gltfLoader) {
        const modelPath = `models/${cropId}.glb`;
        gltfLoader.load(
            modelPath,
            (gltf) => {
                const mesh = gltf.scene;
                mesh.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                swapCropModel(mesh, cropId);
            },
            undefined,
            (error) => {
                // Seamless Procedural Fallback — never shows a broken canvas!
                const proceduralMesh = createProceduralCrop(cropId);
                swapCropModel(proceduralMesh, cropId);
            }
        );
    } else {
        const proceduralMesh = createProceduralCrop(cropId);
        swapCropModel(proceduralMesh, cropId);
    }
}

/*
|--------------------------------------------------------------------------
| SEAMLESS TRANSITION & AUTO-FRAMING CAMERA
|--------------------------------------------------------------------------
*/
function swapCropModel(incomingMesh, cropId) {
    if (newCropMesh) {
        oldCropMesh = newCropMesh;
    }

    newCropMesh = incomingMesh;
    newCropMesh.scale.set(0.001, 0.001, 0.001); // start at scale 0
    currentCropGroup.add(newCropMesh);

    isTransitioningCrop = true;
    transitionProgress = 0;

    // Auto-frame camera based on THREE.Box3 bounding box
    autoFramePlant(newCropMesh);

    // Update hotspots info for new crop
    updateHotspotsData(cropId);
}

function autoFramePlant(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z, 1.4);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.72;
    cameraDistance = Math.max(cameraDistance, 4.2);

    targetCameraPos.set(center.x + cameraDistance * 0.45, center.y + cameraDistance * 0.35, center.z + cameraDistance * 0.85);
    targetLookAt.set(center.x, Math.max(center.y, 1.2), center.z);
    isTransitioningCamera = true;
}

/*
|--------------------------------------------------------------------------
| DYNAMIC & SMOOTH CROP SWITCHING EXPORT
|--------------------------------------------------------------------------
*/
export function updateCropSimulation(cropId) {
    if (!cropId || cropId === activeCropId && newCropMesh) return;
    activeCropId = cropId;

    // Sync #cropSelect in 3D HUD
    const hudSelect = document.getElementById("cropSelect");
    if (hudSelect && hudSelect.value !== cropId) {
        hudSelect.value = cropId;
    }

    // Sync #cropLifecycleSelect in Tracker
    const lifecycleSelect = document.getElementById("cropLifecycleSelect");
    if (lifecycleSelect && lifecycleSelect.value !== cropId && window.selectLifecycleCrop) {
        window.selectLifecycleCrop(cropId);
    }

    loadCropModel(cropId);
}
window.updateCropSimulation = updateCropSimulation;

/*
|--------------------------------------------------------------------------
| FARMER-CENTRIC 3D HTML HOTSPOTS & TOOLTIPS
|--------------------------------------------------------------------------
*/
function createHotspotOverlay() {
    hotspotsOverlayEl = document.getElementById("crop3DHotspots");
    if (!hotspotsOverlayEl) {
        hotspotsOverlayEl = document.createElement("div");
        hotspotsOverlayEl.id = "crop3DHotspots";
        hotspotsOverlayEl.className = "crop-3d-hotspots-layer";
        containerEl.appendChild(hotspotsOverlayEl);
    }

    hotspotsOverlayEl.innerHTML = `
        <!-- Hotspot 1: Leaf Health -->
        <div class="crop-hotspot" id="hotspotLeaf" data-type="leaf">
            <button class="hotspot-pin" aria-label="Leaf Health">
                <span class="pin-pulse"></span>
                <span class="pin-icon">🌱</span>
            </button>
            <div class="hotspot-tooltip">
                <div class="tooltip-header">
                    <strong class="tooltip-title">পাতার স্বাস্থ্য (Leaf Health)</strong>
                    <span class="tooltip-badge badge-good" id="badgeLeaf">স্বাভাবিক</span>
                </div>
                <p class="tooltip-desc" id="descLeaf">পাতায় ক্লোরোফিল ঘনত্ব স্বাভাবিক। কোনো ছত্রাক বা রোগের লক্ষণ নেই।</p>
            </div>
        </div>

        <!-- Hotspot 2: Soil Moisture Zone -->
        <div class="crop-hotspot" id="hotspotSoil" data-type="soil">
            <button class="hotspot-pin" aria-label="Soil Moisture">
                <span class="pin-pulse"></span>
                <span class="pin-icon">💧</span>
            </button>
            <div class="hotspot-tooltip">
                <div class="tooltip-header">
                    <strong class="tooltip-title">মাটির আর্দ্রতা (Soil Moisture)</strong>
                    <span class="tooltip-badge badge-good" id="badgeSoil">অনুকূল ৬৮%</span>
                </div>
                <p class="tooltip-desc" id="descSoil">শিকড়ের আশেপাশে আদর্শ আর্দ্রতা বজায় রয়েছে। জলাবদ্ধতামুক্ত।</p>
            </div>
        </div>

        <!-- Hotspot 3: Grain/Fruit Growth -->
        <div class="crop-hotspot" id="hotspotFruit" data-type="fruit">
            <button class="hotspot-pin" aria-label="Fruit Growth">
                <span class="pin-pulse"></span>
                <span class="pin-icon">🌾</span>
            </button>
            <div class="hotspot-tooltip">
                <div class="tooltip-header">
                    <strong class="tooltip-title">ফলন ও বৃদ্ধি (Yield Stage)</strong>
                    <span class="tooltip-badge badge-good" id="badgeFruit">সক্রিয় বৃদ্ধি</span>
                </div>
                <p class="tooltip-desc" id="descFruit">সুষম বৃদ্ধি ও দানা গঠন সন্তোষজনক গতিতে এগোচ্ছে।</p>
            </div>
        </div>
    `;

    // Interactive Click/Tap on Hotspot Pin
    hotspotsOverlayEl.querySelectorAll(".crop-hotspot").forEach((hs) => {
        const pin = hs.querySelector(".hotspot-pin");
        pin.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = hs.classList.contains("active");
            hotspotsOverlayEl.querySelectorAll(".crop-hotspot").forEach(h => h.classList.remove("active"));
            if (!isOpen) hs.classList.add("active");
        });
    });

    // Close on outside click
    document.addEventListener("click", () => {
        if (hotspotsOverlayEl) {
            hotspotsOverlayEl.querySelectorAll(".crop-hotspot").forEach(h => h.classList.remove("active"));
        }
    });

    updateHotspotsData(activeCropId);
}

function updateHotspotsData(cropId) {
    const info = CROP_HOTSPOT_INFO[cropId] || CROP_HOTSPOT_INFO.rice;

    const bLeaf = document.getElementById("badgeLeaf");
    const dLeaf = document.getElementById("descLeaf");
    if (bLeaf) {
        bLeaf.textContent = info.leaf.badge;
        bLeaf.className = `tooltip-badge ${info.leaf.status === 'warn' ? 'badge-warn' : 'badge-good'}`;
    }
    if (dLeaf) dLeaf.textContent = info.leaf.desc;

    const bSoil = document.getElementById("badgeSoil");
    const dSoil = document.getElementById("descSoil");
    if (bSoil) {
        bSoil.textContent = info.soil.badge;
        bSoil.className = `tooltip-badge ${info.soil.status === 'warn' ? 'badge-warn' : 'badge-good'}`;
    }
    if (dSoil) dSoil.textContent = info.soil.desc;

    const bFruit = document.getElementById("badgeFruit");
    const dFruit = document.getElementById("descFruit");
    if (bFruit) {
        bFruit.textContent = info.fruit.badge;
        bFruit.className = `tooltip-badge ${info.fruit.status === 'warn' ? 'badge-warn' : 'badge-good'}`;
    }
    if (dFruit) dFruit.textContent = info.fruit.desc;
}

function updateHotspotsScreenPositions() {
    if (!hotspotsOverlayEl || !containerEl) return;

    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    const projectPoint = (vec3, elementId) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const p = vec3.clone();
        p.project(camera);

        // Behind camera?
        if (p.z > 1) {
            el.style.display = "none";
            return;
        }

        el.style.display = "block";
        const screenX = (p.x * 0.5 + 0.5) * width;
        const screenY = (-(p.y * 0.5) + 0.5) * height;

        el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;
    };

    projectPoint(hotspotAnchors.leaf, "hotspotLeaf");
    projectPoint(hotspotAnchors.soil, "hotspotSoil");
    projectPoint(hotspotAnchors.fruit, "hotspotFruit");
}

/*
|--------------------------------------------------------------------------
| BIND CROP DROPDOWNS & HUD CONTROLS
|--------------------------------------------------------------------------
*/
function bindCropDropdowns() {
    const hudSelect = document.getElementById("cropSelect");
    if (hudSelect) {
        hudSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    const lifecycleSelect = document.getElementById("cropLifecycleSelect");
    if (lifecycleSelect) {
        lifecycleSelect.addEventListener("change", (e) => {
            updateCropSimulation(e.target.value);
        });
    }

    // Auto-frame button in HUD
    const autoFrameBtn = document.getElementById("hudResetView");
    if (autoFrameBtn) {
        autoFrameBtn.addEventListener("click", () => {
            if (newCropMesh) autoFramePlant(newCropMesh);
        });
    }

    // Field View button
    const fieldBtn = document.getElementById("hudFieldView");
    if (fieldBtn) {
        fieldBtn.addEventListener("click", () => {
            targetCameraPos.set(0, 1.8, 5.2);
            targetLookAt.set(0, 1.2, 0);
            isTransitioningCamera = true;
        });
    }

    // Day / Night Sun toggle
    const sunBtn = document.getElementById("hudToggleSun");
    if (sunBtn) {
        sunBtn.addEventListener("click", () => {
            isDayMode = !isDayMode;
            if (isDayMode) {
                scene.background.set(0x06150f);
                sunLight.color.set(0xfff6df);
                sunLight.intensity = 2.5;
                hemiLight.intensity = 1.25;
                sunBtn.textContent = "☀️ দিন";
            } else {
                scene.background.set(0x040b08);
                sunLight.color.set(0xff7a33);
                sunLight.intensity = 1.3;
                hemiLight.intensity = 0.6;
                sunBtn.textContent = "🌅 গোধূলি";
            }
        });
    }
}

/*
|--------------------------------------------------------------------------
| ANIMATION LOOP & PROCEDURAL WIND SWAYING
|--------------------------------------------------------------------------
*/
function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.016;

    // 1. Procedural Wind Swaying Animation on Crop
    if (newCropMesh) {
        newCropMesh.rotation.z = Math.sin(animationTime * 1.8) * 0.022;
        newCropMesh.rotation.x = Math.cos(animationTime * 1.4) * 0.015;
    }

    // 2. Smooth Model Fade/Scale Transition
    if (isTransitioningCrop) {
        transitionProgress += 0.055;
        const t = Math.min(transitionProgress, 1);
        const easeScale = 1 - Math.pow(1 - t, 3); // ease-out cubic

        if (newCropMesh) {
            newCropMesh.scale.set(easeScale, easeScale, easeScale);
        }

        if (oldCropMesh) {
            const shrink = Math.max(1 - t * 1.5, 0);
            oldCropMesh.scale.set(shrink, shrink, shrink);
            if (t >= 1) {
                currentCropGroup.remove(oldCropMesh);
                oldCropMesh = null;
                isTransitioningCrop = false;
            }
        } else if (t >= 1) {
            isTransitioningCrop = false;
        }
    }

    // 3. Smooth Camera Auto-Framing Interpolation
    if (isTransitioningCamera) {
        camera.position.lerp(targetCameraPos, 0.06);
        controls.target.lerp(targetLookAt, 0.06);

        if (camera.position.distanceTo(targetCameraPos) < 0.08) {
            isTransitioningCamera = false;
        }
    }

    controls.update();

    // 4. Update 3D HTML Hotspots Screen Projections
    updateHotspotsScreenPositions();

    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 650;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Auto Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFarmSimulation);
} else {
    initializeFarmSimulation();
}
