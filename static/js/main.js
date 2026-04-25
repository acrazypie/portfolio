/* ─── NAV: scroll state ──────────────────────────────────── */
const nav = document.getElementById("nav");

window.addEventListener(
    "scroll",
    () => {
        nav.classList.toggle("scrolled", window.scrollY > 20);
    },
    { passive: true },
);

/* ─── NAV: mobile burger ─────────────────────────────────── */
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");

burger.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    burger.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
});

function closeDrawer() {
    drawer.classList.remove("open");
    burger.classList.remove("open");
    document.body.style.overflow = "";
}

/* ─── THEME TOGGLE ──────────────────────────────────────── */
function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById("theme-toggle");
    const themeToggleMobile = document.getElementById("theme-toggle-mobile");
    const icon = theme === "dark" ? "🌙" : "☀️";
    if (themeToggle) {
        themeToggle.querySelector(".theme-toggle-icon").textContent = icon;
    }
    if (themeToggleMobile) {
        themeToggleMobile.querySelector(".drawer-theme-icon").textContent = icon;
    }
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
}

/* ─── MOBILE LANGUAGE SELECTOR ─────────────────────────────── */
function initializeMobileLang() {
    const langToggleMobile = document.getElementById("lang-toggle-mobile");
    const langMenuMobile = document.getElementById("lang-menu-mobile");
    if (!langToggleMobile || !langMenuMobile) return;

    const currentLang = localStorage.getItem("lang") || "en";
    langToggleMobile.querySelector(".drawer-lang-current").textContent =
        currentLang.toUpperCase();

    langToggleMobile.addEventListener("click", (e) => {
        e.stopPropagation();
        langMenuMobile.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (
            !langMenuMobile.contains(e.target) &&
            !langToggleMobile.contains(e.target)
        ) {
            langMenuMobile.classList.remove("show");
        }
    });

    langMenuMobile.querySelectorAll("li").forEach((item) => {
        item.addEventListener("click", () => {
            const lang = item.dataset.lang;
            localStorage.setItem("lang", lang);
            langToggleMobile.querySelector(".drawer-lang-current").textContent =
                lang.toUpperCase();
            if (window.applyLanguage) {
                window.applyLanguage(lang);
            } else if (typeof applyLanguage === "function") {
                applyLanguage(lang);
            } else {
                document.documentElement.setAttribute("lang", lang);
                fetch(`lang/${lang}.json`)
                    .then((r) => r.json())
                    .then((t) => {
                        document
                            .querySelectorAll("[data-i18n]")
                            .forEach((el) => {
                                const key = el.getAttribute("data-i18n");
                                if (t[key]) el.innerHTML = t[key];
                            });
                    });
            }
            langMenuMobile.classList.remove("show");
            closeDrawer();
        });
    });
}

/* ─── INITIALIZE ──────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();

    const themeToggleDesktop = document.getElementById("theme-toggle");
    const themeToggleMobile = document.getElementById("theme-toggle-mobile");
    if (themeToggleDesktop) {
        themeToggleDesktop.addEventListener("click", toggleTheme);
    }
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener("click", toggleTheme);
    }

    initializeMobileLang();
});

/* ─── SMOOTH SCROLL ──────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (href === "#") return;
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    });
});

/* ─── SCROLL REVEAL ──────────────────────────────────────── */
const io = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                io.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
    },
);

document.querySelectorAll(".r, .r-group").forEach((el) => io.observe(el));