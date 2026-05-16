#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { bedrockVersionFromEnv } = require("../src/version");

const ROOT = path.resolve(__dirname, "..");
const SCENARIO_DIR = path.join(ROOT, "test", "recorded-bds", "scenarios");
const BOT_DIR = path.join(ROOT, "test", "recorded-bds", "bots");
const LOG_ROOT = path.join(ROOT, "logs", "recorded-bds");
const DEFAULT_BOT_USERNAME = "OpBot";

function usage() {
  console.error(`Usage:
  node scripts/recorded-bds-gym.js status --scenario=<id>
  node scripts/recorded-bds-gym.js record-human --scenario=<id>
  node scripts/recorded-bds-gym.js scaffold-bot --scenario=<id>
  node scripts/recorded-bds-gym.js run-bot --scenario=<id>
  node scripts/recorded-bds-gym.js compare --scenario=<id>
  node scripts/recorded-bds-gym.js loop --scenario=<id>
  node scripts/recorded-bds-gym.js promote --scenario=<id>

Options:
  --scenario=<id|path>       Scenario id under test/recorded-bds/scenarios or explicit JSON path.
  --bot-username=<name>      Bot player name, default OpBot.
  --version=<version>        Decode/index version, default MC_VERSION or repo default.
  --run-id=<id>              Override generated run id.
  --dry-run                  Print commands without executing live server/client commands.
`);
}

function parseArgs(argv) {
  const command = argv[2] || "help";
  const options = {
    scenario: null,
    botUsername: DEFAULT_BOT_USERNAME,
    version: bedrockVersionFromEnv(),
    runId: null,
    dryRun: false
  };
  for (const arg of argv.slice(3)) {
    if (arg.startsWith("--scenario=")) options.scenario = arg.slice("--scenario=".length);
    else if (arg.startsWith("--bot-username=")) options.botUsername = arg.slice("--bot-username=".length);
    else if (arg.startsWith("--version=")) options.version = arg.slice("--version=".length);
    else if (arg.startsWith("--run-id=")) options.runId = arg.slice("--run-id=".length);
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return { command, options };
}

async function main(argv = process.argv) {
  const { command, options } = parseArgs(argv);
  if (command === "help" || command === "--help" || command === "-h") {
    usage();
    return 0;
  }
  if (!options.scenario) throw new Error("--scenario is required.");
  const scenario = resolveScenario(options.scenario);

  if (command === "status") return printStatus(scenario, options);
  if (command === "record-human") return recordHuman(scenario, options);
  if (command === "scaffold-bot") return scaffoldBot(scenario, options);
  if (command === "run-bot") return runBot(scenario, options);
  if (command === "compare") return compareLatest(scenario, options);
  if (command === "loop") {
    const runCode = runBot(scenario, options);
    if (runCode !== 0) return runCode;
    return compareLatest(scenario, options);
  }
  if (command === "promote") return promoteStatus(scenario, options);
  throw new Error(`Unknown command: ${command}`);
}

function resolveScenario(value) {
  const raw = path.resolve(value);
  const candidates = [];
  if (fs.existsSync(raw)) candidates.push(raw);
  if (!value.endsWith(".json")) candidates.push(path.join(SCENARIO_DIR, `${value}.json`));
  candidates.push(path.join(SCENARIO_DIR, value));

  const file = candidates.find(candidate => fs.existsSync(candidate));
  if (!file) {
    return {
      id: safeLabel(path.basename(value, path.extname(value))),
      path: candidates[0],
      exists: false,
      data: null
    };
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    id: data.id || path.basename(file, ".json"),
    path: file,
    exists: true,
    data
  };
}

function scenarioLogRoot(scenario) {
  return path.join(LOG_ROOT, safeLabel(scenario.id));
}

function runDir(scenario, kind, runId = timestampRunId()) {
  return path.join(scenarioLogRoot(scenario), kind, runId);
}

function botScriptPath(scenario) {
  return path.join(BOT_DIR, `${safeLabel(scenario.id)}.js`);
}

function latestRun(scenario, kind, predicate = () => true) {
  const dir = path.join(scenarioLogRoot(scenario), kind);
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name))
    .sort()
    .reverse();
  for (const entry of entries) {
    const run = describeRun(entry);
    if (predicate(run)) return run;
  }
  return null;
}

function describeRun(dir) {
  const packets = path.join(dir, "packets.jsonl");
  const sqlite = path.join(dir, "packets.sqlite");
  const markers = fs.existsSync(packets) ? readMarkers(packets) : [];
  return {
    dir,
    id: path.basename(dir),
    packets,
    sqlite,
    packetsExists: fs.existsSync(packets),
    sqliteExists: fs.existsSync(sqlite),
    markers,
    completed: hasCompletedScenario(markers)
  };
}

