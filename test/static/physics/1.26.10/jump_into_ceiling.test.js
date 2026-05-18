'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_into_ceiling
// Frames: 23  (ticks 3120..3142)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 3120, position: { x: 0.5, y: 1.6200100183486938, z: 2388.5 }, yaw: 1.299285888671875, pitch: 17.410079956054688, headYaw: 1.299285888671875, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 3121 },
  { t: 3122 },
  { t: 3123 },
  { t: 3124 },
  { t: 3125 },
  { t: 3126, position: { x: -4.5, z: 2395.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 3127, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 3128, position: { y: 1.8200100660324097 }, inputs: { jumpDown: true, jumping: true, wantUp: true, startJumping: true, verticalCollision: true, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 3129, position: { y: 1.741610050201416 }, delta: { y: -0.1552319973707199 }, inputs: { jumpDown: false, jumping: false, wantUp: false, startJumping: false, verticalCollision: false, jumpReleasedRaw: true, jumpPressedRaw: false, jumpCurrentRaw: false } },
  { t: 3130, position: { y: 1.6200100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true, jumpReleasedRaw: false } },
  { t: 3131 },
  { t: 3132 },
  { t: 3133 },
  { t: 3134 },
  { t: 3135 },
  { t: 3136 },
  { t: 3137 },
  { t: 3138 },
  { t: 3139 },
  { t: 3140 },
  { t: 3141 },
  { t: 3142 }
]

describe('physics: jump_into_ceiling', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_into_ceiling', softFailures: true })
    h.runScenario({ name: 'jump_into_ceiling', ticks: TICKS })
  })
})
