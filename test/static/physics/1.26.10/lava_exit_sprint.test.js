'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_exit_sprint
// Frames: 49  (ticks 23040..23088)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23040, position: { x: 3.5, y: -3.6199889183044434, z: 400.5 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23041, position: { y: -3.6599888801574707 } },
  { t: 23042, position: { y: -3.699988842010498 } },
  { t: 23043, position: { y: -3.7399888038635254 } },
  { t: 23044, position: { y: -3.7799887657165527 } },
  { t: 23045, position: { y: -1.3799899816513062 }, yaw: -90, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23046, yaw: -90.00000762939453, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23047, position: { y: -1.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 23048, position: { y: -1.4299899339675903 }, delta: { y: -0.03500000014901161 } },
  { t: 23049, position: { y: -1.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 23050, position: { y: -1.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 23051, position: { y: -1.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 23052, position: { y: -1.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 23053, position: { y: -1.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 23054, position: { y: -1.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 23055, position: { y: -1.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 23056, position: { y: -1.740028738975525 }, delta: { y: -0.03998046740889549 } },
  { t: 23057, position: { y: -1.780009150505066 }, delta: { y: -0.03999023139476776 } },
  { t: 23058, position: { y: -1.81999933719635 }, delta: { y: -0.039995115250349045 } },
  { t: 23059, position: { y: -1.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 23060, position: { y: -1.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 23061, position: { y: -1.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 23062, position: { y: -1.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 23063, position: { y: -2.0199899673461914 }, delta: { y: -0.03999984636902809 } },
  { t: 23064, position: { y: -2.0599899291992188 }, delta: { y: -0.03999992460012436 } },
  { t: 23065, position: { y: -2.099989891052246 }, delta: { y: -0.039999961853027344 } },
  { t: 23066, position: { y: -2.1399898529052734 }, delta: { y: -0.039999980479478836 } },
  { t: 23067, position: { y: -2.179989814758301 }, delta: { y: -0.03999999165534973 } },
  { t: 23068, position: { y: -2.219989776611328 }, delta: { y: -0.03999999538064003 } },
  { t: 23069, position: { y: -2.2599897384643555 }, delta: { y: -0.03999999910593033 } },
  { t: 23070, position: { y: -2.299989700317383 } },
  { t: 23071, position: { y: -2.33998966217041 } },
  { t: 23072, position: { y: -2.3799896240234375 } },
  { t: 23073, position: { y: -2.419990062713623 } },
  { t: 23074, position: { y: -2.4599900245666504 } },
  { t: 23075, position: { y: -2.4999899864196777 } },
  { t: 23076, position: { y: -2.539989948272705 } },
  { t: 23077, position: { y: -2.5799899101257324 } },
  { t: 23078, position: { y: -2.6199898719787598 } },
  { t: 23079, position: { y: -2.659989833831787 } },
  { t: 23080, position: { y: -2.6999897956848145 } },
  { t: 23081, position: { y: -2.739989757537842 } },
  { t: 23082, position: { y: -2.779989719390869 } },
  { t: 23083, position: { y: -2.8199896812438965 } },
  { t: 23084, position: { y: -2.859989643096924 } },
  { t: 23085, position: { y: -2.899989604949951 } },
  { t: 23086, position: { y: -2.9399895668029785 } },
  { t: 23087, position: { y: -2.979989528656006 } },
  { t: 23088, position: { y: -3.019989490509033 } }
]

describe('physics: lava_exit_sprint', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_exit_sprint', softFailures: true })
    h.runScenario({ name: 'lava_exit_sprint', ticks: TICKS })
  })
})
