'use strict'

const assert = require('assert')
const {
  e2eTargetFamily
} = require('../helpers/e2e-targets')

describe('e2e target helpers', function () {
  it('maps launcher targets to test target families', function () {
    assert.strictEqual(e2eTargetFamily('endstone-1'), 'endstone')
    assert.strictEqual(e2eTargetFamily('endstone-2'), 'endstone')
    assert.strictEqual(e2eTargetFamily('java-1'), 'geyser')
    assert.strictEqual(e2eTargetFamily('geyser-1'), 'geyser')
    assert.strictEqual(e2eTargetFamily('port-19132'), null)
    assert.strictEqual(e2eTargetFamily(''), null)
  })
})
