// builtins/place.js
// Auto-loaded by BotState._loadBuiltins(). Adds placeBlock() and placeEntity() methods
// to the bot state. Uses the InventoryTransaction packet (item_use) to perform placements.
//
// Assumes:
//   - bot.lookAt(pos) exists (user stated it is available)
//   - botState.heldItemSlot is maintained by the inventory plugin
//   - botState.spawnPosition reflects current player position
//   - botState.world.getBlock(pos) returns a block with .stateId
//   - botState.itemClass.toNotch(stack) exists (prismarine-item provides it)

const Vec3 = require('vec3').Vec3
const { logAction } = require('../utils')

/**
 * @param {import('../state')} botState
 * @param {object} options
 */
function inject (botState, options) {
  const client = botState.client

  // ------------------------------------------------------------------
  // Helper: construct the raw item representation for a prismarine-item stack
  // ------------------------------------------------------------------
  function itemToRaw (stack) {
    if (!stack) {
      // Empty item (network_id = 0)
      return { network_id: 0 }
    }
    try {
      // prismarine-item's toNotch returns the proper bedrock raw format
      return botState.itemClass.toNotch(stack)
    } catch (e) {
      logAction('[place]', 'itemToRaw error', { msg: e.message })
      // Fallback: return a minimal placeholder – may not work on strict servers
      return {
        network_id: stack.type,
        count: stack.count,
        metadata: 0,
        block_runtime_id: 0,
        extra: { can_place_on: [], can_destroy: [] }
      }
    }
  }

  // ------------------------------------------------------------------
  // Helper: get the block runtime ID at a given world position
  // ------------------------------------------------------------------
  function getBlockRuntimeId (pos) {
    try {
      const block = botState.world.getBlock(pos)
      // block.stateId should be set by the version-respecting prismarine-chunk
      if (block && block.stateId != null) {
        // In Bedrock, if block_network_ids_are_hashes is true, we need to use
        // the hash mapping. For simplicity, assume normal (no hash) for now.
        // You can extend this by checking registry.features.blockHashes.
        return block.stateId
      }
    } catch (e) {
      logAction('[place]', 'getBlockRuntimeId error', { pos: pos.toString(), msg: e.message })
    }
    return 0
  }

  // ------------------------------------------------------------------
  // Helper: send the actual InventoryTransaction packet
  // ------------------------------------------------------------------
  function sendPlaceTransaction (useItemData) {
    // Build the Transaction object
    const transaction = {
      legacy: { legacy_request_id: 0 },
      transaction_type: 2, // item_use
      // actions is an empty array for block placement; the inventory change is
      // handled by the server after the transaction is accepted.
      actions: [],
      transaction_data: useItemData
    }

    client.queue('inventory_transaction', { transaction })
    logAction('[place]', 'sent inventory_transaction (item_use)')
  }

  // ------------------------------------------------------------------
  // placeBlock: place the held item on a specific block face
  // ------------------------------------------------------------------
  /**
   * @param {Vec3} targetPos - position of the block to place against
   * @param {number} [face=1] - block face to click (0=bottom, 1=top, 2=z-, 3=z+, 4=x-, 5=x+)
   * @returns {Promise<void>} resolves after the look and packet send
   */
  botState.placeBlock = async function (targetPos, face = 1) {
    if (!(targetPos instanceof Vec3)) {
      throw new TypeError('placeBlock: targetPos must be a Vec3')
    }

    // Look at the centre of the target block
    if (typeof botState.lookAt === 'function') {
      const lookPos = targetPos.offset(0.5, 0.5, 0.5)
      await botState.lookAt(lookPos)
    }

    // Determine the hotbar slot holding the item we want to place
    const heldSlot = botState.heldItemSlot
    const heldItem = botState.inventory.slots[heldSlot]
    if (!heldItem) {
      throw new Error('No item in the active hotbar slot to place')
    }

    // Build the TransactionUseItem data
    const useItemData = {
      action_type: 0, // click_block
      trigger_type: 1, // player_input (or 2 simulation_tick)
      block_position: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
      face: face,
      hotbar_slot: heldSlot,
      held_item: itemToRaw(heldItem),
      player_pos: { x: botState.spawnPosition.x, y: botState.spawnPosition.y, z: botState.spawnPosition.z },
      click_pos: { x: 0.5, y: 0.5, z: 0.5 }, // centre of the block face
      block_runtime_id: getBlockRuntimeId(targetPos),
      client_prediction: 1, // success
      client_cooldown_state: 0 // off
    }

    sendPlaceTransaction(useItemData)
  }

  // ------------------------------------------------------------------
  // placeEntity: use the held item in the world (e.g. place a boat, minecart)
  // ------------------------------------------------------------------
  /**
   * @param {Vec3} targetPos - world position where to place the entity
   * @returns {Promise<void>}
   */
  botState.placeEntity = async function (targetPos) {
    if (!(targetPos instanceof Vec3)) {
      throw new TypeError('placeEntity: targetPos must be a Vec3')
    }

    // Look at the position
    if (typeof botState.lookAt === 'function') {
      await botState.lookAt(targetPos.offset(0, 1.5, 0)) // look slightly above
    }

    const heldSlot = botState.heldItemSlot
    const heldItem = botState.inventory.slots[heldSlot]
    if (!heldItem) {
      throw new Error('No item in the active hotbar slot to place')
    }

    // Use item on air (action_type = 1)
    const useItemData = {
      action_type: 1, // click_air
      trigger_type: 1, // player_input
      block_position: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
      face: 1, // ignored for click_air
      hotbar_slot: heldSlot,
      held_item: itemToRaw(heldItem),
      player_pos: { x: botState.spawnPosition.x, y: botState.spawnPosition.y, z: botState.spawnPosition.z },
      click_pos: { x: 0.5, y: 0.5, z: 0.5 },
      block_runtime_id: 0,
      client_prediction: 1,
      client_cooldown_state: 0
    }

    sendPlaceTransaction(useItemData)
  }
}

module.exports = inject