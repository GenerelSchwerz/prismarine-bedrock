'use strict'

const assert = require('assert')
const {
  Vec3,
  clearCourseVolume,
  createPathfinderBot,
  feetPosition,
  goToBlock,
  installPathfinderTrace,
  loadPathfinder,
  placeBlocks,
  preparePathfinderBot,
  teardownPathfinderBot,
  teleportToStart
} = require('./helpers')

const START = new Vec3(40, 67, 0)
const TARGET = new Vec3(40, 65, 0)
const TARGET_FOOTING = 'minecraft:diamond_block'

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(37, 64, -3), new Vec3(43, 71, 3))
  await placeBlocks(botState, [
    START.offset(0, -1, 0),
    TARGET.offset(0, -1, 0)
  ], 'minecraft:dirt')
  await placeBlocks(botState, [TARGET.offset(0, -1, 0)], TARGET_FOOTING)
  await teleportToStart(botState, START)
}

describe.skip('live mineflayer pathfinder compatibility: digging down', function () {
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

  it('digs the supporting block below itself and drops to the lower target', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      canDig: true,
      allow1by1towers: false,
      allowParkour: false,
      digCost: 1
    })

    await goToBlock(botState, TARGET, { debugInfo, timeoutMs: 30000 })

    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside lower target block ${TARGET.x},${TARGET.y},${TARGET.z}; got feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
