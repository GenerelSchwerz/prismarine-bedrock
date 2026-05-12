function putSlot (container, containerSlot) {
  return function putContainerSlot (inventorySlot, count) {
    return container.putInventorySlot(inventorySlot, containerSlot, count)
  }
}

function takeSlot (container, containerSlot) {
  return function takeContainerSlot (inventorySlot = container.firstEmptyInventorySlot(), count) {
    return container.takeContainerSlot(containerSlot, inventorySlot, count)
  }
}

function putIndexedSlot (container, firstSlot, maxSlots, name) {
  return function putContainerIndexedSlot (inventorySlot, index = 0, count) {
    if (!Number.isInteger(index) || index < 0 || index >= maxSlots) {
      throw new RangeError(`${name} must be between 0 and ${maxSlots - 1}`)
    }
    return container.putInventorySlot(inventorySlot, firstSlot + index, count)
  }
}

function takeIndexedSlot (container, firstSlot, maxSlots, name) {
  return function takeContainerIndexedSlot (index = 0, inventorySlot = container.firstEmptyInventorySlot(), count) {
    if (!Number.isInteger(index) || index < 0 || index >= maxSlots) {
      throw new RangeError(`${name} must be between 0 and ${maxSlots - 1}`)
    }
    return container.takeContainerSlot(firstSlot + index, inventorySlot, count)
  }
}

module.exports = {
  putSlot,
  takeSlot,
  putIndexedSlot,
  takeIndexedSlot
}
