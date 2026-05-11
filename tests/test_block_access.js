// test_block_access.js
// Run with:
//   node test_block_access.js
//
// Purpose:
//   Prove/disprove whether block_access.js is the correct reliable read path.
//
// PASS condition:
//   accessStateId === rawXZY for loaded section blocks.
//   getBlockAt().stateId === accessStateId.
//   getBlockAt() returns real-looking blocks with name + position.
//
// FAIL condition:
//   accessStateId is undefined where raw section has data.
//   accessStateId disagrees with rawXZY.
//   getBlockAt() says Air where rawXZY says dirt/grass/bedrock/etc.

const BotState = require('../src/state');
const Vec3 = require('vec3').Vec3;

const options = {
  host: 'localhost',
  port: 19132,
  username: 'BlockAccessot',
  offline: true,
  version: '1.21.130',

  // Make sure chunks.js selects BedrockCompatBlockAccess.
  blockAccessMode: 'bedrockCompat'
};

const bot = new BotState(options);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mod16(n) {
  return ((n % 16) + 16) % 16;
}

function signedByte(n) {
  return n > 127 ? n - 256 : n;
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function blockNameFromStateId(stateId) {
  if (stateId === undefined || stateId === null) return 'undefined';

  const byState = bot.registry.blocksByStateId?.[stateId];
  if (byState) return byState.name || byState.displayName || `state:${stateId}`;

  const byRuntime = bot.registry.blocksByRuntimeId?.[stateId];
  if (byRuntime) return byRuntime.name || byRuntime.displayName || `runtime:${stateId}`;

  return `unknown:${stateId}`;
}

function blockSummary(block) {
  if (!block) return null;

  return {
    name: block.name,
    displayName: block.displayName,
    stateId: block.stateId,
    type: block.type,
    boundingBox: block.boundingBox,
    shapes: Array.isArray(block.shapes) ? block.shapes.length : undefined,
    position: block.position
      ? { x: block.position.x, y: block.position.y, z: block.position.z }
      : undefined
  };
}

function getColumnForWorldPos(x, z) {
  const cx = Math.floor(x / 16);
  const cz = Math.floor(z / 16);
  return bot.networkChunks?.get(chunkKey(cx, cz)) || null;
}

function getSectionCandidates(column, sectionY) {
  const out = [];

  function add(label, section) {
    if (section && !out.some(e => e.section === section)) {
      out.push({ label, section });
    }
  }

  if (!column) return out;

  if (typeof column.getSection === 'function') {
    try { add('getSection(sectionY)', column.getSection(sectionY)); } catch (_) {}
  }

  if (typeof column.getSectionAtIndex === 'function') {
    try { add('getSectionAtIndex(sectionY)', column.getSectionAtIndex(sectionY)); } catch (_) {}

    if (typeof column.minCY === 'number') {
      try {
        add(
          'getSectionAtIndex(sectionY - minCY)',
          column.getSectionAtIndex(sectionY - column.minCY)
        );
      } catch (_) {}
    }
  }

  if (Array.isArray(column.sections)) {
    for (let i = 0; i < column.sections.length; i++) {
      const sec = column.sections[i];
      if (!sec) continue;

      if (typeof sec.y === 'number' && signedByte(sec.y) === sectionY) {
        add(`sections[${i}] signed sec.y`, sec);
      }

      if (typeof sec.chunkY === 'number' && signedByte(sec.chunkY) === sectionY) {
        add(`sections[${i}] signed sec.chunkY`, sec);
      }

      if (typeof sec.sectionY === 'number' && signedByte(sec.sectionY) === sectionY) {
        add(`sections[${i}] signed sec.sectionY`, sec);
      }

      if (typeof column.minCY === 'number' && column.minCY + i === sectionY) {
        add(`sections[${i}] minCY+i`, sec);
      }
    }
  }

  return out;
}

function readRawSectionStateIds(x, y, z) {
  const column = getColumnForWorldPos(x, z);
  const sectionY = Math.floor(y / 16);
  const lx = mod16(x);
  const ly = mod16(y);
  const lz = mod16(z);

  const candidates = getSectionCandidates(column, sectionY);
  const first = candidates[0];

  const result = {
    columnExists: !!column,
    columnInfo: column
      ? {
          minCY: column.minCY,
          maxCY: column.maxCY,
          sectionsLength: column.sections?.length,
          sectionKeys: column.sections ? Object.keys(column.sections) : undefined
        }
      : null,
    sectionY,
    local: { x: lx, y: ly, z: lz },
    sectionFound: !!first,
    sectionSource: first?.label,
    rawXZY: undefined,
    rawXYZ: undefined,
    rawVec3: undefined
  };

  const sec = first?.section;
  if (!sec || typeof sec.getBlockStateId !== 'function') return result;

  try {
    result.rawXZY = sec.getBlockStateId(lx, lz, ly);
  } catch (err) {
    result.rawXZY = `ERR:${err.message}`;
  }

  try {
    result.rawXYZ = sec.getBlockStateId(lx, ly, lz);
  } catch (err) {
    result.rawXYZ = `ERR:${err.message}`;
  }

  try {
    result.rawVec3 = sec.getBlockStateId(new Vec3(lx, ly, lz));
  } catch (err) {
    result.rawVec3 = `ERR:${err.message}`;
  }

  return result;
}

async function readAccessStateId(x, y, z) {
  if (typeof bot.getBlockStateIdAt !== 'function') return undefined;
  return bot.getBlockStateIdAt(x, y, z);
}

async function readAccessBlock(x, y, z) {
  if (typeof bot.getBlockAt !== 'function') return null;
  return await bot.getBlockAt(x, y, z);
}

async function readNativeWorldBlock(x, y, z) {
  try {
    if (!bot.world?.getBlock) return null;
    return await bot.world.getBlock(new Vec3(x, y, z));
  } catch {
    return null;
  }
}

async function checkPoint(x, y, z) {
  const raw = readRawSectionStateIds(x, y, z);
  const accessStateId = await readAccessStateId(x, y, z);
  const accessBlock = await readAccessBlock(x, y, z);
  const nativeBlock = await readNativeWorldBlock(x, y, z);

  const accessMatchesRawXZY =
    typeof raw.rawXZY === 'number' &&
    typeof accessStateId === 'number' &&
    raw.rawXZY === accessStateId;

  const blockMatchesAccess =
    accessBlock &&
    typeof accessBlock.stateId === 'number' &&
    accessBlock.stateId === accessStateId;

  const rawLooksUseful =
    typeof raw.rawXZY === 'number' &&
    blockNameFromStateId(raw.rawXZY).toLowerCase() !== 'air';

  const accessLooksWrong =
    rawLooksUseful &&
    (!accessBlock || String(accessBlock.name || '').toLowerCase() === 'air');

  return {
    pos: { x, y, z },
    raw: {
      sectionFound: raw.sectionFound,
      sectionSource: raw.sectionSource,
      sectionY: raw.sectionY,
      local: raw.local,
      rawXZY: raw.rawXZY,
      rawXZYName: blockNameFromStateId(raw.rawXZY),
      rawXYZ: raw.rawXYZ,
      rawXYZName: blockNameFromStateId(raw.rawXYZ),
      rawVec3: raw.rawVec3,
      rawVec3Name: blockNameFromStateId(raw.rawVec3)
    },
    access: {
      stateId: accessStateId,
      nameFromStateId: blockNameFromStateId(accessStateId),
      block: blockSummary(accessBlock)
    },
    nativeWorld: blockSummary(nativeBlock),
    verdict: {
      accessMatchesRawXZY,
      blockMatchesAccess,
      rawLooksUseful,
      accessLooksWrong,
      pass: accessMatchesRawXZY && blockMatchesAccess && !accessLooksWrong
    }
  };
}

async function waitForReady() {
  const start = Date.now();

  while (Date.now() - start < 15000) {
    if (
      bot.self?.position &&
      bot.blockAccess &&
      typeof bot.getBlockAt === 'function' &&
      typeof bot.getBlockStateIdAt === 'function' &&
      bot.networkChunks?.size > 0
    ) {
      return true;
    }

    await sleep(100);
  }

  return false;
}

function printResult(r) {
  const status = r.verdict.pass ? 'PASS' : 'FAIL';

  console.log(
    `[${status}] (${r.pos.x}, ${r.pos.y}, ${r.pos.z}) ` +
    `rawXZY=${r.raw.rawXZYName}/${r.raw.rawXZY} ` +
    `access=${r.access.nameFromStateId}/${r.access.stateId} ` +
    `block=${r.access.block?.name}/${r.access.block?.stateId} ` +
    `native=${r.nativeWorld?.name}/${r.nativeWorld?.stateId}`
  );

  if (!r.verdict.pass) {
    console.log('  details:', {
      raw: r.raw,
      access: r.access,
      nativeWorld: r.nativeWorld,
      verdict: r.verdict
    });
  }
}

async function runTest() {
  const ready = await waitForReady();

  console.log('[test] ready:', ready);
  console.log('[test] blockAccess:', bot.blockAccess?.constructor?.name);
  console.log('[test] loaded columns:', bot.networkChunks?.size);

  if (!ready) {
    console.log('[test] Not ready. Missing one of: self.position, blockAccess, getBlockAt, getBlockStateIdAt, networkChunks.');
    process.exitCode = 1;
    return;
  }

  const p = bot.self.position;
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  const z = Math.floor(p.z);

  console.log('[test] bot position:', {
    exact: { x: p.x, y: p.y, z: p.z },
    block: { x, y, z },
    chunk: { x: Math.floor(x / 16), z: Math.floor(z / 16), sectionY: Math.floor(y / 16) }
  });

  const points = [];

  // Around bot feet.
  for (let dy = 3; dy >= -8; dy--) {
    points.push([x, y + dy, z]);
  }

  // Hardcoded origin flat-world area.
  for (let yy = -64; yy <= -56; yy++) {
    points.push([0, yy, 0]);
  }

  // Small 3x3 at likely ground layers.
  for (const yy of [-64, -63, -62, -61, -60]) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        points.push([dx, yy, dz]);
      }
    }
  }

  let pass = 0;
  let fail = 0;
  let rawUseful = 0;
  let accessWrong = 0;

  for (const [px, py, pz] of points) {
    const r = await checkPoint(px, py, pz);

    if (r.verdict.rawLooksUseful) rawUseful++;
    if (r.verdict.accessLooksWrong) accessWrong++;

    if (r.verdict.pass) pass++;
    else fail++;

    printResult(r);
  }

  console.log('\n[test summary]', {
    total: points.length,
    pass,
    fail,
    rawUseful,
    accessWrong,
    conclusion:
      fail === 0
        ? 'block_access appears reliable against raw section x,z,y reads.'
        : accessWrong > 0
          ? 'block_access is NOT reliable: raw section has real blocks but accessor returns air/wrong.'
          : 'block_access has mismatches; inspect FAIL details above.'
  });

  process.exitCode = fail === 0 ? 0 : 1;
}

bot.client?.on?.('error', err => {
  console.error('[client error]', err);
});

bot.start();

setTimeout(() => {
  runTest().catch(err => {
    console.error('[test crash]', err?.stack || err);
    process.exitCode = 1;
  });
}, 5000);