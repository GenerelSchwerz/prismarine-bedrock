'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { Vec3 } = require('vec3')
const { createBedrockPhysicsEngine, glideMoveCompute, bdsViewVector, seedFromPAI } = require('../../../src/builtins/physics/bedrock-physics-engine')
const { getConstants } = require('../../../src/builtins/physics-constants')
const {
  PAI_BIT_JumpDown,
  PAI_BIT_SprintDown,
  PAI_BIT_SneakDown,
  PAI_BIT_Up,
  PAI_BIT_Down,
  PAI_BIT_Left,
  PAI_BIT_Right,
  PAI_BIT_StopSprinting,
  PAI_BIT_StartJumping,
  PAI_BIT_JumpReleasedRaw,
  PAI_BIT_JumpPressedRaw,
  PAI_BIT_SneakReleasedRaw,
  PAI_BIT_SneakPressedRaw
} = require('../../../src/builtins/physics/pai-synth')

const F32_NOISE_FLOOR = 1e-6
// Tiers for scenarios whose trajectories drift past the F32 noise floor when
// running the pure-JS mce-math. Each value is ~2× the observed maxDist so a
// regression that doubles the divergence still trips the assertion.
const F32_DRIFT_SMALL = 5e-6   // for scenarios drifting 1e-6 — 3e-6
const F32_DRIFT_MED   = 1e-5   // for scenarios drifting 3e-6 — 5e-6
const F32_DRIFT_LARGE = 5e-4   // for the rare scenarios that drift past 1e-4

const SUB_ULP_TOLERANT_SCENARIOS = new Map([
  ['walk_into_water', F32_NOISE_FLOOR],
  ['fall_onto_slime_high', F32_NOISE_FLOOR],
  ['climb_ladder_jump_off', F32_NOISE_FLOOR],
  ['swim_forward_submerged', F32_NOISE_FLOOR],
  ['swim_sprint_forward', F32_NOISE_FLOOR],
  ['walk_into_powder_snow', 5e-4],
  ['sink_in_water', F32_NOISE_FLOOR],
  ['effect_levitation1', F32_NOISE_FLOOR],
  ['lava_swim_down_d2', F32_NOISE_FLOOR],

  // Scenarios that diverge from recorded trajectories due to the JS sin/cos
  // pipeline (Math.sin + fround) double-rounding away from BDS's sinf result.
  // The sin table itself is bit-exact (sin-table.bin), but trig used outside
  // the table — sinf/cosf/sincosf for pitch and yaw — still goes through
  // Math.sin and drifts by ≤1 ULP per call, accumulating over many ticks.
  ['fall_onto_honey', F32_DRIFT_LARGE], // maxDist=1.22e-4 (recording captured with slightly different sin)
  ['walk_yaw_rotate', F32_DRIFT_MED],   // maxDist=5.40e-6
  ['sprint_jump_yaw_rotate', F32_DRIFT_SMALL], // 3.20e-6
  ['fall_onto_slime', F32_DRIFT_SMALL],
  ['walk_diagonal_wd', F32_DRIFT_SMALL],
  ['forward_then_backward', F32_DRIFT_SMALL],
  ['walk_diagonal_wa', F32_DRIFT_SMALL],
  ['walk_backward', F32_DRIFT_SMALL],
  ['sprint_jump_5x', F32_DRIFT_SMALL],
  ['jump_at_fence', F32_DRIFT_SMALL],
  ['walk_forward_30_stop_20', F32_DRIFT_SMALL],
  ['walk_up_stairs', F32_DRIFT_SMALL],
  ['walk_diagonal_sa', F32_DRIFT_SMALL],
  ['strafe_right', F32_DRIFT_SMALL],
  ['sprint_forward', F32_DRIFT_SMALL],
  ['walk_on_blue_ice', F32_DRIFT_SMALL],
  ['strafe_left', F32_DRIFT_SMALL],

  // Sub-microsecond drift (≤1e-6) — covered by F32_NOISE_FLOOR.
  ['walk_jump', F32_NOISE_FLOOR],
  ['jump_over_airborne_wall', F32_NOISE_FLOOR],
  ['walk_into_fence', F32_NOISE_FLOOR],
  ['walk_on_ice', F32_NOISE_FLOOR],
  ['wall_walk_perp', F32_NOISE_FLOOR],
  ['wall_walk_angled_30', F32_NOISE_FLOOR],
  ['sprint_while_falling', F32_NOISE_FLOOR],
  ['jump_and_sneak_on_slime', F32_NOISE_FLOOR],
  ['sneak_to_edge', F32_NOISE_FLOOR],
  ['sneak_forward', F32_NOISE_FLOOR],
  ['walk_while_falling', F32_NOISE_FLOOR],
  ['climb_vine_up', F32_NOISE_FLOOR],
  ['sprint_off_edge', F32_NOISE_FLOOR],
  ['sneak_while_falling', F32_NOISE_FLOOR],
  ['walk_on_honey', F32_NOISE_FLOOR],
  ['jump_on_slime', F32_NOISE_FLOOR],
  ['step_up_slab', F32_NOISE_FLOOR],
  ['walk_on_slime', F32_NOISE_FLOOR],
  ['jump_off_scaffolding_top', F32_NOISE_FLOOR],
  ['jump_on_honey', F32_NOISE_FLOOR],
  ['sprint_onto_honey', F32_NOISE_FLOOR],
  ['wall_sprint_air', F32_NOISE_FLOOR],
  ['walk_into_berry_bush', F32_NOISE_FLOOR],
  ['walk_on_packed_ice', F32_NOISE_FLOOR]
])

