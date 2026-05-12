const { putSlot, takeSlot } = require('./helpers')

const TYPES = new Set(['furnace', 'blast_furnace', 'smoker'])

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.putIngredient = container.putInput
  container.putFuel = putSlot(container, 1)
  container.takeInput = takeSlot(container, 0)
  container.takeIngredient = container.takeInput
  container.takeFuel = takeSlot(container, 1)
  container.takeOutput = takeSlot(container, 2)
  container.takeResult = container.takeOutput
  return container
}

module.exports = {
  matches: container => TYPES.has(container.type),
  apply
}
