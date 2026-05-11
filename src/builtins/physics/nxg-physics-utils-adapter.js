// physics/nxg-physics-utils-adapter.js
//
// Refactored adapter for @nxg-org/mineflayer-physics-util
// Uses BotcraftPhysics engine with PlayerState and a SelfEntityProxy
// that bridges the raw botState.self object with the engine’s expectations.
//
// Bedrock 1.21.130 specific:
// - Attribute name mapping: 'movement' → 'minecraft:movement_speed'
// - Effects by ID using the protocol constants
// - Abilities from update_abilities packet (including flySpeed, walkSpeed)
// - World settings tuned for Bedrock (defaultSlipperiness 0.6, etc.)
//
// The adapter exports:
//   createNxgPhysicsAdapter(options)  → { engine, mcData, simulateSelf }
//   installBedrockMovementStateHandlers(botState, options)
//
// Usage:
//   const { simulateSelf } = createNxgPhysicsAdapter({ mcData });
//   const newState = simulateSelf(botState, controls, world);
//   botState.self.position = newState.position;
//   ...

const { Vec3 } = require('vec3');
const mcDataLoader = require('minecraft-data');
const SelfEntityProxy = require('./self-entity-proxy');

const {
  BotcraftPhysics,
  EntityState,
  PlayerState,
  EPhysicsCtx,
  ControlStateHandler,
  PlayerPoses,
} = require('@nxg-org/mineflayer-physics-util');

const {  convInpToAxes } = require('@nxg-org/mineflayer-physics-util/dist/physics/states/playerState')

// ===================================================================
// Logger helper (same as original)
// ===================================================================
const DEFAULT_LOG_PREFIX = '[bedrock-physics-adapter]';

function createLogger(options = {}) {
  const enabled =
    options.debugBedrockPhysicsAdapter === true ||
    options.debugMovementPackets === true ||
    process.env.DEBUG_BEDROCK_PHYSICS_ADAPTER === 'true' ||
    process.env.DEBUG_PHYSICS_ADAPTER === 'true' ||
    process.env.DEBUG_PHYSICS === 'true';

  const prefix = options.debugPrefix || DEFAULT_LOG_PREFIX;

  if (!enabled) return noop;

  return function log(event, data) {
    if (data === undefined) {
      console.log(prefix, event);
      return;
    }
    console.log(prefix, event, safeJson(data));
  };
}

function noop() {}

