/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — PHOTOREALISTIC 3D & SPATIAL AR CROP ENGINE
|--------------------------------------------------------------------------
| - Hyper-Detailed PBR Botanical Generator (Plump Oblate Tomatoes with
|   5-Pointed Calyx Stars, Bamboo Support Stakes, Curved Vines & Serrated Leaves)
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
import { sketchfabService, CURATED_SKETCHFAB_MODELS } from "./sketchfabService.js";

// =============================================================================
// GLOBAL SIMULATION STATE & CONFIGURATION
// =============================================================================

let scene, camera, renderer, controls;
let containerEl, canvasEl;
let sky = null, sun = null;
let sunLight = null, hemiLight = null, ambientLight = null;
let terrainMesh = null, waterMesh = null, grassTuftsMesh = null;

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

function updateFieldGridDimensions() {
    const mobile = isMobileDevice();
    ROWS = mobile ? 8 : 16;
    COLS = mobile ? 8 : 16;
    TOTAL_PLANTS = ROWS * COLS;
    ROW_SPACING = mobile ? 1.05 : 0.88;
    PLANT_SPACING = mobile ? 1.05 : 0.88;
}

let instanceData = [];
let stemInstancedMesh = null;
let leafInstancedMesh = null;
let fruitInstancedMesh = null;
let calyxInstancedMesh = null;
let stakeInstancedMesh = null;
let flowerInstancedMesh = null;
let currentCropGroup = null;

// Materials Cache for dynamic color/health updates
let currentStemMat = null;
let currentLeafMat = null;
let currentFruitMat = null;
let currentCalyxMat = null;
let currentStakeMat = null;
let currentFlowerMat = null;
let soilMaterial = null;

// Raycasting & Plot Inspection
let raycaster = null;
let mouse = new THREE.Vector2();

// Crop Lifecycle & Growth State
let activeCropId = "tomato"; // Default to photorealistic Tomato
let currentGrowthDay = 48;
let maxCropDays = 105;
let currentGrowthStage = 3; // 1 to 5
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

// Camera Transition State
let currentCameraMode = "field"; // 'drone' | 'field' | 'root' | 'macro'
let isMacroViewActive = false;
let targetCameraPos = new THREE.Vector3(0, 0.90, 5.2);
let targetLookAt = new THREE.Vector3(0, 0.65, 0);
let isTransitioningCamera = false;

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
// 1. PROCEDURAL PBR TEXTURES (CANVAS-BASED HIGH RESOLUTION)
// =============================================================================
function initProceduralTextures() {
    // A. Monocot Leaf Texture (Rice, Wheat, Maize)
    const monoCanvas = document.createElement("canvas");
    monoCanvas.width = 512;
    monoCanvas.height = 512;
    const mCtx = monoCanvas.getContext("2d");

    const mGrad = mCtx.createLinearGradient(0, 512, 0, 0);
    mGrad.addColorStop(0.00, "#18421c");
    mGrad.addColorStop(0.40, "#256f2d");
    mGrad.addColorStop(0.75, "#3ba83e");
    mGrad.addColorStop(0.95, "#6ebe48");
    mGrad.addColorStop(1.00, "#b0c946");
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, 512, 512);

    mCtx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    mCtx.lineWidth = 1.0;
    for (let x = 6; x < 512; x += 5) {
        mCtx.beginPath();
        mCtx.moveTo(x, 0);
        mCtx.lineTo(x, 512);
        mCtx.stroke();
    }
    mCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    mCtx.lineWidth = 3.5;
    mCtx.beginPath();
    mCtx.moveTo(256, 0);
    mCtx.lineTo(256, 512);
    mCtx.stroke();

    monocotTexture = new THREE.CanvasTexture(monoCanvas);
    monocotTexture.wrapS = THREE.RepeatWrapping;
    monocotTexture.wrapT = THREE.RepeatWrapping;

    // B. Dicot Leaf Texture (Compound Serrated Tomato & Vegetables)
    const dicotCanvas = document.createElement("canvas");
    dicotCanvas.width = 512;
    dicotCanvas.height = 512;
    const dCtx = dicotCanvas.getContext("2d");

    const dGrad = dCtx.createRadialGradient(256, 256, 30, 256, 256, 290);
    dGrad.addColorStop(0.0, "#3e8a32");
    dGrad.addColorStop(0.65, "#2a6723");
    dGrad.addColorStop(1.0, "#194215");
    dCtx.fillStyle = dGrad;
    dCtx.fillRect(0, 0, 512, 512);

    // Primary central midrib
    dCtx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    dCtx.lineWidth = 5.0;
    dCtx.beginPath();
    dCtx.moveTo(256, 512);
    dCtx.quadraticCurveTo(256, 256, 256, 20);
    dCtx.stroke();

    // Lateral pinnate secondary veins
    dCtx.lineWidth = 2.0;
    dCtx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    for (let y = 80; y < 490; y += 40) {
        dCtx.beginPath();
        dCtx.moveTo(256, y);
        dCtx.quadraticCurveTo(345, y - 22, 490, y - 58);
        dCtx.stroke();
        dCtx.beginPath();
        dCtx.moveTo(256, y);
        dCtx.quadraticCurveTo(167, y - 22, 22, y - 58);
        dCtx.stroke();
    }

    dicotTexture = new THREE.CanvasTexture(dicotCanvas);

    // C. PBR Soil Furrow Bump Texture
    const soilCanvas = document.createElement("canvas");
    soilCanvas.width = 512;
    soilCanvas.height = 512;
    const sCtx = soilCanvas.getContext("2d");
    sCtx.fillStyle = "#2c1a0e";
    sCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
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

