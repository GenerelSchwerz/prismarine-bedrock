const assert = require('assert')
const synth = require('../../../src/builtins/physics/pai-synth')

function bit (n) { return 1n << BigInt(n) }
function misBit (n) { return 1 << n }

describe('pai-synth: paiToMoveInputState (13 deterministic rules)', () => {
  it('maps W/A/S/D to MIS Up/Down/Left/Right', () => {
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Up), 0), misBit(synth.MIS_BIT_Up))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Down), 0), misBit(synth.MIS_BIT_Down))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Left), 0), misBit(synth.MIS_BIT_Left))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Right), 0), misBit(synth.MIS_BIT_Right))
  })

  it('maps SneakDown/Pressed/Released and SneakCurrentRaw (bit 64)', () => {
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_SneakDown), 0), misBit(synth.MIS_BIT_SneakDown))
    assert.strictEqual(synth.paiToMoveInputState(0n, 0x1), misBit(synth.MIS_BIT_SneakInputCurrentlyDown))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_SneakPressedRaw), 0), misBit(synth.MIS_BIT_SneakInputWasPressed))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_SneakReleasedRaw), 0), misBit(synth.MIS_BIT_SneakInputWasReleased))
  })

  it('maps SprintDown', () => {
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_SprintDown), 0), misBit(synth.MIS_BIT_SprintDown))
  })

  it('maps JumpDown/CurrentRaw/PressedRaw/ReleasedRaw', () => {
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_JumpDown), 0), misBit(synth.MIS_BIT_JumpDown))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_JumpCurrentRaw), 0), misBit(synth.MIS_BIT_JumpInputCurrentlyDown))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_JumpPressedRaw), 0), misBit(synth.MIS_BIT_JumpInputWasPressed))
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_JumpReleasedRaw), 0), misBit(synth.MIS_BIT_JumpInputWasReleased))
  })

  it('does not map non-Raw bits Sneaking (8) or Jumping (6) to MIS', () => {
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Sneaking), 0), 0)
    assert.strictEqual(synth.paiToMoveInputState(bit(synth.PAI_BIT_Jumping), 0), 0)
  })
})

