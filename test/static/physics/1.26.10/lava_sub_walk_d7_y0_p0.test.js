'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d7_y0_p0
// Frames: 39  (ticks 24068..24106)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 24068, position: { x: 0.5, y: -6.179989337921143, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 24069, position: { y: -6.21998929977417 } },
  { t: 24070, position: { y: -6.259989261627197 } },
  { t: 24071, position: { y: -6.299989223480225 } },
  { t: 24072, position: { y: -6.339989185333252 } },
  { t: 24073, position: { y: -5.379990100860596 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 24074, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 24075, position: { y: -5.399990081787109 }, delta: { y: -0.029999999329447746 } },
  { t: 24076, position: { y: -5.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 24077, position: { y: -5.464990139007568 }, delta: { y: -0.03750000149011612 } },
  { t: 24078, position: { y: -5.502490043640137 }, delta: { y: -0.038750000298023224 } },
  { t: 24079, position: { y: -5.541240215301514 }, delta: { y: -0.039374999701976776 } },
  { t: 24080, position: { y: -5.580615043640137 }, delta: { y: -0.03968749940395355 } },
  { t: 24081, position: { y: -5.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 24082, position: { y: -5.660146236419678 }, delta: { y: -0.039921872317790985 } },
  { t: 24083, position: { y: -5.70006799697876 }, delta: { y: -0.03996093571186066 } },
  { t: 24084, position: { y: -5.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 24085, position: { y: -5.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 24086, position: { y: -5.819999694824219 }, delta: { y: -0.039995115250349045 } },
  { t: 24087, position: { y: -5.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 24088, position: { y: -5.8999924659729 }, delta: { y: -0.03999877721071243 } },
  { t: 24089, position: { y: -5.939991474151611 }, delta: { y: -0.03999938815832138 } },
  { t: 24090, position: { y: -5.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 24091, position: { y: -6.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 24092, position: { y: -6.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 24093, position: { y: -6.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 24094, position: { y: -6.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 24095, position: { y: -6.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 24096, position: { y: -6.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 24097, position: { y: -6.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 24098, position: { y: -6.299990177154541 } },
  { t: 24099, position: { y: -6.339990139007568 } },
  { t: 24100, position: { y: -6.379990100860596 } },
  { t: 24101, position: { y: -6.419990062713623 } },
  { t: 24102, position: { y: -6.45999002456665 } },
  { t: 24103, position: { y: -6.499989986419678 } },
  { t: 24104, position: { y: -6.539989948272705 } },
  { t: 24105, position: { y: -6.579989910125732 } },
  { t: 24106, position: { y: -6.61998987197876 } }
]

describe('physics: lava_sub_walk_d7_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d7_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d7_y0_p0', ticks: TICKS })
  })
})
