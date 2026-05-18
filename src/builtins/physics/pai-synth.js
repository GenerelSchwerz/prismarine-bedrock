'use strict'

const PAI_BIT_Ascend = 0
const PAI_BIT_Descend = 1
const PAI_BIT_NorthJumpDeprecated = 2
const PAI_BIT_JumpDown = 3
const PAI_BIT_SprintDown = 4
const PAI_BIT_ChangeHeight = 5
const PAI_BIT_Jumping = 6
const PAI_BIT_AutoJumpingInWater = 7
const PAI_BIT_Sneaking = 8
const PAI_BIT_SneakDown = 9
const PAI_BIT_Up = 10
const PAI_BIT_Down = 11
const PAI_BIT_Left = 12
const PAI_BIT_Right = 13
const PAI_BIT_UpLeft = 14
const PAI_BIT_UpRight = 15
const PAI_BIT_WantUp = 16
const PAI_BIT_WantDown = 17
const PAI_BIT_WantDownSlow = 18
const PAI_BIT_WantUpSlow = 19
const PAI_BIT_Sprinting = 20
const PAI_BIT_AscendBlock = 21
const PAI_BIT_DescendBlock = 22
const PAI_BIT_SneakToggleDown = 23
const PAI_BIT_PersistSneak = 24
const PAI_BIT_StartSprinting = 25
const PAI_BIT_StopSprinting = 26
const PAI_BIT_StartSneaking = 27
const PAI_BIT_StopSneaking = 28
const PAI_BIT_StartSwimming = 29
const PAI_BIT_StopSwimming = 30
const PAI_BIT_StartJumping = 31
const PAI_BIT_StartGliding = 32
const PAI_BIT_StopGliding = 33
const PAI_BIT_PerformItemInteraction = 34
const PAI_BIT_PerformBlockActions = 35
const PAI_BIT_PerformItemStackRequest = 36
const PAI_BIT_HandledTeleport = 37
const PAI_BIT_Emoting = 38
const PAI_BIT_MissedSwing = 39
const PAI_BIT_StartCrawling = 40
const PAI_BIT_StopCrawling = 41
const PAI_BIT_StartFlying = 42
const PAI_BIT_StopFlying = 43
const PAI_BIT_ClientAckServerData = 44
const PAI_BIT_IsInClientPredictedVehicle = 45
const PAI_BIT_PaddlingLeft = 46
const PAI_BIT_PaddlingRight = 47
const PAI_BIT_BlockBreakingDelayEnabled = 48
const PAI_BIT_HorizontalCollision = 49
const PAI_BIT_VerticalCollision = 50
const PAI_BIT_DownLeft = 51
const PAI_BIT_DownRight = 52
const PAI_BIT_StartUsingItem = 53
const PAI_BIT_IsCameraRelativeMovementEnabledDeprecated = 54
const PAI_BIT_IsRotControlledByMoveDirectionDeprecated = 55
const PAI_BIT_StartSpinAttack = 56
const PAI_BIT_StopSpinAttack = 57
const PAI_BIT_IsHotbarOnlyTouch = 58
const PAI_BIT_JumpReleasedRaw = 59
const PAI_BIT_JumpPressedRaw = 60
const PAI_BIT_JumpCurrentRaw = 61
const PAI_BIT_SneakReleasedRaw = 62
const PAI_BIT_SneakPressedRaw = 63
const PAI_BIT_SneakCurrentRaw = 64
const PAI_BIT_InputNum = 65

