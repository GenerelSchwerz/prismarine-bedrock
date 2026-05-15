'use strict'

function currentE2ETarget () {
  return process.env.E2E_SERVER_TARGET || ''
}

function e2eTargetFamily (target = currentE2ETarget()) {
  const normalized = String(target).toLowerCase()
  if (normalized.startsWith('endstone')) return 'endstone'
  if (normalized.startsWith('java') || normalized.startsWith('geyser')) return 'geyser'
  return null
}

function normalizeFamilies (families) {
  return new Set([].concat(families).map(family => {
    const normalized = String(family).toLowerCase()
    return normalized === 'java' ? 'geyser' : normalized
  }))
}

function skipUnlessE2ETarget (context, families, reason) {
  const allowed = normalizeFamilies(families)
  const target = currentE2ETarget()
  const family = e2eTargetFamily(target)

  if (family && allowed.has(family)) return

  const allowedLabel = [...allowed].join(', ')
  const actualLabel = target || 'unknown target'
  const message = reason || `requires ${allowedLabel}; current target is ${actualLabel}`

  context.skip(message)
}

module.exports = {
  currentE2ETarget,
  e2eTargetFamily,
  skipUnlessE2ETarget
}
