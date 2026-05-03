const { Vec3 } = require('vec3');
const { getConstants } = require('../physics-constants');
const { createBedrockWorldAdapter } = require('./bedrock-world-adapter');
const { createNxgPhysicsAdapter, installBedrockMovementStateHandlers } = require('./nxg-physics-utils-adapter');
const { installControls, updateEyeDeltaAndTick, numberOrZero } = require('./input-controls');

function deltaDeg(y1, y2) {
  let d = (y1 - y2) % 360;
  if (d < -180) d += 360;
  else if (d > 180) d -= 360;
  return d;
}

module.exports = function bedrockPhysicsPlugin(botState, options = {}) {
  const client = botState.client;
  const C = getConstants(botState.version || '26.10');
  const controls = installControls(botState, C);
  installBedrockMovementStateHandlers(botState);
  const world = createBedrockWorldAdapter(botState);
  const physics = createNxgPhysicsAdapter(options);

  let lastSentYaw = null;
  let lastSentPitch = null;
  let lookResolve = null;
  let lookPromise = null;
  let tickInterval = null;
  let movementMode = 'server';
  let tickInProgress = false;
  let startingTick = false;

  const chunkWaitRadius = options.chunkWaitRadius ?? 0;
  const chunkWaitTimeoutMs = options.chunkWaitTimeoutMs ?? 10000;

  async function tickSimulation() {
    const self = botState.self;
    if (!self) return;

    controls.evaluateControls();

    physics.simulateSelf(botState, controls.getControlStateSnapshot(), world);

    controls.setFlag('horizontal_collision', !!self.horizontalCollision);
    controls.setFlag('vertical_collision', !!self.verticalCollision);

    updateEyeDeltaAndTick(self, C);
  }

  function interpolateRotation(dt) {
    if (!botState.self) return;

    if (lastSentYaw === null) {
      lastSentYaw = botState.self.yaw;
      lastSentPitch = botState.self.pitch;
      return;
    }

    const dYaw = deltaDeg(botState.self.yaw, lastSentYaw);
    const dPitch = botState.self.pitch - lastSentPitch;
    const maxYaw = 180 * dt;
    const maxPitch = 180 * dt;

    lastSentYaw += Math.max(-maxYaw, Math.min(maxYaw, dYaw));
    lastSentPitch += Math.max(-maxPitch, Math.min(maxPitch, dPitch));

    if (
      Math.abs(deltaDeg(botState.self.yaw, lastSentYaw)) < 0.001 &&
      Math.abs(botState.self.pitch - lastSentPitch) < 0.001
    ) {
      if (lookResolve) {
        lookResolve();
        lookResolve = null;
        lookPromise = null;
      }
    }
  }

  function sendPlayerAuthInput(dt) {
    const self = botState.self;
    if (!self) return;

    interpolateRotation(dt);

    const eyeY = numberOrZero(self.position.y) + C.EYE_HEIGHT;
    const moveVector = self.moveVector || { x: 0, z: 0 };
    const analogueMoveVector = self.analogueMoveVector || moveVector;
    const rawMoveVector = self.rawMoveVector || moveVector;

    client.queue('player_auth_input', {
      pitch: numberOrZero(lastSentPitch),
      yaw: numberOrZero(lastSentYaw),
      position: {
        x: numberOrZero(self.position.x),
        y: eyeY,
        z: numberOrZero(self.position.z)
      },
      move_vector: {
        x: numberOrZero(moveVector.x),
        z: numberOrZero(moveVector.z)
      },
      head_yaw: numberOrZero(self.headYaw !== undefined ? self.headYaw : self.yaw),
      input_data: self.inputData || 0n,
      input_mode: 0,
      play_mode: 0,
      interaction_model: 0,
      interact_rotation: { x: 0, z: 0 },
      tick: self.tick || 0n,
      delta: self.delta || { x: 0, y: 0, z: 0 },
      analogue_move_vector: {
        x: numberOrZero(analogueMoveVector.x),
        z: numberOrZero(analogueMoveVector.z)
      },
      camera_orientation: { x: 0, y: 0, z: 0 },
      raw_move_vector: {
        x: numberOrZero(rawMoveVector.x),
        z: numberOrZero(rawMoveVector.z)
      }
    });
  }

  function sendMovePlayer(mode, dt) {
    const self = botState.self;
    if (!self) return;

    interpolateRotation(dt);

    client.queue('move_player', {
      runtime_id: client.entityId || 0n,
      position: {
        x: numberOrZero(self.position.x),
        y: numberOrZero(self.position.y) + C.EYE_HEIGHT,
        z: numberOrZero(self.position.z)
      },
      pitch: numberOrZero(lastSentPitch),
      yaw: numberOrZero(lastSentYaw),
      head_yaw: numberOrZero(self.headYaw !== undefined ? self.headYaw : self.yaw),
      mode,
      on_ground: !!self.onGround,
      ridden_runtime_id: 0,
      teleport: undefined,
      tick: self.tick || 0n
    });
  }

  async function waitForChunksAroundSelf() {
    if (!botState.self?.position) return false;
    if (!botState.waitForChunksToLoad) return true;

    try {
      await botState.waitForChunksToLoad(
        chunkWaitRadius * 16,
        botState.self.position,
        chunkWaitTimeoutMs
      );
      return true;
    } catch {
      return false;
    }
  }

  async function startTick() {
    if (tickInterval || startingTick) return;
    startingTick = true;

    try {
      const ready = await waitForChunksAroundSelf();
      if (!ready) throw new Error('[physics] nearby chunks did not load before physics start');
      if (tickInterval) return;

      let lastTick = Date.now();
      if (botState.self) botState.self._prevEye = null;

      tickInterval = setInterval(async () => {
        if (tickInProgress) return;
        tickInProgress = true;

        try {
          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          lastTick = now;

          await tickSimulation();

          if (movementMode !== 'client') sendPlayerAuthInput(dt);
          else sendMovePlayer(0, dt);
        } catch (err) {
          console.warn('[physics] tick error:', err?.stack || err);
        } finally {
          tickInProgress = false;
        }
      }, 50);
    } finally {
      startingTick = false;
    }
  }

  function stopTick() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    tickInProgress = false;
    startingTick = false;
  }

  botState.applyMovement = tickSimulation;

  botState.setPosition = (x, y, z) => {
    if (botState.self) botState.self.position.set(x, y, z);
  };

  botState.look = (yaw, pitch, force = false) => {
    if (!botState.self) return;

    botState.self.yaw = yaw;
    botState.self.pitch = pitch;
    botState.self.headYaw = yaw;

    if (force) {
      lastSentYaw = yaw;
      lastSentPitch = pitch;
    }
  };

  botState.lookAt = (point, force = false) => {
    if (!botState.self) return;

    const eye = botState.self.position.offset(0, C.EYE_HEIGHT, 0);
    const d = point.minus ? point.minus(eye) : new Vec3(point.x - eye.x, point.y - eye.y, point.z - eye.z);
    const yaw = (Math.atan2(-d.x, d.z) * 180) / Math.PI;
    const pitch = (-Math.atan2(d.y, Math.sqrt(d.x * d.x + d.z * d.z)) * 180) / Math.PI;

    botState.look(yaw, pitch, force);
  };

  botState.waitForLookComplete = () => {
    if (!botState.self) return Promise.resolve();

    if (
      lastSentYaw !== null &&
      Math.abs(deltaDeg(botState.self.yaw, lastSentYaw)) < 0.001 &&
      Math.abs(botState.self.pitch - lastSentPitch) < 0.001
    ) {
      return Promise.resolve();
    }

    if (!lookPromise) {
      lookPromise = new Promise((resolve) => {
        lookResolve = resolve;
      });
    }

    return lookPromise;
  };

  client.on('start_game', (pkt) => {
    if (!botState.self) return;

    botState.self.position.set(
      pkt.player_position.x,
      pkt.player_position.y - C.EYE_HEIGHT,
      pkt.player_position.z
    );

    botState.self.pitch = pkt.rotation.x;
    botState.self.yaw = pkt.rotation.y;
    botState.self.headYaw = pkt.rotation.y;
    botState.self.velocity.set(0, 0, 0);
    botState.self.unvalidatedPosition = botState.self.position.clone();

    lastSentYaw = null;
    lastSentPitch = null;
    botState.self._prevEye = null;
  });

  client.on('set_spawn_position', () => {
    botState.clearControlStates();
    lastSentYaw = null;
    lastSentPitch = null;
    if (botState.self) botState.self._prevEye = null;
    void startTick();
  });

  client.on('move_player', (pkt) => {
    const rid = typeof pkt.runtime_id === 'bigint' ? pkt.runtime_id : BigInt(pkt.runtime_id);
    if (!botState.self || rid !== client.entityId) return;

    botState.self.position.set(
      pkt.position.x,
      pkt.position.y - C.EYE_HEIGHT,
      pkt.position.z
    );

    botState.self.pitch = pkt.pitch;
    botState.self.yaw = pkt.yaw;
    botState.self.headYaw = pkt.head_yaw;
    botState.self.onGround = !!pkt.on_ground;

    if (pkt.mode === 1 || pkt.mode === 2) {
      botState.self.velocity.set(0, 0, 0);
      botState.self.unvalidatedPosition = botState.self.position.clone();
    }

    lastSentYaw = null;
    lastSentPitch = null;
    botState.self._prevEye = null;
  });

  client.on('respawn', (pkt) => {
    if (!botState.self || !(pkt.state === 0 || pkt.state === 1)) return;

    botState.self.position.set(
      pkt.position.x,
      pkt.position.y - C.EYE_HEIGHT,
      pkt.position.z
    );

    botState.self.velocity.set(0, 0, 0);
    botState.self.unvalidatedPosition = botState.self.position.clone();
    botState.self._prevEye = null;
  });

  client.on('correct_player_move_prediction', (pkt) => {
    if (!botState.self) return;

    botState.self.position.set(
      pkt.position.x,
      pkt.position.y - C.EYE_HEIGHT,
      pkt.position.z
    );

    botState.self.pitch = pkt.rotation.x;
    botState.self.yaw = pkt.rotation.y;
    botState.self.onGround = !!pkt.on_ground;
    botState.self.velocity.set(0, 0, 0);
    botState.self.unvalidatedPosition = botState.self.position.clone();

    controls.setFlag('received_server_data', true);
    botState.self._prevEye = null;
  });

  client.on('motion_prediction_hints', (pkt) => {
    if (!botState.self) return;
    botState.self.uncertainVelocity = new Vec3(pkt.velocity.x, pkt.velocity.y, pkt.velocity.z);
  });

  client.on('set_entity_motion', (pkt) => {
    if (botState.self && pkt.runtime_entity_id === client.entityId) {
      botState.self.velocity.set(pkt.velocity.x, pkt.velocity.y, pkt.velocity.z);
    }
  });

  client.on('set_movement_authority', (pkt) => {
    movementMode = pkt.movement_authority === 0 ? 'client' : 'server';
  });

  client.on('close', stopTick);

  if (botState.self && botState.self.position) void startTick();
};
