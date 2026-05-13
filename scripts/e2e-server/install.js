"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { E2E_ROOT, CACHE_DIR, RUNS_DIR, ENDSTONE_TEMPLATE_DIR, ROOT } = require("./paths");
const { mkdir, replaceDirectory, safeRemove, writeText, copyIfExists } = require("./fs-utils");
const { runChecked, venvPythonBin, endstoneBin } = require("./process-utils");
const {
  javaServerProperties,
  paperGlobalConfig,
  geyserConfig,
  javaOpsJson,
  endstoneServerProperties,
  worldName
} = require("./config");
const {
  resolvePaperDownload,
  resolvePaperVersion,
  resolveGithubReleaseAsset,
  resolveGeyserExtension,
  cacheGeyserExtension,
  cacheJavaPlugin,
  downloadIfMissing
} = require("./downloads");

async function installTargets(targetInstances, options) {
  await mkdir(E2E_ROOT);
  await mkdir(CACHE_DIR);

  for (const instance of targetInstances) {
    if (instance.type === "java") await installJavaGeyser(instance, options);
    if (instance.type === "endstone") await installEndstone(instance, options);
  }
}

async function cleanTargets(targetInstances, options) {
  const scope = options.cleanScope || "all";
  if (scope === "logs" || scope === "all") {
    await safeRemove(RUNS_DIR);
    await mkdir(RUNS_DIR);
    console.log(`Cleaned e2e logs: ${path.relative(ROOT, RUNS_DIR)}`);
  }

  if (scope === "worlds" || scope === "all") {
    for (const instance of targetInstances) await cleanInstanceWorlds(instance, options);
  }
}

async function installJavaGeyser(instance, options) {
  const paperVersion = await resolvePaperVersion(options.paperVersion);
  instance.paperVersion = paperVersion;
  console.log(`Preparing ${instance.name}: Paper ${paperVersion} with Geyser, Floodgate, and ViaVersion...`);
  await mkdir(instance.dir);
  await mkdir(path.join(instance.dir, "plugins"));

  const paper = await resolvePaperDownload(paperVersion);
  const paperCache = path.join(CACHE_DIR, "paper", paperVersion, paper.name);
  await downloadIfMissing(paper.url, paperCache);
  await fsp.copyFile(paperCache, path.join(instance.dir, "paper.jar"));

  const geyserJar = path.join(CACHE_DIR, "geyser", "Geyser-Spigot.jar");
  const floodgateJar = path.join(CACHE_DIR, "geyser", "Floodgate-Spigot.jar");
  const viaVersion = await resolveGithubReleaseAsset("ViaVersion/ViaVersion", /^ViaVersion-.+\.jar$/);
  const viaVersionJar = await cacheJavaPlugin(viaVersion);
  await downloadIfMissing("https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot", geyserJar);
  await downloadIfMissing("https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot", floodgateJar);
  await fsp.copyFile(geyserJar, path.join(instance.dir, "plugins", "Geyser-Spigot.jar"));
  await fsp.copyFile(floodgateJar, path.join(instance.dir, "plugins", "Floodgate-Spigot.jar"));
  await fsp.copyFile(viaVersionJar, path.join(instance.dir, "plugins", viaVersion.name));

  await writeText(path.join(instance.dir, "eula.txt"), "eula=true\n");
  await writeText(path.join(instance.dir, "server.properties"), javaServerProperties(instance, options));
  await writeText(path.join(instance.dir, "config", "paper-global.yml"), paperGlobalConfig());
  await writeText(path.join(instance.dir, "ops.json"), javaOpsJson());
  await mkdir(path.join(instance.dir, "plugins", "Geyser-Spigot"));
  await writeText(path.join(instance.dir, "plugins", "Geyser-Spigot", "config.yml"), geyserConfig(instance, options));
  await installGeyserExtensions(instance, options);
}

