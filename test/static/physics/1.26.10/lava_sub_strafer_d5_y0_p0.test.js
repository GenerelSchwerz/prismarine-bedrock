'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_strafeR_d5_y0_p0
// Frames: 49  (ticks 22204..22252)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22204, position: { x: 0.5, y: -5.659988880157471, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 22205, position: { y: -5.699988842010498 } },
  { t: 22206, position: { y: -5.739988803863525 } },
  { t: 22207, position: { y: -5.779988765716553 } },
  { t: 22208, position: { y: -5.81998872756958 } },
  { t: 22209, position: { y: -3.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22210, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 22211, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 22212, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 22213, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 22214, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 22215, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 22216, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 22217, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 22218, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 22219, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 22220, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 22221, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 22222, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 22223, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 22224, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 22225, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 22226, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 22227, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 22228, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 22229, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 22230, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 22231, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 22232, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 22233, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 22234, position: { y: -4.299990177154541 } },
  { t: 22235, position: { y: -4.339990139007568 } },
  { t: 22236, position: { y: -4.379990100860596 } },
  { t: 22237, position: { y: -4.419990062713623 } },
  { t: 22238, position: { y: -4.45999002456665 } },
  { t: 22239, position: { y: -4.499989986419678 } },
  { t: 22240, position: { y: -4.539989948272705 } },
  { t: 22241, position: { y: -4.579989910125732 } },
  { t: 22242, position: { y: -4.61998987197876 } },
  { t: 22243, position: { y: -4.659989833831787 } },
  { t: 22244, position: { y: -4.6999897956848145 } },
  { t: 22245, position: { y: -4.739989757537842 } },
  { t: 22246, position: { y: -4.779989719390869 } },
  { t: 22247, position: { y: -4.8199896812438965 } },
  { t: 22248, position: { y: -4.859989643096924 } },
  { t: 22249, position: { y: -4.899989604949951 } },
  { t: 22250, position: { y: -4.9399895668029785 } },
  { t: 22251, position: { y: -4.979989528656006 } },
  { t: 22252, position: { y: -5.019989490509033 } }
]

describe('physics: lava_sub_strafeR_d5_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_strafeR_d5_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_strafeR_d5_y0_p0', ticks: TICKS })
  })
})
