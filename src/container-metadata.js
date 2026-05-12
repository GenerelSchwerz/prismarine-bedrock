// Shared Bedrock container metadata for inventory window mirrors and
// item_stack_request slot references.

const WINDOW_ID_TO_NUM = {
  drop_contents: -100,
  beacon: -24,
  trading_output: -23,
  trading_use_inputs: -22,
  trading_input_2: -21,
  trading_input_1: -20,
  enchant_output: -17,
  enchant_material: -16,
  enchant_input: -15,
  anvil_output: -13,
  anvil_result: -12,
  anvil_material: -11,
  container_input: -10,
  crafting_use_ingredient: -5,
  crafting_result: -4,
  crafting_remove_ingredient: -3,
  crafting_add_ingredient: -2,
  none: -1,
  inventory: 0,
  first: 1,
  last: 100,
  offhand: 119,
  armor: 120,
  creative: 121,
  hotbar: 122,
  fixed_inventory: 123,
  ui: 124
}

const FALLBACK_WINDOW_INFO = {
  key: 'minecraft:generic_9x6',
  containerSlots: 54,
  fallback: true
}

const WINDOW_TYPE_INFO = {
  container: { key: 'minecraft:generic_9x3', containerSlots: 27 },
  workbench: { key: 'minecraft:crafting_table', containerSlots: 10 },
  furnace: { key: 'minecraft:furnace', containerSlots: 3 },
  enchantment: { key: 'minecraft:enchanting_table', containerSlots: 2 },
  brewing_stand: { key: 'minecraft:brewing_stand', containerSlots: 5 },
  anvil: { key: 'minecraft:anvil', containerSlots: 3 },
  dispenser: { key: 'minecraft:dispenser', containerSlots: 9 },
  dropper: { key: 'minecraft:dropper', containerSlots: 9 },
  hopper: { key: 'minecraft:hopper', containerSlots: 5 },
  cauldron: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  minecart_chest: { key: 'minecraft:generic_9x3', containerSlots: 27 },
  minecart_hopper: { key: 'minecraft:hopper', containerSlots: 5 },
  horse: { key: 'EntityHorse', containerSlots: 54 },
  beacon: { key: 'minecraft:beacon', containerSlots: 1 },
  structure_editor: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  trading: { key: 'minecraft:villager', containerSlots: 3 },
  command_block: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  jukebox: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  armor: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  hand: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  compound_creator: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  element_constructor: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  material_reducer: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  lab_table: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  loom: { key: 'minecraft:loom', containerSlots: 4 },
  lectern: { key: 'minecraft:lectern', containerSlots: 1 },
  grindstone: { key: 'minecraft:grindstone', containerSlots: 3 },
  blast_furnace: { key: 'minecraft:blast_furnace', containerSlots: 3 },
  smoker: { key: 'minecraft:smoker', containerSlots: 3 },
  stonecutter: { key: 'minecraft:stonecutter', containerSlots: 2 },
  cartography: { key: 'minecraft:cartography', containerSlots: 3 },
  hud: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  jigsaw_editor: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  smithing_table: { key: 'minecraft:smithing', containerSlots: 4 },
  chest_boat: { key: 'minecraft:generic_9x3', containerSlots: 27 },
  decorated_pot: { key: 'minecraft:generic_9x1', containerSlots: 9 },
  crafter: { key: 'minecraft:crafter_3x3', containerSlots: 10 }
}

