'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_5t
// Frames: 19  (ticks 1855..1873)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1855, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: -123.70416259765625, pitch: -87.05873107910156, headYaw: -123.70416259765625, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1856, yaw: -130.72035217285156, pitch: -88.61785125732422, headYaw: -167.87908935546875 },
  { t: 1857, yaw: -167.88015747070312, pitch: -89.89998626708984, headYaw: 142.2283935546875 },
  { t: 1858, yaw: 97.28094482421875, pitch: -89.89999389648438, headYaw: 90.00509643554688 },
  { t: 1859, yaw: 90.0078125, pitch: -89.9000015258789, headYaw: 90.0078125 },
  { t: 1860, yaw: 93.38702392578125, pitch: -89.89998626708984, headYaw: 100.66287231445312 },
  { t: 1861, yaw: 106.63751220703125, headYaw: 115.7322998046875 },
  { t: 1862, yaw: 115.73287963867188, headYaw: 131.0640869140625 },
  { t: 1863, yaw: 142.75564575195312, headYaw: 147.95266723632812 },
  { t: 1864, yaw: 147.95004272460938, headYaw: 148.7296142578125 },
  { t: 1865, yaw: 153.66357421875, pitch: -83.92340087890625, headYaw: 157.301513671875 },
  { t: 1866, yaw: 159.12039184570312, pitch: -76.90742492675781, headYaw: 160.41964721679688 },
  { t: 1867, yaw: 160.41961669921875, pitch: -75.60816955566406, headYaw: 160.41961669921875 },
  { t: 1868, yaw: 160.9393310546875, pitch: -74.30889892578125, headYaw: 161.19918823242188 },
  { t: 1869, yaw: 161.19918823242188, pitch: -73.00963592529297, headYaw: 160.41961669921875 },
  { t: 1870, yaw: 160.1597900390625, pitch: -67.55274963378906, headYaw: 159.64007568359375 },
  { t: 1871, yaw: 159.64007568359375, pitch: -67.0330581665039 },
  { t: 1872, yaw: 159.64004516601562, pitch: -66.77320861816406, headYaw: 158.8604736328125 },
  { t: 1873, yaw: 157.3013916015625, pitch: -67.29290008544922, headYaw: 151.06497192382812 }
]

describe('physics: walkForward_5t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_5t', softFailures: true })
    h.runScenario({ name: 'walkForward_5t', ticks: TICKS })
  })
})
