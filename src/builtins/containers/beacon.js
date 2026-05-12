const { putSlot } = require('./helpers')

function apply (container) {
  container.putPayment = putSlot(container, 0)
  return container
}

module.exports = {
  matches: container => container.type === 'beacon',
  apply
}
