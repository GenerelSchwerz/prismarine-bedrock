const { Vec3 } = require('vec3')
const { AABB } = require('@nxg-org/mineflayer-util-plugin')
const native = require('./mce-math')
const { floorVec3, numberOrZero } = require('../../utils')
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
} = require('./pai-synth')

function normalizeControlsFromInputData (self, controls) {
  const inputData = typeof self.inputData === 'bigint' ? self.inputData : 0n
  const has = (bit) => (inputData & (1n << BigInt(bit))) !== 0n
  const pick = (...vals) => {
    for (const v of vals) if (v !== undefined) return !!v
    return false
  }
  return {
    forward: pick(controls.forward, has(PAI_BIT_Up)),
    back: pick(controls.back, has(PAI_BIT_Down)),
    left: pick(controls.left, has(PAI_BIT_Left)),
    right: pick(controls.right, has(PAI_BIT_Right)),
    jumpDown: pick(controls.jumpDown, controls.jump, has(PAI_BIT_JumpDown)),
    sneakDown: pick(controls.sneakDown, controls.sneak, has(PAI_BIT_SneakDown)),
    sprintDown: pick(controls.sprintDown, controls.sprint, has(PAI_BIT_SprintDown)),
    swimDown: pick(controls.swimDown, controls.swim),
    jumpPressed: pick(controls.jumpPressed, has(PAI_BIT_StartJumping)),
    jumpPressedRaw: pick(controls.jumpPressedRaw, has(PAI_BIT_JumpPressedRaw)),
    jumpReleasedRaw: pick(controls.jumpReleasedRaw, has(PAI_BIT_JumpReleasedRaw)),
    sneakPressedRaw: pick(controls.sneakPressedRaw, has(PAI_BIT_SneakPressedRaw)),
    sneakReleasedRaw: pick(controls.sneakReleasedRaw, has(PAI_BIT_SneakReleasedRaw)),
    stopSprinting: pick(controls.stopSprinting, has(PAI_BIT_StopSprinting)),
    moveVecX: controls.moveVecX,
    moveVecZ: controls.moveVecZ
  }
}

const DEFAULT_BLOCK_SHAPE = [[0, 0, 0, 1, 1, 1]]
const EMPTY_SHAPE = []
const COLLISION_EPSILON = 1e-7
const f = native.fround

const MCE_SIN_SCALE_DEG = f(182.04443)
const MCE_COS_OFFSET = 16384
const BDS_DEG_TO_INDEX = f(-182.04443)
const BDS_PITCH_TO_RAD = f(0.017453292)
const BDS_RAD_TO_INDEX = f(10430.378)
const GLIDE_DRAG_XZ = f(0.99000001)
const GLIDE_DRAG_Y = f(0.98000002)
const GLIDE_GRAVITY = f(-0.079999998)
const GLIDE_LIFT_GRAVITY = f(-0.059999999)
const GLIDE_SLOW_GRAVITY = f(-0.0099999998)
const GLIDE_SLOW_LIFT_GRAVITY = f(-0.0074999998)

function mceSinDeg (yawDeg) {
  return native.sinTable(f(yawDeg * MCE_SIN_SCALE_DEG) | 0)
}
function mceCosDeg (yawDeg) {
  return native.sinTable(f(yawDeg * MCE_SIN_SCALE_DEG + MCE_COS_OFFSET) | 0)
}

function bdsViewVector (yawDeg, pitchDeg) {
  const pitchIdx = f(pitchDeg * BDS_DEG_TO_INDEX)
  const yawIdx = f(yawDeg * BDS_DEG_TO_INDEX - 32768)
  const cosPitch = f(-native.sinTable((f(pitchIdx + 16384) | 0) & 0xFFFF))
  const sinPitch = native.sinTable((pitchIdx | 0) & 0xFFFF)
  const sinYaw = native.sinTable((yawIdx | 0) & 0xFFFF)
  const cosYaw = native.sinTable((f(yawIdx + 16384) | 0) & 0xFFFF)
  return { x: f(cosPitch * sinYaw), y: sinPitch, z: f(cosPitch * cosYaw) }
}

function glideMoveCompute (pitchDeg, view, hasSlowFalling, vel, fireworkBoost) {
  const velXin = vel.x
  const velZin = vel.z
  const v8 = view.z
  const v9 = view.x
  const v11 = f(pitchDeg * BDS_PITCH_TO_RAD)
  const v12 = f(Math.sqrt(f(f(v8 * v8) + f(v9 * v9))))
  const v13 = f(Math.sqrt(f(f(velXin * velXin) + f(velZin * velZin))))
  const cosIdx = (f(f(v11 * BDS_RAD_TO_INDEX) + 16384) | 0) & 0xFFFF
  const v14 = native.sinTable(cosIdx)
  const viewMagSqrt = f(Math.sqrt(f(f(f(view.y * view.y) + f(v9 * v9)) + f(v8 * v8))))
  const v16 = f(v14 * f(Math.min(f(viewMagSqrt * f(2.5)), f(1.0)) * v14))
  const v17 = hasSlowFalling ? GLIDE_SLOW_GRAVITY : GLIDE_GRAVITY
  const v18 = hasSlowFalling ? GLIDE_SLOW_LIFT_GRAVITY : GLIDE_LIFT_GRAVITY
  const v19 = f(vel.y - f(f(v18 * v16) - v17))
  let velX = velXin
  let velY = v19
  let velZ = velZin
  if (v19 < 0 && v12 > 0) {
    const v21 = f(f(v19 * f(-0.1)) * v16)
    const invH = f(f(1.0) / v12)
    const v22 = f(f(f(v8 * v21) * invH) + velZin)
    velX = f(f(f(v9 * v21) * invH) + velXin)
    const v23 = f(v21 + velY)
    velZ = v22
    velY = v23
  }
  let v24 = velX
  if (v11 < 0) {
    const sinIdx = (f(v11 * BDS_RAD_TO_INDEX) | 0) & 0xFFFF
    const sinPitch = native.sinTable(sinIdx)
    const diveAccel = f(f(v13 * sinPitch) * f(-0.039999999))
    const invH = f(f(1.0) / v12)
    v24 = f(v24 - f(f(diveAccel * v9) * invH))
    const v26 = f(diveAccel * v8)
    const v27 = f(f(diveAccel * f(3.2)) + velY)
    velX = v24
    velY = v27
    velZ = f(velZ - f(v26 * invH))
  }
  if (v12 > 0) {
    const invH = f(f(1.0) / v12)
    v24 = f(f(f(f(f(invH * v9) * v13) - v24) * f(0.1)) + v24)
    velZ = f(f(f(f(f(invH * v8) * v13) - velZ) * f(0.1)) + velZ)
  }
  if (fireworkBoost) {
    v24 = f(v24 + f(f(view.x * f(0.1)) + f(f(f(view.x * f(1.5)) - v24) * f(0.5))))
    velY = f(velY + f(f(view.y * f(0.1)) + f(f(f(view.y * f(1.5)) - velY) * f(0.5))))
    velZ = f(velZ + f(f(view.z * f(0.1)) + f(f(f(view.z * f(1.5)) - velZ) * f(0.5))))
  }
  velZ = f(velZ * GLIDE_DRAG_XZ)
  velX = f(v24 * GLIDE_DRAG_XZ)
  velY = f(velY * GLIDE_DRAG_Y)
  vel.x = velX
  vel.y = velY
  vel.z = velZ
}

const SEED_F32_BUF = new ArrayBuffer(4)
const SEED_F32_F = new Float32Array(SEED_F32_BUF)
const SEED_F32_I = new Int32Array(SEED_F32_BUF)
function nextUpF32 (x) { SEED_F32_F[0] = x; if (SEED_F32_F[0] >= 0) SEED_F32_I[0]++; else SEED_F32_I[0]--; return SEED_F32_F[0] }
function nextDownF32 (x) { SEED_F32_F[0] = x; if (SEED_F32_F[0] > 0) SEED_F32_I[0]--; else SEED_F32_I[0]++; return SEED_F32_F[0] }
function ulpShift (x, n) {
  if (n === 0) return x
  let v = x
  if (n > 0) for (let i = 0; i < n; i++) v = nextUpF32(v)
  else for (let i = 0; i < -n; i++) v = nextDownF32(v)
  return v
}

function searchAabbSeedAxis (pos0, posAt, vAt, halfW) {
  const pos0_f = f(pos0)
  const minSym = f(pos0_f - halfW)
  const maxSym = f(pos0_f + halfW)
  const posAtF = posAt.map(p => f(p))
  const vAtF = vAt.map(v => f(v || 0))
  let bestDepth = -1
  let best = { min: minSym, max: maxSym }
  for (let R = 0; R <= 8; R++) {
    for (let dm = -R; dm <= R; dm++) {
      for (let dx = -R; dx <= R; dx++) {
        if (Math.max(Math.abs(dm), Math.abs(dx)) !== R) continue
        const m = ulpShift(minSym, dm)
        const x = ulpShift(maxSym, dx)
        if (f((m + x) * 0.5) !== pos0_f) continue
        let cm = m, cx = x, depth = 0
        for (let i = 0; i < posAtF.length; i++) {
          cm = f(cm + vAtF[i])
          cx = f(cx + vAtF[i])
          if (f((cm + cx) * 0.5) !== posAtF[i]) break
          depth++
        }
        if (depth > bestDepth) { bestDepth = depth; best = { min: m, max: x } }
        if (depth === posAtF.length) return best
      }
    }
  }
  return best
}

function searchAabbSeedY (pos0, eyeHeight, eyeAt, vAt) {
  const pos0_f = f(pos0)
  const eyeAtF = eyeAt.map(p => f(p))
  const vAtF = vAt.map(v => f(v || 0))
  let bestDepth = -1
  let bestMinY = pos0_f
  for (let R = 0; R <= 8; R++) {
    for (let d = -R; d <= R; d++) {
      if (Math.abs(d) !== R) continue
      const m = ulpShift(pos0_f, d)
      if (f(m + eyeHeight) !== f(pos0_f + eyeHeight)) continue
      let cm = m, depth = 0
      for (let i = 0; i < eyeAtF.length; i++) {
        cm = f(cm + vAtF[i])
        if (f(cm + eyeHeight) !== eyeAtF[i]) break
        depth++
      }
      if (depth > bestDepth) { bestDepth = depth; bestMinY = m }
      if (depth === eyeAtF.length) return bestMinY
    }
  }
  return bestMinY
}

