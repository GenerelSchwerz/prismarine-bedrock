'use strict'

const assert = require('assert')
const BotState = require('../../src/state')
const {
  HOST,
  PORT,
  OFFLINE,
  VERSION
} = require('../helpers/test-env')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const TARGET = process.env.E2E_SERVER_TARGET || `port-${PORT}`
const CHAT_USERNAME = process.env.CHAT_USERNAME || chatUsernameForTarget(TARGET)

function chatUsernameForTarget (target) {
  const suffix = String(target).replace(/[^A-Za-z0-9]/g, '').slice(0, 10)
  return suffix ? `Chat${suffix}` : 'ChatBot'
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

async function connectBot (username) {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username,
    offline: OFFLINE,
    version: VERSION,
    worldDecodeEnabled: false
  })

  botState.start()
  await waitForSpawn(botState)
  return botState
}

function normalizePlayerName (name) {
  return String(name || '').replace(/^\.+/, '')
}

function waitForChatMessage (botState, expected) {
  return new Promise((resolve, reject) => {
    const seen = []
    const timeout = setTimeout(() => {
      botState.off('chat', onChat)
      reject(new Error(`Timed out waiting for chat ${JSON.stringify(expected)}; seen=${JSON.stringify(seen)}`))
    }, 15000)

    function onChat (event) {
      seen.push({
        sourceName: event.sourceName,
        message: event.message,
        type: event.rawPacket?.type
      })

      if (
        event.message === expected.message &&
        normalizePlayerName(event.sourceName) === normalizePlayerName(expected.sourceName)
      ) {
        clearTimeout(timeout)
        botState.off('chat', onChat)
        resolve(event)
      }
    }

    botState.on('chat', onChat)
  })
}

describe('live chat builtin', function () {
  this.timeout(90000)

  let botState

  after(function () {
    if (botState?.client) botState.disconnect('live chat builtin test complete')
  })

  it('sends public chat and receives the server echo', async function () {
    botState = await connectBot(CHAT_USERNAME)
    await sleep(500)

    const message = `chat-e2e-${TARGET}-${Date.now()}`
    const received = waitForChatMessage(botState, {
      sourceName: CHAT_USERNAME,
      message
    })

    botState.chat(message)

    const event = await received
    assert.strictEqual(event.message, message)
    assert.strictEqual(normalizePlayerName(event.sourceName), CHAT_USERNAME)
  })
})
