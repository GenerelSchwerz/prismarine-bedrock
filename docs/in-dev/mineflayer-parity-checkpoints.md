# Mineflayer Parity Checkpoints

Date: 2026-05-12

This is an implementation checkpoint list for moving this Bedrock-first runtime closer to Mineflayer-like usability. It is intentionally separate from the feature comparison reference doc because these items are roadmap and validation work, not stable API documentation.

Legend:

- `[x]` implemented or substantially present in this repo.
- `[~]` partially implemented, needs compatibility hardening or public API cleanup.
- `[ ]` missing or not yet demonstrated.

## Foundation

- `[~]` Define the public library entrypoint.
  - Fix the root export typo from `module.export` to `module.exports`.
  - Split runnable demo code from the exported library API.
  - Add a `createBot(options)` wrapper or document `new BotState(options)` as the supported entrypoint.
- `[~]` Document supported Bedrock versions.
  - Current code and packet notes are centered on Bedrock `1.21.130`.
  - Keep protocol notes linked to symlinked `minecraft-data` paths, not pnpm store internals.
- `[~]` Keep plugin injection predictable.
  - Builtins currently auto-load from `src/builtins`.
  - Define whether external plugins should target Mineflayer-style APIs or Bedrock-native APIs.
- `[ ]` Add public API docs generated from current builtins.
  - Chat and commands.
  - Chunks/world.
  - Entities/players.
  - Movement/physics.
  - Inventory/actions.
  - Containers.
  - Crafting.
  - Dig/place/interact.
  - Trading.

## Connection and Lifecycle

- `[x]` Create a Bedrock client through `bedrock-protocol`.
- `[x]` Handle `start_game`, item registry, play status, chunk radius request, and local-player initialization.
- `[x]` Track death, health, respawn, and spawn basics.
- `[~]` Normalize Mineflayer-like lifecycle events.
  - Decide exact event names and payloads for `login`, `spawn`, `kicked`, `end`, `death`, `health`, and `game`.
- `[ ]` Add polished auth/session documentation.
  - Local/offline test mode.
  - Microsoft auth expectations.
  - Geyser-specific connection notes.

## Chat and Commands

- `[x]` Receive and parse Bedrock `text` packets.
- `[x]` Send chat and whispers.
- `[x]` Send slash/raw commands and wait for command output.
- `[~]` Align chat event payloads with a documented API.
- `[ ]` Add examples for echo bot, command bot, and command-output bot.

## World and Blocks

- `[x]` Maintain a `prismarine-world` instance.
- `[x]` Decode full chunks, subchunks, blob cache responses, and block updates.
- `[x]` Expose `getBlockAt`, block state get/set helpers, and chunk readiness helpers.
- `[~]` Document chunk readiness guarantees.
  - Clarify when `getBlockAt` may return missing/undefined data.
  - Clarify required waits before tests or world actions.
- `[~]` Expand block entity coverage.
- `[ ]` Add Mineflayer-style helpers where semantics match.
  - `blockAt`.
  - `findBlock`.
  - `findBlocks`.
  - Block update events with stable payloads.

## Entities and Players

- `[x]` Track self, players, generic entities, and item entities.
- `[x]` Handle core movement and metadata packets.
- `[x]` Expose `nearestEntity`.
- `[~]` Normalize entity and player event names.
- `[~]` Expand entity metadata interpretation.
- `[ ]` Add documented vehicle/passenger APIs.
- `[ ]` Add effect, equipment, and combat-state examples.

## Movement and Physics

- `[x]` Send Bedrock `player_auth_input`.
- `[x]` Support control states: forward, back, left, right, jump, sprint, sneak.
- `[x]` Support `look`, `lookAt`, and look completion waiting.
- `[x]` Integrate Bedrock movement correction and prediction state.
- `[~]` Harden physics behavior across terrain and game modes.
- `[~]` Document control-state semantics and packet timing.
- `[ ]` Add pathfinding.
  - Goal API.
  - Movement cost model.
  - Stuck detection.
  - Dig/place integration.
  - Chunk readiness integration.
- `[ ]` Add examples for walking, looking, jumping, and following a player.

## Inventory Mirror

- `[x]` Maintain inventory, armor, offhand, UI slots, active windows, and held item slot.
- `[x]` Preserve Bedrock stack identity fields on prismarine items.
- `[x]` Apply inventory content/slot packets.
- `[x]` Project known UI slots into logical active windows.
- `[~]` Document slot numbering clearly.
  - Hotbar versus inventory.
  - Armor/offhand.
  - Bedrock UI container.
  - Active container windows.
- `[~]` Add compatibility aliases only where they do not hide Bedrock stack identity.
- `[ ]` Add examples for item lookup, counting, selecting hotbar slots, and equipment.

## Inventory Actions

