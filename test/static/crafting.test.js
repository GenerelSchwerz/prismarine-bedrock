'use strict'

const assert = require('assert')

const injectCrafting = require('../../src/builtins/crafting')

describe('crafting builtin', function () {
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
})
