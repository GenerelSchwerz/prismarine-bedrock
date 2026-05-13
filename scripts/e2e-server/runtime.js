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
  let stdinHandler = null;
  let clientRunCounter = 0;
  let clientTimeout = null;

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
      writeEvent(record, combined, "process_start", { command: commandLine, cwd });
      console.log(`[${consoleLabel(record)}] ${commandLine}`);

      const stdoutHandler = createOutputHandler(record, combined, "stdout", runtime);
      const stderrHandler = createOutputHandler(record, combined, "stderr", runtime);
      child.stdout.on("data", stdoutHandler);
      child.stderr.on("data", stderrHandler);
      child.on("error", (err) => {
        writeEvent(record, combined, "process_error", { message: err.message });
      });
      child.on("exit", (code, signal) => {
        stdoutHandler.flush();
        stderrHandler.flush();
        writeEvent(record, combined, "process_exit", { code, signal });
        record.log.end();
        processes.delete(name);
        if (record.kind === "server" && !record.ready) {
          rejectReadyWaiters(new Error(`${name} exited before reporting ready.`));
        }
        if (record.run) {
          finishClientRun(record.run, activeRuns, combined);
          if (options.exitAfterClient && runtime.clientExitCode === null) {
            if (clientTimeout) clearTimeout(clientTimeout);
            runtime.clientExitCode = signal ? 1 : code || 0;
            setTimeout(() => runtime.stopAll(), options.clientStopDelayMs).unref();
          }
        }
        console.log(`[${consoleLabel(record)}] exited ${signal || code}`);
      });
    },
    async startClientRun(command) {
      try {
        await runtime.waitForServersReady();
      } catch (err) {
        console.error(`Client not started: ${err.message}`);
        if (options.exitAfterClient && runtime.clientExitCode === null) {
          runtime.clientExitCode = 1;
          runtime.stopAll();
        }
        return;
      }
      clientRunCounter += 1;
      const id = `${String(clientRunCounter).padStart(3, "0")}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
      const runDir = path.join(sessionDir, "client-runs", id);
      await mkdir(runDir);
      const run = {
        id,
        dir: runDir,
        combined: fs.createWriteStream(path.join(runDir, "combined.jsonl"), { flags: "a" }),
        clientLog: fs.createWriteStream(path.join(runDir, "client.jsonl"), { flags: "a" }),
        serverLogs: new Map()
      };
      const startEvent = { ts: new Date().toISOString(), event: "client_run_start", run: id, dir: runDir, command };
      combined.write(`${JSON.stringify(startEvent)}\n`);
      run.combined.write(`${JSON.stringify(startEvent)}\n`);
      activeRuns.set(id, run);
      for (const record of processes.values()) {
        if (record.kind === "server") {
          run.serverLogs.set(record.name, fs.createWriteStream(path.join(runDir, `${record.name}.jsonl`), { flags: "a" }));
        }
      }
      const name = `client-${id}`;
      console.log(`Client run logs: ${runDir}`);
      runtime.launch(name, "client", command, [], ROOT, clientEnv(targetInstances), { shell: true, run });
      if (options.exitAfterClient && options.clientTimeoutMs !== null) {
        if (clientTimeout) clearTimeout(clientTimeout);
        clientTimeout = setTimeout(() => {
          if (runtime.clientExitCode === null) runtime.clientExitCode = 124;
          console.error(`Client timed out after ${options.clientTimeoutMs}ms; stopping servers.`);
          runtime.stopAll();
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
    stopAll() {
      if (stopping) return;
      stopping = true;
      for (const record of processes.values()) {
        writeEvent(record, combined, "process_stop_request", {});
        if (record.external) {
          record.log.end();
          processes.delete(record.name);
        } else if (!record.child.killed) {
          record.child.kill(os.platform() === "win32" ? undefined : "SIGTERM");
        }
      }
    },
    waitForExit() {
      process.on("SIGINT", () => runtime.stopAll());
      process.on("SIGTERM", () => runtime.stopAll());

      return new Promise((resolve) => {
        const timer = setInterval(() => {
          if (processes.size === 0) {
            clearInterval(timer);
            if (stdinHandler) process.stdin.off("data", stdinHandler);
            process.stdin.pause();
            if (clientTimeout) clearTimeout(clientTimeout);
            commands.end();
            combined.end();
            resolve();
          }
        }, 250);
      });
    }
  };

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

function finishClientRun(run, activeRuns, sessionCombined) {
  if (!activeRuns.has(run.id)) return;
  activeRuns.delete(run.id);
  sessionCombined.write(`${JSON.stringify({ ts: new Date().toISOString(), event: "client_run_end", run: run.id, dir: run.dir })}\n`);
  run.combined.end();
  run.clientLog.end();
  for (const log of run.serverLogs.values()) log.end();
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
    if (command) void runtime.startClientRun(command);
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
  commands.write(`${JSON.stringify(event)}\n`);
  combined.write(`${JSON.stringify(event)}\n`);
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
  record.log.write(line);
  combined.write(line);
  writeRunEvent(record, line, payload);
}

function writeRunEvent(record, line, payload) {
  if (record.kind === "client" && record.run) {
    record.run.clientLog.write(line);
    record.run.combined.write(line);
    return;
  }

  if (record.kind !== "server" || !record.activeRuns) return;
  for (const run of record.activeRuns.values()) {
    const serverLog = run.serverLogs.get(record.name);
    if (serverLog) serverLog.write(line);
    run.combined.write(`${JSON.stringify({ ...payload, run: run.id })}\n`);
  }
}

module.exports = { createRuntime };
