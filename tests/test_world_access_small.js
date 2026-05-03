// test_world_access_small.js
// Run with:
//   node test_world_access_small.js
//
// Purpose:
//   Test block access against raw section reads.
//   This version dumps ALL possible section candidates, not just the first one.
//
// TEST_POINTS format:
//   [x, y, z]
//   [x, y, z, expectedName]

const BotState = require('./state');
const Vec3 = require('vec3').Vec3;

const options = {
  host: 'localhost',
  port: 19132,
  username: 'BlockAccessBot',
  offline: true,
  version: '1.21.130',
  blockAccessMode: 'bedrockCompat'
};

// Put coordinates here.
// Optional 4th value is expected block name.
const TEST_POINTS = [
  [-3, -62, -3, 'dirt'],
  [-3, -62, 0, 'dirt'],
  [-3, -62, 3, 'dirt'],

  [0, -62, -3, 'dirt'],
  [0, -62, 0, 'dirt'],
  [0, -62, 3, 'dirt'],

  [3, -62, -3, 'dirt'],
  [3, -62, 0, 'dirt'],
  [3, -62, 3, 'dirt'],

  [-3, -61, -3, 'grass_block'],
  [0, -61, -3, 'grass_block'],
  [3, -61, 3, 'grass_block']
];

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