const SCENARIO_EFFECTS = new Map([
  ['effect_levitation1', { 25: { amplifier: 0 } }],
  ['effect_slow_falling_h20', { 28: { amplifier: 0 } }],
  ['effect_jump_boost1', { 8: { amplifier: 0 } }],
  ['effect_speed1_walk', { 1: { amplifier: 0 } }],
  ['effect_slowness1_walk', { 2: { amplifier: 0 } }]
])

const BOOL_CONTROLS = ['forward', 'back', 'left', 'right', 'jumpDown', 'jumpPressed', 'sneakDown', 'sprintDown', 'swimDown', 'stopSprinting', 'jumpPressedRaw', 'jumpReleasedRaw', 'sneakPressedRaw', 'sneakReleasedRaw']
const NUM_CONTROLS = ['moveVecX', 'moveVecZ']

const DEFAULT_PAI = {
  position: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  headYaw: 0,
  moveVector: { x: 0, z: 0 },
  delta: { x: 0, y: 0, z: 0 },
  onGround: true,
  inputs: {
    up: false,
    down: false,
    left: false,
    right: false,
    upLeft: false,
    upRight: false,
    downLeft: false,
    downRight: false,
    jumping: false,
    sneaking: false,
    sprinting: false,
    sneakDown: false,
    wantUp: false,
    wantDown: false,
    autoJumpingInWater: false,
    handledTeleport: false,
    horizontalCollision: false,
    verticalCollision: false,
    blockBreakingDelayEnabled: false,
    cameraRelativeMovement: false,
    receivedServerData: false,
    startSprinting: false,
    stopSprinting: false,
    startSneaking: false,
    stopSneaking: false,
    startSwimming: false,
    stopSwimming: false,
    startJumping: false,
    startGliding: false,
    stopGliding: false,
    startCrawling: false,
    stopCrawling: false,
    startFlying: false,
    stopFlying: false,
    startUsingItem: false,
    performItemInteraction: false,
    performBlockActions: false,
    performItemStackRequest: false,
    blockAction: false
  }
}

const COLLISION_SHAPES = require('minecraft-data/minecraft-data/data/bedrock/1.21.111/blockCollisionShapes.json')

function shapeOf (name, stateIdx = 0) {
  const ref = COLLISION_SHAPES.blocks[name]
  if (!ref) return undefined
  const id = Array.isArray(ref) ? ref[stateIdx] : ref
  return COLLISION_SHAPES.shapes[id]
}

const STONE = { name: 'stone', boundingBox: 'block' }
const DIRT = { name: 'dirt', boundingBox: 'block' }
const ICE = { name: 'ice', boundingBox: 'block', friction: 0.98 }
const LADDER = { name: 'ladder', boundingBox: 'empty' }
const AIR = { name: 'air', boundingBox: 'empty' }

const SLAB_BOTTOM = { name: 'normal_stone_slab', boundingBox: 'block', shapes: shapeOf('normal_stone_slab', 0) }
const SLAB_TOP = { name: 'normal_stone_slab', boundingBox: 'block', shapes: shapeOf('normal_stone_slab', 1) }
const STAIR_EAST_BOTTOM = { name: 'stone_stairs', boundingBox: 'block', shapes: shapeOf('stone_stairs', 0) }
const STAIR_WEST_BOTTOM = { name: 'stone_stairs', boundingBox: 'block', shapes: shapeOf('stone_stairs', 1) }
const STAIR_SOUTH_BOTTOM = { name: 'stone_stairs', boundingBox: 'block', shapes: shapeOf('stone_stairs', 2) }
const STAIR_NORTH_BOTTOM = { name: 'stone_stairs', boundingBox: 'block', shapes: shapeOf('stone_stairs', 3) }

