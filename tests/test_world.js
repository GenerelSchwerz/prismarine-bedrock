// test_world.js
// Run with:
//   node test_world.js
//
// Purpose:
//   Prove whether your bot world is actually missing blocks, reading the wrong Y,
//   decoding sections into the wrong vertical index, or failing block lookup even
//   though section palettes contain real blocks.
//
// Important:
//   This script intentionally pokes prismarine-chunk internals because we are
//   debugging Bedrock section storage/palette state.

const BotState = require('../src/state');
const Vec3 = require('vec3').Vec3;















const options = {
  host: 'localhost',
  port: 19132,
  username: 'WorldTestBot',
  offline: true,
  version: '1.21.130'
};

const bot = new BotState(options);bot.start();


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function floorDiv16(n) {
  return Math.floor(n / 16);
}

function mod16(n) {
  return ((n % 16) + 16) % 16;
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function blockName(block) {
  if (!block) return 'null';
  return block.displayName || block.name || `type=${block.type ?? 'unknown'}`;
}

function describeStateId(stateId) {
  if (stateId === undefined || stateId === null) return null;

  const byStateId = bot.registry?.blocksByStateId?.[stateId];
  if (byStateId) {
    return {
      stateId,
      name: byStateId.name,
      displayName: byStateId.displayName,
      type: byStateId.id ?? byStateId.type,
      runtimeId: byStateId.runtimeId
    };
  }

  const byRuntime = bot.registry?.blocksByRuntimeId?.[stateId];
  if (byRuntime) {
    return {
      stateId,
      runtimeLookup: true,
      name: byRuntime.name,
      displayName: byRuntime.displayName,
      type: byRuntime.id ?? byRuntime.type,
      runtimeId: byRuntime.runtimeId,
      mappedStateId: byRuntime.stateId
    };
  }

  return { stateId, name: 'UNKNOWN_STATE' };
}

async function safeGetBlockAt(x, y, z) {
  try {
    if (typeof bot.getBlockAt === 'function') {
      return await bot.getBlockAt(x, y, z);
    }

    if (bot.world?.getBlock) {
      return bot.world.getBlock(new Vec3(x, y, z));
    }

    return null;
  } catch (err) {
    return { error: err.message };
  }
}

async function printBlockLine(label, x, y, z) {
  const block = await safeGetBlockAt(x, y, z);

  if (block?.error) {
    console.log(`${label} (${x}, ${y}, ${z}) => ERROR: ${block.error}`);
    return;
  }

  console.log(
    `${label} (${x}, ${y}, ${z}) => ${blockName(block)} ` +
    `stateId=${block?.stateId ?? 'n/a'} type=${block?.type ?? 'n/a'}`
  );
}

function getColumn(cx, cz) {
  return (
    bot.networkChunks?.get(chunkKey(cx, cz)) ||
    bot.networkChunks?.get(`${cx}:${cz}`) ||
    null
  );
}

function printColumnInfo(cx, cz) {
  const col = getColumn(cx, cz);

  console.log('[diagnostic] column info', {
    cx,
    cz,
    exists: !!col,
    minCY: col?.minCY,
    maxCY: col?.maxCY,
    sectionsLength: col?.sections?.length,
    sectionKeys: col?.sections ? Object.keys(col.sections) : undefined,
    hasGetBlock: typeof col?.getBlock === 'function',
    hasGetBlockStateId: typeof col?.getBlockStateId === 'function',
    hasGetSectionAtIndex: typeof col?.getSectionAtIndex === 'function',
    hasGetSection: typeof col?.getSection === 'function'
  });

  return col;
}

function tryDirectColumnRead(col, worldX, y, worldZ) {
  if (!col || typeof col.getBlock !== 'function') return null;

  const localX = mod16(worldX);
  const localZ = mod16(worldZ);

  const candidates = [
    new Vec3(localX, y, localZ),
    { x: localX, y, z: localZ },
    new Vec3(worldX, y, worldZ),
    { x: worldX, y, z: worldZ }
  ];

  for (const pos of candidates) {
    try {
      const b = col.getBlock(pos);
      if (b) return b;
    } catch (_) {}
  }

  return null;
}

function tryDirectColumnStateId(col, worldX, y, worldZ) {
  if (!col || typeof col.getBlockStateId !== 'function') return null;

  const localX = mod16(worldX);
  const localZ = mod16(worldZ);

  const candidates = [
    new Vec3(localX, y, localZ),
    { x: localX, y, z: localZ },
    new Vec3(worldX, y, worldZ),
    { x: worldX, y, z: worldZ }
  ];

  for (const pos of candidates) {
    try {
      const stateId = col.getBlockStateId(pos);
      if (stateId !== undefined && stateId !== null) return stateId;
    } catch (_) {}
  }

  return null;
}

function getSectionsArray(col) {
  if (!col) return [];

  if (Array.isArray(col.sections)) return col.sections;

  if (col.sections && typeof col.sections === 'object') {
    return Object.entries(col.sections).map(([key, section]) => ({
      key,
      section
    }));
  }

  return [];
}

function normalizeSectionEntry(entry, index) {
  if (entry && typeof entry === 'object' && 'section' in entry) {
    return {
      arrayIndex: Number.isFinite(Number(entry.key)) ? Number(entry.key) : index,
      key: entry.key,
      section: entry.section
    };
  }

  return {
    arrayIndex: index,
    key: String(index),
    section: entry
  };
}

function guessSectionWorldY(col, arrayIndex, section) {
  const guesses = [];

  if (typeof section?.y === 'number') guesses.push(section.y);
  if (typeof section?.chunkY === 'number') guesses.push(section.chunkY);
  if (typeof section?.sectionY === 'number') guesses.push(section.sectionY);

  if (typeof col?.minCY === 'number') {
    guesses.push(col.minCY + arrayIndex);
  }

  guesses.push(arrayIndex);

  return [...new Set(guesses)];
}

function getSectionByCandidate(col, sectionY) {
  const attempts = [];

  if (!col) return attempts;

  if (typeof col.getSectionAtIndex === 'function') {
    try {
      attempts.push({
        method: 'getSectionAtIndex(sectionY)',
        arg: sectionY,
        section: col.getSectionAtIndex(sectionY)
      });
    } catch (err) {
      attempts.push({
        method: 'getSectionAtIndex(sectionY)',
        arg: sectionY,
        error: err.message
      });
    }

    if (typeof col.minCY === 'number') {
      const adjusted = sectionY - col.minCY;
      try {
        attempts.push({
          method: 'getSectionAtIndex(sectionY - minCY)',
          arg: adjusted,
          section: col.getSectionAtIndex(adjusted)
        });
      } catch (err) {
        attempts.push({
          method: 'getSectionAtIndex(sectionY - minCY)',
          arg: adjusted,
          error: err.message
        });
      }
    }
  }

  if (typeof col.getSection === 'function') {
    try {
      attempts.push({
        method: 'getSection(sectionY)',
        arg: sectionY,
        section: col.getSection(sectionY)
      });
    } catch (err) {
      attempts.push({
        method: 'getSection(sectionY)',
        arg: sectionY,
        error: err.message
      });
    }

    if (typeof col.minCY === 'number') {
      const adjusted = sectionY - col.minCY;
      try {
        attempts.push({
          method: 'getSection(sectionY - minCY)',
          arg: adjusted,
          section: col.getSection(adjusted)
        });
      } catch (err) {
        attempts.push({
          method: 'getSection(sectionY - minCY)',
          arg: adjusted,
          error: err.message
        });
      }
    }
  }

  if (Array.isArray(col.sections)) {
    attempts.push({
      method: 'sections[sectionY]',
      arg: sectionY,
      section: col.sections[sectionY]
    });

    if (typeof col.minCY === 'number') {
      const adjusted = sectionY - col.minCY;
      attempts.push({
        method: 'sections[sectionY - minCY]',
        arg: adjusted,
        section: col.sections[adjusted]
      });
    }
  }

  return attempts;
}

function extractPaletteCandidates(section) {
  const candidates = [];

  function add(path, value) {
    if (value !== undefined && value !== null) {
      candidates.push({ path, value });
    }
  }

  add('section.palette', section?.palette);
  add('section.palettes', section?.palettes);
  add('section.states', section?.states);
  add('section.storage', section?.storage);
  add('section.storages', section?.storages);
  add('section.blocks', section?.blocks);
  add('section.data', section?.data);
  add('section.subchunks', section?.subchunks);

  if (Array.isArray(section?.storage)) {
    section.storage.forEach((s, i) => {
      add(`section.storage[${i}].palette`, s?.palette);
      add(`section.storage[${i}].states`, s?.states);
    });
  }

  if (Array.isArray(section?.storages)) {
    section.storages.forEach((s, i) => {
      add(`section.storages[${i}].palette`, s?.palette);
      add(`section.storages[${i}].states`, s?.states);
    });
  }

  if (section?.blocks) {
    add('section.blocks.palette', section.blocks.palette);
    add('section.blocks.states', section.blocks.states);
    add('section.blocks.data', section.blocks.data);
  }

  return candidates;
}

function summarizePaletteValue(value) {
  if (!value) return { kind: typeof value };

  if (Array.isArray(value)) {
    return {
      kind: 'array',
      length: value.length,
      sample: value.slice(0, 12).map(v => {
        if (typeof v === 'number') return describeStateId(v);
        if (v && typeof v === 'object') {
          return {
            keys: Object.keys(v).slice(0, 10),
            name: v.name,
            stateId: v.stateId,
            runtimeId: v.runtimeId,
            id: v.id
          };
        }
        return v;
      })
    };
  }

  if (value instanceof Map) {
    const entries = [...value.entries()].slice(0, 12);
    return {
      kind: 'map',
      size: value.size,
      sample: entries.map(([k, v]) => ({
        key: k,
        value: typeof v === 'number'
          ? describeStateId(v)
          : v && typeof v === 'object'
            ? {
                keys: Object.keys(v).slice(0, 10),
                name: v.name,
                stateId: v.stateId,
                runtimeId: v.runtimeId,
                id: v.id
              }
            : v
      }))
    };
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);

    const numericValues = keys
      .slice(0, 32)
      .map(k => value[k])
      .filter(v => typeof v === 'number');

    return {
      kind: 'object',
      keys: keys.slice(0, 30),
      numericSample: numericValues.slice(0, 12).map(describeStateId)
    };
  }

  return {
    kind: typeof value,
    value
  };
}

