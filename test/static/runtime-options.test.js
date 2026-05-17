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

    assert.strictEqual(bot.options.worldDecodeEnabled, true)
    assert.strictEqual(bot.options.physicsEnabled, true)
    assert.strictEqual(bot.options.physicsEngine, 'native')
  })

  it('supports selecting the nxg physics wrapper', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEngine: 'nxg-org'
    })

    assert.strictEqual(bot.options.physicsEngine, 'nxg')
  })

  it('supports explicitly disabled physics', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false
    })

    assert.strictEqual(bot.options.worldDecodeEnabled, true)
    assert.strictEqual(bot.options.physicsEnabled, false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'physics.js'), false)
    assert.strictEqual(pluginLoader.shouldLoadBuiltin(bot, 'chunks.js'), true)
  })

  it('disables physics by default when world decoding is disabled', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      worldDecodeEnabled: false
    })

    assert.strictEqual(bot.options.worldDecodeEnabled, false)
    assert.strictEqual(bot.options.physicsEnabled, false)
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

  it('keeps world state owned by the bot and resettable on dimension changes', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false
    })
    const originalWorld = bot.world

    bot.setDimension(1, { resetWorld: true })

    assert.notStrictEqual(bot.world, originalWorld)
    assert.strictEqual(bot.game.dimension, 1)
  })

  it('keeps categorized state off top-level primitive aliases', function () {
    const bot = new BotState({
      username: 'RuntimeOptionsBot',
      physicsEnabled: false
    })

    for (const key of [
      'dimension',
      'playerHealth',
      'spawnPosition',
      'worldMinY',
      'chunkCount',
      'blockNetworkIdsAreHashes',
      'sentAvailableCommandsReadyPackets',
      'worldDecodeEnabled',
      'physicsEnabled',
      'runtimeState'
    ]) {
      assert.strictEqual(Object.hasOwn(bot, key), false, key)
    }
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
