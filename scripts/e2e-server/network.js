"use strict";

const dgram = require("dgram");
const net = require("net");
const { ping: pingBedrockServer } = require("bedrock-protocol");

async function isUdpPortInUse(port) {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      try {
        socket.close();
      } catch {
        // The socket may not have bound successfully.
      }
      resolve(value);
    };
    socket.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        finish(true);
      } else {
        reject(err);
      }
    });
    socket.once("listening", () => finish(false));
    socket.bind({ port, address: "0.0.0.0", exclusive: true });
  });
}

async function isTcpPortInUse(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      server.removeAllListeners();
      try {
        server.close();
      } catch {
        // The server may not have listened successfully.
      }
      resolve(value);
    };
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        finish(true);
      } else {
        reject(err);
      }
    });
    server.once("listening", () => finish(false));
    server.listen({ port, host: "0.0.0.0", exclusive: true });
  });
}

async function findAvailablePort(startPort, protocol, reserved = new Set()) {
  const isInUse = protocol === "tcp" ? isTcpPortInUse : isUdpPortInUse;
  for (let port = startPort; port <= 65535; port += 1) {
    if (reserved.has(port)) continue;
    if (!(await isInUse(port))) return port;
  }
  throw new Error(`No available ${protocol.toUpperCase()} port found at or above ${startPort}.`);
}

async function waitForBedrockPing(host, port, timeoutMs) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      return await pingBedrockServer({ host, port });
    } catch (err) {
      lastError = err;
      await delay(500);
    }
  }
  const detail = lastError?.message ? ` Last error: ${lastError.message}` : "";
  throw new Error(`Bedrock UDP port ${port} is in use, but ${host}:${port} did not answer ping within ${timeoutMs}ms.${detail}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  findAvailablePort,
  isTcpPortInUse,
  isUdpPortInUse,
  waitForBedrockPing
};
