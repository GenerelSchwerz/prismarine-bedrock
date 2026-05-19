'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk
// Frames: 44  (ticks 7744..7787)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 7744, position: { x: 0.5, y: 1.6200100183486938, z: 288.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 7745 },
  { t: 7746 },
  { t: 7747 },
  { t: 7748 },
  { t: 7749, position: { y: -3.3799901008605957, z: 300.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 7750, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 7751, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 7752, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 7753, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 7754, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 7755, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 7756, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 7757, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 7758, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 7759, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 7760, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 7761, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 7762, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 7763, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 7764, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 7765, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 7766, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 7767, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 7768, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 7769, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 7770, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 7771, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 7772, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 7773, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 7774, position: { y: -4.299990177154541 } },
  { t: 7775, position: { y: -4.339990139007568 } },
  { t: 7776, position: { y: -4.379990100860596 } },
  { t: 7777, position: { y: -4.419990062713623 } },
  { t: 7778, position: { y: -4.45999002456665 } },
  { t: 7779, position: { y: -4.499989986419678 } },
  { t: 7780, position: { y: -4.539989948272705 } },
  { t: 7781, position: { y: -4.579989910125732 } },
  { t: 7782, position: { y: -4.61998987197876 } },
  { t: 7783, position: { y: -4.659989833831787 } },
  { t: 7784, position: { y: -4.6999897956848145 } },
  { t: 7785, position: { y: -4.739989757537842 } },
  { t: 7786, position: { y: -4.779989719390869 } },
  { t: 7787, position: { y: -4.8199896812438965 } }
]

describe('physics: lava_sub_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk', ticks: TICKS })
  })
})
