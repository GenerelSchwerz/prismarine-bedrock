'use strict'

const assert = require('assert')
const { Vec3 } = require('vec3')
const { getBlockRuntimeId, getStateId } = require('../../src/utils')

describe('block runtime id mapping', function () {
  it('maps network hash runtime IDs back to local block state IDs', function () {
    const registry = {
      blocksByRuntimeId: {
        1921718966: { stateId: 14388, name: 'oak_planks' }
      }
    }

    assert.strictEqual(getStateId(registry, 1921718966), 14388)
  })

  it('falls back to palette state IDs when no runtime map exists', function () {
    const registry = {
      blocksByStateId: {
        14388: { name: 'oak_planks' }
      }
    }

    assert.strictEqual(getStateId(registry, 14388), 14388)
  })

  it('maps local state IDs to outbound hash runtime IDs', function () {
    const botState = {
      registry: {
        blockNetworkRuntimeIdsByStateId: {
          14388: 1921718966
        }
      },
      world: {
        getBlock: () => ({ stateId: 14388, name: 'oak_planks' })
      }
    }

    assert.strictEqual(getBlockRuntimeId(botState, new Vec3(1, 2, 3)), 1921718966)
  })

  it('keeps outbound palette state IDs when no hash map exists', function () {
    const botState = {
      registry: {},
      world: {
        getBlock: () => ({ stateId: 14388, name: 'oak_planks' })
      }
    }

    assert.strictEqual(getBlockRuntimeId(botState, new Vec3(1, 2, 3)), 14388)
  })
})
