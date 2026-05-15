'use strict'

const assert = require('assert')
const BotState = require('../../src/state')
const { sendCommand } = require('../helpers/commands')
const {
  HOST,
  PORT,
  OFFLINE,
  VERSION
} = require('../helpers/test-env')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const TARGET = process.env.E2E_SERVER_TARGET || `port-${PORT}`
const ENVIRONMENT_USERNAME = process.env.ENVIRONMENT_USERNAME || environmentUsernameForTarget(TARGET)

function environmentUsernameForTarget (target) {
  const suffix = String(target).replace(/[^A-Za-z0-9]/g, '').slice(0, 10)
  return suffix ? `Env${suffix}` : 'EnvBot'
}

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${botState.options.username} spawn`)), timeoutMs)
    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

async function waitForPredicate (predicate, label, timeoutMs = 15000, intervalMs = 100) {
  const started = Date.now()
  let lastValue
  while (Date.now() - started < timeoutMs) {
    lastValue = predicate()
    if (lastValue) return lastValue
    await sleep(intervalMs)
  }
  throw new Error(`Timed out waiting for ${label}; last=${JSON.stringify(lastValue)}`)
}

async function connectBot () {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username: ENVIRONMENT_USERNAME,
    offline: OFFLINE,
    version: VERSION,
    worldDecodeEnabled: false
  })

  botState.start()
  await waitForSpawn(botState)
  return botState
}

describe('live environment builtin', function () {
  this.timeout(120000)

  let botState

  before(async function () {
    botState = await connectBot()
  })

  after(function () {
    if (!botState?.client) return
    sendCommand(botState, 'weather clear')
    sendCommand(botState, 'time set day')
    botState.disconnect('live environment builtin test complete')
  })

  it('tracks time updates from server commands', async function () {
    assert(botState.environment, 'environment state is missing')
    assert.strictEqual(typeof botState.getEnvironment, 'function')

    sendCommand(botState, 'time set 18000')
    await waitForPredicate(
      () => botState.timeOfDay === 18000 && botState.time >= 18000,
      'time set 18000'
    )

    sendCommand(botState, 'time set 6000')
    await waitForPredicate(
      () => botState.timeOfDay === 6000 && botState.time >= 6000,
      'time set 6000'
    )
  })

  it('tracks rain and thunder updates from server commands', async function () {
    sendCommand(botState, 'weather clear')
    await waitForPredicate(
      () => botState.weather.raining === false && botState.weather.thundering === false,
      'clear weather before weather assertions'
    )

    sendCommand(botState, 'weather rain 10000')
    await waitForPredicate(
      () => botState.weather.raining === true,
      'rain weather'
    )

    sendCommand(botState, 'weather thunder 10000')
    await waitForPredicate(
      () => botState.weather.thundering === true,
      'thunder weather'
    )

    sendCommand(botState, 'weather clear')
    await waitForPredicate(
      () => botState.weather.raining === false && botState.weather.thundering === false,
      'clear weather after weather assertions'
    )
  })
})
