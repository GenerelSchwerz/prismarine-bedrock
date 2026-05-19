'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_water_depth_strider_3
// Frames: 58  (ticks 7556..7613)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 7556, position: { x: 0.5, y: 1.6200100183486938, z: 88.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 7557 },
  { t: 7558 },
  { t: 7559 },
  { t: 7560 },
  { t: 7561 },
  { t: 7562, position: { y: -3.3799901008605957, z: 100.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 7563, yaw: -0.000030517578125, delta: { y: -0.004999999888241291 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 7564, position: { y: -3.3849902153015137 }, delta: { y: -0.008999999612569809 } },
  { t: 7565, position: { y: -3.3939900398254395 }, delta: { y: -0.012199999764561653 } },
  { t: 7566, position: { y: -3.4061899185180664 }, delta: { y: -0.014759999699890614 } },
  { t: 7567, position: { y: -3.420949935913086 }, delta: { y: -0.016807999461889267 } },
  { t: 7568, position: { y: -3.437757968902588 }, delta: { y: -0.01844640076160431 } },
  { t: 7569, position: { y: -3.456204414367676 }, delta: { y: -0.019757121801376343 } },
  { t: 7570, position: { y: -3.475961685180664 }, delta: { y: -0.02080569788813591 } },
  { t: 7571, position: { y: -3.496767520904541 }, delta: { y: -0.021644558757543564 } },
  { t: 7572, position: { y: -3.5184121131896973 }, delta: { y: -0.022315647453069687 } },
  { t: 7573, position: { y: -3.5407276153564453 }, delta: { y: -0.022852517664432526 } },
  { t: 7574, position: { y: -3.56358003616333 }, delta: { y: -0.023282013833522797 } },
  { t: 7575, position: { y: -3.586862087249756 }, delta: { y: -0.023625612258911133 } },
  { t: 7576, position: { y: -3.610487461090088 }, delta: { y: -0.023900490254163742 } },
  { t: 7577, position: { y: -3.634387969970703 }, delta: { y: -0.02412039414048195 } },
  { t: 7578, position: { y: -3.65850830078125 }, delta: { y: -0.024296317249536514 } },
  { t: 7579, position: { y: -3.682804584503174 }, delta: { y: -0.024437054991722107 } },
  { t: 7580, position: { y: -3.7072415351867676 }, delta: { y: -0.02454964444041252 } },
  { t: 7581, position: { y: -3.7317910194396973 }, delta: { y: -0.024639714509248734 } },
  { t: 7582, position: { y: -3.7564306259155273 }, delta: { y: -0.024711772799491882 } },
  { t: 7583, position: { y: -3.781142234802246 }, delta: { y: -0.024769417941570282 } },
  { t: 7584, position: { y: -3.8059115409851074 }, delta: { y: -0.024815533310174942 } },
  { t: 7585, position: { y: -3.8307271003723145 }, delta: { y: -0.02485242858529091 } },
  { t: 7586, position: { y: -3.855579376220703 }, delta: { y: -0.024881944060325623 } },
  { t: 7587, position: { y: -3.8804612159729004 }, delta: { y: -0.024905554950237274 } },
  { t: 7588, position: { y: -3.905366897583008 }, delta: { y: -0.024924445897340775 } },
  { t: 7589, position: { y: -3.930291175842285 }, delta: { y: -0.024939555674791336 } },
  { t: 7590, position: { y: -3.955230712890625 }, delta: { y: -0.024951644241809845 } },
  { t: 7591, position: { y: -3.98018217086792 }, delta: { y: -0.024961315095424652 } },
  { t: 7592, position: { y: -4.005143642425537 }, delta: { y: -0.024969052523374557 } },
  { t: 7593, position: { y: -4.0301127433776855 }, delta: { y: -0.0249752439558506 } },
  { t: 7594, position: { y: -4.055088043212891 }, delta: { y: -0.024980194866657257 } },
  { t: 7595, position: { y: -4.080068111419678 }, delta: { y: -0.024984154850244522 } },
  { t: 7596, position: { y: -4.105052471160889 }, delta: { y: -0.024987325072288513 } },
  { t: 7597, position: { y: -4.130039691925049 }, delta: { y: -0.024989861994981766 } },
  { t: 7598, position: { y: -4.155029773712158 }, delta: { y: -0.02499188855290413 } },
  { t: 7599, position: { y: -4.1800217628479 }, delta: { y: -0.02499351277947426 } },
  { t: 7600, position: { y: -4.205015182495117 }, delta: { y: -0.024994809180498123 } },
  { t: 7601, position: { y: -4.230010032653809 }, delta: { y: -0.024995848536491394 } },
  { t: 7602, position: { y: -4.255005836486816 }, delta: { y: -0.02499667927622795 } },
  { t: 7603, position: { y: -4.280002593994141 }, delta: { y: -0.024997342377901077 } },
  { t: 7604, position: { y: -4.304999828338623 }, delta: { y: -0.024997875094413757 } },
  { t: 7605, position: { y: -4.329997539520264 }, delta: { y: -0.024998299777507782 } },
  { t: 7606, position: { y: -4.3549957275390625 }, delta: { y: -0.024998638778924942 } },
  { t: 7607, position: { y: -4.3799943923950195 }, delta: { y: -0.02499891072511673 } },
  { t: 7608, position: { y: -4.404993534088135 }, delta: { y: -0.02499913051724434 } },
  { t: 7609, position: { y: -4.42999267578125 }, delta: { y: -0.024999305605888367 } },
  { t: 7610, position: { y: -4.454991817474365 }, delta: { y: -0.02499944344162941 } },
  { t: 7611, position: { y: -4.479991436004639 }, delta: { y: -0.024999555200338364 } },
  { t: 7612, position: { y: -4.504991054534912 }, delta: { y: -0.024999644607305527 } },
  { t: 7613, position: { y: -4.5299906730651855 }, delta: { y: -0.024999715387821198 } }
]

describe('physics: water_depth_strider_3', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'water_depth_strider_3', softFailures: true })
    h.runScenario({ name: 'water_depth_strider_3', ticks: TICKS })
  })
})
