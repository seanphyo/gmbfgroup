(() => {
    const STORAGE_KEY = "gmbf_magic_mode";
    const SEEN_HINT_KEY = "gmbf_magic_hint_seen";
    const MAGIC_CLASS = "magic-on";

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

    function applyMagic(enabled, btn) {
        document.body.classList.toggle(MAGIC_CLASS, enabled);
        if (!btn) return;
        btn.classList.toggle("is-active", enabled);
        btn.setAttribute("aria-pressed", String(enabled));
        btn.setAttribute(
            "aria-label",
            enabled ? "Turn off magic show mode" : "Turn on magic show mode"
        );
        btn.title = enabled ? "Magic Show: ON" : "Magic Show: OFF";
        btn.innerHTML = enabled
            ? '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span class="magic-toggle-label">Magic ON</span>'
            : '<i class="fa-regular fa-star" aria-hidden="true"></i><span class="magic-toggle-label">Magic OFF</span>';
    }

    function showHint(btn) {
        if (!btn || readLocal(SEEN_HINT_KEY, "0") === "1") return;
        const hint = document.createElement("div");
        hint.className = "magic-hint";
        hint.id = "magicHint";
        hint.textContent = "Magic show is live. Tap toggle to switch.";
        document.body.appendChild(hint);

        const hide = () => {
            hint.classList.remove("is-visible");
            window.setTimeout(() => hint.remove(), 260);
        };

        window.setTimeout(() => hint.classList.add("is-visible"), 120);
        window.setTimeout(hide, 6200);
        btn.addEventListener(
            "click",
            () => {
                writeLocal(SEEN_HINT_KEY, "1");
                hide();
            },
            { once: true }
        );
    }

    function init() {
        const themeBtn = document.getElementById("theme-toggle");
        if (!themeBtn) return;

        const magicBtn = document.createElement("button");
        magicBtn.type = "button";
        magicBtn.className = "magic-toggle";
        magicBtn.id = "magic-toggle";

        const stored = readLocal(STORAGE_KEY, "");
        const initial = stored === "" ? true : stored === "1";
        if (stored === "") {
            writeLocal(STORAGE_KEY, "1");
        }
        applyMagic(initial, magicBtn);

        magicBtn.addEventListener("click", () => {
            const next = !document.body.classList.contains(MAGIC_CLASS);
            writeLocal(STORAGE_KEY, next ? "1" : "0");
            applyMagic(next, magicBtn);
            writeLocal(SEEN_HINT_KEY, "1");
        });

        themeBtn.insertAdjacentElement("beforebegin", magicBtn);
        showHint(magicBtn);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
