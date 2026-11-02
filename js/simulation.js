/*
|--------------------------------------------------------------------------
| AGRIVISION — HYPER-REALISTIC 3D SMART FARM ENGINE (Three.js)
|--------------------------------------------------------------------------
| Features:
| • Procedural PBR Soil & Furrow Textures + Anisotropic Tin Roof Shader
| • Dynamic Animated Water with Ripple Normal Distortion & Reflections
| • Rich Bengali Farm Atmosphere: Farmhouse, Veranda, Hand Tube-Well (নলকূপ),
|   Bamboo Fencing, Coconut Palms, Banana Trees, Rice Paddy & Vegetable Plots
| • 3-Stage Cinematic Lighting: Day ☀️, Sunset 🌅, and Night 🌙 with Fireflies
| • Dual Camera Presets: 🚁 Drone Overview & 🚜 Ground-Level Field Walk
| • English Default HUD with Instant Bilingual (EN ⇄ BN) Synchronization
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let farmGroup, cropGroup, treeGroup, waterGroup, cloudGroup, fireflyGroup;
let animatedObjects = [];
let pondMaterial, paddyWaterMaterial;
let sunLight, hemiLight, ambientLight, moonLight;
let animationTime = 0;

// Lighting Modes: 0 = Day, 1 = Sunset / Dusk, 2 = Night
let currentLightingMode = 0;

/*
|--------------------------------------------------------------------------
| PROCEDURAL TEXTURE GENERATORS
|--------------------------------------------------------------------------
*/

