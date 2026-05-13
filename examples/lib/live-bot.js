"use strict";

const { BotState } = require("../..");
const { bedrockVersionFromEnv } = require("../../src/version");

function envFlag(name, fallback) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value !== "false" && value !== "0";
}

function effectiveUsername(username) {
  const name = String(username);
  const prefix = process.env.E2E_BEDROCK_PLAYER_NAME_PREFIX || "";
  const configuredMax = process.env.E2E_BEDROCK_USERNAME_MAX;
  const max = configuredMax != null && configuredMax !== ""
    ? Number(configuredMax)
    : (prefix ? 16 - prefix.length : null);

  if (max == null || !Number.isInteger(max) || max <= 0 || name.length <= max) return name;
  return name.slice(0, max);
}

function createLiveBot(defaults = {}) {
  const username = effectiveUsername(process.env.BOT_USERNAME || process.env.USERNAME || defaults.username || "ExampleBot");
  const options = {
    host: process.env.HOST || defaults.host || "localhost",
    port: Number(process.env.PORT || defaults.port || 19132),
    username,
    offline: envFlag("OFFLINE", defaults.offline ?? true),
    version: bedrockVersionFromEnv(process.env, defaults.version),
    ...defaults.options
  };

  return {
    bot: new BotState(options),
    options
  };
}

function waitForSpawn(bot, timeoutMs = Number(process.env.SPAWN_TIMEOUT_MS || 30000)) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for spawn")), timeoutMs);
    bot.client.once("spawn", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectLiveBot(defaults = {}) {
  const { bot, options } = createLiveBot(defaults);

  bot.start();
  console.log(`Connecting to ${options.host}:${options.port} as ${options.username}...`);
  await waitForSpawn(bot);
  console.log("Spawned.");

  return { bot, options };
}

module.exports = {
  connectLiveBot,
  createLiveBot,
  effectiveUsername,
  sleep,
  waitForSpawn
};
