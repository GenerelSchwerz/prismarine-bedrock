"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { ROOT, RUNS_DIR } = require("./paths");
const { mkdir } = require("./fs-utils");
const { clientEnv } = require("./process-utils");

async function createRuntime(targetInstances, options) {
  const sessionId = new Date().toISOString().replace(/[:.]/g, "-");
  const sessionDir = path.join(RUNS_DIR, sessionId);
  await mkdir(sessionDir);
  const combined = fs.createWriteStream(path.join(sessionDir, "server-session.jsonl"), { flags: "a" });
  const commands = fs.createWriteStream(path.join(sessionDir, "commands.jsonl"), { flags: "a" });
  const processes = new Map();
  const activeRuns = new Map();
  const readyWaiters = [];
  let stopping = false;
  let stopPromise = null;
  let waitResolve = null;
  let signalCount = 0;
  let logsClosed = false;
  let stdinHandler = null;
  let clientRunCounter = 0;
  let clientTimeout = null;
  let launchedClientRuns = 0;
  let finishedClientRuns = 0;
  let scenarioMonitor = null;

  const runtime = {
    sessionDir,
    processes,
    activeRuns,
    clientExitCode: null,
    registerExternalServer(instance, reason, advertisement = null) {
      const record = {
        name: instance.name,
        kind: "server",
        child: null,
        external: true,
        log: fs.createWriteStream(path.join(sessionDir, `${instance.name}.jsonl`), { flags: "a" }),
        run: null,
        activeRuns,
        ready: true,
        readyPattern: null
      };
      processes.set(instance.name, record);
      writeEvent(record, combined, "external_server_ready", {
        reason,
        host: process.env.HOST || "127.0.0.1",
        port: instance.bedrockPort,
        motd: advertisement?.motd || null,
        version: advertisement?.version || null
      });
      const description = advertisement?.motd ? ` (${advertisement.motd})` : "";
      console.log(`[${instance.name}] using existing server: ${reason}${description}`);
      resolveReadyWaitersIfReady();
    },
    launch(name, kind, bin, args, cwd, extraEnv = {}, spawnOptions = {}) {
      const commandLine = [bin, ...args].join(" ").trim();
      const child = spawn(bin, args, {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
        shell: Boolean(spawnOptions.shell),
        env: { ...process.env, ...extraEnv }
      });
      const record = {
        name,
        kind,
        child,
        log: fs.createWriteStream(path.join(sessionDir, `${name}.jsonl`), { flags: "a" }),
        run: spawnOptions.run || null,
        activeRuns,
        ready: kind !== "server",
        readyPattern: spawnOptions.readyPattern || null,
        autoOppedPlayers: new Set()
      };
      processes.set(name, record);
      writeEvent(record, combined, "process_start", {
        command: commandLine,
        cwd,
        pid: child.pid || null,
        launcherPid: process.pid,
        usage: spawnOptions.usage || null
      });
      console.log(`[${consoleLabel(record)}] ${commandLine}`);
      console.log(`[${consoleLabel(record)}] spawned pid ${child.pid || "unknown"} (launcher pid ${process.pid})`);
      for (const line of launchUsageLines(spawnOptions.usage)) {
        console.log(`[${consoleLabel(record)}] ${line}`);
      }

      const stdoutHandler = createOutputHandler(record, combined, "stdout", runtime);
      const stderrHandler = createOutputHandler(record, combined, "stderr", runtime);
      child.stdout.on("data", stdoutHandler);
      child.stderr.on("data", stderrHandler);
      child.on("error", (err) => {
        writeEvent(record, combined, "process_error", { message: err.message });
      });
      child.on("exit", (code, signal) => {
        if (record.exited) return;
        record.exited = true;
        stdoutHandler.flush();
        stderrHandler.flush();
        writeEvent(record, combined, "process_exit", { code, signal });
        closeChildPipes(child);
        record.log.end();
        processes.delete(name);
        if (record.kind === "server" && !record.ready) {
          rejectReadyWaiters(new Error(`${name} exited before reporting ready.`));
        }
        if (record.run) {
          finishClientRun(record.run, activeRuns, combined);
          if (options.exitAfterClient) {
            finishedClientRuns += 1;
            const exitCode = signal ? 1 : code || 0;
            if (exitCode !== 0 || runtime.clientExitCode === null) {
              runtime.clientExitCode = exitCode;
            }
            if (finishedClientRuns >= launchedClientRuns) {
              if (clientTimeout) clearTimeout(clientTimeout);
              void runtime.stopAll("client_exit");
            }
          }
        }
        console.log(`[${consoleLabel(record)}] exited ${signal || code}`);
        maybeResolveWait();
      });
    },
    async startClientRuns(command, instances = targetInstances) {
      const targets = instances.length === 1 ? instances : [...instances];
      await Promise.all(targets.map((instance, index) => {
        return runtime.startClientRun(command, [instance], { shardIndex: index, shardTotal: targets.length });
      }));
    },
    async startClientRun(command, instances = targetInstances, runOptions = {}) {
      const runTargets = normalizeClientRunTargets(instances, targetInstances);
      const shardIndex = runOptions.shardIndex ?? 0;
      const shardTotal = runOptions.shardTotal ?? 1;
      try {
        await runtime.waitForServersReady();
      } catch (err) {
        console.error(`Client not started: ${err.message}`);
        if (options.exitAfterClient && runtime.clientExitCode === null) {
          runtime.clientExitCode = 1;
          void runtime.stopAll("client_start_failed");
        }
        return;
      }
      clientRunCounter += 1;
      launchedClientRuns += 1;
      const targetLabel = runTargets.map((instance) => instance.name).join("+");
      const id = `${String(clientRunCounter).padStart(3, "0")}-${safeFileLabel(targetLabel)}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
      const runDir = path.join(sessionDir, "client-runs", id);
      await mkdir(runDir);
      const run = {
        id,
        dir: runDir,
        targetNames: new Set(runTargets.map((instance) => instance.name)),
        shardIndex,
        shardTotal,
        commandFile: path.join(runDir, "server-commands.jsonl"),
        combined: fs.createWriteStream(path.join(runDir, "combined.jsonl"), { flags: "a" }),
        clientLog: fs.createWriteStream(path.join(runDir, "client.jsonl"), { flags: "a" }),
        serverLogs: new Map(),
        commandBridge: null
      };
      fs.closeSync(fs.openSync(run.commandFile, "a"));
      run.commandBridge = startServerCommandBridge(run.commandFile, runtime, commands, combined, run.targetNames);
      const startEvent = { ts: new Date().toISOString(), event: "client_run_start", run: id, dir: runDir, command, targets: [...run.targetNames], shardIndex, shardTotal };
      combined.write(`${JSON.stringify(startEvent)}\n`);
      run.combined.write(`${JSON.stringify(startEvent)}\n`);
      activeRuns.set(id, run);
      for (const record of processes.values()) {
        if (record.kind === "server" && run.targetNames.has(record.name)) {
          run.serverLogs.set(record.name, fs.createWriteStream(path.join(runDir, `${record.name}.jsonl`), { flags: "a" }));
        }
      }
      const name = `client-${id}`;
      console.log(`Client run logs (${targetLabel}): ${runDir}`);
      runtime.launch(name, "client", command, [], ROOT, {
        ...clientEnv(runTargets),
        E2E_CLIENT_RUN_INDEX: String(shardIndex),
        E2E_CLIENT_RUN_TOTAL: String(shardTotal),
        E2E_CLIENT_RUN_TARGETS: [...run.targetNames].join(","),
        E2E_SERVER_COMMAND_FILE: run.commandFile
      }, { shell: true, run });
      if (options.exitAfterClient && options.clientTimeoutMs !== null) {
        if (clientTimeout) clearTimeout(clientTimeout);
        clientTimeout = setTimeout(() => {
          if (runtime.clientExitCode === null) runtime.clientExitCode = 124;
          console.error(`Client timed out after ${options.clientTimeoutMs}ms; stopping servers.`);
          void runtime.stopAll("client_timeout");
        }, options.clientTimeoutMs);
        clientTimeout.unref();
      }
    },
    waitForServersReady() {
      if (serversReady()) return Promise.resolve();
      const pending = [...processes.values()]
        .filter((record) => record.kind === "server" && !record.ready)
        .map((record) => record.name)
        .join(", ");
      console.log(`Waiting for server readiness before starting client: ${pending}`);
      return new Promise((resolve, reject) => {
        const waiter = { resolve, reject, timer: null };
        waiter.timer = setTimeout(() => {
          const stillPending = [...processes.values()]
            .filter((record) => record.kind === "server" && !record.ready)
            .map((record) => record.name)
            .join(", ");
          removeReadyWaiter(waiter);
          reject(new Error(`Timed out after ${options.serverReadyTimeoutMs}ms waiting for server readiness: ${stillPending || "none"}`));
        }, options.serverReadyTimeoutMs);
        readyWaiters.push(waiter);
      });
    },
    markServerReady(record, line) {
      if (record.kind !== "server" || record.ready) return;
      if (!record.readyPattern || !record.readyPattern.test(line)) return;
      record.ready = true;
      writeEvent(record, combined, "server_ready", { line });
      console.log(`[${record.name}] ready`);
      resolveReadyWaitersIfReady();
    },
    maybeAutoOpPlayer(record, line) {
      if (!options.autoOp || record.kind !== "server" || record.external) return;
      const instance = targetInstances.find((candidate) => candidate.name === record.name);
      if (!instance || instance.type !== "java") return;
      const player = joinedPlayerName(line);
      if (!player || record.autoOppedPlayers.has(player)) return;
      record.autoOppedPlayers.add(player);
      sendServerCommand(record, `op ${quoteCommandArgument(player)}`, commands, combined, "auto_op");
    },
    startConsole() {
      process.stdin.setEncoding("utf8");
      process.stdin.resume();
      stdinHandler = (chunk) => {
        for (const rawLine of chunk.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line) continue;
          handleConsoleLine(line, runtime, commands, combined, targetInstances);
        }
      };
      process.stdin.on("data", stdinHandler);
    },
    startScenarioMonitor(instances = targetInstances) {
      if (!options.endstoneScenario || !options.exitAfterScenario) return;
      if (scenarioMonitor) scenarioMonitor.stop();
      scenarioMonitor = startScenarioMonitor(instances, runtime, combined, options);
    },
    stopAll(reason = "requested") {
      if (stopPromise) return stopPromise;
      stopPromise = stopAll(reason);
      return stopPromise;
    },
    waitForExit() {
      const handleSignal = (signal) => {
        signalCount += 1;
        const code = signal === "SIGINT" ? 130 : 143;
        if (runtime.clientExitCode === null) runtime.clientExitCode = code;
        process.exitCode = code;

        if (signalCount > 1) {
          writeSessionEvent(combined, "shutdown_force", { signal });
          forceKillProcesses(processes);
          setTimeout(() => process.exit(code), 250).unref();
          return;
        }

        console.error(`Received ${signal}; stopping servers and closing logs...`);
        void runtime.stopAll(signal);
      };

      process.on("SIGINT", handleSignal);
      process.on("SIGTERM", handleSignal);
      if (process.platform !== "win32") process.on("SIGHUP", handleSignal);

      return new Promise((resolve) => {
        waitResolve = () => {
          process.off("SIGINT", handleSignal);
          process.off("SIGTERM", handleSignal);
          if (process.platform !== "win32") process.off("SIGHUP", handleSignal);
          resolve();
        };
        maybeResolveWait();
      });
    }
  };

  async function stopAll(reason) {
    if (stopping || logsClosed) return;
    stopping = true;
    writeSessionEvent(combined, "shutdown_start", { reason });
    if (stdinHandler) process.stdin.off("data", stdinHandler);
    process.stdin.pause();
    if (clientTimeout) clearTimeout(clientTimeout);
    if (scenarioMonitor) {
      scenarioMonitor.stop();
      scenarioMonitor = null;
    }
    rejectReadyWaiters(new Error(`Shutdown requested: ${reason}`));
    for (const run of [...activeRuns.values()]) {
      run.commandBridge?.stop();
    }

    const stops = [];
    for (const record of processes.values()) {
      writeEvent(record, combined, "process_stop_request", { reason });
      if (record.external) {
        record.log.end();
        processes.delete(record.name);
      } else if (!record.child.killed) {
        stops.push(stopProcess(record).then(() => waitForRecordExit(record, processes, combined)));
      }
    }
    await Promise.allSettled(stops);
    maybeResolveWait();
  }

  function maybeResolveWait() {
    if (processes.size !== 0 || !waitResolve) return;
    const resolve = waitResolve;
    waitResolve = null;
    void closeLogs().then(resolve, resolve);
  }

  async function closeLogs() {
    if (logsClosed) return;
    logsClosed = true;
    if (clientTimeout) clearTimeout(clientTimeout);
    for (const run of [...activeRuns.values()]) {
      finishClientRun(run, activeRuns, combined);
    }
    writeSessionEvent(combined, "shutdown_complete", {});
    await Promise.all([
      endStream(commands),
      endStream(combined)
    ]);
  }

  function serversReady() {
    const serverRecords = [...processes.values()].filter((record) => record.kind === "server");
    return serverRecords.length > 0 && serverRecords.every((record) => record.ready);
  }

  function removeReadyWaiter(waiter) {
    const index = readyWaiters.indexOf(waiter);
    if (index !== -1) readyWaiters.splice(index, 1);
    if (waiter.timer) clearTimeout(waiter.timer);
  }

  function resolveReadyWaitersIfReady() {
    if (!serversReady()) return;
    for (const waiter of readyWaiters.splice(0)) {
      if (waiter.timer) clearTimeout(waiter.timer);
      waiter.resolve();
    }
  }

  function rejectReadyWaiters(err) {
    for (const waiter of readyWaiters.splice(0)) {
      if (waiter.timer) clearTimeout(waiter.timer);
      waiter.reject(err);
    }
  }

  return runtime;
}

function closeChildPipes(child) {
  child.stdin?.destroy();
  child.stdout?.destroy();
  child.stderr?.destroy();
}

function stopProcess(record) {
  if (!record.child?.pid) return Promise.resolve();

  if (os.platform() === "win32") {
    return new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(record.child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true
      });
      killer.on("error", () => {
        record.child.kill();
        resolve();
      });
      killer.on("exit", () => resolve());
    });
  }

  record.child.kill("SIGTERM");
  return Promise.resolve();
}

function forceKillProcesses(processes) {
  for (const record of processes.values()) {
    if (!record.external) void stopProcess(record);
  }
}

function waitForRecordExit(record, processes, combined) {
  if (record.exited || !processes.has(record.name)) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!processes.has(record.name) || record.exited) {
        resolve();
        return;
      }
      record.exited = true;
      writeEvent(record, combined, "process_exit_missing", { reason: "timeout_after_stop" });
      closeChildPipes(record.child);
      record.log.end();
      processes.delete(record.name);
      resolve();
    }, 5000);
    timer.unref();
    record.child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function writeSessionEvent(combined, event, data) {
  writeLine(combined, `${JSON.stringify({ ts: new Date().toISOString(), event, ...data })}\n`);
}

function endStream(stream) {
  if (stream.destroyed || stream.writableEnded) return Promise.resolve();
  return new Promise((resolve) => stream.end(resolve));
}

function writeLine(stream, line) {
  if (!stream || stream.destroyed || stream.writableEnded) return;
  stream.write(line);
}

function createOutputHandler(record, combined, stream, runtime) {
  let pending = "";
  const handler = (data) => {
    pending += data.toString();
    const lines = pending.split(/\r?\n/);
    pending = lines.pop();
    for (const line of lines) {
      writeOutputLine(record, combined, stream, line);
      if (runtime) {
        runtime.markServerReady(record, line);
        runtime.maybeAutoOpPlayer(record, line);
      }
    }
  };
  handler.flush = () => {
    if (!pending) return;
    writeOutputLine(record, combined, stream, pending);
    if (runtime) {
      runtime.markServerReady(record, pending);
      runtime.maybeAutoOpPlayer(record, pending);
    }
    pending = "";
  };
  return handler;
}

function writeOutputLine(record, combined, stream, line) {
  writeEvent(record, combined, stream, { line });
  const out = stream === "stderr" ? process.stderr : process.stdout;
  if (record.kind === "client" && line === "") {
    out.write("\n");
    return;
  }
  out.write(`[${consoleLabel(record)}] ${line}\n`);
}

function consoleLabel(record) {
  if (record.kind === "client" && record.run?.id) {
    return `client-${record.run.id.split("-", 1)[0]}`;
  }
  return record.name;
}

function launchUsageLines(usage) {
  if (!usage) return [];
  const lines = [];
  if (usage.kind) lines.push(`type ${usage.kind}`);
  if (usage.world) lines.push(`world ${usage.world}`);
  if (usage.javaPort) lines.push(`Java TCP port ${usage.javaPort}`);
  if (usage.bedrockPort) lines.push(`Bedrock UDP port ${usage.bedrockPort}`);
  if (usage.bedrockPortV6) lines.push(`Bedrock UDP v6 port ${usage.bedrockPortV6}`);
  if (usage.profile) lines.push(`profile ${usage.profile}`);
  if (usage.paperVersion) lines.push(`Paper ${usage.paperVersion}`);
  if (usage.cwd) lines.push(`cwd ${usage.cwd}`);
  return lines;
}

function finishClientRun(run, activeRuns, sessionCombined) {
  if (!activeRuns.has(run.id)) return;
  run.commandBridge?.stop();
  activeRuns.delete(run.id);
  writeLine(sessionCombined, `${JSON.stringify({ ts: new Date().toISOString(), event: "client_run_end", run: run.id, dir: run.dir })}\n`);
  run.combined.end();
  run.clientLog.end();
  for (const log of run.serverLogs.values()) log.end();
}

function normalizeClientRunTargets(instances, targetInstances) {
  if (!Array.isArray(instances) || instances.length === 0) {
    throw new Error("Client run requires at least one target server.");
  }

  const known = new Set(targetInstances.map((instance) => instance.name));
  for (const instance of instances) {
    if (!known.has(instance.name)) throw new Error(`Unknown client run target: ${instance.name}`);
  }

  return instances;
}

function safeFileLabel(value) {
  return String(value).replace(/[^A-Za-z0-9_.+-]/g, "_");
}

function startServerCommandBridge(commandFile, runtime, commands, combined, targetNames) {
  let offset = 0;
  let stopped = false;

  const pump = () => {
    if (stopped) return;
    let stat;
    try {
      stat = fs.statSync(commandFile);
    } catch {
      return;
    }
    if (stat.size <= offset) return;

    const fd = fs.openSync(commandFile, "r");
    try {
      const length = stat.size - offset;
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, offset);
      offset = stat.size;
      for (const line of buffer.toString("utf8").split(/\r?\n/)) {
        if (!line.trim()) continue;
        const entry = JSON.parse(line);
        const targetSet = entryTargets(entry, runtime, targetNames);
        const targets = [...runtime.processes.values()].filter((record) => {
          return record.kind === "server" && targetSet.has(record.name);
        });
        for (const record of targets) {
          sendServerCommand(record, entry.command, commands, combined, "client_command_file");
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  };

  const timer = setInterval(pump, 50);
  timer.unref();

  return {
    stop() {
      pump();
      stopped = true;
      clearInterval(timer);
    }
  };
}

function entryTargets(entry, runtime, targetNames) {
  if (Array.isArray(entry.targets) && entry.targets.length > 0) return new Set(entry.targets);
  if (targetNames?.size) return targetNames;

  return new Set([...runtime.processes.values()]
    .filter((record) => record.kind === "server")
    .map((record) => record.name));
}

function handleConsoleLine(line, runtime, commands, combined, targetInstances) {
  if (line === "/help") {
    console.log("Use /client <cmd>, /java <cmd>, /java-1 <cmd>, /endstone <cmd>, /endstone-1 <cmd>, /all <cmd>, /quit. Without a prefix, commands route to the only running server.");
    return;
  }
  if (line === "/quit") {
    runtime.stopAll();
    return;
  }
  if (line.startsWith("/client ")) {
    const command = line.slice("/client ".length).trim();
    if (command) void runtime.startClientRuns(command);
    return;
  }

  const routed = parseConsoleCommand(line, targetInstances);
  if (!routed) return;
  const targets = routed.target === "all"
    ? [...runtime.processes.values()].filter((record) => record.kind === "server")
    : routed.targetType
      ? [...runtime.processes.values()].filter((record) => record.name.startsWith(`${routed.targetType}-`))
    : [runtime.processes.get(routed.target)].filter(Boolean);

  if (targets.length === 0) {
    console.log(`No running server process matched ${routed.target}.`);
    return;
  }

  for (const record of targets) {
    if (record.external) {
      console.log(`${record.name} is an existing external server; console command was not sent.`);
      continue;
    }
    sendServerCommand(record, routed.command, commands, combined, "stdin");
  }
}

function sendServerCommand(record, command, commands, combined, eventName) {
  const event = {
    ts: new Date().toISOString(),
    process: record.name,
    kind: record.kind,
    event: eventName,
    command
  };
  writeLine(commands, `${JSON.stringify(event)}\n`);
  writeLine(combined, `${JSON.stringify(event)}\n`);
  console.log(`[${record.name}] <= ${command}`);
  record.child.stdin.write(`${command}\n`);
}

function joinedPlayerName(line) {
  const joined = line.match(/^\[[^\]]+\]:\s+(.+?) joined the game$/);
  if (joined) return joined[1];

  const loggedIn = line.match(/^\[[^\]]+\]:\s+(.+?)\[[^\]]+\] logged in with entity id \d+ at /);
  if (loggedIn) return loggedIn[1];

  return null;
}

function quoteCommandArgument(value) {
  if (/^[A-Za-z0-9_.-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseConsoleCommand(line, targetInstances) {
  const prefixed = line.match(/^\/(\S+)\s+(.+)$/);
  if (prefixed) {
    const prefix = prefixed[1];
    if (prefix === "all") return { target: "all", command: prefixed[2] };
    if (prefix === "java" || prefix === "endstone") return { targetType: prefix, command: prefixed[2] };
    if (targetInstances.some((instance) => instance.name === prefix)) return { target: prefix, command: prefixed[2] };
    console.log(`Unknown server prefix: /${prefix}`);
    return null;
  }
  if (line.startsWith("/")) {
    console.log(`Unknown launcher command: ${line}`);
    return null;
  }
  if (targetInstances.length === 1) {
    return { target: targetInstances[0].name, command: line };
  }
  console.log("Multiple servers are running; prefix the command with /java-1, /endstone-1, /java, /endstone, or /all.");
  return null;
}

function writeEvent(record, combined, event, data) {
  const payload = {
    ts: new Date().toISOString(),
    process: record.name,
    kind: record.kind,
    event,
    ...data
  };
  const line = `${JSON.stringify(payload)}\n`;
  writeLine(record.log, line);
  writeLine(combined, line);
  writeRunEvent(record, line, payload);
}

function writeRunEvent(record, line, payload) {
  if (record.kind === "client" && record.run) {
    writeLine(record.run.clientLog, line);
    writeLine(record.run.combined, line);
    return;
  }

  if (record.kind !== "server" || !record.activeRuns) return;
  for (const run of record.activeRuns.values()) {
    if (!run.targetNames.has(record.name)) continue;
    const serverLog = run.serverLogs.get(record.name);
    if (serverLog) writeLine(serverLog, line);
    writeLine(run.combined, `${JSON.stringify({ ...payload, run: run.id })}\n`);
  }
}

function startScenarioMonitor(instances, runtime, combined, options) {
  const targets = instances
    .filter((instance) => instance.type === "endstone")
    .map((instance) => ({
      instance,
      file: recorderPathForInstance(instance)
    }));
  if (targets.length === 0) return null;

  const state = {
    startedAt: Date.now(),
    lastProgressAt: 0,
    lastSummary: "",
    lastMarkerCount: 0
  };
  const progressInterval = Math.max(1000, options.scenarioProgressIntervalMs || 30000);

  console.log(`Scenario monitor: watching for completed scenario quit markers every ${Math.round(progressInterval / 1000)}s.`);
  for (const target of targets) {
    console.log(`Scenario monitor: ${target.instance.name} recorder file ${target.file}`);
  }

  const check = () => {
    const summaries = targets.map((target) => {
      return {
        target,
        markers: readScenarioMarkers(target.file)
      };
    });
    const complete = summaries.find(({ markers }) => {
      return hasCompletedScenarioEnd(markers) && activeScenarioPlayers(markers).length === 0;
    });
    const markerCount = summaries.reduce((total, summary) => total + summary.markers.length, 0);
    const summary = summarizeScenarioProgress(summaries, state.startedAt);
    const now = Date.now();

    if (complete) {
      const end = complete.markers.find((marker) => marker.type === "scenario_end" && marker.status === "complete");
      const player = end?.player ? ` for ${end.player}` : "";
      const message = `Scenario monitor: completed scenario_end${player} and all recorded players left; stopping servers.`;
      console.log(message);
      writeSessionEvent(combined, "scenario_complete_auto_shutdown", {
        recorder: complete.target.file,
        player: end?.player || null
      });
      void runtime.stopAll("scenario_complete");
      return;
    }

    if (summary !== state.lastSummary || markerCount !== state.lastMarkerCount || now - state.lastProgressAt >= progressInterval) {
      console.log(`Scenario monitor: ${summary}`);
      state.lastSummary = summary;
      state.lastMarkerCount = markerCount;
      state.lastProgressAt = now;
    }
  };

  const timer = setInterval(check, 1000);
  timer.unref();
  check();

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

function recorderPathForInstance(instance) {
  const configured = process.env.E2E_PACKET_RECORD_FILE;
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(instance.dir, configured);
  }
  return path.join(instance.dir, "logs", "packet-recorder.jsonl");
}

function readScenarioMarkers(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }

  const markers = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed[0] === "[") continue;
    try {
      const marker = JSON.parse(trimmed);
      if (marker && typeof marker === "object" && marker.type) markers.push(marker);
    } catch {
      // Ignore partial lines while the recorder is appending.
    }
  }
  return markers;
}

function hasCompletedScenarioEnd(markers) {
  return markers.some((marker) => marker.type === "scenario_complete") &&
    markers.some((marker) => marker.type === "scenario_end" && marker.status === "complete");
}

function activeScenarioPlayers(markers) {
  const active = new Set();
  for (const marker of markers) {
    if (marker.type === "player_join" && marker.player) active.add(marker.player);
    if (marker.type === "player_quit" && marker.player) active.delete(marker.player);
  }
  return [...active].sort();
}

function summarizeScenarioProgress(summaries, startedAt) {
  const markers = summaries.flatMap((summary) => summary.markers);
  if (markers.length === 0) {
    return `waiting for recorder markers (${elapsedSeconds(startedAt)}s elapsed)`;
  }

  const latest = markers[markers.length - 1];
  const activeStep = lastMarker(markers, "step_start");
  const completeStep = lastMarker(markers, "step_complete");
  const scenarioComplete = lastMarker(markers, "scenario_complete");
  const playerJoin = lastMarker(markers, "player_join");
  const abandonedEnd = [...markers].reverse().find((marker) => marker.type === "scenario_end" && marker.status !== "complete");

  if (abandonedEnd) {
    const player = abandonedEnd.player ? ` for ${abandonedEnd.player}` : "";
    return `last scenario_end was ${abandonedEnd.status || "unknown"}${player}; waiting for a completed run (${elapsedSeconds(startedAt)}s elapsed)`;
  }
  if (scenarioComplete) {
    const active = activeScenarioPlayers(markers);
    if (active.length > 0) {
      return `scenario_complete seen; waiting for player quit (${active.join(", ")} still connected, ${elapsedSeconds(startedAt)}s elapsed)`;
    }
    const player = scenarioComplete.player ? ` for ${scenarioComplete.player}` : "";
    return `scenario_complete seen${player}; waiting for player quit/scenario_end (${elapsedSeconds(startedAt)}s elapsed)`;
  }
  if (activeStep) {
    const completed = completeStep?.step === activeStep.step ? "complete" : "active";
    return `step ${activeStep.step || activeStep.step_index || "unknown"} ${completed}; waiting (${elapsedSeconds(startedAt)}s elapsed)`;
  }
  if (playerJoin) {
    const player = playerJoin.player ? ` ${playerJoin.player}` : "";
    return `player joined${player}; waiting for scenario progress (${elapsedSeconds(startedAt)}s elapsed)`;
  }
  return `latest marker ${latest.type}; waiting (${elapsedSeconds(startedAt)}s elapsed)`;
}

function lastMarker(markers, type) {
  for (let index = markers.length - 1; index >= 0; index -= 1) {
    if (markers[index].type === type) return markers[index];
  }
  return null;
}

function elapsedSeconds(startedAt) {
  return Math.round((Date.now() - startedAt) / 1000);
}

module.exports = {
  createRuntime,
  activeScenarioPlayers,
  hasCompletedScenarioEnd,
  readScenarioMarkers,
  recorderPathForInstance,
  summarizeScenarioProgress
};
