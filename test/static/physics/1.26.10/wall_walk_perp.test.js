'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_wall_walk_perp
// Frames: 47  (ticks 1879..1925)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 1879, position: { x: 0.5, y: 1.6200100183486938, z: 1883.5 }, yaw: 15.591033935546875, pitch: 10.134292602539062, headYaw: 15.591033935546875, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 1880 },
  { t: 1881 },
  { t: 1882 },
  { t: 1883 },
  { t: 1884, position: { x: -2.5, z: 1907.5 }, yaw: -90, pitch: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 1885, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 1886, inputs: { verticalCollision: true } },
  { t: 1887, position: { x: -2.4019999504089355 }, moveVector: { z: 1 }, delta: { x: 0.053508009761571884, z: 0 }, inputs: { up: true } },
  { t: 1888, position: { x: -2.2504918575286865 }, delta: { x: 0.08272338658571243 } },
  { t: 1889, position: { x: -2.0697684288024902 }, yaw: -90, headYaw: -90, delta: { x: 0.09867498278617859 } },
  { t: 1890, position: { x: -1.8730934858322144 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { x: 0.10738455504179001 } },
  { t: 1891, position: { x: -1.6677089929580688 }, yaw: -90, headYaw: -90, delta: { x: 0.1121399775147438 } },
  { t: 1892, position: { x: -1.4575690031051636 }, delta: { x: 0.11473643779754639 } },
  { t: 1893, position: { x: -1.2448325157165527 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { x: 0.11615411192178726 } },
  { t: 1894, position: { x: -1.030678391456604 }, yaw: -90, headYaw: -90, delta: { x: 0.11692816019058228 } },
  { t: 1895, position: { x: -0.815750241279602 }, yaw: -90.00000762939453, headYaw: -90.00000762939453, delta: { x: 0.11735079437494278 } },
  { t: 1896, position: { x: -0.6004035472869873, z: 1907.4991455078125 }, yaw: -90.51970672607422, headYaw: -93.11821746826172, delta: { x: 0.11757934838533401, z: -0.00048534959205426276 } },
  { t: 1897, position: { x: -0.3849692642688751, z: 1907.4932861328125 }, yaw: -93.11821746826172, headYaw: -98.31524658203125, delta: { x: 0.1176271140575409, z: -0.0031756393145769835 } },
  { t: 1898, position: { x: -0.29999980330467224, z: 1907.4599609375 }, yaw: -107.92974090576172, pitch: -0.51971435546875, headYaw: -123.00111389160156, delta: { x: 0, z: -0.018206369131803513 }, inputs: { horizontalCollision: true } },
  { t: 1899, position: { z: 1907.3614501953125 }, yaw: -145.08847045898438, pitch: -1.5591278076171875, headYaw: -149.5059356689453, delta: { z: -0.053819213062524796 } },
  { t: 1900, position: { z: 1907.22314453125 }, yaw: -149.50592041015625, headYaw: -149.50592041015625, delta: { z: -0.07549215108156204 } },
  { t: 1901, position: { z: 1907.063232421875 }, delta: { z: -0.0873255729675293 } },
  { t: 1902, position: { z: 1906.8914794921875 }, delta: { z: -0.09378662705421448 } },
  { t: 1903, position: { z: 1906.7119140625 }, yaw: -151.06504821777344, headYaw: -151.06504821777344, delta: { z: -0.09803608059883118 } },
  { t: 1904, position: { z: 1906.528076171875 }, delta: { z: -0.10035628080368042 } },
  { t: 1905, position: { z: 1906.3419189453125 }, yaw: -151.06503295898438, headYaw: -151.06503295898438, delta: { z: -0.10162310302257538 } },
  { t: 1906, position: { z: 1906.154541015625 }, yaw: -151.06504821777344, headYaw: -151.06504821777344, delta: { z: -0.10231480747461319 } },
  { t: 1907, position: { z: 1905.9664306640625 }, delta: { z: -0.10269246995449066 } },
  { t: 1908, position: { z: 1905.7779541015625 }, delta: { z: -0.10289867967367172 } },
  { t: 1909, position: { z: 1905.5892333984375 }, yaw: -151.06503295898438, headYaw: -151.06503295898438, delta: { z: -0.10301125049591064 } },
  { t: 1910, position: { z: 1905.4005126953125 }, delta: { z: -0.10307271778583527 } },
  { t: 1911, position: { z: 1905.211669921875 }, yaw: -151.06504821777344, headYaw: -151.06504821777344, delta: { z: -0.1031062975525856 } },
  { t: 1912, position: { z: 1905.1085205078125 }, moveVector: { z: 0 }, delta: { z: -0.05629604682326317 }, inputs: { up: false, horizontalCollision: false } },
  { t: 1913, position: { z: 1905.05224609375 }, delta: { z: -0.03073764592409134 } },
  { t: 1914, position: { z: 1905.021484375 }, delta: { z: -0.01678275689482689 } },
  { t: 1915, position: { z: 1905.0047607421875 }, yaw: -151.06503295898438, headYaw: -151.06503295898438, delta: { z: -0.009163386188447475 } },
  { t: 1916, position: { z: 1904.99560546875 }, yaw: -151.06504821777344, headYaw: -151.06504821777344, delta: { z: -0.005003209225833416 } },
  { t: 1917, position: { z: 1904.9906005859375 }, delta: { z: -0.0027317525818943977 } },
  { t: 1918, position: { z: 1904.9879150390625 }, yaw: -151.06503295898438, headYaw: -151.06503295898438, delta: { z: -0.0014915370848029852 } },
  { t: 1919, position: { z: 1904.9864501953125 }, headYaw: -148.7263641357422, delta: { z: -0.0008143793675117195 } },
  { t: 1920, position: { z: 1904.985595703125 }, yaw: -148.72637939453125, headYaw: -146.9074249267578, delta: { z: -0.0004446511738933623 } },
  { t: 1921, position: { z: 1904.985107421875 }, yaw: -145.86802673339844, headYaw: -145.86802673339844, delta: { z: -0.00024277956981677562 } },
  { t: 1922, position: { z: 1904.98486328125 }, yaw: -145.86801147460938, headYaw: -145.86801147460938, delta: { z: -0.00013255765952635556 } },
  { t: 1923, position: { z: 1904.9847412109375 }, yaw: -145.86802673339844, headYaw: -145.86802673339844, delta: { z: -0.00007237648969748989 } },
  { t: 1924, position: { z: 1904.984619140625 }, delta: { z: -0.000039517566619906574 } },
  { t: 1925, yaw: -145.86801147460938, headYaw: -145.86801147460938, delta: { z: -0.000021576594008365646 } }
]

describe('physics: wall_walk_perp', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'wall_walk_perp', softFailures: true })
    h.runScenario({ name: 'wall_walk_perp', ticks: TICKS })
  })
})
