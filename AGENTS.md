# Agent Workflow

This repo is optimized for long-running AI work where several agents may split a feature, leave durable evidence, and hand off without relying on chat history. Treat this file as the entrypoint, then follow the linked subsystem notes before editing code.

## Start Every Task

1. Read this file.
2. Run `git status --short` and treat existing changes as user or peer-agent work. Do not revert them unless explicitly asked.
3. For core bot implementation, protocol/client-server behavior, live server interactions, packet schemas, inventory/crafting/trading flows, physics, or long-running investigations, look for an existing task log under `docs/tasks/` that matches the work. Read its `Current State`, `Change Ledger`, `Resume Notes`, and `Final Summary` or `Failure Summary` before editing.
4. Create or update a task log under `docs/tasks/` before making substantial core bot or protocol changes. Use `docs/tasks/TEMPLATE.md`. Simple repo maintenance, documentation wording, examples, static helper cleanup, dependency metadata, or mechanical version/configuration cleanup does not require a task log unless the user asks for one.
5. Identify owned files for the current task. If multiple agents are working, each agent must keep to disjoint write scopes or explicitly coordinate before touching shared files.
6. Read the subsystem guide for the files you will edit.
7. Keep runtime/debug artifacts in `logs/` or `scripts/tmp/`; both are gitignored. Commit only the distilled evidence in `docs/tasks/`.

## Task Logs

Task logs are the source of truth for active and completed bot/protocol investigations. Each meaningful task should have one markdown file:

```text
docs/tasks/TASK-NN-short-title.md
```

Use a stable task number when one already exists. Otherwise choose the next available number. Do not create task logs for simple maintenance that does not change core bot behavior or client-to-server interactions. A task log should record:

- Status: `[ ] planned`, `[/] active`, `[x] complete`, `[!] blocked`, or `[-] abandoned`.
- Owner and date.
- Goal, scope, and non-goals.
- Files owned by the task.
- Current plan and parallel subtasks.
- Current state: what has already changed, what is in progress, and the next exact resume step.
- Change ledger: file-by-file notes for edits already made or intentionally skipped.
- Evidence: exact commands, server target, dates, and pass/fail result.
- Architecture notes and known quirks discovered while working.
- Handoff notes for the next agent.
- Final summary or failure summary when the task stops.

Update the log at these points:

- When the plan changes.
- After editing files, before starting unrelated investigation.
- Before handing off to another agent.
- After any packet round-trip, static test, live test, or server run.
- When marking the task complete or blocked.

Do not paste huge packet dumps into task logs. Put raw output in `logs/` and summarize the relevant packet names, request IDs, response statuses, and file path.

## Resume And Stop Rules

An interrupted task should be restartable from the task log without repeating prior work.

Before editing an active task:

- Read the task log's `Current State`, `Change Ledger`, `Evidence Log`, and `Resume Notes`.
- Compare those notes with `git status --short` and the current diff for owned files.
- If the same change already exists in the worktree, continue from verification or the next unchecked plan item instead of reapplying it.
- If task notes and the worktree disagree, record the discrepancy in `Resume Notes` before changing code.

Before stopping, even on failure:

- Update `Current State` with the exact state of the worktree and the next command or file to inspect.
- Update `Change Ledger` with every file touched and the intent of each change.
- Add evidence for commands already run, including failed commands.
- Fill either `Final Summary` for completed work or `Failure Summary` for blocked/abandoned work.
- Leave raw logs in `logs/` and link or name them from the task log.

## Parallel Agent Rules

- Split work by ownership boundary, not by random file chunks.
- Good splits: packet schema research, static tests, live reproduction, isolated module implementation, Geyser translator inspection.
- Bad splits: two agents editing `src/builtins/crafting.js` at the same time, or one agent changing tests while another changes the same assertions.
- A subtask must list owned files and expected outputs in the parent task log.
- Agents should not rewrite another agent's task log section except to append handoff or verification results.
- If a shared file must be touched, pause and record the coordination decision in the task log first.

## Repository Map

- `src/index.js`, `src/state.js`: bot construction and shared state.
- `src/version.js`: default Bedrock protocol version, `MC_VERSION` normalization, registry names, and versioned `minecraft-data` path helpers.
- `src/builtins/setup.js`: login/start-game setup, registry/runtime setup, and packet listeners that feed shared state.
- `src/builtins/inventory.js`: passive server-authoritative inventory mirror.
- `src/builtins/inventory-actions.js`: active Bedrock `item_stack_request` inventory mutations.
- `src/builtins/inventory-simulation.js`: pure prediction/planning helpers. Do not make it authoritative.
- `src/builtins/crafting.js`: crafting planner bridge and Bedrock craft request execution.
- `src/builtins/trading.js`: villager trade stack requests.
- `src/builtins/containers/`: container-specific APIs and slot metadata.
- `src/builtins/physics/`: Bedrock movement, auth input, and physics adapters.
- `src/container-metadata.js`: Bedrock container and slot identity helpers.
- `test/static/`: tests that do not connect to the shared Bedrock server.
- `test/live/`: tests that connect to a local Bedrock/Geyser target.
- `scripts/roundtrip-packet.js`: local Bedrock protocol serializer/deserializer check.
- `scripts/e2e-servers.js`: local Endstone/BDS and Java/Geyser launcher.
- `temp-geyser-inspect/`: local Geyser checkout for translator inspection. Do not treat it as repo source.
- `temp-gophertunnel-inspect/`: local Gophertunnel checkout for Bedrock protocol reference. Do not treat it as repo source.

