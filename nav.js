(() => {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primary-nav");
    const backdrop = document.getElementById("nav-backdrop");

    if (!header || !toggle || !nav) return;

    function setOpen(open) {
        header.classList.toggle("nav-open", open);
        document.body.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        if (backdrop) {
            backdrop.setAttribute("aria-hidden", String(!open));
        }
    }

    toggle.addEventListener("click", () => {
        setOpen(!header.classList.contains("nav-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setOpen(false));
    });

    if (backdrop) {
        backdrop.addEventListener("click", () => setOpen(false));
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
    });

    const mq = window.matchMedia("(min-width: 993px)");
    function closeIfDesktop() {
        if (mq.matches) setOpen(false);
    }
    mq.addEventListener("change", closeIfDesktop);
})();
