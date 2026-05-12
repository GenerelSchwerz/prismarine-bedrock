const { putSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putTemplate = putSlot(container, 0)
  container.putInput = putSlot(container, 1)
  container.putMaterial = putSlot(container, 2)
  container.takeResult = takeSlot(container, 3)
  return container
}

module.exports = {
  matches: container => container.type === 'smithing_table',
  apply
}