function readMarkers(file) {
  const markers = [];
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim()[0] === "[") continue;
    try {
      const record = JSON.parse(line);
      if (record && typeof record === "object" && record.type) markers.push(record);
    } catch {
      // Ignore partial or non-marker lines.
    }
  }
  return markers;
}

function hasCompletedScenario(markers) {
  return markers.some(marker => marker.type === "scenario_complete") &&
    markers.some(marker => marker.type === "scenario_end" && marker.status === "complete");
}

function printStatus(scenario, options) {
  const status = gymStatus(scenario, options);
  console.log(JSON.stringify(status, null, 2));
  return status.scenario.exists ? 0 : 1;
}

function gymStatus(scenario, options) {
  const human = latestRun(scenario, "human", run => run.completed);
  const bot = latestRun(scenario, "bot", run => run.completed);
  const compare = latestCompare(scenario);
  return {
    scenario: {
      id: scenario.id,
      path: scenario.path,
      exists: scenario.exists
    },
    botScript: {
      path: botScriptPath(scenario),
      exists: fs.existsSync(botScriptPath(scenario))
    },
    latestHuman: human,
    latestBot: bot,
    latestCompare: compare,
    promotionReady: Boolean(compare?.pass && bot?.completed)
  };
}

function recordHuman(scenario, options) {
  assertScenarioExists(scenario);
  const existing = latestRun(scenario, "human", run => run.completed && run.sqliteExists);
  if (existing) {
    console.log(JSON.stringify({ reused: true, run: existing.dir, sqlite: existing.sqlite }, null, 2));
    return 0;
  }
  const dir = runDir(scenario, "human", options.runId || timestampRunId());
  fs.mkdirSync(dir, { recursive: true });
  const packets = path.join(dir, "packets.jsonl");
  const command = buildHumanLaunchCommand(scenario, packets);
  const code = runCommand(command, {
    env: { ...process.env, E2E_PACKET_RECORD_FILE: packets, MC_VERSION: options.version },
    dryRun: options.dryRun
  });
  if (code !== 0 || options.dryRun) return code;
  const run = describeRun(dir);
  if (!run.completed) throw new Error(`Human scenario did not complete: ${packets}`);
  indexRun(run, options);
  return 0;
}

function scaffoldBot(scenario) {
  assertScenarioExists(scenario);
  fs.mkdirSync(BOT_DIR, { recursive: true });
  const file = botScriptPath(scenario);
  if (fs.existsSync(file)) {
    console.log(JSON.stringify({ exists: true, path: file }, null, 2));
    return 0;
  }
  fs.writeFileSync(file, botTemplate(scenario), "utf8");
  console.log(JSON.stringify({ created: true, path: file }, null, 2));
  return 0;
}

function runBot(scenario, options) {
  assertScenarioExists(scenario);
  const botScript = botScriptPath(scenario);
  if (!fs.existsSync(botScript)) throw new Error(`Missing bot script. Run scaffold-bot first: ${botScript}`);
  const dir = runDir(scenario, "bot", options.runId || timestampRunId());
  fs.mkdirSync(dir, { recursive: true });
  const packets = path.join(dir, "packets.jsonl");
  const command = buildBotLaunchCommand(scenario, packets, botScript, options.botUsername);
  const code = runCommand(command, {
    env: {
      ...process.env,
      E2E_PACKET_RECORD_FILE: packets,
      BOT_USERNAME: options.botUsername,
      MC_VERSION: options.version
    },
    dryRun: options.dryRun
  });
  if (code !== 0 || options.dryRun) return code;
  const run = describeRun(dir);
  if (!run.completed) throw new Error(`Bot scenario did not complete: ${packets}`);
  indexRun(run, options);
  return 0;
}

function compareLatest(scenario, options) {
  assertScenarioExists(scenario);
  const human = latestRun(scenario, "human", run => run.completed && run.sqliteExists);
  const bot = latestRun(scenario, "bot", run => run.completed && run.sqliteExists);
  if (!human) throw new Error("No completed indexed human run found.");
  if (!bot) throw new Error("No completed indexed bot run found.");
  const compareDir = path.join(scenarioLogRoot(scenario), "compare");
  fs.mkdirSync(compareDir, { recursive: true });
  const id = options.runId || `${human.id}__${bot.id}`;
  const outJson = path.join(compareDir, `${id}.json`);
  const outMd = path.join(compareDir, `${id}.md`);
  const command = [
    process.execPath,
    path.join(ROOT, "scripts", "compare-packet-dbs.js"),
    `--human=${human.sqlite}`,
    `--bot=${bot.sqlite}`,
    `--scenario=${scenario.path}`,
    `--out-json=${outJson}`,
    `--out-md=${outMd}`
  ];
  return runCommand(command, { env: process.env, dryRun: options.dryRun });
}

