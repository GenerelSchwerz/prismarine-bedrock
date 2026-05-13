const { logAction, sameRuntimeId } = require('../utils');
const { Vec3 } = require('vec3');
const buildIndexFromArray = require('prismarine-registry/lib/indexer');

/**
 * Unified plugin: handles initial login sequence AND respawn after death.
 * @param {import('../state')} botState
 * @param {object} options
 */
module.exports = (botState, options) => {
  const client = botState.client;
  const registry = botState.registry;

  // ── Shared state for respawn ──
  botState.isDead = false;
  botState.respawnTimeout = null;
  botState.playerHealth = null;
  botState.experience = 0;
  botState.experienceLevel = 0;
  botState.bedrockCraftingRecipes = [];
  botState.blockRuntimeIdsByName = {};

  // -- required because p-registry is bugged.
  function loadItemStates(itemStates) {
    const items = [];
    for (const item of itemStates) {
      const name = item.name.replace('minecraft:', '');
      items.push({ ...registry.itemsByName[name], name, id: item.runtime_id });
    }
    registry.itemsArray = items;
    registry.items = buildIndexFromArray(registry.itemsArray, 'id');
    registry.itemsByName = buildIndexFromArray(registry.itemsArray, 'name');
  }

  registry.loadItemStates = loadItemStates;

  function loadBlockNetworkRuntimeIds() {
    registry.blockNetworkRuntimeIdsByStateId = {};

    for (const [runtimeId, block] of Object.entries(registry.blocksByRuntimeId || {})) {
      if (block?.stateId == null) continue;
      registry.blockNetworkRuntimeIdsByStateId[block.stateId] = Number(runtimeId);
    }
  }

  // ── Initial connection ──
  client.on('connect_allowed', () => {
    logAction('[→]', 'connect', { host: options.host, port: options.port });
  });

  // ── Start Game ──
  client.on('start_game', (pkt) => {
    // 1.21.130: start_game carries spawn info but NOT itemstates/block_states
    botState.spawnPosition = new Vec3(
      pkt.player_position.x, pkt.player_position.y, pkt.player_position.z
    );
    botState.spawnRotation = pkt.rotation;
    botState.game.gameMode = pkt.player_gamemode;
    botState.dimension = pkt.dimension;
    botState.blockNetworkIdsAreHashes = !!pkt.block_network_ids_are_hashes;
    botState.playerHealth = 20;
    botState.isDead = false;

    pkt.itemstates ??= [];
    registry.handleStartGame(pkt);
    loadBlockNetworkRuntimeIds();

    logAction('[←]', 'start_game', {
      entity_id: String(pkt.entity_id),
      runtime_entity_id: String(pkt.runtime_entity_id),
      pos: botState.spawnPosition,
      rotation: botState.spawnRotation,
      gamemode: botState.game.gameMode,
      block_network_ids_are_hashes: !!pkt.block_network_ids_are_hashes,
      server_authoritative_inventory: !!pkt.server_authoritative_inventory,
    });
  });

  // ── Item Registry ──
  client.on('item_registry', (packet) => {
    logAction('[←]', 'item_registry', { count: packet.itemstates.length });
    registry.loadItemStates(packet.itemstates);
  });

  // ── Creative Content ──
  client.on('creative_content', (packet) => {
    logAction('[←]', 'creative_content', {
      groups: packet.groups.length,
      items: packet.items.length,
    });
    botState.creativeItems = packet.items;
    for (const entry of packet.items || []) {
      const item = entry.item ?? entry;
      const id = item?.network_id ?? item?.id;
      const name = registry.items?.[id]?.name ?? item?.name;
      const runtimeId = item?.block_runtime_id ?? item?.blockRuntimeId;
      if (name && Number.isFinite(runtimeId) && runtimeId !== 0) {
        botState.blockRuntimeIdsByName[String(name).replace(/^minecraft:/, '')] = runtimeId;
      }
    }
  });

  // ── Biome Definition List ──
  client.on('biome_definition_list', (packet) => {
    logAction('[←]', 'biome_definition_list', {
      count: packet.biome_definitions.length,
    });
    // Store if needed: botState.biomeStringList = packet.string_list;
  });

  // Bedrock server-authoritative recipes used by crafting/trading packet senders.
  client.on('crafting_data', packet => {
    const recipes = packet.recipes || [];
    botState.bedrockCraftingRecipes.push(...recipes);
    for (const entry of recipes) {
      const recipe = entry?.recipe || entry;
      const outputs = Array.isArray(recipe?.output)
        ? recipe.output
        : recipe?.output
          ? [recipe.output]
          : [];

      for (const output of outputs) {
        const id = output?.network_id ?? output?.id;
        const name = registry.items?.[id]?.name ?? output?.name;
        const runtimeId = output?.block_runtime_id ?? output?.blockRuntimeId;
        if (name && Number.isFinite(runtimeId) && runtimeId !== 0) {
          botState.blockRuntimeIdsByName[String(name).replace(/^minecraft:/, '')] = runtimeId;
        }
      }
    }
    if (!options.quietCraftingDataLog) {
      logAction('[craft]', 'crafting_data', { recipes: botState.bedrockCraftingRecipes.length });
    }
  });

  // ── Play Status (player_spawn → request_chunk_radius + set_local_player_as_initialized) ──
  client.on('play_status', (packet) => {
    if (packet.status === 'player_spawn') {
      logAction('[←]', 'play_status', { status: 'player_spawn' });

      // Tell the server our desired view radius (must be sent before or after spawn)
      // The server will respond with chunks around the player.
      client.queue('request_chunk_radius', {
        chunk_radius: options.chunkRadius ?? 6,
        max_radius: 0, // ignored by server
      });

      // Mark client as initialized
      client.queue('set_local_player_as_initialized', {
        runtime_entity_id: client.entityId,
      });
    }
  });

  // ── Health updates (from any source, including respawn) ──
  client.on('set_health', (packet) => {
    botState.playerHealth = packet.health;
    logAction('[←]', 'set_health', {
      health: botState.playerHealth,
      isDead: botState.isDead,
    });
    if (botState.playerHealth > 0 && botState.isDead) {
      botState.isDead = false;
      logAction('[→]', 'set_health -> alive');
    }
  });

  client.on('game_rules_changed', (packet) => {
    botState.gamerules = packet.gamerules ?? packet.rules ?? packet;
  });

  client.on('change_dimension', (packet) => {
    botState.dimension = packet.dimension;
  });

  client.on('update_attributes', (packet) => {
    if (!sameRuntimeId(packet.runtime_entity_id, client.entityId)) return;

    for (const attr of packet.attributes || []) {
      if (attr.name === 'minecraft:player.experience') {
        botState.experience = attr.current ?? attr.value ?? 0;
      } else if (attr.name === 'minecraft:player.level') {
        botState.experienceLevel = attr.current ?? attr.value ?? 0;
      }
    }
  });

  // ── Death Info ──
  client.on('death_info', (packet) => {
    if (botState.isDead) return;
    botState.isDead = true;
    botState.playerHealth = 0;
    logAction('[←]', 'death_info', {
      cause: packet.cause,
      message: packet.messages?.[0],
    });
    scheduleRespawn(300);
  });

  // ── Respawn handshake ──
  client.on('respawn', (packet) => {
    logAction('[←]', 'respawn', { state: packet.state, position: packet.position });

    clearTimeout(botState.respawnTimeout);

    if (packet.state === 0) {
      // Server sent state 0 (dimension change or death response) – ack with state 1
      logAction('[→]', 'respawn(state=1 ack)');
      client.queue('respawn', {
        position: packet.position,
        state: 1,
        runtime_entity_id: client.entityId,
      });

      botState.respawnTimeout = setTimeout(() => {
        logAction('[→]', 'respawn(state=2) fallback after server state=0');
        client.queue('respawn', {
          position: packet.position,
          state: 2,
          runtime_entity_id: client.entityId,
        });
        client.queue('set_local_player_as_initialized', {
          runtime_entity_id: client.entityId,
        });
      }, 2000);
      return;
    }

    if (packet.state === 1) {
      clearTimeout(botState.respawnTimeout);
      logAction('[→]', 'respawn(state=2 ack) + set_local_player_as_initialized');
      client.queue('respawn', {
        position: packet.position,
        state: 2,
        runtime_entity_id: client.entityId,
      });
      client.queue('set_local_player_as_initialized', {
        runtime_entity_id: client.entityId,
      });
      return;
    }

    logAction('[←]', 'respawn', { msg: 'unknown state', state: packet.state });
  });

  // ── Spawn (indicates respawn completion) ──
  client.on('spawn', () => {
    if (botState.isDead) {
      logAction('[←]', 'spawn', { msg: 'respawn completed' });
      botState.isDead = false;
      botState.playerHealth = 20;
    } else {
      logAction('[←]', 'spawn', { msg: 'initial join' });
    }
  });

  // ── Error & close ──
  client.on('error', (err) => {
    console.error('Client error:', err);
  });

  client.on('close', () => {
    logAction('[→]', 'close', { msg: 'Connection closed' });
  });

  process.on('SIGINT', () => botState.disconnect('User interrupted'));
  process.on('SIGTERM', () => botState.disconnect('Process terminated'));

  // ── Internal helpers ──
  function scheduleRespawn(delay = 300) {
    clearTimeout(botState.respawnTimeout);
    botState.respawnTimeout = setTimeout(() => {
      if (!botState.isDead) {
        logAction('[→]', 'respawn', { msg: 'skipped – already alive' });
        return;
      }
      // Start respawn with state=0 (request to server)
      logAction('[→]', 'respawn(state=0) request');
      client.queue('respawn', {
        position: { x: 0, y: 0, z: 0 },
        state: 0,
        runtime_entity_id: client.entityId,
      });

      // Fallback: if no server reply within 1.5s, force state=2 + init
      botState.respawnTimeout = setTimeout(() => {
        if (!botState.isDead) return;
        logAction('[→]', 'respawn(state=2) fallback after no server state=1 response');
        client.queue('respawn', {
          position: { x: 0, y: 0, z: 0 },
          state: 2,
          runtime_entity_id: client.entityId,
        });
        client.queue('set_local_player_as_initialized', {
          runtime_entity_id: client.entityId,
        });
      }, 1500);
    }, delay);
  }
};
