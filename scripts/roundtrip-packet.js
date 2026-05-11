#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createSerializer, createDeserializer } = require('bedrock-protocol/src/transforms/serializer')

const EXAMPLES = {
  item_stack_swap: {
    name: 'item_stack_request',
    params: {
      requests: [{
        request_id: 1,
        actions: [{
          type_id: 'swap',
          source: {
            slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
            slot: 0,
            stack_id: 2
          },
          destination: {
            slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
            slot: 1,
            stack_id: 3
          }
        }],
        custom_names: [],
        cause: 'chat_public'
      }]
    }
  },
  item_stack_take: {
    name: 'item_stack_request',
    params: {
      requests: [{
        request_id: 1,
        actions: [{
          type_id: 'take',
          count: 1,
          source: {
            slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
            slot: 0,
            stack_id: 2
          },
          destination: {
            slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
            slot: 1,
            stack_id: 0
          }
        }],
        custom_names: [],
        cause: 'chat_public'
      }]
    }
  },
  item_stack_drop: {
    name: 'item_stack_request',
    params: {
      requests: [{
        request_id: 1,
        actions: [{
          type_id: 'drop',
          count: 1,
          source: {
            slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
            slot: 0,
            stack_id: 2
          },
          randomly: false
        }],
        custom_names: [],
        cause: 'chat_public'
      }]
    }
  }
}

function usage () {
  const script = path.relative(process.cwd(), __filename)
  console.error(`Usage:
  node ${script} <packet.json> [version]
  node ${script} --example <item_stack_swap|item_stack_take|item_stack_drop> [version]

Input JSON must be a bedrock-protocol packet object:
  { "name": "item_stack_request", "params": { ... } }
`)
}

function readPacket () {
  const [first, second] = process.argv.slice(2)

  if (!first || first === '--help' || first === '-h') {
    usage()
    process.exit(first ? 0 : 1)
  }

  if (first === '--example') {
    const packet = EXAMPLES[second]
    if (!packet) {
      console.error(`Unknown example: ${second}`)
      usage()
      process.exit(1)
    }
    return { packet, version: process.argv[4] || process.env.MC_VERSION || '1.21.130' }
  }

  const file = path.resolve(first)
  return {
    packet: JSON.parse(fs.readFileSync(file, 'utf8')),
    version: second || process.env.MC_VERSION || '1.21.130'
  }
}

const { packet, version } = readPacket()
if (!packet || typeof packet.name !== 'string' || !packet.params) {
  throw new Error('Packet JSON must include string "name" and object "params" fields')
}

const serializer = createSerializer(version)
const deserializer = createDeserializer(version)

const buffer = serializer.createPacketBuffer(packet)
const parsed = deserializer.parsePacketBuffer(buffer)

console.log(JSON.stringify({
  version,
  packet: packet.name,
  hex: buffer.toString('hex'),
  parsed: parsed.data
}, null, 2))
