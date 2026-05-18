'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_no_leather_powder_snow
// Frames: 68  (ticks 15485..15552)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 15485, position: { x: 0.5, y: 1.7968097925186157, z: 1600.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 15486, position: { y: 1.67920982837677 } },
  { t: 15487, position: { y: 1.5616098642349243 } },
  { t: 15488, position: { y: 1.444009780883789 } },
  { t: 15489, position: { y: 1.6200100183486938, z: 1595.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 15490, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 15491, position: { y: 1.5024100542068481 } },
  { t: 15492, position: { y: 1.384809970855713 } },
  { t: 15493, position: { y: 1.2672100067138672 } },
  { t: 15494, position: { y: 1.1496100425720215 } },
  { t: 15495, position: { y: 1.0320100784301758 } },
  { t: 15496, position: { y: 0.9144099950790405 } },
  { t: 15497, position: { y: 0.79680997133255 } },
  { t: 15498, position: { y: 0.6792099475860596 } },
  { t: 15499, position: { y: 0.5616099834442139 } },
  { t: 15500, position: { y: 0.44401001930236816 } },
  { t: 15501, position: { y: 0.32641005516052246 } },
  { t: 15502, position: { y: 0.20881009101867676 } },
  { t: 15503, position: { y: 0.09121012687683105 } },
  { t: 15504, position: { y: -0.02638983726501465 } },
  { t: 15505, position: { y: -0.14398980140686035 } },
  { t: 15506, position: { y: -0.26158976554870605 } },
  { t: 15507, position: { y: -0.37918972969055176 } },
  { t: 15508, position: { y: -0.496789813041687 } },
  { t: 15509, position: { y: -0.6143897771835327 } },
  { t: 15510, position: { y: -0.7319897413253784 } },
  { t: 15511, position: { y: -0.8495897054672241 } },
  { t: 15512, position: { y: -0.9671896696090698 } },
  { t: 15513, position: { y: -1.0847896337509155 } },
  { t: 15514, position: { y: -1.2023895978927612 } },
  { t: 15515, position: { y: -1.319989562034607 } },
  { t: 15516, position: { y: -1.4375895261764526 } },
  { t: 15517, position: { y: -1.5551894903182983 } },
  { t: 15518, position: { y: -1.672789454460144 } },
  { t: 15519, position: { y: -1.7903894186019897 } },
  { t: 15520, position: { y: -1.9079893827438354 } },
  { t: 15521, position: { y: -2.0255894660949707 } },
  { t: 15522, position: { y: -2.1431894302368164 } },
  { t: 15523, position: { y: -2.260789394378662 } },
  { t: 15524, position: { y: -2.378389358520508 } },
  { t: 15525, position: { y: -2.4959893226623535 } },
  { t: 15526, position: { y: -2.613589286804199 } },
  { t: 15527, position: { y: -2.731189250946045 } },
  { t: 15528, position: { y: -2.8487892150878906 } },
  { t: 15529, position: { y: -2.9663891792297363 } },
  { t: 15530, position: { y: -3.083989143371582 } },
  { t: 15531, position: { y: -3.2015891075134277 } },
  { t: 15532, position: { y: -3.3191890716552734 } },
  { t: 15533, position: { y: -3.3799901008605957 }, inputs: { verticalCollision: true } },
  { t: 15534 },
  { t: 15535 },
  { t: 15536 },
  { t: 15537 },
  { t: 15538 },
  { t: 15539 },
  { t: 15540 },
  { t: 15541 },
  { t: 15542 },
  { t: 15543 },
  { t: 15544 },
  { t: 15545 },
  { t: 15546 },
  { t: 15547 },
  { t: 15548 },
  { t: 15549 },
  { t: 15550 },
  { t: 15551 },
  { t: 15552 }
]

describe('physics: no_leather_powder_snow', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'no_leather_powder_snow', softFailures: true })
    h.runScenario({ name: 'no_leather_powder_snow', ticks: TICKS })
  })
})