// =============================================================================
// 2. GEOMETRY MERGING UTILITY
// =============================================================================
function mergeBufferGeometries(geometries) {
    if (!geometries || geometries.length === 0) return new THREE.BufferGeometry();
    let totalPositions = 0;
    let totalNormals = 0;
    let totalUvs = 0;
    let totalIndices = 0;

    for (const g of geometries) {
        if (!g.attributes.position) continue;
        totalPositions += g.attributes.position.array.length;
        if (g.attributes.normal) totalNormals += g.attributes.normal.array.length;
        if (g.attributes.uv) totalUvs += g.attributes.uv.array.length;
        if (g.index) totalIndices += g.index.array.length;
    }

    const mergedPos = new Float32Array(totalPositions);
    const mergedNorm = totalNormals > 0 ? new Float32Array(totalNormals) : null;
    const mergedUv = totalUvs > 0 ? new Float32Array(totalUvs) : null;
    const mergedIndex = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

    let posOffset = 0;
    let normOffset = 0;
    let uvOffset = 0;
    let indexOffset = 0;
    let vertexCountOffset = 0;

    for (const g of geometries) {
        if (!g.attributes.position) continue;
        const pos = g.attributes.position.array;
        mergedPos.set(pos, posOffset);
        posOffset += pos.length;

        if (mergedNorm && g.attributes.normal) {
            mergedNorm.set(g.attributes.normal.array, normOffset);
            normOffset += g.attributes.normal.array.length;
        }

        if (mergedUv && g.attributes.uv) {
            mergedUv.set(g.attributes.uv.array, uvOffset);
            uvOffset += g.attributes.uv.array.length;
        }

        if (mergedIndex && g.index) {
            const idx = g.index.array;
            for (let i = 0; i < idx.length; i++) {
                mergedIndex[indexOffset + i] = idx[i] + vertexCountOffset;
            }
            indexOffset += idx.length;
        }
        vertexCountOffset += g.attributes.position.count;
    }

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
    if (mergedNorm) mergedGeo.setAttribute("normal", new THREE.BufferAttribute(mergedNorm, 3));
    if (mergedUv) mergedGeo.setAttribute("uv", new THREE.BufferAttribute(mergedUv, 2));
    if (mergedIndex) mergedGeo.setIndex(new THREE.BufferAttribute(mergedIndex, 1));
    else mergedGeo.computeVertexNormals();

    return mergedGeo;
}

// =============================================================================
// 3. BOTANICAL PROCEDURAL GENERATORS (RIBBONS, CATENARY LEAFLETS, CALYCES)
// =============================================================================
function createCurvedBladeGeometry(length, baseWidth, midWidth, archX, archY, segments = 18) {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = Math.sin(t * Math.PI * 0.5) * length;
        const z = -Math.pow(t, 2.0) * archY;
        const xOffset = Math.sin(t * Math.PI) * archX;

        let w;
        if (t < 0.22) w = THREE.MathUtils.lerp(baseWidth, midWidth, t / 0.22);
        else w = THREE.MathUtils.lerp(midWidth, 0.002, (t - 0.22) / 0.78);

        vertices.push(xOffset - w, y, z);
        vertices.push(xOffset + w, y, z);
        normals.push(0, 1, 0, 0, 1, 0);
        uvs.push(0, t, 1, t);

        if (i < segments) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/**
 * 5-Pointed Green Calyx Star (Sepals) on top of each tomato
 */
function create5PointedCalyxGeometry(radius = 0.045) {
    const sepals = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const s = createCurvedBladeGeometry(radius, 0.006, 0.012, 0.003, 0.008, 8);
        s.rotateX(Math.PI * 0.5);
        s.rotateZ(angle);
        sepals.push(s);
    }
    return mergeBufferGeometries(sepals);
}

/**
 * Yellow 5-Petal Star Tomato Flower
 */
function createTomatoBlossomGeometry() {
    const petals = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const p = createCurvedBladeGeometry(0.024, 0.004, 0.008, 0.002, 0.006, 6);
        p.rotateX(Math.PI * 0.5);
        p.rotateZ(angle);
        petals.push(p);
    }
    // Center yellow stamen cone
    const cone = new THREE.ConeGeometry(0.005, 0.016, 6);
    cone.rotateX(-Math.PI * 0.5);
    petals.push(cone);
    return mergeBufferGeometries(petals);
}

/**
 * Compound Serrated Tomato Leaf
 */
