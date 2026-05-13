"use strict";

const { connectLiveBot, sleep } = require("./lib/live-bot");

const HIT_COMMAND = process.env.HIT_COMMAND || "!hit";
const HIT_RANGE = Number(process.env.HIT_RANGE || 4);
const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 120000);

function waitForHitCommand(bot, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.removeListener("chat", onChat);
      reject(new Error(`Timed out waiting for another player to say ${HIT_COMMAND}`));
    }, timeoutMs);

    function onChat({ sourceName, message }) {
      if (sourceName === bot.client.username) return;
      if (message.trim().toLowerCase() !== HIT_COMMAND.toLowerCase()) return;

      clearTimeout(timeout);
      bot.removeListener("chat", onChat);
      resolve(sourceName);
    }

    bot.on("chat", onChat);
  });
}

function getPlayerByName(bot, username) {
  for (const [, player] of bot.players) {
    if (player === bot.self) continue;
    if (player.username === username || player.displayName === username) return player;
  }

  return bot.nearestEntity?.(entity =>
    entity !== bot.self &&
    entity.type === "player" &&
    (entity.username === username || entity.displayName === username)
  ) || null;
}

async function main() {
  const { bot } = await connectLiveBot({ username: "HitExample" });

  console.log(`Have another player stand within ${HIT_RANGE} blocks and say ${HIT_COMMAND}.`);
  const sourceName = await waitForHitCommand(bot);
  const player = getPlayerByName(bot, sourceName);

  if (!player) throw new Error(`Could not find player entity for ${sourceName}`);

  const distance = bot.self.position.distanceTo(player.position);
  if (distance > HIT_RANGE) throw new Error(`Target is too far away: ${distance.toFixed(2)} > ${HIT_RANGE}`);

  if (typeof bot.lookAt === "function") await bot.lookAt(player.position, true);
  await bot.attackEntity(player, { debug: true });
  await sleep(3000);

  bot.disconnect("Hit example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
