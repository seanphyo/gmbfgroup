(() => {
    const dateEl = document.getElementById("liveDatePill");
    const weatherEl = document.getElementById("liveWeatherPill");

    if (!dateEl || !weatherEl) return;

    function mmTimeLabel() {
        const now = new Date();
        const datePart = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Yangon",
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(now);
        const timePart = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Yangon",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(now);
        return `Myanmar time: ${datePart} ${timePart}`;
    }

    function weatherText(code) {
        const map = {
            0: "Clear",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Cloudy",
            45: "Fog",
            48: "Rime fog",
            51: "Light drizzle",
            53: "Drizzle",
            55: "Heavy drizzle",
            61: "Light rain",
            63: "Rain",
            65: "Heavy rain",
            71: "Light snow",
            73: "Snow",
            75: "Heavy snow",
            80: "Rain showers",
            81: "Rain showers",
            82: "Heavy showers",
            95: "Thunderstorm",
        };
        return map[code] || "Conditions unavailable";
    }

    async function loadWeather() {
        try {
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=16.8661&longitude=96.1951&current=temperature_2m,weather_code&timezone=Asia%2FYangon"
            );
            if (!res.ok) throw new Error("Weather request failed");
            const data = await res.json();
            const temp = Math.round(data.current.temperature_2m);
            const condition = weatherText(data.current.weather_code);
            weatherEl.textContent = `Yangon weather: ${temp}°C, ${condition}`;
        } catch {
            weatherEl.textContent = "Yangon weather: unavailable right now";
        }
    }

    function tick() {
        dateEl.textContent = mmTimeLabel();
    }

    tick();
    loadWeather();
    setInterval(tick, 30000);
})();
