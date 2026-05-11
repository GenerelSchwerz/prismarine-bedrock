const { Vec3 } = require('vec3')
const { numberOrZero } = require('./input-controls')
const { logAction } = require('../../utils')

function deltaDeg (y1, y2) {
  let d = (y1 - y2) % 360
  if (d < -180) d += 360
  else if (d > 180) d -= 360
  return d
}

function createMovementPacketSender (botState, C) {
  const client = botState.client

  let lastSentYaw = null
  let lastSentPitch = null
  let lookResolve = null
  let lookPromise = null

  function resetRotation () {
    lastSentYaw = null
    lastSentPitch = null
  }

  function interpolateRotation (dt) {
    if (!botState.self) return

    if (lastSentYaw === null) {
      lastSentYaw = botState.self.yaw
      lastSentPitch = botState.self.pitch
      return
    }

    const dYaw = deltaDeg(botState.self.yaw, lastSentYaw)
    const dPitch = botState.self.pitch - lastSentPitch
    const maxYaw = 180 * dt
    const maxPitch = 180 * dt

    lastSentYaw += Math.max(-maxYaw, Math.min(maxYaw, dYaw))
    lastSentPitch += Math.max(-maxPitch, Math.min(maxPitch, dPitch))

    if (
      Math.abs(deltaDeg(botState.self.yaw, lastSentYaw)) < 0.001 &&
      Math.abs(botState.self.pitch - lastSentPitch) < 0.001 &&
      lookResolve
    ) {
      lookResolve()
      lookResolve = null
      lookPromise = null
    }
  }

  function sendPlayerAuthInput (dt) {
    const self = botState.self
    if (!self) return

    interpolateRotation(dt)

    const moveVector = self.moveVector || { x: 0, z: 0 }
    const analogueMoveVector = self.analogueMoveVector || moveVector
    const rawMoveVector = self.rawMoveVector || moveVector

    const packet = {
      pitch: numberOrZero(lastSentPitch),
      yaw: numberOrZero(lastSentYaw),
      position: {
        x: numberOrZero(self.position.x),
        y: numberOrZero(self.position.y) + C.EYE_HEIGHT,
        z: numberOrZero(self.position.z),
      },
      move_vector: {
        x: numberOrZero(moveVector.x),
        z: numberOrZero(moveVector.z),
      },
      head_yaw: numberOrZero(self.headYaw !== undefined ? self.headYaw : self.yaw),
      input_data: self.inputData || 0n,
      input_mode: 1,
      play_mode: 0,
      interaction_model: 1,
      interact_rotation: { x: 0, z: 0 },
      tick: self.tick || 0n,
      delta: self.delta || { x: 0, y: 0, z: 0 },
      analogue_move_vector: {
        x: numberOrZero(analogueMoveVector.x),
        z: numberOrZero(analogueMoveVector.z),
      },
      camera_orientation: { x: 0, y: 0, z: 0 },
      raw_move_vector: {
        x: numberOrZero(rawMoveVector.x),
        z: numberOrZero(rawMoveVector.z),
      },
    }

    botState._applyPlayerAuthInputHooks?.(packet, { botState, dt, self })
    if (packet.item_stack_request) {
      logAction('[auth_input]', 'send item_stack_request', {
        inputData: packet.input_data?._value ?? packet.input_data,
        tick: packet.tick,
        requestId: packet.item_stack_request.request_id,
        actions: packet.item_stack_request.actions?.map(action => action.type_id),
      })
    }
    client.queue('player_auth_input', packet)
  }

  function sendMovePlayer (mode, dt) {
    const self = botState.self
    if (!self) return

    interpolateRotation(dt)

    client.queue('move_player', {
      runtime_id: client.entityId || 0n,
      position: {
        x: numberOrZero(self.position.x),
        y: numberOrZero(self.position.y) + C.EYE_HEIGHT,
        z: numberOrZero(self.position.z),
      },
      pitch: numberOrZero(lastSentPitch),
      yaw: numberOrZero(lastSentYaw),
      head_yaw: numberOrZero(self.headYaw !== undefined ? self.headYaw : self.yaw),
      mode,
      on_ground: !!self.onGround,
      ridden_runtime_id: 0,
      teleport: undefined,
      tick: self.tick || 0n,
    })
  }

  function look (yaw, pitch, force = false) {
    if (!botState.self) return

    botState.self.yaw = yaw
    botState.self.pitch = pitch
    botState.self.headYaw = yaw

    if (force) {
      lastSentYaw = yaw
      lastSentPitch = pitch
    }
  }

  function lookAt (point, force = false) {
    if (!botState.self) return

    const eye = botState.self.position.offset(0, C.EYE_HEIGHT, 0)
    const d = point.minus ? point.minus(eye) : new Vec3(point.x - eye.x, point.y - eye.y, point.z - eye.z)
    const yaw = (Math.atan2(-d.x, d.z) * 180) / Math.PI
    const pitch = (-Math.atan2(d.y, Math.sqrt(d.x * d.x + d.z * d.z)) * 180) / Math.PI

    look(yaw, pitch, force)
  }

  function waitForLookComplete () {
    if (!botState.self) return Promise.resolve()

    if (
      lastSentYaw !== null &&
      Math.abs(deltaDeg(botState.self.yaw, lastSentYaw)) < 0.001 &&
      Math.abs(botState.self.pitch - lastSentPitch) < 0.001
    ) {
      return Promise.resolve()
    }

    if (!lookPromise) {
      lookPromise = new Promise((resolve) => {
        lookResolve = resolve
      })
    }

    return lookPromise
  }

  return {
    sendPlayerAuthInput,
    sendMovePlayer,
    resetRotation,
    look,
    lookAt,
    waitForLookComplete,
  }
}

module.exports = { createMovementPacketSender }
