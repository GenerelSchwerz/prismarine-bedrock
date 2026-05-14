'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const injectChunks = require('../../src/builtins/chunks')

function createBotState () {
  const client = new EventEmitter()
  client.queued = []
  client.queue = (name, params) => {
    client.queued.push({ name, params })
  }

  return {
    client,
    world: {
      setColumn: async () => {}
    },
    registry: {},
    chunkColumn: function ChunkColumn () {
      this.sections = []
      this.networkDecodeSubChunkNoCache = async () => {}
    },
    spawnPosition: new Vec3(0, 64, 0)
  }
}

function chunkKey (cx, cz) {
  return `${cx},${cz}`
}

function waitImmediate () {
  return new Promise(resolve => setImmediate(resolve))
}

describe('chunk readiness helpers', function () {
  it('requires all chunks around the center position, not just the current chunk', function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.loadedChunks.add(chunkKey(0, 0))

    assert.strictEqual(
      botState.areChunksLoadedAround(16, new Vec3(8, 64, 8)),
      false
    )

    for (let cx = -1; cx <= 1; cx++) {
      for (let cz = -1; cz <= 1; cz++) {
        botState.loadedChunks.add(chunkKey(cx, cz))
      }
    }

    assert.strictEqual(
      botState.areChunksLoadedAround(16, new Vec3(8, 64, 8)),
      true
    )
  })

  it('decodes network chunk publisher y before using it as subchunk origin', async function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.self = { position: new Vec3(0, 80, 0) }

    botState.client.emit('network_chunk_publisher_update', {
      coordinates: { x: 0, y: 117, z: 0 },
      radius: 64
    })

    botState.client.emit('level_chunk', {
      x: 2,
      z: -3,
      sub_chunk_count: -1,
      dimension: 0
    })

    await waitImmediate()

    assert.deepStrictEqual(botState.rawChunkPublisherCenter, { x: 0, y: 117, z: 0 })
    assert.deepStrictEqual(botState.chunkPublisherCenter, { x: 0, y: -59, z: 0 })

    const request = botState.client.queued.find(packet => packet.name === 'subchunk_request')
    assert.ok(request)
    assert.deepStrictEqual(request.params.origin, { x: 2, y: -4, z: -3 })
    assert.deepStrictEqual(request.params.requests, [
      { dx: 0, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 }
    ])
  })

  it('uses direct network chunk publisher y when it matches the teleported player height', async function () {
    const botState = createBotState()
    botState.version = '1.26.10'
    injectChunks(botState)

    botState.self = { position: new Vec3(0, 64, 0) }

    botState.client.emit('network_chunk_publisher_update', {
      coordinates: { x: 0, y: 65, z: 0 },
      radius: 64
    })

    botState.client.emit('level_chunk', {
      x: 0,
      z: 0,
      sub_chunk_count: -1,
      dimension: 0
    })

    await waitImmediate()

    assert.deepStrictEqual(botState.rawChunkPublisherCenter, { x: 0, y: 65, z: 0 })
    assert.deepStrictEqual(botState.chunkPublisherCenter, { x: 0, y: 65, z: 0 })

    const request = botState.client.queued.find(packet => packet.name === 'subchunk_request')
    assert.ok(request)
    assert.deepStrictEqual(request.params.origin, { x: 0, y: 4, z: 0 })
    assert.deepStrictEqual(request.params.requests, [
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 }
    ])
  })

  it('falls back to player section when decoded publisher y is outside world bounds', async function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.self = { position: new Vec3(0, 80, 0) }

    botState.client.emit('network_chunk_publisher_update', {
      coordinates: { x: 0, y: 65538, z: 0 },
      radius: 64
    })

    botState.client.emit('level_chunk', {
      x: 2,
      z: -3,
      sub_chunk_count: -1,
      dimension: 0
    })

    await waitImmediate()

    assert.deepStrictEqual(botState.chunkPublisherCenter, { x: 0, y: 32769, z: 0 })

    const request = botState.client.queued.find(packet => packet.name === 'subchunk_request')
    assert.ok(request)
    assert.deepStrictEqual(request.params.origin, { x: 2, y: 5, z: -3 })
    assert.deepStrictEqual(request.params.requests, [
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 }
    ])
  })

  it('falls back to world minimum section when publisher and player y are outside world bounds', async function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.self = { position: new Vec3(0, 32768, 0) }

    botState.client.emit('network_chunk_publisher_update', {
      coordinates: { x: 0, y: 65538, z: 0 },
      radius: 64
    })

    botState.client.emit('level_chunk', {
      x: 2,
      z: -3,
      sub_chunk_count: -1,
      dimension: 0
    })

    await waitImmediate()

    const request = botState.client.queued.find(packet => packet.name === 'subchunk_request')
    assert.ok(request)
    assert.deepStrictEqual(request.params.origin, { x: 2, y: -4, z: -3 })
  })

  it('counts success_all_air subchunk responses as loaded sections', function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.networkChunks.set(chunkKey(0, 0), new botState.chunkColumn())

    botState.client.emit('subchunk', {
      origin: { x: 0, y: -4, z: 0 },
      cache_enabled: false,
      entries: [
        { result: 'success_all_air', dx: 0, dy: 0, dz: 0, payload: Buffer.alloc(0) }
      ]
    })

    assert.strictEqual(
      botState.areChunksLoadedAround(0, new Vec3(8, -64, 8), 0),
      true
    )
  })

  it('uses the network chunk publisher height for subchunk readiness', async function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.client.emit('network_chunk_publisher_update', {
      coordinates: { x: 0, y: 117, z: 0 },
      radius: 64
    })

    for (let cx = -1; cx <= 0; cx++) {
      for (let cz = -1; cz <= 0; cz++) {
        botState.client.emit('subchunk', {
          origin: { x: cx, y: -4, z: cz },
          cache_enabled: false,
          entries: [
            { result: 'success', dx: 0, dy: 0, dz: 0, payload: Buffer.alloc(0) },
            { result: 'success_all_air', dx: 0, dy: 1, dz: 0, payload: Buffer.alloc(0) }
          ]
        })
      }
    }

    await waitImmediate()

    assert.strictEqual(
      botState.areChunksLoadedAround(2, new Vec3(0, 0, 0), 1),
      true
    )
  })

  it('requests chunk data around the player after server teleport', function () {
    const botState = createBotState()
    botState.client.entityId = 1n
    botState.dimension = 0
    botState.blockNetworkIdsAreHashes = true
    injectChunks(botState)

    botState.client.emit('move_player', {
      runtime_id: 1,
      position: { x: 17.5, y: 81.62, z: 16.5 },
      mode: 'teleport'
    })

    const radiusRequest = botState.client.queued.find(packet => packet.name === 'request_chunk_radius')
    const subchunkRequests = botState.client.queued.filter(packet => packet.name === 'subchunk_request')

    assert.ok(radiusRequest)
    assert.strictEqual(subchunkRequests.length > 0, true)
    assert.deepStrictEqual(subchunkRequests[0].params.origin, { x: 0, y: 5, z: 0 })
    assert.deepStrictEqual(subchunkRequests[0].params.requests, [
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 }
    ])
  })

  it('does not send subchunk requests after Geyser-style teleports', function () {
    const botState = createBotState()
    botState.client.entityId = 1n
    botState.dimension = 0
    botState.blockNetworkIdsAreHashes = false
    injectChunks(botState)

    botState.client.emit('move_player', {
      runtime_id: 1,
      position: { x: 17.5, y: 81.62, z: 16.5 },
      mode: 'teleport'
    })

    assert.ok(botState.client.queued.find(packet => packet.name === 'request_chunk_radius'))
    assert.strictEqual(
      botState.client.queued.some(packet => packet.name === 'subchunk_request'),
      false
    )
  })

  it('applies update_subchunk_blocks using absolute block positions', async function () {
    const updates = []
    const botState = createBotState()

    botState.registry = {
      blocksByRuntimeId: {
        7: { stateId: 123 }
      }
    }
    botState.world.getColumnAt = async () => ({})
    botState.world.setBlockStateId = async (pos, stateId) => {
      updates.push({ pos, stateId })
    }

    injectChunks(botState)

    botState.client.emit('update_subchunk_blocks', {
      x: 99,
      y: 99,
      z: 99,
      blocks: [
        {
          position: { x: 5, y: 34359738307, z: -6 },
          runtime_id: 7
        }
      ]
    })

    await waitImmediate()

    assert.strictEqual(updates.length, 1)
    assert.deepStrictEqual(
      { x: updates[0].pos.x, y: updates[0].pos.y, z: updates[0].pos.z },
      { x: 5, y: -61, z: -6 }
    )
    assert.strictEqual(updates[0].stateId, 123)
  })

  it('drops active world decode state on dimension change', function () {
    const botState = createBotState()
    injectChunks(botState)

    botState.blobCache.set('blob', Buffer.alloc(0))
    botState.pendingBlobRequests.set('blob', { type: 'level_chunk' })
    botState.networkChunks.set(chunkKey(0, 0), new botState.chunkColumn())
    botState.pendingSubchunkRequests.set(chunkKey(0, 0), { sectionYs: new Set([-4]) })
    botState.loadedChunks.add(chunkKey(0, 0))
    botState.loadedChunkSections.set(chunkKey(0, 0), new Set([-4]))
    botState.chunkCount = 1
    botState.chunkPublisherCenter = { x: 0, y: 64, z: 0 }
    botState.chunkPublisherRadius = 64

    botState.client.emit('change_dimension', { dimension: 1 })

    assert.strictEqual(botState.dimension, 1)
    assert.strictEqual(botState.blobCache.size, 0)
    assert.strictEqual(botState.pendingBlobRequests.size, 0)
    assert.strictEqual(botState.networkChunks.size, 0)
    assert.strictEqual(botState.pendingSubchunkRequests.size, 0)
    assert.strictEqual(botState.loadedChunks.size, 0)
    assert.strictEqual(botState.loadedChunkSections.size, 0)
    assert.strictEqual(botState.chunkCount, 0)
    assert.strictEqual(botState.chunkPublisherCenter, null)
    assert.strictEqual(botState.chunkPublisherRadius, null)
  })
})
