'use strict'

const METADATA_KEY_NAMES = {
  0: 'flags',
  1: 'health',
  7: 'air',
  8: 'potion_color',
  9: 'potion_ambient',
  53: 'boundingbox_width',
  54: 'boundingbox_height',
  92: 'flags_extended',
  131: 'visible_mob_effects'
}

const METADATA_FLAGS = [
  'onfire',
  'sneaking',
  'riding',
  'sprinting',
  'action',
  'invisible',
  'tempted',
  'inlove',
  'saddled',
  'powered',
  'ignited',
  'baby',
  'converting',
  'critical',
  'can_show_nametag',
  'always_show_nametag',
  'no_ai',
  'silent',
  'wallclimbing',
  'can_climb',
  'swimmer',
  'can_fly',
  'walker',
  'resting',
  'sitting',
  'angry',
  'interested',
  'charged',
  'tamed',
  'orphaned',
  'leashed',
  'sheared',
  'gliding',
  'elder',
  'moving',
  'breathing',
  'chested',
  'stackable',
  'showbase',
  'rearing',
  'vibrating',
  'idling',
  'evoker_spell',
  'charge_attack',
  'wasd_controlled',
  'can_power_jump',
  'can_dash',
  'linger',
  'has_collision',
  'affected_by_gravity',
  'fire_immune',
  'dancing',
  'enchanted',
  'show_trident_rope',
  'container_private',
  'transforming',
  'spin_attack',
  'swimming',
  'bribed',
  'pregnant',
  'laying_egg',
  'rider_can_pick',
  'transition_sitting',
  'eating',
  'laying_down'
]

const METADATA_FLAGS_EXTENDED = [
  'sneezing',
  'trusting',
  'rolling',
  'scared',
  'in_scaffolding',
  'over_scaffolding',
  'fall_through_scaffolding',
  'blocking',
  'transition_blocking',
  'blocked_using_shield',
  'blocked_using_damaged_shield',
  'sleeping',
  'wants_to_wake',
  'trade_interest',
  'door_breaker',
  'breaking_obstruction',
  'door_opener',
  'illager_captain',
  'stunned',
  'roaring',
  'delayed_attacking',
  'avoiding_mobs',
  'avoiding_block',
  'facing_target_to_range_attack',
  'hidden_when_invisible',
  'is_in_ui',
  'stalking',
  'emoting',
  'celebrating',
  'admiring',
  'celebrating_special',
  'unknown95',
  'ram_attack',
  'playing_dead',
  'in_ascendable_block',
  'over_descendable_block',
  'croaking',
  'eat_mob',
  'jump_goal_jump',
  'emerging',
  'sniffing',
  'digging',
  'sonic_boom',
  'has_dash_cooldown',
  'push_towards_closest_space',
  'scenting',
  'rising',
  'feeling_happy',
  'searching',
  'crawling',
  'timer_flag_1',
  'timer_flag_2',
  'timer_flag_3',
  'body_rotation_blocked',
  'render_when_invisible',
  'body_rotation_axis_aligned',
  'collidable',
  'wasd_air_controlled',
  'does_server_auth_only_dismount',
  'body_rotation_always_follows_head',
  'can_use_vertical_movement_action',
  'rotation_locked_to_vehicle'
]

const BEDROCK_EFFECT_NAMES = {
  1: 'speed',
  2: 'slowness',
  3: 'haste',
  4: 'miningFatigue',
  5: 'strength',
  6: 'instantHealth',
  7: 'instantDamage',
  8: 'jumpBoost',
  9: 'nausea',
  10: 'regeneration',
  11: 'resistance',
  12: 'fireResistance',
  13: 'waterBreathing',
  14: 'invisibility',
  15: 'blindness',
  16: 'nightVision',
  17: 'hunger',
  18: 'weakness',
  19: 'poison',
  20: 'wither',
  21: 'healthBoost',
  22: 'absorption',
  23: 'saturation',
  24: 'glowing',
  25: 'levitation',
  26: 'luck',
  27: 'unluck',
  28: 'slowFalling',
  29: 'conduitPower',
  30: 'dolphinsGrace',
  31: 'badOmen',
  32: 'heroOfTheVillage'
}

const EFFECT_IDS_BY_NAME = Object.fromEntries(
  Object.entries(BEDROCK_EFFECT_NAMES).flatMap(([id, name]) => {
    const normalized = normalizeName(name)
    return [
      [normalized, Number(id)],
      [normalizeName(toSnakeCase(name)), Number(id)],
      [normalizeName(`minecraft:${toSnakeCase(name)}`), Number(id)]
    ]
  })
)

