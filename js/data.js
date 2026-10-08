/*
|--------------------------------------------------------------------------
| AGRI SIMULATOR - FARM DATA (js/data.js)
|--------------------------------------------------------------------------
*/

const farmData = {

    // ✅ map.js এর জন্য farm info
    farm: {
        name: "AgriVision Farm"
    },

    // ✅ map.js এর জন্য field info
    field: {
        name: "Field 02",
        area: 2.4,
        unit: "acres",
        boundary: [
            [24.7480, 90.4195],
            [24.7482, 90.4210],
            [24.7468, 90.4214],
            [24.7464, 90.4198]
        ]
    },

    location: {
        name: "Mymensingh Field 02",
        latitude: 24.7471,
        longitude: 90.4203,
        area: 2.4,
        unit: "acres"
    },

    soil: {
        health: 72,
        moisture: 68,
        nitrogen: 64,
        phosphorus: 52,
        potassium: 48,
        ph: 6.5
    },

    weather: {
        temperature: 29,
        humidity: 74,
        rainfall: 1200,
        windSpeed: 12
    },

    // ✅ map.js এবং simulation.js উভয়ের জন্য geography
    geography: {
        river: {
            nearby: true,
            distance: 420,
            name: "Nearest River"
        },
        pond: {
            nearby: true,
            distance: 180,
            name: "Farm Pond"
        }
    },

    // simulation.js এর জন্য ব্যাকওয়ার্ড সাপোর্ট
    river: {
        nearby: true,
        distance: 420
    },
    pond: {
        nearby: true,
        distance: 180
    },

    crop: {
        current: "Maize",
        year: 2026,
        growth: 68,
        yieldPotential: 91
    }

};