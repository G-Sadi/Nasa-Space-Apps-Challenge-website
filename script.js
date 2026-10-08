/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR — MAIN SCRIPT
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Scenario Simulator — Sliders
|--------------------------------------------------------------------------
*/

const rainSlider =
    document.getElementById("rainSlider");

const tempSlider =
    document.getElementById("tempSlider");

const waterSlider =
    document.getElementById("waterSlider");


const rainValue =
    document.getElementById("rainValue");

const tempValue =
    document.getElementById("tempValue");

const waterValue =
    document.getElementById("waterValue");


const crop =
    document.getElementById("crop");

const score =
    document.getElementById("score");

const waterScore =
    document.getElementById("waterScore");

const climateScore =
    document.getElementById("climateScore");

const returnScore =
    document.getElementById("returnScore");

const recommendationText =
    document.getElementById("recommendationText");


/*
|--------------------------------------------------------------------------
| Calculate Scenario
|--------------------------------------------------------------------------
*/

function calculateScenario() {

    const rain =
        Number(rainSlider.value);

    const temp =
        Number(tempSlider.value);

    const water =
        Number(waterSlider.value);


    rainValue.textContent =
        `${rain > 0 ? "+" : ""}${rain}%`;

    tempValue.textContent =
        `${temp > 0 ? "+" : ""}${temp}°C`;

    waterValue.textContent =
        `${water > 0 ? "+" : ""}${water}%`;


    // SIMPLE SIMULATION

    let baseScore = 81;

    baseScore -= Math.abs(rain) * 0.25;

    baseScore -= Math.abs(temp) * 2;

    baseScore += water * 0.2;


    baseScore =
        Math.max(40, Math.min(98, baseScore));


    score.textContent =
        Math.round(baseScore);


    let climate =
        85 - Math.abs(temp) * 5;

    climate =
        Math.max(45, climate);


    climateScore.textContent =
        Math.round(climate) + "%";


    let waterResult =
        79 + water;

    waterResult =
        Math.max(40, Math.min(100, waterResult));


    waterScore.textContent =
        Math.round(waterResult) + "%";


    let expectedReturn =
        1.2 + baseScore / 100;


    returnScore.textContent =
        "৳" + expectedReturn.toFixed(2) + "L";


    // CROP RECOMMENDATION

    if (temp > 2 || water < -15) {

        crop.textContent = "Sorghum";

        recommendationText.textContent =
            "Higher temperature and lower water availability "
            + "favor a more drought-tolerant crop strategy.";

    }

    else if (rain < -15) {

        crop.textContent = "Maize";

        recommendationText.textContent =
            "Reduced rainfall increases water pressure. "
            + "Maize remains competitive with adaptive irrigation.";

    }

    else if (water > 10) {

        crop.textContent = "Rice";

        recommendationText.textContent =
            "Higher water availability creates favorable "
            + "conditions for water-intensive crops.";

    }

    else {

        crop.textContent = "Maize";

        recommendationText.textContent =
            "The scenario remains manageable. "
            + "Your adaptive crop rotation remains competitive.";

    }

}


/*
|--------------------------------------------------------------------------
| Slider event listeners
|--------------------------------------------------------------------------
*/

rainSlider.addEventListener(
    "input",
    calculateScenario
);

tempSlider.addEventListener(
    "input",
    calculateScenario
);

waterSlider.addEventListener(
    "input",
    calculateScenario
);


/*
|--------------------------------------------------------------------------
| Reset Simulation
|--------------------------------------------------------------------------
*/

function resetSimulation() {

    rainSlider.value = 0;

    tempSlider.value = 0;

    waterSlider.value = 0;

    calculateScenario();

}


/*
|--------------------------------------------------------------------------
| Scroll Helpers
|--------------------------------------------------------------------------
*/

function scrollToAnalysis() {

    document
        .getElementById("analysis")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function scrollToHow() {

    document
        .getElementById("how")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/*
|--------------------------------------------------------------------------
| Chart
|--------------------------------------------------------------------------
*/

const ctx =
    document.getElementById("farmChart");

new Chart(ctx, {

    type: "line",

    data: {

        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun"
        ],

        datasets: [

            {
                label: "Rainfall",
                data: [
                    120,
                    180,
                    240,
                    210,
                    300,
                    260
                ],

                tension: 0.4
            },

            {
                label: "Water availability",
                data: [
                    80,
                    76,
                    72,
                    68,
                    74,
                    79
                ],

                tension: 0.4
            }

        ]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {
                labels: {
                    color: "#ffffff"
                }
            }

        },

        scales: {

            x: {
                ticks: {
                    color: "#8ca097"
                }
            },

            y: {
                ticks: {
                    color: "#8ca097"
                }
            }

        }

    }

});


/*
|--------------------------------------------------------------------------
| Field Rotation Data
|--------------------------------------------------------------------------
*/

