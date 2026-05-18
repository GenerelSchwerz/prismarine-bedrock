'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_walk_into_berry_bush
// Frames: 71  (ticks 9119..9189)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 9119, position: { x: 0.9114403128623962, y: 1.9350099563598633, z: 1496.5555419921875 }, yaw: -20.78814697265625, pitch: 5.456878662109375, headYaw: -20.78814697265625, moveVector: { z: 1 }, delta: { y: -0.07840000092983246 }, inputs: { jumpDown: true, jumping: true, up: true, wantUp: true, startJumping: true, blockBreakingDelayEnabled: true, jumpCurrentRaw: true } },
  { t: 9120, position: { x: 0.9170053601264954, y: 1.8762099742889404, z: 1496.5701904296875 }, inputs: { startJumping: false } },
  { t: 9121, position: { x: 0.9225704073905945, y: 1.8174099922180176, z: 1496.5848388671875 } },
  { t: 9122, position: { x: 0.9281354546546936, y: 1.7586100101470947, z: 1496.5994873046875 } },
  { t: 9123, position: { x: 0.5, y: 1.6200100183486938, z: 1492.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 9124, position: { z: 1492.515625 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 9125, position: { z: 1492.5352783203125 }, delta: { z: 0.01783600077033043 }, inputs: { verticalCollision: true } },
  { t: 9126, position: { x: 0.5000000596046448, z: 1492.651123046875 }, delta: { z: 0.0632464662194252 } },
  { t: 9127, position: { x: 0.5000001192092896, z: 1492.8123779296875 }, delta: { z: 0.08804059028625488 } },
  { t: 9128, position: { x: 0.5000001788139343, z: 1492.9984130859375 }, delta: { z: 0.10157817602157593 } },
  { t: 9129, position: { x: 0.5000002384185791, y: 2.0400099754333496, z: 1493.197998046875 }, delta: { y: 0.33319997787475586, z: 0.10896969586610794 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9130, position: { y: 2.3732099533081055, z: 1493.3265380859375 }, delta: { y: 0.2481359988451004, z: 0.11699842661619186 }, inputs: { startJumping: false } },
  { t: 9131, position: { y: 2.6213459968566895, z: 1493.463134765625 }, delta: { y: 0.16477328538894653, z: 0.12430457025766373 } },
  { t: 9132, position: { x: 0.5000002980232239, y: 2.7861194610595703, z: 1493.6070556640625 }, delta: { y: 0.0830778256058693, z: 0.13095316290855408 } },
  { t: 9133, position: { y: 2.869197130203247, z: 1493.757568359375 }, delta: { y: 0.0030162709299474955, z: 0.13700339198112488 } },
  { t: 9134, position: { y: 2.872213363647461, z: 1493.9141845703125 }, delta: { y: -0.0754440575838089, z: 0.1425090879201889 } },
  { t: 9135, position: { y: 2.796769142150879, z: 1494.0762939453125 }, delta: { y: -0.15233518183231354, z: 0.1475192755460739 } },
  { t: 9136, position: { y: 2.6444339752197266, z: 1494.243408203125 }, delta: { y: -0.2276884764432907, z: 0.1520785540342331 } },
  { t: 9137, position: { y: 2.416745662689209, z: 1494.4150390625 }, delta: { y: -0.3015347123146057, z: 0.1562274992465973 } },
  { t: 9138, position: { y: 2.115211009979248, z: 1494.5908203125 }, headYaw: 0.519683837890625, delta: { y: -0.3739040195941925, z: 0.16000303626060486 } },
  { t: 9139, position: { x: 0.4998225271701813, y: 1.7413069009780884, z: 1494.7703857421875 }, yaw: 0.519683837890625, delta: { x: -0.00016177377256099135, y: -0.4448259472846985, z: 0.16343803703784943 } },
  { t: 9140, position: { x: 0.4995509088039398, y: 1.6200100183486938, z: 1494.9168701171875 }, delta: { x: 0, y: -0.07840000092983246, z: 0 }, inputs: { verticalCollision: true } },
  { t: 9141, position: { x: 0.4988398253917694, y: 1.9350099563598633, z: 1494.9952392578125 }, headYaw: 0.7795257568359375, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9142, position: { x: 0.4986265003681183, y: 1.8762099742889404, z: 1495.0108642578125 }, yaw: 0.7795257568359375, headYaw: 1.299224853515625, inputs: { startJumping: false } },
  { t: 9143, position: { x: 0.4982709586620331, y: 1.8174099922180176, z: 1495.0264892578125 }, yaw: 1.299224853515625 },
  { t: 9144, position: { x: 0.4979154169559479, y: 1.7586100101470947, z: 1495.0421142578125 } },
  { t: 9145, position: { x: 0.49755990505218506, y: 1.6998100280761719, z: 1495.0577392578125 } },
  { t: 9146, position: { x: 0.49720436334609985, y: 1.641010046005249, z: 1495.0733642578125 } },
  { t: 9147, position: { x: 0.49684882164001465, y: 1.6200100183486938, z: 1495.0889892578125 }, inputs: { verticalCollision: true } },
  { t: 9148, position: { x: 0.4950711727142334, z: 1495.1673583984375 } },
  { t: 9149, position: { x: 0.49329355359077454, z: 1495.2457275390625 } },
  { t: 9150, position: { x: 0.4915159344673157, z: 1495.3240966796875 } },
  { t: 9151, position: { x: 0.4897382855415344, y: 1.9350099563598633, z: 1495.4024658203125 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9152, position: { x: 0.4893827438354492, y: 1.8762099742889404, z: 1495.4180908203125 }, inputs: { startJumping: false } },
  { t: 9153, position: { x: 0.489027202129364, y: 1.8174099922180176, z: 1495.4337158203125 } },
  { t: 9154, position: { x: 0.4886716902256012, y: 1.7586100101470947, z: 1495.4493408203125 } },
  { t: 9155, position: { x: 0.488316148519516, y: 1.6998100280761719, z: 1495.4649658203125 } },
  { t: 9156, position: { x: 0.4879606068134308, y: 1.641010046005249, z: 1495.4805908203125 } },
  { t: 9157, position: { x: 0.48760509490966797, y: 1.6200100183486938, z: 1495.4962158203125 }, inputs: { verticalCollision: true } },
  { t: 9158, position: { x: 0.4858274459838867, z: 1495.5745849609375 } },
  { t: 9159, position: { x: 0.48404979705810547, z: 1495.6529541015625 } },
  { t: 9160, position: { x: 0.4822721779346466, z: 1495.7313232421875 } },
  { t: 9161, position: { x: 0.48049455881118774, y: 1.9350099563598633, z: 1495.8096923828125 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9162, position: { x: 0.48013901710510254, y: 1.8762099742889404, z: 1495.8253173828125 }, inputs: { startJumping: false } },
  { t: 9163, position: { x: 0.47978347539901733, y: 1.8174099922180176, z: 1495.8409423828125 } },
  { t: 9164, position: { x: 0.47942793369293213, y: 1.7586100101470947, z: 1495.8565673828125 }, headYaw: 4.6772918701171875 },
  { t: 9165, position: { x: 0.4770900011062622, y: 1.6998100280761719, z: 1495.8720703125 }, yaw: 8.575042724609375, headYaw: 9.874298095703125 },
  { t: 9166, position: { x: 0.47440105676651, y: 1.641010046005249, z: 1495.8875732421875 }, yaw: 9.874282836914062, headYaw: 10.39398193359375 },
  { t: 9167, position: { x: 0.4712231755256653, y: 1.6200100183486938, z: 1495.9029541015625 }, yaw: 11.6932373046875, headYaw: 12.992507934570312, inputs: { verticalCollision: true } },
  { t: 9168, position: { x: 0.4511810541152954, z: 1495.978759765625 }, yaw: 14.81146240234375, headYaw: 16.370574951171875 },
  { t: 9169, position: { x: 0.42908409237861633, z: 1496.053955078125 }, yaw: 16.370590209960938, headYaw: 19.488800048828125 },
  { t: 9170, position: { x: 0.4012589752674103, z: 1496.127197265625 }, yaw: 20.788055419921875, headYaw: 25.465377807617188 },
  { t: 9171, position: { x: 0.36754968762397766, y: 1.9350099563598633, z: 1496.197998046875 }, yaw: 25.465362548828125, headYaw: 29.103286743164062, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9172, position: { y: 1.8762099742889404 }, yaw: 31.182098388671875, headYaw: 31.182098388671875, moveVector: { z: 0 }, inputs: { up: false, startJumping: false } },
  { t: 9173, position: { y: 1.8174099922180176 } },
  { t: 9174, position: { y: 1.7586100101470947 } },
  { t: 9175, position: { y: 1.6998100280761719 } },
  { t: 9176, position: { y: 1.641010046005249 }, headYaw: 31.701797485351562 },
  { t: 9177, position: { y: 1.6200100183486938 }, yaw: 31.701812744140625, headYaw: 31.961669921875, inputs: { verticalCollision: true } },
  { t: 9178, yaw: 31.961669921875 },
  { t: 9179, headYaw: 32.48136901855469 },
  { t: 9180, yaw: 32.48138427734375, headYaw: 32.48138427734375 },
  { t: 9181, position: { y: 1.9350099563598633 }, headYaw: 33.00108337402344, inputs: { startJumping: true, verticalCollision: false } },
  { t: 9182, position: { y: 1.8762099742889404 }, yaw: 33.00108337402344, headYaw: 33.26092529296875, inputs: { startJumping: false } },
  { t: 9183, position: { y: 1.8174099922180176 }, yaw: 33.26092529296875 },
  { t: 9184, position: { y: 1.7586100101470947 } },
  { t: 9185, position: { y: 1.6998100280761719 }, headYaw: 33.7806396484375 },
  { t: 9186, position: { y: 1.641010046005249 }, yaw: 33.78065490722656, headYaw: 33.78065490722656 },
  { t: 9187, position: { y: 1.6200100183486938 }, inputs: { verticalCollision: true } },
  { t: 9188 },
  { t: 9189 }
]

describe('physics: walk_into_berry_bush', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walk_into_berry_bush', softFailures: true })
    h.runScenario({ name: 'walk_into_berry_bush', ticks: TICKS })
  })
})
