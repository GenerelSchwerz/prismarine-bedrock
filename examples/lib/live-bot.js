"use strict";

const { BotState } = require("../..");

function envFlag(name, fallback) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value !== "false" && value !== "0";
}

function createLiveBot(defaults = {}) {
  const options = {
    host: process.env.HOST || defaults.host || "localhost",
    port: Number(process.env.PORT || defaults.port || 19132),
    username: process.env.BOT_USERNAME || process.env.USERNAME || defaults.username || "ExampleBot",
    offline: envFlag("OFFLINE", defaults.offline ?? true),
    version: process.env.MC_VERSION || defaults.version || "1.21.130",
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
  sleep,
  waitForSpawn
};
