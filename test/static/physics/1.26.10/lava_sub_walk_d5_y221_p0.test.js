'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d5_y221_p0
// Frames: 39  (ticks 23485..23523)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23485, position: { x: 0.5, y: -5.21998929977417, z: 300.5 }, yaw: -139.00216674804688, pitch: -29.999343872070312, headYaw: -139.00216674804688, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23486, position: { y: -5.259989261627197 } },
  { t: 23487, position: { y: -5.299989223480225 } },
  { t: 23488, position: { y: -5.339989185333252 } },
  { t: 23489, position: { y: -5.379989147186279 } },
  { t: 23490, position: { y: -3.3799901008605957 }, yaw: -139, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23491, yaw: -139.00216674804688, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23492, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 23493, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 23494, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 23495, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 23496, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 23497, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 23498, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 23499, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 23500, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 23501, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 23502, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 23503, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 23504, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 23505, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 23506, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 23507, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 23508, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 23509, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 23510, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 23511, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 23512, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 23513, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 23514, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 23515, position: { y: -4.299990177154541 } },
  { t: 23516, position: { y: -4.339990139007568 } },
  { t: 23517, position: { y: -4.379990100860596 } },
  { t: 23518, position: { y: -4.419990062713623 } },
  { t: 23519, position: { y: -4.45999002456665 } },
  { t: 23520, position: { y: -4.499989986419678 } },
  { t: 23521, position: { y: -4.539989948272705 } },
  { t: 23522, position: { y: -4.579989910125732 } },
  { t: 23523, position: { y: -4.61998987197876 } }
]

describe('physics: lava_sub_walk_d5_y221_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d5_y221_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d5_y221_p0', ticks: TICKS })
  })
})
