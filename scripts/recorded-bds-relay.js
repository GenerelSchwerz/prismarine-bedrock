#!/usr/bin/env node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { Relay } = require('bedrock-protocol')
const { normalizeBedrockVersion } = require('../src/version')

const DEFAULT_VERSION = '1.26.20'

function usage () {
  const script = path.relative(process.cwd(), __filename)
  console.error(`Usage:
  node ${script} [options]

Options:
  --listen-host=HOST          Relay listen host, default 0.0.0.0
  --listen-port=PORT          Relay listen UDP port, default 19137
  --destination-host=HOST     Backend BDS host, default 127.0.0.1
  --destination-port=PORT     Backend BDS port, default 19135
  --version=VERSION           Bedrock protocol data version, default 1.26.20
  --record-file=PATH          JSONL output, default logs/bedrock-relay-recording.jsonl
  --scenario=ID_OR_PATH       Relay scenario JSON id/path
  --packet-names=a,b          Only record these packet names
  --directions=a,b            Only record serverbound/clientbound directions
  --no-packet-params          Record packet names and summaries without decoded params
  --include-binary            Include base64 for Buffer/Uint8Array fields
  --online                    Verify downstream login and use online upstream auth
  --help                      Show this help
`)
}

function parseArgs (argv) {
  const options = {
    listenHost: process.env.RELAY_HOST || '0.0.0.0',
    listenPort: Number(process.env.RELAY_PORT || 19137),
    destinationHost: process.env.RELAY_DESTINATION_HOST || '127.0.0.1',
    destinationPort: Number(process.env.RELAY_DESTINATION_PORT || 19135),
    version: normalizeBedrockVersion(process.env.MC_VERSION || DEFAULT_VERSION),
    recordFile: process.env.RELAY_RECORD_FILE || path.join('logs', 'bedrock-relay-recording.jsonl'),
    scenario: process.env.RELAY_SCENARIO || null,
    packetNames: parseCsv(process.env.RELAY_PACKET_NAMES || ''),
    directions: parseCsv(process.env.RELAY_DIRECTIONS || ''),
    packetParams: process.env.RELAY_NO_PACKET_PARAMS !== '1',
    includeBinary: process.env.RELAY_INCLUDE_BINARY === '1',
    offline: process.env.RELAY_ONLINE !== '1',
    motd: process.env.RELAY_MOTD || 'bedrock-test relay recorder',
    maxPlayers: Number(process.env.RELAY_MAX_PLAYERS || 10)
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else if (arg.startsWith('--listen-host=')) {
      options.listenHost = arg.slice('--listen-host='.length)
    } else if (arg.startsWith('--listen-port=')) {
      options.listenPort = parsePort(arg.slice('--listen-port='.length), '--listen-port')
    } else if (arg.startsWith('--destination-host=')) {
      options.destinationHost = arg.slice('--destination-host='.length)
    } else if (arg.startsWith('--destination-port=')) {
      options.destinationPort = parsePort(arg.slice('--destination-port='.length), '--destination-port')
    } else if (arg.startsWith('--version=')) {
      options.version = normalizeBedrockVersion(arg.slice('--version='.length))
    } else if (arg.startsWith('--record-file=')) {
      options.recordFile = arg.slice('--record-file='.length)
    } else if (arg.startsWith('--scenario=')) {
      options.scenario = arg.slice('--scenario='.length)
    } else if (arg.startsWith('--packet-names=')) {
      options.packetNames = parseCsv(arg.slice('--packet-names='.length))
    } else if (arg.startsWith('--directions=')) {
      options.directions = parseCsv(arg.slice('--directions='.length))
    } else if (arg === '--no-packet-params') {
      options.packetParams = false
    } else if (arg === '--include-binary') {
      options.includeBinary = true
    } else if (arg === '--online') {
      options.offline = false
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function parsePort (value, name) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${name} must be a UDP port number`)
  }
  return parsed
}

function parseCsv (value) {
  return String(value || '').split(',').map(entry => entry.trim()).filter(Boolean)
}

class JsonlRecorder {
  constructor (file, options = {}) {
    this.file = path.resolve(file)
    this.sequence = 0
    this.includeBinary = !!options.includeBinary
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    this.stream = fs.createWriteStream(this.file, { flags: 'a' })
  }

  write (record) {
    this.sequence++
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      sequence: this.sequence,
      ...record
    }, this.replacer()) + '\n'
    this.stream.write(line)
  }

  close () {
    this.stream.end()
  }

  replacer () {
    const seen = new WeakSet()
    const includeBinary = this.includeBinary
    return function replace (_key, value) {
      if (typeof value === 'bigint') return `${value}`
      if (Buffer.isBuffer(value)) return summarizeBytes(value, includeBinary)
      if (value instanceof Uint8Array) return summarizeBytes(Buffer.from(value), includeBinary)
      if (value && typeof value === 'object') {
        if (seen.has(value)) return '[Circular]'
        seen.add(value)
      }
      return value
    }
  }
}

function summarizeBytes (buffer, includeBinary) {
  const summary = {
    type: 'Buffer',
    length: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex')
  }
  if (includeBinary) summary.base64 = buffer.toString('base64')
  return summary
}

class RelayScenarioRunner {
  constructor (scenario, recorder) {
    this.scenario = scenario
    this.recorder = recorder
    this.sessions = new Map()
  }

  start (player, upstream) {
    const session = {
      player,
      upstream,
      playerName: player.profile?.name || player.profile?.xuid || player.connection?.address,
      stepIndex: -1,
      status: 'active',
      packetCounts: new Map()
    }
    this.sessions.set(player, session)

    this.recorder.write({
      type: 'scenario_start',
      scenario: this.scenario.id,
      player: session.playerName
    })

    for (const command of this.scenario.setupCommands || []) {
      this.sendCommand(session, command)
    }

    this.startNextStep(session)
  }

  close (player, reason) {
    const session = this.sessions.get(player)
    if (!session) return
    this.recorder.write({
      type: 'scenario_end',
      scenario: this.scenario.id,
      player: session.playerName,
      status: session.status,
      reason
    })
    this.sessions.delete(player)
  }

  observePacket (player, direction, packet) {
    const session = this.sessions.get(player)
    if (!session || session.status !== 'active') return
    const key = `${direction}:${packet.name}`
    session.packetCounts.set(key, (session.packetCounts.get(key) || 0) + 1)
    this.checkStep(session)
  }

  startNextStep (session) {
    const steps = this.scenario.steps || []
    const nextIndex = session.stepIndex + 1
    if (nextIndex >= steps.length) {
      this.completeScenario(session)
      return
    }

    session.stepIndex = nextIndex
    session.packetCounts = new Map()
    const step = steps[nextIndex]
    const instructions = instructionsFor(step)

    this.recorder.write({
      type: 'step_start',
      scenario: this.scenario.id,
      player: session.playerName,
      step: step.id || String(nextIndex + 1),
      step_index: nextIndex,
      instructions,
      clearance: step.clearance
    })

    for (const command of step.setupCommands || []) {
      this.sendCommand(session, command)
    }
    this.sendInstructions(session, nextIndex, steps.length, instructions)
    this.checkStep(session)
  }

  checkStep (session) {
    const step = (this.scenario.steps || [])[session.stepIndex]
    if (!step) return
    const [passed, reason] = this.evaluate(session, step.clearance)
    if (!passed) return

    this.recorder.write({
      type: 'step_complete',
      scenario: this.scenario.id,
      player: session.playerName,
      step: step.id || String(session.stepIndex + 1),
      step_index: session.stepIndex,
      reason
    })

    this.sendText(session.player, step.completeMessage || `Step ${session.stepIndex + 1} complete.`)
    for (const command of step.onCompleteCommands || []) {
      this.sendCommand(session, command)
    }
    this.startNextStep(session)
  }

  completeScenario (session) {
    session.status = 'complete'
    this.recorder.write({
      type: 'scenario_complete',
      scenario: this.scenario.id,
      player: session.playerName
    })
    this.sendText(session.player, this.scenario.completeMessage || 'Scenario complete. You can leave the relay server.')
  }

  evaluate (session, clearance) {
    if (!clearance) return [false, { type: 'missing_clearance' }]
    if (Array.isArray(clearance)) clearance = { all: clearance }
    if (clearance.all) {
      const reasons = []
      for (const entry of clearance.all) {
        const [passed, reason] = this.evaluate(session, entry)
        reasons.push(reason)
        if (!passed) return [false, { type: 'all', passed: false, reasons }]
      }
      return [true, { type: 'all', passed: true, reasons }]
    }
    if (clearance.any) {
      const reasons = []
      for (const entry of clearance.any) {
        const [passed, reason] = this.evaluate(session, entry)
        reasons.push(reason)
        if (passed) return [true, { type: 'any', passed: true, reasons }]
      }
      return [false, { type: 'any', passed: false, reasons }]
    }
    if (clearance.type === 'packet_seen') {
      const name = clearance.name || clearance.packet
      const direction = clearance.direction || 'serverbound'
      const count = Number(clearance.count || 1)
      const seen = session.packetCounts.get(`${direction}:${name}`) || 0
      const passed = !!name && seen >= count
      return [passed, { type: 'packet_seen', direction, name, count, seen, passed }]
    }
    if (clearance.type === 'manual') return [false, { type: 'manual' }]
    return [false, { type: 'unsupported_clearance', clearance }]
  }

  sendInstructions (session, index, total, instructions) {
    this.sendText(session.player, `Step ${index + 1}/${total}`)
    for (const line of instructions) this.sendText(session.player, line)
  }

  sendText (player, message) {
    try {
      player.queue('text', {
        needs_translation: false,
        category: 'message_only',
        type: 'raw',
        message: String(message),
        xuid: '',
        platform_chat_id: '',
        has_filtered_message: false
      })
    } catch (err) {
      this.recorder.write({
        type: 'relay_prompt_error',
        message: err.message
      })
    }
  }

  sendCommand (session, template) {
    if (!session.upstream) return
    const command = formatCommand(template, session.playerName)
    const requestId = `relay:${Date.now()}:${crypto.randomUUID()}`
    this.recorder.write({
      type: 'scenario_command',
      scenario: this.scenario.id,
      player: session.playerName,
      command,
      request_id: requestId
    })
    try {
      session.upstream.queue('command_request', {
        command: slash(command),
        origin: {
          type: 'player',
          uuid: session.player.profile?.uuid || crypto.randomUUID(),
          request_id: requestId,
          player_entity_id: session.upstream.entityId || 0n
        },
        internal: false,
        version: String(this.scenario.commandVersion || '52')
      })
    } catch (err) {
      this.recorder.write({
        type: 'scenario_command_error',
        scenario: this.scenario.id,
        player: session.playerName,
        command,
        error: err.message
      })
    }
  }
}

function instructionsFor (step) {
  const raw = step.instructions ?? step.instruction ?? []
  if (typeof raw === 'string') return [raw]
  if (Array.isArray(raw)) return raw.map(String)
  return []
}

function slash (command) {
  const value = String(command).trim()
  return value.startsWith('/') ? value : `/${value}`
}

function formatCommand (template, playerName) {
  return String(template).replace(/\{playerName\}/g, playerName).replace(/\{player\}/g, quoteCommandArgument(playerName))
}

function quoteCommandArgument (value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function loadScenario (value) {
  if (!value) return null
  const scenarioPath = resolveScenarioPath(value)
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'))
  if (!scenario.id) scenario.id = path.basename(scenarioPath, '.json')
  if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
    throw new Error(`Relay scenario must have a non-empty steps array: ${scenarioPath}`)
  }
  scenario.path = scenarioPath
  return scenario
}

function resolveScenarioPath (value) {
  const candidates = [
    path.resolve(value),
    path.resolve(`${value}.json`),
    path.resolve('test', 'recorded-bds', 'relay-scenarios', value),
    path.resolve('test', 'recorded-bds', 'relay-scenarios', `${value}.json`)
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(`Could not resolve relay scenario ${value}. Tried: ${candidates.join(', ')}`)
}

function shouldRecordPacket (options, direction, name) {
  if (options.packetNames.length > 0 && !options.packetNames.includes(name)) return false
  if (options.directions.length > 0 && !options.directions.includes(direction)) return false
  return true
}

async function main () {
  const options = parseArgs(process.argv.slice(2))
  const scenario = loadScenario(options.scenario)
  const recorder = new JsonlRecorder(options.recordFile, { includeBinary: options.includeBinary })
  const runner = scenario ? new RelayScenarioRunner(scenario, recorder) : null

  recorder.write({
    type: 'relay_start',
    listen: { host: options.listenHost, port: options.listenPort },
    destination: { host: options.destinationHost, port: options.destinationPort },
    version: options.version,
    offline: options.offline,
    scenario: scenario ? { id: scenario.id, path: scenario.path } : null,
    packet_names: options.packetNames,
    directions: options.directions,
    packet_params: options.packetParams,
    include_binary: options.includeBinary
  })

  const relay = new Relay({
    version: options.version,
    host: options.listenHost,
    port: options.listenPort,
    motd: options.motd,
    maxPlayers: options.maxPlayers,
    offline: options.offline,
    destination: {
      host: options.destinationHost,
      port: options.destinationPort,
      offline: options.offline
    },
    logging: false,
    enableChunkCaching: false
  })

  relay.on('connect', player => {
    recorder.write({
      type: 'relay_connect',
      address: String(player.connection?.address || '')
    })

    player.on('clientbound', (packet) => {
      if (runner) runner.observePacket(player, 'clientbound', packet)
      if (shouldRecordPacket(options, 'clientbound', packet.name)) {
        recorder.write(packetRecord('clientbound', packet, options))
      }
    })

    player.on('serverbound', (packet) => {
      if (runner) runner.observePacket(player, 'serverbound', packet)
      if (shouldRecordPacket(options, 'serverbound', packet.name)) {
        recorder.write(packetRecord('serverbound', packet, options))
      }
    })

    player.on('close', reason => {
      recorder.write({
        type: 'relay_disconnect',
        address: String(player.connection?.address || ''),
        reason
      })
      if (runner) runner.close(player, reason)
    })
  })

  relay.on('join', (player, upstream) => {
    recorder.write({
      type: 'relay_join',
      player: player.profile?.name || player.profile?.xuid || null,
      xuid: player.profile?.xuid || null,
      upstream: {
        host: options.destinationHost,
        port: options.destinationPort
      }
    })
    if (runner) runner.start(player, upstream)
  })

  relay.on('error', err => {
    recorder.write({
      type: 'relay_error',
      error: err.stack || err.message
    })
    console.error(err.stack || err.message)
  })

  await relay.listen()
  console.log(`Relay listening on ${options.listenHost}:${options.listenPort}`)
  console.log(`Forwarding to ${options.destinationHost}:${options.destinationPort}`)
  console.log(`Recording to ${path.resolve(options.recordFile)}`)
  if (scenario) console.log(`Scenario: ${scenario.id}`)

  async function shutdown () {
    recorder.write({ type: 'relay_stop' })
    recorder.close()
    await relay.close('Relay recorder stopped').catch(() => {})
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

function packetRecord (direction, packet, options) {
  const record = {
    type: 'packet',
    direction,
    name: packet.name
  }
  if (options.packetParams) record.params = packet.params
  return record
}

main().catch(err => {
  console.error(err.stack || err.message)
  process.exit(1)
})
