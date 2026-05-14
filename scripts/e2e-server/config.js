"use strict";

const crypto = require("crypto");

const FLOODGATE_ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function javaServerProperties(instance, options) {
  return [
    `motd=bedrock-test ${instance.name}`,
    `server-port=${instance.javaPort}`,
    "online-mode=false",
    "enforce-secure-profile=false",
    "allow-flight=true",
    "enable-command-block=true",
    "gamemode=creative",
    "difficulty=peaceful",
    "spawn-protection=0",
    "view-distance=6",
    "simulation-distance=4",
    `level-name=${worldName(instance, options)}`,
    `level-type=${javaLevelType(instance.world)}`,
    "generator-settings={}",
    ""
  ].join("\n");
}

function paperGlobalConfig() {
  return [
    "# e2e override: local bot tests send command_request bursts during setup.",
    "_version: 31",
    "packet-limiter:",
    "  all-packets:",
    "    action: KICK",
    "    interval: 7.0",
    "    max-packet-rate: 5000.0",
    "  kick-message: <red><lang:disconnect.exceeded_packet_rate>",
    "  overrides:",
    "    minecraft:place_recipe:",
    "      action: DROP",
    "      interval: 4.0",
    "      max-packet-rate: 1000.0",
    "spam-limiter:",
    "  incoming-packet-threshold: 10000",
    "  recipe-spam-increment: 1",
    "  recipe-spam-limit: 10000",
    "  tab-spam-increment: 1",
    "  tab-spam-limit: 10000",
    ""
  ].join("\n");
}

function geyserConfig(instance, options) {
  return [
    "bedrock:",
    "  address: 0.0.0.0",
    `  port: ${instance.bedrockPort}`,
    "  clone-remote-port: false",
    "java:",
    `  auth-type: ${options.geyserAuthType}`,
    "motd:",
    "  passthrough-motd: true",
    "  max-players: 100",
    "  passthrough-player-counts: true",
    "  integrated-ping-passthrough: true",
    "  ping-passthrough-interval: 3",
    "gameplay:",
    "  command-suggestions: true",
    "  show-coordinates: true",
    "  force-resource-packs: true",
    "  enable-integrated-pack: true",
    "advanced:",
    "  floodgate-key-file: key.pem",
    "  java:",
    "    use-direct-connection: true",
    "    disable-compression: true",
    "  bedrock:",
    "    broadcast-port: 0",
    "    validate-bedrock-login: false",
    "debug-mode: false",
    "config-version: 7",
    ""
  ].join("\n");
}

function javaOpsJson() {
  const ops = ["OpBot", ".OpBot"].map((name) => ({
    uuid: offlinePlayerUuid(name),
    name,
    level: 4,
    bypassesPlayerLimit: true
  }));

  ops.push({
    uuid: FLOODGATE_ZERO_UUID,
    name: ".OpBot",
    level: 4,
    bypassesPlayerLimit: true
  });

  return `${JSON.stringify(ops, null, 2)}\n`;
}

function offlinePlayerUuid(name) {
  const hash = crypto.createHash("md5").update(`OfflinePlayer:${name}`, "utf8").digest();
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function endstoneServerProperties(instance, options) {
  return [
    `server-name=bedrock-test ${instance.name}`,
    "gamemode=creative",
    "difficulty=peaceful",
    "allow-cheats=true",
    `server-port=${instance.bedrockPort}`,
    `server-portv6=${instance.bedrockPortV6 || 19134 + instance.index}`,
    "online-mode=false",
    `level-name=${worldName(instance, options)}`,
    `level-type=${bedrockLevelType(instance.world)}`,
    "view-distance=6",
    "tick-distance=4",
    "default-player-permission-level=operator",
    ""
  ].join("\n");
}

function worldName(instance, options) {
  if (instance.type === "java") {
    return `${instance.name}-${instance.world}-paper-${slug(instance.paperVersion || options.paperVersion)}`;
  }
  return `${instance.name}-${instance.world}`;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function javaLevelType(world) {
  return world === "superflat" ? "minecraft:flat" : "minecraft:normal";
}

function bedrockLevelType(world) {
  return world === "superflat" ? "FLAT" : "DEFAULT";
}

module.exports = {
  javaServerProperties,
  paperGlobalConfig,
  geyserConfig,
  javaOpsJson,
  endstoneServerProperties,
  worldName
};
