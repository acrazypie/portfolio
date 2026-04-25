/* ─── INTERNATIONALIZATION (i18n) ────────────────────────── */

const LANGUAGES = {
    it: { name: "Italiano", flag: "🇮🇹" },
    en: { name: "English", flag: "🇬🇧" },
    fr: { name: "Français", flag: "🇫🇷" },
    de: { name: "Deutsch", flag: "🇩🇪" },
    es: { name: "Español", flag: "🇪🇸" },
    ja: { name: "日本語", flag: "🇯🇵" },
};

document.addEventListener("DOMContentLoaded", () => {
    initializeLanguageSelector();

    // Apply saved language on load
    const savedLang = localStorage.getItem("lang") || getDefaultLanguage();
    applyLanguage(savedLang);
});

function getDefaultLanguage() {
    const browserLang = navigator.language.split("-")[0];
    return LANGUAGES.hasOwnProperty(browserLang) ? browserLang : "en";
}

function initializeLanguageSelector() {
    const navLinks = document.querySelector(".nav__links");
    if (!navLinks) return;

    // Create language selector item
    const langItem = document.createElement("li");
    langItem.className = "nav-lang";
    langItem.innerHTML = `
    <button class="lang-toggle" id="lang-toggle" aria-label="Change language">
      <span class="lang-current">EN</span>
    </button>
    <ul class="lang-menu" id="lang-menu">
      ${Object.entries(LANGUAGES)
          .map(
              ([code, { name, flag }]) =>
                  `<li data-lang="${code}" title="${name}" role="button">${flag} ${code.toUpperCase()}</li>`,
          )
          .join("")}
    </ul>
  `;
    navLinks.appendChild(langItem);

    // Get current language
    const currentLang = localStorage.getItem("lang") || getDefaultLanguage();
    updateLanguageDisplay(currentLang);

    // Setup event listeners
    const toggle = document.getElementById("lang-toggle");
    const menu = document.getElementById("lang-menu");
    const items = menu.querySelectorAll("li");

    // Toggle menu
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove("show");
        }
    });

    // Handle language selection
    items.forEach((item) => {
        item.addEventListener("click", () => {
            const lang = item.dataset.lang;
            localStorage.setItem("lang", lang);
            updateLanguageDisplay(lang);
            applyLanguage(lang);
            menu.classList.remove("show");
        });
    });
}

function updateLanguageDisplay(lang) {
    const toggle = document.getElementById("lang-toggle");
    if (toggle) {
        toggle.querySelector(".lang-current").textContent = lang.toUpperCase();
    }
}

// --- Set language globally ---
function applyLanguage(lang) {
    document.documentElement.setAttribute("lang", lang);

    fetch(`lang/${lang}.json`)
        .then((response) => {
            if (!response.ok) throw new Error(`Missing ${lang}.json`);
            return response.json();
        })
        .then((translations) => {
            applyTranslations(translations);
            console.log(`✅ Language set to: ${lang}`);
        })
        .catch((error) => {
            console.error("❌ Translation load failed:", error);
        });
}

// --- Apply text to all elements with [data-i18n] ---
function applyTranslations(translations) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (translations[key]) {
            if (el.tagName === "INPUT" && el.placeholder !== undefined) {
                el.placeholder = translations[key];
            } else {
                // Support HTML content (like <strong> tags)
                el.innerHTML = translations[key];
            }
        }
    });
}
