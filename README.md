# prismarine-bedrock

A Bedrock-first bot runtime built on the Prismarine ecosystem.

This project is an experimental Bedrock/Geyser counterpart to Mineflayer-style bot APIs. It uses `bedrock-protocol` for the network layer and Prismarine packages for blocks, items, entities, chunks, windows, recipes, chat, and world state.

[![GitHub stars](https://img.shields.io/github/stars/GenerelSchwerz/prismarine-bedrock?style=social)](https://github.com/GenerelSchwerz/prismarine-bedrock)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/6TA4bsnu9V)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/generel)

## Project Status

This is in active development. The goal is not to blindly copy Mineflayer's Java Edition internals, but to build a practical Bedrock-native runtime with Mineflayer-like ergonomics where the semantics actually line up.

Current strong areas:

- Bedrock login/start-game setup and respawn handling.
- Chunk, subchunk, blob cache, and block update handling.
- Entity and player tracking.
- Player auth input movement, look controls, and physics integration.
- Inventory mirroring with Bedrock stack identity preservation.
- Bedrock `item_stack_request` inventory actions.
- Container opening, transfer helpers, and container specialization.
- Crafting through Bedrock `crafting_data`.
- Villager trading through Bedrock/Geyser stack requests.

Major in-progress areas:

- Stable public API entrypoint.
- Mineflayer compatibility aliases.
- Pathfinding.
- Broader game-state APIs.
- More examples and public-facing docs.

## Install

```bash
pnpm install
```

## Test

```bash
pnpm test
```

Some integration scripts expect a local Bedrock/Geyser test server. See the in-development docs before changing packet-heavy systems such as inventory, crafting, or trading.

## Documentation

- [Docs index](docs/README.md)
- [Mineflayer feature comparison](docs/reference/mineflayer-feature-comparison.md)
- [Mineflayer parity checkpoints](docs/in-dev/mineflayer-parity-checkpoints.md)
- [Crafting implementation notes](docs/in-dev/crafting-util-implementation-notes.md)
- [Bedrock-first physics notes](docs/in-dev/bedrock-first-physics-implementation-notes.md)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=GenerelSchwerz/prismarine-bedrock&type=Date)](https://www.star-history.com/#GenerelSchwerz/prismarine-bedrock&Date)

## License

All rights reserved. No permission is granted to use, copy, modify, or distribute this software without prior written permission from the copyright holder.
