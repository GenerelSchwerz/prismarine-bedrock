'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_over_airborne_wall
// Frames: 53  (ticks 2205..2257)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 2205, position: { x: -11.877645492553711, y: 1.6200100183486938, z: 1894.699951171875 }, yaw: -22.606964111328125, pitch: 1.55914306640625, headYaw: -22.606964111328125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 2206 },
  { t: 2207 },
  { t: 2208 },
  { t: 2209 },
  { t: 2210 },
  { t: 2211, position: { x: -7.5, z: 1907.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 2212, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 2213, position: { z: 1907.5980224609375 }, moveVector: { z: 1 }, delta: { z: 0.053508009761571884 }, inputs: { up: true, verticalCollision: true } },
  { t: 2214, position: { z: 1907.74951171875 }, delta: { z: 0.08272338658571243 } },
  { t: 2215, position: { z: 1907.93017578125 }, delta: { z: 0.09867499023675919 } },
  { t: 2216, position: { z: 1908.1268310546875 }, delta: { z: 0.1073845624923706 } },
  { t: 2217, position: { z: 1908.332275390625 }, delta: { z: 0.1121399849653244 } },
  { t: 2218, position: { z: 1908.5423583984375 }, delta: { z: 0.11473644524812698 } },
  { t: 2219, position: { z: 1908.755126953125 }, delta: { z: 0.11615411937236786 } },
  { t: 2220, position: { z: 1908.96923828125 }, delta: { z: 0.11692816764116287 } },
  { t: 2221, position: { z: 1909.1842041015625 }, delta: { z: 0.11735080182552338 } },
  { t: 2222, position: { z: 1909.3995361328125 }, delta: { z: 0.1175815537571907 } },
  { t: 2223, position: { y: 2.0400099754333496, z: 1909.6151123046875 }, delta: { y: 0.33319997787475586, z: 0.11770755052566528 }, inputs: { jumpDown: true, jumping: true, wantUp: true, startJumping: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 2224, position: { y: 2.3732099533081055, z: 1909.699951171875 }, delta: { y: 0.2481359988451004, z: 0 }, inputs: { jumpDown: false, jumping: false, wantUp: false, startJumping: false, horizontalCollision: true, jumpReleasedRaw: true, jumpPressedRaw: false, jumpCurrentRaw: false } },
  { t: 2225, position: { y: 2.6213459968566895 }, delta: { y: 0.16477328538894653 }, inputs: { jumpReleasedRaw: false } },
  { t: 2226, position: { y: 2.7861194610595703 }, delta: { y: 0.0830778256058693 } },
  { t: 2227, position: { y: 2.869197130203247 }, delta: { y: 0.0030162709299474955 } },
  { t: 2228, position: { x: -7.50017786026001, y: 2.872213363647461 }, yaw: 0.519683837890625, headYaw: 4.9371490478515625, delta: { x: -0.00016177377256099135, y: -0.0754440575838089 } },
  { t: 2229, position: { x: -7.5067949295043945, y: 2.796769142150879 }, yaw: 19.228973388671875, headYaw: 25.725250244140625, delta: { x: -0.0060213967226445675, y: -0.15233518183231354 } },
  { t: 2230, position: { x: -7.5213236808776855, y: 2.6444339752197266 }, yaw: 25.725250244140625, headYaw: 30.922271728515625, delta: { x: -0.013221296481788158, y: -0.2276884764432907 } },
  { t: 2231, position: { x: -7.54461669921875, y: 2.416745662689209 }, yaw: 30.9222412109375, headYaw: 30.9222412109375, delta: { x: -0.021196842193603516, y: -0.3015347123146057 } },
  { t: 2232, position: { x: -7.57588529586792, y: 2.115211009979248 }, delta: { x: -0.02845459058880806, y: -0.3739040195941925 } },
  { t: 2233, position: { x: -7.6144118309021, y: 1.7413069009780884 }, delta: { x: -0.03505914285778999, y: -0.4448259472846985 } },
  { t: 2234, position: { x: -7.659543037414551, y: 1.6200100183486938 }, delta: { x: -0.041069284081459045, y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 2235, position: { x: -7.750971794128418 }, delta: { x: -0.0499202199280262 } },
  { t: 2236, position: { x: -7.851251602172852 }, headYaw: 31.701797485351562, delta: { x: -0.054752834141254425 } },
  { t: 2237, position: { x: -7.957503318786621 }, yaw: 31.701812744140625, pitch: 0.51971435546875, headYaw: 31.701812744140625, delta: { x: -0.0580134354531765 } },
  { t: 2238, position: { x: -8.067015647888184 }, delta: { x: -0.05979372188448906 } },
  { t: 2239, position: { x: -8.178308486938477 }, delta: { x: -0.06076575815677643 } },
  { t: 2240, position: { x: -8.290573120117188 }, delta: { x: -0.0612964890897274 } },
  { t: 2241, position: { x: -8.40336799621582 }, delta: { x: -0.06158626824617386 } },
  { t: 2242, position: { x: -8.51645278930664 }, delta: { x: -0.06174449250102043 } },
  { t: 2243, position: { x: -8.629695892333984 }, delta: { x: -0.061830878257751465 } },
  { t: 2244, position: { x: -8.691526412963867 }, yaw: 33.00108337402344, pitch: 1.0394134521484375, headYaw: 34.820037841796875, moveVector: { z: 0 }, delta: { x: -0.03375966474413872 }, inputs: { up: false, horizontalCollision: false } },
  { t: 2245, position: { x: -8.725286483764648 }, yaw: 34.820037841796875, delta: { x: -0.018432779237627983 } },
  { t: 2246, position: { x: -8.743719100952148 }, delta: { x: -0.010064298287034035 } },
  { t: 2247, position: { x: -8.7537841796875 }, delta: { x: -0.0054951077327132225 } },
  { t: 2248, position: { x: -8.759279251098633 }, delta: { x: -0.0030003292486071587 } },
  { t: 2249, position: { x: -8.762279510498047 }, delta: { x: -0.0016381799941882491 } },
  { t: 2250, position: { x: -8.763917922973633 }, delta: { x: -0.0008944463916122913 } },
  { t: 2251, position: { x: -8.764812469482422 }, delta: { x: -0.0004883678047917783 } },
  { t: 2252, position: { x: -8.765300750732422 }, delta: { x: -0.00026664885808713734 } },
  { t: 2253, position: { x: -8.765567779541016 }, delta: { x: -0.00014559029659722 } },
  { t: 2254, position: { x: -8.76571273803711 }, delta: { x: -0.00007949231076054275 } },
  { t: 2255, position: { x: -8.765792846679688 }, yaw: 34.820068359375, headYaw: 34.820068359375, delta: { x: -0.00004340280793257989 } },
  { t: 2256, position: { x: -8.765836715698242 }, yaw: 34.820037841796875, headYaw: 34.820037841796875, delta: { x: -0.000023697935830568895 } },
  { t: 2257, position: { x: -8.765859603881836 }, delta: { x: -0.000012939074622408953 } }
]

describe('physics: jump_over_airborne_wall', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_over_airborne_wall', softFailures: true })
    h.runScenario({ name: 'jump_over_airborne_wall', ticks: TICKS })
  })
})
