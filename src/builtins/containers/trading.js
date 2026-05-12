const { putSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putIngredient1 = putSlot(container, 0)
  container.putIngredient2 = putSlot(container, 1)
  container.takeResult = takeSlot(container, 2)
  return container
}

module.exports = {
  matches: container => container.type === 'trading',
  apply
}
