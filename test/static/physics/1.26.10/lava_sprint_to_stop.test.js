'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sprint_to_stop
// Frames: 39  (ticks 24280..24318)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 24280, position: { x: 0.5, y: -4.859989643096924, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 24281, position: { y: -4.899989604949951 } },
  { t: 24282, position: { y: -4.9399895668029785 } },
  { t: 24283, position: { y: -4.979989528656006 } },
  { t: 24284, position: { y: -5.019989490509033 } },
  { t: 24285, position: { y: -5.0599894523620605 } },
  { t: 24286, position: { y: -5.099989414215088 } },
  { t: 24287, position: { y: -3.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 24288, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 24289, position: { y: -3.3999900817871094 }, yaw: -0.000030517578125, delta: { y: -0.029999999329447746 } },
  { t: 24290, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 24291, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 24292, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 24293, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 24294, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 24295, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 24296, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 24297, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 24298, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 24299, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 24300, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 24301, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 24302, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 24303, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 24304, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 24305, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 24306, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 24307, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 24308, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 24309, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 24310, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 24311, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 24312, position: { y: -4.299990177154541 } },
  { t: 24313, position: { y: -4.339990139007568 } },
  { t: 24314, position: { y: -4.379990100860596 } },
  { t: 24315, position: { y: -4.419990062713623 } },
  { t: 24316, position: { y: -4.45999002456665 } },
  { t: 24317, position: { y: -4.499989986419678 } },
  { t: 24318, position: { y: -4.539989948272705 } }
]

describe('physics: lava_sprint_to_stop', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sprint_to_stop', softFailures: true })
    h.runScenario({ name: 'lava_sprint_to_stop', ticks: TICKS })
  })
})
