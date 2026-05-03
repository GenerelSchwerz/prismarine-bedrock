/**
 * builtins/entityInteract.js
 *
 * Plugin that adds async entity interaction methods to BotState.
 * Relies on the inventory.js plugin (or equivalent) to populate:
 *   botState.heldItem  – currently held item (getter from main inventory)
 *   botState.selectedSlot – currently selected hotbar slot index
 *
 * Methods added:
 *   botState.attackEntity(entity, opts?)     – left‑click attack
 *   botState.interactEntity(entity, opts?)   – right‑click interact
 *   botState.mouseOverEntity(entity)         – highlight entity (client‑side hint)
 *
 * The bot's own position is read from botState.self.position (set by entities.js).
 */

const { Vec3 } = require('vec3');

module.exports = (botState) => {
  const client = botState.client;

  // ── Resolve an entity argument to its runtime ID ──
  function resolveEntityRuntimeId(entity) {
    return (
      entity?.runtime_id ??
      entity?.id ??
      entity?.runtime_entity_id ??
      entity
    );
  }

  // ── Internal helper: queue an item_use_on_entity transaction ──
  function queueItemUseOnEntity(entityRuntimeId, actionType, opts) {
    const pos = opts.position || botState.self?.position || new Vec3(0, 0, 0);
    const slot = opts.hotbar_slot ?? botState.selectedSlot;
    const item = opts.held_item ?? botState.heldItem;

    client.queue('inventory_transaction', {
      legacy: { legacy_request_id: 0, legacy_transactions: [] },
      transaction_type: 3,                   // item_use_on_entity
      actions: [],
      transaction_data: {
        entity_runtime_id: entityRuntimeId,
        action_type: actionType,             // 0 = interact, 1 = attack
        hotbar_slot: slot,
        held_item: item,
        player_pos: { x: pos.x, y: pos.y, z: pos.z },
        click_pos: opts.click_pos ?? { x: 0, y: 0, z: 0 },
      },
    });
  }

  // ── Attack an entity (left‑click) ──
  //
  // Sends a swing_arm animation followed by an inventory transaction with
  // action_type=1 (attack).
  //
  // @param {object|number} entity   – Entity object with a runtime ID, or raw runtime ID
  // @param {object}        [opts]
  // @param {Vec3}          [opts.position]   – Override player position
  // @param {number}        [opts.hotbar_slot]– Override hotbar slot
  // @param {object}        [opts.held_item]  – Override held item (Item format)
  // @param {object}        [opts.click_pos]  – Override click position relative to entity
  // @returns {Promise<void>}
  //
  botState.attackEntity = async (entity, opts = {}) => {
    const runtimeId = resolveEntityRuntimeId(entity);
    if (runtimeId == null) throw new Error('Cannot attack: entity has no runtime_id');

    // Swing arm animation
    client.queue('animate', {
      action_id: 1, // swing_arm
      runtime_entity_id: client.entityId,
      data: 0,
      has_swing_source: false,
      swing_source: '',
    });

    queueItemUseOnEntity(runtimeId, 1, opts);
  };

  // ── Right‑click / interact with an entity ──
  //
  // Sends an inventory transaction with action_type=0 (interact).
  // Used for trading, NPC interaction, etc.
  //
  // @param {object|number} entity
  // @param {object}        [opts]     – Same options as attackEntity
  // @returns {Promise<void>}
  //
  botState.interactEntity = async (entity, opts = {}) => {
    const runtimeId = resolveEntityRuntimeId(entity);
    if (runtimeId == null) throw new Error('Cannot interact: entity has no runtime_id');

    queueItemUseOnEntity(runtimeId, 0, opts);
  };

  // ── Mouse‑over an entity (for targeting / highlighting) ──
  //
  // Uses the Interact packet (0x21) with action_id=4 (mouse_over_entity).
  // This is a purely visual client‑side hint, not an attack or interaction.
  //
  // @param {object|number} entity
  // @returns {Promise<void>}
  //
  botState.mouseOverEntity = async (entity) => {
    const runtimeId = resolveEntityRuntimeId(entity);
    if (runtimeId == null) throw new Error('Cannot mouse-over: entity has no runtime_id');

    client.queue('interact', {
      action_id: 4,   // mouse_over_entity
      target_entity_id: runtimeId,
      has_position: false,
      position: null,
    });
  };
};