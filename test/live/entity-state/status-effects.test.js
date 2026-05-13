'use strict'

const assert = require('assert')
const Vec3 = require('vec3').Vec3
const BotState = require('../../../src/state')
const { itemToRaw, toVec3f } = require('../../../src/utils')
const {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
} = require('../../helpers/test-env')
const {
  bedrockPlayerName,
  sendCommand,
  setPlayerGamemode,
  teleportPlayer
} = require('../../helpers/commands')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const TEST_TAG = 'bedrock_state_effect_test'
const BASE = new Vec3(24, 66, 24)
const PLAYER_POS = BASE.offset(0.5, 1, 0.5)
const ZOMBIE_POS = BASE.offset(0, 1, 6)

function waitForSpawn (botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs)
    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

async function waitForPredicate (predicate, label, timeoutMs = 8000, intervalMs = 100) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = predicate()
    if (value) return value
    await sleep(intervalMs)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

function runSetupCommands (botState, commands) {
  for (const command of commands) sendCommand(botState, command)
}

async function runCommand (botState, command, delayMs = SETUP_DELAY_MS) {
  sendCommand(botState, command)
  if (delayMs > 0) await sleep(delayMs)
}

async function prepareArea (botState) {
  runSetupCommands(botState, [
    `kill @e[tag=${TEST_TAG}]`,
    `fill ${BASE.x - 4} ${BASE.y + 1} ${BASE.z - 4} ${BASE.x + 6} ${BASE.y + 6} ${BASE.z + 9} minecraft:air`,
    `fill ${BASE.x - 4} ${BASE.y} ${BASE.z - 4} ${BASE.x + 6} ${BASE.y} ${BASE.z + 9} minecraft:stone`,
    `fill ${BASE.x + 2} ${BASE.y + 1} ${BASE.z + 2} ${BASE.x + 4} ${BASE.y + 1} ${BASE.z + 4} minecraft:stone`,
    `setblock ${BASE.x + 3} ${BASE.y + 1} ${BASE.z + 3} minecraft:water`
  ])
  await sleep(SETUP_DELAY_MS)
  teleportPlayer(botState, USERNAME, PLAYER_POS.x, PLAYER_POS.y, PLAYER_POS.z)
  await sleep(SETUP_DELAY_MS)
}

function findSlotByName (botState, name) {
  const slot = botState.inventory.slots.findIndex(item => item?.name === name)
  assert.notStrictEqual(slot, -1, `Could not find ${name} in inventory`)
  return slot
}

function sendUseItemInAir (botState, targetPos) {
  const heldSlot = botState.heldItemSlot
  const heldItem = botState.inventory.slots[heldSlot]
  assert(heldItem, 'Expected held item before item_use')

  botState.client.queue('inventory_transaction', {
    transaction: {
      legacy: { legacy_request_id: 0 },
      transaction_type: 'item_use',
      actions: [],
      transaction_data: {
        action_type: 'click_air',
        trigger_type: 'player_input',
        block_position: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
        face: 1,
        hotbar_slot: heldSlot,
        held_item: itemToRaw(heldItem, botState.itemClass),
        player_pos: toVec3f(botState.self.position),
        click_pos: { x: 0.5, y: 0.5, z: 0.5 },
        block_runtime_id: 0,
        client_prediction: 'success',
        client_cooldown_state: 0
      }
    }
  })
}

async function equipSplashPotion (botState) {
  const potionSlot = findSlotByName(botState, 'splash_potion')
  await botState.equipInventorySlot(potionSlot, 0)
  await sleep(SETUP_DELAY_MS)
}

async function lookAtTarget (botState, target) {
  await botState.lookAt(target)
  if (typeof botState.waitForLookComplete === 'function') {
    await botState.waitForLookComplete()
  }
}

function findTaggedZombie (botState) {
  return Array.from(botState.entities.values()).find(entity =>
    entity.name === 'zombie' &&
    entity.position.distanceSquared(ZOMBIE_POS.offset(0.5, 0, 0.5)) < 9
  )
}

async function spawnTaggedZombie (botState) {
  sendCommand(botState, `kill @e[type=minecraft:zombie,limit=10,sort=nearest]`)
  await sleep(SETUP_DELAY_MS)
  await runCommand(botState, `summon minecraft:zombie ${ZOMBIE_POS.x} ${ZOMBIE_POS.y} ${ZOMBIE_POS.z} {NoAI:1b,Silent:1b,Tags:["${TEST_TAG}"]}`)
  await sleep(SETUP_DELAY_MS)
  return waitForPredicate(
    () => findTaggedZombie(botState),
    'tagged zombie spawn'
  )
}

async function giveSplashFireResistance (botState) {
  sendCommand(botState, `clear ${bedrockPlayerName(USERNAME)}`)
  await sleep(SETUP_DELAY_MS)
  sendCommand(botState, `give ${bedrockPlayerName(USERNAME)} minecraft:splash_potion[minecraft:potion_contents={potion:"minecraft:fire_resistance"}] 1`)
  await waitForPredicate(
    () => botState.inventory.slots.find(item => item?.name === 'splash_potion'),
    'splash fire resistance potion in inventory',
    10000
  )
}

async function throwSplashPotionAtZombie (botState, zombie) {
  await equipSplashPotion(botState)
  const target = new Vec3(zombie.position.x, zombie.position.y + 1, zombie.position.z)
  await lookAtTarget(botState, target)
  sendUseItemInAir(botState, target)
}

async function throwSplashPotionAtSelf (botState) {
  await equipSplashPotion(botState)
  const pos = botState.self.position
  const target = new Vec3(pos.x, pos.y - 2, pos.z)
  await lookAtTarget(botState, target)
  sendUseItemInAir(botState, target)
}

