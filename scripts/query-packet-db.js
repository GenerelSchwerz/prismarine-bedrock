#!/usr/bin/env node
"use strict";

const path = require("path");
const Database = require("better-sqlite3");

function usage() {
  const script = path.relative(process.cwd(), __filename);
  console.error(`Usage:
  node ${script} <packet-recording.sqlite> [--packet-names=item_stack_request] [--packet-ids=147]
    [--player=OpBot] [--direction=receive] [--where=params.requests.*.actions.*.type_id=take]
    [--after-event=step_start] [--after-where=step=open_table]
    [--before-event=step_complete] [--before-where=step=open_table]
    [--field=params.requests.0.request_id] [--field=action:params.requests.0.actions.0.type_id]
    [--sample=10] [--limit=100] [--sql]

Queries a SQLite index created by scripts/index-packet-recording.js.
Paths in --where may use * as a packet_fields wildcard. Event --*-where paths are read from event_json.
`);
}

const args = process.argv.slice(2);
const dbFile = args.shift();
if (!dbFile || dbFile === "--help" || dbFile === "-h") {
  usage();
  process.exit(dbFile ? 0 : 1);
}

const options = {
  packetNames: null,
  packetIds: null,
  player: null,
  direction: null,
  where: [],
  afterEvent: null,
  beforeEvent: null,
  afterWhere: [],
  beforeWhere: [],
  fields: [],
  sample: null,
  limit: null,
  printSql: false
};

for (const arg of args) {
  if (arg.startsWith("--packet-names=")) options.packetNames = csv(arg.slice("--packet-names=".length));
  else if (arg.startsWith("--packet-ids=")) options.packetIds = csv(arg.slice("--packet-ids=".length)).map(value => Number.parseInt(value, 0));
  else if (arg.startsWith("--player=")) options.player = arg.slice("--player=".length);
  else if (arg.startsWith("--direction=")) options.direction = arg.slice("--direction=".length);
  else if (arg.startsWith("--where=")) options.where.push(parsePredicate(arg.slice("--where=".length)));
  else if (arg.startsWith("--after-event=")) options.afterEvent = arg.slice("--after-event=".length);
  else if (arg.startsWith("--before-event=")) options.beforeEvent = arg.slice("--before-event=".length);
  else if (arg.startsWith("--after-where=")) options.afterWhere.push(parsePredicate(arg.slice("--after-where=".length)));
  else if (arg.startsWith("--before-where=")) options.beforeWhere.push(parsePredicate(arg.slice("--before-where=".length)));
  else if (arg.startsWith("--field=")) options.fields.push(parseField(arg.slice("--field=".length)));
  else if (arg.startsWith("--sample=")) options.sample = positiveInt(arg.slice("--sample=".length), "--sample");
  else if (arg.startsWith("--limit=")) options.limit = positiveInt(arg.slice("--limit=".length), "--limit");
  else if (arg === "--sql") options.printSql = true;
  else throw new Error(`Unknown argument: ${arg}`);
}

const db = new Database(path.resolve(dbFile), { readonly: true });
try {
  const bounds = eventBounds(db, options);
  const query = buildPacketQuery(options, bounds);
  if (options.printSql) console.error(query.sql, query.params);
  for (const row of db.prepare(query.sql).iterate(query.params)) {
    const decoded = row.decoded_json ? JSON.parse(row.decoded_json) : null;
    const output = baseOutput(row);
    if (options.fields.length) {
      for (const field of options.fields) {
        output[field.label] = valueAtPath({ ...row, decoded, params: decoded?.params || decoded?.data?.params || null }, field.path);
      }
    } else {
      output.params = decoded?.params || decoded?.data?.params || null;
      output.error = row.error;
    }
    console.log(JSON.stringify(output));
  }
} finally {
  db.close();
}

function eventBounds(db, opts) {
  const after = opts.afterEvent ? findEventSequence(db, opts.afterEvent, opts.afterWhere, { order: "asc" }) : null;
  const before = opts.beforeEvent
    ? findEventSequence(db, opts.beforeEvent, opts.beforeWhere, { order: after === null ? "desc" : "asc", minSequence: after })
    : null;
  return { after, before };
}

