#!/usr/bin/env node
/*
 * Generate static/data/pinned.json from the pinned repositories of a GitHub profile.
 *
 * Strategy:
 *   1. Scrape the public profile HTML (server-side, no CORS) to get the
 *      currently pinned repos (the REST API does not expose pins).
 *   2. Enrich each repo via the GitHub REST API (homepage, topics, stars).
 *   3. If a pinned repo has no description, fall back to the first meaningful
 *      line of its README.
 *
 * Usage:
 *   node scripts/generate-pins.mjs
 *
 * Optional env vars:
 *   GH_OWNER   GitHub username to scrape (default: acrazypie)
 *   GH_TOKEN   GitHub token to avoid rate limits (recommended for CI)
 *   OUT_FILE   Output path (default: static/data/pinned.json)
 */
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = process.env.GH_OWNER || "acrazypie";
const OUT_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  process.env.OUT_FILE || "static/data/pinned.json",
);

const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "pins-generator",
  ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
};

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "pins-generator", Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

function escapeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripTags(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse the pinned repositories section out of a GitHub profile page. */
function parsePinnedProfile(html) {
  const start = html.indexOf("js-pinned-items-reorder-container");
  const region =
    start !== -1 ? html.slice(start, start + 60_000) : html;

  const repos = [];
  const re = /pinned-item-list-item-content[^>]*>([\s\S]*?)(?=class="pinned-item-list-item-content"|$)/g;
  let match;
  while ((match = re.exec(region)) !== null) {
    const chunk = match[1];
    const nameMatch = chunk.match(/href="\/[^/]+\/([A-Za-z0-9_.-]+)"/);
    const descMatch = chunk.match(
      /class="[^"]*pinned-item-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/,
    );
    const langMatch = chunk.match(/programmingLanguage[^>]*>([^<]+)</);
    if (!nameMatch) continue;

    repos.push({
      name: escapeHtml(nameMatch[1]),
      description: descMatch ? stripTags(escapeHtml(descMatch[1])) : "",
      language: langMatch ? escapeHtml(langMatch[1]).trim() : "",
    });
  }
  return repos;
}

/** Grab the first meaningful line of a repo README (fallback description). */
async function readmeFallback(repo) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${repo.name}/HEAD/README.md`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "pins-generator" } });
    if (!res.ok) return "";
    const text = await res.text();
    const line = text
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.replace(/^\s*#+\s*/, "").trim())
      .find((l) => l.length > 10 && !/^```/.test(l));
    return line || "";
  } catch {
    return "";
  }
}

async function main() {
  const profileHtml = await fetchText(`https://github.com/${OWNER}`);
  const pinned = parsePinnedProfile(profileHtml);
  if (pinned.length === 0) {
    throw new Error(
      `No pinned repositories found for "${OWNER}". Check GH_OWNER / profile HTML structure.`,
    );
  }

  const repos = [];
  for (const pin of pinned) {
    let description = pin.description;
    let homepage = "";
    let topics = [];
    let stars = 0;

    try {
      const info = await fetchJson(
        `https://api.github.com/repos/${OWNER}/${encodeURIComponent(pin.name)}`,
      );
      homepage = info.homepage || "";
      topics = Array.isArray(info.topics) ? info.topics : [];
      stars = info.stargazers_count || 0;
      if (!description && info.description) description = info.description;
    } catch (err) {
      console.warn(`  ! enrich failed for ${pin.name}: ${err.message}`);
    }

    if (!description) description = await readmeFallback(pin);

    repos.push({
      name: pin.name,
      full_name: `${OWNER}/${pin.name}`,
      description,
      language: pin.language,
      homepage,
      url: `https://github.com/${OWNER}/${pin.name}`,
      topics,
      stars,
    });
  }

  const output = {
    owner: OWNER,
    generated_at: new Date().toISOString(),
    source: "github-profile-scrape",
    repos,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n");
  console.log(`✓ wrote ${repos.length} pinned repos to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("✗ generate-pins failed:", err.message);
  process.exit(1);
});