function seedMergePAI (current, diff) {
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

function seedFromPAI (self, frame0Pai, nextFrames, world, C, options = {}) {
  const initialSprintHint = !!options.initialSprintHint
  const aabbOverride = options.aabbOverride || null
  const skipAabb = !!options.skipAabb
  const initialTicksFrozen = Number.isFinite(options.initialTicksFrozen) ? options.initialTicksFrozen : null
  const initialFreezeRatio = Number.isFinite(options.initialFreezeRatio) ? options.initialFreezeRatio : null
  const initialWalkAttribute = Number.isFinite(options.initialWalkAttribute) ? options.initialWalkAttribute : null
  const pai = frame0Pai
  self.position.x = pai.position.x
  self.position.y = pai.position.y - C.EYE_HEIGHT
  self.position.z = pai.position.z
  self.velocity.x = f(pai.delta?.x ?? 0)
  self.velocity.y = f(pai.delta?.y ?? 0)
  self.velocity.z = f(pai.delta?.z ?? 0)
  if (pai.yaw != null) self.yaw = pai.yaw
  if (pai.pitch != null) self.pitch = pai.pitch
  self.onGround = !!pai.inputs?.verticalCollision
  self._sprintActive = !!pai.inputs?.sprinting || initialSprintHint
  const seedFallSprint = !pai.inputs?.verticalCollision && (pai.delta?.y ?? 0) < -0.15 && !!pai.inputs?.up && (pai.moveVector?.z ?? 0) >= 0.70710677 && !pai.inputs?.sneaking
  self._sprintAdfFlag = initialSprintHint || seedFallSprint || (!!pai.inputs?.sprinting && (!!pai.inputs?.up || (pai.moveVector?.z ?? 0) >= 0.70710677))
  if (initialSprintHint) self._sprintForSpeed = true
  self._flagSneaking = !!pai.inputs?.sneaking
  self.sprinting = !!pai.inputs?.sprinting
  self.sneaking = !!pai.inputs?.sneaking
  self._prevSneakDown = !!pai.inputs?.sneakDown
  self._prevSprintDown = !!pai.inputs?.sprintDown
  self._prevJumpDown = !!pai.inputs?.jumping
  self._flagSneakingPrev = !!pai.inputs?.sneaking
  self._flagSprintingPrev = !!pai.inputs?.sprinting
  self._flagSwimmingPrev = !!pai.inputs?.swimming
  self._flagGlidingPrev = !!pai.inputs?.gliding
  const eyeBlk = getBlock(world, new Vec3(pai.position.x, Math.floor(pai.position.y), pai.position.z))
  self.swimAmount = (eyeBlk && eyeBlk.name && eyeBlk.name.includes('water')) ? 1 : 0
  const feetBlk = getBlock(world, new Vec3(pai.position.x, Math.floor(pai.position.y - C.EYE_HEIGHT), pai.position.z))
  const feetInWater = !!(feetBlk && feetBlk.name && feetBlk.name.includes('water'))
  const innerMinY = pai.position.y - C.EYE_HEIGHT + 0.401
  const innerBlk = getBlock(world, new Vec3(pai.position.x, Math.floor(innerMinY), pai.position.z))
  const innerInWater = !!(innerBlk && innerBlk.name && (innerBlk.name.includes('water') || innerBlk.name === 'bubble_column'))
  self._flagSwimming = !!pai.inputs?.swimming || (!!pai.inputs?.sprinting && feetInWater && (pai.delta?.y ?? 0) >= 0)
  self._flagSwimmingPrev = self._flagSwimming
  self._wasInWaterPrev = innerInWater
  self._wasInWaterTick = innerInWater

  const halfW = f(self.halfWidth)
  const height = f(self.height)
  const eyeH = f(C.EYE_HEIGHT)
  const px = f(self.position.x)
  const py = f(self.position.y)
  const pz = f(self.position.z)
  if (!skipAabb && aabbOverride) {
    self._aabb = {
      minX: aabbOverride.minX, minY: aabbOverride.minY, minZ: aabbOverride.minZ,
      maxX: aabbOverride.maxX, maxY: f(aabbOverride.minY + height), maxZ: aabbOverride.maxZ
    }
    self.position.y = aabbOverride.minY
  } else if (!skipAabb) {
    const upcoming = Array.isArray(nextFrames) ? nextFrames : (nextFrames ? [nextFrames] : [])
    let merged = pai
    const posAtX = []
    const posAtY = []
    const posAtZ = []
    const vAtX = [f(pai.delta?.x ?? 0)]
    const vAtY = [f(pai.delta?.y ?? 0)]
    const vAtZ = [f(pai.delta?.z ?? 0)]
    for (const nt of upcoming) {
      merged = seedMergePAI(merged, nt)
      posAtX.push(f(merged.position?.x ?? 0))
      posAtY.push(f(merged.position?.y ?? 0))
      posAtZ.push(f(merged.position?.z ?? 0))
      vAtX.push(f(merged.delta?.x ?? 0))
      vAtY.push(f(merged.delta?.y ?? 0))
      vAtZ.push(f(merged.delta?.z ?? 0))
    }
    vAtX.pop(); vAtY.pop(); vAtZ.pop()
    const sx = searchAabbSeedAxis(px, posAtX, vAtX, halfW)
    const sz = searchAabbSeedAxis(pz, posAtZ, vAtZ, halfW)
    const minY = searchAabbSeedY(py, eyeH, posAtY, vAtY)
    self._aabb = {
      minX: sx.min, minY, minZ: sz.min,
      maxX: sx.max, maxY: f(minY + height), maxZ: sz.max
    }
    self.position.y = minY
  }
  if (!skipAabb) {
    self._aabbAnchorX = self.position.x
    self._aabbAnchorY = self.position.y
    self._aabbAnchorZ = self.position.z
  }

  if (self.inputState && self.inputState.prevButtons) {
    const inp = pai.inputs || {}
    self.inputState.prevButtons.forward = !!inp.up
    self.inputState.prevButtons.back = !!inp.down
    self.inputState.prevButtons.left = !!inp.left
    self.inputState.prevButtons.right = !!inp.right
    self.inputState.prevButtons.sprint = !!inp.sprintDown
    if (!self.inputState.prevButtons.jump) self.inputState.prevButtons.jump = { current: false }
    if (!self.inputState.prevButtons.sneak) self.inputState.prevButtons.sneak = { current: false }
    self.inputState.prevButtons.jump.current = !!inp.jumping
    self.inputState.prevButtons.sneak.current = !!inp.sneakDown
  }

  if (initialTicksFrozen != null) {
    self._ticksFrozen = Math.max(0, Math.min(140, Math.round(initialTicksFrozen)))
    self._freezeRatio = self._ticksFrozen / 140
  }
  if (initialFreezeRatio != null) {
    self._freezeRatio = Math.max(0, Math.min(1, initialFreezeRatio))
  }
  if (initialWalkAttribute != null) {
    if (!self.attributes) self.attributes = {}
    self.attributes['minecraft:movement_speed'] = { value: f(initialWalkAttribute) }
  }
}

function createBedrockPhysicsEngine (options = {}) {
  const stepHeight = options.stepHeight ?? 0.6

  function simulateSelf (botState, controls, world, C) {
    const self = botState.self
    if (!self) throw new Error('[physics] Cannot simulate without botState.self being set')
    controls = normalizeControlsFromInputData(self, controls)

    const tickStartPos = { x: self.position.x, y: self.position.y, z: self.position.z }
    const prevSneakDown = !!self._prevSneakDown
    const prevSprintDown = !!self._prevSprintDown
    const prevJumpDown = !!self._prevJumpDown
    const sneakPressed = !!controls.sneakDown && !prevSneakDown
    const sneakReleased = !controls.sneakDown && prevSneakDown
    const sprintReleased = !controls.sprintDown && prevSprintDown
    const jumpPressed = !!controls.jumpPressed
    const jumpTrigger = !!controls.jumpPressed
    self._prevSneakDown = !!controls.sneakDown
    self._prevSprintDown = !!controls.sprintDown
    self._prevJumpDown = !!controls.jumpDown
    if (typeof self._noJumpDelay !== 'number') self._noJumpDelay = 0
    if (self._noJumpDelay > 0) self._noJumpDelay -= 1
    if (!controls.jumpDown) self._noJumpDelay = 0

    if (sneakPressed) self._flagSneaking = true
    if (sneakReleased) self._flagSneaking = false
    self.sneaking = !!self._flagSneaking

    const externallyMoved = self._aabb && (
      self.position.x !== self._aabbAnchorX ||
      self.position.y !== self._aabbAnchorY ||
      self.position.z !== self._aabbAnchorZ
    )
    const preMoveAABB = externallyMoved ? { ...self._aabb } : null
    if (externallyMoved) { self._freezeRatio = 0; self._ticksFrozen = 0 }
    if (jumpPressed && externallyMoved) {
      const belowName = getBlock(world, new Vec3(self.position.x, self.position.y - 0.1, self.position.z))?.name || ''
      if (belowName === 'honey_block' || belowName === 'slime' || belowName === 'slime_block') {
        self.onGround = false
        self.lastOnGround = false
      }
    } else if (externallyMoved && self.lastOnGround === false) {
      self.onGround = false
    } else if (externallyMoved && self.velocity.x === 0 && self.velocity.y === 0 && self.velocity.z === 0 && !!self._sprintAdfFlag) {
      self.onGround = false
      self.lastOnGround = false
    }

    ensureSelfShape(self, C)

    // BDS reads block-below-foot ONCE at the start of the tick and stores
    // friction on MobTravelComponent. Both the speed calc (this tick) and
    // the friction-drag (this tick, AFTER move) read that cached value —
    // so a player who jumps off honey mid-tick still gets honey friction
    // applied to xz drag at end of tick (not air friction).
    const groundBlock = getBlock(world, new Vec3(self.position.x, self.position.y - 0.1, self.position.z))
    self._tickGroundBlock = groundBlock
    self.groundSlipperiness = getBlockFriction(groundBlock, C)

    const feetBlock = getBlock(world, self.position)
    const feetName = feetBlock?.name || ''
    const wasInWaterForSprint = !!self._wasInWaterTick
    const feetIsWater = feetName.includes('water') || feetName === 'bubble_column'
    self.touchingWater = liquidInInnerAABB(self, world, 'water') || (self._flagSwimming && feetIsWater)
    self.isInWater = self.touchingWater
    self.isUnderWater = self.touchingWater
    self.inLava = liquidInInnerAABB(self, world, 'lava')
    self.isInLava = self.inLava
    self._wasInWaterPrev = wasInWaterForSprint
    self._wasInWaterTick = !!self.isInWater
    if (self.isInWater && !self.flying) applyWaterFlowImpulse(self, world)

    // SwimAmount tracking — BDS's ticks 0.1 toward 1 when the player's head is in water, toward 0 otherwise.
    // if 0 < swim < 1, write vel.y = 0 AND skip PlayerWaterGravity for this tick.
    const standingEyeY = self.position.y + (self.eyeHeight || 1.62)
    const eyeYProbe = self._flagSwimming ? (self.position.y + 0.4) : standingEyeY
    const eyeBlk = getBlock(world, new Vec3(self.position.x, Math.floor(eyeYProbe), self.position.z))
    const eyeInWater = !!(eyeBlk && eyeBlk.name && (eyeBlk.name.includes('water') || eyeBlk.name === 'bubble_column'))
    const feetBlk2 = getBlock(world, new Vec3(self.position.x, Math.floor(self.position.y), self.position.z))
    const feetInWater = !!(feetBlk2 && feetBlk2.name && (feetBlk2.name.includes('water') || feetBlk2.name === 'bubble_column'))
    if (typeof self.swimAmount !== 'number') self.swimAmount = eyeInWater ? 1 : 0
    else if (eyeInWater) self.swimAmount = Math.min(1, f(self.swimAmount + 0.1))
    else if (!feetInWater) self.swimAmount = Math.max(0, f(self.swimAmount - 0.1))
    self.swimTransitioning = self.swimAmount > 0 && self.swimAmount < 1
    self._headInWaterOrBubble = eyeInWater
    self._feetInWaterOrBubble = feetInWater

    const movingForward = (controls.forward === true) || (typeof controls.moveVecZ === 'number' && controls.moveVecZ > 0)
    const sprintInputHeld = !!controls.sprintDown
    if (!sprintInputHeld) self._sprintCancelled = false
    const SPRINT_GATE = f(0.70710677)
    const forwardSigned = (typeof controls.moveVecZ === 'number')
      ? controls.moveVecZ
      : (controls.forward ? 1 : (controls.back ? -1 : 0))
    const strafeSigned = (typeof controls.moveVecX === 'number')
      ? controls.moveVecX
      : (controls.left ? 1 : (controls.right ? -1 : 0))
    const meetsSprintGate = forwardSigned >= SPRINT_GATE
    const stopSprint = !!controls.stopSprinting
    self.sprinting = sprintInputHeld && !self.sneaking
    const adfWas = !!self._sprintAdfFlag
    const obstructionEpsilon = f(0.000049999999)
    const lastReq = self._lastReqMove
    const lastPos = self._lastTickStartPos
    let obstructed = false
    if (lastReq && lastPos) {
      const ldx = Math.abs(f(lastReq.x))
      const ldz = Math.abs(f(lastReq.z))
      if (ldz > ldx) {
        obstructed = Math.abs(f(f(self.position.z) - f(lastPos.z))) < obstructionEpsilon
      } else if (ldx > ldz) {
        obstructed = Math.abs(f(f(self.position.x) - f(lastPos.x))) < obstructionEpsilon
      }
    }
    const sprintStartFires = !adfWas && meetsSprintGate && sprintInputHeld && !self.sneaking
    const adfAfterStart = adfWas || sprintStartFires
    const moveMag = Math.hypot(forwardSigned, strafeSigned)
    const sprintShouldStop = moveMag < SPRINT_GATE || forwardSigned <= 0 || Math.abs(strafeSigned) > SPRINT_GATE || self.sneaking || obstructed || stopSprint
    const wasInWaterPrev = !!self._wasInWaterPrev
    const swimmingPrev = !!self._flagSwimming
    const jumpingNow = !!controls.jumpPressed
    let keepSprinting = true
    if (swimmingPrev) keepSprinting = wasInWaterPrev || !!self.touchingWater
    else if ((wasInWaterPrev && jumpingNow) || sprintShouldStop) keepSprinting = false
    const sprintStopFires = adfAfterStart && !keepSprinting
    self._sprintAdfFlag = adfAfterStart && !sprintStopFires
    self._sprintStartEdge = sprintStartFires
    self._sprintStopEdge = sprintStopFires
    if (typeof self._sprintForSpeed !== 'boolean') self._sprintForSpeed = (sprintInputHeld || (!self.onGround && self.velocity.y < f(-0.15))) && movingForward && meetsSprintGate && !self.sneaking
    if (swimmingPrev && wasInWaterPrev && adfAfterStart) {
      self._sprintForSpeed = true
    } else if (!movingForward || !meetsSprintGate || self.sneaking || stopSprint) {
      self._sprintForSpeed = false
      if (!movingForward || self.sneaking) self._sprintCancelled = false
    } else if (sprintInputHeld && !self._sprintCancelled) {
      self._sprintForSpeed = true
    } else if (self._sprintCancelled) {
      self._sprintForSpeed = false
    }
    self._sprintActive = self.sprinting

    const wasSwimmingPrev = !!self._flagSwimming
    const view = bdsViewVector(self.yaw || 0, self.pitch || 0)
    const swimStopMag2 = (typeof controls.moveVecX === 'number' || typeof controls.moveVecZ === 'number')
      ? (controls.moveVecX || 0) * (controls.moveVecX || 0) + (controls.moveVecZ || 0) * (controls.moveVecZ || 0)
      : ((controls.forward || controls.back) ? 1 : 0) + ((controls.left || controls.right) ? 1 : 0)
    const angleHsq = view.x * view.x + view.z * view.z
    const headInAir = !eyeInWater
    const sprintEdge = self.sprinting && !self._flagSprintingPrev
    let swimPoseTouchingWater = self.touchingWater
    if (wasSwimmingPrev && !swimPoseTouchingWater) {
      const yMid = Math.floor(self.position.y + 0.3)
      const swimBlk = getBlock(world, new Vec3(self.position.x, yMid, self.position.z))
      swimPoseTouchingWater = !!(swimBlk && swimBlk.name && (swimBlk.name.includes('water') || swimBlk.name === 'bubble_column'))
    }
    const swimStartCond = !wasSwimmingPrev && sprintEdge && self.touchingWater && eyeInWater && !controls.jumpDown && !self.sneaking && (view.y < 0.15)
    const standClear = !unblockedToStandBlocked(self, world)
    const swimStopCond = wasSwimmingPrev && standClear && (
      swimStopMag2 < 0.5 ||
      self.sneaking ||
      !swimPoseTouchingWater ||
      (headInAir && angleHsq < Math.cos(45 * Math.PI / 180) && view.y > 0)
    )
    if (swimStartCond) self._flagSwimming = true
    if (swimStopCond) self._flagSwimming = false
    self.swimming = !!self._flagSwimming
    if (wasSwimmingPrev && !self._flagSwimming) self._bdsResyncSwimPending = true
    else if (self._flagSwimming) self._bdsResyncSwimPending = false

    if (typeof self._bdsSwimAmt !== 'number') self._bdsSwimAmt = self._flagSwimming ? 1 : 0
    const bdsSwimAmtAtRead = self._bdsSwimAmt
    if (self._flagSwimming) self._bdsSwimAmt = Math.min(1, f(self._bdsSwimAmt + 0.1))
    else if (self.touchingWater) self._bdsSwimAmt = Math.max(0, f(self._bdsSwimAmt - 0.1))
    const bdsSwimCancel = bdsSwimAmtAtRead > 0.15 && bdsSwimAmtAtRead < 1 && self.touchingWater && !eyeInWater
    self._bdsSwimCancel = bdsSwimCancel
    self._bdsResyncStopSwim = false
    if (bdsSwimCancel && self._bdsResyncSwimPending && standClear) {
      self._bdsResyncStopSwim = true
      self._bdsResyncSwimPending = false
    }

    const startedOnGround = !!self.onGround
    const previousVelocity = self.velocity.clone()
    const input = getLocalInput(controls, self.sneaking)
    let velocity = self.velocity.clone()

    const climbableType = getClimbableType(self, world)
    self.scaffoldDescend = false
    if (climbableType === 'scaffolding') {
      if (self.sneaking) {
        velocity.y = f(-SCAFFOLDING_CLIMB_SPEED)
        self.scaffoldDescend = true
      } else if (!controls.jumpDown && velocity.y < 0) {
        const cellY = Math.floor(self.position.y)
        const platformBottom = cellY + 0.875
        if (self.position.y > platformBottom && self.position.y < cellY + 1) {
          const cellAbove = getBlock(world, new Vec3(self.position.x, cellY + 1, self.position.z))
          if (cellAbove?.name !== 'scaffolding') {
            velocity.y = 0
          }
        }
      }
    }
    if (climbableType) {
      const cs = f(getClimbSpeed(climbableType))
      if (climbableType !== 'scaffolding' && self.sneaking && velocity.y < 0) {
        velocity.y = 0
      }
      if (climbableType !== 'scaffolding' && velocity.y < -cs) velocity.y = f(-cs)
      const climbViaInput = (input.x !== 0 || input.z !== 0) && self.horizontalCollision
      const climbViaJump = controls.jumpDown
      const scaffoldExiting = climbableType === 'scaffolding' && isExitingScaffoldingHorizontally(self, velocity, world)
      if (!scaffoldExiting && (climbViaInput || climbViaJump || self._wasClimbingViaInput)) {
        velocity.y = cs
      }
      self._wasClimbingViaInput = climbableType !== 'scaffolding' && climbViaInput
    } else {
      self._wasClimbingViaInput = false
    }

    const isGliding = !!self.gliding && !self.onGround && !self.isInWater && !self.isInLava && !climbableType
    if (isGliding) {
      glideMoveCompute(self.pitch || 0, bdsViewVector(self.yaw || 0, self.pitch || 0), getEffectLevel(self, 'slowFalling', 28) > 0, velocity, !!self.fireworkBoost)
    } else {
      velocity = applyJump(self, controls, input, velocity, C, world, climbableType, jumpTrigger)
      velocity = applyRelativeMovement(self, input, velocity, C)
      if (self._flagSwimming && self.isUnderWater && !controls.jumpDown) {
        const rate = view.y < f(-0.2) ? f(0.085) : f(0.06)
        const doLerp = view.y <= 0 || self._headInWaterOrBubble
        if (doLerp) velocity.y = f(velocity.y + f(f(view.y - velocity.y) * rate))
        else velocity.y = 0
      }
    }

    const cobwebMul = (cobwebInInnerAABB(self, world) || (preMoveAABB && cobwebInAABB(preMoveAABB, world))) ? COBWEB_MUL : null
    if (cobwebMul) {
      velocity.x = f(velocity.x * cobwebMul.x)
      velocity.y = f(velocity.y * cobwebMul.y)
      velocity.z = f(velocity.z * cobwebMul.z)
    }

    const powderSnowPending = self._powderSnowSlowdownPending !== undefined
      ? self._powderSnowSlowdownPending
      : powderSnowInInnerAABB(self, world)
    if (powderSnowPending) {
      velocity.x = f(velocity.x * POWDER_SNOW_MUL.x)
      velocity.y = f(velocity.y * POWDER_SNOW_MUL.y)
      velocity.z = f(velocity.z * POWDER_SNOW_MUL.z)
    }

    const berryBushPending = self._berryBushSlowdownPending !== undefined
      ? self._berryBushSlowdownPending
      : berryBushInInnerAABB(self, world)
    if (berryBushPending) {
      velocity.x = f(velocity.x * BERRY_BUSH_MUL.x)
      velocity.y = f(velocity.y * BERRY_BUSH_MUL.y)
      velocity.z = f(velocity.z * BERRY_BUSH_MUL.z)
    }

    const requestedMove = velocity.clone()
    applySneakEdgeClamp(self, requestedMove, velocity, controls, world, startedOnGround)
    const preMoveFeetY = self.position.y
    const collision = moveWithCollisions(self, requestedMove, world, stepHeight)

    const aabb = self._aabb
    if (collision.movement.x !== 0) {
      aabb.minX = f(aabb.minX + collision.movement.x)
      aabb.maxX = f(aabb.maxX + collision.movement.x)
      self.position.x = f((aabb.minX + aabb.maxX) * 0.5)
      self._aabbAnchorX = self.position.x
    }
    if (collision.movement.y !== 0) {
      aabb.minY = f(aabb.minY + collision.movement.y)
      aabb.maxY = f(aabb.maxY + collision.movement.y)
      self.position.y = aabb.minY
      self._aabbAnchorY = self.position.y
    }
    if (collision.movement.z !== 0) {
      aabb.minZ = f(aabb.minZ + collision.movement.z)
      aabb.maxZ = f(aabb.maxZ + collision.movement.z)
      self.position.z = f((aabb.minZ + aabb.maxZ) * 0.5)
      self._aabbAnchorZ = self.position.z
    }
    self.velocity = velocity
    const xCollided = collision.movement.x !== requestedMove.x
    const zCollided = collision.movement.z !== requestedMove.z
    if (xCollided) self.velocity.x = 0
    if (zCollided) self.velocity.z = 0

    if (!collision.verticalCollision && requestedMove.y < 0 && !controls.jumpDown && !self.sneaking) {
      const candidate = Math.floor(preMoveFeetY + 1e-5)
      if (candidate > self.position.y && candidate <= preMoveFeetY + 1e-5) {
        const blockBelow = getBlock(world, new Vec3(self.position.x, candidate - 1, self.position.z))
        if (blockBelow?.name === 'scaffolding') {
          let shouldCatch = candidate < preMoveFeetY
          if (!shouldCatch) {
            const blockTwoBelow = getBlock(world, new Vec3(self.position.x, candidate - 2, self.position.z))
            shouldCatch = blockTwoBelow?.name !== 'scaffolding' || startedOnGround
          }
          if (shouldCatch) {
            const topY = f(candidate)
            aabb.minY = topY
            aabb.maxY = f(topY + f(self.height))
            self.position.y = topY
            self._aabbAnchorY = topY
            collision.verticalCollision = true
          }
        }
      }
    }
    if (collision.verticalCollision) self.velocity.y = 0

    // when a downward vertical collision lands on slime,
    // write `mValue = (0, -orig_vy, 0)` and add it to vel.
    // Net effect: vel.y becomes -orig_vy (full rebound, sign flipped). 
    if (collision.verticalCollision && requestedMove.y < 0 && !self.sneaking) {
      const landingBlock = getBlock(world, self.position.offset(0, -0.1, 0))
      const landName = landingBlock?.name || ''
      if (landName === 'slime' || landName === 'slime_block') {
        self.velocity.y = f(-requestedMove.y)
      }
    }

    self.horizontalCollision = xCollided || zCollided
    self.verticalCollision = collision.verticalCollision
    self.isCollidedHorizontally = self.horizontalCollision
    self.isCollidedVertically = collision.verticalCollision

    // Canonical Bedrock onGround rule:
    // v_collision ? (pre_collision_dy < 0) : (was_on_ground && pre_collision_dy == 0)
    // Both clauses matter: the first catches landings, the second carries
    // onGround through horizontal-only walking ticks where requestedMove.y is
    // exactly 0 (because gravity hasn't been applied yet — that happens at
    // the end of the tick in applyPostMoveVelocity).
    self.onGround = collision.verticalCollision
      ? requestedMove.y < 0
      : (startedOnGround && requestedMove.y === 0)
    self.lastOnGround = startedOnGround
    self.supportingBlockPos = self.onGround ? floorVec3(self.position.offset(0, -0.1, 0)) : null

    if (cobwebMul) {
      velocity.x = 0
      velocity.y = 0
      velocity.z = 0
    }
    if (powderSnowPending) {
      velocity.x = 0
      velocity.y = 0
      velocity.z = 0
    }
    if (berryBushPending) {
      velocity.x = 0
      velocity.y = 0
      velocity.z = 0
    }

    if (!isGliding) applyPostMoveVelocity(self, velocity, world, C)
    applyClimbImpulse(self, velocity, controls, input, world)
    applyBubbleColumn(self, velocity, world)
    updateFluidAndClimbableState(self, world)

    self._powderSnowSlowdownPending = powderSnowInInnerAABB(self, world)
    self._berryBushSlowdownPending = berryBushInInnerAABB(self, world)
    const prevFreeze = Number(self._freezeRatio) || 0
    if (powderSnowPending) self._freezeRatio = Math.min(1, prevFreeze + (1 / 10))
    else self._freezeRatio = Math.max(0, prevFreeze - (1 / 10))
    self.prevVelocity = previousVelocity
    self._hColPrev2 = !!self._hColPrev
    self._hColPrev = !!self.horizontalCollision
    self._lastReqMove = { x: requestedMove.x, z: requestedMove.z }
    self._lastTickStartPos = tickStartPos

    computeInputFlags(self, controls, prevSneakDown, prevSprintDown, prevJumpDown)

    return {
      position: self.position,
      velocity: self.velocity,
      requestedMove,
      appliedMove: collision.movement,
      onGround: self.onGround,
      horizontalCollision: self.horizontalCollision,
      verticalCollision: self.verticalCollision
    }
  }

  return { simulateSelf }
}

function ensureSelfShape (self, C) {
  if (!(self.position instanceof Vec3)) self.position = new Vec3(0, 0, 0)
  if (!(self.velocity instanceof Vec3)) self.velocity = new Vec3(0, 0, 0)
  self.width = numberOrZero(self.width) || C.PLAYER_WIDTH
  self.halfWidth = self.width / 2
  if (typeof self.onGround !== 'boolean') self.onGround = false

  const desiredHeight = self.sneaking ? C.SNEAK_HEIGHT : (numberOrZero(self._standingHeight) || C.PLAYER_HEIGHT)
  if (!self._standingHeight) self._standingHeight = C.PLAYER_HEIGHT

  const externallyMoved =
    !self._aabb ||
    self.position.x !== self._aabbAnchorX ||
    self.position.y !== self._aabbAnchorY ||
    self.position.z !== self._aabbAnchorZ
  if (externallyMoved) {
    self.height = desiredHeight
    const halfW = f(self.halfWidth)
    const height = f(self.height)
    const px = f(self.position.x)
    const py = f(self.position.y)
    const pz = f(self.position.z)
    self._aabb = {
      minX: f(px - halfW), minY: py, minZ: f(pz - halfW),
      maxX: f(px + halfW), maxY: f(py + height), maxZ: f(pz + halfW)
    }
    self._aabbAnchorX = self.position.x
    self._aabbAnchorY = self.position.y
    self._aabbAnchorZ = self.position.z
    self._lastSneaking = !!self.sneaking
  } else if (self.height !== desiredHeight) {
    const halfW = f(self.halfWidth)
    const aabb = self._aabb
    const center_x = f((aabb.minX + aabb.maxX) * 0.5)
    const center_z = f((aabb.minZ + aabb.maxZ) * 0.5)
    aabb.minX = f(center_x - halfW)
    aabb.maxX = f(center_x + halfW)
    aabb.minZ = f(center_z - halfW)
    aabb.maxZ = f(center_z + halfW)
    aabb.maxY = f(aabb.minY + f(desiredHeight))
    self.height = desiredHeight
    self.position.x = f((aabb.minX + aabb.maxX) * 0.5)
    self.position.z = f((aabb.minZ + aabb.maxZ) * 0.5)
    self._aabbAnchorX = self.position.x
    self._aabbAnchorZ = self.position.z
    self._lastSneaking = !!self.sneaking
  }
}

// Bedrock damps LocalMoveVelocity by 0.98 each tick before it is used by move_relative.
// Without this factor the engine over-accelerates by ~2% per tick on flat ground.
const LOCAL_MOVE_DAMP = f(0.98)
const BDS_SNEAK_SCALE = f(0.30000001)

function getLocalInput (controls, sneaking) {
  let x, z
  let sneakBaked = false
  if (typeof controls.moveVecZ === 'number' || typeof controls.moveVecX === 'number') {
    x = controls.moveVecX || 0
    z = controls.moveVecZ || 0
    sneakBaked = true
  } else {
    x = 0
    z = 0
    if (controls.left) x += 1
    if (controls.right) x -= 1
    if (controls.forward) z += 1
    if (controls.back) z -= 1
    const length = Math.hypot(x, z)
    if (length > 1) {
      x /= length
      z /= length
    }
  }

  if (sneaking && !sneakBaked) {
    x = f(x * BDS_SNEAK_SCALE)
    z = f(z * BDS_SNEAK_SCALE)
  }

  return { x: f(x * LOCAL_MOVE_DAMP), z: f(z * LOCAL_MOVE_DAMP) }
}

const JUMP_REDUCE_SLIP = f(0.60000002)
const JUMP_REDUCING_NAMES = new Set(['honey_block', 'ladder', 'vine', 'cave_vines', 'twisting_vines', 'weeping_vines'])

function isJumpReducingBlock (block) {
  if (!block) return false
  return JUMP_REDUCING_NAMES.has(block.name)
}

function applyJump (self, controls, input, velocity, C, world, climbableType, jumpTrigger) {
  const jumpDown = !!controls.jumpDown
  const sneaking = !!self.sneaking
  if (self.swimTransitioning && jumpDown) {
    velocity.y = 0
    self._swimSkipGravity = true
    return velocity
  }
  if (jumpDown && self._flagSwimming && !self._headInWaterOrBubble) {
    velocity.y = 0
    self._swimSkipGravity = true
    return velocity
  }
  self._swimSkipGravity = false
  if (self.isUnderWater) {
    if (self._bdsSwimCancel) {
      velocity.y = 0
      return velocity
    }
    if (sneaking) velocity.y = f(velocity.y - f(C.FLUID_BUOYANCY_Y))
    if (jumpDown) velocity.y = f(velocity.y + f(C.FLUID_BUOYANCY_Y))
    return velocity
  }
  if (self.isInLava) {
    if (jumpDown && !sneaking) {
      velocity.y = f(velocity.y + f(C.FLUID_BUOYANCY_Y))
    } else if (sneaking && !jumpDown) {
      velocity.y = f(velocity.y - f(C.FLUID_BUOYANCY_Y))
    }
    return velocity
  }
  if (jumpTrigger) {
    if (self.touchingWater || self.isInWater || self.inLava || self.isInLava) {
      velocity.y = f(velocity.y + f(C.FLUID_BUOYANCY_Y))
    } else if (climbableType) {
      const climbY = f(getClimbSpeed(climbableType))
      if (velocity.y < climbY) velocity.y = climbY
    } else if (self.onGround && self._noJumpDelay === 0) {
      const footBlock = world ? getBlock(world, self.position) : null
      const belowFootBlock = world ? getBlock(world, self.position.offset(0, -1, 0)) : null
      const slip = (isJumpReducingBlock(footBlock) || isJumpReducingBlock(belowFootBlock)) ? JUMP_REDUCE_SLIP : 1
      const jumpY = f(f(f(C.JUMP_VELOCITY) + getJumpBoost(self)) * slip)
      velocity.y = Math.max(jumpY, velocity.y)
      self._noJumpDelay = 10
      if (self._sprintForSpeed && input.z > 0) {
        const yaw = self.yaw || 0
        const boost = f(C.SPRINT_JUMP_BOOST)
        velocity.x = f(velocity.x - f(mceSinDeg(yaw) * boost))
        velocity.z = f(velocity.z + f(mceCosDeg(yaw) * boost))
      }
    }
  }

  return velocity
}

function applyRelativeMovement (self, input, velocity, C) {
  if (input.x === 0 && input.z === 0) return velocity

  const speed = getFrictionInfluencedSpeed(self, C)
  const r = native.moveRelative(velocity.x, velocity.y, velocity.z, self.yaw || 0, input.x, 0, input.z, speed)
  velocity.x = r.x
  velocity.y = r.y
  velocity.z = r.z

  return velocity
}

function getFrictionInfluencedSpeed (self, C) {
  const attr =
    self.attributes?.['minecraft:movement_speed'] ||
    self.attributes?.movement ||
    self.attributes?.movement_speed
  const walkValue = Number(attr?.value ?? attr?.current ?? attr ?? C.PLAYER_SPEED ?? 0.1)
  const speedLvl = getEffectLevel(self, 'speed', 1)
  const slowLvl = getEffectLevel(self, 'slowness', 2)
  const freezeRatio = Number(self._freezeRatio) || 0
  const usingItem = !!(self.isUsingItem || self.usingHeldItem)
  const sprintActive = !!(self._sprintForSpeed && !self.sneaking)
  const isUnderWater = !!self.isUnderWater
  const isInLava = !!self.isInLava
  const swimSkip = !!(self._flagSwimming && self._swimSkipGravity)
  const onGround = !!self.onGround
  const slipperiness = Number.isFinite(self.groundSlipperiness)
    ? self.groundSlipperiness
    : C.DEFAULT_SLIPPERINESS
  const isSoulSand = self._tickGroundBlock?.name === 'soul_sand'
  return native.frictionInfluencedSpeed(
    walkValue, speedLvl | 0, slowLvl | 0, freezeRatio,
    usingItem, sprintActive,
    isUnderWater, isInLava, swimSkip,
    onGround, slipperiness, isSoulSand
  )
}

function getMovementSpeed (self, C) {
  const attr =
    self.attributes?.['minecraft:movement_speed'] ||
    self.attributes?.movement ||
    self.attributes?.movement_speed
  const value = Number(attr?.value ?? attr?.current ?? attr ?? C.PLAYER_SPEED ?? 0.1)
  const speedLvl = getEffectLevel(self, 'speed', 1)
  const slowLvl = getEffectLevel(self, 'slowness', 2)
  const freezeRatio = Number(self._freezeRatio) || 0
  return native.movementSpeed(value, speedLvl | 0, slowLvl | 0, freezeRatio)
}

function getJumpBoost (self) {
  return getEffectLevel(self, 'jumpBoost', 8) * 0.1
}

function getEffectLevel (self, key, id) {
  if (Number.isFinite(self[key])) return self[key]
  const effect = self.rawEffects?.[id] || self.effects?.[id] || self.effects?.[key]
  if (!effect) return 0
  return Number(effect.level ?? (effect.amplifier != null ? effect.amplifier + 1 : 1)) || 0
}

const HONEY_SLIME_BASE = f(0.40000001)
const WATER_DRAG = f(0.8)
const WATER_SINK_RATE = f(0.005)
const LAVA_DRAG = f(0.5)
const LAVA_GRAVITY = f(0.02)

function applyPostMoveVelocity (self, velocity, world, C) {
  if (self.isInLava) {
    velocity.x = f(velocity.x * LAVA_DRAG)
    velocity.y = f(f(velocity.y * LAVA_DRAG) - LAVA_GRAVITY)
    velocity.z = f(velocity.z * LAVA_DRAG)
    if (Math.abs(velocity.y) < C.SURFACE_EPSILON) velocity.y = 0
    return
  }
  if (self._swimSkipGravity && self._flagSwimming) {
    const transDrag = f(0.9)
    velocity.x = f(velocity.x * transDrag)
    velocity.z = f(velocity.z * transDrag)
    return
  }
  if (self.isUnderWater) {
    if (self.swimTransitioning && self._swimSkipGravity) {
      const transDrag = f(0.9)
      velocity.x = f(velocity.x * transDrag)
      velocity.z = f(velocity.z * transDrag)
      return
    }
    const sprintDrag = !!self._sprintAdfFlag
    const xzDrag = sprintDrag ? f(0.9) : WATER_DRAG
    velocity.x = f(velocity.x * xzDrag)
    velocity.y = f(velocity.y * WATER_DRAG)
    velocity.z = f(velocity.z * xzDrag)
    if (!self._flagSwimming) {
      velocity.y = f(velocity.y - WATER_SINK_RATE)
    }
    if (Math.abs(velocity.y) < C.SURFACE_EPSILON) velocity.y = 0
    return
  }

  if (!self.flying && !self.scaffoldDescend) {
    const levitation = getEffectLevel(self, 'levitation', 25)
    if (levitation > 0) velocity.y = f(velocity.y + f(f(f(0.05) * levitation - velocity.y) * f(0.2)))
    else velocity.y = f(velocity.y - f(getGravity(self, C)))
  }

  velocity.y = f(velocity.y * native.constants.Y_DECAY)

  const frictionOnGround = self.lastOnGround != null ? self.lastOnGround : self.onGround
  const xzDrag = frictionOnGround
    ? f(f(self.groundSlipperiness) * native.constants.AIR_FRIC_XZ)
    : native.constants.AIR_FRIC_XZ
  velocity.x = native.applyFriction(velocity.x, xzDrag)
  velocity.z = native.applyFriction(velocity.z, xzDrag)

  if (Math.abs(velocity.y) < C.SURFACE_EPSILON) velocity.y = 0

  if (self.onGround && !self.sneaking) {
    const standBlock = getBlock(world, new Vec3(self.position.x, self.position.y - 0.1, self.position.z))
    const belowName = standBlock?.name || ''
    if (belowName === 'honey_block' || belowName === 'slime' || belowName === 'slime_block') {
      const absvy = Math.abs(velocity.y)
      if (absvy < 0.1) {
        const k = f(f(absvy * f(0.2)) + HONEY_SLIME_BASE)
        velocity.x = f(velocity.x * k)
        velocity.z = f(velocity.z * k)
      }
    }
  }
}

function getGravity (self, C) {
  if (getEffectLevel(self, 'slowFalling', 28) > 0 && self.velocity.y < 0) return C.SLOW_FALLING_GRAVITY ?? C.GRAVITY / 8
  return C.GRAVITY
}

const SNEAK_PROBE_SHRINK = f(0.025)
const SNEAK_PROBE_Y_OFF = f(0.5625 * -1.01)
const SNEAK_APPROACH_STEP = f(0.050000001)
const SNEAK_EPS = f(1.1920929e-7)

function sneakApproach (current, step) {
  if (current < 0) {
    const next = current + step
    return next > 0 ? 0 : next
  }
  if (current > 0) {
    const next = current - step
    return next < 0 ? 0 : next
  }
  return 0
}

function probeHasSupport (world, minX, minY, minZ, maxX, maxY, maxZ) {
  const probe = new AABB(minX, minY, minZ, maxX, maxY, maxZ)
  return getCollisionAABBs(world, probe).length > 0
}

function applySneakEdgeClamp (self, requestedMove, velocity, controls, world, startedOnGround) {
  if (!self.sneaking || !startedOnGround) return
  const aabb = self._aabb
  if (!aabb) return

  const shrunkMinX = f(aabb.minX + SNEAK_PROBE_SHRINK)
  const shrunkMaxX = f(aabb.maxX - SNEAK_PROBE_SHRINK)
  const shrunkMinZ = f(aabb.minZ + SNEAK_PROBE_SHRINK)
  const shrunkMaxZ = f(aabb.maxZ - SNEAK_PROBE_SHRINK)
  const probeMinY = f(aabb.minY + SNEAK_PROBE_Y_OFF)
  const probeMaxY = f(aabb.maxY + SNEAK_PROBE_Y_OFF)

  if (requestedMove.x !== 0) {
    while (true) {
      const dx = requestedMove.x
      if (probeHasSupport(world,
        f(shrunkMinX + dx), probeMinY, shrunkMinZ,
        f(shrunkMaxX + dx), probeMaxY, shrunkMaxZ)) break
      requestedMove.x = sneakApproach(requestedMove.x, SNEAK_APPROACH_STEP)
      if (requestedMove.x === 0) break
    }
  }
  if (requestedMove.z !== 0) {
    while (true) {
      const dz = requestedMove.z
      if (probeHasSupport(world,
        shrunkMinX, probeMinY, f(shrunkMinZ + dz),
        shrunkMaxX, probeMaxY, f(shrunkMaxZ + dz))) break
      requestedMove.z = sneakApproach(requestedMove.z, SNEAK_APPROACH_STEP)
      if (requestedMove.z === 0) break
    }
  }
  while (requestedMove.x !== 0 || requestedMove.z !== 0) {
    const dx = requestedMove.x
    const dz = requestedMove.z
    if (probeHasSupport(world,
      f(shrunkMinX + dx), probeMinY, f(shrunkMinZ + dz),
      f(shrunkMaxX + dx), probeMaxY, f(shrunkMaxZ + dz))) break
    requestedMove.x = sneakApproach(requestedMove.x, SNEAK_APPROACH_STEP)
    requestedMove.z = sneakApproach(requestedMove.z, SNEAK_APPROACH_STEP)
  }

  if (Math.abs(requestedMove.x) < SNEAK_EPS) velocity.x = 0
  if (Math.abs(requestedMove.z) < SNEAK_EPS) velocity.z = 0
}

function moveWithCollisions (self, movement, world, stepHeight) {
  const box = getPlayerAABB(self)
  let adjusted = collideMovement(box.clone(), movement, world, self)
  const verticalCollision = movement.y !== adjusted.y
  const horizontalCollision = movement.x !== adjusted.x || movement.z !== adjusted.z
  const canStep = (self.onGround || (verticalCollision && movement.y < 0)) && horizontalCollision

  if (canStep) {
    const stepped = tryStepMove(box, movement, adjusted, world, stepHeight, self)
    if (horizontalLengthSquared(stepped) > horizontalLengthSquared(adjusted)) adjusted = stepped
  }

  return {
    movement: adjusted,
    horizontalCollision: movement.x !== adjusted.x || movement.z !== adjusted.z,
    verticalCollision: movement.y !== adjusted.y
  }
}

function tryStepMove (box, movement, current, world, stepHeight, self) {
  const horizontal = new Vec3(movement.x, 0, movement.z)
  let step = collideMovement(box.clone(), new Vec3(horizontal.x, stepHeight, horizontal.z), world, self)

  const stretched = box.clone().extend(horizontal.x, 0, horizontal.z)
  const maxStepUp = collideMovement(stretched, new Vec3(0, stepHeight, 0), world, self).y
  if (maxStepUp < stepHeight) {
    const raisedBox = box.clone().translate(0, maxStepUp, 0)
    const adjustedHorizontal = collideMovement(raisedBox, horizontal, world, self)
    if (horizontalLengthSquared(adjustedHorizontal) > horizontalLengthSquared(step)) {
      step = new Vec3(adjustedHorizontal.x, adjustedHorizontal.y + maxStepUp, adjustedHorizontal.z)
    }
  }

  if (horizontalLengthSquared(step) <= horizontalLengthSquared(current)) return current

  const stepBox = box.clone().translate(step.x, step.y, step.z)
  const remainingY = collideMovement(stepBox, new Vec3(0, movement.y - step.y, 0), world, self).y
  return new Vec3(step.x, step.y + remainingY, step.z)
}

function offsetY (block, player, dy) {
  if (!(block.maxX > player.minX && block.minX < player.maxX && block.maxZ > player.minZ && block.minZ < player.maxZ)) return dy
  if (dy > 0) {
    if (player.maxY <= block.minY) return Math.min(block.minY - player.maxY, dy)
    if (player.maxY > block.minY && player.maxY < block.maxY) return 0
  } else if (dy < 0) {
    if (player.minY >= block.maxY) return Math.max(block.maxY - player.minY, dy)
    if (player.minY < block.maxY && player.minY > block.minY) return 0
  }
  return dy
}

function offsetX (block, player, dx) {
  if (!(block.maxY > player.minY && block.minY < player.maxY && block.maxZ > player.minZ && block.minZ < player.maxZ)) return dx
  if (dx > 0) {
    if (player.maxX <= block.minX) return Math.min(block.minX - player.maxX, dx)
    if (player.maxX > block.minX && player.maxX < block.maxX) return 0
  } else if (dx < 0) {
    if (player.minX >= block.maxX) return Math.max(block.maxX - player.minX, dx)
    if (player.minX < block.maxX && player.minX > block.minX) return 0
  }
  return dx
}

function offsetZ (block, player, dz) {
  if (!(block.maxX > player.minX && block.minX < player.maxX && block.maxY > player.minY && block.minY < player.maxY)) return dz
  if (dz > 0) {
    if (player.maxZ <= block.minZ) return Math.min(block.minZ - player.maxZ, dz)
    if (player.maxZ > block.minZ && player.maxZ < block.maxZ) return 0
  } else if (dz < 0) {
    if (player.minZ >= block.maxZ) return Math.max(block.maxZ - player.minZ, dz)
    if (player.minZ < block.maxZ && player.minZ > block.minZ) return 0
  }
  return dz
}

function collideMovement (box, movement, world, self) {
  let x = movement.x
  let y = movement.y
  let z = movement.z

  const collisions = getCollisionAABBs(world, box.clone().extend(x, y, z), self)

  if (y !== 0) {
    for (const blockBox of collisions) y = offsetY(blockBox, box, y)
    box.translate(0, y, 0)
  }

  if (x !== 0) {
    for (const blockBox of collisions) x = offsetX(blockBox, box, x)
    box.translate(x, 0, 0)
  }

  if (z !== 0) {
    for (const blockBox of collisions) z = offsetZ(blockBox, box, z)
  }

  // Do NOT zero tiny movement values here: Bedrock's swept_movement preserves
  // sub-1e-7 displacements. A `cleanOffset` cutoff at 1e-7 would
  // discard that legitimate drift and pin x at exactly 0.5 forever.
  return new Vec3(x, y, z)
}

function getCollisionAABBs (world, searchBox, self) {
  const boxes = []
  const minX = Math.floor(searchBox.minX - COLLISION_EPSILON)
  const minY = Math.floor(searchBox.minY - 0.5 - COLLISION_EPSILON)
  const minZ = Math.floor(searchBox.minZ - COLLISION_EPSILON)
  const maxX = Math.floor(searchBox.maxX + COLLISION_EPSILON)
  const maxY = Math.floor(searchBox.maxY + COLLISION_EPSILON)
  const maxZ = Math.floor(searchBox.maxZ + COLLISION_EPSILON)

  const canStandOnPowderSnow = self?.armor?.feet?.name === 'leather_boots'
  const entityMinY = self?._aabb?.minY

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const pos = new Vec3(x, y, z)
        const block = getBlock(world, pos)
        for (const shape of getBlockShapes(block, pos, entityMinY, canStandOnPowderSnow)) {
          const blockBox = AABB.fromShape(shape, pos)
          if (blockBox.intersects(searchBox)) boxes.push(blockBox)
        }
      }
    }
  }

  return boxes
}

