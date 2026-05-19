'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_7t
// Frames: 21  (ticks 1916..1936)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1916, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: 95.87646484375, pitch: 89.89999389648438, headYaw: 94.57720947265625, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1917, yaw: 94.57958984375, headYaw: 93.800048828125 },
  { t: 1918, yaw: 93.79876708984375, headYaw: 93.279052734375 },
  { t: 1919, yaw: 93.27926635742188, headYaw: 93.27926635742188 },
  { t: 1920 },
  { t: 1921 },
  { t: 1922, yaw: 93.27413940429688, pitch: 89.64013671875, headYaw: 94.31353759765625 },
  { t: 1923, yaw: 99.50839233398438, pitch: 84.96282958984375, headYaw: 105.4849853515625 },
  { t: 1924, yaw: 105.4849853515625, pitch: 82.10446166992188, headYaw: 114.57977294921875 },
  { t: 1925, yaw: 118.47747802734375, pitch: 77.16726684570312, headYaw: 126.27301025390625 },
  { t: 1926, yaw: 127.57229614257812, pitch: 74.82861328125, headYaw: 127.57229614257812 },
  { t: 1927 },
  { t: 1928, headYaw: 128.09197998046875 },
  { t: 1929, yaw: 128.09201049804688, pitch: 74.30889892578125, headYaw: 128.09201049804688 },
  { t: 1930 },
  { t: 1931, yaw: 127.57229614257812, pitch: 72.48994445800781, headYaw: 126.27304077148438 },
  { t: 1932, yaw: 126.27304077148438, pitch: 69.89143371582031, headYaw: 118.47750854492188 },
  { t: 1933, yaw: 110.68194580078125, pitch: 47.28436279296875, headYaw: 70.40499877929688 },
  { t: 1934, yaw: 70.40496826171875, pitch: -0.0085601806640625, headYaw: 13.75738525390625 },
  { t: 1935, yaw: -35.35459899902344, pitch: -85.7594985961914, headYaw: -76.15125274658203 },
  { t: 1936, yaw: -95.8999252319336, pitch: -87.04164123535156, headYaw: -95.8999252319336 }
]

describe('physics: walkForward_7t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_7t', softFailures: true })
    h.runScenario({ name: 'walkForward_7t', ticks: TICKS })
  })
})
