/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR - MAP ENGINE
|--------------------------------------------------------------------------
| Leaflet + OpenStreetMap + Overpass
|--------------------------------------------------------------------------
*/

let farmMap;
let farmMarker;
let fieldPolygon;

let detectedWaterLayer;


/*
|--------------------------------------------------------------------------
| Initialize Map
|--------------------------------------------------------------------------
*/

function initializeFarmMap() {

    const lat =
        farmData.location.latitude;

    const lng =
        farmData.location.longitude;


    // ✅ FIX 1: Removed duplicate `const farmMap` block and hardcoded coords.
    // Only one map instance using global `farmMap` variable.
    farmMap = L.map("farmMap")
        .setView(
            [lat, lng],
            14
        );


    // ✅ FIX 2: Removed duplicate L.tileLayer call. Only one tile layer added.
    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(farmMap);


    /*
    |--------------------------------------------------------------------------
    | Field marker
    |--------------------------------------------------------------------------
    */

    farmMarker =
        L.marker(
            [lat, lng]
        ).addTo(farmMap);


    farmMarker.bindPopup(
        `
        <strong>
            ${farmData.field.name}
        </strong>
        <br>
        ${farmData.farm.name}
        `
    );


    /*
    |--------------------------------------------------------------------------
    | Field boundary
    |--------------------------------------------------------------------------
    */

    fieldPolygon =
        L.polygon(
            farmData.field.boundary,
            {
                color: "#43ef8c",
                fillColor: "#43ef8c",
                fillOpacity: 0.25,
                weight: 2
            }
        ).addTo(farmMap);


    fieldPolygon.bindPopup(
        `
        <strong>
            ${farmData.field.name}
        </strong>

        <br>

        Area:
        ${farmData.field.area}
        ${farmData.field.unit}
        `
    );


    /*
    |--------------------------------------------------------------------------
    | Water layer
    |--------------------------------------------------------------------------
    */

    detectedWaterLayer =
        L.layerGroup()
            .addTo(farmMap);


    /*
    |--------------------------------------------------------------------------
    | Initial UI
    |--------------------------------------------------------------------------
    */

    updateLocationUI();

}


/*
|--------------------------------------------------------------------------
| Update location UI
|--------------------------------------------------------------------------
*/

function updateLocationUI() {

    const locationName =
        document.getElementById(
            "locationName"
        );

    const coordinates =
        document.getElementById(
            "coordinates"
        );

    const fieldArea =
        document.getElementById(
            "fieldArea"
        );


    if (locationName) {

        locationName.textContent =
            `${farmData.farm.name} · ${farmData.field.name}`;

    }


    if (coordinates) {

        coordinates.textContent =
            `${farmData.location.latitude.toFixed(4)}° N, ` +
            `${farmData.location.longitude.toFixed(4)}° E`;

    }


    if (fieldArea) {

        fieldArea.textContent =
            `${farmData.field.area} ${farmData.field.unit}`;

    }


    updateWaterUI();

}


/*
|--------------------------------------------------------------------------
| Water UI
|--------------------------------------------------------------------------
*/

function updateWaterUI() {

    const river =
        farmData.geography.river;

    const pond =
        farmData.geography.pond;


    const riverStatus =
        document.getElementById(
            "riverStatus"
        );

    const riverDistance =
        document.getElementById(
            "riverDistance"
        );


    const pondStatus =
        document.getElementById(
            "pondStatus"
        );

    const pondDistance =
        document.getElementById(
            "pondDistance"
        );


    if (riverStatus) {

        riverStatus.textContent =
            river.nearby
                ? "River nearby"
                : "No nearby river";

    }


    if (riverDistance) {

        riverDistance.textContent =
            river.nearby
                ? `${Math.round(river.distance)} m away`
                : "--";

    }


    if (pondStatus) {

        pondStatus.textContent =
            pond.nearby
                ? "Pond nearby"
                : "No nearby pond";

    }


    if (pondDistance) {

        pondDistance.textContent =
            pond.nearby
                ? `${Math.round(pond.distance)} m away`
                : "--";

    }

}


