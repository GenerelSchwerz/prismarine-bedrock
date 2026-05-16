#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DEFAULT_PACKET_NAMES = [
  "player_auth_input",
  "item_stack_request",
  "item_stack_response",
  "inventory_transaction",
  "container_open",
  "container_close",
  "inventory_content",
  "inventory_slot",
  "mob_equipment",
  "move_player",
  "animate",
  "interact",
  "player_action"
];

const DEFAULT_IGNORE_PATHS = [
  "sequence",
  "ts",
  "player",
  "address",
  "sub_client_id",
  "payload_sha256",
  "params.tick",
  "params.position",
  "params.delta",
  "params.move_vector",
  "params.analogue_move_vector",
  "params.raw_move_vector",
  "params.camera_orientation",
  "params.interact_rotation",
  "params.pitch",
  "params.yaw",
  "params.head_yaw",
  "params.runtime_entity_id",
  "params.entity_id",
  "params.target_entity_id"
];

function usage() {
  console.error(`Usage:
  node scripts/compare-packet-dbs.js --human=human.sqlite --bot=bot.sqlite --scenario=<id|path>
    [--packet-names=a,b,c] [--ignore=path1,path2] [--out-json=report.json] [--out-md=report.md]

Compares human and bot packet SQLite sidecars step-by-step using scenario event bounds.
`);
}