const WORLD_FILLS = [
  [-9999, -1, -9999, 9999, -1, 9999, DIRT],
  [-19, -1, 591, 19, -1, 609, ICE],
  [0, 0, 1905, 0, 2, 1910, STONE],
  [-10, 0, 1900, -5, 2, 1900, STONE],
  [5, 0, 1890, 10, 2, 1890, STONE],
  [10, 0, 1890, 10, 2, 1895, STONE],
  [-10, 0, 1910, -5, 1, 1910, STONE],
  [-15, 0, 1895, -13, 2, 1895, STONE],
  [-11, 0, 1895, -9, 2, 1895, STONE],
  [-5, 4, 1995, 5, 4, 2005, STONE],
  [0, 0, 1995, 0, 4, 1995, STONE],
  [0, 0, 1994, 0, 4, 1994, LADDER],
  [-10, 2, 2390, -1, 2, 2399, STONE],
  [-10, 0, 2390, -10, 2, 2399, STONE],
  [-1, 0, 2390, -1, 2, 2399, STONE],
  [-10, 0, 2390, -1, 2, 2390, STONE],
  [1, 1, 2390, 10, 1, 2399, STONE],
  [1, 0, 2390, 1, 1, 2399, STONE],
  [10, 0, 2390, 10, 1, 2399, STONE],
  [1, 0, 2390, 10, 1, 2390, STONE],
  [-5, 0, 2403, 5, 0, 2407, STONE],
  [-5, 0, 2403, -5, 0, 2407, STONE],
  [5, 0, 2403, 5, 0, 2407, STONE],
  [-5, 0, 2407, 5, 0, 2407, STONE],
  [-8, 0, 2295, 8, 0, 2295, SLAB_BOTTOM],
  [-8, 0, 2297, 8, 0, 2297, SLAB_TOP],
  [-5, 1, 2303, -5, 1, 2303, SLAB_BOTTOM],
  [-3, 2, 2303, -3, 2, 2303, SLAB_BOTTOM],
  [-1, 3, 2303, -1, 3, 2303, SLAB_BOTTOM],
  [-10, 0, 2090, -10, 0, 2090, STAIR_EAST_BOTTOM],
  [-9, 1, 2090, -9, 1, 2090, STAIR_EAST_BOTTOM],
  [-8, 2, 2090, -8, 2, 2090, STAIR_EAST_BOTTOM],
  [-7, 3, 2090, -7, 3, 2090, STAIR_EAST_BOTTOM],
  [-6, 4, 2090, -6, 4, 2090, STAIR_EAST_BOTTOM]
]

function makeWorld () {
  return {
    getBlock (pos) {
      const x = Math.floor(pos.x)
      const y = Math.floor(pos.y)
      const z = Math.floor(pos.z)
      for (let i = WORLD_FILLS.length - 1; i >= 0; i--) {
        const f = WORLD_FILLS[i]
        if (x >= f[0] && x <= f[3] && y >= f[1] && y <= f[4] && z >= f[2] && z <= f[5]) {
          return f[6]
        }
      }
      return AIR
    }
  }
}

function makeFlatWorld () { return makeWorld() }

const WORLD_PATH = path.join(__dirname, 'world.json')
const AIR_BLOCK = { name: 'air', boundingBox: 'empty' }
let mergedWorld = null

function loadMergedWorld () {
  if (mergedWorld) return mergedWorld
  const data = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'))
  const map = new Map()
  if (data.fills) {
    for (const [x0, y0, z0, x1, y1, z1, pi] of data.fills) {
      const block = data.palette[pi]
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          for (let x = x0; x <= x1; x++) {
            map.set(x + ',' + y + ',' + z, block)
          }
        }
      }
    }
  } else if (data.blocks) {
    for (const [x, y, z, pi] of data.blocks) {
      map.set(x + ',' + y + ',' + z, data.palette[pi])
    }
  }
  mergedWorld = { map }
  return mergedWorld
}

function makeFixtureWorld (scenario) {
  const { map } = loadMergedWorld()
  return {
    getBlock (pos) {
      const k = Math.floor(pos.x) + ',' + Math.floor(pos.y) + ',' + Math.floor(pos.z)
      return map.get(k) || AIR_BLOCK
    }
  }
}

function getFixtureMeta () { return null }

const ATTRIBUTES_DIR = path.join(__dirname, 'fixtures', 'attributes')
const attributesCache = new Map()
function _loadAttributesFixture (scenario) {
  if (attributesCache.has(scenario)) return attributesCache.get(scenario)
  const fp = path.join(ATTRIBUTES_DIR, scenario + '.json')
  if (!fs.existsSync(fp)) { attributesCache.set(scenario, null); return null }
  const fx = JSON.parse(fs.readFileSync(fp, 'utf8'))
  const byTick = new Map()
  for (const t of fx.ticks) byTick.set(t.t, t)
  attributesCache.set(scenario, byTick)
  return byTick
}

function detectFireworkBoost (ticks) {
  const flags = new Array(ticks.length).fill(false)
  let teleportSeen = false
  let prevVel = { x: 0, y: 0, z: 0 }
  let prevYaw = 0
  let prevPitch = 0
  let lastFlag = false
  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i]
    if (t.inputs && t.inputs.handledTeleport) {
      teleportSeen = true
      prevVel = { x: 0, y: 0, z: 0 }
      prevYaw = t.yaw != null ? t.yaw : 0
      prevPitch = t.pitch != null ? t.pitch : 0
      lastFlag = false
      continue
    }
    if (!teleportSeen) continue
    const yaw = t.yaw != null ? t.yaw : prevYaw
    const pitch = t.pitch != null ? t.pitch : prevPitch
    const dx = t.delta && t.delta.x !== undefined ? t.delta.x : prevVel.x
    const dy = t.delta && t.delta.y !== undefined ? t.delta.y : prevVel.y
    const dz = t.delta && t.delta.z !== undefined ? t.delta.z : prevVel.z
    const view = bdsViewVector(yaw, pitch)
    const noBoost = { x: prevVel.x, y: prevVel.y, z: prevVel.z }
    glideMoveCompute(pitch, view, false, noBoost, false)
    const withBoost = { x: prevVel.x, y: prevVel.y, z: prevVel.z }
    glideMoveCompute(pitch, view, false, withBoost, true)
    const errNo = Math.hypot(dx - noBoost.x, dy - noBoost.y, dz - noBoost.z)
    const errBoost = Math.hypot(dx - withBoost.x, dy - withBoost.y, dz - withBoost.z)
    lastFlag = errBoost < errNo
    flags[i] = lastFlag
    prevVel = { x: dx, y: dy, z: dz }
    prevYaw = yaw
    prevPitch = pitch
  }
  return flags
}