function trySectionGetStateId(section, lx, ly, lz) {
  const attempts = [];

  const methodNames = [
    'getBlockStateId',
    'getBlockStateIdAt',
    'getStateId',
    'get',
    'getBlock'
  ];

  const argCandidates = [
    [new Vec3(lx, ly, lz)],
    [{ x: lx, y: ly, z: lz }],
    [lx, ly, lz],
    [lx, lz, ly]
  ];

  for (const method of methodNames) {
    if (typeof section?.[method] !== 'function') continue;

    for (const args of argCandidates) {
      try {
        const value = section[method](...args);
        attempts.push({
          method,
          args: args.map(a => typeof a === 'object' ? { x: a.x, y: a.y, z: a.z } : a),
          value: typeof value === 'number'
            ? describeStateId(value)
            : value && typeof value === 'object'
              ? {
                  name: value.name,
                  displayName: value.displayName,
                  stateId: value.stateId,
                  type: value.type,
                  keys: Object.keys(value).slice(0, 12)
                }
              : value
        });
      } catch (err) {
        attempts.push({
          method,
          args: args.map(a => typeof a === 'object' ? { x: a.x, y: a.y, z: a.z } : a),
          error: err.message
        });
      }
    }
  }

  return attempts;
}

function dumpSectionPalettesAround(col, worldX, worldY, worldZ) {
  if (!col) {
    console.log('[palette] no column');
    return;
  }

  const sectionY = floorDiv16(worldY);
  const lx = mod16(worldX);
  const ly = mod16(worldY);
  const lz = mod16(worldZ);

  console.log('\n[palette] target', {
    world: { x: worldX, y: worldY, z: worldZ },
    local: { x: lx, yInSection: ly, z: lz },
    sectionY,
    minCY: col.minCY,
    maxCY: col.maxCY,
    sectionsLength: col.sections?.length,
    sectionKeys: col.sections ? Object.keys(col.sections) : undefined
  });

  const sectionAttempts = getSectionByCandidate(col, sectionY);

  console.log('[palette] section lookup attempts');
  for (const attempt of sectionAttempts) {
    console.log(' ', {
      method: attempt.method,
      arg: attempt.arg,
      exists: !!attempt.section,
      error: attempt.error,
      sectionKeys: attempt.section ? Object.keys(attempt.section).slice(0, 30) : undefined,
      sectionYFields: attempt.section
        ? {
            y: attempt.section.y,
            chunkY: attempt.section.chunkY,
            sectionY: attempt.section.sectionY,
            subChunkVersion: attempt.section.subChunkVersion
          }
        : undefined
    });
  }

  const sections = getSectionsArray(col);

  console.log('\n[palette] all stored sections summary');
  if (sections.length === 0) {
    console.log('  no sections found on column');
    return;
  }

  for (let i = 0; i < sections.length; i++) {
    const normalized = normalizeSectionEntry(sections[i], i);
    const section = normalized.section;
    if (!section) {
      console.log(`  section[${normalized.key}] empty/null`);
      continue;
    }

    const guessedYs = guessSectionWorldY(col, normalized.arrayIndex, section);
    const paletteCandidates = extractPaletteCandidates(section);

    console.log(`  section[${normalized.key}]`, {
      arrayIndex: normalized.arrayIndex,
      guessedWorldSectionYs: guessedYs,
      yFields: {
        y: section.y,
        chunkY: section.chunkY,
        sectionY: section.sectionY,
        subChunkVersion: section.subChunkVersion
      },
      keys: Object.keys(section).slice(0, 30),
      paletteCandidatePaths: paletteCandidates.map(c => c.path)
    });

    for (const candidate of paletteCandidates) {
      console.log(`    palette candidate ${candidate.path}:`, summarizePaletteValue(candidate.value));
    }

    // If this section could correspond to the target section, try direct local reads from it.
    if (guessedYs.includes(sectionY) || guessedYs.includes(sectionY - col.minCY)) {
      console.log('    direct local section read attempts:', trySectionGetStateId(section, lx, ly, lz));
    }
  }
}

