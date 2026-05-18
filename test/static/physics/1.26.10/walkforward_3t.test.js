'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_3t
// Frames: 17  (ticks 1798..1814)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1798, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: 171.74713134765625, pitch: -15.69708251953125, headYaw: 170.4478759765625, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1799, yaw: 170.4478759765625, pitch: -18.555450439453125, headYaw: 122.37542724609375 },
  { t: 1800 },
  { t: 1801, yaw: 122.37542724609375, pitch: -65.06880950927734, headYaw: -84.206298828125 },
  { t: 1802, yaw: -84.21765899658203, pitch: 89.89999389648438, headYaw: -84.21765899658203 },
  { t: 1803, headYaw: -86.81616973876953 },
  { t: 1804, yaw: -99.0301513671875, headYaw: -105.52643585205078 },
  { t: 1805, yaw: -103.701904296875, headYaw: -92.5282974243164 },
  { t: 1806, yaw: -69.6624526977539, headYaw: -21.849822998046875 },
  { t: 1807, yaw: -21.84576416015625, pitch: 89.9000244140625, headYaw: 12.714462280273438 },
  { t: 1808, yaw: 42.608062744140625, headYaw: 59.49839782714844 },
  { t: 1809, yaw: 59.500213623046875, pitch: 89.89999389648438, headYaw: 63.397979736328125 },
  { t: 1810, yaw: 65.99418640136719, headYaw: 67.03359985351562 },
  { t: 1811, yaw: 68.59065246582031, headYaw: 69.1103515625 },
  { t: 1812, yaw: 69.11105346679688, headYaw: 69.11105346679688 },
  { t: 1813, headYaw: 67.81179809570312 },
  { t: 1814, yaw: 67.80697631835938, pitch: 89.12042236328125, headYaw: 62.090240478515625 }
]

describe('physics: walkForward_3t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_3t', softFailures: true })
    h.runScenario({ name: 'walkForward_3t', ticks: TICKS })
  })
})
