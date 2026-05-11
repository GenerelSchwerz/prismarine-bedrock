// builtins/crafting.js
// Auto-loaded by BotState._loadBuiltins().

const { logAction } = require('../utils')

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

function slotInfo (containerId, slot, stackId = 0) {
  return { slot_type: { container_id: containerId, dynamic_container_id: 0 }, slot, stack_id: stackId || 0 }
}

function inventorySlotInfo (slot, stackId = 0) {
  return slot < 9
    ? slotInfo(CONTAINER.hotbar, slot, stackId)
    : slotInfo(CONTAINER.inventory, slot - 9, stackId)
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

function findCraft (botState, itemId, count) {
  for (const entry of botState.bedrockCraftingRecipes || []) {
    if (recipeNetworkId(entry) == null) continue
    const result = recipeResult(entry, itemId)
    if (!result?.count) continue

    const times = Math.ceil(count / result.count)
    if (times > 255) continue

    const ingredients = flattenIngredients(entry)
    if (ingredients.length === 0) continue

    const placements = reserveIngredients(botState, ingredients, times)
    if (!placements) continue

    const used = new Map()
    for (const placement of placements) {
      used.set(placement.slot, (used.get(placement.slot) || 0) + placement.count)
    }

    const outSlot = outputSlot(botState, { ...result, count: result.count * times }, used)
    if (outSlot == null) continue

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
      source: inventorySlotInfo(placement.slot, placement.stackId),
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
    source: slotInfo(CONTAINER.output, 0, outputStackId),
    destination: inventorySlotInfo(craft.outSlot, destinationStackId),
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

function cloneItem (item, count) {
  if (!item || count <= 0) return null
  return new item.constructor(item.type, count, item.metadata, item.nbt, item.stackId, true)
}

function predictInventory (botState, craft) {
  for (const [slot, count] of craft.used) {
    const item = botState.inventory.slots[slot]
    botState.inventory.updateSlot(slot, cloneItem(item, (item?.count || 0) - count))
  }

  const existing = botState.inventory.slots[craft.outSlot]
  if (existing?.type === craft.result.network_id) {
    botState.inventory.updateSlot(craft.outSlot, cloneItem(existing, existing.count + craft.result.count))
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

module.exports = async (botState, options = {}) => {
  botState.bedrockCraftingRecipes = []

  botState.client.on('crafting_data', packet => {
    botState.bedrockCraftingRecipes.push(...(packet.recipes || []))
    if (!options.quietCraftingDataLog) {
      logAction('[craft]', 'crafting_data', { recipes: botState.bedrockCraftingRecipes.length })
    }
  })

  botState.planCraftInventory = (wantedItem) => {
    const craft = findCraft(botState, wantedItem.id, wantedItem.count)
    return craft
      ? { success: true, recipesToDo: [craft], requiresCraftingTable: isTableRecipe(craft.entry) }
      : { success: false, error: `No craftable recipe for item ${wantedItem.id}x${wantedItem.count}` }
  }

  botState.planCraft = botState.planCraftInventory

  botState.craftPlan = async (plan, craftingTableBlock) => {
    if (!plan?.success) throw new Error(plan?.error || 'Cannot craft unsuccessful plan')

    for (const craft of plan.recipesToDo) {
      if (isTableRecipe(craft.entry)) await openCraftingTable(botState, craftingTableBlock)
      await sendRequest(botState, buildActions(botState, craft))
      predictInventory(botState, craft)
    }

    return plan
  }

  botState.craftItem = async (itemId, count, craftingTableBlock) => {
    const plan = botState.planCraftInventory({ id: itemId, count })
    await botState.craftPlan(plan, craftingTableBlock)
    return plan
  }

  logAction('[craft]', 'crafting plugin loaded')
}
