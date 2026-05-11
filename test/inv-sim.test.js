const assert = require("assert");
const BotState = require("../src/state");

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = "OpBot";
const OFFLINE = process.env.OFFLINE !== "false";
const VERSION = process.env.MC_VERSION || "1.21.130";

const SETUP_DELAY_MS = Number(process.env.SETUP_DELAY_MS || 500);

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

function secondEmptySlot(botState) {
  const slot = emptySlots(botState)[1];
  assert.notStrictEqual(slot, undefined, "Could not find second empty inventory slot");
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

function assertSameSlotState(actual, expected, slot) {
  const a = actual[slot];
  const e = expected[slot];

  assert.strictEqual(a?.name ?? null, e?.name ?? null, `slot ${slot} name changed`);
  assert.strictEqual(a?.count ?? 0, e?.count ?? 0, `slot ${slot} count changed`);
}

function assertSlotsUnchanged(actual, expected) {
  assert.strictEqual(actual.length, expected.length, "slot array length changed");

  for (let i = 0; i < actual.length; i++) {
    assertSameSlotState(actual, expected, i);
  }
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

function simulateSplitHalf(slots, fromSlot, toSlot) {
  const next = cloneSlots(slots);

  const from = next[fromSlot];

  assert(from, `fromSlot ${fromSlot} is empty`);
  assert.strictEqual(next[toSlot], null, `toSlot ${toSlot} is not empty`);

  const moved = Math.ceil(from.count / 2);

  next[toSlot] = cloneItem(from);
  next[toSlot].count = moved;

  from.count -= moved;
  if (from.count === 0) next[fromSlot] = null;

  return next;
}

function simulateMoveOne(slots, fromSlot, toSlot, maxStackSize = 64) {
  const next = cloneSlots(slots);

  const from = next[fromSlot];
  const to = next[toSlot];

  assert(from, `fromSlot ${fromSlot} is empty`);

  if (!to) {
    next[toSlot] = cloneItem(from);
    next[toSlot].count = 1;
    from.count -= 1;
    if (from.count === 0) next[fromSlot] = null;
    return next;
  }

  assert.strictEqual(from.name, to.name, "cannot move one onto different item");
  assert(to.count < maxStackSize, `toSlot ${toSlot} is full`);

  to.count += 1;
  from.count -= 1;

  if (from.count === 0) next[fromSlot] = null;

  return next;
}

function simulateDropSlot(slots, slot) {
  const next = cloneSlots(slots);
  assert(next[slot], `slot ${slot} is empty`);

  next[slot] = null;
  return next;
}

function simulateDropOne(slots, slot) {
  const next = cloneSlots(slots);
  assert(next[slot], `slot ${slot} is empty`);

  next[slot].count -= 1;
  if (next[slot].count === 0) next[slot] = null;

  return next;
}

function setSyntheticStack(slots, slot, sourceItem, count) {
  slots[slot] = cloneItem(sourceItem);
  slots[slot].count = count;
}

describe("inventory simulation", function () {
  this.timeout(60000);

  let botState;
  let originalSlots;
  let diamondSlot;
  let stickSlot;
  let dirtSlot;
  let emptySlot;
  let emptySlot2;

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
    emptySlot2 = secondEmptySlot(botState);

    originalSlots = cloneSlots(botState.inventory.slots);
  });

  after(function () {
    if (botState?.client) {
      botState.disconnect("Inventory simulation mocha test complete");
    }
  });

  describe("server inventory setup", function () {
    it("sets up deterministic inventory using OpBot commands", function () {
      assertSlot(originalSlots, diamondSlot, "diamond", 3);
      assertSlot(originalSlots, stickSlot, "stick", 5);
      assertSlot(originalSlots, dirtSlot, "dirt", 7);
      assertSlot(originalSlots, emptySlot, null, 0);
      assertSlot(originalSlots, emptySlot2, null, 0);
    });

    it("does not mutate the live inventory snapshot during simulation setup", function () {
      assertSlot(botState.inventory.slots, diamondSlot, "diamond", 3);
      assertSlot(botState.inventory.slots, stickSlot, "stick", 5);
      assertSlot(botState.inventory.slots, dirtSlot, "dirt", 7);
    });
  });

  describe("swap simulation", function () {
    it("swaps two occupied slots", function () {
      const swapped = simulateSwap(originalSlots, diamondSlot, stickSlot);

      assertSlot(swapped, diamondSlot, "stick", 5);
      assertSlot(swapped, stickSlot, "diamond", 3);
      assertSlot(swapped, dirtSlot, "dirt", 7);
    });

    it("swaps occupied slot with empty slot", function () {
      const swapped = simulateSwap(originalSlots, diamondSlot, emptySlot);

      assertSlot(swapped, diamondSlot, null, 0);
      assertSlot(swapped, emptySlot, "diamond", 3);
    });

    it("swaps two empty slots as a no-op on contents", function () {
      const swapped = simulateSwap(originalSlots, emptySlot, emptySlot2);

      assertSlot(swapped, emptySlot, null, 0);
      assertSlot(swapped, emptySlot2, null, 0);
    });

    it("swapping a slot with itself is a no-op", function () {
      const swapped = simulateSwap(originalSlots, diamondSlot, diamondSlot);

      assertSlotsUnchanged(swapped, originalSlots);
    });
  });

  describe("move simulation", function () {
    it("moves an item into an empty slot", function () {
      const moved = simulateMoveIntoEmpty(originalSlots, dirtSlot, emptySlot);

      assertSlot(moved, dirtSlot, null, 0);
      assertSlot(moved, emptySlot, "dirt", 7);
    });

    it("throws when moving from an empty slot", function () {
      assert.throws(
        () => simulateMoveIntoEmpty(originalSlots, emptySlot, emptySlot2),
        /fromSlot .* is empty/
      );
    });

    it("throws when moving into an occupied slot", function () {
      assert.throws(
        () => simulateMoveIntoEmpty(originalSlots, dirtSlot, diamondSlot),
        /toSlot .* is not empty/
      );
    });
  });

  describe("stack merge simulation", function () {
    it("merges compatible stacks fully", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, emptySlot, slots[diamondSlot], 10);

      const merged = simulateStackMerge(slots, diamondSlot, emptySlot);

      assertSlot(merged, diamondSlot, null, 0);
      assertSlot(merged, emptySlot, "diamond", 13);
    });

    it("partially merges into a nearly full stack", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, emptySlot, slots[diamondSlot], 63);

      const merged = simulateStackMerge(slots, diamondSlot, emptySlot);

      assertSlot(merged, diamondSlot, "diamond", 2);
      assertSlot(merged, emptySlot, "diamond", 64);
    });

    it("does nothing meaningful when merging into a full stack except preserve source", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, emptySlot, slots[diamondSlot], 64);

      const merged = simulateStackMerge(slots, diamondSlot, emptySlot);

      assertSlot(merged, diamondSlot, "diamond", 3);
      assertSlot(merged, emptySlot, "diamond", 64);
    });

    it("throws when merging incompatible stacks", function () {
      assert.throws(
        () => simulateStackMerge(originalSlots, diamondSlot, stickSlot),
        /cannot merge different item names/
      );
    });

    it("throws when merging from empty slot", function () {
      const slots = cloneSlots(originalSlots);
      setSyntheticStack(slots, emptySlot2, slots[diamondSlot], 10);

      assert.throws(
        () => simulateStackMerge(slots, emptySlot, emptySlot2),
        /fromSlot .* is empty/
      );
    });

    it("throws when merging into empty slot", function () {
      assert.throws(
        () => simulateStackMerge(originalSlots, diamondSlot, emptySlot),
        /toSlot .* is empty/
      );
    });
  });

  describe("right-click style split simulation", function () {
    it("splits an even stack in half", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, diamondSlot, slots[diamondSlot], 10);

      const split = simulateSplitHalf(slots, diamondSlot, emptySlot);

      assertSlot(split, diamondSlot, "diamond", 5);
      assertSlot(split, emptySlot, "diamond", 5);
    });

    it("splits an odd stack with the larger half moved", function () {
      const split = simulateSplitHalf(originalSlots, dirtSlot, emptySlot);

      assertSlot(split, dirtSlot, "dirt", 3);
      assertSlot(split, emptySlot, "dirt", 4);
    });

    it("throws when splitting into an occupied slot", function () {
      assert.throws(
        () => simulateSplitHalf(originalSlots, dirtSlot, diamondSlot),
        /toSlot .* is not empty/
      );
    });

    it("throws when splitting from an empty slot", function () {
      assert.throws(
        () => simulateSplitHalf(originalSlots, emptySlot, emptySlot2),
        /fromSlot .* is empty/
      );
    });
  });

  describe("single-item movement simulation", function () {
    it("moves one item into an empty slot", function () {
      const moved = simulateMoveOne(originalSlots, dirtSlot, emptySlot);

      assertSlot(moved, dirtSlot, "dirt", 6);
      assertSlot(moved, emptySlot, "dirt", 1);
    });

    it("moves one item onto a compatible stack", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, emptySlot, slots[dirtSlot], 10);

      const moved = simulateMoveOne(slots, dirtSlot, emptySlot);

      assertSlot(moved, dirtSlot, "dirt", 6);
      assertSlot(moved, emptySlot, "dirt", 11);
    });

    it("empties the source slot when moving the last item", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, dirtSlot, slots[dirtSlot], 1);

      const moved = simulateMoveOne(slots, dirtSlot, emptySlot);

      assertSlot(moved, dirtSlot, null, 0);
      assertSlot(moved, emptySlot, "dirt", 1);
    });

    it("throws when moving one item onto an incompatible stack", function () {
      assert.throws(
        () => simulateMoveOne(originalSlots, diamondSlot, stickSlot),
        /cannot move one onto different item/
      );
    });

    it("throws when moving one item onto a full compatible stack", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, emptySlot, slots[dirtSlot], 64);

      assert.throws(
        () => simulateMoveOne(slots, dirtSlot, emptySlot),
        /toSlot .* is full/
      );
    });
  });

  describe("drop simulation", function () {
    it("drops an entire slot", function () {
      const dropped = simulateDropSlot(originalSlots, dirtSlot);

      assertSlot(dropped, dirtSlot, null, 0);
    });

    it("drops one item from a stack", function () {
      const dropped = simulateDropOne(originalSlots, dirtSlot);

      assertSlot(dropped, dirtSlot, "dirt", 6);
    });

    it("drops one item and clears the slot when count reaches zero", function () {
      const slots = cloneSlots(originalSlots);

      setSyntheticStack(slots, dirtSlot, slots[dirtSlot], 1);

      const dropped = simulateDropOne(slots, dirtSlot);

      assertSlot(dropped, dirtSlot, null, 0);
    });

    it("throws when dropping an empty slot", function () {
      assert.throws(
        () => simulateDropSlot(originalSlots, emptySlot),
        /slot .* is empty/
      );
    });

    it("throws when dropping one from an empty slot", function () {
      assert.throws(
        () => simulateDropOne(originalSlots, emptySlot),
        /slot .* is empty/
      );
    });
  });

  describe("mutation safety", function () {
    it("does not mutate the original slot array during swap", function () {
      const before = cloneSlots(originalSlots);

      simulateSwap(originalSlots, diamondSlot, stickSlot);

      assertSlotsUnchanged(originalSlots, before);
    });

    it("does not mutate the original slot array during move", function () {
      const before = cloneSlots(originalSlots);

      simulateMoveIntoEmpty(originalSlots, dirtSlot, emptySlot);

      assertSlotsUnchanged(originalSlots, before);
    });

    it("does not mutate the original slot array during merge", function () {
      const slots = cloneSlots(originalSlots);
      const before = cloneSlots(slots);

      setSyntheticStack(slots, emptySlot, slots[diamondSlot], 10);
      before[emptySlot] = cloneItem(slots[emptySlot]);

      simulateStackMerge(slots, diamondSlot, emptySlot);

      assertSlotsUnchanged(slots, before);
    });

    it("does not mutate live bot inventory while simulating", function () {
      simulateSwap(originalSlots, diamondSlot, stickSlot);
      simulateMoveIntoEmpty(originalSlots, dirtSlot, emptySlot);

      assertSlot(botState.inventory.slots, diamondSlot, "diamond", 3);
      assertSlot(botState.inventory.slots, stickSlot, "stick", 5);
      assertSlot(botState.inventory.slots, dirtSlot, "dirt", 7);
    });
  });
});