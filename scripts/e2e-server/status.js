"use strict";

const path = require("path");
const { isTcpPortInUse, isUdpPortInUse, waitForBedrockPing } = require("./network");
const {
  findE2eProcesses,
  findLiveLauncherAncestor,
  formatProcessCommand,
  isE2eProcess,
  isLauncherProcess
} = require("./orphans");

async function printStatus(instances, options = {}) {
  const host = process.env.HOST || "127.0.0.1";
  const processes = await findE2eProcesses();
  const processMap = new Map(processes.map((processInfo) => [processInfo.pid, processInfo]));
  const currentPid = process.pid;
  const launcherProcesses = processes
    .filter((processInfo) => processInfo.pid !== currentPid && isLauncherProcess(processInfo))
    .sort((left, right) => left.pid - right.pid);
  const e2eProcesses = processes
    .filter((processInfo) => processInfo.pid !== currentPid && isE2eProcess(processInfo))
    .sort((left, right) => left.pid - right.pid);
  const claimedPids = new Set();

  console.log("E2E instance status:");
  for (const instance of instances) {
    const instanceProcesses = e2eProcesses.filter((processInfo) => processMatchesInstance(processInfo, instance));
    for (const processInfo of instanceProcesses) claimedPids.add(processInfo.pid);
    await printInstanceStatus(instance, options, host, instanceProcesses, processMap);
  }

  const standalone = e2eProcesses.filter((processInfo) => !claimedPids.has(processInfo.pid));
  if (launcherProcesses.length > 0 || standalone.length > 0) {
    console.log("");
    console.log("Standalone e2e processes:");
    for (const launcher of launcherProcesses) {
      console.log(`  launcher pid ${launcher.pid}: ${formatProcessCommand(launcher)}`);
    }
    for (const processInfo of standalone) {
      const launcher = findLiveLauncherAncestor(processInfo, processMap);
      const suffix = launcher ? ` (launcher pid ${launcher.pid})` : "";
      console.log(`  pid ${processInfo.pid}${suffix}: ${formatProcessCommand(processInfo)}`);
    }
  } else {
    console.log("");
    console.log("Standalone e2e processes: none");
  }
}

async function printInstanceStatus(instance, options, host, instanceProcesses, processMap) {
  const parts = [];
  if (instance.type === "java") {
    parts.push(`java tcp ${instance.javaPort}: ${await portUseLabel(instance.javaPort, "tcp")}`);
  }
  parts.push(`bedrock udp ${instance.bedrockPort}: ${await bedrockUseLabel(host, instance.bedrockPort, options.serverReadyTimeoutMs)}`);
  if (instance.type === "endstone") {
    parts.push(`bedrock udp6 ${instance.bedrockPortV6}: ${await portUseLabel(instance.bedrockPortV6, "udp")}`);
    parts.push(`recorder: ${packetRecorderLabel(options, instanceProcesses, processMap)}`);
  }

  console.log(`  ${instance.name} (${instance.type}, ${instance.world}): ${parts.join("; ")}`);
  if (instanceProcesses.length === 0) {
    console.log("    process: not found");
    return;
  }

  for (const processInfo of instanceProcesses) {
    const launcher = findLiveLauncherAncestor(processInfo, processMap);
    const managed = launcher ? `running, launcher pid ${launcher.pid}` : "running, standalone";
    console.log(`    process: pid ${processInfo.pid} ${managed}`);
  }
}

async function bedrockUseLabel(host, port, timeoutMs = 120000) {
  if (!(await isUdpPortInUse(port))) return "free";
  try {
    const advertisement = await waitForBedrockPing(host, port, Math.min(timeoutMs, 3000));
    const version = advertisement?.version ? ` ${advertisement.version}` : "";
    const motd = advertisement?.motd ? ` ${advertisement.motd}` : "";
    return `used, ping ok${version}${motd}`.trim();
  } catch (err) {
    return `used, no Bedrock ping (${err.message})`;
  }
}

async function portUseLabel(port, protocol) {
  const inUse = protocol === "tcp" ? await isTcpPortInUse(port) : await isUdpPortInUse(port);
  return inUse ? "used" : "free";
}

function processMatchesInstance(processInfo, instance) {
  const haystack = `${processInfo.executablePath || ""}\n${processInfo.commandLine || ""}`.toLowerCase();
  const instanceDir = path.resolve(instance.dir).toLowerCase();
  return haystack.includes(instanceDir);
}

function packetRecorderLabel(options, instanceProcesses = [], processMap = new Map()) {
  if (options.endstonePacketRecorder || options.endstoneScenario) return "requested";

  for (const processInfo of instanceProcesses) {
    const launcher = findLiveLauncherAncestor(processInfo, processMap);
    const commandLine = `${launcher?.commandLine || ""}\n${processInfo.commandLine || ""}`;
    if (packetRecorderRequestedByCommand(commandLine)) return "detected";
  }

  return "not detected";
}

function packetRecorderRequestedByCommand(commandLine) {
  return /--endstone-packet-recorder\b/.test(commandLine) ||
    /--endstone-scenario(?:=|\s)/.test(commandLine) ||
    /\bE2E_ENDSTONE_PACKET_RECORDER\b\s*=?\s*['"]?1\b/i.test(commandLine);
}

module.exports = {
  bedrockUseLabel,
  packetRecorderLabel,
  packetRecorderRequestedByCommand,
  portUseLabel,
  printStatus,
  processMatchesInstance
};
