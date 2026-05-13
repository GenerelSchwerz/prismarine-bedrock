#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LIVE_TEST_DIR = path.join(ROOT, "test", "live");

const shardIndex = parseShardInt(process.env.E2E_CLIENT_RUN_INDEX, 0, "E2E_CLIENT_RUN_INDEX");
const shardTotal = parseShardInt(process.env.E2E_CLIENT_RUN_TOTAL, 1, "E2E_CLIENT_RUN_TOTAL");

if (shardIndex >= shardTotal) {
  throw new Error(`E2E_CLIENT_RUN_INDEX (${shardIndex}) must be less than E2E_CLIENT_RUN_TOTAL (${shardTotal}).`);
}

const files = listLiveTests(LIVE_TEST_DIR);
const selected = shardTotal <= 1
  ? files
  : files.filter((_, index) => index % shardTotal === shardIndex);
const listOnly = process.argv.includes("--list");

if (selected.length === 0) {
  console.log(`No live test files selected for shard ${shardIndex + 1}/${shardTotal}.`);
  process.exit(0);
}

console.log([
  `Running live test shard ${shardIndex + 1}/${shardTotal}`,
  `target=${process.env.E2E_SERVER_TARGET || "unknown"}`,
  `port=${process.env.PORT || "unknown"}`,
  `files=${selected.length}/${files.length}`
].join(" "));

if (listOnly) {
  for (const file of selected) console.log(path.relative(ROOT, file));
  process.exit(0);
}

const mochaBin = require.resolve("mocha/bin/mocha.js");
const child = spawn(process.execPath, [
  mochaBin,
  "--config",
  path.join(ROOT, ".mocharc.live.json"),
  ...selected
], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Mocha terminated by ${signal}.`);
    process.exit(signal === "SIGINT" ? 130 : 1);
    return;
  }
  process.exit(code || 0);
});

child.on("error", (err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});

function listLiveTests(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listLiveTests(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      result.push(fullPath);
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function parseShardInt(value, fallback, name) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return parsed;
}
