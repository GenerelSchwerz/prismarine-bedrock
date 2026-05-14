const BotState = require('./state')
const pluginLoader = require('./plugin-loader')
const version = require('./version')

function createBot (options) {
  const bot = new BotState(options)
  bot.start()
  return bot
}

module.exports = {
  BotState,
  createBot,
  pluginLoader,
  ...version
}
