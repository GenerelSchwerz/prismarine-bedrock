'use strict'

const assert = require('assert')
const { commandGiveItem } = require('../helpers/commands')

describe('live command helpers', function () {
  const previousTarget = process.env.E2E_SERVER_TARGET

  afterEach(function () {
    if (previousTarget == null) delete process.env.E2E_SERVER_TARGET
    else process.env.E2E_SERVER_TARGET = previousTarget
  })

  it('keeps Java-style potion component syntax for Geyser targets', function () {
    process.env.E2E_SERVER_TARGET = 'java-1'

    assert.deepStrictEqual(
      commandGiveItem('minecraft:potion[minecraft:potion_contents={potion:"minecraft:water"}]'),
      { name: 'minecraft:potion[minecraft:potion_contents={potion:"minecraft:water"}]' }
    )
  })

  it('uses Bedrock potion data values for Endstone targets', function () {
    process.env.E2E_SERVER_TARGET = 'endstone-1'

    assert.deepStrictEqual(
      commandGiveItem('minecraft:potion[minecraft:potion_contents={potion:"minecraft:water"}]'),
      { name: 'minecraft:potion', data: 0 }
    )

    assert.deepStrictEqual(
      commandGiveItem('minecraft:splash_potion[minecraft:potion_contents={potion:"minecraft:fire_resistance"}]'),
      { name: 'minecraft:splash_potion', data: 12 }
    )
  })
})
