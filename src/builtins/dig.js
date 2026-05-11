// builtins/dig.js
// Auto-loaded by BotState._loadBuiltins().
// Provides botState.dig(block).

const { logAction } = require('../utils')

module.exports = (botState) => {
  const digState = {
    target: null,
    startTime: null,
    startTick: null,
    digTicks: null,
    face: null,
    started: false,
    unhook: null
  }

  botState.currentDig = digState

  function vec3i (pos) {
    return {
      x: Math.floor(pos.x),
      y: Math.floor(pos.y),
      z: Math.floor(pos.z)
    }
  }

  function heldItem () {
    return botState.heldItem
  }

  function heldItemType () {
    return heldItem()?.type ?? null
  }

  function digTime (block) {
    return block.digTime(heldItemType(), false, false, !botState.self.onGround)
  }

  function clearDigState () {
    digState.unhook?.()

    digState.target = null
    digState.startTime = null
    digState.startTick = null
    digState.digTicks = null
    digState.face = null
    digState.started = false
    digState.unhook = null
  }

  function blockFace (pos) {
    const eye = botState.self.position.offset(0, 1.62, 0)
    const center = {
      x: Math.floor(pos.x) + 0.5,
      y: Math.floor(pos.y) + 0.5,
      z: Math.floor(pos.z) + 0.5
    }
    const dx = eye.x - center.x
    const dy = eye.y - center.y
    const dz = eye.z - center.z

    if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) return dy > 0 ? 1 : 0
    if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? 5 : 4
    return dz > 0 ? 3 : 2
  }

  function appendBlockActions (packet, actions, pos, face) {
    botState.setAuthInputFlag(packet, 'block_action', true)
    packet.block_action ??= []
    for (const action of actions) {
      packet.block_action.push({
        action,
        position: vec3i(pos),
        face
      })
    }
  }

  function installDigHook () {
    digState.unhook = botState.onPlayerAuthInputPreSend(packet => {
      if (!digState.target) return

      if (digState.startTick === null) digState.startTick = packet.tick

      const elapsedTicks = Number(BigInt(packet.tick) - BigInt(digState.startTick))
      let actions
      if (!digState.started) {
        digState.startTime = Date.now()
        actions = ['start_break']
      } else if (elapsedTicks >= digState.digTicks) {
        actions = ['continue_break', 'predict_break']
      } else {
        actions = ['continue_break']
      }

      digState.started = true
      appendBlockActions(packet, actions, digState.target, digState.face)

      if (actions.includes('predict_break')) {
        logAction('[dig]', 'predict break', {
          pos: digState.target.toString(),
          dugMs: Date.now() - digState.startTime,
          dugTicks: elapsedTicks
        })

        clearDigState()
      }
    })
  }

  async function digBlock (block) {
    if (digState.target) {
      throw new Error(`Already digging ${digState.target}`)
    }

    if (!block.diggable || block.hardness < 0) {
      throw new Error(`Cannot dig block: ${block.name}`)
    }

    const pos = block.position

    // if (typeof botState.lookAt === 'function') {
    //   await botState.lookAt(pos)
    // }

    const ms = digTime(block)

    digState.target = pos.clone()
    digState.startTime = null
    digState.startTick = null
    digState.digTicks = Math.max(1, Math.ceil(ms / 50))
    digState.face = blockFace(pos)
    installDigHook()

    logAction('[dig]', 'start break', {
      block: block.name,
      pos: pos.toString(),
      digMs: ms,
      tool: heldItem()?.name || 'empty'
    })
  }

  botState.dig = digBlock

  botState.client.on('update_block', (packet) => {
    if (!digState.target) return

    const pos = packet.position
    if (
      pos.x !== digState.target.x ||
      pos.y !== digState.target.y ||
      pos.z !== digState.target.z
    ) return

    logAction('[dig]', 'block updated while digging', {
      pos: digState.target.toString()
    })

    clearDigState()
  })
}
