const { Vec3 } = require('vec3')
const { AABB } = require('@nxg-org/mineflayer-util-plugin')
const { floorVec3, numberOrZero } = require('../../utils')

const DEFAULT_BLOCK_SHAPE = [[0, 0, 0, 1, 1, 1]]
const EMPTY_SHAPE = []
const COLLISION_EPSILON = 1e-7

function createBedrockPhysicsEngine (options = {}) {
  const stepHeight = options.stepHeight ?? 0.6

  function simulateSelf (botState, controls, world, C) {
    const self = botState.self
    if (!self) throw new Error('[physics] Cannot simulate without botState.self being set')

    ensureSelfShape(self, C)

    const startedOnGround = !!self.onGround
    const previousVelocity = self.velocity.clone()
    const input = getLocalInput(controls)
    let velocity = self.velocity.clone()

    velocity = applyJump(self, controls, input, velocity, C)
    velocity = applyRelativeMovement(self, input, velocity, C)

    const requestedMove = velocity.clone()
    const collision = moveWithCollisions(self, requestedMove, world, stepHeight)

    self.position = self.position.plus(collision.movement)
    self.velocity = velocity
    self.velocity.x = collision.horizontalCollision ? 0 : self.velocity.x
    self.velocity.z = collision.horizontalCollision ? 0 : self.velocity.z
    if (collision.verticalCollision) self.velocity.y = 0

    self.horizontalCollision = collision.horizontalCollision
    self.verticalCollision = collision.verticalCollision
    self.isCollidedHorizontally = collision.horizontalCollision
    self.isCollidedVertically = collision.verticalCollision
    self.onGround = collision.verticalCollision && requestedMove.y < 0
    self.lastOnGround = startedOnGround
    self.supportingBlockPos = self.onGround ? floorVec3(self.position.offset(0, -0.1, 0)) : null

    applyPostMoveVelocity(self, velocity, world, C)
    updateFluidAndClimbableState(self, world)

    self.prevVelocity = previousVelocity

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
  self.height = numberOrZero(self.height) || C.PLAYER_HEIGHT
  self.width = numberOrZero(self.width) || C.PLAYER_WIDTH
  self.halfWidth = self.width / 2
  if (typeof self.onGround !== 'boolean') self.onGround = false
}

function getLocalInput (controls) {
  let x = 0
  let z = 0
  if (controls.left) x += 1
  if (controls.right) x -= 1
  if (controls.forward) z += 1
  if (controls.back) z -= 1

  const length = Math.hypot(x, z)
  if (length > 1) {
    x /= length
    z /= length
  }

  return { x, z }
}

function applyJump (self, controls, input, velocity, C) {
  if (controls.jump) {
    if (self.touchingWater || self.isInWater || self.inLava || self.isInLava) {
      velocity.y += C.FLUID_BUOYANCY_Y
    } else if (self.onGround) {
      velocity.y = Math.max(C.JUMP_VELOCITY + getJumpBoost(self), velocity.y)
      if ((controls.sprint || self.sprinting) && input.z > 0) {
        const yawRad = ((self.yaw || 0) * Math.PI) / 180
        velocity.x -= Math.sin(yawRad) * C.SPRINT_JUMP_BOOST
        velocity.z += Math.cos(yawRad) * C.SPRINT_JUMP_BOOST
      }
    }
  }

  return velocity
}

function applyRelativeMovement (self, input, velocity, C) {
  if (input.x === 0 && input.z === 0) return velocity

  const speed = getFrictionInfluencedSpeed(self, C)
  const yawRad = ((self.yaw || 0) * Math.PI) / 180
  const sinYaw = Math.sin(yawRad)
  const cosYaw = Math.cos(yawRad)

  const strafe = input.x * speed
  const forward = input.z * speed
  velocity.x += strafe * cosYaw - forward * sinYaw
  velocity.z += forward * cosYaw + strafe * sinYaw

  return velocity
}

function getFrictionInfluencedSpeed (self, C) {
  let base = getMovementSpeed(self, C)

  if (self.sneaking || self.crouching) base *= C.SNEAK_INPUT_SCALE
  if (self.isUsingItem || self.usingHeldItem) base *= C.USING_ITEM_SCALE
  if (self.sprinting) base *= 1.3

  if (!self.onGround) return self.sprinting ? C.AIR_ACCEL_SPRINT : C.AIR_ACCEL_WALK

  const slipperiness = Number.isFinite(self.groundSlipperiness)
    ? self.groundSlipperiness
    : C.DEFAULT_SLIPPERINESS

  return base * (C.GROUND_ACCEL_FACTOR / Math.max(1e-6, slipperiness * slipperiness * slipperiness))
}

function getMovementSpeed (self, C) {
  const attr =
    self.attributes?.['minecraft:movement_speed'] ||
    self.attributes?.movement ||
    self.attributes?.movement_speed

  const value = Number(attr?.value ?? attr?.current ?? attr ?? C.PLAYER_SPEED ?? 0.1)
  const speed = value * (1 + 0.2 * getEffectLevel(self, 'speed', 1) - 0.15 * getEffectLevel(self, 'slowness', 2))
  return Math.max(0, speed)
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

function applyPostMoveVelocity (self, velocity, world, C) {
  const below = getBlockAt(world, self.position.offset(0, -0.1, 0))
  self.groundSlipperiness = getBlockFriction(below, C)

  if (self.horizontalCollision && isClimbable(self, world)) {
    velocity.y = Math.max(velocity.y, C.CLIMB_SPEED)
  }

  if (!self.flying && !self.scaffoldDescend) {
    const levitation = getEffectLevel(self, 'levitation', 25)
    if (levitation > 0) velocity.y += (0.05 * levitation - velocity.y) * 0.2
    else velocity.y -= getGravity(self, C)
  }

  velocity.y *= C.VELOCITY_Y_DECAY

  const xzDrag = self.onGround ? self.groundSlipperiness * C.AIR_FRICTION_XZ : C.AIR_FRICTION_XZ
  velocity.x *= xzDrag
  velocity.z *= xzDrag

  if (Math.abs(velocity.x) < C.SURFACE_EPSILON) velocity.x = 0
  if (Math.abs(velocity.y) < C.SURFACE_EPSILON) velocity.y = 0
  if (Math.abs(velocity.z) < C.SURFACE_EPSILON) velocity.z = 0
}

function getGravity (self, C) {
  if (getEffectLevel(self, 'slowFalling', 28) > 0 && self.velocity.y <= 0) return C.SLOW_FALLING_GRAVITY ?? C.GRAVITY / 8
  return C.GRAVITY
}

function moveWithCollisions (self, movement, world, stepHeight) {
  const box = getPlayerAABB(self)
  let adjusted = collideMovement(box.clone(), movement, world)
  const verticalCollision = movement.y !== adjusted.y
  const horizontalCollision = movement.x !== adjusted.x || movement.z !== adjusted.z
  const canStep = (self.onGround || (verticalCollision && movement.y < 0)) && horizontalCollision

  if (canStep) {
    const stepped = tryStepMove(box, movement, adjusted, world, stepHeight)
    if (horizontalLengthSquared(stepped) > horizontalLengthSquared(adjusted)) adjusted = stepped
  }

  return {
    movement: adjusted,
    horizontalCollision: movement.x !== adjusted.x || movement.z !== adjusted.z,
    verticalCollision: movement.y !== adjusted.y
  }
}

function tryStepMove (box, movement, current, world, stepHeight) {
  const horizontal = new Vec3(movement.x, 0, movement.z)
  let step = collideMovement(box.clone(), new Vec3(horizontal.x, stepHeight, horizontal.z), world)

  const stretched = box.clone().extend(horizontal.x, 0, horizontal.z)
  const maxStepUp = collideMovement(stretched, new Vec3(0, stepHeight, 0), world).y
  if (maxStepUp < stepHeight) {
    const raisedBox = box.clone().translate(0, maxStepUp, 0)
    const adjustedHorizontal = collideMovement(raisedBox, horizontal, world)
    if (horizontalLengthSquared(adjustedHorizontal) > horizontalLengthSquared(step)) {
      step = new Vec3(adjustedHorizontal.x, adjustedHorizontal.y + maxStepUp, adjustedHorizontal.z)
    }
  }

  if (horizontalLengthSquared(step) <= horizontalLengthSquared(current)) return current

  const stepBox = box.clone().translate(step.x, step.y, step.z)
  const remainingY = collideMovement(stepBox, new Vec3(0, movement.y - step.y, 0), world).y
  return new Vec3(step.x, step.y + remainingY, step.z)
}

function collideMovement (box, movement, world) {
  let x = movement.x
  let y = movement.y
  let z = movement.z

  const collisions = getCollisionAABBs(world, box.clone().extend(x, y, z))

  if (y !== 0) {
    for (const blockBox of collisions) y = blockBox.computeOffsetY(box, y)
    box.translate(0, y, 0)
  }

  const zFirst = Math.abs(z) > Math.abs(x)
  if (zFirst && z !== 0) {
    for (const blockBox of collisions) z = blockBox.computeOffsetZ(box, z)
    box.translate(0, 0, z)
  }

  if (x !== 0) {
    for (const blockBox of collisions) x = blockBox.computeOffsetX(box, x)
    box.translate(x, 0, 0)
  }

  if (!zFirst && z !== 0) {
    for (const blockBox of collisions) z = blockBox.computeOffsetZ(box, z)
  }

  return new Vec3(cleanOffset(x), cleanOffset(y), cleanOffset(z))
}

function cleanOffset (value) {
  return Math.abs(value) < COLLISION_EPSILON ? 0 : value
}

function getCollisionAABBs (world, searchBox) {
  const boxes = []
  const minX = Math.floor(searchBox.minX - COLLISION_EPSILON)
  const minY = Math.floor(searchBox.minY - 0.5 - COLLISION_EPSILON)
  const minZ = Math.floor(searchBox.minZ - COLLISION_EPSILON)
  const maxX = Math.floor(searchBox.maxX + COLLISION_EPSILON)
  const maxY = Math.floor(searchBox.maxY + COLLISION_EPSILON)
  const maxZ = Math.floor(searchBox.maxZ + COLLISION_EPSILON)

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const pos = new Vec3(x, y, z)
        const block = getBlockAt(world, pos)
        for (const shape of getBlockShapes(block)) {
          const blockBox = AABB.fromShape(shape, pos)
          if (blockBox.intersects(searchBox)) boxes.push(blockBox)
        }
      }
    }
  }

  return boxes
}

function getBlockAt (world, pos) {
  try {
    return world.getBlock(floorVec3(pos))
  } catch {
    return null
  }
}

function getBlockShapes (block) {
  if (!block) return EMPTY_SHAPE
  if (Array.isArray(block.shapes)) return block.shapes
  if (block.boundingBox === 'block') return DEFAULT_BLOCK_SHAPE
  return EMPTY_SHAPE
}

function getPlayerAABB (self) {
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

function getBlockFriction (block, C) {
  const name = block?.name || ''
  if (Number.isFinite(block?.friction)) return block.friction
  if (name.includes('slime')) return 0.8
  if (name.includes('ice')) return name.includes('blue_ice') ? 0.989 : 0.98
  return C.DEFAULT_SLIPPERINESS
}

function isClimbable (self, world) {
  const block = getBlockAt(world, self.position)
  const name = block?.name || ''
  return name.includes('ladder') || name.includes('vine') || name.includes('scaffolding')
}

function updateFluidAndClimbableState (self, world) {
  const feet = getBlockAt(world, self.position)
  const eyes = getBlockAt(world, self.position.offset(0, self.eyeHeight || 1.62, 0))
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

module.exports = {
  createBedrockPhysicsEngine
}
