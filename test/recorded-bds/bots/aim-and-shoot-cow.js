"use strict";

const Vec3 = require("vec3").Vec3;
const { itemToRaw, toVec3f } = require("../../../src/utils");
const {
  connectScenarioBot,
  disconnectQuietly,
  wait
} = require("./helpers");

const BOW_SLOT = 0;
const TARGET_POS = new Vec3(0.5, 65, 8.5);
const PLAYER_POS = new Vec3(0, 65.62, 0);

function itemName(item) {
  return String(item?.name || item?.displayName || item?.identifier || "").replace(/^minecraft:/, "");
}

function itemAt(bot, slot) {
  return bot.inventory?.slots?.[slot] || null;
}

async function waitForInventoryItem(bot, slot, name, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const item = itemAt(bot, slot);
    if (itemName(item) === name) return item;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${name} in inventory slot ${slot}`);
}

async function ensureScenarioInventory(bot) {
  try {
    await waitForInventoryItem(bot, BOW_SLOT, "bow", 2500);
    return;
  } catch {
    // Bot joins can race Endstone command target resolution in this gym harness.
  }

  const target = `"${bot.options.username}"`;
  bot.command(`clear ${target}`);
  await wait(300);
  bot.command(`give ${target} bow 1`);
  await wait(300);
  bot.command(`give ${target} arrow 16`);
  await wait(700);
  await waitForInventoryItem(bot, BOW_SLOT, "bow", 5000);
}

function cowTarget(bot) {
  return bot.nearestEntity?.(entity => {
    if (!entity?.position) return false;
    return itemName(entity) === "cow" && entity.position.distanceSquared(TARGET_POS) < 12;
  });
}

async function waitForCow(bot, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const cow = cowTarget(bot);
    if (cow) return cow;
    await wait(100);
  }
  throw new Error("Timed out waiting for scenario cow");
}

function rawHeldItem(bot) {
  return itemToRaw(itemAt(bot, BOW_SLOT), bot.itemClass);
}

function playerPos(bot) {
  return bot.self?.position || new Vec3(0, 65, 0);
}

function pinScenarioPosition(bot) {
  if (!bot.self) return;
  bot.self.position.set(PLAYER_POS.x, PLAYER_POS.y, PLAYER_POS.z);
  bot.self.velocity?.set?.(0, 0, 0);
  bot.self.onGround = true;
}

function sendBowUse(bot) {
  const pos = playerPos(bot);
  bot.client.queue("inventory_transaction", {
    transaction: {
      legacy: { legacy_request_id: 0 },
      transaction_type: "item_use",
      actions: [],
      transaction_data: {
        action_type: "click_air",
        trigger_type: "unknown",
        block_position: { x: 0, y: 0, z: 0 },
        face: 255,
        hotbar_slot: BOW_SLOT,
        held_item: rawHeldItem(bot),
        player_pos: toVec3f(pos),
        click_pos: { x: 0, y: 0, z: 0 },
        block_runtime_id: 0,
        client_prediction: "failure",
        client_cooldown_state: "off"
      }
    }
  });

  bot.queuePlayerAuthInputEdit(packet => {
    bot.setAuthInputFlag(packet, "start_using_item", true);
  });
  bot.flushPlayerAuthInput?.();
}

function sendBowRelease(bot) {
  const pos = playerPos(bot);
  bot.client.queue("inventory_transaction", {
    transaction: {
      legacy: { legacy_request_id: 0 },
      transaction_type: "item_release",
      actions: [],
      transaction_data: {
        action_type: "release",
        hotbar_slot: BOW_SLOT,
        held_item: rawHeldItem(bot),
        head_pos: toVec3f({ x: pos.x, y: pos.y + 1.62, z: pos.z })
      }
    }
  });
}

async function step_equip_bow_and_aim(bot) {
  await ensureScenarioInventory(bot);
  const cow = await waitForCow(bot);
  const target = `"${bot.options.username}"`;
  bot.command(`tp ${target} 0 65 0 0 0`);
  pinScenarioPosition(bot);
  bot.selectHotbarSlot(BOW_SLOT);
  bot.lookAt(cow.position.offset(0, 1.0, 0), true);
  await wait(300);
}

async function step_shoot_cow(bot) {
  const pinTimer = setInterval(() => pinScenarioPosition(bot), 50);
  pinTimer.unref?.();
  for (let shot = 0; shot < 6; shot += 1) {
    try {
      const cow = cowTarget(bot);
      if (!cow) return;
      pinScenarioPosition(bot);
      bot.lookAt(cow.position.offset(0, 1.0, 0), true);
      await wait(150);
      sendBowUse(bot);
      await wait(1450);
      pinScenarioPosition(bot);
      bot.lookAt((cowTarget(bot) || cow).position.offset(0, 1.0, 0), true);
      sendBowRelease(bot);
      await wait(900);
    } finally {
      pinScenarioPosition(bot);
    }
  }
  clearInterval(pinTimer);

  if (cowTarget(bot)) throw new Error("Scenario cow survived all bow shots");
}

async function main() {
  const bot = await connectScenarioBot();
  try {
    await step_equip_bow_and_aim(bot);
    await step_shoot_cow(bot);
    await wait(1000);
  } finally {
    disconnectQuietly(bot, "recorded-bds gym bot complete");
  }
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