function findEventSequence(db, type, predicates, options) {
  const where = ["type = @type"];
  const params = { type };
  if (options.minSequence !== null && options.minSequence !== undefined) {
    where.push("sequence >= @min_sequence");
    params.min_sequence = options.minSequence;
  }
  predicates.forEach((predicate, index) => {
    where.push(`json_extract(event_json, @event_path_${index}) = @event_value_${index}`);
    params[`event_path_${index}`] = jsonPath(predicate.path);
    params[`event_value_${index}`] = predicate.expected;
  });
  const row = db.prepare(`
    select sequence from events
    where ${where.join(" and ")}
    order by sequence ${options.order}
    limit 1
  `).get(params);
  if (!row) throw new Error(`No event matched ${type}`);
  return row.sequence;
}

function buildPacketQuery(opts, bounds) {
  const where = [];
  const params = {};
  if (opts.packetNames) {
    where.push(`name in (${placeholders("name", opts.packetNames, params)})`);
  }
  if (opts.packetIds) {
    where.push(`packet_id in (${placeholders("packet_id", opts.packetIds, params)})`);
  }
  if (opts.player) {
    where.push("player = @player");
    params.player = opts.player;
  }
  if (opts.direction) {
    where.push("direction = @direction");
    params.direction = opts.direction;
  }
  if (bounds.after !== null) {
    where.push("sequence >= @after_sequence");
    params.after_sequence = bounds.after;
  }
  if (bounds.before !== null) {
    where.push("sequence <= @before_sequence");
    params.before_sequence = bounds.before;
  }
  opts.where.forEach((predicate, index) => {
    const pathParam = `field_path_${index}`;
    const valueParam = `field_value_${index}`;
    const operator = predicate.path.includes("*") ? "glob" : "=";
    where.push(`exists (
      select 1 from packet_fields pf
      where pf.sequence = packets.sequence
        and pf.path ${operator} @${pathParam}
        and pf.value_text = @${valueParam}
    )`);
    params[pathParam] = predicate.path.includes("*") ? globPath(predicate.path) : predicate.path;
    params[valueParam] = String(predicate.expected);
  });

  const innerWhere = where.length ? `where ${where.join(" and ")}` : "";
  const sampleWhere = opts.sample ? "where row_number % @sample = 1" : "";
  if (opts.sample) params.sample = opts.sample;
  const limit = opts.limit ? "limit @limit" : "";
  if (opts.limit) params.limit = opts.limit;

  return {
    sql: `
      with filtered as (
        select packets.*, row_number() over (order by sequence) as row_number
        from packets
        ${innerWhere}
      )
      select *
      from filtered
      ${sampleWhere}
      order by sequence
      ${limit}
    `,
    params
  };
}

function baseOutput(row) {
  return {
    sequence: row.sequence,
    ts: row.ts,
    direction: row.direction,
    packet_id: row.packet_id,
    name: row.name,
    player: row.player
  };
}

function parsePredicate(raw) {
  const index = raw.indexOf("=");
  if (index === -1) throw new Error(`Invalid predicate: ${raw}`);
  return {
    path: raw.slice(0, index),
    expected: parseExpected(raw.slice(index + 1))
  };
}

function parseExpected(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function parseField(raw) {
  const index = raw.indexOf(":");
  if (index === -1) return { label: raw, path: raw };
  return { label: raw.slice(0, index), path: raw.slice(index + 1) };
}

function valueAtPath(value, dottedPath) {
  let current = value;
  for (const part of dottedPath.split(".")) {
    if (current == null) return null;
    if (Array.isArray(current) && /^\d+$/.test(part)) current = current[Number(part)];
    else if (typeof current === "object") current = current[part];
    else return null;
  }
  return current === undefined ? null : current;
}

function jsonPath(dottedPath) {
  return `$${dottedPath.split(".").map(part => /^\d+$/.test(part) ? `[${part}]` : `.${part}`).join("")}`;
}

function globPath(pathValue) {
  return pathValue.split(".").map(part => part === "*" ? "*" : escapeGlob(part)).join(".");
}

function escapeGlob(value) {
  return String(value).replace(/([[\]?])/g, "[$1]");
}

function placeholders(prefix, values, params) {
  return values.map((value, index) => {
    const key = `${prefix}_${index}`;
    params[key] = value;
    return `@${key}`;
  }).join(", ");
}

function csv(raw) {
  return String(raw || "").split(",").map(value => value.trim()).filter(Boolean);
}

function positiveInt(raw, name) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}
