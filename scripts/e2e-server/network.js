"use strict";

const dgram = require("dgram");
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
  isUdpPortInUse,
  waitForBedrockPing
};
