// test/trading.test.js
'use strict'

const assert = require('assert')
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

const TRADE_TEST_NAME = 'TradeTestVillager'
const TRADE_TEST_TAG = 'pb_trade_test_villager'

const TRADE_POS = {
  x: Number(process.env.TRADE_TEST_X || 32),
  y: Number(process.env.TRADE_TEST_Y || 80),
  z: Number(process.env.TRADE_TEST_Z || 32)
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function jsonDebugReplacer (_, value) {
  if (typeof value === 'bigint') return value.toString()

  if (Buffer.isBuffer(value)) {
    return {
      type: 'Buffer',
      length: value.length,
      hex: value.toString('hex')
    }
  }

  return value
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

function waitForEntity (botState, filter, timeoutMs = 15000) {
  const existing = [...botState.entities.values()].find(filter)
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()

      const entities = [...botState.entities.values()]
        .filter(entity => entity?.position)
        .map(entity => ({
          name: entity.name,
          displayName: entity.displayName,
          type: entity.type,
          runtimeId: entity.runtimeId?.toString?.() ?? entity.runtimeId,
          pos: {
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z
          },
          distanceSq: botState.self?.position
            ? entity.position.distanceSquared(botState.self.position)
            : null,
          metadata: entity.metadata
        }))

      console.log('[trading.test] entities on timeout', JSON.stringify(entities, jsonDebugReplacer, 2))
      reject(new Error('Timed out waiting for entity'))
    }, timeoutMs)

    function onEntitySpawned (entity) {
      console.log('[trading.test] saw entitySpawned while waiting', JSON.stringify({
        name: entity.name,
        displayName: entity.displayName,
        type: entity.type,
        runtimeId: entity.runtimeId?.toString?.() ?? entity.runtimeId,
        pos: entity.position && {
          x: entity.position.x,
          y: entity.position.y,
          z: entity.position.z
        },
        metadata: entity.metadata
      }, jsonDebugReplacer, 2))

      if (!filter(entity)) return
      cleanup()
      resolve(entity)
    }

    function cleanup () {
      clearTimeout(timeout)
      botState.off('entitySpawned', onEntitySpawned)
    }

    botState.on('entitySpawned', onEntitySpawned)
  })
}

function villagerSummonCommand (x, y, z) {
  return `summon minecraft:villager ${x} ${y} ${z} {Tags:["${TRADE_TEST_TAG}"]}`
}

function tradeVillagerSelector () {
  return `@e[type=minecraft:villager,tag=${TRADE_TEST_TAG},limit=1,sort=nearest]`
}

function villagerSetupCommands () {
  const selector = tradeVillagerSelector()

  return [
    `data merge entity ${selector} {NoAI:1b,Invulnerable:1b,PersistenceRequired:1b}`,
    `data merge entity ${selector} {CustomName:"${TRADE_TEST_NAME}"}`,
    `data merge entity ${selector} {VillagerData:{type:"minecraft:plains",profession:"minecraft:farmer",level:2}}`,
    `data modify entity ${selector} Offers.Recipes set value []`,
    `data modify entity ${selector} Offers.Recipes append value {buy:{id:"minecraft:emerald",count:1},sell:{id:"minecraft:bread",count:6},maxUses:999999,rewardExp:0b,priceMultiplier:0.0f}`,
    `data modify entity ${selector} Offers.Recipes append value {buy:{id:"minecraft:emerald",count:2},sell:{id:"minecraft:apple",count:1},maxUses:999999,rewardExp:0b,priceMultiplier:0.0f}`
  ]
}

