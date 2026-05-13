// builtins/crafting.js
// Auto-loaded by BotState._loadBuiltins().

const { buildStatic } = require('mineflayer-crafting-util')
const recipeLoader = require('prismarine-recipe')
const registryLoader = require('prismarine-registry')
const { inventoryRequestSlotInfo, logAction, requestSlotInfo } = require('../utils')

const CONTAINER = {
  hotbar: 'hotbar',
  inventory: 'inventory',
  cursor: 'cursor',
  input: 'crafting_input',
  output: 'creative_output',
}

const ACTION = {
  take: 'take',
  place: 'place',
  consume: 'consume',
  create: 'create',
  craftRecipe: 'craft_recipe',
  craftRecipeAuto: 'craft_recipe_auto',
  resultsDeprecated: 'results_deprecated',
}

function nextRequestId (botState) {
  botState._craftRequestId = (botState._craftRequestId || 0) + 1
  return botState._craftRequestId
}

function recipeBody (entry) {
  return entry?.recipe || entry
}

function recipeNetworkId (entry) {
  const recipe = recipeBody(entry)
  return recipe?.network_id ?? entry?.network_id
}

function recipeOutputs (entry) {
  const recipe = recipeBody(entry)
  if (!recipe) return []
  if (Array.isArray(recipe.output)) return recipe.output
  return recipe.output ? [recipe.output] : []
}

function recipeResult (entry, itemId) {
  return recipeOutputs(entry).find(item => item?.network_id === itemId || item?.id === itemId)
}

function ingredientCount (ingredient) {
  return Math.max(1, Math.abs(ingredient?.count ?? 1))
}

function itemName (botState, item) {
  return botState.registry.items[item.type]?.name || item.name || ''
}

function normalizeTag (tag = '') {
  return tag.replace(/^minecraft:/, '')
}

function ingredientMetadataMatchesItem (ingredientMetadata, itemMetadata) {
  return ingredientMetadata == null ||
    ingredientMetadata === 0 ||
    ingredientMetadata === 32767 ||
    ingredientMetadata === itemMetadata
}

function ingredientMatchesItem (botState, ingredient, item) {
  if (!ingredient || !item) return false

  if (ingredient.type === 'int_id_meta' || ingredient.network_id != null) {
    if (ingredient.network_id !== item.type) return false
    return ingredientMetadataMatchesItem(ingredient.metadata, item.metadata)
  }

  if (ingredient.type === 'string_id_meta' || ingredient.name) {
    const wanted = String(ingredient.name).replace(/^minecraft:/, '')
    if (wanted !== itemName(botState, item)) return false
    return ingredientMetadataMatchesItem(ingredient.metadata, item.metadata)
  }

  if (ingredient.type === 'item_tag' || ingredient.tag) {
    const tag = normalizeTag(ingredient.tag)
    const name = itemName(botState, item)
    if (tag === 'logs') return /(^|_)log$|(^|_)stem$|hyphae$/.test(name)
    if (tag === 'planks') return name.endsWith('_planks')
  }

  return false
}

function flattenIngredients (entry) {
  const recipe = recipeBody(entry)
  if (!recipe) return []

  if (Array.isArray(recipe.input)) {
    return recipe.input.flatMap(part => Array.isArray(part) ? part : [part])
      .filter(ingredient => ingredient && ingredient.type !== 'invalid')
  }

  return []
}

function isTableRecipe (entry) {
  if (entry?._craftingUtilRecipe) return !!entry._craftingUtilRecipe.requiresTable
  const recipe = recipeBody(entry)
  if (!recipe) return false
  return (entry.type === 'shaped' || entry.type === 1) && (recipe.width > 2 || recipe.height > 2)
}

