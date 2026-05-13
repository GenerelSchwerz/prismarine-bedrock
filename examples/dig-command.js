"use strict";

const { Vec3 } = require("vec3");
const { connectLiveBot, sleep } = require("./lib/live-bot");

const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 120000);
const OBSERVE_MS = Number(process.env.OBSERVE_MS || 10000);

function waitForDigCommand(bot, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.removeListener("chat", onChat);
      reject(new Error("Timed out waiting for !break or !dig"));
    }, timeoutMs);

    function onChat({ sourceName, message }) {
      if (sourceName === bot.client.username) return;

      const parts = message.trim().split(/\s+/);
      const command = parts[0]?.toLowerCase();
      if (command !== "!break" && command !== "!dig") return;

      clearTimeout(timeout);
      bot.removeListener("chat", onChat);
      resolve({ sourceName, args: parts.slice(1) });
    }

    bot.on("chat", onChat);
  });
}

function parseBlockPosition(args, bot) {
  if (args.length === 3) {
    const nums = args.map(Number);
    if (nums.every(Number.isFinite)) {
      return new Vec3(Math.floor(nums[0]), Math.floor(nums[1]), Math.floor(nums[2]));
    }
  }

  if (args.length === 0) {
    const pos = bot.self.position;
    return new Vec3(Math.floor(pos.x), Math.floor(pos.y - 1), Math.floor(pos.z));
  }

  throw new Error("Usage: !break [x y z]");
}

async function main() {
  const { bot } = await connectLiveBot({ username: "DigExample" });

  console.log('Say "!break x y z" to break a specific block, or "!break" for the block under the bot.');
  const { sourceName, args } = await waitForDigCommand(bot);
  const pos = parseBlockPosition(args, bot);
  const block = await bot.getBlock(pos);

  if (!block) throw new Error(`No loaded block at ${pos}`);

  console.log(`${sourceName} requested a dig at ${pos}; block=${block.name}`);
  await bot.dig(block);
  await sleep(OBSERVE_MS);

  bot.disconnect("Dig example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
