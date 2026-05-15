"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

describe("packet recording query tool", function () {
  const tmpDir = path.join(__dirname, "..", "..", "scripts", "tmp");
  const fixture = path.join(tmpDir, "packet-query-fixture.jsonl");

  before(function () {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(fixture, [
      JSON.stringify({ type: "recorder_start", packet_record_format: "compact_packet_v1" }),
      JSON.stringify(["p", 1, 1000, "r", 147, 0, "OpBot", "127.0.0.1", "", 0, "e3b0c442"]),
      JSON.stringify(["p", 2, 1001, "s", 148, 0, "OpBot", "127.0.0.1", "", 0, "e3b0c442"])
    ].join("\n"));
  });

  it("counts compact packet rows by direction and id", function () {
    const output = execFileSync(process.execPath, [
      "scripts/query-packet-recording.js",
      fixture,
      "1.26.10",
      "--packet-ids=147",
      "--count"
    ], {
      cwd: path.join(__dirname, "..", ".."),
      encoding: "utf8"
    }).trim();

    assert.deepStrictEqual(JSON.parse(output), {
      direction: "receive",
      packet_id: 147,
      name: "unknown",
      count: 1
    });
  });

  it("projects metadata fields from compact packet rows", function () {
    const output = execFileSync(process.execPath, [
      "scripts/query-packet-recording.js",
      fixture,
      "1.26.10",
      "--packet-ids=148",
      "--field=direction",
      "--field=player"
    ], {
      cwd: path.join(__dirname, "..", ".."),
      encoding: "utf8"
    }).trim();

    assert.deepStrictEqual(JSON.parse(output), {
      sequence: 2,
      packet_id: 148,
      name: null,
      direction: "send",
      player: "OpBot"
    });
  });
});
