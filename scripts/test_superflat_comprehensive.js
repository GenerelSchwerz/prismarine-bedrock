// test_superflat_comprehensive.js
// Run: node test_superflat_comprehensive.js
//
// Verifies every block in a configurable horizontal area against expected
// superflat layer blocks. Adjust EXPECTED_LAYERS if your server uses a
// different preset.
//
// This version intentionally avoids bedrockCompat and uses native world access.

const BotState = require('../src/state');
const Vec3 = require('vec3').Vec3;

// ===== CONFIGURATION =====

const OPTIONS = {
  host: 'localhost',
  port: 19132,
  username: 'SuperflatTester',
  offline: true,
  version: '1.21.130',

  // Do not use bedrockCompat for this test.
  blockAccessMode: 'native',

  // Keep these available for chunks.js / plugin options.
  minY: -64,
  worldMinY: -64,
  worldHeight: 384,

  // Server chunk radius request from setup.js uses options.chunkRadius.
  chunkRadius: 6
};

// Expected layers for your current test world.
// Based on your dump, y=-61 is dirt, not grass_block.
const EXPECTED_LAYERS = {
  [-64]: 'bedrock',
  [-63]: 'dirt',
  [-62]: 'dirt',
  [-61]: 'dirt'
};

// Horizontal range to test, inclusive.
const MIN_XZ = -3;
const MAX_XZ = 3;

// Vertical range to test, inclusive.
const MIN_Y = -64;
const MAX_Y = 320;

// Chunk wait config.
const WAIT_RADIUS = 6;
const WAIT_TIMEOUT_MS = 15000;

// Diagnostic scan config.
const DUMP_MIN_Y = -80;
const DUMP_MAX_Y = 80;

const DIAGNOSTIC_COLUMNS = [
  { x: 0, z: 0 },
  { x: -3, z: -3 }
];

// ===== SETUP =====

const bot = new BotState(OPTIONS);

