// builtins/inventory.js
// Auto-loaded by BotState._loadBuiltins().
// Maintains a prismarine-windows Window for each open window.
//
// Handles:
//   - inventory_content: full sync for any window
//   - inventory_slot:    single slot update for any window
//   - mob_equipment:     syncs the bot's own held item
//   - container_open:    creates a new Window for the container
//   - container_close:   removes the container Window
//
// Provides:
//   botState.inventory          – main inventory Window (windowId 0)
//   botState.windows            – Map<number, Window> for all open windows
//   botState.heldItem           – getter: currently held item
//   botState.getItem(slot, [windowId])
//   botState.findItem(itemType, metadata, notFull, nbt, [windowId])
//   botState.count(itemType, metadata, [windowId])

const Item = require('prismarine-item')
const createWindow = require('prismarine-windows')
const { logAction, rawStackId, sameRuntimeId, selfRuntimeEntityId } = require('../utils')

// Map of Bedrock WindowType enum name -> prismarine-windows window type key
// and the expected total slot count for that container.
const WINDOW_TYPE_INFO = {
  // Generic containers: N=1..6 rows
  container:       { key: 'minecraft:generic_9x3', slots: 27 + 36 }, // 9x3
  workbench:       { key: 'minecraft:crafting_table', slots: 46 },
  furnace:         { key: 'minecraft:furnace', slots: 39 },
  enchantment:     { key: 'minecraft:enchantment', slots: 38 },
  brewing_stand:   { key: 'minecraft:brewing_stand', slots: 41 },
  anvil:           { key: 'minecraft:anvil', slots: 39 },
  dispenser:       { key: 'minecraft:dispenser', slots: 45 },
  dropper:         { key: 'minecraft:dropper', slots: 45 },
  hopper:          { key: 'minecraft:hopper', slots: 41 },
  cauldron:        { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  minecart_chest:  { key: 'minecraft:generic_9x3', slots: 27 + 36 },
  minecart_hopper: { key: 'minecraft:hopper', slots: 41 },
  horse:           { key: 'EntityHorse', slots: 54 + 36 }, // fallback
  beacon:          { key: 'minecraft:beacon', slots: 37 },
  structure_editor: { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  trading:         { key: 'minecraft:merchant', slots: 39 },
  command_block:   { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  jukebox:         { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  armor:           { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  hand:            { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  compound_creator: { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  element_constructor: { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  material_reducer: { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  lab_table:       { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  loom:            { key: 'minecraft:loom', slots: 40 },
  lectern:         { key: 'minecraft:lectern', slots: 37 },
  grindstone:      { key: 'minecraft:grindstone', slots: 39 },
  blast_furnace:   { key: 'minecraft:blast_furnace', slots: 39 },
  smoker:          { key: 'minecraft:smoker', slots: 39 },
  stonecutter:     { key: 'minecraft:stonecutter', slots: 38 },
  cartography:     { key: 'minecraft:cartography', slots: 39 },
  hud:             { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  jigsaw_editor:   { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  smithing_table:  { key: 'minecraft:smithing', slots: 39 },
  chest_boat:      { key: 'minecraft:generic_9x3', slots: 27 + 36 },
  decorated_pot:   { key: 'minecraft:generic_9x1', slots: 9 + 36 },
  crafter:         { key: 'minecraft:crafter_3x3', slots: 46 },
}

// Map of Bedrock window enum name -> numeric id (reverse of WindowID_)
const WINDOW_ID_TO_NUM = {
  drop_contents: -100,
  beacon: -24,
  trading_output: -23,
  trading_use_inputs: -22,
  trading_input_2: -21,
  trading_input_1: -20,
  enchant_output: -17,
  enchant_material: -16,
  enchant_input: -15,
  anvil_output: -13,
  anvil_result: -12,
  anvil_material: -11,
  container_input: -10,
  crafting_use_ingredient: -5,
  crafting_result: -4,
  crafting_remove_ingredient: -3,
  crafting_add_ingredient: -2,
  none: -1,
  inventory: 0,
  first: 1,
  last: 100,
  offhand: 119,
  armor: 120,
  creative: 121,
  hotbar: 122,
  fixed_inventory: 123,
  ui: 124,
}

function normalizeWindowId (id) {
  if (typeof id === 'string') return WINDOW_ID_TO_NUM[id] ?? id
  return id
}

/**
 * @param {import('../state')} botState
 * @param {object} options
 */
function inject (botState, options) {
  const ItemClass = botState.itemClass
  const Window = botState.windowFactory

  // ------------------------------------------------------------------
  // Window storage
  // ------------------------------------------------------------------
  const windows = new Map()
  botState.windows = windows

  // Main inventory window (windowId = 0)
  const inv = Window.createWindow(0, 'minecraft:inventory', 'Inventory', 36)
  windows.set(0, inv)
  botState.inventory = inv

  // Held item slot index (0‑8, updated by mob_equipment)
  let heldItemSlot = 0
  botState.heldItemSlot = heldItemSlot  // keep in sync

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  let loggedRawItemIdentity = false

  function toItem (raw) {
    if (!raw || raw.network_id === 0) return null
    try {
      const stackId = rawStackId(raw)
      const item = ItemClass.fromNotch(raw, stackId)

      item.stackId = stackId
      item.stack_id = stackId
      item.networkId = raw.network_id
      item.network_id = raw.network_id
      item.blockRuntimeId = raw.block_runtime_id
      item.block_runtime_id = raw.block_runtime_id
      item.raw = raw

      if (stackId == null && !loggedRawItemIdentity) {
        loggedRawItemIdentity = true
        logAction('[inventory]', 'raw item identity fields missing', {
          keys: Object.keys(raw),
          networkId: raw.network_id,
          hasStackId: raw.has_stack_id,
          stack_id: raw.stack_id,
          stackId: raw.stackId,
          stack_network_id: raw.stack_network_id,
          network_stack_id: raw.network_stack_id
        })
      }

      return item
    } catch (e) {
      logAction('[inventory]', 'deserialize error', { networkId: raw.network_id, error: e.message })
      return null
    }
  }

  function getWindow (windowId) {
    const id = normalizeWindowId(windowId)
    return windows.get(id)
  }

  // ------------------------------------------------------------------
  // Utility methods on botState
  // ------------------------------------------------------------------
  Object.defineProperty(botState, 'heldItem', {
    get () {
      const slot = botState.heldItemSlot
      if (slot == null) return null
      return botState.inventory?.slots[slot] ?? null
    },
    enumerable: true,
    configurable: true,
  })

  botState.getItem = function (slot, windowId = 0) {
    const win = getWindow(windowId)
    if (!win) return null
    return win.slots[slot] ?? null
  }

  botState.findItem = function (itemType, metadata, notFull, nbt, windowId = 0) {
    const win = getWindow(windowId)
    if (!win) return null
    return win.findItemRange(win.inventoryStart, win.inventoryEnd, itemType, metadata, notFull, nbt)
  }

  botState.count = function (itemType, metadata, windowId = 0) {
    const win = getWindow(windowId)
    if (!win) return 0
    return win.count(itemType, metadata)
  }

  // ------------------------------------------------------------------
  // Packet handlers
  // ------------------------------------------------------------------

  // ---------- inventory_content ----------
  botState.client.on('inventory_content', (packet) => {
    const windowId = normalizeWindowId(packet.window_id)
    const win = getWindow(windowId)
    if (!win) {
      logAction('[inventory]', 'inventory_content for unknown window', { windowId })
      return
    }
    const slots = packet.input
    if (!Array.isArray(slots)) {
      logAction('[inventory]', 'inventory_content without array', { keys: Object.keys(packet) })
      return
    }
    logAction('[inventory]', `inventory_content: window=${windowId}, ${slots.length} slots`)
    // Resize window if needed (prismarine-windows doesn't support resize; assume correct size)
    for (let i = 0; i < Math.min(slots.length, win.slots.length); i++) {
      const item = toItem(slots[i])
      win.updateSlot(i, item)
    }
  })

  // ---------- inventory_slot ----------
  botState.client.on('inventory_slot', (packet) => {
    const windowId = normalizeWindowId(packet.window_id)
    const win = getWindow(windowId)
    if (!win) {
      logAction('[inventory]', 'inventory_slot for unknown window', { windowId })
      return
    }
    if (packet.slot == null) return
    const item = toItem(packet.item)
    const itemDesc = item ? `${item.name} x${item.count}` : 'empty'
    logAction('[inventory]', `inventory_slot: window=${windowId}, slot=${packet.slot}, item=${itemDesc}`)
    win.updateSlot(packet.slot, item)
  })

  // ---------- mob_equipment ----------
  botState.client.on('mob_equipment', (packet) => {
    if (!sameRuntimeId(packet.runtime_entity_id, selfRuntimeEntityId(botState))) return
    if (typeof packet.slot !== 'number') return
    const item = toItem(packet.item)
    const itemDesc = item ? `${item.name} x${item.count}` : 'empty'
    logAction('[inventory]', `mob_equipment: slot=${packet.slot}, selected=${packet.selected_slot}, item=${itemDesc}`)
    // Update the stored window (window 0)
    const win = windows.get(0)
    if (win) win.updateSlot(packet.slot, item)
    if (typeof packet.selected_slot === 'number') {
      heldItemSlot = packet.selected_slot
      botState.heldItemSlot = heldItemSlot
    }
  })

  // ---------- container_open ----------
  // We'll attach the updateSlot logger after creation.
  botState.client.on('container_open', (packet) => {
    const windowId = normalizeWindowId(packet.window_id)
    const windowTypeName = packet.window_type  // enum string like 'container'
    const info = WINDOW_TYPE_INFO[windowTypeName]
    let win
    if (!info) {
      // Fallback: create generic 9x6 window (54 + 36 slots)
      win = Window.createWindow(windowId, 'minecraft:generic_9x6', `Container ${windowId}`, 54 + 36)
      windows.set(windowId, win)
    } else {
      win = Window.createWindow(windowId, info.key, info.key, info.slots)
      windows.set(windowId, win)
    }
    win.on('updateSlot', (slot, oldItem, newItem) => {
      if (oldItem && !newItem) {
        logAction('[inventory]', `window ${windowId} slot ${slot} cleared (was ${oldItem.name} x${oldItem.count})`)
      } else if (!oldItem && newItem) {
        logAction('[inventory]', `window ${windowId} slot ${slot} gained ${newItem.name} x${newItem.count}`)
      } else if (oldItem && newItem && oldItem.type !== newItem.type) {
        logAction('[inventory]', `window ${windowId} slot ${slot} replaced: ${oldItem.name} x${oldItem.count} → ${newItem.name} x${newItem.count}`)
      } else if (oldItem && newItem && newItem.count !== oldItem.count) {
        logAction('[inventory]', `window ${windowId} slot ${slot} count changed: ${oldItem.count} → ${newItem.count}`)
      }
    })
    logAction('[inventory]', `container_open: id=${windowId}, type=${windowTypeName}, slots=${win.slots.length}`)
  })

  // ---------- container_close ----------
  botState.client.on('container_close', (packet) => {
    const windowId = normalizeWindowId(packet.window_id)
    const win = windows.get(windowId)
    if (win) {
      logAction('[inventory]', `container_close: id=${windowId}`)
      windows.delete(windowId)
    }
  })

  // ---------- log changes for the initial inventory window ----------
  inv.on('updateSlot', (slot, oldItem, newItem) => {
    if (oldItem && !newItem) {
      logAction('[inventory]', `inv slot ${slot} cleared (was ${oldItem.name} x${oldItem.count})`)
    } else if (!oldItem && newItem) {
      logAction('[inventory]', `inv slot ${slot} gained ${newItem.name} x${newItem.count}`)
    } else if (oldItem && newItem && oldItem.type !== newItem.type) {
      logAction('[inventory]', `inv slot ${slot} replaced: ${oldItem.name} x${oldItem.count} → ${newItem.name} x${newItem.count}`)
    } else if (oldItem && newItem && newItem.count !== oldItem.count) {
      logAction('[inventory]', `inv slot ${slot} count changed: ${oldItem.count} → ${newItem.count}`)
    }
  })
}

module.exports = inject