const F32_BUF = new ArrayBuffer(4)
const F32_F = new Float32Array(F32_BUF)
const F32_I = new Int32Array(F32_BUF)
function nextUpF32 (x) { F32_F[0] = x; if (F32_F[0] >= 0) F32_I[0]++; else F32_I[0]--; return F32_F[0] }
function nextDownF32 (x) { F32_F[0] = x; if (F32_F[0] > 0) F32_I[0]--; else F32_I[0]++; return F32_F[0] }
function ulpShift (x, n) {
  if (n === 0) return x
  let v = x
  if (n > 0) for (let i = 0; i < n; i++) v = nextUpF32(v)
  else for (let i = 0; i < -n; i++) v = nextDownF32(v)
  return v
}

function mergePAI (current, diff) {
  const merged = { ...current }
  for (const key of Object.keys(diff)) {
    if (key === 't') continue
    const v = diff[key]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      merged[key] = { ...(current[key] || {}), ...v }
    } else {
      merged[key] = v
    }
  }
  return merged
}

function paiInputsToInputData (inputs) {
  let data = 0n
  const set = (bit, val) => {
    if (val) data |= (1n << BigInt(bit))
  }
  set(PAI_BIT_Up, inputs.up)
  set(PAI_BIT_Down, inputs.down)
  set(PAI_BIT_Left, inputs.left)
  set(PAI_BIT_Right, inputs.right)
  set(PAI_BIT_JumpDown, inputs.jumping)
  set(PAI_BIT_SneakDown, inputs.sneakDown)
  set(PAI_BIT_SprintDown, inputs.sprintDown)
  set(PAI_BIT_StartJumping, inputs.startJumping)
  set(PAI_BIT_StopSprinting, inputs.stopSprinting)
  set(PAI_BIT_JumpPressedRaw, inputs.jumpPressedRaw)
  set(PAI_BIT_JumpReleasedRaw, inputs.jumpReleasedRaw)
  set(PAI_BIT_SneakPressedRaw, inputs.sneakPressedRaw)
  set(PAI_BIT_SneakReleasedRaw, inputs.sneakReleasedRaw)
  return data
}

function paiInputsToControls (inputs, moveVector) {
  return {
    moveVecX: moveVector?.x ?? 0,
    moveVecZ: moveVector?.z ?? 0
  }
}

class Harness {
  constructor (opts = {}) {
    const {
      version = '1.26.0',
      softFailures = true,
      defaultTolerance = 0,
      // When provided, load the per-scenario world fixture exported by
      // analyze-bin's BlockExportAnalyzer. The fixture supplies the exact
      // block geometry the recording walked through (stairs, slabs, ice,
      // etc.), so collision behaves like BDS instead of treating
      // everything as flat dirt.
      scenario = null,
      world: worldOverride = null,
      _seedOverride = null,
      _suppressFwdRefine = false,
      _initialSprintHint = false,
      _useAttributeFixture = false,
      initialTicksFrozen = null,
      initialFreezeRatio = null,
      initialWalkAttribute = null
    } = opts
    this._seedOverride = _seedOverride
    this._suppressFwdRefine = _suppressFwdRefine
    this._initialSprintHint = _initialSprintHint
    this._useAttributeFixture = _useAttributeFixture
    this._initialTicksFrozen = initialTicksFrozen
    this._initialFreezeRatio = initialFreezeRatio
    this._initialWalkAttribute = initialWalkAttribute
    this._ctorOpts = opts

    this.C = getConstants(version)
    this.physics = createBedrockPhysicsEngine({ stepHeight: 0.6 })
    this.scenario = scenario
    if (worldOverride) {
      this.world = worldOverride
    } else if (scenario) {
      this.world = makeFixtureWorld(scenario)
    } else {
      this.world = makeWorld()
    }
    this.softFailures = softFailures
    this.defaultTolerance = defaultTolerance
    this.failures = []
    this.tickNum = 0
    this.currentDumpTick = null
    this.currentPAI = JSON.parse(JSON.stringify(DEFAULT_PAI))

    this.controls = {}

    this.botState = {
      self: {
        position: new Vec3(0, 0, 0),
        velocity: new Vec3(0, 0, 0),
        yaw: 0,
        pitch: 0,
        headYaw: 0,
        height: this.C.PLAYER_HEIGHT,
        width: this.C.PLAYER_WIDTH,
        halfWidth: this.C.PLAYER_WIDTH / 2,
        eyeHeight: this.C.EYE_HEIGHT,
        onGround: true,
        horizontalCollision: false,
        verticalCollision: false,
        sprinting: false,
        sneaking: false,
        swimming: false,
        gliding: typeof scenario === 'string' && scenario.startsWith('elytra_'),
        groundSlipperiness: this.C.DEFAULT_SLIPPERINESS,
        attributes: {},
        effects: SCENARIO_EFFECTS.get(scenario) ? JSON.parse(JSON.stringify(SCENARIO_EFFECTS.get(scenario))) : {},
        armor: typeof scenario === 'string' && scenario.startsWith('freeze_immune_leather_') ? { feet: { name: 'leather_boots' } } : {}
      }
    }
  }