- `[x]` Send standalone and auth-input embedded item stack requests.
- `[x]` Wait for item stack responses.
- `[x]` Select hotbar slot.
- `[x]` Swap, move, merge, split, drop, destroy, and equip inventory slots.
- `[x]` Apply accepted item stack responses back to the local mirror.
- `[~]` Keep packet round-trip fixtures current.
  - `item_stack_swap`.
  - `item_stack_take`.
  - `item_stack_drop`.
  - Custom JSON fixtures for new action shapes.
- `[~]` Add server rejection diagnostics.
- `[ ]` Add broader survival and creative mode coverage.

## Containers

- `[x]` Open block containers with Bedrock inventory transactions.
- `[x]` Track active containers and open container windows.
- `[x]` Transfer, withdraw, deposit, move, swap, wait, and close.
- `[x]` Specialize common containers.
  - Anvil.
  - Armor.
  - Beacon.
  - Brewing stand.
  - Cartography table.
  - Crafter.
  - Enchantment table.
  - Furnace.
  - Grindstone.
  - Loom.
  - Smithing table.
  - Stonecutter.
  - Trading.
  - Workbench.
- `[~]` Verify each specialized container with focused tests.
- `[~]` Document per-container slot maps and data fields.
- `[ ]` Add examples for chest transfer, furnace progress, brewing state, and workbench use.

## Crafting

- `[x]` Capture Bedrock `crafting_data`.
- `[x]` Bridge `mineflayer-crafting-util` plans to Bedrock recipe data.
- `[x]` Expose craft planning and craft execution helpers.
- `[~]` Keep `docs/in-dev/crafting-util-implementation-notes.md` current with packet behavior.
- `[~]` Expand recipe coverage.
  - Inventory crafting.
  - Crafting table recipes.
  - Shaped versus shapeless.
  - Multi-step plans.
- `[ ]` Add examples for single craft, table craft, and multi-step craft.

## Digging, Placing, and Interaction

- `[x]` Dig basic blocks.
- `[x]` Place blocks with held item.
- `[x]` Place entities/items through item use on air.
- `[x]` Interact with and attack entities.
- `[~]` Add server-confirmed completion semantics for dig/place where practical.
- `[~]` Add tool choice and held-item helpers.
- `[ ]` Add block activation/use helpers.
- `[ ]` Add examples for dig, place, interact, attack, and tool switching.

## Trading

- `[x]` Open villager trade windows.
- `[x]` Track trade recipes.
- `[x]` Find and execute trades.
- `[x]` Transfer ingredients and take results through Bedrock stack requests.
- `[x]` Restore excess trade inputs.
- `[~]` Add more end-to-end Geyser trading tests.
- `[~]` Document trade recipe shape and expected matching filters.
- `[ ]` Add a public trading example.

## Game State

- `[~]` Track health, death, respawn, spawn position, and player gamemode.
- `[~]` Track attributes, abilities, effects, game rules, dimension changes, and movement authority inside physics state.
- `[ ]` Add high-level documented APIs/events for:
  - Time.
  - Weather.
  - Food.
  - Oxygen.
  - Experience.
  - Scoreboards.
  - Boss bars.
  - Titles.
  - Resource packs.
  - Dimension state.

## Mineflayer Compatibility Layer

- `[ ]` Decide compatibility target.
  - Mineflayer-inspired Bedrock API.
  - Mineflayer-compatible where practical.
  - Drop-in Mineflayer replacement.
- `[ ]` Build a compatibility test table.
  - Method name.
  - Mineflayer behavior.
  - Bedrock behavior.
  - Compatible, partial, or intentionally different.
- `[ ]` Add aliases for safe matches.
  - `blockAt` to `getBlockAt`, if payload expectations are satisfied.
  - `equip` to `equipItem`, if semantics match.
  - `attack` to `attackEntity`.
  - `activateEntity` or `interact` aliases where safe.
- `[ ]` Avoid aliases that hide required Bedrock state.
  - Inventory stack IDs.
  - Full container names.
  - Dynamic container IDs.
  - Item stack request response handling.

## Documentation and Examples

- `[x]` Add Mineflayer feature comparison reference doc.
- `[x]` Split docs into reference docs and in-dev notes.
- `[x]` Add this checkpoint list.
- `[ ]` Add quickstart docs.
- `[ ]` Add API surface docs.
- `[ ]` Add protocol packet notes for inventory/crafting/trading.
- `[ ]` Add examples:
  - Connect and chat.
  - Look and movement controls.
  - Block scan.
  - Dig and place.
  - Inventory actions.
  - Open container and transfer item.
  - Craft item.
  - Trade with villager.

## Release Readiness Checkpoints

- `[ ]` Clean public export exists and is documented.
- `[ ]` `pnpm test` passes.
- `[ ]` Packet round-trip checks pass for modified stack request shapes.
- `[ ]` Geyser smoke tests pass for connect, movement, inventory, crafting, containers, and trading.
- `[ ]` README explains Bedrock/Geyser scope clearly.
- `[ ]` Docs distinguish stable APIs from in-dev internals.
- `[ ]` Known Mineflayer incompatibilities are documented rather than implied.
