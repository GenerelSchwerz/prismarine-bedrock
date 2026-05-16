"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const Database = require("better-sqlite3");

describe("packet recording sqlite index", function () {
  const root = path.join(__dirname, "..", "..");
  const tmpDir = path.join(root, "scripts", "tmp");
  const fixture = path.join(tmpDir, "packet-db-fixture.jsonl");
  const dbFile = path.join(tmpDir, "packet-db-fixture.sqlite");

  before(function () {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(fixture, [
      JSON.stringify({ type: "recorder_start", sequence: 1, ts: 1000, packet_record_format: "compact_packet_v1" }),
      JSON.stringify({ type: "step_start", sequence: 10, ts: 1010, player: "OpBot", step: "open_table", step_index: 0 }),
      JSON.stringify(["p", 11, 1011, "r", 147, 0, "OpBot", "127.0.0.1", "", 0, "e3b0c442"]),
      JSON.stringify(["p", 12, 1012, "s", 148, 0, "OpBot", "127.0.0.1", "", 0, "e3b0c442"]),
      JSON.stringify({ type: "step_complete", sequence: 20, ts: 1020, player: "OpBot", step: "open_table", step_index: 0 })
    ].join("\n"));
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  });

  it("indexes compact packet rows and event markers into sqlite", function () {
    const output = execFileSync(process.execPath, [
      "scripts/index-packet-recording.js",
      fixture,
      "1.26.10",
      `--out=${dbFile}`
    ], { cwd: root, encoding: "utf8" }).trim();

    assert.strictEqual(JSON.parse(output).packets, 2);
    const db = new Database(dbFile, { readonly: true });
    try {
      assert.strictEqual(db.prepare("select count(*) as count from events").get().count, 3);
      assert.strictEqual(db.prepare("select count(*) as count from packets").get().count, 2);
    } finally {
      db.close();
    }
  });

  it("queries packets inside event bounds with sampling", function () {
    const output = execFileSync(process.execPath, [
      "scripts/query-packet-db.js",
      dbFile,
      "--after-event=step_start",
      "--after-where=step=open_table",
      "--before-event=step_complete",
      "--before-where=step=open_table",
      "--sample=2",
      "--field=direction"
    ], { cwd: root, encoding: "utf8" }).trim();

    assert.deepStrictEqual(JSON.parse(output), {
      sequence: 11,
      ts: 1011,
      direction: "receive",
      packet_id: 147,
      name: null,
      player: "OpBot"
    });
  });

  it("matches wildcard flattened field predicates", function () {
    const db = new Database(dbFile);
    try {
      db.prepare(`
        insert into packet_fields(sequence, path, value_json, value_text, value_type)
        values (?, ?, ?, ?, ?)
      `).run(11, "params.requests.0.actions.0.type_id", JSON.stringify("take"), "take", "string");
    } finally {
      db.close();
    }

    const output = execFileSync(process.execPath, [
      "scripts/query-packet-db.js",
      dbFile,
      "--where=params.requests.*.actions.*.type_id=take",
      "--field=direction"
    ], { cwd: root, encoding: "utf8" }).trim();

    assert.deepStrictEqual(JSON.parse(output), {
      sequence: 11,
      ts: 1011,
      direction: "receive",
      packet_id: 147,
      name: null,
      player: "OpBot"
    });
  });
});
