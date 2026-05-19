'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_fall_onto_honey
// Frames: 79  (ticks 3954..4032)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 3954, position: { x: -0.20756787061691284, y: 2.13401198387146, z: 1102.1817626953125 }, yaw: 64.96284484863281, pitch: -0.779541015625, headYaw: 64.96284484863281, delta: { y: -0.07188002020120621 }, inputs: { jumpDown: true, jumping: true, sneaking: true, sneakDown: true, wantUp: true, wantDown: true, blockBreakingDelayEnabled: true, jumpCurrentRaw: true, sneakCurrentRaw: true } },
  { t: 3955, position: { y: 2.062131881713867 }, headYaw: 64.44314575195312, delta: { y: -0.14884242415428162 } },
  { t: 3956, position: { y: 1.9132895469665527 }, yaw: 64.443115234375, headYaw: 64.443115234375, delta: { y: -0.22426557540893555 } },
  { t: 3957, position: { y: 1.6890239715576172 }, delta: { y: -0.2981802523136139 } },
  { t: 3958, position: { x: 0.5, y: 21.620010375976562, z: 1100.5 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 3959, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 3960, position: { y: 21.541610717773438 }, delta: { y: -0.1552319973707199 } },
  { t: 3961, position: { y: 21.38637924194336 }, delta: { y: -0.2305273562669754 } },
  { t: 3962, position: { y: 21.155851364135742 }, delta: { y: -0.30431681871414185 } },
  { t: 3963, position: { y: 20.851533889770508 }, delta: { y: -0.3766304850578308 } },
  { t: 3964, position: { y: 20.474903106689453 }, delta: { y: -0.4474978744983673 } },
  { t: 3965, position: { y: 20.02740478515625 }, delta: { y: -0.5169479250907898 } },
  { t: 3966, position: { y: 19.510456085205078 }, delta: { y: -0.585008978843689 } },
  { t: 3967, position: { y: 18.925447463989258 }, delta: { y: -0.6517087817192078 } },
  { t: 3968, position: { y: 18.273738861083984 }, delta: { y: -0.7170746326446533 } },
  { t: 3969, position: { y: 17.556663513183594 }, delta: { y: -0.7811331152915955 } },
  { t: 3970, position: { y: 16.775531768798828 }, delta: { y: -0.8439104557037354 }, inputs: { jumpDown: false, jumping: false, wantUp: false, jumpReleasedRaw: true, jumpCurrentRaw: false } },
  { t: 3971, position: { y: 15.931621551513672 }, delta: { y: -0.9054322242736816 }, inputs: { sneaking: false, sneakDown: false, wantDown: false, stopSneaking: true, jumpReleasedRaw: false, sneakReleasedRaw: true, sneakCurrentRaw: false } },
  { t: 3972, position: { y: 15.026189804077148 }, delta: { y: -0.9657235741615295 }, inputs: { stopSneaking: false, sneakReleasedRaw: false } },
  { t: 3973, position: { y: 14.060465812683105 }, delta: { y: -1.0248091220855713 } },
  { t: 3974, position: { y: 13.035656929016113 }, delta: { y: -1.082713007926941 } },
  { t: 3975, position: { y: 11.952943801879883 }, delta: { y: -1.1394587755203247 } },
  { t: 3976, position: { y: 10.813485145568848 }, delta: { y: -1.195069670677185 } },
  { t: 3977, position: { y: 9.618414878845215 }, delta: { y: -1.2495683431625366 } },
  { t: 3978, position: { y: 8.368846893310547 }, delta: { y: -1.3029770851135254 } },
  { t: 3979, position: { y: 7.065869331359863 }, delta: { y: -1.3553175926208496 } },
  { t: 3980, position: { y: 5.710551738739014 }, delta: { y: -1.4066113233566284 } },
  { t: 3981, position: { y: 4.303940296173096 }, delta: { y: -1.4568791389465332 } },
  { t: 3982, position: { y: 2.8470611572265625 }, delta: { y: -1.5061416625976562 } },
  { t: 3983, position: { y: 1.6200100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 3984 },
  { t: 3985 },
  { t: 3986 },
  { t: 3987 },
  { t: 3988 },
  { t: 3989 },
  { t: 3990 },
  { t: 3991 },
  { t: 3992 },
  { t: 3993 },
  { t: 3994 },
  { t: 3995 },
  { t: 3996 },
  { t: 3997 },
  { t: 3998 },
  { t: 3999 },
  { t: 4000 },
  { t: 4001 },
  { t: 4002 },
  { t: 4003, position: { z: 1100.5413818359375 }, moveVector: { z: 1 }, delta: { z: 0.012511244975030422 }, inputs: { up: true } },
  { t: 4004, position: { z: 1100.59521484375 }, delta: { z: 0.016297336667776108 } },
  { t: 4005, position: { z: 1100.65283203125 }, delta: { z: 0.017443064600229263 } },
  { t: 4006, position: { z: 1100.711669921875 }, delta: { z: 0.017789779230952263 } },
  { t: 4007, position: { x: 0.5000000596046448, z: 1100.770751953125 }, delta: { z: 0.017894700169563293 } },
  { t: 4008, position: { z: 1100.8299560546875 }, delta: { z: 0.017926450818777084 } },
  { t: 4009, position: { y: 1.8720099925994873, z: 1100.8892822265625 }, delta: { y: 0.16856001317501068, z: 0.043148718774318695 }, inputs: { jumpDown: true, jumping: true, wantUp: true, startJumping: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 4010, position: { y: 2.040570020675659, z: 1100.9520263671875 }, delta: { y: 0.08678881824016571, z: 0.057101331651210785 }, inputs: { startJumping: false, jumpPressedRaw: false } },
  { t: 4011, position: { y: 2.127358913421631, z: 1101.0286865234375 }, delta: { y: 0.006653043907135725, z: 0.06979820877313614 } },
  { t: 4012, position: { y: 2.13401198387146, z: 1101.1180419921875 }, delta: { y: -0.07188002020120621, z: 0.0813523679971695 } },
  { t: 4013, position: { y: 2.062131881713867, z: 1101.218994140625 }, delta: { y: -0.14884242415428162, z: 0.09186666458845139 } },
  { t: 4014, position: { x: 0.5000001192092896, y: 1.9132895469665527, z: 1101.3304443359375 }, delta: { y: -0.22426557540893555, z: 0.10143466293811798 } },
  { t: 4015, position: { y: 1.6890239715576172, z: 1101.4515380859375 }, delta: { y: -0.2981802523136139, z: 0.11014155298471451 } },
  { t: 4016, position: { y: 1.6200100183486938, z: 1101.581298828125 }, delta: { y: -0.07840000092983246, z: 0.04907717928290367 }, inputs: { verticalCollision: true } },
  { t: 4017, position: { z: 1101.6717529296875 }, delta: { z: 0.02736273966729641 } },
  { t: 4018, position: { z: 1101.740478515625 }, delta: { z: 0.02079162374138832 } },
  { t: 4019, position: { y: 1.8720099925994873, z: 1101.8026123046875 }, delta: { y: 0.16856001317501068, z: 0.045234564691782 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 4020, position: { y: 2.040570020675659, z: 1101.867431640625 }, delta: { y: 0.08678881824016571, z: 0.05899945646524429 }, inputs: { startJumping: false } },
  { t: 4021, position: { y: 2.127358913421631, z: 1101.946044921875 }, delta: { y: 0.006653043907135725, z: 0.07152550667524338 } },
  { t: 4022, position: { y: 2.13401198387146, z: 1102.0372314453125 }, delta: { y: -0.07188002020120621, z: 0.08292420953512192 } },
  { t: 4023, position: { x: 0.5000001788139343, y: 2.062131881713867, z: 1102.1397705078125 }, delta: { y: -0.14884242415428162, z: 0.09329702705144882 } },
  { t: 4024, position: { y: 1.9132895469665527, z: 1102.252685546875 }, delta: { y: -0.22426557540893555, z: 0.10273629426956177 } },
  { t: 4025, position: { y: 1.6890239715576172, z: 1102.375 }, delta: { y: -0.2981802523136139, z: 0.11132603138685226 } },
  { t: 4026, position: { y: 1.6200100183486938, z: 1102.5059814453125 }, delta: { y: -0.07840000092983246, z: 0.04952523112297058 }, inputs: { verticalCollision: true } },
  { t: 4027, position: { z: 1102.5968017578125 }, delta: { z: 0.02749832533299923 } },
  { t: 4028, position: { z: 1102.6656494140625 }, delta: { z: 0.02083265222609043 } },
  { t: 4029, position: { y: 1.8720099925994873, z: 1102.727783203125 }, delta: { y: 0.16856001317501068, z: 0.04526443034410477 }, inputs: { startJumping: true, verticalCollision: false } },
  { t: 4030, position: { x: 0.5000002384185791, y: 2.040570020675659, z: 1102.7926025390625 }, delta: { y: 0.08678881824016571, z: 0.059026628732681274 }, inputs: { startJumping: false } },
  { t: 4031, position: { y: 2.127358913421631, z: 1102.8712158203125 }, headYaw: 3.118194580078125, delta: { y: 0.006653043907135725, z: 0.07155023515224457 } },
  { t: 4032, position: { x: 0.4945613145828247, y: 2.13401198387146, z: 1102.9615478515625 }, yaw: 16.110748291015625, pitch: 0.7795562744140625, headYaw: 21.827468872070312, delta: { x: -0.0049493988044559956, y: -0.07188002020120621, z: 0.08224625140428543 } }
]

describe('physics: fall_onto_honey', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'fall_onto_honey', softFailures: true })
    h.runScenario({ name: 'fall_onto_honey', ticks: TICKS })
  })
})