function reserveIngredients (botState, ingredients, times) {
  const used = new Map()
  const placements = []

  for (let gridSlot = 0; gridSlot < ingredients.length; gridSlot++) {
    const ingredient = ingredients[gridSlot]
    let remaining = ingredientCount(ingredient) * times

    for (let slot = 0; slot < botState.inventory.slots.length && remaining > 0; slot++) {
      const item = botState.inventory.slots[slot]
      const available = (item?.count || 0) - (used.get(slot) || 0)
      if (available <= 0 || !ingredientMatchesItem(botState, ingredient, item)) continue

      const count = Math.min(available, remaining)
      used.set(slot, (used.get(slot) || 0) + count)
      placements.push({ gridSlot, slot, count, stackId: item.stackId || 0, item })
      remaining -= count
    }

    if (remaining > 0) return null
  }

  return placements
}

function outputSlot (botState, result, used) {
  const stackSize = botState.registry.items[result.network_id]?.stackSize || 64

  for (let slot = 0; slot < botState.inventory.slots.length; slot++) {
    const item = botState.inventory.slots[slot]
    const countAfterCraft = (item?.count || 0) - (used.get(slot) || 0)
    if (item?.type === result.network_id && countAfterCraft + result.count <= stackSize) return slot
  }

  for (let slot = 0; slot < botState.inventory.slots.length; slot++) {
    const item = botState.inventory.slots[slot]
    if (!item || (item.count || 0) <= (used.get(slot) || 0)) return slot
  }

  return null
}

function nextCraftStackId (botState) {
  const maxInventoryStackId = Math.max(0, ...(botState.inventory?.slots || [])
    .map(item => item?.stackId ?? item?.stack_id ?? 0)
    .filter(Number.isFinite))

  let stackId = 0
  while (stackId <= maxInventoryStackId) stackId = botState.itemClass.nextStackId()
  return stackId
}

function makeCraftFromEntry (botState, entry, itemId, count) {
  const result = recipeResult(entry, itemId)
  if (!result?.count) return null

  const times = Math.ceil(count / result.count)
  if (times > 255) return null

  const ingredients = flattenIngredients(entry)
  if (ingredients.length === 0) return null

  const placements = reserveIngredients(botState, ingredients, times)
  if (!placements) return null

  const used = new Map()
  for (const placement of placements) {
    used.set(placement.slot, (used.get(placement.slot) || 0) + placement.count)
  }

  const outSlot = outputSlot(botState, { ...result, count: result.count * times }, used)
  if (outSlot == null) return null

  return {
    entry,
    baseResult: result,
    result: { ...result, count: result.count * times },
    ingredients,
    placements,
    outSlot,
    times,
    used,
  }
}

function findCraftInEntries (botState, entries, itemId, count) {
  for (const entry of entries || []) {
    if (recipeNetworkId(entry) == null) continue
    const craft = makeCraftFromEntry(botState, entry, itemId, count)
    if (craft) return craft
  }

  return null
}

function utilRecipeName (recipe) {
  return recipe?.name || recipe?.recipe_id || ''
}

function entryRecipeId (entry) {
  return recipeBody(entry)?.recipe_id || entry?.recipe_id || ''
}

function entryResultId (entry) {
  const output = recipeOutputs(entry)[0]
  return output?.network_id ?? output?.id
}

function staticItemIdByName (botState, name) {
  if (!name) return undefined
  return botState.craftingItemIdsByName?.[name.replace(/^minecraft:/, '')]
}

function runtimeItemIdByName (botState, name) {
  if (!name) return undefined
  return botState.registry.itemsByName?.[name.replace(/^minecraft:/, '')]?.id
}

function liveItemNameById (botState, id) {
  return botState.registry.items?.[id]?.name ??
    botState.craftingItemNamesById?.[id]
}

function normalizeWantedItem (botState, wantedItem) {
  const name = wantedItem?.name
    ? String(wantedItem.name).replace(/^minecraft:/, '')
    : liveItemNameById(botState, wantedItem?.id)

  return {
    ...wantedItem,
    id: staticItemIdByName(botState, name) ?? wantedItem.id
  }
}

