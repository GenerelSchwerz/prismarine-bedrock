// builtins/crafting.js
// Auto-loaded by BotState._loadBuiltins().
// Provides planning and execution of crafting using mineflayer-crafting-util (optional)
// and inventory-simulation for local window state.  Execution sends item_stack_request
// actions (take, place, craft_recipe) exactly like the trading.js plugin.

const { logAction } = require('../utils')
const Vec3 = require('vec3').Vec3
const { simulateClick } = require('./inventory-simulation')

// --------------------------------------------------------------------------
// Optional mineflayer-crafting-util for planning
// --------------------------------------------------------------------------
let craftUtil = null
try {
  const mod = require('mineflayer-crafting-util')
  if (mod.buildStatic && mod.craftPlan) craftUtil = mod
} catch (_) { /* not installed – fallback plan used */ }

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Wait for a window to open (used after interacting with a crafting table).
 */
function waitForWindow (botState, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for window')), timeout)
    const handler = (windowId) => {
      const win = botState.windows.get(windowId)
      if (win) {
        clearTimeout(timer)
        botState.client.removeListener('container_open', handler)
        resolve(win)
      }
    }
    botState.client.on('container_open', handler)
  })
}

/**
 * Find the first slot in the bot's inventory containing the given item id (and optional metadata).
 */
function findInventorySlot (botState, itemId, metadata = null) {
  const inv = botState.inventory
  if (!inv) return null
  for (let i = inv.inventoryStart; i <= inv.inventoryEnd; i++) {
    const item = inv.slots[i]
    if (item && item.type === itemId) {
      if (metadata == null || item.metadata === metadata) return i
    }
  }
  return null
}

/**
 * Find the first empty slot in the bot's inventory.
 */
function findEmptyInventorySlot (botState) {
  const inv = botState.inventory
  if (!inv) return null
  for (let i = inv.inventoryStart; i <= inv.inventoryEnd; i++) {
    if (inv.slots[i] == null) return i
  }
  return null
}

/**
 * Build a cross-container SlotInfo object for item_stack_request.
 */
function slotInfo (containerId, slot, stackId = 0) {
  return {
    slot_type: { container_id: containerId, dynamic_container_id: 0 },
    slot,
    stack_id: stackId,
  }
}

// --------------------------------------------------------------------------
// Craft execution (Bedrock item_stack_request path)
// --------------------------------------------------------------------------

