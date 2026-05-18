'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_exit_walk
// Frames: 49  (ticks 22977..23025)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22977, position: { x: -4.5, y: -8.379989624023438, z: 400.5 }, yaw: 90, headYaw: 90, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 22978 },
  { t: 22979 },
  { t: 22980 },
  { t: 22981 },
  { t: 22982, position: { x: 3.5, y: -1.3799899816513062 }, yaw: -90, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22983, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 22984, position: { y: -1.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 22985, position: { y: -1.4299899339675903 }, delta: { y: -0.03500000014901161 } },
  { t: 22986, position: { y: -1.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 22987, position: { y: -1.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 22988, position: { y: -1.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 22989, position: { y: -1.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 22990, position: { y: -1.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 22991, position: { y: -1.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 22992, position: { y: -1.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 22993, position: { y: -1.740028738975525 }, delta: { y: -0.03998046740889549 } },
  { t: 22994, position: { y: -1.780009150505066 }, delta: { y: -0.03999023139476776 } },
  { t: 22995, position: { y: -1.81999933719635 }, delta: { y: -0.039995115250349045 } },
  { t: 22996, position: { y: -1.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 22997, position: { y: -1.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 22998, position: { y: -1.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 22999, position: { y: -1.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 23000, position: { y: -2.0199899673461914 }, delta: { y: -0.03999984636902809 } },
  { t: 23001, position: { y: -2.0599899291992188 }, delta: { y: -0.03999992460012436 } },
  { t: 23002, position: { y: -2.099989891052246 }, delta: { y: -0.039999961853027344 } },
  { t: 23003, position: { y: -2.1399898529052734 }, delta: { y: -0.039999980479478836 } },
  { t: 23004, position: { y: -2.179989814758301 }, delta: { y: -0.03999999165534973 } },
  { t: 23005, position: { y: -2.219989776611328 }, delta: { y: -0.03999999538064003 } },
  { t: 23006, position: { y: -2.2599897384643555 }, delta: { y: -0.03999999910593033 } },
  { t: 23007, position: { y: -2.299989700317383 } },
  { t: 23008, position: { y: -2.33998966217041 } },
  { t: 23009, position: { y: -2.3799896240234375 } },
  { t: 23010, position: { y: -2.419990062713623 } },
  { t: 23011, position: { y: -2.4599900245666504 } },
  { t: 23012, position: { y: -2.4999899864196777 } },
  { t: 23013, position: { y: -2.539989948272705 } },
  { t: 23014, position: { y: -2.5799899101257324 } },
  { t: 23015, position: { y: -2.6199898719787598 } },
  { t: 23016, position: { y: -2.659989833831787 } },
  { t: 23017, position: { y: -2.6999897956848145 } },
  { t: 23018, position: { y: -2.739989757537842 } },
  { t: 23019, position: { y: -2.779989719390869 } },
  { t: 23020, position: { y: -2.8199896812438965 } },
  { t: 23021, position: { y: -2.859989643096924 } },
  { t: 23022, position: { y: -2.899989604949951 } },
  { t: 23023, position: { y: -2.9399895668029785 } },
  { t: 23024, position: { y: -2.979989528656006 } },
  { t: 23025, position: { y: -3.019989490509033 } }
]

describe('physics: lava_exit_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_exit_walk', softFailures: true })
    h.runScenario({ name: 'lava_exit_walk', ticks: TICKS })
  })
})
