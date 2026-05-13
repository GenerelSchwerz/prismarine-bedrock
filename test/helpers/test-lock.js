'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')

function lockScope () {
  return process.env.E2E_SERVER_TARGET ||
    (process.env.PORT ? `port-${process.env.PORT}` : null) ||
    'default'
}

function safeLockScope (scope) {
  return String(scope).replace(/[^A-Za-z0-9_.-]/g, '_')
}

const lockPath = path.join(
  repoRoot,
  process.env.TEST_LOCK_FILE || `.test-lock.${safeLockScope(lockScope())}.json`
)

function isProcessAlive (pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false

  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function readExistingLock () {
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'))
  } catch {
    return null
  }
}

function removeStaleOwnHostLock (lock) {
  if (lock?.hostname !== os.hostname()) return false
  if (isProcessAlive(lock.pid)) return false

  fs.rmSync(lockPath, { force: true })
  return true
}

function lockError (lock) {
  const details = lock
    ? JSON.stringify(lock, null, 2)
    : fs.existsSync(lockPath) ? fs.readFileSync(lockPath, 'utf8') : '<unreadable lock>'

  return new Error([
    `Test lock already exists: ${lockPath}`,
    `Another agent may be using this Bedrock test server scope: ${lockScope()}.`,
    'Wait for that run to finish, or remove the lock only after confirming no test is active.',
    'Existing lock:',
    details
  ].join('\n'))
}

function acquireTestLock () {
  if (process.env.TEST_LOCK_DISABLE === '1') return null

  const lock = {
    pid: process.pid,
    hostname: os.hostname(),
    startedAt: new Date().toISOString(),
    cwd: process.cwd(),
    command: process.argv.join(' '),
    scope: lockScope()
  }

  while (true) {
    try {
      const fd = fs.openSync(lockPath, 'wx')
      fs.writeFileSync(fd, `${JSON.stringify(lock, null, 2)}\n`)
      fs.closeSync(fd)
      return lock
    } catch (err) {
      if (err.code !== 'EEXIST') throw err

      const existing = readExistingLock()
      if (removeStaleOwnHostLock(existing)) continue
      throw lockError(existing)
    }
  }
}

function releaseTestLock (lock) {
  if (!lock) return

  const existing = readExistingLock()
  if (existing?.pid === lock.pid && existing?.hostname === lock.hostname) {
    fs.rmSync(lockPath, { force: true })
  }
}

let activeLock = null

exports.mochaHooks = {
  beforeAll () {
    activeLock = acquireTestLock()
  },

  afterAll () {
    releaseTestLock(activeLock)
    activeLock = null
  }
}