async function executeCraft (botState, recipe, count, craftingTableBlock) {
  // 1. Open crafting table if needed
  let window
  if (recipe.requiresTable && craftingTableBlock) {
    // Interact with the block – the server will send a container_open.
    // A full implementation would also walk near the block.
    if (typeof botState.lookAt === 'function') {
      botState.lookAt(craftingTableBlock.position)
    }
    botState.client.queue('player_action', {
      runtime_entity_id: botState.client.entityId,
      action: 'start_break', // Bedrock uses start_break to "use" a block? Actually use interact_block.
      // Better: send interact action: 'interact_block'? For now keep existing pattern.
      action: 25, // interact_block
      position: { x: craftingTableBlock.position.x, y: craftingTableBlock.position.y, z: craftingTableBlock.position.z },
      result_position: { x: 0, y: 0, z: 0 },
      face: 0,
    })
    window = await waitForWindow(botState)
  } else {
    window = botState.inventory // 2×2 grid in inventory window
  }
  if (!window) throw new Error('Could not obtain crafting window')

  // 2. Determine grid layout
  const gridWidth = recipe.requiresTable ? 3 : 2
  const gridHeight = recipe.requiresTable ? 3 : 2
  const gridStart = 1 // slot 0 = result, slots 1–gridWidth*gridHeight = grid

  // 3. Build the list of required items (grid slot → item descriptor)
  const required = []
  if (recipe.inShape) {
    for (let y = 0; y < recipe.inShape.length; y++) {
      const row = recipe.inShape[y]
      for (let x = 0; x < row.length; x++) {
        required.push({
          id: row[x].id,
          metadata: row[x].metadata ?? null,
          slot: gridStart + x + y * gridWidth,
        })
      }
    }
  } else if (recipe.ingredients) {
    // Shapeless – fill sequentially
    for (let i = 0; i < recipe.ingredients.length; i++) {
      required.push({
        id: recipe.ingredients[i].id,
        metadata: recipe.ingredients[i].metadata ?? null,
        slot: gridStart + i,
      })
    }
  }

  // 4. Clear the grid (quick-move any existing items to inventory)
  let carried = null
  for (let i = gridStart; i < gridStart + gridWidth * gridHeight; i++) {
    if (window.slots[i] !== null) {
      // Simulate shift-click to move out
      const op = { type: 'QuickMove', slot: i }
      const result = simulateClick(window, op, carried, false)
      carried = result.newCarriedItem
      // If item couldn't be moved, carry it
    }
  }

  // 5. Build the list of take actions for moving ingredients into grid
  const takeActions = []
  for (const req of required) {
    if (req.id === -1) continue
    const invSlot = findInventorySlot(botState, req.id, req.metadata)
    if (invSlot === null) {
      // The simulation may have moved items; re‑check after clearing?
      // For a real server we rely on actual inventory; we'll throw.
      throw new Error(`Missing ingredient: id=${req.id}`)
    }
    const srcItem = window.slots[invSlot]
    if (!srcItem) throw new Error(`Slot ${invSlot} became empty unexpectedly`)

    // Move one item from inventory slot to grid slot via Pickup simulation
    // First pick up from inventory
    const pickupOp = { type: 'Pickup', mode: 'left', slot: invSlot }
    const r1 = simulateClick(window, pickupOp, carried, false)
    carried = r1.newCarriedItem
    // Then place into grid slot
    const placeOp = { type: 'Pickup', mode: 'left', slot: req.slot }
    const r2 = simulateClick(window, placeOp, carried, false)
    carried = r2.newCarriedItem

    // Build the network action
    takeActions.push({
      type_id: 0, // take
      count: 1,   // move one item
      source: slotInfo('inventory', invSlot, srcItem.stackId || 0),
      destination: slotInfo('crafting_input', req.slot, 0),
    })
  }

  // 6. Craft the recipe
  const recipeNetworkId = recipe.networkId // should be set by the planner
  const craftActions = [
    {
      type_id: 12, // craft_recipe
      recipe_network_id: recipeNetworkId,
      times_crafted: count,
    },
  ]

  // 7. Build the full request
  const requestId = botState.itemClass.nextStackId() // generate unique ID
  const request = {
    request_id: requestId,
    actions: [...takeActions, ...craftActions],
    custom_names: [],
    cause: 0, // chat_public
  }

  // 8. Send the request
  botState.client.queue('item_stack_request', { requests: [request] })

  // 9. Wait for the response (the inventory plugin will update windows automatically)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      botState.client.removeListener('item_stack_response', handler)
      reject(new Error('Craft request timed out'))
    }, 10000)

    const handler = (packet) => {
      if (!packet.responses) return
      for (const resp of packet.responses) {
        if (resp.request_id === requestId) {
          clearTimeout(timeout)
          botState.client.removeListener('item_stack_response', handler)
          if (resp.status === 0) {
            logAction('[craft]', 'craft accepted', { requestId, count })
            resolve(resp)
          } else {
            reject(new Error(`Craft rejected (status ${resp.status})`))
          }
        }
      }
    }
    botState.client.on('item_stack_response', handler)
  })
}

// --------------------------------------------------------------------------
// Plugin inject
// --------------------------------------------------------------------------

module.exports = async (botState, options) => {
  const Registry = botState.registry

  // ── Planning (using optional mineflayer-crafting-util or simple fallback) ──
  let craftPlanFn = null
  let craftItemFn = null

  if (craftUtil) {
    const craftFunc = await craftUtil.buildStatic(Registry)
    craftPlanFn = craftFunc
    // also craftPlan and craftItem from the module
    craftItemFn = craftUtil.craftItem
  } else {
    // Simple fallback: just execute a single recipe step without planning
    botState.planCraft = (wantedItem) => {
      return { success: false, error: 'mineflayer-crafting-util not installed' }
    }
    botState.planCraftInventory = () => botState.planCraft()
  }

  botState.planCraft = (wantedItem, craftOpts) => {
    if (craftPlanFn) return craftPlanFn(wantedItem, craftOpts)
    return { success: false, error: 'No planner available' }
  }

  botState.planCraftInventory = (wantedItem) => {
    if (!craftPlanFn) return { success: false }
    const items = botState.inventory.slots
      .filter(i => i != null)
      .map(i => ({ id: i.type, count: i.count }))
    return craftPlanFn(wantedItem, {
      availableItems: items,
      careAboutExisting: false,
      includeRecursion: true,
      multipleRecipes: true,
    })
  }

  // ── Execution (uses item_stack_request) ──

  botState.craftPlan = async (plan, craftingTable) => {
    if (!plan.success) throw new Error('Cannot craft an unsuccessful plan')
    for (const step of plan.recipesToDo) {
      await executeCraft(botState, step.recipe, step.recipeApplications, craftingTable)
    }
    return plan
  }

  botState.craftItem = async (itemId, count, craftingTable, options = {}, craftOptions = {}) => {
    const plan = botState.planCraftInventory({ id: itemId, count })
    if (!plan.success) {
      throw new Error('Could not plan craft for item ' + itemId)
    }
    await botState.craftPlan(plan, craftingTable)
    return plan
  }

  logAction('[craft]', 'crafting plugin loaded (using item_stack_request)')
}