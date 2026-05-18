'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_entry_walk
// Frames: 65  (ticks 22819..22883)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 22819, position: { x: 0.5, y: 1.6200100183486938, z: 388.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 22820 },
  { t: 22821 },
  { t: 22822 },
  { t: 22823 },
  { t: 22824, position: { x: -4.5, z: 400.5 }, yaw: 90, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 22825, headYaw: 90, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 22826, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 22827, position: { y: 1.3863780498504639 }, delta: { y: -0.2305273562669754 } },
  { t: 22828, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 22829, position: { y: 0.851533830165863 }, delta: { y: -0.3766304850578308 } },
  { t: 22830, position: { y: 0.4749033451080322 }, delta: { y: -0.4474978744983673 } },
  { t: 22831, position: { y: 0.027405500411987305 }, delta: { y: -0.5169479250907898 } },
  { t: 22832, position: { y: -0.4895423650741577 }, delta: { y: -0.585008978843689 } },
  { t: 22833, position: { y: -1.0745514631271362 }, delta: { y: -0.6517087817192078 } },
  { t: 22834, position: { y: -1.7262603044509888 }, delta: { y: -0.7170746326446533 } },
  { t: 22835, position: { y: -2.4433350563049316 }, delta: { y: -0.7811331152915955 } },
  { t: 22836, position: { y: -3.224468231201172 }, delta: { y: -0.8439104557037354 } },
  { t: 22837, position: { y: -4.068378925323486 }, delta: { y: -0.9054322242736816 } },
  { t: 22838, position: { y: -4.973811149597168 }, delta: { y: -0.9657235741615295 } },
  { t: 22839, position: { y: -5.939534664154053 }, delta: { y: -1.0248091220855713 } },
  { t: 22840, position: { y: -6.964343547821045 }, delta: { y: -1.082713007926941 } },
  { t: 22841, position: { y: -8.047056198120117 }, delta: { y: -1.1394587755203247 } },
  { t: 22842, position: { y: -8.379989624023438 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 22843 },
  { t: 22844 },
  { t: 22845 },
  { t: 22846 },
  { t: 22847 },
  { t: 22848 },
  { t: 22849 },
  { t: 22850 },
  { t: 22851 },
  { t: 22852 },
  { t: 22853 },
  { t: 22854 },
  { t: 22855 },
  { t: 22856 },
  { t: 22857 },
  { t: 22858 },
  { t: 22859 },
  { t: 22860 },
  { t: 22861 },
  { t: 22862 },
  { t: 22863 },
  { t: 22864 },
  { t: 22865 },
  { t: 22866 },
  { t: 22867 },
  { t: 22868 },
  { t: 22869 },
  { t: 22870 },
  { t: 22871 },
  { t: 22872 },
  { t: 22873 },
  { t: 22874 },
  { t: 22875 },
  { t: 22876 },
  { t: 22877 },
  { t: 22878 },
  { t: 22879 },
  { t: 22880 },
  { t: 22881 },
  { t: 22882 },
  { t: 22883 }
]

describe('physics: lava_entry_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_entry_walk', softFailures: true })
    h.runScenario({ name: 'lava_entry_walk', ticks: TICKS })
  })
})
