const specializations = [
  require('./furnace'),
  require('./brewing-stand'),
  require('./workbench'),
  require('./anvil'),
  require('./smithing-table'),
  require('./enchantment'),
  require('./beacon'),
  require('./trading'),
  require('./loom'),
  require('./grindstone'),
  require('./stonecutter'),
  require('./cartography'),
  require('./crafter'),
  require('./armor')
]

module.exports = function specializeContainer (container) {
  for (const specialization of specializations) {
    if (specialization.matches(container)) {
      return specialization.apply(container)
    }
  }

  return container
}
