document.addEventListener("DOMContentLoaded", async () => {
    const body = document.body;
    const lightBtn = document.getElementById("light-mode");
    const darkBtn = document.getElementById("dark-mode");

    // Legge il tema salvato (o imposta dark di default)
    const savedTheme = localStorage.getItem("theme") || "dark";
    body.classList.toggle("light-theme", savedTheme === "light");

    if (savedTheme === "light") {
        lightBtn.disabled = true;
        darkBtn.disabled = false;
        darkBtn.classList.remove("selected");
        lightBtn.classList.add("selected");
    } else {
        darkBtn.disabled = true;
        lightBtn.disabled = false;
        lightBtn.classList.remove("selected");
        darkBtn.classList.add("selected");
    }

    // Funzione per cambiare tema
    const setTheme = (theme) => {
        const isLight = theme === "light";
        body.classList.toggle("light-theme", isLight);
        localStorage.setItem("theme", theme);

        lightBtn.disabled = isLight;
        darkBtn.disabled = !isLight;
        lightBtn.classList.toggle("selected", isLight);
        darkBtn.classList.toggle("selected", !isLight);
    };

    // Event listeners
    lightBtn.addEventListener("click", () => setTheme("light"));
    darkBtn.addEventListener("click", () => setTheme("dark"));
});