const MIS_BIT_SneakDown = 0
const MIS_BIT_SneakToggleDown = 1
const MIS_BIT_WantDownSlow = 2
const MIS_BIT_WantUpSlow = 3
const MIS_BIT_BlockSelectDown = 4
const MIS_BIT_AscendBlock = 5
const MIS_BIT_DescendBlock = 6
const MIS_BIT_JumpDown = 7
const MIS_BIT_SprintDown = 8
const MIS_BIT_UpLeft = 9
const MIS_BIT_UpRight = 10
const MIS_BIT_DownLeft = 11
const MIS_BIT_DownRight = 12
const MIS_BIT_Up = 13
const MIS_BIT_Down = 14
const MIS_BIT_Left = 15
const MIS_BIT_Right = 16
const MIS_BIT_Ascend = 17
const MIS_BIT_Descend = 18
const MIS_BIT_ChangeHeight = 19
const MIS_BIT_LookCenter = 20
const MIS_BIT_SneakInputCurrentlyDown = 21
const MIS_BIT_SneakInputWasReleased = 22
const MIS_BIT_SneakInputWasPressed = 23
const MIS_BIT_JumpInputWasReleased = 24
const MIS_BIT_JumpInputWasPressed = 25
const MIS_BIT_JumpInputCurrentlyDown = 26
const MIS_BIT_Count = 27

/**
 * @typedef {Object} ButtonEvent
 * @property {boolean} current   Held this tick.
 * @property {boolean} [pressed] Rising edge this tick. If omitted, derived from prev.current.
 * @property {boolean} [released] Falling edge this tick. If omitted, derived from prev.current.
 *
 * For same-tick press+release (the 0.04% gap from human-driven recording at
 * docs/pai-to-move-input-state.md lines 219-221), set BOTH pressed=true and
 * released=true on the same tick with current=false.
 */

/**
 * @typedef {Object} ButtonState
 * @property {boolean} forward    W
 * @property {boolean} back       S
 * @property {boolean} left       A
 * @property {boolean} right      D
 * @property {ButtonEvent} jump   Space (pressed/released/current)
 * @property {ButtonEvent} sneak  Shift (pressed/released/current)
 * @property {boolean} sprint     Ctrl held (no edge tracking; PAI lacks sprint*Raw bits)
 * @property {boolean} [ascend]   Creative-fly up (unverified — no recording)
 * @property {boolean} [descend]  Creative-fly down (unverified — no recording)
 *
 * Matches the 7-button gamepad surface at
 * prismarine-bedrock-preview/src/main.js:28-34.
 */

/**
 * @typedef {Object} InputHistory
 * @property {ButtonState} prevButtons  Previous-tick button snapshot (for edge derivation when ButtonEvent omits pressed/released).
 * @property {ButtonState} currButtons  Current-tick button snapshot.
 * @property {bigint} paiLo  Bits 0..63 of PlayerAuthInputPacket.mInputData.
 * @property {number} paiHi  Bit 64 (SneakCurrentRaw) packed into LSB of u8.
 *
 * Lives on `botState.self.inputState`. Initialized by installControls().
 * Updated each tick by evaluateControls() (planned: step 3 of refactor).
 */

function normalizeButtonEvent (input, prevCurrent) {
  if (input === undefined || input === null || typeof input === 'boolean') {
    const current = !!input
    return { current, pressed: current && !prevCurrent, released: !current && prevCurrent }
  }
  const current = !!input.current
  const pressed = input.pressed === undefined ? (current && !prevCurrent) : !!input.pressed
  const released = input.released === undefined ? (!current && prevCurrent) : !!input.released
  return { current, pressed, released }
}

function prevCurrentOf (prevButton) {
  if (prevButton === undefined || prevButton === null) return false
  if (typeof prevButton === 'boolean') return prevButton
  return !!prevButton.current
}

