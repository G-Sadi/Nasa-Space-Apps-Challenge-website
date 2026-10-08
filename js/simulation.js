/*
|--------------------------------------------------------------------------
| AGRIVISION - ADVANCED REALISTIC 3D FARM ENGINE
|--------------------------------------------------------------------------
| Procedural PBR Textures + Atmospheric Lighting + Furrowed Plots
| Dynamic Pond Water + Instanced Crops (Rice, Brinjal, Cabbage, Tomato)
| Tropical Trees (Coconut Palm, Jackfruit, Mango) + Bangladeshi Farmhouse
|--------------------------------------------------------------------------
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let farmGroup, cropGroup, treeGroup, waterGroup, animatedObjects = [];
let pondMaterial, paddyWaterMaterial;
let sunLight, hemiLight;
let animationTime = 0;
let isDayMode = true;

/*
|--------------------------------------------------------------------------
| PROCEDURAL TEXTURE GENERATORS
|--------------------------------------------------------------------------
*/

// ১. খাঁজকাটা দোআঁশ মাটির টেক্সচার (Plowed Furrows)
function createFurrowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(0, 0, 512, 512);

    const furrowHeight = 32;
    for (let y = 0; y < 512; y += furrowHeight) {
        const grad = ctx.createLinearGradient(0, y, 0, y + furrowHeight);
        grad.addColorStop(0, "rgba(25, 17, 10, 0.85)");
        grad.addColorStop(0.3, "rgba(70, 52, 33, 0.9)");
        grad.addColorStop(0.7, "rgba(95, 72, 46, 0.95)");
        grad.addColorStop(1, "rgba(25, 17, 10, 0.85)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, y, 512, furrowHeight);

        for (let i = 0; i < 90; i++) {
            const rx = Math.random() * 512;
            const ry = y + Math.random() * furrowHeight;
            const rSize = 1.5 + Math.random() * 3.5;
            const dark = Math.random() > 0.5;
            ctx.fillStyle = dark ? "rgba(20, 14, 8, 0.4)" : "rgba(110, 85, 55, 0.35)";
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

// ২. সবুজ ঘাসের টেক্সচার
function createGrassTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#48712f";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 2 + Math.random() * 5;
        const colors = ["#5c8c3a", "#3b6024", "#6fa345", "#2e4d1c", "#507a33"];
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
    texture.repeat.set(10, 10);
    return texture;
}

// ৩. পানির ঢেউয়ের নরমাল ম্যাপ
function createWaterNormalTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    const imgData = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const idx = (y * 256 + x) * 4;
            const wave1 = Math.sin(x * 0.12) * Math.cos(y * 0.12);
            const wave2 = Math.sin((x + y) * 0.08) * 0.5;
            const combined = (wave1 + wave2 + 1.5) / 3;

            imgData.data[idx] = Math.floor(128 + combined * 60);
            imgData.data[idx + 1] = Math.floor(128 + combined * 60);
            imgData.data[idx + 2] = 255;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
}

// ৪. টিনের চালের মেটালিক টেক্সচার
function createTinRoofTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#8a959e";
    ctx.fillRect(0, 0, 256, 256);

    for (let x = 0; x < 256; x += 8) {
        const grad = ctx.createLinearGradient(x, 0, x + 8, 0);
        grad.addColorStop(0, "#5e6973");
        grad.addColorStop(0.5, "#b5c1cb");
        grad.addColorStop(1, "#5e6973");
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
| INITIALIZE 3D SCENE
|--------------------------------------------------------------------------
*/

export function initializeFarmSimulation() {
    const container = document.getElementById("farm3D");
    if (!container) return;

    container.innerHTML = "";

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa6d1df);
    scene.fog = new THREE.FogExp2(0xc4dfc8, 0.015); // বায়ুমণ্ডলীয় হালকা কুয়াশা

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 300);
    camera.position.set(0, 19, 32); // ড্রোন ভিউ

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 10;
    controls.maxDistance = 65;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minPolarAngle = Math.PI / 8;
    controls.target.set(0, 1.2, 0);

    setupLighting();

    farmGroup  = new THREE.Group();
    cropGroup  = new THREE.Group();
    treeGroup  = new THREE.Group();
    waterGroup = new THREE.Group();

    scene.add(farmGroup);
    farmGroup.add(cropGroup);
    farmGroup.add(treeGroup);
    farmGroup.add(waterGroup);

    buildSkyAndBackdrop();
    buildTerrain();
    buildPlowedVegetableFields();
    buildPaddyField();
    buildPondsAndWaterways();
    buildRoadsAndAils();
    buildFarmHousesAndSheds();
    buildVegetationAndCrops();
    buildPerimeterTrees();

    updateDashboard();
    setupInteractiveHUDControls();

    window.addEventListener("resize", onWindowResize);
    animateFarm();
}

