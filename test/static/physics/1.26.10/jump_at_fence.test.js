'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_at_fence
// Frames: 48  (ticks 10329..10376)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 10329, position: { x: -9.5486421585083, y: 1.6200100183486938, z: 2189.6943359375 }, yaw: -0.2598419189453125, headYaw: -0.2598419189453125, moveVector: { x: 1 }, delta: { x: 0.11785545945167542, y: -0.07840000092983246, z: -0.0005302787758409977 }, inputs: { left: true, blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 10330, position: { x: -9.33278751373291, z: 2189.693359375 }, delta: { x: 0.11785654723644257, z: -0.0005321954376995564 } },
  { t: 10331, position: { x: -9.214930534362793, z: 2189.69287109375 }, moveVector: { x: 0 }, delta: { x: 0.06434968113899231, z: -0.0002905787550844252 }, inputs: { left: false } },
  { t: 10332, position: { x: -9.150580406188965, z: 2189.692626953125 }, delta: { x: 0.0351349301636219, z: -0.00015865602472331375 } },
  { t: 10333, position: { x: -9.115445137023926, z: 2189.6923828125 }, delta: { x: 0.019183674827218056, z: -0.00008662619802635163 }, inputs: { sprintDown: true, sprinting: true } },
  { t: 10334, position: { x: -9.096261024475098 }, headYaw: -0.5196990966796875, delta: { x: 0.010474287904798985, z: -0.000047297908167820424 } },
  { t: 10335, position: { x: -11.5, z: 2186.5 }, yaw: 0, headYaw: -2.5985260009765625, delta: { x: 0, y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 10336, yaw: -0.2598419189453125, headYaw: -0.779541015625, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 10337, yaw: -0.779571533203125, headYaw: -1.559112548828125, inputs: { verticalCollision: true } },
  { t: 10338, position: { x: -11.495378494262695, z: 2186.627197265625 }, yaw: -2.078826904296875, headYaw: -2.8583831787109375, moveVector: { z: 1 }, delta: { x: 0.0025232629850506783, z: 0.06951461732387543 }, inputs: { up: true, startSprinting: true, jumpReleasedRaw: true, jumpPressedRaw: true } },
  { t: 10339, position: { x: -11.486501693725586, z: 2186.823974609375 }, yaw: -2.858367919921875, headYaw: -3.378082275390625, delta: { x: 0.004846487659960985, z: 0.10742884874343872 }, inputs: { startSprinting: false, jumpReleasedRaw: false, jumpPressedRaw: false } },
  { t: 10340, position: { x: -11.472994804382324, z: 2187.05859375 }, yaw: -3.8978271484375, headYaw: -3.8978271484375, delta: { x: 0.0073747215792536736, z: 0.1280556619167328 } },
  { t: 10341, position: { x: -11.45695972442627, z: 2187.313720703125 }, delta: { x: 0.008755138143897057, z: 0.13931789994239807 } },
  { t: 10342, position: { x: -11.439544677734375, z: 2187.580078125 }, delta: { x: 0.009508845396339893, z: 0.14546708762645721 } },
  { t: 10343, position: { x: -11.421375274658203, z: 2187.8525390625 }, delta: { x: 0.009920368902385235, z: 0.148824542760849 } },
  { t: 10344, position: { x: -11.40279483795166, z: 2188.074951171875 }, delta: { x: 0.010145061649382114, z: 0 }, inputs: { horizontalCollision: true } },
  { t: 10345, position: { x: -11.383989334106445 }, delta: { x: 0.010267742909491062 } },
  { t: 10346, position: { x: -11.367059707641602 }, delta: { x: 0.009243526495993137 }, inputs: { stopSprinting: true } },
  { t: 10347, position: { x: -11.351154327392578 }, delta: { x: 0.008684303611516953 }, inputs: { startSprinting: true } },
  { t: 10348, position: { x: -11.335807800292969 }, delta: { x: 0.008378968574106693 } },
  { t: 10349, position: { x: -11.320767402648926 }, headYaw: -4.4175262451171875, delta: { x: 0.008212256245315075 } },
  { t: 10350, position: { x: -11.303678512573242 }, yaw: -5.19708251953125, headYaw: -6.496337890625, delta: { x: 0.009330748580396175 }, inputs: { sprintDown: false, sprinting: false, startSprinting: false, stopSprinting: false } },
  { t: 10351, position: { x: -11.279735565185547 }, yaw: -8.57513427734375, headYaw: -10.913787841796875, delta: { x: 0.0130729665979743 } },
  { t: 10352, position: { x: -11.24810791015625 }, yaw: -10.913787841796875, headYaw: -12.472900390625, delta: { x: 0.017268603667616844 } },
  { t: 10353, position: { x: -11.209673881530762 }, yaw: -12.472900390625, delta: { x: 0.020985201001167297 } },
  { t: 10354, position: { x: -11.167522430419922 }, delta: { x: 0.023014463484287262 } },
  { t: 10355, position: { x: -11.123342514038086 }, delta: { x: 0.024122441187500954 } },
  { t: 10356, position: { x: -11.078054428100586 }, delta: { x: 0.02472739666700363 } },
  { t: 10357, position: { x: -11.032160758972168, z: 2188.170654296875 }, delta: { x: 0.025057701393961906, z: 0.0522451251745224 }, inputs: { horizontalCollision: false } },
  { t: 10358, position: { x: -10.985937118530273, z: 2188.318603515625 }, delta: { x: 0.025238050147891045, z: 0.08077096939086914 } },
  { t: 10359, position: { x: -10.939533233642578, z: 2188.4951171875 }, delta: { x: 0.02533652074635029, z: 0.09634608030319214 } },
  { t: 10360, position: { x: -10.893031120300293, z: 2188.687255859375 }, delta: { x: 0.02539028413593769, z: 0.10485009104013443 } },
  { t: 10361, position: { x: -10.785013198852539, z: 2188.8447265625 }, moveVector: { x: 0.7071067690849304, z: 0.7071067690849304 }, delta: { x: 0.05897768959403038, z: 0.08601932972669601 }, inputs: { left: true } },
  { t: 10362, position: { x: -10.643407821655273, z: 2188.9833984375 }, delta: { x: 0.07731641829013824, z: 0.07573772966861725 } },
  { t: 10363, position: { x: -10.470404624938965, z: 2189.0380859375 }, moveVector: { x: 1, z: 0 }, delta: { x: 0.0944598913192749, z: 0.029796263203024864 }, inputs: { up: false } },
  { t: 10364, position: { x: -10.280257225036621, z: 2189.046630859375 }, delta: { x: 0.10382023453712463, z: 0.004712218418717384 } },
  { t: 10365, position: { x: -10.08074951171875, z: 2189.0302734375 }, delta: { x: 0.10893098264932632, z: -0.00898367166519165 } },
  { t: 10366, position: { x: -9.971818923950195, z: 2189.021240234375 }, moveVector: { x: 0 }, delta: { x: 0.059476323425769806, z: -0.004905085079371929 }, inputs: { left: false } },
  { t: 10367, position: { x: -9.91234302520752, z: 2189.016357421875 }, delta: { x: 0.03247407451272011, z: -0.0026781768538057804 } },
  { t: 10368, position: { x: -9.879868507385254, z: 2189.013671875 }, delta: { x: 0.017730847001075745, z: -0.0014622847083956003 } },
  { t: 10369, position: { x: -9.95782470703125, z: 2189.033447265625 }, moveVector: { x: -1 }, delta: { x: -0.04256408289074898, z: 0.010758135467767715 }, inputs: { right: true } },
  { t: 10370, position: { x: -10.096076011657715, z: 2189.0654296875 }, delta: { x: -0.07548511773347855, z: 0.017430486157536507 } },
  { t: 10371, position: { x: -10.267248153686523, z: 2189.10400390625 }, delta: { x: -0.09346000105142593, z: 0.021073589101433754 } },
  { t: 10372, position: { x: -10.456395149230957, z: 2189.146240234375 }, delta: { x: -0.10327428579330444, z: 0.023062724620103836 } },
  { t: 10373, position: { x: -10.655356407165527, z: 2189.1904296875 }, delta: { x: -0.108632892370224, z: 0.024148793891072273 } },
  { t: 10374, position: { x: -10.859676361083984, z: 2189.23583984375 }, delta: { x: -0.1115586906671524, z: 0.02474178560078144 } },
  { t: 10375, position: { x: -11.066922187805176, z: 2189.28173828125 }, delta: { x: -0.11315617710351944, z: 0.025065559893846512 } },
  { t: 10376, position: { x: -11.180078506469727, z: 2189.306884765625 }, moveVector: { x: 0 }, delta: { x: -0.06178328022360802, z: 0.013685797341167927 }, inputs: { right: false } }
]

describe('physics: jump_at_fence', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_at_fence', softFailures: true })
    h.runScenario({ name: 'jump_at_fence', ticks: TICKS })
  })
})