function synthesizePAI (buttons, prevButtons) {
  const prev = prevButtons || {}
  const jump = normalizeButtonEvent(buttons && buttons.jump, prevCurrentOf(prev.jump))
  const sneak = normalizeButtonEvent(buttons && buttons.sneak, prevCurrentOf(prev.sneak))
  const w = !!(buttons && buttons.forward)
  const s = !!(buttons && buttons.back)
  const a = !!(buttons && buttons.left)
  const d = !!(buttons && buttons.right)
  const ctrl = !!(buttons && buttons.sprint)
  const ascend = !!(buttons && buttons.ascend)
  const descend = !!(buttons && buttons.descend)

  let lo = 0n
  let hi = 0

  if (w) lo |= 1n << BigInt(PAI_BIT_Up)
  if (s) lo |= 1n << BigInt(PAI_BIT_Down)
  if (a) lo |= 1n << BigInt(PAI_BIT_Left)
  if (d) lo |= 1n << BigInt(PAI_BIT_Right)

  if (sneak.current) {
    lo |= 1n << BigInt(PAI_BIT_Sneaking)
    lo |= 1n << BigInt(PAI_BIT_SneakDown)
    lo |= 1n << BigInt(PAI_BIT_WantDown)
    hi |= 0x1
  }
  if (sneak.pressed) {
    lo |= 1n << BigInt(PAI_BIT_StartSneaking)
    lo |= 1n << BigInt(PAI_BIT_SneakPressedRaw)
  }
  if (sneak.released) {
    lo |= 1n << BigInt(PAI_BIT_StopSneaking)
    lo |= 1n << BigInt(PAI_BIT_SneakReleasedRaw)
  }

  if (ctrl) {
    lo |= 1n << BigInt(PAI_BIT_SprintDown)
    lo |= 1n << BigInt(PAI_BIT_Sprinting)
  }

  if (jump.current) {
    lo |= 1n << BigInt(PAI_BIT_JumpDown)
    lo |= 1n << BigInt(PAI_BIT_Jumping)
    lo |= 1n << BigInt(PAI_BIT_WantUp)
    lo |= 1n << BigInt(PAI_BIT_JumpCurrentRaw)
  }
  if (jump.pressed) {
    lo |= 1n << BigInt(PAI_BIT_StartJumping)
    lo |= 1n << BigInt(PAI_BIT_JumpPressedRaw)
  }
  if (jump.released) {
    lo |= 1n << BigInt(PAI_BIT_JumpReleasedRaw)
  }

  if (ascend) {
    lo |= 1n << BigInt(PAI_BIT_Ascend)
    lo |= 1n << BigInt(PAI_BIT_AscendBlock)
  }
  if (descend) {
    lo |= 1n << BigInt(PAI_BIT_Descend)
    lo |= 1n << BigInt(PAI_BIT_DescendBlock)
  }

  return { paiLo: lo, paiHi: hi }
}

function paiToMoveInputState (paiLo, paiHi) {
  let mis = 0
  if (paiLo & (1n << BigInt(PAI_BIT_Up))) mis |= 1 << MIS_BIT_Up
  if (paiLo & (1n << BigInt(PAI_BIT_Down))) mis |= 1 << MIS_BIT_Down
  if (paiLo & (1n << BigInt(PAI_BIT_Left))) mis |= 1 << MIS_BIT_Left
  if (paiLo & (1n << BigInt(PAI_BIT_Right))) mis |= 1 << MIS_BIT_Right
  if (paiLo & (1n << BigInt(PAI_BIT_SneakDown))) mis |= 1 << MIS_BIT_SneakDown
  if (paiHi & 0x1) mis |= 1 << MIS_BIT_SneakInputCurrentlyDown
  if (paiLo & (1n << BigInt(PAI_BIT_SneakPressedRaw))) mis |= 1 << MIS_BIT_SneakInputWasPressed
  if (paiLo & (1n << BigInt(PAI_BIT_SneakReleasedRaw))) mis |= 1 << MIS_BIT_SneakInputWasReleased
  if (paiLo & (1n << BigInt(PAI_BIT_SprintDown))) mis |= 1 << MIS_BIT_SprintDown
  if (paiLo & (1n << BigInt(PAI_BIT_JumpDown))) mis |= 1 << MIS_BIT_JumpDown
  if (paiLo & (1n << BigInt(PAI_BIT_JumpCurrentRaw))) mis |= 1 << MIS_BIT_JumpInputCurrentlyDown
  if (paiLo & (1n << BigInt(PAI_BIT_JumpPressedRaw))) mis |= 1 << MIS_BIT_JumpInputWasPressed
  if (paiLo & (1n << BigInt(PAI_BIT_JumpReleasedRaw))) mis |= 1 << MIS_BIT_JumpInputWasReleased
  return mis >>> 0
}

