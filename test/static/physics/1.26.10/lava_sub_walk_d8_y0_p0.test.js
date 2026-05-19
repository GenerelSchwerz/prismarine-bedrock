'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d8_y0_p0
// Frames: 39  (ticks 24121..24159)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 24121, position: { x: 0.5, y: -7.21998929977417, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 24122, position: { y: -7.259989261627197 } },
  { t: 24123, position: { y: -7.299989223480225 } },
  { t: 24124, position: { y: -7.339989185333252 } },
  { t: 24125, position: { y: -7.379989147186279 } },
  { t: 24126, position: { y: -7.419989109039307 } },
  { t: 24127, position: { y: -7.459989070892334 } },
  { t: 24128, position: { y: -7.499989032745361 } },
  { t: 24129, position: { y: -7.539988994598389 } },
  { t: 24130, position: { y: -7.579988956451416 } },
  { t: 24131, position: { y: -7.619988918304443 } },
  { t: 24132, position: { y: -7.659988880157471 } },
  { t: 24133, position: { y: -7.699988842010498 } },
  { t: 24134, position: { y: -7.739988803863525 } },
  { t: 24135, position: { y: -7.779988765716553 } },
  { t: 24136, position: { y: -7.81998872756958 } },
  { t: 24137, position: { y: -7.859988689422607 } },
  { t: 24138, position: { y: -7.899988651275635 } },
  { t: 24139, position: { y: -7.939988613128662 } },
  { t: 24140, position: { y: -7.9799885749816895 } },
  { t: 24141, position: { y: -8.019988059997559 } },
  { t: 24142, position: { y: -8.059988021850586 } },
  { t: 24143, position: { y: -8.099987983703613 } },
  { t: 24144, position: { y: -8.13998794555664 } },
  { t: 24145, position: { y: -8.179987907409668 } },
  { t: 24146, position: { y: -8.219987869262695 } },
  { t: 24147, position: { y: -8.259987831115723 } },
  { t: 24148, position: { y: -8.29998779296875 } },
  { t: 24149, position: { y: -8.339987754821777 } },
  { t: 24150, position: { y: -8.379987716674805 } },
  { t: 24151, position: { y: -8.379989624023438 }, delta: { y: -0.019999999552965164 }, inputs: { verticalCollision: true } },
  { t: 24152 },
  { t: 24153 },
  { t: 24154 },
  { t: 24155 },
  { t: 24156 },
  { t: 24157 },
  { t: 24158 },
  { t: 24159 }
]

describe('physics: lava_sub_walk_d8_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d8_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d8_y0_p0', ticks: TICKS })
  })
})
