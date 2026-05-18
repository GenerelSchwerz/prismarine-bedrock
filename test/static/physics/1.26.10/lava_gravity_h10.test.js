'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_gravity_h10
// Frames: 31  (ticks 23334..23364)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23334, position: { x: 0.5, y: -1.6792434453964233, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.04000020772218704 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23335, position: { y: -1.7192436456680298 }, delta: { y: -0.040000103414058685 } },
  { t: 23336, position: { y: -1.7592438459396362 }, delta: { y: -0.04000005125999451 } },
  { t: 23337, position: { y: -1.7992438077926636 }, delta: { y: -0.04000002518296242 } },
  { t: 23338, position: { y: -1.839243769645691 }, delta: { y: -0.04000001400709152 } },
  { t: 23339, position: { y: 11.620010375976562 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23340, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 23341, position: { y: 11.541610717773438 }, delta: { y: -0.1552319973707199 } },
  { t: 23342, position: { y: 11.386378288269043 }, delta: { y: -0.2305273562669754 } },
  { t: 23343, position: { y: 11.155851364135742 }, delta: { y: -0.30431681871414185 } },
  { t: 23344, position: { y: 10.851534843444824 }, delta: { y: -0.3766304850578308 } },
  { t: 23345, position: { y: 10.47490406036377 }, delta: { y: -0.4474978744983673 } },
  { t: 23346, position: { y: 10.027405738830566 }, delta: { y: -0.5169479250907898 } },
  { t: 23347, position: { y: 9.510457992553711 }, delta: { y: -0.585008978843689 } },
  { t: 23348, position: { y: 8.925448417663574 }, delta: { y: -0.6517087817192078 } },
  { t: 23349, position: { y: 8.2737398147583 }, delta: { y: -0.7170746326446533 } },
  { t: 23350, position: { y: 7.556664943695068 }, delta: { y: -0.7811331152915955 } },
  { t: 23351, position: { y: 6.775531768798828 }, delta: { y: -0.8439104557037354 } },
  { t: 23352, position: { y: 5.931621074676514 }, delta: { y: -0.9054322242736816 } },
  { t: 23353, position: { y: 5.026188850402832 }, delta: { y: -0.9657235741615295 } },
  { t: 23354, position: { y: 4.060465335845947 }, delta: { y: -1.0248091220855713 } },
  { t: 23355, position: { y: 3.035656452178955 }, delta: { y: -1.082713007926941 } },
  { t: 23356, position: { y: 1.9529433250427246 }, delta: { y: -1.1394587755203247 } },
  { t: 23357, position: { y: 0.8134845495223999 }, delta: { y: -1.195069670677185 } },
  { t: 23358, position: { y: -0.3815850019454956 }, delta: { y: -0.6175348162651062 } },
  { t: 23359, position: { y: -0.9991198778152466 }, delta: { y: -0.32876741886138916 } },
  { t: 23360, position: { y: -1.3278874158859253 }, delta: { y: -0.18438370525836945 } },
  { t: 23361, position: { y: -1.5122710466384888 }, delta: { y: -0.11219185590744019 } },
  { t: 23362, position: { y: -1.6244629621505737 }, delta: { y: -0.07609592378139496 } },
  { t: 23363, position: { y: -1.7005587816238403 }, delta: { y: -0.05804796144366264 } },
  { t: 23364, position: { y: -1.7586067914962769 }, delta: { y: -0.04902397841215134 } }
]

describe('physics: lava_gravity_h10', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_gravity_h10', softFailures: true })
    h.runScenario({ name: 'lava_gravity_h10', ticks: TICKS })
  })
})
