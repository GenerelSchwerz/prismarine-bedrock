'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_entry_sprint
// Frames: 65  (ticks 22898..22962)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22898, position: { x: -4.5, y: -8.379989624023438, z: 400.5 }, yaw: 90, headYaw: 90, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 22899 },
  { t: 22900 },
  { t: 22901 },
  { t: 22902, position: { y: 1.6200100183486938 }, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22903, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 22904, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 22905, position: { y: 1.3863780498504639 }, delta: { y: -0.2305273562669754 } },
  { t: 22906, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 22907, position: { y: 0.851533830165863 }, delta: { y: -0.3766304850578308 } },
  { t: 22908, position: { y: 0.4749033451080322 }, delta: { y: -0.4474978744983673 } },
  { t: 22909, position: { y: 0.027405500411987305 }, delta: { y: -0.5169479250907898 } },
  { t: 22910, position: { y: -0.4895423650741577 }, delta: { y: -0.585008978843689 } },
  { t: 22911, position: { y: -1.0745514631271362 }, delta: { y: -0.6517087817192078 } },
  { t: 22912, position: { y: -1.7262603044509888 }, delta: { y: -0.7170746326446533 } },
  { t: 22913, position: { y: -2.4433350563049316 }, delta: { y: -0.7811331152915955 } },
  { t: 22914, position: { y: -3.224468231201172 }, delta: { y: -0.8439104557037354 } },
  { t: 22915, position: { y: -4.068378925323486 }, delta: { y: -0.9054322242736816 } },
  { t: 22916, position: { y: -4.973811149597168 }, delta: { y: -0.9657235741615295 } },
  { t: 22917, position: { y: -5.939534664154053 }, delta: { y: -1.0248091220855713 } },
  { t: 22918, position: { y: -6.964343547821045 }, delta: { y: -1.082713007926941 } },
  { t: 22919, position: { y: -8.047056198120117 }, delta: { y: -1.1394587755203247 } },
  { t: 22920, position: { y: -8.379989624023438 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 22921 },
  { t: 22922 },
  { t: 22923 },
  { t: 22924 },
  { t: 22925 },
  { t: 22926 },
  { t: 22927 },
  { t: 22928 },
  { t: 22929 },
  { t: 22930 },
  { t: 22931 },
  { t: 22932 },
  { t: 22933 },
  { t: 22934 },
  { t: 22935 },
  { t: 22936 },
  { t: 22937 },
  { t: 22938 },
  { t: 22939 },
  { t: 22940 },
  { t: 22941 },
  { t: 22942 },
  { t: 22943 },
  { t: 22944 },
  { t: 22945 },
  { t: 22946 },
  { t: 22947 },
  { t: 22948 },
  { t: 22949 },
  { t: 22950 },
  { t: 22951 },
  { t: 22952 },
  { t: 22953 },
  { t: 22954 },
  { t: 22955 },
  { t: 22956 },
  { t: 22957 },
  { t: 22958 },
  { t: 22959 },
  { t: 22960 },
  { t: 22961 },
  { t: 22962 }
]

describe('physics: lava_entry_sprint', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_entry_sprint', softFailures: true })
    h.runScenario({ name: 'lava_entry_sprint', ticks: TICKS })
  })
})
