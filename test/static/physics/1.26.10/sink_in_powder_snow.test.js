'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_sink_in_powder_snow
// Frames: 77  (ticks 9489..9565)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 9489, position: { x: 0.5, y: -3.3799901008605957, z: 1600.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 9490 },
  { t: 9491 },
  { t: 9492 },
  { t: 9493, position: { y: -0.37998998165130615 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 9494, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 9495, position: { y: -0.49758994579315186 } },
  { t: 9496, position: { y: -0.6151899099349976 } },
  { t: 9497, position: { y: -0.7327898740768433 } },
  { t: 9498, position: { y: -0.850389838218689 } },
  { t: 9499, position: { y: -0.9679898023605347 } },
  { t: 9500, position: { y: -1.0855897665023804 } },
  { t: 9501, position: { y: -1.203189730644226 } },
  { t: 9502, position: { y: -1.3207896947860718 } },
  { t: 9503, position: { y: -1.4383896589279175 } },
  { t: 9504, position: { y: -1.5559896230697632 } },
  { t: 9505, position: { y: -1.6735895872116089 } },
  { t: 9506, position: { y: -1.7911895513534546 } },
  { t: 9507, position: { y: -1.9087895154953003 } },
  { t: 9508, position: { y: -2.0263895988464355 } },
  { t: 9509, position: { y: -2.1439895629882812 } },
  { t: 9510, position: { y: -2.261589527130127 } },
  { t: 9511, position: { y: -2.3791894912719727 } },
  { t: 9512, position: { y: -2.4967894554138184 } },
  { t: 9513, position: { y: -2.614389419555664 } },
  { t: 9514, position: { y: -2.7319893836975098 } },
  { t: 9515, position: { y: -2.8495893478393555 } },
  { t: 9516, position: { y: -2.967189311981201 } },
  { t: 9517, position: { y: -3.084789276123047 } },
  { t: 9518, position: { y: -3.2023892402648926 } },
  { t: 9519, position: { y: -3.3199892044067383 } },
  { t: 9520, position: { y: -3.3799901008605957 }, inputs: { verticalCollision: true } },
  { t: 9521 },
  { t: 9522 },
  { t: 9523 },
  { t: 9524 },
  { t: 9525 },
  { t: 9526 },
  { t: 9527 },
  { t: 9528 },
  { t: 9529 },
  { t: 9530 },
  { t: 9531 },
  { t: 9532 },
  { t: 9533 },
  { t: 9534 },
  { t: 9535 },
  { t: 9536 },
  { t: 9537 },
  { t: 9538 },
  { t: 9539 },
  { t: 9540 },
  { t: 9541 },
  { t: 9542 },
  { t: 9543 },
  { t: 9544 },
  { t: 9545 },
  { t: 9546 },
  { t: 9547 },
  { t: 9548 },
  { t: 9549 },
  { t: 9550 },
  { t: 9551 },
  { t: 9552 },
  { t: 9553 },
  { t: 9554 },
  { t: 9555 },
  { t: 9556 },
  { t: 9557 },
  { t: 9558 },
  { t: 9559 },
  { t: 9560 },
  { t: 9561 },
  { t: 9562 },
  { t: 9563 },
  { t: 9564 },
  { t: 9565 }
]

describe('physics: sink_in_powder_snow', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'sink_in_powder_snow', softFailures: true })
    h.runScenario({ name: 'sink_in_powder_snow', ticks: TICKS })
  })
})
