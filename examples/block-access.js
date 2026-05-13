"use strict";

const { Vec3 } = require("vec3");
const { connectLiveBot, sleep } = require("./lib/live-bot");

const POINTS = (process.env.POINTS || "0,-62,0;0,-61,0")
  .split(";")
  .map(point => point.split(",").map(Number))
  .filter(point => point.length === 3 && point.every(Number.isFinite));

function mod16(n) {
  return ((n % 16) + 16) % 16;
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function nameFromStateId(bot, stateId) {
  if (stateId == null) return "undefined";
  return bot.registry.blocksByStateId?.[stateId]?.name ||
    bot.registry.blocksByRuntimeId?.[stateId]?.name ||
    `unknown:${stateId}`;
}

function getSection(column, sectionY) {
  if (!column) return null;
  if (typeof column.getSection === "function") {
    try {
      const section = column.getSection(sectionY);
      if (section) return section;
    } catch {}
  }

  if (typeof column.getSectionAtIndex === "function" && typeof column.minCY === "number") {
    try {
      return column.getSectionAtIndex(sectionY - column.minCY);
    } catch {}
  }

  if (Array.isArray(column.sections) && typeof column.minCY === "number") {
    return column.sections[sectionY - column.minCY] || null;
  }

  return null;
}

function readRawStateId(bot, x, y, z) {
  const column = bot.networkChunks?.get(chunkKey(Math.floor(x / 16), Math.floor(z / 16)));
  const section = getSection(column, Math.floor(y / 16));
  if (!section || typeof section.getBlockStateId !== "function") return undefined;
  return section.getBlockStateId(mod16(x), mod16(z), mod16(y));
}

async function main() {
  const { bot } = await connectLiveBot({
    username: "BlockAccessExample",
    options: { blockAccessMode: process.env.BLOCK_ACCESS_MODE || "bedrockCompat" }
  });

  await sleep(3000);
  console.log(`Loaded chunk columns: ${bot.networkChunks?.size ?? 0}`);
  console.log("POINTS can override the sampled coordinates, for example POINTS=\"0,-62,0;1,-61,1\".");

  for (const [x, y, z] of POINTS) {
    const rawStateId = readRawStateId(bot, x, y, z);
    const accessStateId = typeof bot.getBlockStateIdAt === "function" ? bot.getBlockStateIdAt(x, y, z) : undefined;
    const block = typeof bot.getBlockAt === "function" ? await bot.getBlockAt(x, y, z) : null;

    console.log({
      pos: new Vec3(x, y, z),
      raw: `${nameFromStateId(bot, rawStateId)}/${rawStateId}`,
      access: `${nameFromStateId(bot, accessStateId)}/${accessStateId}`,
      block: block ? `${block.name}/${block.stateId}` : null,
      rawMatchesAccess: rawStateId === accessStateId,
      accessMatchesBlock: block?.stateId === accessStateId
    });
  }

  bot.disconnect("Block access example complete");
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
