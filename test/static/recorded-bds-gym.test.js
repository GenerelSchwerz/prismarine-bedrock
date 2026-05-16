"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  botScriptPath,
  buildBotLaunchCommand,
  buildHumanLaunchCommand,
  describeRun,
  gymStatus,
  hasCompletedScenario,
  latestRun,
  resolveScenario,
  scenarioLogRoot
} = require("../../scripts/recorded-bds-gym");

describe("recorded BDS gym orchestration", function () {
  const root = path.join(__dirname, "..", "..");

  it("resolves existing scenario ids and reports missing scenarios", function () {
    const existing = resolveScenario("craft-planks-and-place");
    assert.strictEqual(existing.exists, true);
    assert.strictEqual(existing.id, "craft-planks-and-place");
    assert.ok(existing.path.endsWith(path.join("test", "recorded-bds", "scenarios", "craft-planks-and-place.json")));

    const missing = resolveScenario("missing-static-scenario");
    assert.strictEqual(missing.exists, false);
    assert.strictEqual(missing.id, "missing-static-scenario");
  });

  it("detects completed scenario markers", function () {
    assert.strictEqual(hasCompletedScenario([
      { type: "scenario_complete" },
      { type: "scenario_end", status: "complete" }
    ]), true);
    assert.strictEqual(hasCompletedScenario([
      { type: "scenario_complete" },
      { type: "scenario_end", status: "abandoned" }
    ]), false);
  });

  it("describes and selects latest completed runs", function () {
    const scenario = { id: "static-gym-run", exists: true, path: "unused" };
    const base = path.join(scenarioLogRoot(scenario), "human");
    fs.mkdirSync(path.join(base, "001-incomplete"), { recursive: true });
    fs.mkdirSync(path.join(base, "002-complete"), { recursive: true });
    fs.writeFileSync(path.join(base, "001-incomplete", "packets.jsonl"), [
      JSON.stringify({ type: "scenario_complete", sequence: 1, ts: 1 })
    ].join("\n"));
    fs.writeFileSync(path.join(base, "002-complete", "packets.jsonl"), [
      JSON.stringify({ type: "scenario_complete", sequence: 1, ts: 1 }),
      JSON.stringify({ type: "scenario_end", status: "complete", sequence: 2, ts: 2 })
    ].join("\n"));

    const run = latestRun(scenario, "human", candidate => candidate.completed);
    assert.strictEqual(run.id, "002-complete");
    assert.strictEqual(describeRun(run.dir).completed, true);
  });

  it("builds human and bot launch commands without executing them", function () {
    const scenario = resolveScenario("craft-planks-and-place");
    const human = buildHumanLaunchCommand(scenario, "packets.jsonl").join(" ");
    assert.match(human, /e2e-servers\.js/);
    assert.match(human, /--target=endstone/);
    assert.match(human, /--endstone-scenario=/);

    const botScript = botScriptPath(scenario);
    const bot = buildBotLaunchCommand(scenario, "packets.jsonl", botScript, "OpBot").join(" ");
    assert.match(bot, /--endstone-packet-recorder-player=OpBot/);
    assert.match(bot, /--exit-after-client/);
    assert.match(bot, /--client/);
  });

  it("reports promotion readiness only with completed bot and passing compare", function () {
    const scenario = { id: "static-gym-promotion", exists: true, path: path.join(root, "test", "recorded-bds", "scenarios", "craft-planks-and-place.json") };
    const botDir = path.join(scenarioLogRoot(scenario), "bot", "001-complete");
    const compareDir = path.join(scenarioLogRoot(scenario), "compare");
    fs.mkdirSync(botDir, { recursive: true });
    fs.mkdirSync(compareDir, { recursive: true });
    fs.writeFileSync(path.join(botDir, "packets.jsonl"), [
      JSON.stringify({ type: "scenario_complete", sequence: 1, ts: 1 }),
      JSON.stringify({ type: "scenario_end", status: "complete", sequence: 2, ts: 2 })
    ].join("\n"));
    fs.writeFileSync(path.join(compareDir, "001.json"), JSON.stringify({ pass: true, summary: { missing: 0 } }));

    const status = gymStatus(scenario, {});
    assert.strictEqual(status.promotionReady, true);
  });
});
