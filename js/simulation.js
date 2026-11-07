/*
|--------------------------------------------------------------------------
| AGRIVISION / FIELD SHIFT — PHOTOREALISTIC 3D & SPATIAL AR CROP ENGINE
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
 * Rice & Wheat Basal Tillering Clump Generator (গুছি)
 */
function createCerealTillerClusterGeometry(isRice = true) {
    const stems = [];
    const leaves = [];
    const fruits = [];

    const tillerCount = isRice ? 12 : 9;
    const height = isRice ? 0.90 : 0.85;

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
        fruitGeom: mergeBufferGeometries(fruits)
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

    const height = 1.95;

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
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Tomato Morphology Generator (Organic Vine, Serrated Foliage, Star Flowers & Glossy Tomatoes)
 * ABSOLUTELY ZERO BROWN WOODEN STAKES!
 */
function createTomatoMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const calyces = [];
    const flowers = [];

    // Organic tapered main vine (NO brown stake!)
    const mainStem = createOrganicMainStem(1.05, 0.024, 0.009, 0.04, 0.03, 16);
    stems.push(mainStem);

    // Lateral green branches
    const branchHeights = [0.28, 0.45, 0.62, 0.78, 0.92];
    branchHeights.forEach((by, idx) => {
        const ang = (idx * 137.5) * (Math.PI / 180);
        const branchStem = createOrganicMainStem(0.38, 0.012, 0.005, 0.02, 0.015, 8);
        branchStem.rotateZ(0.65);
        branchStem.rotateY(ang);
        branchStem.translate(0, by, 0);
        stems.push(branchStem);

        const leaf = createCompoundOddPinnateLeafGeometry(0.42, 0.22, true, false);
        leaf.rotateX(0.40);
        leaf.rotateY(ang);
        leaf.translate(Math.cos(ang) * 0.15, by + 0.08, Math.sin(ang) * 0.15);
        leaves.push(leaf);
    });

    // Clusters of oblate tomatoes with 5-pointed calyces
    const clusters = [
        { y: 0.38, count: 4, radius: 0.062 },
        { y: 0.58, count: 4, radius: 0.056 },
        { y: 0.76, count: 3, radius: 0.048 }
    ];

    clusters.forEach((c, cIdx) => {
        for (let i = 0; i < c.count; i++) {
            const ang = (i / c.count) * Math.PI * 1.5 + (cIdx * 1.2);
            const dist = 0.14 + (i * 0.02);
            const fx = Math.cos(ang) * dist;
            const fz = Math.sin(ang) * dist;
            const fy = c.y + (Math.random() - 0.5) * 0.04;

            const fg = new THREE.SphereGeometry(c.radius, 14, 12);
            fg.scale(1.08, 0.92, 1.08);
            fg.translate(fx, fy, fz);
            fruits.push(fg);

            const cg = create5PointedCalyxGeometry(c.radius * 0.65);
            cg.translate(fx, fy + c.radius * 0.90, fz);
            calyces.push(cg);
        }
    });

    for (let i = 0; i < 4; i++) {
        const b = createTomatoBlossomGeometry();
        b.translate(0.12 * Math.cos(i * 1.8), 0.82 + i * 0.04, 0.12 * Math.sin(i * 1.8));
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
 * Potato Morphology Generator (Spreading Bushy Ridge Canopy & Blossoms)
 */
function createPotatoMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];

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

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers)
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
 * Chili Morphology Generator (Compact Bush, Lanceolate Leaves & Hanging Chilies)
 */
function createChiliMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const fruits = [];
    const flowers = [];

    const baseStem = createOrganicMainStem(0.22, 0.018, 0.012, 0.01, 0.01, 6);
    stems.push(baseStem);

    const forkCount = 6;
    for (let i = 0; i < forkCount; i++) {
        const ang = (i / forkCount) * Math.PI * 2;
        const fork = createOrganicMainStem(0.34, 0.010, 0.004, 0.04, 0.03, 8);
        fork.rotateZ(0.45);
        fork.rotateY(ang);
        fork.translate(0, 0.22, 0);
        stems.push(fork);

        for (let l = 0; l < 4; l++) {
            const ly = 0.25 + l * 0.08;
            const leaf = createBotanicalBladeGeometry({
                length: 0.14,
                baseWidth: 0.005,
                midWidth: 0.032,
                tipWidth: 0.002,
                archX: 0.01,
                archY: 0.025,
                midribFold: 0.004,
                segments: 10
            });
            leaf.rotateX(0.4);
            leaf.rotateY(ang + (l - 1.5) * 0.4);
            leaf.translate(Math.cos(ang) * (0.08 + l * 0.04), ly, Math.sin(ang) * (0.08 + l * 0.04));
            leaves.push(leaf);
        }

        if (i % 2 === 0) {
            const chili = new THREE.ConeGeometry(0.014, 0.11, 7);
            chili.rotateX(Math.PI);
            chili.translate(Math.cos(ang) * 0.18, 0.35, Math.sin(ang) * 0.18);
            fruits.push(chili);
        } else {
            const flower = createTomatoBlossomGeometry();
            flower.scale.set(0.6, 0.6, 0.6);
            flower.translate(Math.cos(ang) * 0.16, 0.42, Math.sin(ang) * 0.16);
            flowers.push(flower);
        }
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers)
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

    // Visible bulb at soil crest
    const bulb = new THREE.SphereGeometry(0.048, 12, 10);
    bulb.scale(1.15, 0.90, 1.15);
    bulb.translate(0, 0.035, 0);
    fruits.push(bulb);

    // Hollow tubular upright cylindrical leaves tapering to points
    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
        const ang = (i / leafCount) * Math.PI * 2 + (Math.random() * 0.3);
        const tubeLen = 0.45 + Math.random() * 0.15;
        const tube = new THREE.CylinderGeometry(0.002, 0.012, tubeLen, 6);
        tube.rotateZ(0.18 + Math.random() * 0.12);
        tube.rotateY(ang);
        tube.translate(Math.cos(ang) * 0.02, tubeLen * 0.48, Math.sin(ang) * 0.02);
        leaves.push(tube);
    }

    const scape = new THREE.CylinderGeometry(0.006, 0.010, 0.65, 6);
    scape.translate(0, 0.32, 0);
    stems.push(scape);

    const umbel = new THREE.SphereGeometry(0.042, 10, 8);
    umbel.translate(0, 0.65, 0);
    flowers.push(umbel);

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        fruitGeom: mergeBufferGeometries(fruits),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Jute Morphology Generator (Tall Straight Fibrous Green Stalk & Upper Canopy Leaves)
 */
