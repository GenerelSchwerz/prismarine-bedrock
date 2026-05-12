const { putSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.takeResult = takeSlot(container, 1)
  return container
}

module.exports = {
  matches: container => container.type === 'stonecutter',
  apply
}
