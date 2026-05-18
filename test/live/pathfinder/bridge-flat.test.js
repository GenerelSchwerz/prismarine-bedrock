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
  SETUP_DELAY_MS,
  sleep,
  teardownPathfinderBot,
  teleportToStart,
  USERNAME
} = require('./helpers')
const { setPlayerGamemode } = require('../../helpers/commands')

const START = new Vec3(70, 66, 0)
const TARGET = new Vec3(75, 66, 0)
const TARGET_BLOCK = 'minecraft:emerald_block'

async function setupCourse (botState) {
  await clearCourseVolume(botState, new Vec3(66, 65, -4), new Vec3(79, 70, 4))
  await placeBlocks(botState, [
    START.offset(0, -1, 0),
    TARGET.offset(0, -1, 0)
  ], 'minecraft:stone')
  await placeBlocks(botState, [TARGET.offset(0, -1, 0)], TARGET_BLOCK)
  await giveScaffolding(botState, 'dirt', 16)
  await teleportToStart(botState, START)
}

describe('live mineflayer pathfinder compatibility: flat bridge', function () {
  this.timeout(120000)

  let botState

  before(async function () {
    botState = createPathfinderBot()
    await preparePathfinderBot(botState)
    await setupCourse(botState)
    setPlayerGamemode(botState, USERNAME, 'survival')
    await sleep(SETUP_DELAY_MS)
  })

  after(function () {
    return teardownPathfinderBot(botState)
  })

  it('places scaffolding across a flat air gap and reaches the marked target', async function () {
    assert.strictEqual(typeof botState.loadPlugin, 'function')

    const debugInfo = installPathfinderTrace(botState)
    await loadPathfinder(botState, {
      canDig: false,
      allow1by1towers: false,
      allowParkour: false,
      allowSprinting: false,
      placeCost: 1,
      scafoldingBlocks: [botState.registry.itemsByName.dirt.id]
    })

    await goToBlock(botState, TARGET, { debugInfo, timeoutMs: 45000 })

    const feet = feetPosition(botState)
    const feetBlock = feet.floored()
    assert(
      feetBlock.x === TARGET.x && feetBlock.y === TARGET.y && feetBlock.z === TARGET.z,
      `Expected bot feet inside bridged target block ${TARGET.x},${TARGET.y},${TARGET.z}; got feet=${feet.x},${feet.y},${feet.z} block=${feetBlock.x},${feetBlock.y},${feetBlock.z}`
    )
  })
})
