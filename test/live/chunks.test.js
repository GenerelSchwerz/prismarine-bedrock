'use strict'

const assert = require('assert')
const BotState = require('../../src/state')
const { Vec3 } = require('vec3')
const { sendCommand } = require('../helpers/commands')
const {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION
} = require('../helpers/test-env')

const CHUNK_TEST_Y = Number(process.env.CHUNK_TEST_Y ?? -60)
const READER_USERNAME = process.env.CHUNK_READER_USERNAME || 'ChunkReadBot'

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs)
    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function connectBot (username) {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username,
    offline: OFFLINE,
    version: VERSION
  })

  botState.start()
  await waitForSpawn(botState)
  return botState
}

async function waitForBlockName (botState, pos, name, timeoutMs = 15000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const block = await botState.getBlockAt(pos)
    if (block?.name === name) return block
    await sleep(100)
  }

  const actual = await botState.getBlockAt(pos)
  assert.fail(
    `Timed out waiting for ${name} at ${pos.x} ${pos.y} ${pos.z}; ` +
    `actual=${actual?.name || 'missing'}`
  )
}

describe('live chunk loading', function () {
  this.timeout(90000)

  let botState

  after(function () {
    if (!botState?.client) return
    botState.disconnect('live chunk loading test complete')
  })

  it('decodes chunk block data after server-authored block changes', async function () {
    const base = new Vec3(0, CHUNK_TEST_Y, 0)
    const probes = [
      { pos: new Vec3(base.x + 1, base.y, base.z), block: 'minecraft:emerald_block', name: 'emerald_block' },
      { pos: new Vec3(base.x + 16, base.y, base.z), block: 'minecraft:gold_block', name: 'gold_block' },
      { pos: new Vec3(base.x, base.y, base.z + 16), block: 'minecraft:redstone_block', name: 'redstone_block' }
    ]

    try {
      botState = await connectBot(USERNAME)

      for (const probe of probes) {
        sendCommand(botState, `setblock ${probe.pos.x} ${probe.pos.y} ${probe.pos.z} ${probe.block}`)
      }

      await sleep(1000)
      botState.disconnect('server block setup complete')
      botState = null
      await sleep(3000)

      botState = await connectBot(READER_USERNAME)
      assert.strictEqual(typeof botState.waitForChunksToLoad, 'function')

      await botState.waitForChunksToLoad(16, base, 30000, 1)

      assert.strictEqual(botState.areChunksLoadedAround(16, base, 1), true)
      assert(botState.networkChunks.size > 0, 'Expected at least one decoded chunk column')

      for (const probe of probes) {
        await waitForBlockName(botState, probe.pos, probe.name)
      }
    } finally {
      if (botState?.client) {
        for (const probe of probes) {
          sendCommand(botState, `setblock ${probe.pos.x} ${probe.pos.y} ${probe.pos.z} minecraft:air`)
        }

        sendCommand(botState, `setblock 1 -2 0 minecraft:air`)
      }
    }
  })
})
