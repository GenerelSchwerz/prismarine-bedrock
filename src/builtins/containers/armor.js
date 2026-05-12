const { putIndexedSlot, putSlot } = require('./helpers')

function applyArmor (container) {
  container.putArmor = putIndexedSlot(container, 0, 4, 'armorSlot')
  container.putHelmet = putSlot(container, 0)
  container.putChestplate = putSlot(container, 1)
  container.putLeggings = putSlot(container, 2)
  container.putBoots = putSlot(container, 3)
  return container
}

function applyHand (container) {
  container.putOffhand = putSlot(container, 0)
  return container
}

module.exports = {
  matches: container => container.type === 'armor' || container.type === 'hand',
  apply: container => container.type === 'armor' ? applyArmor(container) : applyHand(container)
}
