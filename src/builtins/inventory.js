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

const { logAction, rawStackId, sameRuntimeId, selfRuntimeEntityId } = require('../utils')
const { normalizeWindowId, windowInfoFor } = require('../container-metadata')

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
    if (windowId !== 0 && slots.length > win.inventoryStart) {
      win.inventoryStart = slots.length
      win.inventoryEnd = slots.length + 36
      win.hotbarStart = win.inventoryEnd - 9
      win.slots.length = win.inventoryEnd
      for (let i = 0; i < win.slots.length; i++) {
        if (win.slots[i] === undefined) win.slots[i] = null
      }
      logAction('[inventory]', 'resized container window from content', {
        windowId,
        containerSlots: slots.length,
        totalSlots: win.slots.length
      })
    }
    logAction('[inventory]', `inventory_content: window=${windowId}, ${slots.length} slots`)
    // Resize window if needed (prismarine-windows doesn't support resize; assume correct size)
    for (let i = 0; i < Math.min(slots.length, win.slots.length); i++) {
      const item = toItem(slots[i])
      win.updateSlot(i, item)
    }
    win.lastContentAt = Date.now()
    botState.emit('inventory_content_updated', windowId, win)
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
    const info = windowInfoFor(windowTypeName)
    const title = info.fallback ? `Container ${windowId}` : info.key
    const win = Window.createWindow(windowId, info.key, title, info.containerSlots)
    windows.set(windowId, win)
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