async function setupTradingWorld (botState) {
  const { x, y, z } = TRADE_POS

  // Ground under villager.
  sendCommand(botState, `setblock ${x} ${y - 1} ${z} minecraft:stone`)

  // Ground under bot teleport position.
  sendCommand(botState, `setblock ${x + 1} ${y - 1} ${z} minecraft:stone`)

  // Clear space above both blocks.
  sendCommand(botState, `setblock ${x} ${y} ${z} minecraft:air`)
  sendCommand(botState, `setblock ${x} ${y + 1} ${z} minecraft:air`)
  sendCommand(botState, `setblock ${x + 1} ${y} ${z} minecraft:air`)
  sendCommand(botState, `setblock ${x + 1} ${y + 1} ${z} minecraft:air`)

  sendCommand(botState, `kill @e[type=minecraft:villager,tag=${TRADE_TEST_TAG}]`)
  await sleep(SETUP_DELAY_MS)

  setPlayerGamemode(botState, USERNAME, 'survival')
  clearPlayer(botState, USERNAME)
  givePlayer(botState, USERNAME, 'emerald', 16)

  teleportPlayer(botState, USERNAME, x + 1, y, z)
  await sleep(SETUP_DELAY_MS)

  sendCommand(botState, villagerSummonCommand(x, y, z))
  await sleep(SETUP_DELAY_MS)

  for (const command of villagerSetupCommands()) {
    sendCommand(botState, command)
    await sleep(150)
  }

  await sleep(SETUP_DELAY_MS)
}

function isTradeTestVillager (entity) {
  if (!entity?.position) return false

  const nearTradePos =
    Math.abs(entity.position.x - (TRADE_POS.x + 0.5)) < 3 &&
    Math.abs(entity.position.y - TRADE_POS.y) < 3 &&
    Math.abs(entity.position.z - (TRADE_POS.z + 0.5)) < 3

  const name = String(entity.name || entity.displayName || '').toLowerCase()
  const isVillager =
    name === 'villager' ||
    name === 'villager_v2' ||
    name === 'minecraft:villager' ||
    name.includes('villager')

  return nearTradePos && isVillager
}

function nbtValue (value) {
  if (value == null) return value

  if (Array.isArray(value)) {
    return value.map(nbtValue)
  }

  if (Buffer.isBuffer(value)) return value

  if (typeof value !== 'object') return value

  // prismarine-nbt style: { type: 'compound', value: {...} }
  if (Object.prototype.hasOwnProperty.call(value, 'type') &&
      Object.prototype.hasOwnProperty.call(value, 'value')) {
    return nbtValue(value.value)
  }

  const out = {}
  for (const [key, child] of Object.entries(value)) {
    out[key] = nbtValue(child)
  }
  return out
}

function normalizeItemId (id) {
  if (id == null) return null
  const str = String(id)
  return str.startsWith('minecraft:') ? str : `minecraft:${str}`
}

function itemId (item) {
  item = nbtValue(item)
  return normalizeItemId(
    item?.id ??
    item?.name ??
    item?.Name ??
    item?.identifier ??
    item?.network_id ??
    item?.networkId
  )
}

function itemCount (item) {
  item = nbtValue(item)
  const count = item?.count ?? item?.Count ?? item?.amount ?? item?.Amount
  return Number(count ?? 0)
}

function recipeInputA (recipe) {
  recipe = nbtValue(recipe)
  return recipe?.buy ?? recipe?.buyA ?? recipe?.input ?? recipe?.inputA ?? recipe?.input_1
}

function recipeInputB (recipe) {
  recipe = nbtValue(recipe)
  return recipe?.buyB ?? recipe?.inputB ?? recipe?.input_2 ?? null
}

function recipeOutput (recipe) {
  recipe = nbtValue(recipe)
  return recipe?.sell ?? recipe?.output ?? recipe?.result
}

function isRecipeLike (value) {
  value = nbtValue(value)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const inputA = recipeInputA(value)
  const output = recipeOutput(value)

  return !!inputA && !!output && !!itemId(inputA) && !!itemId(output)
}

function extractRecipesFromTradePacket (packet) {
  const normalized = nbtValue(packet)

  const candidates = [
    normalized?.offers?.Recipes,
    normalized?.offers?.recipes,
    normalized?.trades?.Recipes,
    normalized?.trades?.recipes,
    normalized?.serialized_offers?.Recipes,
    normalized?.serialized_offers?.recipes,
    normalized?.serializedOffers?.Recipes,
    normalized?.serializedOffers?.recipes,
    normalized?.Recipes,
    normalized?.recipes,
    normalized?.offers,
    normalized?.trades,
    normalized?.trade_offers,
    normalized?.tradeOffers
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    const recipes = candidate.map(nbtValue).filter(isRecipeLike)
    if (recipes.length > 0) return recipes
  }

  return []
}