// 1. Furrowed Agricultural Soil Texture (Plowed Earth)
function createFurrowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#332214";
    ctx.fillRect(0, 0, 512, 512);

    const furrowHeight = 32;
    for (let y = 0; y < 512; y += furrowHeight) {
        const grad = ctx.createLinearGradient(0, y, 0, y + furrowHeight);
        grad.addColorStop(0.0, "rgba(22, 14, 8, 0.95)");
        grad.addColorStop(0.3, "rgba(65, 46, 27, 0.9)");
        grad.addColorStop(0.7, "rgba(92, 68, 42, 0.95)");
        grad.addColorStop(1.0, "rgba(22, 14, 8, 0.95)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, y, 512, furrowHeight);

        // Soil clumps & pebbles
        for (let i = 0; i < 80; i++) {
            const rx = Math.random() * 512;
            const ry = y + Math.random() * furrowHeight;
            const rSize = 1.2 + Math.random() * 3.2;
            const isDark = Math.random() > 0.5;
            ctx.fillStyle = isDark ? "rgba(15, 10, 5, 0.5)" : "rgba(115, 88, 55, 0.4)";
            ctx.beginPath();
            ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

// 2. Natural Lush Grass Texture
function createGrassTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#3c6126";
    ctx.fillRect(0, 0, 512, 512);

    const colors = ["#4e7a2d", "#36591f", "#5c8c36", "#294617", "#466e28"];
    for (let i = 0; i < 18000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 2.5 + Math.random() * 5.5;
        ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 3, y - len);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
}

// 3. Dynamic Water Surface Normal Map
function createWaterNormalTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    const imgData = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const idx = (y * 256 + x) * 4;
            const w1 = Math.sin(x * 0.14) * Math.cos(y * 0.14);
            const w2 = Math.sin((x + y) * 0.09) * 0.6;
            const val = (w1 + w2 + 1.6) / 3.2;

            imgData.data[idx]     = Math.floor(128 + (val - 0.5) * 80);
            imgData.data[idx + 1] = Math.floor(128 + (val - 0.5) * 80);
            imgData.data[idx + 2] = 255;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

// 4. Corrugated Galvanized Tin Roof Texture
function createTinRoofTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#8a969e";
    ctx.fillRect(0, 0, 256, 256);

    for (let x = 0; x < 256; x += 8) {
        const grad = ctx.createLinearGradient(x, 0, x + 8, 0);
        grad.addColorStop(0.0, "#525e68");
        grad.addColorStop(0.5, "#d2dbe2");
        grad.addColorStop(1.0, "#525e68");
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, 8, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    return texture;
}

/*
|--------------------------------------------------------------------------
| INITIALIZE 3D SIMULATION SCENE
|--------------------------------------------------------------------------
*/

export function initializeFarmSimulation() {
    const container = document.getElementById("farm3D");
    if (!container) return;

    container.innerHTML = "";

    // 1. Scene & Atmosphere Fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa5d6e7);
    scene.fog = new THREE.FogExp2(0xcde6df, 0.012);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 350);
    camera.position.set(0, 20, 32); // Drone View default

    // 3. Renderer with High-Fidelity Tone Mapping & Soft Shadows
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Orbit Controls with Smooth Damping
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera sinking under ground
    controls.minPolarAngle = Math.PI / 10;
    controls.target.set(0, 1.2, 0);

    // 5. Hierarchy Groups
    farmGroup    = new THREE.Group();
    cropGroup    = new THREE.Group();
    treeGroup    = new THREE.Group();
    waterGroup   = new THREE.Group();
    cloudGroup   = new THREE.Group();
    fireflyGroup = new THREE.Group();

    scene.add(farmGroup);
    farmGroup.add(cropGroup);
    farmGroup.add(treeGroup);
    farmGroup.add(waterGroup);
    scene.add(cloudGroup);
    scene.add(fireflyGroup);

    // 6. Build Scene Objects
    setupLighting();
    buildAtmosphereDome();
    buildVolumetricClouds();
    buildTerrain();
    buildPaddyField();
    buildVegetableBeds();
    buildPondAndCanals();
    buildRoadsAndAils();
    buildBangladeshiFarmhouse();
    buildTubeWell();
    buildBambooFences();
    buildVegetationAndCrops();
    buildTropicalTrees();
    buildFireflies();

    // 7. Interactive Controls & Bilingual Synchronization
    setupInteractiveCameraAndLights();
    updateDashboardUI();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("languageChanged", updateDashboardUI);

    animate();
}

/*
|--------------------------------------------------------------------------
| LIGHTING RIG (DAY, SUNSET, NIGHT)
|--------------------------------------------------------------------------
*/

function setupLighting() {
    hemiLight = new THREE.HemisphereLight(0xdcf4ff, 0x3d5a27, 1.4);
    scene.add(hemiLight);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffae6, 2.8);
    sunLight.position.set(30, 45, 24);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 130;
    sunLight.shadow.camera.left = -35;
    sunLight.shadow.camera.right = 35;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.00025;
    sunLight.shadow.radius = 2.4;

    scene.add(sunLight);

    // Moonlight (active during night)
    moonLight = new THREE.DirectionalLight(0x7da4d9, 0);
    moonLight.position.set(-20, 35, -20);
    scene.add(moonLight);
}

/*
|--------------------------------------------------------------------------
| ENVIRONMENT & ATMOSPHERE
|--------------------------------------------------------------------------
*/

function buildAtmosphereDome() {
    const skyGeo = new THREE.SphereGeometry(150, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x9ecfe6, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Distant tree horizon layer
    const horizonGeo = new THREE.CylinderGeometry(80, 80, 14, 48, 1, true);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x3b5f34, side: THREE.BackSide, fog: true });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.y = 5.5;
    scene.add(horizon);
}

function buildVolumetricClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        transparent: true,
        opacity: 0.85
    });

    for (let c = 0; c < 7; c++) {
        const cloud = new THREE.Group();
        const puffCount = 5 + Math.floor(Math.random() * 4);
        for (let p = 0; p < puffCount; p++) {
            const size = 2.2 + Math.random() * 2.2;
            const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 7, 7), cloudMat);
            puff.position.set((p - puffCount / 2) * 2.2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.5);
            cloud.add(puff);
        }
        cloud.position.set(-45 + Math.random() * 90, 26 + Math.random() * 6, -35 + Math.random() * 70);
        cloud.scale.set(1.4, 0.7, 1.2);
        cloudGroup.add(cloud);
    }
}

function buildTerrain() {
    const grassTex = createGrassTexture();
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 80, 32, 32),
        new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9, metalness: 0.04 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    farmGroup.add(ground);
}

