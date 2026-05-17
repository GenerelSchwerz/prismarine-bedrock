'use strict'

const assert = require('assert')
const BotState = require('../../src/state')
const { Vec3 } = require('vec3')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const {
  sendCommand,
  setPlayerGamemode,
  teleportPlayer
} = require('../helpers/commands')
const {
  HOST,
  PORT,
  USERNAME: DEFAULT_USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
} = require('../helpers/test-env')

const USERNAME = process.env.PATHFINDER_USERNAME || DEFAULT_USERNAME
const START = new Vec3(0, 66, 0)
const TARGET = new Vec3(5, 67, 7)
const TARGET_BLOCK = 'minecraft:diamond_block'
const START_DELAY_MS = Number(process.env.PATHFINDER_START_DELAY_MS || 0)
const GOAL_DELAY_MS = Number(process.env.PATHFINDER_GOAL_DELAY_MS || 0)
const PHYSICS_ENGINE = process.env.PATHFINDER_PHYSICS_ENGINE || process.env.BEDROCK_PHYSICS_ENGINE || 'native'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${botState.options.username} spawn`)), timeoutMs)
    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function feetPosition (botState) {
  const position = botState.self?.position
  if (!position) return null
  const eyeHeight = Number.isFinite(botState.self.eyeHeight) ? botState.self.eyeHeight : 1.62
  return position.offset(0, -eyeHeight, 0)
}

async function waitForFeetNear (botState, target, radius = 1.2, timeoutMs = 20000, debugInfo = () => '') {
  const started = Date.now()
  const radiusSq = radius * radius

  while (Date.now() - started < timeoutMs) {
    const position = feetPosition(botState)
    if (position) {
      const dx = position.x - target.x
      const dy = position.y - target.y
      const dz = position.z - target.z
      if (dx * dx + dy * dy + dz * dz <= radiusSq) return position.clone()
    }

    await sleep(100)
  }

  const position = feetPosition(botState)
  const debug = debugInfo()
  throw new Error(`Timed out waiting for pathfinder target; position=${position ? `${position.x},${position.y},${position.z}` : 'missing'}${debug ? `; ${debug}` : ''}`)
}

async function waitForFeetInsideBlock (botState, target, timeoutMs = 20000, debugInfo = () => '') {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const position = feetPosition(botState)
    if (position) {
      const block = position.floored()
      if (block.x === target.x && block.y === target.y && block.z === target.z) return position.clone()
    }

    await sleep(100)
  }

  const position = feetPosition(botState)
  const block = position?.floored()
  const debug = debugInfo()
  throw new Error(`Timed out waiting for pathfinder target block ${target.x},${target.y},${target.z}; feet=${position ? `${position.x},${position.y},${position.z}` : 'missing'} block=${block ? `${block.x},${block.y},${block.z}` : 'missing'}${debug ? `; ${debug}` : ''}`)
}

async function setupPathfinderCourse (botState) {
  setPlayerGamemode(botState, USERNAME, 'creative')
  await sleep(SETUP_DELAY_MS)

  sendCommand(botState, 'setblock 0 70 0 minecraft:stone')
  await sleep(SETUP_DELAY_MS)
  teleportPlayer(botState, USERNAME, START.x + 0.5, START.y + 5, START.z + 0.5)
  await sleep(SETUP_DELAY_MS)

  sendCommand(botState, 'fill -4 -60 -4 9 70 10 minecraft:air')
  await sleep(SETUP_DELAY_MS)
  sendCommand(botState, 'fill -4 -61 -4 9 -61 10 minecraft:stone')
  await sleep(SETUP_DELAY_MS)
  sendCommand(botState, 'fill -2 65 -2 9 70 10 minecraft:air')
  await sleep(SETUP_DELAY_MS)

  const stoneCourse = []
  for (let x = 0; x <= 5; x++) stoneCourse.push(new Vec3(x, 65, 0))
  for (let z = 1; z <= 5; z++) stoneCourse.push(new Vec3(5, 65, z))

  for (const pos of stoneCourse) {
    sendCommand(botState, `setblock ${pos.x} ${pos.y} ${pos.z} minecraft:stone`)
    await sleep(25)
  }
  sendCommand(botState, `setblock ${TARGET.x} ${TARGET.y - 1} ${TARGET.z} ${TARGET_BLOCK}`)
  await sleep(25)

  teleportPlayer(botState, USERNAME, START.x + 0.5, START.y + 0.1, START.z + 0.5)
  await sleep(SETUP_DELAY_MS)
  await waitForFeetNear(botState, START.offset(0.5, 0, 0.5), 0.5, 5000, () => 'waiting for course start teleport')
  sendCommand(botState, 'setblock 0 70 0 minecraft:air')
}

describe('live mineflayer pathfinder compatibility', function () {
  this.timeout(120000)

  let botState

  before(async function () {
    if (START_DELAY_MS > 0) await sleep(START_DELAY_MS)

    botState = new BotState({
      host: HOST,
      port: PORT,
      username: USERNAME,
      offline: OFFLINE,
      version: VERSION,
      skipPing: true,
      physicsEngine: PHYSICS_ENGINE,
      yawStepSpeed: 100000,
      pitchStepSpeed: 100000
    })

    botState.start()
    await waitForSpawn(botState)
    await setupPathfinderCourse(botState)
  })

  after(function () {
    if (!botState?.client) return
    try {
      botState.pathfinder?.stop()
      botState.clearControlStates?.()
      setPlayerGamemode(botState, USERNAME, 'survival')
    } catch {}
    botState.disconnect('live pathfinder compatibility test complete')
  })

  it('loads upstream mineflayer-pathfinder and walks onto a marked target block', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    botState.loadPlugin(pathfinder)

    const pathTrace = []
    const controlTrace = []
    const authInputTrace = []
    const remember = (event, data) => {
      pathTrace.push({ event, data })
      if (pathTrace.length > 8) pathTrace.shift()
    }
    const rememberControl = (name, value) => {
      controlTrace.push({ name, value })
      if (controlTrace.length > 16) controlTrace.shift()
    }
    const originalSetControlState = botState.setControlState.bind(botState)
    botState.setControlState = (name, value) => {
      rememberControl(name, value)
      return originalSetControlState(name, value)
    }
    botState._applyPlayerAuthInputHooks = packet => {
      authInputTrace.push({
        move: packet.move_vector,
        yaw: packet.yaw,
        up: !!packet.input_data?.up,
        tick: String(packet.tick)
      })
      if (authInputTrace.length > 8) authInputTrace.shift()
    }
    botState.on('path_update', result => {
      remember('path_update', {
        status: result?.status,
        pathLength: result?.path?.length ?? 0,
        visitedNodes: result?.visitedNodes,
        path: result?.path?.slice(0, 5).map(node => ({ x: node.x, y: node.y, z: node.z }))
      })
    })
    botState.on('path_reset', reason => remember('path_reset', { reason }))
    botState.on('goal_reached', () => remember('goal_reached', {}))

    const movements = new Movements(botState.mineflayer)
    movements.canDig = false
    movements.allow1by1towers = false
    movements.allowParkour = true
    movements.allowSprinting = false
    movements.allowEntityDetection = false
    movements.scafoldingBlocks = []
    botState.pathfinder.setMovements(movements)

    const targetGoal = new goals.GoalBlock(TARGET.x, TARGET.y, TARGET.z)
    if (GOAL_DELAY_MS > 0) await sleep(GOAL_DELAY_MS)
    botState.pathfinder.setGoal(targetGoal)

    await waitForFeetInsideBlock(botState, TARGET, 20000, () => {
      return `controls=${JSON.stringify({
        forward: botState.getControlState?.('forward'),
        jump: botState.getControlState?.('jump'),
        sprint: botState.getControlState?.('sprint')
      })} pathTrace=${JSON.stringify(pathTrace)} controlTrace=${JSON.stringify(controlTrace)} authInputTrace=${JSON.stringify(authInputTrace)}`
    })

    botState.pathfinder.stop()
    botState.clearControlStates()

    const position = botState.self.position
    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside target block ${TARGET.x},${TARGET.y},${TARGET.z}; got eye=${position.x},${position.y},${position.z} feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