function createCompoundTomatoLeafGeometry(length = 0.45, spread = 0.22) {
    const parts = [];
    const rachis = new THREE.CylinderGeometry(0.004, 0.009, length, 5);
    rachis.translate(0, length * 0.5, 0);
    parts.push(rachis);

    const leafletPairs = 3;
    for (let i = 0; i < leafletPairs; i++) {
        const t = (i + 1) / (leafletPairs + 1);
        const yPos = t * length;
        const size = THREE.MathUtils.lerp(0.18, 0.26, t);

        const leftLeaflet = createCurvedBladeGeometry(size, 0.012, spread * 0.35, 0.03, 0.04, 12);
        leftLeaflet.rotateZ(0.65);
        leftLeaflet.translate(-0.015, yPos, 0);
        parts.push(leftLeaflet);

        const rightLeaflet = createCurvedBladeGeometry(size, 0.012, spread * 0.35, -0.03, 0.04, 12);
        rightLeaflet.rotateZ(-0.65);
        rightLeaflet.translate(0.015, yPos, 0);
        parts.push(rightLeaflet);
    }

    const terminalLeaflet = createCurvedBladeGeometry(0.24, 0.012, spread * 0.38, 0, 0.05, 12);
    terminalLeaflet.translate(0, length, 0);
    parts.push(terminalLeaflet);

    return mergeBufferGeometries(parts);
}