/*
|--------------------------------------------------------------------------
| AGRICULTURAL PLOTS & WATERWAYS
|--------------------------------------------------------------------------
*/

function buildPaddyField() {
    // Sunken waterlogged mud plot
    const mud = new THREE.Mesh(
        new THREE.BoxGeometry(15, 0.16, 12.5),
        new THREE.MeshStandardMaterial({ color: 0x352c20, roughness: 0.35, metalness: 0.15 })
    );
    mud.position.set(-13.5, 0.05, -7.5);
    farmGroup.add(mud);

    paddyWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a6b4c,
        roughness: 0.08,
        metalness: 0.3,
        transparent: true,
        opacity: 0.78
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(14.7, 12.2), paddyWaterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-13.5, 0.14, -7.5);
    farmGroup.add(water);

    buildAilBorder(-13.5, -7.5, 15.2, 12.7);
    buildPaddySeedlings(-13.5, -7.5, 14, 11.5);
}

function buildAilBorder(x, z, w, d) {
    const ailMat = new THREE.MeshStandardMaterial({ color: 0x54432d, roughness: 0.92 });
    const h = 0.42;
    const thickness = 0.4;

    const nsGeo = new THREE.BoxGeometry(w, h, thickness);
    const n = new THREE.Mesh(nsGeo, ailMat);
    n.position.set(x, h / 2, z - d / 2);
    n.castShadow = true; n.receiveShadow = true;
    farmGroup.add(n);

    const s = new THREE.Mesh(nsGeo, ailMat);
    s.position.set(x, h / 2, z + d / 2);
    s.castShadow = true; s.receiveShadow = true;
    farmGroup.add(s);

    const ewGeo = new THREE.BoxGeometry(thickness, h, d);
    const e = new THREE.Mesh(ewGeo, ailMat);
    e.position.set(x + w / 2, h / 2, z);
    e.castShadow = true; e.receiveShadow = true;
    farmGroup.add(e);

    const wMesh = new THREE.Mesh(ewGeo, ailMat);
    wMesh.position.set(x - w / 2, h / 2, z);
    wMesh.castShadow = true; wMesh.receiveShadow = true;
    farmGroup.add(wMesh);
}

function buildPaddySeedlings(centerX, centerZ, width, depth) {
    const shootGeo = new THREE.ConeGeometry(0.07, 0.72, 4);
    const shootMat = new THREE.MeshStandardMaterial({ color: 0x6dbf39, roughness: 0.55 });
    const count = 300;
    const instanced = new THREE.InstancedMesh(shootGeo, shootMat, count);
    instanced.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    const cols = 20, rows = 15;
    const xStep = width / cols, zStep = depth / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const px = centerX - width / 2 + c * xStep + (Math.random() - 0.5) * 0.28;
            const pz = centerZ - depth / 2 + r * zStep + (Math.random() - 0.5) * 0.28;
            const s = 0.8 + Math.random() * 0.4;

            dummy.position.set(px, 0.45 * s, pz);
            dummy.scale.set(s, s, s);
            dummy.rotation.y = Math.random() * Math.PI;
            dummy.updateMatrix();

            instanced.setMatrixAt(idx++, dummy.matrix);
        }
    }
    cropGroup.add(instanced);
    animatedObjects.push({ mesh: instanced, type: "paddy" });
}

function buildVegetableBeds() {
    const furrowTex = createFurrowTexture();
    const soilMat = new THREE.MeshStandardMaterial({ map: furrowTex, roughness: 0.95, metalness: 0.02 });

    // Bed 1: Brinjal & Cabbage (center front)
    const bed1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 9.5), soilMat);
    bed1.position.set(0, 0.15, 3.8);
    bed1.receiveShadow = true;
    bed1.castShadow = true;
    farmGroup.add(bed1);
    buildAilBorder(0, 3.8, 16.4, 9.8);

    // Bed 2: Tomatoes & Maize (right side)
    const bed2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 8.5), soilMat);
    bed2.position.set(9.2, 0.15, -6.5);
    bed2.receiveShadow = true;
    bed2.castShadow = true;
    farmGroup.add(bed2);
    buildAilBorder(9.2, -6.5, 12.4, 8.8);
}

