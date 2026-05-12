'use strict'

const assert = require('assert')
const specializeContainer = require('../../src/builtins/containers/specialize')

function fakeContainer (type) {
  const calls = []
  const container = {
    type,
    calls,
    firstEmptyInventorySlot: () => 99,
    putInventorySlot (inventorySlot, containerSlot, count) {
      calls.push(['put', inventorySlot, containerSlot, count])
      return calls[calls.length - 1]
    },
    takeContainerSlot (containerSlot, inventorySlot, count) {
      calls.push(['take', containerSlot, inventorySlot, count])
      return calls[calls.length - 1]
    }
  }
  return specializeContainer(container)
}

describe('container specializations', function () {
  it('adds furnace-family convenience methods', function () {
    for (const type of ['furnace', 'blast_furnace', 'smoker']) {
      const container = fakeContainer(type)
      container.putFuel(5, 2)
      container.putInput(6, 1)
      container.takeInput(7, 1)
      container.takeOutput(8, 3)

      assert.deepStrictEqual(container.calls, [
        ['put', 5, 1, 2],
        ['put', 6, 0, 1],
        ['take', 0, 7, 1],
        ['take', 2, 8, 3]
      ])
    }
  })

  it('adds brewing stand convenience methods', function () {
    const container = fakeContainer('brewing_stand')
    container.putBottle(5, 2, 1)
    container.putIngredient(6, 1)
    container.putFuel(7, 1)
    container.takeBottle(1, 8, 1)
    container.takeIngredient(9, 1)

    assert.deepStrictEqual(container.calls, [
      ['put', 5, 3, 1],
      ['put', 6, 0, 1],
      ['put', 7, 4, 1],
      ['take', 2, 8, 1],
      ['take', 0, 9, 1]
    ])
  })

  it('adds named methods for every specialized container module', function () {
    const expected = {
      workbench: ['putCraftingInput', 'takeCraftingOutput'],
      furnace: ['putInput', 'putIngredient', 'putFuel', 'takeInput', 'takeIngredient', 'takeFuel', 'takeOutput', 'takeResult'],
      brewing_stand: ['putBottle', 'putInput', 'putIngredient', 'putFuel', 'takeBottle', 'takeIngredient', 'takeFuel', 'takeResult'],
      anvil: ['putInput', 'putMaterial', 'takeResult'],
      smithing_table: ['putTemplate', 'putInput', 'putMaterial', 'takeResult'],
      enchantment: ['putInput', 'putLapis', 'getEnchantOptions', 'getEnchantOption', 'findEnchantOption', 'waitForEnchantOptions', 'selectEnchantOption'],
      beacon: ['putPayment'],
      trading: ['putIngredient1', 'putIngredient2', 'takeResult'],
      loom: ['putBanner', 'putDye', 'putPattern', 'takeResult'],
      grindstone: ['putInput', 'putAdditional', 'takeResult'],
      stonecutter: ['putInput', 'takeResult'],
      cartography: ['putInput', 'putAdditional', 'takeResult'],
      crafter: ['putCraftingInput', 'takeResult'],
      armor: ['putArmor', 'putHelmet', 'putChestplate', 'putLeggings', 'putBoots'],
      hand: ['putOffhand']
    }

    for (const [type, methods] of Object.entries(expected)) {
      const container = fakeContainer(type)
      for (const method of methods) {
        assert.strictEqual(typeof container[method], 'function', `${type}.${method} missing`)
      }
    }
  })

  it('keeps generic containers unchanged', function () {
    const container = fakeContainer('container')
    assert.strictEqual(container.putFuel, undefined)
    assert.strictEqual(container.takeResult, undefined)
  })

  it('validates indexed convenience slots', function () {
    const brewing = fakeContainer('brewing_stand')
    assert.throws(() => brewing.putBottle(5, 3, 1), /bottleSlot must be between 0 and 2/)

    const crafter = fakeContainer('crafter')
    assert.throws(() => crafter.putCraftingInput(5, 9, 1), /gridSlot must be between 0 and 8/)
  })
})
