#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createDeserializer } = require("bedrock-protocol/src/transforms/serializer");
const { bedrockVersionFromEnv, normalizeBedrockVersion } = require("../src/version");

const PLAYER_AUTH_INPUT_PACKET_ID = 0x90;
const DEFAULT_AUTH_INPUT_DELTA_IGNORE = [
  "tick",
  "camera_orientation",
  "interact_rotation",
  "pitch",
  "yaw",
  "head_yaw",
  "position",
  "delta",
  "move_vector",
  "analogue_move_vector",
  "raw_move_vector"
];

function usage() {
  const script = path.relative(process.cwd(), __filename);
  console.error(`Usage:
  node ${script} <recording.jsonl> [version] [--packet-ids=46,147,148] [--player-auth-input-delta-ignore=tick,yaw] [--full] [--out=logs/decoded.jsonl]

Reads JSONL from the Endstone packet recorder and writes decoded packet JSONL to stdout.
Default output is a compact summary for agent/human analysis; use --full for full decoded packet params.
Use --out to write decoded JSONL to a file that can be searched with rg without loading it into chat.
player_auth_input is printed as semantic deltas: the first packet for each stream, then only non-ignored decoded state changes.
`);
}

const args = process.argv.slice(2);
const file = args.shift();
if (!file || file === "--help" || file === "-h") {
  usage();
  process.exit(file ? 0 : 1);
}

let versionArg = null;
let playerAuthInputDeltaIgnore = new Set(DEFAULT_AUTH_INPUT_DELTA_IGNORE);
let packetIds = null;
let fullOutput = false;
let outFile = null;

for (const arg of args) {
  if (arg.startsWith("--player-auth-input-delta-ignore=")) {
    playerAuthInputDeltaIgnore = parseCsvSet(arg.slice("--player-auth-input-delta-ignore=".length));
  } else if (arg.startsWith("--packet-ids=")) {
    packetIds = parsePacketIds(arg.slice("--packet-ids=".length));
  } else if (arg === "--full") {
    fullOutput = true;
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
const lastPlayerAuthInputByStream = new Map();

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});

async function main() {
  const input = fs.createReadStream(path.resolve(file), { encoding: "utf8" });
  const output = outFile ? createOutputStream(outFile) : process.stdout;
  const lines = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  for await (const line of lines) {
    processLine(line, output);
  }

  if (outFile) {
    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on("error", reject);
    });
  }
}

function createOutputStream(filePath) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return fs.createWriteStream(resolved, { encoding: "utf8" });
}

function processLine(line, writer) {
  if (!line.trim()) return;
  const record = JSON.parse(line);
  if (record.type !== "packet") return;
  const packetId = Number(record.packet_id);
  if (packetIds && !packetIds.has(packetId)) return;

  const payload = Buffer.from(record.payload_base64 || "", "base64");
  const buffer = Buffer.concat([writeUnsignedVarInt(Number(record.packet_id)), payload]);
  const decodedRecord = {
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
    decodedRecord.decoded = parsed.data;
  } catch (err) {
    decodedRecord.error = err.message;
  }

  if (packetId === PLAYER_AUTH_INPUT_PACKET_ID) {
    const delta = playerAuthInputDelta(record, decodedRecord.decoded);
    if (!delta) return;
    decodedRecord.decoded = decodedRecord.decoded ? { name: decodedRecord.decoded.name } : null;
    decodedRecord.player_auth_input_delta = delta;
  }

  if (!fullOutput) summarizeOutput(decodedRecord);
  writer.write(`${JSON.stringify(decodedRecord, jsonSafeReplacer)}\n`);
}

function summarizeOutput(output) {
  const name = output.decoded?.name;
  const params = output.decoded?.params;
  output.name = name || null;

  if (output.player_auth_input_delta) {
    output.summary = summarizePlayerAuthInputDelta(output.player_auth_input_delta);
    delete output.player_auth_input_delta;
    delete output.decoded;
    return;
  }

  output.summary = summarizePacket(name, params);
  delete output.decoded;
}

