(() => {
    const STORAGE = {
        enabled: "gmbf_audio_enabled",
        volume: "gmbf_audio_volume",
        weather: "gmbf_audio_weather_cache",
        hidden: "gmbf_audio_hidden",
    };

    const TRACKS = {
        morning: [
            { src: "audio/mixkit-a-very-happy-christmas-897.mp3", title: "Very Happy Christmas" },
            { src: "audio/mixkit-beautiful-dream-493.mp3", title: "Beautiful Dream" },
            { src: "audio/mixkit-valley-sunset-127.mp3", title: "Valley Sunset" },
            { src: "audio/mixkit-serene-view-443.mp3", title: "Serene View" },
            { src: "audio/mixkit-spirit-in-the-woods-139.mp3", title: "Spirit in the Woods" },
            { src: "audio/mixkit-discover-587.mp3", title: "Discover" },
            { src: "audio/mixkit-relaxing-in-nature-522.mp3", title: "Relaxing in Nature" },
        ],
        day: [
            { src: "audio/mixkit-driving-ambition-32.mp3", title: "Driving Ambition" },
            { src: "audio/mixkit-tech-house-vibes-130.mp3", title: "Tech House Vibes" },
            { src: "audio/mixkit-games-worldbeat-466.mp3", title: "Games Worldbeat" },
            { src: "audio/mixkit-gimme-that-groove-872.mp3", title: "Gimme That Groove" },
            { src: "audio/mixkit-island-beat-250.mp3", title: "Island Beat" },
            { src: "audio/mixkit-latin-lovers-39.mp3", title: "Latin Lovers" },
            { src: "audio/mixkit-cat-walk-371.mp3", title: "Cat Walk" },
            { src: "audio/mixkit-cant-get-you-off-my-mind-1210.mp3", title: "Can't Get You Off My Mind" },
            { src: "audio/mixkit-pop-05-695.mp3", title: "Pop 05" },
            { src: "audio/mixkit-complicated-281.mp3", title: "Complicated" },
            { src: "audio/mixkit-villa-penthouse-339.mp3", title: "Villa Penthouse" },
        ],
        evening: [
            { src: "audio/mixkit-forest-treasure-138.mp3", title: "Forest Treasure" },
            { src: "audio/mixkit-relaxing-in-nature-522.mp3", title: "Relaxing in Nature" },
            { src: "audio/mixkit-romantic-659.mp3", title: "Romantic" },
            { src: "audio/mixkit-romantic-01-752.mp3", title: "Romantic 01" },
            { src: "audio/mixkit-romantic-05-759.mp3", title: "Romantic 05" },
            { src: "audio/mixkit-wedding-01-657.mp3", title: "Wedding 01" },
            { src: "audio/mixkit-serene-view-443.mp3", title: "Serene View" },
        ],
        night: [
            { src: "audio/mixkit-night-sky-hip-hop-970.mp3", title: "Night Sky Hip Hop" },
            { src: "audio/mixkit-silent-descent-614.mp3", title: "Silent Descent" },
            { src: "audio/mixkit-deep-urban-623.mp3", title: "Deep Urban" },
            { src: "audio/mixkit-dirty-thinkin-989.mp3", title: "Dirty Thinkin" },
            { src: "audio/mixkit-cbpd-400.mp3", title: "CBPD 400" },
            { src: "audio/mixkit-praise-the-lord-262.mp3", title: "Praise the Lord" },
        ],
        rainy: [
            { src: "audio/mixkit-praise-the-lord-262.mp3", title: "Praise the Lord" },
            { src: "audio/mixkit-beautiful-dream-493.mp3", title: "Beautiful Dream" },
            { src: "audio/mixkit-serene-view-443.mp3", title: "Serene View" },
            { src: "audio/mixkit-relaxing-in-nature-522.mp3", title: "Relaxing in Nature" },
            { src: "audio/mixkit-forest-treasure-138.mp3", title: "Forest Treasure" },
        ],
        storm: [
            { src: "audio/mixkit-epical-drums-01-676.mp3", title: "Epical Drums" },
            { src: "audio/mixkit-fright-night-871.mp3", title: "Fright Night" },
            { src: "audio/mixkit-piano-horror-671.mp3", title: "Piano Horror" },
            { src: "audio/mixkit-sports-highlights-51.mp3", title: "Sports Highlights" },
        ],
    };

    const state = {
        enabled: false,
        volume: 0.25,
        hidden: false,
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
                    <div class="ambient-player-title">GMBF Adaptive Music</div>
                    <div class="ambient-player-sub">Myanmar time + weather based</div>
                </div>
                <div class="ambient-player-controls">
                    <button type="button" class="ambient-btn ambient-btn-main" id="ambientPlayBtn">
                        <i class="fa-solid fa-play" aria-hidden="true"></i><span>Play</span>
                    </button>
                    <button type="button" class="ambient-btn" id="ambientNextBtn" title="Next track">
                        <i class="fa-solid fa-forward" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="ambient-btn ambient-btn-close" id="ambientCloseBtn" title="Hide player">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div class="ambient-volume">
                <input id="ambientVolume" type="range" min="0" max="1" step="0.01" />
            </div>
            <div class="ambient-status" id="ambientStatus">Music is off. Tap Play to enable.</div>
        `;
        document.body.appendChild(wrap);

        const reopen = document.createElement("button");
        reopen.type = "button";
        reopen.className = "ambient-reopen";
        reopen.id = "ambientReopenBtn";
        reopen.innerHTML = '<i class="fa-solid fa-music" aria-hidden="true"></i><span>Music</span>';
        reopen.setAttribute("aria-label", "Reopen music player");
        document.body.appendChild(reopen);

        const toast = document.createElement("div");
        toast.className = "ambient-toast";
        toast.id = "ambientToast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
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

    function setHidden(hidden) {
        state.hidden = hidden;
        writeLocal(STORAGE.hidden, hidden ? "1" : "0");
        const player = document.querySelector(".ambient-player");
        const reopen = document.getElementById("ambientReopenBtn");
        if (player) player.classList.toggle("is-hidden", hidden);
        if (reopen) reopen.classList.toggle("is-visible", hidden);
    }

    function weatherLabel(bucket) {
        if (bucket === "storm") return "storm";
        if (bucket === "rainy") return "rainy";
        return "clear";
    }

    function periodLabel(period) {
        if (period === "morning") return "morning";
        if (period === "day") return "daytime";
        if (period === "evening") return "evening";
        return "night";
    }

    function showToast(text) {
        const toast = document.getElementById("ambientToast");
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add("is-visible");
        window.clearTimeout(showToast._timer);
        showToast._timer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 3200);
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
            const period = periodFromHour(mmHour());
            const bucket = weatherBucket(state.weatherCode);
            const contextMsg = `Music is playing according to Myanmar ${periodLabel(period)} and ${weatherLabel(bucket)} weather.`;
            updateStatus(
                `Now playing: ${track.title}. ${contextMsg}`
            );
            showToast(contextMsg);
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
        const closeBtn = document.getElementById("ambientCloseBtn");
        const reopenBtn = document.getElementById("ambientReopenBtn");
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

        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                setHidden(true);
            });
        }

        if (reopenBtn) {
            reopenBtn.addEventListener("click", () => {
                setHidden(false);
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
        state.hidden = readLocal(STORAGE.hidden, "0") === "1";

        wireControls();
        setHidden(state.hidden);
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
