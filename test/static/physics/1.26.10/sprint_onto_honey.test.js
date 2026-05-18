'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_sprint_onto_honey
// Frames: 52  (ticks 4136..4187)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 4136, position: { x: -0.921459972858429, y: 1.6200100183486938, z: 1101.6719970703125 }, yaw: 77.9554443359375, pitch: 2.33868408203125, headYaw: 77.9554443359375, delta: { x: 0, y: -0.07840000092983246, z: 0 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 4137 },
  { t: 4138 },
  { t: 4139 },
  { t: 4140, position: { x: 0.5, z: 1100.5 }, yaw: 0, pitch: 0, delta: { x: 0, y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 4141, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 4142, inputs: { verticalCollision: true } },
  { t: 4143 },
  { t: 4144, position: { z: 1100.5537109375 }, moveVector: { z: 1 }, delta: { z: 0.016264617443084717 }, inputs: { sprintDown: true, up: true, sprinting: true, startSprinting: true } },
  { t: 4145, position: { z: 1100.623779296875 }, delta: { z: 0.02118653617799282 }, inputs: { startSprinting: false } },
  { t: 4146, position: { x: 0.5000000596046448, z: 1100.69873046875 }, delta: { z: 0.022675983607769012 } },
  { t: 4147, position: { z: 1100.775146484375 }, delta: { z: 0.023126712068915367 } },
  { t: 4148, position: { z: 1100.85205078125 }, delta: { z: 0.02326310984790325 } },
  { t: 4149, position: { x: 0.5000001192092896, z: 1100.9290771484375 }, delta: { z: 0.02330438420176506 } },
  { t: 4150, position: { z: 1101.006103515625 }, delta: { z: 0.023316875100135803 } },
  { t: 4151, position: { z: 1101.0831298828125 }, delta: { z: 0.023320656269788742 } },
  { t: 4152, position: { z: 1101.16015625 }, delta: { z: 0.02332179993391037 } },
  { t: 4153, position: { z: 1101.2371826171875 }, delta: { z: 0.023322144523262978 } },
  { t: 4154, position: { x: 0.5000001788139343, z: 1101.314208984375 }, delta: { z: 0.023322250694036484 } },
  { t: 4155, position: { z: 1101.3912353515625 }, delta: { z: 0.02332228235900402 } },
  { t: 4156, position: { z: 1101.46826171875 }, delta: { z: 0.023322289809584618 } },
  { t: 4157, position: { x: 0.5000002384185791, z: 1101.5452880859375 }, delta: { z: 0.023322293534874916 } },
  { t: 4158, position: { z: 1101.622314453125 }, delta: { z: 0.023322295397520065 } },
  { t: 4159, position: { z: 1101.6993408203125 } },
  { t: 4160, position: { z: 1101.7763671875 } },
  { t: 4161, position: { z: 1101.8533935546875 } },
  { t: 4162, position: { x: 0.5000002980232239, z: 1101.930419921875 } },
  { t: 4163, position: { z: 1102.0074462890625 } },
  { t: 4164, position: { z: 1102.08447265625 } },
  { t: 4165, position: { x: 0.5000003576278687, z: 1102.1614990234375 } },
  { t: 4166, position: { z: 1102.238525390625 } },
  { t: 4167, position: { z: 1102.3155517578125 } },
  { t: 4168, position: { x: 0.5024371147155762, z: 1102.392578125 }, yaw: -2.5985260009765625, pitch: 2.338653564453125, headYaw: -7.0159912109375, delta: { x: 0.0007373936823569238, z: 0.02330557070672512 } },
  { t: 4169, position: { x: 0.5097395181655884, z: 1102.46923828125 }, yaw: -7.0159912109375, pitch: 4.9371795654296875, headYaw: -10.91375732421875, delta: { x: 0.002209810307249427, z: 0.02319544553756714 } },
  { t: 4170, position: { x: 0.5263948440551758, z: 1102.544189453125 }, yaw: -15.591094970703125, headYaw: -16.890350341796875, delta: { x: 0.00504016550257802, z: 0.022685442119836807 } },
  { t: 4171, position: { x: 0.5470507144927979, z: 1102.6182861328125 }, yaw: -16.890350341796875, headYaw: -19.22900390625, delta: { x: 0.00625076936557889, z: 0.022427957504987717 } },
  { t: 4172, position: { x: 0.5716915130615234, z: 1102.691162109375 }, yaw: -20.008544921875, headYaw: -20.008544921875, delta: { x: 0.007456682622432709, z: 0.02206994779407978 } },
  { t: 4173, position: { x: 0.5979956388473511, z: 1102.7635498046875 }, yaw: -20.52825927734375, headYaw: -20.788116455078125, delta: { x: 0.007960007525980473, z: 0.021910501644015312 } },
  { t: 4174, position: { x: 0.6250311136245728, z: 1102.835693359375 }, yaw: -20.788116455078125, headYaw: -22.087371826171875, delta: { x: 0.008181343786418438, z: 0.021836228668689728 } },
  { t: 4175, position: { x: 0.6332124471664429, z: 1102.8575439453125 }, yaw: -22.866928100585938, headYaw: -23.386627197265625, moveVector: { z: 0 }, delta: { x: 0.0024757978972047567, z: 0.006607971154153347 }, inputs: { sprintDown: false, up: false, sprinting: false, stopSprinting: true } },
  { t: 4176, position: { x: 0.6356881856918335, z: 1102.8641357421875 }, yaw: -23.386642456054688, headYaw: -23.906341552734375, delta: { x: 0.0007492137374356389, z: 0.001999671570956707 }, inputs: { stopSprinting: false } },
  { t: 4177, position: { x: 0.6364374160766602, z: 1102.8660888671875 }, yaw: -23.906341552734375, delta: { x: 0.00022672335035167634, z: 0.0006051307427696884 } },
  { t: 4178, position: { x: 0.6366641521453857, z: 1102.86669921875 }, delta: { x: 0.00006860989378765225, z: 0.00018312166503164917 } },
  { t: 4179, position: { x: 0.6367327570915222, z: 1102.866943359375 }, delta: { x: 0.000020762387066497467, z: 0.00005541537393582985 } },
  { t: 4180, position: { x: 0.6367535591125488 }, delta: { x: 0.00000628301086180727, z: 0.000016769527064752765 } },
  { t: 4181, position: { x: 0.6367598176002502 }, delta: { x: 0.000001901333575915487, z: 0.000005074711225461215 } },
  { t: 4182, position: { x: 0.6367617249488831 }, delta: { x: 5.753721552537172e-7, z: 0.000001535683963993506 } },
  { t: 4183, position: { x: 0.636762261390686 }, yaw: -24.166183471679688, headYaw: -24.166183471679688, delta: { x: 1.7411628050467698e-7, z: 4.6472106873807206e-7 } },
  { t: 4184, position: { x: 0.6367624998092651 }, delta: { x: 5.269020775244826e-8, z: 1.4063159881061438e-7 } },
  { t: 4185, delta: { x: 0, z: 4.2557235957474404e-8 } },
  { t: 4186, delta: { z: 0 } },
  { t: 4187 }
]

describe('physics: sprint_onto_honey', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'sprint_onto_honey', softFailures: true })
    h.runScenario({ name: 'sprint_onto_honey', ticks: TICKS })
  })
})