async function installEndstone(instance, options) {
  console.log(`Preparing ${instance.name}: uv-managed Endstone Bedrock server...`);
  await mkdir(instance.dir);

  const venv = path.join(instance.dir, ".venv");
  if (!fs.existsSync(venv)) {
    await runChecked("uv", ["venv", venv], instance.dir);
  }

  const source = process.env.E2E_ENDSTONE_PACKAGE || "endstone";
  await runChecked("uv", ["pip", "install", "--python", venvPythonBin(instance), "--upgrade", source], instance.dir);
  await ensureEndstoneTemplate(instance, options);
  await copyEndstoneTemplate(instance);
  await writeText(path.join(instance.dir, "server.properties"), endstoneServerProperties(instance, options));
}

async function installGeyserExtensions(instance, options) {
  const extensions = selectedGeyserExtensions(instance, options);
  const extensionsDir = path.join(instance.dir, "plugins", "Geyser-Spigot", "extensions");
  await replaceDirectory(extensionsDir);
  if (extensions.length === 0) return;

  for (const spec of extensions) {
    const extension = await resolveGeyserExtension(spec);
    const cached = await cacheGeyserExtension(extension);
    await fsp.copyFile(cached, path.join(extensionsDir, extension.name));
  }
}

function selectedGeyserExtensions(instance, options) {
  if (instance.profile) return extensionsForProfile(instance.profile);
  const fromEnv = (process.env.E2E_GEYSER_EXTENSIONS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...fromEnv, ...options.geyserExtensions];
}

function extensionsForProfile(profile) {
  if (profile === "none" || profile === "vanilla" || profile === "base") return [];
  return profile.split("+").map((value) => value.trim()).filter(Boolean);
}

async function ensureEndstoneTemplate(instance, options) {
  const executable = os.platform() === "win32" ? "bedrock_server.exe" : "bedrock_server";
  if (fs.existsSync(path.join(ENDSTONE_TEMPLATE_DIR, executable))) return;

  await mkdir(ENDSTONE_TEMPLATE_DIR);
  console.log(`Warming Endstone BDS template in ${path.relative(ROOT, ENDSTONE_TEMPLATE_DIR)}...`);
  await writeText(path.join(ENDSTONE_TEMPLATE_DIR, "server.properties"), endstoneServerProperties({
    ...instance,
    name: "endstone-template",
    index: 0,
    bedrockPort: 19132,
    world: "normal"
  }, options));
  await runChecked(endstoneBin(instance), [
    "--server-folder",
    ENDSTONE_TEMPLATE_DIR,
    "--no-confirm",
    "--no-interactive"
  ], instance.dir);
}

async function copyEndstoneTemplate(instance) {
  const executable = os.platform() === "win32" ? "bedrock_server.exe" : "bedrock_server";
  if (fs.existsSync(path.join(instance.dir, executable))) return;

  for (const name of [
    "behavior_packs",
    "config",
    "data",
    "definitions",
    "development_behavior_packs",
    "development_resource_packs",
    "development_skin_packs",
    "plugins",
    "resource_packs",
    "world_templates",
    ".sentry-native",
    "allowlist.json",
    executable,
    "bedrock_server_how_to.html",
    "crashpad_handler.exe",
    "crashpad_wer.dll",
    "endstone.toml",
    "packetlimitconfig.json",
    "permissions.json",
    "profanity_filter.wlist",
    "release-notes.txt",
    "version.txt"
  ]) {
    await copyIfExists(path.join(ENDSTONE_TEMPLATE_DIR, name), path.join(instance.dir, name));
  }
}

async function cleanInstanceWorlds(instance, options) {
  if (!fs.existsSync(instance.dir)) return;
  const names = new Set([worldName(instance, options)]);

  if (instance.type === "java") {
    const entries = await fsp.readdir(instance.dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(`${instance.name}-`) || entry.name === "world" || entry.name.startsWith("world_")) {
        names.add(entry.name);
      }
    }
    for (const name of [...names]) {
      names.add(`${name}_nether`);
      names.add(`${name}_the_end`);
    }
  } else {
    names.add("Bedrock level");
  }

  for (const name of names) {
    const target = instance.type === "endstone"
      ? path.join(instance.dir, "worlds", name)
      : path.join(instance.dir, name);
    await safeRemove(target);
  }
  if (instance.type === "endstone") {
    await safeRemove(path.join(instance.dir, "logs"));
  }
  console.log(`Cleaned generated worlds for ${instance.name}`);
}

module.exports = {
  installTargets,
  cleanTargets
};
