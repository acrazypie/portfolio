/* ─── PINNED PROJECTS ──────────────────────────────────────
 * Renders the pinned GitHub repos on the projects page.
 *
 * Data flow:
 *   1. Immediately renders from the committed static JSON
 *      (static/data/pinned.json) — fast, works offline, no CORS.
 *   2. Tries a live refresh from the gh-pinned-repos proxy;
 *      on failure (rate limit / proxy down) it keeps the static data.
 */
(function () {
  const PINS_JSON = "/static/data/pinned.json";
  const PROXY =
    "https://gh-pinned-repos.egoist.sh/user?username=acrazypie";
  const GITHUB_OWNER = "acrazypie";

  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  const STATUS_MESSAGES = {
    loading: "loading…",
    error: "Failed to load projects. Retry",
  };

  /* ─── helpers ─────────────────────────────────────────── */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
  }

  function normalizeStatic(data) {
    if (!data || !Array.isArray(data.repos)) throw new Error("bad json");
    return data.repos.map((r) => ({
      name: r.name || "",
      description: (r.description || "").trim(),
      language: r.language || "",
      homepage: r.homepage || "",
      url: r.url || `https://github.com/${GITHUB_OWNER}/${r.name}`,
    }));
  }

  function normalizeProxy(list) {
    return list.map((r) => ({
      name: r.name || "",
      description: (r.description || "").trim(),
      language: r.language || "",
      homepage: "",
      url: r.url || `https://github.com/${GITHUB_OWNER}/${r.name}`,
    }));
  }

  /* Live proxy data lacks homepage/extra info: keep it from the
     static snapshot so cards stay rich even on refresh. */
  function mergeData(staticRepos, liveRepos) {
    const byName = new Map(liveRepos.map((r) => [r.name, r]));
    return staticRepos.map((r) => ({ ...r, ...byName.get(r.name) }));
  }

  /* ─── rendering ───────────────────────────────────────── */
  function showStatus(message) {
    grid.innerHTML = "";
    const status = el("p", "projects-status", message);
    grid.appendChild(status);
  }

  function showError(message) {
    grid.innerHTML = "";
    const status = el("p", "projects-status", message);
    const retry = el("button", "projects-retry", "↻");
    retry.type = "button";
    retry.addEventListener("click", () => {
      showStatus(STATUS_MESSAGES.loading);
      loadPins();
    });
    grid.append(status, retry);
  }

  function cardFor(repo) {
    const card = el("a", "proj-card");
    card.href = repo.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const head = el("div", "proj-card__head");
    head.append(
      el("span", "proj-card__name", repo.name),
      el("span", "proj-card__arrow", "↗"),
    );

    const desc = el("p", "proj-card__desc", repo.description || "—");

    const langs = el("div", "proj-card__langs");
    if (repo.language) langs.appendChild(el("span", "lang", repo.language));

    const foot = el("div", "proj-card__foot");
    foot.appendChild(
      el("span", "proj-card__repo", `github.com/${GITHUB_OWNER}/${repo.name}`),
    );
    if (repo.homepage) {
      const live = el("a", "proj-card__live", "live ↗");
      live.href = repo.homepage;
      live.target = "_blank";
      live.rel = "noopener noreferrer";
      foot.appendChild(live);
    }

    card.append(head, desc, langs, foot);
    return card;
  }

  function render(repos) {
    grid.innerHTML = "";
    repos.forEach((repo) => grid.appendChild(cardFor(repo)));
  }

  /* ─── data loading ────────────────────────────────────── */
  async function loadStatic() {
    const res = await fetch(PINS_JSON);
    if (!res.ok) throw new Error(`GET ${PINS_JSON} -> ${res.status}`);
    return normalizeStatic(await res.json());
  }

  async function loadLive() {
    const res = await fetchWithTimeout(PROXY, 4000);
    if (!res.ok) throw new Error(`proxy -> ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("bad proxy payload");
    return normalizeProxy(data);
  }

  async function loadPins() {
    let staticRepos;
    try {
      staticRepos = await loadStatic();
    } catch (err) {
      console.error("✗ pinned projects (static):", err);
      showError(STATUS_MESSAGES.error);
      return;
    }

    render(staticRepos);

    try {
      const liveRepos = await loadLive();
      render(mergeData(staticRepos, liveRepos));
    } catch (err) {
      console.warn("✗ pinned projects (live proxy):", err);
    }
  }

  /* ─── init ────────────────────────────────────────────── */
  showStatus(STATUS_MESSAGES.loading);
  loadPins();
})();
