"use strict";

const { Vec3 } = require("vec3");
const { connectLiveBot, sleep } = require("./lib/live-bot");

const CHUNK_RADIUS = Number(process.env.CHUNK_RADIUS || 8);
const TABLE_SEARCH_RADIUS = Number(process.env.TABLE_SEARCH_RADIUS || 3);
const OUTPUT_ITEM = process.env.CRAFT_ITEM || "oak_planks";
const OUTPUT_COUNT = Number(process.env.CRAFT_COUNT || 8);

function summarizeInventory(bot) {
  const totals = new Map();

  for (let slot = 0; slot < (bot.inventory?.slots?.length || 0); slot++) {
    const item = bot.inventory.slots[slot];
    if (!item) continue;

    const key = `${item.type}:${item.metadata ?? 0}`;
    const entry = totals.get(key) || {
      name: item.name || bot.registry.items?.[item.type]?.name || `id=${item.type}`,
      count: 0,
      slots: []
    };

    entry.count += item.count || 0;
    entry.slots.push(slot);
    totals.set(key, entry);
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function printInventory(bot, label) {
  console.log(`\n${label}`);
  const items = summarizeInventory(bot);

  if (items.length === 0) {
    console.log("  empty");
    return;
  }

  for (const item of items) {
    console.log(`  ${item.name} x${item.count} slots=${item.slots.join(",")}`);
  }
}

async function findNearbyBlock(bot, center, radius, blockName) {
  const target = bot.registry.blocksByName?.[blockName];
  if (!target) throw new Error(`Unknown block in registry: ${blockName}`);

  for (let x = Math.floor(center.x - radius); x <= Math.floor(center.x + radius); x++) {
    for (let y = Math.max(bot.minY, Math.floor(center.y - radius)); y <= Math.floor(center.y + radius); y++) {
      for (let z = Math.floor(center.z - radius); z <= Math.floor(center.z + radius); z++) {
        const pos = new Vec3(x, y, z);
        const block = await bot.getBlock(pos);
        if (block?.name === blockName || block?.id === target.id || block?.type === target.id) return pos;
      }
    }
  }

  return null;
}

async function main() {
  const { bot } = await connectLiveBot({ username: "CraftExample" });
  const center = new Vec3(bot.spawnPosition.x, bot.spawnPosition.y, bot.spawnPosition.z);

  await bot.waitForChunksToLoad(CHUNK_RADIUS, center, 30000);
  await sleep(1000);

  const table = await findNearbyBlock(bot, bot.self.position, TABLE_SEARCH_RADIUS, "crafting_table");
  if (!table) {
    console.log(`No crafting table found within ${TABLE_SEARCH_RADIUS} blocks. Place one near the bot and run again.`);
    bot.disconnect("Crafting example complete");
    return;
  }

  const item = bot.registry.itemsByName?.[OUTPUT_ITEM];
  if (!item) throw new Error(`Unknown craft item: ${OUTPUT_ITEM}`);

  printInventory(bot, "Inventory before crafting");
  console.log(`Crafting ${OUTPUT_COUNT} ${OUTPUT_ITEM} at ${table}...`);
  await bot.craftItem(item.id, OUTPUT_COUNT, { position: table });
  await sleep(1000);
  printInventory(bot, "Inventory after crafting");

  bot.disconnect("Crafting example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
