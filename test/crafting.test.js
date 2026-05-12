'use strict'

const assert = require('assert')
const BotState = require('../src/state')
const { Vec3 } = require('vec3')
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

const CRAFT_POS = {
  x: Number(process.env.CRAFT_TEST_X || 16),
  y: Number(process.env.CRAFT_TEST_Y || 80),
  z: Number(process.env.CRAFT_TEST_Z || 16)
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendCommandsSequentially (botState, commands, delayMs = 150) {
  for (const command of commands) {
    sendCommand(botState, command)
    await sleep(delayMs)
  }
}

function waitForSpawn (botState, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for spawn')), timeoutMs)

    botState.client.once('spawn', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

async function waitForInventoryPredicate (botState, predicate, label, timeoutMs = 4000) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (predicate()) return
    await sleep(100)
  }

  assert.fail([
    `Timed out waiting for inventory condition: ${label}`,
    'Inventory:',
    JSON.stringify(inventorySummary(botState), null, 2)
  ].join('\n'))
}

function inventorySummary (botState) {
  return botState.inventory.slots
    .map((item, slot) => item && {
      slot,
      name: item.name,
      count: item.count,
      type: item.type,
      metadata: item.metadata,
      stackId: item.stackId ?? item.stack_id
    })
    .filter(Boolean)
}

function countInventoryItem (botState, name) {
  return botState.inventory.slots.reduce((total, item) => {
    if (!item || item.name !== name) return total
    return total + item.count
  }, 0)
}

async function waitForInventoryCount (botState, name, count, timeoutMs = 4000) {
  await waitForInventoryPredicate(
    botState,
    () => countInventoryItem(botState, name) === count,
    `${name}=${count}`,
    timeoutMs
  )
}

async function waitForInventoryCounts (botState, expected, timeoutMs = 4000) {
  await waitForInventoryPredicate(
    botState,
    () => Object.entries(expected).every(([name, count]) => countInventoryItem(botState, name) === count),
    JSON.stringify(expected),
    timeoutMs
  )
}

async function setupCraftingWorld (botState) {
  const { x, y, z } = CRAFT_POS

  setPlayerGamemode(botState, USERNAME, 'survival')
  await sleep(SETUP_DELAY_MS)

  clearPlayer(botState, USERNAME)
  await sleep(SETUP_DELAY_MS)

  await sendCommandsSequentially(botState, [
    `setblock ${x} ${y - 1} ${z} minecraft:stone`,
    `setblock ${x} ${y} ${z} minecraft:crafting_table`,
    `setblock ${x} ${y + 1} ${z} minecraft:air`,
    `setblock ${x + 1} ${y - 1} ${z} minecraft:stone`,
    `setblock ${x + 1} ${y} ${z} minecraft:air`,
    `setblock ${x + 1} ${y + 1} ${z} minecraft:air`
  ])

  teleportPlayer(botState, USERNAME, x + 1.5, y, z + 0.5)
  await sleep(SETUP_DELAY_MS)

  if (typeof botState.waitForChunksToLoad === 'function') {
    await botState.waitForChunksToLoad(2, new Vec3(x, y, z), 10000)
  }
}

function craftingTableRef () {
  const { x, y, z } = CRAFT_POS
  return { position: new Vec3(x, y, z) }
}

function requireRegistryItem (botState, name) {
  const item = botState.registry.itemsByName?.[name]
  assert(item, `Expected registry item ${name} to exist`)
  return item
}

function assertHasCraftingApi (botState) {
  assert.strictEqual(typeof botState.planCraftInventory, 'function', 'Expected botState.planCraftInventory')
  assert.strictEqual(typeof botState.craftItem, 'function', 'Expected botState.craftItem')
  assert.strictEqual(typeof botState.craftPlan, 'function', 'Expected botState.craftPlan')
}

describe('live crafting integration', function () {
  this.timeout(180000)

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

    botState.setInventoryActionResponseTimeout?.(3000)
    botState.setInventoryActionUpdateTimeout?.(3000)
  })

  after(function () {
    if (botState?.client) {
      botState.disconnect('Crafting mocha test complete')
    }
  })

  it('auto-loads the crafting API', function () {
    assertHasCraftingApi(botState)
  })

  it('crafts oak planks from oak logs with the live server recipe data', async function () {
    await setupCraftingWorld(botState)

    const oakPlanks = requireRegistryItem(botState, 'oak_planks')

    givePlayer(botState, USERNAME, 'oak_log', 2)
    await waitForInventoryCount(botState, 'oak_log', 2)

    const logsBefore = countInventoryItem(botState, 'oak_log')
    const planksBefore = countInventoryItem(botState, 'oak_planks')

    const plan = await botState.planCraftInventory({ id: oakPlanks.id, count: 8 })
    assert.strictEqual(plan.success, true, `Expected craft plan success, got ${plan.error || 'unknown error'}`)
    assert(Array.isArray(plan.recipesToDo) && plan.recipesToDo.length >= 1, [
      'Expected at least one recipe step for oak planks',
      'Plan:',
      JSON.stringify(plan, null, 2),
      'Inventory:',
      JSON.stringify(inventorySummary(botState), null, 2)
    ].join('\n'))

    await botState.craftItem(oakPlanks.id, 8, craftingTableRef())

    await waitForInventoryCounts(botState, {
      oak_log: logsBefore - 2,
      oak_planks: planksBefore + 8
    })

    assert.strictEqual(countInventoryItem(botState, 'oak_log'), 0)
    assert.strictEqual(countInventoryItem(botState, 'oak_planks'), planksBefore + 8)
  })

  it('crafts a wooden pickaxe through recursive multi-step planning', async function () {
    await setupCraftingWorld(botState)

    const woodenPickaxe = requireRegistryItem(botState, 'wooden_pickaxe')

    givePlayer(botState, USERNAME, 'oak_log', 2)
    await waitForInventoryCount(botState, 'oak_log', 2)

    const pickaxesBefore = countInventoryItem(botState, 'wooden_pickaxe')
    const sticksBefore = countInventoryItem(botState, 'stick')
    const planksBefore = countInventoryItem(botState, 'oak_planks')

    const plan = await botState.planCraftInventory({ id: woodenPickaxe.id, count: 1 })
    assert.strictEqual(plan.success, true, `Expected wooden pickaxe plan success, got ${plan.error || 'unknown error'}`)
    assert(Array.isArray(plan.recipesToDo) && plan.recipesToDo.length >= 2, [
      `Expected recursive recipe plan, got ${plan.recipesToDo?.length || 0} step(s)`,
      'Plan:',
      JSON.stringify(plan, null, 2),
      'Inventory:',
      JSON.stringify(inventorySummary(botState), null, 2)
    ].join('\n'))
    assert(plan.recipesToDo.some(step => step?._craftingUtilRecipe?.requiresTable), [
      'Expected at least one crafting-table recipe step',
      'Plan:',
      JSON.stringify(plan, null, 2)
    ].join('\n'))

    await botState.craftItem(woodenPickaxe.id, 1, craftingTableRef())

    await waitForInventoryCounts(botState, {
      oak_log: 0,
      wooden_pickaxe: pickaxesBefore + 1,
      stick: sticksBefore + 2,
      oak_planks: planksBefore + 3
    })

    assert.strictEqual(countInventoryItem(botState, 'oak_log'), 0)
    assert.strictEqual(countInventoryItem(botState, 'wooden_pickaxe'), pickaxesBefore + 1)
    assert.strictEqual(countInventoryItem(botState, 'stick'), sticksBefore + 2)
    assert.strictEqual(countInventoryItem(botState, 'oak_planks'), planksBefore + 3)
  })
})
