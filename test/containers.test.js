'use strict'

const assert = require('assert')
const { Vec3 } = require('vec3')
const BotState = require('../src/state')
const {
  clearPlayer,
  givePlayer,
  sendCommand,
  setPlayerGamemode,
  teleportPlayer
} = require('./helpers/commands')
const {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
} = require('./helpers/test-env')

const CHEST_POS = new Vec3(2, 65, 0)
const DOUBLE_CHEST_POS = new Vec3(4, 65, 0)
const FURNACE_POS = new Vec3(6, 65, 0)
const BREWING_POS = new Vec3(8, 65, 0)
const AFTER_ACTION_DELAY_MS = Number(process.env.AFTER_ACTION_DELAY_MS || 700)

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

async function setupContainerArea (botState, blocks, items = []) {
  setPlayerGamemode(botState, USERNAME, 'creative')
  await sleep(SETUP_DELAY_MS)

  clearPlayer(botState, USERNAME)
  await sleep(SETUP_DELAY_MS)

  for (const { pos } of blocks) {
    sendCommand(botState, `setblock ${pos.x} ${pos.y - 1} ${pos.z} minecraft:stone`)
    sendCommand(botState, `setblock ${pos.x} ${pos.y} ${pos.z} minecraft:air`)
    sendCommand(botState, `setblock ${pos.x} ${pos.y + 1} ${pos.z} minecraft:air`)
  }
  const first = blocks[0].pos
  const teleportFloor = first.offset(0, 0, 3)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y} ${teleportFloor.z} minecraft:stone`)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y + 1} ${teleportFloor.z} minecraft:air`)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y + 2} ${teleportFloor.z} minecraft:air`)
  await sleep(SETUP_DELAY_MS)
  await waitForBlockName(botState, teleportFloor, 'stone')

  teleportPlayer(botState, USERNAME, first.x + 0.5, first.y + 1, first.z + 3.5)
  await sleep(SETUP_DELAY_MS)

  for (const { pos, block } of blocks) {
    sendCommand(botState, `setblock ${pos.x} ${pos.y} ${pos.z} ${block}`)
    await sleep(150)
    await markLocalBlock(botState, pos, block)
  }
  for (const { pos, expectedName } of blocks) {
    await waitForBlockName(botState, pos, expectedName)
  }

  for (const { name, count } of items) {
    givePlayer(botState, USERNAME, name, count)
  }
  await sleep(SETUP_DELAY_MS)

  setPlayerGamemode(botState, USERNAME, 'survival')
  await sleep(SETUP_DELAY_MS)
}

async function markLocalBlock (botState, pos, block) {
  const name = block.replace(/^minecraft:/, '').split('[')[0]
  const stateId = botState.registry.blocksByName[name]?.defaultState
  if (stateId == null || typeof botState.setBlockStateIdAt !== 'function') return
  await botState.setBlockStateIdAt(pos, stateId)
}

async function setupDoubleChestArea (botState) {
  setPlayerGamemode(botState, USERNAME, 'creative')
  await sleep(SETUP_DELAY_MS)

  clearPlayer(botState, USERNAME)
  await sleep(SETUP_DELAY_MS)

  const rightChestPos = DOUBLE_CHEST_POS.offset(1, 0, 0)
  for (const pos of [DOUBLE_CHEST_POS, rightChestPos]) {
    sendCommand(botState, `setblock ${pos.x} ${pos.y - 1} ${pos.z} minecraft:stone`)
    sendCommand(botState, `setblock ${pos.x} ${pos.y} ${pos.z} minecraft:air`)
    sendCommand(botState, `setblock ${pos.x} ${pos.y + 1} ${pos.z} minecraft:air`)
  }

  const teleportFloor = DOUBLE_CHEST_POS.offset(0, 0, 3)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y} ${teleportFloor.z} minecraft:stone`)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y + 1} ${teleportFloor.z} minecraft:air`)
  sendCommand(botState, `setblock ${teleportFloor.x} ${teleportFloor.y + 2} ${teleportFloor.z} minecraft:air`)
  await sleep(SETUP_DELAY_MS)
  await waitForBlockName(botState, teleportFloor, 'stone')

  teleportPlayer(botState, USERNAME, DOUBLE_CHEST_POS.x + 0.5, DOUBLE_CHEST_POS.y + 1, DOUBLE_CHEST_POS.z + 3.5)
  await sleep(SETUP_DELAY_MS)

  givePlayer(botState, USERNAME, 'chest', 2)
  givePlayer(botState, USERNAME, 'diamond', 4)
  await sleep(SETUP_DELAY_MS)

  setPlayerGamemode(botState, USERNAME, 'survival')
  await sleep(SETUP_DELAY_MS)

  const chestSlot = findSlotByName(botState, 'chest')
  await botState.equipItem(chestSlot)

  await botState.placeBlock(DOUBLE_CHEST_POS.offset(0, -1, 0), 1)
  await sleep(SETUP_DELAY_MS)
  await waitForBlockName(botState, DOUBLE_CHEST_POS, 'chest')

  await botState.placeBlock(rightChestPos.offset(0, -1, 0), 1)
  await sleep(SETUP_DELAY_MS)
  await waitForBlockName(botState, rightChestPos, 'chest')
}

function chestBlock (pos) {
  return { pos, block: 'minecraft:chest', expectedName: 'chest' }
}

function furnaceBlock (pos) {
  return { pos, block: 'minecraft:furnace', expectedName: 'furnace' }
}

function brewingBlock (pos) {
  return { pos, block: 'minecraft:brewing_stand', expectedName: 'brewing_stand' }
}

async function waitForBlockName (botState, pos, expectedName, timeoutMs = 8000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const block = await botState.getBlock(pos)
    if (block?.name === expectedName) return block
    await sleep(150)
  }

  const finalBlock = await botState.getBlock(pos)
  throw new Error(
    `Timed out waiting for block ${expectedName} at ${pos}; got ${finalBlock?.name ?? 'unknown'}`
  )
}

function findSlotByName (botState, name) {
  const slot = botState.inventory.slots.findIndex(item => item?.name === name)
  assert.notStrictEqual(slot, -1, `Could not find ${name} in inventory`)
  return slot
}

function assertSlot (window, slot, expectedName, expectedCount) {
  const item = window.slots[slot]

  if (expectedName === null) {
    assert.strictEqual(item, null, `slot ${slot} expected empty, got ${item?.name} x${item?.count}`)
    return
  }

  assert(item, `slot ${slot} expected ${expectedName} x${expectedCount}, got empty`)
  assert.strictEqual(item.name, expectedName)
  assert.strictEqual(item.count, expectedCount)
}

async function assertContainerActionProducesPackets (botState, actionName, fn) {
  const seen = {
    request: false,
    response: false
  }

  function onRequest (request) {
    seen.request = true
    console.log('[test] outbound container item_stack_request', {
      request_id: request.request_id,
      actions: request.actions?.map(action => action.type_id)
    })
  }

  function onResponse (response) {
    seen.response = true
    console.log('[test] inbound container item_stack_response', response)
  }

  botState.on('inventory_action_request', onRequest)
  botState.on('item_stack_response', onResponse)

  try {
    const result = await fn()
    await sleep(AFTER_ACTION_DELAY_MS)

    assert.strictEqual(seen.request, true, `${actionName} did not send item_stack_request`)
    assert.strictEqual(seen.response, true, `${actionName} did not receive item_stack_response`)
    return result
  } finally {
    botState.off('inventory_action_request', onRequest)
    botState.off('item_stack_response', onResponse)
  }
}

describe('real chest containers', function () {
  this.timeout(120000)

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

    botState.setInventoryActionResponseTimeout?.(10000)
  })

  after(async function () {
    if (!botState?.client) return

    try {
      sendCommand(botState, 'setblock 2 65 0 minecraft:air')
      sendCommand(botState, 'setblock 4 65 0 minecraft:air')
      sendCommand(botState, 'setblock 5 65 0 minecraft:air')
      sendCommand(botState, 'setblock 6 65 0 minecraft:air')
      sendCommand(botState, 'setblock 8 65 0 minecraft:air')
      await sleep(250)
    } catch {}

    botState.disconnect('Chest container mocha test complete')
  })

  it('auto-loads generic container helpers', function () {
    assert.strictEqual(typeof botState.openContainer, 'function')
    assert.strictEqual(typeof botState.waitForContainerOpen, 'function')
    assert.strictEqual(typeof botState.wrapContainerWindow, 'function')
  })

  it('opens a chest, puts inventory items in, and takes them back out', async function () {
    await setupContainerArea(botState, [chestBlock(CHEST_POS)], [
      { name: 'diamond', count: 3 },
      { name: 'stick', count: 4 }
    ])

    const diamondSlot = findSlotByName(botState, 'diamond')

    const chest = await botState.openContainer(CHEST_POS, {
      type: 'container',
      face: 1,
      contentTimeoutMs: 3000
    })

    assert.strictEqual(chest.type, 'container')
    assert.strictEqual(chest.containerSlotCount, 27)

    await assertContainerActionProducesPackets(botState, 'putInventorySlot', () => {
      return chest.putInventorySlot(diamondSlot, 0, 2)
    })

    assertSlot(botState.inventory, diamondSlot, 'diamond', 1)
    assertSlot(chest.window, 0, 'diamond', 2)

    const emptySlot = chest.firstEmptyInventorySlot()
    assert.notStrictEqual(emptySlot, -1, 'Expected an empty inventory slot')

    await assertContainerActionProducesPackets(botState, 'takeContainerSlot one item', () => {
      return chest.takeContainerSlot(0, emptySlot, 1)
    })

    assertSlot(chest.window, 0, 'diamond', 1)
    assertSlot(botState.inventory, emptySlot, 'diamond', 1)

    await assertContainerActionProducesPackets(botState, 'takeContainerSlot merge', () => {
      return chest.takeContainerSlot(0, diamondSlot, 1)
    })

    assertSlot(chest.window, 0, null, 0)
    assertSlot(botState.inventory, diamondSlot, 'diamond', 2)

    chest.close()
  })

  it('opens a double chest and uses slots across the full 54-slot container', async function () {
    await setupDoubleChestArea(botState)

    const diamondSlot = findSlotByName(botState, 'diamond')
    const chest = await botState.openContainer(DOUBLE_CHEST_POS, {
      type: 'container',
      face: 1,
      contentTimeoutMs: 3000
    })

    assert.strictEqual(chest.type, 'container')
    assert.strictEqual(chest.containerSlotCount, 54)

    await assertContainerActionProducesPackets(botState, 'double chest putInventorySlot', () => {
      return chest.putInventorySlot(diamondSlot, 53, 3)
    })

    assertSlot(botState.inventory, diamondSlot, 'diamond', 1)
    assertSlot(chest.window, 53, 'diamond', 3)

    await assertContainerActionProducesPackets(botState, 'double chest takeContainerSlot', () => {
      return chest.takeContainerSlot(53, diamondSlot, 3)
    })

    assertSlot(chest.window, 53, null, 0)
    assertSlot(botState.inventory, diamondSlot, 'diamond', 4)

    chest.close()
  })

  it('opens a furnace, puts an ingredient in, and takes it out', async function () {
    await setupContainerArea(botState, [furnaceBlock(FURNACE_POS)], [
      { name: 'raw_iron', count: 2 }
    ])

    const rawIronSlot = findSlotByName(botState, 'raw_iron')
    const furnace = await botState.openContainer(FURNACE_POS, {
      type: 'furnace',
      face: 3,
      contentTimeoutMs: 3000
    })

    assert.strictEqual(furnace.type, 'furnace')
    assert.strictEqual(furnace.containerSlotCount, 3)
    assert.strictEqual(typeof furnace.putFuel, 'function')
    assert.strictEqual(typeof furnace.putInput, 'function')
    assert.strictEqual(typeof furnace.takeInput, 'function')
    assert.strictEqual(typeof furnace.takeOutput, 'function')

    await assertContainerActionProducesPackets(botState, 'furnace putInput', () => {
      return furnace.putInput(rawIronSlot, 1)
    })

    assertSlot(botState.inventory, rawIronSlot, 'raw_iron', 1)
    assertSlot(furnace.window, 0, 'raw_iron', 1)

    await assertContainerActionProducesPackets(botState, 'furnace takeInput', () => {
      return furnace.takeInput(rawIronSlot, 1)
    })

    assertSlot(furnace.window, 0, null, 0)
    assertSlot(botState.inventory, rawIronSlot, 'raw_iron', 2)

    furnace.close()
  })

  it('opens a brewing stand, puts an ingredient in, and takes it out', async function () {
    await setupContainerArea(botState, [brewingBlock(BREWING_POS)], [
      { name: 'nether_wart', count: 2 }
    ])

    const wartSlot = findSlotByName(botState, 'nether_wart')
    const brewing = await botState.openContainer(BREWING_POS, {
      type: 'brewing_stand',
      face: 3,
      contentTimeoutMs: 3000
    })

    assert.strictEqual(brewing.type, 'brewing_stand')
    assert.strictEqual(brewing.containerSlotCount, 5)
    assert.strictEqual(typeof brewing.putFuel, 'function')
    assert.strictEqual(typeof brewing.putIngredient, 'function')
    assert.strictEqual(typeof brewing.putBottle, 'function')
    assert.strictEqual(typeof brewing.takeIngredient, 'function')

    await assertContainerActionProducesPackets(botState, 'brewing putIngredient', () => {
      return brewing.putIngredient(wartSlot, 1)
    })

    assertSlot(botState.inventory, wartSlot, 'nether_wart', 1)
    assertSlot(brewing.window, 3, 'nether_wart', 1)

    await assertContainerActionProducesPackets(botState, 'brewing takeIngredient', () => {
      return brewing.takeIngredient(wartSlot, 1)
    })

    assertSlot(brewing.window, 3, null, 0)
    assertSlot(botState.inventory, wartSlot, 'nether_wart', 2)

    brewing.close()
  })
})
