document.addEventListener("DOMContentLoaded", async () => {
    const langBtn = document.getElementById("lang-toggle");

    let savedLang =
        localStorage.getItem("lang") ||
        navigator.language.split("-")[0] ||
        "it";
    const response = await fetch("/lang.json");
    const translations = await response.json();

    const updateTexts = (lang) => {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
    };

    updateTexts(savedLang);

    if (langBtn) {
        langBtn.addEventListener("click", () => {
            savedLang = savedLang === "it" ? "en" : "it";
            localStorage.setItem("lang", savedLang);
            updateTexts(savedLang);
        });
    }
});
