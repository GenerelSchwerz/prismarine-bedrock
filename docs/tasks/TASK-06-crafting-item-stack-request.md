# TASK 06 - Crafting Via Bedrock Item Stack Requests

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-13
- **Scope:** Track the Bedrock-native crafting path from planner output to `item_stack_request` execution.
- **Owned files:** `src/builtins/crafting.js`, `src/builtins/inventory.js`, `src/builtins/containers/index.js`, `scripts/decode-endstone-packet-recording.js`, `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `scripts/e2e-server/help.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/options.js`, `scripts/e2e-server/process-utils.js`, `test/static/crafting.test.js`, `test/live/crafting.test.js`, `test/recorded-bds/scenarios/craft-wooden-pickaxes-at-table.json`, `docs/in-dev/crafting-util-implementation-notes.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/crafting-util-implementation-notes.md`, `test/rules.md`

## Goal

The bot should craft vanilla recipes through Bedrock `crafting_data` and `item_stack_request` while preserving server-authoritative inventory state and Bedrock stack identity.

## Non-Goals

- Do not reintroduce a local Bedrock planner fallback unless explicitly requested.
- Do not apply speculative inventory changes after crafting. Any local mirror update must be tied to an accepted server packet and its request context.
- Do not treat Geyser acceptance as proof that BDS accepts the same semantic request.

## Current Architecture

- `src/builtins/setup.js` subscribes to `crafting_data` and appends recipes to `botState.bedrockCraftingRecipes`.
- `src/builtins/crafting.js` uses `mineflayer-crafting-util` for planning and resolves each utility step against live Bedrock recipe data before execution.
- `buildActions()` emits either recipe-book auto craft actions or normal craft actions.
- `sendRequest()` sends Bedrock `item_stack_request` payloads and waits for matching `item_stack_response`.
- Static coverage in `test/static/crafting.test.js` asserts the action ordering for `craft_recipe_auto`, `craft_recipe`, `results_deprecated`, `consume`, and `take`.
- Live coverage in `test/live/crafting.test.js` exercises planning and crafting against the configured local server target.

## Current Plan

- `[x]` Verify the current uncommitted crafting implementation with focused static tests.
- `[x]` Compare normal craft packet shape against Endstone recorder output from a real 1.26.12 client.
- `[x]` Run focused live normal-crafting test against Endstone/BDS.
- `[ ]` Round-trip representative `craft_recipe_auto` and `craft_recipe` packets through `scripts/roundtrip-packet.js` if their standalone JSON examples are refreshed.
- `[ ]` Run broader live crafting coverage, including Java/Geyser, if the next task needs cross-target evidence.

## Current State

- Normal inventory crafting now matches the real-client Endstone trace closely enough for BDS 1.26.12.2 to accept the requests.
- Full Endstone live crafting coverage still does not pass every test. Inventory planks crafting passes, but workbench pickaxe cases currently fail around bot-driven table setup/opening rather than the final pickaxe packet shape.
- A new human-driven Endstone recording scenario, `craft-wooden-pickaxes-at-table`, has been added under `test/recorded-bds/scenarios/` to capture the real client's workbench-open and wooden-pickaxe craft packets.
- The rerun of the human scenario includes `player_auth_input` packets. Compared with the bot's failed open attempt, the human client keeps `interact_rotation` and `camera_orientation` synchronized with the view direction before BDS emits the `workbench` `container_open`; the bot currently sends those fields as zero vectors.
- The orientation-only bot rerun still timed out. The next visible mismatch is `click_pos`: the bot sent the fixed center of the top face while its yaw/pitch ray hit near the edge; the human client's `click_pos` matches the current view ray.
- A live observer screenshot showed the bot was not visibly looking at the crafting table before open. The movement loop only sent `player_auth_input` in server-authoritative mode, so the next edit explicitly syncs look rotation with a `move_player` packet before block-container use.
- The real-client scenario showed workbench open uses `inventory_transaction` `item_use` with `player_pos` at eye height (`y=65.62` when standing at `y=64`). The bot's failed workbench-open packet used feet position (`y=64`), so the next edit is to send eye position for container block opens.
- `mineflayer-crafting-util` plan handling uses the current `status` contract while keeping legacy `success` compatibility.
- Normal crafting opens the player inventory first, sends negative request IDs, uses `cause: -1`, omits `dynamic_container_id` in the observed craft slot refs, places inventory craft inputs in `crafting_input` slot `30` first, and uses the final request ID as the `creative_output` stack id.
- The accepted `item_stack_response` for `hotbar_and_inventory` does not include an item network ID. `crafting.js` now applies the accepted craft result using the request's `results_deprecated` item plus the server-confirmed count/stack id. `inventory.js` no longer clears non-empty response slots when the response lacks item type data.
- Endstone packet recorder now records `player_auth_input` like any other packet unless packet-id filtering excludes it. The decoder prints auth input as deltas by default so unchanged ticks do not flood analysis output.
- Non-loop immediate auth-input sends have been removed. Auth-input edits now ride the regular movement tick, and container-open look synchronization waits briefly for the main auth-input loop instead of forcing an immediate packet.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/crafting.js` | modified | Ported plan handling to `status`, added real-client normal-craft request shape, split normal crafts into one application per request, and applies accepted craft results from response/request context. |
| `src/builtins/inventory.js` | modified | Treats `hotbar_and_inventory` as a main inventory response container and avoids clearing non-empty slots when response data lacks item type. |
| `src/builtins/auth-input.js` | modified | `flushPlayerAuthInput()` no longer sends an immediate auth-input packet; queued edits are consumed by the next main movement tick. |
| `src/builtins/physics/index.js` | modified | Removed the immediate auth-input helper from the public bot state. |
| `src/builtins/containers/index.js` | modified | Aligns block-open `inventory_transaction` player position with real Bedrock client eye-height `player_pos`; waits briefly for the normal auth-input loop after look changes instead of forcing an immediate auth-input send. |
| `test/static/crafting.test.js` | modified | Updated normal-craft expectations for `place`, `hotbar_and_inventory`, slot `30`, and current/legacy plan status normalization. |
| `test/live/crafting.test.js` | modified | Focused oak-planks live tests on inventory crafting setup and `status === "complete"`. |
| `test/static/food.test.js` | modified | Static food test now simulates the regular auth-input pre-send hook instead of `flushPlayerAuthInput()` sending a packet itself. |
| `docs/reference/mineflayer-feature-comparison.md` | modified | Removed the immediate auth-input helper from the documented exposed movement API. |
| `test/recorded-bds/scenarios/craft-wooden-pickaxes-at-table.json` | added | Human-driven workbench craft scenario for recording real-client crafting-table and wooden-pickaxe packet flow. |
| `scripts/decode-endstone-packet-recording.js` | modified | Streams input line-by-line, writes optional `--out` decoded JSONL, uses compact summary output by default, keeps `--packet-ids=` filtering, supports `--full`, and always emits `player_auth_input` as deltas. |
| `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` | checked | Auth-input-specific disable/sample checks are absent; packet-id filtering is the only packet exclusion path. |
| `scripts/e2e-server/help.js`, `scripts/e2e-server/options.js` | modified | Auth-input recorder controls are absent from launcher help/options; existing cleanup-orphans option changes remain in the worktree. |
| `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js` | checked | Auth-input recorder env plumbing is absent; no current diff remains from this cleanup. |
| `test/recorded-bds/README.md` | modified | Documents compact decoded summaries, `--full --out`, default `player_auth_input` delta decoding, and avoiding broad raw JSONL reads. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Planner bridge review | Unassigned | `src/builtins/crafting.js`, `docs/in-dev/crafting-util-implementation-notes.md` | Confirm utility step resolution and live recipe matching constraints | `[ ]` |
| Packet shape verification | Unassigned | `scripts/roundtrip-packet.js`, temp JSON under `logs/` | Round-trip evidence for craft request shapes | `[ ]` |
| Live BDS evidence | Unassigned | `test/live/crafting.test.js`, `logs/` | Focused Endstone/BDS pass/fail with packet evidence if needed | `[ ]` |
| Live Geyser evidence | Unassigned | `test/live/crafting.test.js`, `temp-geyser-inspect/` notes only | Focused Java/Geyser pass/fail and translator notes if behavior diverges | `[ ]` |

