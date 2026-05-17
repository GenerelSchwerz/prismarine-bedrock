'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const { pathfinder } = require('mineflayer-pathfinder')
const mineflayerCompatPlugin = require('../../src/builtins/mineflayer-compat')

function createCompatState () {
  const registry = require('prismarine-registry')('bedrock_1.26.10')
  const state = new EventEmitter()

  state.registry = registry
  state.blockClass = require('prismarine-block')(registry)
  state.client = { entityId: 1n }
  state.self = {
    runtimeId: 1n,
    name: 'player',
    position: new Vec3(0, 65.62, 0),
    velocity: new Vec3(0, 0, 0),
    onGround: true,
    effects: {}
  }
  state.entities = new Map()
  state.players = new Map([[1n, state.self]])
  state.inventory = {
    slots: [
      null,
      { type: registry.itemsByName.dirt.id, name: 'dirt', count: 3 },
      null
    ]
  }
  state.game = { gameMode: 'survival' }
  state.worldMinY = -64
  state.worldHeight = 384
  state.controlState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    sneak: false
  }
  state.setControlState = (name, value) => {
    state.controlState[name] = value
  }
  state.clearControlStates = () => {
    for (const key of Object.keys(state.controlState)) state.controlState[key] = false
  }
  state.look = (yaw, pitch) => {
    state.self.yaw = yaw
    state.self.pitch = pitch
  }
  state.lookAt = () => {}
  state.world = {
    sync: {
      getBlock (pos) {
        return {
          position: pos,
          type: registry.blocksByName.air.id,
          name: 'air',
          boundingBox: 'empty',
          shapes: []
        }
      }
    }
  }

  return state
}

describe('mineflayer compatibility facade', function () {
  it('exposes Mineflayer-shaped wrappers without replacing native maps', function () {
    const state = createCompatState()
    const cow = {
      runtimeId: 2n,
      name: 'cow',
      width: 0.9,
      height: 1.4,
      position: new Vec3(2, 65, 2)
    }
    state.entities.set(2n, cow)

    mineflayerCompatPlugin(state)

    const bot = state.asMineflayerBot()
    assert.strictEqual(state.entities instanceof Map, true)
    assert.notStrictEqual(bot.entity, state.self)
    assert.strictEqual(bot.entity.position.y, 64)
    assert.deepStrictEqual(Object.values(bot.entities).map(entity => entity.name).sort(), ['cow', 'player'])
    assert.strictEqual(bot.inventory.items().length, 1)
    assert.strictEqual(bot.game.minY, -64)
    assert.strictEqual(bot.version, 'bedrock_1.26.10')
    assert.strictEqual(bot.blockAt(new Vec3(1.8, 65.2, 1.1)).position.x, 1)

    bot.look(Math.PI / 2, -Math.PI / 4)
    assert.strictEqual(state.self.yaw, 90)
    assert.strictEqual(state.self.pitch, -45)

    bot.look(0, 0)
    assert.strictEqual(state.self.yaw, 180)
  })

  it('loads upstream mineflayer-pathfinder against the facade', function () {
    const state = createCompatState()
    mineflayerCompatPlugin(state)

    state.loadPlugin(pathfinder)

    assert.ok(state.pathfinder)
    assert.strictEqual(state.mineflayer.pathfinder, state.pathfinder)
    assert.strictEqual(typeof state.pathfinder.goto, 'function')
    assert.strictEqual(typeof state.pathfinder.getPathFromTo, 'function')
    assert.strictEqual(typeof state.pathfinder.movements.getNeighbors, 'function')
  })
})
