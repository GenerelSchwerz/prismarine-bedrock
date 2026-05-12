const BotState = require('./state')

function createBot (options) {
  const bot = new BotState(options)
  bot.start()
  return bot
}

module.exports = {
  BotState,
  createBot
}
