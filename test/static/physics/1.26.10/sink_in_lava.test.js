'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_sink_in_lava
// Frames: 67  (ticks 8399..8465)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8399, position: { x: 0.5, y: -0.6599894762039185, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 8400, position: { y: -0.6999894380569458 } },
  { t: 8401, position: { y: -0.7399893999099731 } },
  { t: 8402, position: { y: -0.7799893617630005 } },
  { t: 8403, position: { y: -0.8199893236160278 } },
  { t: 8404, position: { y: -0.8599892854690552 } },
  { t: 8405, position: { y: -0.37998998165130615 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 8406, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 8407, position: { y: -0.3999899625778198 }, delta: { y: -0.029999999329447746 } },
  { t: 8408, position: { y: -0.42998993396759033 }, delta: { y: -0.03500000014901161 } },
  { t: 8409, position: { y: -0.4649900197982788 }, delta: { y: -0.03750000149011612 } },
  { t: 8410, position: { y: -0.5024899244308472 }, delta: { y: -0.038750000298023224 } },
  { t: 8411, position: { y: -0.541239857673645 }, delta: { y: -0.039374999701976776 } },
  { t: 8412, position: { y: -0.5806149244308472 }, delta: { y: -0.03968749940395355 } },
  { t: 8413, position: { y: -0.6203023195266724 }, delta: { y: -0.03984374925494194 } },
  { t: 8414, position: { y: -0.6601461172103882 }, delta: { y: -0.039921872317790985 } },
  { t: 8415, position: { y: -0.7000678777694702 }, delta: { y: -0.03996093571186066 } },
  { t: 8416, position: { y: -0.7400287389755249 }, delta: { y: -0.03998046740889549 } },
  { t: 8417, position: { y: -0.7800091505050659 }, delta: { y: -0.03999023139476776 } },
  { t: 8418, position: { y: -0.8199993371963501 }, delta: { y: -0.039995115250349045 } },
  { t: 8419, position: { y: -0.8599945306777954 }, delta: { y: -0.03999755531549454 } },
  { t: 8420, position: { y: -0.8999921083450317 }, delta: { y: -0.03999877721071243 } },
  { t: 8421, position: { y: -0.9399908781051636 }, delta: { y: -0.03999938815832138 } },
  { t: 8422, position: { y: -0.9799903631210327 }, delta: { y: -0.039999693632125854 } },
  { t: 8423, position: { y: -1.019990086555481 }, delta: { y: -0.03999984636902809 } },
  { t: 8424, position: { y: -1.0599900484085083 }, delta: { y: -0.03999992460012436 } },
  { t: 8425, position: { y: -1.0999900102615356 }, delta: { y: -0.039999961853027344 } },
  { t: 8426, position: { y: -1.139989972114563 }, delta: { y: -0.039999980479478836 } },
  { t: 8427, position: { y: -1.1799899339675903 }, delta: { y: -0.03999999165534973 } },
  { t: 8428, position: { y: -1.2199898958206177 }, delta: { y: -0.03999999538064003 } },
  { t: 8429, position: { y: -1.259989857673645 }, delta: { y: -0.03999999910593033 } },
  { t: 8430, position: { y: -1.2999898195266724 } },
  { t: 8431, position: { y: -1.3399897813796997 } },
  { t: 8432, position: { y: -1.379989743232727 } },
  { t: 8433, position: { y: -1.4199897050857544 } },
  { t: 8434, position: { y: -1.4599896669387817 } },
  { t: 8435, position: { y: -1.499989628791809 } },
  { t: 8436, position: { y: -1.5399895906448364 } },
  { t: 8437, position: { y: -1.5799895524978638 } },
  { t: 8438, position: { y: -1.6199895143508911 } },
  { t: 8439, position: { y: -1.6599894762039185 } },
  { t: 8440, position: { y: -1.6999894380569458 } },
  { t: 8441, position: { y: -1.7399893999099731 } },
  { t: 8442, position: { y: -1.7799893617630005 } },
  { t: 8443, position: { y: -1.8199893236160278 } },
  { t: 8444, position: { y: -1.8599892854690552 } },
  { t: 8445, position: { y: -1.8999892473220825 } },
  { t: 8446, position: { y: -1.9399892091751099 } },
  { t: 8447, position: { y: -1.9799891710281372 } },
  { t: 8448, position: { y: -2.019989013671875 } },
  { t: 8449, position: { y: -2.0599889755249023 } },
  { t: 8450, position: { y: -2.0999889373779297 } },
  { t: 8451, position: { y: -2.139988899230957 } },
  { t: 8452, position: { y: -2.1799888610839844 } },
  { t: 8453, position: { y: -2.2199888229370117 } },
  { t: 8454, position: { y: -2.259988784790039 } },
  { t: 8455, position: { y: -2.2999887466430664 } },
  { t: 8456, position: { y: -2.3399887084960938 } },
  { t: 8457, position: { y: -2.379988670349121 } },
  { t: 8458, position: { y: -2.4199891090393066 } },
  { t: 8459, position: { y: -2.459989070892334 } },
  { t: 8460, position: { y: -2.4999890327453613 } },
  { t: 8461, position: { y: -2.5399889945983887 } },
  { t: 8462, position: { y: -2.579988956451416 } },
  { t: 8463, position: { y: -2.6199889183044434 } },
  { t: 8464, position: { y: -2.6599888801574707 } },
  { t: 8465, position: { y: -2.699988842010498 } }
]

describe('physics: sink_in_lava', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'sink_in_lava', softFailures: true })
    h.runScenario({ name: 'sink_in_lava', ticks: TICKS })
  })
})
