'use strict'

const assert = require('assert')
const registry = require('prismarine-registry')('bedrock_1.26.10')
const Block = require('prismarine-block')(registry)
const SubChunk = require('prismarine-chunk/src/bedrock/1.26/SubChunk')
const Stream = require('prismarine-chunk/src/bedrock/common/Stream')
const { StorageType } = require('prismarine-chunk/src/bedrock/common/constants')

function singleValueSubchunk (networkRuntimeId) {
  const stream = new Stream()
  stream.writeUInt8(9) // subchunk version
  stream.writeUInt8(1) // storage count
  stream.writeUInt8(0) // subchunk y
  stream.writeUInt8(1) // runtime palette, 0 bits per block
  stream.writeVarInt(networkRuntimeId << 1)
  return stream.getBuffer()
}

describe('Bedrock 1.26 subchunk runtime palette decoding', function () {
  it('translates network runtime IDs to Prismarine block state IDs', function () {
    const subchunk = new SubChunk(registry, Block, { y: 0 })
    subchunk.decode(StorageType.Runtime, singleValueSubchunk(3610))

    const block = subchunk.getBlock(undefined, 0, 0, 0, 0)
    assert.strictEqual(registry.blockStates[3610].name, 'emerald_block')
    assert.strictEqual(block.name, 'emerald_block')
    assert.strictEqual(block.stateId, registry.blocksByName.emerald_block.defaultState)
  })
})