function getBlock (world, pos) {
  try {
    return world.getBlock(floorVec3(pos))
  } catch {
    return null
  }
}

function getBlockShapes (block, pos, entityMinY, canStandOnPowderSnow) {
  if (!block) return EMPTY_SHAPE
  if (block?.name === 'powder_snow') {
    if (!canStandOnPowderSnow || !pos || entityMinY == null) return EMPTY_SHAPE
    if (entityMinY < pos.y + 1 - 1e-4) return EMPTY_SHAPE
    return DEFAULT_BLOCK_SHAPE
  }
  if (block.boundingBox === 'empty') return EMPTY_SHAPE
  if (block?.name === 'scaffolding') return EMPTY_SHAPE
  if (Array.isArray(block.shapes)) return block.shapes
  if (block.boundingBox === 'block') return DEFAULT_BLOCK_SHAPE
  return EMPTY_SHAPE
}

function getPlayerAABB (self) {
  const a = self._aabb
  if (a) return new AABB(a.minX, a.minY, a.minZ, a.maxX, a.maxY, a.maxZ)
  const halfWidth = self.halfWidth ?? self.width / 2 ?? 0.3
  const height = self.height ?? 1.8
  return new AABB(
    self.position.x - halfWidth,
    self.position.y,
    self.position.z - halfWidth,
    self.position.x + halfWidth,
    self.position.y + height,
    self.position.z + halfWidth
  )
}

