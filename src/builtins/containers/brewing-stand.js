const { putIndexedSlot, putSlot, takeIndexedSlot, takeSlot } = require('./helpers')

function apply (container) {
  container.putBottle = putIndexedSlot(container, 0, 3, 'bottleSlot')
  container.putInput = container.putBottle
  container.putIngredient = putSlot(container, 3)
  container.putFuel = putSlot(container, 4)
  container.takeBottle = takeIndexedSlot(container, 0, 3, 'bottleSlot')
  container.takeIngredient = takeSlot(container, 3)
  container.takeFuel = takeSlot(container, 4)
  container.takeResult = container.takeBottle
  return container
}

module.exports = {
  matches: container => container.type === 'brewing_stand',
  apply
}
