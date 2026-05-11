const assert = require("assert");
const BotState = require("../src/state");

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = "OpBot";
const OFFLINE = process.env.OFFLINE !== "false";
const VERSION = process.env.MC_VERSION || "1.21.130";

const SETUP_DELAY_MS = Number(process.env.SETUP_DELAY_MS || 1000);

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
  const listener = (packet) => {
    console.log("[command text response]", packet);
  };

  botState.client.on("text", listener);

  botState.command(`clear .${USERNAME}`);
  await sleep(SETUP_DELAY_MS);

  botState.command(`give .${USERNAME} minecraft:diamond 3`);
  await sleep(SETUP_DELAY_MS);

  botState.command(`give .${USERNAME} minecraft:stick 5`);
  await sleep(SETUP_DELAY_MS);

  botState.command(`give .${USERNAME} minecraft:dirt 7`);
  await sleep(SETUP_DELAY_MS);

  botState.client.off("text", listener);
}

function cloneItem(item) {
  if (!item) return null;

  const cloned = Object.create(Object.getPrototypeOf(item));
  Object.assign(cloned, item);
  return cloned;
}

function cloneSlots(slots) {
  return slots.map(cloneItem);
}

function findSlotByName(botState, name) {
  const slot = botState.inventory.slots.findIndex((item) => item?.name === name);
  assert.notStrictEqual(slot, -1, `Could not find ${name} in inventory`);
  return slot;
}

function firstEmptySlot(botState) {
  const slot = botState.inventory.slots.findIndex((item) => item == null);
  assert.notStrictEqual(slot, -1, "Could not find empty inventory slot");
  return slot;
}

function assertSlot(slots, slot, expectedName, expectedCount) {
  const item = slots[slot];

  if (expectedName === null) {
    assert.strictEqual(item, null, `slot ${slot} expected empty, got ${item?.name} x${item?.count}`);
    return;
  }

  assert(item, `slot ${slot} expected ${expectedName} x${expectedCount}, got empty`);
  assert.strictEqual(item.name, expectedName, `slot ${slot} wrong item`);
  assert.strictEqual(item.count, expectedCount, `slot ${slot} wrong count`);
}

function simulateSwap(slots, slotA, slotB) {
  const next = cloneSlots(slots);
  const tmp = next[slotA];

  next[slotA] = next[slotB];
  next[slotB] = tmp;

  return next;
}

function simulateMoveIntoEmpty(slots, fromSlot, toSlot) {
  const next = cloneSlots(slots);

  assert(next[fromSlot], `fromSlot ${fromSlot} is empty`);
  assert.strictEqual(next[toSlot], null, `toSlot ${toSlot} is not empty`);

  next[toSlot] = next[fromSlot];
  next[fromSlot] = null;

  return next;
}

function simulateStackMerge(slots, fromSlot, toSlot, maxStackSize = 64) {
  const next = cloneSlots(slots);

  const from = next[fromSlot];
  const to = next[toSlot];

  assert(from, `fromSlot ${fromSlot} is empty`);
  assert(to, `toSlot ${toSlot} is empty`);
  assert.strictEqual(from.name, to.name, "cannot merge different item names");

  const room = maxStackSize - to.count;
  const moved = Math.min(room, from.count);

  to.count += moved;
  from.count -= moved;

  if (from.count === 0) next[fromSlot] = null;

  return next;
}

describe("inventory swap simulation", function () {
  this.timeout(60000);

  let botState;
  let originalSlots;
  let diamondSlot;
  let stickSlot;
  let dirtSlot;
  let emptySlot;

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
    await setupInventory(botState);

    diamondSlot = findSlotByName(botState, "diamond");
    stickSlot = findSlotByName(botState, "stick");
    dirtSlot = findSlotByName(botState, "dirt");
    emptySlot = firstEmptySlot(botState);

    originalSlots = cloneSlots(botState.inventory.slots);
  });

  after(function () {
    if (botState?.client) {
      botState.disconnect("Inventory swap simulation mocha test complete");
    }
  });

  it("sets up deterministic inventory using OpBot commands", function () {
    assertSlot(originalSlots, diamondSlot, "diamond", 3);
    assertSlot(originalSlots, stickSlot, "stick", 5);
    assertSlot(originalSlots, dirtSlot, "dirt", 7);
    assertSlot(originalSlots, emptySlot, null, 0);
  });

  it("simulates swapping two occupied slots", function () {
    const swapped = simulateSwap(originalSlots, diamondSlot, stickSlot);

    assertSlot(swapped, diamondSlot, "stick", 5);
    assertSlot(swapped, stickSlot, "diamond", 3);
    assertSlot(swapped, dirtSlot, "dirt", 7);
  });

  it("simulates moving an item into an empty slot", function () {
    const moved = simulateMoveIntoEmpty(originalSlots, dirtSlot, emptySlot);

    assertSlot(moved, dirtSlot, null, 0);
    assertSlot(moved, emptySlot, "dirt", 7);
  });

  it("simulates merging compatible stacks", function () {
    const slots = cloneSlots(originalSlots);

    slots[emptySlot] = cloneItem(slots[diamondSlot]);
    slots[emptySlot].count = 10;

    const merged = simulateStackMerge(slots, diamondSlot, emptySlot);

    assertSlot(merged, diamondSlot, null, 0);
    assertSlot(merged, emptySlot, "diamond", 13);
  });

  it("simulates partial merge into a nearly full stack", function () {
    const slots = cloneSlots(originalSlots);

    slots[emptySlot] = cloneItem(slots[diamondSlot]);
    slots[emptySlot].count = 63;

    const merged = simulateStackMerge(slots, diamondSlot, emptySlot);

    assertSlot(merged, diamondSlot, "diamond", 2);
    assertSlot(merged, emptySlot, "diamond", 64);
  });

  it("simulates swapping occupied slot with empty slot", function () {
    const swapped = simulateSwap(originalSlots, diamondSlot, emptySlot);

    assertSlot(swapped, diamondSlot, null, 0);
    assertSlot(swapped, emptySlot, "diamond", 3);
  });
});
