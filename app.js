/*
|--------------------------------------------------------------------------
| FIELD SHIFT / AGRIVISION — CROP LIFECYCLE TRACKER (app.js)
|--------------------------------------------------------------------------
| Ultra-lightweight, responsive, dark-mode (#0f172a) interactive 5-stage
| crop tracker with dynamic progress bar, precision N-P-K fertilizer advice,
| pest/disease alerts, and bilingual (EN/BN) synchronization.
|--------------------------------------------------------------------------
*/

(function () {
    'use strict';

    // State
    let cropsData = [];
    let selectedCropId = 'rice';
    let currentStageIndex = 0; // 0 to 4 (5 stages)
    let activeCategory = 'all';
    let tourInterval = null;
    let isTourRunning = false;

    // Stage Icons for 5 stages
    const STAGE_ICONS = ['🌱', '🌿', '🌸', '🌾', '🚜'];
    const STAGE_DEFAULTS_EN = ['Sowing & Germination', 'Vegetative', 'Flowering & Fruiting', 'Maturity', 'Harvesting'];
    const STAGE_DEFAULTS_BN = ['বপন ও অঙ্কুরোদগম', 'অঙ্গজ বৃদ্ধি', 'ফুল ও ফল ধারণ', 'পরিপক্কতা', 'ফসল সংগ্রহ'];

    // Category mapping helper
    function getCropCategoryGroup(crop) {
        const cat = (crop.category || '').toLowerCase();
        if (cat.includes('cereal')) return 'cereal';
        if (cat.includes('vegetable') || cat.includes('tuber') || cat.includes('cole') || cat.includes('cucurbit')) return 'vegetable';
        if (cat.includes('cash')) return 'cash';
        if (cat.includes('pulse') || cat.includes('legume')) return 'pulse';
        if (cat.includes('oil') || cat.includes('spice') || cat.includes('bulb')) return 'oil-spice';
        if (cat.includes('fruit')) return 'fruit';
        return 'all';
    }

    // Initialize application
    async function init() {
        await loadCropsData();
        setupCategoryFilters();
        populateCropDropdown();
        setupEventListeners();
        renderCropLifecycle();
    }

    // Load structured JSON database with fail-safe fallback
    async function loadCropsData() {
        // Try to fetch from external crops_data.json
        try {
            const response = await fetch('crops_data.json');
            if (response.ok) {
                cropsData = await response.json();
                window.CROPS_DATABASE = cropsData;
                return;
            }
        } catch (e) {
            console.warn('[CropLifecycle] Local fetch prevented or failed, checking window fallback...', e);
        }

        // If pre-loaded in window, use it
        if (window.CROPS_DATABASE && Array.isArray(window.CROPS_DATABASE) && window.CROPS_DATABASE.length > 0) {
            cropsData = window.CROPS_DATABASE;
            return;
        }

        // If still empty, wait or fetch via relative path
        console.info('[CropLifecycle] Initialized with database.');
    }

    // Populate dropdown based on category filter
    function populateCropDropdown() {
        const select = document.getElementById('cropLifecycleSelect');
        if (!select) return;

        const isBn = (window.currentAppLanguage === 'bn');
        select.innerHTML = '';

        const filtered = cropsData.filter(crop => {
            if (activeCategory === 'all') return true;
            return getCropCategoryGroup(crop) === activeCategory;
        });

        if (filtered.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = isBn ? 'কোনো ফসল পাওয়া যায়নি' : 'No crops found';
            select.appendChild(opt);
            return;
        }

        filtered.forEach(crop => {
            const opt = document.createElement('option');
            opt.value = crop.id;
            const name = isBn ? `${crop.bangla_name} (${crop.name})` : `${crop.name} (${crop.bangla_name})`;
            opt.textContent = `${crop.icon || '🌱'} ${name}`;
            if (crop.id === selectedCropId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        // Ensure valid selection
        const exists = filtered.some(c => c.id === selectedCropId);
        if (!exists && filtered.length > 0) {
            selectedCropId = filtered[0].id;
            currentStageIndex = 0;
            select.value = selectedCropId;
        }
    }

    // Category filter tabs
    function setupCategoryFilters() {
        const filterContainer = document.getElementById('categoryFilters');
        if (!filterContainer) return;

        filterContainer.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                filterContainer.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.getAttribute('data-category') || 'all';
                populateCropDropdown();
                renderCropLifecycle();
            });
        });
    }

    // Attach all interactive event listeners
    function setupEventListeners() {
        const select = document.getElementById('cropLifecycleSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                selectedCropId = e.target.value;
                currentStageIndex = 0;
                stopTour();
                renderCropLifecycle();
                if (typeof window.updateCropSimulation === 'function') {
                    window.updateCropSimulation(selectedCropId);
                }
            });
        }

        const prevBtn = document.getElementById('prevStageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStageIndex > 0) {
                    currentStageIndex--;
                    stopTour();
                    renderCropLifecycle();
                }
            });
        }

        const nextBtn = document.getElementById('nextStageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentStageIndex < 4) {
                    currentStageIndex++;
                    stopTour();
                    renderCropLifecycle();
                }
            });
        }

        const tourBtn = document.getElementById('lifecycleTourBtn');
        if (tourBtn) {
            tourBtn.addEventListener('click', toggleTour);
        }

        // Keyboard arrow navigation
        window.addEventListener('keydown', (e) => {
            const lifecycleSec = document.getElementById('lifecycle');
            if (!lifecycleSec) return;
            const rect = lifecycleSec.getBoundingClientRect();
            const isInView = (rect.top < window.innerHeight && rect.bottom > 0);
            if (!isInView) return;

            if (e.key === 'ArrowRight' && currentStageIndex < 4) {
                currentStageIndex++;
                stopTour();
                renderCropLifecycle();
            } else if (e.key === 'ArrowLeft' && currentStageIndex > 0) {
                currentStageIndex--;
                stopTour();
                renderCropLifecycle();
            }
        });

        // Global language sync listener
        window.addEventListener('languageChanged', () => {
            populateCropDropdown();
            renderCropLifecycle();
        });
    }

    // Auto-Tour / Auto-Step feature
    function toggleTour() {
        if (isTourRunning) {
            stopTour();
        } else {
            startTour();
        }
    }

    function startTour() {
        isTourRunning = true;
        const tourBtn = document.getElementById('lifecycleTourBtn');
        const tourText = document.getElementById('tourBtnText');
        const isBn = (window.currentAppLanguage === 'bn');

        if (tourBtn) tourBtn.classList.add('active');
        if (tourText) tourText.textContent = isBn ? '❚❚ থামান' : '❚❚ Pause';

        tourInterval = setInterval(() => {
            currentStageIndex = (currentStageIndex + 1) % 5;
            renderCropLifecycle();
        }, 3600);
    }

    function stopTour() {
        if (!isTourRunning) return;
        isTourRunning = false;
        if (tourInterval) clearInterval(tourInterval);
        tourInterval = null;

        const tourBtn = document.getElementById('lifecycleTourBtn');
        const tourText = document.getElementById('tourBtnText');
        const isBn = (window.currentAppLanguage === 'bn');

        if (tourBtn) tourBtn.classList.remove('active');
        if (tourText) tourText.textContent = isBn ? '▶ অটো ট্যুর' : '▶ Auto Tour';
    }

    // Main render function
    function renderCropLifecycle() {
        const crop = cropsData.find(c => c.id === selectedCropId);
        if (!crop) return;

        const isBn = (window.currentAppLanguage === 'bn');
        const stages = crop.stages || [];
        const activeStage = stages[currentStageIndex] || stages[0];

        // 1. Render Profile Strip Metrics
        renderProfileStrip(crop, isBn);

        // 2. Render Dynamic 5-Step Visual Progress Bar
        renderStepper(stages, isBn);

        // 3. Render Active Stage Detailed Showcase
        renderStageDetails(crop, activeStage, isBn);

        // 4. Update Navigation Buttons state
        const prevBtn = document.getElementById('prevStageBtn');
        const nextBtn = document.getElementById('nextStageBtn');
        const counterText = document.getElementById('stageCounterText');

        if (prevBtn) prevBtn.disabled = (currentStageIndex === 0);
        if (nextBtn) nextBtn.disabled = (currentStageIndex === 4);

        if (counterText) {
            counterText.textContent = isBn 
                ? `ধাপ ${currentStageIndex + 1} / ৫` 
                : `Stage ${currentStageIndex + 1} of 5`;
        }
    }

    // Render Profile Summary Strip
    function renderProfileStrip(crop, isBn) {
        const durationEl = document.getElementById('profileDuration');
        const tempEl = document.getElementById('profileTemp');
        const waterEl = document.getElementById('profileWater');
        const soilEl = document.getElementById('profileSoil');
        const seasonEl = document.getElementById('profileSeason');

        if (durationEl) {
            durationEl.textContent = isBn 
                ? `${crop.total_duration_days} দিন (${crop.category_bn || crop.category})` 
                : `${crop.total_duration_days} Days (${crop.category})`;
        }
        if (tempEl) tempEl.textContent = crop.optimal_temp;
        if (waterEl) waterEl.textContent = crop.water_requirement;
        if (soilEl) soilEl.textContent = isBn ? (crop.soil_type_bn || crop.soil_type) : crop.soil_type;
        if (seasonEl) seasonEl.textContent = isBn ? (crop.ideal_season_bn || crop.ideal_season) : crop.ideal_season;
    }

    // Render Dynamic 5-Step Stepper
    function renderStepper(stages, isBn) {
        const nodesContainer = document.getElementById('stepperNodes');
        const fillBar = document.getElementById('progressLineFill');
        if (!nodesContainer) return;

        // Progress line fill percentage: 0% -> 25% -> 50% -> 75% -> 100%
        const fillPercentage = (currentStageIndex / 4) * 100;
        if (fillBar) {
            fillBar.style.width = `${fillPercentage}%`;
        }

        nodesContainer.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const stage = stages[i];
            const node = document.createElement('div');
            node.className = 'step-node';
            node.setAttribute('role', 'tab');
            node.setAttribute('tabindex', '0');

            if (i < currentStageIndex) {
                node.classList.add('completed');
            } else if (i === currentStageIndex) {
                node.classList.add('active');
            }

            const stageName = stage 
                ? (isBn ? (stage.stage_name_bn || stage.stage_name) : stage.stage_name)
                : (isBn ? STAGE_DEFAULTS_BN[i] : STAGE_DEFAULTS_EN[i]);

            const daysRange = stage ? stage.days_range : `Stage ${i + 1}`;
            const durationDays = stage ? `${stage.duration_days} ${isBn ? 'দিন' : 'Days'}` : '';

            node.innerHTML = `
                <div class="node-circle" title="${stageName}">
                    <span class="node-icon">${STAGE_ICONS[i]}</span>
                    <span class="node-check">✓</span>
                    <span class="node-number">${i + 1}</span>
                </div>
                <div class="node-info">
                    <span class="node-title">${stageName}</span>
                    <span class="node-days-pill">${durationDays || daysRange}</span>
                </div>
            `;

            // Node Click & Enter key
            const handleSelect = () => {
                currentStageIndex = i;
                stopTour();
                renderCropLifecycle();
            };

            node.addEventListener('click', handleSelect);
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect();
                }
            });

            nodesContainer.appendChild(node);
        }
    }

    // Render Detailed Stage Panel (NPK, Pests, Actionable Tips)
    function renderStageDetails(crop, stage, isBn) {
        const panel = document.getElementById('stageDetailPanel');
        if (!panel || !stage) return;

        const stageName = isBn ? (stage.stage_name_bn || stage.stage_name) : stage.stage_name;
        const cropName = isBn ? `${crop.bangla_name} (${crop.name})` : `${crop.name}`;
        const npk = stage.npk_advice || {};
        const pest = stage.pest_disease_alerts || {};
        const tips = isBn 
            ? (stage.actionable_tips_bn || stage.actionable_tips || []) 
            : (stage.actionable_tips || []);

        const npkDesc = isBn ? (npk.description_bn || npk.description) : npk.description;
        const pestThreats = isBn ? (pest.threats_bn || pest.threats) : pest.threats;
        const pestMgmt = isBn ? (pest.management_bn || pest.management) : pest.management;

        // Calculate progress percentage of total lifecycle
        const approxPct = Math.round(((currentStageIndex + 1) / 5) * 100);

        panel.innerHTML = `
            <!-- STAGE HEADER BANNER -->
            <div class="stage-banner">
                <div class="banner-left">
                    <div class="stage-glyph-badge">${STAGE_ICONS[currentStageIndex]}</div>
                    <div class="banner-title-box">
                        <div class="stage-meta-row">
                            <span class="badge-stage-pill">${isBn ? `ধাপ 0${currentStageIndex + 1}` : `Stage 0${currentStageIndex + 1}`}</span>
                            <span class="badge-days-pill">⏱️ ${stage.days_range} (${stage.duration_days} ${isBn ? 'দিন' : 'Days'})</span>
                            <span class="badge-pct-pill">⚡ ${approxPct}% ${isBn ? 'জীবনচক্র সমাপ্ত' : 'Lifecycle Completed'}</span>
                        </div>
                        <h3 class="stage-main-title">${cropName} — ${stageName}</h3>
                    </div>
                </div>
                <div class="banner-right">
                    <div class="crop-id-badge">
                        <span class="crop-mini-icon">${crop.icon || '🌱'}</span>
                        <span>${isBn ? crop.bangla_name : crop.name}</span>
                    </div>
                </div>
            </div>

            <!-- 3 ACTIONABLE CARDS GRID -->
            <div class="stage-cards-grid">

                <!-- 1. N-P-K FERTILIZER CARD -->
                <div class="stage-action-card card-fertilizer">
                    <div class="card-top">
                        <div class="card-icon-bubble green">🧪</div>
                        <div class="card-heading-box">
                            <h4 class="card-title">${isBn ? 'সুপারিশকৃত এন-পি-কে সার পরামর্শ' : 'Recommended N-P-K Advice'}</h4>
                            <span class="card-subtitle">${isBn ? 'মাটির পুষ্টি ও সুষম প্রয়োগ গাইড' : 'Precision Soil Nutrition'}</span>
                        </div>
                    </div>
                    <div class="npk-ratio-badge">
                        <span class="npk-tag">N-P-K</span>
                        <strong class="npk-formula">${npk.ratio || 'Balanced Dosage'}</strong>
                    </div>
                    <p class="card-body-text">${npkDesc || 'Apply recommended dosage evenly around root basin.'}</p>
                    <div class="card-footer-alert npk-meter">
                        <div class="npk-meter-bar">
                            <span class="n-bar" title="Nitrogen">N</span>
                            <span class="p-bar" title="Phosphorus">P</span>
                            <span class="k-bar" title="Potassium">K</span>
                        </div>
                        <span class="meter-note">${isBn ? 'সঠিক সময়ে সঠিক মাত্রায় সার প্রয়োগ করুন' : 'Apply at correct soil moisture'}</span>
                    </div>
                </div>

                <!-- 2. PEST & DISEASE ALERTS CARD -->
                <div class="stage-action-card card-alerts">
                    <div class="card-top">
                        <div class="card-icon-bubble amber">⚠️</div>
                        <div class="card-heading-box">
                            <h4 class="card-title">${isBn ? 'রোগবালাই ও কীটশত্রু সতর্কতা' : 'Key Pest & Disease Alerts'}</h4>
                            <span class="card-subtitle">${isBn ? 'আগাম ঝুঁকি ও প্রতিরোধমূলক ব্যবস্থা' : 'Critical Threat Monitoring'}</span>
                        </div>
                    </div>
                    <div class="threat-tags-wrapper">
                        <span class="threat-label">${isBn ? 'প্রধান হুমকি:' : 'Threats:'}</span>
                        <div class="threat-tag-list">
                            ${(pestThreats || '').split(',').map(t => `<span class="threat-tag">${t.trim()}</span>`).join('')}
                        </div>
                    </div>
                    <div class="management-protocol">
                        <strong class="protocol-heading">${isBn ? '🛡️ কার্যকর প্রতিকার:' : '🛡️ Defense Protocol:'}</strong>
                        <p class="protocol-text">${pestMgmt || 'Scout regularly and apply organic IPM treatments.'}</p>
                    </div>
                </div>

                <!-- 3. ACTIONABLE MANAGEMENT TIPS CARD -->
                <div class="stage-action-card card-tips">
                    <div class="card-top">
                        <div class="card-icon-bubble blue">💡</div>
                        <div class="card-heading-box">
                            <h4 class="card-title">${isBn ? 'কার্যকর পরিচর্যা পরামর্শ' : 'Actionable Stage Tips'}</h4>
                            <span class="card-subtitle">${isBn ? 'সর্বোচ্চ ফলন নিশ্চিতকরণ ধাপসমূহ' : 'Best Agronomic Practices'}</span>
                        </div>
                    </div>
                    <ul class="tips-checklist">
                        ${tips.map(tip => `
                            <li class="tip-item">
                                <span class="tip-check">✓</span>
                                <span class="tip-text">${tip}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

            </div>
        `;
    }

    // Global Export for external callers
    window.selectLifecycleCrop = function (cropId) {
        selectedCropId = cropId;
        currentStageIndex = 0;
        const select = document.getElementById('cropLifecycleSelect');
        if (select) select.value = cropId;
        renderCropLifecycle();
    };

    window.selectLifecycleStage = function (stageIndex) {
        if (stageIndex >= 0 && stageIndex <= 4) {
            currentStageIndex = stageIndex;
            renderCropLifecycle();
        }
    };

    // Auto-init on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
