'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_swim_up
// Frames: 58  (ticks 7818..7875)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 7818, position: { x: 0.5, y: -6.059988498687744, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 7819, position: { y: -6.0999884605407715 } },
  { t: 7820, position: { y: -6.139988422393799 } },
  { t: 7821, position: { y: -6.179988384246826 } },
  { t: 7822, position: { y: -3.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 7823, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 7824, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 7825, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 7826, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 7827, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 7828, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 7829, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 7830, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 7831, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 7832, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 7833, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 7834, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 7835, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 7836, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 7837, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 7838, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 7839, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 7840, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 7841, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 7842, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 7843, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 7844, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 7845, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 7846, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 7847, position: { y: -4.299990177154541 } },
  { t: 7848, position: { y: -4.339990139007568 } },
  { t: 7849, position: { y: -4.379990100860596 } },
  { t: 7850, position: { y: -4.419990062713623 } },
  { t: 7851, position: { y: -4.45999002456665 } },
  { t: 7852, position: { y: -4.499989986419678 } },
  { t: 7853, position: { y: -4.539989948272705 } },
  { t: 7854, position: { y: -4.579989910125732 } },
  { t: 7855, position: { y: -4.61998987197876 } },
  { t: 7856, position: { y: -4.659989833831787 } },
  { t: 7857, position: { y: -4.6999897956848145 } },
  { t: 7858, position: { y: -4.739989757537842 } },
  { t: 7859, position: { y: -4.779989719390869 } },
  { t: 7860, position: { y: -4.8199896812438965 } },
  { t: 7861, position: { y: -4.859989643096924 } },
  { t: 7862, position: { y: -4.899989604949951 } },
  { t: 7863, position: { y: -4.9399895668029785 } },
  { t: 7864, position: { y: -4.979989528656006 } },
  { t: 7865, position: { y: -5.019989490509033 } },
  { t: 7866, position: { y: -5.0599894523620605 } },
  { t: 7867, position: { y: -5.099989414215088 } },
  { t: 7868, position: { y: -5.139989376068115 } },
  { t: 7869, position: { y: -5.179989337921143 } },
  { t: 7870, position: { y: -5.21998929977417 } },
  { t: 7871, position: { y: -5.259989261627197 } },
  { t: 7872, position: { y: -5.299989223480225 } },
  { t: 7873, position: { y: -5.339989185333252 } },
  { t: 7874, position: { y: -5.379989147186279 } },
  { t: 7875, position: { y: -5.419989109039307 } }
]

describe('physics: lava_swim_up', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_swim_up', softFailures: true })
    h.runScenario({ name: 'lava_swim_up', ticks: TICKS })
  })
})
