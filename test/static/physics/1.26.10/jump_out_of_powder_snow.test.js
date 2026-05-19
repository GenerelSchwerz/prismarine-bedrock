'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_out_of_powder_snow
// Frames: 67  (ticks 9404..9470)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 9404, position: { x: 0.5000007152557373, y: -3.3799901008605957, z: 1595.537353515625 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 9405 },
  { t: 9406 },
  { t: 9407 },
  { t: 9408 },
  { t: 9409 },
  { t: 9410, position: { x: 0.5, y: -0.37998998165130615, z: 1600.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 9411, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 9412, position: { y: -0.49758994579315186 }, inputs: { jumpDown: true, jumping: true, wantUp: true, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 9413, position: { y: -0.6151899099349976 }, inputs: { jumpPressedRaw: false } },
  { t: 9414, position: { y: -0.7327898740768433 } },
  { t: 9415, position: { y: -0.850389838218689 } },
  { t: 9416, position: { y: -0.9679898023605347 } },
  { t: 9417, position: { y: -1.0855897665023804 } },
  { t: 9418, position: { y: -1.203189730644226 } },
  { t: 9419, position: { y: -1.3207896947860718 } },
  { t: 9420, position: { y: -1.4383896589279175 } },
  { t: 9421, position: { y: -1.5559896230697632 } },
  { t: 9422, position: { y: -1.6735895872116089 } },
  { t: 9423, position: { y: -1.7911895513534546 } },
  { t: 9424, position: { y: -1.9087895154953003 } },
  { t: 9425, position: { y: -2.0263895988464355 } },
  { t: 9426, position: { y: -2.1439895629882812 } },
  { t: 9427, position: { y: -2.261589527130127 } },
  { t: 9428, position: { y: -2.3791894912719727 } },
  { t: 9429, position: { y: -2.4967894554138184 } },
  { t: 9430, position: { y: -2.614389419555664 } },
  { t: 9431, position: { y: -2.7319893836975098 } },
  { t: 9432, position: { y: -2.8495893478393555 } },
  { t: 9433, position: { y: -2.967189311981201 } },
  { t: 9434, position: { y: -3.084789276123047 } },
  { t: 9435, position: { y: -3.2023892402648926 } },
  { t: 9436, position: { y: -3.3199892044067383 } },
  { t: 9437, position: { y: -3.3799901008605957 }, inputs: { verticalCollision: true } },
  { t: 9438, position: { y: -2.7499899864196777 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9439, position: { y: -2.8675899505615234 }, inputs: { startJumping: false } },
  { t: 9440, position: { y: -2.985189914703369 } },
  { t: 9441, position: { y: -3.102789878845215 } },
  { t: 9442, position: { y: -3.2203898429870605 } },
  { t: 9443, position: { y: -3.3379898071289062 } },
  { t: 9444, position: { y: -3.3799901008605957 }, inputs: { verticalCollision: true } },
  { t: 9445 },
  { t: 9446 },
  { t: 9447 },
  { t: 9448, position: { y: -2.7499899864196777 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9449, position: { y: -2.8675899505615234 }, inputs: { startJumping: false } },
  { t: 9450, position: { y: -2.985189914703369 } },
  { t: 9451, position: { y: -3.102789878845215 } },
  { t: 9452, position: { y: -3.2203898429870605 } },
  { t: 9453, position: { y: -3.3379898071289062 }, inputs: { jumpDown: false, jumping: false, wantUp: false, jumpReleasedRaw: true, jumpCurrentRaw: false } },
  { t: 9454, position: { y: -3.3799901008605957 }, inputs: { verticalCollision: true, jumpReleasedRaw: false } },
  { t: 9455 },
  { t: 9456 },
  { t: 9457 },
  { t: 9458 },
  { t: 9459 },
  { t: 9460 },
  { t: 9461 },
  { t: 9462 },
  { t: 9463 },
  { t: 9464 },
  { t: 9465 },
  { t: 9466 },
  { t: 9467 },
  { t: 9468 },
  { t: 9469 },
  { t: 9470 }
]

describe('physics: jump_out_of_powder_snow', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_out_of_powder_snow', softFailures: true })
    h.runScenario({ name: 'jump_out_of_powder_snow', ticks: TICKS })
  })
})
