const { numberOrZero } = require('../../utils');

function installControls(botState, C) {
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

  for (const key of Object.keys(controlState)) {
    Object.defineProperty(botState.controlState, key, {
      get() {
        return controlState[key];
      },
      set(value) {
        botState.setControlState(key, value);
      }
    });
  }

  botState.setControlState = (name, value) => {
    if (!(name in controlState)) throw new Error('Invalid control ' + name);
    if (typeof value !== 'boolean') throw new Error('Control state must be boolean');
    controlState[name] = value;
  };

  botState.getControlState = (name) => controlState[name];

  botState.clearControlStates = () => {
    for (const key of Object.keys(controlState)) controlState[key] = false;
  };

  function setFlag(name, value) {
    if (!botState.self) return;

    const bit = {
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
    }[name];

    if (bit === undefined) return;

    let inputData = botState.self.inputData ?? 0n;
    const mask = 1n << BigInt(bit);
    inputData = value ? inputData | mask : inputData & ~mask;
    botState.self.inputData = inputData;
  }

  function computeMoveVector() {
    const self = botState.self;
    if (!self) return { x: 0, z: 0 };

    let x = 0;
    let z = 0;
    const yawRad = ((self.yaw || 0) * Math.PI) / 180;
    const sinYaw = Math.sin(yawRad);
    const cosYaw = Math.cos(yawRad);

    if (controlState.forward) {
      x -= sinYaw;
      z += cosYaw;
    }

    if (controlState.back) {
      x += sinYaw;
      z -= cosYaw;
    }

    if (controlState.left) {
      x += cosYaw;
      z += sinYaw;
    }

    if (controlState.right) {
      x -= cosYaw;
      z += sinYaw;
    }

    const len = Math.sqrt(x * x + z * z);
    if (len > 0) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  function evaluateControls() {
    const self = botState.self;
    if (!self) return;

    setFlag('jumping', controlState.jump);
    setFlag('sprinting', controlState.sprint);
    setFlag('sneaking', controlState.sneak);
    setFlag('camera_relative_movement_enabled', false);
    setFlag('block_action', false);

    const moveVector = computeMoveVector();
    self.moveVector = moveVector;
    self.rawMoveVector = moveVector;
    self.analogueMoveVector = moveVector;
  }

  function getControlStateSnapshot() {
    return { ...controlState };
  }

  botState.setFlag = setFlag;

  return {
    controlState,
    setFlag,
    evaluateControls,
    getControlStateSnapshot
  };
}

function updateEyeDeltaAndTick(self, C) {
  self.delta = {
    x: numberOrZero(self.velocity?.x),
    y: numberOrZero(self.velocity?.y),
    z: numberOrZero(self.velocity?.z)
  };

  if (self.verticalCollision && self.delta.y >= 0) {
    self.delta.y = -C.GRAVITY;
  }

  self.unvalidatedPosition = self.position.clone();
  self.uncertainVelocity = null;
  self.tick = (self.tick || 0n) + 1n;
}

module.exports = {
  installControls,
  updateEyeDeltaAndTick,
  numberOrZero
};