// =============================================================================
// 4. HYPER-DETAILED PHOTOREALISTIC PBR CROP FIELD BUILDER
// =============================================================================
export function createCropField(cropId = "tomato") {
    updateFieldGridDimensions();
    if (currentCropGroup) {
        scene.remove(currentCropGroup);
        currentCropGroup = null;
    }

    currentCropGroup = new THREE.Group();
    currentCropGroup.name = `CropField_${cropId}`;
    activeCropId = cropId;

    // Retrieve crop metadata from crops database
    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropId) : null;
    maxCropDays = dbCrop ? dbCrop.total_duration_days : 105;

    let stemGeom = null, stemMat = null;
    let leafGeom = null, leafMat = null;
    let fruitGeom = null, fruitMat = null;
    let calyxGeom = null, calyxMat = null;
    let stakeGeom = null, stakeMat = null;
    let flowerGeom = null, flowerMat = null;

    const baseChlorophyll = getHealthColor(cropHealthState);

    switch (cropId) {
        case "tomato": {
            // 1. Weathered Bamboo Stake
            const stakeParts = [];
            const stakePole = new THREE.CylinderGeometry(0.015, 0.018, 1.25, 7);
            stakePole.translate(-0.04, 0.62, -0.03);
            stakeParts.push(stakePole);

            // Bamboo tie cords tying stem to stake
            const tie1 = new THREE.TorusGeometry(0.024, 0.003, 4, 10);
            tie1.rotateX(Math.PI * 0.5);
            tie1.translate(-0.02, 0.38, -0.015);
            stakeParts.push(tie1);

            const tie2 = new THREE.TorusGeometry(0.024, 0.003, 4, 10);
            tie2.rotateX(Math.PI * 0.5);
            tie2.translate(-0.01, 0.76, -0.01);
            stakeParts.push(tie2);

            stakeGeom = mergeBufferGeometries(stakeParts);
            stakeMat = new THREE.MeshStandardMaterial({
                color: 0x8a633a,
                roughness: 0.85,
                metalness: 0.05
            });

            // 2. Climbing Curved Main Vine
            const vineCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.02, 0.22, 0.01),
                new THREE.Vector3(-0.02, 0.48, 0.02),
                new THREE.Vector3(0.01, 0.74, -0.01),
                new THREE.Vector3(0.03, 1.05, 0.01)
            ]);
            stemGeom = new THREE.TubeGeometry(vineCurve, 20, 0.015, 7, false);
            stemMat = new THREE.MeshStandardMaterial({
                color: baseChlorophyll,
                roughness: 0.65,
                metalness: 0.05
            });

            // 3. Compound Serrated Foliage
            const leaves = [];
            for (let i = 0; i < 7; i++) {
                const angle = (i * 137.5) * (Math.PI / 180);
                const l = createCompoundTomatoLeafGeometry(0.42, 0.22);
                l.rotateX(0.45);
                l.rotateY(angle);
                l.translate(0, 0.25 + i * 0.11, 0);
                leaves.push(l);
            }
            leafGeom = mergeBufferGeometries(leaves);
            leafMat = new THREE.MeshPhysicalMaterial({
                map: dicotTexture,
                color: baseChlorophyll,
                roughness: 0.35,
                clearcoat: 0.28,
                clearcoatRoughness: 0.22,
                side: THREE.DoubleSide
            });

            // 4. Glossy Oblate Spheroid Tomatoes with 5-Pointed Calyx Stars
            const fruits = [];
            const calyces = [];
            const clusters = [
                { y: 0.36, count: 4, radius: 0.062 },
                { y: 0.56, count: 4, radius: 0.056 },
                { y: 0.74, count: 3, radius: 0.048 }
            ];

            clusters.forEach((c, cIdx) => {
                for (let i = 0; i < c.count; i++) {
                    const ang = (i / c.count) * Math.PI * 1.5 + (cIdx * 1.1);
                    const dist = 0.12 + Math.random() * 0.04;
                    const fx = Math.cos(ang) * dist;
                    const fz = Math.sin(ang) * dist;
                    const fy = c.y + (Math.random() - 0.5) * 0.05;

                    // Oblate Spheroid Fruit
                    const fg = new THREE.SphereGeometry(c.radius, 14, 12);
                    fg.scale(1.08, 0.92, 1.08); // Oblate shape
                    fg.translate(fx, fy, fz);
                    fruits.push(fg);

                    // 5-Pointed Calyx Star
                    const cg = create5PointedCalyxGeometry(c.radius * 0.65);
                    cg.translate(fx, fy + c.radius * 0.90, fz);
                    calyces.push(cg);
                }
            });

            fruitGeom = mergeBufferGeometries(fruits);
            // High-End Clearcoat Physical Material for Photorealistic Tomatoes
            fruitMat = new THREE.MeshPhysicalMaterial({
                color: getTomatoRipeningColor(currentGrowthDay, maxCropDays),
                roughness: 0.15,
                clearcoat: 0.85,
                clearcoatRoughness: 0.12,
                metalness: 0.02,
                transmission: 0.03
            });

            calyxGeom = mergeBufferGeometries(calyces);
            calyxMat = new THREE.MeshStandardMaterial({
                color: 0x2e6f28,
                roughness: 0.6,
                side: THREE.DoubleSide
            });

            // 5. Yellow Star Flowers (Stage 3)
            const blossoms = [];
            for (let i = 0; i < 4; i++) {
                const b = createTomatoBlossomGeometry();
                b.translate(0.12 * Math.cos(i * 1.8), 0.78 + i * 0.05, 0.12 * Math.sin(i * 1.8));
                blossoms.push(b);
            }
            flowerGeom = mergeBufferGeometries(blossoms);
            flowerMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.35,
                emissive: 0x332600
            });
            break;
        }

        case "rice": {
            const stems = [];
            for (let i = 0; i < 10; i++) {
                const s = new THREE.CylinderGeometry(0.007, 0.016, 0.95, 5);
                s.rotateZ((i - 4.5) * 0.05);
                s.translate((i - 4.5) * 0.02, 0.47, 0);
                stems.push(s);
            }
            stemGeom = mergeBufferGeometries(stems);
            stemMat = new THREE.MeshStandardMaterial({ color: baseChlorophyll, roughness: 0.65 });

            const leaves = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const b = createCurvedBladeGeometry(0.85, 0.022, 0.042, 0.08, 0.26, 20);
                b.rotateY(angle);
                b.translate(0, 0.18 + (i % 4) * 0.08, 0);
                leaves.push(b);
            }
            leafGeom = mergeBufferGeometries(leaves);
            leafMat = new THREE.MeshPhysicalMaterial({
                map: monocotTexture,
                color: baseChlorophyll,
                roughness: 0.42,
                clearcoat: 0.2,
                side: THREE.DoubleSide
            });

            // Drooping golden panicles
            const panicles = [];
            for (let i = 0; i < 8; i++) {
                const p = createCurvedBladeGeometry(0.35, 0.018, 0.038, 0.06, 0.18, 14);
                p.rotateY((i / 8) * Math.PI * 2);
                p.translate(0, 0.88, 0);
                panicles.push(p);
            }
            fruitGeom = mergeBufferGeometries(panicles);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4b238, roughness: 0.38 });
            break;
        }

        default: {
            // General Botanical Architecture (Wheat, Corn, Potato, Chili)
            const stems = [];
            const leaves = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const s = new THREE.CylinderGeometry(0.015, 0.028, 0.65, 5);
                s.rotateZ(0.2);
                s.rotateY(angle);
                s.translate(0, 0.32, 0);
                stems.push(s);

                const l = createCompoundTomatoLeafGeometry(0.38, 0.18);
                l.rotateZ(0.3);
                l.rotateY(angle);
                l.translate(0, 0.28, 0);
                leaves.push(l);
            }
            stemGeom = mergeBufferGeometries(stems);
            stemMat = new THREE.MeshStandardMaterial({ color: baseChlorophyll, roughness: 0.65 });
            leafGeom = mergeBufferGeometries(leaves);
            leafMat = new THREE.MeshPhysicalMaterial({
                map: dicotTexture,
                color: baseChlorophyll,
                roughness: 0.45,
                side: THREE.DoubleSide
            });

            fruitGeom = new THREE.SphereGeometry(0.05, 10, 10);
            fruitGeom.translate(0, 0.65, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 });
            break;
        }
    }

    currentStemMat = stemMat;
    currentLeafMat = leafMat;
    currentFruitMat = fruitMat;
    currentCalyxMat = calyxMat;
    currentStakeMat = stakeMat;
    currentFlowerMat = flowerMat;

    // Inject GPU wind shader movement
    injectWindShader(stemMat);
    injectWindShader(leafMat);

    // Instanced Rendering for 60 FPS Field
    stemInstancedMesh = new THREE.InstancedMesh(stemGeom, stemMat, TOTAL_PLANTS);
    stemInstancedMesh.castShadow = true;
    stemInstancedMesh.receiveShadow = true;

    leafInstancedMesh = new THREE.InstancedMesh(leafGeom, leafMat, TOTAL_PLANTS);
    leafInstancedMesh.castShadow = true;
    leafInstancedMesh.receiveShadow = true;

    if (fruitGeom) {
        fruitInstancedMesh = new THREE.InstancedMesh(fruitGeom, fruitMat, TOTAL_PLANTS);
        fruitInstancedMesh.castShadow = true;
    }
    if (calyxGeom && calyxMat) {
        calyxInstancedMesh = new THREE.InstancedMesh(calyxGeom, calyxMat, TOTAL_PLANTS);
        calyxInstancedMesh.castShadow = true;
    }
    if (stakeGeom && stakeMat) {
        stakeInstancedMesh = new THREE.InstancedMesh(stakeGeom, stakeMat, TOTAL_PLANTS);
        stakeInstancedMesh.castShadow = true;
    }
    if (flowerGeom && flowerMat) {
        flowerInstancedMesh = new THREE.InstancedMesh(flowerGeom, flowerMat, TOTAL_PLANTS);
    }

    instanceData = [];
    let idx = 0;
    const furrowFreq = Math.PI / ROW_SPACING;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = (c - (COLS - 1) * 0.5) * ROW_SPACING;
            const z = (r - (ROWS - 1) * 0.5) * PLANT_SPACING;

            const y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.19;
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
            if (stakeInstancedMesh) stakeInstancedMesh.setMatrixAt(idx, dummy.matrix);
            if (flowerInstancedMesh) flowerInstancedMesh.setMatrixAt(idx, dummy.matrix);

            idx++;
        }
    }

    stemInstancedMesh.instanceMatrix.needsUpdate = true;
    leafInstancedMesh.instanceMatrix.needsUpdate = true;
    if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
    if (calyxInstancedMesh) calyxInstancedMesh.instanceMatrix.needsUpdate = true;
    if (stakeInstancedMesh) stakeInstancedMesh.instanceMatrix.needsUpdate = true;
    if (flowerInstancedMesh) flowerInstancedMesh.instanceMatrix.needsUpdate = true;

    currentCropGroup.add(stemInstancedMesh);
    currentCropGroup.add(leafInstancedMesh);
    if (fruitInstancedMesh) currentCropGroup.add(fruitInstancedMesh);
    if (calyxInstancedMesh) currentCropGroup.add(calyxInstancedMesh);
    if (stakeInstancedMesh) currentCropGroup.add(stakeInstancedMesh);
    if (flowerInstancedMesh) currentCropGroup.add(flowerInstancedMesh);

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

            // Bamboo stake remains full height
            if (stakeInstancedMesh) {
                dummy.scale.set(d.scale, d.scale, d.scale);
                dummy.updateMatrix();
                stakeInstancedMesh.setMatrixAt(i, dummy.matrix);
            }

            // Fruit & Calyx Growth
            if (fruitInstancedMesh) {
                if (currentGrowthStage < 3) {
                    dummy.scale.set(0.001, 0.001, 0.001); // Fruit hidden at early stages
                } else {
                    const fruitScale = currentGrowthStage === 3 ? s * 0.45 : (currentGrowthStage === 4 ? s * 0.85 : s);
                    dummy.scale.set(fruitScale, fruitScale, fruitScale);
                }
                dummy.updateMatrix();
                fruitInstancedMesh.setMatrixAt(i, dummy.matrix);
                if (calyxInstancedMesh) calyxInstancedMesh.setMatrixAt(i, dummy.matrix);
            }

            // Flower blossoms visible at Stage 3
            if (flowerInstancedMesh) {
                if (currentGrowthStage === 3) {
                    dummy.scale.set(s, s, s);
                } else {
                    dummy.scale.set(0.001, 0.001, 0.001);
                }
                dummy.updateMatrix();
                flowerInstancedMesh.setMatrixAt(i, dummy.matrix);
            }
        }

        stemInstancedMesh.instanceMatrix.needsUpdate = true;
        leafInstancedMesh.instanceMatrix.needsUpdate = true;
        if (fruitInstancedMesh) fruitInstancedMesh.instanceMatrix.needsUpdate = true;
        if (calyxInstancedMesh) calyxInstancedMesh.instanceMatrix.needsUpdate = true;
        if (stakeInstancedMesh) stakeInstancedMesh.instanceMatrix.needsUpdate = true;
        if (flowerInstancedMesh) flowerInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Dynamic Fruit Ripening Color
    if (currentFruitMat && activeCropId === "tomato") {
        currentFruitMat.color.copy(getTomatoRipeningColor(currentGrowthDay, maxCropDays));
        currentFruitMat.needsUpdate = true;
    }

    updateTimelineUI();
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
            float gust = sin(uTime * 2.5 + transformed.x * 1.7 + transformed.z * 1.3) * 0.052 * hFactor * uWindStrength;
            float swayZ = cos(uTime * 1.9 + transformed.z * 2.1) * 0.035 * hFactor * uWindStrength;
            transformed.x += gust;
            transformed.z += swayZ;
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
    const colRidge = new THREE.Color(0x3d2716);
    const colTrench = new THREE.Color(0x1a0f07);
    const colBund = new THREE.Color(0x4a321e);

    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.20;
        y += Math.sin(x * 16.0) * Math.cos(z * 12.0) * 0.018;

        const dist = Math.max(Math.abs(x), Math.abs(z));
        if (dist > 5.8) {
            const bundFactor = Math.min((dist - 5.8) / 1.6, 1.0);
            y += Math.sin(bundFactor * Math.PI * 0.5) * 0.38;
        }

        posAttr.setY(i, y);

        const tempCol = new THREE.Color();
        if (dist > 5.8) {
            tempCol.lerpColors(colRidge, colBund, 0.75);
        } else {
            const factor = (y + 0.02) / 0.22;
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
        roughness: 0.82,
        metalness: 0.05
    });

    terrainMesh = new THREE.Mesh(geometry, soilMaterial);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

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

    updateHUDStatusCards();
}
window.setWeatherMode = setWeatherMode;