function horizontalLengthSquared (vec) {
  return vec.x * vec.x + vec.z * vec.z
}

// Bedrock per-block friction overrides. The
// honey/slime "0.4" number that appears elsewhere is the
// HoneyOrSlimeStandOn velocity multiplier — registry friction is 0.8 for
// both. Soul sand's registry friction is 0.6; BDS has a × 1.225 multiplier,
// but recordings of the walk_on_soul_sand
// scenario show no multiplier in effect (likely classified outside
// kSoulSand path). Leaving it at 0.6 matches observed behavior.
const BLOCK_FRICTION = {
  ice: 0.98,
  packed_ice: 0.98,
  frosted_ice: 0.98,
  blue_ice: 0.989,
  slime: 0.8,
  slime_block: 0.8,
  honey_block: 0.8
}

function getBlockFriction (block, C) {
  if (!block) return C.DEFAULT_SLIPPERINESS
  if (Number.isFinite(block.friction)) return block.friction
  const known = BLOCK_FRICTION[block.name]
  if (known !== undefined) return known
  return C.DEFAULT_SLIPPERINESS
}

function isClimbable (self, world) {
  return getClimbableType(self, world) != null
}

const LADDER_CLIMB_SPEED = f(0.2)
const SCAFFOLDING_CLIMB_SPEED = f(0.15)

