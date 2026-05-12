const { putIndexedSlot, putSlot, takeIndexedSlot, takeSlot } = require('./helpers')

const DEFAULT_BREW_DURATION = 400
const DEFAULT_FUEL_TOTAL = 20

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
  container.putBottle = putIndexedSlot(container, 0, 3, 'bottleSlot')
  container.putInput = container.putBottle
  container.putIngredient = putSlot(container, 3)
  container.putFuel = putSlot(container, 4)
  container.takeBottle = takeIndexedSlot(container, 0, 3, 'bottleSlot')
  container.takeIngredient = takeSlot(container, 3)
  container.takeFuel = takeSlot(container, 4)
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