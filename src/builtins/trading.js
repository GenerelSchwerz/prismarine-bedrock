// src/builtins/trading.js
"use strict";

/**
 * builtins/trading.js
 *
 * Dedicated Bedrock villager trading helpers.
 *
 * Adds:
 *   botState.openTrade(entity, opts?) -> Promise<update_trade packet>
 *   botState.tradeWith(entity, opts?) -> Promise<update_trade packet>
 *   botState.waitForTradeWindow(opts?) -> Promise<update_trade packet>
 *   botState.closeTradeWindow() -> void
 *   botState.currentTradeRecipes() -> array
 *   botState.findTrade(filterOrExpected, opts?) -> recipe | null
 *   botState.executeTrade(tradeOrIndex, count?, opts?) -> Promise<object>
 *
 * Entity interaction is owned by src/builtins/entity-interact.js:
 *   botState.interactEntity(entity, opts)
 *
 * Geyser merchant trading notes:
 *
 * 1. The merchant recipe request must start with craft_recipe_auto or
 *    craft_recipe. Geyser dispatches by request.actions[0].
 *
 * 2. The trade inputs must already be in the merchant input slots before
 *    the recipe/result-take request. Sending one request shaped as:
 *
 *      [craft_recipe_auto, take trade2_result]
 *
 *    selects the trade but does not provide the emeralds.
 *
 * 3. Sending one request shaped as:
 *
 *      [take emerald -> trade2_ingredient1, craft_recipe_auto, take result]
 *
 *    does not hit the merchant recipe path because the first action is take.
 *
 * Therefore executeTrade() uses two requests:
 *
 *   Request 1:
 *     take ingredient(s) from player inventory into trade2_ingredient slot(s)
 *
 *   Request 2:
 *     craft_recipe_auto / craft_recipe first
 *     then take trade2_result into player inventory
 *
 * Important Bedrock/Geyser merchant slot mapping:
 *   Java slot 0 -> TRADE2_INGREDIENT_1, Bedrock slot 4
 *   Java slot 1 -> TRADE2_INGREDIENT_2, Bedrock slot 5
 *   Java slot 2 -> TRADE2_RESULT,       Bedrock slot 50
 *
 * Relevant Geyser file:
 *   https://github.com/GeyserMC/Geyser/blob/master/core/src/main/java/org/geysermc/geyser/translator/inventory/MerchantInventoryTranslator.java
 */

const { logAction, sameRuntimeId, toPlainId, cloneItem } = require("../utils");

