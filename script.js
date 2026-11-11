/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR — MAIN SCRIPT
|--------------------------------------------------------------------------
| Handles Climate Scenario Simulator, Interactive Crop Rotation,
| Chart.js Visualization, and Bilingual Language Synchronization.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Scenario Simulator — Sliders & Outputs
|--------------------------------------------------------------------------
*/

const rainSlider = document.getElementById("rainSlider");
const tempSlider = document.getElementById("tempSlider");
const waterSlider = document.getElementById("waterSlider");

const rainValue = document.getElementById("rainValue");
const tempValue = document.getElementById("tempValue");
const waterValue = document.getElementById("waterValue");

const crop = document.getElementById("crop");
const score = document.getElementById("score");
const waterScore = document.getElementById("waterScore");
const climateScore = document.getElementById("climateScore");
const returnScore = document.getElementById("returnScore");
const recommendationText = document.getElementById("recommendationText");

/*
|--------------------------------------------------------------------------
| Bilingual Scenario Calculations
|--------------------------------------------------------------------------
*/

function calculateScenario() {
    if (!rainSlider || !tempSlider || !waterSlider) return;

    const rain = Number(rainSlider.value);
    const temp = Number(tempSlider.value);
    const water = Number(waterSlider.value);

    const isBn = (window.currentAppLanguage === "bn");

    if (rainValue) rainValue.textContent = `${rain > 0 ? "+" : ""}${rain}%`;
    if (tempValue) tempValue.textContent = `${temp > 0 ? "+" : ""}${temp}°C`;
    if (waterValue) waterValue.textContent = `${water > 0 ? "+" : ""}${water}%`;

    // Baseline calculation
    let baseScore = 81;
    baseScore -= Math.abs(rain) * 0.25;
    baseScore -= Math.abs(temp) * 2;
    baseScore += water * 0.2;
    baseScore = Math.max(40, Math.min(98, baseScore));

    if (score) score.textContent = Math.round(baseScore);

    let climate = 85 - Math.abs(temp) * 5;
    climate = Math.max(45, climate);
    if (climateScore) climateScore.textContent = Math.round(climate) + "%";

    let waterResult = 79 + water;
    waterResult = Math.max(40, Math.min(100, waterResult));
    if (waterScore) waterScore.textContent = Math.round(waterResult) + "%";

    let expectedReturn = 1.2 + baseScore / 100;
    if (returnScore) returnScore.textContent = "৳" + expectedReturn.toFixed(2) + "L";

    // Crop Recommendation logic (localized)
    if (temp > 2 || water < -15) {
        if (crop) crop.textContent = isBn ? "জোয়ার (Sorghum)" : "Sorghum";
        if (recommendationText) {
            recommendationText.textContent = isBn
                ? "অতিরিক্ত তাপমাত্রা এবং কম পানির প্রাপ্যতা খরা-সহনশীল ফসলের জন্য বেশি অনুকূল।"
                : "Higher temperature and lower water availability favor a more drought-tolerant crop strategy.";
        }
    } else if (rain < -15) {
        if (crop) crop.textContent = isBn ? "ভুট্টা (Maize)" : "Maize";
        if (recommendationText) {
            recommendationText.textContent = isBn
                ? "বৃষ্টিপাত কমে যাওয়ায় পানির চাপ বৃদ্ধি পেয়েছে। সেচ সাশ্রয়ী ভুট্টা চাষে লাভজনক ফলন পাওয়া সম্ভব।"
                : "Reduced rainfall increases water pressure. Maize remains competitive with adaptive irrigation.";
        }
    } else if (water > 10) {
        if (crop) crop.textContent = isBn ? "আমন ধান (Rice)" : "Rice";
        if (recommendationText) {
            recommendationText.textContent = isBn
                ? "উচ্চ পানির প্রাপ্যতা পানি-নিবিড় ফসল যেমন আমন ধানের জন্য সর্বাধিক উপযুক্ত পরিবেশ তৈরি করেছে।"
                : "Higher water availability creates favorable conditions for water-intensive crops.";
        }
    } else {
        if (crop) crop.textContent = isBn ? "ভুট্টা (Maize)" : "Maize";
        if (recommendationText) {
            recommendationText.textContent = isBn
                ? "বর্তমান পরিস্থিতি সুষম ও নিয়ন্ত্রণে রয়েছে। পরিবেশ-বান্ধব পর্যায়ক্রমিক ফসল চাষ নিশ্চিত লাভজনক থাকবে।"
                : "The scenario remains manageable. Your adaptive crop rotation remains competitive.";
        }
    }

    // Dynamic Real-time Binding to Dual-Line Chart
    if (window.farmChartInstance) {
        const newRain = BASELINE_RAINFALL.map(r => Math.round(Math.max(10, r * (1 + rain / 100))));
        const newWater = BASELINE_WATER.map(w => Math.round(Math.max(15, Math.min(100, w + (water * 0.75) - (temp * 2.2)))));

        window.farmChartInstance.data.datasets[0].data = newRain;
        window.farmChartInstance.data.datasets[1].data = newWater;
        window.farmChartInstance.update("none");
    }
}