function buildPondAndCanals() {
    const waterNormal = createWaterNormalTexture();

    pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a729b,
        roughness: 0.08,
        metalness: 0.32,
        normalMap: waterNormal,
        transparent: true,
        opacity: 0.88
    });

    // Rural Farm Pond (পুকুর)
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.0, 0.45, 42), pondMaterial);
    pond.position.set(-1.8, 0.12, -7.5);
    pond.scale.set(1.45, 1, 0.9);
    waterGroup.add(pond);

    // Earthen embankment rim
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(5.6, 0.45, 8, 36),
        new THREE.MeshStandardMaterial({ color: 0x485a31, roughness: 0.95 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(-1.8, 0.18, -7.5);
    rim.scale.set(1.45, 0.9, 1);
    waterGroup.add(rim);

    // Irrigation Canal
    const canal = new THREE.Mesh(new THREE.BoxGeometry(32, 0.22, 1.6), pondMaterial);
    canal.position.set(0, 0.08, 10.2);
    waterGroup.add(canal);

    // Lotus / Water Lily Pads (শাপলা পাতা)
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x2e6f33, roughness: 0.6 });
    for (let l = 0; l < 9; l++) {
        const pad = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.2, 8), lilyMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(-2.5 + (Math.random() - 0.5) * 4.5, 0.25, -7.5 + (Math.random() - 0.5) * 3);
        waterGroup.add(pad);
    }
}

function buildRoadsAndAils() {
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xb59972, roughness: 0.95 });

    const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(65, 0.1, 2.4), pathMat);
    mainRoad.position.set(0, 0.06, -1.8);
    mainRoad.receiveShadow = true;
    farmGroup.add(mainRoad);

    const farmPath = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 42), pathMat);
    farmPath.position.set(-6.5, 0.06, 0);
    farmPath.receiveShadow = true;
    farmGroup.add(farmPath);
}

/*
|--------------------------------------------------------------------------
| BANGLADESHI RURAL FARMHOUSE, TUBE-WELL & FENCING
|--------------------------------------------------------------------------
*/

function buildBangladeshiFarmhouse() {
    const house = new THREE.Group();
    const tinTex = createTinRoofTexture();

    // Mud / Plaster Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb0, roughness: 0.85 });
    const mainRoom = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.5, 3.6), wallMat);
    mainRoom.position.y = 1.25;
    mainRoom.castShadow = true;
    house.add(mainRoom);

    // Door & Windows
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a321d, roughness: 0.7 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.08), woodMat);
    door.position.set(0.6, 0.9, 1.82);
    house.add(door);

    const windowA = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.08), woodMat);
    windowA.position.set(-1.4, 1.4, 1.82);
    house.add(windowA);

    // Roof (Corrugated Tin / টিনের চাল)
    const roofMat = new THREE.MeshStandardMaterial({
        map: tinTex,
        roughness: 0.42,
        metalness: 0.7,
        side: THREE.DoubleSide
    });

    const roofFront = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 2.6), roofMat);
    roofFront.position.set(0, 3.0, 1.0);
    roofFront.rotation.x = Math.PI / 5.5;
    roofFront.castShadow = true;
    house.add(roofFront);

    const roofBack = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 2.6), roofMat);
    roofBack.position.set(0, 3.0, -1.0);
    roofBack.rotation.x = -Math.PI / 5.5;
    roofBack.castShadow = true;
    house.add(roofBack);

    // Front Veranda / বারান্দা Posts
    for (let p = -2.2; p <= 2.2; p += 2.2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), woodMat);
        post.position.set(p, 1.2, 2.1);
        post.castShadow = true;
        house.add(post);
    }

    house.position.set(7.5, 0, -2.6);
    farmGroup.add(house);
}

