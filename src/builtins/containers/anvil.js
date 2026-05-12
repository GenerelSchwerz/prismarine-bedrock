const { putSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.putMaterial = putSlot(container, 1)
  container.takeResult = takeSlot(container, 2)
  return container
}

module.exports = {
  matches: container => container.type === 'anvil',
  apply
}
