const { putSlot } = require('./helpers')

function apply (container) {
  container.putInput = putSlot(container, 0)
  container.putLapis = putSlot(container, 1)
  return container
}

module.exports = {
  matches: container => container.type === 'enchantment',
  apply
}