// =============================================================================
// 9. PHOTOREALISTIC LIGHTING & SKY (RICH CONTRAST, ZERO WASHOUT)
// =============================================================================
function initEnvironmentLighting() {
    ambientLight = new THREE.AmbientLight(0xd4e9d7, 0.7);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0x7bc676, 0x2d1e12, 0.85);
    scene.add(hemiLight);

    const mobile = isMobileDevice();
    sunLight = new THREE.DirectionalLight(0xfff8e8, 3.2);
    sunLight.position.set(6, 14, 6);
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
    scene.add(sky);

    sun = new THREE.Vector3();

    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = 4.0;
    skyUniforms["rayleigh"].value = 1.8;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.85;

    // Rich dark emerald atmospheric fog
    scene.fog = new THREE.FogExp2(0x11271d, 0.015);

    updateSkyTimeOfDay(45);
}

export function updateSkyTimeOfDay(sliderVal) {
    const t = sliderVal / 100.0;
    const phi = THREE.MathUtils.lerp(88.0, 15.0, Math.sin(t * Math.PI)) * (Math.PI / 180.0);
    const theta = (t * 2.0 - 1.0) * Math.PI * 0.75;

    sun.setFromSphericalCoords(1, phi, theta);
    if (sky) sky.material.uniforms["sunPosition"].value.copy(sun);

    if (sunLight) {
        sunLight.position.set(sun.x * 15, Math.max(sun.y * 15, 0.5), sun.z * 15);

        if (t < 0.25) {
            sunLight.color.setHex(0xffaa6e);
            sunLight.intensity = 1.8;
            if (scene.fog) scene.fog.color.setHex(0x52362b);
        } else if (t < 0.75) {
            sunLight.color.setHex(0xfffaed);
            sunLight.intensity = 3.2;
            if (scene.fog) scene.fog.color.setHex(0x11271d);
        } else if (t < 0.90) {
            sunLight.color.setHex(0xff8c42);
            sunLight.intensity = 2.4;
            if (scene.fog) scene.fog.color.setHex(0x542b1a);
        } else {
            sunLight.color.setHex(0x60a5fa);
            sunLight.intensity = 0.8;
            if (scene.fog) scene.fog.color.setHex(0x0a141e);
        }
    }

    const label = document.getElementById("timeOfDayLabel");
    if (label) {
        const isBn = (window.currentAppLanguage === "bn");
        if (t < 0.25) label.textContent = isBn ? "ভোর (Dawn)" : "Dawn";
        else if (t < 0.40) label.textContent = isBn ? "সকাল (Morning)" : "Morning";
        else if (t < 0.65) label.textContent = isBn ? "দুপুর (Noon)" : "Noon";
        else if (t < 0.85) label.textContent = isBn ? "বিকাল / সন্ধ্যা (Sunset)" : "Sunset";
        else label.textContent = isBn ? "রাত (Night)" : "Night";
    }
}
window.updateSkyTimeOfDay = updateSkyTimeOfDay;

