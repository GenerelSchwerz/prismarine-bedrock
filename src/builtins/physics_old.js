const Vec3 = require('vec3').Vec3;
const { getConstants } = require('./physics-constants');

// ── Use the selected AABB implementation ──
// Adjust the require path to match your project structure.
const AABB = require('@nxg-org/mineflayer-util-plugin/lib/calcs/aabb').AABB;

// ── Debug helper ──
const DEBUG_ENABLED = process.env.DEBUG_PHYSICS === 'true';

function debug(...args) {
  if (DEBUG_ENABLED) console.log('[physics][debug]', ...args);
}

function n(v) {
  return Number.isFinite(v) ? v : 0;
}

function deltaDeg(y1, y2) {
  let d = (y1 - y2) % 360;
  if (d < -180) d += 360;
  else if (d > 180) d -= 360;
  return d;
}

function blockPos(x, y, z) {
  if (x instanceof Vec3 || (x && x.x !== undefined)) {
    return new Vec3(Math.floor(x.x), Math.floor(x.y), Math.floor(x.z));
  }

  return new Vec3(Math.floor(x), Math.floor(y), Math.floor(z));
}

/**
 * @param {import('../state')} botState
 * @param {object} [options]
 */
const test = (botState, options = {}) => {
  const client = botState.client;
  const C = getConstants(botState.version || '26.10');

  // ── Block access ──


  function isSolid(block) {
    return block && block.boundingBox === 'block';
  }

  async function getBlockAABBs(bx, by, bz) {
    try {
      const block = await botState.getBlock(bx, by, bz);
      if (!block || !isSolid(block)) return [];

      if (block.shapes && block.shapes.length > 0) {
        return block.shapes.map((s) =>
          new AABB(
            bx + (s.x ?? 0),
            by + (s.y ?? 0),
            bz + (s.z ?? 0),
            bx + (s.x ?? 0) + (s.w ?? 1),
            by + (s.y ?? 0) + (s.h ?? 1),
            bz + (s.z ?? 0) + (s.d ?? 1)
          )
        );
      }

      return [new AABB(bx, by, bz, bx + 1, by + 1, bz + 1)];
    } catch {
      return [];
    }
  }

  async function getSolidBlockAABBs(expandedBox) {
    const boxes = [];
    const minX = Math.floor(expandedBox.minX);
    const maxX = Math.ceil(expandedBox.maxX);
    const minY = Math.floor(expandedBox.minY);
    const maxY = Math.ceil(expandedBox.maxY);
    const minZ = Math.floor(expandedBox.minZ);
    const maxZ = Math.ceil(expandedBox.maxZ);

    for (let bx = minX; bx < maxX; bx++) {
      for (let by = minY; by < maxY; by++) {
        for (let bz = minZ; bz < maxZ; bz++) {
          const blockBoxes = await getBlockAABBs(bx, by, bz);
          for (const bb of blockBoxes) boxes.push(bb);
        }
      }
    }

    return boxes;
  }

  function playerAABB(pos) {
    const hw = C.HALF_WIDTH;
    return new AABB(
      pos.x - hw,
      pos.y,
      pos.z - hw,
      pos.x + hw,
      pos.y + C.PLAYER_HEIGHT,
      pos.z + hw
    );
  }

  // ── Collision resolution using AABB methods ──
  function resolveAxis(axis, playerBox, colliders, maxDist) {
    let remaining = maxDist;
    if (Math.abs(remaining) < C.SURFACE_EPSILON) return 0;

    for (const col of colliders) {
      if (Math.abs(remaining) < C.SURFACE_EPSILON) return 0;

      // Stationary collider calls computeOffset*.
      // Moving/player AABB is the "other" box.
      if (axis === 'y') remaining = col.computeOffsetY(playerBox, remaining);
      else if (axis === 'x') remaining = col.computeOffsetX(playerBox, remaining);
      else remaining = col.computeOffsetZ(playerBox, remaining);
    }

    if (maxDist > 0 && remaining < 0) remaining = 0;
    if (maxDist < 0 && remaining > 0) remaining = 0;

    return remaining;
  }

  // ── Control state ──
  const controlState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    sneak: false
  };

  botState.controlState = {};

  for (const k of Object.keys(controlState)) {
    Object.defineProperty(botState.controlState, k, {
      get() {
        return controlState[k];
      },
      set(v) {
        botState.setControlState(k, v);
      }
    });
  }

  botState.setControlState = (name, val) => {
    if (!(name in controlState)) throw Error('Invalid control ' + name);
    if (typeof val !== 'boolean') throw Error('Must be boolean');
    controlState[name] = val;
  };

  botState.getControlState = (name) => controlState[name];

  botState.clearControlStates = () => {
    for (const k of Object.keys(controlState)) controlState[k] = false;
  };

  // ── Input data flags ──
  const F = {
    jumping: C.BIT_JUMPING,
    auto_jumping_in_water: C.BIT_AUTO_JUMPING_IN_WATER,
    sneaking: C.BIT_SNEAKING,
    sprinting: C.BIT_SPRINTING,
    received_server_data: C.BIT_RECEIVED_SERVER_DATA,
    horizontal_collision: C.BIT_HORIZONTAL_COLLISION,
    vertical_collision: C.BIT_VERTICAL_COLLISION,
    start_using_item: C.BIT_START_USING_ITEM,
    camera_relative_movement_enabled: C.BIT_CAMERA_RELATIVE_MOVEMENT,
    block_action: C.BIT_BLOCK_ACTION
  };

  function setFlag(name, val) {
    if (!botState.self) return;

    const bit = F[name];
    if (bit === undefined) return;

    let inputData = botState.self.inputData ?? 0n;
    const mask = 1n << BigInt(bit);

    inputData = val ? inputData | mask : inputData & ~mask;
    botState.self.inputData = inputData;
  }

  function computeMoveVector() {
    if (!botState.self) return { x: 0, z: 0 };

    const { forward, back, left, right } = controlState;
    let bx = 0;
    let bz = 0;

    const yawRad = ((botState.self.yaw || 0) * Math.PI) / 180;
    const sinYaw = Math.sin(yawRad);
    const cosYaw = Math.cos(yawRad);

    if (forward) {
      bx -= sinYaw;
      bz += cosYaw;
    }

    if (back) {
      bx += sinYaw;
      bz -= cosYaw;
    }

    if (left) {
      bx += cosYaw;
      bz += sinYaw;
    }

    if (right) {
      bx -= cosYaw;
      bz += sinYaw;
    }

    const len = Math.sqrt(bx * bx + bz * bz);

    if (len > 0) {
      bx /= len;
      bz /= len;
    }

    return { x: bx, z: bz };
  }

  function evaluateControls() {
    if (!botState.self) return;

    for (const f of [
      'jumping',
      'sprinting',
      'sneaking',
      'camera_relative_movement_enabled',
      'block_action'
    ]) {
      setFlag(f, false);
    }

    if (controlState.jump) setFlag('jumping', true);
    if (controlState.sprint) setFlag('sprinting', true);
    if (controlState.sneak) setFlag('sneaking', true);

    const mv = computeMoveVector();

    botState.self.moveVector = mv;
    botState.self.rawMoveVector = mv;
    botState.self.analogueMoveVector = mv;
  }

  // ── Prediction helpers ──
  function jumpVelocity(velocity, onGround, jumping, sprinting, yaw) {
    const vel = velocity.clone();

    if (onGround && jumping) {
      vel.y = Math.max(C.JUMP_VELOCITY, vel.y);

      if (sprinting) {
        const yawRad = ((yaw || 0) * Math.PI) / 180;
        vel.x -= Math.sin(yawRad) * C.SPRINT_JUMP_BOOST;
        vel.z += Math.cos(yawRad) * C.SPRINT_JUMP_BOOST;
      }
    }

    return vel;
  }

  function applyInputAcceleration(velocity, moveVector, onGround, sprinting, inputScale) {
    const mv = moveVector || { x: 0, z: 0 };
    const mvScaled = { x: mv.x * inputScale, z: mv.z * inputScale };

    const accel = onGround
      ? C.MAX_SPEED * (C.GROUND_ACCEL_FACTOR / (C.DEFAULT_SLIPPERINESS ** 3))
      : (sprinting ? C.AIR_ACCEL_SPRINT : C.AIR_ACCEL_WALK) * C.MAX_SPEED;

    const vel = velocity.clone();
    vel.x += mvScaled.x * accel;
    vel.z += mvScaled.z * accel;

    return vel;
  }

  function applyClimbingSpeed(velocity, onClimbable) {
    if (onClimbable) {
      const maxClimb = -C.CLIMB_SPEED;
      if (velocity.y < maxClimb) velocity.y = maxClimb;
    }

    return velocity;
  }

  function applyGravity(velocity, onClimbable, inWater, inLava) {
    const v = velocity.clone();

    if (!onClimbable && !inWater && !inLava) {
      v.y -= C.GRAVITY;
    }

    v.y *= C.VELOCITY_Y_DECAY;

    return v;
  }

  function applyFriction(velocity, onGround) {
    const v = velocity.clone();

    if (onGround) {
      v.x *= C.GROUND_FRICTION_XZ;
      v.z *= C.GROUND_FRICTION_XZ;
    } else {
      v.x *= C.AIR_FRICTION_XZ;
      v.z *= C.AIR_FRICTION_XZ;
    }

    return v;
  }

  // ── The full movement simulation, one tick ──
  async function tickSimulation() {
    const self = botState.self;
    if (!self) return;

    evaluateControls();

    const footBlock = await botState.getBlock(self.position.x, self.position.y, self.position.z);
    const belowBlock = await botState.getBlock(self.position.x, self.position.y - 0.5, self.position.z);

    const footName = footBlock ? footBlock.name : '';
    const belowName = belowBlock ? belowBlock.name : '';

    self.touchingWater = footName.includes('water');
    self.inLava = footName.includes('lava');
    self.onClimbable =
      /ladder|vine|scaffolding|weeping_vines/.test(footName) ||
      /ladder|vine|scaffolding|weeping_vines/.test(belowName);
    self.gliding = false;

    const sprinting = controlState.sprint;
    const jumping = controlState.jump;
    const sneaking =
      controlState.sneak ||
      ((self.inputData & (1n << BigInt(C.BIT_SNEAKING))) !== 0n);

    let inputScale = 1;

    if (
      (sneaking || (self.ticksSinceCrawling ?? 0) > 0) &&
      !self.gliding &&
      !self.inLava &&
      !self.touchingWater
    ) {
      inputScale = C.SNEAK_INPUT_SCALE;
    }

    if (
      (self.inputData & (1n << BigInt(C.BIT_START_USING_ITEM))) !== 0n &&
      !self.itemUseTracker?.isUsingSpear?.()
    ) {
      inputScale *= C.USING_ITEM_SCALE;
    }

    const candidateVelocities = [
      { type: 'NORMAL', velocity: self.velocity.clone() }
    ];

    if (self.uncertainVelocity) {
      candidateVelocities.push({
        type: 'VELOCITY',
        velocity: self.uncertainVelocity.clone()
      });
    }

    const oldPos = self.position.clone();
    const oldBox = playerAABB(oldPos);

    const maxMovement = Math.max(
      Math.abs(self.velocity.x),
      Math.abs(self.velocity.y),
      Math.abs(self.velocity.z),
      C.MAX_SPEED * 2
    );

    const sweepBox = oldBox.clone().expand(
      maxMovement + C.SURFACE_EPSILON,
      maxMovement + C.SURFACE_EPSILON,
      maxMovement + C.SURFACE_EPSILON
    );

    const allColliders = await getSolidBlockAABBs(sweepBox);
    const unvalidatedPos = self.unvalidatedPosition || oldPos;

    debug('tick candidate velocities', candidateVelocities.length);

    let bestCandidate = null;
    let bestOffset = Infinity;

    for (const cand of candidateVelocities) {
      let vel = cand.velocity.clone();
      const yaw = self.yaw || 0;

      vel = jumpVelocity(vel, self.onGround, jumping, sprinting, yaw);
      vel = applyInputAcceleration(vel, self.moveVector, self.onGround, sprinting, inputScale);
      vel = applyClimbingSpeed(vel, self.onClimbable);
      vel = applyGravity(vel, self.onClimbable, self.touchingWater, self.inLava);
      vel = applyFriction(vel, self.onGround);

      const tempPos = oldPos.clone();
      const tempBox = playerAABB(tempPos);

      const newY = resolveAxis('y', tempBox, allColliders, vel.y);

      if (Math.abs(newY) < Math.abs(vel.y) - C.SURFACE_EPSILON) {
        tempBox.translate(0, newY, 0);
        vel.y = 0;
      } else {
        tempBox.translate(0, newY, 0);
      }

      tempPos.y = oldPos.y + newY;

      const boxAY = playerAABB(tempPos);
      const newX = resolveAxis('x', boxAY, allColliders, vel.x);

      if (Math.abs(newX) < Math.abs(vel.x) - C.SURFACE_EPSILON) {
        boxAY.translate(newX, 0, 0);
        vel.x = 0;
      } else {
        boxAY.translate(newX, 0, 0);
      }

      tempPos.x = oldPos.x + newX;

      const boxAX = playerAABB(tempPos);
      const newZ = resolveAxis('z', boxAX, allColliders, vel.z);

      if (Math.abs(newZ) < Math.abs(vel.z) - C.SURFACE_EPSILON) {
        vel.z = 0;
      }

      tempPos.z = oldPos.z + newZ;

      const offset = tempPos.distanceTo(unvalidatedPos);
      const horizontalCollision =
        Math.abs(newX) < Math.abs(cand.velocity.x) - C.SURFACE_EPSILON ||
        Math.abs(newZ) < Math.abs(cand.velocity.z) - C.SURFACE_EPSILON;
      const verticalCollision =
        Math.abs(newY) < Math.abs(cand.velocity.y) - C.SURFACE_EPSILON;

      let penalty = 0;

      if (
        horizontalCollision !==
        ((self.inputData & (1n << BigInt(C.BIT_HORIZONTAL_COLLISION))) !== 0n)
      ) {
        penalty += 1e-6;
      }

      if (
        verticalCollision !==
        ((self.inputData & (1n << BigInt(C.BIT_VERTICAL_COLLISION))) !== 0n)
      ) {
        penalty += 1e-6;
      }

      const totalDistance = offset + penalty;

      debug(
        `Candidate ${cand.type} offset=${offset.toFixed(5)} ` +
        `penalty=${penalty.toFixed(8)} total=${totalDistance.toFixed(5)}`
      );

      if (totalDistance < bestOffset) {
        bestOffset = totalDistance;
        bestCandidate = {
          candidate: cand,
          vel,
          pos: tempPos,
          horizontalCollision,
          verticalCollision,
          newX,
          newY,
          newZ
        };
      }
    }

    if (!bestCandidate) {
      debug('No best candidate found, keeping current');
      return;
    }

    self.position = bestCandidate.pos;
    self.velocity = bestCandidate.vel;
    self.horizontalCollision = bestCandidate.horizontalCollision;
    self.verticalCollision = bestCandidate.verticalCollision;

    setFlag('horizontal_collision', self.horizontalCollision);
    setFlag('vertical_collision', self.verticalCollision);

    self.onGround =
      self.velocity.y === 0 &&
      bestCandidate.verticalCollision &&
      bestCandidate.candidate.velocity.y < 0;

    if (options.debug) {
      const actualDelta = unvalidatedPos ? self.position.distanceTo(unvalidatedPos) : 0;

      if (bestOffset > C.SURFACE_EPSILON * 10) {
        const claimedHorizontal =
          (self.inputData & (1n << BigInt(C.BIT_HORIZONTAL_COLLISION))) !== 0n;
        const claimedVertical =
          (self.inputData & (1n << BigInt(C.BIT_VERTICAL_COLLISION))) !== 0n;

        if (
          claimedVertical !== self.verticalCollision ||
          claimedHorizontal !== self.horizontalCollision
        ) {
          console.log('[physics][check] Phase: offset=' + bestOffset.toFixed(5));
        }

        if (bestCandidate.candidate.type === 'VELOCITY') {
          console.log('[physics][check] Velocity: offset=' + bestOffset.toFixed(5));
        }

        if (
          self.unvalidatedTickEnd &&
          self.velocity.distanceTo(self.unvalidatedTickEnd) < C.SURFACE_EPSILON
        ) {
          console.log('[physics][check] Collisions: offset=' + bestOffset.toFixed(5));
        }

        const actualDir = actualDelta > 0
          ? self.position.clone().subtract(unvalidatedPos).normalize()
          : new Vec3(0, 0, 0);

        const predictedDir = self.velocity.length() > 0
          ? self.velocity.clone().normalize()
          : new Vec3(0, 0, 0);

        if (
          Math.abs(actualDir.x - predictedDir.x) > 0.01 ||
          Math.abs(actualDir.z - predictedDir.z) > 0.01
        ) {
          console.log('[physics][check] Strafe: offset=' + bestOffset.toFixed(5));
        }

        const actualSpeed = actualDelta;
        const predictedSpeed = self.velocity.length();

        if (actualSpeed > predictedSpeed) {
          console.log('[physics][check] Speed: offset=' + bestOffset.toFixed(5));
        }

        if (Math.abs(self.position.y - unvalidatedPos.y) > C.SURFACE_EPSILON * 10) {
          console.log('[physics][check] Flight: offset=' + bestOffset.toFixed(5));
        }
      }
    }

    const prevEye = self._prevEye;
    const eyeNow = {
      x: self.position.x,
      y: self.position.y + C.EYE_HEIGHT,
      z: self.position.z
    };

    self.delta = prevEye
      ? {
          x: n(eyeNow.x - prevEye.x),
          y: n(eyeNow.y - prevEye.y),
          z: n(eyeNow.z - prevEye.z)
        }
      : { x: 0, y: 0, z: 0 };

    self._prevEye = eyeNow;
    self.unvalidatedPosition = self.position.clone();
    self.uncertainVelocity = null;
    self.tick = (self.tick || 0n) + 1n;
  }

  // ── Rotation interpolation ──
  let lastSentYaw = null;
  let lastSentPitch = null;
  let lookResolve = null;
  let lookPromise = null;

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
    if (!botState.self) return;

    interpolateRotation(dt);

    const self = botState.self;
    const eyeY = n(self.position.y) + C.EYE_HEIGHT;

    const packet = {
      pitch: n(lastSentPitch),
      yaw: n(lastSentYaw),
      position: { x: n(self.position.x), y: eyeY, z: n(self.position.z) },
      move_vector: {
        x: n((self.moveVector || {}).x),
        z: n((self.moveVector || {}).z)
      },
      head_yaw: n(self.headYaw !== undefined ? self.headYaw : self.yaw),
      input_data: self.inputData || 0n,
      input_mode: 0,
      play_mode: 0,
      interaction_model: 0,
      interact_rotation: { x: 0, z: 0 },
      tick: self.tick || 0n,
      delta: self.delta || { x: 0, y: 0, z: 0 },
      analogue_move_vector: {
        x: n((self.analogueMoveVector || {}).x),
        z: n((self.analogueMoveVector || {}).z)
      },
      camera_orientation: { x: 0, y: 0, z: 0 },
      raw_move_vector: {
        x: n((self.rawMoveVector || {}).x),
        z: n((self.rawMoveVector || {}).z)
      }
    };

    self.unvalidatedPosition = self.position.clone();
    client.queue('player_auth_input', packet);
  }

  function sendMovePlayer(mode, dt) {
    if (!botState.self) return;

    interpolateRotation(dt);

    const self = botState.self;
    const eyeY = n(self.position.y) + C.EYE_HEIGHT;

    const packet = {
      runtime_id: client.entityId || 0n,
      position: { x: n(self.position.x), y: eyeY, z: n(self.position.z) },
      pitch: n(lastSentPitch),
      yaw: n(lastSentYaw),
      head_yaw: n(self.headYaw !== undefined ? self.headYaw : self.yaw),
      mode,
      on_ground: self.onGround || false,
      ridden_runtime_id: 0,
      teleport: undefined,
      tick: self.tick || 0n
    };

    self.unvalidatedPosition = self.position.clone();
    client.queue('move_player', packet);
  }

  // ── Tick loop ──
  let tickInterval = null;
  let movementMode = 'server';
  let tickInProgress = false;
  let startingTick = false;

  const CHUNK_WAIT_RADIUS = options.chunkWaitRadius ?? 0;
  const CHUNK_WAIT_TIMEOUT_MS = options.chunkWaitTimeoutMs ?? 10000;

  async function waitForChunksAroundSelf() {
    if (!botState.self?.position) return false;

    const pos = botState.self.position;

    if (botState.waitForChunksToLoad) {
      try {
        await botState.waitForChunksToLoad(CHUNK_WAIT_RADIUS * 16, pos, CHUNK_WAIT_TIMEOUT_MS);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  async function startTick() {
    if (tickInterval || startingTick) return;

    startingTick = true;

    try {
      const ready = await waitForChunksAroundSelf();

      if (!ready) {
        console.warn('[physics] starting tick loop before all nearby chunks loaded');
        return;
      }

      if (tickInterval) return;

      let lastTick = Date.now();
      botState.self._prevEye = null;

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
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }

    tickInProgress = false;
    startingTick = false;
  }

  // ── Public API ──
  botState.applyMovement = tickSimulation;
  botState.setFlag = setFlag;

  botState.setPosition = (x, y, z) => {
    if (botState.self) botState.self.position.set(x, y, z);
  };

  botState.look = (yaw, pitch, force) => {
    if (!botState.self) return;

    botState.self.yaw = yaw;
    botState.self.pitch = pitch;
    botState.self.headYaw = yaw;

    if (force) {
      lastSentYaw = yaw;
      lastSentPitch = pitch;
    }
  };

  botState.lookAt = (point, force) => {
    if (!botState.self) return;

    const eye = botState.self.position.offset(0, C.EYE_HEIGHT, 0);
    const d = point.minus(eye);
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
      lookPromise = new Promise((r) => {
        lookResolve = r;
      });
    }

    return lookPromise;
  };

  // ── Packet listeners ──
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

    if (botState.self) {
      lastSentYaw = null;
      lastSentPitch = null;
    }

    void startTick();
  });

  client.on('move_player', (pkt) => {
    const rid = typeof pkt.runtime_id === 'bigint'
      ? pkt.runtime_id
      : BigInt(pkt.runtime_id);

    if (!botState.self || rid !== client.entityId) return;

    botState.self.position.set(
      pkt.position.x,
      pkt.position.y - C.EYE_HEIGHT,
      pkt.position.z
    );

    botState.self.pitch = pkt.pitch;
    botState.self.yaw = pkt.yaw;
    botState.self.headYaw = pkt.head_yaw;
    botState.self.onGround = pkt.on_ground;

    if (pkt.mode === 1 || pkt.mode === 2) {
      botState.self.velocity.set(0, 0, 0);
      botState.self.unvalidatedPosition = botState.self.position.clone();
    }

    lastSentYaw = null;
    lastSentPitch = null;
    botState.self._prevEye = null;
  });

  client.on('respawn', (pkt) => {
    if (botState.self && (pkt.state === 0 || pkt.state === 1)) {
      botState.self.position.set(
        pkt.position.x,
        pkt.position.y - C.EYE_HEIGHT,
        pkt.position.z
      );

      botState.self.velocity.set(0, 0, 0);
      botState.self.unvalidatedPosition = botState.self.position.clone();
      botState.self._prevEye = null;
    }
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
    botState.self.onGround = pkt.on_ground;
    botState.self.velocity.set(0, 0, 0);
    botState.self.unvalidatedPosition = botState.self.position.clone();

    setFlag('received_server_data', true);

    botState.self._prevEye = null;
  });

  client.on('motion_prediction_hints', (pkt) => {
    if (botState.self) {
      botState.self.uncertainVelocity = new Vec3(
        pkt.velocity.x,
        pkt.velocity.y,
        pkt.velocity.z
      );
    }
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