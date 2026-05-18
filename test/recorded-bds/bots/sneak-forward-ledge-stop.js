"use strict";

const {
  connectScenarioBot,
  disconnectQuietly,
  wait
} = require("./helpers");

function feetPosition(bot) {
  const pos = bot.self?.position;
  if (!pos) return null;
  const eyeHeight = Number(bot.self.eyeHeight ?? 1.62);
  return pos.offset(0, -eyeHeight, 0);
}

async function waitForFeet(bot, predicate, label, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = feetPosition(bot);
    if (last && predicate(last)) return last;
    await wait(50);
  }
  const suffix = last
    ? `; last feet=${last.x.toFixed(3)},${last.y.toFixed(3)},${last.z.toFixed(3)}`
    : "; no feet position";
  throw new Error(`Timed out waiting for ${label}${suffix}`);
}

function prepareSurvivalMovement(bot) {
  bot.clearControlStates?.();
  if (bot.self) {
    bot.self.flying = false;
    bot.self.mayFly = false;
    bot.self.onGround = true;
    bot.self.verticalCollision = true;
    bot.self.isCollidedVertically = true;
  }
}

async function step_approach_sneak_start(bot) {
  prepareSurvivalMovement(bot);
  bot.look?.(0, 45, true);
  await bot.waitForLookComplete?.();

  bot.setControlState("forward", true);
  await waitForFeet(bot, feet => feet.z >= 1.8 && feet.z <= 2.6 && Math.abs(feet.y - 71) < 0.4, "approach marker");
  bot.setControlState("forward", false);
  await wait(300);
}

async function step_sneak_forward_to_ledge(bot) {
  bot.setControlState("sneak", true);
  await wait(250);
  bot.setControlState("forward", true);

  await waitForFeet(bot, feet => feet.z >= 3.45 && feet.z <= 4.35 && Math.abs(feet.y - 71) < 0.4, "sneak ledge");
}

async function step_hold_sneak_at_ledge_before_crawl(bot) {
  bot.setControlState("sneak", true);
  bot.setControlState("forward", true);

  await waitForFeet(bot, feet => feet.z >= 3.65 && feet.z <= 4.45 && Math.abs(feet.y - 71) < 0.4, "held ledge");
  await wait(9000);

  bot.setControlState("forward", false);
  bot.setControlState("sneak", false);
}

async function step_crawl_in_one_block_gap(bot) {
  prepareSurvivalMovement(bot);
  await waitForFeet(bot, feet => Math.abs(feet.x) < 1 && Math.abs(feet.y - 71) < 0.6 && Math.abs(feet.z + 5) < 1, "crawl gap teleport", 10000);
  await wait(4000);
}

async function main() {
  const bot = await connectScenarioBot();
  try {
    await step_approach_sneak_start(bot);
    await step_sneak_forward_to_ledge(bot);
    await step_hold_sneak_at_ledge_before_crawl(bot);
    await step_crawl_in_one_block_gap(bot);
    await wait(1000);
  } finally {
    disconnectQuietly(bot, "recorded-bds gym bot complete");
  }
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
