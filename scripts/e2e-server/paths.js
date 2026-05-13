"use strict";

const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const E2E_ROOT = path.join(ROOT, ".e2e-servers");
const CACHE_DIR = path.join(E2E_ROOT, "cache");
const RUNS_DIR = path.join(E2E_ROOT, "runs");
const ENDSTONE_TEMPLATE_DIR = path.join(CACHE_DIR, "endstone-template");
const JAVA_BASE_DIR = path.join(E2E_ROOT, "java-geyser");
const ENDSTONE_BASE_DIR = path.join(E2E_ROOT, "endstone-bds");

module.exports = {
  ROOT,
  E2E_ROOT,
  CACHE_DIR,
  RUNS_DIR,
  ENDSTONE_TEMPLATE_DIR,
  JAVA_BASE_DIR,
  ENDSTONE_BASE_DIR
};
