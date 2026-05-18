'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d3_y0_p0
// Frames: 39  (ticks 23856..23894)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23856, position: { x: 0.5, y: -2.259988784790039, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23857, position: { y: -2.2999887466430664 } },
  { t: 23858, position: { y: -2.3399887084960938 } },
  { t: 23859, position: { y: -2.379988670349121 } },
  { t: 23860, position: { y: -2.4199891090393066 } },
  { t: 23861, position: { y: -1.3799899816513062 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23862, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23863, position: { y: -1.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 23864, position: { y: -1.4299899339675903 }, delta: { y: -0.03500000014901161 } },
  { t: 23865, position: { y: -1.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 23866, position: { y: -1.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 23867, position: { y: -1.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 23868, position: { y: -1.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 23869, position: { y: -1.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 23870, position: { y: -1.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 23871, position: { y: -1.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 23872, position: { y: -1.740028738975525 }, delta: { y: -0.03998046740889549 } },
  { t: 23873, position: { y: -1.780009150505066 }, delta: { y: -0.03999023139476776 } },
  { t: 23874, position: { y: -1.81999933719635 }, delta: { y: -0.039995115250349045 } },
  { t: 23875, position: { y: -1.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 23876, position: { y: -1.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 23877, position: { y: -1.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 23878, position: { y: -1.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 23879, position: { y: -2.0199899673461914 }, delta: { y: -0.03999984636902809 } },
  { t: 23880, position: { y: -2.0599899291992188 }, delta: { y: -0.03999992460012436 } },
  { t: 23881, position: { y: -2.099989891052246 }, delta: { y: -0.039999961853027344 } },
  { t: 23882, position: { y: -2.1399898529052734 }, delta: { y: -0.039999980479478836 } },
  { t: 23883, position: { y: -2.179989814758301 }, delta: { y: -0.03999999165534973 } },
  { t: 23884, position: { y: -2.219989776611328 }, delta: { y: -0.03999999538064003 } },
  { t: 23885, position: { y: -2.2599897384643555 }, delta: { y: -0.03999999910593033 } },
  { t: 23886, position: { y: -2.299989700317383 } },
  { t: 23887, position: { y: -2.33998966217041 } },
  { t: 23888, position: { y: -2.3799896240234375 } },
  { t: 23889, position: { y: -2.419990062713623 } },
  { t: 23890, position: { y: -2.4599900245666504 } },
  { t: 23891, position: { y: -2.4999899864196777 } },
  { t: 23892, position: { y: -2.539989948272705 } },
  { t: 23893, position: { y: -2.5799899101257324 } },
  { t: 23894, position: { y: -2.6199898719787598 } }
]

describe('physics: lava_sub_walk_d3_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d3_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d3_y0_p0', ticks: TICKS })
  })
})