function setupLighting() {
    hemiLight = new THREE.HemisphereLight(0xdaf2ff, 0x486932, 1.3);
    scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    sunLight = new THREE.DirectionalLight(0xfffae8, 2.7);
    sunLight.position.set(28, 42, 22);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.radius = 2.5;

    scene.add(sunLight);
}

function buildSkyAndBackdrop() {
    const skyGeo = new THREE.SphereGeometry(140, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x9ed1e8, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    const treeWallGeo = new THREE.CylinderGeometry(75, 75, 12, 48, 1, true);
    const treeWallMat = new THREE.MeshBasicMaterial({ color: 0x426839, side: THREE.BackSide, fog: true });
    const treeWall = new THREE.Mesh(treeWallGeo, treeWallMat);
    treeWall.position.y = 5;
    scene.add(treeWall);
}

function buildTerrain() {
    const grassTex = createGrassTexture();
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(85, 75, 32, 32),
        new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    farmGroup.add(ground);
}

function buildPlowedVegetableFields() {
    const furrowTex = createFurrowTexture();
    const soilMat = new THREE.MeshStandardMaterial({ map: furrowTex, roughness: 0.95, metalness: 0.02 });

    const bed1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 9), soilMat);
    bed1.position.set(0, 0.15, 3.5);
    bed1.receiveShadow = true;
    bed1.castShadow = true;
    farmGroup.add(bed1);

    const bed2 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 7.5), soilMat);
    bed2.position.set(8.5, 0.15, -6.5);
    bed2.receiveShadow = true;
    bed2.castShadow = true;
    farmGroup.add(bed2);

    const bed3 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 5), soilMat);
    bed3.position.set(-9.5, 0.12, 1);
    bed3.receiveShadow = true;
    bed3.castShadow = true;
    farmGroup.add(bed3);

    buildEarthBorder(0, 3.5, 16.3, 9.3);
    buildEarthBorder(8.5, -6.5, 11.3, 7.8);
}

function buildEarthBorder(x, z, w, d) {
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x5a4833, roughness: 0.9 });
    const h = 0.45;
    const thickness = 0.35;

    const nsGeo = new THREE.BoxGeometry(w, h, thickness);
    const nMesh = new THREE.Mesh(nsGeo, borderMat);
    nMesh.position.set(x, h / 2, z - d / 2);
    farmGroup.add(nMesh);

    const sMesh = new THREE.Mesh(nsGeo, borderMat);
    sMesh.position.set(x, h / 2, z + d / 2);
    farmGroup.add(sMesh);

    const ewGeo = new THREE.BoxGeometry(thickness, h, d);
    const eMesh = new THREE.Mesh(ewGeo, borderMat);
    eMesh.position.set(x + w / 2, h / 2, z);
    farmGroup.add(eMesh);

    const wMesh = new THREE.Mesh(ewGeo, borderMat);
    wMesh.position.set(x - w / 2, h / 2, z);
    farmGroup.add(wMesh);
}

function buildPaddyField() {
    const mud = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.15, 12),
        new THREE.MeshStandardMaterial({ color: 0x3d3528, roughness: 0.4, metalness: 0.1 })
    );
    mud.position.set(-13, 0.05, -7.5);
    farmGroup.add(mud);

    paddyWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3f6b4d,
        roughness: 0.1,
        metalness: 0.25,
        transparent: true,
        opacity: 0.75
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 11.8), paddyWaterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-13, 0.14, -7.5);
    farmGroup.add(water);

    buildEarthBorder(-13, -7.5, 14.2, 12.2);
    buildPaddyPlants(-13, -7.5, 13, 11);
}