const STATUS_ATTRIBUTE_ALIASES = {
  health: ['minecraft:health', 'health'],
  food: ['minecraft:player.hunger', 'player.hunger', 'hunger', 'food'],
  hunger: ['minecraft:player.hunger', 'player.hunger', 'hunger', 'food'],
  saturation: ['minecraft:player.saturation', 'player.saturation', 'saturation'],
  exhaustion: ['minecraft:player.exhaustion', 'player.exhaustion', 'exhaustion'],
  absorption: ['minecraft:absorption', 'absorption']
}

const ATTRIBUTE_NAME_MAP = {
  movement: 'minecraft:movement_speed',
  movement_speed: 'minecraft:movement_speed',
  'minecraft:movement': 'minecraft:movement_speed',
  'minecraft:movement_speed': 'minecraft:movement_speed',
  jump_strength: 'minecraft:jump_strength',
  'minecraft:jump_strength': 'minecraft:jump_strength',
  step_height: 'minecraft:step_height',
  'minecraft:step_height': 'minecraft:step_height',
  water_movement_efficiency: 'minecraft:water_movement_efficiency',
  'minecraft:water_movement_efficiency': 'minecraft:water_movement_efficiency',
  underwater_movement: 'minecraft:underwater_movement',
  'minecraft:underwater_movement': 'minecraft:underwater_movement'
}

function ensureEntityState (entity) {
  if (!entity || typeof entity !== 'object') return entity

  if (!entity.effects || typeof entity.effects !== 'object') entity.effects = {}
  if (!entity.rawEffects || typeof entity.rawEffects !== 'object') entity.rawEffects = {}
  if (!entity.attributes || typeof entity.attributes !== 'object') entity.attributes = {}
  if (!entity.status || typeof entity.status !== 'object') entity.status = {}
  if (!entity.movementEffects || typeof entity.movementEffects !== 'object') entity.movementEffects = {}
  if (!entity.metadataByKey || typeof entity.metadataByKey !== 'object') entity.metadataByKey = {}
  if (!entity.metadataFlags || typeof entity.metadataFlags !== 'object') entity.metadataFlags = {}
  if (!entity.metadataFlagsExtended || typeof entity.metadataFlagsExtended !== 'object') entity.metadataFlagsExtended = {}

  installMethod(entity, 'getEffect', getEffect)
  installMethod(entity, 'hasEffect', hasEffect)
  installMethod(entity, 'effectLevel', effectLevel)
  installMethod(entity, 'getStatus', getStatus)
  installMethod(entity, 'hasStatus', hasStatus)
  installMethod(entity, 'checkStatus', checkStatus)
  installMethod(entity, 'hasMetadataFlag', hasMetadataFlag)
  installMethod(entity, 'isPose', isPose)
  installMethod(entity, 'isOnFire', function isOnFire () { return this.hasMetadataFlag('onfire') || this.onFire === true })

  return entity
}

function applyMobEffect (entity, packet) {
  ensureEntityState(entity)
  const effectId = Number(packet.effect_id)
  if (!Number.isFinite(effectId)) return null

  const name = BEDROCK_EFFECT_NAMES[effectId] || `bedrockEffect${effectId}`
  const normalizedName = normalizeName(name)
  const eventId = normalizeEffectEvent(packet.event_id)

  if (eventId === 'remove') {
    const existing = entity.rawEffects[effectId]
    delete entity.rawEffects[effectId]
    delete entity.effects[effectId]
    delete entity.effects[name]
    delete entity.effects[normalizedName]
    if (existing?.name) {
      delete entity.effects[existing.name]
      delete entity.effects[normalizeName(existing.name)]
    }
    return null
  }

  const amplifier = Number(packet.amplifier ?? 0)
  const duration = Number(packet.duration ?? 0)
  const effect = {
    id: effectId,
    name,
    amplifier,
    level: amplifier + 1,
    duration,
    particles: !!packet.particles,
    ambient: !!packet.ambient,
    tick: packet.tick
  }

  entity.rawEffects[effectId] = effect
  entity.effects[effectId] = effect
  entity.effects[name] = effect
  entity.effects[normalizedName] = effect
  entity.status[normalizedName] = effect.level
  return effect
}

