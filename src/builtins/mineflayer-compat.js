'use strict'

const { Vec3 } = require('vec3')
const { bedrockRegistryName } = require('../version')

const FACADE = Symbol('mineflayerCompatFacade')
const ENTITY_FACADE = Symbol('mineflayerCompatEntityFacade')
const REGISTRY_FACADE = Symbol('mineflayerCompatRegistryFacade')

function bindFunction (target, value) {
  return typeof value === 'function' ? value.bind(target) : value
}

function asRuntimeKey (key) {
  if (typeof key === 'bigint') return key.toString()
  if (key == null) return ''
  return String(key)
}

function entityObjectFromMaps (botState) {
  const entities = {}

  function add (key, entity) {
    if (!entity) return
    const runtimeKey = asRuntimeKey(entity.runtimeId ?? key)
    if (runtimeKey) entities[runtimeKey] = entity
  }

  if (botState.self) add(botState.self.runtimeId ?? botState.client?.entityId ?? 'self', botState.self)
  for (const [key, entity] of botState.entities || []) add(key, entity)
  for (const [key, entity] of botState.players || []) add(key, entity)

  return entities
}

function inventoryFacade (botState) {
  const inventory = botState.inventory || { slots: [] }

  return new Proxy(inventory, {
    get (target, prop, receiver) {
      if (prop === 'items') {
        return () => (target.slots || []).filter(Boolean)
      }

      return bindFunction(target, Reflect.get(target, prop, receiver))
    }
  })
}

function ensureMineflayerEntityDefaults (entity) {
  if (!entity) return entity

  entity.velocity ??= new Vec3(0, 0, 0)
  entity.effects ??= {}
  entity.attributes ??= {}
  entity.yaw ??= 0
  entity.pitch ??= 0
  entity.onGround ??= false
  entity.isInWater ??= false
  entity.isInLava ??= false
  entity.isInWeb ??= false
  entity.isCollidedHorizontally ??= false
  entity.isCollidedVertically ??= false
  entity.elytraFlying ??= false

  return entity
}

function toMineflayerPosition (entity) {
  if (!entity?.position) return entity?.position
  const eyeHeight = Number.isFinite(entity.eyeHeight) ? entity.eyeHeight : 1.62
  return entity.position.offset(0, -eyeHeight, 0)
}

function fromMineflayerYaw (yawDegrees) {
  return (Number(yawDegrees) || 0) * Math.PI / 180
}

function entityFacade (botState) {
  if (botState[ENTITY_FACADE]) return botState[ENTITY_FACADE]

  botState[ENTITY_FACADE] = new Proxy({}, {
    get (_target, prop) {
      const entity = ensureMineflayerEntityDefaults(botState.self)
      if (!entity) return undefined
      if (prop === 'position') return toMineflayerPosition(entity)
      if (prop === 'yaw') return fromMineflayerYaw(entity.yaw)
      if (prop === 'pitch') return fromMineflayerYaw(entity.pitch)
      return bindFunction(entity, entity[prop])
    },

    set (_target, prop, value) {
      const entity = ensureMineflayerEntityDefaults(botState.self)
      if (!entity) return true
      if (prop === 'position' && value) {
        const eyeHeight = Number.isFinite(entity.eyeHeight) ? entity.eyeHeight : 1.62
        entity.position = value.offset ? value.offset(0, eyeHeight, 0) : new Vec3(value.x, value.y + eyeHeight, value.z)
        return true
      }
      if (prop === 'yaw' || prop === 'pitch') {
        entity[prop] = radiansToDegrees(value)
        return true
      }
      entity[prop] = value
      return true
    }
  })

  return botState[ENTITY_FACADE]
}

function gameFacade (botState) {
  const game = botState.game || {}

  return new Proxy(game, {
    get (target, prop, receiver) {
      if (prop === 'minY') return botState.runtimeState?.worldMinY ?? botState.worldMinY ?? botState.minY ?? -64
      if (prop === 'height') return botState.runtimeState?.worldHeight ?? botState.worldHeight ?? 384
      return Reflect.get(target, prop, receiver)
    }
  })
}

function registryFacade (botState) {
  const registry = botState.registry
  if (!registry) return registry
  if (botState[REGISTRY_FACADE]) return botState[REGISTRY_FACADE]

  const Block = botState.blockClass
  const blocksArray = (registry.blocksArray || []).filter(blockData => {
    try {
      if (!Block) return true
      const block = Block.fromStateId(blockData.minStateId, 0)
      return Array.isArray(block.shapes)
    } catch {
      return false
    }
  })

  botState[REGISTRY_FACADE] = new Proxy(registry, {
    get (target, prop, receiver) {
      if (prop === 'blocksArray') return blocksArray
      return Reflect.get(target, prop, receiver)
    }
  })

  return botState[REGISTRY_FACADE]
}

