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
  const previousControlState = { ...controlState };

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
      up: C.BIT_UP,
      down: C.BIT_DOWN,
      left: C.BIT_LEFT,
      right: C.BIT_RIGHT,
      up_left: C.BIT_UP_LEFT,
      up_right: C.BIT_UP_RIGHT,
      want_up: C.BIT_WANT_UP,
      want_down: C.BIT_WANT_DOWN,
      sprinting: C.BIT_SPRINTING,
      start_sprinting: C.BIT_START_SPRINTING,
      stop_sprinting: C.BIT_STOP_SPRINTING,
      start_sneaking: C.BIT_START_SNEAKING,
      stop_sneaking: C.BIT_STOP_SNEAKING,
      start_jumping: C.BIT_START_JUMPING,
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

  function computeLocalMoveVector() {
    let x = 0;
    let z = 0;
    if (controlState.forward) z += 1;
    if (controlState.back) z -= 1;
    if (controlState.left) x += 1;
    if (controlState.right) x -= 1;

    const len = Math.sqrt(x * x + z * z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  function clearMomentaryFlags() {
    setFlag('start_sprinting', false);
    setFlag('stop_sprinting', false);
    setFlag('start_sneaking', false);
    setFlag('stop_sneaking', false);
    setFlag('start_jumping', false);
  }

  function evaluateControls() {
    const self = botState.self;
    if (!self) return;

    clearMomentaryFlags();

    const sprinting = controlState.sprint && controlState.forward;
    const previousSprinting = previousControlState.sprint && previousControlState.forward;
    setFlag('jumping', controlState.jump);
    setFlag('sprinting', sprinting);
    setFlag('sneaking', controlState.sneak);
    setFlag('up', controlState.forward);
    setFlag('down', controlState.back);
    setFlag('left', controlState.left);
    setFlag('right', controlState.right);
    setFlag('up_left', controlState.forward && controlState.left);
    setFlag('up_right', controlState.forward && controlState.right);
    setFlag('want_up', controlState.jump);
    setFlag('want_down', controlState.sneak);
    setFlag('start_sprinting', sprinting && !previousSprinting);
    setFlag('stop_sprinting', !sprinting && previousSprinting);
    setFlag('start_sneaking', controlState.sneak && !previousControlState.sneak);
    setFlag('stop_sneaking', !controlState.sneak && previousControlState.sneak);
    setFlag('start_jumping', controlState.jump && !previousControlState.jump);
    setFlag('camera_relative_movement_enabled', false);
    setFlag('block_action', false);

    const moveVector = computeLocalMoveVector();
    self.moveVector = moveVector;
    self.rawMoveVector = moveVector;
    self.analogueMoveVector = moveVector;
    self.sprinting = sprinting;
    self.sneaking = controlState.sneak;

    for (const key of Object.keys(controlState)) {
      previousControlState[key] = controlState[key];
    }
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
