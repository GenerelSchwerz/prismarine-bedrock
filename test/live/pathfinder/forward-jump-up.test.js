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

const START = new Vec3(30, 66, 0)
const TARGET = new Vec3(34, 67, 0)

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(25, 65, -3), new Vec3(35, 70, 3))
  await placeBlocks(botState, [
    new Vec3(30, 65, 0),
    new Vec3(31, 65, 0),
    new Vec3(33, 66, 0),
    TARGET.offset(0, -1, 0)
  ], 'minecraft:stone')
  await placeBlocks(botState, [TARGET.offset(0, -1, 0)], 'minecraft:emerald_block')
  await teleportToStart(botState, START)
}

describe('live mineflayer pathfinder compatibility: forward jump up', function () {
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

  it('walks forward from the right platform and jumps onto a one-block-up emerald target', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      allowParkour: true,
      allowSprinting: false
    })

    await goToBlock(botState, TARGET, { debugInfo, timeoutMs: 20000 })

    const position = botState.self.position
    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside emerald target block ${TARGET.x},${TARGET.y},${TARGET.z}; got eye=${position.x},${position.y},${position.z} feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