## Evidence Log

- `2026-05-13` - Task log seeded from repository inspection. No tests run in this documentation-only pass.
- `2026-05-13` - Real-client Endstone recorder trace for normal oak-log to oak-planks craft showed:
  - `container_open` inventory window id `2`.
  - `item_stack_request -25`: `take` from `hotbar` slot `0` stack `5` to `cursor`.
  - `item_stack_request -27`: `place` from `cursor` to `crafting_input` slot `30`.
  - `item_stack_request -29`: `craft_recipe 272`, `results_deprecated`, `consume crafting_input slot 30 stack 5`, and `place creative_output slot 50 stack -29` to `hotbar_and_inventory` slot `0`; response `ok`.
- `2026-05-13` - `node -c src\builtins\crafting.js; node -c src\builtins\inventory.js; node -c scripts\decode-endstone-packet-recording.js` passed.
- `2026-05-13` - `python -m py_compile scripts\endstone-packet-recorder\src\endstone_packet_recorder\recorder.py` passed; generated tracked pyc was restored afterward.
- `2026-05-13` - `npx mocha test\static\crafting.test.js test\static\inventory-mirror.test.js` passed: 6 passing.
- `2026-05-13` - Focused Endstone live run passed:
  - Command: `$env:E2E_ENDSTONE_PACKAGE='endstone'; $env:MC_VERSION='1.26.10'; $env:E2E_PACKET_RECORD_FILE='logs/bot-normal-craft-endstone.jsonl'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --exit-after-client --client-timeout-ms=300000 --client node scripts/tmp/run-endstone-normal-craft.js`
  - Server: Endstone `0.11.3`, BDS `1.26.12.2`, bot protocol version `1.26.10`.
  - Result: focused live `normal crafts oak planks from oak logs with the live server recipe data` passed, 1 passing.
  - Observed bot requests: final craft requests used `crafting_input` slot `30`, `creative_output` stack ids `-29` and `-35`, and server responses were `ok`; local mirror reached `oak_planks x8`.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: full static suite passed, 47 passing.
