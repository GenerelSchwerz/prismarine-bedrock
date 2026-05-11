const assert = require("assert");
const BotState = require("../src/state");

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = "OpBot";
const OFFLINE = process.env.OFFLINE !== "false";
const VERSION = process.env.MC_VERSION || "1.21.130";

const SETUP_DELAY_MS = Number(process.env.SETUP_DELAY_MS || 500);
const AFTER_ACTION_DELAY_MS = Number(process.env.AFTER_ACTION_DELAY_MS || 1000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForSpawn(botState, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for spawn")), timeoutMs);

    botState.client.once("spawn", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function setupInventory(botState) {
//   const listener = (packet) => {
//     console.log("[command text response]", packet);
//   };

//   botState.client.on("text", listener);

  botState.command(`clear .${USERNAME}`);
  await sleep(SETUP_DELAY_MS);

  botState.command(`give .${USERNAME} minecraft:diamond 3`);
  botState.command(`give .${USERNAME} minecraft:stick 5`);
  botState.command(`give .${USERNAME} minecraft:dirt 7`);
  await sleep(SETUP_DELAY_MS);

//   botState.client.off("text", listener);
}

function itemAt(botState, slot) {
  return botState.inventory.slots[slot];
}

function findSlotByName(botState, name) {
  const slot = botState.inventory.slots.findIndex((item) => item?.name === name);
  assert.notStrictEqual(slot, -1, `Could not find ${name} in inventory`);
  return slot;
}

function emptySlots(botState) {
  return botState.inventory.slots
    .map((item, slot) => (item == null ? slot : -1))
    .filter((slot) => slot !== -1);
}

function firstEmptySlot(botState) {
  const slot = emptySlots(botState)[0];
  assert.notStrictEqual(slot, undefined, "Could not find empty inventory slot");
  return slot;
}

function assertSlot(botState, slot, expectedName, expectedCount) {
  const item = itemAt(botState, slot);

  if (expectedName === null) {
    assert.strictEqual(item, null, `slot ${slot} expected empty, got ${item?.name} x${item?.count}`);
    return;
  }

  assert(item, `slot ${slot} expected ${expectedName} x${expectedCount}, got empty`);
  assert.strictEqual(item.name, expectedName, `slot ${slot} wrong item`);
  assert.strictEqual(item.count, expectedCount, `slot ${slot} wrong count`);
}

function snapshotNonEmpty(botState) {
  return botState.inventory.slots
    .map((item, slot) => item ? { slot, name: item.name, count: item.count, stack_id: item.stack_id } : null)
    .filter(Boolean);
}

function logInventory(botState, label) {
  console.log(`\n${label}`);
  console.table(snapshotNonEmpty(botState));
}

async function assertActionProducesPackets(botState, actionName, fn) {
  const seen = {
    authInputWithRequest: false,
    responses: [],
    inventorySlots: [],
    inventoryContent: 0
  };

  function onAuthInput(packet) {
    if (packet.item_stack_request) {
      seen.authInputWithRequest = true;
      console.log("[test] outbound player_auth_input item_stack_request", {
        request_id: packet.item_stack_request.request_id,
        actions: packet.item_stack_request.actions?.map((action) => action.type_id)
      });
    }
  }

  function onResponse(packet) {
    seen.responses.push(packet);
    console.log("[test] inbound item_stack_response", packet);
  }

  function onInventorySlot(packet) {
    if (packet.window_id === 0 || packet.window_id === "inventory") {
      seen.inventorySlots.push(packet.slot);
      console.log("[test] inbound inventory_slot", {
        slot: packet.slot,
        item: packet.item
      });
    }
  }

  function onInventoryContent(packet) {
    if (packet.window_id === 0 || packet.window_id === "inventory") {
      seen.inventoryContent++;
      console.log("[test] inbound inventory_content", {
        slots: packet.input?.length
      });
    }
  }

  botState.client.on("player_auth_input", onAuthInput);
  botState.client.on("item_stack_response", onResponse);
  botState.client.on("inventory_slot", onInventorySlot);
  botState.client.on("inventory_content", onInventoryContent);

  try {
    const result = await fn();
    await sleep(AFTER_ACTION_DELAY_MS);

    assert.strictEqual(
      seen.authInputWithRequest,
      true,
      `${actionName} did not send a player_auth_input with item_stack_request`
    );

    assert(
      seen.responses.length > 0,
      `${actionName} did not receive item_stack_response`
    );

    assert(
      seen.inventorySlots.length > 0 || seen.inventoryContent > 0,
      `${actionName} did not receive inventory_slot or inventory_content update`
    );

    return result;
  } finally {
    botState.client.off("player_auth_input", onAuthInput);
    botState.client.off("item_stack_response", onResponse);
    botState.client.off("inventory_slot", onInventorySlot);
    botState.client.off("inventory_content", onInventoryContent);
  }
}

describe("real inventory actions", function () {
  this.timeout(180000);

  let botState;

  before(async function () {
    botState = new BotState({
      host: HOST,
      port: PORT,
      username: USERNAME,
      offline: OFFLINE,
      version: VERSION,
    });

    botState.start();

    await waitForSpawn(botState);

    botState.setInventoryActionResponseTimeout?.(10000);
    botState.setInventoryActionUpdateTimeout?.(10000);
  });

  beforeEach(async function () {
    await setupInventory(botState);
    logInventory(botState, "Inventory reset");
  });

  after(function () {
    if (botState?.client) {
      botState.disconnect("Inventory actions mocha test complete");
    }
  });

  it("swaps two occupied inventory slots using item_stack_request", async function () {
    const diamondSlot = findSlotByName(botState, "diamond");
    const stickSlot = findSlotByName(botState, "stick");

    await assertActionProducesPackets(botState, "swapInventorySlots", () => {
      return botState.swapInventorySlots(diamondSlot, stickSlot);
    });

    assertSlot(botState, diamondSlot, "stick", 5);
    assertSlot(botState, stickSlot, "diamond", 3);
  });

  it("moves an occupied slot into an empty slot using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "moveInventorySlot", () => {
      return botState.moveInventorySlot(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, null, 0);
    assertSlot(botState, emptySlot, "dirt", 7);
  });

  it("swaps an occupied slot with an empty slot using item_stack_request", async function () {
    const diamondSlot = findSlotByName(botState, "diamond");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "swapInventorySlots occupied-empty", () => {
      return botState.swapInventorySlots(diamondSlot, emptySlot);
    });

    assertSlot(botState, diamondSlot, null, 0);
    assertSlot(botState, emptySlot, "diamond", 3);
  });

  it("splits a stack into an empty slot using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "splitInventorySlot", () => {
      return botState.splitInventorySlot(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 3);
    assertSlot(botState, emptySlot, "dirt", 4);
  });

  it("merges compatible stacks using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "splitInventorySlot before merge", () => {
      return botState.splitInventorySlot(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 3);
    assertSlot(botState, emptySlot, "dirt", 4);

    await assertActionProducesPackets(botState, "mergeInventorySlots", () => {
      return botState.mergeInventorySlots(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, null, 0);
    assertSlot(botState, emptySlot, "dirt", 7);
  });

  it("moves one item from a stack into an empty slot using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "moveOneInventoryItem to empty", () => {
      return botState.moveOneInventoryItem(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 6);
    assertSlot(botState, emptySlot, "dirt", 1);
  });

  it("moves one item onto a compatible stack using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");
    const emptySlot = firstEmptySlot(botState);

    await assertActionProducesPackets(botState, "splitInventorySlot before moveOne", () => {
      return botState.splitInventorySlot(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 3);
    assertSlot(botState, emptySlot, "dirt", 4);

    await assertActionProducesPackets(botState, "moveOneInventoryItem compatible", () => {
      return botState.moveOneInventoryItem(dirtSlot, emptySlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 2);
    assertSlot(botState, emptySlot, "dirt", 5);
  });

  it("drops one item from a stack using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");

    await assertActionProducesPackets(botState, "dropOneInventoryItem", () => {
      return botState.dropOneInventoryItem(dirtSlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 6);
  });

  it("drops an entire slot using item_stack_request", async function () {
    const stickSlot = findSlotByName(botState, "stick");

    await assertActionProducesPackets(botState, "dropInventorySlot", () => {
      return botState.dropInventorySlot(stickSlot);
    });

    assertSlot(botState, stickSlot, null, 0);
  });

  it("destroys one item from a stack using item_stack_request", async function () {
    const dirtSlot = findSlotByName(botState, "dirt");

    await assertActionProducesPackets(botState, "destroyOneInventoryItem", () => {
      return botState.destroyOneInventoryItem(dirtSlot);
    });

    assertSlot(botState, dirtSlot, "dirt", 6);
  });

  it("destroys an entire slot using item_stack_request", async function () {
    const diamondSlot = findSlotByName(botState, "diamond");

    await assertActionProducesPackets(botState, "destroyInventorySlot", () => {
      return botState.destroyInventorySlot(diamondSlot);
    });

    assertSlot(botState, diamondSlot, null, 0);
  });
});