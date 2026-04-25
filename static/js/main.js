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
    themeToggle.querySelector(".theme-toggle-icon").textContent =
        theme === "dark" ? "🌙" : "☀️";
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
}

document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
initializeTheme();

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
