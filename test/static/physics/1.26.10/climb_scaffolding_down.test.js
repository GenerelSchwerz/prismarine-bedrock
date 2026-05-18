'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_climb_scaffolding_down
// Frames: 68  (ticks 6634..6701)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 6634, position: { x: 0.5000001788139343, y: 1.6200100183486938, z: 2504.357666015625 }, yaw: -158.3553924560547, pitch: -0.0000152587890625, headYaw: -158.3553924560547, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 6635 },
  { t: 6636 },
  { t: 6637 },
  { t: 6638 },
  { t: 6639 },
  { t: 6640, position: { x: 0.5, y: 9.620010375976562, z: 2500.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 6641, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 6642, position: { y: 9.470009803771973 }, delta: { y: -0.1470000147819519 }, inputs: { sneaking: true, sneakDown: true, wantDown: true, startSneaking: true, sneakPressedRaw: true, sneakCurrentRaw: true } },
  { t: 6643, position: { y: 9.3200101852417 }, inputs: { startSneaking: false, sneakPressedRaw: false } },
  { t: 6644, position: { y: 9.17000961303711 } },
  { t: 6645, position: { y: 9.020009994506836 } },
  { t: 6646, position: { y: 8.870009422302246 } },
  { t: 6647, position: { y: 8.720009803771973 } },
  { t: 6648, position: { y: 8.570009231567383 } },
  { t: 6649, position: { y: 8.42000961303711 } },
  { t: 6650, position: { y: 8.27000904083252 } },
  { t: 6651, position: { y: 8.120009422302246 } },
  { t: 6652, position: { y: 7.970008850097656 } },
  { t: 6653, position: { y: 7.820008754730225 } },
  { t: 6654, position: { y: 7.670008659362793 } },
  { t: 6655, position: { y: 7.520008563995361 } },
  { t: 6656, position: { y: 7.37000846862793 } },
  { t: 6657, position: { y: 7.220008373260498 } },
  { t: 6658, position: { y: 7.070008277893066 } },
  { t: 6659, position: { y: 6.920008182525635 } },
  { t: 6660, position: { y: 6.770008087158203 } },
  { t: 6661, position: { y: 6.6200079917907715 } },
  { t: 6662, position: { y: 6.47000789642334 } },
  { t: 6663, position: { y: 6.320007801055908 } },
  { t: 6664, position: { y: 6.170007705688477 } },
  { t: 6665, position: { y: 6.020007610321045 } },
  { t: 6666, position: { y: 5.870007514953613 } },
  { t: 6667, position: { y: 5.720007419586182 } },
  { t: 6668, position: { y: 5.57000732421875 } },
  { t: 6669, position: { y: 5.420007228851318 } },
  { t: 6670, position: { y: 5.270007133483887 } },
  { t: 6671, position: { y: 5.120007038116455 } },
  { t: 6672, position: { y: 4.970006942749023 } },
  { t: 6673, position: { y: 4.820006847381592 } },
  { t: 6674, position: { y: 4.67000675201416 } },
  { t: 6675, position: { y: 4.5200066566467285 } },
  { t: 6676, position: { y: 4.370006561279297 } },
  { t: 6677, position: { y: 4.220006465911865 } },
  { t: 6678, position: { y: 4.070006370544434 } },
  { t: 6679, position: { y: 3.920006275177002 } },
  { t: 6680, position: { y: 3.7700061798095703 } },
  { t: 6681, position: { y: 3.6200063228607178 } },
  { t: 6682, position: { y: 3.473006248474121 }, delta: { y: -0.22246001660823822 }, inputs: { sneaking: false, sneakDown: false, wantDown: false, stopSneaking: true, sneakReleasedRaw: true, sneakCurrentRaw: false } },
  { t: 6683, position: { y: 3.250546455383301 }, delta: { y: -0.29641082882881165 }, inputs: { stopSneaking: false, sneakReleasedRaw: false } },
  { t: 6684, position: { y: 2.9541354179382324 }, delta: { y: -0.3688826262950897 } },
  { t: 6685, position: { y: 2.6200098991394043 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 6686 },
  { t: 6687 },
  { t: 6688 },
  { t: 6689 },
  { t: 6690 },
  { t: 6691 },
  { t: 6692 },
  { t: 6693 },
  { t: 6694 },
  { t: 6695 },
  { t: 6696, position: { y: 2.770009994506836 }, delta: { y: 0.06860000640153885 }, inputs: { jumpDown: true, jumping: true, wantUp: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 6697, position: { y: 2.9200100898742676 }, inputs: { jumpPressedRaw: false } },
  { t: 6698, position: { y: 3.07000994682312 } },
  { t: 6699, position: { y: 3.2200098037719727 } },
  { t: 6700, position: { y: 3.3700098991394043 } },
  { t: 6701, position: { y: 3.520009994506836 } }
]

describe('physics: climb_scaffolding_down', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'climb_scaffolding_down', softFailures: true })
    h.runScenario({ name: 'climb_scaffolding_down', ticks: TICKS })
  })
})