if (rainSlider) rainSlider.addEventListener("input", calculateScenario);
if (tempSlider) tempSlider.addEventListener("input", calculateScenario);
if (waterSlider) waterSlider.addEventListener("input", calculateScenario);

function resetSimulation() {
    if (rainSlider) rainSlider.value = 0;
    if (tempSlider) tempSlider.value = 0;
    if (waterSlider) waterSlider.value = 0;
    calculateScenario();
    if (window.farmChartInstance) {
        window.farmChartInstance.data.datasets[0].data = [...BASELINE_RAINFALL];
        window.farmChartInstance.data.datasets[1].data = [...BASELINE_WATER];
        window.farmChartInstance.update();
    }
}

/*
|--------------------------------------------------------------------------
| Smooth Scroll Helpers
|--------------------------------------------------------------------------
*/

function scrollToAnalysis() {
    const el = document.getElementById("landLocation") || document.getElementById("analysis");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

function scrollToSimulation() {
    const el = document.getElementById("farmSimulation");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

function scrollToHow() {
    const el = document.getElementById("farmSimulation") || document.getElementById("how");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

window.scrollToAnalysis = scrollToAnalysis;
window.scrollToSimulation = scrollToSimulation;
window.scrollToHow = scrollToHow;
window.resetSimulation = resetSimulation;

/*
|--------------------------------------------------------------------------
| Dual-Line Chart.js Initialization & Real-Time Slider Binding
|--------------------------------------------------------------------------
*/

const CHART_MONTHS_EN = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
const CHART_MONTHS_BN = ["জানু", "মার্চ", "মে", "জুলাই", "সেপ্টে", "নভে"];
const BASELINE_RAINFALL = [45, 140, 290, 375, 230, 55]; // realistic monsoon rainfall curve (mm)
const BASELINE_WATER = [68, 62, 79, 94, 86, 71]; // realistic water availability curve (%)

let farmChartInstance = null;

function initFarmChart() {
    const ctx = document.getElementById("farmChart");
    if (!ctx) return;

    const isBn = (window.currentAppLanguage === "bn");

    if (farmChartInstance) {
        farmChartInstance.destroy();
    }

    farmChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: isBn ? CHART_MONTHS_BN : CHART_MONTHS_EN,
            datasets: [
                {
                    label: isBn ? "বৃষ্টিপাত (মিমি)" : "Rainfall (mm)",
                    data: [...BASELINE_RAINFALL],
                    borderColor: "#43ef8c",
                    backgroundColor: "rgba(67, 239, 140, 0.16)",
                    borderWidth: 2.8,
                    pointBackgroundColor: "#43ef8c",
                    pointBorderColor: "#06150f",
                    pointBorderWidth: 2,
                    pointRadius: 4.5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.38,
                    yAxisID: "y"
                },
                {
                    label: isBn ? "পানির প্রাপ্যতা (%)" : "Water Availability (%)",
                    data: [...BASELINE_WATER],
                    borderColor: "#38bdf8",
                    backgroundColor: "transparent",
                    borderWidth: 2.5,
                    borderDash: [6, 4],
                    pointBackgroundColor: "#38bdf8",
                    pointBorderColor: "#06150f",
                    pointBorderWidth: 2,
                    pointRadius: 4.5,
                    pointHoverRadius: 7,
                    tension: 0.38,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        color: "#e2e8f0",
                        font: { size: 12, weight: "600" },
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 16
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(6, 21, 15, 0.94)",
                    titleColor: "#43ef8c",
                    bodyColor: "#f8fafc",
                    borderColor: "rgba(67, 239, 140, 0.4)",
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += context.datasetIndex === 0
                                    ? `${context.parsed.y} mm`
                                    : `${context.parsed.y}%`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#9bb0a5",
                        font: { size: 12, weight: "600" }
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)"
                    }
                },
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    min: 0,
                    max: 480,
                    title: {
                        display: true,
                        text: isBn ? "বৃষ্টিপাত (মিমি)" : "Rainfall (mm)",
                        color: "#43ef8c",
                        font: { size: 11, weight: "700" }
                    },
                    ticks: {
                        color: "#43ef8c",
                        font: { size: 11 }
                    },
                    grid: {
                        color: "rgba(67, 239, 140, 0.08)"
                    }
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: isBn ? "পানির প্রাপ্যতা (%)" : "Water Availability (%)",
                        color: "#38bdf8",
                        font: { size: 11, weight: "700" }
                    },
                    ticks: {
                        color: "#38bdf8",
                        font: { size: 11 }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    window.farmChartInstance = farmChartInstance;
}

// Initialize on load and sync with language changes
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFarmChart);
} else {
    initFarmChart();
}

window.addEventListener("languageChanged", () => {
    initFarmChart();
    calculateScenario();
});

/*
|--------------------------------------------------------------------------
| Field Rotation Data (Bilingual)
|--------------------------------------------------------------------------
*/