function summarizeRecipes (recipes) {
  return recipes.map(recipe => ({
    inputA: {
      id: itemId(recipeInputA(recipe)),
      count: itemCount(recipeInputA(recipe))
    },
    inputB: recipeInputB(recipe)
      ? {
          id: itemId(recipeInputB(recipe)),
          count: itemCount(recipeInputB(recipe))
        }
      : null,
    output: {
      id: itemId(recipeOutput(recipe)),
      count: itemCount(recipeOutput(recipe))
    },
    rawKeys: Object.keys(nbtValue(recipe) || {}),
    raw: nbtValue(recipe)
  }))
}

function summarizeTradePacket (packet) {
  const recipes = extractRecipesFromTradePacket(packet)

  return {
    window_id: packet.window_id,
    window_type: packet.window_type,
    size: packet.size,
    trader_unique_entity_id: packet.trader_unique_entity_id,
    trader_runtime_entity_id: packet.trader_runtime_entity_id,
    villager_unique_entity_id: packet.villager_unique_entity_id,
    display_name: packet.display_name,
    new_trading_ui: packet.new_trading_ui,
    using_economy_trade: packet.using_economy_trade,
    recipe_count: recipes.length,
    recipes: summarizeRecipes(recipes),
    raw_keys: Object.keys(packet)
  }
}

function printTradeParseDebug (tradePacket, recipes, label = 'trade parse debug') {
  const normalized = nbtValue(tradePacket)

  console.log(`\n[trading.test] ${label}: raw update_trade packet`)
  console.log(JSON.stringify(tradePacket, jsonDebugReplacer, 2))

  console.log(`\n[trading.test] ${label}: normalized update_trade packet`)
  console.log(JSON.stringify(normalized, jsonDebugReplacer, 2))

  console.log(`\n[trading.test] ${label}: extracted recipes raw`)
  console.log(JSON.stringify(recipes.map(nbtValue), jsonDebugReplacer, 2))

  console.log(`\n[trading.test] ${label}: extracted recipes summary`)
  console.log(JSON.stringify(summarizeRecipes(recipes), jsonDebugReplacer, 2))

  console.log(`\n[trading.test] ${label}: candidate arrays`)
  const candidates = {
    'offers.Recipes': normalized?.offers?.Recipes,
    'offers.recipes': normalized?.offers?.recipes,
    'trades.Recipes': normalized?.trades?.Recipes,
    'trades.recipes': normalized?.trades?.recipes,
    'serialized_offers.Recipes': normalized?.serialized_offers?.Recipes,
    'serialized_offers.recipes': normalized?.serialized_offers?.recipes,
    'serializedOffers.Recipes': normalized?.serializedOffers?.Recipes,
    'serializedOffers.recipes': normalized?.serializedOffers?.recipes,
    Recipes: normalized?.Recipes,
    recipes: normalized?.recipes,
    offers: normalized?.offers,
    trades: normalized?.trades,
    trade_offers: normalized?.trade_offers,
    tradeOffers: normalized?.tradeOffers
  }

  for (const [name, value] of Object.entries(candidates)) {
    if (!Array.isArray(value)) continue

    const mapped = value.map(nbtValue)
    console.log(`[trading.test] candidate ${name}: length=${mapped.length}`)
    console.log(JSON.stringify(mapped.map(entry => ({
      isRecipeLike: isRecipeLike(entry),
      summary: {
        inputA: {
          id: itemId(recipeInputA(entry)),
          count: itemCount(recipeInputA(entry))
        },
        inputB: recipeInputB(entry)
          ? {
              id: itemId(recipeInputB(entry)),
              count: itemCount(recipeInputB(entry))
            }
          : null,
        output: {
          id: itemId(recipeOutput(entry)),
          count: itemCount(recipeOutput(entry))
        }
      },
      rawKeys: Object.keys(entry || {}),
      raw: entry
    })), jsonDebugReplacer, 2))
  }
}

function assertTradeRecipe (recipes, expected) {
  const match = recipes.find(recipe => {
    const inputA = recipeInputA(recipe)
    const output = recipeOutput(recipe)

    return itemId(inputA) === expected.inputId &&
      itemCount(inputA) === expected.inputCount &&
      itemId(output) === expected.outputId &&
      itemCount(output) === expected.outputCount
  })

  assert(
    match,
    [
      `Missing expected trade ${expected.inputCount} ${expected.inputId} -> ${expected.outputCount} ${expected.outputId}.`,
      'Parsed trades:',
      JSON.stringify(summarizeRecipes(recipes), jsonDebugReplacer, 2),
      'Raw parsed recipes:',
      JSON.stringify(recipes.map(nbtValue), jsonDebugReplacer, 2)
    ].join('\n')
  )
}