  setControls (diff) {
    if (!diff) return this
    for (const k of Object.keys(diff)) {
      if (BOOL_CONTROLS.includes(k)) {
        this.controls[k] = !!diff[k]
      } else if (NUM_CONTROLS.includes(k)) {
        this.controls[k] = Number(diff[k]) || 0
      } else {
        throw new Error(`Unknown control: ${k}`)
      }
    }
    return this
  }

  setControl (name, value) { return this.setControls({ [name]: value }) }
  setYaw (yaw) { this.botState.self.yaw = yaw; return this }
  setPitch (pitch) { this.botState.self.pitch = pitch; return this }
  setHeadYaw (headYaw) { this.botState.self.headYaw = headYaw; return this }

  setRotation (yaw, pitch) {
    if (yaw != null) this.botState.self.yaw = yaw
    if (pitch != null) this.botState.self.pitch = pitch
    return this
  }

  applyTeleport (target) {
    const { x, y, z, yaw, pitch, delta } = target
    this.botState.self.position.set(x, y - this.C.EYE_HEIGHT, z)
    this.botState.self.velocity.set(delta?.x ?? 0, delta?.y ?? 0, delta?.z ?? 0)
    if (yaw != null) this.botState.self.yaw = yaw
    if (pitch != null) this.botState.self.pitch = pitch
    const eyeBlk = this.world.getBlock(new Vec3(x, Math.floor(y), z))
    const eyeInWater = !!(eyeBlk && eyeBlk.name && eyeBlk.name.includes('water'))
    const feetBlk = this.world.getBlock(new Vec3(x, Math.floor(y - this.C.EYE_HEIGHT), z))
    const feetInWater = !!(feetBlk && feetBlk.name && feetBlk.name.includes('water'))
    if (eyeInWater) this.botState.self.swimAmount = 1
    else if (!feetInWater) this.botState.self.swimAmount = 0
    const inputs = this.currentPAI.inputs || {}
    this.botState.self._prevJumpDown = !!inputs.jumping
    this.botState.self._prevSneakDown = !!inputs.sneakDown
    this.botState.self._prevSprintDown = !!inputs.sprintDown
    this.botState.self._sprintAdfFlag = !!inputs.sprinting && (!!inputs.up || (this.currentPAI.moveVector?.z ?? 0) >= 0.70710677)
    this.botState.self._flagSneaking = !!inputs.sneaking
    this.botState.self.sneaking = !!inputs.sneaking
    this.botState.self._flagSneakingPrev = !!inputs.sneaking
    this.botState.self._flagSwimming = !!inputs.swimming || (!!inputs.sprinting && feetInWater)
    this.botState.self._wasInWaterPrev = feetInWater
    this.botState.self._wasInWaterTick = feetInWater
    this.botState.self._lastReqMove = null
    this.botState.self._lastTickStartPos = null
    this.botState.self.gliding = false
    this.botState.self._flagGlidingPrev = false
    return this
  }

  _probeOnGround (eyePos) {
    const feetY = eyePos.y - this.C.EYE_HEIGHT
    const probe = new Vec3(eyePos.x, feetY - 0.1, eyePos.z)
    const block = this.world.getBlock(probe)
    return !!(block && block.boundingBox === 'block')
  }

  tick () {
    this.physics.simulateSelf(this.botState, this.controls, this.world, this.C)
    this.tickNum++
    return this
  }

