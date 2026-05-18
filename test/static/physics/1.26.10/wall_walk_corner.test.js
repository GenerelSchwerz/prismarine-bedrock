'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_wall_walk_corner
// Frames: 47  (ticks 2070..2116)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 2070, position: { x: -0.30000001192092896, y: 1.6200100183486938, z: 1906.843017578125 }, yaw: -119.88289642333984, pitch: 1.0394134521484375, headYaw: -119.88289642333984, delta: { y: -0.07840000092983246, z: 0 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 2071 },
  { t: 2072, yaw: -119.88288879394531, headYaw: -119.88288879394531 },
  { t: 2073 },
  { t: 2074, yaw: -119.88290405273438, headYaw: -119.88290405273438 },
  { t: 2075 },
  { t: 2076, position: { x: 7.5, z: 1892.5 }, yaw: -135, pitch: 0, headYaw: -119.88288879394531, delta: { y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 2077, yaw: -134.99725341796875, headYaw: -134.99725341796875, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 2078, position: { x: 7.569299697875977, z: 1892.4306640625 }, moveVector: { z: 1 }, delta: { x: 0.037837687879800797, z: -0.037834055721759796 }, inputs: { up: true, verticalCollision: true } },
  { t: 2079, position: { x: 7.6764373779296875, z: 1892.323486328125 }, delta: { x: 0.05849706754088402, z: -0.058491453528404236 } },
  { t: 2080, position: { x: 7.804234504699707, z: 1892.1956787109375 }, delta: { x: 0.06977709382772446, z: -0.06977038830518723 } },
  { t: 2081, position: { x: 7.9433112144470215, z: 1892.056640625 }, yaw: -134.9972686767578, headYaw: -134.9972686767578, delta: { x: 0.0759359747171402, z: -0.0759287178516388 } },
  { t: 2082, position: { x: 8.088546752929688, z: 1891.911376953125 }, delta: { x: 0.0792987272143364, z: -0.07929115742444992 } },
  { t: 2083, position: { x: 8.23714542388916, z: 1891.7628173828125 }, delta: { x: 0.08113478869199753, z: -0.08112705498933792 } },
  { t: 2084, position: { x: 8.387580871582031, z: 1891.6124267578125 }, yaw: -134.99725341796875, headYaw: -134.99725341796875, delta: { x: 0.08213729411363602, z: -0.08212943375110626 } },
  { t: 2085, position: { x: 8.539016723632812, z: 1891.4610595703125 }, delta: { x: 0.08268465101718903, z: -0.0826767310500145 } },
  { t: 2086, position: { x: 8.691001892089844, z: 1891.30908203125 }, yaw: -134.9972686767578, headYaw: -134.9972686767578, delta: { x: 0.08298350125551224, z: -0.08297558128833771 } },
  { t: 2087, position: { x: 8.843284606933594, z: 1891.300048828125 }, delta: { x: 0.08314668387174606, z: 0 }, inputs: { horizontalCollision: true } },
  { t: 2088, position: { x: 8.995731353759766 }, delta: { x: 0.08323577046394348 } },
  { t: 2089, position: { x: 9.14826774597168 }, yaw: -134.99725341796875, headYaw: -134.99725341796875, delta: { x: 0.0832844227552414 } },
  { t: 2090, position: { x: 9.300851821899414 }, yaw: -134.9972686767578, headYaw: -134.9972686767578, delta: { x: 0.08331097662448883 } },
  { t: 2091, position: { x: 9.453462600708008 }, yaw: -134.99725341796875, headYaw: -134.99725341796875, delta: { x: 0.08332549035549164 } },
  { t: 2092, position: { x: 9.606086730957031 }, yaw: -134.9972686767578, headYaw: -134.9972686767578, delta: { x: 0.08333340287208557 } },
  { t: 2093, position: { x: 9.69999885559082 }, delta: { x: 0 } },
  { t: 2094, yaw: -134.99725341796875, headYaw: -133.1782989501953 },
  { t: 2095, yaw: -133.17831420898438, pitch: -0.51971435546875, headYaw: -131.09950256347656 },
  { t: 2096, yaw: -129.28053283691406, pitch: -2.078826904296875, headYaw: -127.98127746582031 },
  { t: 2097, yaw: -127.98127746582031, pitch: -2.5985260009765625, headYaw: -127.72142791748047 },
  { t: 2098, yaw: -127.721435546875, headYaw: -127.721435546875 },
  { t: 2099 },
  { t: 2100 },
  { t: 2101, yaw: -126.94188690185547, headYaw: -125.90248107910156 },
  { t: 2102, yaw: -125.9024658203125, headYaw: -123.303955078125 },
  { t: 2103, yaw: -120.44559478759766, pitch: -3.1182403564453125, headYaw: -117.58723449707031, moveVector: { z: 0 }, inputs: { up: false, horizontalCollision: false } },
  { t: 2104, yaw: -114.72886657714844, pitch: -3.6379547119140625, headYaw: -110.31139373779297 },
  { t: 2105, yaw: -110.3114013671875, headYaw: -101.21660614013672 },
  { t: 2106, yaw: -98.61808776855469, headYaw: -94.72032165527344 },
  { t: 2107, yaw: -94.7203140258789, headYaw: -92.1218032836914 },
  { t: 2108, yaw: -89.52330017089844, pitch: -4.15765380859375, headYaw: -88.22404479980469 },
  { t: 2109, yaw: -86.92478942871094, headYaw: -86.40509033203125 },
  { t: 2110, yaw: -86.40509796142578, headYaw: -85.10584259033203 },
  { t: 2111, yaw: -84.32625579833984, headYaw: -83.0270004272461 },
  { t: 2112, yaw: -83.0270004272461, headYaw: -81.72774505615234 },
  { t: 2113, yaw: -80.42847442626953, headYaw: -78.34966278076172 },
  { t: 2114, yaw: -76.27086639404297, headYaw: -74.97161102294922 },
  { t: 2115, yaw: -74.97161865234375, headYaw: -73.67236328125 },
  { t: 2116, yaw: -72.63294982910156, headYaw: -70.8139877319336 }
]

describe('physics: wall_walk_corner', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'wall_walk_corner', softFailures: true })
    h.runScenario({ name: 'wall_walk_corner', ticks: TICKS })
  })
})
