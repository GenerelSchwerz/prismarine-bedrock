const BotState = require('./state');
const Vec3 = require('vec3').Vec3;

// ------------------------------------------------------------------
// Configuration (tweak these for your server)
// ------------------------------------------------------------------
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = 'CraftBot';
const OFFLINE = true;

// ------------------------------------------------------------------
// Utility: scan a 3D cube for a block matching id
// Calls await botState.getBlock(pos) for every block position.
// ------------------------------------------------------------------
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

        // Prefer block.id, but support runtimeId/type fallbacks if your getBlock returns them.
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

// ------------------------------------------------------------------
// Main test
// ------------------------------------------------------------------
async function main () {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username: USERNAME,
    offline: OFFLINE,
    version: process.env.MC_VERSION || '1.21.130'  // adjust to match your server
  });


  // Builtins (including crafting.js) are loaded automatically via _loadBuiltins()
  botState.start();

  console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME}...`);

  // Wait for spawn
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), 30000);
    botState.client.once('spawn', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  console.log('Bot spawned.');

  // Wait for chunks around spawn point
  const spawnPos = new Vec3(
    botState.spawnPosition.x,
    botState.spawnPosition.y,
    botState.spawnPosition.z
  );
  console.log(`Spawn position: ${spawnPos}`);
  await botState.waitForChunksToLoad(8, spawnPos, 30000);
  console.log('Chunks loaded.');

  // Find a crafting table block (id = 58 on most versions, but let's look it up)
  const registry = botState.registry;
  const craftingTableBlock = registry.blocksByName?.crafting_table;
  if (!craftingTableBlock) {
    console.error('Could not find crafting_table in registry');
    process.exit(1);
  }
  const craftingTableId = craftingTableBlock.id;

  console.log(`Looking for crafting table (id=${craftingTableId}) at ${botState.self.position}...`);
  await new Promise(res=>setTimeout(res, 2000))
  const tablePos = await findBlockInArea(botState, botState.self.position, 2, craftingTableId);

  if (!tablePos) {
    console.error('No crafting table found within 8 blocks. Ensure one is nearby.');
    process.exit(1);
  }
  console.log(`Crafting table at ${tablePos}`);

  // Now craft: oak planks from oak logs (item id for oak_log, planks)
  const oakLog = registry.itemsByName?.oak_log;
  const oakPlanks = registry.itemsByName?.oak_planks;
  if (!oakLog || !oakPlanks) {
    console.error('Could not resolve oak_log or oak_planks in registry');
    process.exit(1);
  }

  // Check if we have at least 1 oak log in inventory
  const inventory = botState.inventory;
  const haveLog = inventory && inventory.slots.some(s => s && s.type === oakLog.id && s.count >= 1);
  if (!haveLog) {
    console.log('Bot does not have oak logs. Crafting test skipped.');
    process.exit(0);
  }

  console.log('Crafting 8 oak planks...');
  try {
    await botState.craftItem(oakPlanks.id, 8, { position: tablePos });
    console.log('✔ Crafting succeeded!');
  } catch (err) {
    console.error('Crafting failed:', err);
    process.exit(1);
  }

  // Disconnect cleanly
  botState.disconnect('Test complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});