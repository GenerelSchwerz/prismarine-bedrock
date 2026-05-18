// physics-constants.js
// Game-physics constants for Minecraft Bedrock Edition.
// The version-specific set can be selected by passing the normalized protocol
// version string from src/version.js.

/**
 * Default / latest constants for the current Bedrock protocol target.
 * Sources: vanilla Bedrock server deobfuscation, Minecraft wiki, and
 * the `player_auth_input` InputFlag bitflags from proto.yml.
 */
const LATEST = {
  // Player dimensions (metres / blocks)
  PLAYER_HEIGHT: 1.8,
  PLAYER_WIDTH: 0.6,
  SNEAK_HEIGHT: 1.49,
  EYE_HEIGHT: 1.6200100183486938,
  HALF_WIDTH: 0.3,

  // Physics
  PLAYER_SPEED: 0.1,                  // base movement_speed attribute
  GRAVITY: 0.08,                      // blocks/tick²
  SLOW_FALLING_GRAVITY: 0.01,
  JUMP_VELOCITY: 0.42,                // initial upward velocity on jump
  CLIMB_SPEED: 0.2,                   // max downward speed on climbable blocks
  STEP_HEIGHT: 0.6,                   // Bedrock/Geyser player step-up height
  DEFAULT_SLIPPERINESS: 0.60000002,   // float32 representation — bedrock-oracle-v26 GroundTravelTypeSystem.h:97
  MAX_SPEED: 4.317 / 20,              // blocks/s at full sprint on ground

  // Friction / drag multipliers (per tick) — exact float32 values used by
  // BDS (see Mob_Friction___Ground.h, GroundTravelTypeSystem.h)
  GROUND_FRICTION_XZ: 0.54600006,     // 0.60000002 * 0.91000003 (float32)
  AIR_FRICTION_XZ: 0.91000003,        // float32 of 0.91
  VELOCITY_Y_DECAY: 0.98000002,       // float32 of 0.98 — MobTravelIntentSystem.h damp constant

  // Acceleration (blocks/tick²)
  GROUND_ACCEL_FACTOR: 0.21600002,    // base ground acceleration multiplier
  AIR_ACCEL_SPRINT: 0.025999999,      // air acceleration while sprinting
  AIR_ACCEL_WALK: 0.02,               // air acceleration while walking

  // Sneak/crawl scale
  SNEAK_INPUT_SCALE: 0.3,
  // Using item (non-spear) multiply
  USING_ITEM_SCALE: 0.122499995,

  // Jump boost from sprint (horizontal component)
  SPRINT_JUMP_BOOST: 0.2,

  // Water/lava buoyancy
  FLUID_BUOYANCY_Y: 0.04,

  // Collision
  SURFACE_EPSILON: 1e-7,
  OVERLAP_EPSILON: 1e-9,

  // Packed InputFlag bits (from proto.yml InputFlag)
  BIT_ASCEND: 0,
  BIT_DESCEND: 1,
  BIT_SPRINT_DOWN: 4,
  BIT_CHANGE_HEIGHT: 5,
  BIT_JUMPING: 6,
  BIT_AUTO_JUMPING_IN_WATER: 7,
  BIT_SNEAKING: 8,
  BIT_SNEAK_DOWN: 9,
  BIT_UP: 10,
  BIT_DOWN: 11,
  BIT_LEFT: 12,
  BIT_RIGHT: 13,
  BIT_UP_LEFT: 14,
  BIT_UP_RIGHT: 15,
  BIT_WANT_UP: 16,
  BIT_WANT_DOWN: 17,
  BIT_SPRINTING: 20,
  BIT_START_SPRINTING: 25,
  BIT_STOP_SPRINTING: 26,
  BIT_START_SNEAKING: 27,
  BIT_STOP_SNEAKING: 28,
  BIT_START_SWIMMING: 29,
  BIT_STOP_SWIMMING: 30,
  BIT_START_JUMPING: 31,
  BIT_START_FLYING: 42,
  BIT_STOP_FLYING: 43,
  BIT_HANDLED_TELEPORT: 37,
  BIT_RECEIVED_SERVER_DATA: 44,
  BIT_HORIZONTAL_COLLISION: 49,
  BIT_VERTICAL_COLLISION: 50,
  BIT_START_USING_ITEM: 53,
  BIT_CAMERA_RELATIVE_MOVEMENT: 54,
  BIT_SNEAK_RELEASED_RAW: 62,
  BIT_SNEAK_PRESSED_RAW: 63,
  BIT_SNEAK_CURRENT_RAW: 64,
  BIT_BLOCK_ACTION: 35,
  BIT_BLOCK_BREAKING_DELAY_ENABLED: 48,
};

/**
 * Returns constants for a given protocol version.
 * Currently returns the latest set; extend this map as newer versions arrive.
 *
 * @param {string} version  e.g. '1.26.10'
 * @returns {object}
 */
function getConstants(version) {
  // If you need version-specific overrides, add them here.
  // For now all versions use the latest set.
  return { ...LATEST };
}

module.exports = { getConstants, LATEST };
