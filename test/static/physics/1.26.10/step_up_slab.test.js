'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_step_up_slab
// Frames: 42  (ticks 2752..2793)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 2752, position: { x: 0.5, y: 1.6200100183486938, z: 2288.5 }, yaw: -5.7167816162109375, pitch: 16.6304931640625, headYaw: -5.7167816162109375, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 2753 },
  { t: 2754 },
  { t: 2755 },
  { t: 2756, position: { x: -2.5, z: 2293.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 2757, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 2758, headYaw: 0.519683837890625, inputs: { verticalCollision: true } },
  { t: 2759, yaw: 1.81890869140625, pitch: 0.5196990966796875, headYaw: 3.1181793212890625 },
  { t: 2760, yaw: 3.118194580078125, pitch: 0.779541015625, headYaw: 4.417449951171875 },
  { t: 2761, position: { x: -2.511087656021118, z: 2293.597412109375 }, yaw: 6.4962615966796875, pitch: 1.2992401123046875, headYaw: 6.4962615966796875, moveVector: { z: 1 }, delta: { x: -0.00605380954220891, z: 0.05316444858908653 }, inputs: { up: true } },
  { t: 2762, position: { x: -2.528228998184204, z: 2293.748046875 }, delta: { x: -0.009359190240502357, z: 0.08219224214553833 } },
  { t: 2763, position: { x: -2.548675775527954, z: 2293.927490234375 }, delta: { x: -0.011163927614688873, z: 0.09804141521453857 } },
  { t: 2764, position: { x: -2.570927381515503, z: 2294.122802734375 }, delta: { x: -0.01214931532740593, z: 0.10669507086277008 } },
  { t: 2765, position: { x: -2.5941643714904785, z: 2294.326904296875 }, delta: { x: -0.012687336653470993, z: 0.11141996085643768 } },
  { t: 2766, position: { x: -2.6179392337799072, z: 2294.53564453125 }, pitch: 1.55908203125, delta: { x: -0.012981096282601357, z: 0.11399975419044495 } },
  { t: 2767, position: { x: -2.642007827758789, y: 2.1200098991394043, z: 2294.7470703125 }, delta: { x: -0.013141488656401634, z: 0.11540832370519638 } },
  { t: 2768, position: { x: -2.668001413345337, z: 2294.959716796875 }, yaw: 7.535675048828125, pitch: 2.5984954833984375, headYaw: 7.7955322265625, delta: { x: -0.014192481525242329, z: 0.1160588264465332 } },
  { t: 2769, position: { x: -2.696366548538208, z: 2295.1728515625 }, yaw: 8.31524658203125, pitch: 8.315231323242188, headYaw: 7.7955474853515625, delta: { x: -0.015487398020923138, z: 0.1163136214017868 } },
  { t: 2770, position: { x: -2.725146532058716, z: 2295.38623046875 }, yaw: 7.795562744140625, pitch: 10.913742065429688, headYaw: 7.53570556640625, delta: { x: -0.0157138854265213, z: 0.11652074754238129 } },
  { t: 2771, position: { x: -2.752830743789673, z: 2295.60009765625 }, yaw: 7.0159912109375, pitch: 12.992568969726562, headYaw: 7.0159912109375, delta: { x: -0.015115591697394848, z: 0.11672767996788025 } },
  { t: 2772, position: { x: -2.779916763305664, z: 2295.814208984375 }, pitch: 13.51226806640625, headYaw: 6.4962921142578125, delta: { x: -0.014788922853767872, z: 0.116840660572052 } },
  { t: 2773, position: { x: -2.8031399250030518, z: 2296.028564453125 }, yaw: 4.937164306640625, pitch: 15.591064453125, headYaw: 3.89776611328125, delta: { x: -0.012679820880293846, z: 0.11710447818040848 } },
  { t: 2774, position: { x: -2.821150541305542, z: 2296.243408203125 }, yaw: 3.118194580078125, pitch: 18.449432373046875, headYaw: 2.598480224609375, delta: { x: -0.009833799675107002, z: 0.11736783385276794 } },
  { t: 2775, position: { x: -2.8354272842407227, z: 2296.458740234375 }, yaw: 2.598480224609375, pitch: 19.48883056640625, headYaw: 1.818939208984375, delta: { x: -0.007795121055096388, z: 0.11753582954406738 } },
  { t: 2776, position: { x: -2.8463330268859863, y: 2.0416100025177, z: 2296.67431640625 }, yaw: 1.81890869140625, pitch: 20.008544921875, headYaw: 1.81890869140625, delta: { x: -0.005954513791948557, y: -0.1552319973707199, z: 0.11765561997890472 }, inputs: { verticalCollision: false } },
  { t: 2777, position: { x: -2.852909564971924, y: 1.8863780498504639, z: 2296.699951171875 }, pitch: 20.528244018554688, headYaw: 1.2992095947265625, delta: { x: -0.00598473334684968, y: -0.2305273562669754, z: 0 }, inputs: { horizontalCollision: true } },
  { t: 2778, position: { x: -2.8593387603759766, y: 1.6558506488800049 }, yaw: 1.299224853515625, pitch: 21.047927856445312, headYaw: 1.299224853515625, delta: { x: -0.0058505176566541195, y: -0.30431681871414185 } },
  { t: 2779, position: { x: -2.865633726119995, y: 1.6200100183486938 }, delta: { x: -0.005728381220251322, y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 2780, position: { x: -2.873584032058716 }, delta: { x: -0.00434092665091157 } },
  { t: 2781, position: { x: -2.877924919128418 }, yaw: 1.03936767578125, pitch: 21.04791259765625, headYaw: 0.5196685791015625, moveVector: { z: 0 }, delta: { x: -0.0023701463360339403 }, inputs: { up: false, horizontalCollision: false } },
  { t: 2782, position: { x: -2.8802950382232666 }, yaw: 0.5196533203125, pitch: 21.047927856445312, headYaw: 0.5196533203125, delta: { x: -0.0012941000750288367 } },
  { t: 2783, position: { x: -2.88158917427063 }, delta: { x: -0.0007065787212923169 } },
  { t: 2784, position: { x: -2.882295846939087 }, headYaw: -0.0000457763671875, delta: { x: -0.0003857920237351209 } },
  { t: 2785, position: { x: -2.8826816082000732 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { x: -0.000210642465390265 } },
  { t: 2786, position: { x: -2.88289213180542 }, yaw: -0.2598724365234375, headYaw: -0.779571533203125, delta: { x: -0.0001150108000729233 }, inputs: { sneaking: true, sneakDown: true, wantDown: true, startSneaking: true, sneakPressedRaw: true, sneakCurrentRaw: true } },
  { t: 2787, position: { x: -2.883007049560547 }, yaw: -0.77960205078125, pitch: 20.528228759765625, headYaw: -1.2993011474609375, delta: { x: -0.00006279590161284432 }, inputs: { startSneaking: false, sneakPressedRaw: false } },
  { t: 2788, position: { x: -2.882269859313965 }, yaw: -1.55914306640625, pitch: 20.008544921875, headYaw: -2.0788421630859375, moveVector: { z: 0.30000001192092896 }, delta: { x: 0.00040248045115731657 }, inputs: { up: true, horizontalCollision: true } },
  { t: 2789, position: { x: -2.8805344104766846 }, yaw: -2.5985565185546875, headYaw: -2.5985565185546875, delta: { x: 0.0009475353872403502 } },
  { t: 2790, position: { x: -2.878253936767578 }, pitch: 19.488845825195312, delta: { x: 0.0012451354414224625 } },
  { t: 2791, position: { x: -2.875542640686035, y: 2.0400099754333496 }, yaw: -2.8583984375, headYaw: -2.8583984375, delta: { x: 0.0014803416561335325, y: 0.33319997787475586 }, inputs: { jumpDown: true, jumping: true, wantUp: true, startJumping: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 2792, position: { x: -2.8737690448760986, y: 2.3732099533081055 }, pitch: 18.969146728515625, headYaw: -3.37811279296875, delta: { x: 0.0016139433719217777, y: 0.2481359988451004 }, inputs: { startJumping: false, jumpPressedRaw: false } },
  { t: 2793, position: { x: -2.8718085289001465, y: 2.6213459968566895, z: 2296.705810546875 }, yaw: -3.3781280517578125, headYaw: -3.3781280517578125, delta: { x: 0.001783986110240221, y: 0.16477328538894653, z: 0.005341502837836742 }, inputs: { horizontalCollision: false } }
]

describe('physics: step_up_slab', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'step_up_slab', softFailures: true })
    h.runScenario({ name: 'step_up_slab', ticks: TICKS })
  })
})