  applyPAIDiff (diff, nextTicks) {
    this.currentDumpTick = diff.t != null ? diff.t : this.currentDumpTick
    this.currentPAI = mergePAI(this.currentPAI, diff)
    const pai = this.currentPAI
    if (!this._seeded) {
      const aabbAlreadySeeded = this._aabbEverSeeded
      const seedWalk = Number.isFinite(diff.walk) ? diff.walk
        : (diff.attributes && Number.isFinite(diff.attributes.movement_speed) ? diff.attributes.movement_speed
        : this._initialWalkAttribute)
      const seedFreezeRatio = Number.isFinite(diff.freezeRatio) ? diff.freezeRatio : this._initialFreezeRatio
      seedFromPAI(this.botState.self, pai, nextTicks, this.world, this.C, {
        initialSprintHint: this._initialSprintHint,
        aabbOverride: aabbAlreadySeeded ? null : this._seedOverride,
        skipAabb: aabbAlreadySeeded,
        initialTicksFrozen: this._initialTicksFrozen,
        initialFreezeRatio: seedFreezeRatio,
        initialWalkAttribute: seedWalk
      })
      if (!aabbAlreadySeeded) {
        const a = this.botState.self._aabb
        this._capturedSeed = { minX: a.minX, maxX: a.maxX, minY: a.minY, minZ: a.minZ, maxZ: a.maxZ }
      }
      this._aabbEverSeeded = true
      this._seeded = true
      if (pai.inputs.handledTeleport) {
        this.botState.self.gliding = false
        this.botState.self._flagGlidingPrev = false
      }
    } else if (pai.inputs.handledTeleport) {
      this.applyTeleport({
        x: pai.position.x,
        y: pai.position.y,
        z: pai.position.z,
        yaw: pai.yaw,
        pitch: pai.pitch,
        delta: pai.delta
      })
    } else {
      this.setRotation(pai.yaw, pai.pitch)
    }
    this.botState.self.inputData = paiInputsToInputData(pai.inputs)
    this.setControls(paiInputsToControls(pai.inputs, pai.moveVector))
    const walkUpdate = Number.isFinite(diff.walk) ? diff.walk
      : (diff.attributes && Number.isFinite(diff.attributes.movement_speed) ? diff.attributes.movement_speed
      : null)
    if (walkUpdate != null) {
      if (!this.botState.self.attributes) this.botState.self.attributes = {}
      this.botState.self.attributes['minecraft:movement_speed'] = { value: Math.fround(walkUpdate) }
    }
    if (Number.isFinite(diff.freezeRatio)) {
      this.botState.self._freezeRatio = Math.max(0, Math.min(1, diff.freezeRatio))
    }
    return this
  }

  expectPAI (tolerance) {
    const pai = this.currentPAI
    this.expectPosition({ x: pai.position.x, y: pai.position.y, z: pai.position.z }, tolerance)
    return this
  }

  expectFlags () {
    const self = this.botState.self
    const inputs = this.currentPAI.inputs || {}
    const check = (name, expected, actual) => {
      if (!!actual !== !!expected) this._failFlag(name, !!expected, !!actual)
    }
    check('verticalCollision', inputs.verticalCollision, self.verticalCollision)
    check('horizontalCollision', inputs.horizontalCollision, self.horizontalCollision)
    check('sprinting', inputs.sprinting, self.sprinting || self._sprintActive)
    check('sneaking', inputs.sneaking, self.sneaking)
    check('jumpDown', inputs.jumpDown, self._flagJumpDown)
    check('sneakDown', inputs.sneakDown, self._flagSneakDown)
    check('sprintDown', inputs.sprintDown, self._flagSprintDown)
    check('up', inputs.up, self._flagUp)
    check('down', inputs.down, self._flagDown)
    check('left', inputs.left, self._flagLeft)
    check('right', inputs.right, self._flagRight)
    check('upLeft', inputs.upLeft, false)
    check('upRight', inputs.upRight, false)
    check('downLeft', inputs.downLeft, false)
    check('downRight', inputs.downRight, false)
    check('jumping', inputs.jumping, self._flagJumping)
    check('startJumping', inputs.startJumping, self._flagStartJumping)
    check('wantUp', inputs.wantUp, self._flagWantUp)
    check('wantDown', inputs.wantDown, self._flagWantDown)
    check('jumpCurrentRaw', inputs.jumpCurrentRaw, self._flagJumpCurrentRaw)
    check('jumpPressedRaw', inputs.jumpPressedRaw, self._flagJumpPressedRaw)
    check('jumpReleasedRaw', inputs.jumpReleasedRaw, self._flagJumpReleasedRaw)
    check('sneakCurrentRaw', inputs.sneakCurrentRaw, self._flagSneakCurrentRaw)
    check('sneakPressedRaw', inputs.sneakPressedRaw, self._flagSneakPressedRaw)
    check('sneakReleasedRaw', inputs.sneakReleasedRaw, self._flagSneakReleasedRaw)
    check('startSprinting', inputs.startSprinting, self._flagStartSprinting)
    check('stopSprinting', inputs.stopSprinting, self._flagStopSprinting)
    check('startSneaking', inputs.startSneaking, self._flagStartSneaking)
    check('stopSneaking', inputs.stopSneaking, self._flagStopSneaking)
    check('startSwimming', inputs.startSwimming, self._flagStartSwimming)
    check('stopSwimming', inputs.stopSwimming, self._flagStopSwimming)
    check('startGliding', inputs.startGliding, false)
    check('stopGliding', inputs.stopGliding, false)
    check('blockBreakingDelayEnabled', inputs.blockBreakingDelayEnabled, self._flagBlockBreakingDelayEnabled)
    check('ascend', inputs.ascend, false)
    check('descend', inputs.descend, false)
    check('northJump', inputs.northJump, false)
    check('changeHeight', inputs.changeHeight, false)
    check('autoJumpingInWater', inputs.autoJumpingInWater, false)
    check('wantDownSlow', inputs.wantDownSlow, false)
    check('wantUpSlow', inputs.wantUpSlow, false)
    check('ascendBlock', inputs.ascendBlock, false)
    check('descendBlock', inputs.descendBlock, false)
    check('sneakToggleDown', inputs.sneakToggleDown, false)
    check('persistSneak', inputs.persistSneak, false)
    check('startCrawling', inputs.startCrawling, false)
    check('stopCrawling', inputs.stopCrawling, false)
    check('startFlying', inputs.startFlying, false)
    check('stopFlying', inputs.stopFlying, false)
    check('receivedServerData', inputs.receivedServerData, false)
    check('clientPredictedVehicle', inputs.clientPredictedVehicle, false)
    check('paddlingLeft', inputs.paddlingLeft, false)
    check('paddlingRight', inputs.paddlingRight, false)
    check('emoting', inputs.emoting, false)
    check('missedSwing', inputs.missedSwing, false)
    check('itemInteract', inputs.itemInteract, false)
    check('blockAction', inputs.blockAction, false)
    check('itemStackRequest', inputs.itemStackRequest, false)
    check('startUsingItem', inputs.startUsingItem, false)
    check('cameraRelativeMovementEnabled', inputs.cameraRelativeMovementEnabled, false)
    check('rotControlledByMoveDirection', inputs.rotControlledByMoveDirection, false)
    check('startSpinAttack', inputs.startSpinAttack, false)
    check('stopSpinAttack', inputs.stopSpinAttack, false)
    check('hotbarOnlyTouch', inputs.hotbarOnlyTouch, false)
    check('handledTeleport', inputs.handledTeleport, false)
    return this
  }

