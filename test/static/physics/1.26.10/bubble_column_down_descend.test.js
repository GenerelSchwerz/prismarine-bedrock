'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_bubble_column_down_descend
// Frames: 81  (ticks 10049..10129)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 10049, position: { x: 0.5000003576278687, y: 1.6200100183486938, z: 1789.7950439453125 }, yaw: -38.9776611328125, headYaw: -38.9776611328125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 10050 },
  { t: 10051 },
  { t: 10052 },
  { t: 10053 },
  { t: 10054 },
  { t: 10055, position: { x: 5.5, z: 1800.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 10056, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 10057, position: { y: 1.5416100025177002 }, delta: { y: -0.1852319985628128 } },
  { t: 10058, position: { y: 1.3563780784606934 }, delta: { y: -0.2899273633956909 } },
  { t: 10059, position: { y: 1.066450595855713 }, delta: { y: -0.39252880215644836 } },
  { t: 10060, position: { y: 0.6739218235015869 }, delta: { y: -0.3490230441093445 } },
  { t: 10061, position: { y: 0.3248988389968872 }, delta: { y: -0.33000001311302185 } },
  { t: 10062, position: { y: -0.005101203918457031 }, delta: { y: -0.3290000259876251 } },
  { t: 10063, position: { y: -0.33410120010375977 }, delta: { y: -0.32820001244544983 } },
  { t: 10064, position: { y: -0.6623011827468872 }, delta: { y: -0.33000001311302185 } },
  { t: 10065, position: { y: -0.9923011064529419 } },
  { t: 10066, position: { y: -1.3223010301589966 }, delta: { y: -0.30000001192092896 } },
  { t: 10067, position: { y: -1.6223009824752808 } },
  { t: 10068, position: { y: -1.922300934791565 } },
  { t: 10069, position: { y: -2.2223010063171387 } },
  { t: 10070, position: { y: -2.522301197052002 } },
  { t: 10071, position: { y: -2.8223013877868652 } },
  { t: 10072, position: { y: -3.1223015785217285 } },
  { t: 10073, position: { y: -3.422301769256592 } },
  { t: 10074, position: { y: -3.722301959991455 } },
  { t: 10075, position: { y: -4.022302150726318 } },
  { t: 10076, position: { y: -4.322302341461182 } },
  { t: 10077, position: { y: -4.622302532196045 } },
  { t: 10078, position: { y: -4.922302722930908 } },
  { t: 10079, position: { y: -5.2223029136657715 } },
  { t: 10080, position: { y: -5.522303104400635 } },
  { t: 10081, position: { y: -5.822303295135498 } },
  { t: 10082, position: { y: -6.122303485870361 } },
  { t: 10083, position: { y: -6.379990100860596 }, delta: { y: -0.06499999761581421 }, inputs: { verticalCollision: true } },
  { t: 10084 },
  { t: 10085 },
  { t: 10086 },
  { t: 10087 },
  { t: 10088 },
  { t: 10089 },
  { t: 10090 },
  { t: 10091 },
  { t: 10092 },
  { t: 10093 },
  { t: 10094 },
  { t: 10095 },
  { t: 10096 },
  { t: 10097 },
  { t: 10098 },
  { t: 10099 },
  { t: 10100 },
  { t: 10101 },
  { t: 10102 },
  { t: 10103 },
  { t: 10104 },
  { t: 10105, position: { z: 1800.5196533203125 }, moveVector: { z: 1 }, delta: { x: 8.351673130846393e-9, z: 0.01568000018596649 }, inputs: { up: true } },
  { t: 10106, position: { z: 1800.554931640625 }, delta: { x: 1.503301305660898e-8, z: 0.028224000707268715 } },
  { t: 10107, position: { z: 1800.602783203125 }, delta: { x: 2.0378084997219048e-8, z: 0.03825920447707176 } },
  { t: 10108, position: { z: 1800.66064453125 }, delta: { x: 2.4654141839164367e-8, z: 0.04628736525774002 } },
  { t: 10109, position: { z: 1800.7265625 }, delta: { x: 2.807498766799199e-8, y: -0.125, z: 0.05270988866686821 } },
  { t: 10110, position: { z: 1800.798828125 }, delta: { x: 3.081166255469725e-8, z: 0.05784791335463524 } },
  { t: 10111, position: { z: 1800.876220703125 }, delta: { x: 3.3001004595689665e-8, z: 0.06195833161473274 } },
  { t: 10112, position: { z: 1800.957763671875 }, delta: { x: 3.4752478228483596e-8, z: 0.06524666398763657 } },
  { t: 10113, position: { z: 1801.0426025390625 }, delta: { x: 3.615365784526148e-8, z: 0.06787732988595963 } },
  { t: 10114, position: { z: 1801.130126953125 }, delta: { x: 3.7274599407055575e-8, z: 0.06998186558485031 } },
  { t: 10115, position: { z: 1801.2197265625 }, delta: { x: 4.2942772893184156e-8, y: -0.05999999865889549, z: 0.08062367141246796 }, inputs: { sprintDown: true, sprinting: true, startSprinting: true, startSwimming: true } },
  { t: 10116, position: { z: 1801.3199462890625 }, delta: { x: 4.804412867542851e-8, y: -0.029999999329447746, z: 0.09020130336284637 }, inputs: { startSprinting: false, startSwimming: false } },
  { t: 10117, position: { z: 1801.4296875 }, delta: { x: 5.263534674782022e-8, z: 0.09882117062807083 } },
  { t: 10118, position: { z: 1801.548095703125 }, delta: { x: 5.676744052607319e-8, z: 0.10657905042171478 } },
  { t: 10119, position: { z: 1801.67431640625 }, delta: { x: 6.04863288344859e-8, z: 0.11356114596128464 } },
  { t: 10120, position: { z: 1801.8074951171875 }, delta: { x: 6.383332618042914e-8, y: -0.05999999865889549, z: 0.11984502524137497 } },
  { t: 10121, position: { z: 1801.9468994140625 }, delta: { x: 6.684562237069258e-8, z: 0.12550051510334015 } },
  { t: 10122, position: { z: 1802.092041015625 }, delta: { x: 6.955669107355789e-8, z: 0.13059046864509583 } },
  { t: 10123, position: { z: 1802.2421875 }, delta: { x: 7.199665219559392e-8, z: 0.13517142832279205 } },
  { t: 10124, position: { z: 1802.39697265625 }, delta: { x: 7.41926200475973e-8, y: -0.029999999329447746, z: 0.13929428160190582 } },
  { t: 10125, position: { z: 1802.555908203125 }, delta: { x: 7.616898756168666e-8, z: 0.14300484955310822 } },
  { t: 10126, position: { z: 1802.718505859375 }, delta: { x: 7.794771761382435e-8, y: -0.05999999865889549, z: 0.1463443636894226 } },
  { t: 10127, position: { z: 1802.8843994140625 }, delta: { x: 7.954857750291922e-8, z: 0.14934992790222168 } },
  { t: 10128, position: { z: 1803.0533447265625 }, delta: { x: 8.098935211364733e-8, z: 0.15205493569374084 } },
  { t: 10129, position: { z: 1803.2249755859375 }, delta: { x: 8.228604997384537e-8, z: 0.1544894427061081 } }
]

describe('physics: bubble_column_down_descend', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'bubble_column_down_descend', softFailures: true })
    h.runScenario({ name: 'bubble_column_down_descend', ticks: TICKS })
  })
})
