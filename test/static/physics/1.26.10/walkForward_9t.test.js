'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_walkForward_9t
// Frames: 23  (ticks 1981..2003)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1981, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: -179.15841674804688, pitch: -89.89997863769531, headYaw: -179.15841674804688, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1982, headYaw: -178.3788604736328 },
  { t: 1983, yaw: -178.37881469726562, pitch: -89.89998626708984, headYaw: -178.11895751953125 },
  { t: 1984, yaw: -178.11895751953125, headYaw: -177.85910034179688 },
  { t: 1985, yaw: -177.8592529296875, headYaw: -177.8592529296875 },
  { t: 1986 },
  { t: 1987 },
  { t: 1988 },
  { t: 1989 },
  { t: 1990 },
  { t: 1991 },
  { t: 1992 },
  { t: 1993 },
  { t: 1994 },
  { t: 1995 },
  { t: 1996 },
  { t: 1997 },
  { t: 1998 },
  { t: 1999, headYaw: -178.11911010742188 },
  { t: 2000, yaw: 168.63140869140625, pitch: -89.89997100830078, headYaw: 161.3555908203125 },
  { t: 2001, yaw: 145.765380859375, pitch: -89.89998626708984, headYaw: 139.26910400390625 },
  { t: 2002, yaw: 139.27178955078125, headYaw: 136.15359497070312 },
  { t: 2003, yaw: 135.1162109375, headYaw: 133.81695556640625 }
]

describe('physics: walkForward_9t', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walkForward_9t', softFailures: true })
    h.runScenario({ name: 'walkForward_9t', ticks: TICKS })
  })
})