- `2026-05-13` - Full Endstone live crafting run - FAIL. Command: `$env:E2E_ENDSTONE_PACKAGE='endstone'; $env:MC_VERSION='1.26.10'; $env:E2E_PACKET_RECORD_FILE='logs/bot-full-crafting-endstone.jsonl'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --exit-after-client --client-timeout-ms=600000 --client node node_modules/mocha/bin/mocha.js --config .mocharc.live.json test/live/crafting.test.js`. Server: Endstone `0.11.3`, BDS `1.26.12.2`. Result: 3 passing, 2 failing. Inventory oak-planks tests passed; recursive wooden-pickaxe tests failed around bot-driven workbench setup/opening.
- `2026-05-13` - Added human workbench scenario - PASS. Notes: `test/recorded-bds/scenarios/craft-wooden-pickaxes-at-table.json` parses successfully and will record a real client opening a crafting table, sending `item_stack_request`, and ending with three `minecraft:wooden_pickaxe` items.
- `2026-05-13` - Removed non-loop auth-input sends - PASS. Notes: repository search for the removed immediate auth-input helper found no matches after code/docs cleanup.
- `2026-05-13` - Syntax checks - PASS. Command: `node -c src\builtins\auth-input.js; node -c src\builtins\containers\index.js; node -c src\builtins\physics\index.js; node -c test\static\food.test.js`.
- `2026-05-13` - `npx mocha test\static\food.test.js` - PASS. Notes: 3 passing.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: full static suite passed, 48 passing.
- `2026-05-13` - Auth-input delta decode smoke - PASS. Notes: generated `scripts/tmp/player-auth-input-delta-sample.jsonl`; default decode produced 2 lines because one packet only changed ignored `tick`; final delta reported `yaw` and `head_yaw` changing from `0` to `90`.
- `2026-05-13` - Packet logging simplification checks - PASS. Notes: stale auth-input option search returned no matches; JS syntax checks for decode, relay, and e2e-server helper files passed; `python -m py_compile scripts\endstone-packet-recorder\src\endstone_packet_recorder\recorder.py` passed.
- `2026-05-13` - Compact decoder summary mode - PASS. Notes: decoder now streams input, omits full decoded params by default, produces packet-specific summaries for common inventory/container/action packets, keeps `--full --out` for targeted raw decoded params, and summarizes initial auth input without listing every false flag.
- `2026-05-13` - Rerun human Endstone scenario - PASS. Raw log: `.e2e-servers/endstone-bds/logs/human-craft-wooden-pickaxes.jsonl` contains appended run with `player_auth_input` packet id `144` and `scenario_end status=complete`. Decoded focused traces: `logs/decoded-human-pickaxe-auth-open.jsonl` and `logs/decoded-bot-pickaxe-auth-open.jsonl`.
- `2026-05-13` - Workbench-open comparison - IN PROGRESS. Human trace before `container_open workbench` shows `interact_rotation` tracking yaw/pitch and `camera_orientation` tracking the view vector; latest bot trace changes `yaw`, `pitch`, and `head_yaw` only, leaving those auth-input fields at zero.
- `2026-05-13` - Focused Endstone pickaxe after auth orientation patch - FAIL. Command used `E2E_PACKET_RECORD_FILE=logs/bot-focused-pickaxe-orientation-auth.jsonl` and grep `crafts a wooden pickaxe through recursive multi-step planning`; result remained `Timed out waiting for container_open`. Decoded trace `logs/decoded-bot-pickaxe-orientation-open-packets.jsonl` confirmed `interact_rotation` and `camera_orientation` now update, but BDS still does not emit `container_open`.
- `2026-05-13` - Follow-up packet comparison - IN PROGRESS. Human top-face open uses a click position derived from the current view ray, e.g. local top-face coordinates around `x=0.61,z=0.45` in the auth-input scenario rerun. Bot top-face open sent fixed center `x=0.5,z=0.5` while its yaw/pitch ray from `player_pos=0.5,65.62,0.5` intersects closer to the west edge. Next edit derives block-open `click_pos` from the current view ray.
- `2026-05-13` - Focused Endstone pickaxe after ray-derived click and side-face selection - FAIL. Raw logs: `.e2e-servers/endstone-bds/logs/bot-focused-pickaxe-ray-click.jsonl` and `.e2e-servers/endstone-bds/logs/bot-focused-pickaxe-side-face.jsonl`. The side-face run sent `player_action start_item_use_on` face `4` and `inventory_transaction item_use` face `4`, but BDS still did not send `container_open`.
- `2026-05-13` - Focused Endstone pickaxe with human client connected - INVALID. Raw log: `.e2e-servers/endstone-bds/logs/bot-focused-pickaxe-human-standpos.jsonl`; `Generel7050` joined during the bot run, contaminating the packet stream and server state. Do not use this run as pass/fail evidence.
- `2026-05-13` - Look sync patch - PASS static checks. Added explicit `syncLook()` before block-container use; `node -c` passed for `src/builtins/physics/movement-packets.js`, `src/builtins/physics/index.js`, and `src/builtins/containers/index.js`; `npx mocha test/static/crafting.test.js test/static/food.test.js` passed with 9 passing.

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

## Resume Notes

- Next step, if continuing this task: run the broader live crafting suite or Java/Geyser target to check for regressions outside Endstone normal inventory crafting.
- Raw logs: `.e2e-servers/endstone-bds/logs/bot-normal-craft-endstone.jsonl` contains appended bot recorder runs; decode focused packets with `node scripts/decode-endstone-packet-recording.js .e2e-servers\endstone-bds\logs\bot-normal-craft-endstone.jsonl 1.26.10 --packet-ids=46,147,148`.
- Do not repeat: the real-client packet shape mismatch for slot `30` and `creative_output.stack_id = request_id` has already been validated against Endstone.

## Final Summary

Normal inventory crafting of oak planks from oak logs now succeeds against Endstone/BDS 1.26.12.2 using the current 1.26.10 protocol data. Broader crafting coverage remains a follow-up.

## Failure Summary

Not blocked.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` `pnpm run test:static` or focused equivalent passed.
- `[ ]` Packet round-trip run for changed craft packet shapes.
- `[x]` Focused live crafting test run against at least one target, or deferred with reason.
- `[x]` Raw debug logs kept out of git.
