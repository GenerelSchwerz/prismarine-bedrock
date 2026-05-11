'use strict'

function bedrockPlayerName (username) {
  if (username.startsWith('.')) return username
  return `.${username}`
}

function sendCommand (botState, text) {
  botState.command(text)
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
  givePlayer,
  sendCommand,
  setPlayerGamemode,
  teleportPlayer
}
