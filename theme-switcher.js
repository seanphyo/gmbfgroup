(() => {
    const STORAGE_KEY = "gmbf_theme";
    const NIGHT_CLASS = "theme-night";

    function getStoredTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }

    function applyTheme(theme) {
        const isNight = theme === "night";
        document.body.classList.toggle(NIGHT_CLASS, isNight);
        document.documentElement.setAttribute("data-theme", isNight ? "night" : "day");

        const btn = document.getElementById("theme-toggle");
        if (btn) {
            btn.innerHTML = isNight
                ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
                : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
            btn.setAttribute(
                "aria-label",
                isNight ? "Switch to day mode" : "Switch to night mode"
            );
            btn.setAttribute(
                "title",
                isNight ? "Switch to day mode" : "Switch to night mode"
            );
        }
    }

    function initialTheme() {
        const stored = getStoredTheme();
        if (stored === "night" || stored === "day") return stored;
        return "day";
    }

    function wireToggle() {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const next = document.body.classList.contains(NIGHT_CLASS)
                ? "day"
                : "night";
            applyTheme(next);
            saveTheme(next);
        });
    }

    const theme = initialTheme();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            applyTheme(theme);
            wireToggle();
        });
    } else {
        applyTheme(theme);
        wireToggle();
    }
})();
