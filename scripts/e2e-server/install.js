"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { E2E_ROOT, CACHE_DIR, RUNS_DIR, ENDSTONE_TEMPLATE_DIR, ROOT } = require("./paths");
const { mkdir, replaceDirectory, safeRemove, writeText, copyIfExists } = require("./fs-utils");
const {
  runChecked,
  venvPythonBin,
  endstoneBin,
  endstoneArgs,
  endstoneEnv,
  endstoneInternalDir,
  pythonHome
} = require("./process-utils");
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

const ENDSTONE_PACKAGE_MARKER = ".e2e-endstone-package";

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
  const source = options.endstonePackage || "endstone";
  const cache = endstonePackageCache(source);
  instance.endstoneVenvDir = cache.venvDir;
  instance.endstoneTemplateDir = cache.templateDir;
  console.log(`Preparing ${instance.name}: uv-managed Endstone Bedrock server (${source})...`);

  await resetEndstoneInstanceIfPackageChanged(instance, source);
  await mkdir(instance.dir);
  await ensureEndstonePackageEnv(instance, source, cache);
  await copyEndstoneRuntimeDlls(instance, instance.dir);
  await ensureEndstoneTemplate(instance, options, source);
  await copyEndstoneTemplate(instance);
  await copyEndstoneRuntimeDlls(instance, instance.dir);
  await writeText(path.join(instance.dir, "server.properties"), endstoneServerProperties(instance, options));
  if (options.endstonePacketRecorder || options.endstoneScenario) await installEndstonePacketRecorder(instance);
  await writeText(path.join(instance.dir, ENDSTONE_PACKAGE_MARKER), `${source}\n`);
}

async function ensureEndstonePackageEnv(instance, source, cache) {
  const marker = path.join(cache.rootDir, ENDSTONE_PACKAGE_MARKER);
  const existing = fs.existsSync(marker) ? (await fsp.readFile(marker, "utf8")).trim() : null;

  if (existing === source && fs.existsSync(endstoneBin(instance))) return;
  if (fs.existsSync(cache.rootDir)) {
    const label = existing ? `${existing} -> ${source}` : `unknown -> ${source}`;
    console.log(`Endstone package cache changed: ${label}; rebuilding ${path.relative(ROOT, cache.rootDir)}.`);
    await safeRemove(cache.rootDir);
  }

  await mkdir(cache.rootDir);
  await runChecked("uv", ["venv", cache.venvDir], ROOT);
  await runChecked("uv", ["pip", "install", "--python", venvPythonBin(instance), "--upgrade", source], ROOT);
  await writeText(marker, `${source}\n`);
}

