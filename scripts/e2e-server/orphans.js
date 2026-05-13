"use strict";

const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { E2E_ROOT, ROOT } = require("./paths");

async function cleanupOrphans(options = {}) {
  const dryRun = !!options.dryRun;
  const processes = await findE2eProcesses();
  const processMap = new Map(processes.map((processInfo) => [processInfo.pid, processInfo]));
  const targets = processes
    .filter((processInfo) => processInfo.pid !== process.pid && isE2eProcess(processInfo) && !hasLiveLauncherAncestor(processInfo, processMap))
    .sort((left, right) => right.pid - left.pid);

  if (targets.length === 0) {
    console.log("No orphaned e2e server processes found.");
  } else {
    console.log(`${dryRun ? "Would stop" : "Stopping"} ${targets.length} orphaned e2e server process${targets.length === 1 ? "" : "es"}:`);
    for (const target of targets) {
      console.log(`  pid ${target.pid}: ${target.commandLine || target.executablePath || "<unknown command>"}`);
    }

    if (!dryRun) {
      await killProcesses(targets);
    }
  }

  const locks = await cleanupStaleTestLocks({ dryRun });
  if (locks.removed.length > 0 || locks.kept.length > 0) {
    for (const lock of locks.removed) {
      console.log(`${dryRun ? "Would remove" : "Removed"} stale test lock: ${path.relative(ROOT, lock.file)}`);
    }
    for (const lock of locks.kept) {
      console.log(`Kept active test lock: ${path.relative(ROOT, lock.file)} (pid ${lock.pid})`);
    }
  }

  return {
    processes: targets.length,
    staleLocks: locks.removed.length,
    activeLocks: locks.kept.length
  };
}

async function findE2eProcesses() {
  const processes = os.platform() === "win32"
    ? await findWindowsProcesses()
    : await findPosixProcesses();
  return processes.filter((processInfo) => Number.isInteger(processInfo.pid) && processInfo.pid > 0);
}

async function findWindowsProcesses() {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine | ConvertTo-Json -Compress"
  ].join("; ");
  const output = await execFileText("powershell.exe", ["-NoProfile", "-Command", script]);
  const parsed = JSON.parse(output || "[]");
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries
    .map((entry) => ({
      pid: Number(entry.ProcessId),
      parentPid: Number(entry.ParentProcessId),
      executablePath: entry.ExecutablePath || "",
      commandLine: entry.CommandLine || ""
    }))
    .filter(Boolean);
}

async function findPosixProcesses() {
  const output = await execFileText("ps", ["-eo", "pid=,ppid=,args="]);
  return output.split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
      if (!match) return null;
      return {
        pid: Number(match[1]),
        parentPid: Number(match[2]),
        executablePath: "",
        commandLine: match[3] || ""
      };
    })
    .filter(Boolean);
}

function isE2eProcess(processInfo) {
  if (!Number.isInteger(processInfo.pid) || processInfo.pid <= 0) return false;
  const haystack = `${processInfo.executablePath || ""}\n${processInfo.commandLine || ""}`.toLowerCase();
  const e2eRoot = path.resolve(E2E_ROOT).toLowerCase();
  return haystack.includes(e2eRoot);
}

function isLauncherProcess(processInfo) {
  const commandLine = (processInfo.commandLine || "").toLowerCase();
  return commandLine.includes("scripts/e2e-servers.js") && commandLine.includes("launch");
}

function hasLiveLauncherAncestor(processInfo, processMap) {
  const seen = new Set([processInfo.pid]);
  let parentPid = processInfo.parentPid;

  while (Number.isInteger(parentPid) && parentPid > 0 && !seen.has(parentPid)) {
    seen.add(parentPid);
    const parent = processMap.get(parentPid);
    if (!parent) return false;
    if (isLauncherProcess(parent)) return true;
    parentPid = parent.parentPid;
  }

  return false;
}

async function killProcesses(targets) {
  if (os.platform() === "win32") {
    await Promise.allSettled(targets.map((target) => {
      return execFileText("taskkill.exe", ["/pid", String(target.pid), "/t", "/f"]).catch((err) => {
        if (!/not found|no running instance|not exist/i.test(err.message)) throw err;
      });
    }));
    return;
  }

  for (const target of targets) {
    try {
      process.kill(target.pid, "SIGTERM");
    } catch (err) {
      if (err.code !== "ESRCH") throw err;
    }
  }
}

async function cleanupStaleTestLocks(options = {}) {
  const dryRun = !!options.dryRun;
  const removed = [];
  const kept = [];
  const entries = await fsp.readdir(ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !/^\.test-lock\..+\.json$/.test(entry.name)) continue;

    const file = path.join(ROOT, entry.name);
    const lock = await readLock(file);
    if (lock?.hostname !== os.hostname() || isProcessAlive(lock?.pid)) {
      if (lock?.pid) kept.push({ file, pid: lock.pid });
      continue;
    }

    removed.push({ file, pid: lock?.pid || null });
    if (!dryRun) await fsp.rm(file, { force: true });
  }

  return { removed, kept };
}

async function readLock(file) {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

function execFileText(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { encoding: "utf8", windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        err.message = `${err.message}${stderr ? `\n${stderr}` : ""}`;
        reject(err);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

module.exports = { cleanupOrphans };
