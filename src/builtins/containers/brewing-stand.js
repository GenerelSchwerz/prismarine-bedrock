const { putIndexedSlot, putSlot, takeIndexedSlot, takeSlot } = require('./helpers')

const DEFAULT_BREW_DURATION = 400
const DEFAULT_FUEL_TOTAL = 20

// Bedrock/Geyser brewing stand window slots.
//
// Server inventory_slot updates use:
//   0 = ingredient/input
//   1 = bottle/result 0
//   2 = bottle/result 1
//   3 = bottle/result 2
//   4 = fuel
//
// ItemStackRequest container refs in container-metadata.js already map these
// logical window slots to the correct Bedrock container IDs/protocol slots.
const INGREDIENT_SLOT = 0
const FIRST_BOTTLE_SLOT = 1
const BOTTLE_COUNT = 3
const FUEL_SLOT = 4

function clamp01 (value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function normalizeProperty (property) {
  if (typeof property === 'number') return property

  if (property == null) return property

  const text = String(property)
    .replace(/^ContainerSetDataPacket\./, '')
    .replace(/^minecraft:/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

  const asNumber = Number(text)
  if (Number.isInteger(asNumber)) return asNumber

  return text
}

function bottleSlot (index) {
  if (!Number.isInteger(index) || index < 0 || index >= BOTTLE_COUNT) {
    throw new RangeError(`bottleSlot must be between 0 and ${BOTTLE_COUNT - 1}`)
  }

  return FIRST_BOTTLE_SLOT + index
}

function makeProgressState () {
  return {
    type: 'brewing_stand',
    raw: {},

    // Geyser brewing properties:
    // 0 -> BREWING_STAND_BREW_TIME
    // 1 -> BREWING_STAND_FUEL_AMOUNT
    // open -> BREWING_STAND_FUEL_TOTAL = 20
    brewTime: 0,
    fuelAmount: 0,
    fuelTotal: DEFAULT_FUEL_TOTAL,

    // Brewing time counts down from 400 to 0.
    brewDuration: DEFAULT_BREW_DURATION,

    brewProgress: 0,
    fuelProgress: 0,

    isBrewing: false,
    hasFuel: false,
    lastUpdatedAt: 0
  }
}

function updateDerivedProgress (progress) {
  // Java/Geyser brewTime counts down. 0 means idle or complete.
  progress.brewProgress = progress.brewDuration > 0 && progress.brewTime > 0
    ? clamp01(1 - (progress.brewTime / progress.brewDuration))
    : 0

  progress.fuelProgress = progress.fuelTotal > 0
    ? clamp01(progress.fuelAmount / progress.fuelTotal)
    : 0

  progress.isBrewing = progress.brewTime > 0
  progress.hasFuel = progress.fuelAmount > 0
  progress.lastUpdatedAt = Date.now()

  return progress
}

function updateProgressProperty (progress, property, value) {
  const key = normalizeProperty(property)
  const numberValue = Number(value) || 0

  progress.raw[key] = numberValue

  switch (key) {
    case 0:
    case 'brewing_stand_brew_time':
    case 'brew_time':
      progress.brewTime = numberValue
      break

    case 1:
    case 'brewing_stand_fuel_amount':
    case 'fuel_amount':
      progress.fuelAmount = numberValue
      break

    case 2:
    case 'brewing_stand_fuel_total':
    case 'fuel_total':
      progress.fuelTotal = numberValue
      break

    default:
      progress[`property_${String(key)}`] = numberValue
      break
  }

  return updateDerivedProgress(progress)
}

function apply (container) {
  container.ingredientSlot = INGREDIENT_SLOT
  container.fuelSlot = FUEL_SLOT
  container.bottleSlots = [1, 2, 3]
  container.resultSlots = container.bottleSlots

  container.getBottle = function (index = 0) {
    return container.window.slots[bottleSlot(index)] ?? null
  }

  container.getBottles = function () {
    return container.bottleSlots.map(slot => container.window.slots[slot] ?? null)
  }

  container.getIngredient = function () {
    return container.window.slots[INGREDIENT_SLOT] ?? null
  }

  container.getFuel = function () {
    return container.window.slots[FUEL_SLOT] ?? null
  }

  container.putBottle = putIndexedSlot(container, FIRST_BOTTLE_SLOT, BOTTLE_COUNT, 'bottleSlot')
  container.putInput = container.putBottle
  container.putIngredient = putSlot(container, INGREDIENT_SLOT)
  container.putFuel = putSlot(container, FUEL_SLOT)

  container.takeBottle = takeIndexedSlot(container, FIRST_BOTTLE_SLOT, BOTTLE_COUNT, 'bottleSlot')
  container.takeIngredient = takeSlot(container, INGREDIENT_SLOT)
  container.takeFuel = takeSlot(container, FUEL_SLOT)
  container.takeResult = container.takeBottle

  container.progress = makeProgressState()
  container.brewing = container.progress

  container.getProgress = function () {
    return container.progress
  }

  container.getBrewingProgress = container.getProgress

  container.setBrewDuration = function (ticks) {
    const value = Number(ticks)
    if (Number.isFinite(value) && value > 0) {
      container.progress.brewDuration = value
      updateDerivedProgress(container.progress)
    }

    return container.progress
  }

  container.setFuelTotal = function (amount) {
    const value = Number(amount)
    if (Number.isFinite(value) && value > 0) {
      container.progress.fuelTotal = value
      updateDerivedProgress(container.progress)
    }

    return container.progress
  }

  container.handleContainerData = function (property, value, packet) {
    updateProgressProperty(container.progress, property, value)

    container.emit?.('progress', container.progress, property, value, packet)
    container.emit?.('brewingProgress', container.progress, property, value, packet)

    return true
  }

  return container
}

module.exports = {
  matches: container => container.type === 'brewing_stand',
  apply
}