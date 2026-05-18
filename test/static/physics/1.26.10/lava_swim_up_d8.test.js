'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_swim_up_d8
// Frames: 39  (ticks 22383..22421)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22383, position: { x: 0.5, y: -5.21998929977417, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 22384, position: { y: -5.259989261627197 } },
  { t: 22385, position: { y: -5.299989223480225 } },
  { t: 22386, position: { y: -5.339989185333252 } },
  { t: 22387, position: { y: -6.379990100860596 }, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22388, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 22389, position: { y: -6.399990558624268 }, delta: { y: -0.029999999329447746 } },
  { t: 22390, position: { y: -6.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 22391, position: { y: -6.464990139007568 }, delta: { y: -0.03750000149011612 } },
  { t: 22392, position: { y: -6.502490520477295 }, delta: { y: -0.038750000298023224 } },
  { t: 22393, position: { y: -6.541240215301514 }, delta: { y: -0.039374999701976776 } },
  { t: 22394, position: { y: -6.580615520477295 }, delta: { y: -0.03968749940395355 } },
  { t: 22395, position: { y: -6.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 22396, position: { y: -6.660146236419678 }, delta: { y: -0.039921872317790985 } },
  { t: 22397, position: { y: -6.70006799697876 }, delta: { y: -0.03996093571186066 } },
  { t: 22398, position: { y: -6.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 22399, position: { y: -6.780009746551514 }, delta: { y: -0.03999023139476776 } },
  { t: 22400, position: { y: -6.820000171661377 }, delta: { y: -0.039995115250349045 } },
  { t: 22401, position: { y: -6.859995365142822 }, delta: { y: -0.03999755531549454 } },
  { t: 22402, position: { y: -6.8999924659729 }, delta: { y: -0.03999877721071243 } },
  { t: 22403, position: { y: -6.939991474151611 }, delta: { y: -0.03999938815832138 } },
  { t: 22404, position: { y: -6.979990482330322 }, delta: { y: -0.039999693632125854 } },
  { t: 22405, position: { y: -7.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 22406, position: { y: -7.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 22407, position: { y: -7.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 22408, position: { y: -7.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 22409, position: { y: -7.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 22410, position: { y: -7.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 22411, position: { y: -7.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 22412, position: { y: -7.299990177154541 } },
  { t: 22413, position: { y: -7.339990139007568 } },
  { t: 22414, position: { y: -7.379990100860596 } },
  { t: 22415, position: { y: -7.419990062713623 } },
  { t: 22416, position: { y: -7.45999002456665 } },
  { t: 22417, position: { y: -7.499989986419678 } },
  { t: 22418, position: { y: -7.539989948272705 } },
  { t: 22419, position: { y: -7.579989910125732 } },
  { t: 22420, position: { y: -7.61998987197876 } },
  { t: 22421, position: { y: -7.659989833831787 } }
]

describe('physics: lava_swim_up_d8', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_swim_up_d8', softFailures: true })
    h.runScenario({ name: 'lava_swim_up_d8', ticks: TICKS })
  })
})
