/* ─── PINNED PROJECTS ──────────────────────────────────────
 * Renders the pinned GitHub repos in the root page's projects section.
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

  /* Repos with a case study page on this site. Add an entry here
     (and a projects/<name>/index.html page) to link a new one. */
  const CASE_STUDIES = {
    wayl: "/projects/wayl",
  };

  const projectList = document.getElementById("projects-list");
  if (!projectList) return;

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
    projectList.innerHTML = "";
    projectList.appendChild(el("p", "project__desc", message));
  }

  function showError(message) {
    projectList.innerHTML = "";
    const status = el("p", "project__desc", message);
    const retry = el("button", "project__retry", "↻");
    retry.type = "button";
    retry.addEventListener("click", () => {
      showStatus(STATUS_MESSAGES.loading);
      loadPins();
    });
    projectList.append(status, retry);
  }

  function projectFor(repo, index) {
    const project = el("article", "project");
    const repoLink = el("a", "project__repo-link");
    repoLink.href = repo.url;
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";
    repoLink.setAttribute("aria-label", `View ${repo.name} on GitHub`);

    const meta = el("div", "project__meta");
    meta.appendChild(
      el("div", "project__num", String(index + 1).padStart(3, "0")),
    );

    const body = el("div", "project__body");
    body.appendChild(el("div", "project__title", repo.name));
    body.appendChild(
      el("div", "project__desc", repo.description || "—"),
    );
    const langs = el("div", "project__langs");
    if (repo.language) langs.appendChild(el("span", "lang", repo.language));
    body.appendChild(langs);

    const actions = el("div", "project__actions");
    const caseStudy = CASE_STUDIES[repo.name.toLowerCase()];
    if (caseStudy) {
      project.classList.add("project--case");
      const link = el("a", "project__case");
      link.href = caseStudy;
      link.setAttribute("aria-label", `Read the ${repo.name} case study`);
      const label = el("span", "", "case study");
      label.setAttribute("data-i18n", "projects.case_study");
      link.append(label, el("span", "project__case-arrow", "→"));
      actions.appendChild(link);
    }
    actions.appendChild(el("span", "project__arrow", "↗"));
    if (repo.homepage) {
      const website = el("a", "project__play", "▶");
      website.href = repo.homepage;
      website.target = "_blank";
      website.rel = "noopener noreferrer";
      website.title = `Visit ${repo.name} website`;
      website.setAttribute("aria-label", `Visit ${repo.name} website`);
      actions.appendChild(website);
    }

    project.append(repoLink, meta, body, actions);
    return project;
  }

  function render(repos) {
    projectList.innerHTML = "";
    repos.forEach((repo, index) =>
      projectList.appendChild(projectFor(repo, index)),
    );
    // Cards can render after the language file loaded: translate them too.
    if (window.translateElement) window.translateElement(projectList);
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