function parseArgs(argv) {
  const options = {
    human: null,
    bot: null,
    scenario: null,
    packetNames: DEFAULT_PACKET_NAMES,
    ignorePaths: DEFAULT_IGNORE_PATHS,
    outJson: null,
    outMd: null
  };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--human=")) options.human = arg.slice("--human=".length);
    else if (arg.startsWith("--bot=")) options.bot = arg.slice("--bot=".length);
    else if (arg.startsWith("--scenario=")) options.scenario = arg.slice("--scenario=".length);
    else if (arg.startsWith("--packet-names=")) options.packetNames = csv(arg.slice("--packet-names=".length));
    else if (arg.startsWith("--ignore=")) options.ignorePaths = DEFAULT_IGNORE_PATHS.concat(csv(arg.slice("--ignore=".length)));
    else if (arg.startsWith("--out-json=")) options.outJson = arg.slice("--out-json=".length);
    else if (arg.startsWith("--out-md=")) options.outMd = arg.slice("--out-md=".length);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function main(argv = process.argv) {
  const options = parseArgs(argv);
  if (options.help) {
    usage();
    return 0;
  }
  if (!options.human || !options.bot || !options.scenario) throw new Error("--human, --bot, and --scenario are required.");
  const report = comparePacketDbs(options);
  if (options.outJson) writeFile(options.outJson, JSON.stringify(report, null, 2));
  if (options.outMd) writeFile(options.outMd, renderMarkdown(report));
  if (!options.outJson && !options.outMd) console.log(JSON.stringify(report, null, 2));
  return report.pass ? 0 : 1;
}

function comparePacketDbs(options) {
  options = {
    ...options
  };
  options.packetNames = options.packetNames || DEFAULT_PACKET_NAMES;
  options.ignorePaths = options.ignorePaths || DEFAULT_IGNORE_PATHS;
  const scenario = loadScenario(options.scenario);
  const humanDb = new Database(path.resolve(options.human), { readonly: true });
  const botDb = new Database(path.resolve(options.bot), { readonly: true });
  try {
    const steps = scenario.steps && scenario.steps.length
      ? scenario.steps.map((step, index) => ({ id: String(step.id || index), index }))
      : [{ id: "scenario", index: 0 }];
    const stepReports = steps.map(step => compareStep(humanDb, botDb, step, options));
    const summary = summarize(stepReports);
    return {
      pass: summary.missing === 0 &&
        summary.extra === 0 &&
        summary.mismatched === 0 &&
        summary.incompleteHumanSteps === 0 &&
        summary.incompleteBotSteps === 0,
      scenario: scenario.id || path.basename(options.scenario, ".json"),
      human: path.resolve(options.human),
      bot: path.resolve(options.bot),
      packetNames: options.packetNames,
      ignoredPaths: options.ignorePaths,
      summary,
      steps: stepReports
    };
  } finally {
    humanDb.close();
    botDb.close();
  }
}

function compareStep(humanDb, botDb, step, options) {
  const humanBounds = stepBounds(humanDb, step);
  const botBounds = stepBounds(botDb, step);
  const humanPackets = humanBounds ? packetsInBounds(humanDb, humanBounds, options.packetNames, options.ignorePaths) : [];
  const botPackets = botBounds ? packetsInBounds(botDb, botBounds, options.packetNames, options.ignorePaths) : [];
  const alignment = alignPackets(humanPackets, botPackets);
  return {
    step: step.id,
    step_index: step.index,
    humanBounds,
    botBounds,
    humanPacketCount: humanPackets.length,
    botPacketCount: botPackets.length,
    missing: alignment.missing,
    extra: alignment.extra,
    mismatched: alignment.mismatched,
    matched: alignment.matched
  };
}

function stepBounds(db, step) {
  const start = findEvent(db, "step_start", step, "asc");
  if (!start) return null;
  const end = findEvent(db, "step_complete", step, "asc", start.sequence);
  return {
    start: start.sequence,
    end: end ? end.sequence : start.sequence,
    completed: Boolean(end)
  };
}

function findEvent(db, type, step, order, minSequence = null) {
  const params = { type, step: step.id };
  const where = ["type = @type", "step = @step"];
  if (minSequence !== null) {
    where.push("sequence >= @minSequence");
    params.minSequence = minSequence;
  }
  return db.prepare(`
    select sequence, ts, type, step, step_index
    from events
    where ${where.join(" and ")}
    order by sequence ${order}
    limit 1
  `).get(params) || null;
}

function packetsInBounds(db, bounds, packetNames, ignorePaths) {
  const params = { start: bounds.start, end: bounds.end };
  const names = packetNames.map((name, index) => {
    const key = `name_${index}`;
    params[key] = name;
    return `@${key}`;
  }).join(", ");
  return db.prepare(`
    select sequence, direction, packet_id, name, player, decoded_json, error
    from packets
    where sequence >= @start and sequence <= @end
      and name in (${names})
    order by sequence
  `).all(params).map(row => normalizePacket(row, ignorePaths));
}

function normalizePacket(row, ignorePaths) {
  const decoded = row.decoded_json ? JSON.parse(row.decoded_json) : null;
  const params = decoded?.params || decoded?.data?.params || null;
  const normalized = {
    direction: row.direction,
    packet_id: row.packet_id,
    name: row.name,
    semantic: semanticSummary(row.name, params),
    params: clone(params)
  };
  for (const ignored of ignorePaths) deletePath(normalized, ignored);
  return {
    sequence: row.sequence,
    key: packetKey(normalized),
    normalized
  };
}

function semanticSummary(name, params) {
  if (!params) return null;
  if (name === "item_stack_request") {
    return (params.requests || []).map(request => ({
      request_id: request.request_id,
      actions: (request.actions || []).map(action => action.type_id)
    }));
  }
  if (name === "item_stack_response") {
    return (params.responses || []).map(response => ({
      request_id: response.request_id,
      status: response.status
    }));
  }
  return null;
}

function packetKey(packet) {
  return `${packet.direction}:${packet.name || packet.packet_id}`;
}

function alignPackets(humanPackets, botPackets) {
  const usedBot = new Set();
  const missing = [];
  const mismatched = [];
  const matched = [];

  for (const human of humanPackets) {
    const botIndex = botPackets.findIndex((candidate, index) => !usedBot.has(index) && candidate.key === human.key);
    if (botIndex === -1) {
      missing.push(packetSummary(human));
      continue;
    }
    usedBot.add(botIndex);
    const bot = botPackets[botIndex];
    const diff = diffValues(human.normalized, bot.normalized);
    if (diff) {
      mismatched.push({
        human: packetSummary(human),
        bot: packetSummary(bot),
        diff
      });
    } else {
      matched.push({
        human_sequence: human.sequence,
        bot_sequence: bot.sequence,
        key: human.key
      });
    }
  }

  const extra = botPackets
    .map((packet, index) => ({ packet, index }))
    .filter(entry => !usedBot.has(entry.index))
    .map(entry => packetSummary(entry.packet));

  return { missing, extra, mismatched, matched };
}

function packetSummary(packet) {
  return {
    sequence: packet.sequence,
    key: packet.key,
    semantic: packet.normalized.semantic
  };
}

function summarize(steps) {
  return steps.reduce((summary, step) => {
    summary.steps += 1;
    summary.humanPackets += step.humanPacketCount;
    summary.botPackets += step.botPacketCount;
    summary.missing += step.missing.length;
    summary.extra += step.extra.length;
    summary.mismatched += step.mismatched.length;
    if (!step.botBounds?.completed) summary.incompleteBotSteps += 1;
    if (!step.humanBounds?.completed) summary.incompleteHumanSteps += 1;
    return summary;
  }, {
    steps: 0,
    humanPackets: 0,
    botPackets: 0,
    missing: 0,
    extra: 0,
    mismatched: 0,
    incompleteHumanSteps: 0,
    incompleteBotSteps: 0
  });
}

function renderMarkdown(report) {
  const lines = [
    `# Packet Comparison - ${report.scenario}`,
    "",
    `Pass: ${report.pass ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    `- Steps: ${report.summary.steps}`,
    `- Human packets: ${report.summary.humanPackets}`,
    `- Bot packets: ${report.summary.botPackets}`,
    `- Missing bot packets: ${report.summary.missing}`,
    `- Extra bot packets: ${report.summary.extra}`,
    `- Mismatched packets: ${report.summary.mismatched}`,
    `- Incomplete human steps: ${report.summary.incompleteHumanSteps}`,
    `- Incomplete bot steps: ${report.summary.incompleteBotSteps}`,
    ""
  ];
  for (const step of report.steps) {
    lines.push(`## Step ${step.step}`, "");
    lines.push(`- Human packets: ${step.humanPacketCount}`);
    lines.push(`- Bot packets: ${step.botPacketCount}`);
    lines.push(`- Missing: ${step.missing.length}`);
    lines.push(`- Extra: ${step.extra.length}`);
    lines.push(`- Mismatched: ${step.mismatched.length}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function loadScenario(value) {
  const direct = path.resolve(value);
  const scenarioPath = fs.existsSync(direct)
    ? direct
    : path.join(path.resolve(__dirname, ".."), "test", "recorded-bds", "scenarios", `${value}.json`);
  return JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
}

function diffValues(a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) || Array.isArray(b)) {
    return { human: a, bot: b };
  }
  const output = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of Array.from(keys).sort()) {
    const child = diffValues(a[key], b[key]);
    if (child) output[key] = child;
  }
  return Object.keys(output).length ? output : null;
}

function deletePath(value, dottedPath) {
  const parts = dottedPath.split(".");
  let current = value;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (!current || typeof current !== "object") return;
    current = current[parts[index]];
  }
  if (current && typeof current === "object") delete current[parts[parts.length - 1]];
}

function clone(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function writeFile(file, contents) {
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, contents, "utf8");
}

function csv(raw) {
  return String(raw || "").split(",").map(value => value.trim()).filter(Boolean);
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv);
  } catch (err) {
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_IGNORE_PATHS,
  DEFAULT_PACKET_NAMES,
  alignPackets,
  comparePacketDbs,
  diffValues,
  renderMarkdown
};
