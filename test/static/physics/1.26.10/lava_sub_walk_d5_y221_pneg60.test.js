'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d5_y221_pneg60
// Frames: 39  (ticks 23379..23417)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23379, position: { x: 0.5, y: -2.3766541481018066, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.040000274777412415 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23380, position: { y: -2.416654586791992 }, delta: { y: -0.04000013694167137 } },
  { t: 23381, position: { y: -2.4566545486450195 }, delta: { y: -0.0400000661611557 } },
  { t: 23382, position: { y: -2.496654510498047 }, delta: { y: -0.040000032633543015 } },
  { t: 23383, position: { y: -2.536654472351074 }, delta: { y: -0.04000001400709152 } },
  { t: 23384, position: { y: -3.3799901008605957 }, yaw: -139, pitch: -60, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23385, yaw: -139.00216674804688, pitch: -59.997528076171875, headYaw: -139.00216674804688, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23386, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 23387, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 23388, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 23389, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 23390, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 23391, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 23392, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 23393, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 23394, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 23395, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 23396, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 23397, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 23398, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 23399, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 23400, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 23401, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 23402, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 23403, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 23404, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 23405, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 23406, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 23407, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 23408, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 23409, position: { y: -4.299990177154541 } },
  { t: 23410, position: { y: -4.339990139007568 } },
  { t: 23411, position: { y: -4.379990100860596 } },
  { t: 23412, position: { y: -4.419990062713623 } },
  { t: 23413, position: { y: -4.45999002456665 } },
  { t: 23414, position: { y: -4.499989986419678 } },
  { t: 23415, position: { y: -4.539989948272705 } },
  { t: 23416, position: { y: -4.579989910125732 } },
  { t: 23417, position: { y: -4.61998987197876 } }
]

describe('physics: lava_sub_walk_d5_y221_pneg60', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d5_y221_pneg60', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d5_y221_pneg60', ticks: TICKS })
  })
})