## Required Reading By Area

- Crafting changes: read `docs/in-dev/crafting-util-implementation-notes.md` before editing `src/builtins/crafting.js`.
- Tests: read `test/rules.md` before creating or changing tests.
- E2E launcher behavior: read `docs/in-dev/e2e-server-launch-notes.md` before changing `scripts/e2e-server/**` or live-test launch commands.
- Physics/movement: read `docs/in-dev/bedrock-first-physics-implementation-notes.md` before editing `src/builtins/physics*`.
- Mineflayer parity or API coverage: read `docs/reference/mineflayer-feature-comparison.md` and `docs/in-dev/mineflayer-parity-checkpoints.md`.

## Bedrock Protocol Sources

For packet shapes, verify the versioned `minecraft-data` sources before changing packet send/receive code:

```text
node_modules/minecraft-data/minecraft-data/data/bedrock/<MC_VERSION>/proto.yml
node_modules/minecraft-data/minecraft-data/data/bedrock/<MC_VERSION>/types.yml
```

Use `src/version.js` for the default version and helpers such as `minecraftDataBedrockDir()`. The default client/protocol version is `1.26.10`; shorthand `26.10` is normalized to `1.26.10` before calling `bedrock-protocol` or `prismarine-registry`. Do not hard-code old version directories or older `.pnpm/minecraft-data@...` paths in notes or scripts.

For crafting, inventory, or trading behavior, verify these schema entries:

- `packet_item_stack_request`
- `packet_item_stack_response`
- `ItemStackRequest`
- `ItemStackResponses`
- `StackRequestSlotInfo`
- `FullContainerName`
- `ContainerSlotType`

Use Gophertunnel as an additional protocol reference when `minecraft-data` names are unclear or when you need action/status enum context. The local checkout is intentionally gitignored:

```powershell
cd C:\Users\owner\Documents\github\bedrock-test\temp-gophertunnel-inspect
```

Useful Gophertunnel entrypoints:

- `minecraft/protocol/packet/item_stack_request.go`
- `minecraft/protocol/packet/item_stack_response.go`
- `minecraft/protocol/packet/crafting_data.go`
- `minecraft/protocol/item_stack.go`
- `minecraft/protocol/recipe.go`
- `minecraft/protocol/packet/player_auth_input.go`

Fast navigation:

```powershell
rg -n "CraftRecipe|CraftRecipeAuto|StackRequestAction|ItemStackResponseStatus" temp-gophertunnel-inspect\minecraft\protocol
rg -n "type ItemStackRequest|type ItemStackResponse|type CraftingData" temp-gophertunnel-inspect\minecraft\protocol
```

Do not copy Gophertunnel structs into this JavaScript repo as a substitute for checking the installed `minecraft-data` schema and local serializer. Use it to explain intent, enum ordering, and packet semantics.

## Data Sources

When recording evidence in a task log, name the source class:

- Protocol schema: `minecraft-data` files under `node_modules/minecraft-data/minecraft-data/data/bedrock/<MC_VERSION>/`.
- Protocol semantics: local Gophertunnel checkout under `temp-gophertunnel-inspect/`.
- Proxy/server translation behavior: local Geyser checkout under `temp-geyser-inspect/`.
- Runtime server data: packets observed from the active server, especially `crafting_data`, `item_registry`, `inventory_content`, `inventory_slot`, `item_stack_request`, and `item_stack_response`.
- Raw local evidence: `logs/` and `scripts/tmp/`, which are gitignored.
- E2E server artifacts: `.e2e-servers/`, which is gitignored.

Avoid relying on stale chat excerpts, old `.pnpm` store paths, copied examples from another checkout, or Geyser-only success when the question is standalone BDS behavior.

## Packet Round-Trip Checks

Before testing packet behavior against Geyser or BDS, round-trip any new packet shape through the local serializer/deserializer:

```powershell
node scripts/roundtrip-packet.js --example item_stack_swap
node scripts/roundtrip-packet.js --example item_stack_take
node scripts/roundtrip-packet.js --example item_stack_drop
```

For custom packets, put a full packet object in JSON and pass the file:

```json
{
  "name": "item_stack_request",
  "params": {
    "requests": [{
      "request_id": 1,
      "actions": [{
        "type_id": "take",
        "count": 1,
        "source": {
          "slot_type": { "container_id": "hotbar", "dynamic_container_id": 0 },
          "slot": 0,
          "stack_id": 2
        },
        "destination": {
          "slot_type": { "container_id": "hotbar", "dynamic_container_id": 0 },
          "slot": 1,
          "stack_id": 0
        }
      }],
      "custom_names": [],
      "cause": "chat_public"
    }]
  }
}
```

```powershell
node scripts/roundtrip-packet.js .\path\to\packet.json
```

The round-trip validates encoding shape, enum names, conditional bodies, and optional field layout. It does not prove the server will accept the request semantically; acceptance still depends on stack IDs, slot IDs, inventory state, open windows, and game mode.

## Item Stack Request Rules

- Protocol enum fields must be string names, not numeric ordinals. Numeric action IDs can serialize only the action header and omit required conditional bodies.
- `StackRequestSlotInfo` uses:

```js
{
  slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
  slot: 0,
  stack_id: 2
}
```

- Do not use flattened fields such as `container: 'inventory'` for stack request slots.
- Include `FullContainerName.dynamic_container_id` explicitly unless a round-trip and server test prove omission is valid.
- `ItemStackRequest` uses `custom_names: []` and `cause: 'chat_public'`; do not use stale names such as `strings` or `filter_strings`.
- In player-auth-input paths, `item_stack_request` is embedded in `player_auth_input`, but the standalone `item_stack_request` packet has the same `ItemStackRequest` structure and is the preferred first shape check.

## Inventory State Rules

- Preserve server-authoritative Bedrock stack identity from raw items into prismarine items: `stackId`, `stack_id`, `networkId`, `network_id`, `blockRuntimeId`, `block_runtime_id`, and `raw`.
- `item_stack_response` may report main player inventory changes under `slot_type.container_id: 'hotbar'`, not only `inventory`. Treat both as updates to the local main inventory mirror.
- `destroy` item-stack-request actions are creative-inventory behavior. In survival tests, use `drop` for removing items from a slot unless explicitly testing creative mode.
- Keep these states separate:
  - `inventory.js`: server-confirmed mirror.
  - `inventory-simulation.js`: pure prediction/planning.
  - `inventory-actions.js`: sends Bedrock requests, waits for responses, then applies accepted server response data.

## Local Geyser Code

Treat Geyser as part of the system under test, not as a perfect oracle. After local packet round-trips pass and the packet shape matches `minecraft-data`, a failure or suspicious `item_stack_response: ok` may be caused by Geyser routing or translator behavior.

Local checkout:

```powershell
cd C:\Users\owner\Documents\github\bedrock-test\temp-geyser-inspect
```

Useful entrypoints:

- `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/entity/player/input/BedrockPlayerAuthInputTranslator.java`
- `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/BedrockItemStackRequestTranslator.java`
- `core/src/main/java/org/geysermc/geyser/inventory/InventoryHolder.java`
- `core/src/main/java/org/geysermc/geyser/translator/inventory/InventoryTranslator.java`
- `core/src/main/java/org/geysermc/geyser/translator/inventory/EnchantingInventoryTranslator.java`

Fast navigation:

```powershell
rg -n "PERFORM_ITEM_STACK_REQUEST|ItemStackRequestPacket|translateRequests" temp-geyser-inspect\core\src\main\java
rg -n "TransferItemStackRequestAction|DestroyStackRequestAction|DropStackRequestAction" temp-geyser-inspect\core\src\main\java\org\geysermc\geyser\translator\inventory
rg -n "bedrockSlotToJava|javaSlotToBedrock|ContainerSlotType" temp-geyser-inspect\core\src\main\java\org\geysermc\geyser\translator\inventory
```

## Testing

- Static tests: `pnpm run test:static`
- Live tests: `pnpm run test:live`
- Java/Geyser e2e live test: `pnpm run test:live:e2e:java`
- Parallel Java/Geyser live shards: `pnpm run test:live:e2e:java:parallel`
- All default tests: `pnpm test`

Before live reruns, wait 3-5 seconds. The Bedrock server can keep the previous player connection alive for about 10-15 seconds after disconnect.

If a live packet failure is unclear after the first focused run, inspect packet traffic before guessing:

```powershell
$env:DEBUG='minecraft-protocol'
node examples/crafting.js 2>&1 | Select-String -NotMatch 'player_auth_input'
```

For longer investigations:

```powershell
New-Item -ItemType Directory -Force .\logs
$env:DEBUG='minecraft-protocol'
node examples/crafting.js *> .\logs\crafting-example-debug.log
rg -n "item_stack|inventory|container|craft|error" .\logs\crafting-example-debug.log
```

Keep raw packet logs local unless a test explicitly asserts on them.