// Traditional Bangladeshi Hand Tube-Well (টিউবওয়েল / নলকূপ)
function buildTubeWell() {
    const tubeWell = new THREE.Group();
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x225533, roughness: 0.4, metalness: 0.75 });
    const silverMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 });

    // Concrete platform (পাকা ঘাট)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.18, 16), concreteMat);
    base.position.y = 0.09;
    base.receiveShadow = true;
    tubeWell.add(base);

    // Main pump body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.2, 8), castIronMat);
    body.position.y = 0.68;
    body.castShadow = true;
    tubeWell.add(body);

    // Spout (নল)
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), castIronMat);
    spout.position.set(0.18, 0.75, 0);
    spout.rotation.z = Math.PI / 2.8;
    tubeWell.add(spout);

    // Handle (হাতা)
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), silverMat);
    handle.position.set(-0.35, 1.15, 0);
    handle.rotation.z = -Math.PI / 4;
    tubeWell.add(handle);

    tubeWell.position.set(-4.5, 0, -6.8);
    farmGroup.add(tubeWell);
}

function buildBambooFences() {
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xb59e6c, roughness: 0.8 });
    const fence = new THREE.Group();

    // Horizontal bamboo poles
    for (let h = 0.3; h <= 0.7; h += 0.35) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 16.2, 6), fenceMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, h, 8.5);
        fence.add(rail);
    }

    // Vertical bamboo slats
    for (let x = -8.0; x <= 8.0; x += 0.8) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), fenceMat);
        post.position.set(x, 0.45, 8.5);
        post.castShadow = true;
        fence.add(post);
    }

    farmGroup.add(fence);
}

/*
|--------------------------------------------------------------------------
| VEGETATION: BRINJAL, TOMATO, CABBAGE & MAIZE
|--------------------------------------------------------------------------
*/

function buildVegetationAndCrops() {
    buildBrinjalPlot(0, 5.8, 14, 3);
    buildCabbagePlot(0, 2.2, 14, 3);
    buildTomatoPlot(9.2, -7.5, 10, 4);
    buildMaizePlot(9.2, -4.5, 10, 3);
}

function buildBrinjalPlot(cx, cz, width, numRows) {
    const group = new THREE.Group();
    const cols = 14, spacing = 1.0;
    for (let r = 0; r < numRows; r++) {
        const z = cz - ((numRows - 1) * spacing) / 2 + r * spacing;
        for (let c = 0; c < cols; c++) {
            const x = cx - width / 2 + 0.8 + c * (width / cols);
            const plant = createBrinjalPlant();
            plant.position.set(x, 0.35, z);
            group.add(plant);
        }
    }
    cropGroup.add(group);
    animatedObjects.push({ mesh: group, type: "crop" });
}

function createBrinjalPlant() {
    const p = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d662e });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e5c2b, roughness: 0.6 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0x3c1248, roughness: 0.22 });

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 6), stemMat);
    stalk.position.y = 0.28;
    p.add(stalk);

    for (let a = 0; a < 4; a++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), leafMat);
        leaf.scale.set(1.4, 0.2, 0.7);
        leaf.rotation.y = (a * Math.PI) / 2;
        leaf.rotation.z = 0.28;
        leaf.position.set(Math.cos((a * Math.PI) / 2) * 0.2, 0.38, Math.sin((a * Math.PI) / 2) * 0.2);
        p.add(leaf);
    }

    const brinjal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.3, 8), fruitMat);
    brinjal.position.set(0.14, 0.22, 0.1);
    brinjal.rotation.z = -0.4;
    p.add(brinjal);

    return p;
}

function buildCabbagePlot(cx, cz, width, numRows) {
    const group = new THREE.Group();
    const cols = 14, spacing = 0.9;
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x6db359, roughness: 0.65 });

    for (let r = 0; r < numRows; r++) {
        const z = cz - ((numRows - 1) * spacing) / 2 + r * spacing;
        for (let c = 0; c < cols; c++) {
            const x = cx - width / 2 + 0.8 + c * (width / cols);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), cabMat);
            head.position.set(x, 0.45, z);
            group.add(head);
        }
    }
    cropGroup.add(group);
}

