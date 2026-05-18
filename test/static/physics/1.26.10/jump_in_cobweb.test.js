'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_in_cobweb
// Frames: 57  (ticks 8932..8988)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8932, position: { x: 0.5616905689239502, y: 6.059987545013428, z: 1400.847900390625 }, yaw: -10.394073486328125, pitch: 17.92974853515625, headYaw: -10.394073486328125, moveVector: { z: 1 }, delta: { y: -0.07840000092983246 }, inputs: { up: true, blockBreakingDelayEnabled: true, jumpReleasedRaw: true } },
  { t: 8933, position: { x: 0.5628398656845093, y: 6.05606746673584, z: 1400.8541259765625 }, inputs: { jumpReleasedRaw: false } },
  { t: 8934, position: { x: 0.5639891028404236, y: 6.052147388458252, z: 1400.8603515625 } },
  { t: 8935, position: { x: 0.5651383399963379, y: 6.048227310180664, z: 1400.8665771484375 } },
  { t: 8936, position: { x: 0.5662875771522522, y: 6.044307231903076, z: 1400.872802734375 } },
  { t: 8937, position: { x: 0.5, y: 4.620009899139404, z: 1400.5 }, yaw: 0, pitch: 0, moveVector: { z: 0.30000001192092896 }, delta: { y: 0 }, inputs: { sneaking: true, sneakDown: true, wantDown: true, stopSprinting: true, startSneaking: true, handledTeleport: true, sneakPressedRaw: true, sneakCurrentRaw: true } },
  { t: 8938, position: { z: 1400.50146484375 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { stopSprinting: false, startSneaking: false, handledTeleport: false, sneakPressedRaw: false } },
  { t: 8939, position: { y: 4.616089820861816, z: 1400.5029296875 } },
  { t: 8940, position: { y: 4.6121697425842285, z: 1400.50439453125 }, inputs: { jumpDown: true, jumping: true, wantUp: true, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 8941, position: { y: 4.608249664306641, z: 1400.505859375 }, inputs: { jumpPressedRaw: false } },
  { t: 8942, position: { y: 4.604329586029053, z: 1400.50732421875 } },
  { t: 8943, position: { y: 4.600409507751465, z: 1400.5087890625 } },
  { t: 8944, position: { y: 4.596489429473877, z: 1400.51025390625 } },
  { t: 8945, position: { y: 4.592569351196289, z: 1400.51171875 } },
  { t: 8946, position: { y: 4.588649272918701, z: 1400.51318359375 } },
  { t: 8947, position: { y: 4.584729194641113, z: 1400.5146484375 } },
  { t: 8948, position: { y: 4.580809116363525, z: 1400.51611328125 } },
  { t: 8949, position: { y: 4.5768890380859375, z: 1400.517578125 }, inputs: { sneaking: false, sneakDown: false, wantDown: false, stopSneaking: true, sneakReleasedRaw: true, sneakCurrentRaw: false } },
  { t: 8950, position: { y: 4.57296895980835, z: 1400.5224609375 }, moveVector: { z: 1 }, inputs: { stopSneaking: false, sneakReleasedRaw: false } },
  { t: 8951, position: { y: 4.569048881530762, z: 1400.52734375 } },
  { t: 8952, position: { y: 4.565128803253174, z: 1400.5322265625 } },
  { t: 8953, position: { y: 4.561208724975586, z: 1400.537109375 } },
  { t: 8954, position: { y: 4.557288646697998, z: 1400.54345703125 }, inputs: { sprintDown: true, sprinting: true, startSprinting: true } },
  { t: 8955, position: { y: 4.55336856842041, z: 1400.5498046875 }, inputs: { startSprinting: false } },
  { t: 8956, position: { y: 4.549448490142822, z: 1400.55615234375 } },
  { t: 8957, position: { y: 4.545528411865234, z: 1400.5625 } },
  { t: 8958, position: { y: 4.5416083335876465, z: 1400.56884765625 } },
  { t: 8959, position: { y: 4.537688255310059, z: 1400.5751953125 } },
  { t: 8960, position: { y: 4.533768177032471, z: 1400.58154296875 }, pitch: -0.2598419189453125 },
  { t: 8961, position: { y: 4.529848098754883, z: 1400.587890625 } },
  { t: 8962, position: { y: 4.525928020477295, z: 1400.59423828125 } },
  { t: 8963, position: { y: 4.522007942199707, z: 1400.6005859375 } },
  { t: 8964, position: { y: 4.518087863922119, z: 1400.60693359375 } },
  { t: 8965, position: { y: 4.514167785644531, z: 1400.61328125 } },
  { t: 8966, position: { y: 4.510247707366943, z: 1400.61962890625 } },
  { t: 8967, position: { y: 4.5063276290893555, z: 1400.6259765625 }, inputs: { sprintDown: false, sprinting: false } },
  { t: 8968, position: { y: 4.502407550811768, z: 1400.63232421875 } },
  { t: 8969, position: { y: 4.49848747253418, z: 1400.638671875 } },
  { t: 8970, position: { y: 4.494567394256592, z: 1400.64501953125 }, inputs: { jumpDown: false, jumping: false, wantUp: false, jumpReleasedRaw: true, jumpCurrentRaw: false } },
  { t: 8971, position: { y: 4.490647315979004, z: 1400.6513671875 }, inputs: { jumpReleasedRaw: false } },
  { t: 8972, position: { y: 4.486727237701416, z: 1400.65771484375 } },
  { t: 8973, position: { y: 4.482807159423828, z: 1400.6640625 } },
  { t: 8974, position: { y: 4.47888708114624, z: 1400.67041015625 } },
  { t: 8975, position: { y: 4.474967002868652, z: 1400.6767578125 } },
  { t: 8976, position: { y: 4.4710469245910645, z: 1400.68310546875 } },
  { t: 8977, position: { y: 4.467126846313477, z: 1400.689453125 } },
  { t: 8978, position: { y: 4.463206768035889, z: 1400.69091796875 }, moveVector: { z: 0.30000001192092896 }, inputs: { sneaking: true, sneakDown: true, wantDown: true, stopSprinting: true, startSneaking: true, sneakPressedRaw: true, sneakCurrentRaw: true } },
  { t: 8979, position: { y: 4.459286689758301, z: 1400.6923828125 }, inputs: { stopSprinting: false, startSneaking: false, sneakPressedRaw: false } },
  { t: 8980, position: { y: 4.455366611480713, z: 1400.69384765625 } },
  { t: 8981, position: { y: 4.451446533203125, z: 1400.6953125 } },
  { t: 8982, position: { y: 4.447526454925537, z: 1400.69677734375 } },
  { t: 8983, position: { y: 4.443606376647949, z: 1400.6982421875 } },
  { t: 8984, position: { y: 4.439686298370361, z: 1400.69970703125 } },
  { t: 8985, position: { y: 4.435766220092773, z: 1400.701171875 } },
  { t: 8986, position: { y: 4.4318461418151855, z: 1400.70263671875 } },
  { t: 8987, position: { y: 4.427926063537598, z: 1400.7041015625 }, inputs: { sneaking: false, sneakDown: false, wantDown: false, stopSneaking: true, sneakReleasedRaw: true, sneakCurrentRaw: false } },
  { t: 8988, position: { y: 4.42400598526001, z: 1400.708984375 }, moveVector: { z: 1 }, inputs: { stopSneaking: false, sneakReleasedRaw: false } }
]

describe('physics: jump_in_cobweb', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_in_cobweb', softFailures: true })
    h.runScenario({ name: 'jump_in_cobweb', ticks: TICKS })
  })
})