/*
|--------------------------------------------------------------------------
| Distance calculation
|--------------------------------------------------------------------------
*/

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =

        Math.sin(dLat / 2) ** 2 +

        Math.cos(lat1 * Math.PI / 180) *

        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


/*
|--------------------------------------------------------------------------
| Get geometry points
|--------------------------------------------------------------------------
*/

function getElementCoordinates(
    element
) {

    if (
        element.type === "node"
    ) {

        return [
            {
                lat: element.lat,
                lon: element.lon
            }
        ];

    }


    if (element.geometry) {

        return element.geometry.map(
            point => ({
                lat: point.lat,
                lon: point.lon
            })
        );

    }


    return [];

}


/*
|--------------------------------------------------------------------------
| Find nearest geographic object
|--------------------------------------------------------------------------
*/

function findNearestElement(
    elements,
    targetLat,
    targetLng
) {

    let nearest = null;

    let nearestDistance =
        Infinity;


    elements.forEach(
        element => {

            const points =
                getElementCoordinates(
                    element
                );


            points.forEach(
                point => {

                    const distance =
                        calculateDistance(
                            targetLat,
                            targetLng,
                            point.lat,
                            point.lon
                        );


                    if (
                        distance <
                        nearestDistance
                    ) {

                        nearestDistance =
                            distance;


                        nearest = {
                            element,
                            distance,
                            lat: point.lat,
                            lng: point.lon
                        };

                    }

                }
            );

        }
    );


    return nearest;

}


/*
|--------------------------------------------------------------------------
| Analyze real geographic data
|--------------------------------------------------------------------------
*/

async function analyzeLandLocation() {

    const lat =
        parseFloat(
            document.getElementById(
                "latitudeInput"
            )?.value
        );


    const lng =
        parseFloat(
            document.getElementById(
                "longitudeInput"
            )?.value
        );


    const radius =
        parseInt(
            document.getElementById(
                "searchRadius"
            )?.value || 1000
        );


    if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
    ) {

        alert(
            "Please enter valid coordinates."
        );

        return;

    }


    const button =
        document.getElementById(
            "analyzeLand"
        );


    if (button) {

        button.textContent =
            "Analyzing...";

        button.disabled = true;

    }


    try {

        /*
        |--------------------------------------------------------------------------
        | Overpass query
        |--------------------------------------------------------------------------
        */

        const query = `

            [out:json][timeout:25];

            (

                way["waterway"="river"]
                (around:${radius},${lat},${lng});

                way["waterway"="stream"]
                (around:${radius},${lat},${lng});

                node["natural"="water"]
                (around:${radius},${lat},${lng});

                way["natural"="water"]
                (around:${radius},${lat},${lng});

            );

            out geom;

        `;


        const response =
            await fetch(
                "https://overpass-api.de/api/interpreter",
                {
                    method: "POST",
                    body: query
                }
            );


        if (!response.ok) {

            throw new Error(
                "Overpass request failed"
            );

        }


        const result =
            await response.json();


        /*
        |--------------------------------------------------------------------------
        | Separate rivers and ponds
        |--------------------------------------------------------------------------
        */

        const rivers =
            result.elements.filter(
                element =>
                    element.tags?.waterway === "river"
                    ||
                    element.tags?.waterway === "stream"
            );


        const ponds =
            result.elements.filter(
                element =>
                    element.tags?.natural === "water"
            );


        /*
        |--------------------------------------------------------------------------
        | Find nearest
        |--------------------------------------------------------------------------
        */

        const nearestRiver =
            findNearestElement(
                rivers,
                lat,
                lng
            );


        const nearestPond =
            findNearestElement(
                ponds,
                lat,
                lng
            );


        /*
        |--------------------------------------------------------------------------
        | Update central data
        |--------------------------------------------------------------------------
        */

        // ✅ FIX 3: latitude update missing ছিল, এখন যোগ করা হয়েছে
        farmData.location.latitude = lat;
        farmData.location.longitude = lng;


        farmData.geography.river =
            {
                nearby:
                    !!nearestRiver,

                distance:
                    nearestRiver
                        ? nearestRiver.distance
                        : null,

                name:
                    nearestRiver
                        ?.element
                        ?.tags
                        ?.name ||
                    "Nearby River"
            };


        farmData.geography.pond =
            {
                nearby:
                    !!nearestPond,

                distance:
                    nearestPond
                        ? nearestPond.distance
                        : null,

                name:
                    nearestPond
                        ?.element
                        ?.tags
                        ?.name ||
                    "Nearby Water"
            };


        /*
        |--------------------------------------------------------------------------
        | Move map
        |--------------------------------------------------------------------------
        */

        farmMap.setView(
            [lat, lng],
            15
        );


        farmMarker.setLatLng(
            [lat, lng]
        );


        /*
        |--------------------------------------------------------------------------
        | Update field
        |--------------------------------------------------------------------------
        */

        fieldPolygon.setLatLngs(
            createFieldFromCenter(
                lat,
                lng
            )
        );


        /*
        |--------------------------------------------------------------------------
        | Draw water
        |--------------------------------------------------------------------------
        */

        drawWaterFeatures(
            rivers,
            ponds
        );


        /*
        |--------------------------------------------------------------------------
        | Update UI
        |--------------------------------------------------------------------------
        */

        updateLocationUI();


        /*
        |--------------------------------------------------------------------------
        | Notify simulation
        |--------------------------------------------------------------------------
        */

        if (
            typeof updateSimulationFromFarmData ===
            "function"
        ) {

            updateSimulationFromFarmData();

        }


    } catch (error) {

        console.error(
            error
        );


        alert(
            "Geographic data could not be loaded. Please try again."
        );


    } finally {

        if (button) {

            button.textContent =
                "Analyze this land";

            button.disabled =
                false;

        }

    }

}


