'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_jump_in_place
// Frames: 67  (ticks 1274..1340)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1274, position: { x: 4.7242584228515625, y: 1.6200100183486938, z: 1.9768471717834473 }, yaw: -35.59968566894531, pitch: 0.51971435546875, headYaw: -31.961761474609375, delta: { y: -0.07840000092983246, z: 0 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1275, yaw: -31.961761474609375, pitch: -0.5196990966796875, headYaw: -30.40264892578125 },
  { t: 1276, yaw: -26.76470947265625, pitch: -1.039398193359375, headYaw: -24.685897827148438 },
  { t: 1277, yaw: -24.6859130859375, headYaw: -22.08740234375 },
  { t: 1278, yaw: -18.96917724609375, pitch: -1.559112548828125, headYaw: -15.59112548828125 },
  { t: 1279, position: { x: 0.5, z: 0.5 }, yaw: 0, pitch: 0, headYaw: -9.614532470703125, delta: { y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 1280, yaw: -0.000030517578125, headYaw: 1.0393829345703125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 1281, yaw: 3.118194580078125, headYaw: 4.417449951171875, inputs: { verticalCollision: true } },
  { t: 1282, position: { y: 2.0400099754333496 }, yaw: 4.417449951171875, headYaw: 7.015960693359375, delta: { y: 0.33319997787475586 }, inputs: { jumpDown: true, jumping: true, wantUp: true, startJumping: true, verticalCollision: false, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 1283, position: { y: 2.3732099533081055 }, yaw: 9.614501953125, headYaw: 11.4334716796875, delta: { y: 0.2481359988451004 }, inputs: { jumpDown: false, jumping: false, wantUp: false, startJumping: false, jumpReleasedRaw: true, jumpPressedRaw: false, jumpCurrentRaw: false } },
  { t: 1284, position: { y: 2.6213459968566895 }, yaw: 12.992584228515625, pitch: 0.51971435546875, headYaw: 14.811553955078125, delta: { y: 0.16477328538894653 }, inputs: { jumpReleasedRaw: false } },
  { t: 1285, position: { y: 2.7861194610595703 }, yaw: 14.811553955078125, headYaw: 16.630508422851562, delta: { y: 0.0830778256058693 } },
  { t: 1286, position: { y: 2.869197130203247 }, yaw: 18.709320068359375, headYaw: 20.008575439453125, delta: { y: 0.0030162709299474955 } },
  { t: 1287, position: { y: 2.872213363647461 }, yaw: 20.008590698242188, headYaw: 21.307846069335938, delta: { y: -0.0754440575838089 } },
  { t: 1288, position: { y: 2.796769142150879 }, yaw: 22.087432861328125, headYaw: 23.386688232421875, delta: { y: -0.15233518183231354 } },
  { t: 1289, position: { y: 2.6444339752197266 }, yaw: 25.205657958984375, headYaw: 27.024612426757812, delta: { y: -0.2276884764432907 } },
  { t: 1290, position: { y: 2.416745662689209 }, yaw: 27.024627685546875, headYaw: 29.623138427734375, delta: { y: -0.3015347123146057 } },
  { t: 1291, position: { y: 2.115211009979248 }, yaw: 30.4027099609375, headYaw: 31.70196533203125, delta: { y: -0.3739040195941925 } },
  { t: 1292, position: { y: 1.7413069009780884 }, yaw: 31.701980590820312, headYaw: 32.2216796875, delta: { y: -0.4448259472846985 } },
  { t: 1293, position: { y: 1.6200100183486938 }, yaw: 33.52093505859375, pitch: 0, headYaw: 35.080047607421875, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 1294, yaw: 36.899017333984375, headYaw: 37.67857360839844 },
  { t: 1295, yaw: 37.678558349609375, headYaw: 38.977813720703125 },
  { t: 1296, yaw: 41.31648254394531, headYaw: 43.395294189453125 },
  { t: 1297, yaw: 43.395294189453125, headYaw: 45.993804931640625 },
  { t: 1298, yaw: 48.59233093261719, headYaw: 50.411285400390625, inputs: { jumpReleasedRaw: true, jumpPressedRaw: true } },
  { t: 1299, yaw: 53.00984191894531, pitch: -0.51971435546875, headYaw: 54.56895446777344, inputs: { jumpReleasedRaw: false, jumpPressedRaw: false } },
  { t: 1300, yaw: 54.56895446777344, headYaw: 56.387908935546875 },
  { t: 1301, yaw: 58.206878662109375, headYaw: 60.28569030761719 },
  { t: 1302, yaw: 60.285675048828125, headYaw: 62.36448669433594 },
  { t: 1303, yaw: 64.70314025878906, headYaw: 66.78195190429688 },
  { t: 1304, yaw: 70.16001892089844, headYaw: 71.45927429199219 },
  { t: 1305, yaw: 71.45930480957031, headYaw: 73.27825927734375 },
  { t: 1306, yaw: 74.57752990722656, headYaw: 75.09722900390625 },
  { t: 1307, yaw: 75.09721374511719, headYaw: 75.3570556640625 },
  { t: 1308, yaw: 75.35708618164062, headYaw: 75.35708618164062 },
  { t: 1309, yaw: 75.35707092285156, headYaw: 75.35707092285156 },
  { t: 1310 },
  { t: 1311, yaw: 75.35708618164062, headYaw: 75.35708618164062 },
  { t: 1312, yaw: 75.35707092285156, headYaw: 75.35707092285156 },
  { t: 1313, inputs: { jumpReleasedRaw: true, jumpPressedRaw: true } },
  { t: 1314, yaw: 75.09721374511719, headYaw: 72.49870300292969, inputs: { jumpReleasedRaw: false, jumpPressedRaw: false } },
  { t: 1315, yaw: 72.49870300292969, pitch: -1.0394134521484375, headYaw: 70.67974853515625 },
  { t: 1316, yaw: 67.30166625976562, pitch: -2.33868408203125, headYaw: 64.18344116210938 },
  { t: 1317, yaw: 64.1834716796875, pitch: -2.8583984375, headYaw: 60.80540466308594 },
  { t: 1318, yaw: 56.38795471191406, pitch: -3.3780975341796875, headYaw: 54.569000244140625 },
  { t: 1319, yaw: 51.71063232421875, headYaw: 49.89167785644531 },
  { t: 1320, yaw: 49.89166259765625, headYaw: 48.07270812988281 },
  { t: 1321, yaw: 46.77342224121094, headYaw: 45.47416687011719 },
  { t: 1322, yaw: 45.474151611328125, headYaw: 43.9150390625 },
  { t: 1323, yaw: 42.096099853515625, pitch: -2.8583984375, headYaw: 38.97789001464844 },
  { t: 1324, yaw: 36.37934875488281, headYaw: 34.300537109375 },
  { t: 1325, yaw: 34.300537109375, pitch: -2.598541259765625, headYaw: 32.221710205078125 },
  { t: 1326, yaw: 30.402755737304688, pitch: -2.078857421875, headYaw: 28.323944091796875 },
  { t: 1327, yaw: 28.323974609375, pitch: -1.55914306640625, headYaw: 27.02471923828125 },
  { t: 1328, yaw: 25.205764770507812, headYaw: 23.126953125 },
  { t: 1329, yaw: 20.5284423828125, pitch: -0.5197296142578125, headYaw: 17.929931640625 },
  { t: 1330, yaw: 17.929916381835938, headYaw: 16.630661010742188 },
  { t: 1331, yaw: 14.811676025390625, pitch: -0.0000152587890625, headYaw: 12.213165283203125 },
  { t: 1332, yaw: 12.213150024414062, pitch: 0.5196990966796875, headYaw: 10.394195556640625 },
  { t: 1333, yaw: 8.8350830078125, headYaw: 7.01611328125 },
  { t: 1334, yaw: 4.93731689453125, pitch: 1.039398193359375, headYaw: 2.3387908935546875 },
  { t: 1335, yaw: 2.338775634765625, headYaw: -0.259735107421875 },
  { t: 1336, yaw: -3.377960205078125, pitch: 1.559112548828125, headYaw: -4.1575164794921875 },
  { t: 1337, yaw: -4.157501220703125, headYaw: -4.6772003173828125 },
  { t: 1338, yaw: -6.756011962890625, pitch: 2.078826904296875, headYaw: -8.574966430664062 },
  { t: 1339, yaw: -10.65380859375, headYaw: -12.472763061523438 },
  { t: 1340, yaw: -12.4727783203125, headYaw: -14.55157470703125 }
]

describe('physics: jump_in_place', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'jump_in_place', softFailures: true })
    h.runScenario({ name: 'jump_in_place', ticks: TICKS })
  })
})
