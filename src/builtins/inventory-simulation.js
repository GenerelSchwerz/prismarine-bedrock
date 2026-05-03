'use strict'

const { EventEmitter } = require('events')

// ------------------------------------------------------------------
// Helper: ItemStack abstraction over prismarine-item objects
// ------------------------------------------------------------------
function isPresent (item) { return item !== null && item.count > 0 }
function isAir (item) { return !item || item.type === -1 || item.count <= 0 }
function stackable (item) { return item && item.count < 64 } // vanilla max stack 64
function count (item) { return item ? item.count : 0 }
function kind (item) { return item ? item.type : -1 }

// ------------------------------------------------------------------
// Click types (mirrors azalea-buf AzBuf enum)
// ------------------------------------------------------------------
const ClickType = {
  Pickup:     0,
  QuickMove:  1,
  Swap:       2,
  Clone:      3,
  Throw:      4,
  QuickCraft: 5,
  PickupAll:  6
}

// ------------------------------------------------------------------
// Button numbers per operation (derived from Azalea's button_num())
// ------------------------------------------------------------------
function buttonNum (operation) {
  switch (operation.type) {
    case 'Pickup':
      return operation.mode === 'left' ? 0 : 1
    case 'QuickMove':
      return operation.button === 0 ? 0 : 1
    case 'Swap':
      return operation.targetSlot  // 0-8 for hotbar, 40 for offhand, etc.
    case 'Clone':
      return 2
    case 'Throw':
      return operation.all ? 1 : 0
    case 'QuickCraft': {
      const kind = operation.kind  // 'left', 'right', 'middle'
      const status = operation.status  // 'start', 'add', 'end'
      const map = {
        left:   { start: 0, add: 1, end: 2 },
        right:  { start: 4, add: 5, end: 6 },
        middle: { start: 8, add: 9, end: 10 }
      }
      return map[kind][status]
    }
    case 'PickupAll':
      return 0
    default:
      return 0
  }
}

// ------------------------------------------------------------------
// Container window type -> Azalea MenuLocation mapping
// ------------------------------------------------------------------
function menuLocationForWindow (window) {
  const type = window.type  // e.g. 'minecraft:furnace'
  // We match against the known types used in prismarine-windows
  // and the Bedrock-to-Azalea mapping.
  switch (type) {
    case 'minecraft:inventory':
      return 'Player'
    case 'minecraft:generic_9x1':
      return 'Generic9x1'
    case 'minecraft:generic_9x2':
      return 'Generic9x2'
    case 'minecraft:generic_9x3':
      return 'Generic9x3'
    case 'minecraft:generic_9x4':
      return 'Generic9x4'
    case 'minecraft:generic_9x5':
      return 'Generic9x5'
    case 'minecraft:generic_9x6':
      return 'Generic9x6'
    case 'minecraft:crafting_table':
      return 'Crafting'
    case 'minecraft:furnace':
      return 'Furnace'
    case 'minecraft:blast_furnace':
      return 'BlastFurnace'
    case 'minecraft:smoker':
      return 'Smoker'
    case 'minecraft:brewing_stand':
      return 'BrewingStand'
    case 'minecraft:enchantment':
      return 'Enchantment'
    case 'minecraft:anvil':
      return 'Anvil'
    case 'minecraft:grindstone':
      return 'Grindstone'
    case 'minecraft:cartography':
      return 'CartographyTable'
    case 'minecraft:smithing':
      return 'Smithing'
    case 'minecraft:stonecutter':
      return 'Stonecutter'
    case 'minecraft:loom':
      return 'Loom'
    case 'minecraft:hopper':
      return 'Hopper'
    case 'minecraft:beacon':
      return 'Beacon'
    case 'minecraft:dispenser':
    case 'minecraft:dropper':
      return 'Generic9x3' // 3x3 grid + inventory
    case 'minecraft:crafter_3x3':
      return 'Crafter3x3'
    case 'minecraft:lectern':
      return 'Lectern'
    case 'minecraft:merchant':
      return 'Merchant'
    case 'EntityHorse':
      return 'Generic9x6' // fallback
    default:
      return 'Generic9x6' // safest fallback
  }
}

// ------------------------------------------------------------------
// Slot range helpers (based on azalea-inventory macros)
// ------------------------------------------------------------------
function playerSlotsRange () {
  // player inventory is always last 36 slots (9 hotbar + 27 main)
  // plus the crafting/armor/offhand slots in the Player menu.
  // For a generic container, the window has those 36 slots at the end.
  // prismarine-windows defines inventoryStart, inventoryEnd for the player part.
  // We'll rely on those if present, otherwise fallback.
}

