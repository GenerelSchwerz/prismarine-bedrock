const Vec3 = require('vec3').Vec3;
const nbt = require('prismarine-nbt');
const { getStateId, normalizeBlockPos, withLayer } = require('../utils');

// ── Helper types for blob store ──
const BlobType = { ChunkSection: 0, Biomes: 1 };

/**
 * @param {import('../state')} botState
 * @param {object} [options]
 */
module.exports = (botState, options = {}) => {
  const client = botState.client;
  const world = botState.world;
  const registry = botState.registry;
  const ChunkColumn = botState.chunkColumn;

  // Bedrock modern overworld height.
  //
  // Note:
  // prismarine-chunk's Bedrock 1.18+ ChunkColumn already knows about minCY=-4
  // internally, but its networkDecodeNoCache path may still insert decoded
  // packet section 0 as absolute sectionY=0. We normalize after decode below.
  const WORLD_MIN_Y =
    options.minY ??
    options.worldMinY ??
    botState.minY ??
    botState.worldMinY ??
    -64;

  const WORLD_HEIGHT =
    options.worldHeight ??
    botState.worldHeight ??
    384;

  botState.minY = WORLD_MIN_Y;
  botState.worldMinY = WORLD_MIN_Y;
  botState.worldHeight = WORLD_HEIGHT;

  function createChunkColumn(cx, cz) {
    return new ChunkColumn({
      x: cx,
      z: cz,
      minY: WORLD_MIN_Y,
      worldHeight: WORLD_HEIGHT
    }, registry);
  }

  /**
   * Prismarine's Bedrock 1.18+ full level_chunk no-cache decoder can decode
   * packet subchunk index 0 into absolute sectionY=0.
   *
   * In a modern overworld, the bottom packet section should map to minCY:
   *
   *   packet section 0 -> sectionY=-4
   *   packet section 1 -> sectionY=-3
   *   packet section 2 -> sectionY=-2
   *   packet section 3 -> sectionY=-1
   *   packet section 4 -> sectionY=0
   *
   * CommonChunkColumn stores sectionY via:
   *
   *   sections[co + sectionY]
   *
   * so if co=4, a mistaken setSection(0, section) lands at sections[4].
   *
   * This function only corrects the clear broken case:
   *   - negative-Y chunk
   *   - bottom backing slot is empty
   *   - decoded data starts at index co
   */
  function normalizeBedrockFullChunkSections(chunk, sectionCount) {
    if (!chunk || !chunk.sections) return;
    if (sectionCount < 0) return;

    const minCY = chunk.minCY ?? Math.floor(WORLD_MIN_Y / 16);
    const co = chunk.co ?? Math.abs(minCY);

    if (minCY >= 0 || co <= 0) return;

    // Already correctly populated at bottom.
    if (chunk.sections[0]) return;

    // Broken full-chunk decode signature we observed:
    // decoded sectionY=0 exists at index co.
    if (!chunk.sections[co]) return;

    const shifted = new Array(chunk.sections.length).fill(null);

    for (let packetSectionIndex = 0; packetSectionIndex < sectionCount; packetSectionIndex++) {
      const sourceSectionY = packetSectionIndex;
      const sourceIndex = co + sourceSectionY;

      const targetSectionY = minCY + packetSectionIndex;
      const targetIndex = co + targetSectionY;

      if (
        sourceIndex < 0 ||
        sourceIndex >= chunk.sections.length ||
        targetIndex < 0 ||
        targetIndex >= shifted.length
      ) {
        continue;
      }

      const section = chunk.sections[sourceIndex] || null;

      if (section) {
        // Keep any downstream metadata-based lookups consistent.
        section.y = targetSectionY;
        section.chunkY = targetSectionY;
        section.sectionY = targetSectionY;
      }

      shifted[targetIndex] = section;
    }

    chunk.sections = shifted;
  }

  // ── Blob cache & pending requests ──
  if (!botState.blobCache) botState.blobCache = new Map(); // hash string → Buffer
  if (!botState.pendingBlobRequests) botState.pendingBlobRequests = new Map();
  if (!botState.networkChunks) botState.networkChunks = new Map();

  // These track actual decoded block data, not merely column existence.
  if (!botState.loadedChunks) botState.loadedChunks = new Set(); // "cx,cz" after full chunk decode
  if (!botState.loadedChunkSections) botState.loadedChunkSections = new Map(); // "cx,cz" → Set<sectionY>

  botState.getBlockAt = async (...args) => {
    const pos = normalizeBlockPos(...args);
    return world.getBlock(pos);
  };

  botState.getBlockStateIdAt = (...args) => {
    const pos = normalizeBlockPos(...args);
    return world.getBlockStateId(pos);
  };

  botState.setBlockStateIdAt = async (...args) => {
    const stateId = args[args.length - 1];
    const pos = normalizeBlockPos(...args.slice(0, -1));

    await world.setBlockStateId(pos, stateId);
    return true;
  };

  function chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  function markFullChunkLoaded(cx, cz) {
    botState.loadedChunks.add(chunkKey(cx, cz));
  }

  function markChunkSectionLoaded(cx, cz, sectionY) {
    const key = chunkKey(cx, cz);
    let set = botState.loadedChunkSections.get(key);

    if (!set) {
      set = new Set();
      botState.loadedChunkSections.set(key, set);
    }

    set.add(sectionY);
  }

  function isChunkBlockDataLoaded(cx, cz, requiredSectionYs = undefined) {
    const key = chunkKey(cx, cz);

    // Full chunk decode means all included sections for that column were decoded.
    if (botState.loadedChunks.has(key)) return true;

    const loadedSections = botState.loadedChunkSections.get(key);
    if (!loadedSections || loadedSections.size === 0) return false;

    // If no vertical section requirement was provided, at least one decoded
    // section proves this is not just an empty placeholder column.
    if (!requiredSectionYs || requiredSectionYs.length === 0) return true;

    for (const sectionY of requiredSectionYs) {
      if (!loadedSections.has(sectionY)) return false;
    }

    return true;
  }

  // ── Apply blob data to a pending chunk or subchunk ──
  function dispatchBlobReceived(hash, payload) {
    const key = hash.toString();
    botState.blobCache.set(key, payload);

    const pending = botState.pendingBlobRequests.get(key);
    if (!pending) return;

    const { type, cx, cz, sectionY, extraBlobs } = pending;

    if (type === 'level_chunk') {
      const allPresent = extraBlobs.every(b => botState.blobCache.has(b.toString()));
      if (!allPresent) return;

      let chunk = botState.networkChunks.get(chunkKey(cx, cz));
      if (!chunk) {
        chunk = createChunkColumn(cx, cz);
      }

      const blobStore = {
        has: (h) => botState.blobCache.has(h.toString()),
        get: (h) => ({
          buffer: botState.blobCache.get(h.toString()),
          type: BlobType.ChunkSection,
          x: cx,
          z: cz
        })
      };

      const blobs = extraBlobs;
      const payloadBuf = pending.payloadBuffer;

      botState.networkChunks.set(chunkKey(cx, cz), chunk);

      chunk.networkDecode(blobs, blobStore, payloadBuf)
        .then(async misses => {
          if (misses.length > 0) {
            requestMissingBlobs(misses);
          } else {
            await world.setColumn(cx, cz, chunk);
            markFullChunkLoaded(cx, cz);
          }
        })
        .catch(err => console.error('level_chunk blob decode error:', err));
    } else if (type === 'subchunk') {
      const allPresent = extraBlobs.every(b => botState.blobCache.has(b.toString()));
      if (!allPresent) return;

      let chunk = botState.networkChunks.get(chunkKey(cx, cz));
      if (!chunk) {
        chunk = createChunkColumn(cx, cz);
        botState.networkChunks.set(chunkKey(cx, cz), chunk);
      }

      const blobStore = {
        has: (h) => botState.blobCache.has(h.toString()),
        get: (h) => ({
          buffer: botState.blobCache.get(h.toString()),
          type: BlobType.ChunkSection,
          x: cx,
          z: cz
        })
      };

      chunk.networkDecodeSubChunk(extraBlobs, blobStore, pending.payloadBuffer)
        .then(async misses => {
          if (misses.length > 0) {
            requestMissingBlobs(misses);
          } else {
            await world.setColumn(cx, cz, chunk);
            markChunkSectionLoaded(cx, cz, sectionY);
          }
        })
        .catch(err => console.error('subchunk blob decode error:', err));
    }

    botState.pendingBlobRequests.delete(key);
  }

  // ── Send ClientCacheBlobStatus for missing blobs ──
  function requestMissingBlobs(missingHashes) {
    if (missingHashes.length === 0) return;

    client.queue('client_cache_blob_status', {
      misses: missingHashes.length,
      haves: 0,
      missing: missingHashes,
      have: []
    });
  }

  // ── level_chunk (0x3a) ──
  client.on('level_chunk', async (packet) => {
    const cx = packet.x;
    const cz = packet.z;
    const sectionCount = packet.sub_chunk_count;

    let chunk = botState.networkChunks.get(chunkKey(cx, cz));
    if (!chunk) chunk = createChunkColumn(cx, cz);

    try {
      if (sectionCount >= 0 && !packet.cache_enabled) {
        // Non-cached full chunk.
        chunk.networkDecodeNoCache(packet.payload, sectionCount);
        normalizeBedrockFullChunkSections(chunk, sectionCount);

        await world.setColumn(cx, cz, chunk);
        botState.networkChunks.set(chunkKey(cx, cz), chunk);
        markFullChunkLoaded(cx, cz);
      } else if (sectionCount >= 0 && packet.cache_enabled) {
        // Cached chunk
        const blobs = packet.blobs?.hashes || [];
        const payloadWithoutBlobs = packet.payload;

        const missing = blobs.filter(h => !botState.blobCache.has(h.toString()));

        if (missing.length > 0) {
          for (const h of missing) {
            botState.pendingBlobRequests.set(h.toString(), {
              type: 'level_chunk',
              cx,
              cz,
              sectionY: null,
              extraBlobs: blobs,
              payloadBuffer: payloadWithoutBlobs
            });
          }

          requestMissingBlobs(missing);
        } else {
          const blobStore = {
            has: (h) => botState.blobCache.has(h.toString()),
            get: (h) => ({
              buffer: botState.blobCache.get(h.toString()),
              type: BlobType.ChunkSection,
              x: cx,
              z: cz
            })
          };

          const misses = await chunk.networkDecode(blobs, blobStore, payloadWithoutBlobs);

          if (misses.length > 0) {
            requestMissingBlobs(misses);
          } else {
            await world.setColumn(cx, cz, chunk);
            botState.networkChunks.set(chunkKey(cx, cz), chunk);
            markFullChunkLoaded(cx, cz);
          }
        }
      } else if (sectionCount < 0) {
        // Negative count: subchunk polling mode.
        // This creates a placeholder column, but does NOT mark it loaded.
        if (!chunk.sections.length) {
          await world.setColumn(cx, cz, chunk);
        }

        const origin = botState.chunkPublisherCenter
          ? {
              x: botState.chunkPublisherCenter.x,
              y: botState.chunkPublisherCenter.y,
              z: botState.chunkPublisherCenter.z
            }
          : {
              x: cx * 16 + 8,
              y: WORLD_MIN_Y,
              z: cz * 16 + 8
            };

        const dimension = packet.dimension;
        const originSectionX = Math.floor(origin.x / 16);
        const originSectionY = Math.floor(origin.y / 16);
        const originSectionZ = Math.floor(origin.z / 16);

        const requestOffsets = [];

        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
              requestOffsets.push({ dx, dy, dz });
            }
          }
        }

        client.queue('subchunk_request', {
          dimension,
          origin: {
            x: originSectionX * 16,
            y: originSectionY * 16,
            z: originSectionZ * 16
          },
          requests: requestOffsets
        });

        botState.networkChunks.set(chunkKey(cx, cz), chunk);
      } else {
        console.warn(`level_chunk unknown mode: count=${sectionCount}, cache=${packet.cache_enabled}`);
      }

      botState.chunkCount = botState.networkChunks.size;
    } catch (err) {
      console.error('level_chunk decode error:', err);
    }
  });

  // ── subchunk (0xae) ──
  client.on('subchunk', async (pkt) => {
    const originSectionX = Math.floor(pkt.origin.x / 16);
    const originSectionY = Math.floor(pkt.origin.y / 16);
    const originSectionZ = Math.floor(pkt.origin.z / 16);

    for (const entry of pkt.entries) {
      if (entry.result !== 1) continue;

      const cx = originSectionX + entry.dx;
      const sectionY = originSectionY + entry.dy;
      const cz = originSectionZ + entry.dz;

      let chunk = botState.networkChunks.get(chunkKey(cx, cz));

      if (!chunk) {
        chunk = createChunkColumn(cx, cz);
        await world.setColumn(cx, cz, chunk);
        botState.networkChunks.set(chunkKey(cx, cz), chunk);
      }

      if (!pkt.cache_enabled) {
        // Non-cached subchunk
        await chunk.networkDecodeSubChunkNoCache(sectionY, entry.payload);
        await world.setColumn(cx, cz, chunk);
        botState.networkChunks.set(chunkKey(cx, cz), chunk);
        markChunkSectionLoaded(cx, cz, sectionY);
      } else {
        // Cached subchunk
        const blobHash = entry.blob_id;

        if (blobHash == null) {
          console.warn('subchunk cached entry without blob_id');
          continue;
        }

        const hashKey = blobHash.toString();

        if (botState.blobCache.has(hashKey)) {
          const blobStore = {
            has: (h) => botState.blobCache.has(h.toString()),
            get: (h) => ({
              buffer: botState.blobCache.get(h.toString()),
              type: BlobType.ChunkSection,
              x: cx,
              z: cz
            })
          };

          const misses = await chunk.networkDecodeSubChunk(
            [blobHash],
            blobStore,
            entry.payload
          );

          if (misses.length > 0) {
            requestMissingBlobs(misses);
          } else {
            await world.setColumn(cx, cz, chunk);
            botState.networkChunks.set(chunkKey(cx, cz), chunk);
            markChunkSectionLoaded(cx, cz, sectionY);
          }
        } else {
          botState.pendingBlobRequests.set(hashKey, {
            type: 'subchunk',
            cx,
            cz,
            sectionY,
            extraBlobs: [blobHash],
            payloadBuffer: entry.payload
          });

          requestMissingBlobs([blobHash]);
        }
      }
    }
  });

  // ── client_cache_miss_response (0x88) ──
  client.on('client_cache_miss_response', (pkt) => {
    for (const blob of pkt.blobs) {
      dispatchBlobReceived(blob.hash, blob.payload);
    }
  });

  // ── Single block updates ──
  async function applySingleBlockUpdate(position, blockRuntimeId) {
    const stateId = getStateId(registry, blockRuntimeId);

    if (stateId === undefined) {
      console.warn(`Unknown block runtime id ${blockRuntimeId}, skipping`);
      return;
    }

    const pos = withLayer(new Vec3(position.x, position.y, position.z));
    const chunk = await world.getColumnAt(pos);

    if (!chunk) {
      console.warn(`Chunk not loaded at ${pos}, cannot apply block update`);
      return;
    }

    await botState.setBlockStateIdAt(pos.x, pos.y, pos.z, stateId);
  }

  client.on('update_block', async (pkt) => {
    if (pkt.layer !== 0) return;
    await applySingleBlockUpdate(pkt.position, pkt.block_runtime_id);
  });

  client.on('update_block_synced', async (pkt) => {
    if (pkt.layer !== 0) return;
    await applySingleBlockUpdate(pkt.position, pkt.block_runtime_id);
  });

  client.on('update_subchunk_blocks', async (pkt) => {
    const baseX = pkt.x * 16;
    const baseY = pkt.y * 16;
    const baseZ = pkt.z * 16;

    for (const entry of pkt.blocks) {
      await applySingleBlockUpdate({
        x: baseX + entry.position.x,
        y: baseY + entry.position.y,
        z: baseZ + entry.position.z
      }, entry.runtime_id);
    }
  });

  // ── block_entity_data (0x38) ──
  client.on('block_entity_data', async (pkt) => {
    const pos = new Vec3(pkt.position.x, pkt.position.y, pkt.position.z);
    const localPos = new Vec3(pos.x & 15, pos.y, pos.z & 15);
    const chunk = await world.getColumnAt(pos);

    if (!chunk) return;

    chunk.setBlockEntity(localPos, pkt.nbt);
    world.saveAt(pos);
  });

  // ── network_chunk_publisher_update (0x79) ──
  client.on('network_chunk_publisher_update', (packet) => {
    botState.chunkPublisherCenter = packet.coordinates;
    botState.chunkPublisherRadius = packet.radius;
  });

  // ── waitForChunksToLoad ──
  /**
   * Waits until chunk block data has decoded, not merely until placeholder
   * chunk columns exist.
   *
   * @param {number} [radius=6] block-radius in x/z
   * @param {Vec3} [center] defaults to spawnPosition or 0,0,0
   * @param {number} [timeout=10000] timeout in ms
   * @param {number} [verticalSectionRadius=1] number of section layers above/below center section to require
   * @returns {Promise<void>}
   */
  botState.waitForChunksToLoad = function waitForChunksToLoad(
    radius = 6,
    center = undefined,
    timeout = 10000,
    verticalSectionRadius = 1
  ) {
    return new Promise((resolve, reject) => {
      const pos = center || (
        botState.spawnPosition
          ? new Vec3(botState.spawnPosition.x, botState.spawnPosition.y, botState.spawnPosition.z)
          : new Vec3(0, WORLD_MIN_Y, 0)
      );

      const minCX = Math.floor((pos.x - radius) / 16);
      const maxCX = Math.floor((pos.x + radius) / 16);
      const minCZ = Math.floor((pos.z - radius) / 16);
      const maxCZ = Math.floor((pos.z + radius) / 16);

      const centerSectionY = Math.floor(pos.y / 16);
      const requiredSectionYs = [];

      for (let dy = -verticalSectionRadius; dy <= verticalSectionRadius; dy++) {
        requiredSectionYs.push(centerSectionY + dy);
      }

      const required = new Set();

      for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cz = minCZ; cz <= maxCZ; cz++) {
          required.add(chunkKey(cx, cz));
        }
      }

      const start = Date.now();

      const interval = setInterval(() => {
        const missing = [];

        for (const key of required) {
          const [cxRaw, czRaw] = key.split(',');
          const cx = Number(cxRaw);
          const cz = Number(czRaw);

          if (!isChunkBlockDataLoaded(cx, cz, requiredSectionYs)) {
            missing.push(key);
          }
        }

        if (missing.length === 0) {
          clearInterval(interval);
          resolve();
          return;
        }

        if (Date.now() - start >= timeout) {
          clearInterval(interval);

          reject(new Error(
            `waitForChunksToLoad timed out after ${timeout}ms ` +
            `(missing block data for ${missing.length} of ${required.size} chunks: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ', ...' : ''})`
          ));
        }
      }, 200);
    });
  };
};