// =============================================================================
// 10. TRUE SPATIAL AR ANCHORS & 3D MACRO INSPECTION MODE
// =============================================================================
function updateSpatialArAnchors() {
    if (!containerEl || !camera) return;

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || 640;

    SPATIAL_ANCHORS.forEach((anchor) => {
        const el = document.getElementById(anchor.id);
        if (!el) return;

        const tempV = anchor.worldPos.clone().project(camera);

        // Check if anchor is in front of camera
        if (tempV.z < 1.0 && tempV.x >= -1.1 && tempV.x <= 1.1 && tempV.y >= -1.1 && tempV.y <= 1.1) {
            const screenX = (tempV.x * 0.5 + 0.5) * width;
            const screenY = (-tempV.y * 0.5 + 0.5) * height;

            el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
            el.style.display = "flex";
        } else {
            el.style.display = "none";
        }
    });

    // Update Macro Holographic Ring position if active
    if (isMacroViewActive) {
        const ringEl = document.getElementById("arMacroInspectionRing");
        if (ringEl) {
            const heroWorldPos = new THREE.Vector3(0.0, 0.45, 0.0);
            const tempV = heroWorldPos.project(camera);

            if (tempV.z < 1.0) {
                const screenX = (tempV.x * 0.5 + 0.5) * width;
                const screenY = (-tempV.y * 0.5 + 0.5) * height;
                ringEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
                ringEl.style.display = "flex";
            }
        }
    }
}

/**
 * Toggle 3D Crop Macro View / AR X-Ray Mode
 */