function utilityOutputItemIds (botState, recipe) {
  const resultName = recipe?.result?.name?.replace(/^minecraft:/, '')
  const recipeName = utilRecipeName(recipe).replace(/^minecraft:/, '')
  const ids = [
    runtimeItemIdByName(botState, recipeName),
    runtimeItemIdByName(botState, resultName),
  ].filter(id => id != null)

  return [...new Set(ids)]
}

function resolveCraftStep (botState, step) {
  if (step?.entry) return step

  const recipe = step?._craftingUtilRecipe
  if (!recipe?.result?.id) return null

  const count = (recipe.result.count || 1) * (step.recipeApplications || 1)
  const recipeName = utilRecipeName(recipe)
  const itemIds = utilityOutputItemIds(botState, recipe)

  for (const itemId of itemIds) {
    const candidates = (botState.bedrockCraftingRecipes || [])
      .filter(entry => entryResultId(entry) === itemId)

    const named = recipeName
      ? candidates.filter(entry => entryRecipeId(entry) === recipeName)
      : []

    const craft = findCraftInEntries(botState, named.concat(candidates.filter(entry => !named.includes(entry))), itemId, count)
    if (craft) return craft
  }

  return null
}

function inventoryDebugSummary (botState) {
  return (botState.inventory?.slots || [])
    .map((item, slot) => item && {
      slot,
      name: item.name,
      type: item.type,
      count: item.count,
      stackId: item.stackId ?? item.stack_id
    })
    .filter(Boolean)
}

function inventorySignature (botState) {
  return JSON.stringify(inventoryDebugSummary(botState))
}

function waitForInventoryChange (botState, before, timeoutMs = 12000, quietMs = 3000) {
  return new Promise(resolve => {
    let changed = inventorySignature(botState) !== before
    let quietTimer = null

    const done = (changed) => {
      clearTimeout(timer)
      clearTimeout(quietTimer)
      botState.off('inventory_content_updated', onUpdate)
      botState.off('ui_slot_updated', onUpdate)
      botState.client?.off('inventory_slot', onUpdate)
      resolve(changed)
    }

    const onUpdate = () => {
      if (inventorySignature(botState) === before) return
      changed = true
      clearTimeout(quietTimer)
      quietTimer = setTimeout(() => done(true), quietMs)
    }

    const timer = setTimeout(() => done(false), timeoutMs)
    botState.on('inventory_content_updated', onUpdate)
    botState.on('ui_slot_updated', onUpdate)
    botState.client?.on('inventory_slot', onUpdate)
    if (changed) quietTimer = setTimeout(() => done(true), quietMs)
  })
}

function unresolvedCraftStepError (botState, step) {
  const recipe = step?._craftingUtilRecipe
  const resultName = recipe?.result?.name?.replace?.(/^minecraft:/, '')
  const recipeName = utilRecipeName(recipe)
  const itemIds = recipe ? utilityOutputItemIds(botState, recipe) : []
  const candidates = itemIds.flatMap(itemId => {
    return (botState.bedrockCraftingRecipes || [])
      .filter(entry => entryResultId(entry) === itemId)
      .map(entry => ({
        itemId,
        recipeId: entryRecipeId(entry),
        networkId: recipeNetworkId(entry),
        ingredientCount: flattenIngredients(entry).length
      }))
  })

  return new Error([
    'Could not resolve craft plan step against Bedrock crafting_data',
    `recipe=${recipeName || 'unknown'}`,
    `result=${resultName || 'unknown'}`,
    `candidateIds=${JSON.stringify(itemIds)}`,
    `candidates=${JSON.stringify(candidates)}`,
    `inventory=${JSON.stringify(inventoryDebugSummary(botState))}`
  ].join('\n'))
}

