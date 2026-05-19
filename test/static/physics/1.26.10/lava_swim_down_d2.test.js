'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_swim_down_d2
// Frames: 39  (ticks 22436..22474)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22436, position: { x: 0.5, y: -8.259988784790039, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 22437, position: { y: -8.299988746643066 } },
  { t: 22438, position: { y: -8.339988708496094 } },
  { t: 22439, position: { y: -8.379988670349121 } },
  { t: 22440, delta: { y: -0.019999999552965164 }, inputs: { verticalCollision: true } },
  { t: 22441, position: { y: -0.37998998165130615 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22442, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 22443, position: { y: -0.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 22444, position: { y: -0.42998993396759033 }, delta: { y: -0.03500000014901161 } },
  { t: 22445, position: { y: -0.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 22446, position: { y: -0.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 22447, position: { y: -0.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 22448, position: { y: -0.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 22449, position: { y: -0.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 22450, position: { y: -0.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 22451, position: { y: -0.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 22452, position: { y: -0.7400287389755249 }, delta: { y: -0.03998046740889549 } },
  { t: 22453, position: { y: -0.7800091505050659 }, delta: { y: -0.03999023139476776 } },
  { t: 22454, position: { y: -0.8199993371963501 }, delta: { y: -0.039995115250349045 } },
  { t: 22455, position: { y: -0.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 22456, position: { y: -0.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 22457, position: { y: -0.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 22458, position: { y: -0.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 22459, position: { y: -1.019990086555481 }, delta: { y: -0.03999984636902809 } },
  { t: 22460, position: { y: -1.0599900484085083 }, delta: { y: -0.03999992460012436 } },
  { t: 22461, position: { y: -1.0999900102615356 }, delta: { y: -0.039999961853027344 } },
  { t: 22462, position: { y: -1.139989972114563 }, delta: { y: -0.039999980479478836 } },
  { t: 22463, position: { y: -1.1799899339675903 }, delta: { y: -0.03999999165534973 } },
  { t: 22464, position: { y: -1.2199898958206177 }, delta: { y: -0.03999999538064003 } },
  { t: 22465, position: { y: -1.259989857673645 }, delta: { y: -0.03999999910593033 } },
  { t: 22466, position: { y: -1.2999898195266724 } },
  { t: 22467, position: { y: -1.3399897813796997 } },
  { t: 22468, position: { y: -1.379989743232727 } },
  { t: 22469, position: { y: -1.4199897050857544 } },
  { t: 22470, position: { y: -1.4599896669387817 } },
  { t: 22471, position: { y: -1.499989628791809 } },
  { t: 22472, position: { y: -1.5399895906448364 } },
  { t: 22473, position: { y: -1.5799895524978638 } },
  { t: 22474, position: { y: -1.6199895143508911 } }
]

describe('physics: lava_swim_down_d2', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_swim_down_d2', softFailures: true })
    h.runScenario({ name: 'lava_swim_down_d2', ticks: TICKS })
  })
})