/*
|--------------------------------------------------------------------------
| Create simple field around location
|--------------------------------------------------------------------------
*/

function createFieldFromCenter(
    lat,
    lng
) {

    const size =
        0.001;


    return [

        [lat + size, lng - size],

        [lat + size, lng + size],

        [lat - size, lng + size],

        [lat - size, lng - size]

    ];

}


/*
|--------------------------------------------------------------------------
| Draw rivers / ponds
|--------------------------------------------------------------------------
*/

function drawWaterFeatures(
    rivers,
    ponds
) {

    detectedWaterLayer.clearLayers();


    /*
    |--------------------------------------------------------------------------
    | Rivers
    |--------------------------------------------------------------------------
    */

    rivers.forEach(
        river => {

            if (!river.geometry) return;


            const points =
                river.geometry.map(
                    point => [
                        point.lat,
                        point.lon
                    ]
                );


            const line =
                L.polyline(
                    points,
                    {
                        color: "#39bdf8",
                        weight: 5,
                        opacity: 0.85
                    }
                );


            line.bindPopup(
                `
                <strong>
                    ${river.tags?.name || "River"}
                </strong>
                `
            );


            line.addTo(
                detectedWaterLayer
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Ponds / water bodies
    |--------------------------------------------------------------------------
    */

    ponds.forEach(
        pond => {

            if (!pond.geometry) return;


            const points =
                pond.geometry.map(
                    point => [
                        point.lat,
                        point.lon
                    ]
                );


            const polygon =
                L.polygon(
                    points,
                    {
                        color: "#39bdf8",
                        fillColor: "#39bdf8",
                        fillOpacity: 0.35,
                        weight: 2
                    }
                );


            polygon.bindPopup(
                `
                <strong>
                    ${pond.tags?.name || "Water body"}
                </strong>
                `
            );


            polygon.addTo(
                detectedWaterLayer
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| Analyze button
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeFarmMap();


        const analyzeButton =
            document.getElementById(
                "analyzeLand"
            );


        if (analyzeButton) {

            analyzeButton.addEventListener(
                "click",
                analyzeLandLocation
            );

        }

    }
);