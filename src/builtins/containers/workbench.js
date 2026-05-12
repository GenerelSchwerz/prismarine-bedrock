const { putIndexedSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putCraftingInput = putIndexedSlot(container, 1, 9, 'gridSlot')
  container.takeCraftingOutput = takeSlot(container, 0)
  container.takeResult = container.takeCraftingOutput
  return container
}

module.exports = {
  matches: container => container.type === 'workbench',
  apply
}
