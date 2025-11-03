document.addEventListener("DOMContentLoaded", () => {
    const langToggle = document.getElementById("lang-toggle");
    const langMenu = document.getElementById("lang-menu");

    // --- Apply saved language on load ---
    const savedLang =
        localStorage.getItem("lang") ||
        navigator.language.split("-")[0] ||
        "it";
    setLanguage(savedLang);

    if (!langToggle || !langMenu) return;

    // --- Toggle dropdown ---
    langToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        langMenu.classList.toggle("show");
    });

    // --- Close when clicking outside ---
    document.addEventListener("click", (e) => {
        if (!langMenu.contains(e.target) && !langToggle.contains(e.target)) {
            langMenu.classList.remove("show");
        }
    });

    // --- Handle language click ---
    langMenu.querySelectorAll("li").forEach((item) => {
        item.addEventListener("click", () => {
            const lang = item.dataset.lang;
            setLanguage(lang);
            langMenu.classList.remove("show");
        });
    });
});

// --- Set language globally ---
async function setLanguage(lang) {
    localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("lang", lang);

    try {
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) throw new Error(`Missing ${lang}.json`);
        const translations = await response.json();
        applyTranslations(translations);
        console.log(`✅ Language set to ${lang}`);
    } catch (error) {
        console.error("❌ Translation load failed:", error);
    }
}

// --- Apply text to all elements with [data-i18n] ---
function applyTranslations(translations) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (translations[key]) {
            if (el.placeholder !== undefined && el.tagName === "INPUT") {
                el.placeholder = translations[key];
            } else {
                el.textContent = translations[key];
            }
        }
    });
}