async function scanVerticalColumn(x, z, centerY, radius) {
  console.log(`\n[diagnostic] vertical scan at x=${x}, z=${z}, y=${centerY - radius}..${centerY + radius}`);

  for (let y = centerY + radius; y >= centerY - radius; y--) {
    await printBlockLine('  world', x, y, z);
  }
}

async function scanFlatArea(cx, cz, y) {
  console.log(`\n[diagnostic] 5x5 flat area at y=${y}`);

  const rows = [];
  for (let z = cz - 2; z <= cz + 2; z++) {
    const row = [];
    for (let x = cx - 2; x <= cx + 2; x++) {
      const block = await safeGetBlockAt(x, y, z);
      const name = block?.error ? 'ERR' : blockName(block);
      row.push(name.replace('minecraft:', '').slice(0, 10).padEnd(10));
    }
    rows.push(`z=${String(z).padStart(4)} | ${row.join(' ')}`);
  }

  for (const row of rows) console.log(row);
}

async function compareWorldVsDirectColumn(x, y, z) {
  const cx = floorDiv16(x);
  const cz = floorDiv16(z);
  const col = printColumnInfo(cx, cz);

  const worldBlock = await safeGetBlockAt(x, y, z);
  const directBlock = tryDirectColumnRead(col, x, y, z);
  const directStateId = tryDirectColumnStateId(col, x, y, z);

  console.log('\n[diagnostic] world vs direct column read', {
    pos: { x, y, z },
    chunk: { cx, cz },
    local: { x: mod16(x), y, yInSection: mod16(y), z: mod16(z) },
    sectionY: floorDiv16(y),
    worldRead: worldBlock?.error
      ? `ERROR: ${worldBlock.error}`
      : {
          name: blockName(worldBlock),
          stateId: worldBlock?.stateId,
          type: worldBlock?.type
        },
    directColumnRead: directBlock
      ? {
          name: blockName(directBlock),
          stateId: directBlock?.stateId,
          type: directBlock?.type
        }
      : null,
    directColumnStateId: describeStateId(directStateId)
  });

  dumpSectionPalettesAround(col, x, y, z);
}

