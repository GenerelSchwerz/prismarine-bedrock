"use strict";

const fs = require("fs");
const path = require("path");
const { connectLiveBot } = require("./lib/live-bot");

const MIN_XZ = Number(process.env.MIN_XZ || -3);
const MAX_XZ = Number(process.env.MAX_XZ || 3);
const MIN_Y = Number(process.env.MIN_Y || -64);
const MAX_Y = Number(process.env.MAX_Y || 320);
const WAIT_RADIUS = Number(process.env.WAIT_RADIUS || 6);
const WAIT_TIMEOUT_MS = Number(process.env.WAIT_TIMEOUT_MS || 15000);

const EXPECTED_LAYERS = {
  [-64]: "bedrock",
  [-63]: "dirt",
  [-62]: "dirt",
  [-61]: process.env.TOP_LAYER || "dirt"
};

function expectedBlockName(y) {
  const highestLayer = Math.max(...Object.keys(EXPECTED_LAYERS).map(Number));
  if (y > highestLayer) return "air";
  return EXPECTED_LAYERS[y] || "air";
}

async function main() {
  const { bot } = await connectLiveBot({
    username: "SuperflatExample",
    options: {
      blockAccessMode: process.env.BLOCK_ACCESS_MODE || "native",
      minY: -64,
      worldMinY: -64,
      worldHeight: 384,
      chunkRadius: WAIT_RADIUS
    }
  });

  await bot.waitForChunksToLoad(WAIT_RADIUS, bot.spawnPosition, WAIT_TIMEOUT_MS);
  console.log(`Scanning x/z ${MIN_XZ}..${MAX_XZ}, y ${MIN_Y}..${MAX_Y}`);

  const mismatches = [];
  let checked = 0;

  for (let x = MIN_XZ; x <= MAX_XZ; x++) {
    for (let z = MIN_XZ; z <= MAX_XZ; z++) {
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        const block = await bot.getBlockAt(x, y, z);
        const expected = expectedBlockName(y);
        checked++;

        if (block?.name !== expected) {
          mismatches.push({
            pos: { x, y, z },
            expected,
            actual: block?.name,
            stateId: block?.stateId
          });
        }
      }
    }
  }

  console.log(`Checked ${checked} blocks; mismatches=${mismatches.length}`);
  if (mismatches.length > 0) {
    console.log("First mismatches:", mismatches.slice(0, 20));
    const output = path.join(process.cwd(), "superflat-scan-mismatches.json");
    fs.writeFileSync(output, JSON.stringify(mismatches, null, 2));
    console.log(`Wrote ${output}`);
  }

  bot.disconnect("Superflat scan example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
