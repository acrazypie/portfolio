async function populateProjectCard({ owner, repo, thumb, demo, token } = {}) {
  const card = document.querySelector(`#${repo}-card`);
  if (!card) return;

  const nameEl = card.querySelector(".repo-name");
  const descEl = card.querySelector(".repo-desc");
  const thumbEl = card.querySelector(".thumb");
  const langEl = card.querySelector(".lang");
  const starsEl = card.querySelector(".stars");
  const forksEl = card.querySelector(".forks");
  const updatedEl = card.querySelector(".updated");
  const repoLink = card.querySelector(".repo-link");
  const demoBtn = card.querySelector(".demo-link");

  // Configura link
  repoLink.href = `https://github.com/${owner}/${repo}`;
  if (demo) {
    demoBtn.href = demo;
    demoBtn.classList.remove("disabled");
  }

  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = "token " + token;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();

    nameEl.textContent = data.full_name;
    descEl.textContent = data.description || descEl.textContent;
    langEl.textContent = data.language || "—";
    starsEl.textContent = `★ ${data.stargazers_count}`;
    forksEl.textContent = `⑂ ${data.forks_count}`;
    updatedEl.textContent =
      "Aggiornato " + new Date(data.updated_at).toLocaleDateString();

    // Immagine og: miglior thumbnail
    const ogImage = `https://opengraph.githubassets.com/1/${owner}/${repo}`;
    thumbEl.style.backgroundImage = `url(${ogImage})`;

    // Topics (tags)
    if (Array.isArray(data.topics) && data.topics.length > 0) {
      const tags = card.querySelector(".tags");
      tags.innerHTML = "";
      data.topics.forEach((topic) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = topic;
        tags.appendChild(span);
      });
    }
  } catch (err) {
    console.error("Errore nel caricamento del repo:", err);
    nameEl.textContent = `${owner}/${repo}`;
    descEl.textContent = "Impossibile caricare i dati del repository.";
  }
}

// Popola automaticamente le tue card
populateProjectCard({ owner: "acrazypie", repo: "portfolio" });
populateProjectCard({
  owner: "acrazypie",
  repo: "attivita_ufo",
  thumb: "./assets/images/attivita_ufo-thumb.png",
});
populateProjectCard({
  owner: "acrazypie",
  repo: "Sudoku-App",
  demo: "https://github.com/acrazypie/Sudoku-App/releases",
});
populateProjectCard({ owner: "acrazypie", repo: "E-Commerce" });
populateProjectCard({ owner: "acrazypie", repo: "AI-Prompt-API" });
