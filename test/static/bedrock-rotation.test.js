const assert = require('assert')
const EventEmitter = require('events')
const Vec3 = require('vec3')

const installEntities = require('../../src/builtins/entities')
const installPhysics = require('../../src/builtins/physics')
const { createMovementPacketSender } = require('../../src/builtins/physics/movement-packets')
const { eyeHeightFor, toFeetPosition } = require('../../src/builtins/physics/position')
const { getConstants } = require('../../src/builtins/physics-constants')

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
    assert.strictEqual(botState.self.position.y, 65)
  })

  it('does not change look rotation when physics handles movement correction', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.version = '1.26.10'
    botState.worldDecodeEnabled = true
    botState.physicsEnabled = true
    botState.self = new TestEntity(1n)
    botState.self.runtimeId = 1n
    botState.self.pitch = 5
    botState.self.yaw = 25
    botState.self.headYaw = 25
    botState.world = {
      sync: { getBlock: () => null },
      waitForChunks: async () => {}
    }

    installPhysics(botState, { worldDecodeEnabled: true, physicsEnabled: true })

    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 15, z: 75 },
      on_ground: true
    })

    assert.strictEqual(botState.self.pitch, 5)
    assert.strictEqual(botState.self.yaw, 25)
    assert.strictEqual(botState.self.headYaw, 25)
    assert.strictEqual(botState.self.position.y, 65)
  })

  it('does not change look rotation when entities handles movement correction', function () {
    const client = createClient()
    const botState = new EventEmitter()
    botState.client = client
    botState.registry = { entitiesArray: [] }
    botState.entityClass = TestEntity
    botState.itemClass = { fromNotch: () => null }
    botState.entities = new Map()
    botState.players = new Map()
    botState.self = new TestEntity(1n)
    botState.self.pitch = 5
    botState.self.yaw = 25
    botState.self.headYaw = 25

    installEntities(botState, {})

    client.emit('correct_player_move_prediction', {
      position: { x: 1, y: 65, z: 2 },
      rotation: { x: 15, z: 75 },
      on_ground: true
    })

    assert.strictEqual(botState.self.pitch, 5)
    assert.strictEqual(botState.self.yaw, 25)
    assert.strictEqual(botState.self.headYaw, 25)
    assert.strictEqual(botState.self.position.y, 65)
  })

  it('sends player_auth_input from the public eye position', function () {
    const client = createClient()
    let sentPacket = null
    client.queue = (name, packet) => {
      if (name === 'player_auth_input') sentPacket = packet
    }

    const botState = new EventEmitter()
    botState.client = client
    botState.canSendPlayerAuthInput = true
    botState.world = { sync: { getBlock: () => null } }
    botState.self = new TestEntity(1n)
    botState.self.position = new Vec3(1, 65.62, 2)
    botState.self.yaw = 90
    botState.self.pitch = 0

    const sender = createMovementPacketSender(botState, getConstants('1.26.10'))
    sender.sendPlayerAuthInput(0)

    assert.deepStrictEqual(sentPacket.position, { x: 1, y: 65.62, z: 2 })
  })

  it('derives eye-to-feet offsets from pose using f32 Bedrock heights', function () {
    const C = getConstants('1.26.10')
    const self = new TestEntity(1n)
    self.position = new Vec3(1, 65.62, 2)

    self.pose = 'standing'
    assert.strictEqual(eyeHeightFor(self, C), Math.fround(1.62))
    assert.strictEqual(toFeetPosition(self.position, self, C).y, 65.62 - Math.fround(1.62))
    assert.strictEqual(self.eyeHeight, Math.fround(1.62))

    self.pose = 'sneaking'
    assert.strictEqual(eyeHeightFor(self, C), Math.fround(1.27))
    assert.strictEqual(toFeetPosition(self.position, self, C).y, 65.62 - Math.fround(1.27))

    self.pose = 'standing'
    self.swimming = true
    assert.strictEqual(eyeHeightFor(self, C), Math.fround(0.4))
    assert.strictEqual(toFeetPosition(self.position, self, C).y, 65.62 - Math.fround(0.4))
  })
})