function createJuteMorphologyGeometry() {
    const stems = [];
    const leaves = [];
    const flowers = [];

    const height = 2.15;
    const stalk = new THREE.CylinderGeometry(0.012, 0.026, height, 8);
    stalk.translate(0, height * 0.5, 0);
    stems.push(stalk);

    const leafCount = 12;
    for (let i = 0; i < leafCount; i++) {
        const ang = (i * 137.5) * (Math.PI / 180);
        const ly = height * 0.60 + (i / leafCount) * (height * 0.38);

        const leaf = createBotanicalBladeGeometry({
            length: 0.32,
            baseWidth: 0.012,
            midWidth: 0.055,
            tipWidth: 0.004,
            archX: 0.02,
            archY: 0.08,
            midribFold: 0.008,
            wavyEdge: 0.004,
            segments: 12
        });
        leaf.rotateX(0.45);
        leaf.rotateY(ang);
        leaf.translate(0, ly, 0);
        leaves.push(leaf);
    }

    for (let f = 0; f < 4; f++) {
        const fang = f * 1.5;
        const fl = createTomatoBlossomGeometry();
        fl.scale.set(0.5, 0.5, 0.5);
        fl.translate(0.04 * Math.cos(fang), height * 0.82 + f * 0.04, 0.04 * Math.sin(fang));
        flowers.push(fl);
    }

    return {
        stemGeom: mergeBufferGeometries(stems),
        leafGeom: mergeBufferGeometries(leaves),
        flowerGeom: mergeBufferGeometries(flowers)
    };
}

/**
 * Universal Crop Morphology Dispatcher
 */
