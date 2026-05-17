'use strict'

const assert = require('assert')
const {
  Vec3,
  clearCourseVolume,
  createPathfinderBot,
  feetPosition,
  giveScaffolding,
  goToBlock,
  installPathfinderTrace,
  loadPathfinder,
  placeBlocks,
  preparePathfinderBot,
  teardownPathfinderBot,
  teleportToStart
} = require('./helpers')

const START = new Vec3(20, 66, 0)
const TARGET = new Vec3(24, 67, 0)
const TARGET_BLOCK = 'minecraft:emerald_block'

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(16, 65, -4), new Vec3(28, 71, 4))
  await placeBlocks(botState, [
    new Vec3(20, 65, 0),
    new Vec3(21, 65, 0),
    new Vec3(23, 66, 0),
    TARGET.offset(0, -1, 0)
  ], 'minecraft:stone')
  await placeBlocks(botState, [TARGET.offset(0, -1, 0)], TARGET_BLOCK)
  await giveScaffolding(botState, 'dirt', 16)
  await teleportToStart(botState, START)
}

describe.skip('live mineflayer pathfinder compatibility: bridging up', function () {
  this.timeout(120000)

  let botState

  before(async function () {
    botState = createPathfinderBot()
    await preparePathfinderBot(botState)
    await setupCourse(botState)
  })

  after(function () {
    return teardownPathfinderBot(botState)
  })

  it('places scaffolding across a missing support and climbs onto the raised target', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      canDig: false,
      allow1by1towers: false,
      allowParkour: false,
      placeCost: 1,
      scafoldingBlocks: [botState.registry.itemsByName.dirt.id]
    })

    await goToBlock(botState, TARGET, { debugInfo, timeoutMs: 30000 })

    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside raised target block ${TARGET.x},${TARGET.y},${TARGET.z}; got feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