function nameFromStateId(stateId) {
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

function getColumnInfo(column) {
  if (!column) return null;

  return {
    minCY: column.minCY,
    maxCY: column.maxCY,
    sectionsLength: column.sections?.length,
    sectionKeys: column.sections ? Object.keys(column.sections) : undefined,
    hasGetSection: typeof column.getSection === 'function',
    hasGetSectionAtIndex: typeof column.getSectionAtIndex === 'function'
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
    try {
      add('getSection(sectionY)', column.getSection(sectionY));
    } catch (err) {
      out.push({ label: 'getSection(sectionY)', error: err.message });
    }
  }

  if (typeof column.getSectionAtIndex === 'function') {
    try {
      add('getSectionAtIndex(sectionY)', column.getSectionAtIndex(sectionY));
    } catch (err) {
      out.push({ label: 'getSectionAtIndex(sectionY)', error: err.message });
    }

    if (typeof column.minCY === 'number') {
      try {
        add(
          'getSectionAtIndex(sectionY - minCY)',
          column.getSectionAtIndex(sectionY - column.minCY)
        );
      } catch (err) {
        out.push({
          label: 'getSectionAtIndex(sectionY - minCY)',
          error: err.message
        });
      }
    }
  }

  if (Array.isArray(column.sections)) {
    for (let i = 0; i < column.sections.length; i++) {
      const sec = column.sections[i];
      if (!sec) continue;

      add(`sections[${i}] raw`, sec);

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
  const first = candidates.find(c => c.section);
  const sec = first?.section;

  const result = {
    columnExists: !!column,
    columnInfo: getColumnInfo(column),
    sectionY,
    local: { x: lx, y: ly, z: lz },
    sectionFound: !!sec,
    sectionSource: first?.label,
    rawXZY: undefined,
    rawXYZ: undefined,
    rawVec3: undefined
  };

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

function formatState(value) {
  if (value && typeof value === 'object' && 'error' in value) {
    return `ERR:${value.error}`;
  }

  if (typeof value === 'number') {
    return `${nameFromStateId(value)}/${value}`;
  }

  if (value === undefined || value === null) {
    return String(value);
  }

  return String(value);
}

function safeRead(sec, fn) {
  try {
    return fn();
  } catch (err) {
    return { error: err.message };
  }
}

function readCandidateOrders(sec, lx, ly, lz) {
  if (!sec || typeof sec.getBlockStateId !== 'function') {
    return {
      usable: false
    };
  }

  return {
    usable: true,

    xyz: safeRead(sec, () => sec.getBlockStateId(lx, ly, lz)),
    xzy: safeRead(sec, () => sec.getBlockStateId(lx, lz, ly)),
    yxz: safeRead(sec, () => sec.getBlockStateId(ly, lx, lz)),
    yzx: safeRead(sec, () => sec.getBlockStateId(ly, lz, lx)),
    zxy: safeRead(sec, () => sec.getBlockStateId(lz, lx, ly)),
    zyx: safeRead(sec, () => sec.getBlockStateId(lz, ly, lx)),
    vec: safeRead(sec, () => sec.getBlockStateId(new Vec3(lx, ly, lz)))
  };
}

function readAllRawOrdersForAllCandidates(x, y, z) {
  const column = getColumnForWorldPos(x, z);
  const sectionY = Math.floor(y / 16);
  const lx = mod16(x);
  const ly = mod16(y);
  const lz = mod16(z);

  const candidates = getSectionCandidates(column, sectionY);

  return {
    columnExists: !!column,
    columnInfo: getColumnInfo(column),
    sectionY,
    local: { lx, ly, lz },
    candidates: candidates.map((candidate, i) => {
      const sec = candidate.section;
      const orders = readCandidateOrders(sec, lx, ly, lz);

      return {
        i,
        label: candidate.label,
        error: candidate.error,
        sectionExists: !!sec,
        keys: sec ? Object.keys(sec).slice(0, 30) : null,
        yFields: sec
          ? {
              y: sec.y,
              signedY: typeof sec.y === 'number' ? signedByte(sec.y) : undefined,
              chunkY: sec.chunkY,
              signedChunkY: typeof sec.chunkY === 'number' ? signedByte(sec.chunkY) : undefined,
              sectionY: sec.sectionY,
              signedSectionY: typeof sec.sectionY === 'number' ? signedByte(sec.sectionY) : undefined,
              subChunkVersion: sec.subChunkVersion
            }
          : null,
        orders: {
          usable: orders.usable,
          xyz: formatState(orders.xyz),
          xzy: formatState(orders.xzy),
          yxz: formatState(orders.yxz),
          yzx: formatState(orders.yzx),
          zxy: formatState(orders.zxy),
          zyx: formatState(orders.zyx),
          vec: formatState(orders.vec)
        }
      };
    })
  };
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

async function checkPoint(x, y, z, expectedName) {
  const raw = readRawSectionStateIds(x, y, z);
  const allCandidateOrders = readAllRawOrdersForAllCandidates(x, y, z);
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

  const expectedMatches =
    expectedName
      ? accessBlock?.name === expectedName
      : true;

  return {
    pos: { x, y, z },
    expectedName,
    raw: {
      columnExists: raw.columnExists,
      columnInfo: raw.columnInfo,
      sectionFound: raw.sectionFound,
      sectionSource: raw.sectionSource,
      sectionY: raw.sectionY,
      local: raw.local,
      rawXZY: raw.rawXZY,
      rawXZYName: nameFromStateId(raw.rawXZY),
      rawXYZ: raw.rawXYZ,
      rawXYZName: nameFromStateId(raw.rawXYZ),
      rawVec3: raw.rawVec3,
      rawVec3Name: nameFromStateId(raw.rawVec3)
    },
    allCandidateOrders,
    access: {
      stateId: accessStateId,
      nameFromStateId: nameFromStateId(accessStateId),
      block: blockSummary(accessBlock)
    },
    nativeWorld: blockSummary(nativeBlock),
    verdict: {
      accessMatchesRawXZY,
      blockMatchesAccess,
      expectedMatches,
      pass: accessMatchesRawXZY && blockMatchesAccess && expectedMatches
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
    `expected=${r.expectedName || 'n/a'} ` +
    `rawXZY=${r.raw.rawXZYName}/${r.raw.rawXZY} ` +
    `access=${r.access.nameFromStateId}/${r.access.stateId} ` +
    `block=${r.access.block?.name}/${r.access.block?.stateId} ` +
    `native=${r.nativeWorld?.name}/${r.nativeWorld?.stateId}`
  );

  console.dir({
    allCandidateOrders: r.allCandidateOrders
  }, { depth: null });

  if (!r.verdict.pass) {
    console.dir({
      details: {
        raw: r.raw,
        access: r.access,
        nativeWorld: r.nativeWorld,
        verdict: r.verdict
      }
    }, { depth: null });
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
    chunk: {
      x: Math.floor(x / 16),
      z: Math.floor(z / 16),
      sectionY: Math.floor(y / 16)
    }
  });

  let pass = 0;
  let fail = 0;

  for (const point of TEST_POINTS) {
    const [px, py, pz, expectedName] = point;
    const r = await checkPoint(px, py, pz, expectedName);

    if (r.verdict.pass) pass++;
    else fail++;

    printResult(r);
  }

  console.log('\n[test summary]', {
    total: TEST_POINTS.length,
    pass,
    fail,
    conclusion:
      fail === 0
        ? 'All tested points matched raw x,z,y, block_access, and expected names where provided.'
        : 'Some tested points failed. Inspect allCandidateOrders to see whether section selection or chunk decode is wrong.'
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