async function installEndstonePacketRecorder(instance) {
  const pluginDir = path.join(ROOT, "scripts", "endstone-packet-recorder");
  console.log(`Installing Endstone packet recorder into ${instance.name}...`);
  await runChecked("uv", ["pip", "install", "--python", venvPythonBin(instance), "--editable", pluginDir], instance.dir);
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

async function resetEndstoneInstanceIfPackageChanged(instance, source) {
  const marker = path.join(instance.dir, ENDSTONE_PACKAGE_MARKER);
  const templateDir = instance.endstoneTemplateDir;
  if (!fs.existsSync(instance.dir)) return;

  if (!fs.existsSync(marker)) {
    console.log(`Endstone package for ${instance.name} is unknown; rebuilding instance for ${source}.`);
    await safeRemove(instance.dir);
    return;
  }

  const previous = (await fsp.readFile(marker, "utf8")).trim();
  if (previous === source) {
    const instanceVersion = await readOptionalText(path.join(instance.dir, "version.txt"));
    const templateVersion = templateDir
      ? await readOptionalText(path.join(templateDir, "version.txt"))
      : null;

    if (instanceVersion && templateVersion && instanceVersion.trim() !== templateVersion.trim()) {
      console.log(`Endstone BDS version changed for ${instance.name}: ${instanceVersion.trim()} -> ${templateVersion.trim()}; rebuilding instance.`);
      await safeRemove(instance.dir);
    }
    return;
  }

  console.log(`Endstone package changed for ${instance.name}: ${previous} -> ${source}; rebuilding instance.`);
  await safeRemove(instance.dir);
}

async function readOptionalText(file) {
  try {
    return await fsp.readFile(file, "utf8");
  } catch (err) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

async function ensureEndstoneTemplate(instance, options, source) {
  const executable = os.platform() === "win32" ? "bedrock_server.exe" : "bedrock_server";
  const templateDir = instance.endstoneTemplateDir;
  const marker = path.join(templateDir, ENDSTONE_PACKAGE_MARKER);

  await seedEndstoneTemplateFromLegacy(templateDir, source, executable);

  if (fs.existsSync(path.join(templateDir, executable))) {
    const previous = fs.existsSync(marker)
      ? (await fsp.readFile(marker, "utf8")).trim()
      : null;
    if (previous === source) {
      await copyEndstoneRuntimeDlls(instance, templateDir);
      return;
    }

    const label = previous ? `${previous} -> ${source}` : `unknown -> ${source}`;
    console.log(`Endstone template package changed: ${label}; rebuilding template.`);
    await safeRemove(templateDir);
  }

  await mkdir(templateDir);
  console.log(`Warming Endstone BDS template in ${path.relative(ROOT, templateDir)}...`);
  await writeText(path.join(templateDir, "server.properties"), endstoneServerProperties({
    ...instance,
    name: "endstone-template",
    index: 0,
    bedrockPort: 19132,
    world: "normal"
  }, options));
  await copyEndstoneRuntimeDlls(instance, templateDir);
  await runEndstoneTemplateWarmup(endstoneBin(instance), endstoneArgs(instance, {
    serverFolder: templateDir,
    interactive: false
  }), instance.dir, endstoneEnv(instance, { serverFolder: templateDir }));
  await writeText(marker, `${source}\n`);
}

async function seedEndstoneTemplateFromLegacy(templateDir, source, executable) {
  if (fs.existsSync(path.join(templateDir, executable))) return;
  if (!fs.existsSync(path.join(ENDSTONE_TEMPLATE_DIR, executable))) return;

  const legacyMarker = path.join(ENDSTONE_TEMPLATE_DIR, ENDSTONE_PACKAGE_MARKER);
  const legacySource = fs.existsSync(legacyMarker)
    ? (await fsp.readFile(legacyMarker, "utf8")).trim()
    : null;
  if (legacySource !== source) return;

  console.log(`Seeding Endstone package template from ${path.relative(ROOT, ENDSTONE_TEMPLATE_DIR)}.`);
  await fsp.cp(ENDSTONE_TEMPLATE_DIR, templateDir, { recursive: true, force: true });
}

async function copyEndstoneRuntimeDlls(instance, targetDir) {
  const sources = new Set();
  const pythonDir = pythonHome(instance);
  const internalDir = endstoneInternalDir(instance);

  for (const file of [
    path.join(internalDir, "endstone_runtime.dll"),
    path.join(internalDir, "endstone_runtime_loader.dll")
  ]) {
    sources.add(file);
  }

  if (pythonDir) {
    for (const name of ["python3.dll", "python313.dll", "vcruntime140.dll", "vcruntime140_1.dll"]) {
      sources.add(path.join(pythonDir, name));
    }
  }

  for (const name of ["msvcp140.dll", "msvcp140_1.dll", "msvcp140_2.dll"]) {
    sources.add(path.join(process.env.SystemRoot || "C:\\Windows", "System32", name));
  }

  await mkdir(targetDir);
  for (const source of sources) {
    if (!source || !fs.existsSync(source)) continue;
    await fsp.copyFile(source, path.join(targetDir, path.basename(source)));
  }
}

async function runEndstoneTemplateWarmup(bin, args, cwd, extraEnv = {}) {
  console.log(`${bin} ${args.join(" ")}`);

  await new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...extraEnv }
    });
    const timeout = setTimeout(() => {
      child.kill(os.platform() === "win32" ? undefined : "SIGTERM");
      reject(new Error(`${bin} ${args.join(" ")} timed out while warming Endstone template`));
    }, 180000);
    let pending = "";
    let stopSent = false;

    const handleOutput = (data, stream) => {
      stream.write(data);
      pending += data.toString();
      const lines = pending.split(/\r?\n/);
      pending = lines.pop();

      for (const line of lines) {
        if (!stopSent && /\b(Server started\.|IPv4 supported, port:)/.test(line)) {
          stopSent = true;
          child.stdin.write("stop\n");
        }
      }
    };

    child.stdout.on("data", data => handleOutput(data, process.stdout));
    child.stderr.on("data", data => handleOutput(data, process.stderr));
    child.on("error", err => {
      clearTimeout(timeout);
      reject(err);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`${bin} ${args.join(" ")} exited with ${signal || code}`));
    });
  });
}

async function copyEndstoneTemplate(instance) {
  const executable = os.platform() === "win32" ? "bedrock_server.exe" : "bedrock_server";
  const templateDir = instance.endstoneTemplateDir;
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
    "version.txt",
    ENDSTONE_PACKAGE_MARKER
  ]) {
    await copyIfExists(path.join(templateDir, name), path.join(instance.dir, name));
  }
}

function endstonePackageCache(source) {
  const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "endstone";
  const rootDir = path.join(CACHE_DIR, "endstone-packages", `${slug}-${hash}`);

  return {
    rootDir,
    venvDir: path.join(rootDir, ".venv"),
    templateDir: path.join(rootDir, "bds-template")
  };
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
