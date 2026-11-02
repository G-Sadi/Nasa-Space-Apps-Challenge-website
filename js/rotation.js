/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR - CROP ROTATION BRIDGE
|--------------------------------------------------------------------------
| Seamlessly bridges Rotation events with main script and 3D simulation
|--------------------------------------------------------------------------
*/

let selectedRotationYear = 2026;

function initializeRotationBridge() {
    // Rotation cards click synchronization
    const cards = document.querySelectorAll(".rotation-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const year = Number(card.dataset.year);
            if (!year) return;
            selectedRotationYear = year;
            if (typeof updateRotation === "function") {
                updateRotation(year);
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", initializeRotationBridge);