async function openCraftingTable (botState, block) {
  if (!block?.position) throw new Error('Recipe requires a crafting table position')

  if (typeof botState.openBlockContainer !== 'function') {
    throw new Error('containers builtin is required to open a crafting table')
  }

  return botState.openBlockContainer(block.position, { type: 'workbench' })
}

function buildActions (botState, craft) {
  const actions = []

  actions.push({
    type_id: ACTION.craftRecipeAuto,
    recipe_network_id: recipeNetworkId(craft.entry),
    times_crafted_2: craft.times,
    times_crafted: craft.times,
    ingredients: craft.ingredients,
  })

  actions.push({
    type_id: ACTION.resultsDeprecated,
    result_items: [craft.baseResult],
    times_crafted: craft.times,
  })

  for (const placement of craft.placements) {
    actions.push({
      type_id: ACTION.consume,
      count: placement.count,
      source: inventoryRequestSlotInfo(placement.slot, placement.stackId),
    })
  }

  const existing = botState.inventory.slots[craft.outSlot]
  const outSlotCountAfterConsume = (existing?.count || 0) - (craft.used.get(craft.outSlot) || 0)
  const outputStackId = existing?.type === craft.result.network_id && outSlotCountAfterConsume > 0
    ? existing.stackId || 0
    : nextCraftStackId(botState)
  const destinationStackId = outSlotCountAfterConsume > 0 ? (existing?.stackId || 0) : 0

  actions.push({
    type_id: ACTION.take,
    count: craft.result.count,
    source: requestSlotInfo(CONTAINER.output, 0, outputStackId),
    destination: inventoryRequestSlotInfo(craft.outSlot, destinationStackId),
  })

  actions._craftEntry = craft.entry
  return actions
}

function actionDebugSummary (actions) {
  return actions.map(action => {
    const summary = { type_id: action.type_id }
    if (action.recipe_network_id != null) summary.recipe_network_id = action.recipe_network_id
    if (action.times_crafted != null) summary.times_crafted = action.times_crafted
    if (action.times_crafted_2 != null) summary.times_crafted_2 = action.times_crafted_2
    if (action.count != null) summary.count = action.count
    if (action.source) summary.source = action.source
    if (action.destination) summary.destination = action.destination
    if (action.result_items) summary.result_items = action.result_items
    return summary
  })
}

function sendRequest (botState, actions, options = {}) {
  const requestId = nextRequestId(botState)
  const request = { request_id: requestId, actions, custom_names: [], cause: 'chat_public' }

  logAction('[craft]', 'item_stack_request', {
    requestId,
    actions: actions.map(action => action.type_id),
  })
  botState.emit('craft_item_stack_request', request)

  return new Promise((resolve, reject) => {
    const done = (err, value) => {
      clearTimeout(timer)
      botState.client.removeListener('item_stack_response', onResponse)
      err ? reject(err) : resolve(value)
    }

    const timer = setTimeout(() => done(new Error(`Craft request ${requestId} timed out`)), 5000)
    const onResponse = packet => {
      const response = packet?.responses?.find(resp => resp.request_id === requestId)
      if (!response) return
      if (response.status !== 0 && response.status !== 'ok') {
        done(new Error([
          `Craft rejected: status=${response.status}`,
          `response=${JSON.stringify(response)}`,
          `actions=${JSON.stringify(actionDebugSummary(actions))}`,
          `inventory=${JSON.stringify(inventoryDebugSummary(botState))}`
        ].join('\n')))
        return
      }
      done(null, response)
    }

    botState.client.on('item_stack_response', onResponse)

    if (options.standalone) {
      botState.client.queue('item_stack_request', { requests: [request] })
      return
    }

    botState.queuePlayerAuthInputEdit(packet => {
      botState.setAuthInputFlag(packet, 'item_stack_request')
      packet.item_stack_request = request
    })
    botState.flushPlayerAuthInput?.()
  })
}

