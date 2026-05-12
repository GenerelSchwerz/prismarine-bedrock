// src/builtins/trader.js
'use strict'

/**
 * builtins/trader.js
 *
 * Dedicated Bedrock villager trading helpers.
 *
 * Adds:
 *   botState.openTrade(entity, opts?) -> Promise<update_trade packet>
 *   botState.tradeWith(entity, opts?) -> Promise<update_trade packet>
 *   botState.waitForTradeWindow(opts?) -> Promise<update_trade packet>
 *   botState.closeTradeWindow() -> void
 *
 * Important:
 * - This deliberately does NOT call botState.attackEntity().
 * - This deliberately does NOT send animate/swing_arm.
 * - The inventory_transaction is ITEM_USE_ON_ENTITY with action_type = 0 / interact.
 *
 * minecraft-data 1.21.130:
 * Transaction.transaction_type:
 *   3: item_use_on_entity
 *
 * TransactionUseItemOnEntity.action_type:
 *   0: interact
 *   1: attack
 *
 * Geyser:
 *   ITEM_USE_ON_ENTITY + actionType 0 -> processEntityInteraction(...)
 *   ITEM_USE_ON_ENTITY + actionType 1 -> ServerboundAttackPacket
 */

const {
  itemToRaw,
  logAction,
  selfRuntimeEntityId,
  toPlainId,
  toVec3f
} = require('../utils')

