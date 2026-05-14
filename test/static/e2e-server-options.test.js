'use strict'

const assert = require('assert')

const {
  parseOptions,
  shellJoin,
  splitCommandLine
} = require('../../scripts/e2e-server/options')

describe('e2e server options', function () {
  it('preserves quoted client arguments passed after --client', function () {
    const options = parseOptions([
      '--target=java',
      '--client',
      'pnpm',
      'exec',
      'mocha',
      '--grep',
      'wooden pickaxe'
    ])

    assert.deepStrictEqual(options.clientArgs, [
      'pnpm',
      'exec',
      'mocha',
      '--grep',
      'wooden pickaxe'
    ])
    assert.strictEqual(options.client, 'pnpm exec mocha --grep "wooden pickaxe"')
  })

  it('splits a single --client command string while respecting quotes', function () {
    const options = parseOptions([
      '--target=java',
      '--client=pnpm exec mocha --grep "wooden pickaxe"'
    ])

    assert.deepStrictEqual(options.clientArgs, [
      'pnpm',
      'exec',
      'mocha',
      '--grep',
      'wooden pickaxe'
    ])
    assert.strictEqual(options.client, 'pnpm exec mocha --grep "wooden pickaxe"')
  })

  it('round-trips client command strings with escaped quotes', function () {
    assert.deepStrictEqual(
      splitCommandLine('node script.js --name "oak \\"planks\\""'),
      ['node', 'script.js', '--name', 'oak "planks"']
    )

    assert.strictEqual(
      shellJoin(['node', 'script.js', '--name', 'oak "planks"']),
      'node script.js --name "oak \\"planks\\""'
    )
  })

  it('enables automatic port selection from cli or environment', function () {
    const previous = process.env.E2E_AUTO_PORT
    try {
      delete process.env.E2E_AUTO_PORT
      assert.strictEqual(parseOptions([]).autoPort, false)
      assert.strictEqual(parseOptions(['--auto-port']).autoPort, true)

      process.env.E2E_AUTO_PORT = '1'
      assert.strictEqual(parseOptions([]).autoPort, true)
    } finally {
      if (previous === undefined) delete process.env.E2E_AUTO_PORT
      else process.env.E2E_AUTO_PORT = previous
    }
  })
})
