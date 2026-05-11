// builtins/crafting.js
// Auto-loaded by BotState._loadBuiltins().

const { buildStatic } = require('mineflayer-crafting-util')
const recipeLoader = require('prismarine-recipe')
const { cloneItem, inventoryRequestSlotInfo, logAction, requestSlotInfo } = require('../utils')

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

function ingredientMatchesItem (botState, ingredient, item) {
  if (!ingredient || !item) return false

  if (ingredient.type === 'int_id_meta' || ingredient.network_id != null) {
    if (ingredient.network_id !== item.type) return false
    return ingredient.metadata == null || ingredient.metadata === 0 || ingredient.metadata === item.metadata
  }

  if (ingredient.type === 'string_id_meta' || ingredient.name) {
    const wanted = String(ingredient.name).replace(/^minecraft:/, '')
    if (wanted !== itemName(botState, item)) return false
    return ingredient.metadata == null || ingredient.metadata === item.metadata
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

function liveItemIdByName (botState, name) {
  if (!name) return undefined
  return botState.registry.itemsByName?.[name.replace(/^minecraft:/, '')]?.id
}

function utilityOutputItemIds (botState, recipe) {
  const resultName = recipe?.result?.name?.replace(/^minecraft:/, '')
  const recipeName = utilRecipeName(recipe).replace(/^minecraft:/, '')
  const ids = [
    liveItemIdByName(botState, recipeName),
    liveItemIdByName(botState, resultName),
    recipe?.result?.id,
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

async function openCraftingTable (botState, block) {
  if (!block?.position) throw new Error('Recipe requires a crafting table position')

  const opened = new Promise((resolve, reject) => {
    const done = (err, value) => {
      clearTimeout(timer)
      botState.client.removeListener('container_open', onOpen)
      err ? reject(err) : resolve(value)
    }
    const onOpen = packet => done(null, packet)
    const timer = setTimeout(() => done(new Error('Timed out opening crafting table')), 5000)
    botState.client.on('container_open', onOpen)
  })

  botState.client.queue('player_action', {
    runtime_entity_id: botState.client.entityId,
    action: 'interact_block',
    position: block.position,
    result_position: { x: 0, y: 0, z: 0 },
    face: 0,
  })

  return opened
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
    : botState.itemClass.nextStackId()
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

function sendRequest (botState, actions) {
  const requestId = nextRequestId(botState)
  const request = { request_id: requestId, actions, custom_names: [], cause: 'chat_public' }

  logAction('[craft]', 'item_stack_request', {
    requestId,
    actions: actions.map(action => action.type_id),
  })

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
        done(new Error(`Craft rejected: status=${response.status}`))
        return
      }
      done(null, response)
    }

    botState.client.on('item_stack_response', onResponse)

    botState.queuePlayerAuthInputEdit(packet => {
      botState.setAuthInputFlag(packet, 'item_stack_request')
      packet.item_stack_request = request
    })
    botState.flushPlayerAuthInput?.()
  })
}

function predictInventory (botState, craft) {
  for (const [slot, count] of craft.used) {
    const item = botState.inventory.slots[slot]
    botState.inventory.updateSlot(slot, cloneItem(item, (item?.count || 0) - count, { preserveIdentity: false }))
  }

  const existing = botState.inventory.slots[craft.outSlot]
  if (existing?.type === craft.result.network_id) {
    botState.inventory.updateSlot(craft.outSlot, cloneItem(existing, existing.count + craft.result.count, { preserveIdentity: false }))
    return
  }

  const item = new botState.itemClass(
    craft.result.network_id,
    craft.result.count,
    craft.result.metadata || 0,
    null,
    botState.itemClass.nextStackId(),
    true
  )
  botState.inventory.updateSlot(craft.outSlot, item)
}

function inventorySummary (botState) {
  return botState.inventory.slots
    .filter(item => item != null && item.count > 0)
    .map(item => ({ id: item.type, count: item.count }))
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
    const { Recipe } = recipeLoader(botState.registry)
    botState._craftingUtilPlannerPromise = buildStatic(Recipe)
  }
  return botState._craftingUtilPlannerPromise
}

async function planWithCraftingUtil (botState, wantedItem) {
  try {
    const planner = await craftingUtilPlanner(botState)
    return planner(wantedItem, {
      availableItems: inventorySummary(botState),
      careAboutExisting: false,
      includeRecursion: true,
      multipleRecipes: true,
    })
  } catch (err) {
    return { success: false, error: err.message }
  }
}

module.exports = async (botState, options = {}) => {
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

    for (const step of plan.recipesToDo) {
      const craft = resolveCraftStep(botState, step)
      if (!craft) throw new Error('Could not resolve craft plan step against Bedrock crafting_data')
      if (isTableRecipe(craft.entry)) await openCraftingTable(botState, craftingTableBlock)
      await sendRequest(botState, buildActions(botState, craft))
      predictInventory(botState, craft)
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
