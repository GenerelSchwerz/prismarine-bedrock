'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_air_free_fall_h50
// Frames: 48  (ticks 5053..5100)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 5053, position: { x: 0.5, y: 1.6200100183486938, z: 0.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 5054 },
  { t: 5055 },
  { t: 5056 },
  { t: 5057 },
  { t: 5058, position: { y: 51.62001037597656 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 5059, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 5060, position: { y: 51.54161071777344 }, delta: { y: -0.1552319973707199 } },
  { t: 5061, position: { y: 51.38637924194336 }, delta: { y: -0.2305273562669754 } },
  { t: 5062, position: { y: 51.155853271484375 }, delta: { y: -0.30431681871414185 } },
  { t: 5063, position: { y: 50.85153579711914 }, delta: { y: -0.3766304850578308 } },
  { t: 5064, position: { y: 50.47490692138672 }, delta: { y: -0.4474978744983673 } },
  { t: 5065, position: { y: 50.027408599853516 }, delta: { y: -0.5169479250907898 } },
  { t: 5066, position: { y: 49.510459899902344 }, delta: { y: -0.585008978843689 } },
  { t: 5067, position: { y: 48.92544937133789 }, delta: { y: -0.6517087817192078 } },
  { t: 5068, position: { y: 48.273738861083984 }, delta: { y: -0.7170746326446533 } },
  { t: 5069, position: { y: 47.556663513183594 }, delta: { y: -0.7811331152915955 } },
  { t: 5070, position: { y: 46.77553176879883 }, delta: { y: -0.8439104557037354 } },
  { t: 5071, position: { y: 45.93162155151367 }, delta: { y: -0.9054322242736816 } },
  { t: 5072, position: { y: 45.026187896728516 }, delta: { y: -0.9657235741615295 } },
  { t: 5073, position: { y: 44.060462951660156 }, delta: { y: -1.0248091220855713 } },
  { t: 5074, position: { y: 43.03565216064453 }, delta: { y: -1.082713007926941 } },
  { t: 5075, position: { y: 41.952938079833984 }, delta: { y: -1.1394587755203247 } },
  { t: 5076, position: { y: 40.813480377197266 }, delta: { y: -1.195069670677185 } },
  { t: 5077, position: { y: 39.618412017822266 }, delta: { y: -1.2495683431625366 } },
  { t: 5078, position: { y: 38.36884307861328 }, delta: { y: -1.3029770851135254 } },
  { t: 5079, position: { y: 37.06586456298828 }, delta: { y: -1.3553175926208496 } },
  { t: 5080, position: { y: 35.710548400878906 }, delta: { y: -1.4066113233566284 } },
  { t: 5081, position: { y: 34.30393600463867 }, delta: { y: -1.4568791389465332 } },
  { t: 5082, position: { y: 32.8470573425293 }, delta: { y: -1.5061416625976562 } },
  { t: 5083, position: { y: 31.34091567993164 }, delta: { y: -1.554418921470642 } },
  { t: 5084, position: { y: 29.786497116088867 }, delta: { y: -1.6017305850982666 } },
  { t: 5085, position: { y: 28.18476676940918 }, delta: { y: -1.6480960845947266 } },
  { t: 5086, position: { y: 26.536670684814453 }, delta: { y: -1.693534255027771 } },
  { t: 5087, position: { y: 24.843135833740234 }, delta: { y: -1.7380636930465698 } },
  { t: 5088, position: { y: 23.105072021484375 }, delta: { y: -1.7817025184631348 } },
  { t: 5089, position: { y: 21.3233699798584 }, delta: { y: -1.8244684934616089 } },
  { t: 5090, position: { y: 19.4989013671875 }, delta: { y: -1.8663792610168457 } },
  { t: 5091, position: { y: 17.632522583007812 }, delta: { y: -1.9074517488479614 } },
  { t: 5092, position: { y: 15.72507095336914 }, delta: { y: -1.9477027654647827 } },
  { t: 5093, position: { y: 13.777368545532227 }, delta: { y: -1.9871487617492676 } },
  { t: 5094, position: { y: 11.790220260620117 }, delta: { y: -2.025805711746216 } },
  { t: 5095, position: { y: 9.76441478729248 }, delta: { y: -2.0636894702911377 } },
  { t: 5096, position: { y: 7.700725078582764 }, delta: { y: -2.100815534591675 } },
  { t: 5097, position: { y: 5.599909782409668 }, delta: { y: -2.1371991634368896 } },
  { t: 5098, position: { y: 3.462710380554199 }, delta: { y: -2.1728551387786865 } },
  { t: 5099, position: { y: 1.6200100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 5100 }
]

describe('physics: air_free_fall_h50', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'air_free_fall_h50', softFailures: true })
    h.runScenario({ name: 'air_free_fall_h50', ticks: TICKS })
  })
})