function getClimbableType (self, world) {
  const block = getBlock(world, self.position)
  const name = block?.name || ''
  if (name.includes('ladder')) return 'ladder'
  if (name.includes('vine')) return 'vine'
  if (name.includes('scaffolding')) return 'scaffolding'
  if (self._aabb && aabbHasScaffolding(self._aabb, world)) return 'scaffolding'
  return null
}

function isExitingScaffoldingHorizontally (self, velocity, world) {
  if (self.verticalCollision) return false
  const px = self.position.x
  const pz = self.position.z
  const cx0 = Math.floor(px)
  const cz0 = Math.floor(pz)
  const cy = Math.floor(self.position.y)
  const here = getBlock(world, new Vec3(cx0, cy, cz0))
  if (here?.name !== 'scaffolding') return false
  const cx1 = Math.floor(px + velocity.x)
  const cz1 = Math.floor(pz + velocity.z)
  if (cx1 === cx0 && cz1 === cz0) return false
  const there = getBlock(world, new Vec3(cx1, cy, cz1))
  return there?.name !== 'scaffolding'
}

function aabbHasScaffolding (aabb, world) {
  const eps = 0.001
  const x0 = Math.floor(aabb.minX + eps)
  const y0 = Math.floor(aabb.minY + eps)
  const z0 = Math.floor(aabb.minZ + eps)
  const x1 = Math.floor(aabb.maxX - eps)
  const y1 = Math.floor(aabb.minY + eps)
  const z1 = Math.floor(aabb.maxZ - eps)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const b = getBlock(world, new Vec3(x, y, z))
        if (b?.name === 'scaffolding') return true
      }
    }
  }
  return false
}

