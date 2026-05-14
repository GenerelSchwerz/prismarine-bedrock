'use strict'

const assert = require('assert')
const path = require('path')

const {
  isLauncherProcess
} = require('../../scripts/e2e-server/orphans')

const {
  packetRecorderRequestedByCommand,
  processMatchesInstance
} = require('../../scripts/e2e-server/status')

describe('e2e server status', function () {
  it('matches processes that were launched from an instance directory', function () {
    const instance = {
      dir: path.resolve('.e2e-servers/endstone-bds')
    }
    const processInfo = {
      executablePath: '',
      commandLine: `endstone --server-folder ${instance.dir} --interactive`
    }

    assert.strictEqual(processMatchesInstance(processInfo, instance), true)
  })

  it('does not claim unrelated e2e processes as configured instances', function () {
    const instance = {
      dir: path.resolve('.e2e-servers/endstone-bds')
    }
    const processInfo = {
      executablePath: '',
      commandLine: `node ${path.resolve('scripts/recorded-bds-relay.js')} --listen-port=19137`
    }

    assert.strictEqual(processMatchesInstance(processInfo, instance), false)
  })

  it('detects recorder use from standalone launcher commands', function () {
    assert.strictEqual(
      packetRecorderRequestedByCommand('node scripts/e2e-servers.js launch --target=endstone --endstone-packet-recorder'),
      true
    )
    assert.strictEqual(
      packetRecorderRequestedByCommand("powershell $env:E2E_ENDSTONE_PACKET_RECORDER='1'; node scripts/e2e-servers.js launch"),
      true
    )
    assert.strictEqual(
      packetRecorderRequestedByCommand('node scripts/e2e-servers.js launch --target=endstone'),
      false
    )
  })

  it('detects Windows launcher command paths', function () {
    assert.strictEqual(
      isLauncherProcess({
        commandLine: 'node scripts\\e2e-servers.js launch --target=endstone'
      }),
      true
    )
  })
})
