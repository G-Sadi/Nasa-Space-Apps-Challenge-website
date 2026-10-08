/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR - CROP ROTATION ENGINE
|--------------------------------------------------------------------------
*/

let selectedRotationYear =
    2026;


/*
|--------------------------------------------------------------------------
| Initialize
|--------------------------------------------------------------------------
*/

function initializeRotation() {

    const cards =
        document.querySelectorAll(
            ".rotation-card"
        );


    cards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const year =
                        Number(
                            card.dataset.year
                        );


                    if (!year) return;


                    selectRotationYear(
                        year
                    );

                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Select initial year
    |--------------------------------------------------------------------------
    */

    selectRotationYear(
        selectedRotationYear
    );


    /*
    |--------------------------------------------------------------------------
    | Simulation button
    |--------------------------------------------------------------------------
    */

    const simulate =
        document.getElementById(
            "simulateRotation"
        );


    if (simulate) {

        simulate.addEventListener(
            "click",
            simulateRotation
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    const reset =
        document.getElementById(
            "resetRotation"
        );


    if (reset) {

        reset.addEventListener(
            "click",
            () => {

                selectRotationYear(
                    2026
                );

            }
        );

    }

}


/*
|--------------------------------------------------------------------------
| Select crop/year
|--------------------------------------------------------------------------
*/

function selectRotationYear(
    year
) {
    
     const Crop = "Maize";


    if (!crop) return;


    selectedRotationYear =
        year;


    /*
    |--------------------------------------------------------------------------
    | Active card
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            ".rotation-card"
        )
        .forEach(
            card => {

                card.classList.toggle(
                    "active",
                    Number(
                        card.dataset.year
                    ) === year
                );

            }
        );


    /*
    |--------------------------------------------------------------------------
    | Update details
    |--------------------------------------------------------------------------
    */

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

    const description =
        document.getElementById(
            "cropDescription"
        );

    const soil =
        document.getElementById(
            "soilHealth"
        );

    const water =
        document.getElementById(
            "waterDemand"
        );

    const yieldPotential =
        document.getElementById(
            "yieldPotential"
        );


    if (selectedYear)
        selectedYear.textContent =
            year;


    if (selectedCrop)
        selectedCrop.textContent =
            crop.crop;


    if (selectedCropIcon)
        selectedCropIcon.textContent =
            crop.icon;


    if (description)
        description.textContent =
            crop.description;


    if (soil)
        soil.textContent =
            calculateSoilScore(
                crop
            ) + "%";


    if (water)
        water.textContent =
            crop.waterDemand + "%";


    if (yieldPotential)
        yieldPotential.textContent =
            crop.yieldPotential + "%";


    /*
    |--------------------------------------------------------------------------
    | Send selected crop to 3D simulation
    |--------------------------------------------------------------------------
    */

    if (
        typeof updateCropSimulation ===
        "function"
    ) {

        updateCropSimulation(
            crop
        );

    }

}


/*
|--------------------------------------------------------------------------
| Soil score
|--------------------------------------------------------------------------
*/

function calculateSoilScore(
    crop
) {

    const base =
        farmData.soil.health;


    /*
    | Legumes improve soil
    */

    if (
        crop.crop ===
        "Legume"
    ) {

        return Math.min(
            100,
            base + 15
        );

    }


    /*
    | High water crops put more pressure
    */

    if (
        crop.crop ===
        "Rice"
    ) {

        return Math.max(
            0,
            base - 8
        );

    }


    return base;

}


/*
|--------------------------------------------------------------------------
| Rotation simulation
|--------------------------------------------------------------------------
*/

function simulateRotation() {

    const crop =
        getSelectedCrop(
            selectedRotationYear
        );


    if (!crop) return;


    const riverDistance =
        farmData.geography
            .river.distance;


    const pondDistance =
        farmData.geography
            .pond.distance;


    const soilHealth =
        farmData.soil.health;


    /*
    |--------------------------------------------------------------------------
    | Simple water accessibility score
    |--------------------------------------------------------------------------
    */

    let waterScore = 50;


    if (
        riverDistance !== null
    ) {

        waterScore +=
            Math.max(
                0,
                30 -
                riverDistance / 50
            );

    }


    if (
        pondDistance !== null
    ) {

        waterScore +=
            Math.max(
                0,
                20 -
                pondDistance / 30
            );

    }


    waterScore =
        Math.min(
            100,
            Math.round(
                waterScore
            )
        );


    /*
    |--------------------------------------------------------------------------
    | Overall score
    |--------------------------------------------------------------------------
    */

    const finalScore =
        Math.round(

            (
                soilHealth +
                waterScore +
                crop.yieldPotential
            ) / 3

        );


    const result =
        document.getElementById(
            "rotationResult"
        );


    const resultText =
        document.getElementById(
            "rotationResultText"
        );


    if (result) {

        result.classList.add(
            "show"
        );

    }


    if (resultText) {

        resultText.textContent =

            `${crop.crop} for ${crop.year} ` +

            `has an estimated rotation score ` +

            `of ${finalScore}%. ` +

            `Water accessibility score: ` +

            `${waterScore}%.`;

    }

}


/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initializeRotation
);