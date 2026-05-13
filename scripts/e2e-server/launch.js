"use strict";

const path = require("path");
const { createRuntime } = require("./runtime");
const { ROOT } = require("./paths");
const { resolvePaperVersion } = require("./downloads");
const { endstoneBin, endstoneArgs, endstoneEnv } = require("./process-utils");
const { isUdpPortInUse, waitForBedrockPing } = require("./network");

async function launchTargets(targetInstances, options) {
  for (const instance of targetInstances) {
    if (instance.type === "java" && !instance.paperVersion) {
      instance.paperVersion = await resolvePaperVersion(options.paperVersion);
    }
  }
  const runtime = await createRuntime(targetInstances, options);
  for (const instance of targetInstances) {
    if (await isUdpPortInUse(instance.bedrockPort)) {
      const host = process.env.HOST || "127.0.0.1";
      console.log(`[${instance.name}] Bedrock UDP port ${instance.bedrockPort} is already in use; waiting for status ping...`);
      const advertisement = await waitForBedrockPing(host, instance.bedrockPort, options.serverReadyTimeoutMs);
      runtime.registerExternalServer(instance, `Bedrock UDP port ${instance.bedrockPort} is already in use`, advertisement);
      continue;
    }

    if (instance.type === "java") {
      runtime.launch(instance.name, "server", options.javaBin, [
        "-Xms512M",
        "-Xmx2G",
        "-jar",
        path.join(instance.dir, "paper.jar"),
        "nogui"
      ], instance.dir, {}, { readyPattern: serverReadyPattern(instance) });
    }

    if (instance.type === "endstone") {
      runtime.launch(instance.name, "server", endstoneBin(instance), endstoneArgs(instance, {
        serverFolder: instance.dir,
        interactive: true
      }), instance.dir, endstoneEnv(instance, {
        serverFolder: instance.dir,
        packetRecorder: options.endstonePacketRecorder
      }), { readyPattern: serverReadyPattern(instance) });
    }
  }

  if (runtime.processes.size === 0) return;
  runtime.startConsole();
  console.log(`Server session logs: ${runtime.sessionDir}`);
  console.log("Commands: /client <cmd>, /java <cmd>, /java-1 <cmd>, /endstone <cmd>, /endstone-1 <cmd>, /all <cmd>, /help, /quit.");
  if (options.client) {
    void runtime.startClientRuns(options.client);
  }
  await runtime.waitForExit();
  if (options.exitAfterClient && runtime.clientExitCode !== null) {
    process.exitCode = runtime.clientExitCode;
  }
}

function serverReadyPattern(instance) {
  if (instance.type === "java") return /\bDone \([^)]+\)! For help, type "help"/;
  return /\bServer started\./;
}

module.exports = { launchTargets };