module.exports = function traderPlugin (botState, options = {}) {
  const client = botState.client

  let tradeTimeoutMs = options.tradeTimeoutMs ?? 10000
  let lastTradeWindow = null

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function runtimeIdOf (entity) {
    return entity?.runtimeId ?? entity?.runtime_id ?? entity?.runtimeEntityId
  }

  function assertEntity (entity) {
    const runtimeId = runtimeIdOf(entity)
    if (runtimeId == null) {
      throw new Error('Cannot trade: target entity has no runtimeId')
    }

    return runtimeId
  }

  function heldHotbarSlot () {
    const slot = botState.heldItemSlot
    if (Number.isInteger(slot) && slot >= 0 && slot <= 8) return slot
    return 0
  }

  function heldItemRaw () {
    const slot = heldHotbarSlot()
    const item = botState.heldItem ?? botState.inventory?.slots?.[slot] ?? null
    return itemToRaw(item, botState.itemClass)
  }

  function playerPosition () {
    if (botState.self?.position) return toVec3f(botState.self.position)
    return { x: 0, y: 0, z: 0 }
  }

  function entityClickPosition (entity, opts = {}) {
    if (opts.clickPos) return toVec3f(opts.clickPos)

    const pos = entity?.position
    if (!pos) return { x: 0, y: 1, z: 0 }

    // Geyser subtracts entity.bedrockPosition() from this value before sending
    // Java InteractAt. So send an absolute-ish point near the villager's upper body,
    // not {0,0,0}. A relative zero vector can become a huge negative interaction
    // point after Geyser's subtraction.
    const height = Number(entity.height || opts.height || 1.95)

    return {
      x: Number(pos.x),
      y: Number(pos.y) + Math.min(height * 0.75, 1.5),
      z: Number(pos.z)
    }
  }

  function waitForPacket (packetName, timeoutMs, predicate = () => true) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timed out waiting for ${JSON.stringify(packetName)}`))
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

  function tradeEntityIdsFromPacket (packet) {
    return [
      packet.trader_runtime_entity_id,
      packet.traderRuntimeEntityId,
      packet.villager_runtime_entity_id,
      packet.villagerRuntimeEntityId,
      packet.trader_unique_entity_id,
      packet.traderUniqueEntityId,
      packet.villager_unique_entity_id,
      packet.villagerUniqueEntityId
    ].filter(value => value != null)
  }

  function packetMatchesEntity (packet, entity) {
    const targetRuntimeId = runtimeIdOf(entity)
    if (targetRuntimeId == null) return true

    const ids = tradeEntityIdsFromPacket(packet)
    if (ids.length === 0) return true

    return ids.some(id => {
      try {
        return BigInt(id) === BigInt(targetRuntimeId)
      } catch {
        return String(id) === String(targetRuntimeId)
      }
    })
  }

  function waitForTradeWindow (opts = {}) {
    const target = opts.entity
    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs

    return waitForPacket('update_trade', timeoutMs, packet => {
      return target ? packetMatchesEntity(packet, target) : true
    })
  }

  function queueMouseOverEntity (entity) {
    const runtimeId = assertEntity(entity)

    client.queue('interact', {
      action_id: 'mouse_over_entity',
      target_entity_id: runtimeId,
      has_position: false
    })

    logAction('[trader]', 'interact mouse_over_entity', {
      target: toPlainId(runtimeId)
    })
  }

  function queueTradeInteractTransaction (entity, opts = {}) {
    const runtimeId = assertEntity(entity)
    const hotbarSlot = opts.hotbarSlot ?? heldHotbarSlot()

    // Use numeric 0 instead of the string enum name on purpose.
    // minecraft-data maps 0 -> interact and 1 -> attack; Geyser checks numeric action type.
    // This avoids any accidental enum-name/string mismatch in fast-moving protocol defs.
    const actionTypeInteract = 0

    const transaction = {
      legacy: {
        legacy_request_id: 0,
        legacy_transactions: []
      },
      transaction_type: 'item_use_on_entity',
      actions: [],
      transaction_data: {
        entity_runtime_id: runtimeId,
        action_type: actionTypeInteract,
        hotbar_slot: hotbarSlot,
        held_item: opts.heldItemRaw ?? heldItemRaw(),
        player_pos: opts.playerPos ? toVec3f(opts.playerPos) : playerPosition(),
        click_pos: entityClickPosition(entity, opts)
      }
    }

    client.queue('inventory_transaction', { transaction })

    botState.emit('trade_interact_request', {
      entity,
      runtimeId,
      transaction
    })

    logAction('[trader]', 'inventory_transaction item_use_on_entity interact', {
      target: toPlainId(runtimeId),
      action_type: actionTypeInteract,
      hotbar_slot: hotbarSlot,
      click_pos: transaction.transaction_data.click_pos
    })
  }

  async function openTrade (entity, opts = {}) {
    assertEntity(entity)

    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs
    const tradeWindowPromise = waitForTradeWindow({ entity, timeoutMs })

    if (opts.mouseOver !== false) {
      queueMouseOverEntity(entity)

      // Vanilla usually has a tiny ordering gap between hover and interact.
      // This also makes packet logs easier to read.
      if (opts.mouseOverDelayMs !== 0) {
        await sleep(opts.mouseOverDelayMs ?? 50)
      }
    }

    queueTradeInteractTransaction(entity, opts)

    const packet = await tradeWindowPromise
    lastTradeWindow = packet
    botState.currentTradeWindow = packet
    botState.currentTradingEntity = entity
    botState.emit('trade_window_open', packet, entity)

    logAction('[trader]', 'update_trade received', {
      target: toPlainId(runtimeIdOf(entity)),
      keys: Object.keys(packet),
      window_id: packet.window_id,
      display_name: packet.display_name,
      new_trading_ui: packet.new_trading_ui,
      using_economy_trade: packet.using_economy_trade
    })

    return packet
  }

  function closeTradeWindow () {
    const windowId = lastTradeWindow?.window_id ?? botState.currentTradeWindow?.window_id

    if (windowId != null) {
      client.queue('container_close', {
        window_id: windowId,
        server: false
      })

      logAction('[trader]', 'container_close trade', { window_id: windowId })
    }

    lastTradeWindow = null
    botState.currentTradeWindow = null
    botState.currentTradingEntity = null
    botState.emit('trade_window_close')
  }

  botState.openTrade = openTrade
  botState.tradeWith = openTrade
  botState.waitForTradeWindow = waitForTradeWindow
  botState.closeTradeWindow = closeTradeWindow

  botState.setTradeTimeout = ms => {
    tradeTimeoutMs = ms
  }

  client.on('update_trade', packet => {
    lastTradeWindow = packet
    botState.currentTradeWindow = packet
    botState.emit('trade_window_update', packet)
  })

  client.on('container_close', packet => {
    const windowId = packet.window_id
    const currentWindowId = botState.currentTradeWindow?.window_id

    if (currentWindowId != null && windowId === currentWindowId) {
      lastTradeWindow = null
      botState.currentTradeWindow = null
      botState.currentTradingEntity = null
      botState.emit('trade_window_close', packet)
    }
  })

  client.on('close', () => {
    lastTradeWindow = null
    botState.currentTradeWindow = null
    botState.currentTradingEntity = null
  })
}