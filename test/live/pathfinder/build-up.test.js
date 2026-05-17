'use strict'

const assert = require('assert')
const {
  Vec3,
  clearCourseVolume,
  createPathfinderBot,
  feetPosition,
  giveScaffolding,
  goToGoalReached,
  installPathfinderTrace,
  loadPathfinder,
  placeBlocks,
  preparePathfinderBot,
  runCommands,
  teardownPathfinderBot,
  teleportToStart
} = require('./helpers')

const START = new Vec3(60, 66, 0)
const TARGET = new Vec3(60, 70, 0)

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(56, 65, -4), new Vec3(64, 72, 4))
  await placeBlocks(botState, [START.offset(0, -1, 0)], 'minecraft:stone')
  await runCommands(botState, [
    `setblock ${TARGET.x} ${TARGET.y} ${TARGET.z} minecraft:air`,
    `setblock ${TARGET.x} ${TARGET.y - 1} ${TARGET.z} minecraft:air`,
    `setblock ${TARGET.x + 1} ${TARGET.y - 1} ${TARGET.z} minecraft:emerald_block`
  ])
  await giveScaffolding(botState, 'dirt', 16)
  await teleportToStart(botState, START)
}

describe.skip('live mineflayer pathfinder compatibility: build straight up', function () {
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

  it('places scaffolding under itself until it reaches an air goal block above', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      canDig: false,
      allow1by1towers: true,
      allowParkour: false,
      placeCost: 1,
      scafoldingBlocks: [botState.registry.itemsByName.dirt.id]
    })

    await goToGoalReached(botState, TARGET, { debugInfo, timeoutMs: 30000 })

    const feet = feetPosition(botState)
    assert(feet, 'Expected bot feet position after build-up goal_reached')
  })
})
