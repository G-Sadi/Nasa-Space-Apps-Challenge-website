/*
|--------------------------------------------------------------------------
| FIELD SHIFT — NASA SATELLITE FIELD SCANNER (js/scanner.js)
|--------------------------------------------------------------------------
| Interactive 4-Zone Farm Telemetry Scanner for Mymensingh • Field 02
| Powers animated radar sweep, 4-zone NDVI parcel interaction, live
| telemetry HUD, floating telemetry pills, and dynamic bilingual sync.
|--------------------------------------------------------------------------
*/

(function () {
    'use strict';

    // 4-Zone Telemetry Dataset for Mymensingh • Field 02
    const ZONE_DATA = {
        A: {
            id: 'A',
            nameEn: 'Zone A: North Plot',
            nameBn: 'জোন এ: উত্তরের প্লট',
            moistureVal: '58%',
            moistureSubEn: 'Optimal',
            moistureSubBn: 'সর্বোত্তম',
            ndviVal: '0.74',
            ndviSubEn: 'Healthy Dense',
            ndviSubBn: 'ঘন ও সুস্থ',
            tempVal: '25.4°C',
            tempSubEn: 'Normal',
            tempSubBn: 'স্বাভাবিক',
            actionBadgeClass: 'status-optimal',
            actionBadgeTextEn: 'No Irrigation Needed',
            actionBadgeTextBn: 'সেচের প্রয়োজন নেই',
            actionMainEn: 'Conserve Water',
            actionMainBn: 'পানি সাশ্রয়',
            actionSubEn: 'Good Retention',
            actionSubBn: 'আর্দ্রতা উপযুক্ত',
            actionClass: 'text-optimal',
            cropEn: 'Aman Rice (আমন ধান)',
            cropBn: 'রোপা আমন ধান',
            ndviTag: '0.74 NDVI'
        },
        B: {
            id: 'B',
            nameEn: 'Zone B: Canal Side',
            nameBn: 'জোন বি: খাল সংলগ্ন প্লট',
            moistureVal: '64%',
            moistureSubEn: 'High Moisture',
            moistureSubBn: 'উচ্চ আর্দ্রতা',
            ndviVal: '0.68',
            ndviSubEn: 'Optimal Growth',
            ndviSubBn: 'চমৎকার বৃদ্ধি',
            tempVal: '24.8°C',
            tempSubEn: 'Cool Corridor',
            tempSubBn: 'শীতল অঞ্চল',
            actionBadgeClass: 'status-info',
            actionBadgeTextEn: 'Drainage Monitored',
            actionBadgeTextBn: 'নিষ্কাশন পর্যবেক্ষণ',
            actionMainEn: 'Monitor Canal',
            actionMainBn: 'খাল পর্যবেক্ষণ',
            actionSubEn: 'Steady Runoff',
            actionSubBn: 'প্রবাহ স্বাভাবিক',
            actionClass: 'text-info',
            cropEn: 'Boro Rice (বোরো)',
            cropBn: 'উচ্চ ফলনশীল বোরো',
            ndviTag: '0.68 NDVI'
        },
        C: {
            id: 'C',
            nameEn: 'Zone C: Lowland Basin',
            nameBn: 'জোন সি: নিচু জমি অববাহিকা',
            moistureVal: '52%',
            moistureSubEn: 'Optimal',
            moistureSubBn: 'পর্যাপ্ত',
            ndviVal: '0.61',
            ndviSubEn: 'Moderate',
            ndviSubBn: 'মাঝারি বৃদ্ধি',
            tempVal: '26.2°C',
            tempSubEn: 'Normal',
            tempSubBn: 'স্বাভাবিক',
            actionBadgeClass: 'status-optimal',
            actionBadgeTextEn: 'No Irrigation Needed',
            actionBadgeTextBn: 'সেচের প্রয়োজন নেই',
            actionMainEn: 'Field Ready',
            actionMainBn: 'জমি প্রস্তুত',
            actionSubEn: 'Balanced Soil',
            actionSubBn: 'উর্বর মাটি',
            actionClass: 'text-optimal',
            cropEn: 'Deepwater Aman (গভীর আমন)',
            cropBn: 'গভীর পানির আমন ধান',
            ndviTag: '0.61 NDVI'
        },
        D: {
            id: 'D',
            nameEn: 'Zone D: High Terrace',
            nameBn: 'জোন ডি: উঁচু টিলা প্লট',
            moistureVal: '41%',
            moistureSubEn: 'Low Moisture',
            moistureSubBn: 'ঘাটতি আর্দ্রতা',
            ndviVal: '0.52',
            ndviSubEn: 'Moisture Stress',
            ndviSubBn: 'হালকা চাপ',
            tempVal: '28.5°C',
            tempSubEn: 'Elevated',
            tempSubBn: 'উষ্ণ তাপমাত্রা',
            actionBadgeClass: 'status-warning',
            actionBadgeTextEn: 'Irrigation Advised',
            actionBadgeTextBn: 'সেচের পরামর্শ',
            actionMainEn: 'Schedule Irrigation',
            actionMainBn: 'সেচ প্রদান করুন',
            actionSubEn: 'Deficit 12%',
            actionSubBn: 'ঘাটতি ১২%',
            actionClass: 'text-warning',
            cropEn: 'Mustard / Pulses (সরিষা/ডাল)',
            cropBn: 'সরিষা ও রবি ডাল ফসল',
            ndviTag: '0.52 NDVI'
        }
    };

    // State
    let activeZoneId = 'A';
    let hoveredZoneId = null;

    // DOM Elements Cache
    let hudZoneTitle = null;
    let hudActionBadge = null;
    let hudActionText = null;
    let hudValMoisture = null;
    let hudSubMoisture = null;
    let hudValNdvi = null;
    let hudSubNdvi = null;
    let hudValTemp = null;
    let hudSubTemp = null;
    let hudValAction = null;
    let hudSubAction = null;
    let zoneElements = [];

    // Helper to check Bengali mode
    function isBengali() {
        return (window.currentAppLanguage === 'bn');
    }

    // Render HUD values for the given zone
    function renderHUD(zoneId) {
        const data = ZONE_DATA[zoneId] || ZONE_DATA['A'];
        const isBn = isBengali();

        if (hudZoneTitle) {
            hudZoneTitle.textContent = isBn ? data.nameBn : data.nameEn;
        }

        if (hudActionBadge && hudActionText) {
            // Remove previous status classes
            hudActionBadge.classList.remove('status-optimal', 'status-info', 'status-warning');
            hudActionBadge.classList.add(data.actionBadgeClass);
            hudActionText.textContent = isBn ? data.actionBadgeTextBn : data.actionBadgeTextEn;
        }

        if (hudValMoisture && hudSubMoisture) {
            hudValMoisture.textContent = data.moistureVal;
            hudSubMoisture.textContent = isBn ? data.moistureSubBn : data.moistureSubEn;
        }

        if (hudValNdvi && hudSubNdvi) {
            hudValNdvi.textContent = data.ndviVal;
            hudSubNdvi.textContent = isBn ? data.ndviSubBn : data.ndviSubEn;
        }

        if (hudValTemp && hudSubTemp) {
            hudValTemp.textContent = data.tempVal;
            hudSubTemp.textContent = isBn ? data.tempSubBn : data.tempSubEn;
        }

        if (hudValAction && hudSubAction) {
            hudValAction.textContent = isBn ? data.actionMainBn : data.actionMainEn;
            hudValAction.className = 'metric-number ' + data.actionClass;
            hudSubAction.textContent = isBn ? data.actionSubBn : data.actionSubEn;
        }
    }

    // Set locked active zone
    function selectZone(zoneId) {
        if (!ZONE_DATA[zoneId]) return;
        activeZoneId = zoneId;

        // Update active class on zone elements
        zoneElements.forEach(el => {
            const zId = el.getAttribute('data-zone');
            const isActive = (zId === zoneId);
            el.classList.toggle('active', isActive);
            el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        renderHUD(zoneId);
    }

    // Preview zone on hover
    function previewZone(zoneId) {
        if (!ZONE_DATA[zoneId]) return;
        hoveredZoneId = zoneId;

        // Visual temporary highlight
        zoneElements.forEach(el => {
            const zId = el.getAttribute('data-zone');
            el.classList.toggle('hovered', zId === zoneId);
        });

        renderHUD(zoneId);
    }

    // Restore locked active zone on mouseleave
    function restoreZone() {
        hoveredZoneId = null;
        zoneElements.forEach(el => el.classList.remove('hovered'));
        renderHUD(activeZoneId);
    }

    // Setup event listeners for scanner zones
    function setupScanner() {
        hudZoneTitle = document.getElementById('hudZoneTitle');
        hudActionBadge = document.getElementById('hudActionBadge');
        hudActionText = document.getElementById('hudActionText');
        hudValMoisture = document.getElementById('hudValMoisture');
        hudSubMoisture = document.getElementById('hudSubMoisture');
        hudValNdvi = document.getElementById('hudValNdvi');
        hudSubNdvi = document.getElementById('hudSubNdvi');
        hudValTemp = document.getElementById('hudValTemp');
        hudSubTemp = document.getElementById('hudSubTemp');
        hudValAction = document.getElementById('hudValAction');
        hudSubAction = document.getElementById('hudSubAction');

        zoneElements = Array.from(document.querySelectorAll('.scanner-zone'));

        zoneElements.forEach(el => {
            const zId = el.getAttribute('data-zone');

            // Click / Tap selection
            el.addEventListener('click', () => {
                selectZone(zId);
            });

            // Hover preview
            el.addEventListener('pointerenter', () => {
                previewZone(zId);
            });

            el.addEventListener('pointerleave', () => {
                restoreZone();
            });

            // Keyboard accessibility (Enter / Space)
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectZone(zId);
                }
            });
        });

        // Initial render
        selectZone(activeZoneId);

        // Listen for global language changes
        window.addEventListener('languageChanged', () => {
            renderHUD(hoveredZoneId || activeZoneId);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupScanner);
    } else {
        setupScanner();
    }

    // Public API
    window.FieldScanner = {
        selectZone,
        previewZone,
        restoreZone,
        getActiveZone: () => activeZoneId,
        getZoneData: (id) => ZONE_DATA[id] || null
    };

})();

