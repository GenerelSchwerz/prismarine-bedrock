const BotState = require('../src/state')
const { Vec3 } = require('vec3')

const HOST = process.env.HOST || 'localhost'
const PORT = parseInt(process.env.PORT, 10) || 19132
const USERNAME = process.env.USERNAME || 'DigBot'
const OFFLINE = process.env.OFFLINE !== 'false'
const VERSION = process.env.MC_VERSION || '1.21.130'

const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 120000)
const OBSERVE_MS = Number(process.env.OBSERVE_MS || 10000)

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs)

    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function waitForDigCommand (botState, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      botState.removeListener('chat', onChat)
      reject(new Error('Timeout waiting for !break command'))
    }, timeoutMs)

    function onChat ({ sourceName, message }) {
      if (sourceName === botState.client.username) return

      const parts = message.trim().split(/\s+/)
      const command = parts[0]?.toLowerCase()

      if (command !== '!break' && command !== '!dig') return

      clearTimeout(timeout)
      botState.removeListener('chat', onChat)

      resolve({
        sourceName,
        args: parts.slice(1)
      })
    }

    botState.on('chat', onChat)
  })
}

function parseBlockPosition (args, botState) {
  if (args.length === 3) {
    const nums = args.map(Number)

    if (nums.every(Number.isFinite)) {
      return new Vec3(
        Math.floor(nums[0]),
        Math.floor(nums[1]),
        Math.floor(nums[2])
      )
    }
  }

  if (args.length === 0) {
    const pos = botState.self.position

    return new Vec3(
      Math.floor(pos.x),
      Math.floor(pos.y - 1),
      Math.floor(pos.z)
    )
  }

  throw new Error('Usage: !break [x y z]')
}

async function main () {
  const botState = new BotState({
    host: HOST,
    port: PORT,
    username: USERNAME,
    offline: OFFLINE,
    version: VERSION
  })

  botState.start()

  console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME}...`)
  await waitForSpawn(botState)

  console.log('Bot spawned.')
  console.log('Say "!break x y z" to break a specific block.')
  console.log('Say "!break" to break the block under the bot.')

  const { sourceName, args } = await waitForDigCommand(botState)
  const pos = parseBlockPosition(args, botState)

  console.log(`Received break command from ${sourceName}.`)
  console.log(`Target block position: ${pos}`)

  const block = await botState.getBlock(pos)

  if (!block) {
    throw new Error(`No block loaded at ${pos}`)
  }

  console.log(`Breaking ${block.name} at ${block.position}`)

  await botState.dig(block)

  console.log(`Sent dig for ${block.name}. Waiting to observe result...`)
  await sleep(OBSERVE_MS)

  botState.disconnect('Dig command test complete')
  process.exit(0)
}

main().catch(err => {
  console.error('Dig command test failed:', err)
  process.exit(1)
})