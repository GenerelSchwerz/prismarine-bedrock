#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { createDeserializer } = require("bedrock-protocol/src/transforms/serializer");
const { bedrockVersionFromEnv, normalizeBedrockVersion } = require("../src/version");

function usage() {
  const script = path.relative(process.cwd(), __filename);
  console.error(`Usage:
  node ${script} <recording.jsonl> [version]

Reads JSONL from the Endstone packet recorder and writes decoded packet JSONL to stdout.
`);
}

const file = process.argv[2];
if (!file || file === "--help" || file === "-h") {
  usage();
  process.exit(file ? 0 : 1);
}

const version = normalizeBedrockVersion(process.argv[3] || bedrockVersionFromEnv());
const deserializer = createDeserializer(version);
const input = fs.readFileSync(path.resolve(file), "utf8");

for (const line of input.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const record = JSON.parse(line);
  if (record.type !== "packet") continue;

  const payload = Buffer.from(record.payload_base64 || "", "base64");
  const buffer = Buffer.concat([writeUnsignedVarInt(Number(record.packet_id)), payload]);
  const output = {
    ts: record.ts,
    sequence: record.sequence,
    direction: record.direction,
    packet_id: record.packet_id,
    sub_client_id: record.sub_client_id,
    player: record.player,
    decoded: null,
    error: null
  };

  try {
    const parsed = deserializer.parsePacketBuffer(buffer);
    output.decoded = parsed.data;
  } catch (err) {
    output.error = err.message;
  }

  process.stdout.write(`${JSON.stringify(output)}\n`);
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
