'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_walk_on_soul_sand
// Frames: 52  (ticks 5919..5970)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 5919, position: { x: 0.5, y: 1.6200100183486938, z: 888.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 5920 },
  { t: 5921 },
  { t: 5922 },
  { t: 5923, position: { z: 900.5 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 5924, yaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 5925, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 5926, position: { y: 1.4950100183486938 }, delta: { y: -0.07840000092983246 }, inputs: { verticalCollision: true } },
  { t: 5927, position: { z: 900.5532836914062 }, moveVector: { z: 1 }, delta: { z: 0.02910788543522358 }, inputs: { up: true } },
  { t: 5928, position: { z: 900.6356811523438 }, delta: { z: 0.04500079154968262 } },
  { t: 5929, position: { x: 0.5000000596046448, z: 900.7340087890625 }, delta: { z: 0.05367831885814667 } },
  { t: 5930, position: { z: 900.8410034179688 }, delta: { z: 0.058416251093149185 } },
  { t: 5931, position: { z: 900.9527587890625 }, delta: { z: 0.06100315973162651 } },
  { t: 5932, position: { x: 0.5000001192092896, z: 901.0670776367188 }, delta: { z: 0.06241561472415924 } },
  { t: 5933, position: { z: 901.1828002929688 }, delta: { z: 0.06318681687116623 } },
  { t: 5934, position: { z: 901.29931640625 }, delta: { z: 0.06360789388418198 } },
  { t: 5935, position: { z: 901.416259765625 }, delta: { z: 0.06383779644966125 } },
  { t: 5936, position: { z: 901.5333862304688 }, delta: { z: 0.06396332383155823 } },
  { t: 5937, position: { x: 0.5000001788139343, z: 901.650634765625 }, delta: { z: 0.06403186172246933 } },
  { t: 5938, position: { z: 901.7680053710938 }, delta: { z: 0.06406928598880768 } },
  { t: 5939, position: { z: 901.8853759765625 }, delta: { z: 0.06408972293138504 } },
  { t: 5940, position: { x: 0.5000002384185791, z: 902.0027465820312 }, delta: { z: 0.06410087645053864 } },
  { t: 5941, position: { z: 902.1201782226562 }, delta: { z: 0.06410697102546692 } },
  { t: 5942, position: { z: 902.2376098632812 }, delta: { z: 0.06411029398441315 } },
  { t: 5943, position: { z: 902.3550415039062 }, delta: { z: 0.0641121119260788 } },
  { t: 5944, position: { z: 902.4724731445312 }, delta: { z: 0.06411310285329819 } },
  { t: 5945, position: { x: 0.5000002980232239, z: 902.5899047851562 }, delta: { z: 0.06411364674568176 } },
  { t: 5946, position: { z: 902.7073364257812 }, delta: { z: 0.06411393731832504 } },
  { t: 5947, position: { z: 902.8247680664062 }, delta: { z: 0.06411410123109818 } },
  { t: 5948, position: { x: 0.5000003576278687, z: 902.9421997070312 }, delta: { z: 0.06411419063806534 } },
  { t: 5949, position: { z: 903.0596313476562 }, delta: { z: 0.06411423534154892 } },
  { t: 5950, position: { z: 903.1770629882812 }, delta: { z: 0.06411426514387131 } },
  { t: 5951, position: { z: 903.2944946289062 }, delta: { z: 0.0641142800450325 } },
  { t: 5952, position: { z: 903.4119262695312 }, delta: { z: 0.0641142874956131 } },
  { t: 5953, position: { x: 0.5000004172325134, z: 903.5293579101562 } },
  { t: 5954, position: { z: 903.6467895507812 } },
  { t: 5955, position: { z: 903.7642211914062 } },
  { t: 5956, position: { x: 0.5000004768371582, z: 903.8816528320312 } },
  { t: 5957, position: { z: 903.9457397460938 }, moveVector: { z: 0 }, delta: { z: 0.03500640392303467 }, inputs: { up: false } },
  { t: 5958, position: { z: 903.9807739257812 }, delta: { z: 0.01911349967122078 } },
  { t: 5959, position: { z: 903.9998779296875 }, delta: { z: 0.010435972362756729 } },
  { t: 5960, position: { z: 904.0103149414062 }, delta: { z: 0.005698041524738073 } },
  { t: 5961, position: { z: 904.0159912109375 }, delta: { z: 0.0031111310236155987 } },
  { t: 5962, position: { z: 904.0191040039062 }, delta: { z: 0.001698677777312696 } },
  { t: 5963, position: { z: 904.0208129882812 }, delta: { z: 0.0009274781914427876 } },
  { t: 5964, position: { z: 904.021728515625 }, delta: { z: 0.0005064031574875116 } },
  { t: 5965, position: { z: 904.022216796875 }, delta: { z: 0.00027649616822600365 } },
  { t: 5966, position: { z: 904.0225219726562 }, delta: { z: 0.00015096692368388176 } },
  { t: 5967, position: { z: 904.0226440429688 }, delta: { z: 0.00008242794865509495 } },
  { t: 5968, position: { z: 904.022705078125 }, delta: { z: 0.00004500566501519643 } },
  { t: 5969, position: { z: 904.0227661132812 }, delta: { z: 0.00002457309528836049 } },
  { t: 5970, delta: { z: 0.000013416911315289326 } }
]

describe('physics: walk_on_soul_sand', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'walk_on_soul_sand', softFailures: true })
    h.runScenario({ name: 'walk_on_soul_sand', ticks: TICKS })
  })
})