function summarizePacket(name, params) {
  if (!params) return null;
  switch (name) {
    case "item_stack_request":
      return {
        requests: (params.requests || []).map(request => ({
          request_id: request.request_id,
          cause: request.cause,
          actions: (request.actions || []).map(summarizeStackRequestAction),
          custom_names: request.custom_names?.length || 0
        }))
      };
    case "item_stack_response":
      return {
        responses: (params.responses || []).map(response => ({
          request_id: response.request_id,
          status: response.status,
          containers: (response.containers || []).map(container => ({
            slot_type: summarizeSlotType(container.slot_type),
            slots: (container.slots || []).map(summarizeResponseSlot)
          }))
        }))
      };
    case "inventory_transaction":
      return {
        transaction: params.transaction?.transaction_type,
        action_type: params.transaction?.transaction_data?.action_type,
        block_position: params.transaction?.transaction_data?.block_position,
        block_face: params.transaction?.transaction_data?.block_face,
        hotbar_slot: params.transaction?.transaction_data?.hotbar_slot,
        item: summarizeItem(params.transaction?.transaction_data?.item_in_hand),
        player_pos: params.transaction?.transaction_data?.player_pos,
        click_pos: params.transaction?.transaction_data?.click_pos,
        actions: params.transaction?.actions?.length || 0
      };
    case "container_open":
      return {
        window_id: params.window_id,
        window_type: params.window_type,
        coordinates: params.coordinates,
        runtime_entity_id: stringifyBigInt(params.runtime_entity_id)
      };
    case "container_close":
      return {
        window_id: params.window_id,
        server: params.server
      };
    case "interact":
      return {
        action_id: params.action_id,
        target_entity_id: stringifyBigInt(params.target_entity_id),
        position: params.position
      };
    case "animate":
      return {
        action_id: params.action_id,
        runtime_entity_id: stringifyBigInt(params.runtime_entity_id)
      };
    case "mob_equipment":
      return {
        runtime_entity_id: stringifyBigInt(params.runtime_entity_id),
        slot: params.slot,
        selected_slot: params.selected_slot,
        item: summarizeItem(params.item)
      };
    case "inventory_content":
      return {
        window_id: params.window_id,
        slots: (params.input || []).map((item, slot) => ({ slot, item: summarizeItem(item) })).filter(entry => entry.item)
      };
    case "inventory_slot":
      return {
        window_id: params.window_id,
        slot: params.slot,
        item: summarizeItem(params.item)
      };
    default:
      return compactValue(params, 2);
  }
}

function summarizePlayerAuthInputDelta(delta) {
  return {
    initial: delta.initial,
    ignored: delta.ignored,
    changes: delta.initial ? summarizeAuthInputParams(delta.changes) : compactValue(delta.changes, 3)
  };
}

function summarizeAuthInputParams(params) {
  if (!params || typeof params !== "object") return params;
  const summary = {
    pitch: params.pitch,
    yaw: params.yaw,
    head_yaw: params.head_yaw,
    position: params.position,
    move_vector: params.move_vector,
    delta: params.delta,
    input_mode: params.input_mode,
    play_mode: params.play_mode,
    interaction_model: params.interaction_model
  };
  const flags = trueFlags(params.input_data);
  if (flags.length) summary.input_flags = flags;
  if (params.item_stack_request) {
    summary.item_stack_request = summarizePacket("item_stack_request", { requests: [params.item_stack_request] });
  }
  if (params.block_actions?.length) summary.block_actions = compactValue(params.block_actions, 2);
  return summary;
}

function trueFlags(flags) {
  if (!flags || typeof flags !== "object") return [];
  return Object.keys(flags).filter(key => key !== "_value" && flags[key] === true).sort();
}

function summarizeStackRequestAction(action) {
  const summary = { type_id: action.type_id };
  if (action.count !== undefined) summary.count = action.count;
  if (action.recipe_network_id !== undefined) summary.recipe_network_id = action.recipe_network_id;
  if (action.times_crafted !== undefined) summary.times_crafted = action.times_crafted;
  if (action.times_crafted_2 !== undefined) summary.times_crafted_2 = action.times_crafted_2;
  if (action.source) summary.source = summarizeSlotInfo(action.source);
  if (action.destination) summary.destination = summarizeSlotInfo(action.destination);
  if (action.result_items) summary.result_items = action.result_items.map(summarizeItem);
  if (action.ingredients) summary.ingredients = action.ingredients.map(compactIngredient);
  if (action.randomly !== undefined) summary.randomly = action.randomly;
  return summary;
}

function summarizeSlotInfo(slotInfo) {
  return {
    slot_type: summarizeSlotType(slotInfo.slot_type),
    slot: slotInfo.slot,
    stack_id: slotInfo.stack_id
  };
}

function summarizeSlotType(slotType) {
  if (!slotType) return slotType;
  return {
    container_id: slotType.container_id,
    dynamic_container_id: slotType.dynamic_container_id
  };
}