function getClimbSpeed (type) {
  return type === 'scaffolding' ? SCAFFOLDING_CLIMB_SPEED : LADDER_CLIMB_SPEED
}

function applyClimbImpulse (self, velocity, controls, input, world) {
  const type = getClimbableType(self, world)
  if (!type || type === 'scaffolding') return
  if (input.z > 0 && self.horizontalCollision) {
    velocity.y = f(getClimbSpeed(type))
    self.velocity.y = velocity.y
  }
}

const COBWEB_MUL = { x: f(0.25), y: f(0.05), z: f(0.25) }
const POWDER_SNOW_MUL = { x: f(0.9), y: f(1.5), z: f(0.9) }
const BERRY_BUSH_MUL = { x: f(0.80000001), y: f(0.75), z: f(0.80000001) }

function cobwebInInnerAABB (self, world) {
  return self._aabb ? cobwebInAABB(self._aabb, world) : false
}

function cobwebInAABB (aabb, world) {
  const eps = 0.001
  const x0 = Math.floor(aabb.minX + eps)
  const y0 = Math.floor(aabb.minY + eps)
  const z0 = Math.floor(aabb.minZ + eps)
  const x1 = Math.floor(aabb.maxX - eps)
  const y1 = Math.floor(aabb.maxY - eps)
  const z1 = Math.floor(aabb.maxZ - eps)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const block = getBlock(world, new Vec3(x, y, z))
        const name = block?.name
        if (name === 'web' || name === 'cobweb') return true
      }
    }
  }
  return false
}