function mod16(n) {
  return ((n % 16) + 16) % 16;
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function blockNameFromStateId(stateId) {
  if (stateId == null) return 'undefined';

  const byState = bot.registry.blocksByStateId?.[stateId];
  if (byState) return byState.name;

  const byRuntime = bot.registry.blocksByRuntimeId?.[stateId];
  if (byRuntime) return byRuntime.name;

  return 'unknown';
}

function getWaitCenter() {
  return bot.spawnPosition
    ? new Vec3(bot.spawnPosition.x, bot.spawnPosition.y, bot.spawnPosition.z)
    : new Vec3(0, OPTIONS.minY, 0);
}

function getChunkWaitBounds(radius, center = getWaitCenter()) {
  const minCX = Math.floor((center.x - radius) / 16);
  const maxCX = Math.floor((center.x + radius) / 16);
  const minCZ = Math.floor((center.z - radius) / 16);
  const maxCZ = Math.floor((center.z + radius) / 16);

  return {
    center,
    radius,
    minCX,
    maxCX,
    minCZ,
    maxCZ,
    chunkWidthX: maxCX - minCX + 1,
    chunkWidthZ: maxCZ - minCZ + 1,
    totalChunks: (maxCX - minCX + 1) * (maxCZ - minCZ + 1)
  };
}

async function waitForWorldWithLogging(radius = WAIT_RADIUS, timeout = WAIT_TIMEOUT_MS) {
  if (typeof bot.waitForChunksToLoad !== 'function') {
    throw new Error('bot.waitForChunksToLoad is not installed. Make sure chunks.js is loaded as a plugin.');
  }

  const bounds = getChunkWaitBounds(radius);
  const started = Date.now();

  console.log(
    `[world wait] waiting for block data: radius=${radius} blocks, ` +
    `center=(${bounds.center.x}, ${bounds.center.y}, ${bounds.center.z}), ` +
    `chunks x=${bounds.minCX}..${bounds.maxCX}, z=${bounds.minCZ}..${bounds.maxCZ} ` +
    `(${bounds.totalChunks} chunk columns), timeout=${timeout}ms`
  );

  await bot.waitForChunksToLoad(radius, bounds.center, timeout);

  const elapsed = Date.now() - started;

  console.log(
    `[world wait] complete in ${elapsed}ms; ` +
    `networkChunks=${bot.networkChunks?.size ?? 0}; ` +
    `loadedChunks=${bot.loadedChunks?.size ?? 0}; ` +
    `loadedChunkSections=${bot.loadedChunkSections?.size ?? 0}; ` +
    `waitRadius=${radius}`
  );
}

function getSectionIndex(col, sectionY) {
  if (!col) return null;

  if (typeof col.co === 'number') {
    return col.co + sectionY;
  }

  if (typeof col.minCY === 'number') {
    return sectionY - col.minCY;
  }

  if (typeof col.minY === 'number') {
    return sectionY - Math.floor(col.minY / 16);
  }

  return sectionY;
}

function getSectionStrict(col, sectionY) {
  if (!col || !Array.isArray(col.sections)) return null;

  const index = getSectionIndex(col, sectionY);

  if (!Number.isInteger(index)) return null;
  if (index < 0 || index >= col.sections.length) return null;

  return col.sections[index] || null;
}

function rawBlockNameStrict(x, y, z) {
  const cx = Math.floor(x / 16);
  const cz = Math.floor(z / 16);
  const col = bot.networkChunks?.get(chunkKey(cx, cz));
  if (!col) return 'no_chunk';

  const sectionY = Math.floor(y / 16);
  const sec = getSectionStrict(col, sectionY);

  if (!sec || typeof sec.getBlockStateId !== 'function') return 'no_section';

  const lx = mod16(x);
  const ly = mod16(y);
  const lz = mod16(z);

  const orders = [
    ['x', 'y', 'z', lx, ly, lz],
    ['x', 'z', 'y', lx, lz, ly]
  ];

  const results = [];

  for (const [labelA, labelB, labelC, a, b, c] of orders) {
    try {
      const sid = sec.getBlockStateId(a, b, c);
      results.push(`${labelA}${labelB}${labelC}:${blockNameFromStateId(sid) || `sid_${sid}`}`);
    } catch {
      results.push(`${labelA}${labelB}${labelC}:read_err`);
    }
  }

  return results.join(',');
}

function expectedBlockName(x, y, z) {
  const highestDefined = Math.max(...Object.keys(EXPECTED_LAYERS).map(Number));
  if (y > highestDefined) return 'air';
  return EXPECTED_LAYERS[y] || 'air';
}

async function nativeBlockName(x, y, z) {
  const block = await bot.getBlockAt(x, y, z);
  return {
    name: block?.name ?? 'undefined',
    stateId: block?.stateId,
    block
  };
}

async function dumpVerticalColumn(x = 0, z = 0, minY = -80, maxY = 80) {
  const cx = Math.floor(x / 16);
  const cz = Math.floor(z / 16);

  console.log(`\n=== Vertical column dump at x=${x}, z=${z} chunk=${cx},${cz} ===`);

  const nonAir = [];

  for (let y = minY; y <= maxY; y++) {
    const native = await nativeBlockName(x, y, z);
    const rawStrict = rawBlockNameStrict(x, y, z);

    if (native.name !== 'air' && native.name !== 'undefined') {
      nonAir.push({
        y,
        native: native.name,
        rawStrict,
        stateId: native.stateId
      });
    }
  }

  if (nonAir.length === 0) {
    console.log(`No non-air native blocks found from y=${minY}..${maxY}`);
  } else {
    for (const row of nonAir) {
      console.log(
        `y=${row.y} native=${row.native} rawStrict=${row.rawStrict} stateId=${row.stateId}`
      );
    }
  }

  console.log(`=== End vertical column dump ===\n`);
}

function dumpChunkSections(cx = 0, cz = 0) {
  const col = bot.networkChunks?.get(chunkKey(cx, cz));

  console.log(`\n=== Chunk sections for ${cx},${cz} ===`);

  if (!col) {
    console.log('No column');
    console.log(`=== End chunk sections ===\n`);
    return;
  }

  console.log('column constructor:', col.constructor?.name);
  console.log('column minY/minCY/co:', {
    minY: col.minY,
    minCY: col.minCY,
    co: col.co,
    sectionsLength: col.sections?.length
  });

  for (let sectionY = -8; sectionY <= 8; sectionY++) {
    const index = getSectionIndex(col, sectionY);
    const sec = getSectionStrict(col, sectionY);

    if (!sec || typeof sec.getBlockStateId !== 'function') {
      console.log(`sectionY=${sectionY} index=${index} missing`);
      continue;
    }

    const countsXYZ = new Map();
    const countsXZY = new Map();

    for (let lx = 0; lx < 16; lx++) {
      for (let ly = 0; ly < 16; ly++) {
        for (let lz = 0; lz < 16; lz++) {
          try {
            const sid = sec.getBlockStateId(lx, ly, lz);
            const name = blockNameFromStateId(sid);
            countsXYZ.set(name, (countsXYZ.get(name) || 0) + 1);
          } catch {
            countsXYZ.set('read_err', (countsXYZ.get('read_err') || 0) + 1);
          }

          try {
            const sid = sec.getBlockStateId(lx, lz, ly);
            const name = blockNameFromStateId(sid);
            countsXZY.set(name, (countsXZY.get(name) || 0) + 1);
          } catch {
            countsXZY.set('read_err', (countsXZY.get('read_err') || 0) + 1);
          }
        }
      }
    }

    console.log(`sectionY=${sectionY} index=${index}`);
    console.log(
      '  counts getBlockStateId(x,y,z):',
      Object.fromEntries([...countsXYZ.entries()].sort((a, b) => b[1] - a[1]))
    );
    console.log(
      '  counts getBlockStateId(x,z,y):',
      Object.fromEntries([...countsXZY.entries()].sort((a, b) => b[1] - a[1]))
    );
  }

  console.log(`=== End chunk sections ===\n`);
}

function dumpLoadedChunkSummary() {
  console.log(`\n=== Loaded chunk summary ===`);

  console.log({
    networkChunks: bot.networkChunks?.size ?? 0,
    loadedChunks: bot.loadedChunks?.size ?? 0,
    loadedChunkSections: bot.loadedChunkSections?.size ?? 0,
    worldClass: bot.world?.constructor?.name,
    chunkClass: bot.chunkColumn?.name || bot.chunkColumn?.constructor?.name,
    configuredMinY: OPTIONS.minY,
    configuredWorldHeight: OPTIONS.worldHeight
  });

  const sampleKeys = [...(bot.networkChunks?.keys?.() ?? [])].slice(0, 25);
  console.log('first network chunk keys:', sampleKeys);

  for (const { x, z } of DIAGNOSTIC_COLUMNS) {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    const key = chunkKey(cx, cz);

    console.log(`diagnostic point (${x},${z}) chunk=${key}`, {
      hasNetworkChunk: bot.networkChunks?.has(key) ?? false,
      hasLoadedChunk: bot.loadedChunks?.has(key) ?? false,
      loadedSections: bot.loadedChunkSections?.get(key)
        ? [...bot.loadedChunkSections.get(key)]
        : []
    });
  }

  console.log(`=== End loaded chunk summary ===\n`);
}

async function dumpHorizontalSlice(y = -64, minX = -16, maxX = 15, minZ = -16, maxZ = 15) {
  console.log(`\n=== Native horizontal slice y=${y} ===`);

  for (let z = minZ; z <= maxZ; z++) {
    let line = '';

    for (let x = minX; x <= maxX; x++) {
      const native = await nativeBlockName(x, y, z);
      const name = native.name;

      if (name === 'bedrock') line += 'B';
      else if (name === 'dirt') line += 'D';
      else if (name === 'grass_block') line += 'G';
      else if (name === 'air') line += '.';
      else if (name === 'undefined') line += '?';
      else line += '#';
    }

    console.log(`${String(z).padStart(4, ' ')} ${line}`);
  }

  console.log(`=== End native horizontal slice ===\n`);
}

// ===== MAIN TEST =====

async function run() {
  console.log(`[ready] chunks loaded: ${bot.networkChunks?.size}`);

  dumpLoadedChunkSummary();

  for (const { x, z } of DIAGNOSTIC_COLUMNS) {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);

    await dumpVerticalColumn(x, z, DUMP_MIN_Y, DUMP_MAX_Y);
    dumpChunkSections(cx, cz);
  }

  await dumpHorizontalSlice(-64, -16, 15, -16, 15);
  await dumpHorizontalSlice(-63, -16, 15, -16, 15);
  await dumpHorizontalSlice(-62, -16, 15, -16, 15);
  await dumpHorizontalSlice(-61, -16, 15, -16, 15);

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (let x = MIN_XZ; x <= MAX_XZ; x++) {
    for (let z = MIN_XZ; z <= MAX_XZ; z++) {
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        const expected = expectedBlockName(x, y, z);

        const native = await nativeBlockName(x, y, z);
        const accessName = native.name;

        if (accessName !== expected) {
          failed++;

          errors.push({
            pos: { x, y, z },
            expected,
            access: accessName,
            stateId: native.stateId,
            rawStrict: rawBlockNameStrict(x, y, z)
          });
        } else {
          passed++;
        }
      }
    }
  }

  const total = passed + failed;

  console.log(`\n=== Results ===`);
  console.log(`Total points checked: ${total}`);
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\nFirst 20 mismatches:`);
    errors.slice(0, 20).forEach((e, i) => {
      console.log(
        `  #${i} (${e.pos.x}, ${e.pos.y}, ${e.pos.z})  ` +
        `expected=${e.expected}  access=${e.access}  stateId=${e.stateId}  rawStrict=${e.rawStrict}`
      );
    });

    console.log(`\nFull error list dumped to test_errors.json`);
    require('fs').writeFileSync('test_errors.json', JSON.stringify(errors, null, 2));
  }

  process.exitCode = failed > 0 ? 1 : 0;
}

bot.client?.on?.('error', e => console.error('[client error]', e.message));

bot.start();

waitForWorldWithLogging(WAIT_RADIUS, WAIT_TIMEOUT_MS).then(() => {
  console.log('Chunks loaded, starting test...');

  run().catch(e => {
    console.error('Test crashed', e);
    process.exitCode = 1;
  });
}).catch(e => {
  console.error('Failed to load chunks:', e.message);
  process.exitCode = 1;
});