function buildPaddyPlants(centerX, centerZ, width, depth) {
    const plantCount = 280;
    const shootGeo = new THREE.ConeGeometry(0.08, 0.7, 4);
    const shootMat = new THREE.MeshStandardMaterial({ color: 0x6bb83b, roughness: 0.6 });

    const instancedPaddy = new THREE.InstancedMesh(shootGeo, shootMat, plantCount);
    instancedPaddy.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    const cols = 20, rows = 14;
    const xStep = width / cols, zStep = depth / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const px = centerX - width / 2 + c * xStep + (Math.random() - 0.5) * 0.25;
            const pz = centerZ - depth / 2 + r * zStep + (Math.random() - 0.5) * 0.25;
            const scale = 0.8 + Math.random() * 0.45;

            dummy.position.set(px, 0.45 * scale, pz);
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI;
            dummy.updateMatrix();

            instancedPaddy.setMatrixAt(idx++, dummy.matrix);
        }
    }
    cropGroup.add(instancedPaddy);
    animatedObjects.push({ mesh: instancedPaddy, type: "paddy" });
}

function buildPondsAndWaterways() {
    const waterNormal = createWaterNormalTexture();

    pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f749e,
        roughness: 0.12,
        metalness: 0.35,
        normalMap: waterNormal,
        transparent: true,
        opacity: 0.88
    });

    const pond = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.4, 40), pondMaterial);
    pond.position.set(-1.5, 0.12, -7.5);
    pond.scale.set(1.4, 1, 0.85);
    waterGroup.add(pond);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.4, 8, 36),
        new THREE.MeshStandardMaterial({ color: 0x4a5d33, roughness: 0.95 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(-1.5, 0.18, -7.5);
    rim.scale.set(1.4, 0.85, 1);
    waterGroup.add(rim);

    const stream = new THREE.Mesh(new THREE.BoxGeometry(28, 0.2, 1.4), pondMaterial);
    stream.position.set(0, 0.08, 9.8);
    waterGroup.add(stream);
}

function buildRoadsAndAils() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xb49a74, roughness: 0.95 });

    const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 2.2), roadMat);
    mainRoad.position.set(0, 0.06, -1.8);
    farmGroup.add(mainRoad);

    const sideRoad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 40), roadMat);
    sideRoad.position.set(-6.2, 0.06, 0);
    farmGroup.add(sideRoad);
}

function buildFarmHousesAndSheds() {
    const tinTex = createTinRoofTexture();
    const houseGroup = new THREE.Group();

    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 2.4, 3.4),
        new THREE.MeshStandardMaterial({ color: 0xd8caa8, roughness: 0.8 })
    );
    walls.position.y = 1.2;
    walls.castShadow = true;
    houseGroup.add(walls);

    const roofMat = new THREE.MeshStandardMaterial({ map: tinTex, roughness: 0.45, metalness: 0.65 });

    const roofA = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 2.4), roofMat);
    roofA.position.set(0, 2.9, 0.85);
    roofA.rotation.x = Math.PI / 6;
    houseGroup.add(roofA);

    const roofB = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 2.4), roofMat);
    roofB.position.set(0, 2.9, -0.85);
    roofB.rotation.x = -Math.PI / 6;
    houseGroup.add(roofB);

    houseGroup.position.set(6.5, 0, -2.5);
    farmGroup.add(houseGroup);
}

function buildVegetationAndCrops() {
    buildBrinjalRows(0, 5.5, 14, 3);
    buildCabbageRows(0, 2.0, 14, 3);
    buildTomatoRows(8.5, -6.5, 9.5, 5);
}

function buildBrinjalRows(centerX, centerZ, width, numRows) {
    const group = new THREE.Group();
    const plantsPerRow = 14, zSpacing = 1.0;

    for (let r = 0; r < numRows; r++) {
        const z = centerZ - ((numRows - 1) * zSpacing) / 2 + r * zSpacing;
        for (let c = 0; c < plantsPerRow; c++) {
            const x = centerX - width / 2 + 0.8 + c * (width / plantsPerRow);
            const plant = createSingleBrinjalPlant();
            plant.position.set(x, 0.35, z);
            group.add(plant);
        }
    }
    cropGroup.add(group);
    animatedObjects.push({ mesh: group, type: "crop" });
}

