'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_flight_creative_ascend_descend
// Frames: 68  (ticks 8131..8198)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8131, position: { x: 0.5, y: 1.6200100183486938, z: 0.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 8132 },
  { t: 8133 },
  { t: 8134 },
  { t: 8135 },
  { t: 8136 },
  { t: 8137, position: { y: 51.62001037597656 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 8138, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 8139, position: { y: 51.54161071777344 }, delta: { y: -0.1552319973707199 } },
  { t: 8140, position: { y: 51.38637924194336 }, delta: { y: -0.2305273562669754 } },
  { t: 8141, position: { y: 51.155853271484375 }, delta: { y: -0.30431681871414185 } },
  { t: 8142, position: { y: 50.85153579711914 }, delta: { y: -0.3766304850578308 } },
  { t: 8143, position: { y: 50.47490692138672 }, delta: { y: -0.4474978744983673 } },
  { t: 8144, position: { y: 50.027408599853516 }, delta: { y: -0.5169479250907898 } },
  { t: 8145, position: { y: 49.510459899902344 }, delta: { y: -0.585008978843689 } },
  { t: 8146, position: { y: 48.92544937133789 }, delta: { y: -0.6517087817192078 } },
  { t: 8147, position: { y: 48.273738861083984 }, delta: { y: -0.7170746326446533 } },
  { t: 8148, position: { y: 47.556663513183594 }, delta: { y: -0.7811331152915955 } },
  { t: 8149, position: { y: 46.77553176879883 }, delta: { y: -0.8439104557037354 } },
  { t: 8150, position: { y: 45.93162155151367 }, delta: { y: -0.9054322242736816 } },
  { t: 8151, position: { y: 45.026187896728516 }, delta: { y: -0.9657235741615295 } },
  { t: 8152, position: { y: 44.060462951660156 }, delta: { y: -1.0248091220855713 } },
  { t: 8153, position: { y: 43.03565216064453 }, delta: { y: -1.082713007926941 } },
  { t: 8154, position: { y: 41.952938079833984 }, delta: { y: -1.1394587755203247 } },
  { t: 8155, position: { y: 40.813480377197266 }, delta: { y: -1.195069670677185 } },
  { t: 8156, position: { y: 39.618412017822266 }, delta: { y: -1.2495683431625366 } },
  { t: 8157, position: { y: 38.36884307861328 }, delta: { y: -1.3029770851135254 } },
  { t: 8158, position: { y: 37.06586456298828 }, delta: { y: -1.3553175926208496 } },
  { t: 8159, position: { y: 35.710548400878906 }, delta: { y: -1.4066113233566284 } },
  { t: 8160, position: { y: 34.30393600463867 }, delta: { y: -1.4568791389465332 } },
  { t: 8161, position: { y: 32.8470573425293 }, delta: { y: -1.5061416625976562 } },
  { t: 8162, position: { y: 31.34091567993164 }, delta: { y: -1.554418921470642 } },
  { t: 8163, position: { y: 29.786497116088867 }, delta: { y: -1.6017305850982666 } },
  { t: 8164, position: { y: 28.18476676940918 }, delta: { y: -1.6480960845947266 } },
  { t: 8165, position: { y: 26.536670684814453 }, delta: { y: -1.693534255027771 } },
  { t: 8166, position: { y: 24.843135833740234 }, delta: { y: -1.7380636930465698 } },
  { t: 8167, position: { y: 23.105072021484375 }, delta: { y: -1.7817025184631348 } },
  { t: 8168, position: { y: 21.3233699798584 }, delta: { y: -1.8244684934616089 } },
  { t: 8169, position: { y: 19.4989013671875 }, delta: { y: -1.8663792610168457 } },
  { t: 8170, position: { y: 17.632522583007812 }, delta: { y: -1.9074517488479614 } },
  { t: 8171, position: { y: 15.72507095336914 }, delta: { y: -1.9477027654647827 } },
  { t: 8172, position: { y: 13.777368545532227 }, delta: { y: -1.9871487617492676 } },
  { t: 8173, position: { y: 11.790220260620117 }, delta: { y: -2.025805711746216 } },
  { t: 8174, position: { y: 9.76441478729248 }, delta: { y: -2.0636894702911377 } },
  { t: 8175, position: { y: 7.700725078582764 }, delta: { y: -2.100815534591675 } },
  { t: 8176, position: { y: 5.599909782409668 }, delta: { y: -2.1371991634368896 } },
  { t: 8177, position: { y: 3.462710380554199 }, delta: { y: -2.1728551387786865 } },
  { t: 8178, position: { y: 1.6200100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 8179 },
  { t: 8180 },
  { t: 8181 },
  { t: 8182 },
  { t: 8183 },
  { t: 8184 },
  { t: 8185 },
  { t: 8186 },
  { t: 8187 },
  { t: 8188 },
  { t: 8189 },
  { t: 8190 },
  { t: 8191 },
  { t: 8192 },
  { t: 8193 },
  { t: 8194 },
  { t: 8195 },
  { t: 8196 },
  { t: 8197 },
  { t: 8198 }
]

describe('physics: flight_creative_ascend_descend', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'flight_creative_ascend_descend', softFailures: true })
    h.runScenario({ name: 'flight_creative_ascend_descend', ticks: TICKS })
  })
})