async function runDiagnostics() {
  if (!bot.self?.position) {
    console.log('[diagnostic] no bot.self.position yet');
    return;
  }

  const p = bot.self.position;

  const feetX = Math.floor(p.x);
  const feetY = Math.floor(p.y);
  const feetZ = Math.floor(p.z);

  console.log('\n[diagnostic] ===============================');
  console.log('[diagnostic] bot position', {
    x: p.x,
    y: p.y,
    z: p.z,
    block: { x: feetX, y: feetY, z: feetZ },
    chunk: {
      x: floorDiv16(feetX),
      z: floorDiv16(feetZ),
      sectionY: floorDiv16(feetY)
    },
    loadedColumns: bot.networkChunks?.size ?? 0
  });

  await compareWorldVsDirectColumn(feetX, feetY, feetZ);
  await compareWorldVsDirectColumn(feetX, feetY - 1, feetZ);

  await scanVerticalColumn(feetX, feetZ, feetY, 6);

  await scanFlatArea(feetX, feetZ, feetY);
  await scanFlatArea(feetX, feetZ, feetY - 1);
  await scanFlatArea(feetX, feetZ, feetY - 2);

  console.log('\n[diagnostic] hardcoded origin-area check');
  await compareWorldVsDirectColumn(0, -60, 0);
  await compareWorldVsDirectColumn(0, -61, 0);
  await compareWorldVsDirectColumn(0, -62, 0);
  await scanVerticalColumn(0, 0, -60, 6);

  console.log('[diagnostic] ===============================\n');
}

