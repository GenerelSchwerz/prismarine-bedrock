const { Vec3 } = require('vec3');
const { performance } = require('perf_hooks');
const { sameRuntimeId, sleep } = require('../../utils');
const { getConstants } = require('../physics-constants');
const { createBedrockWorldAdapter } = require('./bedrock-world-adapter');
const { installBedrockMovementStateHandlers } = require('./nxg-physics-utils-adapter');
const { createBedrockPhysicsEngine } = require('./bedrock-physics-engine');
const { installControls, updateEyeDeltaAndTick } = require('./input-controls');
const { createMovementPacketSender } = require('./movement-packets');

module.exports = function bedrockPhysicsPlugin(botState, options = {}) {
  const client = botState.client;
  const C = getConstants(botState.version || '26.10');
  const controls = installControls(botState, C);
  installBedrockMovementStateHandlers(botState);
  const world = createBedrockWorldAdapter(botState);
  const physics = createBedrockPhysicsEngine(options);
  const movementPackets = createMovementPacketSender(botState, C);

  let tickInterval = null;
  let movementMode = 'server';
  let tickInProgress = false;
  let startingTick = false;
  const tickMs = 50;
  const timerLeadMs = options.timerLeadMs ?? 16;
  const maxCatchUpTicks = options.maxCatchUpTicks ?? 4;

  const chunkWaitRadius = options.chunkWaitRadius ?? 1;
  const chunkWaitTimeoutMs = options.chunkWaitTimeoutMs ?? 10000;
  const chunkWaitVerticalSectionRadius = options.chunkWaitVerticalSectionRadius ?? 1;

  async function tickSimulation() {
    const self = botState.self;
    if (!self) return;

    controls.evaluateControls();

    physics.simulateSelf(botState, controls.getControlStateSnapshot(), world, C);

    controls.setFlag('horizontal_collision', !!self.horizontalCollision);
    controls.setFlag('vertical_collision', !!self.verticalCollision);

    updateEyeDeltaAndTick(self, C);
  }

  async function sendMovementTick() {
    await tickSimulation();

    if (movementMode !== 'client') movementPackets.sendPlayerAuthInput(tickMs / 1000);
    else movementPackets.sendMovePlayer(0, tickMs / 1000);
  }

  function yieldImmediate() {
    return new Promise(resolve => setImmediate(resolve));
  }

  async function waitUntil(deadline) {
    while (tickInterval) {
      const remaining = deadline - performance.now();
      if (remaining <= 0) return;
      if (remaining > 2) await sleep(Math.max(0, remaining - 2));
      else await yieldImmediate();
    }
  }

  async function waitForChunksAroundSelf() {
    if (!botState.self?.position) return false;
    if (!botState.waitForChunksToLoad) return true;
    const radiusBlocks = chunkWaitRadius * 16;

    if (
      typeof botState.areChunksLoadedAround === 'function' &&
      botState.areChunksLoadedAround(
        radiusBlocks,
        botState.self.position,
        chunkWaitVerticalSectionRadius
      )
    ) {
      return true;
    }

    try {
      await botState.waitForChunksToLoad(
        radiusBlocks,
        botState.self.position,
        chunkWaitTimeoutMs,
        chunkWaitVerticalSectionRadius
      );
      return true;
    } catch (err) {
      console.warn('[physics] waiting for nearby chunks before physics:', err?.message || err);
      return false;
    }
  }

  async function startTick() {
    if (tickInterval || startingTick) return;
    startingTick = true;

    try {
      const ready = await waitForChunksAroundSelf();
      if (!ready) {
        tickInterval = setTimeout(() => {
          tickInterval = null;
          void startTick();
        }, 1000);
        return;
      }
      if (tickInterval) return;

      let nextTickAt = performance.now() + tickMs;
      if (botState.self) botState.self._prevEye = null;

      async function runTickLoop() {
        if (!tickInterval) return;
        if (tickInProgress) {
          tickInterval = setTimeout(runTickLoop, 1);
          return;
        }
        tickInProgress = true;

        try {
          await waitUntil(nextTickAt);
          if (!tickInterval) return;

          const workStart = performance.now();
          await sendMovementTick();
          let workEnd = performance.now();
          const workOverranTick = workEnd - workStart >= tickMs;

          nextTickAt += tickMs;

          if (workOverranTick) {
            let catchUpTicks = 0;
            while (tickInterval && nextTickAt <= workEnd && catchUpTicks < maxCatchUpTicks) {
              await sendMovementTick();
              nextTickAt += tickMs;
              catchUpTicks++;
              workEnd = performance.now();
            }
          } else if (nextTickAt <= workEnd) {
            nextTickAt = workEnd + tickMs;
          }
        } catch (err) {
          console.warn('[physics] tick error:', err?.stack || err);
        } finally {
          tickInProgress = false;
          if (tickInterval) {
            if (nextTickAt <= performance.now() - tickMs) {
              nextTickAt = performance.now() + tickMs;
            }

            tickInterval = setTimeout(
              runTickLoop,
              Math.max(0, nextTickAt - performance.now() - timerLeadMs)
            );
          }
        }
      }

      tickInterval = setTimeout(runTickLoop, Math.max(0, tickMs - timerLeadMs));
    } finally {
      startingTick = false;
    }
  }

  function stopTick() {
    if (tickInterval) clearTimeout(tickInterval);
    tickInterval = null;
    tickInProgress = false;
    startingTick = false;
  }

  botState.applyMovement = tickSimulation;
  botState.sendPlayerAuthInputNow = () => movementPackets.sendPlayerAuthInput(0.05);

  botState.setPosition = (x, y, z) => {
    if (botState.self) botState.self.position.set(x, y, z);
  };

  botState.look = movementPackets.look;
  botState.lookAt = movementPackets.lookAt;
  botState.waitForLookComplete = movementPackets.waitForLookComplete;

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

    movementPackets.resetRotation();
    botState.self._prevEye = null;
  });

  client.on('set_spawn_position', () => {
    botState.clearControlStates();
    movementPackets.resetRotation();
    if (botState.self) botState.self._prevEye = null;
    void startTick();
  });

  client.on('move_player', (pkt) => {
    if (!botState.self || !sameRuntimeId(pkt.runtime_id, client.entityId)) return;

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

    movementPackets.resetRotation();
    botState.self._prevEye = null;
  });

  client.on('respawn', (pkt) => {
    if (!botState.self || !(pkt.state === 0 || pkt.state === 1)) return;

    stopTick();

    botState.self.position.set(
      pkt.position.x,
      pkt.position.y - C.EYE_HEIGHT,
      pkt.position.z
    );

    botState.self.velocity.set(0, 0, 0);
    botState.self.unvalidatedPosition = botState.self.position.clone();
    botState.self._prevEye = null;

    void startTick();
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
    if (botState.self && sameRuntimeId(pkt.runtime_entity_id, client.entityId)) {
      botState.self.velocity.set(pkt.velocity.x, pkt.velocity.y, pkt.velocity.z);
    }
  });

  client.on('set_movement_authority', (pkt) => {
    movementMode = pkt.movement_authority === 0 ? 'client' : 'server';
  });

  client.on('close', stopTick);

  if (botState.self && botState.self.position) void startTick();
};
