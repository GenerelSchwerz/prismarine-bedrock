const Vec3 = require('vec3').Vec3;

function normalizePos(x, y, z) {
  if (x instanceof Vec3 || (x && typeof x === 'object')) {
    return new Vec3(Math.floor(x.x), Math.floor(x.y), Math.floor(x.z));
  }

  return new Vec3(Math.floor(x), Math.floor(y), Math.floor(z));
}

function mod16(n) {
  return ((n % 16) + 16) % 16;
}

function signedByte(n) {
  return n > 127 ? n - 256 : n;
}

function makeBlock(registry, stateId, position) {
  const desc =
    registry.blocksByStateId?.[stateId] ||
    registry.blocksByRuntimeId?.[stateId];

  if (!desc) {
    return {
      name: 'unknown',
      displayName: 'Unknown',
      stateId,
      type: -1,
      position
    };
  }

  return {
    ...desc,
    name: desc.name || desc.displayName || 'unknown',
    displayName: desc.displayName || desc.name || 'Unknown',
    stateId,
    type: desc.id ?? desc.type ?? 0,
    position
  };
}

function getSectionIndex(chunk, sectionY) {
  if (!chunk) return null;

  if (typeof chunk.co === 'number') {
    return chunk.co + sectionY;
  }

  if (typeof chunk.minCY === 'number') {
    return sectionY - chunk.minCY;
  }

  if (typeof chunk.minY === 'number') {
    return sectionY - Math.floor(chunk.minY / 16);
  }

  return sectionY;
}

function getSectionStrict(chunk, sectionY) {
  if (!chunk || !Array.isArray(chunk.sections)) return null;

  const index = getSectionIndex(chunk, sectionY);

  if (!Number.isInteger(index)) return null;
  if (index < 0 || index >= chunk.sections.length) return null;

  const sec = chunk.sections[index];
  if (!sec) return null;

  return sec;
}

function getSectionByMetadata(chunk, sectionY) {
  if (!chunk || !Array.isArray(chunk.sections)) return null;

  for (let i = 0; i < chunk.sections.length; i++) {
    const sec = chunk.sections[i];
    if (!sec) continue;

    if (typeof sec.y === 'number' && signedByte(sec.y) === sectionY) return sec;
    if (typeof sec.chunkY === 'number' && signedByte(sec.chunkY) === sectionY) return sec;
    if (typeof sec.sectionY === 'number' && signedByte(sec.sectionY) === sectionY) return sec;

    if (typeof chunk.minCY === 'number' && chunk.minCY + i === sectionY) return sec;
    if (typeof chunk.minY === 'number' && Math.floor(chunk.minY / 16) + i === sectionY) return sec;
  }

  return null;
}

class NativeBlockAccess {
  constructor(botState) {
    this.botState = botState;
    this.world = botState.world;
    this.registry = botState.registry;
  }

  getStateIdAt(x, y, z) {
    const pos = normalizePos(x, y, z);

    if (typeof this.world.getBlockStateId === 'function') {
      return this.world.getBlockStateId(pos);
    }

    return undefined;
  }

  async getBlockAt(x, y, z) {
    const pos = normalizePos(x, y, z);

    if (typeof this.world.getBlock === 'function') {
      return this.world.getBlock(pos);
    }

    const stateId = this.getStateIdAt(pos);
    if (stateId === undefined) return null;

    return makeBlock(this.registry, stateId, pos);
  }

  async setBlockStateIdAt(x, y, z, stateId) {
    const pos = normalizePos(x, y, z);

    if (typeof this.world.setBlockStateId !== 'function') return false;

    await this.world.setBlockStateId(pos, stateId);
    return true;
  }
}

class BedrockCompatBlockAccess {
  constructor(botState) {
    this.botState = botState;
    this.world = botState.world;
    this.registry = botState.registry;
  }

