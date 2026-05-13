"use strict";

function parseCli(argv) {
  const command = argv[2] || "help";
  const options = parseOptions(argv.slice(3));
  options.targets = parseTargets(options.target);
  return { command, options };
}

function parseOptions(args) {
  const options = {
    target: "all",
    client: null,
    exitAfterClient: false,
    clientTimeoutMs: null,
    clientStopDelayMs: 2000,
    serverReadyTimeoutMs: 120000,
    geyserExtensions: [],
    javaProfiles: null,
    javaWorlds: null,
    endstoneWorlds: null,
    world: process.env.E2E_WORLD || "normal",
    javaCount: null,
    endstoneCount: null,
    paperVersion: process.env.E2E_PAPER_VERSION || "latest",
    javaBin: process.env.E2E_JAVA_BIN || "java",
    geyserAuthType: process.env.E2E_GEYSER_AUTH_TYPE || "offline",
    autoOp: process.env.E2E_AUTO_OP !== "0"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--java-bin") {
      if (!args[index + 1]) throw new Error("--java-bin requires a value.");
      options.javaBin = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--java-bin=")) {
      options.javaBin = arg.slice("--java-bin=".length);
    } else if (arg.startsWith("--java-count=")) {
      options.javaCount = parsePositiveInt(arg.slice("--java-count=".length), "--java-count");
    } else if (arg.startsWith("--endstone-count=")) {
      options.endstoneCount = parsePositiveInt(arg.slice("--endstone-count=".length), "--endstone-count");
    } else if (arg.startsWith("--geyser-extension=")) {
      options.geyserExtensions.push(arg.slice("--geyser-extension=".length));
    } else if (arg.startsWith("--java-profiles=")) {
      options.javaProfiles = splitCsv(arg.slice("--java-profiles=".length));
    } else if (arg.startsWith("--world=")) {
      options.world = normalizeWorld(arg.slice("--world=".length));
    } else if (arg.startsWith("--java-worlds=")) {
      options.javaWorlds = splitCsv(arg.slice("--java-worlds=".length)).map(normalizeWorld);
    } else if (arg.startsWith("--endstone-worlds=")) {
      options.endstoneWorlds = splitCsv(arg.slice("--endstone-worlds=".length)).map(normalizeWorld);
    } else if (arg.startsWith("--scope=")) {
      options.cleanScope = normalizeCleanScope(arg.slice("--scope=".length));
    } else if (arg === "--exit-after-client") {
      options.exitAfterClient = true;
    } else if (arg.startsWith("--client-timeout-ms=")) {
      options.clientTimeoutMs = parsePositiveInt(arg.slice("--client-timeout-ms=".length), "--client-timeout-ms");
    } else if (arg.startsWith("--client-stop-delay-ms=")) {
      options.clientStopDelayMs = parsePositiveInt(arg.slice("--client-stop-delay-ms=".length), "--client-stop-delay-ms");
    } else if (arg.startsWith("--server-ready-timeout-ms=")) {
      options.serverReadyTimeoutMs = parsePositiveInt(arg.slice("--server-ready-timeout-ms=".length), "--server-ready-timeout-ms");
    } else if (arg === "--no-auto-op") {
      options.autoOp = false;
    } else if (arg === "--client") {
      options.client = args.slice(index + 1).join(" ");
      break;
    } else if (arg.startsWith("--client=")) {
      const first = arg.slice("--client=".length);
      const rest = args.slice(index + 1);
      options.client = [first, ...rest].filter(Boolean).join(" ");
      break;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.world = normalizeWorld(options.world);
  return options;
}

function splitCsv(raw) {
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function normalizeCleanScope(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized !== "worlds" && normalized !== "logs" && normalized !== "all") {
    throw new Error(`Unknown clean scope "${value}". Use worlds, logs, or all.`);
  }
  return normalized;
}

function normalizeWorld(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "flat") return "superflat";
  if (normalized !== "normal" && normalized !== "superflat") {
    throw new Error(`Unknown world type "${value}". Use normal or superflat.`);
  }
  return normalized;
}

function parsePositiveInt(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer.`);
  return parsed;
}

function parseTargets(raw) {
  const selected = new Set(raw.split(",").map((value) => value.trim()).filter(Boolean));
  if (selected.has("all")) return new Set(["java", "endstone"]);
  for (const target of selected) {
    if (target !== "java" && target !== "endstone") {
      throw new Error(`Unknown target "${target}". Use all, java, or endstone.`);
    }
  }
  return selected;
}

module.exports = {
  parseCli,
  normalizeWorld,
  parsePositiveInt
};