bot.client.on('start_game', (pkt) => {
  console.log('[diagnostic] received start_game');

  console.log('[diagnostic] start_game basics', {
    player_position: pkt.player_position,
    spawn_position: pkt.spawn_position,
    dimension: pkt.dimension,
    generator: pkt.generator,
    block_properties_count: pkt.block_properties?.length,
    has_block_states: !!pkt.block_states
  });

  if (bot.registry?.handleStartGame) {
    try {
      pkt.itemstates ??= []
      bot.registry.handleStartGame(pkt);
      console.log('[diagnostic] registry.handleStartGame complete', {
        blocksByRuntimeId: Object.keys(bot.registry.blocksByRuntimeId || {}).length,
        blocksByStateId: Object.keys(bot.registry.blocksByStateId || {}).length,
        airByName: bot.registry.blocksByName?.air || bot.registry.blocksByName?.['minecraft:air']
      });
    } catch (err) {
      console.error('[diagnostic] registry.handleStartGame failed:', err.stack || err);
    }
  }
});

bot.client.on('level_chunk', (pkt) => {
  console.log('[diagnostic] level_chunk', {
    x: pkt.x,
    z: pkt.z,
    dimension: pkt.dimension,
    sub_chunk_count: pkt.sub_chunk_count,
    highest_subchunk_count: pkt.highest_subchunk_count,
    cache_enabled: pkt.cache_enabled,
    payload_len: pkt.payload?.length,
    blobs_len: pkt.blobs?.length
  });
});

bot.client.on('subchunk', (pkt) => {
  console.log('[diagnostic] subchunk', {
    origin: pkt.origin,
    cache_enabled: pkt.cache_enabled,
    dimension: pkt.dimension,
    entries: pkt.entries?.map(e => ({
      dx: e.dx,
      dy: e.dy,
      dz: e.dz,
      result: e.result,
      payload_len: e.payload?.length,
      has_payload: !!e.payload,
      heightmap_type: e.heightmap_type,
      render_heightmap_type: e.render_heightmap_type
    }))
  });
});

bot.client.on('update_block', (pkt) => {
  const descriptor = bot.registry.blocksByRuntimeId?.[pkt.block_runtime_id];
  console.log('[diagnostic] update_block', {
    position: pkt.position,
    layer: pkt.layer,
    runtimeId: pkt.block_runtime_id,
    stateId: descriptor?.stateId,
    name: descriptor?.name
  });
});

bot.client.on('update_block_synced', (pkt) => {
  const descriptor = bot.registry.blocksByRuntimeId?.[pkt.block_runtime_id];
  console.log('[diagnostic] update_block_synced', {
    position: pkt.position,
    layer: pkt.layer,
    runtimeId: pkt.block_runtime_id,
    stateId: descriptor?.stateId,
    name: descriptor?.name
  });
});

bot.client.on('update_subchunk_blocks', (pkt) => {
  console.log('[diagnostic] update_subchunk_blocks', {
    subchunk: { x: pkt.x, y: pkt.y, z: pkt.z },
    blockCount: pkt.blocks?.length,
    extraCount: pkt.extra?.length,
    firstBlocks: pkt.blocks?.slice(0, 5)
  });
});

bot.client.on('network_chunk_publisher_update', (pkt) => {
  console.log('[diagnostic] network_chunk_publisher_update', {
    coordinates: pkt.coordinates,
    radius: pkt.radius
  });
});

bot.client.on('respawn', async () => {
  console.log('[diagnostic] respawn received; waiting for chunk flow...');
  await sleep(4000);
  await runDiagnostics();

  setInterval(() => {
    runDiagnostics().catch(err => {
      console.error('[diagnostic] periodic diagnostic failed:', err.stack || err);
    });
  }, 10000);
});

bot.start();
