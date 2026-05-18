'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_ground_decelerate
// Frames: 29  (ticks 4514..4542)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 4514, position: { x: 0.5, y: 1.6200100183486938, z: 0.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 4515 },
  { t: 4516 },
  { t: 4517 },
  { t: 4518 },
  { t: 4519 },
  { t: 4520 },
  { t: 4521, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 4522, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 4523, inputs: { verticalCollision: true } },
  { t: 4524 },
  { t: 4525 },
  { t: 4526 },
  { t: 4527 },
  { t: 4528 },
  { t: 4529 },
  { t: 4530 },
  { t: 4531 },
  { t: 4532 },
  { t: 4533 },
  { t: 4534 },
  { t: 4535 },
  { t: 4536 },
  { t: 4537 },
  { t: 4538 },
  { t: 4539 },
  { t: 4540 },
  { t: 4541 },
  { t: 4542 }
]

describe('physics: ground_decelerate', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'ground_decelerate', softFailures: true })
    h.runScenario({ name: 'ground_decelerate', ticks: TICKS })
  })
})
