/**
 * builtins/entity-interact.js
 *
 * Adds:
 *   botState.attackEntity(entity, opts?)
 *   botState.interactEntity(entity, opts?)
 *   botState.mouseOverEntity(entity)
 */

module.exports = (botState) => {
  const client = botState.client

  function vec3f (pos) {
    return {
      x: Number(pos.x),
      y: Number(pos.y),
      z: Number(pos.z)
    }
  }

  function heldItemToNotch (item) {
    return item ? item.toNotch() : { network_id: 0 }
  }

  function queueMouseOverEntity (entity) {
    client.queue('interact', {
      action_id: 'mouse_over_entity',
      target_entity_id: entity.runtimeId,
      has_position: false
    })
  }

  function queueSwingArm () {
    client.queue('animate', {
      action_id: 1,
      runtime_entity_id: botState.self.runtimeId,
      data: 0,
      has_swing_source: false,
      swing_source: ''
    })
  }

  function queueItemUseOnEntity (entity, actionType, opts = {}) {
    client.queue('inventory_transaction', {
      transaction: {
        legacy: {
          legacy_request_id: 0,
          legacy_transactions: []
        },
        transaction_type: 'item_use_on_entity',
        actions: [],
        transaction_data: {
          entity_runtime_id: entity.runtimeId,
          action_type: actionType,
          hotbar_slot: opts.hotbarSlot ?? botState.heldItemSlot,
          held_item: heldItemToNotch(opts.heldItem ?? botState.heldItem),
          player_pos: vec3f(opts.position ?? botState.self.position),
          click_pos: vec3f(opts.clickPos ?? { x: 0, y: 0, z: 0 })
        }
      }
    })
  }

  botState.attackEntity = async (entity, opts = {}) => {
    if (opts.mouseOver !== false) queueMouseOverEntity(entity)
    queueItemUseOnEntity(entity, 'attack', opts)
    if (opts.swing !== false) queueSwingArm()
  }

  botState.interactEntity = async (entity, opts = {}) => {
    if (opts.mouseOver !== false) queueMouseOverEntity(entity)
    queueItemUseOnEntity(entity, 'interact', opts)
  }

  botState.mouseOverEntity = async (entity) => {
    queueMouseOverEntity(entity)
  }
}