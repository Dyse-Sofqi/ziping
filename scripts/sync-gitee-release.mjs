#!/usr/bin/env node
/**
 * Mirror one plugin release to the Gitee mirror repo.
 *
 * Used by .github/workflows/release.yml right after `gh release create`, and can
 * also be run by hand to backfill a release:
 *
 *   GITEE_TOKEN=xxxx node scripts/sync-gitee-release.mjs \
 *     --tag 1.4.3 --notes-file release-notes.md
 *
 * The script is idempotent: an existing Gitee release is updated instead of
 * recreated, and already-uploaded assets are skipped unless --overwrite is given.
 *
 * Options
 *   --tag <tag>          Release tag (default: $GITHUB_REF_NAME, else manifest.json version)
 *   --gitee-repo <o/r>   Gitee repo (default: $GITEE_REPO or sofqi/ziping)
 *   --assets <a,b,c>     Files to attach (default: main.js,manifest.json,styles.css)
 *   --notes-file <path>  Markdown body for the release (default: "Release <tag>")
 *   --overwrite          Re-upload assets that already exist on the Gitee release
 *   --dry-run            Print the planned changes without calling the write APIs
 *
 * Requires Node 18+ (global fetch/FormData/Blob). The token needs the `projects`
 * scope and must never be printed.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_REPO = "sofqi/ziping";
const DEFAULT_ASSETS = ["main.js", "manifest.json", "styles.css"];
const API_ROOT = "https://gitee.com/api/v5/repos";

const argv = process.argv.slice(2);
function opt(name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
}
const has = (name) => argv.includes(name);

const DRY_RUN = has("--dry-run");
const OVERWRITE = has("--overwrite");
const TOKEN = process.env.GITEE_TOKEN;
const REPO = opt("--gitee-repo", process.env.GITEE_REPO || DEFAULT_REPO);
const API = `${API_ROOT}/${REPO}`;
const ASSETS = opt("--assets", DEFAULT_ASSETS.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
const NOTES_FILE = opt("--notes-file", null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[gitee-sync]`, ...a);

async function resolveTag() {
  const explicit = opt("--tag", null);
  if (explicit) return explicit;
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  return manifest.version;
}

async function request(method, url, { json, form } = {}, tries = 5) {
  for (let attempt = 1; ; attempt++) {
    try {
      const init = { method, headers: { "User-Agent": "ziping-gitee-sync" } };
      if (json) {
        init.headers["Content-Type"] = "application/json; charset=utf-8";
        init.body = JSON.stringify(json);
      }
      if (form) init.body = form;
      const res = await fetch(url, init);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      if (!res.ok && attempt < tries && (res.status >= 500 || res.status === 429)) {
        log(`retrying ${method} ${url.split("?")[0]} after HTTP ${res.status} (attempt ${attempt})`);
        await sleep(3000 * attempt);
        continue;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      if (attempt >= tries) throw e;
      log(`retrying ${method} ${url.split("?")[0]} after ${e.message} (attempt ${attempt})`);
      await sleep(3000 * attempt);
    }
  }
}

async function listReleases() {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await request("GET", `${API}/releases?access_token=${TOKEN}&per_page=100&page=${page}`);
    if (!r.ok) throw new Error(`listing Gitee releases failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
    all.push(...r.data);
    if (r.data.length < 100) break;
  }
  return all;
}

async function listAttachFiles(releaseId) {
  const r = await request("GET", `${API}/releases/${releaseId}/attach_files?access_token=${TOKEN}`);
  if (!r.ok) throw new Error(`listing attachments of release ${releaseId} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
  return r.data || [];
}

async function main() {
  if (!TOKEN) {
    console.error("[gitee-sync] GITEE_TOKEN is not set; aborting");
    process.exit(1);
  }
  const tag = await resolveTag();
  const releaseName = opt("--name", tag);

  let body = `Release ${tag}`;
  if (NOTES_FILE) {
    const raw = (await readFile(NOTES_FILE, "utf8")).trim();
    if (raw) body = raw;
  }
  if (!body.trim()) body = `Release ${tag}`; // Gitee rejects an empty description

  // Fail early if a build artifact is missing, instead of publishing a partial release.
  for (const file of ASSETS) {
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) throw new Error(`asset not found in workspace: ${file}`);
  }

  log(`repo=${REPO} tag=${tag} assets=${ASSETS.join(", ")}${DRY_RUN ? " (dry run)" : ""}`);

  const releases = await listReleases();
  let release = releases.find((r) => r.tag_name === tag);
  const existingAssets = new Map((release?.assets || []).map((a) => [a.name, a]));
  // The release payload only carries asset names, so ids come from the
  // attach_files endpoint when an existing asset has to be replaced.
  let attachFiles = OVERWRITE && release ? await listAttachFiles(release.id) : [];

  if (!release) {
    if (DRY_RUN) {
      log(`would create release "${releaseName}" for tag ${tag}`);
    } else {
      const created = await request("POST", `${API}/releases`, {
        json: {
          access_token: TOKEN,
          tag_name: tag,
          name: releaseName,
          body,
          target_commitish: "main",
          prerelease: false,
        },
      });
      if (!created.ok || !created.data?.id) {
        throw new Error(`creating Gitee release failed: HTTP ${created.status} ${JSON.stringify(created.data)}`);
      }
      release = created.data;
      log(`created release ${tag} (id=${release.id})`);
    }
  } else {
    const changed = release.name !== releaseName || (release.body || "") !== body;
    if (DRY_RUN) {
      log(`would ${changed ? "update" : "keep"} release ${tag} (id=${release.id})`);
    } else if (changed) {
      const updated = await request("PATCH", `${API}/releases/${release.id}`, {
        json: { access_token: TOKEN, tag_name: tag, name: releaseName, body, prerelease: false },
      });
      if (!updated.ok) throw new Error(`updating Gitee release failed: HTTP ${updated.status} ${JSON.stringify(updated.data)}`);
      log(`updated release ${tag} (id=${release.id})`);
    } else {
      log(`release ${tag} already in sync (id=${release.id})`);
    }
  }

  let uploaded = 0;
  let skipped = 0;
  for (const file of ASSETS) {
    const existing = existingAssets.get(file);
    if (existing && !OVERWRITE) {
      log(`asset ${file} already attached; skipping (use --overwrite to replace it)`);
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      log(`would upload ${file}${existing ? " (replacing existing)" : ""}`);
      continue;
    }
    if (existing) {
      const attach = attachFiles.find((f) => f.name === file);
      if (!attach) throw new Error(`cannot find the attachment id of ${file}; delete it on Gitee and retry`);
      const del = await request("DELETE", `${API}/releases/${release.id}/attach_files/${attach.id}?access_token=${TOKEN}`);
      if (!del.ok) throw new Error(`deleting old asset ${file} failed: HTTP ${del.status} ${JSON.stringify(del.data)}`);
    }
    const buf = await readFile(file);
    const form = new FormData();
    form.append("access_token", TOKEN);
    form.append("file", new Blob([buf]), path.basename(file));
    const up = await request("POST", `${API}/releases/${release.id}/attach_files`, { form });
    if (!up.ok) throw new Error(`uploading ${file} failed: HTTP ${up.status} ${JSON.stringify(up.data)}`);
    log(`uploaded ${file} (${buf.length} bytes)`);
    uploaded++;
  }

  log(`done: ${uploaded} uploaded, ${skipped} already present`);
  log(`release page: https://gitee.com/${REPO}/releases/tag/${tag}`);
}

main().catch((e) => {
  console.error(`[gitee-sync] FAILED: ${e.message}`);
  process.exit(1);
});
