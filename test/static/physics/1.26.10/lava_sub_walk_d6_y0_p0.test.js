'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d6_y0_p0
// Frames: 39  (ticks 24015..24053)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 24015, position: { x: 0.5, y: -5.21998929977417, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 24016, position: { y: -5.259989261627197 } },
  { t: 24017, position: { y: -5.299989223480225 } },
  { t: 24018, position: { y: -5.339989185333252 } },
  { t: 24019, position: { y: -5.379989147186279 } },
  { t: 24020, position: { y: -5.419989109039307 } },
  { t: 24021, position: { y: -4.379990100860596 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 24022, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 24023, position: { y: -4.399990081787109 }, delta: { y: -0.029999999329447746 } },
  { t: 24024, position: { y: -4.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 24025, position: { y: -4.464990139007568 }, delta: { y: -0.03750000149011612 } },
  { t: 24026, position: { y: -4.502490043640137 }, delta: { y: -0.038750000298023224 } },
  { t: 24027, position: { y: -4.541240215301514 }, delta: { y: -0.039374999701976776 } },
  { t: 24028, position: { y: -4.580615043640137 }, delta: { y: -0.03968749940395355 } },
  { t: 24029, position: { y: -4.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 24030, position: { y: -4.660146236419678 }, delta: { y: -0.039921872317790985 } },
  { t: 24031, position: { y: -4.70006799697876 }, delta: { y: -0.03996093571186066 } },
  { t: 24032, position: { y: -4.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 24033, position: { y: -4.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 24034, position: { y: -4.819999694824219 }, delta: { y: -0.039995115250349045 } },
  { t: 24035, position: { y: -4.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 24036, position: { y: -4.8999924659729 }, delta: { y: -0.03999877721071243 } },
  { t: 24037, position: { y: -4.939991474151611 }, delta: { y: -0.03999938815832138 } },
  { t: 24038, position: { y: -4.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 24039, position: { y: -5.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 24040, position: { y: -5.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 24041, position: { y: -5.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 24042, position: { y: -5.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 24043, position: { y: -5.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 24044, position: { y: -5.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 24045, position: { y: -5.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 24046, position: { y: -5.299990177154541 } },
  { t: 24047, position: { y: -5.339990139007568 } },
  { t: 24048, position: { y: -5.379990100860596 } },
  { t: 24049, position: { y: -5.419990062713623 } },
  { t: 24050, position: { y: -5.45999002456665 } },
  { t: 24051, position: { y: -5.499989986419678 } },
  { t: 24052, position: { y: -5.539989948272705 } },
  { t: 24053, position: { y: -5.579989910125732 } }
]

describe('physics: lava_sub_walk_d6_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d6_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d6_y0_p0', ticks: TICKS })
  })
})
