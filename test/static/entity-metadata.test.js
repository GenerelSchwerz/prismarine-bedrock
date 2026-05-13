'use strict'

const assert = require('assert')
const {
  applyAttributes,
  applyEntityMetadata,
  applyHealth,
  applyMobEffect,
  ensureEntityState
} = require('../../src/entity-metadata')

describe('entity metadata helpers', function () {
  it('adds reusable effect, status, pose, and metadata checks to entities', function () {
    const entity = {}

    ensureEntityState(entity)
    applyAttributes(entity, [
      { name: 'minecraft:health', current: 18, min: 0, max: 20, default: 20 },
      { name: 'minecraft:player.hunger', current: 17, min: 0, max: 20, default: 20 },
      { name: 'minecraft:player.saturation', current: 4, min: 0, max: 20, default: 5 }
    ])
    applyMobEffect(entity, {
      event_id: 'add',
      effect_id: 19,
      amplifier: 1,
      duration: 200,
      particles: true,
      ambient: false
    })
    applyEntityMetadata(entity, [
      { key: 'flags', value: (1n << 0n) | (1n << 1n) | (1n << 57n) }
    ])

    assert.strictEqual(entity.hasEffect('poison'), true)
    assert.strictEqual(entity.hasEffect(19), true)
    assert.strictEqual(entity.effectLevel('minecraft:poison'), 2)
    assert.strictEqual(entity.getStatus('health'), 18)
    assert.strictEqual(entity.getStatus('food'), 17)
    assert.strictEqual(entity.getStatus('saturation'), 4)
    assert.strictEqual(entity.checkStatus('health', { min: 10, max: 20 }), true)
    assert.strictEqual(entity.hasMetadataFlag('onfire'), true)
    assert.strictEqual(entity.hasMetadataFlag('swimming'), true)
    assert.strictEqual(entity.isOnFire(), true)
    assert.strictEqual(entity.isPose('swimming'), true)

    applyMobEffect(entity, { event_id: 'remove', effect_id: 19 })
    assert.strictEqual(entity.hasEffect('poison'), false)

    applyHealth(entity, { health: 12 })
    assert.strictEqual(entity.getStatus('health'), 12)
  })

  it('tracks visible mob effects exposed through entity metadata', function () {
    const entity = {}

    applyEntityMetadata(entity, [
      { key: 'visible_mob_effects', value: 24n }
    ])

    assert.strictEqual(entity.hasEffect('fire_resistance'), true)
    assert.strictEqual(entity.hasEffect('minecraft:fire_resistance'), true)
    assert.strictEqual(entity.effectLevel('fireResistance'), 1)
    assert.strictEqual(entity.getStatus('fire_resistance'), 1)

    applyEntityMetadata(entity, [
      { key: 'visible_mob_effects', value: 0n }
    ])

    assert.strictEqual(entity.hasEffect('fire_resistance'), false)
  })
})
