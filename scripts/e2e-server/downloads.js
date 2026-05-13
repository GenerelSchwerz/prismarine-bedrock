"use strict";

const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { CACHE_DIR, ROOT } = require("./paths");
const { mkdir } = require("./fs-utils");

async function resolvePaperDownload(version) {
  const url = `https://fill.papermc.io/v3/projects/paper/versions/${encodeURIComponent(version)}/builds`;
  const data = await fetchJson(url);
  const builds = (Array.isArray(data) ? data : data.builds || []).flat();
  const build = builds.find((candidate) => candidate.channel === "STABLE") || builds[0];
  if (!build || !build.downloads || !build.downloads["server:default"]) {
    throw new Error(`Could not resolve a Paper server jar for ${version}`);
  }
  const download = build.downloads["server:default"];
  return { name: download.name, url: download.url };
}

async function resolvePaperVersion(version) {
  if (version !== "latest") return version;
  const data = await fetchJson("https://fill.papermc.io/v3/projects/paper/versions");
  const first = Array.isArray(data) ? data[0] : data.versions?.[0];
  const id = typeof first === "string" ? first : first?.version?.id || first?.id;
  if (!id) throw new Error("Could not resolve latest Paper version.");
  return id;
}

async function cacheJavaPlugin(plugin) {
  const cached = path.join(CACHE_DIR, "java-plugins", plugin.cacheKey || plugin.name);
  await downloadIfMissing(plugin.url, cached);
  return cached;
}

async function cacheGeyserExtension(extension) {
  const cached = path.join(CACHE_DIR, "geyser-extensions", extension.cacheKey || extension.name);
  await downloadIfMissing(extension.url, cached);
  return cached;
}

async function resolveGeyserExtension(spec) {
  if (spec === "astrox") return resolveGithubReleaseAsset("Eangly99/AstroX-AntiCheat", /\.jar$/);
  if (spec === "boar") return resolveBoarExtension();
  if (spec.startsWith("github:")) return resolveGithubReleaseAsset(spec.slice("github:".length), /\.jar$/);
  if (/^https?:\/\//.test(spec)) {
    const name = path.basename(new URL(spec).pathname);
    return { name, cacheKey: name, url: spec };
  }
  throw new Error(`Unknown Geyser extension spec "${spec}". Use astrox, boar, github:owner/repo, or an artifact URL.`);
}

async function resolveBoarExtension() {
  const versions = await fetchJson("https://api.modrinth.com/v2/project/boar/version");
  const file = versions
    .flatMap((version) => version.files || [])
    .find((candidate) => candidate.primary && candidate.url && /\.jar$/i.test(candidate.filename))
    || versions.flatMap((version) => version.files || []).find((candidate) => candidate.url && /\.jar$/i.test(candidate.filename));
  if (!file) throw new Error("Could not find a Boar jar in Modrinth project boar.");
  return { name: file.filename, cacheKey: `boar-${file.hashes?.sha512 || file.url.split("/").at(-2) || "latest"}.jar`, url: file.url };
}

async function resolveGithubReleaseAsset(repo, assetPattern) {
  const release = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`);
  const asset = (release.assets || []).find((candidate) => assetPattern.test(candidate.name));
  if (!asset || !asset.browser_download_url) {
    throw new Error(`Could not find a matching release asset for ${repo}`);
  }
  return { name: asset.name, cacheKey: `${repo.replace(/[\\/]/g, "__")}__${asset.name}`, url: asset.browser_download_url };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "bedrock-test-e2e-setup" } });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  return response.json();
}

async function downloadIfMissing(url, destination) {
  if (fs.existsSync(destination)) {
    console.log(`Using cached ${path.relative(ROOT, destination)}`);
    return;
  }

  await mkdir(path.dirname(destination));
  console.log(`Downloading ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": "bedrock-test-e2e-setup" } });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination));
}

module.exports = {
  resolvePaperDownload,
  resolvePaperVersion,
  resolveGithubReleaseAsset,
  resolveGeyserExtension,
  cacheGeyserExtension,
  cacheJavaPlugin,
  downloadIfMissing
};
