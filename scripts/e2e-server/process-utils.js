"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

async function runChecked(bin, args, cwd) {
  console.log(`${bin} ${args.join(" ")}`);
  await new Promise((resolve, reject) => {
    const shell = os.platform() === "win32" && /\.(bat|cmd)$/i.test(bin);
    const child = spawn(bin, args, { cwd, stdio: "inherit", shell });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

function venvPythonBin(instance) {
  return os.platform() === "win32"
    ? path.join(instance.dir, ".venv", "Scripts", "python.exe")
    : path.join(instance.dir, ".venv", "bin", "python");
}

function endstoneBin(instance) {
  return os.platform() === "win32"
    ? path.join(instance.dir, ".venv", "Scripts", "endstone.exe")
    : path.join(instance.dir, ".venv", "bin", "endstone");
}

function endstoneArgs(instance, options = {}) {
  const args = [
    "--server-folder",
    options.serverFolder || instance.dir,
    "--no-confirm"
  ];

  if (endstoneSupportsInteractive(instance)) {
    args.push(options.interactive === false ? "--no-interactive" : "--interactive");
  }

  return args;
}

function endstoneSupportsInteractive(instance) {
  try {
    const output = execFileSync(endstoneBin(instance), ["--help"], {
      cwd: instance.dir,
      encoding: "utf8",
      timeout: 10000
    });
    return output.includes("--interactive");
  } catch {
    return true;
  }
}

function endstoneEnv(instance, options = {}) {
  const extra = {};
  if (options.packetRecorder || options.scenario) extra.E2E_ENDSTONE_PACKET_RECORDER = "1";
  if (options.scenario) extra.E2E_ENDSTONE_SCENARIO = options.scenario;
  if (options.packetRecorderPlayers) extra.E2E_PACKET_RECORDER_PLAYERS = options.packetRecorderPlayers;
  if (options.packetRecorderSplitByPlayer) extra.E2E_PACKET_RECORDER_SPLIT_BY_PLAYER = "1";
  if (options.repoRoot) extra.E2E_REPO_ROOT = options.repoRoot;
  if (os.platform() !== "win32") return { LD_LIBRARY_PATH: instance.dir, ...extra };

  const pathEntries = [
    options.serverFolder || instance.dir,
    endstoneInternalDir(instance),
    path.join(instance.dir, ".venv", "Scripts"),
    pythonHome(instance),
    path.join(instance.dir, ".venv", "Lib", "site-packages", "numpy.libs"),
    process.env.PATH || ""
  ].filter(Boolean);

  return { PATH: pathEntries.join(path.delimiter), ...extra };
}

function endstoneInternalDir(instance) {
  return path.join(instance.dir, ".venv", "Lib", "site-packages", "endstone", "_internal");
}

function pythonHome(instance) {
  const cfg = path.join(instance.dir, ".venv", "pyvenv.cfg");
  try {
    const text = fs.readFileSync(cfg, "utf8");
    const match = text.match(/^home\s*=\s*(.+)$/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function clientEnv(targetInstances) {
  if (targetInstances.length !== 1) return {};
  const instance = targetInstances[0];
  return {
    HOST: process.env.HOST || "127.0.0.1",
    PORT: String(instance.bedrockPort),
    E2E_SERVER_TARGET: instance.name,
    E2E_BEDROCK_PLAYER_NAME_PREFIX: instance.type === "java" ? "." : "",
    E2E_BEDROCK_COMMAND_PACKET: instance.type === "endstone" ? "server_command_file" : "command_request"
  };
}

module.exports = {
  runChecked,
  venvPythonBin,
  endstoneBin,
  endstoneArgs,
  endstoneEnv,
  clientEnv
};
