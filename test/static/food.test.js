'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const { createSerializer, createDeserializer } = require('bedrock-protocol/src/transforms/serializer')
const injectFood = require('../../src/builtins/food')

function roundTrip (packet) {
  const serializer = createSerializer('1.21.130')
  const deserializer = createDeserializer('1.21.130')
  const buffer = serializer.createPacketBuffer(packet)
  return deserializer.parsePacketBuffer(buffer).data
}

function createBotState () {
  const client = new EventEmitter()
  client.queued = []
  client.queue = (name, params) => {
    client.queued.push({ name, params })
  }

  const botState = new EventEmitter()
  botState.client = client
  botState.itemClass = null
  botState.spawnPosition = new Vec3(0, 64, 0)
  botState.self = { position: new Vec3(1, 65, 1), food: 10 }
  botState.heldItemSlot = 0
  botState.inventory = {
    slots: [
      {
        type: 260,
        name: 'apple',
        count: 2,
        metadata: 0,
        toNotch () {
          return {
            network_id: 260,
            count: this.count,
            metadata: 0,
            stack_id: 2,
            block_runtime_id: 0,
            extra: { can_place_on: [], can_destroy: [] }
          }
        }
      }
    ]
  }
  botState.onPlayerAuthInputPreSend = hook => {
    botState.authHook = hook
    return () => { botState.authHook = null }
  }
  botState.setAuthInputFlag = (packet, flag, enabled = true) => {
    packet.input_data ??= {}
    packet.input_data[flag] = enabled
  }
  botState.flushPlayerAuthInput = () => {
    const packet = {}
    botState.authHook?.(packet)
    botState.lastAuthPacket = packet
    botState.authPackets ??= []
    botState.authPackets.push(packet)
    return true
  }
  botState.equipItem = async slot => {
    botState.heldItemSlot = slot
    return botState.inventory.slots[slot]
  }

  injectFood(botState, {
    foodUseDurationMs: 1,
    foodCompletionTimeoutMs: 100
  })

  return botState
}

describe('food builtin', function () {
  it('uses registry food metadata when available', function () {
    const { hasFoodMetadata, isFoodItem, canAlwaysEat } = injectFood._foodHelpers
    const registry = {
      foodsByName: {
        apple: { name: 'apple', foodPoints: 4 },
        golden_apple: { name: 'golden_apple', canAlwaysEat: true }
      }
    }

    assert.strictEqual(hasFoodMetadata(registry), true)
    assert.strictEqual(isFoodItem(registry, { name: 'apple' }), true)
    assert.strictEqual(isFoodItem(registry, { name: 'diamond' }), false)
    assert.strictEqual(canAlwaysEat(registry, { name: 'golden_apple' }), true)
    assert.strictEqual(hasFoodMetadata({ foodsByName: undefined }), false)
  })

  it('round-trips Bedrock eating transaction packet shapes', function () {
    const botState = createBotState()
    const item = botState.inventory.slots[0]
    const { makeItemUsePacket, makeItemReleasePacket } = injectFood._foodHelpers

    const start = roundTrip({
      name: 'inventory_transaction',
      params: makeItemUsePacket(botState, 0, item)
    })
    const release = roundTrip({
      name: 'inventory_transaction',
      params: makeItemReleasePacket(botState, 0, item)
    })

    assert.strictEqual(start.params.transaction.transaction_type, 'item_use')
    assert.strictEqual(start.params.transaction.transaction_data.action_type, 'click_air')
    assert.strictEqual(release.params.transaction.transaction_type, 'item_release')
    assert.strictEqual(release.params.transaction.transaction_data.action_type, 'consume')
  })

  it('exposes botState.eat and sends start/release use packets', async function () {
    const botState = createBotState()
    const eatPromise = botState.eat(0, { force: true })

    setTimeout(() => {
      botState.client.emit('completed_using_item', {
        used_item_id: 260,
        use_method: 'eat'
      })
    }, 10)

    const result = await eatPromise

    assert.strictEqual(result.reason, 'completed_using_item')
    assert.strictEqual(botState.client.queued.length, 2)
    assert.strictEqual(botState.client.queued[0].name, 'inventory_transaction')
    assert.strictEqual(botState.client.queued[0].params.transaction.transaction_type, 'item_use')
    assert.strictEqual(botState.client.queued[1].params.transaction.transaction_type, 'item_release')
    assert.strictEqual(botState.authPackets.some(packet => packet.input_data?.start_using_item), true)
    assert.strictEqual(botState.usingHeldItem, false)
  })
})
