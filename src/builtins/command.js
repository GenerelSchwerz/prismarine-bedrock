// builtins/commands.js
// Auto-loaded by BotState._loadBuiltins().
// Provides command helpers for Bedrock command_request and slash-chat commands.

const crypto = require('crypto')
const { logAction } = require('../utils')

module.exports = function commandsPlugin (botState, options = {}) {
  const client = botState.client

  let commandVersion = options.commandVersion ?? '52'
  let commandTimeoutMs = options.commandTimeoutMs ?? 5000
  let seq = 0

  const pending = new Map()

  function slash (command) {
    const value = command.trim()
    return value.startsWith('/') ? value : `/${value}`
  }

  function requestId () {
    seq++
    return `cmd:${Date.now()}:${seq}:${crypto.randomUUID()}`
  }

  function commandOrigin (id, type = 'player') {
    return {
      type,
      uuid: crypto.randomUUID(),
      request_id: id,
      player_entity_id: client.entityId ?? 0n
    }
  }

  function command (value, opts = {}) {
    const id = opts.requestId ?? requestId()

    client.queue('command_request', {
      command: slash(value),
      origin: opts.origin ?? commandOrigin(id, opts.originType ?? 'player'),
      internal: opts.internal ?? false,
      version: opts.version ?? commandVersion
    })

    logAction('[command]', 'request', {
      command: slash(value),
      requestId: id
    })

    return id
  }

  function chatCommand (value) {
    client.queue('text', {
      needs_translation: false,
      category: 'authored',
      type: 'chat',
      source_name: client.username,
      message: slash(value),
      xuid: '',
      platform_chat_id: '',
      has_filtered_message: false
    })

    logAction('[command]', 'chat', {
      command: slash(value)
    })
  }

  function rawCommand (value) {
    client.queue('text', {
      needs_translation: false,
      category: 'message_only',
      type: 'raw',
      message: slash(value),
      xuid: '',
      platform_chat_id: '',
      has_filtered_message: false
    })

    logAction('[command]', 'raw', {
      command: slash(value)
    })
  }

  function waitForCommandOutput (id, timeoutMs = commandTimeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`Timed out waiting for command output: ${id}`))
      }, timeoutMs)

      pending.set(id, { resolve, reject, timeout })
    })
  }

  async function commandWithOutput (value, opts = {}) {
    const id = command(value, opts)
    return waitForCommandOutput(id, opts.timeoutMs ?? commandTimeoutMs)
  }

  function outputRequestId (packet) {
    return packet.origin?.request_id
  }

  function parseOutputMessage (message) {
    const text = message.message ?? message.id ?? ''
    const params = message.parameters ?? []
    return params.length ? `${text} ${params.join(' ')}` : text
  }

  function parseCommandOutput (packet) {
    const messages = packet.output_messages ?? []

    return {
      requestId: outputRequestId(packet),
      successCount: packet.success_count,
      outputType: packet.output_type,
      messages,
      lines: messages.map(parseOutputMessage),
      raw: packet
    }
  }

  client.on('command_output', (packet) => {
    const output = parseCommandOutput(packet)
    botState.emit('command_output', output)

    const id = output.requestId
    const waiter = pending.get(id)
    if (!waiter) return

    clearTimeout(waiter.timeout)
    pending.delete(id)
    waiter.resolve(output)
  })

  function clearCommandWaiters () {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timeout)
      waiter.reject(new Error('Command waiters cleared'))
    }

    pending.clear()
  }

  botState.command = command

  botState.commandWithOutput = commandWithOutput
  botState.chatCommand = chatCommand
  
  botState.rawCommand = rawCommand

  botState.setCommandVersion = (version) => {
    commandVersion = version
  }

  botState.setCommandTimeout = (ms) => {
    commandTimeoutMs = ms
  }

  botState.clearCommandWaiters = clearCommandWaiters

  client.on('close', clearCommandWaiters)
}