function inventorySummary (botState) {
  return botState.inventory.slots
    .filter(item => item != null && item.count > 0)
    .map(item => ({
      id: staticItemIdByName(botState, item.name) ?? item.type,
      count: item.count
    }))
}

function simplifyUtilityStep (step) {
  const recipe = step.recipe
  return {
    _craftingUtilRecipe: {
      name: recipe.name,
      result: recipe.result,
      delta: recipe.delta,
      requiresTable: recipe.requiresTable,
    },
    recipeApplications: step.recipeApplications,
  }
}

async function craftingUtilPlanner (botState) {
  if (!botState._craftingUtilPlannerPromise) {
    botState._craftingUtilPlannerPromise = buildStatic(botState.craftingRecipe)
  }
  return botState._craftingUtilPlannerPromise
}

async function planWithCraftingUtil (botState, wantedItem) {
  try {
    const planner = await craftingUtilPlanner(botState)
    return planner(normalizeWantedItem(botState, wantedItem), {
      availableItems: inventorySummary(botState),
      careAboutExisting: false,
      includeRecursion: true,
      multipleRecipes: true,
    })
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function injectCrafting (botState, options = {}) {
  const craftingRegistry = options.craftingRecipeRegistry ??
    options.craftingRegistry ??
    registryLoader(`bedrock_${options.version ?? botState.options?.version}`)
  const craftingRecipe = options.craftingRecipe ?? recipeLoader(craftingRegistry).Recipe

  botState.craftingRecipeRegistry = craftingRegistry
  botState.craftingRecipe = craftingRecipe
  botState.craftingItemIdsByName = Object.fromEntries(
    Object.entries(craftingRegistry.itemsByName || {}).map(([name, item]) => [name, item.id])
  )
  botState.craftingItemNamesById = Object.fromEntries(
    Object.entries(craftingRegistry.items || {}).map(([id, item]) => [Number(id), item.name])
  )

  botState.planCraftInventory = async (wantedItem) => {
    const utilPlan = await planWithCraftingUtil(botState, wantedItem)
    if (utilPlan.success && Array.isArray(utilPlan.recipesToDo)) {
      return {
        ...utilPlan,
        source: 'mineflayer-crafting-util',
        recipesToDo: utilPlan.recipesToDo.map(simplifyUtilityStep),
      }
    }

    return {
      ...utilPlan,
      source: 'mineflayer-crafting-util',
      utilityError: utilPlan.error,
    }
  }

  botState.planCraftInventoryWithUtil = botState.planCraftInventory
  botState.planCraft = botState.planCraftInventory

  botState.craftPlan = async (plan, craftingTableBlock) => {
    if (!plan?.success) throw new Error(plan?.error || 'Cannot craft unsuccessful plan')

    let openedCraftingContainer = null

    try {
      for (const step of plan.recipesToDo) {
        const craft = resolveCraftStep(botState, step)
        if (!craft) throw unresolvedCraftStepError(botState, step)
        const requiresCraftingTable = isTableRecipe(craft.entry)
        const useStandaloneRequest = options.craftingStandaloneRequests || requiresCraftingTable
        if (requiresCraftingTable) openedCraftingContainer = await openCraftingTable(botState, craftingTableBlock)
        const beforeInventory = inventorySignature(botState)
        await sendRequest(botState, buildActions(botState, craft), { standalone: useStandaloneRequest })
        await waitForInventoryChange(botState, beforeInventory)
      }
    } finally {
      openedCraftingContainer?.close?.()
    }

    return plan
  }

  botState.craftItem = async (itemId, count, craftingTableBlock) => {
    const plan = await botState.planCraftInventory({ id: itemId, count })
    await botState.craftPlan(plan, craftingTableBlock)
    return plan
  }

  logAction('[craft]', 'crafting plugin loaded')
}

module.exports = injectCrafting
module.exports._craftingHelpers = {
  ingredientMatchesItem,
  ingredientMetadataMatchesItem,
}
