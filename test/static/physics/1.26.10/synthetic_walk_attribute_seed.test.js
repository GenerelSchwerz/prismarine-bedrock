'use strict'

const assert = require('assert')
const { Vec3 } = require('vec3')
const { createBedrockPhysicsEngine, seedFromPAI } = require('../../../../src/builtins/physics/bedrock-physics-engine')
const { getConstants } = require('../../../../src/builtins/physics-constants')
const { makeHarness, DEFAULT_PAI, mergePAI } = require('../_helpers')

const STONE = { name: 'stone', boundingBox: 'block' }
const AIR = { name: 'air', boundingBox: 'empty' }

function makeStandWorld () {
  return {
    getBlock (pos) {
      const y = Math.floor(pos.y)
      return y < 0 ? STONE : AIR
    }
  }
}

describe('physics: seedFromPAI new options', () => {
  it('initialWalkAttribute seeds minecraft:movement_speed for getMovementSpeed', () => {
    const C = getConstants('1.26.10')
    const self = {
      position: new Vec3(0, 0, 0),
      velocity: new Vec3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      headYaw: 0,
      height: C.PLAYER_HEIGHT,
      width: C.PLAYER_WIDTH,
      halfWidth: C.PLAYER_WIDTH / 2,
      eyeHeight: C.EYE_HEIGHT,
      onGround: true,
      groundSlipperiness: C.DEFAULT_SLIPPERINESS,
      attributes: {},
      effects: {},
      armor: {}
    }
    const pai = mergePAI(JSON.parse(JSON.stringify(DEFAULT_PAI)), {
      position: { x: 0, y: C.EYE_HEIGHT, z: 0 },
      inputs: { verticalCollision: true }
    })
    seedFromPAI(self, pai, [], makeStandWorld(), C, {
      initialWalkAttribute: 0.12345678,
      skipAabb: true
    })
    const attr = self.attributes['minecraft:movement_speed']
    assert.ok(attr, 'attribute object must be set')
    assert.strictEqual(attr.value, Math.fround(0.12345678))
  })

  it('initialFreezeRatio seeds self._freezeRatio directly', () => {
    const C = getConstants('1.26.10')
    const self = {
      position: new Vec3(0, 0, 0),
      velocity: new Vec3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      headYaw: 0,
      height: C.PLAYER_HEIGHT,
      width: C.PLAYER_WIDTH,
      halfWidth: C.PLAYER_WIDTH / 2,
      eyeHeight: C.EYE_HEIGHT,
      onGround: true,
      groundSlipperiness: C.DEFAULT_SLIPPERINESS,
      attributes: {},
      effects: {},
      armor: {}
    }
    const pai = mergePAI(JSON.parse(JSON.stringify(DEFAULT_PAI)), {
      position: { x: 0, y: C.EYE_HEIGHT, z: 0 },
      inputs: { verticalCollision: true }
    })
    seedFromPAI(self, pai, [], makeStandWorld(), C, {
      initialFreezeRatio: 0.42,
      skipAabb: true
    })
    assert.strictEqual(self._freezeRatio, 0.42)
  })

  it('initialFreezeRatio clamps to [0, 1]', () => {
    const C = getConstants('1.26.10')
    const baseSelf = () => ({
      position: new Vec3(0, 0, 0),
      velocity: new Vec3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      headYaw: 0,
      height: C.PLAYER_HEIGHT,
      width: C.PLAYER_WIDTH,
      halfWidth: C.PLAYER_WIDTH / 2,
      eyeHeight: C.EYE_HEIGHT,
      onGround: true,
      groundSlipperiness: C.DEFAULT_SLIPPERINESS,
      attributes: {},
      effects: {},
      armor: {}
    })
    const pai = mergePAI(JSON.parse(JSON.stringify(DEFAULT_PAI)), {
      position: { x: 0, y: C.EYE_HEIGHT, z: 0 },
      inputs: { verticalCollision: true }
    })
    const high = baseSelf()
    seedFromPAI(high, pai, [], makeStandWorld(), C, { initialFreezeRatio: 2.5, skipAabb: true })
    assert.strictEqual(high._freezeRatio, 1)
    const low = baseSelf()
    seedFromPAI(low, pai, [], makeStandWorld(), C, { initialFreezeRatio: -1, skipAabb: true })
    assert.strictEqual(low._freezeRatio, 0)
  })

  it('Harness honors per-tick walk diff at tick start', () => {
    const h = makeHarness({ version: '1.26.10', world: makeStandWorld(), softFailures: true, initialWalkAttribute: 0.1 })
    h.applyPAIDiff({
      t: 0,
      position: { x: 0.5, y: 1.62, z: 0.5 },
      inputs: { verticalCollision: true }
    }, [])
    assert.strictEqual(h.botState.self.attributes['minecraft:movement_speed'].value, Math.fround(0.1))
    h.applyPAIDiff({ t: 1, walk: 0.13 }, [])
    assert.strictEqual(h.botState.self.attributes['minecraft:movement_speed'].value, Math.fround(0.13))
    h.applyPAIDiff({ t: 2, attributes: { movement_speed: 0.07 } }, [])
    assert.strictEqual(h.botState.self.attributes['minecraft:movement_speed'].value, Math.fround(0.07))
  })

  it('Harness applies per-tick freezeRatio', () => {
    const h = makeHarness({ version: '1.26.10', world: makeStandWorld(), softFailures: true })
    h.applyPAIDiff({
      t: 0,
      position: { x: 0.5, y: 1.62, z: 0.5 },
      inputs: { verticalCollision: true }
    }, [])
    h.applyPAIDiff({ t: 1, freezeRatio: 0.5 }, [])
    assert.strictEqual(h.botState.self._freezeRatio, 0.5)
  })

  it('falls back to engine freeze-ratio ramp when no walk fixture data is provided', () => {
    const physics = createBedrockPhysicsEngine({ stepHeight: 0.6 })
    const C = getConstants('1.26.10')
    const h = makeHarness({ version: '1.26.10', world: makeStandWorld(), softFailures: true })
    h.applyPAIDiff({
      t: 0,
      position: { x: 0.5, y: 1.62, z: 0.5 },
      inputs: { verticalCollision: true }
    }, [])
    assert.strictEqual(h.botState.self.attributes['minecraft:movement_speed'], undefined)
    h.botState.self._ticksFrozen = 70
    h.botState.self._freezeRatio = 0.5
    h.applyPAIDiff({ t: 1, inputs: { verticalCollision: true } }, [])
    assert.strictEqual(h.botState.self._freezeRatio, 0.5)
    physics.simulateSelf(h.botState, h.controls, h.world, C)
  })
})
