"use strict";

const path = require("path");
const { E2E_ROOT, JAVA_BASE_DIR, ENDSTONE_BASE_DIR } = require("./paths");
const { normalizeWorld } = require("./options");

const JAVA_PORT = Number(process.env.E2E_JAVA_PORT || 25565);
const GEYSER_BEDROCK_PORT = Number(process.env.E2E_GEYSER_PORT || 19133);
const ENDSTONE_BEDROCK_PORT = Number(process.env.E2E_ENDSTONE_PORT || 19132);

function buildInstances(selected, options) {
  const envProfiles = splitEnv("E2E_JAVA_PROFILES");
  const envJavaWorlds = splitEnv("E2E_JAVA_WORLDS").map(normalizeWorld);
  const envEndstoneWorlds = splitEnv("E2E_ENDSTONE_WORLDS").map(normalizeWorld);
  const javaProfiles = options.javaProfiles || (envProfiles.length > 0 ? envProfiles : null);
  const javaWorlds = options.javaWorlds || (envJavaWorlds.length > 0 ? envJavaWorlds : null);
  const endstoneWorlds = options.endstoneWorlds || (envEndstoneWorlds.length > 0 ? envEndstoneWorlds : null);
  const inferredJavaCount = Math.max(javaProfiles?.length || 0, javaWorlds?.length || 0);
  const inferredEndstoneCount = endstoneWorlds?.length || 0;
  const javaCount = selected.has("java") ? options.javaCount ?? (inferredJavaCount || Number(process.env.E2E_JAVA_COUNT || 1)) : 0;
  const endstoneCount = selected.has("endstone") ? options.endstoneCount ?? (inferredEndstoneCount || Number(process.env.E2E_ENDSTONE_COUNT || 1)) : 0;
  const instances = [];

  for (let index = 0; index < javaCount; index += 1) {
    instances.push({
      type: "java",
      index,
      name: `java-${index + 1}`,
      dir: index === 0 ? JAVA_BASE_DIR : path.join(E2E_ROOT, `java-geyser-${index + 1}`),
      javaPort: JAVA_PORT + index,
      bedrockPort: GEYSER_BEDROCK_PORT + index,
      profile: javaProfiles ? javaProfiles[index % javaProfiles.length] : null,
      world: javaWorlds ? javaWorlds[index % javaWorlds.length] : options.world,
      paperVersion: null
    });
  }

  for (let index = 0; index < endstoneCount; index += 1) {
    instances.push({
      type: "endstone",
      index,
      name: `endstone-${index + 1}`,
      dir: index === 0 ? ENDSTONE_BASE_DIR : path.join(E2E_ROOT, `endstone-bds-${index + 1}`),
      bedrockPort: ENDSTONE_BEDROCK_PORT + index,
      bedrockPortV6: 19134 + index,
      world: endstoneWorlds ? endstoneWorlds[index % endstoneWorlds.length] : options.world
    });
  }

  return instances;
}

function splitEnv(name) {
  return (process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean);
}

module.exports = { buildInstances };