function hotbarSlotsRange (window) {
  const start = window.inventoryStart
  const end = window.inventoryEnd
  // hotbar is the last 9 slots of player inventory
  return { start: end - 8, end }
}

function inventoryWithoutHotbarRange (window) {
  const start = window.inventoryStart
  const end = window.inventoryEnd
  return { start, end: end - 9 }
}

// ------------------------------------------------------------------
// Main simulation function
// ------------------------------------------------------------------

/**
 * Simulate a click operation on a prismarine-windows Window object.
 *
 * @param {object} window - A window instance (e.g. from prismarine-windows)
 * @param {object} operation - Click operation descriptor {@see ClickOperation}
 * @param {object|null} carriedItem - The item currently on cursor, or null
 * @param {boolean} isCreative - Whether the player is in creative mode
 * @returns {{ updatedSlots: Array<{slot:number, newItem:object|null}>, newCarriedItem: object|null, changedSlots: object }}
 */
function simulateClick (window, operation, carriedItem, isCreative) {
  let carried = carriedItem ? { ...carriedItem } : null
  const changedSlots = {}  // slot index -> new item (null means empty)
  const updatedSlots = []

  function updateSlot (slot, newItem) {
    const oldItem = window.slots[slot]
    window.updateSlot(slot, newItem)
    changedSlots[slot] = newItem
    updatedSlots.push({ slot, oldItem, newItem })
  }

  // Helper: try to move item from sourceSlot to targetSlot
  function tryMoveItem (sourceSlot, targetSlot) {
    const sourceItem = window.slots[sourceSlot]
    const targetItem = window.slots[targetSlot]
    if (!isPresent(sourceItem)) return false
    // If target has same item and is stackable
    if (isPresent(targetItem) && sourceItem.type === targetItem.type && sourceItem.metadata === targetItem.metadata &&
        stackable(targetItem)) {
      const space = 64 - targetItem.count
      const moveCount = Math.min(sourceItem.count, space)
      if (moveCount <= 0) return false
      sourceItem.count -= moveCount
      targetItem.count += moveCount
      updateSlot(targetSlot, targetItem)
      if (sourceItem.count <= 0) {
        updateSlot(sourceSlot, null)
      } else {
        updateSlot(sourceSlot, sourceItem)
      }
      return true
    }
    // If target is empty
    if (!isPresent(targetItem)) {
      // Move entire stack
      updateSlot(targetSlot, sourceItem)
      updateSlot(sourceSlot, null)
      return true
    }
    return false
  }

  // Helper: try to stack with existing or fill empty
  function tryMoveToSlots (sourceSlot, slotRange) {
    let sourceItem = window.slots[sourceSlot]
    if (!isPresent(sourceItem)) return
    // try stacking with existing items first
    for (let i = slotRange.start; i <= slotRange.end; i++) {
      if (i === sourceSlot) continue
      const target = window.slots[i]
      if (isPresent(target) && target.type === sourceItem.type && target.metadata === sourceItem.metadata &&
          stackable(target)) {
        const space = 64 - target.count
        if (space <= 0) continue
        const moveCount = Math.min(sourceItem.count, space)
        sourceItem.count -= moveCount
        target.count += moveCount
        updateSlot(i, target)
        if (sourceItem.count <= 0) {
          updateSlot(sourceSlot, null)
          sourceItem = null
          break
        } else {
          updateSlot(sourceSlot, sourceItem)
        }
      }
    }
    if (!sourceItem) return
    // then try empty slots
    for (let i = slotRange.start; i <= slotRange.end; i++) {
      if (i === sourceSlot) continue
      const target = window.slots[i]
      if (!isPresent(target)) {
        updateSlot(i, sourceItem)
        updateSlot(sourceSlot, null)
        sourceItem = null
        break
      }
    }
  }

  // Helper: try move item to slots, and if that fails, toggle hotbar/inventory
  function tryMoveItemOrToggleHotbar (sourceSlot, containerRange) {
    tryMoveToSlots(sourceSlot, containerRange)
    if (isPresent(window.slots[sourceSlot])) {
      // If source is still present, try the other half (hotbar vs inventory)
      const isHotbar = window.slots[sourceSlot] && hotbarSlotsRange(window).start <= sourceSlot && sourceSlot <= hotbarSlotsRange(window).end
      if (isHotbar) {
        tryMoveToSlots(sourceSlot, inventoryWithoutHotbarRange(window))
      } else {
        tryMoveToSlots(sourceSlot, hotbarSlotsRange(window))
      }
    }
  }

  // ── Execute based on operation type ──
  switch (operation.type) {
    // ---------- PICKUP (left/right click) ----------
    case 'Pickup': {
      const slot = operation.slot
      if (slot === undefined) {
        // drop (outside) – handled below
        if (!carried) break
        if (operation.mode === 'left') {
          // drop entire stack
          // (no slot – dropping on floor; not simulated here)
          carried = null
        } else {
          // drop one item
          carried.count -= 1
          if (carried.count <= 0) carried = null
        }
        break
      }
      const targetItem = window.slots[slot]
      if (carried) {
        if (targetItem) {
          // swap
          if (operation.mode === 'left') {
            // swap entire stacks
            updateSlot(slot, carried)
            carried = targetItem
          } else {
            // right click: distribute one
            if (carried.type === targetItem.type && carried.metadata === targetItem.metadata) {
              // merge one
              targetItem.count += 1
              carried.count -= 1
              updateSlot(slot, targetItem)
              if (carried.count <= 0) carried = null
            } else {
              // swap
              updateSlot(slot, carried)
              carried = targetItem
            }
          }
        } else {
          // empty slot
          if (operation.mode === 'left') {
            updateSlot(slot, carried)
            carried = null
          } else {
            // place one
            const newItem = { ...carried, count: 1 }
            updateSlot(slot, newItem)
            carried.count -= 1
            if (carried.count <= 0) carried = null
          }
        }
      } else {
        // no carried item: pick up
        if (targetItem) {
          if (operation.mode === 'left') {
            // pick up entire stack
            updateSlot(slot, null)
            carried = targetItem
          } else {
            // pick up half (rounding up)
            const half = Math.ceil(targetItem.count / 2)
            const newCarried = { ...targetItem, count: half }
            targetItem.count -= half
            updateSlot(slot, targetItem)
            carried = newCarried
            if (targetItem.count <= 0) updateSlot(slot, null)
          }
        }
      }
      break
    }

    // ---------- QUICK MOVE (shift+click) ----------
    case 'QuickMove': {
      const slot = operation.slot
      if (slot === undefined) break
      // replicate azalea's Menu::quick_move_stack
      const sourceItem = window.slots[slot]
      if (!isPresent(sourceItem)) break
      const loc = menuLocationForWindow(window)
      // Based on location, move to the appropriate slot range
      switch (loc) {
        case 'Player':
          // shift-clicking in player inventory behaves like vanilla
          // It's complex: depends on which region was clicked.
          // For simplicity, we'll treat main inventory slots -> hotbar, hotbar slots -> main inventory.
          // This matches Azalea's PlayerMenuLocation::Inventory branch.
          if (window.hotbarStart !== undefined && slot >= window.hotbarStart && slot <= window.hotbarEnd) {
            tryMoveToSlots(slot, inventoryWithoutHotbarRange(window))
          } else if (window.inventoryStart !== undefined && slot >= window.inventoryStart && slot <= window.inventoryEnd) {
            tryMoveToSlots(slot, hotbarSlotsRange(window))
          } else {
            // armor, crafting, etc. – move to inventory
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          }
          break
        case 'Furnace':
        case 'BlastFurnace':
        case 'Smoker': {
          // Input, fuel, result slots are 0,1,2 in furnace containers
          const containerRange = { start: 0, end: 2 }  // ingredient + fuel
          if (slot >= 3) {
            // from player part -> container part
            tryMoveToSlots(slot, containerRange)
          } else {
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          }
          break
        }
        case 'BrewingStand': {
          const bottleSlots = { start: 0, end: 2 }
          const ingredientSlot = 3
          const fuelSlot = 4
          if (slot >= 5) {
            // from player -> bottle or ingredient
            tryMoveToSlots(slot, { start: 0, end: 4 })
          } else {
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          }
          break
        }
        case 'Crafting': {
          const gridSlots = { start: 1, end: 9 }  // result is slot 0, grid 1-9
          if (slot === 0) {
            // result -> inventory
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          } else if (slot >= 1 && slot <= 9) {
            // grid -> player
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          } else {
            // player -> grid
            tryMoveToSlots(slot, gridSlots)
          }
          break
        }
        case 'Anvil': {
          // first slot 0, second slot 1, result 2
          if (slot >= 3) {
            tryMoveToSlots(slot, { start: 0, end: 1 })
          } else {
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          }
          break
        }
        case 'Grindstone':
        case 'CartographyTable':
        case 'Smithing':
        case 'Stonecutter':
        case 'Loom':
        case 'Merchant':
        case 'Lectern':
        case 'Beacon':
        case 'Hopper':
        case 'Dispenser':
        case 'Dropper':
        case 'Crafter3x3':
        case 'Generic9x1':
        case 'Generic9x2':
        case 'Generic9x3':
        case 'Generic9x4':
        case 'Generic9x5':
        case 'Generic9x6':
        default: {
          // generic: if clicked in player inventory, move to container part; else move to player
          const containerStart = 0
          const containerEnd = window.inventoryStart - 1
          if (slot >= window.inventoryStart && slot <= window.inventoryEnd) {
            tryMoveToSlots(slot, { start: containerStart, end: containerEnd })
          } else {
            tryMoveToSlots(slot, { start: window.inventoryStart, end: window.inventoryEnd })
          }
          break
        }
      }
      break
    }

    // ---------- SWAP (number key / F) ----------
    case 'Swap': {
      const sourceSlot = operation.sourceSlot
      const targetSlot = operation.targetSlot  // 0-8 hotbar, 40 offhand, etc.
      const sourceItem = window.slots[sourceSlot]
      const targetItem = window.slots[targetSlot]
      // Swap items
      updateSlot(sourceSlot, targetItem)
      updateSlot(targetSlot, sourceItem)
      break
    }

    // ---------- CLONE (middle click, creative only) ----------
    case 'Clone': {
      if (!isCreative) break
      const slot = operation.slot
      if (slot === undefined) break
      const sourceItem = window.slots[slot]
      if (!sourceItem) break
      // Clone a full stack of the item
      const clonedItem = { ...sourceItem, count: 64 }
      carried = clonedItem
      break
    }

    // ---------- THROW (Q / Ctrl+Q) ----------
    case 'Throw': {
      const slot = operation.slot
      if (slot === undefined) break
      const sourceItem = window.slots[slot]
      if (!sourceItem) break
      if (operation.all) {
        // throw entire stack
        updateSlot(slot, null)
      } else {
        // throw one
        sourceItem.count -= 1
        updateSlot(slot, sourceItem)
        if (sourceItem.count <= 0) updateSlot(slot, null)
      }
      break
    }

    // ---------- QUICK CRAFT (drag) ----------
    case 'QuickCraft': {
      const kind = operation.kind  // 'left', 'right', 'middle'
      const status = operation.status  // 'start', 'add', 'end'
      if (status === 'start') {
        // no immediate slot change; store drag state if needed
        // For simulation, we just ignore start
        break
      } else if (status === 'add') {
        const slot = operation.slot
        if (slot === undefined) break
        const targetItem = window.slots[slot]
        // For left drag: distribute equally
        // For right drag: place one per slot
        // For middle click: same as left but for creative
        // We need to keep track of total count per drag, but for simplicity we just simulate final distribution here.
        // Since prismarine-windows doesn't have drag automation, we'll assume the client does proper distribution.
        // This is a placeholder; a full implementation would require drag state.
        break
      } else if (status === 'end') {
        // Apply distribution
        const dragSlots = operation.slots || []  // client should collect these
        if (!carried) break
        const perSlot = Math.floor(carried.count / dragSlots.length)
        let remainder = carried.count % dragSlots.length
        for (const slot of dragSlots) {
          const amount = perSlot + (remainder > 0 ? 1 : 0)
          remainder--
          const targetItem = window.slots[slot]
          if (targetItem) {
            targetItem.count += amount
            updateSlot(slot, targetItem)
          } else {
            const newItem = { ...carried, count: amount }
            updateSlot(slot, newItem)
          }
        }
        carried = null
      }
      break
    }

    // ---------- PICKUP ALL (double click) ----------
    case 'PickupAll': {
      const slot = operation.slot
      if (slot === undefined) break
      // Double click collects all items of the same type as the carried item or target slot.
      const filterType = carried ? carried.type : (window.slots[slot] ? window.slots[slot].type : null)
      if (filterType === null) break
      let totalCount = 0
      for (let i = 0; i < window.slots.length; i++) {
        const item = window.slots[i]
        if (item && item.type === filterType && item.metadata === (carried ? carried.metadata : 0)) {
          totalCount += item.count
          updateSlot(i, null)
        }
      }
      if (carried) {
        carried.count += totalCount
      } else {
        carried = { type: filterType, count: totalCount, metadata: 0, nbt: null }
      }
      break
    }

    default:
      break
  }

  return { updatedSlots, newCarriedItem: carried, changedSlots }
}

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------
module.exports = {
  simulateClick,
  ClickType,
  buttonNum,
  menuLocationForWindow
}