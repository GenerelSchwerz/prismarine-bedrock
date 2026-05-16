"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_ENDSTONE_PACKAGE = "endstone";

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
    clientArgs: null,
    exitAfterClient: false,
    exitAfterScenario: process.env.E2E_EXIT_AFTER_SCENARIO !== "0",
    clientTimeoutMs: null,
    clientStopDelayMs: 2000,
    scenarioProgressIntervalMs: parsePositiveInt(process.env.E2E_SCENARIO_PROGRESS_INTERVAL_MS || "30000", "E2E_SCENARIO_PROGRESS_INTERVAL_MS"),
    serverReadyTimeoutMs: 120000,
    geyserExtensions: [],
    javaProfiles: null,
    javaWorlds: null,
    endstoneWorlds: null,
    world: process.env.E2E_WORLD || "normal",
    javaCount: null,
    endstoneCount: null,
    endstonePackage: process.env.E2E_ENDSTONE_PACKAGE || DEFAULT_ENDSTONE_PACKAGE,
    endstonePacketRecorder: process.env.E2E_ENDSTONE_PACKET_RECORDER === "1",
    endstoneScenario: process.env.E2E_ENDSTONE_SCENARIO || null,
    endstonePacketRecorderPlayers: process.env.E2E_PACKET_RECORDER_PLAYERS || "",
    endstonePacketRecorderSplitByPlayer: process.env.E2E_PACKET_RECORDER_SPLIT_BY_PLAYER === "1",
    paperVersion: process.env.E2E_PAPER_VERSION || "latest",
    javaBin: process.env.E2E_JAVA_BIN || defaultJavaBin(),
    geyserAuthType: process.env.E2E_GEYSER_AUTH_TYPE || "offline",
    autoOp: process.env.E2E_AUTO_OP !== "0",
    autoPort: process.env.E2E_AUTO_PORT === "1",
    dryRun: false,
    includeManaged: false
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
    } else if (arg === "--endstone-package") {
      if (!args[index + 1]) throw new Error("--endstone-package requires a value.");
      options.endstonePackage = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--endstone-package=")) {
      options.endstonePackage = arg.slice("--endstone-package=".length);
    } else if (arg === "--endstone-packet-recorder") {
      options.endstonePacketRecorder = true;
    } else if (arg === "--endstone-packet-recorder-player") {
      if (!args[index + 1]) throw new Error("--endstone-packet-recorder-player requires a value.");
      options.endstonePacketRecorderPlayers = appendCsv(options.endstonePacketRecorderPlayers, args[index + 1]);
      index += 1;
    } else if (arg.startsWith("--endstone-packet-recorder-player=")) {
      options.endstonePacketRecorderPlayers = appendCsv(options.endstonePacketRecorderPlayers, arg.slice("--endstone-packet-recorder-player=".length));
    } else if (arg === "--endstone-packet-recorder-split-by-player") {
      options.endstonePacketRecorderSplitByPlayer = true;
    } else if (arg === "--endstone-scenario") {
      if (!args[index + 1]) throw new Error("--endstone-scenario requires a value.");
      options.endstoneScenario = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--endstone-scenario=")) {
      options.endstoneScenario = arg.slice("--endstone-scenario=".length);
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
    } else if (arg === "--no-exit-after-scenario") {
      options.exitAfterScenario = false;
    } else if (arg.startsWith("--client-timeout-ms=")) {
      options.clientTimeoutMs = parsePositiveInt(arg.slice("--client-timeout-ms=".length), "--client-timeout-ms");
    } else if (arg.startsWith("--client-stop-delay-ms=")) {
      options.clientStopDelayMs = parsePositiveInt(arg.slice("--client-stop-delay-ms=".length), "--client-stop-delay-ms");
    } else if (arg.startsWith("--scenario-progress-interval-ms=")) {
      options.scenarioProgressIntervalMs = parsePositiveInt(arg.slice("--scenario-progress-interval-ms=".length), "--scenario-progress-interval-ms");
    } else if (arg.startsWith("--server-ready-timeout-ms=")) {
      options.serverReadyTimeoutMs = parsePositiveInt(arg.slice("--server-ready-timeout-ms=".length), "--server-ready-timeout-ms");
    } else if (arg === "--no-auto-op") {
      options.autoOp = false;
    } else if (arg === "--auto-port") {
      options.autoPort = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--include-managed") {
      options.includeManaged = true;
    } else if (arg === "--client") {
      options.clientArgs = normalizeClientArgs(args.slice(index + 1));
      options.client = shellJoin(options.clientArgs);
      break;
    } else if (arg.startsWith("--client=")) {
      const first = arg.slice("--client=".length);
      const rest = args.slice(index + 1);
      options.clientArgs = normalizeClientArgs([first, ...rest].filter(Boolean));
      options.client = shellJoin(options.clientArgs);
      break;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.world = normalizeWorld(options.world);
  if (options.endstoneScenario) options.endstonePacketRecorder = true;
  return options;
}

function normalizeClientArgs(args) {
  if (args.length === 1) return splitCommandLine(args[0]);
  return args;
}

function splitCommandLine(input) {
  const args = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (const char of String(input)) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\" && quote === '"') {
      escaping = true;
      continue;
    }

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += "\\";
  if (current) args.push(current);
  return args;
}

function shellJoin(args) {
  return args.map(shellQuote).join(" ");
}

function shellQuote(arg) {
  const text = String(arg);
  if (text && !/[\s"']/.test(text)) return text;
  return `"${text.replace(/(["\\])/g, "\\$1")}"`;
}

function defaultJavaBin() {
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const bin = path.join(javaHome, "bin", process.platform === "win32" ? "java.exe" : "java");
    if (fs.existsSync(bin)) return bin;
  }

  return "java";
}

function splitCsv(raw) {
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function appendCsv(existing, value) {
  return [...splitCsv(existing || ""), ...splitCsv(value || "")].join(",");
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
  DEFAULT_ENDSTONE_PACKAGE,
  parseCli,
  parseOptions,
  splitCommandLine,
  shellJoin,
  normalizeWorld,
  parsePositiveInt,
  defaultJavaBin
};
