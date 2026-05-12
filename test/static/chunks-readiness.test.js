'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const injectChunks = require('../../src/builtins/chunks')

function createBotState () {
  const client = new EventEmitter()
  client.queue = () => {}

  return {
    client,
    world: {},
    registry: {},
    chunkColumn: function ChunkColumn () {},
    spawnPosition: new Vec3(0, 64, 0)
  }
}

function chunkKey (cx, cz) {
  return `${cx},${cz}`
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
})
