"use strict";

const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

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

function endstoneEnv(instance) {
  return os.platform() === "win32" ? {} : { LD_LIBRARY_PATH: instance.dir };
}

function clientEnv(targetInstances) {
  if (targetInstances.length !== 1) return {};
  const instance = targetInstances[0];
  return {
    HOST: process.env.HOST || "127.0.0.1",
    PORT: String(instance.bedrockPort),
    E2E_SERVER_TARGET: instance.name
  };
}

module.exports = {
  runChecked,
  venvPythonBin,
  endstoneBin,
  endstoneEnv,
  clientEnv
};
