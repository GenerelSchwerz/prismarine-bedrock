'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_gravity_h3
// Frames: 28  (ticks 23252..23279)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23252, position: { x: 0.5, y: -0.7664898633956909, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.040000226348638535 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23253, position: { y: -0.8064900636672974 }, delta: { y: -0.04000011086463928 } },
  { t: 23254, position: { y: -0.8464902639389038 }, delta: { y: -0.040000054985284805 } },
  { t: 23255, position: { y: -0.8864902257919312 }, delta: { y: -0.040000028908252716 } },
  { t: 23256, position: { y: -0.9264901876449585 }, delta: { y: -0.04000001400709152 } },
  { t: 23257, position: { y: -0.9664901494979858 }, delta: { y: -0.040000006556510925 } },
  { t: 23258, position: { y: -1.0064901113510132 }, delta: { y: -0.04000000283122063 } },
  { t: 23259, position: { y: -1.0464900732040405 }, delta: { y: -0.03999999910593033 } },
  { t: 23260, position: { y: -1.0864900350570679 } },
  { t: 23261, position: { y: 4.620009899139404 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23262, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 23263, position: { y: 4.541610240936279 }, delta: { y: -0.1552319973707199 } },
  { t: 23264, position: { y: 4.386378288269043 }, delta: { y: -0.2305273562669754 } },
  { t: 23265, position: { y: 4.155850887298584 }, delta: { y: -0.30431681871414185 } },
  { t: 23266, position: { y: 3.851533889770508 }, delta: { y: -0.3766304850578308 } },
  { t: 23267, position: { y: 3.4749035835266113 }, delta: { y: -0.4474978744983673 } },
  { t: 23268, position: { y: 3.0274057388305664 }, delta: { y: -0.5169479250907898 } },
  { t: 23269, position: { y: 2.510457754135132 }, delta: { y: -0.585008978843689 } },
  { t: 23270, position: { y: 1.9254486560821533 }, delta: { y: -0.6517087817192078 } },
  { t: 23271, position: { y: 1.2737399339675903 }, delta: { y: -0.7170746326446533 } },
  { t: 23272, position: { y: 0.556665301322937 }, delta: { y: -0.7811331152915955 } },
  { t: 23273, position: { y: -0.22446787357330322 }, delta: { y: -0.4105665683746338 } },
  { t: 23274, position: { y: -0.635034441947937 }, delta: { y: -0.22528328001499176 } },
  { t: 23275, position: { y: -0.8603178262710571 }, delta: { y: -0.13264164328575134 } },
  { t: 23276, position: { y: -0.9929593801498413 }, delta: { y: -0.08632081747055054 } },
  { t: 23277, position: { y: -1.0792802572250366 }, delta: { y: -0.06316040456295013 } },
  { t: 23278, position: { y: -1.142440676689148 }, delta: { y: -0.05158020183444023 } },
  { t: 23279, position: { y: -1.1940208673477173 }, delta: { y: -0.04579009860754013 } }
]

describe('physics: lava_gravity_h3', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_gravity_h3', softFailures: true })
    h.runScenario({ name: 'lava_gravity_h3', ticks: TICKS })
  })
})
