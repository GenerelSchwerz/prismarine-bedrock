'use strict'

const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')

const { getConstants } = require('../../../src/builtins/physics-constants')
const { createBedrockPhysicsEngine } = require('../../../src/builtins/physics/bedrock-physics-engine')
const { installControls, updateEyeDeltaAndTick } = require('../../../src/builtins/physics/input-controls')
const { toEyePosition, toFeetPosition, withSelfFeetPosition } = require('../../../src/builtins/physics/position')

function blockKey (pos) {
  return `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`
}

function createBlock (pos, name = 'stone') {
  return {
    position: new Vec3(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)),
    name,
    boundingBox: 'block',
    shapes: [[0, 0, 0, 1, 1, 1]],
    getProperties: () => ({})
  }
}

function createAirBlock (pos) {
  return {
    position: new Vec3(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)),
    name: 'air',
    boundingBox: 'empty',
    shapes: [],
    getProperties: () => ({})
  }
}

function createSuperflatWorld (options = {}) {
  const floorY = options.floorY ?? 0
  const floorBlock = options.floorBlock ?? 'stone'
  const overrides = new Map()

  return {
    floorY,

    setBlock (pos, name = floorBlock) {
      overrides.set(blockKey(pos), createBlock(pos, name))
    },

    setAir (pos) {
      overrides.set(blockKey(pos), createAirBlock(pos))
    },

    getBlock (pos) {
      const key = blockKey(pos)
      if (overrides.has(key)) return overrides.get(key)
      if (Math.floor(pos.y) === floorY) return createBlock(pos, floorBlock)
      return createAirBlock(pos)
    }
  }
}

function createFakeWorldBot (options = {}) {
  const version = options.version || '1.26.10'
  const C = getConstants(version)
  const world = options.world || createSuperflatWorld(options.worldOptions)
  const controlsHost = new EventEmitter()
  const engine = createBedrockPhysicsEngine(options.physicsOptions)
  const feet = options.feet || new Vec3(0.5, (world.floorY ?? 0) + 1, 0.5)
  const self = {
    position: toEyePosition(feet, { eyeHeight: C.EYE_HEIGHT }, C),
    velocity: options.velocity?.clone?.() || new Vec3(0, 0, 0),
    yaw: options.yaw ?? 0,
    pitch: options.pitch ?? 0,
    headYaw: options.yaw ?? 0,
    onGround: options.onGround ?? true,
    eyeHeight: C.EYE_HEIGHT,
    width: C.PLAYER_WIDTH,
    height: C.PLAYER_HEIGHT,
    tick: 0n,
    attributes: {
      'minecraft:movement_speed': { value: C.PLAYER_SPEED }
    }
  }

  const botState = Object.assign(controlsHost, {
    version,
    self,
    world: { sync: world }
  })
  const controls = installControls(botState, C)

  function tick (count = 1) {
    const results = []

    for (let i = 0; i < count; i++) {
      controls.evaluateControls()
      const result = withSelfFeetPosition(botState.self, C, () => {
        return engine.simulateSelf(botState, controls.getControlStateSnapshot(), world, C)
      })
      updateEyeDeltaAndTick(botState.self, C)
      botState.emit('physicsTick', { tick: botState.self.tick, result })
      results.push(result)
    }

    return results
  }

  function feetPosition () {
    return toFeetPosition(botState.self.position, botState.self, C)
  }

  return {
    C,
    botState,
    controls,
    engine,
    feetPosition,
    tick,
    world
  }
}

module.exports = {
  createFakeWorldBot,
  createSuperflatWorld
}