function safeJson(value) {
  try {
    return JSON.stringify(
      value,
      (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
      2
    );
  } catch {
    return value;
  }
}

function stringifyBigInt(value) {
  if (typeof value === 'bigint') return value.toString();
  if (value && typeof value === 'object' && value.x !== undefined && value.y !== undefined && value.z !== undefined) {
    return { x: value.x, y: value.y, z: value.z };
  }
  return value;
}

function toBigIntSafe(value) {
  try {
    if (value === undefined || value === null) return null;
    return typeof value === 'bigint' ? value : BigInt(value);
  } catch {
    return null;
  }
}

// ===================================================================
// Attribute name mapping from Bedrock packet names to engine keys
// ===================================================================
const BEDROCK_ATTR_MAP = {
  'movement': 'minecraft:movement_speed',
  'movement_speed': 'minecraft:movement_speed',
  'minecraft:movement': 'minecraft:movement_speed',
  'minecraft:movement_speed': 'minecraft:movement_speed', // passthrough
  'jump_strength': 'minecraft:jump_strength',
  'step_height': 'minecraft:step_height',
  'water_movement_efficiency': 'minecraft:water_movement_efficiency',
  'underwater_movement': 'minecraft:underwater_movement',
  'minecraft:jump_strength': 'minecraft:jump_strength',
  'minecraft:step_height': 'minecraft:step_height',
  'minecraft:water_movement_efficiency': 'minecraft:water_movement_efficiency',
  'minecraft:underwater_movement': 'minecraft:underwater_movement',
};

function mapBedrockAttributeName(rawName) {
  return BEDROCK_ATTR_MAP[rawName] || rawName;
}

// ===================================================================
// World settings tuned for Bedrock 1.21.130
// ===================================================================
const BEDROCK_WORLD_SETTINGS = {
  playerSpeed: 0.1,
  sprintSpeed: 0.3,
  defaultSlipperiness: 0.6,
  soulsandSpeed: 0.4,
  honeyblockSpeed: 0.5,
  honeyblockJumpSpeed: 0.5,
  ladderMaxSpeed: 0.15,
  ladderClimbSpeed: 0.2,
  sneakSpeed: 0.3,
  autojumpCooldown: 10,
  usingItemSpeed: 0.2,
  outOfLiquidImpulse: 0.3,
  negligibleVelocity: 1e-5,
  slowFalling: 0.01,
  bubbleColumnSurfaceDrag: { maxDown: -0.3, down: 0.03, maxUp: 0.7, up: 0.06 },
  bubbleColumnDrag: { maxDown: -0.3, down: 0.03, maxUp: 0.7, up: 0.06 },
  flyJumpTriggerCooldown: 0,
  sprintTimeTriggerCooldown: 0,
  sprintingUUID: '662a6b8d-da3e-4c1c-8813-96ea6097278d',
};

// ===================================================================
// Effect ID → name mapping (Bedrock protocol constants)
// ===================================================================
const BEDROCK_EFFECT_NAMES = {
  1: 'speed',
  2: 'slowness',
  3: 'haste',
  4: 'miningFatigue',
  5: 'strength',
  6: 'instantHealth',
  7: 'instantDamage',
  8: 'jumpBoost',
  9: 'nausea',
  10: 'regeneration',
  11: 'resistance',
  12: 'fireResistance',
  13: 'waterBreathing',
  14: 'invisibility',
  15: 'blindness',
  16: 'nightVision',
  17: 'hunger',
  18: 'weakness',
  19: 'poison',
  20: 'wither',
  21: 'healthBoost',
  22: 'absorption',
  23: 'saturation',
  24: 'glowing',
  25: 'levitation',
  26: 'luck',
  27: 'unluck',
  28: 'slowFalling',
  29: 'conduitPower',
  30: 'dolphinsGrace',
  31: 'badOmen',
  32: 'heroOfTheVillage',
};

// Effect ID → state key for convenience
const BEDROCK_EFFECT_TO_STATE_KEY = {
  1: 'speed',
  2: 'slowness',
  8: 'jumpBoost',
  15: 'blindness',
  25: 'levitation',
  28: 'slowFalling',
  30: 'dolphinsGrace',
};


// ===================================================================
// Helper: ensure attribute object shape {value, min, max, default, modifiers}
// ===================================================================
function ensureAttributeShape(attributes) {
  for (const key of Object.keys(attributes)) {
    let attr = attributes[key];
    if (attr == null) {
      delete attributes[key];
      continue;
    }
    if (typeof attr === 'number') {
      attributes[key] = { value: attr, min: 0, max: 1024, default: attr, modifiers: [] };
    } else if (typeof attr === 'object' && !Array.isArray(attr)) {
      if (typeof attr.value !== 'number') {
        attr.value = Number(attr.value ?? attr.current ?? attr.default ?? 0.1);
      }
      if (typeof attr.min !== 'number') attr.min = 0;
      if (typeof attr.max !== 'number') attr.max = 1024;
      if (typeof attr.default !== 'number') attr.default = attr.value;
      if (!Array.isArray(attr.modifiers)) attr.modifiers = [];
    }
  }
}

// ===================================================================
// Normalize game mode string
// ===================================================================
function normalizeGameMode(gamemode) {
  if (gamemode === 'creative' || gamemode === 1) return 'creative';
  if (gamemode === 'adventure' || gamemode === 2) return 'adventure';
  if (gamemode === 'spectator' || gamemode === 3 || gamemode === 6) return 'spectator';
  return 'survival';
}

// ===================================================================
// Normalize pose
// ===================================================================
function normalizePose(pose) {
  if (!pose) return PlayerPoses.STANDING;
  if (typeof pose === 'string') {
    switch (pose.toLowerCase()) {
      case 'standing': return PlayerPoses.STANDING;
      case 'sneaking':
      case 'crouching': return PlayerPoses.SNEAKING || PlayerPoses.CROUCHING || 1;
      case 'swimming': return PlayerPoses.SWIMMING || 2;
      case 'fall_flying':
      case 'fallflying': return PlayerPoses.FALL_FLYING || 3;
      case 'sleeping': return PlayerPoses.SLEEPING || 0;
      default: return PlayerPoses.STANDING;
    }
  }
  return pose;
}

function degreesToRadians(value) {
  return (Number(value) || 0) * Math.PI / 180;
}

function bedrockYawToNxgYaw(yawDegrees) {
  // BotcraftPhysics uses Mineflayer-style radians and rotates with
  // `Math.PI - yaw`; Bedrock packets store yaw directly in degrees.
  return Math.PI - degreesToRadians(yawDegrees);
}

// ===================================================================
// Create the physics adapter
// ===================================================================
function createNxgPhysicsAdapter(options = {}) {
  const dataVersion = options.physicsDataVersion || '1.21.1';
  const mcData = options.mcData || mcDataLoader(dataVersion);

  // Load engine's static data
  EPhysicsCtx.loadData(mcData);

  // Instantiate BotcraftPhysics
  const engine = new BotcraftPhysics(mcData);

  // Find player entity type
  const playerEntityType =
    mcData.entitiesByName?.player ||
    mcData.entitiesByName?.Player ||
    Object.values(mcData.entitiesByName || {}).find((entity) => entity.name === 'player');

  if (!playerEntityType) {
    throw new Error(`[physics] Could not find player entity data in minecraft-data ${dataVersion}`);
  }

  /**
   * Simulate one tick for the self entity.
   *
   * @param {object} botState - the full BotState instance (must have botState.self set)
   * @param {object} controls - { forward: bool, back: bool, left: bool, right: bool, jump: bool, sprint: bool, sneak: bool }
   * @param {object} world - world object with getBlock method
   * @param {object} [simOptions] - optional overrides (e.g., worldSettings)
   * @returns {object} the simulated state with position, velocity, onGround, horizontalCollision, etc. applied to self
   */
  function simulateSelf(botState, controls, world, simOptions = {}) {
    const self = botState.self;
    if (!self) {
      throw new Error('[physics] Cannot simulate without botState.self being set');
    }

    // Build the proxy from the full botState instance
    const proxy = new SelfEntityProxy(botState, engine);

    // Ensure attribute shape on the raw object (in case not done by listeners)
    ensureAttributeShape(self.attributes);

    // Build ControlStateHandler from the controls object
    const control = new ControlStateHandler(
      !!controls.forward,
      !!controls.back,
      !!controls.left,
      !!controls.right,
      !!controls.jump,
      !!controls.sprint,
      !!controls.sneak
    );

    // Clone previous control (must be stored on self beforehand)
    const prevControl = proxy.prevControl ? proxy.prevControl.clone() : control.clone();

    // Build PlayerState from proxy + current controls
    const state = new PlayerState(engine, proxy, world, control, prevControl);

    // Override world settings if provided
    if (simOptions.worldSettings) {
      // (EPhysicsCtx will use default settings; we can't easily override per-tick,
      //  but the user can pass worldSettings in the options to createNxgPhysicsAdapter)
    }

    // The engine expects heading to be set before AI step
    const heading = convInpToAxes(state);
    state.heading = heading;
    state.prevHeading = proxy.prevHeading || { forward: 0, strafe: 0 };

    // Copy all fields from proxy to PlayerState that the engine uses
    // This is done inside PlayerState constructor (via proxy getters)
    // But we must set attributes, effects, etc. on the PlayerState object
    // Actually PlayerState constructor expects raw values, not proxy.
    // We'll implement a custom factory.

    // --- Build a PlayerState manually ---
    const playerState = new PlayerState(engine, proxy)

    // Now fill in all the fields that BotcraftPhysics reads
    playerState.attributes = self.attributes; // use the same mutable object
    playerState.effects = proxy.effects;
    playerState.jumpBoost = proxy.jumpBoost;
    playerState.speed = proxy.speed;
    playerState.slowness = proxy.slowness;
    playerState.dolphinsGrace = proxy.dolphinsGrace;
    playerState.slowFalling = proxy.slowFalling;
    playerState.levitation = proxy.levitation;
    playerState.blindness = proxy.blindness;
    playerState.depthStrider = proxy.depthStrider;
    playerState.swiftSneak = proxy.swiftSneak;
    playerState.soulSpeed = proxy.soulSpeed;
    playerState.heading = heading;
    playerState.prevHeading = proxy.prevHeading || { forward: 0, strafe: 0 };
    playerState.validElytraEquipped = proxy.validElytraEquipped;
    playerState.fireworkRocketDuration = proxy.fireworkRocketDuration;
    playerState.isInWater = proxy.isInWater;
    playerState.isUnderWater = proxy.isUnderWater;
    playerState.isInLava = proxy.isInLava;
    playerState.isUnderLava = proxy.isUnderLava;
    playerState.isInWeb = proxy.isInWeb;
    playerState.isCollidedHorizontally = proxy.isCollidedHorizontally;
    playerState.isCollidedHorizontallyMinor = proxy.isCollidedHorizontallyMinor;
    playerState.isCollidedVertically = proxy.isCollidedVertically;
    playerState.supportingBlockPos = proxy.supportingBlockPos;
    playerState.stuckSpeedMultiplier = proxy.stuckSpeedMultiplier;
    playerState.jumpTicks = proxy.jumpTicks;
    playerState.jumpQueued = proxy.jumpQueued;
    playerState.onClimbable = proxy.onClimbable;
    playerState.pose = proxy.pose;
    playerState.gameMode = proxy.gameMode;
    playerState.flying = proxy.flying;
    playerState.mayFly = proxy.mayFly;
    playerState.swimming = proxy.swimming;
    playerState._sprinting = proxy.sprinting;
    playerState.crouching = proxy.crouching;
    playerState.fallFlying = proxy.fallFlying;
    playerState.flySpeed = proxy.flySpeed;
    playerState.sneakCollision = proxy.sneakCollision;
    playerState.isUsingItem = proxy.isUsingItem;
    playerState.isUsingMainHand = proxy.isUsingMainHand;
    playerState.isUsingOffHand = proxy.isUsingOffHand;
    playerState.sprintTriggerTime = 0;
    playerState.flyJumpTriggerTime = 0;
    playerState.age = proxy.age;
    playerState.yaw = bedrockYawToNxgYaw(self.yaw);
    playerState.pitch = degreesToRadians(self.pitch);

    // Create the entity physics context
    const ctx = EPhysicsCtx.FROM_ENTITY_STATE(engine, playerState, playerEntityType);

    // Run simulation
    const result = engine.simulate(ctx, world);

    // Write back results to self via proxy
    self.position = result.pos.clone();
    self.velocity = result.vel.clone();
    self.onGround = result.onGround;
    self.lastOnGround = playerState.lastOnGround;
    self.horizontalCollision = result.isCollidedHorizontally;
    self.isCollidedHorizontallyMinor = result.isCollidedHorizontallyMinor;
    self.verticalCollision = result.isCollidedVertically;
    self.onClimbable = result.onClimbable;
    self.touchingWater = result.isInWater;
    self.isUnderWater = result.isUnderWater;
    self.inLava = result.isInLava;
    self.isUnderLava = result.isUnderLava;
    self.isInWeb = result.isInWeb;
    self.supportingBlockPos = result.supportingBlockPos;
    self.jumpTicks = result.jumpTicks;
    self.jumpQueued = false;
    self.fireworkRocketDuration = result.fireworkRocketDuration;
    self.stuckSpeedMultiplier = result.stuckSpeedMultiplier;

    // Update sprinting/crouching/gliding from engine result
    self.sprinting = result.sprinting;
    self.sneaking = result.crouching;
    self.gliding = result.fallFlying;
    self.fallFlying = result.fallFlying;
    self.swimming = result.swimming;
    self.flying = result.flying;

    // Store prevControl for next tick
    self.prevControl = control.clone();
    self.prevHeading = { forward: heading.forward, strafe: heading.strafe };
    self.prevJump = !!controls.jump;
    self.prevSneak = !!controls.sneak;

    return {
      position: self.position,
      velocity: self.velocity,
      onGround: self.onGround,
      horizontalCollision: self.horizontalCollision,
      verticalCollision: self.verticalCollision,
    };
  }

  return {
    engine,
    mcData,
    simulateSelf,
  };
}

// ===================================================================
// Install Bedrock movement state handlers (packet listeners)
// ===================================================================
function installBedrockMovementStateHandlers(botState, options = {}) {
  const client = botState.client;
  const log = createLogger(options);

  if (!client) {
    throw new Error('[physics] Cannot install Bedrock movement handlers without botState.client');
  }

  // NOTE: We do NOT eagerly construct SelfEntityProxy here.
  // botState.self is set by the entities plugin in the start_game handler.
  // All handlers below guard with `if (!self) return;` so they are safe.

  // ---- Helper to apply attribute from a packet ----
  function applyBedrockAttributeToProxy(proxy, attr) {
    if (!attr || !attr.name) return;
    const name = String(attr.name);
    const mappedName = mapBedrockAttributeName(name);

    const nxgAttr = {
      value: Number(attr.current ?? attr.value ?? attr.default ?? 0),
      min: Number(attr.min ?? 0),
      max: Number(attr.max ?? 1024),
      default: Number(attr.default ?? attr.current ?? attr.value ?? 0),
      modifiers: Array.isArray(attr.modifiers) ? attr.modifiers : [],
    };

    // Store both raw and mapped
    proxy._self.bedrockAttributes[name] = attr;
    proxy._self.attributes[mappedName] = nxgAttr;
    // Also store under raw name for fallback
    proxy._self.attributes[name] = nxgAttr;

    log('attribute:applied', {
      name,
      mappedName,
      value: nxgAttr.value,
    });
  }

  // ---- Helper to apply abilities ----
  function applyBedrockAbilitiesToProxy(proxy, layers) {
    if (!Array.isArray(layers)) {
      log('abilities:ignored:not_array', { type: typeof layers });
      return;
    }

    const self = proxy._self;
    self.abilityLayers = layers;

    const baseLayer =
      layers.find((layer) => layer?.type === 'base') ||
      layers[0];

    if (!baseLayer) {
      log('abilities:ignored:no_base_layer');
      return;
    }

    const enabledSet = Number(baseLayer.enabled ?? 0);
    const allowedSet = Number(baseLayer.allowed ?? 0);

    self.flying = !!(enabledSet & (1 << 9));
    self.mayFly = !!(enabledSet & (1 << 10)) || !!(allowedSet & (1 << 10));
    self.allowFlight = self.mayFly;

    if (baseLayer.fly_speed !== undefined) self.flySpeed = Number(baseLayer.fly_speed);
    if (baseLayer.vertical_fly_speed !== undefined) self.verticalFlySpeed = Number(baseLayer.vertical_fly_speed);
    if (baseLayer.walk_speed !== undefined) self.walkSpeed = Number(baseLayer.walk_speed);

    log('abilities:applied', {
      flying: self.flying,
      mayFly: self.mayFly,
      flySpeed: self.flySpeed,
      walkSpeed: self.walkSpeed,
    });
  }

  // ---- Helper to apply a mob effect ----
  function applyMobEffectToProxy(proxy, pkt) {
    const self = proxy._self;
    const eventId = Number(pkt.event_id);
    const effectId = Number(pkt.effect_id);
    const amplifier = Number(pkt.amplifier ?? 0);
    const duration = Number(pkt.duration ?? 0);
    const level = amplifier + 1;
    const name = BEDROCK_EFFECT_NAMES[effectId] || `bedrockEffect${effectId}`;

    if (eventId === 3) {
      // Remove effect
      delete self.rawEffects[effectId];
      delete self.effects[effectId];
      const stateKey = BEDROCK_EFFECT_TO_STATE_KEY[effectId];
      if (stateKey) {
        self[stateKey] = 0;
      }
      log('mob_effect:removed', { effectId, name });
      return;
    }

    // Add or update
    const effect = {
      id: effectId,
      name,
      amplifier,
      level,
      duration,
      particles: !!pkt.particles,
      ambient: !!pkt.ambient,
    };
    self.rawEffects[effectId] = effect;
    self.effects[effectId] = effect;
    self.effects[name] = effect;

    const stateKey = BEDROCK_EFFECT_TO_STATE_KEY[effectId];
    if (stateKey) {
      self[stateKey] = level;
    }

    log('mob_effect:applied', { effectId, name, level, duration });
  }

  // ---- Helper to apply entity metadata ----
  function applyEntityMetadataToProxy(proxy, metadata) {
    const self = proxy._self;
    const entries = Array.isArray(metadata)
      ? metadata
      : Object.entries(metadata || {}).map(([key, value]) => ({ key, value }));

    for (const entry of entries) {
      if (!entry) continue;
      const key = entry.key ?? entry.name;
      const value = entry.value;

      switch (key) {
        case 'flags':
        case 'flags_1':
        case 'metadata_flags':
        case 'metadata_flags_1': {
          const flags = toBigIntSafe(value);
          if (flags === null) break;
          self.serverSneaking = !!((flags >> 1n) & 1n);
          self.serverSprinting = !!((flags >> 3n) & 1n);
          self.swimming = !!((flags >> 21n) & 1n);
          self.gliding = !!((flags >> 33n) & 1n);
          self.fallFlying = self.gliding;
          log('metadata:flags', {
            serverSneaking: self.serverSneaking,
            serverSprinting: self.serverSprinting,
            swimming: self.swimming,
            gliding: self.gliding,
          });
          break;
        }
        case 'air':
          self.air = Number(value);
          break;
        case 'pose':
          self.pose = normalizePose(value);
          break;
        default:
          break;
      }
    }
  }

  // ---- Client event listeners ----

  // NOTE: start_game is the first packet that sets botState.self (via entities.js).
  // By the time this handler runs, botState.self MUST be non-null because entities.js
  // runs first (it was loaded earlier). We still guard defensively.
  client.on('start_game', (pkt) => {
    log('packet:start_game');
    const self = botState.self;
    if (!self) return;

    // Pass botState (not self) to SelfEntityProxy constructor
    const proxy = new SelfEntityProxy(botState, null); // engine not available yet
    applyBedrockAbilitiesToProxy(proxy, pkt.abilities);

    if (Array.isArray(pkt.attributes)) {
      for (const attr of pkt.attributes) {
        applyBedrockAttributeToProxy(proxy, attr);
      }
    }
    ensureAttributeShape(self.attributes);
  });

  client.on('update_attributes', (pkt) => {
    const self = botState.self;
    if (!self) return;

    if (!isSelfRuntime(botState, pkt.runtime_entity_id)) {
      return;
    }

    // Pass botState (not self) to SelfEntityProxy constructor
    const proxy = new SelfEntityProxy(botState, null);
    const attrs = Array.isArray(pkt.attributes) ? pkt.attributes : [];

    // Clear and rebuild
    self.attributes = {};
    self.bedrockAttributes = {};

    for (const attr of attrs) {
      applyBedrockAttributeToProxy(proxy, attr);
    }
    ensureAttributeShape(self.attributes);
  });

  client.on('update_abilities', (pkt) => {
    const self = botState.self;
    if (!self) return;

    // Pass botState (not self) to SelfEntityProxy constructor
    const proxy = new SelfEntityProxy(botState, null);
    applyBedrockAbilitiesToProxy(proxy, pkt.abilities);
  });

  client.on('adventure_settings', (pkt) => {
    const self = botState.self;
    if (!self) return;

    const flags = Number(pkt.flags ?? 0);
    self.flying = !!(flags & 0x200);
    self.mayFly = !!(flags & 0x40);
    self.allowFlight = self.mayFly;
  });

  client.on('mob_effect', (pkt) => {
    const self = botState.self;
    if (!self) return;

    if (!isSelfRuntime(botState, pkt.runtime_entity_id)) return;

    // Pass botState (not self) to SelfEntityProxy constructor
    const proxy = new SelfEntityProxy(botState, null);
    applyMobEffectToProxy(proxy, pkt);
  });

  client.on('movement_effect', (pkt) => {
    const self = botState.self;
    if (!self) return;

    if (!isSelfRuntime(botState, pkt.runtime_id)) return;

    self.movementEffects[pkt.effect_type] = {
      type: pkt.effect_type,
      duration: Number(pkt.effect_duration || 0),
      tick: pkt.tick,
    };

    if (isLikelyFireworkMovementEffect(pkt.effect_type)) {
      self.fireworkRocketDuration = Number(pkt.effect_duration || 0);
    }
  });

  client.on('set_entity_data', (pkt) => {
    const self = botState.self;
    if (!self) return;

    const runtimeId = pkt.runtime_entity_id ?? pkt.runtime_id;
    if (!isSelfRuntime(botState, runtimeId)) return;

    // Pass botState (not self) to SelfEntityProxy constructor
    const proxy = new SelfEntityProxy(botState, null);
    applyEntityMetadataToProxy(proxy, pkt.metadata);
  });

  client.on('set_entity_motion', (pkt) => {
    const self = botState.self;
    if (!self) return;

    const runtimeId = pkt.runtime_entity_id ?? pkt.runtime_id;
    if (!isSelfRuntime(botState, runtimeId)) return;

    const vel = pkt.velocity;
    if (vel) {
      self.velocity = new Vec3(Number(vel.x || 0), Number(vel.y || 0), Number(vel.z || 0));
    }
  });

  client.on('player_action', (pkt) => {
    const self = botState.self;
    if (!self) return;

    const runtimeId = pkt.runtime_entity_id ?? pkt.runtime_id;
    if (runtimeId !== undefined && !isSelfRuntime(botState, runtimeId)) return;

    switch (pkt.action) {
      case 'start_sprint': self.serverSprinting = true; break;
      case 'stop_sprint': self.serverSprinting = false; break;
      case 'start_sneak': self.serverSneaking = true; break;
      case 'stop_sneak': self.serverSneaking = false; break;
      case 'start_glide': self.gliding = true; self.fallFlying = true; break;
      case 'stop_glide': self.gliding = false; self.fallFlying = false; break;
      case 'start_flying': self.flying = true; break;
      case 'stop_flying': self.flying = false; break;
      case 'jump': self.jumpQueued = true; break;
      default: break;
    }
  });

  client.on('update_player_game_type', (pkt) => {
    const self = botState.self;
    if (!self) return;
    self.gamemode = pkt.gamemode;
    self.gameMode = normalizeGameMode(pkt.gamemode);
  });

  client.on('change_dimension', (pkt) => {
    const self = botState.self;
    if (!self) return;
    if (pkt.position) {
      self.position = new Vec3(pkt.position.x, pkt.position.y, pkt.position.z);
    }
    self.velocity = new Vec3(0, 0, 0);
    self.supportingBlockPos = null;
    self.onGround = false;
  });

  client.on('respawn', (pkt) => {
    const self = botState.self;
    if (!self) return;
    if (pkt.position) {
      self.position = new Vec3(pkt.position.x, pkt.position.y, pkt.position.z);
    }
  });

  client.on('set_health', (pkt) => {
    const self = botState.self;
    if (!self) return;
    self.health = pkt.health;
  });

  client.on('set_spawn_position', (pkt) => {
    const self = botState.self;
    if (!self) return;
    self.spawnPosition = pkt.spawn_position ?? pkt.position ?? pkt;
  });

  client.on('game_rules_changed', (pkt) => {
    const self = botState.self;
    if (!self) return;
    self.gamerules = pkt.gamerules ?? pkt.rules ?? pkt;
  });

  // ---- Helper: is this runtime ID the local player? ----
  function isSelfRuntime(botState, runtimeId) {
    const rid = toBigIntSafe(runtimeId);
    if (rid === null) return true;
    const self = botState.self;
    if (!self) return false;
    const selfId = toBigIntSafe(self.runtimeId) || toBigIntSafe(botState.client?.entityId) || toBigIntSafe(botState.client?.entityRuntimeId);
    return rid === selfId;
  }

  // ---- Helper: detect firework movement effect ----
  function isLikelyFireworkMovementEffect(effectType) {
    const s = String(effectType).toLowerCase();
    return s.includes('firework') || s.includes('rocket') || effectType === 0;
  }
}

// ===================================================================
// Exports
// ===================================================================
module.exports = {
  createNxgPhysicsAdapter,
  installBedrockMovementStateHandlers,
  BEDROCK_WORLD_SETTINGS,
};
