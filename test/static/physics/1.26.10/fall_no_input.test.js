'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_fall_no_input
// Frames: 58  (ticks 138..195)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 138, position: { x: 0.5, y: 1.6200100183486938, z: -31.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 139 },
  { t: 140 },
  { t: 141 },
  { t: 142 },
  { t: 143 },
  { t: 144, position: { y: 21.620010375976562, z: 0.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 145, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 146, position: { y: 21.541610717773438 }, delta: { y: -0.1552319973707199 } },
  { t: 147, position: { y: 21.38637924194336 }, delta: { y: -0.2305273562669754 } },
  { t: 148, position: { y: 21.155851364135742 }, delta: { y: -0.30431681871414185 } },
  { t: 149, position: { y: 20.851533889770508 }, delta: { y: -0.3766304850578308 } },
  { t: 150, position: { y: 20.474903106689453 }, delta: { y: -0.4474978744983673 } },
  { t: 151, position: { y: 20.02740478515625 }, delta: { y: -0.5169479250907898 } },
  { t: 152, position: { y: 19.510456085205078 }, delta: { y: -0.585008978843689 } },
  { t: 153, position: { y: 18.925447463989258 }, delta: { y: -0.6517087817192078 } },
  { t: 154, position: { y: 18.273738861083984 }, delta: { y: -0.7170746326446533 } },
  { t: 155, position: { y: 17.556663513183594 }, delta: { y: -0.7811331152915955 } },
  { t: 156, position: { y: 16.775531768798828 }, delta: { y: -0.8439104557037354 } },
  { t: 157, position: { y: 15.931621551513672 }, delta: { y: -0.9054322242736816 } },
  { t: 158, position: { y: 15.026189804077148 }, delta: { y: -0.9657235741615295 } },
  { t: 159, position: { y: 14.060465812683105 }, delta: { y: -1.0248091220855713 } },
  { t: 160, position: { y: 13.035656929016113 }, delta: { y: -1.082713007926941 } },
  { t: 161, position: { y: 11.952943801879883 }, delta: { y: -1.1394587755203247 } },
  { t: 162, position: { y: 10.813485145568848 }, delta: { y: -1.195069670677185 } },
  { t: 163, position: { y: 9.618414878845215 }, delta: { y: -1.2495683431625366 } },
  { t: 164, position: { y: 8.368846893310547 }, delta: { y: -1.3029770851135254 } },
  { t: 165, position: { y: 7.065869331359863 }, delta: { y: -1.3553175926208496 } },
  { t: 166, position: { y: 5.710551738739014 }, delta: { y: -1.4066113233566284 } },
  { t: 167, position: { y: 4.303940296173096 }, delta: { y: -1.4568791389465332 } },
  { t: 168, position: { y: 2.8470611572265625 }, delta: { y: -1.5061416625976562 } },
  { t: 169, position: { y: 1.6200100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 170 },
  { t: 171 },
  { t: 172 },
  { t: 173 },
  { t: 174 },
  { t: 175 },
  { t: 176 },
  { t: 177 },
  { t: 178 },
  { t: 179 },
  { t: 180 },
  { t: 181 },
  { t: 182 },
  { t: 183 },
  { t: 184 },
  { t: 185 },
  { t: 186 },
  { t: 187 },
  { t: 188 },
  { t: 189 },
  { t: 190 },
  { t: 191 },
  { t: 192 },
  { t: 193 },
  { t: 194 },
  { t: 195 }
]

describe('physics: fall_no_input', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'fall_no_input', softFailures: true })
    h.runScenario({ name: 'fall_no_input', ticks: TICKS })
  })
})
