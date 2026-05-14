'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const BotState = require('../../src/state')
const pluginLoader = require('../../src/plugin-loader')
const setupPlugin = require('../../src/builtins/setup')

function createSetupBotState () {
  const client = new EventEmitter()
  client.entityId = 1n
  client.queued = []
  client.queue = (name, params) => {
    client.queued.push({ name, params })
  }

  const registry = require('prismarine-registry')('bedrock_1.26.10')
  registry.handleStartGame = () => {}

  return {
    client,
    registry,
    blockClass: require('prismarine-block')(registry),
    game: {}
  }
}

describe('runtime options', function () {
  it('defaults to world decoding with physics mode for compatibility', function () {
    const bot = new BotState({ username: 'RuntimeOptionsBot' })

    assert.strictEqual(bot.worldDecodeEnabled, true)
    assert.strictEqual(bot.physicsEnabled, true)
    assert.strictEqual(bot.options.worldDecodeEnabled, true)
    assert.strictEqual(bot.options.physicsEnabled, true)
  })

  it('supports explicitly disabled physics', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false
    })

    assert.strictEqual(bot.worldDecodeEnabled, true)
    assert.strictEqual(bot.physicsEnabled, false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'physics.js'), false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'chunks.js'), true)
  })

  it('disables physics by default when world decoding is disabled', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      worldDecodeEnabled: false
    })

    assert.strictEqual(bot.worldDecodeEnabled, false)
    assert.strictEqual(bot.physicsEnabled, false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'physics.js'), false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'chunks.js'), false)
  })

  it('rejects physics without world decoding', function () {
    assert.throws(
      () => new BotState({
        username: 'RuntimeOptionsBot',
        worldDecodeEnabled: false,
        physicsEnabled: true
      }),
      /physicsEnabled requires worldDecodeEnabled: true/
    )
  })

  it('uses an externally supplied world instance', function () {
    const externalWorld = {
      getBlock: async () => ({ name: 'stone' }),
      sync: {
        getBlock: () => ({ name: 'stone' })
      }
    }

    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false,
      world: externalWorld
    })

    assert.strictEqual(bot.world, externalWorld)
    assert.strictEqual(bot.externalWorld, true)
  })

  it('does not request chunk radius when world decoding is disabled', function () {
    const botState = createSetupBotState()

    setupPlugin(botState, { worldDecodeEnabled: false })
    botState.client.emit('play_status', { status: 'player_spawn' })

    assert.deepStrictEqual(
      botState.client.queued.map(packet => packet.name),
      ['set_local_player_as_initialized']
    )
  })

  it('keeps plugin loading state in the external loader', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false
    })
    const plugin = (botState) => {
      botState.loaderTestRan = true
    }

    assert.strictEqual(typeof bot.loadPlugin, 'undefined')
    pluginLoader.loadPlugin(bot, plugin)
    assert.strictEqual(pluginLoader.hasPlugin(bot, plugin), true)
    pluginLoader.injectPlugins(bot)

    assert.strictEqual(bot.loaderTestRan, true)
    assert.strictEqual(bot.pluginLoader, undefined)
    assert.strictEqual(pluginLoader.isInjected(bot), true)
  })
})