function buildTomatoPlot(cx, cz, width, numRows) {
    const group = new THREE.Group();
    const cols = 8, spacing = 1.1;
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x7a6344 });
    const redMat  = new THREE.MeshStandardMaterial({ color: 0xd92b18, roughness: 0.3 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x367329, roughness: 0.6 });

    for (let r = 0; r < numRows; r++) {
        const z = cz - ((numRows - 1) * spacing) / 2 + r * spacing;
        for (let c = 0; c < cols; c++) {
            const x = cx - width / 2 + 0.8 + c * (width / cols);
            const plant = new THREE.Group();

            // Support bamboo stake
            const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 5), poleMat);
            stake.position.y = 0.6;
            plant.add(stake);

            // Foliage
            const bush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 7), bushMat);
            bush.position.y = 0.55;
            plant.add(bush);

            // Red Tomato fruits
            for (let f = 0; f < 3; f++) {
                const tom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), redMat);
                tom.position.set((Math.random() - 0.5) * 0.3, 0.4 + f * 0.15, (Math.random() - 0.5) * 0.3);
                plant.add(tom);
            }

            plant.position.set(x, 0.35, z);
            group.add(plant);
        }
    }
    cropGroup.add(group);
    animatedObjects.push({ mesh: group, type: "crop" });
}

function buildMaizePlot(cx, cz, width, numRows) {
    const group = new THREE.Group();
    const cols = 9, spacing = 1.0;
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x47782b });
    const leafMat  = new THREE.MeshStandardMaterial({ color: 0x5a9135, side: THREE.DoubleSide });
    const cornMat  = new THREE.MeshStandardMaterial({ color: 0xf5b041, roughness: 0.4 });

    for (let r = 0; r < numRows; r++) {
        const z = cz - ((numRows - 1) * spacing) / 2 + r * spacing;
        for (let c = 0; c < cols; c++) {
            const x = cx - width / 2 + 0.8 + c * (width / cols);
            const stalk = new THREE.Group();

            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), stalkMat);
            stem.position.y = 0.8;
            stalk.add(stem);

            // Drooping leaves
            for (let l = 0; l < 4; l++) {
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.7), leafMat);
                leaf.position.set(0, 0.8 + l * 0.2, 0.3);
                leaf.rotation.x = 0.5;
                leaf.rotation.y = (l * Math.PI) / 2;
                stalk.add(leaf);
            }

            // Corn cob
            const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.3, 6), cornMat);
            cob.position.set(0.08, 0.9, 0.05);
            cob.rotation.z = -0.3;
            stalk.add(cob);

            stalk.position.set(x, 0.35, z);
            group.add(stalk);
        }
    }
    cropGroup.add(group);
    animatedObjects.push({ mesh: group, type: "crop" });
}

/*
|--------------------------------------------------------------------------
| TROPICAL TREES (PALMS, BANANAS & JACKFRUIT)
|--------------------------------------------------------------------------
*/

function buildTropicalTrees() {
    // 1. Tall Coconut Palm Trees (নারিকেল গাছ)
    const palmPositions = [[-6.0, -10.5], [-9.5, -11.5], [2.8, -10.5], [-15.5, 3.0], [16.5, 6.5]];
    palmPositions.forEach(([x, z]) => {
        const palm = createCoconutPalm();
        palm.position.set(x, 0, z);
        treeGroup.add(palm);
        animatedObjects.push({ mesh: palm, type: "tree" });
    });

    // 2. Broad-Leaved Banana Trees (কলা গাছ)
    const bananaPositions = [[-12.0, -2.5], [-4.0, -5.5], [6.0, -9.5]];
    bananaPositions.forEach(([x, z]) => {
        const banana = createBananaTree();
        banana.position.set(x, 0, z);
        treeGroup.add(banana);
        animatedObjects.push({ mesh: banana, type: "tree" });
    });

    // 3. Dense Fruit Trees (Mango & Jackfruit - আম ও কাঁঠাল গাছ)
    const fruitPositions = [[-12.5, 7.5], [-4.5, 9.2], [10.5, 8.5], [15.0, 9.8]];
    fruitPositions.forEach(([x, z], i) => {
        const tree = createCanopyTree(i % 2 === 0 ? 0x275e24 : 0x1f5421);
        tree.position.set(x, 0, z);
        treeGroup.add(tree);
        animatedObjects.push({ mesh: tree, type: "tree" });
    });
}

