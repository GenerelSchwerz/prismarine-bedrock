const assert = require('assert')
const EventEmitter = require('events')
const Vec3 = require('vec3')

const installEntities = require('../../src/builtins/entities')
const installPhysics = require('../../src/builtins/physics')

class TestEntity {
  constructor (id) {
    this.id = id
    this.position = new Vec3(0, 0, 0)
    this.velocity = new Vec3(0, 0, 0)
  }
}

function createClient () {
  const client = new EventEmitter()
  client.entityId = 1n
  client.queue = () => {}
  return client
}

describe('Bedrock rotation mapping', function () {
  it('uses vec2f.z as yaw when physics handles start_game', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.version = '1.26.10'
    botState.worldDecodeEnabled = true
    botState.physicsEnabled = true
    botState.self = new TestEntity(1n)
    botState.self.runtimeId = 1n
    botState.world = {
      sync: { getBlock: () => null },
      waitForChunks: async () => {}
    }

    installPhysics(botState, { worldDecodeEnabled: true, physicsEnabled: true })

    client.emit('start_game', {
      player_position: { x: 1, y: 65, z: 2 },
      rotation: { x: 12, z: 34 }
    })

    assert.strictEqual(botState.self.pitch, 12)
    assert.strictEqual(botState.self.yaw, 34)
    assert.strictEqual(botState.self.headYaw, 34)
  })

  it('uses vec2f.z as yaw when entities handles movement correction and prediction_type is "vehicle"', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.registry = { entitiesArray: [] }
    botState.entityClass = TestEntity
    botState.itemClass = { fromNotch: () => null }
    botState.entities = new Map()
    botState.players = new Map()
    botState.self = new TestEntity(1n)
    botState.self.pitch = 10;
    botState.self.yaw = 20;
    botState.self.headYaw = 30 

    installEntities(botState, {})

    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 15, z: 75 },
      on_ground: true,
      prediction_type: 'vehicle'
    })

    assert.strictEqual(botState.self.pitch, 15)
    assert.strictEqual(botState.self.yaw, 75)
    assert.strictEqual(botState.self.headYaw, 75)
  })

  it('preserves rotation when entities handles movement correction and prediction_type is "player"', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.registry = { entitiesArray: [] }
    botState.entityClass = TestEntity
    botState.itemClass = { fromNotch: () => null }
    botState.entities = new Map()
    botState.players = new Map()
    botState.self = new TestEntity(1n)
    botState.self.pitch = 10;
    botState.self.yaw = 20;
    botState.self.headYaw = 30

    installEntities(botState, {})

    // Rotation is zero-filled by the parser for "player" predictions
    // (only sent on the wire when prediction_type is "vehicle"); writing
    // it would snap the bot's yaw/pitch to 0.
    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 0, z: 0 },
      on_ground: true,
      prediction_type: 'player'
    })

    assert.strictEqual(botState.self.pitch, 10)
    assert.strictEqual(botState.self.yaw, 20)
    assert.strictEqual(botState.self.headYaw, 30)
  })

  it('uses vec2f.z as yaw when physics handles movement correction and prediction_type is "vehicle"', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.version = '1.26.10'
    botState.worldDecodeEnabled = true
    botState.physicsEnabled = true
    botState.self = new TestEntity(1n)
    botState.self.runtimeId = 1n
    botState.self.pitch = 10;
    botState.self.yaw = 20;
    botState.self.headYaw = 30
    botState.world = {
      sync: { getBlock: () => null },
      waitForChunks: async () => {}
    }

    installPhysics(botState, { worldDecodeEnabled: true, physicsEnabled: true })

    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 15, z: 75 },
      on_ground: true,
      prediction_type: 'vehicle'
    })

    assert.strictEqual(botState.self.pitch, 15)
    assert.strictEqual(botState.self.yaw, 75)
    assert.strictEqual(botState.self.headYaw, 75)

    client.emit('close')
  })

  it('preserves rotation when physics handles movement correction and prediction_type is "player"', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.version = '1.26.10'
    botState.worldDecodeEnabled = true
    botState.physicsEnabled = true
    botState.self = new TestEntity(1n)
    botState.self.runtimeId = 1n
    botState.self.pitch = 10;
    botState.self.yaw = 20;
    botState.self.headYaw = 30
    botState.world = {
      sync: { getBlock: () => null },
      waitForChunks: async () => {}
    }

    installPhysics(botState, { worldDecodeEnabled: true, physicsEnabled: true })

    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 0, z: 0 },
      on_ground: true,
      prediction_type: 'player'
    })

    assert.strictEqual(botState.self.pitch, 10)
    assert.strictEqual(botState.self.yaw, 20)
    assert.strictEqual(botState.self.headYaw, 30)

    client.emit('close')
  })
})
