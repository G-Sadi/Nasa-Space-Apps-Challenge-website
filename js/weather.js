/*
|--------------------------------------------------------------------------
| FIELD SHIFT — 7-DAY HYPER-LOCAL WEATHER FORECAST MODULE
|--------------------------------------------------------------------------
| - Geolocation API with Mymensingh, BD fallback
| - Open-Meteo 7-day daily forecast API
| - 3-hour localStorage cache for bandwidth optimization
| - Dynamic WMO weather codes (Icons & Bilingual Text)
| - Automated 'Krishi Alert' banner for >60% rain in next 48h
| - Seamless integration with Field Shift dark-forest / emerald theme
|--------------------------------------------------------------------------
*/

(function () {
    'use strict';

    // Constants
    const CACHE_KEY = 'fieldshift_weather_v1';
    const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 Hours
    const DEFAULT_COORDS = {
        lat: 24.7471,
        lon: 90.4203,
        nameEn: 'Field Shift • Mymensingh - Field 02',
        nameBn: 'ফিল্ড শিফট • ময়মনসিংহ - ফিল্ড ০২'
    };

    // WMO Weather Code Map (Descriptions & Icons)
    const WMO_CODES = {
        0:  { icon: '☀️', en: 'Clear sky',          bn: 'পরিষ্কার আকাশ' },
        1:  { icon: '🌤️', en: 'Mainly clear',       bn: 'প্রায় পরিষ্কার' },
        2:  { icon: '⛅', en: 'Partly cloudy',      bn: 'আংশিক মেঘলা' },
        3:  { icon: '☁️', en: 'Overcast',           bn: 'মেঘলা আকাশ' },
        45: { icon: '🌫️', en: 'Foggy',              bn: 'কুয়াশাচ্ছন্ন' },
        48: { icon: '🌫️', en: 'Depositing rime fog',bn: 'ঘন কুয়াশা' },
        51: { icon: '🌦️', en: 'Light drizzle',      bn: 'হালকা গুঁড়ি বৃষ্টি' },
        53: { icon: '🌦️', en: 'Moderate drizzle',   bn: 'মাঝারি গুঁড়ি বৃষ্টি' },
        55: { icon: '🌧️', en: 'Dense drizzle',      bn: 'ভারী গুঁড়ি বৃষ্টি' },
        56: { icon: '🌧️', en: 'Light freezing drizzle', bn: 'শীতল গুঁড়ি বৃষ্টি' },
        57: { icon: '🌧️', en: 'Dense freezing drizzle', bn: 'ঘন শীতল বৃষ্টি' },
        61: { icon: '🌧️', en: 'Slight rain',         bn: 'হালকা বৃষ্টি' },
        63: { icon: '🌧️', en: 'Moderate rain',       bn: 'মাঝারি বৃষ্টি' },
        65: { icon: '⛈️', en: 'Heavy rain',          bn: 'ভারী বৃষ্টি' },
        66: { icon: '🌧️', en: 'Freezing rain',       bn: 'শীতল বৃষ্টি' },
        67: { icon: '🌧️', en: 'Heavy freezing rain', bn: 'তীব্র শীতল বৃষ্টি' },
        71: { icon: '❄️', en: 'Slight snow',         bn: 'হালকা তুষারপাত' },
        73: { icon: '❄️', en: 'Moderate snow',       bn: 'মাঝারি তুষারপাত' },
        75: { icon: '❄️', en: 'Heavy snow',          bn: 'ভারী তুষারপাত' },
        77: { icon: '❄️', en: 'Snow grains',         bn: 'তুষারকণা' },
        80: { icon: '🌦️', en: 'Slight rain showers', bn: 'হালকা বৃষ্টির ঝলক' },
        81: { icon: '🌧️', en: 'Moderate rain showers', bn: 'মাঝারি বৃষ্টির ঝলক' },
        82: { icon: '⛈️', en: 'Violent rain showers', bn: 'তীব্র বৃষ্টির ঝলক' },
        85: { icon: '🌨️', en: 'Slight snow showers', bn: 'তুষারের ঝলক' },
        86: { icon: '🌨️', en: 'Heavy snow showers',  bn: 'ভারী তুষারের ঝলক' },
        95: { icon: '⛈️', en: 'Thunderstorm',        bn: 'বজ্রঝড়' },
        96: { icon: '⛈️', en: 'Thunderstorm with hail', bn: 'শিলাসহ বজ্রঝড়' },
        99: { icon: '⛈️', en: 'Heavy thunderstorm',   bn: 'তীব্র বজ্রঝড়' }
    };

    const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

    // State
    let currentForecastData = null;
    let currentLocation = { ...DEFAULT_COORDS };
    let isLiveCoord = false;

    // Convert number to Bengali numerals
    function toBengaliNum(num) {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return String(num).replace(/[0-9]/g, d => bnDigits[d]);
    }

    // Initialize
    async function init() {
        setupRefreshButton();
        window.addEventListener('languageChanged', onLanguageChanged);

        // Check if valid cache exists before querying geolocation or API
        const cached = getCachedForecast();
        if (cached) {
            currentForecastData = cached.data;
            currentLocation = cached.location;
            isLiveCoord = cached.isLiveCoord;
            renderForecast(currentForecastData, cached.timestamp);
            return;
        }

        // Otherwise resolve location and fetch
        await detectLocationAndFetch(false);
    }

    // Get Cached Forecast from localStorage
    function getCachedForecast() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const now = Date.now();
            if (now - parsed.timestamp < CACHE_DURATION_MS && parsed.data && parsed.data.daily) {
                return parsed;
            }
        } catch (e) {
            console.warn('[WeatherModule] Cache read error:', e);
        }
        return null;
    }

    // Save Forecast to localStorage
    function saveForecastToCache(data, location, isLive) {
        try {
            const payload = {
                timestamp: Date.now(),
                data: data,
                location: location,
                isLiveCoord: isLive
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn('[WeatherModule] Cache save error:', e);
        }
    }

    // Geolocation detection with fallback
    function detectLocationAndFetch(forceRefresh = false) {
        return new Promise((resolve) => {
            const locTextEl = document.getElementById('weatherLocationText');
            const isBn = (window.currentAppLanguage === 'bn');

            if (!navigator.geolocation) {
                // Geolocation unsupported
                currentLocation = { ...DEFAULT_COORDS };
                isLiveCoord = false;
                fetchOpenMeteoForecast(currentLocation.lat, currentLocation.lon, forceRefresh).then(resolve);
                return;
            }

            if (locTextEl) {
                locTextEl.textContent = isBn ? 'অবস্থান শনাক্ত করা হচ্ছে...' : 'Detecting GPS location...';
            }

            const geoTimeout = setTimeout(() => {
                // Timeout fallback
                currentLocation = { ...DEFAULT_COORDS };
                isLiveCoord = false;
                fetchOpenMeteoForecast(currentLocation.lat, currentLocation.lon, forceRefresh).then(resolve);
            }, 6000);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(geoTimeout);
                    const lat = parseFloat(pos.coords.latitude.toFixed(4));
                    const lon = parseFloat(pos.coords.longitude.toFixed(4));
                    currentLocation = {
                        lat: lat,
                        lon: lon,
                        nameEn: `GPS (${lat}°N, ${lon}°E)`,
                        nameBn: `জিপিএস (${toBengaliNum(lat)}°উ, ${toBengaliNum(lon)}°পূ)`
                    };
                    isLiveCoord = true;
                    fetchOpenMeteoForecast(lat, lon, forceRefresh).then(resolve);
                },
                (err) => {
                    clearTimeout(geoTimeout);
                    console.info('[WeatherModule] Geolocation access denied or unavailable; falling back to Mymensingh, BD.');
                    currentLocation = { ...DEFAULT_COORDS };
                    isLiveCoord = false;
                    fetchOpenMeteoForecast(currentLocation.lat, currentLocation.lon, forceRefresh).then(resolve);
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
            );
        });
    }

    // Fetch from Open-Meteo API
    async function fetchOpenMeteoForecast(lat, lon, forceRefresh = false) {
        const stripContainer = document.getElementById('weatherCardsStrip');
        const isBn = (window.currentAppLanguage === 'bn');

        if (stripContainer && !currentForecastData) {
            stripContainer.innerHTML = `
                <div class="weather-loading-skeleton">
                    <span class="loading-spinner">↻</span>
                    <span>${isBn ? 'ওপেন-মেটিও লাইভ আবহাওয়া ডেটা লোড হচ্ছে...' : 'Fetching Open-Meteo satellite weather data...'}</span>
                </div>
            `;
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
            const data = await res.json();

            if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
                throw new Error('Malformed daily forecast response');
            }

            currentForecastData = data;
            saveForecastToCache(data, currentLocation, isLiveCoord);
            renderForecast(data, Date.now());
        } catch (error) {
            console.error('[WeatherModule] Failed to fetch Open-Meteo weather:', error);
            renderErrorState(error.message);
        }
    }

    // Render 7-Day Forecast Strip & Krishi Alert Banner
    function renderForecast(data, timestamp) {
        if (!data || !data.daily) return;

        const isBn = (window.currentAppLanguage === 'bn');
        const daily = data.daily;
        const totalDays = Math.min(daily.time.length, 7);

        // 1. Update Location & Cache Indicator
        const locTextEl = document.getElementById('weatherLocationText');
        const cacheIndicator = document.getElementById('weatherCacheIndicator');

        if (locTextEl) {
            locTextEl.textContent = isBn ? currentLocation.nameBn : currentLocation.nameEn;
        }

        if (cacheIndicator) {
            const ageMinutes = Math.floor((Date.now() - timestamp) / 60000);
            if (ageMinutes < 2) {
                cacheIndicator.textContent = isBn ? '● লাইভ পূর্বাভাস' : '● Live Forecast';
                cacheIndicator.classList.remove('cached');
            } else {
                cacheIndicator.textContent = isBn 
                    ? `⚡ ক্যাশড (${toBengaliNum(ageMinutes)} মি. আগে)` 
                    : `⚡ Cached (${ageMinutes}m ago)`;
                cacheIndicator.classList.add('cached');
            }
        }

        // 2. Render 7 Weather Cards
        const stripContainer = document.getElementById('weatherCardsStrip');
        if (stripContainer) {
            stripContainer.innerHTML = '';

            for (let i = 0; i < totalDays; i++) {
                const dateObj = new Date(daily.time[i] + 'T00:00:00');
                const dayIndex = dateObj.getDay();
                const dayOfMonth = dateObj.getDate();
                const monthIndex = dateObj.getMonth();

                let dayLabel = isBn ? DAYS_BN[dayIndex] : DAYS_EN[dayIndex];
                if (i === 0) dayLabel = isBn ? 'আজ' : 'Today';
                else if (i === 1) dayLabel = isBn ? 'আগামীকাল' : 'Tomorrow';

                const dateLabel = isBn 
                    ? `${toBengaliNum(dayOfMonth)} ${MONTHS_BN[monthIndex]}` 
                    : `${dayOfMonth} ${MONTHS_EN[monthIndex]}`;

                const wmoCode = daily.weather_code[i];
                const weatherInfo = WMO_CODES[wmoCode] || { icon: '🌤️', en: 'Fair', bn: 'অনুকূল' };
                const conditionText = isBn ? weatherInfo.bn : weatherInfo.en;

                const maxTemp = Math.round(daily.temperature_2m_max[i]);
                const minTemp = Math.round(daily.temperature_2m_min[i]);
                const precipProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
                const precipSum = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;

                const isHighPrecip = (precipProb > 50);

                const card = document.createElement('div');
                card.className = `weather-day-card ${i === 0 ? 'today-active' : ''}`;
                card.setAttribute('tabindex', '0');

                card.innerHTML = `
                    <div class="w-card-header">
                        <span class="w-day-name ${i === 0 ? 'highlight-day' : ''}">${dayLabel}</span>
                        <span class="w-date-str">${dateLabel}</span>
                    </div>

                    <div class="w-card-icon" title="${conditionText}">
                        <span class="w-icon-glyph">${weatherInfo.icon}</span>
                    </div>

                    <div class="w-card-condition">${conditionText}</div>

                    <div class="w-card-temps">
                        <span class="temp-max">${isBn ? toBengaliNum(maxTemp) : maxTemp}°</span>
                        <span class="temp-sep">/</span>
                        <span class="temp-min">${isBn ? toBengaliNum(minTemp) : minTemp}°C</span>
                    </div>

                    <div class="w-precip-pill ${isHighPrecip ? 'high-rain' : ''}" title="${isBn ? 'বৃষ্টির সম্ভাবনা ও পরিমাণ' : 'Precipitation Probability & Amount'}">
                        <span class="precip-drop">💧</span>
                        <span class="precip-val">${isBn ? toBengaliNum(precipProb) : precipProb}%</span>
                        ${precipSum > 0 ? `<small class="precip-mm">${isBn ? toBengaliNum(precipSum.toFixed(1)) : precipSum.toFixed(1)}mm</small>` : ''}
                    </div>
                `;

                stripContainer.appendChild(card);
            }
        }

        // 3. Automated Krishi Alert Banner Logic
        // Check next 48 hours (Day 0 and Day 1)
        const day0Prob = (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 0;
        const day1Prob = (daily.precipitation_probability_max && daily.precipitation_probability_max[1]) || 0;
        const max48hPrecip = Math.max(day0Prob, day1Prob);

        renderKrishiAlert(max48hPrecip, isBn);
    }

    // Render Automated Krishi Alert Banner
    function renderKrishiAlert(maxPrecipProb, isBn) {
        const banner = document.getElementById('krishiAlertBanner');
        const iconEl = document.getElementById('krishiAlertIcon');
        const tagEl = document.getElementById('krishiAlertTag');
        const msgEl = document.getElementById('krishiAlertMessage');

        if (!banner || !msgEl) return;

        if (maxPrecipProb > 60) {
            // PROMINENT WARNING (Rain probability > 60%)
            banner.className = 'krishi-alert-banner alert-warning';
            if (iconEl) iconEl.textContent = '🚨';
            if (tagEl) {
                tagEl.textContent = isBn 
                    ? `⚠️ বৃষ্টির ঝুঁকি: ${toBengaliNum(maxPrecipProb)}%` 
                    : `⚠️ Rain Risk: ${maxPrecipProb}%`;
            }
            msgEl.textContent = isBn
                ? 'আগামী ৪৮ ঘণ্টায় বৃষ্টির সম্ভাবনা রয়েছে—সেচ ও কীটনাশক স্প্রে স্থগিত রাখুন।'
                : 'High probability of rain in the next 48 hours — suspend irrigation and pesticide spraying.';
        } else {
            // FAVORABLE AGRICULTURAL ADVISORY (Rain <= 60%)
            banner.className = 'krishi-alert-banner alert-favorable';
            if (iconEl) iconEl.textContent = '✅';
            if (tagEl) {
                tagEl.textContent = isBn 
                    ? `🌱 আবহাওয়া অনুকূল (বৃষ্টি ${toBengaliNum(maxPrecipProb)}%)` 
                    : `🌱 Favorable (${maxPrecipProb}% Rain)`;
            }
            msgEl.textContent = isBn
                ? 'আগামী ৪৮ ঘণ্টায় আবহাওয়া অনুকূলে রয়েছে—পরিকল্পিত সেচ ও মাঠ পরিচর্যা পরিচালনা করতে পারেন।'
                : 'Weather conditions favorable for the next 48 hours — planned irrigation and routine field care can proceed.';
        }
    }

    // Render Error State
    function renderErrorState(errMsg) {
        const stripContainer = document.getElementById('weatherCardsStrip');
        const isBn = (window.currentAppLanguage === 'bn');
        if (!stripContainer) return;

        stripContainer.innerHTML = `
            <div class="weather-error-box">
                <span class="error-icon">⚠️</span>
                <span>${isBn ? 'আবহাওয়া তথ্য লোড করতে সমস্যা হয়েছে।' : 'Unable to connect to Open-Meteo API.'}</span>
                <button class="retry-btn" onclick="window.refreshWeather(true)">${isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</button>
            </div>
        `;
    }

    // Language Change Handler
    function onLanguageChanged() {
        if (currentForecastData) {
            const cached = getCachedForecast();
            const ts = cached ? cached.timestamp : Date.now();
            renderForecast(currentForecastData, ts);
        }
    }

    // Setup Refresh Button
    function setupRefreshButton() {
        const btn = document.getElementById('refreshWeatherBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('.refresh-icon');
                if (icon) icon.classList.add('spinning');
                detectLocationAndFetch(true).finally(() => {
                    setTimeout(() => {
                        if (icon) icon.classList.remove('spinning');
                    }, 600);
                });
            });
        }
    }

    // Global Exposed Method
    window.refreshWeather = function (force = true) {
        detectLocationAndFetch(force);
    };

    // Auto-init on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