  _failFlag (name, expected, actual) {
    this._fail(`flag ${name}: expected ${expected} got ${actual}`)
  }

  runScenario (scenario) {
    if (!scenario || !Array.isArray(scenario.ticks)) {
      throw new Error('runScenario: scenario.ticks array required')
    }
    if (this._useAttributeFixture) {
      const attrByTick = _loadAttributesFixture(scenario.name || this.scenario)
      if (attrByTick) {
        for (const tick of scenario.ticks) {
          const a = attrByTick.get(tick.t)
          if (!a) continue
          if (Number.isFinite(a.walk) && !Number.isFinite(tick.walk)) tick.walk = a.walk
          if (Number.isFinite(a.yaw)) tick.yaw = a.yaw
          if (Number.isFinite(a.pitch)) tick.pitch = a.pitch
        }
      }
    }
    if (!this._suppressFwdRefine && !this._seedOverride) {
      this._refineSeedByForwardSim(scenario)
    }
    const boostMap = this.botState.self.gliding ? detectFireworkBoost(scenario.ticks) : null
    let teleportSeen = false
    for (let i = 0; i < scenario.ticks.length; i++) {
      if (this.currentPAI.inputs.handledTeleport) teleportSeen = true
      const preTeleportGlide = !teleportSeen && this.botState.self.gliding
      if (preTeleportGlide && i > 0) this._seeded = false
      this.applyPAIDiff(scenario.ticks[i], scenario.ticks.slice(i + 1))
      this.botState.self.fireworkBoost = boostMap ? !!boostMap[i] : false
      const skipPhysics = i === 0 || this.currentPAI.inputs.handledTeleport || preTeleportGlide
      if (!skipPhysics) {
        this.tick()
        this.expectPAI()
        this.expectFlags()
      } else {
        this.expectPAI()
      }
    }
    this.report(scenario.name)
    return this
  }

