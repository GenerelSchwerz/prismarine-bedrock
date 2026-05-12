const { putSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.putBanner = container.putInput
  container.putDye = putSlot(container, 1)
  container.putMaterial = putSlot(container, 2)
  container.putPattern = container.putMaterial
  container.takeResult = takeSlot(container, 3)
  return container
}

module.exports = {
  matches: container => container.type === 'loom',
  apply
}