describe('pai-synth: synthesizePAI (matches pai_to_mis.h:252-312 + same-tick extension)', () => {
  it('emits empty PAI for empty buttons', () => {
    const out = synth.synthesizePAI({})
    assert.strictEqual(out.paiLo, 0n)
    assert.strictEqual(out.paiHi, 0)
  })

  it('W → bit 10 (Up)', () => {
    const out = synth.synthesizePAI({ forward: true })
    assert.strictEqual(out.paiLo, bit(synth.PAI_BIT_Up))
    assert.strictEqual(out.paiHi, 0)
  })

  it('shift held (rising edge) sets Sneaking/SneakDown/WantDown + SneakCurrentRaw + StartSneaking + SneakPressedRaw', () => {
    const out = synth.synthesizePAI({ sneak: { current: true } }, {})
    const expectedLo = bit(synth.PAI_BIT_Sneaking) |
      bit(synth.PAI_BIT_SneakDown) |
      bit(synth.PAI_BIT_WantDown) |
      bit(synth.PAI_BIT_StartSneaking) |
      bit(synth.PAI_BIT_SneakPressedRaw)
    assert.strictEqual(out.paiLo, expectedLo)
    assert.strictEqual(out.paiHi, 0x1)
  })

  it('shift held steady (no edges)', () => {
    const out = synth.synthesizePAI(
      { sneak: { current: true } },
      { sneak: { current: true } }
    )
    const expectedLo = bit(synth.PAI_BIT_Sneaking) |
      bit(synth.PAI_BIT_SneakDown) |
      bit(synth.PAI_BIT_WantDown)
    assert.strictEqual(out.paiLo, expectedLo)
    assert.strictEqual(out.paiHi, 0x1)
  })

  it('shift release (falling edge) sets StopSneaking + SneakReleasedRaw', () => {
    const out = synth.synthesizePAI(
      { sneak: { current: false } },
      { sneak: { current: true } }
    )
    const expectedLo = bit(synth.PAI_BIT_StopSneaking) | bit(synth.PAI_BIT_SneakReleasedRaw)
    assert.strictEqual(out.paiLo, expectedLo)
    assert.strictEqual(out.paiHi, 0)
  })

  it('ctrl held sets SprintDown + Sprinting', () => {
    const out = synth.synthesizePAI({ sprint: true })
    const expectedLo = bit(synth.PAI_BIT_SprintDown) | bit(synth.PAI_BIT_Sprinting)
    assert.strictEqual(out.paiLo, expectedLo)
  })

  it('space rising sets JumpDown/Jumping/WantUp/JumpCurrentRaw + StartJumping + JumpPressedRaw', () => {
    const out = synth.synthesizePAI({ jump: { current: true } }, {})
    const expectedLo = bit(synth.PAI_BIT_JumpDown) |
      bit(synth.PAI_BIT_Jumping) |
      bit(synth.PAI_BIT_WantUp) |
      bit(synth.PAI_BIT_StartJumping) |
      bit(synth.PAI_BIT_JumpPressedRaw) |
      bit(synth.PAI_BIT_JumpCurrentRaw)
    assert.strictEqual(out.paiLo, expectedLo)
  })

  it('space release sets JumpReleasedRaw', () => {
    const out = synth.synthesizePAI(
      { jump: { current: false } },
      { jump: { current: true } }
    )
    assert.strictEqual(out.paiLo, bit(synth.PAI_BIT_JumpReleasedRaw))
  })

  it('same-tick press+release: explicit edges set both JumpPressedRaw and JumpReleasedRaw', () => {
    const out = synth.synthesizePAI(
      { jump: { current: false, pressed: true, released: true } },
      { jump: { current: false } }
    )
    const expectedLo = bit(synth.PAI_BIT_StartJumping) |
      bit(synth.PAI_BIT_JumpPressedRaw) |
      bit(synth.PAI_BIT_JumpReleasedRaw)
    assert.strictEqual(out.paiLo, expectedLo)
    assert.strictEqual(out.paiHi, 0)
  })

  it('accepts plain booleans for jump (derives edges from prev)', () => {
    const out = synth.synthesizePAI({ jump: true }, { jump: false })
    const expectedLo = bit(synth.PAI_BIT_JumpDown) |
      bit(synth.PAI_BIT_Jumping) |
      bit(synth.PAI_BIT_WantUp) |
      bit(synth.PAI_BIT_JumpCurrentRaw) |
      bit(synth.PAI_BIT_StartJumping) |
      bit(synth.PAI_BIT_JumpPressedRaw)
    assert.strictEqual(out.paiLo, expectedLo)
  })

  it('matches the C reference round-trip (W + shift rising → MIS 0x00a02001)', () => {
    const { paiLo, paiHi } = synth.synthesizePAI({ forward: true, sneak: { current: true } }, {})
    const mis = synth.paiToMoveInputState(paiLo, paiHi)
    const expected = misBit(synth.MIS_BIT_SneakDown) |
      misBit(synth.MIS_BIT_Up) |
      misBit(synth.MIS_BIT_SneakInputCurrentlyDown) |
      misBit(synth.MIS_BIT_SneakInputWasPressed)
    assert.strictEqual(mis, expected)
    assert.strictEqual(mis, 0x00a02001)
  })

  it('matches the C reference round-trip (W + shift steady → MIS 0x00202001)', () => {
    const { paiLo, paiHi } = synth.synthesizePAI(
      { forward: true, sneak: { current: true } },
      { sneak: { current: true } }
    )
    const mis = synth.paiToMoveInputState(paiLo, paiHi)
    assert.strictEqual(mis, 0x00202001)
  })
})