  getColumn(cx, cz) {
    return this.botState.networkChunks?.get(`${cx},${cz}`) || null;
  }

  getSection(chunk, sectionY) {
    if (!chunk) return null;

    // IMPORTANT:
    // Do strict backing-array lookup first.
    //
    // Your diagnostics showed chunk.getSection(sectionY) can alias invalid
    // section coordinates back to the populated section. That made y=-64,
    // y=-48, y=-32, y=-16, y=0, etc. all appear to contain the same blocks.
    //
    // For a chunk with:
    //   minCY = -4
    //   co = 4
    //   sections.length = 5
    //
    // the valid section coordinates should map like:
    //   sectionY=-4 -> index 0
    //   sectionY=-3 -> index 1
    //   sectionY=-2 -> index 2
    //   sectionY=-1 -> index 3
    //   sectionY=0  -> index 4
    //
    // Anything outside that range must be treated as missing.
    const strict = getSectionStrict(chunk, sectionY);
    if (strict) return strict;

    // Metadata fallback. This is still safe because it checks the section's
    // own y/chunkY/sectionY fields or the chunk minCY-derived index.
    const byMetadata = getSectionByMetadata(chunk, sectionY);
    if (byMetadata) return byMetadata;

    // Only use library accessors as a last resort, and only when we do NOT
    // have enough metadata to perform a strict indexed lookup. If chunk.sections
    // exists, we already know strict lookup failed, so trusting getSection()
    // would reintroduce the aliasing bug.
    if (!Array.isArray(chunk.sections)) {
      if (typeof chunk.getSection === 'function') {
        try {
          const sec = chunk.getSection(sectionY);
          if (sec) return sec;
        } catch (_) {}
      }

      if (typeof chunk.getSectionAtIndex === 'function') {
        try {
          const sec = chunk.getSectionAtIndex(sectionY);
          if (sec) return sec;
        } catch (_) {}
      }
    }

    return null;
  }

  getStateIdAt(x, y, z) {
    const pos = normalizePos(x, y, z);

    const cx = Math.floor(pos.x / 16);
    const cz = Math.floor(pos.z / 16);
    const sectionY = Math.floor(pos.y / 16);

    const chunk = this.getColumn(cx, cz);
    const sec = this.getSection(chunk, sectionY);

    if (!sec || typeof sec.getBlockStateId !== 'function') return undefined;

    const lx = mod16(pos.x);
    const ly = mod16(pos.y);
    const lz = mod16(pos.z);

    // Bedrock section accessor in your diagnostics returned correct values as x, z, y.
    return sec.getBlockStateId(lx, lz, ly);
  }

  async getBlockAt(x, y, z) {
    const pos = normalizePos(x, y, z);
    const stateId = this.getStateIdAt(pos);

    if (stateId === undefined) return null;

    return makeBlock(this.registry, stateId, pos);
  }

  async setBlockStateIdAt(x, y, z, stateId) {
    const pos = normalizePos(x, y, z);

    // Keep prismarine-world updated when possible.
    if (typeof this.world.setBlockStateId === 'function') {
      try {
        await this.world.setBlockStateId(pos, stateId);
      } catch (_) {}
    }

    const cx = Math.floor(pos.x / 16);
    const cz = Math.floor(pos.z / 16);
    const sectionY = Math.floor(pos.y / 16);

    const chunk = this.getColumn(cx, cz);
    const sec = this.getSection(chunk, sectionY);

    if (!sec) return false;

    const lx = mod16(pos.x);
    const ly = mod16(pos.y);
    const lz = mod16(pos.z);

    if (typeof sec.setBlockStateId === 'function') {
      sec.setBlockStateId(lx, lz, ly, stateId);
      return true;
    }

    if (typeof sec.set === 'function') {
      sec.set(lx, lz, ly, stateId);
      return true;
    }

    return false;
  }
}

module.exports = {
  NativeBlockAccess,
  BedrockCompatBlockAccess
};