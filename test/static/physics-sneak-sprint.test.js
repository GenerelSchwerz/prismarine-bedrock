'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const Vec3 = require('vec3')

const { getConstants } = require('../../src/builtins/physics-constants')
const { installControls } = require('../../src/builtins/physics/input-controls')
const { createMovementPacketSender } = require('../../src/builtins/physics/movement-packets')
const { createBedrockPhysicsEngine } = require('../../src/builtins/physics/bedrock-physics-engine')

const C = getConstants('1.26.10')

function createClient () {
  const client = new EventEmitter()
  client.entityId = 1n
  client.queued = []
  client.queue = (name, params) => {
    client.queued.push({ name, params })
  }
  return client
}

function createControlBot () {
  const client = createClient()
  const botState = new EventEmitter()
  botState.client = client
  botState.canSendPlayerAuthInput = true
  botState.world = { sync: { getBlock: () => null } }
  botState.self = {
    position: new Vec3(0, 66.62, 0),
    velocity: new Vec3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    headYaw: 0,
    onGround: true,
    tick: 0n
  }

  const controls = installControls(botState, C)
  const sender = createMovementPacketSender(botState, C)
  return { botState, client, controls, sender }
}

function sendAuthPacket (controls, sender, client) {
  controls.evaluateControls()
  sender.sendPlayerAuthInput(0.05)
  return client.queued.at(-1).params
}

function createBlockWorld (blocks) {
  const solid = new Set(blocks.map(pos => `${pos.x},${pos.y},${pos.z}`))
  return {
    getBlock (pos) {
      if (!solid.has(`${pos.x},${pos.y},${pos.z}`)) {
        return { name: 'air', boundingBox: 'empty', shapes: [] }
      }

      return {
        position: pos,
        name: 'stone',
        boundingBox: 'block',
        shapes: [[0, 0, 0, 1, 1, 1]]
      }
    }
  }
}

function createPhysicsBot ({ sneaking = false, blocks = [{ x: 0, y: 0, z: 0 }] } = {}) {
  return {
    self: {
      position: new Vec3(0.5, 1, 0.5),
      velocity: new Vec3(0, 0, 0.4),
      yaw: 0,
      pitch: 0,
      onGround: true,
      sneaking,
      crouching: sneaking,
      width: C.PLAYER_WIDTH,
      height: C.PLAYER_HEIGHT,
      eyeHeight: C.EYE_HEIGHT
    },
    world: {
      sync: createBlockWorld(blocks)
    }
  }
}

