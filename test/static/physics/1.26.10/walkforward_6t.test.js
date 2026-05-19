'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_6t
// Frames: 20  (ticks 1885..1904)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1885, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: 162.23858642578125, pitch: -68.85198974609375, headYaw: 162.23858642578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1886 },
  { t: 1887 },
  { t: 1888, headYaw: 162.75827026367188 },
  { t: 1889, yaw: 162.75823974609375, pitch: -68.85198211669922, headYaw: 162.75823974609375 },
  { t: 1890, headYaw: 163.53781127929688 },
  { t: 1891, yaw: 169.514404296875, pitch: -63.13525390625, headYaw: -165.280029296875 },
  { t: 1892, yaw: -165.28005981445312, pitch: -50.402557373046875, headYaw: -124.48341369628906 },
  { t: 1893, yaw: -79.00942993164062, pitch: 1.0479888916015625, headYaw: -34.055145263671875 },
  { t: 1894, yaw: -34.055145263671875, pitch: 33.52940368652344, headYaw: 0.7649383544921875 },
  { t: 1895, yaw: 17.915115356445312, pitch: 64.97140502929688, headYaw: 17.915115356445312 },
  { t: 1896 },
  { t: 1897, pitch: 72.76693725585938, headYaw: 24.411392211914062 },
  { t: 1898, yaw: 44.424346923828125, pitch: 89.89999389648438, headYaw: 62.09423828125 },
  { t: 1899, yaw: 62.09764099121094, headYaw: 74.31065368652344 },
  { t: 1900, yaw: 82.626220703125, headYaw: 86.0042724609375 },
  { t: 1901, yaw: 89.38165283203125, headYaw: 93.79913330078125 },
  { t: 1902, yaw: 93.80267333984375, headYaw: 96.40118408203125 },
  { t: 1903, yaw: 98.99862670898438, headYaw: 102.11685180664062 },
  { t: 1904, yaw: 102.11199951171875, headYaw: 104.97036743164062 }
]

describe('physics: walkForward_6t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_6t', softFailures: true })
    h.runScenario({ name: 'walkForward_6t', ticks: TICKS })
  })
})
