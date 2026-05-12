const { putSlot, takeSlot } = require('./helpers')

const TYPES = new Set(['furnace', 'blast_furnace', 'smoker'])

const DEFAULT_COOK_DURATION = 200

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

function makeProgressState (container) {
  return {
    type: container.type,
    raw: {},

    // Geyser furnace properties:
    // 0 -> FURNACE_LIT_TIME
    // 1 -> FURNACE_LIT_DURATION
    // 2 -> FURNACE_TICK_COUNT
    litTime: 0,
    litDuration: 0,
    tickCount: 0,

    // Bedrock/Geyser does not send total cook duration here.
    // Vanilla furnace-like recipes are commonly 200 ticks, but callers may
    // override this via setCookDuration().
    cookDuration: DEFAULT_COOK_DURATION,

    burnProgress: 0,
    cookProgress: 0,

    isBurning: false,
    isCooking: false,
    lastUpdatedAt: 0
  }
}

function updateDerivedProgress (progress) {
  progress.burnProgress = progress.litDuration > 0
    ? clamp01(progress.litTime / progress.litDuration)
    : 0

  progress.cookProgress = progress.cookDuration > 0
    ? clamp01(progress.tickCount / progress.cookDuration)
    : 0

  progress.isBurning = progress.litTime > 0
  progress.isCooking = progress.tickCount > 0
  progress.lastUpdatedAt = Date.now()

  return progress
}

function updateProgressProperty (progress, property, value) {
  const key = normalizeProperty(property)
  const numberValue = Number(value) || 0

  progress.raw[key] = numberValue

  switch (key) {
    case 0:
    case 'furnace_lit_time':
    case 'lit_time':
    case 'burn_time':
      progress.litTime = numberValue
      break

    case 1:
    case 'furnace_lit_duration':
    case 'lit_duration':
    case 'burn_duration':
      progress.litDuration = numberValue
      break

    case 2:
    case 'furnace_tick_count':
    case 'tick_count':
    case 'cook_time':
      progress.tickCount = numberValue
      break

    case 3:
    case 'cook_duration':
    case 'furnace_cook_duration':
      progress.cookDuration = numberValue
      break

    default:
      progress[`property_${String(key)}`] = numberValue
      break
  }

  return updateDerivedProgress(progress)
}

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.putIngredient = container.putInput
  container.putFuel = putSlot(container, 1)
  container.takeInput = takeSlot(container, 0)
  container.takeIngredient = container.takeInput
  container.takeFuel = takeSlot(container, 1)
  container.takeOutput = takeSlot(container, 2)
  container.takeResult = container.takeOutput

  container.progress = makeProgressState(container)
  container.furnace = container.progress

  container.getProgress = function () {
    return container.progress
  }

  container.getFurnaceProgress = container.getProgress

  container.setCookDuration = function (ticks) {
    const value = Number(ticks)
    if (Number.isFinite(value) && value > 0) {
      container.progress.cookDuration = value
      updateDerivedProgress(container.progress)
    }

    return container.progress
  }

  container.handleContainerData = function (property, value, packet) {
    updateProgressProperty(container.progress, property, value)

    container.emit?.('progress', container.progress, property, value, packet)
    container.emit?.('furnaceProgress', container.progress, property, value, packet)

    return true
  }

  return container
}

module.exports = {
  matches: container => TYPES.has(container.type),
  apply
}