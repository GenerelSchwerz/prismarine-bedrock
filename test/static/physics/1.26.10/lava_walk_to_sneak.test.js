'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_walk_to_sneak
// Frames: 39  (ticks 24227..24265)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 24227, position: { x: 0.5, y: -3.3799901008605957, z: 300.5 }, headYaw: -0.000030517578125, inputs: { handledTeleport: true, blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 24228, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 24229, position: { y: -3.3999900817871094 }, yaw: -0.000030517578125, delta: { y: -0.029999999329447746 } },
  { t: 24230, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 24231, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 24232, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 24233, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 24234, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 24235, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 24236, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 24237, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 24238, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 24239, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 24240, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 24241, position: { y: -3.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 24242, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 24243, position: { y: -3.3999900817871094 }, yaw: -0.000030517578125, delta: { y: -0.029999999329447746 } },
  { t: 24244, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 24245, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 24246, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 24247, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 24248, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 24249, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 24250, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 24251, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 24252, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 24253, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 24254, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 24255, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 24256, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 24257, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 24258, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 24259, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 24260, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 24261, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 24262, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 24263, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 24264, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 24265, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } }
]

describe('physics: lava_walk_to_sneak', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_walk_to_sneak', softFailures: true })
    h.runScenario({ name: 'lava_walk_to_sneak', ticks: TICKS })
  })
})
