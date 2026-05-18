const assert = require('assert')
const synth = require('../../../src/builtins/physics/pai-synth')

function bit (n) { return 1n << BigInt(n) }
function misBit (n) { return 1 << n }

describe('same-tick press+release end-to-end', () => {
  describe('jump (space) within a single tick', () => {
    const tick0 = synth.synthesizePAI({}, {})
    const tick1 = synth.synthesizePAI(
      { jump: { current: false, pressed: true, released: true } },
      { jump: { current: false } }
    )
    const tick2 = synth.synthesizePAI({}, { jump: { current: false } })

    it('tick 0 is clean (no jump bits)', () => {
      assert.strictEqual(tick0.paiLo, 0n)
      assert.strictEqual(tick0.paiHi, 0)
    })

    it('tick 1 PAI has StartJumping (31), JumpPressedRaw (60) and JumpReleasedRaw (59)', () => {
      const expectedLo = bit(synth.PAI_BIT_StartJumping) |
        bit(synth.PAI_BIT_JumpPressedRaw) |
        bit(synth.PAI_BIT_JumpReleasedRaw)
      assert.strictEqual(tick1.paiLo, expectedLo)
      assert.strictEqual(tick1.paiHi, 0)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_StartJumping), 0n)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_JumpPressedRaw), 0n)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_JumpReleasedRaw), 0n)
      assert.strictEqual(tick1.paiLo & bit(synth.PAI_BIT_JumpCurrentRaw), 0n)
      assert.strictEqual(tick1.paiLo & bit(synth.PAI_BIT_JumpDown), 0n)
    })

    it('tick 1 MIS has both JumpInputWasPressed and JumpInputWasReleased', () => {
      const mis = synth.paiToMoveInputState(tick1.paiLo, tick1.paiHi)
      assert.notStrictEqual(mis & misBit(synth.MIS_BIT_JumpInputWasPressed), 0)
      assert.notStrictEqual(mis & misBit(synth.MIS_BIT_JumpInputWasReleased), 0)
      assert.strictEqual(mis & misBit(synth.MIS_BIT_JumpInputCurrentlyDown), 0)
      assert.strictEqual(mis & misBit(synth.MIS_BIT_JumpDown), 0)
      const expected = misBit(synth.MIS_BIT_JumpInputWasPressed) |
        misBit(synth.MIS_BIT_JumpInputWasReleased)
      assert.strictEqual(mis, expected)
    })

    it('tick 2 is clean again (no stale press/release bits)', () => {
      assert.strictEqual(tick2.paiLo, 0n)
      assert.strictEqual(tick2.paiHi, 0)
      const mis = synth.paiToMoveInputState(tick2.paiLo, tick2.paiHi)
      assert.strictEqual(mis, 0)
    })
  })

  describe('sneak (shift) within a single tick', () => {
    const tick0 = synth.synthesizePAI({}, {})
    const tick1 = synth.synthesizePAI(
      { sneak: { current: false, pressed: true, released: true } },
      { sneak: { current: false } }
    )
    const tick2 = synth.synthesizePAI({}, { sneak: { current: false } })

    it('tick 0 is clean (no sneak bits)', () => {
      assert.strictEqual(tick0.paiLo, 0n)
      assert.strictEqual(tick0.paiHi, 0)
    })

    it('tick 1 PAI has StartSneaking (27), StopSneaking (28), SneakPressedRaw (63) and SneakReleasedRaw (62)', () => {
      const expectedLo = bit(synth.PAI_BIT_StartSneaking) |
        bit(synth.PAI_BIT_StopSneaking) |
        bit(synth.PAI_BIT_SneakPressedRaw) |
        bit(synth.PAI_BIT_SneakReleasedRaw)
      assert.strictEqual(tick1.paiLo, expectedLo)
      assert.strictEqual(tick1.paiHi, 0)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_StartSneaking), 0n)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_StopSneaking), 0n)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_SneakPressedRaw), 0n)
      assert.notStrictEqual(tick1.paiLo & bit(synth.PAI_BIT_SneakReleasedRaw), 0n)
      assert.strictEqual(tick1.paiLo & bit(synth.PAI_BIT_SneakDown), 0n)
      assert.strictEqual(tick1.paiLo & bit(synth.PAI_BIT_Sneaking), 0n)
    })

    it('tick 1 MIS has both SneakInputWasPressed and SneakInputWasReleased', () => {
      const mis = synth.paiToMoveInputState(tick1.paiLo, tick1.paiHi)
      assert.notStrictEqual(mis & misBit(synth.MIS_BIT_SneakInputWasPressed), 0)
      assert.notStrictEqual(mis & misBit(synth.MIS_BIT_SneakInputWasReleased), 0)
      assert.strictEqual(mis & misBit(synth.MIS_BIT_SneakInputCurrentlyDown), 0)
      assert.strictEqual(mis & misBit(synth.MIS_BIT_SneakDown), 0)
      const expected = misBit(synth.MIS_BIT_SneakInputWasPressed) |
        misBit(synth.MIS_BIT_SneakInputWasReleased)
      assert.strictEqual(mis, expected)
    })

    it('tick 2 is clean again (no stale press/release bits)', () => {
      assert.strictEqual(tick2.paiLo, 0n)
      assert.strictEqual(tick2.paiHi, 0)
      const mis = synth.paiToMoveInputState(tick2.paiLo, tick2.paiHi)
      assert.strictEqual(mis, 0)
    })
  })
})