module.exports = function tradingPlugin(botState, options = {}) {
  const client = botState.client;

  let tradeTimeoutMs = options.tradeTimeoutMs ?? 10000;
  let lastTradeWindow = null;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function runtimeIdOf(entity) {
    return entity?.runtimeId ?? entity?.runtime_id ?? entity?.runtimeEntityId;
  }

  function assertTradingEntity(entity) {
    const runtimeId = runtimeIdOf(entity);

    if (runtimeId == null) {
      throw new Error("Cannot open trade: target entity has no runtimeId");
    }

    return runtimeId;
  }

  function entityIdCandidates(entity) {
    return [
      entity?.runtimeId,
      entity?.runtime_id,
      entity?.runtimeEntityId,
      entity?.id,
      entity?.entityId,
      entity?.uniqueId,
      entity?.unique_id,
    ].filter((value) => value != null);
  }

  function tradeEntityIdsFromPacket(packet) {
    return [
      packet.trader_runtime_entity_id,
      packet.traderRuntimeEntityId,
      packet.villager_runtime_entity_id,
      packet.villagerRuntimeEntityId,
      packet.trader_unique_entity_id,
      packet.traderUniqueEntityId,
      packet.villager_unique_entity_id,
      packet.villagerUniqueEntityId,
      packet.villager_unique_id,
      packet.villagerUniqueId,
      packet.entity_unique_id,
      packet.entityUniqueId,
    ].filter((value) => value != null);
  }

  function packetMatchesEntity(packet, entity) {
    const packetIds = tradeEntityIdsFromPacket(packet);

    if (packetIds.length === 0) return true;

    const targetIds = entityIdCandidates(entity);
    if (targetIds.length === 0) return true;

    return packetIds.some((packetId) => {
      return targetIds.some((targetId) => {
        if (sameRuntimeId(packetId, targetId)) return true;
        return String(packetId) === String(targetId);
      });
    });
  }

  function waitForPacket(packetName, timeoutMs, predicate = () => true) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for ${String(packetName)}`));
      }, timeoutMs);

      function onPacket(packet) {
        if (!predicate(packet)) return;

        cleanup();
        resolve(packet);
      }

      function cleanup() {
        clearTimeout(timeout);
        client.off(packetName, onPacket);
      }

      client.on(packetName, onPacket);
    });
  }

  function waitForTradeWindow(opts = {}) {
    const target = opts.entity;
    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs;
    const strictEntityMatch = opts.strictEntityMatch === true;

    return waitForPacket("update_trade", timeoutMs, (packet) => {
      if (!target || !strictEntityMatch) return true;
      return packetMatchesEntity(packet, target);
    });
  }

  async function openTrade(entity, opts = {}) {
    const runtimeId = assertTradingEntity(entity);

    if (typeof botState.interactEntity !== "function") {
      throw new Error("Cannot open trade: botState.interactEntity is not available");
    }

    const timeoutMs = opts.timeoutMs ?? tradeTimeoutMs;

    const tradeWindowPromise = waitForTradeWindow({
      entity,
      timeoutMs,
      strictEntityMatch: opts.strictEntityMatch,
    });

    await botState.interactEntity(entity, {
      ...opts,
      mouseOver: opts.mouseOver ?? true,
      mouseOverDelayMs: opts.mouseOverDelayMs ?? 50,
    });

    const packet = await tradeWindowPromise;

    lastTradeWindow = packet;
    botState.currentTradeWindow = packet;
    botState.currentTradingEntity = entity;

    botState.emit("trade_window_open", packet, entity);

    logAction("[trading]", "update_trade received", {
      target: toPlainId(runtimeId),
      keys: Object.keys(packet),
      window_id: packet.window_id,
      window_type: packet.window_type,
      size: packet.size,
      display_name: packet.display_name,
      trade_tier: packet.trade_tier,
      new_trading_ui: packet.new_trading_ui,
      economic_trades: packet.economic_trades,
      offers_len: Array.isArray(packet.offers) ? packet.offers.length : undefined,
    });

    return packet;
  }

  function closeTradeWindow() {
    const packet = lastTradeWindow ?? botState.currentTradeWindow;
    const windowId = packet?.window_id;

    if (windowId != null) {
      client.queue("container_close", {
        window_id: windowId,
        server: false,
      });

      logAction("[trading]", "container_close trade", {
        window_id: windowId,
      });
    }

    lastTradeWindow = null;
    botState.currentTradeWindow = null;
    botState.currentTradingEntity = null;

    botState.emit("trade_window_close");
  }

  function nbtValue(value) {
    if (value == null) return value;

    if (Array.isArray(value)) {
      return value.map(nbtValue);
    }

    if (Buffer.isBuffer(value)) return value;

    if (typeof value !== "object") return value;

    if (
      Object.prototype.hasOwnProperty.call(value, "type") &&
      Object.prototype.hasOwnProperty.call(value, "value")
    ) {
      return nbtValue(value.value);
    }

    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = nbtValue(child);
    }
    return out;
  }

  function normalizeItemId(id) {
    if (id == null) return null;
    const str = String(id);
    return str.startsWith("minecraft:") ? str : `minecraft:${str}`;
  }

  function itemId(item) {
    item = nbtValue(item);

    return normalizeItemId(
      item?.id ??
        item?.name ??
        item?.Name ??
        item?.identifier ??
        item?.network_id ??
        item?.networkId
    );
  }

  function itemCount(item) {
    item = nbtValue(item);
    const count = item?.count ?? item?.Count ?? item?.amount ?? item?.Amount;
    return Number(count ?? 0);
  }

  function recipeInputA(recipe) {
    recipe = nbtValue(recipe);
    return recipe?.buy ?? recipe?.buyA ?? recipe?.input ?? recipe?.inputA ?? recipe?.input_1;
  }

  function recipeInputB(recipe) {
    recipe = nbtValue(recipe);
    return recipe?.buyB ?? recipe?.inputB ?? recipe?.input_2 ?? null;
  }

  function recipeOutput(recipe) {
    recipe = nbtValue(recipe);
    return recipe?.sell ?? recipe?.output ?? recipe?.result;
  }

  function recipeNetId(recipe) {
    recipe = nbtValue(recipe);

    const value =
      recipe?.netId ??
      recipe?.net_id ??
      recipe?.networkId ??
      recipe?.network_id ??
      recipe?.recipeNetId ??
      recipe?.recipe_net_id ??
      recipe?.recipeNetworkId ??
      recipe?.recipe_network_id;

    if (value == null) return null;

    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }

  function isRecipeLike(value) {
    value = nbtValue(value);
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;

    const inputA = recipeInputA(value);
    const output = recipeOutput(value);

    return !!inputA && !!output && !!itemId(inputA) && !!itemId(output);
  }

  function currentTradeRecipes() {
    const packet = botState.currentTradeWindow ?? lastTradeWindow;
    if (!packet) return [];

    if (Array.isArray(packet.offers)) return packet.offers;
    if (Array.isArray(packet.trades)) return packet.trades;
    if (Array.isArray(packet.trade_offers)) return packet.trade_offers;
    if (Array.isArray(packet.tradeOffers)) return packet.tradeOffers;

    const normalized = nbtValue(packet);

    const candidates = [
      normalized?.offers?.Recipes,
      normalized?.offers?.recipes,
      normalized?.trades?.Recipes,
      normalized?.trades?.recipes,
      normalized?.serialized_offers?.Recipes,
      normalized?.serialized_offers?.recipes,
      normalized?.serializedOffers?.Recipes,
      normalized?.serializedOffers?.recipes,
      normalized?.Recipes,
      normalized?.recipes,
      normalized?.offers,
      normalized?.trades,
      normalized?.trade_offers,
      normalized?.tradeOffers,
    ];

    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) continue;

      const recipes = candidate.map(nbtValue).filter(isRecipeLike);
      if (recipes.length > 0) return recipes;
    }

    return [];
  }

  function setCurrentTradeWindow(packet, entity = botState.currentTradingEntity) {
    lastTradeWindow = packet;
    botState.currentTradeWindow = packet;

    if (entity) {
      botState.currentTradingEntity = entity;
    }

    botState.emit("trade_window_update", packet, entity);
  }

  function summarizeRecipe(recipe, index = null) {
    const inputA = recipeInputA(recipe);
    const inputB = recipeInputB(recipe);
    const output = recipeOutput(recipe);

    return {
      index,
      netId: recipeNetId(recipe),
      inputA: inputA
        ? {
            id: itemId(inputA),
            count: itemCount(inputA),
          }
        : null,
      inputB: inputB
        ? {
            id: itemId(inputB),
            count: itemCount(inputB),
          }
        : null,
      output: output
        ? {
            id: itemId(output),
            count: itemCount(output),
          }
        : null,
      rawKeys: Object.keys(nbtValue(recipe) || {}),
    };
  }

  function summarizeRecipes(recipes) {
    return recipes.map((recipe, index) => summarizeRecipe(recipe, index));
  }

  function normalizeExpectedTrade(expected) {
    if (!expected || typeof expected !== "object") return expected;

    return {
      inputId: expected.inputId ?? expected.buyId ?? expected.buyAId,
      inputCount: expected.inputCount ?? expected.buyCount ?? expected.buyACount,
      inputBId: expected.inputBId ?? expected.buyBId,
      inputBCount: expected.inputBCount ?? expected.buyBCount,
      outputId: expected.outputId ?? expected.sellId ?? expected.resultId,
      outputCount: expected.outputCount ?? expected.sellCount ?? expected.resultCount,
    };
  }

  function recipeMatchesExpected(recipe, expected) {
    expected = normalizeExpectedTrade(expected);

    const inputA = recipeInputA(recipe);
    const inputB = recipeInputB(recipe);
    const output = recipeOutput(recipe);

    if (expected.inputId != null && itemId(inputA) !== normalizeItemId(expected.inputId)) return false;
    if (expected.inputCount != null && itemCount(inputA) !== Number(expected.inputCount)) return false;

    if (expected.inputBId != null && itemId(inputB) !== normalizeItemId(expected.inputBId)) return false;
    if (expected.inputBCount != null && itemCount(inputB) !== Number(expected.inputBCount)) return false;

    if (expected.outputId != null && itemId(output) !== normalizeItemId(expected.outputId)) return false;
    if (expected.outputCount != null && itemCount(output) !== Number(expected.outputCount)) return false;

    return true;
  }

  function findTrade(filterOrExpected, opts = {}) {
    const recipes = opts.recipes ?? currentTradeRecipes();

    if (typeof filterOrExpected === "function") {
      return recipes.find((recipe, index) => filterOrExpected(recipe, index)) ?? null;
    }

    if (Number.isInteger(filterOrExpected)) {
      return recipes[filterOrExpected] ?? null;
    }

    if (filterOrExpected && typeof filterOrExpected === "object") {
      return recipes.find((recipe) => recipeMatchesExpected(recipe, filterOrExpected)) ?? null;
    }

    return null;
  }

  function firstEmptyInventorySlot() {
    const slots = botState.inventory?.slots ?? [];

    for (let slot = 0; slot < slots.length; slot++) {
      if (!slots[slot]) return slot;
    }

    return -1;
  }

  function findMergeableInventorySlot(output) {
    const slots = botState.inventory?.slots ?? [];
    const expectedId = itemId(output);
    const expectedCount = itemCount(output);

    if (!expectedId || expectedCount <= 0) return -1;

    const shortName = expectedId.startsWith("minecraft:")
      ? expectedId.slice("minecraft:".length)
      : expectedId;

    for (let slot = 0; slot < slots.length; slot++) {
      const item = slots[slot];
      if (!item) continue;

      const maxStackSize = item.stackSize || item.maxStackSize || 64;
      if (item.name === shortName && item.count + expectedCount <= maxStackSize) {
        return slot;
      }
    }

    return -1;
  }

  function inventoryDestinationSlot(recipe, opts = {}) {
    if (Number.isInteger(opts.destinationSlot)) return opts.destinationSlot;

    const output = recipeOutput(recipe);

    const mergeSlot = findMergeableInventorySlot(output);
    if (mergeSlot !== -1) return mergeSlot;

    const emptySlot = firstEmptyInventorySlot();
    if (emptySlot !== -1) return emptySlot;

    throw new Error("Cannot execute trade: no inventory slot available for trade output");
  }

  function itemStackId(item) {
    item = nbtValue(item);

    const value =
      item?.stackId ??
      item?.stack_id ??
      item?.stack_network_id ??
      item?.network_stack_id ??
      item?.StackNetworkId ??
      item?.StackNetworkID;

    if (value == null) return 0;

    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }

  function fullContainerName(containerId, dynamicContainerId = 0) {
    return {
      container_id: containerId,
      dynamic_container_id: dynamicContainerId,
    };
  }

  function requestSlotInfo(containerId, slot, stackId = 0, dynamicContainerId = 0) {
    return {
      slot_type: fullContainerName(containerId, dynamicContainerId),
      slot,
      stack_id: stackId || 0,
    };
  }

  function playerInventorySlotInfo(slot, item = botState.inventory?.slots?.[slot]) {
    if (slot >= 0 && slot <= 8) {
      return requestSlotInfo("hotbar", slot, itemStackId(item));
    }

    return requestSlotInfo("inventory", slot, itemStackId(item));
  }

  function tradeIngredientSlotInfo(index, opts = {}) {
    if (index === 0) {
      return requestSlotInfo(
        opts.ingredientAContainerId ?? "trade2_ingredient1",
        opts.ingredientASlot ?? 4,
        opts.ingredientAStackId ?? 0,
        opts.ingredientADynamicContainerId ?? 0
      );
    }

    if (index === 1) {
      return requestSlotInfo(
        opts.ingredientBContainerId ?? "trade2_ingredient2",
        opts.ingredientBSlot ?? 5,
        opts.ingredientBStackId ?? 0,
        opts.ingredientBDynamicContainerId ?? 0
      );
    }

    throw new RangeError(`Unsupported trade ingredient index: ${index}`);
  }

  function tradeResultSourceSlot(recipe, opts = {}) {
    return requestSlotInfo(
      opts.resultContainerId ?? "trade2_result",
      opts.resultSlot ?? 50,
      opts.resultStackId ?? 0,
      opts.resultDynamicContainerId ?? 0
    );
  }

  function findInventorySlotForItem(expectedItem, requiredCount, opts = {}) {
    const expectedId = itemId(expectedItem);
    if (!expectedId) return -1;

    const shortName = expectedId.startsWith("minecraft:")
      ? expectedId.slice("minecraft:".length)
      : expectedId;

    const preferredSlots = Array.isArray(opts.preferredSlots) ? opts.preferredSlots : [];

    for (const slot of preferredSlots) {
      const item = botState.inventory?.slots?.[slot];
      if (item?.name === shortName && item.count >= requiredCount) return slot;
    }

    const slots = botState.inventory?.slots ?? [];
    for (let slot = 0; slot < slots.length; slot++) {
      const item = slots[slot];
      if (item?.name === shortName && item.count >= requiredCount) return slot;
    }

    return -1;
  }

  function resolveIngredientSourceSlot(input, requiredCount, ingredientIndex, opts = {}) {
    const explicit =
      ingredientIndex === 0
        ? opts.inputASlot ?? opts.sourceSlotA ?? opts.sourceSlot
        : opts.inputBSlot ?? opts.sourceSlotB;

    if (Number.isInteger(explicit)) return explicit;

    const preferredSlots =
      ingredientIndex === 0
        ? [opts.preferredInputASlot, opts.preferredSourceSlot, 0].filter(Number.isInteger)
        : [opts.preferredInputBSlot].filter(Number.isInteger);

    const slot = findInventorySlotForItem(input, requiredCount, { preferredSlots });

    if (slot === -1) {
      throw new Error(
        [
          `Cannot execute trade: missing ingredient ${ingredientIndex + 1}.`,
          `Needed ${requiredCount} of ${itemId(input)}.`,
          "Inventory:",
          JSON.stringify(
            (botState.inventory?.slots ?? [])
              .map((item, slot) =>
                item && {
                  slot,
                  name: item.name,
                  count: item.count,
                  stackId: item.stackId ?? item.stack_id,
                }
              )
              .filter(Boolean)
          ),
        ].join("\n")
      );
    }

    return slot;
  }

  function takeAction(count, source, destination) {
    return {
      type_id: "take",
      count,
      source,
      destination,
    };
  }

  function ingredientActions(recipe, count = 1, opts = {}) {
    const actions = [];

    const inputA = recipeInputA(recipe);
    const inputACount = itemCount(inputA) * count;

    if (inputA && itemId(inputA) && inputACount > 0) {
      const sourceSlot = resolveIngredientSourceSlot(inputA, inputACount, 0, opts);
      const sourceItem = botState.inventory?.slots?.[sourceSlot];

      actions.push(
        takeAction(
          inputACount,
          playerInventorySlotInfo(sourceSlot, sourceItem),
          tradeIngredientSlotInfo(0, opts)
        )
      );
    }

    const inputB = recipeInputB(recipe);
    const inputBCount = itemCount(inputB) * count;

    if (inputB && itemId(inputB) && inputBCount > 0) {
      const sourceSlot = resolveIngredientSourceSlot(inputB, inputBCount, 1, opts);
      const sourceItem = botState.inventory?.slots?.[sourceSlot];

      actions.push(
        takeAction(
          inputBCount,
          playerInventorySlotInfo(sourceSlot, sourceItem),
          tradeIngredientSlotInfo(1, opts)
        )
      );
    }

    return actions;
  }

  function tradeSelectionAction(recipe, count = 1, opts = {}) {
    const netId = opts.recipeNetId ?? recipeNetId(recipe);

    if (netId == null) {
      throw new Error(
        [
          "Cannot execute trade: recipe is missing netId / network_id.",
          "Recipe summary:",
          JSON.stringify(summarizeRecipe(recipe)),
        ].join("\n")
      );
    }

    const type = opts.selectionActionType ?? opts.tradeSelectionActionType ?? "craft_recipe_auto";

    if (type === "craft_recipe_auto") {
      return {
        type_id: "craft_recipe_auto",
        recipe_network_id: netId,
        times_crafted: opts.timesCrafted ?? count ?? 1,
        ingredients: opts.ingredients ?? [],
      };
    }

    if (type === "craft_recipe") {
      return {
        type_id: "craft_recipe",
        recipe_network_id: netId,
        ingredients: opts.ingredients ?? [],
      };
    }

    throw new Error(`Unsupported villager trade selection action: ${type}`);
  }

  function takeTradeResultAction(recipe, count, destinationSlot, opts = {}) {
    const output = recipeOutput(recipe);
    const outputCount = itemCount(output);

    if (outputCount <= 0) {
      throw new Error(
        [
          "Cannot execute trade: recipe output has no positive count.",
          "Recipe summary:",
          JSON.stringify(summarizeRecipe(recipe)),
        ].join("\n")
      );
    }

    const tradeCount = Number(count ?? 1);
    if (!Number.isInteger(tradeCount) || tradeCount <= 0) {
      throw new RangeError(`Trade count must be a positive integer, got ${count}`);
    }

    const resultCount = opts.takeCount ?? outputCount * tradeCount;
    const destinationItem = botState.inventory?.slots?.[destinationSlot] ?? null;

    return {
      type_id: "take",
      count: resultCount,
      source: tradeResultSourceSlot(recipe, opts),
      destination: playerInventorySlotInfo(destinationSlot, destinationItem),
    };
  }

  function makeRequest(actions) {
    if (!botState.inventoryActionHelpers?.makeRequest) {
      throw new Error("Cannot execute trade: inventory action helpers are not available");
    }

    return botState.inventoryActionHelpers.makeRequest(actions);
  }

  function buildTradeIngredientRequest(recipe, count = 1, opts = {}) {
    const actions = ingredientActions(recipe, count, opts);

    if (actions.length === 0) {
      throw new Error(
        [
          "Cannot execute trade: no ingredient actions were built.",
          "Recipe summary:",
          JSON.stringify(summarizeRecipe(recipe)),
        ].join("\n")
      );
    }

    const request = makeRequest(actions);

    return {
      request,
      actions,
    };
  }

  function buildTradeResultRequest(recipe, count = 1, destinationSlot = inventoryDestinationSlot(recipe), opts = {}) {
    const actions = [
      tradeSelectionAction(recipe, count, opts),
      takeTradeResultAction(recipe, count, destinationSlot, opts),
    ];

    const request = makeRequest(actions);

    return {
      request,
      destinationSlot,
      actions,
    };
  }

  function buildTradeRequest(recipe, count = 1, opts = {}) {
    const destinationSlot = inventoryDestinationSlot(recipe, opts);
    const ingredient = buildTradeIngredientRequest(recipe, count, opts);
    const result = buildTradeResultRequest(recipe, count, destinationSlot, opts);

    return {
      request: null,
      ingredientRequest: ingredient.request,
      resultRequest: result.request,
      destinationSlot,
      actions: [...ingredient.actions, ...result.actions],
    };
  }

  function responseStatusOk(response) {
    if (botState.inventoryActionHelpers?.responseStatusOk) {
      return botState.inventoryActionHelpers.responseStatusOk(response);
    }

    return response?.status === "ok" || response?.status === "success";
  }

  function updateLocalInventoryAfterTrade(recipe, count, destinationSlot, response) {
    if (!responseStatusOk(response)) return;

    const output = recipeOutput(recipe);
    const outputCount = itemCount(output) * Number(count ?? 1);
    if (outputCount <= 0) return;

    const outputId = itemId(output);
    if (!outputId) return;

    const shortName = outputId.startsWith("minecraft:")
      ? outputId.slice("minecraft:".length)
      : outputId;

    const current = botState.inventory?.slots?.[destinationSlot] ?? null;

    if (current && current.name === shortName) {
      const updated = cloneItem(current, current.count + outputCount);
      botState.inventory.updateSlot(destinationSlot, updated);
    }
  }

  function resolveTradeArgument(tradeOrIndex) {
    const recipes = currentTradeRecipes();

    if (Number.isInteger(tradeOrIndex)) {
      const recipe = recipes[tradeOrIndex];
      if (!recipe) {
        throw new RangeError(`Trade index ${tradeOrIndex} is out of range; recipes=${recipes.length}`);
      }
      return recipe;
    }

    if (tradeOrIndex && typeof tradeOrIndex === "object") {
      if (isRecipeLike(tradeOrIndex)) return tradeOrIndex;

      const found = findTrade(tradeOrIndex, { recipes });
      if (found) return found;

      throw new Error(
        [
          "Cannot execute trade: no matching current trade found.",
          "Expected:",
          JSON.stringify(tradeOrIndex),
          "Current recipes:",
          JSON.stringify(summarizeRecipes(recipes)),
        ].join("\n")
      );
    }

    throw new TypeError("executeTrade expects a recipe object, recipe index, or expected trade object");
  }

  function assertTradeResponseWaiters() {
    if (typeof botState.sendItemStackRequest !== "function") {
      throw new Error("Cannot execute trade: botState.sendItemStackRequest is not available");
    }

    if (typeof botState.waitForItemStackResponse !== "function") {
      throw new Error("Cannot execute trade: botState.waitForItemStackResponse is not available");
    }

    if (typeof botState.waitForRawItemStackResponse !== "function") {
      throw new Error(
        "Cannot execute trade: botState.waitForRawItemStackResponse is required for Geyser merchant result handling"
      );
    }
  }

  async function sendIngredientRequest(recipe, count, opts = {}) {
    const { request } = buildTradeIngredientRequest(recipe, count, opts);

    const responsePromise = botState.waitForItemStackResponse(
      request.request_id,
      opts.ingredientTimeoutMs ?? opts.timeoutMs ?? opts.responseTimeoutMs ?? tradeTimeoutMs
    );

    botState.sendItemStackRequest(request);

    logAction("[trading]", "execute_trade ingredient request", {
      request_id: request.request_id,
      recipe: summarizeRecipe(recipe),
      count,
      actions: request.actions.map((action) => action.type_id),
      request,
    });

    const response = await responsePromise;

    logAction("[trading]", "execute_trade ingredient response", {
      request_id: request.request_id,
      status: response.status,
      containers: Array.isArray(response.containers) ? response.containers.length : undefined,
    });

    return {
      request,
      response,
    };
  }

  async function sendResultRequest(recipe, count, destinationSlot, opts = {}) {
    const { request } = buildTradeResultRequest(recipe, count, destinationSlot, opts);

    const responsePromise = botState.waitForRawItemStackResponse(
      request.request_id,
      opts.resultTimeoutMs ?? opts.timeoutMs ?? opts.responseTimeoutMs ?? tradeTimeoutMs
    );

    botState.sendItemStackRequest(request);

    logAction("[trading]", "execute_trade result request", {
      request_id: request.request_id,
      recipe: summarizeRecipe(recipe),
      count,
      destinationSlot,
      actions: request.actions.map((action) => action.type_id),
      request,
    });

    const response = await responsePromise;

    if (!responseStatusOk(response)) {
      logAction("[trading]", "execute_trade result response rejected; waiting for Geyser delayed merchant handling", {
        request_id: request.request_id,
        status: response.status,
        destinationSlot,
      });

      if (opts.rejectOnErrorResponse === true || opts.rejectOnResultErrorResponse === true) {
        throw new Error(`item_stack_response rejected trade result request ${request.request_id}: ${response.status}`);
      }

      await sleep(opts.geyserTradeDelayMs ?? 250);
    }

    logAction("[trading]", "execute_trade result response", {
      request_id: request.request_id,
      status: response.status,
      destinationSlot,
      containers: Array.isArray(response.containers) ? response.containers.length : undefined,
    });

    return {
      request,
      response,
    };
  }

  async function executeTrade(tradeOrIndex, count = 1, opts = {}) {
    assertTradeResponseWaiters();

    const recipe = resolveTradeArgument(tradeOrIndex);
    const tradeCount = Number(count ?? 1);

    if (!Number.isInteger(tradeCount) || tradeCount <= 0) {
      throw new RangeError(`Trade count must be a positive integer, got ${count}`);
    }

    const destinationSlot = inventoryDestinationSlot(recipe, opts);

    const ingredient = await sendIngredientRequest(recipe, tradeCount, opts);

    await sleep(opts.tradeIngredientSettleMs ?? 150);

    const result = await sendResultRequest(recipe, tradeCount, destinationSlot, opts);

    updateLocalInventoryAfterTrade(recipe, tradeCount, destinationSlot, result.response);

    const tradeResult = {
      status: result.response?.status,
      request_id: result.response?.request_id,
      ingredientRequest: ingredient.request,
      ingredientResponse: ingredient.response,
      resultRequest: result.request,
      resultResponse: result.response,
      destinationSlot,
    };

    botState.emit("trade_executed", {
      recipe,
      count: tradeCount,
      destinationSlot,
      ...tradeResult,
    });

    return tradeResult;
  }

  botState.openTrade = openTrade;
  botState.tradeWith = openTrade;
  botState.waitForTradeWindow = waitForTradeWindow;
  botState.closeTradeWindow = closeTradeWindow;
  botState.currentTradeRecipes = currentTradeRecipes;
  botState.findTrade = findTrade;
  botState.executeTrade = executeTrade;

  botState.tradeHelpers = {
    nbtValue,
    normalizeItemId,
    itemId,
    itemCount,
    recipeInputA,
    recipeInputB,
    recipeOutput,
    recipeNetId,
    isRecipeLike,
    summarizeRecipe,
    summarizeRecipes,
    findTrade,
    buildTradeRequest,
    buildTradeIngredientRequest,
    buildTradeResultRequest,
    ingredientActions,
    tradeSelectionAction,
    takeTradeResultAction,
    playerInventorySlotInfo,
    tradeIngredientSlotInfo,
    tradeResultSourceSlot,
  };

  botState.setTradeTimeout = (ms) => {
    tradeTimeoutMs = ms;
  };

  client.on("update_trade", (packet) => {
    setCurrentTradeWindow(packet);
  });

  client.on("container_close", (packet) => {
    const currentWindowId = botState.currentTradeWindow?.window_id;

    if (currentWindowId != null && packet.window_id === currentWindowId) {
      lastTradeWindow = null;
      botState.currentTradeWindow = null;
      botState.currentTradingEntity = null;

      botState.emit("trade_window_close", packet);
    }
  });

  client.on("close", () => {
    lastTradeWindow = null;
    botState.currentTradeWindow = null;
    botState.currentTradingEntity = null;
  });
};