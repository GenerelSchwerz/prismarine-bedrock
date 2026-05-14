"use strict";

const { findAvailablePort } = require("./network");

async function assignAutoPorts(instances) {
  const reservedTcp = new Set();
  const reservedUdp = new Set();

  for (const instance of instances) {
    if (instance.type !== "java") continue;
    const previous = instance.javaPort;
    instance.javaPort = await findAvailablePort(previous, "tcp", reservedTcp);
    reservedTcp.add(instance.javaPort);
    instance.autoPortChanges = {
      ...instance.autoPortChanges,
      javaPort: previous === instance.javaPort ? null : previous
    };
  }

  for (const instance of instances) {
    const previous = instance.bedrockPort;
    instance.bedrockPort = await findAvailablePort(previous, "udp", reservedUdp);
    reservedUdp.add(instance.bedrockPort);
    instance.autoPortChanges = {
      ...instance.autoPortChanges,
      bedrockPort: previous === instance.bedrockPort ? null : previous
    };

    if (instance.type === "endstone") {
      const previousV6 = instance.bedrockPortV6;
      instance.bedrockPortV6 = await findAvailablePort(previousV6, "udp", reservedUdp);
      reservedUdp.add(instance.bedrockPortV6);
      instance.autoPortChanges = {
        ...instance.autoPortChanges,
        bedrockPortV6: previousV6 === instance.bedrockPortV6 ? null : previousV6
      };
    }
  }
}

function printPortMap(instances) {
  if (instances.length === 0) return;
  console.log("Auto-selected e2e ports:");
  for (const instance of instances) {
    const parts = [];
    if (instance.type === "java") parts.push(`java tcp ${instance.javaPort}`);
    parts.push(`bedrock udp ${instance.bedrockPort}`);
    if (instance.type === "endstone") parts.push(`bedrock udp6 ${instance.bedrockPortV6}`);
    const changed = changedPorts(instance);
    const suffix = changed.length > 0 ? ` (${changed.join(", ")})` : "";
    console.log(`  ${instance.name}: ${parts.join(", ")}${suffix}`);
  }
}

function changedPorts(instance) {
  const changes = [];
  if (instance.autoPortChanges?.javaPort !== null && instance.autoPortChanges?.javaPort !== undefined) {
    changes.push(`was java ${instance.autoPortChanges.javaPort}`);
  }
  if (instance.autoPortChanges?.bedrockPort !== null && instance.autoPortChanges?.bedrockPort !== undefined) {
    changes.push(`was bedrock ${instance.autoPortChanges.bedrockPort}`);
  }
  if (instance.autoPortChanges?.bedrockPortV6 !== null && instance.autoPortChanges?.bedrockPortV6 !== undefined) {
    changes.push(`was bedrock v6 ${instance.autoPortChanges.bedrockPortV6}`);
  }
  return changes;
}

module.exports = {
  assignAutoPorts,
  printPortMap
};