function powderSnowInInnerAABB (self, world) {
  if (self?.armor?.feet?.name === 'leather_boots') return false
  const aabb = self._aabb
  if (!aabb) return false
  const eps = 0.001
  const x0 = Math.floor(aabb.minX + eps)
  const y0 = Math.floor(aabb.minY + eps)
  const z0 = Math.floor(aabb.minZ + eps)
  const x1 = Math.floor(aabb.maxX - eps)
  const y1 = Math.floor(aabb.maxY - eps)
  const z1 = Math.floor(aabb.maxZ - eps)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const block = getBlock(world, new Vec3(x, y, z))
        if (block?.name === 'powder_snow') return true
      }
    }
  }
  return false
}

function berryBushInInnerAABB (self, world) {
  const aabb = self._aabb
  if (!aabb) return false
  const eps = 0.001
  const x0 = Math.floor(aabb.minX + eps)
  const y0 = Math.floor(aabb.minY + eps)
  const z0 = Math.floor(aabb.minZ + eps)
  const x1 = Math.floor(aabb.maxX - eps)
  const y1 = Math.floor(aabb.maxY - eps)
  const z1 = Math.floor(aabb.maxZ - eps)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const block = getBlock(world, new Vec3(x, y, z))
        if (block?.name === 'sweet_berry_bush') return true
      }
    }
  }
  return false
}

const BUBBLE_INSIDE_PUSH = f(0.06)
const BUBBLE_INSIDE_PUSH_MAX = f(0.7)
const BUBBLE_INSIDE_DRAG = f(-0.03)
const BUBBLE_INSIDE_DRAG_MIN = f(-0.3)
const BUBBLE_ABOVE_PUSH = f(0.1)
const BUBBLE_ABOVE_PUSH_MAX = f(1.8)
const BUBBLE_ABOVE_DRAG = f(-0.03)
const BUBBLE_ABOVE_DRAG_MIN = f(-0.9)

function computeBubbleColumnRange (world, x, z) {
  let anchorY = null
  for (let dy = 320; dy >= -64; dy--) {
    const b = getBlock(world, new Vec3(x, dy, z))
    if (b?.name === 'bubble_column') { anchorY = dy; break }
  }
  if (anchorY === null) return null
  let bottomY = anchorY
  for (let dy = anchorY - 1; dy >= anchorY - 320; dy--) {
    const b = getBlock(world, new Vec3(x, dy, z))
    if (b?.name === 'bubble_column') { bottomY = dy; continue }
    break
  }
  let topY = anchorY
  for (let dy = anchorY + 1; dy <= anchorY + 320; dy++) {
    const b = getBlock(world, new Vec3(x, dy, z))
    const n = b?.name
    if (n === 'bubble_column') { topY = dy; continue }
    if (n && n.includes('water')) { topY = dy; continue }
    break
  }
  let dragDown = false
  for (let dy = bottomY - 1; dy >= bottomY - 4; dy--) {
    const b = getBlock(world, new Vec3(x, dy, z))
    const n = b?.name
    if (!n) continue
    if (n === 'magma' || n === 'magma_block') { dragDown = true; break }
    if (n === 'soul_sand') { dragDown = false; break }
    break
  }
  return { minY: bottomY, maxY: topY, dragDown }
}

function isBubbleColumnCell (world, x, y, z, info) {
  if (!info) return false
  if (y < info.minY || y > info.maxY) return false
  const b = getBlock(world, new Vec3(x, y, z))
  const n = b?.name
  if (!n) return false
  return n === 'bubble_column' || n.includes('water')
}

function applyBubbleColumn (self, velocity, world) {
  const aabb = self._aabb
  if (!aabb) return
  const eps = 0.001
  const x0 = Math.floor(aabb.minX + eps)
  const y0 = Math.floor(aabb.minY + eps)
  const z0 = Math.floor(aabb.minZ + eps)
  const x1 = Math.floor(aabb.maxX - eps)
  const y1 = Math.floor(aabb.maxY - eps)
  const z1 = Math.floor(aabb.maxZ - eps)
  const cache = new Map()
  let vy = velocity.y
  let touched = false
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const key = x + ',' + z
      let info = cache.get(key)
      if (info === undefined) {
        info = computeBubbleColumnRange(world, x, z)
        cache.set(key, info)
      }
      if (!info) continue
      for (let y = y0; y <= y1; y++) {
        if (!isBubbleColumnCell(world, x, y, z, info)) continue
        const aboveIsBubble = isBubbleColumnCell(world, x, y + 1, z, info)
        if (!aboveIsBubble) {
          if (info.dragDown) vy = Math.max(f(vy + BUBBLE_ABOVE_DRAG), BUBBLE_ABOVE_DRAG_MIN)
          else vy = Math.min(f(vy + BUBBLE_ABOVE_PUSH), BUBBLE_ABOVE_PUSH_MAX)
        } else {
          if (info.dragDown) vy = Math.max(f(vy + BUBBLE_INSIDE_DRAG), BUBBLE_INSIDE_DRAG_MIN)
          else vy = Math.min(f(vy + BUBBLE_INSIDE_PUSH), BUBBLE_INSIDE_PUSH_MAX)
        }
        touched = true
      }
    }
  }
  if (touched) {
    velocity.y = f(vy)
    self.velocity.y = velocity.y
  }
}

