// builtins/auth-input.js
// Shared pre-send hook point for player_auth_input packets.

const INPUT_FLAG = {
  ascend: 0n,
  descend: 1n,
  north_jump: 2n,
  jump_down: 3n,
  sprint_down: 4n,
  change_height: 5n,
  jumping: 6n,
  auto_jumping_in_water: 7n,
  sneaking: 8n,
  sneak_down: 9n,
  up: 10n,
  down: 11n,
  left: 12n,
  right: 13n,
  up_left: 14n,
  up_right: 15n,
  want_up: 16n,
  want_down: 17n,
  want_down_slow: 18n,
  want_up_slow: 19n,
  sprinting: 20n,
  ascend_block: 21n,
  descend_block: 22n,
  sneak_toggle_down: 23n,
  persist_sneak: 24n,
  start_sprinting: 25n,
  stop_sprinting: 26n,
  start_sneaking: 27n,
  stop_sneaking: 28n,
  start_swimming: 29n,
  stop_swimming: 30n,
  start_jumping: 31n,
  start_gliding: 32n,
  stop_gliding: 33n,
  item_interact: 34n,
  block_action: 35n,
  item_stack_request: 36n,
  handled_teleport: 37n,
  emoting: 38n,
  missed_swing: 39n,
  start_crawling: 40n,
  stop_crawling: 41n,
  start_flying: 42n,
  stop_flying: 43n,
  received_server_data: 44n,
  client_predicted_vehicle: 45n,
  paddling_left: 46n,
  paddling_right: 47n,
  block_breaking_delay_enabled: 48n,
  horizontal_collision: 49n,
  vertical_collision: 50n,
  down_left: 51n,
  down_right: 52n,
  start_using_item: 53n,
  camera_relative_movement_enabled: 54n,
  rot_controlled_by_move_direction: 55n,
  start_spin_attack: 56n,
  stop_spin_attack: 57n,
  hotbar_only_touch: 58n,
  jump_released_raw: 59n,
  jump_pressed_raw: 60n,
  jump_current_raw: 61n,
  sneak_released_raw: 62n,
  sneak_pressed_raw: 63n,
  sneak_current_raw: 64n,
}

const INPUT_FLAG_BY_BIT = Object.fromEntries(
  Object.entries(INPUT_FLAG).map(([name, bit]) => [bit.toString(), name])
)

function normalizeInputData (inputData) {
  if (inputData && typeof inputData === 'object') return inputData

  const flags = {}
  const value = BigInt(inputData || 0)
  for (const [bit, name] of Object.entries(INPUT_FLAG_BY_BIT)) {
    flags[name] = (value & (1n << BigInt(bit))) !== 0n
  }
  return flags
}

function mergePatch (target, patch) {
  if (!patch) return
  for (const [key, value] of Object.entries(patch)) {
    target[key] = value
  }
}

module.exports = function authInputPlugin (botState) {
  if (botState._authInputHooks) return

  const hooks = new Set()
  const queuedEdits = []

  botState.authInputFlags = INPUT_FLAG

  botState.setAuthInputFlag = (packet, flag, enabled = true) => {
    const bit = typeof flag === 'bigint' ? flag : INPUT_FLAG[flag]
    if (bit == null) throw new Error(`Unknown player_auth_input flag: ${flag}`)

    packet.input_data = normalizeInputData(packet.input_data)
    const name = INPUT_FLAG_BY_BIT[bit.toString()]
    if (!name) throw new Error(`No protocol flag name for player_auth_input bit: ${bit}`)
    packet.input_data[name] = enabled
  }

  botState.onPlayerAuthInputPreSend = (hook) => {
    if (typeof hook !== 'function') throw new Error('player_auth_input hook must be a function')
    hooks.add(hook)
    return () => hooks.delete(hook)
  }

  botState.queuePlayerAuthInputEdit = (edit) => {
    if (typeof edit !== 'function' && (!edit || typeof edit !== 'object')) {
      throw new Error('player_auth_input edit must be a function or object')
    }

    queuedEdits.push(edit)
  }

  botState.flushPlayerAuthInput = () => {
    if (typeof botState.sendPlayerAuthInputNow !== 'function') return false
    botState.sendPlayerAuthInputNow()
    return true
  }

  botState._applyPlayerAuthInputHooks = (packet, context = {}) => {
    for (const hook of hooks) {
      mergePatch(packet, hook(packet, context))
    }

    const edits = queuedEdits.splice(0, queuedEdits.length)
    for (const edit of edits) {
      mergePatch(packet, typeof edit === 'function' ? edit(packet, context) : edit)
    }

    return packet
  }

  botState._authInputHooks = hooks
}
