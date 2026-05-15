'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const environmentPlugin = require('../../src/builtins/environment')

function createBotState () {
  const client = new EventEmitter()
  const botState = new EventEmitter()
  botState.client = client
  environmentPlugin(botState)
  return { botState, client }
}

describe('environment builtin', function () {
  it('tracks server time and derives time of day', function () {
    const { botState, client } = createBotState()
    const seen = []
    botState.on('time', event => seen.push(event))

    client.emit('set_time', { time: 25000 })

    assert.strictEqual(botState.time, 25000)
    assert.strictEqual(botState.timeOfDay, 1000)
    assert.strictEqual(botState.day, 1)
    assert.strictEqual(botState.environment.time, 25000)
    assert.strictEqual(seen.length, 1)
    assert.strictEqual(seen[0].timeOfDay, 1000)
  })

  it('initializes weather from start_game rain and lightning levels', function () {
    const { botState, client } = createBotState()

    client.emit('start_game', {
      rain_level: 0.5,
      lightning_level: 0.25
    })

    assert.deepStrictEqual(botState.weather, {
      rainLevel: 0.5,
      lightningLevel: 0.25,
      raining: true,
      thundering: true
    })
    assert.strictEqual(botState.environment.lastWeatherEvent, 'start_game')
  })

  it('tracks rain and thunder level events', function () {
    const { botState, client } = createBotState()
    const seen = []
    botState.on('weather', event => seen.push(event))

    client.emit('level_event', { event: 'start_rain', data: 0, position: { x: 0, y: 0, z: 0 } })
    client.emit('level_event', { event: 'start_thunder', data: 0, position: { x: 0, y: 0, z: 0 } })

    assert.strictEqual(botState.weather.raining, true)
    assert.strictEqual(botState.weather.thundering, true)
    assert.strictEqual(botState.weather.rainLevel, 1)
    assert.strictEqual(botState.weather.lightningLevel, 1)

    client.emit('level_event', { event: 'stop_thunder', data: 0, position: { x: 0, y: 0, z: 0 } })
    client.emit('level_event', { event: 'stop_rain', data: 0, position: { x: 0, y: 0, z: 0 } })

    assert.strictEqual(botState.weather.raining, false)
    assert.strictEqual(botState.weather.thundering, false)
    assert.strictEqual(botState.weather.rainLevel, 0)
    assert.strictEqual(botState.weather.lightningLevel, 0)
    assert.strictEqual(seen.length, 4)
    assert.strictEqual(seen.at(-1).lastWeatherEvent, 'stop_rain')
  })

  it('maps numeric Bedrock weather events', function () {
    assert.strictEqual(environmentPlugin.weatherEventName(3001), 'start_rain')
    assert.strictEqual(environmentPlugin.weatherEventName(3002), 'start_thunder')
    assert.strictEqual(environmentPlugin.weatherEventName(3003), 'stop_rain')
    assert.strictEqual(environmentPlugin.weatherEventName(3004), 'stop_thunder')
  })
})
