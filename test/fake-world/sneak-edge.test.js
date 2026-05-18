'use strict'

const assert = require('assert')
const { Vec3 } = require('vec3')

const { createFakeWorldBot, createSuperflatWorld } = require('./helpers/fake-world')

describe('fake-world sneak edge physics', function () {
  it('keeps sneaking feet grounded at the edge of a one-block platform', function () {
    const world = createSuperflatWorld()

    for (let x = -8; x <= 8; x++) {
      for (let z = 1; z <= 8; z++) {
        world.setAir(new Vec3(x, 0, z))
      }
    }

    const bot = createFakeWorldBot({
      world,
      feet: new Vec3(0.5, 1, 0.5),
      yaw: 0
    })

    bot.botState.setControlState('sneak', true)
    bot.botState.setControlState('forward', true)

    bot.tick(40)

    const feet = bot.feetPosition()
    assert(feet.z <= 1.300001, `expected sneak clamp at z edge with Bedrock overhang, got feet=${feet.x},${feet.y},${feet.z}`)
    assert(feet.y >= 0.999, `expected feet to remain on top of the platform, got y=${feet.y}`)
    assert.strictEqual(bot.botState.self.onGround, true)
    assert.strictEqual(bot.botState.self.sneaking, true)
  })

  it('keeps sneaking feet grounded at the rear edge while backing up', function () {
    const world = createSuperflatWorld()

    for (let x = -8; x <= 8; x++) {
      for (let z = -8; z <= -1; z++) {
        world.setAir(new Vec3(x, 0, z))
      }
    }

    const bot = createFakeWorldBot({
      world,
      feet: new Vec3(0.5, 1, 0.5),
      yaw: 0
    })

    bot.botState.setControlState('sneak', true)
    bot.botState.setControlState('back', true)

    bot.tick(40)

    const feet = bot.feetPosition()
    assert(feet.z >= -0.300001, `expected sneak clamp at rear z edge with Bedrock overhang, got feet=${feet.x},${feet.y},${feet.z}`)
    assert(feet.y >= 0.999, `expected feet to remain on top of the platform, got y=${feet.y}`)
    assert.strictEqual(bot.botState.self.onGround, true)
    assert.strictEqual(bot.botState.self.sneaking, true)
  })

  it('allows sneaking forward across supported ledge-marker blocks before clamping at the front edge', function () {
    const world = createSuperflatWorld({ floorY: 70 })

    for (let x = -8; x <= 8; x++) {
      for (let z = -8; z <= 8; z++) {
        world.setAir(new Vec3(x, 70, z))
      }
    }

    for (let x = -2; x <= 2; x++) {
      for (let z = -3; z <= 3; z++) {
        world.setBlock(new Vec3(x, 70, z))
      }
    }

    const bot = createFakeWorldBot({
      world,
      feet: new Vec3(0.5, 71, 2.258312940597534),
      yaw: 0
    })

    bot.botState.setControlState('sneak', true)
    bot.botState.setControlState('forward', true)

    bot.tick(80)

    const feet = bot.feetPosition()
    assert(feet.z >= 4.2, `expected sneak movement to reach the front ledge, got feet=${feet.x},${feet.y},${feet.z}`)
    assert(feet.z <= 4.300001, `expected front ledge clamp with Bedrock overhang, got feet=${feet.x},${feet.y},${feet.z}`)
    assert(feet.y >= 70.999, `expected feet to remain on top of the platform, got y=${feet.y}`)
    assert.strictEqual(bot.botState.self.onGround, true)
    assert.strictEqual(bot.botState.self.sneaking, true)
  })
})
