'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d2_y0_p0
// Frames: 39  (ticks 23803..23841)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23803, position: { x: 0.5, y: -5.21998929977417, z: 300.5 }, yaw: -139.00216674804688, pitch: 30.000717163085938, headYaw: -139.00216674804688, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23804, position: { y: -5.259989261627197 } },
  { t: 23805, position: { y: -5.299989223480225 } },
  { t: 23806, position: { y: -5.339989185333252 } },
  { t: 23807, position: { y: -0.37998998165130615 }, yaw: 0, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23808, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23809, position: { y: -0.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 23810, position: { y: -0.42998993396759033 }, delta: { y: -0.03500000014901161 } },
  { t: 23811, position: { y: -0.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 23812, position: { y: -0.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 23813, position: { y: -0.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 23814, position: { y: -0.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 23815, position: { y: -0.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 23816, position: { y: -0.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 23817, position: { y: -0.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 23818, position: { y: -0.7400287389755249 }, delta: { y: -0.03998046740889549 } },
  { t: 23819, position: { y: -0.7800091505050659 }, delta: { y: -0.03999023139476776 } },
  { t: 23820, position: { y: -0.8199993371963501 }, delta: { y: -0.039995115250349045 } },
  { t: 23821, position: { y: -0.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 23822, position: { y: -0.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 23823, position: { y: -0.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 23824, position: { y: -0.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 23825, position: { y: -1.019990086555481 }, delta: { y: -0.03999984636902809 } },
  { t: 23826, position: { y: -1.0599900484085083 }, delta: { y: -0.03999992460012436 } },
  { t: 23827, position: { y: -1.0999900102615356 }, delta: { y: -0.039999961853027344 } },
  { t: 23828, position: { y: -1.139989972114563 }, delta: { y: -0.039999980479478836 } },
  { t: 23829, position: { y: -1.1799899339675903 }, delta: { y: -0.03999999165534973 } },
  { t: 23830, position: { y: -1.2199898958206177 }, delta: { y: -0.03999999538064003 } },
  { t: 23831, position: { y: -1.259989857673645 }, delta: { y: -0.03999999910593033 } },
  { t: 23832, position: { y: -1.2999898195266724 } },
  { t: 23833, position: { y: -1.3399897813796997 } },
  { t: 23834, position: { y: -1.379989743232727 } },
  { t: 23835, position: { y: -1.4199897050857544 } },
  { t: 23836, position: { y: -1.4599896669387817 } },
  { t: 23837, position: { y: -1.499989628791809 } },
  { t: 23838, position: { y: -1.5399895906448364 } },
  { t: 23839, position: { y: -1.5799895524978638 } },
  { t: 23840, position: { y: -1.6199895143508911 } },
  { t: 23841, position: { y: -1.6599894762039185 } }
]

describe('physics: lava_sub_walk_d2_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d2_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d2_y0_p0', ticks: TICKS })
  })
})
