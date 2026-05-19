'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_surface_sneak_y0
// Frames: 39  (ticks 22648..22686)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22648, position: { x: 0.5, y: -1.0927823781967163, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 22649, position: { y: -1.1327823400497437 } },
  { t: 22650, position: { y: -1.172782301902771 } },
  { t: 22651, position: { y: -1.2127822637557983 } },
  { t: 22652, position: { y: 1.6200100183486938 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22653, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 22654, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 22655, position: { y: 1.3863780498504639 }, delta: { y: -0.2305273562669754 } },
  { t: 22656, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 22657, position: { y: 0.851533830165863 }, delta: { y: -0.1721584051847458 } },
  { t: 22658, position: { y: 0.679375410079956 }, delta: { y: -0.10607920587062836 } },
  { t: 22659, position: { y: 0.5732961893081665 }, delta: { y: -0.07303960621356964 } },
  { t: 22660, position: { y: 0.5002565383911133 }, delta: { y: -0.056519802659749985 } },
  { t: 22661, position: { y: 0.4437367916107178 }, delta: { y: -0.04825989902019501 } },
  { t: 22662, position: { y: 0.39547693729400635 }, delta: { y: -0.04412994906306267 } },
  { t: 22663, position: { y: 0.3513469696044922 }, delta: { y: -0.04206497222185135 } },
  { t: 22664, position: { y: 0.30928194522857666 }, delta: { y: -0.04103248566389084 } },
  { t: 22665, position: { y: 0.26824951171875 }, delta: { y: -0.040516242384910583 } },
  { t: 22666, position: { y: 0.22773325443267822 }, delta: { y: -0.040258120745420456 } },
  { t: 22667, position: { y: 0.1874750852584839 }, delta: { y: -0.04012905806303024 } },
  { t: 22668, position: { y: 0.14734601974487305 }, delta: { y: -0.040064528584480286 } },
  { t: 22669, position: { y: 0.10728144645690918 }, delta: { y: -0.04003226384520531 } },
  { t: 22670, position: { y: 0.06724917888641357 }, delta: { y: -0.04001612961292267 } },
  { t: 22671, position: { y: 0.027233004570007324 }, delta: { y: -0.0400080643594265 } },
  { t: 22672, position: { y: -0.012775063514709473 }, delta: { y: -0.040004029870033264 } },
  { t: 22673, position: { y: -0.05277907848358154 }, delta: { y: -0.040002014487981796 } },
  { t: 22674, position: { y: -0.09278106689453125 }, delta: { y: -0.04000100493431091 } },
  { t: 22675, position: { y: -0.13278210163116455 }, delta: { y: -0.04000050202012062 } },
  { t: 22676, position: { y: -0.17278265953063965 }, delta: { y: -0.040000252425670624 } },
  { t: 22677, position: { y: -0.2127828598022461 }, delta: { y: -0.040000125765800476 } },
  { t: 22678, position: { y: -0.252782940864563 }, delta: { y: -0.0400000624358654 } },
  { t: 22679, position: { y: -0.2927830219268799 }, delta: { y: -0.040000028908252716 } },
  { t: 22680, position: { y: -0.3327831029891968 }, delta: { y: -0.04000001400709152 } },
  { t: 22681, position: { y: -0.3727830648422241 }, delta: { y: -0.040000006556510925 } },
  { t: 22682, position: { y: -0.41278302669525146 }, delta: { y: -0.04000000283122063 } },
  { t: 22683, position: { y: -0.4527829885482788 }, delta: { y: -0.03999999910593033 } },
  { t: 22684, position: { y: -0.49278295040130615 } },
  { t: 22685, position: { y: -0.5327829122543335 } },
  { t: 22686, position: { y: -0.5727828741073608 } }
]

describe('physics: lava_surface_sneak_y0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_surface_sneak_y0', softFailures: true })
    h.runScenario({ name: 'lava_surface_sneak_y0', ticks: TICKS })
  })
})