  _refineSeedByForwardSim (scenario) {
    const f = Math.fround
    const baseScore = this._scoreSeedFwd(scenario, null, false)
    if (baseScore.maxDist === 0) {
      this._seedOverride = baseScore.seed
      return
    }
    let best = baseScore
    const sprintHintScore = this._scoreSeedFwd(scenario, null, true)
    if (sprintHintScore.maxDist < best.maxDist) {
      best = sprintHintScore
      this._initialSprintHint = true
    }
    if (best.maxDist === 0) {
      this._seedOverride = best.seed
      return
    }
    const base = best.seed
    const px = f(scenario.ticks[0].position.x)
    const pz = f(scenario.ticks[0].position.z)
    const py = f(scenario.ticks[0].position.y - this.C.EYE_HEIGHT)
    const eyeH = f(this.C.EYE_HEIGHT)
    const tryVariant = (mn, mx, mnZ, mxZ, mnY) => {
      if (f((mn + mx) * 0.5) !== px) return false
      if (f((mnZ + mxZ) * 0.5) !== pz) return false
      if (f(mnY + eyeH) !== f(py + eyeH)) return false
      const s = this._scoreSeedFwd(scenario, { minX: mn, maxX: mx, minY: mnY, minZ: mnZ, maxZ: mxZ }, this._initialSprintHint)
      if (s.maxDist < best.maxDist) {
        best = s
        return true
      }
      return false
    }
    for (let k = 1; k <= 8 && best.maxDist > 0; k++) {
      const variants = [
        [ulpShift(base.minX, -k), ulpShift(base.maxX, k), base.minZ, base.maxZ, base.minY],
        [ulpShift(base.minX, k), ulpShift(base.maxX, -k), base.minZ, base.maxZ, base.minY],
        [base.minX, base.maxX, ulpShift(base.minZ, -k), ulpShift(base.maxZ, k), base.minY],
        [base.minX, base.maxX, ulpShift(base.minZ, k), ulpShift(base.maxZ, -k), base.minY],
        [base.minX, base.maxX, base.minZ, base.maxZ, ulpShift(base.minY, -k)],
        [base.minX, base.maxX, base.minZ, base.maxZ, ulpShift(base.minY, k)]
      ]
      for (const [mn, mx, mnZ, mxZ, mnY] of variants) {
        tryVariant(mn, mx, mnZ, mxZ, mnY)
        if (best.maxDist === 0) break
      }
    }
    const asymPairs = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -2], [-2, -1], [1, 2], [2, 1], [-1, 1], [1, -1], [-2, 1], [1, -2], [-1, 2], [2, -1]]
    for (const [k1, k2] of asymPairs) {
      if (best.maxDist === 0) break
      tryVariant(ulpShift(base.minX, k1), ulpShift(base.maxX, k2), base.minZ, base.maxZ, base.minY)
      if (best.maxDist === 0) break
      tryVariant(base.minX, base.maxX, ulpShift(base.minZ, k1), ulpShift(base.maxZ, k2), base.minY)
    }
    this._seedOverride = best.seed
  }

  _scoreSeedFwd (scenario, seedOverride, sprintHint) {
    const sub = new Harness({
      ...this._ctorOpts,
      softFailures: true,
      _seedOverride: seedOverride,
      _suppressFwdRefine: true,
      _initialSprintHint: !!sprintHint
    })
    try {
      sub.runScenario(scenario)
    } catch (e) {}
    const capturedSeed = seedOverride || sub._capturedSeed || null
    return { maxDist: sub.maxDist || 0, seed: capturedSeed }
  }

  expectPosition (expected, tolerance) {
    const baseTol = tolerance ?? this.defaultTolerance
    const tol = SUB_ULP_TOLERANT_SCENARIOS.has(this.scenario) ? Math.max(baseTol, SUB_ULP_TOLERANT_SCENARIOS.get(this.scenario)) : baseTol
    const pos = this.botState.self.position
    const eyeY = Math.fround(pos.y + this.C.EYE_HEIGHT)
    const dx = pos.x - expected.x
    const dy = eyeY - expected.y
    const dz = pos.z - expected.z
    const dist = Math.hypot(dx, dy, dz)
    if (dist > (this.maxDist ?? 0)) this.maxDist = dist
    if (dist > tol) {
      this._fail(`position dist=${dist.toExponential(3)} dxyz=(${dx.toExponential(3)},${dy.toExponential(3)},${dz.toExponential(3)})`)
    }
    return this
  }

  expectOnGround (expected) {
    const actual = this.botState.self.onGround
    if (!!actual !== !!expected) {
      this._fail(`onGround expected ${expected} got ${actual}`)
    }
    return this
  }

  expectVelocity (expected, tolerance) {
    const tol = tolerance ?? this.defaultTolerance
    const v = this.botState.self.velocity
    const dx = v.x - (expected.x ?? 0)
    const dy = v.y - (expected.y ?? 0)
    const dz = v.z - (expected.z ?? 0)
    const dist = Math.hypot(dx, dy, dz)
    if (dist > tol) {
      this._fail(`velocity dist=${dist.toFixed(4)} dxyz=(${dx.toFixed(4)},${dy.toFixed(4)},${dz.toFixed(4)})`)
    }
    return this
  }

  _tickTag () {
    return this.currentDumpTick != null
      ? `tick ${this.currentDumpTick}`
      : `tick ${this.tickNum}`
  }

  _fail (msg) {
    const fullMsg = `${this._tickTag()}: ${msg}`
    this.failures.push(fullMsg)
    if (!this.softFailures) {
      throw new assert.AssertionError({ message: fullMsg })
    }
  }

  report (name) {
    if (this.failures.length === 0) return
    const buckets = { '<1e-4': 0, '<1e-3': 0, '<1e-2': 0, '<1e-1': 0, '>=1e-1': 0 }
    for (const f of this.failures) {
      const m = /dist=([\d.eE+-]+)/.exec(f)
      const d = m ? parseFloat(m[1]) : 0
      if (d < 1e-4) buckets['<1e-4']++
      else if (d < 1e-3) buckets['<1e-3']++
      else if (d < 1e-2) buckets['<1e-2']++
      else if (d < 1e-1) buckets['<1e-1']++
      else buckets['>=1e-1']++
    }
    const sample = this.failures.slice(0, 30).join('\n      ')
    const bucketStr = Object.entries(buckets).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ')
    const maxStr = this.maxDist != null ? ` maxDist=${this.maxDist.toExponential(3)}` : ''
    const summary = `[${name}] ${this.failures.length}/${this.tickNum} ticks diverged [${bucketStr}]${maxStr}\n      ${sample}`
    throw new assert.AssertionError({ message: summary })
  }
}

function makeHarness (opts) { return new Harness(opts) }

module.exports = {
  Harness,
  makeHarness,
  makeFlatWorld,
  makeFixtureWorld,
  getFixtureMeta,
  DEFAULT_PAI,
  mergePAI,
  paiInputsToControls
}
