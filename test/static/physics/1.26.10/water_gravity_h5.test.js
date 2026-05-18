'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_water_gravity_h5
// Frames: 33  (ticks 6997..7029)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 6997, position: { x: 0.5, y: -1.8907324075698853, z: 100.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.025000113993883133 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 6998, position: { y: -1.915732502937317 }, delta: { y: -0.025000091642141342 } },
  { t: 6999, position: { y: -1.9407325983047485 }, delta: { y: -0.02500007301568985 } },
  { t: 7000, position: { y: -1.9657326936721802 }, delta: { y: -0.025000058114528656 } },
  { t: 7001, position: { y: -1.9907327890396118 }, delta: { y: -0.02500004693865776 } },
  { t: 7002, position: { y: 6.620009899139404 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 7003, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 7004, position: { y: 6.541609764099121 }, delta: { y: -0.1552319973707199 } },
  { t: 7005, position: { y: 6.386377811431885 }, delta: { y: -0.2305273562669754 } },
  { t: 7006, position: { y: 6.155850410461426 }, delta: { y: -0.30431681871414185 } },
  { t: 7007, position: { y: 5.85153341293335 }, delta: { y: -0.3766304850578308 } },
  { t: 7008, position: { y: 5.474903106689453 }, delta: { y: -0.4474978744983673 } },
  { t: 7009, position: { y: 5.027405261993408 }, delta: { y: -0.5169479250907898 } },
  { t: 7010, position: { y: 4.5104570388793945 }, delta: { y: -0.585008978843689 } },
  { t: 7011, position: { y: 3.925447940826416 }, delta: { y: -0.6517087817192078 } },
  { t: 7012, position: { y: 3.2737393379211426 }, delta: { y: -0.7170746326446533 } },
  { t: 7013, position: { y: 2.55666446685791 }, delta: { y: -0.7811331152915955 } },
  { t: 7014, position: { y: 1.775531530380249 }, delta: { y: -0.8439104557037354 } },
  { t: 7015, position: { y: 0.9316210150718689 }, delta: { y: -0.9054322242736816 } },
  { t: 7016, position: { y: 0.02618873119354248 }, delta: { y: -0.7293457984924316 } },
  { t: 7017, position: { y: -0.7031570672988892 }, delta: { y: -0.5884766578674316 } },
  { t: 7018, position: { y: -1.2916337251663208 }, delta: { y: -0.47578132152557373 } },
  { t: 7019, position: { y: -1.767414927482605 }, delta: { y: -0.38562506437301636 } },
  { t: 7020, position: { y: -2.1530399322509766 }, delta: { y: -0.3135000467300415 } },
  { t: 7021, position: { y: -2.4665403366088867 }, delta: { y: -0.2558000385761261 } },
  { t: 7022, position: { y: -2.7223405838012695 }, delta: { y: -0.2096400260925293 } },
  { t: 7023, position: { y: -2.931980609893799 }, delta: { y: -0.17271201312541962 } },
  { t: 7024, position: { y: -3.1046924591064453 }, delta: { y: -0.1431696116924286 } },
  { t: 7025, position: { y: -3.247861862182617 }, delta: { y: -0.11953569203615189 } },
  { t: 7026, position: { y: -3.3673977851867676 }, delta: { y: -0.1006285548210144 } },
  { t: 7027, position: { y: -3.4680261611938477 }, delta: { y: -0.08550284802913666 } },
  { t: 7028, position: { y: -3.5535287857055664 }, delta: { y: -0.0734022855758667 } },
  { t: 7029, position: { y: -3.6269311904907227 }, delta: { y: -0.06372182816267014 } }
]

describe('physics: water_gravity_h5', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'water_gravity_h5', softFailures: true })
    h.runScenario({ name: 'water_gravity_h5', ticks: TICKS })
  })
})