function floorVec3Like (pos) {
  if (!pos) return pos
  if (typeof pos.floored === 'function') return pos.floored()
  return new Vec3(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z))
}

function blockAt (botState, pos) {
  const blockPos = floorVec3Like(pos)
  if (!blockPos) return null

  const getter = botState.world?.sync?.getBlock || botState.world?.getBlock
  if (typeof getter !== 'function') return null

  const block = getter.call(botState.world.sync || botState.world, blockPos)
  if (block && typeof block.then === 'function') return null
  return block || null
}

function radiansToDegrees (value) {
  return (Number(value) || 0) * 180 / Math.PI
}

function mineflayerYawToBedrockDegrees (yaw) {
  return radiansToDegrees(Math.PI - (Number(yaw) || 0))
}

function mineflayerDataVersion (botState) {
  const explicit = botState.options?.mineflayerDataVersion ?? botState.mineflayerDataVersion
  if (explicit) return explicit
  return bedrockRegistryName(botState.version || botState.options?.version)
}

function createSimplePhysicsShim (botState) {
  return {
    simulatePlayer (state) {
      if (!state?.pos) return state

      const control = state.control || {}
      const yaw = Number.isFinite(state.yaw) ? state.yaw : 0
      const speed = control.sprint ? 0.28 : 0.18
      let forward = 0
      let strafe = 0

      if (control.forward) forward += 1
      if (control.back) forward -= 1
      if (control.left) strafe += 1
      if (control.right) strafe -= 1

      const length = Math.hypot(forward, strafe)
      if (length > 1) {
        forward /= length
        strafe /= length
      }

      if (forward !== 0 || strafe !== 0) {
        const bedrockYaw = Math.PI - yaw
        const sin = Math.sin(bedrockYaw)
        const cos = Math.cos(bedrockYaw)
        state.pos.x += (strafe * cos - forward * sin) * speed
        state.pos.z += (forward * cos + strafe * sin) * speed
      }

      if (control.jump && state.onGround) {
        state.pos.y += 0.42
        state.onGround = false
      } else if (!state.onGround) {
        const selfFeetY = toMineflayerPosition(botState.self)?.y ?? state.pos.y
        state.pos.y -= 0.08
        if (state.pos.y <= selfFeetY) {
          state.pos.y = selfFeetY
          state.onGround = true
        }
      }

      state.isInWater = !!botState.self?.isInWater
      state.isInLava = !!botState.self?.isInLava
      return state
    }
  }
}

function createMineflayerFacade (botState) {
  if (botState[FACADE]) return botState[FACADE]

  const loadedPlugins = new Set()

  const facade = new Proxy(botState, {
    get (target, prop, receiver) {
      if (prop === 'entity') return entityFacade(target)
      if (prop === 'entities') return entityObjectFromMaps(target)
      if (prop === 'inventory') return inventoryFacade(target)
      if (prop === 'game') return gameFacade(target)
      if (prop === 'registry') return registryFacade(target)
      if (prop === 'version') return mineflayerDataVersion(target)
      if (prop === 'blockAt') return (pos) => blockAt(target, pos)
      if (prop === 'findBlock') return target.findBlock
      if (prop === 'physics') return target.physics || createSimplePhysicsShim(target)
      if (prop === 'look') {
        return (yaw, pitch = 0, force = false) => target.look?.(mineflayerYawToBedrockDegrees(yaw), radiansToDegrees(pitch), force)
      }
      if (prop === 'loadPlugin') {
        return (plugin) => {
          if (loadedPlugins.has(plugin)) return facade
          loadedPlugins.add(plugin)
          plugin(facade)
          return facade
        }
      }
      if (prop === 'loadPlugins') {
        return (plugins = []) => {
          for (const plugin of plugins) facade.loadPlugin(plugin)
          return facade
        }
      }
      if (prop === 'asMineflayerBot') return () => facade
      if (prop === 'nativeBot') return target

      return bindFunction(target, Reflect.get(target, prop, receiver))
    },

    set (target, prop, value) {
      target[prop] = value
      return true
    }
  })

  botState[FACADE] = facade
  return facade
}

module.exports = function mineflayerCompatPlugin (botState) {
  const facade = createMineflayerFacade(botState)

  Object.defineProperty(botState, 'mineflayer', {
    configurable: true,
    enumerable: true,
    get () {
      return facade
    }
  })

  botState.asMineflayerBot = () => facade
  botState.loadMineflayerPlugin = plugin => facade.loadPlugin(plugin)
  botState.loadMineflayerPlugins = plugins => facade.loadPlugins(plugins)
  if (typeof botState.loadPlugin !== 'function') botState.loadPlugin = plugin => facade.loadPlugin(plugin)
  if (typeof botState.loadPlugins !== 'function') botState.loadPlugins = plugins => facade.loadPlugins(plugins)
}

module.exports.createMineflayerFacade = createMineflayerFacade