function unblockedToStandBlocked (self, world) {
  const aabb = self._aabb
  if (!aabb || !world) return false
  const shrink = 0.01
  const minX = aabb.minX + shrink
  const maxX = aabb.maxX - shrink
  const minZ = aabb.minZ + shrink
  const maxZ = aabb.maxZ - shrink
  const minY = aabb.minY + shrink
  const maxY = aabb.minY + 1.8 - shrink
  const x0 = Math.floor(minX), x1 = Math.floor(maxX)
  const y0 = Math.floor(minY), y1 = Math.floor(maxY)
  const z0 = Math.floor(minZ), z1 = Math.floor(maxZ)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const block = getBlock(world, new Vec3(x, y, z))
        if (block && block.boundingBox === 'block') return true
      }
    }
  }
  return false
}

function liquidInInnerAABB (self, world, kind) {
  const aabb = self._aabb
  if (!aabb) return false
  const minX = aabb.minX + 0.001
  const maxX = aabb.maxX - 0.001
  const minY = aabb.minY + 0.401
  const maxY = aabb.maxY - 0.401
  const minZ = aabb.minZ + 0.001
  const maxZ = aabb.maxZ - 0.001
  const x0 = Math.floor(minX), x1 = Math.floor(maxX)
  const y0 = Math.floor(minY), y1 = Math.floor(maxY)
  const z0 = Math.floor(minZ), z1 = Math.floor(maxZ)
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const block = getBlock(world, new Vec3(x, y, z))
        const n = block?.name
        if (!n) continue
        if (n.includes(kind)) return true
        if (kind === 'water' && n === 'bubble_column') return true
      }
    }
  }
  return false
}

function isWaterCell (world, x, y, z) {
  const block = getBlock(world, new Vec3(x, y, z))
  const n = block?.name
  if (!n) return false
  return n.includes('water') || n === 'bubble_column'
}

const LIQUID_FLOW_DX = [0, 0, -1, 1]
const LIQUID_FLOW_DZ = [-1, 1, 0, 0]
const LIQUID_FLOW_MAX_DEPTH = 7
const LIQUID_FLOW_EPS = 0.000099999997
const WATER_FLOW_STRENGTH = 0.014

function liquidCellRenderedDepth (world, x, y, z, cache) {
  const key = x + ',' + y + ',' + z
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  if (!isWaterCell(world, x, y, z)) {
    cache.set(key, -1)
    return -1
  }
  if (isWaterCell(world, x, y + 1, z)) {
    cache.set(key, 0)
    return 0
  }
  const visited = new Set()
  visited.add(key)
  let frontier = [[x, z]]
  for (let d = 1; d <= LIQUID_FLOW_MAX_DEPTH; d++) {
    const next = []
    for (const [cx, cz] of frontier) {
      for (let dir = 0; dir < 4; dir++) {
        const nx = cx + LIQUID_FLOW_DX[dir]
        const nz = cz + LIQUID_FLOW_DZ[dir]
        const nk = nx + ',' + y + ',' + nz
        if (visited.has(nk)) continue
        if (!isWaterCell(world, nx, y, nz)) continue
        visited.add(nk)
        if (isWaterCell(world, nx, y + 1, nz)) {
          cache.set(key, d)
          return d
        }
        next.push([nx, nz])
      }
    }
    if (next.length === 0) break
    frontier = next
  }
  cache.set(key, LIQUID_FLOW_MAX_DEPTH)
  return LIQUID_FLOW_MAX_DEPTH
}

function applyWaterFlowImpulse (self, world) {
  const aabb = self._aabb
  if (!aabb) return
  const minX = aabb.minX + 0.001
  const maxX = aabb.maxX - 0.001
  const minY = aabb.minY + 0.401
  const maxY = aabb.maxY - 0.401
  const minZ = aabb.minZ + 0.001
  const maxZ = aabb.maxZ - 0.001
  const x0 = Math.floor(minX), x1 = Math.floor(maxX)
  const y0 = Math.floor(minY), y1 = Math.floor(maxY)
  const z0 = Math.floor(minZ), z1 = Math.floor(maxZ)
  const cells = []
  let hasFlowing = false
  const depthCache = new Map()
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        if (!isWaterCell(world, x, y, z)) continue
        const depth = liquidCellRenderedDepth(world, x, y, z, depthCache)
        cells.push({ x, y, z, depth })
        if (depth > 0) hasFlowing = true
      }
    }
  }
  if (cells.length === 0) return
  if (!hasFlowing) {
    let adjacent = false
    for (const lb of cells) {
      for (let d = 0; d < 4 && !adjacent; d++) {
        const nd = liquidCellRenderedDepth(world, lb.x + LIQUID_FLOW_DX[d], lb.y, lb.z + LIQUID_FLOW_DZ[d], depthCache)
        if (nd > 0) adjacent = true
      }
      if (adjacent) break
    }
    if (!adjacent) return
  }
  let accumX = 0, accumZ = 0
  for (const lb of cells) {
    let bx = 0, bz = 0
    for (let d = 0; d < 4; d++) {
      const nx = lb.x + LIQUID_FLOW_DX[d]
      const nz = lb.z + LIQUID_FLOW_DZ[d]
      const nDepth = liquidCellRenderedDepth(world, nx, lb.y, nz, depthCache)
      if (nDepth >= 0) {
        const diff = nDepth - lb.depth
        bx += LIQUID_FLOW_DX[d] * diff
        bz += LIQUID_FLOW_DZ[d] * diff
      } else {
        const neighbor = getBlock(world, new Vec3(nx, lb.y, nz))
        const nSolid = neighbor && neighbor.boundingBox === 'block'
        if (!nSolid) {
          const belowDepth = liquidCellRenderedDepth(world, nx, lb.y - 1, nz, depthCache)
          if (belowDepth >= 0) {
            const diff = belowDepth - lb.depth + 8
            bx += LIQUID_FLOW_DX[d] * diff
            bz += LIQUID_FLOW_DZ[d] * diff
          }
        }
      }
    }
    const bmag = Math.sqrt(bx * bx + bz * bz)
    if (bmag >= LIQUID_FLOW_EPS) {
      const inv = 1 / bmag
      accumX += bx * inv
      accumZ += bz * inv
    }
  }
  const mag = Math.sqrt(accumX * accumX + accumZ * accumZ)
  if (mag < LIQUID_FLOW_EPS) return
  const inv = 1 / mag
  self.velocity.x = f(self.velocity.x + f(f(f(accumX) * f(inv)) * WATER_FLOW_STRENGTH))
  self.velocity.z = f(self.velocity.z + f(f(f(accumZ) * f(inv)) * WATER_FLOW_STRENGTH))
}

function updateFluidAndClimbableState (self, world) {
  const feet = getBlock(world, self.position)
  const eyes = getBlock(world, self.position.offset(0, self.eyeHeight || 1.62, 0))
  const feetName = feet?.name || ''
  const eyesName = eyes?.name || ''

  self.touchingWater = feetName.includes('water')
  self.isInWater = self.touchingWater
  self.isUnderWater = eyesName.includes('water')
  self.inLava = feetName.includes('lava')
  self.isInLava = self.inLava
  self.isUnderLava = eyesName.includes('lava')
  self.onClimbable = isClimbable(self, world)
}

function computeInputFlags (self, controls, prevSneakDown, prevSprintDown, prevJumpDown) {
  const jumpDown = !!controls.jumpDown
  const sneakDown = !!controls.sneakDown
  const sprintDown = !!controls.sprintDown
  const forward = !!controls.forward
  const back = !!controls.back
  const left = !!controls.left
  const right = !!controls.right
  const jumpPressed = !!controls.jumpPressed

  self._flagJumpDown = jumpDown
  self._flagSneakDown = sneakDown
  self._flagSprintDown = sprintDown
  self._flagUp = forward
  self._flagDown = back
  self._flagLeft = left
  self._flagRight = right
  self._flagUpLeft = forward && left
  self._flagUpRight = forward && right
  self._flagDownLeft = back && left
  self._flagDownRight = back && right

  self._flagJumpCurrentRaw = jumpDown
  self._flagJumpPressedRaw = !!controls.jumpPressedRaw
  self._flagJumpReleasedRaw = !!controls.jumpReleasedRaw
  self._flagSneakCurrentRaw = sneakDown
  self._flagSneakPressedRaw = !!controls.sneakPressedRaw
  self._flagSneakReleasedRaw = !!controls.sneakReleasedRaw

  self._flagJumping = jumpDown
  self._flagStartJumping = jumpPressed && self._noJumpDelay === 10
  self._flagWantUp = jumpDown
  self._flagWantDown = sneakDown

  const wasSneaking = !!self._flagSneakingPrev
  const isSneaking = !!self.sneaking
  self._flagStartSneaking = isSneaking && !wasSneaking
  self._flagStopSneaking = !isSneaking && wasSneaking
  self._flagSneakingPrev = isSneaking

  self._flagStartSprinting = !!self._sprintStartEdge
  self._flagStopSprinting = !!self._sprintStopEdge

  const wasSwimming = !!self._flagSwimmingPrev
  const isSwimming = !!self._flagSwimming
  self._flagStartSwimming = !wasSwimming && isSwimming
  self._flagStopSwimming = (wasSwimming && !isSwimming) || !!self._bdsResyncStopSwim
  self.swimming = isSwimming
  self._flagSwimmingPrev = isSwimming
  self._flagSprintingPrev = !!self.sprinting

  const wasGliding = !!self._flagGlidingPrev
  const isGliding = !!self.gliding
  self._flagStartGliding = isGliding && !wasGliding
  self._flagStopGliding = !isGliding && wasGliding
  self._flagGlidingPrev = isGliding

  self._flagBlockBreakingDelayEnabled = true
}

module.exports = {
  createBedrockPhysicsEngine,
  glideMoveCompute,
  bdsViewVector,
  seedFromPAI
}