function applyAttributes (entity, attributes) {
  ensureEntityState(entity)
  for (const attr of attributes || []) {
    if (!attr || !attr.name) continue
    const value = Number(attr.current ?? attr.value ?? attr.default ?? 0)
    const stored = {
      name: attr.name,
      min: Number(attr.min ?? attr.default_min ?? 0),
      max: Number(attr.max ?? attr.default_max ?? 1024),
      current: value,
      value,
      default: Number(attr.default ?? value),
      modifiers: Array.isArray(attr.modifiers) ? attr.modifiers : []
    }

    entity.attributes[attr.name] = stored
    entity.attributes[normalizeName(attr.name)] = stored
    const mappedName = ATTRIBUTE_NAME_MAP[attr.name] || ATTRIBUTE_NAME_MAP[normalizeName(attr.name)]
    if (mappedName) entity.attributes[mappedName] = stored

    for (const [statusName, aliases] of Object.entries(STATUS_ATTRIBUTE_ALIASES)) {
      if (aliases.some(alias => normalizeName(alias) === normalizeName(attr.name))) {
        entity.status[statusName] = value
        if (statusName === 'health') entity.health = value
        if (statusName === 'food' || statusName === 'hunger') entity.food = value
        if (statusName === 'saturation') entity.saturation = value
      }
    }
  }
}

function applyHealth (entity, health) {
  ensureEntityState(entity)
  const value = typeof health === 'object' ? Number(health.health) : Number(health)
  if (!Number.isFinite(value)) return
  entity.health = value
  entity.status.health = value
}

function applyAbilities (entity, layers) {
  ensureEntityState(entity)
  if (!Array.isArray(layers)) return

  entity.abilityLayers = layers
  const baseLayer = layers.find(layer => layer?.type === 'base') || layers[0]
  if (!baseLayer) return

  const enabledSet = Number(baseLayer.enabled ?? 0)
  const allowedSet = Number(baseLayer.allowed ?? 0)

  entity.flying = !!(enabledSet & (1 << 9))
  entity.mayFly = !!(enabledSet & (1 << 10)) || !!(allowedSet & (1 << 10))
  entity.allowFlight = entity.mayFly

  if (baseLayer.fly_speed !== undefined) entity.flySpeed = Number(baseLayer.fly_speed)
  if (baseLayer.vertical_fly_speed !== undefined) entity.verticalFlySpeed = Number(baseLayer.vertical_fly_speed)
  if (baseLayer.walk_speed !== undefined) entity.walkSpeed = Number(baseLayer.walk_speed)
}

function applyAdventureSettings (entity, packet) {
  ensureEntityState(entity)
  const flags = Number(packet?.flags ?? 0)
  entity.flying = !!(flags & 0x200)
  entity.mayFly = !!(flags & 0x40)
  entity.allowFlight = entity.mayFly
}

function applyEntityMetadata (entity, metadata) {
  ensureEntityState(entity)
  entity.metadata = metadata

  for (const entry of metadataEntries(metadata)) {
    const key = normalizeMetadataKey(entry.key ?? entry.name)
    if (key == null) continue

    const value = entry.value
    entity.metadataByKey[key] = value

    switch (key) {
      case 'flags':
      case 'metadata_flags':
      case 'metadata_flags_1':
      case 'flags_1':
        applyFlagSet(entity, value, METADATA_FLAGS, 'metadataFlags')
        break
      case 'flags_extended':
      case 'metadata_flags_2':
      case 'flags_2':
        applyFlagSet(entity, value, METADATA_FLAGS_EXTENDED, 'metadataFlagsExtended')
        break
      case 'health':
        applyHealth(entity, value)
        break
      case 'air':
        entity.air = Number(value)
        entity.status.air = entity.air
        break
      case 'boundingbox_width':
        entity.width = Number(value)
        break
      case 'boundingbox_height':
        entity.height = Number(value)
        break
      case 'visible_mob_effects':
        applyVisibleMobEffects(entity, value)
        break
      case 'pose':
        entity.pose = normalizePose(value)
        break
      default:
        break
    }
  }

  updatePoseFromFlags(entity)
}

function applyVisibleMobEffects (entity, value) {
  const flags = flagsToBigInt(value, []) ?? 0n
  entity.visibleMobEffectsRaw = flags

  const visibleIds = new Set()
  let remaining = flags

  while (remaining > 0n && visibleIds.size < 8) {
    const effectBits = Number(remaining & 0x7fn)
    const id = effectBits >> 1
    const ambient = (effectBits & 1) === 1
    remaining >>= 7n

    if (id <= 0) continue
    const name = BEDROCK_EFFECT_NAMES[id]
    if (!name) continue

    visibleIds.add(id)
    const existing = entity.rawEffects[id]
    if (existing && existing.source !== 'metadata') continue

    const effect = existing || {
      id,
      name,
      amplifier: 0,
      level: 1,
      duration: null,
      particles: true,
      source: 'metadata'
    }
    effect.ambient = ambient
    entity.rawEffects[id] = effect
    entity.effects[id] = effect
    entity.effects[name] = effect
    entity.effects[normalizeName(name)] = effect
    entity.status[normalizeName(name)] = effect.level
  }

  for (const [idText, existing] of Object.entries(entity.rawEffects)) {
    const id = Number(idText)
    if (!existing || existing.source !== 'metadata' || visibleIds.has(id)) continue

    delete entity.rawEffects[id]
    delete entity.effects[id]
    delete entity.effects[existing.name]
    delete entity.effects[normalizeName(existing.name)]
    delete entity.status[normalizeName(existing.name)]
  }
}

