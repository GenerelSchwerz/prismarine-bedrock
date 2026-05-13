"use strict";

const { Vec3 } = require("vec3");
const { connectLiveBot, sleep } = require("./lib/live-bot");

const SCAN_RADIUS = Number(process.env.SCAN_RADIUS || 2);
const Y_RADIUS = Number(process.env.Y_RADIUS || 4);

function symbolForBlock(name) {
  if (name === "air") return ".";
  if (name === "bedrock") return "B";
  if (name === "dirt") return "D";
  if (name === "grass_block") return "G";
  if (name === "water") return "W";
  if (!name) return "?";
  return "#";
}

async function printSlice(bot, y, centerX, centerZ) {
  console.log(`\ny=${y}`);
  for (let z = centerZ - SCAN_RADIUS; z <= centerZ + SCAN_RADIUS; z++) {
    let line = "";
    for (let x = centerX - SCAN_RADIUS; x <= centerX + SCAN_RADIUS; x++) {
      const block = await bot.getBlockAt(x, y, z);
      line += ` ${symbolForBlock(block?.name)} `;
    }
    console.log(`z=${String(z).padStart(4)} ${line}`);
  }
}

async function main() {
  const { bot } = await connectLiveBot({ username: "WorldExample" });

  await sleep(3000);
  const pos = bot.self.position;
  const center = new Vec3(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));

  console.log({
    botPosition: pos,
    scanCenter: center,
    loadedColumns: bot.networkChunks?.size ?? 0,
    worldClass: bot.world?.constructor?.name,
    blockAccess: bot.blockAccess?.constructor?.name
  });

  for (let y = center.y + Y_RADIUS; y >= center.y - Y_RADIUS; y--) {
    await printSlice(bot, y, center.x, center.z);
  }

  console.log("\nLegend: .=air B=bedrock D=dirt G=grass W=water #=other ?=missing");
  bot.disconnect("World diagnostics example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
