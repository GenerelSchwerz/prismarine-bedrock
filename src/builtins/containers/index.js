// builtins/containers/index.js
// Generic Bedrock container window helpers. Inventory request construction and
// response waiting are delegated to inventory-actions.js.

const { Vec3 } = require('vec3')
const {
  clickPositionForFace,
  getBlockRuntimeId,
  itemToRaw,
  logAction,
  toVec3f
} = require('../../utils')
const {
  containerSlotInfoFor,
  containerSlotTypeFor,
  normalizeWindowId
} = require('../../container-metadata')
const specializeContainer = require('./specialize')

function blockFace (botState, pos) {
  const eye = botState.self.position.offset(0, 1.62, 0)
  const center = {
    x: Math.floor(pos.x) + 0.5,
    y: Math.floor(pos.y) + 0.5,
    z: Math.floor(pos.z) + 0.5
  }
  const dx = eye.x - center.x
  const dy = eye.y - center.y
  const dz = eye.z - center.z

  if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) return dy > 0 ? 1 : 0
  if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? 5 : 4
  return dz > 0 ? 3 : 2
}

module.exports = function containersPlugin (botState, options = {}) {
  const client = botState.client
  const openTimeoutMs = options.containerOpenTimeoutMs ?? 5000
  const contentTimeoutMs = options.containerContentTimeoutMs ?? 1500

  let activeContainer = null

  function helpers () {
    if (!botState.inventoryActionHelpers) {
      throw new Error('inventory-actions builtin is required before using container actions')
    }
    return botState.inventoryActionHelpers
  }

  function waitForContainerOpen (predicate = () => true, timeoutMs = openTimeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Timed out waiting for container_open'))
      }, timeoutMs)

      function onOpen (packet) {
        if (!predicate(packet)) return
        cleanup()
        resolve(packet)
      }

      function cleanup () {
        clearTimeout(timeout)
        client.off('container_open', onOpen)
      }

      client.on('container_open', onOpen)
    })
  }

  function waitForInventoryContent (windowId, timeoutMs = contentTimeoutMs) {
    const id = normalizeWindowId(windowId)
    const win = botState.windows?.get(id)
    if (win?.lastContentAt) return Promise.resolve(true)

    return new Promise(resolve => {
      const timeout = setTimeout(() => cleanup(false), timeoutMs)

      function onContent (packet) {
        if (normalizeWindowId(packet.window_id) !== id) return
        cleanup(true)
      }

      function onContentUpdated (updatedWindowId) {
        if (normalizeWindowId(updatedWindowId) !== id) return
        cleanup(true)
      }

      function cleanup (seen) {
        clearTimeout(timeout)
        client.off('inventory_content', onContent)
        botState.off('inventory_content_updated', onContentUpdated)
        resolve(seen)
      }

      client.on('inventory_content', onContent)
      botState.on('inventory_content_updated', onContentUpdated)
    })
  }

  function sendOpenBlockContainer (pos, face) {
    const target = pos instanceof Vec3 ? pos : new Vec3(pos.x, pos.y, pos.z)
    const heldSlot = botState.heldItemSlot ?? 0
    const heldItem = botState.inventory?.slots?.[heldSlot] ?? null
    const playerPos = botState.self?.position ?? botState.spawnPosition

    client.queue('inventory_transaction', {
      transaction: {
        legacy: { legacy_request_id: 0, legacy_transactions: [] },
        transaction_type: 'item_use',
        actions: [],
        transaction_data: {
          action_type: 'click_block',
          trigger_type: 'player_input',
          block_position: { x: target.x, y: target.y, z: target.z },
          face,
          hotbar_slot: heldSlot,
          held_item: itemToRaw(heldItem, botState.itemClass),
          player_pos: toVec3f(playerPos),
          click_pos: clickPositionForFace(face),
          block_runtime_id: getBlockRuntimeId(botState, target),
          client_prediction: 'success',
          client_cooldown_state: 0
        }
      }
    })

    logAction('[containers]', 'open block container', { pos: target, face })
  }

  function wrapContainerWindow (packet) {
    const windowId = normalizeWindowId(packet.window_id)
    const window = botState.windows?.get(windowId)
    if (!window) throw new Error(`Container window ${windowId} was not created`)

    const container = createContainerWindow(packet, window)
    activeContainer = container
    botState.currentContainer = container
    return container
  }

  async function openContainer (pos, opts = {}) {
    const target = pos instanceof Vec3 ? pos : new Vec3(pos.x, pos.y, pos.z)
    const face = opts.face ?? blockFace(botState, target)
    const openPromise = waitForContainerOpen(packet => {
      if (!opts.type) return true
      return packet.window_type === opts.type
    }, opts.timeoutMs ?? openTimeoutMs)

    if (typeof botState.lookAt === 'function' && opts.look !== false) {
      await botState.lookAt(target.offset(0.5, 0.5, 0.5))
    }

    sendOpenBlockContainer(target, face)
    const packet = await openPromise
    const container = wrapContainerWindow(packet)
    await waitForInventoryContent(container.id, opts.contentTimeoutMs ?? contentTimeoutMs)
    return container
  }

  function createContainerWindow (packet, window) {
    const windowId = normalizeWindowId(packet.window_id)
    const windowType = packet.window_type
    const containerSlotType = containerSlotTypeFor({
      windowType,
      blockName: blockNameAt(packet.coordinates)
    })
    const api = {
      id: windowId,
      windowId,
      type: windowType,
      containerSlotType,
      position: packet.coordinates,
      window,
      get containerSlotCount () {
        return window.inventoryStart
      },
      get slots () {
        return window.slots
      },
      getItem (slot) {
        assertContainerSlot(api, slot)
        return window.slots[slot] ?? null
      },
      getInventoryItem (slot) {
        assertInventorySlot(slot)
        return botState.inventory.slots[slot] ?? null
      },
      firstEmptyContainerSlot () {
        return firstEmpty(window, 0, window.inventoryStart)
      },
      firstEmptyInventorySlot () {
        return firstEmpty(botState.inventory, 0, botState.inventory.slots.length)
      },
      findContainerItem (name) {
        return findByName(window, 0, window.inventoryStart, name)
      },
      putInventorySlot (inventorySlot, containerSlot = api.firstEmptyContainerSlot(), count) {
        return transfer({
          source: inventoryRef(inventorySlot),
          destination: containerRef(api, containerSlot),
          count
        })
      },
      depositInventorySlot (inventorySlot, containerSlot, count) {
        return api.putInventorySlot(inventorySlot, containerSlot, count)
      },
      takeContainerSlot (containerSlot, inventorySlot = api.firstEmptyInventorySlot(), count) {
        return transfer({
          source: containerRef(api, containerSlot),
          destination: inventoryRef(inventorySlot),
          count
        })
      },
      withdrawContainerSlot (containerSlot, inventorySlot, count) {
        return api.takeContainerSlot(containerSlot, inventorySlot, count)
      },
      moveContainerSlot (fromSlot, toSlot, count) {
        return transfer({
          source: containerRef(api, fromSlot),
          destination: containerRef(api, toSlot),
          count
        })
      },
      swapContainerSlots (slotA, slotB) {
        return swap(containerRef(api, slotA), containerRef(api, slotB))
      },
      waitForContent (timeoutMs) {
        return waitForInventoryContent(windowId, timeoutMs)
      },
      close () {
        client.queue('container_close', {
          window_id: windowId,
          window_type: windowType,
          server: false
        })
      }
    }

    return specializeContainer(api)
  }

  function blockNameAt (position) {
    if (position) {
      try {
        const block = botState.world.getBlock(new Vec3(position.x, position.y, position.z))
        return block?.name
      } catch {}
    }

    return null
  }

  function assertInventorySlot (slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= botState.inventory.slots.length) {
      throw new RangeError(`inventory slot must be between 0 and ${botState.inventory.slots.length - 1}`)
    }
  }

  function assertContainerSlot (container, slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= container.containerSlotCount) {
      throw new RangeError(`container slot must be between 0 and ${container.containerSlotCount - 1}`)
    }
  }

  function firstEmpty (window, start, end) {
    for (let slot = start; slot < end; slot++) {
      if (!window.slots[slot]) return slot
    }
    return -1
  }

  function findByName (window, start, end, name) {
    for (let slot = start; slot < end; slot++) {
      if (window.slots[slot]?.name === name) return slot
    }
    return -1
  }

  function inventoryRef (slot) {
    assertInventorySlot(slot)
    return {
      kind: 'inventory',
      window: botState.inventory,
      slot,
      protocolSlot: slot,
      containerId: slot < 9 ? 'hotbar' : 'inventory'
    }
  }

  function containerRef (container, slot) {
    assertContainerSlot(container, slot)
    const slotInfo = containerSlotInfoFor(container, slot)
    return {
      kind: 'container',
      window: container.window,
      slot,
      protocolSlot: slotInfo.protocolSlot,
      containerId: slotInfo.containerId
    }
  }

  function refItem (ref) {
    return ref.window.slots[ref.slot] ?? null
  }

  function updateRef (ref, item) {
    ref.window.updateSlot(ref.slot, item)
  }

  function requestSlot (ref) {
    return helpers().stackSlotInfo(ref.protocolSlot, refItem(ref), ref.containerId)
  }

  function validateTransfer (sourceRef, destinationRef, count) {
    const source = refItem(sourceRef)
    if (!source) throw new Error(`No item in ${sourceRef.kind} slot ${sourceRef.slot}`)

    const destination = refItem(destinationRef)
    const amount = count ?? source.count
    if (!Number.isInteger(amount) || amount <= 0 || amount > source.count) {
      throw new RangeError(`count must be between 1 and ${source.count}`)
    }

    if (destination && !helpers().sameItem(source, destination)) {
      throw new Error(`Destination slot ${destinationRef.slot} already contains ${destination.name}`)
    }

    if (destination) {
      const space = helpers().maxStackSize(destination) - destination.count
      if (amount > space) throw new Error(`Destination slot ${destinationRef.slot} only has room for ${space}`)
    }

    return amount
  }

  async function transfer ({ source, destination, count }) {
    const amount = validateTransfer(source, destination, count)
    const action = helpers().takeAction(amount, requestSlot(source), requestSlot(destination))
    const request = helpers().makeRequest([action])
    const id = botState.sendStandaloneItemStackRequest(request)
    const response = await botState.waitForItemStackResponse(id)

    applyTransfer(source, destination, amount)
    applyServerSlots(response, [source, destination])
    return response
  }

  async function swap (source, destination) {
    const action = helpers().swapAction(requestSlot(source), requestSlot(destination))
    const request = helpers().makeRequest([action])
    const id = botState.sendStandaloneItemStackRequest(request)
    const response = await botState.waitForItemStackResponse(id)

    const sourceItem = refItem(source)
    const destinationItem = refItem(destination)
    updateRef(source, helpers().cloneItem(destinationItem))
    updateRef(destination, helpers().cloneItem(sourceItem))
    applyServerSlots(response, [source, destination])
    return response
  }

  function applyTransfer (sourceRef, destinationRef, count) {
    const source = refItem(sourceRef)
    const destination = refItem(destinationRef)

    updateRef(sourceRef, helpers().cloneItem(source, source.count - count))
    if (destination) {
      updateRef(destinationRef, helpers().cloneItem(destination, destination.count + count))
    } else {
      updateRef(destinationRef, helpers().cloneItem(source, count))
    }
  }

  function applyServerSlots (response, refs) {
    const byContainer = new Map()
    for (const container of response.containers || []) {
      byContainer.set(container.slot_type?.container_id, container.slots || [])
    }

    for (const ref of refs) {
      const slots = byContainer.get(ref.containerId)
      if (!slots) continue
      const serverSlot = slots.find(slot => slot.slot === ref.protocolSlot)
      if (!serverSlot) continue

      const item = refItem(ref)
      if (!item || serverSlot.count === 0) {
        updateRef(ref, null)
      } else {
        updateRef(ref, helpers().setStackId(helpers().cloneItem(item, serverSlot.count), serverSlot.item_stack_id))
      }
    }
  }

  botState.waitForContainerOpen = waitForContainerOpen
  botState.openContainer = openContainer
  botState.openBlockContainer = openContainer
  botState.wrapContainerWindow = wrapContainerWindow
  botState.getCurrentContainer = () => activeContainer

  client.on('container_close', packet => {
    const windowId = normalizeWindowId(packet.window_id)
    if (activeContainer?.id === windowId) {
      activeContainer = null
      botState.currentContainer = null
    }
  })
}
