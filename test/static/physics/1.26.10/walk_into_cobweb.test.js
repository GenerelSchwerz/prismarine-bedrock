'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_walk_into_cobweb
// Frames: 67  (ticks 8713..8779)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8713, position: { x: 0.5000008940696716, y: 2.8693480491638184, z: 1395.0576171875 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, moveVector: { z: 1 }, delta: { y: -0.07840000092983246 }, inputs: { jumpDown: true, sprintDown: true, jumping: true, up: true, wantUp: true, sprinting: true, blockBreakingDelayEnabled: true, jumpCurrentRaw: true } },
  { t: 8714, position: { y: 2.8654279708862305, z: 1395.06396484375 } },
  { t: 8715, position: { y: 2.8615078926086426, z: 1395.0703125 } },
  { t: 8716, position: { y: 2.857588052749634, z: 1395.07666015625 } },
  { t: 8717, position: { x: 0.5, y: 1.6200100183486938, z: 1392.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 8718, position: { z: 1392.50634765625 }, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 8719, position: { z: 1392.5318603515625 }, delta: { z: 0.02318679913878441 }, inputs: { verticalCollision: true } },
  { t: 8720, position: { x: 0.5000000596046448, y: 2.0400099754333496, z: 1392.8824462890625 }, delta: { y: 0.33319997787475586, z: 0.19142040610313416 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 8721, position: { y: 2.3732099533081055, z: 1393.099365234375 }, delta: { y: 0.2481359988451004, z: 0.19737938046455383 }, inputs: { startJumping: false } },
  { t: 8722, position: { x: 0.5000001192092896, y: 2.6213459968566895, z: 1393.322265625 }, delta: { y: 0.16477328538894653, z: 0.20280204713344574 } },
  { t: 8723, position: { y: 2.7861194610595703, z: 1393.550537109375 }, delta: { y: 0.0830778256058693, z: 0.20773667097091675 } },
  { t: 8724, position: { y: 2.869197130203247, z: 1393.7838134765625 }, delta: { y: 0.0030162709299474955, z: 0.21222718060016632 } },
  { t: 8725, position: { y: 2.872213363647461, z: 1394.021484375 }, delta: { y: -0.0754440575838089, z: 0.21631354093551636 } },
  { t: 8726, position: { y: 2.796769142150879, z: 1394.2633056640625 }, delta: { y: -0.15233518183231354, z: 0.22003212571144104 } },
  { t: 8727, position: { y: 2.6444339752197266, z: 1394.5087890625 }, delta: { y: -0.2276884764432907, z: 0.2234160453081131 } },
  { t: 8728, position: { y: 2.416745662689209, z: 1394.7576904296875 }, delta: { y: -0.3015347123146057, z: 0.2264954149723053 } },
  { t: 8729, position: { y: 2.4016687870025635, z: 1394.8206787109375 }, delta: { y: -0.07840000092983246, z: 0 } },
  { t: 8730, position: { y: 2.3977489471435547, z: 1394.8270263671875 } },
  { t: 8731, position: { y: 2.393828868865967, z: 1394.8333740234375 } },
  { t: 8732, position: { y: 2.389908790588379, z: 1394.8397216796875 } },
  { t: 8733, position: { y: 2.385988712310791, z: 1394.8460693359375 } },
  { t: 8734, position: { y: 2.382068634033203, z: 1394.8524169921875 } },
  { t: 8735, position: { y: 2.3781487941741943, z: 1394.8587646484375 } },
  { t: 8736, position: { y: 2.3742287158966064, z: 1394.8651123046875 } },
  { t: 8737, position: { y: 2.3703086376190186, z: 1394.8714599609375 } },
  { t: 8738, position: { y: 2.3663887977600098, z: 1394.8778076171875 } },
  { t: 8739, position: { y: 2.362468719482422, z: 1394.8841552734375 } },
  { t: 8740, position: { y: 2.358548641204834, z: 1394.8905029296875 } },
  { t: 8741, position: { y: 2.354628562927246, z: 1394.8968505859375 } },
  { t: 8742, position: { y: 2.350708484649658, z: 1394.9031982421875 } },
  { t: 8743, position: { y: 2.3467886447906494, z: 1394.9095458984375 } },
  { t: 8744, position: { y: 2.3428685665130615, z: 1394.9158935546875 } },
  { t: 8745, position: { y: 2.3389484882354736, z: 1394.9222412109375 } },
  { t: 8746, position: { y: 2.335028648376465, z: 1394.9285888671875 } },
  { t: 8747, position: { y: 2.331108570098877, z: 1394.9349365234375 } },
  { t: 8748, position: { y: 2.327188491821289, z: 1394.9412841796875 } },
  { t: 8749, position: { y: 2.323268413543701, z: 1394.9476318359375 } },
  { t: 8750, position: { y: 2.3193483352661133, z: 1394.9539794921875 } },
  { t: 8751, position: { y: 2.3154284954071045, z: 1394.9603271484375 } },
  { t: 8752, position: { y: 2.3115084171295166, z: 1394.9666748046875 } },
  { t: 8753, position: { y: 2.3075883388519287, z: 1394.9730224609375 } },
  { t: 8754, position: { y: 2.30366849899292, z: 1394.9793701171875 } },
  { t: 8755, position: { y: 2.299748420715332, z: 1394.9857177734375 } },
  { t: 8756, position: { y: 2.295828342437744, z: 1394.9920654296875 } },
  { t: 8757, position: { y: 2.2919082641601562, z: 1394.9984130859375 } },
  { t: 8758, position: { y: 2.2879881858825684, z: 1395.0047607421875 } },
  { t: 8759, position: { y: 2.2840683460235596, z: 1395.0111083984375 } },
  { t: 8760, position: { y: 2.2801482677459717, z: 1395.0174560546875 } },
  { t: 8761, position: { y: 2.276228189468384, z: 1395.0238037109375 } },
  { t: 8762, position: { y: 2.272308349609375 }, moveVector: { z: 0 }, inputs: { up: false, stopSprinting: true } },
  { t: 8763, position: { y: 2.268388271331787 }, inputs: { stopSprinting: false } },
  { t: 8764, position: { y: 2.264468193054199 } },
  { t: 8765, position: { y: 2.2605481147766113 } },
  { t: 8766, position: { y: 2.2566280364990234 } },
  { t: 8767, position: { y: 2.2527081966400146 } },
  { t: 8768, position: { y: 2.2487881183624268 } },
  { t: 8769, position: { y: 2.244868040084839 } },
  { t: 8770, position: { y: 2.24094820022583 } },
  { t: 8771, position: { y: 2.237028121948242 } },
  { t: 8772, position: { y: 2.2331080436706543 } },
  { t: 8773, position: { y: 2.2291879653930664 } },
  { t: 8774, position: { y: 2.2252678871154785 } },
  { t: 8775, position: { y: 2.2213480472564697 } },
  { t: 8776, position: { y: 2.217427968978882 } },
  { t: 8777, position: { y: 2.213507890701294 } },
  { t: 8778, position: { y: 2.209588050842285 } },
  { t: 8779, position: { y: 2.2056679725646973 } }
]

describe('physics: walk_into_cobweb', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walk_into_cobweb', softFailures: true })
    h.runScenario({ name: 'walk_into_cobweb', ticks: TICKS })
  })
})