describe('live entity state checks', function () {
  let botState

  before(async function () {
    botState = new BotState({
      host: HOST,
      port: PORT,
      username: USERNAME,
      offline: OFFLINE,
      version: VERSION
    })
    botState.start()
    await waitForSpawn(botState)
    await prepareArea(botState)
  })

  after(async function () {
    if (!botState) return
    botState.clearControlStates?.()
    sendCommand(botState, `effect clear ${bedrockPlayerName(USERNAME)}`)
    sendCommand(botState, `kill @e[tag=${TEST_TAG}]`)
    sendCommand(botState, `fill ${BASE.x - 4} ${BASE.y + 1} ${BASE.z - 4} ${BASE.x + 6} ${BASE.y + 6} ${BASE.z + 9} minecraft:air`)
    await sleep(250)
    botState.disconnect('live entity state checks complete')
  })

  it('tracks self health status and mob effects from server packets', async function () {
    setPlayerGamemode(botState, USERNAME, 'survival')
    await sleep(SETUP_DELAY_MS)

    await waitForPredicate(
      () => Number.isFinite(botState.self?.getStatus?.('saturation')),
      'self saturation status'
    )
    assert.strictEqual(botState.self.hasStatus('saturation'), true)
    assert.strictEqual(botState.self.checkStatus('saturation', { min: 0 }), true)
    assert.strictEqual(botState.self.saturation, botState.self.getStatus('saturation'))

    sendCommand(botState, `effect give ${bedrockPlayerName(USERNAME)} minecraft:poison 20 1 true`)
    await waitForPredicate(
      () => botState.self?.hasEffect?.('poison'),
      'self poison effect'
    )

    assert.strictEqual(botState.self.effectLevel('poison'), 2)

    sendCommand(botState, `damage ${bedrockPlayerName(USERNAME)} 1 minecraft:generic`)
    await waitForPredicate(
      () => botState.self?.hasStatus?.('health') && botState.self.getStatus('health') < 20,
      'self health status update'
    )

    assert.strictEqual(botState.self.checkStatus('health', { min: 1, max: 19 }), true)

    sendCommand(botState, `effect clear ${bedrockPlayerName(USERNAME)}`)
    await waitForPredicate(
      () => !botState.self?.hasEffect?.('poison'),
      'self poison effect removal'
    )
  })

  it('tracks self effects from a thrown splash potion', async function () {
    sendCommand(botState, `effect clear ${bedrockPlayerName(USERNAME)}`)
    await waitForPredicate(
      () => !botState.self?.hasEffect?.('fire_resistance'),
      'self fire resistance effect cleared'
    )

    await giveSplashFireResistance(botState)
    await throwSplashPotionAtSelf(botState)
    await waitForPredicate(
      () => botState.self?.hasEffect?.('fire_resistance'),
      'self fire resistance from thrown splash potion',
      15000
    )

    const effect = botState.self.getEffect('fire_resistance')
    assert.strictEqual(effect.name, 'fireResistance')
    assert.strictEqual(botState.self.effectLevel('minecraft:fire_resistance'), 1)
    assert.strictEqual(botState.self.getStatus('fire_resistance'), 1)

    sendCommand(botState, `effect clear ${bedrockPlayerName(USERNAME)}`)
    await waitForPredicate(
      () => !botState.self?.hasEffect?.('fire_resistance'),
      'self splash fire resistance removal'
    )
  })

  it('tracks mob effects on spawned entities from a thrown splash potion', async function () {
    const zombie = await spawnTaggedZombie(botState)

    await giveSplashFireResistance(botState)
    await throwSplashPotionAtZombie(botState, zombie)
    await waitForPredicate(
      () => zombie.hasEffect?.('fire_resistance'),
      'zombie fire resistance visible_mob_effects update',
      15000
    )

    assert.strictEqual(zombie.hasEffect('fire_resistance'), true)
    assert.strictEqual(zombie.effectLevel('fire_resistance'), 1)
    assert.strictEqual(zombie.getStatus('fire_resistance'), 1)
  })

  it('tracks metadata flags on spawned entities', async function () {
    const zombie = await spawnTaggedZombie(botState)

    sendCommand(botState, `setblock ${ZOMBIE_POS.x} ${ZOMBIE_POS.y} ${ZOMBIE_POS.z} fire`)
    await waitForPredicate(
      () => zombie.isOnFire?.() || zombie.hasMetadataFlag?.('onfire'),
      'zombie onfire metadata',
      15000
    )

    assert.strictEqual(zombie.isOnFire(), true)
    sendCommand(botState, `setblock ${ZOMBIE_POS.x} ${ZOMBIE_POS.y} ${ZOMBIE_POS.z} air`)
  })

  it('updates local pose checks from control state for sneak, sprint, jump, and swim', async function () {
    botState.clearControlStates()

    botState.setControlState('sneak', true)
    await botState.applyMovement()
    assert.strictEqual(botState.self.isPose('sneaking'), true)
    assert.strictEqual(botState.self.sneaking, true)

    botState.setControlState('sneak', false)
    botState.setControlState('forward', true)
    botState.setControlState('sprint', true)
    await botState.applyMovement()
    assert.strictEqual(botState.self.isPose('sprinting'), true)
    assert.strictEqual(botState.self.sprinting, true)

    botState.setControlState('jump', true)
    await botState.applyMovement()
    assert.strictEqual(botState.getControlState('jump'), true)
    assert.strictEqual((botState.self.inputData & (1n << 6n)) !== 0n, true)

    botState.setControlState('swim', true)
    await botState.applyMovement()
    assert.strictEqual(botState.self.isPose('swimming'), true)
    assert.strictEqual((botState.self.inputData & (1n << 29n)) !== 0n, true)

    botState.clearControlStates()
  })
})
