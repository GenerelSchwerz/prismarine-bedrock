# TASK 06 - Crafting Via Bedrock Item Stack Requests

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-13
- **Scope:** Track the Bedrock-native crafting path from planner output to `item_stack_request` execution.
- **Owned files:** `src/builtins/crafting.js`, `src/builtins/setup.js`, `test/static/crafting.test.js`, `test/live/crafting.test.js`, `docs/in-dev/crafting-util-implementation-notes.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/crafting-util-implementation-notes.md`, `test/rules.md`

## Goal

The bot should craft vanilla recipes through Bedrock `crafting_data` and `item_stack_request` while preserving server-authoritative inventory state and Bedrock stack identity.

## Non-Goals

- Do not reintroduce a local Bedrock planner fallback unless explicitly requested.
- Do not synthesize inventory changes after crafting. Inventory updates must come from server packets.
- Do not treat Geyser acceptance as proof that BDS accepts the same semantic request.

## Current Architecture

- `src/builtins/setup.js` subscribes to `crafting_data` and appends recipes to `botState.bedrockCraftingRecipes`.
- `src/builtins/crafting.js` uses `mineflayer-crafting-util` for planning and resolves each utility step against live Bedrock recipe data before execution.
- `buildActions()` emits either recipe-book auto craft actions or normal craft actions.
- `sendRequest()` sends Bedrock `item_stack_request` payloads and waits for matching `item_stack_response`.
- Static coverage in `test/static/crafting.test.js` asserts the action ordering for `craft_recipe_auto`, `craft_recipe`, `results_deprecated`, `consume`, and `take`.
- Live coverage in `test/live/crafting.test.js` exercises planning and crafting against the configured local server target.

## Current Plan

- `[ ]` Verify the current uncommitted crafting implementation with `pnpm run test:static`.
- `[ ]` Round-trip representative `craft_recipe_auto` and `craft_recipe` packets through `scripts/roundtrip-packet.js` if their shape changes.
- `[ ]` Run focused live crafting tests against Endstone/BDS and Java/Geyser targets.
- `[ ]` Record server-specific behavior, including rejected response statuses and any Geyser routing differences.
- `[ ]` Mark complete only after evidence covers static tests, packet round-trips for changed shapes, and at least one live server target.

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Planner bridge review | Unassigned | `src/builtins/crafting.js`, `docs/in-dev/crafting-util-implementation-notes.md` | Confirm utility step resolution and live recipe matching constraints | `[ ]` |
| Packet shape verification | Unassigned | `scripts/roundtrip-packet.js`, temp JSON under `logs/` | Round-trip evidence for craft request shapes | `[ ]` |
| Live BDS evidence | Unassigned | `test/live/crafting.test.js`, `logs/` | Focused Endstone/BDS pass/fail with packet evidence if needed | `[ ]` |
| Live Geyser evidence | Unassigned | `test/live/crafting.test.js`, `temp-geyser-inspect/` notes only | Focused Java/Geyser pass/fail and translator notes if behavior diverges | `[ ]` |

## Evidence Log

- `2026-05-13` - Task log seeded from repository inspection. No tests run in this documentation-only pass.
- Existing static test path to run: `pnpm run test:static`.
- Existing live test path to run: `pnpm run test:live -- --grep crafting` or a focused Mocha invocation matching the target test name.

## Protocol Notes

- Verify packet shape in `node_modules/minecraft-data/minecraft-data/data/bedrock/1.21.130/proto.yml` and `types.yml` before changing craft packet construction.
- Use `temp-gophertunnel-inspect/minecraft/protocol/item_stack.go` for craft action enum and response status context.
- Use `temp-gophertunnel-inspect/minecraft/protocol/packet/crafting_data.go` and `temp-gophertunnel-inspect/minecraft/protocol/recipe.go` when validating recipe packet semantics.
- Use string enum names such as `craft_recipe`, `craft_recipe_auto`, `consume`, and `take`.
- Include `custom_names: []` and `cause: 'chat_public'` in `ItemStackRequest`.
- Include `dynamic_container_id` in `FullContainerName` slot objects unless a packet round-trip and live server test prove a narrower shape is accepted.

## Known Risks

- `crafting_data` recipe IDs and live item runtime IDs can differ from static planning IDs. Keep planning IDs and wire/runtime IDs conceptually separate.
- Geyser may accept or route a request differently from standalone BDS. Treat divergence as a system-under-test finding, not immediate proof that local packet shape is wrong.
- Server inventory update timing can make multi-step crafting fail if the next step starts before authoritative inventory packets settle.

## Handoff

First, inspect the current dirty changes in `src/builtins/crafting.js`, `test/static/crafting.test.js`, and `test/live/crafting.test.js` before editing. Then run static crafting tests and record exact results here. If packet shape changes, add a temporary JSON packet under `logs/`, run `node scripts/roundtrip-packet.js .\logs\<file>.json`, and summarize the parsed actions without committing the raw log.

## Completion Checklist

- `[ ]` Task log updated with final evidence.
- `[ ]` `pnpm run test:static` or focused equivalent passed.
- `[ ]` Packet round-trip run for changed craft packet shapes.
- `[ ]` Focused live crafting test run against at least one target, or deferred with reason.
- `[ ]` Raw debug logs kept out of git.