export function toggleMacroView(activate = true) {
    isMacroViewActive = activate;
    const ringEl = document.getElementById("arMacroInspectionRing");

    if (isMacroViewActive) {
        targetCameraPos.set(0.10, 0.42, 1.15);
        targetLookAt.set(0.0, 0.38, 0.0);
        isTransitioningCamera = true;
        currentCameraMode = "macro";
        if (ringEl) ringEl.style.display = "flex";
        openFarmerActionCard(activeCropId);
    } else {
        targetCameraPos.set(0, 0.90, 5.2);
        targetLookAt.set(0, 0.65, 0);
        isTransitioningCamera = true;
        currentCameraMode = "field";
        if (ringEl) ringEl.style.display = "none";
    }
}
window.toggleMacroView = toggleMacroView;

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

            targetCameraPos.set(hitPoint.x + 0.2, Math.max(hitPoint.y + 0.45, 0.55), hitPoint.z + 1.25);
            targetLookAt.set(hitPoint.x, hitPoint.y + 0.35, hitPoint.z);
            isTransitioningCamera = true;

            toggleMacroView(true);
            openFarmerActionCard(activeCropId);
        }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown, { passive: true });
    renderer.domElement.addEventListener("pointerup", onPointerUp);
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
// 12. 1-CLICK TACTILE ACTION HANDLERS (IRRIGATE, FERTILIZE, SPRAY)
// =============================================================================
export function executeActionIrrigate() {
    isSprinklerActive = true;
    if (sprinklerWaterParticles) sprinklerWaterParticles.visible = true;
    updateSoilMoisture(82);

    if (cropHealthState === "deficiency") {
        setCropHealthState("healthy");
    }

    const btn = document.getElementById("btnActIrrigate");
    if (btn) {
        btn.classList.add("active-pulse");
        setTimeout(() => btn.classList.remove("active-pulse"), 1200);
    }
}
window.executeActionIrrigate = executeActionIrrigate;

export function executeActionFertilize() {
    npkLevelPercent = 92;
    if (cropHealthState === "deficiency") {
        setCropHealthState("healthy");
    }

    if (fertilizerGlowParticles) {
        fertilizerGlowParticles.visible = true;
        setTimeout(() => { if (fertilizerGlowParticles) fertilizerGlowParticles.visible = false; }, 3500);
    }

    const btn = document.getElementById("btnActFertilize");
    if (btn) {
        btn.classList.add("active-pulse");
        setTimeout(() => btn.classList.remove("active-pulse"), 1200);
    }

    updateHUDStatusCards();
}
window.executeActionFertilize = executeActionFertilize;

