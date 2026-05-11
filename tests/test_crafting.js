const BotState = require('../src/state');
const Vec3 = require('vec3').Vec3;

const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = 'CraftBot';
const OFFLINE = true;
const VERSION = process.env.MC_VERSION || '1.21.130';
const CHUNK_LOAD_RADIUS = 8;
const TABLE_SEARCH_RADIUS = 2;

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs);
    botState.client.once('spawn', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function itemNameById (registry, itemType) {
  return registry.items?.[itemType]?.name || `id=${itemType}`;
}

function summarizeInventory (inventory, registry) {
  if (!inventory?.slots) return [];

  const totals = new Map();

  for (let slotIndex = 0; slotIndex < inventory.slots.length; slotIndex++) {
    const item = inventory.slots[slotIndex];
    if (!item) continue;

    const key = `${item.type}:${item.metadata ?? 0}`;
    const current = totals.get(key) || {
      name: item.name || itemNameById(registry, item.type),
      type: item.type,
      metadata: item.metadata ?? 0,
      count: 0,
      slots: []
    };

    current.count += item.count || 0;
    current.slots.push(slotIndex);
    totals.set(key, current);
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function logInventory (label, botState) {
  const items = summarizeInventory(botState.inventory, botState.registry);

  console.log(`\n${label}`);
  if (items.length === 0) {
    console.log('  (empty)');
    return;
  }

  for (const item of items) {
    const metadata = item.metadata ? `:${item.metadata}` : '';
    console.log(`  ${item.name}${metadata} x${item.count} [${item.slots.join(', ')}]`);
  }
}

function itemCount (botState, itemId) {
  return summarizeInventory(botState.inventory, botState.registry)
    .filter(item => item.type === itemId)
    .reduce((sum, item) => sum + item.count, 0);
}

async function findBlockInArea (botState, center, radius, blockId) {
  const minX = Math.floor(center.x - radius);
  const maxX = Math.floor(center.x + radius);
  const minY = Math.max(botState.minY, Math.floor(center.y - radius));
  const maxY = Math.floor(center.y + radius);
  const minZ = Math.floor(center.z - radius);
  const maxZ = Math.floor(center.z + radius);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const pos = new Vec3(x, y, z);
        const block = await botState.getBlock(pos);

        if (!block) continue;

        if (
          block.id === blockId ||
          block.type === blockId ||
          block.runtimeId === blockId ||
          block.stateId === blockId
        ) {
          return pos;
        }
      }
    }
  }

  return null;
}

async function main () {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username: USERNAME,
    offline: OFFLINE,
    version: VERSION
  });

  botState.start();

  console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME}...`);
  await waitForSpawn(botState);
  console.log('Bot spawned.');

  const spawnPos = new Vec3(
    botState.spawnPosition.x,
    botState.spawnPosition.y,
    botState.spawnPosition.z
  );

  console.log(`Spawn position: ${spawnPos}`);
  await botState.waitForChunksToLoad(CHUNK_LOAD_RADIUS, spawnPos, 30000);
  console.log('Chunks loaded.');

  const registry = botState.registry;
  const craftingTableBlock = registry.blocksByName?.crafting_table;
  if (!craftingTableBlock) {
    console.error('Could not find crafting_table in registry');
    process.exit(1);
  }
  const craftingTableId = craftingTableBlock.id;

  console.log(`Looking for crafting table (id=${craftingTableId}) at ${botState.self.position}...`);
  await sleep(2000);
  const tablePos = await findBlockInArea(botState, botState.self.position, TABLE_SEARCH_RADIUS, craftingTableId);

  if (!tablePos) {
    console.error(`No crafting table found within ${TABLE_SEARCH_RADIUS} blocks. Ensure one is nearby.`);
    process.exit(1);
  }
  console.log(`Crafting table at ${tablePos}`);

  const oakLog = registry.itemsByName?.oak_log;
  const oakPlanks = registry.itemsByName?.oak_planks;
  if (!oakLog || !oakPlanks) {
    console.error('Could not resolve oak_log or oak_planks in registry');
    process.exit(1);
  }

  logInventory('Inventory before crafting:', botState);
  const logsBefore = itemCount(botState, oakLog.id);
  const planksBefore = itemCount(botState, oakPlanks.id);

  const inventoryItems = summarizeInventory(botState.inventory, registry);
  const haveLog = inventoryItems.some(item => item.type === oakLog.id && item.count >= 1);
  if (!haveLog) {
    console.log('Bot does not have oak logs. Crafting test skipped.');
    logInventory('Inventory after skipped crafting:', botState);
    botState.disconnect('Test skipped');
    process.exit(0);
  }

  console.log('Crafting 8 oak planks...');
  try {
    await botState.craftItem(oakPlanks.id, 8, { position: tablePos });
    await sleep(1000);
    logInventory('Inventory after crafting:', botState);
    const logsAfter = itemCount(botState, oakLog.id);
    const planksAfter = itemCount(botState, oakPlanks.id);
    if (planksAfter < planksBefore + 8 || logsAfter >= logsBefore) {
      throw new Error(`Inventory did not reflect crafting: logs ${logsBefore} -> ${logsAfter}, planks ${planksBefore} -> ${planksAfter}`);
    }
    console.log('Crafting succeeded.');
  } catch (err) {
    logInventory('Inventory after failed crafting attempt:', botState);
    console.error('Crafting failed:', err);
    process.exit(1);
  }

  botState.disconnect('Test complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
