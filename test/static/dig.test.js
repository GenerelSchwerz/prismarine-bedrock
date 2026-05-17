'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const digPlugin = require('../../src/builtins/dig')

function createDigState () {
  const state = new EventEmitter()
  state.client = new EventEmitter()
  state.self = {
    position: new Vec3(0, 65.62, 0),
    onGround: true
  }
  state.heldItem = null
  state.lookCalls = []
  state.lookAt = async (pos, force) => {
    state.lookCalls.push({ pos, force })
  }
  state.setAuthInputFlag = (packet, flag, value) => {
    packet.input_data ??= {}
    packet.input_data[flag] = value
  }
  state.authHooks = []
  state.onPlayerAuthInputPreSend = hook => {
    state.authHooks.push(hook)
    return () => {
      const index = state.authHooks.indexOf(hook)
      if (index >= 0) state.authHooks.splice(index, 1)
    }
  }

  digPlugin(state, {
    digCompletionTimeoutMs: 1000,
    digCompletionGraceMs: 1000
  })

  return state
}

function createBlock () {
  return {
    name: 'stone',
    position: new Vec3(1, 64, 0),
    diggable: true,
    hardness: 1,
    digTime: () => 50
  }
}

function runAuthTick (state, tick) {
  const packet = { tick: BigInt(tick) }
  for (const hook of [...state.authHooks]) hook(packet)
  return packet
}

describe('dig builtin', function () {
  it('resolves dig only after the matching block update arrives', async function () {
    const state = createDigState()
    const block = createBlock()
    const events = []
    let resolved = false

    state.on('diggingCompleted', (eventBlock, pos) => {
      events.push({ eventBlock, pos })
    })

    const digPromise = state.dig(block, false, new Vec3(1, 0, 0)).then(value => {
      resolved = true
      return value
    })
    await new Promise(resolve => setImmediate(resolve))

    const startPacket = runAuthTick(state, 1)
    const predictPacket = runAuthTick(state, 2)

    assert.strictEqual(resolved, false)
    assert.strictEqual(state.lookCalls.length, 1)
    assert.strictEqual(state.lookCalls[0].force, false)
    assert.deepStrictEqual(state.lookCalls[0].pos, new Vec3(2, 64.5, 0.5))
    assert.deepStrictEqual(startPacket.block_action.map(action => action.action), ['start_break'])
    assert.strictEqual(startPacket.block_action[0].face, 5)
    assert.deepStrictEqual(predictPacket.block_action.map(action => action.action), ['continue_break', 'predict_break'])

    state.client.emit('update_block', {
      position: { x: 1, y: 64, z: 0 }
    })

    const result = await digPromise
    assert.strictEqual(result, block)
    assert.strictEqual(resolved, true)
    assert.strictEqual(events.length, 1)
    assert.strictEqual(events[0].eventBlock, block)
    assert.deepStrictEqual(events[0].pos, block.position)
    assert.strictEqual(state.authHooks.length, 0)
  })

  it('supports Mineflayer dig helpers and stopDigging aborts the active promise', async function () {
    const state = createDigState()
    const block = createBlock()
    const aborted = []

    state.on('diggingAborted', (eventBlock, pos, error) => {
      aborted.push({ eventBlock, pos, error })
    })

    assert.strictEqual(state.canDigBlock(block), true)
    assert.strictEqual(state.digTime(block), 50)

    const digPromise = state.dig(block, 'ignore')
    await new Promise(resolve => setImmediate(resolve))
    runAuthTick(state, 1)
    state.stopDigging()

    await assert.rejects(digPromise, /Digging aborted/)
    assert.strictEqual(state.lookCalls.length, 0)
    assert.strictEqual(aborted.length, 1)
    assert.strictEqual(aborted[0].eventBlock, block)
    assert.deepStrictEqual(aborted[0].pos, block.position)
    assert.strictEqual(state.authHooks.length, 0)
  })
})