export function executeActionSpray() {
    pestRiskLevel = "low";
    setCropHealthState("healthy");

    if (sprayMistParticles) {
        sprayMistParticles.visible = true;
        setTimeout(() => { if (sprayMistParticles) sprayMistParticles.visible = false; }, 3500);
    }

    const btn = document.getElementById("btnActSpray");
    if (btn) {
        btn.classList.add("active-pulse");
        setTimeout(() => btn.classList.remove("active-pulse"), 1200);
    }

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
// 13. LEFT HUD DOCK (TELEMETRY RAIL)
// =============================================================================
function updateHUDStatusCards() {
    const isBn = (window.currentAppLanguage === "bn");

    const moistValEl = document.getElementById("hudDockMoistVal");
    const moistBadgeEl = document.getElementById("hudDockMoistBadge");
    if (moistValEl) moistValEl.textContent = `${Math.round(soilMoisturePercent)}%`;
    if (moistBadgeEl) {
        if (soilMoisturePercent >= 60 && soilMoisturePercent <= 85) {
            moistBadgeEl.className = "status-pill status-optimal";
            moistBadgeEl.textContent = isBn ? "🟢 পর্যাপ্ত" : "🟢 Optimal";
        } else if (soilMoisturePercent < 60 && soilMoisturePercent >= 40) {
            moistBadgeEl.className = "status-pill status-warning";
            moistBadgeEl.textContent = isBn ? "🟡 সেচ দিন" : "🟡 Needs Water";
        } else {
            moistBadgeEl.className = "status-pill status-urgent";
            moistBadgeEl.textContent = isBn ? "🔴 খরা" : "🔴 Drought";
        }
    }

    const npkValEl = document.getElementById("hudDockNPKVal");
    const npkBadgeEl = document.getElementById("hudDockNPKBadge");
    if (npkValEl) npkValEl.textContent = `${Math.round(npkLevelPercent)}%`;
    if (npkBadgeEl) {
        if (npkLevelPercent >= 75) {
            npkBadgeEl.className = "status-pill status-optimal";
            npkBadgeEl.textContent = isBn ? "🟢 সুষম" : "🟢 Balanced";
        } else {
            npkBadgeEl.className = "status-pill status-warning";
            npkBadgeEl.textContent = isBn ? "🟡 ঘাটতি" : "🟡 Low Nitrogen";
        }
    }

    const pestBadgeEl = document.getElementById("hudDockPestBadge");
    if (pestBadgeEl) {
        if (cropHealthState === "healthy") {
            pestBadgeEl.className = "status-pill status-optimal";
            pestBadgeEl.textContent = isBn ? "🟢 ঝুঁকিমুক্ত" : "🟢 Low Risk";
        } else {
            pestBadgeEl.className = "status-pill status-urgent";
            pestBadgeEl.textContent = isBn ? "🔴 পোকার আক্রমণ" : "🔴 Urgent Spray";
        }
    }

    const weatherStatusEl = document.getElementById("hudDockWeatherStatus");
    if (weatherStatusEl) {
        if (currentActiveWeather === "sunny") {
            weatherStatusEl.textContent = isBn ? "☀️ পরিষ্কার রোদ · ২৬°C" : "☀️ Clear & Sunny · 26°C";
        } else if (currentActiveWeather === "rain") {
            weatherStatusEl.textContent = isBn ? "🌧️ বৃষ্টি হচ্ছে · ২১°C" : "🌧️ Raining · 21°C";
        } else if (currentActiveWeather === "wind") {
            weatherStatusEl.textContent = isBn ? "💨 দমকা বাতাস · ৩৪ কিমি/ঘ" : "💨 Gusty Wind · 34 km/h";
        } else {
            weatherStatusEl.textContent = isBn ? "💦 সেচ চালু রয়েছে" : "💦 Irrigation Active";
        }
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

    if (mode === "drone") {
        targetCameraPos.set(0, 11.0, 13.0);
        targetLookAt.set(0, 0.2, 0);
        isTransitioningCamera = true;
        btnDrone?.classList.add("active");
    } else if (mode === "root") {
        targetCameraPos.set(0, 0.22, 2.8);
        targetLookAt.set(0, 0.12, 0);
        isTransitioningCamera = true;
        btnRoot?.classList.add("active");
    } else {
        targetCameraPos.set(0, 0.90, 5.2);
        targetLookAt.set(0, 0.65, 0);
        isTransitioningCamera = true;
        btnField?.classList.add("active");
    }
}
window.switchCameraMode = switchCameraMode;

export function updateCropSimulation(cropId) {
    if (!cropId) return;
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

    const btnSketchfab = document.getElementById("btnSketchfabExplorer");
    if (btnSketchfab) {
        btnSketchfab.addEventListener("click", () => {
            sketchfabService.openSearchExplorer(window.currentAppLanguage || "bn");
        });
    }

    // Macro View Toggle Buttons
    const btnToggleMacro = document.getElementById("btnToggleMacroView");
    if (btnToggleMacro) {
        btnToggleMacro.addEventListener("click", () => toggleMacroView(!isMacroViewActive));
    }

    const btnCloseMacro = document.getElementById("btnCloseMacroView");
    if (btnCloseMacro) {
        btnCloseMacro.addEventListener("click", () => toggleMacroView(false));
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
        updateTimelineUI();
    });
}

// =============================================================================
// 17. ANIMATION LOOP & PARTICLE DYNAMICS
// =============================================================================
function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.016;

    windUniforms.uTime.value = animationTime;

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

    // E. Smooth Camera Lerping
    if (isTransitioningCamera) {
        camera.position.lerp(targetCameraPos, 0.065);
        controls.target.lerp(targetLookAt, 0.065);

        if (camera.position.distanceTo(targetCameraPos) < 0.03 && controls.target.distanceTo(targetLookAt) < 0.03) {
            camera.position.copy(targetCameraPos);
            controls.target.copy(targetLookAt);
            isTransitioningCamera = false;
        }
    }

    // F. In-Scene Spatial AR World-to-Screen Projection
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
    scene.background = new THREE.Color(0x0e241b);

    camera = new THREE.PerspectiveCamera(mobile ? 52 : 45, width / height, 0.1, 1000);
    if (mobile) {
        // Elevated & pulled back for perfect framing on vertical mobile screens
        camera.position.set(0, 1.45, 6.8);
    } else {
        camera.position.set(0, 0.90, 5.2);
    }

    renderer = new THREE.WebGLRenderer({
        antialias: !mobile,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2.0));
    renderer.setClearColor(0x0e241b, 1.0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = mobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;

    containerEl.innerHTML = "";
    containerEl.appendChild(renderer.domElement);
    canvasEl = renderer.domElement;
    canvasEl.style.touchAction = "none";

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.minDistance = 0.8;
    controls.maxDistance = 24.0;
    controls.target.set(0, 0.65, 0);
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };

    initProceduralTextures();
    initEnvironmentLighting();
    initTerrain();

    // Particle Systems
    initRealisticRainSystem();
    initSprayMistSystem();
    initFertilizerGlowSystem();
    initSprinklerSystem();

    // Build Default Crop (Tomato)
    createCropField("tomato");

    initRaycasting();
    bindUIControls();

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

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("orientationchange", () => setTimeout(onWindowResize, 150));
    animate();

    console.log("🍅 [Field Shift] Photorealistic 3D & Spatial AR Crop Simulation Engine initialized (Mobile Optimized).");
}
window.init3DFieldSimulation = init3DFieldSimulation;

function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const mobile = isMobileDevice();
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || (mobile ? 560 : 680);

    camera.aspect = width / height;
    if (mobile && width < height) {
        camera.fov = 52;
    } else {
        camera.fov = 45;
    }
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2.0));
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DFieldSimulation);
} else {
    init3DFieldSimulation();
}
