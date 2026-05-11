// physics-constants.js
// Game-physics constants for Minecraft Bedrock Edition.
// The version-specific set can be selected by passing the protocol version
// string (e.g. '1.21.130') or the major.minor version from bedrock-protocol
// options.CURRENT_VERSION (e.g. '26.10').

/**
 * Default / latest constants (version 26.10 / 1.21.130).
 * Sources: vanilla Bedrock server deobfuscation, Minecraft wiki, and
 * the `player_auth_input` InputFlag bitflags from proto.yml.
 */
const LATEST = {
  // Player dimensions (metres / blocks)
  PLAYER_HEIGHT: 1.8,
  PLAYER_WIDTH: 0.6,
  EYE_HEIGHT: 1.62,
  HALF_WIDTH: 0.3,

  // Physics
  GRAVITY: 0.08,                // blocks/tick²
  JUMP_VELOCITY: 0.42,          // initial upward velocity on jump
  CLIMB_SPEED: 0.2,             // max downward speed on climbable blocks
  STEP_HEIGHT: 0.5,             // max step-up height (vanilla = 0.5)
  DEFAULT_SLIPPERINESS: 0.6,    // friction factor for most blocks
  MAX_SPEED: 4.317 / 20,             // blocks/s at full sprint on ground

  // Friction / drag multipliers (per tick)
  GROUND_FRICTION_XZ: 0.546,     // slipperiness * 0.91  (0.6*0.91=0.546)
  AIR_FRICTION_XZ: 0.91,
  VELOCITY_Y_DECAY: 0.98,

  // Acceleration (blocks/tick²)
  GROUND_ACCEL_FACTOR: 0.21600002,  // base ground acceleration multiplier
  AIR_ACCEL_SPRINT: 0.026,          // air acceleration while sprinting
  AIR_ACCEL_WALK: 0.02,             // air acceleration while walking

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
  BIT_JUMPING: 6,
  BIT_AUTO_JUMPING_IN_WATER: 7,
  BIT_SNEAKING: 8,
  BIT_SPRINTING: 20,
  BIT_RECEIVED_SERVER_DATA: 44,
  BIT_HORIZONTAL_COLLISION: 49,
  BIT_VERTICAL_COLLISION: 50,
  BIT_START_USING_ITEM: 53,
  BIT_CAMERA_RELATIVE_MOVEMENT: 54,
  BIT_BLOCK_ACTION: 35,
};

/**
 * Returns constants for a given protocol version.
 * Currently returns the latest set; extend this map as newer versions arrive.
 *
 * @param {string} version  e.g. '1.21.130' or '26.10'
 * @returns {object}
 */
function getConstants(version) {
  // If you need version-specific overrides, add them here.
  // For now all versions use the latest set.
  return { ...LATEST };
}

module.exports = { getConstants, LATEST };
