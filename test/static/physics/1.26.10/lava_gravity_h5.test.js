'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_gravity_h5
// Frames: 26  (ticks 23294..23319)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23294, position: { x: 0.5, y: -1.8056012392044067, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.040000177919864655 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23295, position: { y: -1.8456014394760132 }, delta: { y: -0.04000008851289749 } },
  { t: 23296, position: { y: -1.8856016397476196 }, delta: { y: -0.04000004380941391 } },
  { t: 23297, position: { y: -1.925601601600647 }, delta: { y: -0.04000002145767212 } },
  { t: 23298, position: { y: -1.9656015634536743 }, delta: { y: -0.040000010281801224 } },
  { t: 23299, position: { y: 6.620009899139404 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23300, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 23301, position: { y: 6.541609764099121 }, delta: { y: -0.1552319973707199 } },
  { t: 23302, position: { y: 6.386377811431885 }, delta: { y: -0.2305273562669754 } },
  { t: 23303, position: { y: 6.155850410461426 }, delta: { y: -0.30431681871414185 } },
  { t: 23304, position: { y: 5.85153341293335 }, delta: { y: -0.3766304850578308 } },
  { t: 23305, position: { y: 5.474903106689453 }, delta: { y: -0.4474978744983673 } },
  { t: 23306, position: { y: 5.027405261993408 }, delta: { y: -0.5169479250907898 } },
  { t: 23307, position: { y: 4.5104570388793945 }, delta: { y: -0.585008978843689 } },
  { t: 23308, position: { y: 3.925447940826416 }, delta: { y: -0.6517087817192078 } },
  { t: 23309, position: { y: 3.2737393379211426 }, delta: { y: -0.7170746326446533 } },
  { t: 23310, position: { y: 2.55666446685791 }, delta: { y: -0.7811331152915955 } },
  { t: 23311, position: { y: 1.775531530380249 }, delta: { y: -0.8439104557037354 } },
  { t: 23312, position: { y: 0.9316210150718689 }, delta: { y: -0.9054322242736816 } },
  { t: 23313, position: { y: 0.02618873119354248 }, delta: { y: -0.4727161228656769 } },
  { t: 23314, position: { y: -0.446527361869812 }, delta: { y: -0.2563580572605133 } },
  { t: 23315, position: { y: -0.7028855085372925 }, delta: { y: -0.14817902445793152 } },
  { t: 23316, position: { y: -0.8510645627975464 }, delta: { y: -0.09408950805664062 } },
  { t: 23317, position: { y: -0.945154070854187 }, delta: { y: -0.06704474985599518 } },
  { t: 23318, position: { y: -1.012198805809021 }, delta: { y: -0.05352237448096275 } },
  { t: 23319, position: { y: -1.0657211542129517 }, delta: { y: -0.04676118493080139 } }
]

describe('physics: lava_gravity_h5', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_gravity_h5', softFailures: true })
    h.runScenario({ name: 'lava_gravity_h5', ticks: TICKS })
  })
})