function promoteStatus(scenario, options) {
  const status = gymStatus(scenario, options);
  if (!status.latestBot?.completed) {
    console.error("Promotion blocked: no completed bot run.");
    return 1;
  }
  if (!status.latestCompare?.pass) {
    console.error("Promotion blocked: no passing comparison report.");
    return 1;
  }
  console.log(JSON.stringify({
    promotionReady: true,
    scenario: scenario.id,
    botRun: status.latestBot.dir,
    compare: status.latestCompare.path
  }, null, 2));
  return 0;
}

function buildHumanLaunchCommand(scenario, packets) {
  return [
    process.execPath,
    path.join(ROOT, "scripts", "e2e-servers.js"),
    "launch",
    "--target=endstone",
    "--world=superflat",
    `--endstone-scenario=${scenario.path}`
  ];
}

function buildBotLaunchCommand(scenario, packets, botScript, botUsername = DEFAULT_BOT_USERNAME) {
  return [
    process.execPath,
    path.join(ROOT, "scripts", "e2e-servers.js"),
    "launch",
    "--target=endstone",
    "--world=superflat",
    `--endstone-scenario=${scenario.path}`,
    `--endstone-packet-recorder-player=${botUsername}`,
    "--exit-after-client",
    "--client-timeout-ms=300000",
    "--client",
    process.execPath,
    botScript
  ];
}

function indexRun(run, options) {
  if (!run.packetsExists) throw new Error(`Missing packet log: ${run.packets}`);
  const command = [
    process.execPath,
    path.join(ROOT, "scripts", "index-packet-recording.js"),
    run.packets,
    options.version,
    `--out=${run.sqlite}`
  ];
  return runCommand(command, { env: process.env, dryRun: options.dryRun });
}

function latestCompare(scenario) {
  const dir = path.join(scenarioLogRoot(scenario), "compare");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(name => name.endsWith(".json"))
    .sort()
    .reverse();
  for (const file of files) {
    const full = path.join(dir, file);
    try {
      const report = JSON.parse(fs.readFileSync(full, "utf8"));
      return { path: full, pass: Boolean(report.pass), summary: report.summary || null };
    } catch {
      // Ignore corrupt reports.
    }
  }
  return null;
}

function runCommand(command, options = {}) {
  if (options.dryRun) {
    console.log(JSON.stringify({ command }, null, 2));
    return 0;
  }
  const result = spawnSync(command[0], command.slice(1), {
    cwd: ROOT,
    env: options.env || process.env,
    stdio: "inherit",
    shell: false
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function botTemplate(scenario) {
  const steps = scenario.data.steps || [];
  const stepFunctions = steps.map(step => {
    const name = jsIdentifier(`step_${step.id || "unnamed"}`);
    return `async function ${name}(bot) {
  // TODO: Recreate scenario step ${JSON.stringify(step.id || "")}: ${(step.instructions || []).join(" ")}
  // Prefer existing bot APIs first. If needed, send manual packets here while keeping the experiment local.
  await wait(1000);
}
`;
  }).join("\n");
  const calls = steps.map(step => `  await ${jsIdentifier(`step_${step.id || "unnamed"}`)}(bot);`).join("\n");
  return `"use strict";

const {
  connectScenarioBot,
  disconnectQuietly,
  wait
} = require("./helpers");

${stepFunctions}
async function main() {
  const bot = await connectScenarioBot();
  try {
${calls || "  // TODO: Add scenario actions."}
    await wait(1000);
  } finally {
    disconnectQuietly(bot, "recorded-bds gym bot complete");
  }
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
`;
}

function assertScenarioExists(scenario) {
  if (!scenario.exists) throw new Error(`Scenario does not exist: ${scenario.path}`);
}

function timestampRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeLabel(value) {
  return String(value || "unknown").replace(/[^A-Za-z0-9_.-]/g, "_").replace(/^\.+/, "") || "unknown";
}

function jsIdentifier(value) {
  const rendered = safeLabel(value).replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[A-Za-z_$]/.test(rendered) ? rendered : `_${rendered}`;
}

if (require.main === module) {
  main().then(code => {
    process.exitCode = code;
  }).catch(err => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}

module.exports = {
  BOT_DIR,
  LOG_ROOT,
  SCENARIO_DIR,
  botScriptPath,
  buildBotLaunchCommand,
  buildHumanLaunchCommand,
  describeRun,
  gymStatus,
  hasCompletedScenario,
  latestRun,
  readMarkers,
  resolveScenario,
  scenarioLogRoot
};
