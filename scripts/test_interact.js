const BotState = require('../src/state')

const HOST = process.env.HOST || 'localhost'
const PORT = parseInt(process.env.PORT, 10) || 19132
const USERNAME = process.env.USERNAME || 'HitBot'
const OFFLINE = process.env.OFFLINE !== 'false'
const VERSION = process.env.MC_VERSION || '1.21.130'

const HIT_COMMAND = '!hit'
const HIT_RANGE = Number(process.env.HIT_RANGE || 4)
const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 120000)

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs)

    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function waitForHitCommand (botState, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      botState.removeListener('chat', onChat)
      reject(new Error(`Timeout waiting for another player to say ${HIT_COMMAND}`))
    }, timeoutMs)

    function onChat ({ sourceName, message }) {
      if (sourceName === botState.client.username) return
      if (message.trim().toLowerCase() !== HIT_COMMAND) return

      clearTimeout(timeout)
      botState.removeListener('chat', onChat)
      resolve(sourceName)
    }

    botState.on('chat', onChat)
  })
}

function getPlayerByName (botState, username) {
  for (const [, player] of botState.players) {
    if (player === botState.self) continue
    if (player.username === username || player.displayName === username) return player
  }

  return botState.nearestEntity?.(entity =>
    entity !== botState.self &&
    entity.type === 'player' &&
    (entity.username === username || entity.displayName === username)
  ) || null
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
  console.log(`Have another player say ${HIT_COMMAND}.`)

  const sourceName = await waitForHitCommand(botState)
  console.log(`Received ${HIT_COMMAND} from ${sourceName}`)

  const player = getPlayerByName(botState, sourceName)
  if (!player) {
    throw new Error(`Could not find player entity for ${sourceName}`)
  }

  const distance = botState.self.position.distanceTo(player.position)
  console.log(`Target ${sourceName} runtimeId=${player.runtimeId} distance=${distance.toFixed(2)}`)

  if (distance > HIT_RANGE) {
    throw new Error(`Target is too far away to hit: ${distance.toFixed(2)} > ${HIT_RANGE}`)
  }

  if (typeof botState.lookAt === 'function') {
    await botState.lookAt(player.position, true)
  }

  await botState.attackEntity(player, { debug: true })

  console.log(`Sent hit to ${sourceName}. Waiting to observe result...`)
  await sleep(3000)

  botState.disconnect('Hit command test complete')
  process.exit(0)
}

main().catch(err => {
  console.error('Hit command test failed:', err)
  process.exit(1)
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}