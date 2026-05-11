const { floorVec3 } = require('../../utils');

/**
 * @param {import('../../state') botState}
 */
function createBedrockWorldAdapter(botState) {
  if (!botState.world || typeof botState.world.sync.getBlock !== 'function') {
    throw new Error('[physics] botState.world.getBlock(pos) is required');
  }

  return {
    getBlock(pos) {
      const block = botState.world.sync.getBlock(floorVec3(pos));

      if (block && typeof block.then === 'function') {
        throw new Error(
          '[physics] @nxg-org/mineflayer-physics-util expects sync world.getBlock(pos). ' +
          'Expose a synchronous getBlock on botState.world for the physics adapter.'
        );
      }

      return block;
    }
  };
}

module.exports = {
  createBedrockWorldAdapter
};
