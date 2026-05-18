'use strict'

const assert = require('assert')
const BotState = require('../../../src/state')
const { Vec3 } = require('vec3')
const {
  clearPlayer,
  givePlayer,
  sendCommand,
  setPlayerGamemode,
  teleportPlayer
} = require('../../helpers/commands')
const {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
} = require('../../helpers/test-env')

const START = new Vec3(42, 66, 42)
const SUPPORT = START.offset(0, -1, 0)
const BRIDGE_BLOCK = SUPPORT.offset(0, 0, -1)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${USERNAME} spawn`)), timeoutMs)
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

async function waitForCondition (predicate, timeoutMs, debugInfo) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = await predicate()
    if (value) return value
    await sleep(50)
  }

  const debug = typeof debugInfo === 'function' ? await debugInfo() : ''
  throw new Error(`Timed out waiting for condition${debug ? `; ${debug}` : ''}`)
}

async function waitForFeetNear (botState, target, radius = 0.5, timeoutMs = 5000) {
  const radiusSq = radius * radius
  return waitForCondition(() => {
    const feet = feetPosition(botState)
    if (!feet) return false
    const dx = feet.x - target.x
    const dy = feet.y - target.y
    const dz = feet.z - target.z
    return dx * dx + dy * dy + dz * dz <= radiusSq ? feet : false
  }, timeoutMs, () => {
    const feet = feetPosition(botState)
    return `feet=${feet ? `${feet.x},${feet.y},${feet.z}` : 'missing'}`
  })
}

function installAuthInputTrace (botState) {
  const packets = []
  const previousHook = botState._applyPlayerAuthInputHooks?.bind(botState)

  botState._applyPlayerAuthInputHooks = (packet, context = {}) => {
    previousHook?.(packet, context)
    packets.push({
      inputData: { ...packet.input_data },
      move: { ...packet.move_vector },
      tick: String(packet.tick),
      position: { ...packet.position }
    })
    if (packets.length > 64) packets.shift()
    return packet
  }

  return {
    packets,
    restore () {
      botState._applyPlayerAuthInputHooks = previousHook
    }
  }
}

async function setupLedge (botState) {
  setPlayerGamemode(botState, USERNAME, 'creative')
  await sleep(SETUP_DELAY_MS)
  clearPlayer(botState, USERNAME)
  await sleep(SETUP_DELAY_MS)

  await runCommands(botState, [
    `fill ${START.x - 2} 60 ${START.z - 3} ${START.x + 2} 70 ${START.z + 2} minecraft:air`,
    `fill ${START.x - 2} 59 ${START.z - 3} ${START.x + 2} 59 ${START.z + 2} minecraft:stone`,
    `setblock ${SUPPORT.x} ${SUPPORT.y} ${SUPPORT.z} minecraft:stone`,
    `setblock ${BRIDGE_BLOCK.x} ${BRIDGE_BLOCK.y} ${BRIDGE_BLOCK.z} minecraft:air`
  ])

  teleportPlayer(botState, USERNAME, START.x + 0.5, START.y + 4, START.z + 0.5)
  await sleep(SETUP_DELAY_MS)
  teleportPlayer(botState, USERNAME, START.x + 0.5, START.y + 0.1, START.z + 0.5)
  await waitForFeetNear(botState, START.offset(0.5, 0, 0.5))

  givePlayer(botState, USERNAME, 'dirt', 4)
  await sleep(SETUP_DELAY_MS * 2)
  setPlayerGamemode(botState, USERNAME, 'survival')
  await sleep(SETUP_DELAY_MS)
  await ensureGroundedSurvivalMovement(botState)
}

async function runCommands (botState, commands, delayMs = SETUP_DELAY_MS) {
  for (const command of commands) {
    sendCommand(botState, command)
    if (delayMs > 0) await sleep(delayMs)
  }
}

async function ensureGroundedSurvivalMovement (botState) {
  botState.clearControlStates?.()

  if (typeof botState.stopFlying === 'function') {
    botState.stopFlying({ optimistic: true, wait: false })
  }

  if (botState.self) {
    botState.self.flying = false
    botState.self.gliding = false
    botState.self.fallFlying = false
    botState.self.noClip = false
    botState.self.onGround = true
  }

  await waitForCondition(() => {
    const feet = feetPosition(botState)
    return feet && feet.y >= START.y - 0.2 && !botState.self?.flying ? feet : false
  }, 5000, () => {
    const feet = feetPosition(botState)
    return `feet=${feet ? `${feet.x},${feet.y},${feet.z}` : 'missing'} flying=${!!botState.self?.flying}`
  })
}

function captureQueuedPackets (botState) {
  const packets = []
  const originalQueue = botState.client.queue.bind(botState.client)

  botState.client.queue = function queueWithCapture (name, packet) {
    packets.push({ name, packet })
    return originalQueue(name, packet)
  }

  return {
    packets,
    restore () {
      botState.client.queue = originalQueue
    }
  }
}

async function equipDirt (botState) {
  const slot = botState.inventory.slots.findIndex(item => item?.name === 'dirt')
  assert.notStrictEqual(slot, -1, 'Expected dirt in inventory after /give')
  await botState.equipItem(slot)
  assert.strictEqual(botState.inventory.slots[botState.heldItemSlot]?.name, 'dirt')
}

describe('live Bedrock physics: sneak backward at a ledge', function () {
  this.timeout(90000)

  let botState

  before(async function () {
    botState = new BotState({
      host: HOST,
      port: PORT,
      username: USERNAME,
      offline: OFFLINE,
      version: VERSION,
      skipPing: true,
      physicsEngine: process.env.BEDROCK_PHYSICS_ENGINE || 'native',
      yawStepSpeed: 100000,
      pitchStepSpeed: 100000
    })

    botState.start()
    await waitForSpawn(botState)
    await setupLedge(botState)
  })

  after(function () {
    if (!botState?.client) return
    try {
      botState.clearControlStates?.()
      setPlayerGamemode(botState, USERNAME, 'survival')
    } catch {}
    botState.disconnect('live sneak backward physics test complete')
  })

  it('holds sneak while backing to an edge and can place rear scaffolding without falling', async function () {
    await equipDirt(botState)
    await ensureGroundedSurvivalMovement(botState)
    botState.look(0, 0, true)
    await sleep(SETUP_DELAY_MS)

    const trace = installAuthInputTrace(botState)

    try {
      botState.setControlState('sneak', true)
      botState.setControlState('back', true)

      await waitForCondition(() => trace.packets.some(packet =>
        packet.inputData.sneaking &&
        packet.inputData.sneak_down &&
        packet.inputData.down &&
        packet.inputData.start_sneaking &&
        packet.inputData.sneak_pressed_raw &&
        packet.inputData.sneak_current_raw &&
        !packet.inputData.descend &&
        packet.move.z < 0
      ), 5000, () => `authInputTrace=${JSON.stringify(trace.packets.slice(-8))}`)

      await waitForCondition(() => {
        const feet = feetPosition(botState)
        return feet && feet.z <= START.z - 0.25 ? feet : false
      }, 5000, () => {
        const feet = feetPosition(botState)
        return `feet=${feet ? `${feet.x},${feet.y},${feet.z}` : 'missing'} authInputTrace=${JSON.stringify(trace.packets.slice(-8))}`
      })

      botState.setControlState('back', false)
      const ySamples = []
      const sampleStart = Date.now()
      while (Date.now() - sampleStart < 1500) {
        const feet = feetPosition(botState)
        if (feet) ySamples.push(feet.y)
        await sleep(100)
      }

      const feetAtEdge = feetPosition(botState)
      assert(feetAtEdge, 'Expected a local feet position at the ledge')
      assert(
        feetAtEdge.z >= START.z - 0.35 && feetAtEdge.z <= START.z - 0.2,
        `Expected sneaking edge clamp to let the feet center overhang by about the player half-width; got feet=${feetAtEdge.x},${feetAtEdge.y},${feetAtEdge.z}`
      )
      const minY = Math.min(...ySamples, feetAtEdge.y)
      assert(
        minY >= START.y - 0.15,
        `Expected bot not to start falling after settling on the rear edge; got minY=${minY} finalFeet=${feetAtEdge.x},${feetAtEdge.y},${feetAtEdge.z}`
      )

      assert(trace.packets.some(packet =>
        packet.inputData.down &&
        packet.inputData.sneaking &&
        packet.inputData.sneak_down &&
        packet.inputData.sneak_current_raw &&
        packet.move.z < 0
      ), `Expected live player_auth_input to show backward+sneak movement; trace=${JSON.stringify(trace.packets.slice(-16))}`)

      const capture = captureQueuedPackets(botState)

      try {
        await botState.placeBlock(SUPPORT, 2, {
          forceLook: true,
          waitForUpdate: false
        })
      } finally {
        capture.restore()
      }

      assert(capture.packets.some(entry =>
        entry.name === 'inventory_transaction' &&
        entry.packet?.transaction?.transaction_type === 'item_use' &&
        entry.packet.transaction.transaction_data?.action_type === 'click_block' &&
        entry.packet.transaction.transaction_data?.face === 2 &&
        entry.packet.transaction.transaction_data?.block_position?.x === SUPPORT.x &&
        entry.packet.transaction.transaction_data?.block_position?.y === SUPPORT.y &&
        entry.packet.transaction.transaction_data?.block_position?.z === SUPPORT.z
      ), `Expected rear-face placement transaction while crouched; packets=${capture.packets.map(entry => entry.name).join(',')}`)

      await sleep(SETUP_DELAY_MS)

      const feetAfterPlace = feetPosition(botState)
      assert(feetAfterPlace, 'Expected a local feet position after rear-face place request')
      assert(
        feetAfterPlace.y >= START.y - 0.2,
        `Expected bot not to fall after rear-face place request; got feet=${feetAfterPlace.x},${feetAfterPlace.y},${feetAfterPlace.z}`
      )
    } finally {
      botState.clearControlStates()
      trace.restore()
    }
  })
})