function createSingleBrinjalPlant() {
    const p = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d662e });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e5c2b, roughness: 0.6 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0x3b1842, roughness: 0.25 });

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 5), stemMat);
    stalk.position.y = 0.25;
    p.add(stalk);

    for (let a = 0; a < 4; a++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), leafMat);
        leaf.scale.set(1.4, 0.2, 0.7);
        leaf.rotation.y = (a * Math.PI) / 2;
        leaf.rotation.z = 0.25;
        leaf.position.set(Math.cos((a * Math.PI) / 2) * 0.18, 0.35, Math.sin((a * Math.PI) / 2) * 0.18);
        p.add(leaf);
    }

    const fruit = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.25, 8), fruitMat);
    fruit.position.set(0.12, 0.22, 0.1);
    fruit.rotation.z = -0.4;
    p.add(fruit);

    return p;
}

function buildCabbageRows(centerX, centerZ, width, numRows) {
    const group = new THREE.Group();
    const plantsPerRow = 14, zSpacing = 0.9;

    for (let r = 0; r < numRows; r++) {
        const z = centerZ - ((numRows - 1) * zSpacing) / 2 + r * zSpacing;
        for (let c = 0; c < plantsPerRow; c++) {
            const x = centerX - width / 2 + 0.8 + c * (width / plantsPerRow);
            const plant = createSingleCabbage();
            plant.position.set(x, 0.35, z);
            group.add(plant);
        }
    }
    cropGroup.add(group);
}

function createSingleCabbage() {
    const cab = new THREE.Group();
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x76b364, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), innerMat);
    head.position.y = 0.15;
    cab.add(head);
    return cab;
}

function buildTomatoRows(centerX, centerZ, width, numRows) {
    const group = new THREE.Group();
    const plantsPerRow = 8, zSpacing = 1.1;

    for (let r = 0; r < numRows; r++) {
        const z = centerZ - ((numRows - 1) * zSpacing) / 2 + r * zSpacing;
        for (let c = 0; c < plantsPerRow; c++) {
            const x = centerX - width / 2 + 0.7 + c * (width / plantsPerRow);
            const plant = createSingleTomatoPlant();
            plant.position.set(x, 0.35, z);
            group.add(plant);
        }
    }
    cropGroup.add(group);
    animatedObjects.push({ mesh: group, type: "crop" });
}

function createSingleTomatoPlant() {
    const t = new THREE.Group();
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.75, 6), new THREE.MeshStandardMaterial({ color: 0x416832 }));
    stalk.position.y = 0.38;
    t.add(stalk);

    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.25, 7, 7), new THREE.MeshStandardMaterial({ color: 0x367329 }));
    bush.position.y = 0.45;
    t.add(bush);

    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshStandardMaterial({ color: 0xc9301e }));
    fruit.position.set(0.15, 0.35, 0.1);
    t.add(fruit);

    return t;
}

function buildPerimeterTrees() {
    const palmPositions = [[-5.5, -9.5], [-8.2, -10.5], [3.2, -10.0], [-14.5, 2.5], [15.5, 6.0]];
    palmPositions.forEach(([x, z]) => {
        const palm = createCoconutPalmTree();
        palm.position.set(x, 0, z);
        treeGroup.add(palm);
        animatedObjects.push({ mesh: palm, type: "tree" });
    });

    const fruitPositions = [[-11.5, 7.5], [-3.5, 9.0], [9.5, 8.5], [14.0, 9.5], [12.0, -11.0]];
    fruitPositions.forEach(([x, z], i) => {
        const tree = i % 2 === 0 ? createJackfruitTree() : createMangoTree();
        tree.position.set(x, 0, z);
        treeGroup.add(tree);
        animatedObjects.push({ mesh: tree, type: "tree" });
    });
}

function createCoconutPalmTree() {
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 5.2, 7), new THREE.MeshStandardMaterial({ color: 0x6e5842 }));
    trunk.position.y = 2.6;
    palm.add(trunk);

    const frondMat = new THREE.MeshStandardMaterial({ color: 0x36782b, side: THREE.DoubleSide });
    for (let f = 0; f < 7; f++) {
        const frond = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 2.8), frondMat);
        frond.position.set(0, 5.2, 1.2);
        frond.rotation.x = 0.35;
        const frondGroup = new THREE.Group();
        frondGroup.add(frond);
        frondGroup.rotation.y = (f * Math.PI * 2) / 7;
        palm.add(frondGroup);
    }
    return palm;
}

function createJackfruitTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x54402e }));
    trunk.position.y = 1.3;
    tree.add(trunk);

    const jfMat = new THREE.MeshStandardMaterial({ color: 0x6b822d });
    for (let j = 0; j < 4; j++) {
        const jf = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 7), jfMat);
        const angle = (j * Math.PI * 2) / 4;
        jf.position.set(Math.cos(angle) * 0.42, 0.8 + j * 0.25, Math.sin(angle) * 0.42);
        tree.add(jf);
    }

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), new THREE.MeshStandardMaterial({ color: 0x275924 }));
    canopy.position.y = 3.6;
    tree.add(canopy);
    return tree;
}

function createMangoTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x483a2d }));
    trunk.position.y = 1.4;
    tree.add(trunk);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0x1f5421 }));
    canopy.position.y = 3.6;
    tree.add(canopy);
    return tree;
}

function animateFarm() {
    requestAnimationFrame(animateFarm);
    animationTime += 0.015;

    if (pondMaterial && pondMaterial.normalMap) {
        pondMaterial.normalMap.offset.x = Math.sin(animationTime * 0.3) * 0.05;
        pondMaterial.normalMap.offset.y = animationTime * 0.04;
    }

    animatedObjects.forEach((obj, i) => {
        const offset = i * 0.35;
        if (obj.type === "crop" || obj.type === "paddy") {
            obj.mesh.rotation.z = Math.sin(animationTime * 1.8 + offset) * 0.012;
        } else if (obj.type === "tree") {
            obj.mesh.rotation.z = Math.sin(animationTime * 1.1 + offset) * 0.007;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

function setupInteractiveHUDControls() {
    const resetBtn = document.getElementById("hudResetView");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            camera.position.set(0, 19, 32);
            controls.target.set(0, 1.2, 0);
            controls.update();
        });
    }

    const lightToggle = document.getElementById("hudToggleSun");
    if (lightToggle) {
        lightToggle.addEventListener("click", () => {
            isDayMode = !isDayMode;
            if (isDayMode) {
                scene.background.set(0xa6d1df);
                scene.fog.color.set(0xc4dfc8);
                sunLight.color.set(0xfffae8);
                sunLight.intensity = 2.7;
                hemiLight.intensity = 1.3;
                lightToggle.textContent = "☀️ দিন";
            } else {
                scene.background.set(0xdf8453);
                scene.fog.color.set(0xd87a50);
                sunLight.color.set(0xff7733);
                sunLight.intensity = 1.9;
                hemiLight.intensity = 0.8;
                lightToggle.textContent = "🌅 গোধূলি";
            }
        });
    }
}

export function updateDashboard() {
    if (typeof farmData === "undefined") return;

    const soil = farmData.soil || {};
    const weather = farmData.weather || {};

    setVal("hudNitrogenVal", `${soil.nitrogen ?? 64}%`);
    setVal("hudPhosphorusVal", `${soil.phosphorus ?? 52}%`);
    setVal("hudPotassiumVal", `${soil.potassium ?? 48}%`);
    setVal("hudMoistureVal", `${soil.moisture ?? 68}%`);
    setVal("hudPHVal", soil.ph ?? 6.5);
    setVal("hudTempVal", `${weather.temperature ?? 29}°সে.`);

    setBarWidth("hudNitrogenBar", `${soil.nitrogen ?? 64}%`);
    setBarWidth("hudPhosphorusBar", `${soil.phosphorus ?? 52}%`);
    setBarWidth("hudPotassiumBar", `${soil.potassium ?? 48}%`);

    setVal("hudWindSpeed", `${weather.windSpeed ?? 31} কিমি/ঘণ্টা`);
    setVal("hudHumidity", `${weather.humidity ?? 88}%`);
}

function setVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setBarWidth(id, width) {
    const el = document.getElementById(id);
    if (el) el.style.width = width;
}

window.updateSimulationFromFarmData = updateDashboard;

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