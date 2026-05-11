// builtins/trading.js
// Auto-loaded by BotState._loadBuiltins().
// Handles the Bedrock villager trading UI.
//
// Relies on:
//   - inventory.js  (provides botState.windows, botState.inventory,
//                     botState.getItem, botState.findItem, botState.count)
//   - entities.js   (provides botState.self and entity runtime IDs)
//
// Packets handled:
//   - update_trade  – stores the current villager trade offers
//   - container_open / container_close  – already handled by inventory.js;
//     this plugin attaches to the merchant window after creation
//
// Methods added:
//   botState.offers          – array of parsed offer objects (see docstring)
//   botState.tradeData       – raw packet from the last update_trade
//   botState.currentTradeWindow – the merchant Window instance (or null)
//
//   botState.trade(offerIndex, count) – execute a trade
//     offerIndex : index into botState.offers
//     count      : number of times to repeat the trade (default 1)
//
//   botState.closeTrade()    – close the merchant window
//
// Offer object shape (parsed from NBT via prismarine-nbt.simplify):
//   {
//     buyA:    { id, count, metadata },
//     buyB:    { id, count, metadata } | null,
//     sell:    { id, count, metadata },
//     tier:    number,
//     uses:    number,
//     maxUses: number,
//     xpReward: boolean,
//     demand:  number,
//     priceMultiplier: number,
//     networkId: number,
//   }

const { logAction } = require('../utils')
const nbt = require('prismarine-nbt')

/**
 * @param {import('../state')} botState
 * @param {object} options
 */