module.exports = {
  PAI_BIT_Ascend,
  PAI_BIT_Descend,
  PAI_BIT_NorthJumpDeprecated,
  PAI_BIT_JumpDown,
  PAI_BIT_SprintDown,
  PAI_BIT_ChangeHeight,
  PAI_BIT_Jumping,
  PAI_BIT_AutoJumpingInWater,
  PAI_BIT_Sneaking,
  PAI_BIT_SneakDown,
  PAI_BIT_Up,
  PAI_BIT_Down,
  PAI_BIT_Left,
  PAI_BIT_Right,
  PAI_BIT_UpLeft,
  PAI_BIT_UpRight,
  PAI_BIT_WantUp,
  PAI_BIT_WantDown,
  PAI_BIT_WantDownSlow,
  PAI_BIT_WantUpSlow,
  PAI_BIT_Sprinting,
  PAI_BIT_AscendBlock,
  PAI_BIT_DescendBlock,
  PAI_BIT_SneakToggleDown,
  PAI_BIT_PersistSneak,
  PAI_BIT_StartSprinting,
  PAI_BIT_StopSprinting,
  PAI_BIT_StartSneaking,
  PAI_BIT_StopSneaking,
  PAI_BIT_StartSwimming,
  PAI_BIT_StopSwimming,
  PAI_BIT_StartJumping,
  PAI_BIT_StartGliding,
  PAI_BIT_StopGliding,
  PAI_BIT_PerformItemInteraction,
  PAI_BIT_PerformBlockActions,
  PAI_BIT_PerformItemStackRequest,
  PAI_BIT_HandledTeleport,
  PAI_BIT_Emoting,
  PAI_BIT_MissedSwing,
  PAI_BIT_StartCrawling,
  PAI_BIT_StopCrawling,
  PAI_BIT_StartFlying,
  PAI_BIT_StopFlying,
  PAI_BIT_ClientAckServerData,
  PAI_BIT_IsInClientPredictedVehicle,
  PAI_BIT_PaddlingLeft,
  PAI_BIT_PaddlingRight,
  PAI_BIT_BlockBreakingDelayEnabled,
  PAI_BIT_HorizontalCollision,
  PAI_BIT_VerticalCollision,
  PAI_BIT_DownLeft,
  PAI_BIT_DownRight,
  PAI_BIT_StartUsingItem,
  PAI_BIT_IsCameraRelativeMovementEnabledDeprecated,
  PAI_BIT_IsRotControlledByMoveDirectionDeprecated,
  PAI_BIT_StartSpinAttack,
  PAI_BIT_StopSpinAttack,
  PAI_BIT_IsHotbarOnlyTouch,
  PAI_BIT_JumpReleasedRaw,
  PAI_BIT_JumpPressedRaw,
  PAI_BIT_JumpCurrentRaw,
  PAI_BIT_SneakReleasedRaw,
  PAI_BIT_SneakPressedRaw,
  PAI_BIT_SneakCurrentRaw,
  PAI_BIT_InputNum,
  MIS_BIT_SneakDown,
  MIS_BIT_SneakToggleDown,
  MIS_BIT_WantDownSlow,
  MIS_BIT_WantUpSlow,
  MIS_BIT_BlockSelectDown,
  MIS_BIT_AscendBlock,
  MIS_BIT_DescendBlock,
  MIS_BIT_JumpDown,
  MIS_BIT_SprintDown,
  MIS_BIT_UpLeft,
  MIS_BIT_UpRight,
  MIS_BIT_DownLeft,
  MIS_BIT_DownRight,
  MIS_BIT_Up,
  MIS_BIT_Down,
  MIS_BIT_Left,
  MIS_BIT_Right,
  MIS_BIT_Ascend,
  MIS_BIT_Descend,
  MIS_BIT_ChangeHeight,
  MIS_BIT_LookCenter,
  MIS_BIT_SneakInputCurrentlyDown,
  MIS_BIT_SneakInputWasReleased,
  MIS_BIT_SneakInputWasPressed,
  MIS_BIT_JumpInputWasReleased,
  MIS_BIT_JumpInputWasPressed,
  MIS_BIT_JumpInputCurrentlyDown,
  MIS_BIT_Count,
  synthesizePAI,
  paiToMoveInputState
}
