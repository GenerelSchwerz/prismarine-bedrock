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

const START = new Vec3(0, 66, 0)
const TARGET = new Vec3(5, 67, 7)
const TARGET_BLOCK = 'minecraft:diamond_block'

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(-4, 65, -4), new Vec3(9, 70, 10))

  const stoneCourse = []
  for (let x = 0; x <= 5; x++) stoneCourse.push(new Vec3(x, 65, 0))
  for (let z = 1; z <= 5; z++) stoneCourse.push(new Vec3(5, 65, z))

  await placeBlocks(botState, stoneCourse, 'minecraft:stone')
  await placeBlocks(botState, [TARGET.offset(0, -1, 0)], TARGET_BLOCK)
  await teleportToStart(botState, START)
}

describe('live mineflayer pathfinder compatibility: turn and parkour course', function () {
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

  it('walks the current forward-turn-gap course onto a marked target block', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      allowParkour: true
    })

    await goToBlock(botState, TARGET, { debugInfo })

    const position = botState.self.position
    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside target block ${TARGET.x},${TARGET.y},${TARGET.z}; got eye=${position.x},${position.y},${position.z} feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
