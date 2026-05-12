'use strict'

function bedrockPlayerName (username) {
  if (username.startsWith('.')) return username
  return `.${username}`
}

function sendCommand (botState, text) {
  botState.command(text)
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function commandBlockName (block) {
  return block.replace(/^minecraft:/, '').split('[')[0]
}

async function setBlockIfNeeded (botState, pos, block, delayMs = 150) {
  const expectedName = commandBlockName(block)
  const currentBlock = await botState.getBlock?.(pos)

  if (currentBlock?.name === expectedName) return false

  sendCommand(botState, `setblock ${pos.x} ${pos.y} ${pos.z} ${block}`)
  if (delayMs > 0) await sleep(delayMs)
  return true
}

function clearPlayer (botState, username) {
  sendCommand(botState, `clear ${bedrockPlayerName(username)}`)
}

function givePlayer (botState, username, itemName, count = 1) {
  sendCommand(botState, `give ${bedrockPlayerName(username)} minecraft:${itemName} ${count}`)
}

function setPlayerGamemode (botState, username, gamemode) {
  sendCommand(botState, `gamemode ${gamemode} ${bedrockPlayerName(username)}`)
}

function teleportPlayer (botState, username, x, y, z) {
  sendCommand(botState, `tp ${bedrockPlayerName(username)} ${x} ${y} ${z}`)
}

module.exports = {
  bedrockPlayerName,
  clearPlayer,
  commandBlockName,
  givePlayer,
  sendCommand,
  setBlockIfNeeded,
  setPlayerGamemode,
  teleportPlayer
}
