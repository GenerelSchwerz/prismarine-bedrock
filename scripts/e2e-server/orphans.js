"use strict";

const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { E2E_ROOT, ROOT } = require("./paths");

async function cleanupOrphans(options = {}) {
  const dryRun = !!options.dryRun;
  const includeManaged = !!options.includeManaged;
  const processes = await findE2eProcesses();
  const processMap = new Map(processes.map((processInfo) => [processInfo.pid, processInfo]));
  const e2eProcesses = processes
    .filter((processInfo) => processInfo.pid !== process.pid && isE2eProcess(processInfo));
  const managedLaunchers = includeManaged
    ? findManagedLaunchers(processes, e2eProcesses, processMap)
    : [];
  const managedLauncherPids = new Set(managedLaunchers.map((processInfo) => processInfo.pid));
  const activeManaged = e2eProcesses
    .filter((processInfo) => hasLiveLauncherAncestor(processInfo, processMap))
    .sort((left, right) => right.pid - left.pid);
  const unmanagedTargets = e2eProcesses
    .filter((processInfo) => !hasLiveLauncherAncestor(processInfo, processMap))
    .sort((left, right) => right.pid - left.pid);
  const targets = [...managedLaunchers, ...unmanagedTargets]
    .filter((processInfo) => !hasManagedLauncherAncestor(processInfo, managedLauncherPids, processMap));

  if (targets.length === 0) {
    console.log("No orphaned e2e server processes found.");
  } else {
    console.log(`${dryRun ? "Would stop" : "Stopping"} ${targets.length} orphaned e2e server process${targets.length === 1 ? "" : "es"}:`);
    for (const target of targets) {
      console.log(`  pid ${target.pid}: ${formatProcessCommand(target)}`);
    }

    if (!dryRun) {
      await killProcesses(targets);
    }
  }

  if (activeManaged.length > 0 && !includeManaged) {
    console.log(`Skipped ${activeManaged.length} active e2e server process${activeManaged.length === 1 ? "" : "es"} still owned by a live launcher:`);
    for (const active of activeManaged) {
      const launcher = findLiveLauncherAncestor(active, processMap);
      const suffix = launcher ? ` (launcher pid ${launcher.pid})` : "";
      console.log(`  pid ${active.pid}${suffix}: ${formatProcessCommand(active)}`);
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
    activeManaged: includeManaged ? 0 : activeManaged.length,
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

function findManagedLaunchers(processes, e2eProcesses, processMap) {
  const launcherPids = new Set();
  for (const processInfo of e2eProcesses) {
    const launcher = findLiveLauncherAncestor(processInfo, processMap);
    if (launcher && launcher.pid !== process.pid) launcherPids.add(launcher.pid);
  }

  return processes
    .filter((processInfo) => launcherPids.has(processInfo.pid))
    .sort((left, right) => right.pid - left.pid);
}

function hasManagedLauncherAncestor(processInfo, managedLauncherPids, processMap) {
  if (managedLauncherPids.size === 0) return false;
  const seen = new Set([processInfo.pid]);
  let parentPid = processInfo.parentPid;

  while (Number.isInteger(parentPid) && parentPid > 0 && !seen.has(parentPid)) {
    if (managedLauncherPids.has(parentPid)) return true;
    seen.add(parentPid);
    const parent = processMap.get(parentPid);
    if (!parent) return false;
    parentPid = parent.parentPid;
  }

  return false;
}

function formatProcessCommand(processInfo) {
  const command = processInfo.commandLine || processInfo.executablePath || "<unknown command>";
  const normalized = String(command).replace(/\s+/g, " ").trim();
  const maxLength = 240;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function hasLiveLauncherAncestor(processInfo, processMap) {
  return !!findLiveLauncherAncestor(processInfo, processMap);
}

function findLiveLauncherAncestor(processInfo, processMap) {
  const seen = new Set([processInfo.pid]);
  let parentPid = processInfo.parentPid;

  while (Number.isInteger(parentPid) && parentPid > 0 && !seen.has(parentPid)) {
    seen.add(parentPid);
    const parent = processMap.get(parentPid);
    if (!parent) return null;
    if (isLauncherProcess(parent)) return parent;
    parentPid = parent.parentPid;
  }

  return null;
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
