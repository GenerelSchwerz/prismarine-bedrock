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
const TRADE_POS = {
  x: Number(process.env.TRADE_TEST_X || 32),
  y: Number(process.env.TRADE_TEST_Y || 80),
  z: Number(process.env.TRADE_TEST_Z || 32)
}

const AFTER_INTERACT_DELAY_MS = Number(process.env.AFTER_INTERACT_DELAY_MS || 1500)

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

function waitForEntity (botState, filter, timeoutMs = 15000) {
  const existing = [...botState.entities.values()].find(filter)
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for entity'))
    }, timeoutMs)

    function onEntitySpawned (entity) {
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

function waitForPacket (client, packetName, timeoutMs = 10000, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for ${packetName}`))
    }, timeoutMs)

    function onPacket (packet) {
      if (!predicate(packet)) return
      cleanup()
      resolve(packet)
    }

    function cleanup () {
      clearTimeout(timeout)
      client.off(packetName, onPacket)
    }

    client.on(packetName, onPacket)
  })
}

const TRADE_TEST_TAG = 'pb_trade_test_villager'

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
    `data merge entity ${selector} {CustomName:"{\\"text\\":\\"${TRADE_TEST_NAME}\\"}"}`
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
  return entity?.name === 'villager' &&
    entity.position &&
    Math.abs(entity.position.x - TRADE_POS.x) < 3 &&
    Math.abs(entity.position.y - TRADE_POS.y) < 3 &&
    Math.abs(entity.position.z - TRADE_POS.z) < 3
}

function summarizeTradePacket (packet) {
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
    offers_len: packet.offers?.length,
    trades_len: packet.trades?.length,
    raw_keys: Object.keys(packet)
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
  })

  beforeEach(async function () {
    await setupTradingWorld(botState)
  })

  after(function () {
    if (botState?.client) {
      botState.disconnect('Trading mocha test complete')
    }
  })

  it('summons a deterministic villager and opens the trading UI', async function () {
    const villager = await waitForEntity(botState, isTradeTestVillager)

    const seen = {
      interact: false,
      containerOpen: null,
      updateTrade: null
    }

    const updateTradePromise = waitForPacket(botState.client, 'update_trade', 15000)
    const containerOpenPromise = waitForPacket(botState.client, 'container_open', 15000).catch(() => null)

    botState.client.on('inventory_transaction', packet => {
      const tx = packet.transaction
      if (tx?.transaction_type === 'item_use_on_entity') {
        seen.interact = true
      }
    })

    await botState.interactEntity(villager)
    await sleep(AFTER_INTERACT_DELAY_MS)

    seen.updateTrade = await updateTradePromise
    seen.containerOpen = await containerOpenPromise

    console.log('[trading.test] update_trade summary', summarizeTradePacket(seen.updateTrade))
    if (seen.containerOpen) {
      console.log('[trading.test] container_open', seen.containerOpen)
    }

    assert(seen.updateTrade, 'Expected server to send update_trade after interacting with villager')
    assert(
      seen.updateTrade.offers || seen.updateTrade.trades || seen.updateTrade.serialized_offers,
      `update_trade did not expose any obvious trade payload keys: ${Object.keys(seen.updateTrade).join(', ')}`
    )
  })

  it('has emeralds available for the deterministic trades', async function () {
    const emeraldSlot = botState.inventory.slots.findIndex(item => item?.name === 'emerald')
    assert.notStrictEqual(emeraldSlot, -1, 'Expected emeralds in inventory for villager trade tests')

    const emeralds = botState.inventory.slots[emeraldSlot]
    assert(emeralds.count >= 2, `Expected at least 2 emeralds, got ${emeralds.count}`)
  })
})