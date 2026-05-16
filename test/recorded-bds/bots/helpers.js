"use strict";

const BotState = require("../../..").BotState || require("../../../src/state");
const { bedrockVersionFromEnv } = require("../../../src/version");

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function botOptions(overrides = {}) {
  return {
    host: process.env.HOST || "localhost",
    port: Number(process.env.PORT || 19132),
    username: process.env.BOT_USERNAME || "OpBot",
    offline: process.env.OFFLINE !== "false",
    version: bedrockVersionFromEnv(),
    ...overrides
  };
}

function waitForSpawn(bot, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${bot.options.username} spawn`)), timeoutMs);
    bot.client.once("spawn", () => {
      clearTimeout(timeout);
      resolve(bot);
    });
  });
}

async function connectScenarioBot(overrides = {}) {
  const bot = new BotState(botOptions(overrides));
  bot.start();
  await waitForSpawn(bot, overrides.spawnTimeoutMs || 30000);
  return bot;
}

function disconnectQuietly(bot, reason = "recorded-bds scenario bot done") {
  try {
    if (bot?.client) bot.disconnect(reason);
  } catch {
    // Best-effort cleanup for scenario scripts.
  }
}

function queuePacket(bot, name, params) {
  if (!bot?.client?.queue) throw new Error("Bot client is not connected.");
  bot.client.queue(name, params);
}

module.exports = {
  botOptions,
  connectScenarioBot,
  disconnectQuietly,
  queuePacket,
  wait,
  waitForSpawn
};
