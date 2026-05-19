'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_effect_slow_falling_h20
// Frames: 14  (ticks 8776..8789)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8776, position: { x: 0.5, y: 1.6200100183486938, z: 0.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 8777 },
  { t: 8778 },
  { t: 8779 },
  { t: 8780 },
  { t: 8781, position: { y: 21.620010375976562 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 8782, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 8783, position: { y: 21.541610717773438 }, delta: { y: -0.08663199841976166 } },
  { t: 8784, position: { y: 21.454978942871094 }, delta: { y: -0.09469936043024063 } },
  { t: 8785, position: { y: 21.360279083251953 }, delta: { y: -0.10260537266731262 } },
  { t: 8786, position: { y: 21.257673263549805 }, delta: { y: -0.1103532686829567 } },
  { t: 8787, position: { y: 21.147319793701172 }, delta: { y: -0.11794620007276535 } },
  { t: 8788, position: { y: 21.029373168945312 }, delta: { y: -0.1253872811794281 } },
  { t: 8789, position: { y: 20.90398597717285 }, delta: { y: -0.1326795369386673 } }
]

describe('physics: effect_slow_falling_h20', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'effect_slow_falling_h20', softFailures: true })
    h.runScenario({ name: 'effect_slow_falling_h20', ticks: TICKS })
  })
})
