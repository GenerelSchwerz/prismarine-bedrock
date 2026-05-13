"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { E2E_ROOT } = require("./paths");

async function mkdir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function replaceDirectory(dir) {
  await fsp.rm(dir, { recursive: true, force: true });
  await mkdir(dir);
}

async function safeRemove(target) {
  const resolved = path.resolve(target);
  const root = path.resolve(E2E_ROOT);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to delete outside .e2e-servers: ${resolved}`);
  }
  await fsp.rm(resolved, { recursive: true, force: true });
}

async function writeText(file, contents) {
  await mkdir(path.dirname(file));
  await fsp.writeFile(file, contents, "utf8");
}

async function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) return;
  await fsp.cp(source, destination, { recursive: true, force: true });
}

module.exports = {
  mkdir,
  replaceDirectory,
  safeRemove,
  writeText,
  copyIfExists
};