const EXACT_SLOT_MAPPINGS = {
  furnace: {
    0: slot('furnace_ingredient', 0),
    1: slot('furnace_fuel', 1),
    2: slot('furnace_output', 2)
  },
  blast_furnace: {
    0: slot('blast_furnace_ingredient', 0),
    1: slot('furnace_fuel', 1),
    2: slot('furnace_output', 2)
  },
  smoker: {
    0: slot('smoker_ingredient', 0),
    1: slot('furnace_fuel', 1),
    2: slot('furnace_output', 2)
  },
  brewing_stand: {
    0: slot('brewing_result', 1),
    1: slot('brewing_result', 2),
    2: slot('brewing_result', 3),
    3: slot('brewing_input', 0),
    4: slot('brewing_fuel', 4)
  },
  workbench: {
    0: slot('crafting_output', 0),
    1: slot('crafting_input', 32),
    2: slot('crafting_input', 33),
    3: slot('crafting_input', 34),
    4: slot('crafting_input', 35),
    5: slot('crafting_input', 36),
    6: slot('crafting_input', 37),
    7: slot('crafting_input', 38),
    8: slot('crafting_input', 39),
    9: slot('crafting_input', 40)
  },
  enchantment: {
    0: slot('enchanting_input', 14),
    1: slot('enchanting_lapis', 15)
  },
  anvil: {
    0: slot('anvil_input', 1),
    1: slot('anvil_material', 2),
    2: slot('anvil_result', 50)
  },
  beacon: {
    0: slot('beacon_payment', 27)
  },
  trading: {
    0: slot('trade2_ingredient1', 4),
    1: slot('trade2_ingredient2', 5),
    2: slot('trade2_result', 50)
  },
  loom: {
    0: slot('loom_input', 9),
    1: slot('loom_dye', 10),
    2: slot('loom_material', 11),
    3: slot('loom_result', 50)
  },
  grindstone: {
    0: slot('grindstone_input', 16),
    1: slot('grindstone_additional', 17),
    2: slot('grindstone_result', 50)
  },
  stonecutter: {
    0: slot('stonecutter_input', 3),
    1: slot('stonecutter_result', 50)
  },
  cartography: {
    0: slot('cartography_input', 12),
    1: slot('cartography_additional', 13),
    2: slot('cartography_result', 50)
  },
  smithing_table: {
    0: slot('smithing_table_template', 53),
    1: slot('smithing_table_input', 51),
    2: slot('smithing_table_material', 52),
    3: slot('smithing_table_result', 50)
  },
  lectern: {
    0: slot('container', 0)
  },
  armor: {
    0: slot('armor', 0),
    1: slot('armor', 1),
    2: slot('armor', 2),
    3: slot('armor', 3)
  },
  hand: {
    0: slot('offhand', 1)
  }
}

function slot (containerId, protocolSlot) {
  return { containerId, protocolSlot }
}

function normalizeWindowId (id) {
  if (typeof id === 'string') return WINDOW_ID_TO_NUM[id] ?? id
  return id
}

function windowInfoFor (windowType) {
  const info = WINDOW_TYPE_INFO[windowType]
  if (info) return { ...info, fallback: false }
  return { ...FALLBACK_WINDOW_INFO }
}

function containerSlotTypeFor ({ windowType, blockName } = {}) {
  if (windowType === 'barrel' || blockName === 'barrel') return 'barrel'
  if (windowType === 'shulker_box' || blockName?.endsWith('shulker_box')) return 'shulker'
  return 'container'
}

function genericSlotInfo (container, slot) {
  return {
    containerId: container.containerSlotType || 'container',
    protocolSlot: slot
  }
}

function horseSlotInfo (slot) {
  if (slot === 0) return { containerId: 'horse_equip', protocolSlot: 0 }
  if (slot === 1) return { containerId: 'horse_equip', protocolSlot: 1 }
  return { containerId: 'container', protocolSlot: slot - 1 }
}

function crafterSlotInfo (container, slot) {
  if (slot >= 0 && slot <= 8) return genericSlotInfo(container, slot)
  if (slot === 9) return { containerId: 'crafter', protocolSlot: 50 }
  return null
}

function educationSlotInfo (type, slot) {
  switch (type) {
    case 'compound_creator':
      if (slot >= 0 && slot <= 8) return { containerId: 'compcreate_input', protocolSlot: slot }
      if (slot === 9) return { containerId: 'compcreate_output', protocolSlot: 50 }
      break
    case 'element_constructor':
      return { containerId: 'elemconstruct_output', protocolSlot: slot }
    case 'material_reducer':
      if (slot === 0) return { containerId: 'matreduce_input', protocolSlot: 0 }
      return { containerId: 'matreduce_output', protocolSlot: slot }
    case 'lab_table':
      return { containerId: 'labtable_input', protocolSlot: slot }
  }

  return null
}

function containerSlotInfoFor (container, slotIndex) {
  const exact = EXACT_SLOT_MAPPINGS[container.type]?.[slotIndex]
  if (exact) return exact

  const education = educationSlotInfo(container.type, slotIndex)
  if (education) return education

  if (container.type === 'horse') return horseSlotInfo(slotIndex)
  if (container.type === 'crafter') return crafterSlotInfo(container, slotIndex)
  return genericSlotInfo(container, slotIndex)
}

module.exports = {
  WINDOW_TYPE_INFO,
  WINDOW_ID_TO_NUM,
  normalizeWindowId,
  windowInfoFor,
  containerSlotTypeFor,
  containerSlotInfoFor
}
