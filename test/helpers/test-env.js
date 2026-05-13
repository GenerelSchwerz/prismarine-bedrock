const { bedrockVersionFromEnv } = require("../../src/version");

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 19132;
const USERNAME = effectiveUsername(process.env.BOT_USERNAME || "OpBot");
const OFFLINE = process.env.OFFLINE !== "false";
const VERSION = bedrockVersionFromEnv();
const SETUP_DELAY_MS = Number(process.env.SETUP_DELAY_MS || 500);

function effectiveUsername(username) {
  const name = String(username);
  const prefix = process.env.E2E_BEDROCK_PLAYER_NAME_PREFIX || "";
  const configuredMax = process.env.E2E_BEDROCK_USERNAME_MAX;
  const max = configuredMax != null && configuredMax !== ""
    ? Number(configuredMax)
    : (prefix ? 16 - prefix.length : null);

  if (max == null || !Number.isInteger(max) || max <= 0 || name.length <= max) return name;
  return name.slice(0, max);
}

module.exports = {
  HOST,
  PORT,
  USERNAME,
  OFFLINE,
  VERSION,
  SETUP_DELAY_MS
};
