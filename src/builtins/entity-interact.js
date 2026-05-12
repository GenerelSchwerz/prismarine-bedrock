// src/builtins/trader.js
'use strict'

/**
 * builtins/trader.js
 *
 * Adds:
 *   botState.openTrade(entity, opts?) -> Promise<update_trade packet>
 *   botState.tradeWith(entity, opts?) -> Promise<update_trade packet>
 *   botState.waitForTradeWindow(opts?) -> Promise<update_trade packet>
 *   botState.closeTradeWindow() -> void
 *
 * This plugin depends on entity-interact.js for the actual Bedrock entity
 * interaction packet. Trading should not create its own separate interaction
 * transaction anymore.
 */

const {
  logAction,
  sameRuntimeId,
  toPlainId
} = require('../utils')

module.exports = function traderPlugin (botState, options = {}) {
  const client = botState.client

  let tradeTimeoutMs = options.tradeTimeoutMs ?? 10000
  let lastTradeWindow = null

  function runtimeIdOf (entity) {
    return entity?.runtimeId ?? entity?.runtime_id ?? entity?.runtimeEntityId
  }

  function entityIdCandidates (entity) {
    return [
      entity?.runtimeId,
      entity?.runtime_id,
      entity?.runtimeEntityId,
      entity?.id,
      entity?.entityId,
      entity?.uniqueId,
      entity?.unique_id
    ].filter(value => value != null)
  }

  function packetTradeEntityIds (packet) {
    return [
      packet.trader_runtime_entity_id,
      packet.traderRuntimeEntityId,
      packet.villager_runtime_entity_id,
      packet.villagerRuntimeEntityId,
      packet.trader_unique_entity_id,
      packet.traderUniqueEntityId,
      packet.villager_unique_entity_id,
      packet.villagerUniqueEntityId,
      packet.villager_unique_id,
      packet.villagerUniqueId,
      packet.entity_unique_id,
      packet.entityUniqueId
    ].filter(value => value != null)
  }

  function assertTradingEntity (entity) {
    const runtimeId = runtimeIdOf(entity)
    if (runtimeId == null) {
      throw new Error('Cannot open trade: target entity has no runtimeId')
    }

    return runtimeId
  }

  function waitForPacket (packetName, timeoutMs, predicate = () => true) {
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

  function packetMatchesEntity (packet, entity) {
    const packetIds = packetTradeEntityIds(packet)

    // Some servers/bridges do not include runtime IDs in update_trade, or use
    // unique IDs only. If there is no usable entity id in the packet, accept it.
    if (packetIds.length === 0) return true

    const targetIds = entityIdCandidates(entity)
    if (targetIds.length === 0) return true

    return packetIds.some(packetId => {
      return targetIds.some(targetId => {
        if (sameRuntimeId(packetId, targetId)) return true
        return String(packetId) === String(targetId)
      })
    })
  }

  function waitForTradeWindow (opts = {}) {
    const target = opts.entity
    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs

    return waitForPacket('update_trade', timeoutMs, packet => {
      return target ? packetMatchesEntity(packet, target) : true
    })
  }

  async function openTrade (entity, opts = {}) {
    const runtimeId = assertTradingEntity(entity)

    if (typeof botState.interactEntity !== 'function') {
      throw new Error('Cannot open trade: botState.interactEntity is not available')
    }

    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs

    // Start waiting before sending the interaction so fast servers cannot race us.
    const tradeWindowPromise = waitForTradeWindow({
      entity,
      timeoutMs
    })

    await botState.interactEntity(entity, {
      ...opts,
      mouseOver: opts.mouseOver ?? true,
      mouseOverDelayMs: opts.mouseOverDelayMs ?? 50
    })

    const packet = await tradeWindowPromise

    lastTradeWindow = packet
    botState.currentTradeWindow = packet
    botState.currentTradingEntity = entity

    botState.emit('trade_window_open', packet, entity)

    logAction('[trader]', 'update_trade received', {
      target: toPlainId(runtimeId),
      keys: Object.keys(packet),
      window_id: packet.window_id,
      window_type: packet.window_type,
      display_name: packet.display_name,
      new_trading_ui: packet.new_trading_ui,
      economic_trades: packet.economic_trades
    })

    return packet
  }

  function closeTradeWindow () {
    const packet = lastTradeWindow ?? botState.currentTradeWindow
    const windowId = packet?.window_id

    if (windowId != null) {
      client.queue('container_close', {
        window_id: windowId,
        server: false
      })

      logAction('[trader]', 'container_close trade', {
        window_id: windowId
      })
    }

    lastTradeWindow = null
    botState.currentTradeWindow = null
    botState.currentTradingEntity = null
    botState.emit('trade_window_close')
  }

  function currentTradeRecipes () {
    const packet = botState.currentTradeWindow ?? lastTradeWindow
    if (!packet) return []

    const offers = packet.offers
    if (Array.isArray(offers)) return offers

    const recipes =
      offers?.Recipes ??
      offers?.recipes ??
      packet.trades?.Recipes ??
      packet.trades?.recipes ??
      packet.serialized_offers?.Recipes ??
      packet.serialized_offers?.recipes

    return Array.isArray(recipes) ? recipes : []
  }

  botState.openTrade = openTrade
  botState.tradeWith = openTrade
  botState.waitForTradeWindow = waitForTradeWindow
  botState.closeTradeWindow = closeTradeWindow
  botState.currentTradeRecipes = currentTradeRecipes

  botState.setTradeTimeout = ms => {
    tradeTimeoutMs = ms
  }

  client.on('update_trade', packet => {
    lastTradeWindow = packet
    botState.currentTradeWindow = packet
    botState.emit('trade_window_update', packet)
  })

  client.on('container_close', packet => {
    const currentWindowId = botState.currentTradeWindow?.window_id

    if (currentWindowId != null && packet.window_id === currentWindowId) {
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