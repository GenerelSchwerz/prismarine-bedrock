'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_lava_sub_walk_d5_y0_p0
// Frames: 39  (ticks 23962..24000)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 23962, position: { x: 0.5, y: -4.179989337921143, z: 300.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.03999999910593033 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 23963, position: { y: -4.21998929977417 } },
  { t: 23964, position: { y: -4.259989261627197 } },
  { t: 23965, position: { y: -4.299989223480225 } },
  { t: 23966, position: { y: -4.339989185333252 } },
  { t: 23967, position: { y: -3.3799901008605957 }, yaw: 0, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 23968, yaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 23969, position: { y: -3.3999900817871094 }, delta: { y: -0.029999999329447746 } },
  { t: 23970, position: { y: -3.429990291595459 }, delta: { y: -0.03500000014901161 } },
  { t: 23971, position: { y: -3.4649901390075684 }, delta: { y: -0.03750000149011612 } },
  { t: 23972, position: { y: -3.5024900436401367 }, delta: { y: -0.038750000298023224 } },
  { t: 23973, position: { y: -3.5412402153015137 }, delta: { y: -0.039374999701976776 } },
  { t: 23974, position: { y: -3.5806150436401367 }, delta: { y: -0.03968749940395355 } },
  { t: 23975, position: { y: -3.620302677154541 }, delta: { y: -0.03984374925494194 } },
  { t: 23976, position: { y: -3.6601462364196777 }, delta: { y: -0.039921872317790985 } },
  { t: 23977, position: { y: -3.7000679969787598 }, delta: { y: -0.03996093571186066 } },
  { t: 23978, position: { y: -3.7400288581848145 }, delta: { y: -0.03998046740889549 } },
  { t: 23979, position: { y: -3.7800092697143555 }, delta: { y: -0.03999023139476776 } },
  { t: 23980, position: { y: -3.8199996948242188 }, delta: { y: -0.039995115250349045 } },
  { t: 23981, position: { y: -3.859994888305664 }, delta: { y: -0.03999755531549454 } },
  { t: 23982, position: { y: -3.8999924659729004 }, delta: { y: -0.03999877721071243 } },
  { t: 23983, position: { y: -3.9399914741516113 }, delta: { y: -0.03999938815832138 } },
  { t: 23984, position: { y: -3.9799909591674805 }, delta: { y: -0.039999693632125854 } },
  { t: 23985, position: { y: -4.01999044418335 }, delta: { y: -0.03999984636902809 } },
  { t: 23986, position: { y: -4.059990406036377 }, delta: { y: -0.03999992460012436 } },
  { t: 23987, position: { y: -4.099990367889404 }, delta: { y: -0.039999961853027344 } },
  { t: 23988, position: { y: -4.139990329742432 }, delta: { y: -0.039999980479478836 } },
  { t: 23989, position: { y: -4.179990291595459 }, delta: { y: -0.03999999165534973 } },
  { t: 23990, position: { y: -4.219990253448486 }, delta: { y: -0.03999999538064003 } },
  { t: 23991, position: { y: -4.259990215301514 }, delta: { y: -0.03999999910593033 } },
  { t: 23992, position: { y: -4.299990177154541 } },
  { t: 23993, position: { y: -4.339990139007568 } },
  { t: 23994, position: { y: -4.379990100860596 } },
  { t: 23995, position: { y: -4.419990062713623 } },
  { t: 23996, position: { y: -4.45999002456665 } },
  { t: 23997, position: { y: -4.499989986419678 } },
  { t: 23998, position: { y: -4.539989948272705 } },
  { t: 23999, position: { y: -4.579989910125732 } },
  { t: 24000, position: { y: -4.61998987197876 } }
]

describe('physics: lava_sub_walk_d5_y0_p0', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'lava_sub_walk_d5_y0_p0', softFailures: true })
    h.runScenario({ name: 'lava_sub_walk_d5_y0_p0', ticks: TICKS })
  })
})
