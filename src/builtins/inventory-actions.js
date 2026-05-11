// builtins/inventory-actions.js
// Auto-loaded by BotState._loadBuiltins().
//
// Active inventory behavior layer for server-authoritative Bedrock inventory.
// Keeps inventory.js as the passive mirror and sends real item_stack_request
// actions through player_auth_input via auth-input.js.
//
// Provides:
//   botState.sendItemStackRequest(request)
//   botState.waitForItemStackResponse(requestId)
//   botState.swapInventorySlots(slotA, slotB)
//   botState.moveInventorySlot(fromSlot, toSlot)
//   botState.mergeInventorySlots(fromSlot, toSlot)
//   botState.moveOneInventoryItem(fromSlot, toSlot)
//   botState.splitInventorySlot(fromSlot, toSlot)
//   botState.dropInventorySlot(slot)
//   botState.dropOneInventoryItem(slot)
//   botState.destroyInventorySlot(slot)
//   botState.destroyOneInventoryItem(slot)

const { logAction } = require('../utils')

module.exports = function inventoryActionsPlugin (botState, options = {}) {
  const client = botState.client

  let nextRequestId = options.inventoryRequestIdStart ?? 1
  let responseTimeoutMs = options.inventoryResponseTimeoutMs ?? 5000
  let inventoryUpdateTimeoutMs = options.inventoryUpdateTimeoutMs ?? 3000

  const pendingResponses = new Map()
  const pendingSlotUpdates = new Set()

  function requestId () {
    return nextRequestId++
  }

  function itemAt (slot) {
    return botState.inventory.slots[slot]
  }

  function stackId (item) {
    return item ? item.stack_id : 0
  }

  function stackSlot (slot) {
    return {
      container: 'inventory',
      slot,
      stack_id: stackId(itemAt(slot))
    }
  }

  function stackSlotWithItem (slot, item) {
    return {
      container: 'inventory',
      slot,
      stack_id: stackId(item)
    }
  }

  function countOf (slot) {
    return itemAt(slot).count
  }

  function sameItem (a, b) {
    return a && b && a.name === b.name && a.metadata === b.metadata
  }

  function maxStackSize (item) {
    return item.stackSize || item.maxStackSize || 64
  }

  function queueRequestInAuthInput (request) {
    botState.queuePlayerAuthInputEdit(packet => {
      botState.setAuthInputFlag(packet, 'item_stack_request', true)
      packet.item_stack_request = request
    })

    botState.flushPlayerAuthInput()
  }

  function sendItemStackRequest (request) {
    queueRequestInAuthInput(request)

    logAction('[inventory-actions]', 'item_stack_request', {
      requestId: request.request_id,
      actions: request.actions.map(action => action.type_id)
    })

    return request.request_id
  }

  function waitForItemStackResponse (id, timeoutMs = responseTimeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingResponses.delete(id)
        reject(new Error(`Timed out waiting for item_stack_response: ${id}`))
      }, timeoutMs)

      pendingResponses.set(id, {
        resolve,
        reject,
        timeout
      })
    })
  }

  function responseStatusOk (response) {
    return response.status === 'ok' || response.status === 'success'
  }

  function parseItemStackResponsePacket (packet) {
    return packet.responses || packet.response || packet.entries || []
  }

  client.on('item_stack_response', packet => {
    const responses = parseItemStackResponsePacket(packet)

    for (const response of responses) {
      const id = response.request_id
      botState.emit('item_stack_response', response)

      const waiter = pendingResponses.get(id)
      if (!waiter) continue

      clearTimeout(waiter.timeout)
      pendingResponses.delete(id)

      if (responseStatusOk(response)) {
        waiter.resolve(response)
      } else {
        waiter.reject(new Error(`item_stack_response rejected request ${id}: ${response.status}`))
      }
    }
  })

  function waitForInventorySlots (slots, timeoutMs = inventoryUpdateTimeoutMs) {
    const wanted = new Set(slots)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timed out waiting for inventory slot update: ${[...wanted].join(', ')}`))
      }, timeoutMs)

      function onInventorySlot (packet) {
        if (packet.window_id !== 0 && packet.window_id !== 'inventory') return
        wanted.delete(packet.slot)
        if (wanted.size === 0) {
          cleanup()
          resolve()
        }
      }

      function onInventoryContent (packet) {
        if (packet.window_id !== 0 && packet.window_id !== 'inventory') return
        cleanup()
        resolve()
      }

      function cleanup () {
        clearTimeout(timeout)
        client.off('inventory_slot', onInventorySlot)
        client.off('inventory_content', onInventoryContent)
      }

      client.on('inventory_slot', onInventorySlot)
      client.on('inventory_content', onInventoryContent)
    })
  }

  async function transactInventory (request, changedSlots) {
    const id = sendItemStackRequest(request)
    const response = await waitForItemStackResponse(id)
    await waitForInventorySlots(changedSlots)
    return response
  }

  function makeRequest (actions) {
    return {
      request_id: requestId(),
      actions,
      strings: [],
      filter_strings: []
    }
  }

  function takeAction (count, source, destination) {
    return {
      type_id: 'take',
      count,
      source,
      destination
    }
  }

  function placeAction (count, source, destination) {
    return {
      type_id: 'place',
      count,
      source,
      destination
    }
  }

  function swapAction (source, destination) {
    return {
      type_id: 'swap',
      source,
      destination
    }
  }

  function dropAction (count, source, randomly = false) {
    return {
      type_id: 'drop',
      count,
      source,
      randomly
    }
  }

  function destroyAction (count, source) {
    return {
      type_id: 'destroy',
      count,
      source
    }
  }

  async function swapInventorySlots (slotA, slotB) {
    const source = stackSlot(slotA)
    const destination = stackSlot(slotB)

    const request = makeRequest([
      swapAction(source, destination)
    ])

    return transactInventory(request, [slotA, slotB])
  }

  async function moveInventorySlot (fromSlot, toSlot) {
    const source = stackSlot(fromSlot)
    const destination = stackSlot(toSlot)

    const request = makeRequest([
      takeAction(countOf(fromSlot), source, destination)
    ])

    return transactInventory(request, [fromSlot, toSlot])
  }

  async function mergeInventorySlots (fromSlot, toSlot) {
    const from = itemAt(fromSlot)
    const to = itemAt(toSlot)
    const count = Math.min(from.count, maxStackSize(to) - to.count)

    const request = makeRequest([
      takeAction(count, stackSlotWithItem(fromSlot, from), stackSlotWithItem(toSlot, to))
    ])

    return transactInventory(request, [fromSlot, toSlot])
  }

  async function moveOneInventoryItem (fromSlot, toSlot) {
    const from = itemAt(fromSlot)
    const to = itemAt(toSlot)

    const source = stackSlotWithItem(fromSlot, from)
    const destination = stackSlotWithItem(toSlot, to)

    const request = makeRequest([
      takeAction(1, source, destination)
    ])

    return transactInventory(request, [fromSlot, toSlot])
  }

  async function splitInventorySlot (fromSlot, toSlot) {
    const count = Math.ceil(countOf(fromSlot) / 2)

    const request = makeRequest([
      takeAction(count, stackSlot(fromSlot), stackSlot(toSlot))
    ])

    return transactInventory(request, [fromSlot, toSlot])
  }

  async function dropInventorySlot (slot, randomly = false) {
    const request = makeRequest([
      dropAction(countOf(slot), stackSlot(slot), randomly)
    ])

    return transactInventory(request, [slot])
  }

  async function dropOneInventoryItem (slot, randomly = false) {
    const request = makeRequest([
      dropAction(1, stackSlot(slot), randomly)
    ])

    return transactInventory(request, [slot])
  }

  async function destroyInventorySlot (slot) {
    const request = makeRequest([
      destroyAction(countOf(slot), stackSlot(slot))
    ])

    return transactInventory(request, [slot])
  }

  async function destroyOneInventoryItem (slot) {
    const request = makeRequest([
      destroyAction(1, stackSlot(slot))
    ])

    return transactInventory(request, [slot])
  }

  function clearInventoryActionWaiters () {
    for (const waiter of pendingResponses.values()) {
      clearTimeout(waiter.timeout)
      waiter.reject(new Error('Inventory action waiters cleared'))
    }

    pendingResponses.clear()
    pendingSlotUpdates.clear()
  }

  botState.sendItemStackRequest = sendItemStackRequest
  botState.waitForItemStackResponse = waitForItemStackResponse

  botState.swapInventorySlots = swapInventorySlots
  botState.moveInventorySlot = moveInventorySlot
  botState.mergeInventorySlots = mergeInventorySlots
  botState.moveOneInventoryItem = moveOneInventoryItem
  botState.splitInventorySlot = splitInventorySlot

  botState.dropInventorySlot = dropInventorySlot
  botState.dropOneInventoryItem = dropOneInventoryItem

  botState.destroyInventorySlot = destroyInventorySlot
  botState.destroyOneInventoryItem = destroyOneInventoryItem

  botState.setInventoryActionResponseTimeout = ms => {
    responseTimeoutMs = ms
  }

  botState.setInventoryActionUpdateTimeout = ms => {
    inventoryUpdateTimeoutMs = ms
  }

  botState.clearInventoryActionWaiters = clearInventoryActionWaiters

  client.on('close', clearInventoryActionWaiters)
}