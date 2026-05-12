'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { createSerializer, createDeserializer } = require('bedrock-protocol/src/transforms/serializer')
const {
  WINDOW_TYPE_INFO,
  containerSlotInfoFor,
  containerSlotTypeFor,
  normalizeWindowId,
  windowInfoFor
} = require('../src/container-metadata')

const TYPES_YML = path.join(
  __dirname,
  '..',
  'node_modules',
  'minecraft-data',
  'minecraft-data',
  'data',
  'bedrock',
  '1.21.130',
  'types.yml'
)

function enumNames (name) {
  const source = fs.readFileSync(TYPES_YML, 'utf8')
  const body = source.split(`${name}:`)[1].split('\n\n')[0]
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\S/.test(line) || line.startsWith('- '))
    .filter(line => !line.endsWith('=>'))
    .map(line => {
      if (line.startsWith('- ')) return line.slice(2)
      return line.replace(/^-?\d+:\s*/, '')
    })
    .map(line => line.split(/\s+#/)[0].trim())
    .filter(Boolean)
}

function slotInfo (type, slot, containerSlotType = 'container') {
  return containerSlotInfoFor({ type, containerSlotType }, slot)
}

describe('container metadata', function () {
  it('normalizes Bedrock window ids', function () {
    assert.strictEqual(normalizeWindowId('inventory'), 0)
    assert.strictEqual(normalizeWindowId('hotbar'), 122)
    assert.strictEqual(normalizeWindowId(7), 7)
    assert.strictEqual(normalizeWindowId('custom'), 'custom')
  })

  it('has window metadata or intentional fallback for every Bedrock WindowType', function () {
    for (const windowType of enumNames('WindowType')) {
      const info = windowInfoFor(windowType)
      assert(info, `missing window info for ${windowType}`)
      assert.strictEqual(typeof info.key, 'string', `missing key for ${windowType}`)
      assert(Number.isInteger(info.containerSlots), `missing container slot count for ${windowType}`)
      assert(info.containerSlots > 0, `invalid container slot count for ${windowType}`)
    }

    assert.strictEqual(windowInfoFor('not_a_window').fallback, true)
    assert.strictEqual(WINDOW_TYPE_INFO.furnace.containerSlots, 3)
  })

  it('uses valid ContainerSlotType names for mapped slots', function () {
    const validSlotTypes = new Set(enumNames('ContainerSlotType'))
    const testedTypes = [
      ...Object.keys(WINDOW_TYPE_INFO),
      'unknown_window',
      'shulker_box'
    ]

    for (const type of testedTypes) {
      const containerSlotType = type === 'shulker_box' ? 'shulker' : 'container'
      for (let slot = 0; slot < 12; slot++) {
        const info = slotInfo(type, slot, containerSlotType)
        if (!info) continue
        assert(validSlotTypes.has(info.containerId), `${type}:${slot} uses invalid slot type ${info.containerId}`)
      }
    }
  })

  it('maps known specialized containers to protocol slot identities', function () {
    assert.deepStrictEqual(slotInfo('furnace', 0), { containerId: 'furnace_ingredient', protocolSlot: 0 })
    assert.deepStrictEqual(slotInfo('brewing_stand', 3), { containerId: 'brewing_input', protocolSlot: 0 })
    assert.deepStrictEqual(slotInfo('anvil', 2), { containerId: 'anvil_result', protocolSlot: 50 })
    assert.deepStrictEqual(slotInfo('smithing_table', 0), { containerId: 'smithing_table_template', protocolSlot: 53 })
    assert.deepStrictEqual(slotInfo('loom', 3), { containerId: 'loom_result', protocolSlot: 50 })
    assert.deepStrictEqual(slotInfo('grindstone', 1), { containerId: 'grindstone_additional', protocolSlot: 17 })
    assert.deepStrictEqual(slotInfo('stonecutter', 1), { containerId: 'stonecutter_result', protocolSlot: 50 })
    assert.deepStrictEqual(slotInfo('cartography', 1), { containerId: 'cartography_additional', protocolSlot: 13 })
    assert.deepStrictEqual(slotInfo('beacon', 0), { containerId: 'beacon_payment', protocolSlot: 27 })
    assert.deepStrictEqual(slotInfo('trading', 2), { containerId: 'trade2_result', protocolSlot: 50 })
    assert.deepStrictEqual(slotInfo('crafter', 9), { containerId: 'crafter', protocolSlot: 50 })
  })

  it('preserves generic container slot types', function () {
    assert.strictEqual(containerSlotTypeFor({ windowType: 'container', blockName: 'barrel' }), 'barrel')
    assert.strictEqual(containerSlotTypeFor({ windowType: 'shulker_box' }), 'shulker')
    assert.strictEqual(containerSlotTypeFor({ windowType: 'container', blockName: 'red_shulker_box' }), 'shulker')
    assert.strictEqual(containerSlotTypeFor({ windowType: 'container', blockName: 'chest' }), 'container')

    assert.deepStrictEqual(slotInfo('container', 5, 'barrel'), { containerId: 'barrel', protocolSlot: 5 })
    assert.deepStrictEqual(slotInfo('shulker_box', 5, 'shulker'), { containerId: 'shulker', protocolSlot: 5 })
    assert.deepStrictEqual(slotInfo('unknown_window', 5, 'container'), { containerId: 'container', protocolSlot: 5 })
  })

  it('round-trips representative item_stack_request slot identities', function () {
    const serializer = createSerializer('1.21.130')
    const deserializer = createDeserializer('1.21.130')
    const cases = [
      ['anvil_input', 1, 'anvil_result', 50],
      ['smithing_table_template', 53, 'smithing_table_result', 50],
      ['cartography_input', 12, 'cartography_result', 50],
      ['barrel', 0, 'hotbar', 0],
      ['container', 0, 'crafter', 50]
    ]

    for (const [sourceId, sourceSlot, destinationId, destinationSlot] of cases) {
      const packet = {
        name: 'item_stack_request',
        params: {
          requests: [{
            request_id: 1,
            actions: [{
              type_id: 'take',
              count: 1,
              source: {
                slot_type: { container_id: sourceId, dynamic_container_id: 0 },
                slot: sourceSlot,
                stack_id: 2
              },
              destination: {
                slot_type: { container_id: destinationId, dynamic_container_id: 0 },
                slot: destinationSlot,
                stack_id: 0
              }
            }],
            custom_names: [],
            cause: 'chat_public'
          }]
        }
      }

      const buffer = serializer.createPacketBuffer(packet)
      assert(deserializer.parsePacketBuffer(buffer).data)
    }
  })
})
