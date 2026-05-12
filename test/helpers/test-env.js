const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = process.env.BOT_USERNAME || "OpBot";
const OFFLINE = process.env.OFFLINE !== "false";
const VERSION = process.env.MC_VERSION || "1.21.130";
const SETUP_DELAY_MS = Number(process.env.SETUP_DELAY_MS || 500);

module.exports = {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
};
