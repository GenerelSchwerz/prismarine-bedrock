'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d4_y0_p0
// Frames: 39  (ticks 23909..23947)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23909, position: { x: 0.5, y: -3.21998929977417, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23910, position: { y: -3.2599892616271973 } },
  { t: 23911, position: { y: -3.2999892234802246 } },
  { t: 23912, position: { y: -3.339989185333252 } },
  { t: 23913, position: { y: -3.3799891471862793 } },
  { t: 23914, position: { y: -3.4199891090393066 } },
  { t: 23915, position: { y: -2.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23916, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23917, position: { y: -2.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 23918, position: { y: -2.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 23919, position: { y: -2.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 23920, position: { y: -2.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 23921, position: { y: -2.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 23922, position: { y: -2.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 23923, position: { y: -2.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 23924, position: { y: -2.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 23925, position: { y: -2.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 23926, position: { y: -2.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 23927, position: { y: -2.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 23928, position: { y: -2.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 23929, position: { y: -2.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 23930, position: { y: -2.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 23931, position: { y: -2.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 23932, position: { y: -2.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 23933, position: { y: -3.0199904441833496 }, delta: { y: -0.03999984636902809 } },
  { t: 23934, position: { y: -3.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 23935, position: { y: -3.0999903678894043 }, delta: { y: -0.039999961853027344 } },
  { t: 23936, position: { y: -3.1399903297424316 }, delta: { y: -0.039999980479478836 } },
  { t: 23937, position: { y: -3.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 23938, position: { y: -3.2199902534484863 }, delta: { y: -0.03999999538064003 } },
  { t: 23939, position: { y: -3.2599902153015137 }, delta: { y: -0.03999999910593033 } },
  { t: 23940, position: { y: -3.299990177154541 } },
  { t: 23941, position: { y: -3.3399901390075684 } },
  { t: 23942, position: { y: -3.3799901008605957 } },
  { t: 23943, position: { y: -3.419990062713623 } },
  { t: 23944, position: { y: -3.4599900245666504 } },
  { t: 23945, position: { y: -3.4999899864196777 } },
  { t: 23946, position: { y: -3.539989948272705 } },
  { t: 23947, position: { y: -3.5799899101257324 } }
]

describe('physics: lava_sub_walk_d4_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d4_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d4_y0_p0', ticks: TICKS })
  })
})
