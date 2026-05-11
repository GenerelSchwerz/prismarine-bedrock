// builtins/auth-input.js
// Shared pre-send hook point for player_auth_input packets.

const INPUT_FLAG = {
  item_interact: 34n,
  block_action: 35n,
  item_stack_request: 36n,
  received_server_data: 44n,
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
