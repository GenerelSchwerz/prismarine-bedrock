'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const {
  activeScenarioPlayers,
  hasCompletedScenarioEnd,
  readScenarioMarkers,
  recorderPathForInstance,
  summarizeScenarioProgress
} = require('../../scripts/e2e-server/runtime')

describe('e2e server runtime helpers', function () {
  it('detects completed scenario end markers after player quit', function () {
    assert.strictEqual(hasCompletedScenarioEnd([
      { type: 'scenario_complete', player: 'Steve' },
      { type: 'scenario_end', player: 'Steve', status: 'complete' }
    ]), true)

    assert.strictEqual(hasCompletedScenarioEnd([
      { type: 'scenario_complete', player: 'Steve' },
      { type: 'scenario_end', player: 'Steve', status: 'abandoned' }
    ]), false)
  })

  it('tracks active recorded players from join and quit markers', function () {
    assert.deepStrictEqual(activeScenarioPlayers([
      { type: 'player_join', player: 'Steve' },
      { type: 'player_join', player: 'Alex' },
      { type: 'scenario_end', player: 'Steve', status: 'complete' },
      { type: 'player_quit', player: 'Steve' }
    ]), ['Alex'])

    assert.deepStrictEqual(activeScenarioPlayers([
      { type: 'player_join', player: 'Steve' },
      { type: 'player_quit', player: 'Steve' }
    ]), [])
  })

  it('reads only marker objects from compact packet recorder files', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bedrock-test-runtime-'))
    const file = path.join(dir, 'packets.jsonl')
    fs.writeFileSync(file, [
      JSON.stringify({ type: 'recorder_start' }),
      JSON.stringify(['p', 1, 2, 'r']),
      '{ "type": "scenario_complete"',
      JSON.stringify({ type: 'scenario_end', status: 'complete' })
    ].join('\n'))

    assert.deepStrictEqual(readScenarioMarkers(file), [
      { type: 'recorder_start' },
      { type: 'scenario_end', status: 'complete' }
    ])
  })

  it('resolves recorder paths the same way the Endstone process sees them', function () {
    const previous = process.env.E2E_PACKET_RECORD_FILE
    try {
      delete process.env.E2E_PACKET_RECORD_FILE
      assert.strictEqual(
        recorderPathForInstance({ dir: path.join('tmp', 'endstone-bds') }),
        path.join('tmp', 'endstone-bds', 'logs', 'packet-recorder.jsonl')
      )

      process.env.E2E_PACKET_RECORD_FILE = 'logs/custom.jsonl'
      assert.strictEqual(
        recorderPathForInstance({ dir: path.resolve('tmp', 'endstone-bds') }),
        path.resolve('tmp', 'endstone-bds', 'logs', 'custom.jsonl')
      )

      process.env.E2E_PACKET_RECORD_FILE = path.resolve('logs', 'absolute.jsonl')
      assert.strictEqual(
        recorderPathForInstance({ dir: path.resolve('tmp', 'endstone-bds') }),
        path.resolve('logs', 'absolute.jsonl')
      )
    } finally {
      if (previous === undefined) delete process.env.E2E_PACKET_RECORD_FILE
      else process.env.E2E_PACKET_RECORD_FILE = previous
    }
  })

  it('summarizes scenario progress for long-running human captures', function () {
    const startedAt = Date.now() - 12000
    assert.match(summarizeScenarioProgress([{ markers: [] }], startedAt), /waiting for recorder markers/)
    assert.match(summarizeScenarioProgress([{
      markers: [
        { type: 'player_join', player: 'Alex' },
        { type: 'step_start', step: 'open_table' }
      ]
    }], startedAt), /step open_table active/)
    assert.match(summarizeScenarioProgress([{
      markers: [
        { type: 'player_join', player: 'Alex' },
        { type: 'scenario_complete', player: 'Alex' }
      ]
    }], startedAt), /Alex still connected/)
  })
})
