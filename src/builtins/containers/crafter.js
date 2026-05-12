const { putIndexedSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putCraftingInput = putIndexedSlot(container, 0, 9, 'gridSlot')
  container.putInput = container.putCraftingInput
  container.takeResult = takeSlot(container, 9)
  return container
}

module.exports = {
  matches: container => container.type === 'crafter',
  apply
}
