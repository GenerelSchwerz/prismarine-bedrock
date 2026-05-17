'use strict'

const assert = require('assert')
const { EventEmitter } = require('events')
const { Vec3 } = require('vec3')
const physicsPlugin = require('../../src/builtins/physics')

function waitForEvent (emitter, name, listener, trigger, timeoutMs = 500) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for ${name}`))
    }, timeoutMs)

    function cleanup () {
      clearTimeout(timeout)
      emitter.removeListener(name, onEvent)
    }

    function onEvent (value) {
      listener(value)
      cleanup()
      resolve(value)
    }

    emitter.on(name, onEvent)
    trigger()
  })
}

describe('physics tick events', function () {
  it('emits physicsTickPre before simulation/send and physicsTick after send', async function () {
    const client = new EventEmitter()
    client.entityId = 1n
    client.queued = []
    client.queue = (name, params) => {
      client.queued.push({ name, params })
    }

    const botState = new EventEmitter()
    botState.options = { physicsEnabled: true, worldDecodeEnabled: true }
    botState.version = '1.26.10'
    botState.client = client
    botState.self = {
      position: new Vec3(0, 66, 0),
      velocity: new Vec3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      headYaw: 0,
      onGround: true
    }
    botState.world = {
      sync: {
        getBlock (pos) {
          return {
            position: pos,
            type: 0,
            name: 'air',
            boundingBox: 'empty',
            shapes: []
          }
        }
      }
    }

    physicsPlugin(botState)

    const events = []
    botState.on('physicsTickPre', (info) => {
      events.push({ name: 'physicsTickPre', queued: client.queued.length, info })
      botState.setControlState('forward', true)
    })

    const postInfo = await waitForEvent(botState, 'physicsTick', (info) => {
      events.push({ name: 'physicsTick', queued: client.queued.length, info })
    }, () => {
      client.emit('move_player', {
        runtime_id: 1n,
        position: { x: 0, y: 66, z: 0 },
        pitch: 0,
        yaw: 0,
        head_yaw: 0,
        on_ground: true,
        mode: 1
      })
    })

    client.emit('close')

    assert.strictEqual(events.length, 2)
    assert.strictEqual(events[0].name, 'physicsTickPre')
    assert.strictEqual(events[0].queued, 0)
    assert.strictEqual(events[0].info.phase, 'pre')
    assert.strictEqual(events[1].name, 'physicsTick')
    assert.strictEqual(events[1].queued, 1)
    assert.strictEqual(postInfo.phase, 'post')
    assert.strictEqual(postInfo.packet, 'player_auth_input')
    assert.strictEqual(client.queued[0].name, 'player_auth_input')
    assert.strictEqual(client.queued[0].params.move_vector.z, 1)
  })
})
