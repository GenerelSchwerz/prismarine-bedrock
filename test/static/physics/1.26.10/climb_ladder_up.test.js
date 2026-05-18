'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_climb_ladder_up
// Frames: 62  (ticks 6279..6340)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 6279, position: { x: 0.3806239664554596, y: 1.6200100183486938, z: 1296.0869140625 }, yaw: 3.118194580078125, headYaw: 3.118194580078125, delta: { x: -1.1896898399754718e-7, y: -0.07840000092983246, z: 0.000002187177642554161 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 6280, position: { x: 0.38062384724617004 }, delta: { x: 0, z: 0.0000011941991715502809 } },
  { t: 6281, delta: { z: 6.520328383885499e-7 } },
  { t: 6282, delta: { z: 3.56009962843018e-7 } },
  { t: 6283, position: { x: 0.5, y: 2.6200098991394043, z: 1300.5 }, yaw: 0, delta: { x: 0, y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 6284, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 6285, position: { y: 2.541609764099121 }, delta: { y: -0.1552319973707199 } },
  { t: 6286, position: { y: 2.3863778114318848 }, delta: { y: -0.2305273562669754 } },
  { t: 6287, position: { y: 2.155850410461426, z: 1300.5196533203125 }, moveVector: { z: 1 }, delta: { y: -0.30431681871414185, z: 0.01783600077033043 }, inputs: { up: true } },
  { t: 6288, position: { y: 1.8515336513519287, z: 1300.55712890625 }, delta: { y: -0.3766304850578308, z: 0.034066762775182724 } },
  { t: 6289, position: { y: 1.6200100183486938, z: 1300.61083984375 }, delta: { y: -0.07840000092983246, z: 0.048836756497621536 }, inputs: { verticalCollision: true } },
  { t: 6290, position: { x: 0.5000000596046448, z: 1300.7576904296875 }, delta: { z: 0.08017288148403168 } },
  { t: 6291, position: { x: 0.5000001192092896, z: 1300.9359130859375 }, delta: { z: 0.09728240966796875 } },
  { t: 6292, position: { x: 0.5000001788139343, z: 1301.1312255859375 }, delta: { z: 0.10662420839071274 } },
  { t: 6293, position: { x: 0.5000002384185791, z: 1301.3358154296875 }, delta: { z: 0.11172483116388321 } },
  { t: 6294, position: { x: 0.5000002980232239, z: 1301.5455322265625 }, delta: { z: 0.11450977623462677 } },
  { t: 6295, position: { x: 0.5000003576278687, z: 1301.758056640625 }, delta: { z: 0.11603035032749176 } },
  { t: 6296, position: { x: 0.5000004172325134, z: 1301.9720458984375 }, delta: { z: 0.11686059087514877 } },
  { t: 6297, position: { x: 0.5000004768371582, z: 1302.1868896484375 }, delta: { z: 0.11731389164924622 } },
  { t: 6298, position: { x: 0.500000536441803, z: 1302.4022216796875 }, delta: { z: 0.11756139993667603 } },
  { t: 6299, position: { x: 0.5000005960464478, z: 1302.6177978515625 }, delta: { z: 0.11769653856754303 } },
  { t: 6300, position: { x: 0.5000006556510925, z: 1302.83349609375 }, delta: { z: 0.11777032911777496 } },
  { t: 6301, position: { x: 0.5000007152557373, z: 1303.04931640625 }, delta: { z: 0.11781061440706253 } },
  { t: 6302, position: { x: 0.5000007748603821, z: 1303.26513671875 }, delta: { z: 0.11783261597156525 } },
  { t: 6303, position: { x: 0.5000008344650269, z: 1303.48095703125 }, delta: { z: 0.11784462630748749 } },
  { t: 6304, position: { x: 0.5000008940696716, z: 1303.69677734375 }, delta: { z: 0.11785118281841278 } },
  { t: 6305, position: { x: 0.5000009536743164, z: 1303.91259765625 }, delta: { z: 0.1178547590970993 } },
  { t: 6306, position: { x: 0.5000010132789612, z: 1304.12841796875 }, delta: { z: 0.1178567111492157 } },
  { t: 6307, position: { x: 0.500001072883606, z: 1304.34423828125 }, delta: { z: 0.11785778403282166 } },
  { t: 6308, position: { x: 0.5000011324882507, z: 1304.512451171875 }, delta: { y: 0.20000000298023224, z: 0 }, inputs: { horizontalCollision: true } },
  { t: 6309, position: { x: 0.5000011920928955, y: 1.8200100660324097 }, inputs: { verticalCollision: false } },
  { t: 6310, position: { y: 2.020009994506836 } },
  { t: 6311, position: { x: 0.5000012516975403, y: 2.2200100421905518 } },
  { t: 6312, position: { y: 2.4200100898742676 } },
  { t: 6313, position: { y: 2.6200098991394043 } },
  { t: 6314, position: { y: 2.820010185241699 } },
  { t: 6315, position: { y: 3.020009994506836 } },
  { t: 6316, position: { y: 3.220010280609131 } },
  { t: 6317, position: { y: 3.4200100898742676 } },
  { t: 6318, position: { x: 0.5000013113021851, y: 3.6200103759765625 } },
  { t: 6319, position: { y: 3.820010185241699 } },
  { t: 6320, position: { y: 4.020010471343994 } },
  { t: 6321, position: { y: 4.220010280609131 } },
  { t: 6322, position: { y: 4.420010566711426 } },
  { t: 6323, position: { y: 4.6200103759765625 } },
  { t: 6324, position: { y: 4.820010662078857 } },
  { t: 6325, position: { y: 5.020010471343994 } },
  { t: 6326, position: { y: 5.220010757446289 } },
  { t: 6327, position: { y: 5.420010566711426 }, moveVector: { z: 0 }, delta: { y: 0.11760000884532928 }, inputs: { up: false, horizontalCollision: false } },
  { t: 6328, position: { y: 5.5376105308532715 }, delta: { y: 0.03684801235795021 }, inputs: { sneaking: true, sneakDown: true, wantDown: true, startSneaking: true, sneakPressedRaw: true, sneakCurrentRaw: true } },
  { t: 6329, position: { y: 5.574458599090576 }, delta: { y: -0.042288947850465775 }, inputs: { startSneaking: false, sneakPressedRaw: false } },
  { t: 6330, delta: { y: -0.07840000092983246 } },
  { t: 6331 },
  { t: 6332 },
  { t: 6333 },
  { t: 6334 },
  { t: 6335 },
  { t: 6336 },
  { t: 6337 },
  { t: 6338 },
  { t: 6339 },
  { t: 6340, position: { y: 5.774458408355713 }, delta: { y: 0.11760000884532928 }, inputs: { jumpDown: true, jumping: true, wantUp: true, jumpPressedRaw: true, jumpCurrentRaw: true } }
]

describe('physics: climb_ladder_up', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'climb_ladder_up', softFailures: true })
    h.runScenario({ name: 'climb_ladder_up', ticks: TICKS })
  })
})
