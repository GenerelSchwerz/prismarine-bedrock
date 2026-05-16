#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");
const { createDeserializer } = require("bedrock-protocol/src/transforms/serializer");
const { bedrockVersionFromEnv, normalizeBedrockVersion } = require("../src/version");

function usage() {
  const script = path.relative(process.cwd(), __filename);
  console.error(`Usage:
  node ${script} <recording.jsonl> [version] --out=logs/packet-recording.sqlite

Builds a disposable SQLite index from compact_packet_v1 Endstone packet recordings.
The JSONL capture remains the source of truth; regenerate the SQLite file when needed.
`);
}

const args = process.argv.slice(2);
const file = args.shift();
if (!file || file === "--help" || file === "-h") {
  usage();
  process.exit(file ? 0 : 1);
}

let versionArg = null;
let outFile = null;
for (const arg of args) {
  if (arg.startsWith("--out=")) {
    outFile = arg.slice("--out=".length);
  } else if (!versionArg) {
    versionArg = arg;
  } else {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

if (!outFile) throw new Error("--out is required.");

const version = normalizeBedrockVersion(versionArg || bedrockVersionFromEnv());
const deserializer = createDeserializer(version);

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});

async function main() {
  const resolvedOut = path.resolve(outFile);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
  if (fs.existsSync(resolvedOut)) fs.unlinkSync(resolvedOut);

  const db = new Database(resolvedOut);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  createSchema(db);

  const insertMeta = db.prepare("insert into recording_meta(key, value) values (?, ?)");
  const insertEvent = db.prepare(`
    insert into events(sequence, ts, type, player, step, step_index, event_json)
    values (@sequence, @ts, @type, @player, @step, @step_index, @event_json)
  `);
  const insertPacket = db.prepare(`
    insert into packets(sequence, ts, direction, packet_id, name, player, sub_client_id, address, payload_size, payload_sha256, decoded_json, error)
    values (@sequence, @ts, @direction, @packet_id, @name, @player, @sub_client_id, @address, @payload_size, @payload_sha256, @decoded_json, @error)
  `);
  const insertField = db.prepare(`
    insert into packet_fields(sequence, path, value_json, value_text, value_type)
    values (?, ?, ?, ?, ?)
  `);
  insertMeta.run("source_file", path.resolve(file));
  insertMeta.run("version", version);
  insertMeta.run("format", "compact_packet_v1");
  insertMeta.run("created_at", new Date().toISOString());

  let eventCount = 0;
  let packetCount = 0;
  let fieldCount = 0;
  const insertMany = db.transaction(records => {
    for (const record of records) {
      if (record.kind === "event") {
        insertEvent.run(record.value);
        eventCount += 1;
      } else if (record.kind === "packet") {
        insertPacket.run(record.value.packet);
        packetCount += 1;
        for (const field of record.value.fields) {
          insertField.run(record.value.packet.sequence, field.path, field.value_json, field.value_text, field.value_type);
          fieldCount += 1;
        }
      }
    }
  });

  const input = fs.createReadStream(path.resolve(file), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let batch = [];
  for await (const line of lines) {
    const record = parseLine(line);
    if (record) batch.push(record);
    if (batch.length >= 500) {
      insertMany(batch);
      batch = [];
    }
  }
  if (batch.length) insertMany(batch);

  createIndexes(db);
  db.close();
  console.log(JSON.stringify({ out: resolvedOut, events: eventCount, packets: packetCount, fields: fieldCount }));
}

function createSchema(db) {
  db.exec(`
    create table recording_meta(
      key text primary key,
      value text
    );

    create table events(
      sequence integer primary key,
      ts real not null,
      type text not null,
      player text,
      step text,
      step_index integer,
      event_json text not null
    );

    create table packets(
      sequence integer primary key,
      ts real not null,
      direction text not null,
      packet_id integer not null,
      name text,
      player text,
      sub_client_id integer,
      address text,
      payload_size integer,
      payload_sha256 text,
      decoded_json text,
      error text
    );

    create table packet_fields(
      sequence integer not null,
      path text not null,
      value_json text not null,
      value_text text,
      value_type text not null,
      foreign key(sequence) references packets(sequence)
    );
  `);
}

function createIndexes(db) {
  db.exec(`
    create index idx_events_type_sequence on events(type, sequence);
    create index idx_events_player_sequence on events(player, sequence);
    create index idx_events_step_sequence on events(step, sequence);
    create index idx_packets_name_sequence on packets(name, sequence);
    create index idx_packets_id_sequence on packets(packet_id, sequence);
    create index idx_packets_player_sequence on packets(player, sequence);
    create index idx_packet_fields_path_value on packet_fields(path, value_text, sequence);
  `);
}

function parseLine(line) {
  if (!line.trim()) return null;
  const value = JSON.parse(line);
  const packet = compactPacketRecord(value);
  if (packet) return { kind: "packet", value: decodePacket(packet) };
  if (!value || typeof value !== "object" || Array.isArray(value) || !value.type) return null;
  return {
    kind: "event",
    value: {
      sequence: Number(value.sequence || 0),
      ts: Number(value.ts || 0),
      type: String(value.type),
      player: value.player || null,
      step: value.step || null,
      step_index: value.step_index ?? null,
      event_json: JSON.stringify(value, jsonSafeReplacer)
    }
  };
}

function compactPacketRecord(value) {
  if (!Array.isArray(value) || value[0] !== "p") return null;
  return {
    sequence: value[1],
    ts: value[2],
    direction: value[3] === "r" ? "receive" : "send",
    packet_id: value[4],
    sub_client_id: value[5],
    player: value[6],
    address: value[7],
    payload_base64: value[8],
    payload_size: value[9],
    payload_sha256: value[10]
  };
}

function decodePacket(record) {
  let decoded = null;
  let error = null;
  const payload = Buffer.from(record.payload_base64 || "", "base64");
  const buffer = Buffer.concat([writeUnsignedVarInt(Number(record.packet_id)), payload]);
  try {
    decoded = deserializer.parsePacketBuffer(buffer);
  } catch (err) {
    error = err.message;
  }

  const decodedJson = decoded ? JSON.stringify(decoded, jsonSafeReplacer) : null;
  return {
    packet: {
      sequence: record.sequence,
      ts: record.ts,
      direction: record.direction,
      packet_id: record.packet_id,
      name: decoded?.data?.name || null,
      player: record.player,
      sub_client_id: record.sub_client_id,
      address: record.address,
      payload_size: record.payload_size,
      payload_sha256: record.payload_sha256,
      decoded_json: decodedJson,
      error
    },
    fields: decoded ? scalarFields(decoded.data?.params || {}, "params") : []
  };
}

function scalarFields(value, prefix) {
  const output = [];
  visit(value, prefix);
  return output;

  function visit(current, currentPath) {
    if (current === null || current === undefined || typeof current !== "object") {
      const stored = current === undefined ? null : current;
      output.push({
        path: currentPath,
        value_json: JSON.stringify(stored, jsonSafeReplacer),
        value_text: current === null || current === undefined ? null : String(current),
        value_type: current === null ? "null" : typeof current
      });
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((entry, index) => visit(entry, `${currentPath}.${index}`));
      return;
    }
    for (const key of Object.keys(current)) {
      if (key === "payload" || key === "payload_base64" || key === "raw" || key === "nbt") continue;
      visit(current[key], `${currentPath}.${key}`);
    }
  }
}

function jsonSafeReplacer(_, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

function writeUnsignedVarInt(value) {
  const bytes = [];
  let remaining = value >>> 0;
  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining !== 0);
  return Buffer.from(bytes);
}
