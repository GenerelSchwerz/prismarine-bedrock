#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createDeserializer } = require("bedrock-protocol/src/transforms/serializer");
const { bedrockVersionFromEnv, normalizeBedrockVersion } = require("../src/version");

function usage() {
  const script = path.relative(process.cwd(), __filename);
  console.error(`Usage:
  node ${script} <recording.jsonl> [version] [--packet-ids=147,148] [--packet-names=item_stack_request,text]
    [--where=params.requests.0.request_id=4] [--field=params.requests.0.request_id] [--field=request_id:params.requests.0.request_id]
    [--count] [--out=logs/query.jsonl]

Queries compact_packet_v1 Endstone packet recordings. Packet fields are decoded with the selected Bedrock protocol version.
Use --where repeatedly for equality predicates. Values are parsed as JSON when possible, otherwise as strings.
Use --field repeatedly to project only specific decoded or metadata paths. Metadata paths include sequence, ts, direction, packet_id, name, player.
`);
}

const args = process.argv.slice(2);
const file = args.shift();
if (!file || file === "--help" || file === "-h") {
  usage();
  process.exit(file ? 0 : 1);
}

let versionArg = null;
let packetIds = null;
let packetNames = null;
let outFile = null;
let countOnly = false;
const predicates = [];
const fields = [];

for (const arg of args) {
  if (arg.startsWith("--packet-ids=")) {
    packetIds = parseCsvSet(arg.slice("--packet-ids=".length), value => Number.parseInt(value, 0));
  } else if (arg.startsWith("--packet-names=")) {
    packetNames = parseCsvSet(arg.slice("--packet-names=".length), String);
  } else if (arg.startsWith("--where=")) {
    predicates.push(parsePredicate(arg.slice("--where=".length)));
  } else if (arg.startsWith("--field=")) {
    fields.push(parseField(arg.slice("--field=".length)));
  } else if (arg === "--count") {
    countOnly = true;
  } else if (arg.startsWith("--out=")) {
    outFile = arg.slice("--out=".length);
  } else if (!versionArg) {
    versionArg = arg;
  } else {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const version = normalizeBedrockVersion(versionArg || bedrockVersionFromEnv());
const deserializer = createDeserializer(version);

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});

async function main() {
  const output = outFile ? createOutputStream(outFile) : process.stdout;
  const counts = new Map();
  const input = fs.createReadStream(path.resolve(file), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of lines) {
    const record = parseCompactPacketLine(line);
    if (!record) continue;
    if (packetIds && !packetIds.has(Number(record.packet_id))) continue;

    const decoded = decodePacket(record);
    const queryRecord = {
      sequence: record.sequence,
      ts: record.ts,
      direction: record.direction,
      packet_id: record.packet_id,
      name: decoded.data?.name || null,
      player: record.player,
      params: decoded.data?.params || null,
      error: decoded.error
    };

    if (packetNames && !packetNames.has(queryRecord.name)) continue;
    if (!matchesPredicates(queryRecord, predicates)) continue;

    if (countOnly) {
      const key = `${queryRecord.direction}:${queryRecord.packet_id}:${queryRecord.name || "unknown"}`;
      counts.set(key, (counts.get(key) || 0) + 1);
      continue;
    }

    const outputRecord = fields.length ? projectFields(queryRecord, fields) : queryRecord;
    output.write(`${JSON.stringify(outputRecord, jsonSafeReplacer)}\n`);
  }

  if (countOnly) {
    for (const [key, count] of Array.from(counts.entries()).sort()) {
      const [direction, packetId, name] = key.split(":");
      output.write(`${JSON.stringify({ direction, packet_id: Number(packetId), name, count })}\n`);
    }
  }

  if (outFile) {
    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on("error", reject);
    });
  }
}

function parseCompactPacketLine(line) {
  if (!line.trim()) return null;
  const value = JSON.parse(line);
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
  const payload = Buffer.from(record.payload_base64 || "", "base64");
  const buffer = Buffer.concat([writeUnsignedVarInt(Number(record.packet_id)), payload]);
  try {
    return { data: deserializer.parsePacketBuffer(buffer), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function parsePredicate(raw) {
  const index = raw.indexOf("=");
  if (index === -1) throw new Error(`Invalid --where value: ${raw}`);
  return {
    path: raw.slice(0, index),
    expected: parseExpectedValue(raw.slice(index + 1))
  };
}

function parseField(raw) {
  const index = raw.indexOf(":");
  if (index === -1) return { label: raw, path: raw };
  return { label: raw.slice(0, index), path: raw.slice(index + 1) };
}

function parseExpectedValue(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function matchesPredicates(record, checks) {
  for (const check of checks) {
    if (JSON.stringify(valueAtPath(record, check.path), jsonSafeReplacer) !== JSON.stringify(check.expected, jsonSafeReplacer)) {
      return false;
    }
  }
  return true;
}

function projectFields(record, selectedFields) {
  const output = {
    sequence: record.sequence,
    packet_id: record.packet_id,
    name: record.name
  };
  for (const field of selectedFields) {
    output[field.label] = valueAtPath(record, field.path);
  }
  return output;
}

function valueAtPath(value, dottedPath) {
  let current = value;
  for (const part of dottedPath.split(".")) {
    if (current == null) return null;
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)];
    } else if (typeof current === "object") {
      current = current[part];
    } else {
      return null;
    }
  }
  return current === undefined ? null : current;
}

function createOutputStream(filePath) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return fs.createWriteStream(resolved, { encoding: "utf8" });
}

function parseCsvSet(raw, convert) {
  const values = String(raw || "").split(",").map(value => value.trim()).filter(Boolean).map(convert);
  return values.length ? new Set(values) : null;
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
