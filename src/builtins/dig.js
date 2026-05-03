// builtins/dig.js
// Auto-loaded by BotState._loadBuiltins().
// Provides botState.dig(targetBlock) and listens for block updates.
//
// Loads block hardness/diggable from a prismarine-registry instance (passed in options).
// Uses prismarine-block's digTime() when available to avoid hardcoded tool multipliers.
// Falls back to a minimal tool-speed map (still hardcoded but clearly noted).

const { logAction } = require('../utils');

// --------------------------------------------------------------------------
// Tool multiplier fallback (only used when prismarine-block is not available)
// --------------------------------------------------------------------------
const FALLBACK_TOOL_MULTIPLIER = {
  wooden_pickaxe:    2.0,
  stone_pickaxe:     2.5,
  iron_pickaxe:      3.0,
  golden_pickaxe:    2.0,
  diamond_pickaxe:   4.0,
  netherite_pickaxe: 5.0,
  wooden_shovel:     1.5,
  stone_shovel:      2.0,
  iron_shovel:       2.5,
  golden_shovel:     1.5,
  diamond_shovel:    3.0,
  netherite_shovel:  4.0,
  wooden_axe:        2.0,
  stone_axe:         2.5,
  iron_axe:          3.0,
  golden_axe:        2.0,
  diamond_axe:       4.0,
  netherite_axe:     5.0,
  __default:         1.0,
}

// --------------------------------------------------------------------------
// Compute dig time (ms) – uses prismarine-block if available
// --------------------------------------------------------------------------
function calcDigTime (registry, blockName, heldItemName) {
  const blockInfo = registry.blocksByName[blockName?.replace('minecraft:', '')]

  if (!blockInfo) {
    // unknown block – fallback
    const oldFallback = 0.8
    return Math.max(100, (oldFallback / 1.0) * 1000)
  }

  if (!blockInfo.diggable || blockInfo.hardness < 0) {
    return Infinity
  }

  // If prismarine-block is available, use its authoritative digTime()
  let Block
  try {
    Block = require('prismarine-block')(registry)
  } catch (e) {
    // prismarine-block not installed – use fallback
  }

  if (Block && typeof Block.getDigTime === 'function') {
    // Construct a fake block object with the properties prismarine-block expects
    const fakeBlock = {
      name: blockInfo.name,
      hardness: blockInfo.hardness,
      diggable: blockInfo.diggable,
      material: blockInfo.material,
      harvestTools: blockInfo.harvestTools,
    }
    const fakeHeldItem = heldItemName
      ? { name: heldItemName.replace('minecraft:', '') }
      : null
    return Block.getDigTime(fakeBlock, fakeHeldItem)
  }

  // Fallback: manual formula (uses hardcoded multipliers – see note above)
  const heldName = (heldItemName || '').replace('minecraft:', '').toLowerCase()
  const toolMult = FALLBACK_TOOL_MULTIPLIER[heldName] ?? FALLBACK_TOOL_MULTIPLIER.__default

  let baseSecs = blockInfo.hardness * 1.5

  // Simple tool-penalty check (not as accurate as prismarine-block)
  if (blockInfo.harvestTools && Object.keys(blockInfo.harvestTools).length > 0 && toolMult <= 1.0) {
    baseSecs *= 3.0
  }

  const finalSecs = baseSecs / toolMult
  return Math.max(100, finalSecs * 1000)
}

// --------------------------------------------------------------------------
// Plugin inject
// --------------------------------------------------------------------------
module.exports = (botState, options = {}) => {
  const registry = botState.registry
  if (!registry) {
    throw new Error('dig.js requires a prismarine-registry instance in options.registry')
  }

  const digState = {
    target: null,
    timeout: null,
    startTime: null,
  }
  botState.currentDig = digState

  const client = botState.client

  function digBlock (block) {
    if (digState.target) {
      logAction('[dig]', 'already digging, ignoring', { target: digState.target })
      return
    }

    if (!block) {
      logAction('[dig]', 'called with null/undefined block')
      return
    }

    const pos = block.position
    const blockName = block.name || 'unknown'

    if (typeof botState.lookAt === 'function') {
      botState.lookAt(pos)
    }

    client.queue('player_action', {
      runtime_entity_id: client.entityId,
      action: 'start_break',
      position: { x: pos.x, y: pos.y, z: pos.z },
      result_position: { x: 0, y: 0, z: 0 },
      face: 0,
    })

    let heldItemName = ''
    try {
      if (botState.inventory) {
        const held = botState.inventory.slots[0]
        if (held) heldItemName = held.name
      }
    } catch (e) {}

    const digMs = calcDigTime(registry, blockName, heldItemName)

    if (!isFinite(digMs)) {
      logAction('[dig]', 'cannot dig this block (undiggable or unbreakable)', { block: blockName })
      return
    }

    digState.target = pos.clone()
    digState.startTime = Date.now()

    logAction('[dig]', 'start break', {
      block: blockName,
      pos: pos.toString(),
      digMs,
      tool: heldItemName || '(empty)',
    })

    digState.timeout = setTimeout(() => {
      if (digState.target) {
        client.queue('player_action', {
          runtime_entity_id: client.entityId,
          action: 'stop_break',
          position: { x: pos.x, y: pos.y, z: pos.z },
          result_position: { x: 0, y: 0, z: 0 },
          face: 0,
        })
        logAction('[dig]', 'stop break', { pos: pos.toString(), dugMs: Date.now() - digState.startTime })
        digState.target = null
        digState.timeout = null
        digState.startTime = null
      }
    }, digMs)
  }

  botState.dig = digBlock

  client.on('update_block', (packet) => {
    if (!digState.target) return
    const { position } = packet
    if (position.x === digState.target.x &&
        position.y === digState.target.y &&
        position.z === digState.target.z) {
      logAction('[dig]', 'block updated while digging, clearing timeout', { pos: digState.target.toString() })
      if (digState.timeout) clearTimeout(digState.timeout)
      digState.target = null
      digState.timeout = null
      digState.startTime = null
    }
  })
}