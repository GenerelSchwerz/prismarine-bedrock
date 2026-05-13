'use strict'

const assert = require('assert')

const injectCrafting = require('../../src/builtins/crafting')

describe('crafting builtin', function () {
  function createCraftFixture () {
    const entry = {
      type: 'shapeless',
      recipe: {
        network_id: 242,
        output: [{ network_id: 5, count: 4, metadata: 0, block_runtime_id: 123, extra: { has_nbt: 0, can_place_on: [], can_destroy: [] } }]
      }
    }
    const item = { type: 17, name: 'oak_log', count: 2, metadata: 0, stackId: 7 }

    return {
      botState: {
        inventory: {
          slots: [item, null]
        },
        itemClass: {
          _nextStackId: 8,
          nextStackId () {
            return this._nextStackId++
          }
        },
        registry: {
          items: {
            5: { name: 'oak_planks', stackSize: 64 },
            17: { name: 'oak_log', stackSize: 64 }
          }
        }
      },
      craft: {
        entry,
        baseResult: entry.recipe.output[0],
        result: { ...entry.recipe.output[0], count: 8 },
        ingredients: [{ type: 'int_id_meta', network_id: 17, metadata: 32767, count: 1 }],
        placements: [{ gridSlot: 0, slot: 0, count: 2, stackId: 7, item }],
        outSlot: 1,
        times: 2,
        used: new Map([[0, 2]])
      }
    }
  }

  it('treats Bedrock recipe metadata 32767 as an ingredient wildcard', function () {
    const { ingredientMatchesItem, ingredientMetadataMatchesItem } = injectCrafting._craftingHelpers
    const botState = {
      registry: {
        items: {
          17: { name: 'oak_log' }
        }
      }
    }
    const item = { type: 17, name: 'oak_log', metadata: 0 }

    assert.strictEqual(ingredientMetadataMatchesItem(32767, 0), true)
    assert.strictEqual(ingredientMatchesItem(botState, {
      type: 'int_id_meta',
      network_id: 17,
      metadata: 32767
    }, item), true)
    assert.strictEqual(ingredientMatchesItem(botState, {
      type: 'string_id_meta',
      name: 'minecraft:oak_log',
      metadata: 32767
    }, item), true)
  })

  it('keeps non-wildcard recipe metadata exact', function () {
    const { ingredientMetadataMatchesItem } = injectCrafting._craftingHelpers

    assert.strictEqual(ingredientMetadataMatchesItem(5, 0), false)
    assert.strictEqual(ingredientMetadataMatchesItem(5, 5), true)
  })

  it('builds recipe-book auto craft requests separately from normal craft requests', function () {
    const {
      buildAutoActions,
      buildGridPlaceActions,
      buildGridTakeActions,
      buildNormalActions
    } = injectCrafting._craftingHelpers
    const { botState, craft } = createCraftFixture()

    const auto = buildAutoActions(botState, craft)
    const gridTake = buildGridTakeActions(botState, craft.placements[0])
    const gridPlace = buildGridPlaceActions(craft, craft.placements[0], 11)
    const normal = buildNormalActions(botState, craft)

    assert.deepStrictEqual(auto.map(action => action.type_id), [
      'craft_recipe_auto',
      'results_deprecated',
      'consume',
      'take'
    ])
    assert.strictEqual(auto[0].times_crafted_2, 2)
    assert.deepStrictEqual(auto[0].ingredients, craft.ingredients)

    assert.deepStrictEqual(gridTake.map(action => action.type_id), ['take'])
    assert.strictEqual(gridTake[0].source.slot_type.container_id, 'hotbar')
    assert.strictEqual(gridTake[0].destination.slot_type.container_id, 'cursor')

    assert.deepStrictEqual(gridPlace.map(action => action.type_id), ['place'])
    assert.strictEqual(gridPlace[0].source.slot_type.container_id, 'cursor')
    assert.strictEqual(gridPlace[0].destination.slot_type.container_id, 'crafting_input')
    assert.strictEqual(gridPlace[0].destination.slot, 28)

    assert.deepStrictEqual(normal.map(action => action.type_id), [
      'craft_recipe',
      'results_deprecated',
      'consume',
      'take'
    ])
    assert.strictEqual(normal[0].times_crafted, 2)
    assert.strictEqual(normal[0].ingredients, undefined)
    assert.strictEqual(normal[2].source.slot_type.container_id, 'crafting_input')
    assert.strictEqual(normal[2].source.slot, 28)
    assert.strictEqual(normal[3].source.slot_type.container_id, 'creative_output')
    assert.strictEqual(normal[3].source.slot, 50)
  })

  it('uses native BDS inventory slot identities for normal craft transfers in hash mode', function () {
    const { buildGridTakeActions, buildNormalActions } = injectCrafting._craftingHelpers
    const { botState, craft } = createCraftFixture()
    botState.blockNetworkIdsAreHashes = true

    const gridTake = buildGridTakeActions(botState, craft.placements[0])
    const normal = buildNormalActions(botState, craft)

    assert.strictEqual(gridTake[0].source.slot_type.container_id, 'inventory')
    assert.strictEqual(gridTake[0].source.slot, 0)
    assert.strictEqual(normal[3].destination.slot_type.container_id, 'inventory')
    assert.strictEqual(normal[3].destination.slot, 1)
  })
})
