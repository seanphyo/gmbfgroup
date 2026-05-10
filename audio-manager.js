(() => {
    const STORAGE = {
        enabled: "gmbf_audio_enabled",
        volume: "gmbf_audio_volume",
        weather: "gmbf_audio_weather_cache",
    };

    const TRACKS = {
        morning: [
            { src: "audio/morning-motivation-1.wav", title: "Morning Motivation 1" },
            { src: "audio/morning-motivation-2.wav", title: "Morning Motivation 2" },
            { src: "audio/morning-motivation-3.wav", title: "Morning Motivation 3" },
        ],
        day: [
            { src: "audio/day-rhythm-1.wav", title: "Active Rhythm 1" },
            { src: "audio/day-rhythm-2.wav", title: "Active Rhythm 2" },
            { src: "audio/day-rhythm-3.wav", title: "Active Rhythm 3" },
        ],
        evening: [
            { src: "audio/evening-chill-1.wav", title: "Evening Chill 1" },
            { src: "audio/evening-chill-2.wav", title: "Evening Chill 2" },
            { src: "audio/evening-chill-3.wav", title: "Evening Chill 3" },
        ],
        night: [
            { src: "audio/night-ambient-1.wav", title: "Night Ambient 1" },
            { src: "audio/night-ambient-2.wav", title: "Night Ambient 2" },
            { src: "audio/night-ambient-3.wav", title: "Night Ambient 3" },
        ],
        rainy: [
            { src: "audio/rainy-soft-1.wav", title: "Rainy Soft 1" },
            { src: "audio/rainy-soft-2.wav", title: "Rainy Soft 2" },
            { src: "audio/rainy-soft-3.wav", title: "Rainy Soft 3" },
        ],
        storm: [
            { src: "audio/storm-calm-1.wav", title: "Storm Calm 1" },
            { src: "audio/storm-calm-2.wav", title: "Storm Calm 2" },
        ],
    };

    const state = {
        enabled: false,
        volume: 0.25,
        weatherCode: null,
        currentPool: [],
        currentPoolKey: "",
        queue: [],
        currentIndex: -1,
        audio: null,
        startedByUser: false,
    };

    function readLocal(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch {
            return fallback;
        }
    }

    function writeLocal(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            /* ignore storage failures */
        }
    }

    function mmHour() {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Yangon",
            hour: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date());
        const hourPart = parts.find((p) => p.type === "hour");
        return hourPart ? Number(hourPart.value) : 12;
    }

    function periodFromHour(hour) {
        if (hour >= 5 && hour <= 10) return "morning";
        if (hour >= 11 && hour <= 16) return "day";
        if (hour >= 17 && hour <= 20) return "evening";
        return "night";
    }

    function weatherBucket(code) {
        if (code === null || code === undefined) return null;
        if ([95, 96, 99].includes(code)) return "storm";
        if (
            [45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
                code
            )
        ) {
            return "rainy";
        }
        return null;
    }

    async function fetchWeatherCode() {
        const cachedRaw = readLocal(STORAGE.weather, "");
        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw);
                if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
                    return cached.code;
                }
            } catch {
                /* ignore invalid cache */
            }
        }

        try {
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=16.8661&longitude=96.1951&current=weather_code&timezone=Asia%2FYangon"
            );
            if (!res.ok) throw new Error("weather request failed");
            const data = await res.json();
            const code = data?.current?.weather_code ?? null;
            writeLocal(
                STORAGE.weather,
                JSON.stringify({ code, timestamp: Date.now() })
            );
            return code;
        } catch {
            return null;
        }
    }

    function choosePool() {
        const period = periodFromHour(mmHour());
        const bucket = weatherBucket(state.weatherCode);
        const mixedBase = [...TRACKS.morning, ...TRACKS.day, ...TRACKS.night];
        if (bucket && TRACKS[bucket]?.length) {
            return dedupeTracks([...TRACKS[bucket], ...mixedBase]);
        }
        // Keep variety high and skip evening set per feedback.
        if (period === "evening") {
            return dedupeTracks([...TRACKS.night, ...TRACKS.day, ...TRACKS.morning]);
        }
        return dedupeTracks([...(TRACKS[period] || TRACKS.day), ...mixedBase]);
    }

    function dedupeTracks(tracks) {
        const seen = new Set();
        return tracks.filter((track) => {
            if (seen.has(track.src)) return false;
            seen.add(track.src);
            return true;
        });
    }

    function shuffleTracks(tracks) {
        const arr = tracks.slice();
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function createPlayerUI() {
        const wrap = document.createElement("div");
        wrap.className = "ambient-player";
        wrap.innerHTML = `
            <div class="ambient-player-head">
                <div>
                    <div class="ambient-player-title">Adaptive Music</div>
                    <div class="ambient-player-sub">Myanmar time + weather based</div>
                </div>
                <div class="ambient-player-controls">
                    <button type="button" class="ambient-btn ambient-btn-main" id="ambientPlayBtn">
                        <i class="fa-solid fa-play" aria-hidden="true"></i><span>Play</span>
                    </button>
                    <button type="button" class="ambient-btn" id="ambientNextBtn" title="Next track">
                        <i class="fa-solid fa-forward" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div class="ambient-volume">
                <input id="ambientVolume" type="range" min="0" max="1" step="0.01" />
            </div>
            <div class="ambient-status" id="ambientStatus">Music is off. Tap Play to enable.</div>
        `;
        document.body.appendChild(wrap);
    }

    function updateStatus(text) {
        const el = document.getElementById("ambientStatus");
        if (el) el.textContent = text;
    }

    function updatePlayButton(isPlaying) {
        const btn = document.getElementById("ambientPlayBtn");
        if (!btn) return;
        btn.innerHTML = isPlaying
            ? '<i class="fa-solid fa-pause" aria-hidden="true"></i><span>Pause</span>'
            : '<i class="fa-solid fa-play" aria-hidden="true"></i><span>Play</span>';
    }

    function setEnabled(enabled) {
        state.enabled = enabled;
        writeLocal(STORAGE.enabled, enabled ? "1" : "0");
    }

    function pickNextTrack() {
        state.currentPool = choosePool();
        if (!state.currentPool.length) return null;
        const key = state.currentPool.map((track) => track.src).join("|");
        if (state.currentPoolKey !== key || !state.queue.length) {
            state.currentPoolKey = key;
            state.queue = shuffleTracks(state.currentPool);
            // Avoid repeating the exact last track at queue boundaries.
            if (state.queue.length > 1 && state.currentIndex >= 0) {
                const lastTrack = state.currentPool[state.currentIndex];
                if (lastTrack && state.queue[0].src === lastTrack.src) {
                    state.queue.push(state.queue.shift());
                }
            }
        }
        const next = state.queue.shift();
        if (!next) return null;
        const idx = state.currentPool.findIndex((track) => track.src === next.src);
        state.currentIndex = idx;
        return next;
    }

    async function playTrack() {
        const track = pickNextTrack();
        if (!track) {
            updateStatus("No tracks configured.");
            return;
        }
        state.audio.src = track.src;
        try {
            await state.audio.play();
            updatePlayButton(true);
            updateStatus(`Now playing: ${track.title}`);
        } catch {
            updatePlayButton(false);
            updateStatus(
                "Unable to play. Add audio files in /audio and tap Play again."
            );
        }
    }

    function wireControls() {
        const playBtn = document.getElementById("ambientPlayBtn");
        const nextBtn = document.getElementById("ambientNextBtn");
        const volume = document.getElementById("ambientVolume");

        if (volume) {
            volume.value = String(state.volume);
            volume.addEventListener("input", () => {
                state.volume = Number(volume.value);
                state.audio.volume = state.volume;
                writeLocal(STORAGE.volume, String(state.volume));
            });
        }

        if (playBtn) {
            playBtn.addEventListener("click", async () => {
                state.startedByUser = true;
                if (state.audio.paused) {
                    setEnabled(true);
                    await playTrack();
                } else {
                    state.audio.pause();
                    updatePlayButton(false);
                    updateStatus("Paused.");
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", async () => {
                state.startedByUser = true;
                setEnabled(true);
                await playTrack();
            });
        }
    }

    function wireAudioEvents() {
        state.audio.addEventListener("ended", () => {
            if (state.enabled) {
                playTrack();
            }
        });

        state.audio.addEventListener("error", () => {
            updateStatus(
                "Track not found. Please upload matching files in /audio."
            );
            updatePlayButton(false);
        });
    }

    function wireFirstInteractionAutoplay() {
        const start = async () => {
            if (!state.enabled || state.startedByUser) return;
            state.startedByUser = true;
            await playTrack();
            window.removeEventListener("pointerdown", start);
            window.removeEventListener("keydown", start);
        };
        window.addEventListener("pointerdown", start, { once: true });
        window.addEventListener("keydown", start, { once: true });
    }

    async function init() {
        createPlayerUI();
        state.audio = new Audio();
        state.audio.preload = "none";
        state.audio.loop = false;
        state.audio.volume = Number(readLocal(STORAGE.volume, "0.25"));
        state.volume = state.audio.volume;
        state.enabled = readLocal(STORAGE.enabled, "0") === "1";

        wireControls();
        wireAudioEvents();
        updatePlayButton(false);
        updateStatus(
            state.enabled
                ? "Ready. Tap anywhere or press Play."
                : "Music is off. Tap Play to enable."
        );

        state.weatherCode = await fetchWeatherCode();
        wireFirstInteractionAutoplay();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
