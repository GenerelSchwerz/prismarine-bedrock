'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_wall_sprint_air
// Frames: 43  (ticks 2009..2051)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 2009, position: { x: -0.2999999523162842, y: 1.6200100183486938, z: 1907.6156005859375 }, yaw: -147.80360412597656, pitch: 1.5590667724609375, headYaw: -147.80360412597656, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 2010 },
  { t: 2011, yaw: -147.80361938476562, headYaw: -147.80361938476562 },
  { t: 2012, yaw: -147.80360412597656, headYaw: -147.80360412597656 },
  { t: 2013, yaw: -147.80361938476562, headYaw: -147.80361938476562 },
  { t: 2014, position: { x: -2.5, z: 1907.5 }, yaw: -90, pitch: 0, headYaw: -147.80360412597656, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 2015, headYaw: -90, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 2016, inputs: { verticalCollision: true } },
  { t: 2017, position: { x: -2.172600030899048, y: 2.0400099754333496 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, moveVector: { z: 1 }, delta: { x: 0.17876040935516357, y: 0.33319997787475586, z: 0 }, inputs: { jumpDown: true, sprintDown: true, jumping: true, up: true, wantUp: true, sprinting: true, startSprinting: true, startJumping: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 2018, position: { x: -1.9683597087860107, y: 2.3732099533081055 }, delta: { x: 0.18585878610610962, y: 0.2481359988451004 }, inputs: { jumpDown: false, jumping: false, wantUp: false, startSprinting: false, startJumping: false, jumpReleasedRaw: true, jumpPressedRaw: false, jumpCurrentRaw: false } },
  { t: 2019, position: { x: -1.7570209503173828, y: 2.6213459968566895 }, yaw: -90, headYaw: -90, delta: { x: 0.19231830537319183, y: 0.16477328538894653 }, inputs: { jumpReleasedRaw: false } },
  { t: 2020, position: { x: -1.5392224788665771, y: 2.7861194610595703 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { x: 0.19819647073745728, y: 0.0830778256058693 } },
  { t: 2021, position: { x: -1.3155460357666016, y: 2.869197130203247 }, delta: { x: 0.20354560017585754, y: 0.0030162709299474955 } },
  { t: 2022, position: { x: -1.0865204334259033, y: 2.872213363647461 }, yaw: -90, headYaw: -90, delta: { x: 0.20841330289840698, y: -0.0754440575838089 } },
  { t: 2023, position: { x: -0.8526272177696228, y: 2.796769142150879 }, delta: { x: 0.2128429114818573, y: -0.15233518183231354 } },
  { t: 2024, position: { x: -0.6143043041229248, y: 2.6444339752197266 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { x: 0.21687385439872742, y: -0.2276884764432907 } },
  { t: 2025, position: { x: -0.3719504475593567, y: 2.416745662689209 }, yaw: -90, headYaw: -90, delta: { x: 0.22054201364517212, y: -0.3015347123146057 } },
  { t: 2026, position: { x: -0.30000001192092896, y: 2.115211009979248 }, delta: { x: 0, y: -0.3739040195941925 }, inputs: { horizontalCollision: true } },
  { t: 2027, position: { y: 1.7413069009780884 }, delta: { y: -0.4448259472846985 } },
  { t: 2028, position: { y: 1.6200100183486938 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { y: -0.07840000092983246 }, inputs: { stopSprinting: true, verticalCollision: true } },
  { t: 2029, yaw: -90, headYaw: -90, inputs: { startSprinting: true } },
  { t: 2030, yaw: -90.00000762939453, headYaw: -92.33866882324219 },
  { t: 2031, position: { z: 1907.4915771484375 }, yaw: -94.93719482421875, pitch: 0.51971435546875, headYaw: -102.47288513183594, delta: { z: -0.00460509629920125 } },
  { t: 2032, position: { z: 1907.4658203125 }, yaw: -102.47288513183594, pitch: 1.0394134521484375, headYaw: -110.26842498779297, delta: { z: -0.014070913195610046 } },
  { t: 2033, position: { z: 1907.4075927734375 }, yaw: -116.76467895507812, headYaw: -119.88289642333984, delta: { z: -0.031778838485479355 } },
  { t: 2034, position: { z: 1907.3270263671875 }, yaw: -119.88289642333984, delta: { z: -0.044010479003190994 } },
  { t: 2035, position: { z: 1907.234130859375 }, delta: { z: -0.050688955932855606 } },
  { t: 2036, position: { z: 1907.1199951171875 }, yaw: -119.88288879394531, headYaw: -119.88288879394531, delta: { z: -0.06233316659927368 }, inputs: { stopSprinting: false } },
  { t: 2037, position: { z: 1906.994140625 }, yaw: -119.88289642333984, headYaw: -119.88289642333984, delta: { z: -0.06869091093540192 }, inputs: { startSprinting: false } },
  { t: 2038, position: { z: 1906.9254150390625 }, yaw: -119.88288879394531, headYaw: -119.88288879394531, moveVector: { z: 0 }, delta: { z: -0.037505242973566055 }, inputs: { sprintDown: false, up: false, sprinting: false, stopSprinting: true, horizontalCollision: false } },
  { t: 2039, position: { z: 1906.887939453125 }, delta: { z: -0.020477864891290665 }, inputs: { stopSprinting: false } },
  { t: 2040, position: { z: 1906.867431640625 }, yaw: -119.88289642333984, headYaw: -119.88289642333984, delta: { z: -0.011180915869772434 } },
  { t: 2041, position: { z: 1906.856201171875 }, yaw: -119.88288879394531, headYaw: -119.88288879394531, delta: { z: -0.006104780826717615 } },
  { t: 2042, position: { z: 1906.85009765625 }, yaw: -119.88288116455078, headYaw: -119.88288116455078, delta: { z: -0.003333210712298751 } },
  { t: 2043, position: { z: 1906.8468017578125 }, yaw: -119.88289642333984, headYaw: -119.88289642333984, delta: { z: -0.0018199332989752293 } },
  { t: 2044, position: { z: 1906.844970703125 }, yaw: -119.88288879394531, headYaw: -119.88288879394531, delta: { z: -0.0009936837013810873 } },
  { t: 2045, position: { z: 1906.843994140625 }, delta: { z: -0.0005425513372756541 } },
  { t: 2046, position: { z: 1906.843505859375 }, delta: { z: -0.0002962330763693899 } },
  { t: 2047, position: { z: 1906.84326171875 }, yaw: -119.88289642333984, headYaw: -119.88289642333984, delta: { z: -0.0001617432717466727 } },
  { t: 2048, position: { z: 1906.8431396484375 }, yaw: -119.88288116455078, headYaw: -119.88288116455078, delta: { z: -0.00008831183367874473 } },
  { t: 2049, position: { z: 1906.843017578125 }, yaw: -119.88290405273438, headYaw: -119.88290405273438, delta: { z: -0.00004821826587431133 } },
  { t: 2050, yaw: -119.88289642333984, headYaw: -119.88289642333984, delta: { z: -0.000026327175874030218 } },
  { t: 2051, yaw: -119.88288879394531, headYaw: -119.88288879394531, delta: { z: -0.000014374639249581378 } }
]

describe('physics: wall_sprint_air', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'wall_sprint_air', softFailures: true })
    h.runScenario({ name: 'wall_sprint_air', ticks: TICKS })
  })
})
