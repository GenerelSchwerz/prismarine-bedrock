#!/usr/bin/env node
"use strict";

const { parseCli } = require("./e2e-server/options");
const { buildInstances } = require("./e2e-server/instances");
const { installTargets, cleanTargets } = require("./e2e-server/install");
const { launchTargets } = require("./e2e-server/launch");
const { cleanupOrphans } = require("./e2e-server/orphans");
const { printHelp } = require("./e2e-server/help");
const { assignAutoPorts, printPortMap } = require("./e2e-server/ports");
const { printStatus } = require("./e2e-server/status");

const { command, options } = parseCli(process.argv);
const targets = options.targets;
const instances = buildInstances(targets, options);

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});

async function main() {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "install") {
    if (options.autoPort) {
      await assignAutoPorts(instances);
      printPortMap(instances);
    }
    await installTargets(instances, options);
    return;
  }

  if (command === "clean") {
    await cleanTargets(instances, options);
    return;
  }

  if (command === "cleanup-orphans" || command === "clean-orphans") {
    await cleanupOrphans(options);
    return;
  }

  if (command === "status") {
    await printStatus(instances, options);
    return;
  }

  if (command === "launch") {
    if (options.autoPort) {
      await assignAutoPorts(instances);
      printPortMap(instances);
    }
    await installTargets(instances, options);
    await launchTargets(instances, options);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}