function summarizeResponseSlot(slot) {
  return {
    slot: slot.slot,
    hotbar_slot: slot.hotbar_slot,
    count: slot.count,
    stack_id: slot.stack_id,
    custom_name: slot.custom_name,
    durability_correction: slot.durability_correction
  };
}

function summarizeItem(item) {
  if (!item || typeof item !== "object") return null;
  const count = item.count ?? item.stack_size;
  const networkId = item.network_id ?? item.networkId;
  const blockRuntimeId = item.block_runtime_id ?? item.blockRuntimeId;
  const metadata = item.metadata ?? item.damage;
  const stackId = item.stack_id ?? item.stackId;
  if (
    count === 0 &&
    (networkId === 0 || networkId === undefined) &&
    (blockRuntimeId === 0 || blockRuntimeId === undefined) &&
    (stackId === 0 || stackId === undefined)
  ) {
    return null;
  }
  return {
    network_id: networkId,
    count,
    metadata,
    block_runtime_id: blockRuntimeId,
    stack_id: stackId
  };
}

function compactIngredient(ingredient) {
  return {
    type: ingredient.type,
    network_id: ingredient.network_id,
    metadata: ingredient.metadata,
    count: ingredient.count,
    tag: ingredient.tag
  };
}

function compactValue(value, depth) {
  if (typeof value === "bigint") return value.toString();
  if (value == null || typeof value !== "object") return value;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { type: "Buffer", length: value.length };
  }
  if (depth <= 0) {
    if (Array.isArray(value)) return { type: "Array", length: value.length };
    return { type: "Object", keys: Object.keys(value).length };
  }
  if (Array.isArray(value)) {
    const max = 12;
    const entries = value.slice(0, max).map(entry => compactValue(entry, depth - 1));
    if (value.length > max) entries.push({ truncated: value.length - max });
    return entries;
  }

  const output = {};
  for (const key of Object.keys(value).sort()) {
    if (key === "payload" || key === "payload_base64" || key === "raw" || key === "nbt") continue;
    output[key] = compactValue(value[key], depth - 1);
  }
  return output;
}

function stringifyBigInt(value) {
  return typeof value === "bigint" ? value.toString() : value;
}

function playerAuthInputDelta(record, decoded) {
  if (!decoded || !decoded.params) {
    return { initial: true, changes: { error: "missing decoded params" } };
  }

  const key = [
    record.direction || "",
    record.player || "",
    record.sub_client_id ?? 0
  ].join(":");
  const current = normalizeForDelta(decoded.params, playerAuthInputDeltaIgnore);
  const previous = lastPlayerAuthInputByStream.get(key);
  lastPlayerAuthInputByStream.set(key, current);

  if (previous === undefined) {
    return {
      initial: true,
      ignored: Array.from(playerAuthInputDeltaIgnore).sort(),
      changes: current
    };
  }

  const changes = diffValues(previous, current);
  if (changes === undefined) return null;
  return {
    initial: false,
    ignored: Array.from(playerAuthInputDeltaIgnore).sort(),
    changes
  };
}

function normalizeForDelta(value, ignored, pathParts = []) {
  const path = pathParts.join(".");
  const key = pathParts[pathParts.length - 1] || "";
  if (ignored.has(path) || ignored.has(key)) return undefined;
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) {
    return value.map((entry, index) => normalizeForDelta(entry, ignored, pathParts.concat(String(index))));
  }
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const entryKey of Object.keys(value).sort()) {
    const normalized = normalizeForDelta(value[entryKey], ignored, pathParts.concat(entryKey));
    if (normalized !== undefined) output[entryKey] = normalized;
  }
  return output;
}

function diffValues(previous, current) {
  if (JSON.stringify(previous, jsonSafeReplacer) === JSON.stringify(current, jsonSafeReplacer)) return undefined;
  if (!isPlainObject(previous) || !isPlainObject(current)) {
    return { from: previous, to: current };
  }

  const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const output = {};
  for (const key of Array.from(keys).sort()) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      output[key] = { from: previous[key], to: null };
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(previous, key)) {
      output[key] = { from: null, to: current[key] };
      continue;
    }
    const diff = diffValues(previous[key], current[key]);
    if (diff !== undefined) output[key] = diff;
  }

  return Object.keys(output).length ? output : undefined;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function jsonSafeReplacer(_, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

function parsePacketIds(value) {
  const parsed = new Set();
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    parsed.add(Number.parseInt(trimmed, 0));
  }
  return parsed.size ? parsed : null;
}

function parseCsvSet(value) {
  return new Set(String(value || "").split(",").map(part => part.trim()).filter(Boolean));
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
