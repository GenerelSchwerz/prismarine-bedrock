'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_8t
// Frames: 22  (ticks 1948..1969)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1948, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: 82.88262939453125, pitch: -89.89999389648438, headYaw: 90.4183349609375, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1949, yaw: 90.42266845703125, pitch: -89.89998626708984, headYaw: 98.47805786132812 },
  { t: 1950, yaw: 99.77423095703125, pitch: -89.89999389648438, headYaw: 99.77423095703125 },
  { t: 1951, yaw: 101.07720947265625, headYaw: 104.71514892578125 },
  { t: 1952, yaw: 104.71490478515625, pitch: -89.89998626708984, headYaw: 108.87249755859375 },
  { t: 1953, yaw: 115.88824462890625, headYaw: 117.1875 },
  { t: 1954, yaw: 117.18634033203125, headYaw: 117.7060546875 },
  { t: 1955, yaw: 117.96694946289062, headYaw: 117.96694946289062 },
  { t: 1956, yaw: 119.77777099609375, pitch: -89.38029479980469, headYaw: 120.55734252929688 },
  { t: 1957, yaw: 120.557373046875, headYaw: 121.59674072265625 },
  { t: 1958, yaw: 122.37588500976562, pitch: -88.60075378417969, headYaw: 122.89556884765625 },
  { t: 1959, yaw: 122.89556884765625, pitch: -88.34089660644531, headYaw: 123.67510986328125 },
  { t: 1960, yaw: 124.97402954101562, pitch: -87.04163360595703, headYaw: 126.27328491210938 },
  { t: 1961, yaw: 126.79296875, pitch: -86.00225067138672, headYaw: 127.572509765625 },
  { t: 1962, yaw: 127.57244873046875, pitch: -85.48255157470703, headYaw: 128.35202026367188 },
  { t: 1963, yaw: 130.95050048828125, pitch: -85.4825439453125, headYaw: 134.06869506835938 },
  { t: 1964, yaw: 134.06869506835938, pitch: -86.52193450927734, headYaw: 137.1868896484375 },
  { t: 1965, yaw: 145.7664794921875, pitch: -89.89998626708984, headYaw: 149.66424560546875 },
  { t: 1966, yaw: 153.56268310546875, pitch: -89.89997863769531, headYaw: 156.16119384765625 },
  { t: 1967, yaw: 156.16046142578125, headYaw: 158.75897216796875 },
  { t: 1968, yaw: 162.13714599609375, headYaw: 166.55462646484375 },
  { t: 1969, yaw: 166.5526123046875, headYaw: 171.22991943359375 }
]

describe('physics: walkForward_8t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_8t', softFailures: true })
    h.runScenario({ name: 'walkForward_8t', ticks: TICKS })
  })
})
