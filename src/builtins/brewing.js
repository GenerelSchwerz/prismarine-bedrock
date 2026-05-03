// builtins/brewing.js
// Auto-loaded by BotState._loadBuiltins().
// Provides a wrapper around the brewing stand window.
//
// Slot layout (assumed – verify against your server):
//   0 = input potion
//   1 = fuel (blaze powder)
//   2 = ingredient (e.g. nether wart)
//   3 = result (brewed potion)
//
// No recipe data is stored – the wrapper only moves items in/out.
// Methods are async so that the caller can await inventory updates
// (a tick is yielded after each packet).

const { logAction } = require('../utils');

// --------------------------------------------------------------------------
// Plugin inject
// --------------------------------------------------------------------------
module.exports = (botState, options) => {
  const client = botState.client;

  // Brewing stand state
  let activeWindow = null;         // prismarine-window Window instance
  let brewState = {               // last known ContainerSetData values
    time: 0,
    fuelAmount: 0,
    fuelTotal: 0,
  };

  const noWindowErr = () => new Error('No brewing stand window is open');

  // ------------------------------------------------------------------
  // Helper: send an inventory_slot and yield one tick
  // ------------------------------------------------------------------
  function sendSlot (windowId, slotIndex, item) {
    return new Promise(resolve => {
      client.queue('inventory_slot', {
        window_id: windowId,
        slot: slotIndex,
        item: item || null,       // null clears the slot
      });
      setImmediate(resolve);
    });
  }

  // ------------------------------------------------------------------
  // Helper: build a bedrock protocol Item union
  // ------------------------------------------------------------------
  function toBedrockItem (prismarineItem) {
    if (!prismarineItem) return null;
    // prismarine-item stores .type (numeric id), .count, .metadata (damage/variant)
    return {
      network_id: prismarineItem.type,
      count: prismarineItem.count,
      metadata: prismarineItem.metadata ?? 0,
      // stack_id is not strictly required for simple transfers
      stack_id: 0,
    };
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------
  const brewing = {};

  /** Place an item into the fuel slot (slot 1). Resolves once the packet is sent. */
  brewing.putFuel = function (item) {
    if (!activeWindow) return Promise.reject(noWindowErr());
    const raw = toBedrockItem(item);
    logAction('[brew]', 'putFuel', { name: item?.name, count: item?.count });
    return sendSlot(activeWindow.windowId, 1, raw);
  };

  /** Place an item into the input potion slot (slot 0). */
  brewing.putInput = function (item) {
    if (!activeWindow) return Promise.reject(noWindowErr());
    const raw = toBedrockItem(item);
    logAction('[brew]', 'putInput', { name: item?.name, count: item?.count });
    return sendSlot(activeWindow.windowId, 0, raw);
  };

  /** Place an item into the ingredient slot (slot 2). */
  brewing.putIngredient = function (item) {
    if (!activeWindow) return Promise.reject(noWindowErr());
    const raw = toBedrockItem(item);
    logAction('[brew]', 'putIngredient', { name: item?.name, count: item?.count });
    return sendSlot(activeWindow.windowId, 2, raw);
  };

  /**
   * Take the result from slot 3 (if any) and move it into the player's inventory.
   * Returns the prismarine-item that was taken, or null if the slot was empty.
   */
  brewing.takeResult = async function () {
    if (!activeWindow) throw noWindowErr();
    const slot3 = activeWindow.slots[3];
    if (!slot3) {
      logAction('[brew]', 'takeResult – slot empty');
      return null;
    }
    // Pick up the result into cursor (slot 3 -> empty)
    await sendSlot(activeWindow.windowId, 3, null);
    // Find an empty slot in the player's main inventory
    const inv = botState.inventory;
    let targetSlot = null;
    if (inv) {
      for (let i = inv.inventoryStart; i <= inv.inventoryEnd; i++) {
        if (inv.slots[i] == null) { targetSlot = i; break; }
      }
    }
    if (targetSlot == null) {
      logAction('[brew]', 'takeResult – no empty inventory slot, item lost?');
      return null;
    }
    // Place the result into the inventory
    await sendSlot(0, targetSlot, toBedrockItem(slot3));
    logAction('[brew]', 'takeResult', { name: slot3.name, count: slot3.count });
    return slot3;
  };

  /**
   * Wait until the brewing stand finishes (brew_time drops to 0) or timeout.
   * Returns the final brewState snapshot.
   */
  brewing.waitForBrew = function (timeout = 60000) {
    return new Promise((resolve, reject) => {
      if (!activeWindow) return reject(noWindowErr());
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (brewState.time <= 0) {
          clearInterval(interval);
          resolve({ ...brewState });
        } else if (Date.now() - startTime >= timeout) {
          clearInterval(interval);
          reject(new Error('Brew wait timeout'));
        }
      }, 200);
      // Also listen for the final container_set_data that sets time to 0
      const handler = () => {
        if (brewState.time <= 0) {
          clearInterval(interval);
          client.removeListener('container_set_data', handler);
          resolve({ ...brewState });
        }
      };
      client.on('container_set_data', handler);
    });
  };

  /** Current brew state snapshot. */
  Object.defineProperty(brewing, 'state', {
    get: () => ({ ...brewState }),
    enumerable: true,
  });

  // Attach to botState
  botState.brewing = brewing;

  // ------------------------------------------------------------------
  // Packet handlers
  // ------------------------------------------------------------------

  // container_open – identify brewing stand windows
  client.on('container_open', (packet) => {
    if (packet.window_type !== 'brewing_stand') return;
    const windowId = typeof packet.window_id === 'string'
      ? parseInt(packet.window_id) // just in case
      : packet.window_id;
    // The window should already exist in botState.windows (created by inventory.js)
    const win = botState.windows.get(windowId);
    if (!win) {
      logAction('[brew]', 'container_open but window not in botState.windows', { windowId });
      return;
    }
    activeWindow = win;
    logAction('[brew]', 'brewing stand opened', { windowId });
  });

  // container_close – clear active window
  client.on('container_close', (packet) => {
    if (!activeWindow) return;
    if (packet.window_id === activeWindow.windowId) {
      activeWindow = null;
      brewState = { time: 0, fuelAmount: 0, fuelTotal: 0 };
      logAction('[brew]', 'brewing stand closed');
    }
  });

  // container_set_data – track brew progress
  client.on('container_set_data', (packet) => {
    if (!activeWindow || packet.window_id !== activeWindow.windowId) return;
    const key = packet.property;
    const value = packet.value;
    if (key === 0) brewState.time = value;
    else if (key === 1) brewState.fuelAmount = value;
    else if (key === 2) brewState.fuelTotal = value;
  });

  logAction('[brew]', 'brewing plugin loaded');
};