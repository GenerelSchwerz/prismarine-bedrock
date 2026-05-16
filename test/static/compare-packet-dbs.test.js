"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const {
  comparePacketDbs
} = require("../../scripts/compare-packet-dbs");

describe("packet DB comparison", function () {
  const root = path.join(__dirname, "..", "..");
  const tmp = path.join(root, "scripts", "tmp", "compare-packet-dbs");
  const scenario = path.join(tmp, "scenario.json");

  before(function () {
    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(scenario, JSON.stringify({
      id: "compare-static",
      steps: [{ id: "first" }]
    }));
  });

  it("passes matching traces while ignoring routine auth input jitter", function () {
    const human = fixtureDb("matching-human", [
      packet(2, "receive", "player_auth_input", { tick: 1, yaw: 10, input_mode: "touch" })
    ]);
    const bot = fixtureDb("matching-bot", [
      packet(2, "receive", "player_auth_input", { tick: 99, yaw: 45, input_mode: "touch" })
    ]);

    const report = comparePacketDbs({ human, bot, scenario, packetNames: ["player_auth_input"], ignorePaths: undefined });
    assert.strictEqual(report.pass, true);
    assert.strictEqual(report.summary.mismatched, 0);
  });

  it("reports missing bot packets", function () {
    const human = fixtureDb("missing-human", [
      packet(2, "receive", "animate", { action_id: "swing_arm" })
    ]);
    const bot = fixtureDb("missing-bot", []);

    const report = comparePacketDbs({ human, bot, scenario, packetNames: ["animate"], ignorePaths: [] });
    assert.strictEqual(report.pass, false);
    assert.strictEqual(report.summary.missing, 1);
  });

  it("reports extra bot packets", function () {
    const human = fixtureDb("extra-human", []);
    const bot = fixtureDb("extra-bot", [
      packet(2, "receive", "animate", { action_id: "swing_arm" })
    ]);

    const report = comparePacketDbs({ human, bot, scenario, packetNames: ["animate"], ignorePaths: [] });
    assert.strictEqual(report.pass, false);
    assert.strictEqual(report.summary.extra, 1);
  });

  it("reports nested field mismatches", function () {
    const human = fixtureDb("mismatch-human", [
      packet(2, "send", "inventory_slot", { window_id: 0, slot: 1, item: { count: 1 } })
    ]);
    const bot = fixtureDb("mismatch-bot", [
      packet(2, "send", "inventory_slot", { window_id: 0, slot: 1, item: { count: 2 } })
    ]);

    const report = comparePacketDbs({ human, bot, scenario, packetNames: ["inventory_slot"], ignorePaths: [] });
    assert.strictEqual(report.pass, false);
    assert.strictEqual(report.summary.mismatched, 1);
    assert.deepStrictEqual(report.steps[0].mismatched[0].diff.params.item.count, { human: 1, bot: 2 });
  });

  it("uses the first matching end event after the step start", function () {
    const human = fixtureDb("bounds-human", [
      packet(2, "receive", "animate", { action_id: "first" }),
      packet(5, "receive", "animate", { action_id: "outside" })
    ], { extraEvents: [{ sequence: 4, type: "step_complete", step: "first" }] });
    const bot = fixtureDb("bounds-bot", [
      packet(2, "receive", "animate", { action_id: "first" })
    ]);

    const report = comparePacketDbs({ human, bot, scenario, packetNames: ["animate"], ignorePaths: [] });
    assert.strictEqual(report.pass, true);
    assert.strictEqual(report.summary.humanPackets, 1);
  });

  function fixtureDb(name, packets, options = {}) {
    const file = path.join(tmp, `${name}.sqlite`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    const db = new Database(file);
    try {
      db.exec(`
        create table events(sequence integer primary key, ts real, type text, player text, step text, step_index integer, event_json text);
        create table packets(sequence integer primary key, ts real, direction text, packet_id integer, name text, player text, sub_client_id integer, address text, payload_size integer, payload_sha256 text, decoded_json text, error text);
      `);
      const insertEvent = db.prepare("insert into events(sequence, ts, type, player, step, step_index, event_json) values (?, ?, ?, ?, ?, ?, ?)");
      insertEvent.run(1, 1, "step_start", "OpBot", "first", 0, JSON.stringify({ type: "step_start", step: "first" }));
      for (const event of options.extraEvents || []) {
        insertEvent.run(event.sequence, event.sequence, event.type, "OpBot", event.step, 0, JSON.stringify(event));
      }
      if (!options.extraEvents?.some(event => event.type === "step_complete")) {
        insertEvent.run(10, 10, "step_complete", "OpBot", "first", 0, JSON.stringify({ type: "step_complete", step: "first" }));
      }
      const insertPacket = db.prepare("insert into packets(sequence, ts, direction, packet_id, name, player, sub_client_id, address, payload_size, payload_sha256, decoded_json, error) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const entry of packets) {
        insertPacket.run(entry.sequence, entry.sequence, entry.direction, entry.packet_id, entry.name, "OpBot", 0, "", 0, "", JSON.stringify({ name: entry.name, params: entry.params }), null);
      }
    } finally {
      db.close();
    }
    return file;
  }

  function packet(sequence, direction, name, params) {
    return { sequence, direction, name, packet_id: packetId(name), params };
  }

  function packetId(name) {
    return {
      player_auth_input: 144,
      animate: 44,
      inventory_slot: 50
    }[name] || 0;
  }
});
