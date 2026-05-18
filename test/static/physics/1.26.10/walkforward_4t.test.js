'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_4t
// Frames: 18  (ticks 1826..1843)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1826, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: 67.80671691894531, pitch: 85.48251342773438, headYaw: 69.10597229003906, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1827, yaw: 69.10600280761719, pitch: 84.70294189453125, headYaw: 70.92495727539062 },
  { t: 1828, yaw: 73.00373840332031, pitch: 83.66354370117188, headYaw: 76.9014892578125 },
  { t: 1829, yaw: 76.9014892578125, pitch: 83.14385986328125, headYaw: 78.98031616210938 },
  { t: 1830, yaw: 86.7757568359375, pitch: 82.36428833007812, headYaw: 88.5947265625 },
  { t: 1831, yaw: 91.19329833984375, pitch: 82.10443115234375, headYaw: 91.97283935546875 },
  { t: 1832, yaw: 91.972900390625, pitch: 81.84457397460938, headYaw: 92.49261474609375 },
  { t: 1833, yaw: 93.79183959960938, pitch: 82.10443115234375, headYaw: 94.31155395507812 },
  { t: 1834, yaw: 94.31149291992188, headYaw: 94.57135009765625 },
  { t: 1835, yaw: 94.5714111328125, pitch: 82.36428833007812, headYaw: 94.5714111328125 },
  { t: 1836 },
  { t: 1837 },
  { t: 1838 },
  { t: 1839 },
  { t: 1840, headYaw: 94.31155395507812 },
  { t: 1841, yaw: 92.49258422851562, pitch: 78.98623657226562, headYaw: 91.19332885742188 },
  { t: 1842, yaw: 91.19326782226562, pitch: 77.4271240234375, headYaw: 88.07504272460938 },
  { t: 1843, yaw: 80.27947998046875, pitch: 66.773193359375, headYaw: 73.52333068847656 }
]

describe('physics: walkForward_4t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_4t', softFailures: true })
    h.runScenario({ name: 'walkForward_4t', ticks: TICKS })
  })
})