function assertParsedTrades (tradePacket) {
  const recipes = extractRecipesFromTradePacket(tradePacket)

  try {
    console.log('[trading.test] parsed recipes', JSON.stringify(summarizeRecipes(recipes), jsonDebugReplacer, 2))

    assert(Array.isArray(recipes), 'Parsed recipes must be an array')

    if (recipes.length !== 2) {
      printTradeParseDebug(tradePacket, recipes, `expected 2 recipes, got ${recipes.length}`)
    }

    assert.strictEqual(recipes.length, 2, `Expected 2 parsed recipes, got ${recipes.length}`)

    for (const recipe of recipes) {
      const inputA = recipeInputA(recipe)
      const output = recipeOutput(recipe)

      if (!inputA || !output || !itemId(inputA) || !itemId(output) || itemCount(inputA) <= 0 || itemCount(output) <= 0) {
        printTradeParseDebug(tradePacket, recipes, 'invalid recipe structure')
      }

      assert(inputA, `Recipe missing primary input: ${JSON.stringify(nbtValue(recipe), jsonDebugReplacer, 2)}`)
      assert(output, `Recipe missing output: ${JSON.stringify(nbtValue(recipe), jsonDebugReplacer, 2)}`)

      assert(itemId(inputA), `Recipe input missing item id: ${JSON.stringify(nbtValue(inputA), jsonDebugReplacer, 2)}`)
      assert(itemCount(inputA) > 0, `Recipe input missing positive count: ${JSON.stringify(nbtValue(inputA), jsonDebugReplacer, 2)}`)

      assert(itemId(output), `Recipe output missing item id: ${JSON.stringify(nbtValue(output), jsonDebugReplacer, 2)}`)
      assert(itemCount(output) > 0, `Recipe output missing positive count: ${JSON.stringify(nbtValue(output), jsonDebugReplacer, 2)}`)
    }

    assertTradeRecipe(recipes, {
      inputId: 'minecraft:emerald',
      inputCount: 1,
      outputId: 'minecraft:bread',
      outputCount: 6
    })

    assertTradeRecipe(recipes, {
      inputId: 'minecraft:emerald',
      inputCount: 2,
      outputId: 'minecraft:apple',
      outputCount: 1
    })
  } catch (err) {
    printTradeParseDebug(tradePacket, recipes, `assertParsedTrades failed: ${err.message}`)
    throw err
  }
}

describe('real villager trading', function () {
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

    botState.setInventoryActionResponseTimeout?.(10000)
    botState.setInventoryActionUpdateTimeout?.(10000)
    botState.setTradeTimeout?.(15000)
  })

  beforeEach(async function () {
    await setupTradingWorld(botState)
  })

  after(function () {
    if (botState?.client) {
      botState.disconnect('Trading mocha test complete')
    }
  })

  it('summons a deterministic villager, opens the trading UI, and parses trades', async function () {
    assert.strictEqual(
      typeof botState.openTrade,
      'function',
      'botState.openTrade is not available; src/builtins/trader.js must be loaded'
    )

    const villager = await waitForEntity(botState, isTradeTestVillager)

    const tradePacket = await botState.openTrade(villager, {
      timeoutMs: 15000
    })

    console.log('[trading.test] update_trade summary', JSON.stringify(summarizeTradePacket(tradePacket), jsonDebugReplacer, 2))

    assert(tradePacket, 'Expected server to send update_trade after opening villager trade')
    assertParsedTrades(tradePacket)
  })

  it('has emeralds available for the deterministic trades', async function () {
    const emeraldSlot = botState.inventory.slots.findIndex(item => item?.name === 'emerald')
    assert.notStrictEqual(emeraldSlot, -1, 'Expected emeralds in inventory for villager trade tests')

    const emeralds = botState.inventory.slots[emeraldSlot]
    assert(emeralds.count >= 2, `Expected at least 2 emeralds, got ${emeralds.count}`)
  })
})