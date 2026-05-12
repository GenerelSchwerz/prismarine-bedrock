const assert = require("assert");

function formatItemForSlotDump (item) {
  if (!item) return 'empty'

  const parts = [`${item.name} x${item.count}`]

  if (item.metadata != null && item.metadata !== 0) {
    parts.push(`meta=${item.metadata}`)
  }

  if (item.stackId != null) {
    parts.push(`stackId=${item.stackId}`)
  } else if (item.stack_id != null) {
    parts.push(`stackId=${item.stack_id}`)
  }

  if (item.raw?.network_id != null) {
    parts.push(`net=${item.raw.network_id}`)
  }

  return parts.join(' ')
}

function renderWindowSlots (window, failedSlot) {
  const slots = window?.slots ?? []
  const rows = []

  for (let slot = 0; slot < slots.length; slot++) {
    const item = slots[slot]
    const marker = slot === failedSlot ? '>>' : '  '

    rows.push(`${marker} [${String(slot).padStart(2, ' ')}] ${formatItemForSlotDump(item)}`)
  }

  if (rows.length === 0) return '  <no slots>'

  return rows.join('\n')
}

function slotFailureMessage (window, slot, expectedName, expectedCount, actualItem) {
  return [
    `slot ${slot} assertion failed`,
    `expected: ${expectedName === null ? 'empty' : `${expectedName} x${expectedCount}`}`,
    `actual:   ${formatItemForSlotDump(actualItem)}`,
    '',
    'window slots:',
    renderWindowSlots(window, slot)
  ].join('\n')
}

function assertSlot (window, slot, expectedName, expectedCount) {
  const item = window.slots[slot]

  if (expectedName === null) {
    assert.strictEqual(
      item,
      null,
      slotFailureMessage(window, slot, expectedName, expectedCount, item)
    )
    return
  }

  assert(
    item,
    slotFailureMessage(window, slot, expectedName, expectedCount, item)
  )

  assert.strictEqual(
    item.name,
    expectedName,
    slotFailureMessage(window, slot, expectedName, expectedCount, item)
  )

  assert.strictEqual(
    item.count,
    expectedCount,
    slotFailureMessage(window, slot, expectedName, expectedCount, item)
  )
}

module.exports = {
    assertSlot
}