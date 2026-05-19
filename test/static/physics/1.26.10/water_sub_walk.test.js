'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_water_sub_walk
// Frames: 44  (ticks 6599..6642)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 6599, position: { x: 0.5, y: 1.6200100183486938, z: 88.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 6600 },
  { t: 6601 },
  { t: 6602 },
  { t: 6603 },
  { t: 6604, position: { y: -3.3799901008605957, z: 100.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 6605, yaw: -0.000030517578125, delta: { y: -0.004999999888241291 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 6606, position: { y: -3.3849902153015137 }, delta: { y: -0.008999999612569809 } },
  { t: 6607, position: { y: -3.3939900398254395 }, delta: { y: -0.012199999764561653 } },
  { t: 6608, position: { y: -3.4061899185180664 }, delta: { y: -0.014759999699890614 } },
  { t: 6609, position: { y: -3.420949935913086 }, delta: { y: -0.016807999461889267 } },
  { t: 6610, position: { y: -3.437757968902588 }, delta: { y: -0.01844640076160431 } },
  { t: 6611, position: { y: -3.456204414367676 }, delta: { y: -0.019757121801376343 } },
  { t: 6612, position: { y: -3.475961685180664 }, delta: { y: -0.02080569788813591 } },
  { t: 6613, position: { y: -3.496767520904541 }, delta: { y: -0.021644558757543564 } },
  { t: 6614, position: { y: -3.5184121131896973 }, delta: { y: -0.022315647453069687 } },
  { t: 6615, position: { y: -3.5407276153564453 }, delta: { y: -0.022852517664432526 } },
  { t: 6616, position: { y: -3.56358003616333 }, delta: { y: -0.023282013833522797 } },
  { t: 6617, position: { y: -3.586862087249756 }, delta: { y: -0.023625612258911133 } },
  { t: 6618, position: { y: -3.610487461090088 }, delta: { y: -0.023900490254163742 } },
  { t: 6619, position: { y: -3.634387969970703 }, delta: { y: -0.02412039414048195 } },
  { t: 6620, position: { y: -3.65850830078125 }, delta: { y: -0.024296317249536514 } },
  { t: 6621, position: { y: -3.682804584503174 }, delta: { y: -0.024437054991722107 } },
  { t: 6622, position: { y: -3.7072415351867676 }, delta: { y: -0.02454964444041252 } },
  { t: 6623, position: { y: -3.7317910194396973 }, delta: { y: -0.024639714509248734 } },
  { t: 6624, position: { y: -3.7564306259155273 }, delta: { y: -0.024711772799491882 } },
  { t: 6625, position: { y: -3.781142234802246 }, delta: { y: -0.024769417941570282 } },
  { t: 6626, position: { y: -3.8059115409851074 }, delta: { y: -0.024815533310174942 } },
  { t: 6627, position: { y: -3.8307271003723145 }, delta: { y: -0.02485242858529091 } },
  { t: 6628, position: { y: -3.855579376220703 }, delta: { y: -0.024881944060325623 } },
  { t: 6629, position: { y: -3.8804612159729004 }, delta: { y: -0.024905554950237274 } },
  { t: 6630, position: { y: -3.905366897583008 }, delta: { y: -0.024924445897340775 } },
  { t: 6631, position: { y: -3.930291175842285 }, delta: { y: -0.024939555674791336 } },
  { t: 6632, position: { y: -3.955230712890625 }, delta: { y: -0.024951644241809845 } },
  { t: 6633, position: { y: -3.98018217086792 }, delta: { y: -0.024961315095424652 } },
  { t: 6634, position: { y: -4.005143642425537 }, delta: { y: -0.024969052523374557 } },
  { t: 6635, position: { y: -4.0301127433776855 }, delta: { y: -0.0249752439558506 } },
  { t: 6636, position: { y: -4.055088043212891 }, delta: { y: -0.024980194866657257 } },
  { t: 6637, position: { y: -4.080068111419678 }, delta: { y: -0.024984154850244522 } },
  { t: 6638, position: { y: -4.105052471160889 }, delta: { y: -0.024987325072288513 } },
  { t: 6639, position: { y: -4.130039691925049 }, delta: { y: -0.024989861994981766 } },
  { t: 6640, position: { y: -4.155029773712158 }, delta: { y: -0.02499188855290413 } },
  { t: 6641, position: { y: -4.1800217628479 }, delta: { y: -0.02499351277947426 } },
  { t: 6642, position: { y: -4.205015182495117 }, delta: { y: -0.024994809180498123 } }
]

describe('physics: water_sub_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'water_sub_walk', softFailures: true })
    h.runScenario({ name: 'water_sub_walk', ticks: TICKS })
  })
})