function createCoconutPalm() {
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5944, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 5.8, 7), trunkMat);
    trunk.position.y = 2.9;
    trunk.rotation.z = (Math.random() - 0.5) * 0.12;
    palm.add(trunk);

    const frondMat = new THREE.MeshStandardMaterial({ color: 0x387d29, side: THREE.DoubleSide });
    for (let f = 0; f < 8; f++) {
        const frondGroup = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 3.0), frondMat);
        blade.position.set(0, 5.8, 1.4);
        blade.rotation.x = 0.38;
        frondGroup.add(blade);
        frondGroup.rotation.y = (f * Math.PI * 2) / 8;
        palm.add(frondGroup);
    }
    return palm;
}

function createBananaTree() {
    const banana = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x668b3d, roughness: 0.7 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.6, 6), trunkMat);
    trunk.position.y = 1.3;
    banana.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f942d, side: THREE.DoubleSide, roughness: 0.5 });
    for (let l = 0; l < 6; l++) {
        const leafGroup = new THREE.Group();
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 2.2), leafMat);
        leaf.position.set(0, 2.6, 0.9);
        leaf.rotation.x = 0.45;
        leafGroup.add(leaf);
        leafGroup.rotation.y = (l * Math.PI * 2) / 6;
        banana.add(leafGroup);
    }
    return banana;
}

function createCanopyTree(leafColor) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 2.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4e3e2c, roughness: 0.9 })
    );
    trunk.position.y = 1.4;
    tree.add(trunk);

    const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, 9, 9),
        new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.65 })
    );
    canopy.position.y = 3.8;
    tree.add(canopy);
    return tree;
}

/*
|--------------------------------------------------------------------------
| NIGHT FIREFLIES / PARTICLES
|--------------------------------------------------------------------------
*/

function buildFireflies() {
    const count = 35;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3]     = -18 + Math.random() * 36;
        positions[i * 3 + 1] = 0.5 + Math.random() * 3.5;
        positions[i * 3 + 2] = -12 + Math.random() * 24;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0x99ff66,
        size: 0.35,
        transparent: true,
        opacity: 0
    });

    const fireflies = new THREE.Points(geom, mat);
    fireflyGroup.add(fireflies);
}

/*
|--------------------------------------------------------------------------
| ANIMATION LOOP
|--------------------------------------------------------------------------
*/

function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.015;

    // 1. Water ripple animation
    if (pondMaterial && pondMaterial.normalMap) {
        pondMaterial.normalMap.offset.x = Math.sin(animationTime * 0.3) * 0.04;
        pondMaterial.normalMap.offset.y = animationTime * 0.035;
    }

    // 2. Wind wave animation on crops and trees
    animatedObjects.forEach((obj, i) => {
        const offset = i * 0.35;
        if (obj.type === "crop" || obj.type === "paddy") {
            obj.mesh.rotation.z = Math.sin(animationTime * 1.9 + offset) * 0.012;
        } else if (obj.type === "tree") {
            obj.mesh.rotation.z = Math.sin(animationTime * 1.1 + offset) * 0.008;
        }
    });

    // 3. Clouds drift gently
    cloudGroup.children.forEach(c => {
        c.position.x += 0.012;
        if (c.position.x > 50) c.position.x = -50;
    });

    // 4. Night fireflies twinkle
    if (currentLightingMode === 2 && fireflyGroup.children.length > 0) {
        const pts = fireflyGroup.children[0];
        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
            pos[i * 3 + 1] += Math.sin(animationTime * 2 + i) * 0.006;
        }
        pts.geometry.attributes.position.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
}

/*
|--------------------------------------------------------------------------
| CAMERA & LIGHTING CONTROLS
|--------------------------------------------------------------------------
*/

function setupInteractiveCameraAndLights() {
    // 🚁 Drone Overview
    const droneBtn = document.getElementById("hudResetView");
    if (droneBtn) {
        droneBtn.addEventListener("click", () => {
            camera.position.set(0, 20, 32);
            controls.target.set(0, 1.2, 0);
            controls.update();
        });
    }

    // 🚜 Ground-Level Field View
    const fieldBtn = document.getElementById("hudFieldView");
    if (fieldBtn) {
        fieldBtn.addEventListener("click", () => {
            camera.position.set(-6, 2.8, 12);
            controls.target.set(0, 1.5, 4);
            controls.update();
        });
    }

    // ☀️ / 🌅 / 🌙 Lighting Cycle
    const sunBtn = document.getElementById("hudToggleSun");
    if (sunBtn) {
        sunBtn.addEventListener("click", () => {
            currentLightingMode = (currentLightingMode + 1) % 3;
            applyLightingMode(currentLightingMode);
        });
    }
}