function getEffect (nameOrId) {
  ensureEntityState(this)
  const id = effectIdFor(nameOrId)
  if (id != null) return this.rawEffects[id] || this.effects[id] || null
  const key = normalizeName(nameOrId)
  return this.effects[key] || this.effects[nameOrId] || null
}

function hasEffect (nameOrId) {
  return !!this.getEffect(nameOrId)
}

function effectLevel (nameOrId) {
  const effect = this.getEffect(nameOrId)
  if (!effect) return 0
  return Number(effect.level ?? (effect.amplifier != null ? effect.amplifier + 1 : 1)) || 0
}

function getStatus (name) {
  ensureEntityState(this)
  const normalized = normalizeName(name)
  if (normalized in this.status) return this.status[normalized]
  if (normalized === 'health') return this.health ?? null
  if (normalized === 'food' || normalized === 'hunger') return this.food ?? null
  if (normalized === 'saturation') return this.saturation ?? null

  for (const alias of STATUS_ATTRIBUTE_ALIASES[normalized] || []) {
    const attr = this.attributes[alias] || this.attributes[normalizeName(alias)]
    if (attr) return attr.current ?? attr.value ?? null
  }

  return null
}

function hasStatus (name) {
  const value = this.getStatus(name)
  return value !== null && value !== undefined
}

function checkStatus (name, expected) {
  const value = this.getStatus(name)
  if (typeof expected === 'function') return expected(value)
  if (expected && typeof expected === 'object') {
    if (expected.min != null && !(value >= expected.min)) return false
    if (expected.max != null && !(value <= expected.max)) return false
    if (expected.eq != null && value !== expected.eq) return false
    return true
  }
  return value === expected
}

function hasMetadataFlag (name) {
  ensureEntityState(this)
  const normalized = normalizeName(name)
  return !!(
    this.metadataFlags[normalized] ||
    this.metadataFlagsExtended[normalized] ||
    this.metadataFlags[name] ||
    this.metadataFlagsExtended[name]
  )
}

function isPose (pose) {
  const normalized = normalizePose(pose)
  if (normalized === 'sneaking' && (this.sneaking || this.serverSneaking)) return true
  if (normalized === 'sprinting' && (this.sprinting || this.serverSprinting)) return true
  if (normalized === 'swimming' && this.swimming) return true
  if ((normalized === 'fall_flying' || normalized === 'gliding') && (this.gliding || this.fallFlying)) return true
  return normalizePose(this.pose) === normalized || normalizePose(this.inferredPose) === normalized
}

function effectIdFor (nameOrId) {
  if (typeof nameOrId === 'number') return nameOrId
  if (typeof nameOrId === 'bigint') return Number(nameOrId)
  if (typeof nameOrId === 'string' && /^\d+$/.test(nameOrId)) return Number(nameOrId)
  return EFFECT_IDS_BY_NAME[normalizeName(nameOrId)]
}

function applyFlagSet (entity, value, flagNames, targetKey) {
  const flags = flagsToObject(value, flagNames)
  entity[targetKey] = flags

  if (targetKey === 'metadataFlags') {
    entity.metadataFlagsRaw = flagsToBigInt(value, flagNames)
    entity.onFire = !!flags.onfire
    entity.sneaking = !!flags.sneaking
    entity.sprinting = !!flags.sprinting
    entity.swimming = !!flags.swimming
    entity.gliding = !!flags.gliding
    entity.fallFlying = entity.gliding
    entity.invisible = !!flags.invisible
    entity.fireImmune = !!flags.fire_immune
    entity.serverSneaking = entity.sneaking
    entity.serverSprinting = entity.sprinting
  } else {
    entity.metadataFlagsExtendedRaw = flagsToBigInt(value, flagNames)
    entity.blocking = !!flags.blocking
    entity.sleeping = !!flags.sleeping
    entity.crawling = !!flags.crawling
  }
}