export function createCropMesh(cropType, baseChlorophyll) {
    let stemGeom = null, stemMat = null;
    let leafGeom = null, leafMat = null;
    let fruitGeom = null, fruitMat = null;
    let calyxGeom = null, calyxMat = null;
    let flowerGeom = null, flowerMat = null;

    let isMonocot = false;

    switch (cropType) {
        case "rice": {
            isMonocot = true;
            const res = createCerealTillerClusterGeometry(true);
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3e7529, roughness: 0.60 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd4b238, roughness: 0.38 });
            break;
        }

        case "wheat": {
            isMonocot = true;
            const res = createCerealTillerClusterGeometry(false);
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7e30, roughness: 0.60 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xc89f46, roughness: 0.42 });
            break;
        }

        case "maize": {
            isMonocot = true;
            const res = createMaizeMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x478c2e, roughness: 0.55 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.40 });
            break;
        }

        case "tomato": {
            const res = createTomatoMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            calyxGeom = res.calyxGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7426, roughness: 0.58 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                color: getTomatoRipeningColor(currentGrowthDay, maxCropDays),
                roughness: 0.15,
                clearcoat: 0.85,
                clearcoatRoughness: 0.12,
                metalness: 0.02,
                transmission: 0.03
            });
            calyxMat = new THREE.MeshStandardMaterial({ color: 0x2e6f28, roughness: 0.6, side: THREE.DoubleSide });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, emissive: 0x332600 });
            break;
        }

        case "potato": {
            const res = createPotatoMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x356920, roughness: 0.60 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf3e8ff, roughness: 0.30, emissive: 0x2a1b40 });
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
            stemMat = new THREE.MeshStandardMaterial({ color: 0x345424, roughness: 0.62 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                color: 0x24103a,
                roughness: 0.18,
                clearcoat: 0.80,
                clearcoatRoughness: 0.15
            });
            calyxMat = new THREE.MeshStandardMaterial({ color: 0x2d5f26, roughness: 0.6, side: THREE.DoubleSide });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.35, emissive: 0x2e1065 });
            break;
        }

        case "chili": {
            const res = createChiliMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2e6822, roughness: 0.55 });
            fruitMat = new THREE.MeshPhysicalMaterial({
                color: 0xef4444,
                roughness: 0.20,
                clearcoat: 0.75
            });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
            break;
        }

        case "mustard": {
            const res = createMustardMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x487f2e, roughness: 0.58 });
            flowerMat = new THREE.MeshStandardMaterial({
                color: 0xffea00,
                roughness: 0.30,
                emissive: 0x554400,
                emissiveIntensity: 0.35,
                side: THREE.DoubleSide
            });
            break;
        }

        case "onion": {
            isMonocot = true;
            const res = createOnionMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            fruitGeom = res.fruitGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x2a5a4e, roughness: 0.50 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.40 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
            break;
        }

        case "jute": {
            const res = createJuteMorphologyGeometry();
            stemGeom = res.stemGeom;
            leafGeom = res.leafGeom;
            flowerGeom = res.flowerGeom;
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3f7f2b, roughness: 0.55 });
            flowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
            break;
        }

        case "cauliflower": {
            const leaves = [];
            for (let i = 0; i < 7; i++) {
                const ang = (i / 7) * Math.PI * 2;
                const wl = createBroadWavyLeafGeometry(0.35, 0.22, 3);
                wl.rotateX(0.4);
                wl.rotateY(ang);
                wl.translate(0, 0.08, 0);
                leaves.push(wl);
            }
            leafGeom = mergeBufferGeometries(leaves);

            const curd = new THREE.SphereGeometry(0.12, 14, 10);
            curd.scale(1.2, 0.8, 1.2);
            curd.translate(0, 0.14, 0);
            fruitGeom = curd;

            stemGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6);
            stemGeom.translate(0, 0.06, 0);
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3f722a, roughness: 0.60 });
            fruitMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.75 });
            break;
        }

        default: {
            // General botanical architecture for remaining crops (Lentil, Cucumber, Carrot, Papaya)
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
            stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7528, roughness: 0.60 });

            fruitGeom = new THREE.SphereGeometry(0.045, 10, 8);
            fruitGeom.translate(0, 0.58, 0);
            fruitMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 });
            break;
        }
    }

    // Hyper-Realistic PBR Subsurface Scattering Material for Leaves
    leafMat = new THREE.MeshPhysicalMaterial({
        map: isMonocot ? monocotTexture : dicotTexture,
        color: baseChlorophyll,
        roughness: 0.45,
        metalness: 0.02,
        clearcoat: 0.15,
        clearcoatRoughness: 0.4,
        transmission: 0.15,
        emissive: new THREE.Color(0x1a3810),
        emissiveIntensity: 0.22,
        side: THREE.DoubleSide
    });

    return {
        stemGeom, stemMat,
        leafGeom, leafMat,
        fruitGeom, fruitMat,
        calyxGeom, calyxMat,
        flowerGeom, flowerMat
    };
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

    const dbCrop = window.CROPS_DATABASE ? window.CROPS_DATABASE.find(c => c.id === cropId) : null;
    maxCropDays = dbCrop ? dbCrop.total_duration_days : 105;

    const baseChlorophyll = getHealthColor(cropHealthState);

    // Build crop morphology with botanically accurate geometries (NO wooden stakes!)
    const morphology = createCropMesh(cropId, baseChlorophyll);
    const { stemGeom, stemMat, leafGeom, leafMat, fruitGeom, fruitMat, calyxGeom, calyxMat, flowerGeom, flowerMat } = morphology;

    currentStemMat = stemMat;
    currentLeafMat = leafMat;
    currentFruitMat = fruitMat;
    currentCalyxMat = calyxMat;
    currentFlowerMat = flowerMat;

    // Inject GPU wind shader movement into all plant materials
    injectWindShader(stemMat);
    injectWindShader(leafMat);
    if (fruitMat) injectWindShader(fruitMat);
    if (calyxMat) injectWindShader(calyxMat);
    if (flowerMat) injectWindShader(flowerMat);

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
            const x = (c - (COLS - 1) * 0.5) * ROW_SPACING;
            const z = (r - (ROWS - 1) * 0.5) * PLANT_SPACING;

            // Soil ridge height profile
            const y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.22;
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

    currentCropGroup.add(stemInstancedMesh);
    currentCropGroup.add(leafInstancedMesh);
    if (fruitInstancedMesh) currentCropGroup.add(fruitInstancedMesh);
    if (calyxInstancedMesh) currentCropGroup.add(calyxInstancedMesh);
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

        // Raised ridge bed profile beneath each crop row
        let y = Math.pow(Math.cos(x * furrowFreq), 2) * 0.22;
        // Real-world soil aggregate clods and natural bump displacement
        y += Math.sin(x * 24.0 + z * 18.0) * 0.014;
        y += Math.sin(x * 48.0) * Math.cos(z * 36.0) * 0.007;

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