function inject (botState, options) {
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  botState.tradeData = null          // raw packet from last update_trade
  botState.offers = []               // array of parsed Offer objects
  botState.currentTradeWindow = null // the merchant Window instance

  // ------------------------------------------------------------------
  // Parse villager offers from the NBT compound inside update_trade
  // using prismarine-nbt's built-in simplify function
  // ------------------------------------------------------------------
  function parseOffers (offersTag) {
    // Bedrock stores trades in a compound like:
    //   { "Recipes": [ { buyA, buyB?, sell, tier, uses, maxUses, … } ] }
    const simplified = nbt.simplify(offersTag)
    const recipes = simplified.Recipes || simplified.recipes || []
    if (!Array.isArray(recipes)) return []

    const parsed = []
    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i]
      parsed.push({
        index: i,
        buyA:      r.buyA  ? { id: r.buyA.id, count: r.buyA.count, metadata: r.buyA.metadata || 0 } : null,
        buyB:      r.buyB  ? { id: r.buyB.id, count: r.buyB.count, metadata: r.buyB.metadata || 0 } : null,
        sell:      r.sell  ? { id: r.sell.id, count: r.sell.count, metadata: r.sell.metadata || 0 } : null,
        tier:           r.tier           ?? 0,
        uses:           r.uses           ?? 0,
        maxUses:        r.maxUses        ?? 0,
        xpReward:       r.xpReward       ?? false,
        demand:         r.demand         ?? 0,
        priceMultiplier:r.priceMultiplier ?? 0,
        networkId:      r.networkId      ?? i + 1,
      })
    }
    return parsed
  }

  // ------------------------------------------------------------------
  // Packet handlers
  // ------------------------------------------------------------------

  // ---------- update_trade ----------
  botState.client.on('update_trade', (packet) => {
    botState.tradeData = packet
    botState.offers = parseOffers(packet.offers)

    // Look for the merchant window (window_id from packet)
    const windowId = packet.window_id
    const win = botState.windows?.get(windowId)
    if (win) {
      botState.currentTradeWindow = win
      logAction('[trading]', `update_trade: window=${windowId}, tier=${packet.trade_tier}, offers=${botState.offers.length}`)
    } else {
      logAction('[trading]', `update_trade: window=${windowId} not found yet (container_open probably pending)`)
    }

    botState.emit('tradeUpdate', {
      windowId,
      villagerId: packet.villager_unique_id,
      offers: botState.offers,
      tradeTier: packet.trade_tier,
    })
  })

  // ---------- Attach to merchant window when it opens ----------
  botState.client.on('container_open', (packet) => {
    const windowTypeName = packet.window_type
    if (windowTypeName === 'trading' || windowTypeName === 15) {
      const windowId = packet.window_id
      const win = botState.windows?.get(windowId)
      if (win) {
        botState.currentTradeWindow = win
        logAction('[trading]', `merchant window opened: id=${windowId}`)
      }
    }
  })

  // ---------- Cleanup on container_close ----------
  botState.client.on('container_close', (packet) => {
    const windowId = packet.window_id
    if (botState.currentTradeWindow && botState.currentTradeWindow.id === windowId) {
      botState.currentTradeWindow = null
      botState.tradeData = null
      botState.offers = []
      logAction('[trading]', 'merchant window closed')
    }
  })

  // ------------------------------------------------------------------
  // Trade execution
  // ------------------------------------------------------------------

  /**
   * Execute a trade by index.
   * Steps:
   *   1. Verify the merchant window is open.
   *   2. Compute required items for the chosen offer.
   *   3. Check the bot inventory for required items.
   *   4. Send an item_stack_request with a `craft_recipe` action
   *      referencing the offer's networkId.
   *   5. Listen for item_stack_response to confirm.
   *
   * @param {number} offerIndex  – index into botState.offers
   * @param {number} [count=1]   – how many times to trade
   * @returns {Promise<{success: boolean, resultItem: object|null, error?: string}>}
   */
  botState.trade = async function trade (offerIndex, count = 1) {
    const win = botState.currentTradeWindow
    if (!win) {
      return { success: false, resultItem: null, error: 'No merchant window open' }
    }

    const offer = botState.offers[offerIndex]
    if (!offer) {
      return { success: false, resultItem: null, error: `Offer index ${offerIndex} out of range` }
    }

    if (offer.uses >= offer.maxUses) {
      return { success: false, resultItem: null, error: 'Trade offer exhausted' }
    }

    // ---- verify required items are in inventory ----
    const inv = botState.inventory
    if (!inv) {
      return { success: false, resultItem: null, error: 'Main inventory not available' }
    }

    function countInInventory (itemDesc) {
      if (!itemDesc) return Infinity
      return botState.count(itemDesc.id, itemDesc.metadata) || 0
    }

    const haveA = countInInventory(offer.buyA)
    const haveB = countInInventory(offer.buyB)
    const needA = (offer.buyA?.count ?? 0) * count
    const needB = (offer.buyB?.count ?? 0) * count

    if (haveA < needA) {
      return { success: false, resultItem: null, error: `Need ${needA}x item ${offer.buyA?.id}, have ${haveA}` }
    }
    if (haveB < needB) {
      return { success: false, resultItem: null, error: `Need ${needB}x item ${offer.buyB?.id}, have ${haveB}` }
    }

    // ---- build item_stack_request ----
    const client = botState.client
    const ItemClass = botState.itemClass

    function findSlotWith (id, metadata) {
      for (let i = inv.inventoryStart; i < inv.inventoryEnd; i++) {
        const item = inv.slots[i]
        if (item && item.type === id && (metadata == null || item.metadata === metadata)) {
          return i
        }
      }
      return -1
    }

    const actions = []

    // Move items into slot 0 (buyA)
    if (offer.buyA) {
      let remaining = offer.buyA.count * count
      while (remaining > 0) {
        const srcSlot = findSlotWith(offer.buyA.id, offer.buyA.metadata)
        if (srcSlot === -1) break
        const srcItem = inv.slots[srcSlot]
        const takeCount = Math.min(remaining, srcItem.count)

        actions.push({
          type_id: 0, // take
          count: takeCount,
          source: {
            slot_type: { container_id: 'inventory', slot: srcSlot, stack_id: srcItem.stackId || 0 },
            slot: srcSlot,
            stack_id: srcItem.stackId || 0,
          },
          destination: {
            slot_type: { container_id: 'trade_ingredient1', slot: 0, stack_id: 0 },
            slot: 0,
            stack_id: 0,
          },
        })
        remaining -= takeCount
      }
    }

    // Move items into slot 1 (buyB)
    if (offer.buyB) {
      let remaining = offer.buyB.count * count
      while (remaining > 0) {
        const srcSlot = findSlotWith(offer.buyB.id, offer.buyB.metadata)
        if (srcSlot === -1) break
        const srcItem = inv.slots[srcSlot]
        const takeCount = Math.min(remaining, srcItem.count)

        actions.push({
          type_id: 0, // take
          count: takeCount,
          source: {
            slot_type: { container_id: 'inventory', slot: srcSlot, stack_id: srcItem.stackId || 0 },
            slot: srcSlot,
            stack_id: srcItem.stackId || 0,
          },
          destination: {
            slot_type: { container_id: 'trade_ingredient2', slot: 1, stack_id: 0 },
            slot: 1,
            stack_id: 0,
          },
        })
        remaining -= takeCount
      }
    }

    // Craft the recipe (click the output)
    actions.push({
      type_id: 23, // craft_recipe
      recipe_network_id: offer.networkId,
      times_crafted: count,
    })

    // Send the item_stack_request
    try {
      const requestId = ItemClass.nextStackId()
      client.queue('item_stack_request', {
        requests: [
          {
            request_id: requestId,
            actions,
            custom_names: [],
            cause: 0,
          },
        ],
      })

      return { success: true, resultItem: offer.sell, requestId }
    } catch (err) {
      return { success: false, resultItem: null, error: err.message }
    }
  }

  // ---------- Handle item_stack_response to confirm the trade ----------
  botState.client.on('item_stack_response', (packet) => {
    if (packet.responses) {
      for (const resp of packet.responses) {
        if (resp.status === 0 || resp.status === 'ok') {
          logAction('[trading]', `trade request ${resp.request_id} accepted`)
          botState.emit('tradeComplete', { requestId: resp.request_id })
        } else {
          logAction('[trading]', `trade request ${resp.request_id} rejected (status=${resp.status})`)
          botState.emit('tradeRejected', { requestId: resp.request_id, status: resp.status })
        }
      }
    }
  })

  // ------------------------------------------------------------------
  // Close the merchant window
  // ------------------------------------------------------------------
  botState.closeTrade = function closeTrade () {
    const win = botState.currentTradeWindow
    if (!win) return
    botState.client.queue('container_close', {
      window_id: win.id,
      window_type: 'trading',
      server: false,
    })
    botState.currentTradeWindow = null
    botState.tradeData = null
    botState.offers = []
    logAction('[trading]', 'sent container_close for merchant window')
  }
}

module.exports = inject