function updatePoseFromFlags (entity) {
  if (entity.swimming) entity.inferredPose = 'swimming'
  else if (entity.sneaking) entity.inferredPose = 'sneaking'
  else if (entity.gliding) entity.inferredPose = 'fall_flying'
  else if (entity.metadataFlagsExtended?.sleeping) entity.inferredPose = 'sleeping'
  else if (entity.metadataFlagsExtended?.crawling) entity.inferredPose = 'crawling'
  else entity.inferredPose = 'standing'

  if (!entity.pose) entity.pose = entity.inferredPose
}

function metadataEntries (metadata) {
  if (Array.isArray(metadata)) return metadata.filter(Boolean)
  if (!metadata || typeof metadata !== 'object') return []
  return Object.entries(metadata).map(([key, value]) => ({ key, value }))
}

function normalizeMetadataKey (key) {
  if (key == null) return null
  if (typeof key === 'number') return METADATA_KEY_NAMES[key] || key
  if (typeof key === 'bigint') return METADATA_KEY_NAMES[Number(key)] || Number(key)
  if (/^\d+$/.test(String(key))) return METADATA_KEY_NAMES[Number(key)] || Number(key)
  return String(key)
}

function flagsToObject (value, flagNames) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {}
    for (const name of flagNames) {
      const direct = value[name]
      out[name] = direct === true || direct === 1 || direct === 'true'
      out[normalizeName(name)] = out[name]
    }
    return out
  }

  if (Array.isArray(value)) {
    const set = new Set(value.map(normalizeName))
    return Object.fromEntries(flagNames.flatMap(name => {
      const enabled = set.has(normalizeName(name))
      return [[name, enabled], [normalizeName(name), enabled]]
    }))
  }

  const raw = flagsToBigInt(value, flagNames) ?? 0n
  return Object.fromEntries(flagNames.flatMap((name, index) => {
    const enabled = !!((raw >> BigInt(index)) & 1n)
    return [[name, enabled], [normalizeName(name), enabled]]
  }))
}

function flagsToBigInt (value, flagNames) {
  try {
    if (value == null) return null
    if (typeof value === 'bigint') return value
    if (typeof value === 'number') return BigInt(value)
    if (typeof value === 'string' && value !== '') return BigInt(value)
    if (Array.isArray(value)) {
      let flags = 0n
      const set = new Set(value.map(normalizeName))
      for (let i = 0; i < flagNames.length; i++) {
        if (set.has(normalizeName(flagNames[i]))) flags |= 1n << BigInt(i)
      }
      return flags
    }
    if (typeof value === 'object') {
      let flags = 0n
      for (let i = 0; i < flagNames.length; i++) {
        const name = flagNames[i]
        if (value[name] === true || value[normalizeName(name)] === true) flags |= 1n << BigInt(i)
      }
      return flags
    }
  } catch {
    return null
  }
  return null
}

function normalizeEffectEvent (eventId) {
  if (eventId === 1 || eventId === 'add') return 'add'
  if (eventId === 2 || eventId === 'update') return 'update'
  if (eventId === 3 || eventId === 'remove') return 'remove'
  return String(eventId)
}

function normalizeGameMode (gamemode) {
  if (gamemode === 'creative' || gamemode === 1) return 'creative'
  if (gamemode === 'adventure' || gamemode === 2) return 'adventure'
  if (gamemode === 'spectator' || gamemode === 3 || gamemode === 6) return 'spectator'
  return 'survival'
}

function normalizePose (pose) {
  if (pose == null) return 'standing'
  const normalized = normalizeName(pose)
  if (normalized === 'crouching') return 'sneaking'
  if (normalized === 'fallflying') return 'fall_flying'
  return normalized
}

function normalizeName (value) {
  return String(value ?? '')
    .replace(/^minecraft:/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function toSnakeCase (value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
}

function installMethod (entity, name, fn) {
  if (typeof entity[name] === 'function') return
  Object.defineProperty(entity, name, {
    value: fn,
    configurable: true,
    writable: true
  })
}

module.exports = {
  BEDROCK_EFFECT_NAMES,
  EFFECT_IDS_BY_NAME,
  ATTRIBUTE_NAME_MAP,
  METADATA_FLAGS,
  METADATA_FLAGS_EXTENDED,
  applyAbilities,
  applyAdventureSettings,
  applyAttributes,
  applyEntityMetadata,
  applyHealth,
  applyMobEffect,
  ensureEntityState,
  flagsToBigInt,
  normalizeGameMode,
  normalizePose
}
