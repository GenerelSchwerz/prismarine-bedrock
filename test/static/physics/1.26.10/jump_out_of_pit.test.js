'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_out_of_pit
// Frames: 28  (ticks 10604..10631)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 10604, position: { x: 5.699999809265137, y: -3.3799901008605957, z: 500.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246, z: 0 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 10605 },
  { t: 10606 },
  { t: 10607 },
  { t: 10608 },
  { t: 10609 },
  { t: 10610, position: { x: -0.5, y: -2.3799901008605957 }, yaw: 0, delta: { y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 10611, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 10612, position: { y: -2.458390235900879 }, delta: { y: -0.1552319973707199 } },
  { t: 10613, position: { y: -2.6136221885681152 }, delta: { y: -0.2305273562669754 }, inputs: { jumpReleasedRaw: true, jumpPressedRaw: true } },
  { t: 10614, position: { y: -2.844149589538574 }, delta: { y: -0.30431681871414185 }, inputs: { jumpReleasedRaw: false, jumpPressedRaw: false } },
  { t: 10615, position: { y: -3.1484665870666504 }, delta: { y: -0.3766304850578308 } },
  { t: 10616, position: { y: -3.3799901008605957 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 10617 },
  { t: 10618 },
  { t: 10619 },
  { t: 10620 },
  { t: 10621 },
  { t: 10622 },
  { t: 10623 },
  { t: 10624 },
  { t: 10625 },
  { t: 10626 },
  { t: 10627 },
  { t: 10628 },
  { t: 10629 },
  { t: 10630 },
  { t: 10631, position: { x: -0.5979999899864197 }, moveVector: { x: -1 }, delta: { x: -0.053508009761571884 }, inputs: { right: true } }
]

describe('physics: jump_out_of_pit', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_out_of_pit', softFailures: true })
    h.runScenario({ name: 'jump_out_of_pit', ticks: TICKS })
  })
})