const fieldRotationData = {

    2026: {

        crop: "Maize",

        icon: "🌽",

        soil: "72%",

        water: "68%",

        yield: "91%",

        description:
            "Maize provides strong yield potential but requires careful nutrient management."

    },


    2027: {

        crop: "Rice",

        icon: "🌾",

        soil: "61%",

        water: "91%",

        yield: "88%",

        description:
            "Rice provides strong productivity but requires significantly more water during the growing season."

    },


    2028: {

        crop: "Wheat",

        icon: "🌱",

        soil: "78%",

        water: "55%",

        yield: "81%",

        description:
            "Wheat helps diversify the rotation cycle while maintaining moderate water demand."

    },


    2029: {

        crop: "Legume",

        icon: "🫘",

        soil: "94%",

        water: "42%",

        yield: "74%",

        description:
            "Legumes help restore soil quality and reduce long-term nutrient pressure."

    }

};


/*
|--------------------------------------------------------------------------
| Rotation Elements
|--------------------------------------------------------------------------
*/

const rotationCards =
    document.querySelectorAll(
        ".rotation-card"
    );


const selectedYear =
    document.getElementById(
        "selectedYear"
    );


const selectedCrop =
    document.getElementById(
        "selectedCrop"
    );


const selectedCropIcon =
    document.getElementById(
        "selectedCropIcon"
    );


const cropDescription =
    document.getElementById(
        "cropDescription"
    );


// ✅ FIX 4: null check — এই elements না থাকলে crash হবে না
const soilHealth =
    document.getElementById(
        "soilHealth"
    );


const waterDemand =
    document.getElementById(
        "waterDemand"
    );


const yieldPotential =
    document.getElementById(
        "yieldPotential"
    );


const rotationResult =
    document.getElementById(
        "rotationResult"
    );


const rotationResultText =
    document.getElementById(
        "rotationResultText"
    );


/*
|--------------------------------------------------------------------------
| Update Rotation
|--------------------------------------------------------------------------
*/

function updateRotation(year) {

    const data =
        fieldRotationData[year];

    if (!data) return;


    // ACTIVE CARD

    rotationCards.forEach(card => {

        card.classList.remove("active");

    });


    const activeCard =
        document.querySelector(
            `.rotation-card[data-year="${year}"]`
        );


    if (activeCard) {

        activeCard.classList.add("active");

    }


    // UPDATE INFORMATION — ✅ FIX 4: null check দিয়ে safe করা হয়েছে

    if (selectedYear)
        selectedYear.textContent = year;

    if (selectedCrop)
        selectedCrop.textContent = data.crop;

    if (selectedCropIcon)
        selectedCropIcon.textContent = data.icon;

    if (cropDescription)
        cropDescription.textContent = data.description;

    if (soilHealth)
        soilHealth.textContent = data.soil;

    if (waterDemand)
        waterDemand.textContent = data.water;

    if (yieldPotential)
        yieldPotential.textContent = data.yield;


    // HIDE OLD RESULT

    if (rotationResult) {

        rotationResult.classList.remove("show");

    }

}


/*
|--------------------------------------------------------------------------
| ✅ FIX 3: selectRotation — HTML onclick="selectRotation(year)" এর জন্য
| updateRotation এর alias হিসেবে কাজ করবে
|--------------------------------------------------------------------------
*/

function selectRotation(year) {

    updateRotation(year);

}


/*
|--------------------------------------------------------------------------
| Card Click (programmatic listener)
|--------------------------------------------------------------------------
*/

rotationCards.forEach(card => {

    card.addEventListener(
        "click",
        function() {

            const year =
                this.dataset.year;

            updateRotation(year);

        }
    );

});


/*
|--------------------------------------------------------------------------
| Simulate Button
|--------------------------------------------------------------------------
*/

const simulateButton =
    document.getElementById(
        "simulateRotation"
    );


if (simulateButton) {

    simulateButton.addEventListener(
        "click",
        function() {

            if (rotationResultText) {

                rotationResultText.textContent =
                    "The 4-year rotation shows a "
                    + "positive long-term trajectory. "
                    + "Soil health improves during the "
                    + "legume phase while water pressure "
                    + "decreases.";

            }

            if (rotationResult) {

                rotationResult.classList.add("show");

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| Reset Button
|--------------------------------------------------------------------------
*/

const resetButton =
    document.getElementById(
        "resetRotation"
    );


if (resetButton) {

    resetButton.addEventListener(
        "click",
        function() {

            updateRotation(2026);

        }
    );

}


/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

updateRotation(2026);


/*
|--------------------------------------------------------------------------
| ✅ FIX 1 & FIX 2: নিচের পুরো section DELETE করা হয়েছে।
|
| কারণ:
|   - farmMap, farmMarker, fieldArea → map.js এ আছে,
|     এখানে আবার বানালে Leaflet "Map already initialized" error দেয়।
|
|   - riverStatus, riverDistance, pondStatus, pondDistance →
|     map.js এর updateWaterUI() এটা handle করে,
|     এখানে করলে conflict হয়।
|--------------------------------------------------------------------------
*/