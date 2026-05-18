'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_walk_into_pit
// Frames: 67  (ticks 10519..10585)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 10519, position: { x: 0.09857743233442307, y: 1.6200100183486938, z: 484.0069580078125 }, yaw: 26.764633178710938, headYaw: 26.764633178710938, delta: { x: 0, y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 10520 },
  { t: 10521 },
  { t: 10522 },
  { t: 10523 },
  { t: 10524 },
  { t: 10525, position: { x: 4.5, y: 2.6200098991394043, z: 500.5 }, yaw: 0, delta: { x: 0, y: 0 }, inputs: { handledTeleport: true } },
  { t: 10526, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 10527, position: { y: 2.541609764099121 }, delta: { y: -0.1552319973707199 } },
  { t: 10528, position: { x: 4.519599914550781, y: 2.3863778114318848 }, moveVector: { x: 1 }, delta: { x: 0.01783600077033043, y: -0.2305273562669754, z: 0 }, inputs: { left: true } },
  { t: 10529, position: { x: 4.55703592300415, y: 2.155850410461426 }, delta: { x: 0.034066762775182724, y: -0.30431681871414185 } },
  { t: 10530, position: { x: 4.6107025146484375, y: 1.8515336513519287 }, delta: { x: 0.048836756497621536, y: -0.3766304850578308 } },
  { t: 10531, position: { x: 4.679139137268066, y: 1.6200100183486938 }, delta: { x: 0.062277451157569885, y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 10532, position: { x: 4.83941650390625 }, delta: { x: 0.08751150220632553 } },
  { t: 10533, position: { x: 5.024928092956543 }, delta: { x: 0.1012892872095108 } },
  { t: 10534, position: { x: 5.224217414855957 }, delta: { x: 0.10881196707487106 } },
  { t: 10535, position: { x: 5.431029319763184 }, delta: { x: 0.11291934549808502 } },
  { t: 10536, position: { x: 5.641948699951172, y: 1.5416100025177002 }, delta: { x: 0.11516197770833969, y: -0.1552319973707199 }, inputs: { verticalCollision: false } },
  { t: 10537, position: { x: 5.699999809265137, y: 1.3863780498504639 }, delta: { x: 0, y: -0.2305273562669754 }, inputs: { horizontalCollision: true } },
  { t: 10538, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 10539, position: { y: 0.851533830165863 }, delta: { y: -0.3766304850578308 } },
  { t: 10540, position: { y: 0.4749033451080322 }, delta: { y: -0.4474978744983673 } },
  { t: 10541, position: { y: 0.027405500411987305 }, delta: { y: -0.5169479250907898 } },
  { t: 10542, position: { y: -0.4895423650741577 }, delta: { y: -0.585008978843689 } },
  { t: 10543, position: { y: -1.0745514631271362 }, delta: { y: -0.6517087817192078 } },
  { t: 10544, position: { y: -1.7262603044509888 }, delta: { y: -0.7170746326446533 } },
  { t: 10545, position: { y: -2.4433350563049316 }, delta: { y: -0.7811331152915955 } },
  { t: 10546, position: { y: -3.224468231201172 }, delta: { y: -0.8439104557037354 } },
  { t: 10547, position: { y: -3.3799901008605957 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 10548 },
  { t: 10549 },
  { t: 10550 },
  { t: 10551 },
  { t: 10552 },
  { t: 10553 },
  { t: 10554 },
  { t: 10555 },
  { t: 10556 },
  { t: 10557 },
  { t: 10558 },
  { t: 10559 },
  { t: 10560 },
  { t: 10561 },
  { t: 10562 },
  { t: 10563 },
  { t: 10564 },
  { t: 10565 },
  { t: 10566 },
  { t: 10567 },
  { t: 10568, moveVector: { x: 0 }, inputs: { left: false, horizontalCollision: false } },
  { t: 10569 },
  { t: 10570 },
  { t: 10571 },
  { t: 10572 },
  { t: 10573 },
  { t: 10574 },
  { t: 10575 },
  { t: 10576 },
  { t: 10577 },
  { t: 10578 },
  { t: 10579 },
  { t: 10580 },
  { t: 10581 },
  { t: 10582 },
  { t: 10583 },
  { t: 10584 },
  { t: 10585 }
]

describe('physics: walk_into_pit', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walk_into_pit', softFailures: true })
    h.runScenario({ name: 'walk_into_pit', ticks: TICKS })
  })
})