describe('Bedrock sneak and sprint physics/input', function () {
  it('sends held and transition sneak flags and updates local crouch pose immediately', function () {
    const { botState, client, controls, sender } = createControlBot()
    const startingMovementY = botState.self.position.y

    botState.setControlState('sneak', true)
    let packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.sneaking, true)
    assert.strictEqual(packet.input_data.sneak_down, true)
    assert.strictEqual(packet.input_data.want_down, true)
    assert.strictEqual(packet.input_data.start_sneaking, true)
    assert.strictEqual(packet.input_data.stop_sneaking, false)
    assert.strictEqual(packet.input_data.sneak_pressed_raw, true)
    assert.strictEqual(packet.input_data.sneak_released_raw, false)
    assert.strictEqual(packet.input_data.sneak_current_raw, true)
    assert.strictEqual(botState.self.sneaking, true)
    assert.strictEqual(botState.self.crouching, true)
    assert.strictEqual(botState.self.pose, 'sneaking')
    assert.strictEqual(botState.self.inferredPose, 'sneaking')
    assert.strictEqual(botState.self.eyeHeight, Math.fround(1.6200100183486938))
    assert.strictEqual(botState.self.position.y, startingMovementY)
    assert.strictEqual(packet.position.y, startingMovementY)

    packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.sneaking, true)
    assert.strictEqual(packet.input_data.sneak_down, true)
    assert.strictEqual(packet.input_data.start_sneaking, false)
    assert.strictEqual(packet.input_data.stop_sneaking, false)
    assert.strictEqual(packet.input_data.sneak_pressed_raw, false)
    assert.strictEqual(packet.input_data.sneak_released_raw, false)
    assert.strictEqual(packet.input_data.sneak_current_raw, true)
    assert.strictEqual(packet.position.y, startingMovementY)

    botState.setControlState('sneak', false)
    packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.sneaking, false)
    assert.strictEqual(packet.input_data.sneak_down, false)
    assert.strictEqual(packet.input_data.want_down, false)
    assert.strictEqual(packet.input_data.start_sneaking, false)
    assert.strictEqual(packet.input_data.stop_sneaking, true)
    assert.strictEqual(packet.input_data.sneak_pressed_raw, false)
    assert.strictEqual(packet.input_data.sneak_released_raw, true)
    assert.strictEqual(packet.input_data.sneak_current_raw, false)
    assert.strictEqual(botState.self.sneaking, false)
    assert.strictEqual(botState.self.crouching, false)
    assert.strictEqual(botState.self.pose, 'standing')
    assert.strictEqual(botState.self.inferredPose, 'standing')
    assert.strictEqual(botState.self.eyeHeight, Math.fround(1.6200100183486938))
    assert.strictEqual(botState.self.position.y, startingMovementY)
    assert.strictEqual(packet.position.y, startingMovementY)
  })

  it('restores swimming pose after sneak is released while swim control remains held', function () {
    const { botState, controls, sender, client } = createControlBot()

    botState.setControlState('swim', true)
    botState.setControlState('sneak', true)
    sendAuthPacket(controls, sender, client)

    botState.setControlState('sneak', false)
    const packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.stop_sneaking, true)
    assert.strictEqual(packet.input_data.start_swimming, false)
    assert.strictEqual(botState.self.pose, 'swimming')
    assert.strictEqual(botState.self.inferredPose, 'swimming')
    assert.strictEqual(botState.self.swimming, true)
    assert.strictEqual(botState.self.eyeHeight, Math.fround(1.6200100183486938))
  })

  it('sends held and transition sprint flags without inventing a sprinting pose', function () {
    const { botState, client, controls, sender } = createControlBot()

    botState.setControlState('sprint', true)
    let packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.sprint_down, true)
    assert.strictEqual(packet.input_data.sprinting, false)
    assert.strictEqual(packet.input_data.start_sprinting, false)
    assert.strictEqual(botState.self.sprinting, false)

    botState.setControlState('forward', true)
    packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.up, true)
    assert.strictEqual(packet.input_data.sprint_down, true)
    assert.strictEqual(packet.input_data.sprinting, true)
    assert.strictEqual(packet.input_data.start_sprinting, true)
    assert.strictEqual(packet.input_data.stop_sprinting, false)
    assert.strictEqual(botState.self.sprinting, true)
    assert.notStrictEqual(botState.self.pose, 'sprinting')
    assert.notStrictEqual(botState.self.inferredPose, 'sprinting')

    botState.setControlState('sprint', false)
    packet = sendAuthPacket(controls, sender, client)

    assert.strictEqual(packet.input_data.sprint_down, false)
    assert.strictEqual(packet.input_data.sprinting, false)
    assert.strictEqual(packet.input_data.start_sprinting, false)
    assert.strictEqual(packet.input_data.stop_sprinting, true)
    assert.strictEqual(botState.self.sprinting, false)
    assert.notStrictEqual(botState.self.pose, 'sprinting')
  })

  it('allows ordinary walking to advance over an unsupported platform edge', function () {
    const engine = createBedrockPhysicsEngine()
    const botState = createPhysicsBot()

    const result = engine.simulateSelf(botState, {}, botState.world.sync, C)

    assert(result.appliedMove.z > 0.2, `Expected normal walk to advance over edge, got ${result.appliedMove.z}`)
    assert(botState.self.position.z > 0.7, `Expected normal walk position past edge, got ${botState.self.position.z}`)
  })

  it('allows sneaking overhang at an unsupported platform edge', function () {
    const engine = createBedrockPhysicsEngine()
    const botState = createPhysicsBot({ sneaking: true })

    const result = engine.simulateSelf(botState, {}, botState.world.sync, C)

    assert(result.appliedMove.z <= 0.400001, `Expected sneak walk to allow one-tick overhang, got ${result.appliedMove.z}`)
    assert(botState.self.position.z <= 0.900001, `Expected sneaking position to remain near the edge, got ${botState.self.position.z}`)
    assert.strictEqual(result.horizontalCollision, false)
  })

  it('does not clamp sneaking movement when bridge blocks support the player footprint', function () {
    const engine = createBedrockPhysicsEngine()
    const botState = createPhysicsBot({
      sneaking: true,
      blocks: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }
      ]
    })

    const result = engine.simulateSelf(botState, {}, botState.world.sync, C)

    assert(result.appliedMove.z > 0.35, `Expected supported sneak walk to keep moving, got ${result.appliedMove.z}`)
    assert(botState.self.position.z > 0.85, `Expected supported sneaking position to advance, got ${botState.self.position.z}`)
    assert.strictEqual(result.horizontalCollision, false)
  })
})
