'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_walk_into_powder_snow
// Frames: 67  (ticks 9319..9385)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 9319, position: { x: 0.8479864597320557, y: 1.6200100183486938, z: 1594.3260498046875 }, yaw: -5.197021484375, pitch: 1.0394134521484375, headYaw: -5.197021484375, moveVector: { z: 1 }, delta: { x: 0.010675661265850067, y: -0.07840000092983246, z: 0.11737336963415146 }, inputs: { up: true, blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 9320, position: { x: 0.8675390481948853, z: 1594.541015625 }, delta: { x: 0.010675710625946522, z: 0.11737390607595444 } },
  { t: 9321, position: { x: 0.8870916962623596, z: 1594.7559814453125 }, delta: { x: 0.010675736702978611, z: 0.11737419664859772 } },
  { t: 9322, position: { x: 0.9046890735626221, z: 1594.949462890625 }, delta: { x: 0, z: 0 } },
  { t: 9323, position: { x: 0.9125927090644836, z: 1595.036376953125 } },
  { t: 9324, moveVector: { z: 0 }, inputs: { up: false } },
  { t: 9325 },
  { t: 9326 },
  { t: 9327, position: { x: 0.5, z: 1592.5 }, yaw: 0, pitch: 0, moveVector: { z: 1 }, delta: { y: 0.41999998688697815 }, inputs: { jumpDown: true, jumping: true, up: true, wantUp: true, startJumping: true, handledTeleport: true, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 9328, position: { x: 0.5000000596046448, y: 2.2500100135803223, z: 1592.5882568359375 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { startJumping: false, handledTeleport: false, verticalCollision: false, jumpPressedRaw: false } },
  { t: 9329, position: { y: 2.171609878540039, z: 1592.60791015625 }, delta: { y: -0.1552319973707199, z: 0.01783600077033043 } },
  { t: 9330, position: { y: 2.0163779258728027, z: 1592.6453857421875 }, delta: { y: -0.2305273562669754, z: 0.034066762775182724 } },
  { t: 9331, position: { y: 1.7858506441116333, z: 1592.6990966796875 }, delta: { y: -0.30431681871414185, z: 0.048836756497621536 } },
  { t: 9332, position: { y: 1.6200100183486938, z: 1592.767578125 }, delta: { y: -0.07840000092983246, z: 0.062277451157569885 }, inputs: { verticalCollision: true } },
  { t: 9333, position: { x: 0.5000001192092896, z: 1592.9278564453125 }, delta: { z: 0.08751150220632553 } },
  { t: 9334, position: { x: 0.5000001788139343, z: 1593.1134033203125 }, delta: { z: 0.1012892872095108 } },
  { t: 9335, position: { x: 0.5000002384185791, z: 1593.312744140625 }, delta: { z: 0.10881196707487106 } },
  { t: 9336, position: { x: 0.5000002980232239, z: 1593.51953125 }, delta: { z: 0.11291934549808502 } },
  { t: 9337, position: { x: 0.5000003576278687, y: 2.0400099754333496, z: 1593.73046875 }, delta: { y: 0.33319997787475586, z: 0.11516197770833969 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9338, position: { y: 2.3732099533081055, z: 1593.865234375 }, delta: { y: 0.2481359988451004, z: 0.12263339757919312 }, inputs: { startJumping: false } },
  { t: 9339, position: { x: 0.5000004172325134, y: 2.6213459968566895, z: 1594.0074462890625 }, delta: { y: 0.16477328538894653, z: 0.12943239510059357 } },
  { t: 9340, position: { y: 2.7861194610595703, z: 1594.156494140625 }, delta: { y: 0.0830778256058693, z: 0.13561949133872986 } },
  { t: 9341, position: { y: 2.869197130203247, z: 1594.311767578125 }, delta: { y: 0.0030162709299474955, z: 0.14124974608421326 } },
  { t: 9342, position: { y: 2.872213363647461, z: 1594.47265625 }, delta: { y: -0.0754440575838089, z: 0.14637327194213867 } },
  { t: 9343, position: { y: 2.796769142150879, z: 1594.638671875 }, delta: { y: -0.15233518183231354, z: 0.15103568136692047 } },
  { t: 9344, position: { y: 2.6444339752197266, z: 1594.809326171875 }, delta: { y: -0.2276884764432907, z: 0.15527847409248352 } },
  { t: 9345, position: { y: 2.302901268005371, z: 1594.9666748046875 }, delta: { y: -0.07840000092983246, z: 0 } },
  { t: 9346, position: { x: 0.5000004768371582, y: 2.1853013038635254, z: 1594.984375 } },
  { t: 9347, position: { y: 2.0677013397216797, z: 1595.0020751953125 } },
  { t: 9348, position: { y: 1.950101375579834, z: 1595.019775390625 } },
  { t: 9349, position: { y: 1.8325014114379883, z: 1595.0374755859375 } },
  { t: 9350, position: { y: 1.714901328086853, z: 1595.05517578125 } },
  { t: 9351, position: { y: 1.6200100183486938, z: 1595.0728759765625 }, inputs: { verticalCollision: true } },
  { t: 9352, position: { x: 0.500000536441803, y: 2.2500100135803223, z: 1595.157958984375 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9353, position: { y: 2.1324100494384766, z: 1595.1756591796875 }, inputs: { startJumping: false } },
  { t: 9354, position: { y: 2.014810085296631, z: 1595.193359375 } },
  { t: 9355, position: { y: 1.8972100019454956, z: 1595.2110595703125 } },
  { t: 9356, position: { x: 0.5000005960464478, y: 1.77961003780365, z: 1595.228759765625 } },
  { t: 9357, position: { y: 1.6620099544525146, z: 1595.2464599609375 } },
  { t: 9358, position: { y: 1.6200100183486938, z: 1595.26416015625 }, inputs: { verticalCollision: true } },
  { t: 9359, position: { x: 0.5000006556510925, z: 1595.34765625 } },
  { t: 9360, position: { x: 0.5000007152557373, y: 1.5024100542068481, z: 1595.43115234375 }, inputs: { verticalCollision: false } },
  { t: 9361, position: { y: 1.384809970855713, z: 1595.4488525390625 } },
  { t: 9362, position: { y: 1.2672100067138672, z: 1595.466552734375 } },
  { t: 9363, position: { y: 1.1496100425720215, z: 1595.4842529296875 } },
  { t: 9364, position: { y: 1.0320100784301758, z: 1595.501953125 } },
  { t: 9365, position: { y: 0.9144099950790405, z: 1595.5196533203125 } },
  { t: 9366, position: { y: 0.79680997133255, z: 1595.537353515625 } },
  { t: 9367, position: { y: 0.6792099475860596 }, moveVector: { z: 0 }, inputs: { up: false } },
  { t: 9368, position: { y: 0.5616099834442139 } },
  { t: 9369, position: { y: 0.44401001930236816 } },
  { t: 9370, position: { y: 0.32641005516052246 } },
  { t: 9371, position: { y: 0.20881009101867676 } },
  { t: 9372, position: { y: 0.09121012687683105 } },
  { t: 9373, position: { y: -0.02638983726501465 } },
  { t: 9374, position: { y: -0.14398980140686035 } },
  { t: 9375, position: { y: -0.26158976554870605 } },
  { t: 9376, position: { y: -0.37918972969055176 } },
  { t: 9377, position: { y: -0.496789813041687 } },
  { t: 9378, position: { y: -0.6143897771835327 } },
  { t: 9379, position: { y: -0.7319897413253784 } },
  { t: 9380, position: { y: -0.8495897054672241 } },
  { t: 9381, position: { y: -0.9671896696090698 } },
  { t: 9382, position: { y: -1.0847896337509155 } },
  { t: 9383, position: { y: -1.2023895978927612 } },
  { t: 9384, position: { y: -1.319989562034607 } },
  { t: 9385, position: { y: -1.4375895261764526 } }
]

describe('physics: walk_into_powder_snow', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walk_into_powder_snow', softFailures: true })
    h.runScenario({ name: 'walk_into_powder_snow', ticks: TICKS })
  })
})