function applyLightingMode(mode) {
    const sunBtn = document.getElementById("hudToggleSun");
    const isBn = (window.currentAppLanguage === "bn");

    if (mode === 0) {
        // DAY
        scene.background.set(0xa5d6e7);
        scene.fog.color.set(0xcde6df);
        sunLight.color.set(0xfffae6);
        sunLight.intensity = 2.8;
        hemiLight.intensity = 1.4;
        moonLight.intensity = 0;
        if (fireflyGroup.children[0]) fireflyGroup.children[0].material.opacity = 0;

        if (sunBtn) sunBtn.textContent = isBn ? "☀️ দিন" : "☀️ Day";
    } else if (mode === 1) {
        // SUNSET / GOLDEN HOUR
        scene.background.set(0xe28154);
        scene.fog.color.set(0xd8764a);
        sunLight.color.set(0xff7733);
        sunLight.intensity = 1.9;
        hemiLight.intensity = 0.85;
        moonLight.intensity = 0;
        if (fireflyGroup.children[0]) fireflyGroup.children[0].material.opacity = 0.3;

        if (sunBtn) sunBtn.textContent = isBn ? "🌅 গোধূলি" : "🌅 Sunset";
    } else {
        // NIGHT
        scene.background.set(0x0a1626);
        scene.fog.color.set(0x0c1b2c);
        sunLight.intensity = 0;
        hemiLight.intensity = 0.25;
        moonLight.intensity = 1.6;
        if (fireflyGroup.children[0]) fireflyGroup.children[0].material.opacity = 0.9;

        if (sunBtn) sunBtn.textContent = isBn ? "🌙 রাত" : "🌙 Night";
    }
}

/*
|--------------------------------------------------------------------------
| BILINGUAL DASHBOARD UI UPDATE
|--------------------------------------------------------------------------
*/

export function updateDashboardUI() {
    if (typeof farmData === "undefined") return;

    const soil = farmData.soil || {};
    const weather = farmData.weather || {};
    const isBn = (window.currentAppLanguage === "bn");

    setVal("hudNitrogenVal", `${soil.nitrogen ?? 64}%`);
    setVal("hudPhosphorusVal", `${soil.phosphorus ?? 52}%`);
    setVal("hudPotassiumVal", `${soil.potassium ?? 48}%`);
    setVal("hudMoistureVal", `${soil.moisture ?? 68}%`);
    setVal("hudPHVal", soil.ph ?? 6.5);
    setVal("hudTempVal", isBn ? `${weather.temperature ?? 24}°সে.` : `${weather.temperature ?? 24}°C`);

    setBarWidth("hudNitrogenBar", `${soil.nitrogen ?? 64}%`);
    setBarWidth("hudPhosphorusBar", `${soil.phosphorus ?? 52}%`);
    setBarWidth("hudPotassiumBar", `${soil.potassium ?? 48}%`);

    setVal("hudWindSpeed", isBn ? `${weather.windSpeed ?? 31} কিমি/ঘণ্টা` : `${weather.windSpeed ?? 31} km/h`);
    setVal("hudHumidity", isBn ? `${weather.humidity ?? 88}% আর্দ্রতা` : `${weather.humidity ?? 88}% Humidity`);

    // Synchronize Sun toggle button label
    applyLightingMode(currentLightingMode);
}

function setVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setBarWidth(id, width) {
    const el = document.getElementById(id);
    if (el) el.style.width = width;
}

window.updateSimulationFromFarmData = updateDashboardUI;

function onWindowResize() {
    const container = document.getElementById("farm3D");
    if (!container || !renderer || !camera) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

document.addEventListener("DOMContentLoaded", () => {
    initializeFarmSimulation();
});
