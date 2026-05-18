'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_gravity_h1
// Frames: 19  (ticks 23219..23237)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23219, position: { x: 0.5, y: 1.6200100183486938, z: 288.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 23220 },
  { t: 23221 },
  { t: 23222 },
  { t: 23223 },
  { t: 23224, position: { y: 2.6200098991394043, z: 300.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23225, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 23226, position: { y: 2.541609764099121 }, delta: { y: -0.1552319973707199 } },
  { t: 23227, position: { y: 2.3863778114318848 }, delta: { y: -0.2305273562669754 } },
  { t: 23228, position: { y: 2.155850410461426 }, delta: { y: -0.30431681871414185 } },
  { t: 23229, position: { y: 1.8515336513519287 }, delta: { y: -0.3766304850578308 } },
  { t: 23230, position: { y: 1.4749032258987427 }, delta: { y: -0.4474978744983673 } },
  { t: 23231, position: { y: 1.0274053812026978 }, delta: { y: -0.5169479250907898 } },
  { t: 23232, position: { y: 0.5104573965072632 }, delta: { y: -0.27847397327423096 } },
  { t: 23233, position: { y: 0.23198342323303223 }, delta: { y: -0.15923698246479034 } },
  { t: 23234, position: { y: 0.0727463960647583 }, delta: { y: -0.09961849451065063 } },
  { t: 23235, position: { y: -0.02687203884124756 }, delta: { y: -0.06980924308300018 } },
  { t: 23236, position: { y: -0.09668123722076416 }, delta: { y: -0.054904621094465256 } },
  { t: 23237, position: { y: -0.15158581733703613 }, delta: { y: -0.04745230823755264 } }
]

describe('physics: lava_gravity_h1', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_gravity_h1', softFailures: true })
    h.runScenario({ name: 'lava_gravity_h1', ticks: TICKS })
  })
})
