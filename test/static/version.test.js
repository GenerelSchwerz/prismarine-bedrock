'use strict'

const assert = require('assert')
const path = require('path')
const {
  DEFAULT_BEDROCK_VERSION,
  bedrockRegistryName,
  bedrockVersionFromEnv,
  minecraftDataBedrockDir,
  normalizeBedrockVersion
} = require('../../src/version')

describe('Bedrock version helpers', function () {
  it('normalizes minecraft-data shorthand versions for protocol consumers', function () {
    assert.strictEqual(DEFAULT_BEDROCK_VERSION, '1.26.10')
    assert.strictEqual(normalizeBedrockVersion('26.10'), '1.26.10')
    assert.strictEqual(normalizeBedrockVersion('1.26.10'), '1.26.10')
  })

  it('builds registry and schema paths from the same version source', function () {
    assert.strictEqual(bedrockRegistryName('26.10'), 'bedrock_1.26.10')
    assert.strictEqual(bedrockVersionFromEnv({ MC_VERSION: '26.10' }), '1.26.10')
    assert.strictEqual(
      minecraftDataBedrockDir('26.10', 'repo-root'),
      path.join('repo-root', 'node_modules', 'minecraft-data', 'minecraft-data', 'data', 'bedrock', '1.26.10')
    )
  })
})