const fieldRotationData = {
    2026: {
        cropEn: "Maize",
        cropBn: "ভুট্টা",
        icon: "🌽",
        soil: "72%",
        water: "68%",
        yield: "91%",
        descEn: "Maize provides strong yield potential but requires careful nutrient management.",
        descBn: "ভুট্টা উচ্চ ফলন দেয় তবে নিয়মিত সুষম পুষ্টি ও সার ব্যবস্থাপনার প্রয়োজন।"
    },
    2027: {
        cropEn: "Rice",
        cropBn: "আমন ধান",
        icon: "🌾",
        soil: "61%",
        water: "91%",
        yield: "88%",
        descEn: "Rice provides strong productivity but requires significantly more water during the growing season.",
        descBn: "ধানের ফলন দারুণ হলেও বর্ধনশীল মৌসুমে প্রচুর পরিমাণ সেচ ও পানির প্রয়োজন হয়।"
    },
    2028: {
        cropEn: "Wheat",
        cropBn: "গম",
        icon: "🌱",
        soil: "78%",
        water: "55%",
        yield: "81%",
        descEn: "Wheat helps diversify the rotation cycle while maintaining moderate water demand.",
        descBn: "গম চাষ ফসলের বৈচিত্র্য বৃদ্ধি করে এবং মাঝারি পানির চাহিদায় মাটির স্বাস্থ্য উন্নত রাখে।"
    },
    2029: {
        cropEn: "Legume",
        cropBn: "ডাল ফসল",
        icon: "🫘",
        soil: "94%",
        water: "42%",
        yield: "74%",
        descEn: "Legumes naturally fix nitrogen, restoring soil fertility and reducing fertilizer costs.",
        descBn: "ডাল জাতীয় ফসল মাটিতে নাইট্রোজেন সংবন্ধন করে উর্বরতা বহুগুণ বাড়িয়ে দেয়।"
    }
};

let currentSelectedRotationYear = 2026;

function updateRotation(year) {
    currentSelectedRotationYear = year;
    const data = fieldRotationData[year];
    if (!data) return;

    const isBn = (window.currentAppLanguage === "bn");

    // Active Card styling
    const rotationCards = document.querySelectorAll(".rotation-card");
    rotationCards.forEach(card => card.classList.remove("active"));
    const activeCard = document.querySelector(`.rotation-card[data-year="${year}"]`);
    if (activeCard) activeCard.classList.add("active");

    // Updating Details
    const selectedYearEl = document.getElementById("selectedYear");
    const selectedCropEl = document.getElementById("selectedCrop");
    const selectedCropIconEl = document.getElementById("selectedCropIcon");
    const cropDescEl = document.getElementById("cropDescription");
    const soilHealthEl = document.getElementById("detailSoilHealth");
    const waterDemandEl = document.getElementById("waterDemand");
    const yieldPotentialEl = document.getElementById("detailYieldPotential");

    if (selectedYearEl) selectedYearEl.textContent = year;
    if (selectedCropEl) selectedCropEl.textContent = isBn ? data.cropBn : data.cropEn;
    if (selectedCropIconEl) selectedCropIconEl.textContent = data.icon;
    if (cropDescEl) cropDescEl.textContent = isBn ? data.descBn : data.descEn;
    if (soilHealthEl) soilHealthEl.textContent = data.soil;
    if (waterDemandEl) waterDemandEl.textContent = data.water;
    if (yieldPotentialEl) yieldPotentialEl.textContent = data.yield;

    // Reset result panel when year switches
    const rotationResult = document.getElementById("rotationResult");
    if (rotationResult) rotationResult.classList.remove("show");
}

function selectRotation(year) {
    updateRotation(year);
}
window.selectRotation = selectRotation;

// Rotation action buttons
const simulateBtn = document.getElementById("simulateRotation");
if (simulateBtn) {
    simulateBtn.addEventListener("click", () => {
        const resultText = document.getElementById("rotationResultText");
        const rotationResult = document.getElementById("rotationResult");
        const isBn = (window.currentAppLanguage === "bn");

        if (resultText) {
            resultText.textContent = isBn
                ? "৪-বছরের পর্যায়ক্রম বিশ্লেষণ চমৎকার ফলাফল দেখিয়েছে। ডাল চাষের সময় মাটির উর্বরতা পুনরুদ্ধার হবে এবং পানির সামগ্রিক চাপ উল্লেখযোগ্যভাবে হ্রাস পাবে।"
                : "The 4-year rotation shows a positive long-term trajectory. Soil health improves during the legume phase while water pressure decreases.";
        }
        if (rotationResult) rotationResult.classList.add("show");
    });
}

const resetRotBtn = document.getElementById("resetRotation");
if (resetRotBtn) {
    resetRotBtn.addEventListener("click", () => {
        updateRotation(2026);
    });
}

// Global Language change listener to synchronize dynamic JavaScript state
window.addEventListener("languageChanged", () => {
    calculateScenario();
    updateRotation(currentSelectedRotationYear);
});

// Initial trigger
document.addEventListener("DOMContentLoaded", () => {
    calculateScenario();
    updateRotation(2026);
});
