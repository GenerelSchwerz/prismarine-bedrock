'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_water_surface_walk
// Frames: 44  (ticks 6923..6966)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 6923, position: { x: 0.5, y: -2.3299918174743652, z: 100.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.024999994784593582 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 6924, position: { y: -2.354991912841797 } },
  { t: 6925, position: { y: -2.3799920082092285 } },
  { t: 6926, position: { y: -2.40499210357666 } },
  { t: 6927, position: { y: 1.6200100183486938 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 6928, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false } },
  { t: 6929, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 6930, position: { y: 1.3863780498504639 }, delta: { y: -0.2305273562669754 } },
  { t: 6931, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 6932, position: { y: 0.851533830165863 }, delta: { y: -0.24845345318317413 } },
  { t: 6933, position: { y: 0.6030803918838501 }, delta: { y: -0.20376275479793549 } },
  { t: 6934, position: { y: 0.3993176221847534 }, delta: { y: -0.16801020503044128 } },
  { t: 6935, position: { y: 0.23130738735198975 }, delta: { y: -0.1394081562757492 } },
  { t: 6936, position: { y: 0.09189927577972412 }, delta: { y: -0.1165265291929245 } },
  { t: 6937, position: { y: -0.024627208709716797 }, delta: { y: -0.09822122752666473 } },
  { t: 6938, position: { y: -0.12284839153289795 }, delta: { y: -0.0835769847035408 } },
  { t: 6939, position: { y: -0.20642542839050293 }, delta: { y: -0.07186159491539001 } },
  { t: 6940, position: { y: -0.27828705310821533 }, delta: { y: -0.06248927488923073 } },
  { t: 6941, position: { y: -0.34077632427215576 }, delta: { y: -0.05499142035841942 } },
  { t: 6942, position: { y: -0.39576780796051025 }, delta: { y: -0.04899313673377037 } },
  { t: 6943, position: { y: -0.44476091861724854 }, delta: { y: -0.04419450834393501 } },
  { t: 6944, position: { y: -0.48895537853240967 }, delta: { y: -0.040355607867240906 } },
  { t: 6945, position: { y: -0.5293110609054565 }, delta: { y: -0.0372844859957695 } },
  { t: 6946, position: { y: -0.5665954351425171 }, delta: { y: -0.034827589988708496 } },
  { t: 6947, position: { y: -0.6014231443405151 }, delta: { y: -0.03286207094788551 } },
  { t: 6948, position: { y: -0.6342853307723999 }, delta: { y: -0.03128965571522713 } },
  { t: 6949, position: { y: -0.6655749082565308 }, delta: { y: -0.030031725764274597 } },
  { t: 6950, position: { y: -0.6956065893173218 }, delta: { y: -0.029025379568338394 } },
  { t: 6951, position: { y: -0.7246319055557251 }, delta: { y: -0.02822030335664749 } },
  { t: 6952, position: { y: -0.7528523206710815 }, delta: { y: -0.02757624164223671 } },
  { t: 6953, position: { y: -0.7804285287857056 }, delta: { y: -0.027060993015766144 } },
  { t: 6954, position: { y: -0.8074895143508911 }, delta: { y: -0.02664879336953163 } },
  { t: 6955, position: { y: -0.8341382741928101 }, delta: { y: -0.02631903439760208 } },
  { t: 6956, position: { y: -0.8604573011398315 }, delta: { y: -0.0260552279651165 } },
  { t: 6957, position: { y: -0.8865126371383667 }, delta: { y: -0.025844182819128036 } },
  { t: 6958, position: { y: -0.9123567342758179 }, delta: { y: -0.025675345212221146 } },
  { t: 6959, position: { y: -0.9380320310592651 }, delta: { y: -0.025540277361869812 } },
  { t: 6960, position: { y: -0.9635723829269409 }, delta: { y: -0.025432221591472626 } },
  { t: 6961, position: { y: -0.9890044927597046 }, delta: { y: -0.025345776230096817 } },
  { t: 6962, position: { y: -1.0143502950668335 }, delta: { y: -0.02527661994099617 } },
  { t: 6963, position: { y: -1.039626955986023 }, delta: { y: -0.025221295654773712 } },
  { t: 6964, position: { y: -1.0648483037948608 }, delta: { y: -0.025177035480737686 } },
  { t: 6965, position: { y: -1.0900253057479858 }, delta: { y: -0.025141630321741104 } },
  { t: 6966, position: { y: -1.1151670217514038 }, delta: { y: -0.0251133032143116 } }
]

describe('physics: water_surface_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'water_surface_walk', softFailures: true })
    h.runScenario({ name: 'water_surface_walk', ticks: TICKS })
  })
})
