'use strict'

// Pure-JS port of bedrock-native-math. Kept as a separate module (not inlined
// into bedrock-physics-engine.js) so it can be swapped back to the optimized
// native/wasm package with a one-line change.
//
// To switch back to bedrock-native-math:
//   1. `pnpm add bedrock-native-math` (and re-add the override/allowBuilds
//      entries in pnpm-workspace.yaml if pointing at a local checkout).
//   2. Replace the body of this file with: `module.exports = require('bedrock-native-math')`
//   3. (Optional) Delete sin-table.bin — only this fallback uses it.
//
// The exported surface (constants, sinTable, fround, moveRelative, applyFriction,
// moveAABBAxis, sinf, cosf, sincosf, movementSpeed, frictionInfluencedSpeed)
// matches bedrock-native-math exactly.

const f = Math.fround

const constants = {
  DEG_TO_RAD:  f(Math.PI / 180),
  BDS_EPSILON: f(1.1920928955078125e-7),
  GROUND_FRIC: f(0.6 * 0.91),
  AIR_FRIC_XZ: f(0.91),
  Y_DECAY:     f(0.98),
  GRAVITY:     f(0.08),
  LMV_DAMP:    f(0.98)
}

function sinf (deg) {
  return f(Math.sin(f(f(deg) * constants.DEG_TO_RAD)))
}

function cosf (deg) {
  return f(Math.cos(f(f(deg) * constants.DEG_TO_RAD)))
}

function sincosf (deg) {
  const angle = f(f(deg) * constants.DEG_TO_RAD)
  return { sin: f(Math.sin(angle)), cos: f(Math.cos(angle)) }
}

function moveRelative (vx, vy, vz, yawDeg, strafe, up, forward, speed) {
  let _vx = f(vx)
  let _vy = f(vy)
  let _vz = f(vz)
  const _s = f(strafe)
  const _u = f(up)
  const _fwd = f(forward)
  const _sp = f(speed)

  const distSq = f(f(_s * _s) + f(_u * _u + _fwd * _fwd))
  if (distSq < f(0.000099999997)) return { x: _vx, y: _vy, z: _vz }

  let dist = f(Math.sqrt(distSq))
  if (dist < 1) dist = 1
  const scale = f(_sp / dist)

  const angle = f(f(yawDeg) * constants.DEG_TO_RAD)
  const s = f(Math.sin(angle))
  const c = f(Math.cos(angle))

  const strafeS = f(_s * scale)
  const forwardS = f(_fwd * scale)

  _vy = f(_vy + f(_u * scale))
  _vx = f(_vx + f(f(strafeS * c) - f(forwardS * s)))
  _vz = f(_vz + f(f(forwardS * c) + f(strafeS * s)))
  return { x: _vx, y: _vy, z: _vz }
}

function applyFriction (v, k) {
  const _v = f(v)
  return Math.abs(_v) > constants.BDS_EPSILON ? f(_v * f(k)) : 0
}

function moveAABBAxis (min, max, vel) {
  return { min: f(f(min) + f(vel)), max: f(f(max) + f(vel)) }
}

// Sin table — bit-exact copy of BDS's precomputed table (sin-table.bin).
// Required for parity with recorded client traces; Math.sin diverges by ~1e-7
// per sample, which accumulates over thousands of ticks.
const MCE_SIN_TABLE = (() => {
  const path = require('path')
  const fs = require('fs')
  const buf = fs.readFileSync(path.join(__dirname, 'sin-table.bin'))
  return new Float32Array(buf.buffer, buf.byteOffset, 65536)
})()

function sinTable (i) { return MCE_SIN_TABLE[i & 0xFFFF] }

function fround (v) {
  return f(v)
}

const AIR_FRIC_XZ_F = f(0.91)
const GROUND_FRIC_F = f(0.546)
const SOUL_SAND_MUL_F = f(1.225)
const USING_ITEM_F = f(0.122499995)
const AIR_ACCEL_WALK_F = f(0.02)
const AIR_ACCEL_SPRINT_F = f(0.025999999)

function movementSpeed (value, speedLvl, slowLvl, freezeRatio) {
  const v = f(value)
  const factor = f(1 + f(f(0.2) * speedLvl) - f(f(0.15) * slowLvl))
  let speed = f(v * factor)
  if (freezeRatio > 0) {
    const fr = freezeRatio > 1 ? 1 : freezeRatio
    speed = f(speed * f(1 - f(f(0.05) * fr)))
  }
  return speed > 0 ? speed : 0
}

function frictionInfluencedSpeed (walkValue, speedLvl, slowLvl, freezeRatio,
                                  usingItem, sprintActive,
                                  isUnderWater, isInLava, swimSkipGravity,
                                  onGround, slipperiness, isSoulSand) {
  let base = movementSpeed(walkValue, speedLvl, slowLvl, freezeRatio)
  if (usingItem) base = f(base * USING_ITEM_F)
  if (sprintActive) base = f(base * f(1.3))
  if (isUnderWater || isInLava || swimSkipGravity) return AIR_ACCEL_WALK_F
  if (!onGround) return sprintActive ? AIR_ACCEL_SPRINT_F : AIR_ACCEL_WALK_F
  let slip = f(slipperiness)
  if (isSoulSand) slip = f(slip * SOUL_SAND_MUL_F)
  const fricConst = f(slip * AIR_FRIC_XZ_F)
  const ratio = f(GROUND_FRIC_F / fricConst)
  const ratio3 = f(f(ratio * ratio) * ratio)
  return f(ratio3 * base)
}

module.exports = {
  sinf,
  cosf,
  sincosf,
  moveRelative,
  applyFriction,
  moveAABBAxis,
  sinTable,
  fround,
  movementSpeed,
  frictionInfluencedSpeed,
  constants,
  __fallback: true,
  __impl: 'js-fallback'
}
