# TASK 19 - Aim And Shoot Entity

- **Status:** `[/]` active
- **Owner:** Agent / 2026-05-15
- **Scope:** Build and verify bot behavior for aiming at an entity and shooting it with a bow using the Recorded BDS Workflow.
- **Owned files:** `docs/tasks/TASK-19-aim-and-shoot-entity.md`, `test/recorded-bds/scenarios/aim-and-shoot-cow.json`, `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `test/static/endstone-packet-recorder.test.js`, `test/recorded-bds/bots/aim-and-shoot-cow.js`, future focused `src/` and test files only after packet evidence.
- **Related docs:** `AGENTS.md`, `test/recorded-bds/README.md`, `docs/in-dev/e2e-server-launch-notes.md`, `test/rules.md`, `docs/tasks/TASK-18-recorded-bds-gym.md`.

## Goal

Use the recorded BDS workflow to capture a human aiming and shooting a bow at an entity, recreate it with the bot, compare packet traces, then promote proven general behavior into the library if needed. Success means the bot can aim at a target entity, draw/release a bow, complete the scenario, and either match the human packet trace or record intentional deviations.

## Non-Goals

- Do not automate the official Bedrock client.
- Do not promote exploratory packet hacks into `src/` before a successful scenario-local bot run and comparison.
- Do not solve all projectile prediction or moving-target combat in this task unless required by the stationary target trace.

## Current Plan

- `[x]` Tighten or confirm the recorded scenario so completion proves a target entity was hit.
- `[ ]` Capture or reuse a completed human run for `aim-and-shoot-cow`.
- `[ ]` Scaffold and implement the isolated bot recreation script.
- `[ ]` Run the bot scenario and compare human vs bot packet traces.
- `[ ]` Promote only proven general behavior into `src/`, with focused tests.

## Current State

- Worktree state: existing uncommitted TASK-17/TASK-18 packet logging and gym files are present; this task must not revert them.
- Already implemented: `aim-and-shoot-cow` scenario existed before this task; the aim step now requires a cow near `[0, 65, 8]` and `held_item_is minecraft:bow`, and the shoot step requires both arrow consumption and that cow's absence. `held_item_is` now reads Endstone `PlayerInventory.item_in_main_hand`, selected slot `get_item`, and nested `ItemStack.type.id`/`ItemType.id` identifiers.
- Confirmed: the live failure after the held-item resolver fix was the preceding `entity_exists` child in the `all` clearance. Endstone exposes nearby mobs through `level.actors`; once `_iter_nearby_entities` checked `actors`, Step 1 completed with both `entity_exists` and `held_item_is` passing.
- Human run complete and indexed: `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl` has both step completions, `scenario_complete`, and `scenario_end status=complete`; SQLite sidecar exists.
- Bot recreation is in progress in `test/recorded-bds/bots/aim-and-shoot-cow.js`. The latest rerun advanced past `equip-bow-and-aim` into `shoot-cow`, forced `OpBot` back to Survival in the bot recovery path, killed the cow, and completed the scenario.
- Follow-up from TASK-11 on `2026-05-16`: `bot.self.position` now represents eye position, so the scenario-local bot script was adjusted to pin eye position and send bow-use `player_pos` plus bow-release `head_pos` from that public coordinate instead of adding eye height a second time.
- Latest completed bot raw log: `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-21-04-301Z/packets.jsonl`; markers show both step completions, `scenario_complete`, and `scenario_end status=complete completed_steps=2`.
- Diagnosis for the immediately preceding failed run `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/packets.jsonl`: packet 27 showed the cow death animation at sequence `1512`, but Step 2 used `all` with `inventory_lacks arrow count 16`. Server inventory packets continued reporting arrows at count `16`, so the scenario stayed active despite the visible kill.
- Known mismatch between notes and worktree: `git status --short` currently reports unrelated `docs/tasks/TASK-20-available-commands-ready-handshake.md`; do not revert it for TASK-19.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-19-aim-and-shoot-entity.md` | changed | Created task log for the recorded BDS workflow run. |
| `test/recorded-bds/scenarios/aim-and-shoot-cow.json` | changed | Guarded against async setup false positives. Step 1 now requires `entity_exists` for the target-position cow plus `held_item_is minecraft:bow`; setup gives arrows before the bow so slot 1 is the bow and explicitly runs `gamemode survival {player}`. The old packet-count gate was removed because the human got stuck after equipping the bow. Step 2 now clears on target cow death or `ActorDeathEvent`; the arrow-consumption gate was removed because the failed `18:10` run killed the cow while server inventory still reported `arrow x16`. A tag-based attempt was reverted because BDS reported no targets for the tag selector immediately after summon. |
| `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` | changed | Fixed `held_item_is` to check Endstone's actual main-hand and selected-slot inventory APIs and to resolve nested item type identifiers instead of comparing stringified item/type objects. Fixed `entity_exists` to scan Endstone `dimension.actors`/`level.actors`, which was preventing `held_item_is` from being reached in `all` clearances. |
| `test/static/endstone-packet-recorder.test.js` | added | Covers `held_item_is` against Endstone-shaped `item_in_main_hand`, selected slot `get_item`, nested `ItemStack.type.id` identifiers, stale player-level held values, and `entity_exists` against Endstone `level.actors`. |
| `test/recorded-bds/bots/aim-and-shoot-cow.js` | changed | Scenario-local bot recreation now recovers bot inventory with explicit `OpBot` commands, forces Survival before recovery `clear`/`give`, equips the bow, avoids `syncLook`, and sends local bow `item_use`/`item_release` packets. It now pins `bot.self.position` as eye position and sends use/release positions without adding eye height twice. Latest run completes the scenario. |
| `src/builtins/chunks.js` | changed | Fixes limited subchunk polling readiness: `highest_subchunk_count` now marks higher sections as known all-air so post-teleport physics readiness does not wait forever on columns with low terrain. |
| `test/static/chunks-readiness.test.js` | changed | Adds a regression for a teleported Y=66 readiness check over a limited-polling column whose `highest_subchunk_count` is 0. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-15` - `node scripts/recorded-bds-gym.js status --scenario=aim-and-shoot-cow` - PASS. Notes: scenario exists, bot script absent, no human/bot/compare runs yet.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario JSON parses after target-death clearance change.
- `2026-05-15` - `Start-Process cmd.exe /k node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - FAIL. Notes: launch wrapper used `$PWD` instead of `$PWD.Path`; `node scripts/e2e-servers.js status --target=endstone` confirmed no Endstone process was left running.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - INVALIDATED. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `29564`; wrapper PID `5452`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-194230.out.log`. User screenshot showed scenario completed while cow was still alive. Server log showed `tag @e[type=cow,r=12]` and the tagged `effect` selector matched no targets, so the `entity_dead` tag query passed incorrectly.
- `2026-05-15` - `node scripts/e2e-servers.js cleanup-orphans --include-managed` - PASS. Notes: stopped invalid human capture launcher PID `29564` before restarting with fixed scenario.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after switching to position-bounded cow clearance.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - RUNNING. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `11564`; wrapper PID `15192`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-194500.out.log`; server log confirms `Gave Slowness * 255 to Cow`, so the spawned cow selector matched.
- `2026-05-15` - `rg -n '"type":"(step_complete|scenario_complete|scenario_end|player_quit|recorder_stop)"' logs/recorded-bds/aim-and-shoot-cow/human/2026-05-15T23-45-01-207Z/packets.jsonl` - PENDING. Notes: no completion markers yet after relaunch; server remains live.
- `2026-05-15` - User visual review of restarted scenario - FAIL. Notes: setup command ordering could still let the kill command satisfy target absence before the newly summoned cow was established. Scenario tightened to require target-position `entity_exists` before aim step completion, then require both arrow consumption and target-position `entity_dead` for shoot completion.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after adding the existence and arrow-consumption guards.
- `2026-05-15` - `node scripts/recorded-bds-gym.js status --scenario=aim-and-shoot-cow` - PASS. Notes: no completed human run is currently reusable; latest invalid/interrupted captures were not selected.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - RUNNING. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `25532`; wrapper PID `18116`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-194732.out.log`; server log shows old cow killed, new cow summoned, and slowness applied to the new cow.
- `2026-05-15` - User visual review of guarded scenario - FAIL. Notes: human was stuck on `equip-bow-and-aim` after equipping the bow. The stale capture's `step_start` marker showed the previous packet-count clearance was active. Scenario changed to use durable `held_item_is minecraft:bow` instead of `packet_seen` for this step.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after replacing the equip-step packet-count gate.
- `2026-05-15` - `node scripts/recorded-bds-gym.js status --scenario=aim-and-shoot-cow` - PASS. Notes: no completed human run is currently reusable.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - RUNNING. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `3728`; wrapper PID `28012`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-194925.out.log`; `step_start` marker confirms equip clearance is now `entity_exists` + `held_item_is minecraft:bow`.
- `2026-05-15` - User visual review of held-item scenario - FAIL. Notes: Step 1 appeared to exit too early. Likely cause: setup gave bow before arrows, so the client could begin Step 1 already holding the bow. Setup order changed to give arrows first and bow second so Step 1 requires an intentional bow selection.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after swapping arrow/bow give order.
- `2026-05-15` - `node scripts/recorded-bds-gym.js status --scenario=aim-and-shoot-cow` - PASS. Notes: no completed human run is currently reusable.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - RUNNING. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `4976`; wrapper PID `29104`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-195100.out.log`; setup log confirms `Gave Arrow` before `Gave Bow`, and `step_start` confirms `entity_exists` + `held_item_is minecraft:bow`.
- `2026-05-15` - User screenshot review of arrows-first held-item run - FAIL. Notes: bow was visibly selected while Step 1 remained active, so `held_item_is` is not reliable for this scenario. Stopped launcher PID `4976` with `node scripts/e2e-servers.js cleanup-orphans --include-managed` and replaced the equip clearance with `endstone_event_seen PlayerItemHeldEvent where new_slot=1`.
- `2026-05-15` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after switching from `held_item_is` to `PlayerItemHeldEvent`.
- `2026-05-15` - `rg -n "PlayerItemHeldEvent|new_slot|previous_slot|endstone_event_seen" scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py test/recorded-bds/README.md` - PASS. Notes: recorder imports `PlayerItemHeldEvent`, normalizes `new_slot` and `previous_slot`, and `endstone_event_seen` tracks events referenced by active scenario clearance.
- `2026-05-15` - `Start-Process powershell.exe -NoExit -Command node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow` - RUNNING. Notes: Endstone/BDS 1.26.12.2 ready on Bedrock UDP `19132`; recorder detected; launcher PID `26028`; wrapper PID `28016`; stdout `logs/recorded-bds/aim-and-shoot-cow/record-human-20260515-195255.out.log`; `scenario_loaded` marker confirms `endstone_events:["PlayerItemHeldEvent"]`.
- `2026-05-16` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after restoring `held_item_is minecraft:bow` for the equip step.
- `2026-05-16` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` - PASS. Notes: recorder compiles after held-item resolver changes.
- `2026-05-16` - `pnpm exec mocha test/static/endstone-packet-recorder.test.js` - PASS. Notes: regression proves Endstone-shaped main-hand and selected-slot inventory objects resolve to `minecraft:bow`.
- `2026-05-16` - `pnpm run test:static` - PASS. Notes: 83 passing; only Node `punycode` deprecation warning observed.
- `2026-05-16` - User live review of `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-57-11-160Z/packets.jsonl` - FAIL. Notes: user was visibly holding the bow but Step 1 stayed active. Investigation showed `all` short-circuited on `entity_exists` before evaluating `held_item_is`; Endstone exposes mobs via `level.actors`, which `_iter_nearby_entities` did not scan.
- `2026-05-16` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` - PASS. Notes: recorder compiles after adding `actors` entity sources.
- `2026-05-16` - `pnpm exec mocha test/static/endstone-packet-recorder.test.js` - PASS. Notes: 2 passing; covers held-item detection and `entity_exists` against Endstone `level.actors`.
- `2026-05-16` - `rg -n '"type":"(scenario_loaded|step_start|step_complete|scenario_complete|scenario_end|player_quit)"|held_item_is' logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl` - PASS. Notes: Step 1 completed at sequence `404`; reason shows `entity_exists` passed with `seen: 4` and `held_item_is` passed with `actual: "minecraft:bow"`.
- `2026-05-16` - `node scripts/index-packet-recording.js logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl 1.26.10 --out=logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.sqlite` - PASS. Notes: indexed completed human run; output reported 36 events, 1089 packets, 731941 fields.
- `2026-05-16` - `node --check test/recorded-bds/bots/aim-and-shoot-cow.js` - PASS. Notes: scenario bot syntax valid before rerun.
- `2026-05-16` - `node scripts/recorded-bds-gym.js run-bot --scenario=aim-and-shoot-cow` - FAIL. Notes: latest run `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-18-36-853Z/packets.jsonl`; Step 1 completed for `OpBot` at sequence `706` with `held_item_is actual=minecraft:bow`; Step 2 started at sequence `712`; bot disconnected with `Error: Scenario cow survived all bow shots`; scenario ended `status=active`, `completed_steps=1`.
- `2026-05-16` - `node scripts/recorded-bds-gym.js run-bot --scenario=aim-and-shoot-cow` - FAIL, reproduced chunk readiness warning. Notes: run `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-23-38-867Z/packets.jsonl`; after teleport to `(0.5,65,0.5)`, physics logged `waitForChunksToLoad timed out after 10000ms (missing block data for 3 of 9 chunks: 1,-1, 1,0, 1,1)`.
- `2026-05-16` - `node scripts/decode-endstone-packet-recording.js logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-23-38-867Z/packets.jsonl 1.26.10 --packet-ids=174,175,19,69,121 --full --out=logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-23-38-867Z/chunk-full.jsonl` - PASS investigation. Notes: the missing columns were not absent. For `1,-1`, `1,0`, and `1,1`, BDS sent `level_chunk sub_chunk_count=-2 highest_subchunk_count=0`; the bot requested/received sections `-4..0`, then physics readiness after teleport required sections `3..5` around Y=66. Those higher sections are all-air by schema but were not marked loaded locally.
- `2026-05-16` - `npx mocha test/static/chunks-readiness.test.js` - PASS. Notes: 13 passing; new regression covers known-air sections above limited polling highest subchunk.
- `2026-05-16` - `node scripts/recorded-bds-gym.js run-bot --scenario=aim-and-shoot-cow` - FAIL, chunk wait fixed. Notes: run `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-26-50-097Z/packets.jsonl`; no `[physics] waiting for nearby chunks` warning appeared. The bot advanced to shooting and spawned arrows at the bot position, but the cow survived all shots.
- `2026-05-16` - Scenario bot eye-position compatibility edit - PASS syntax, NOT RERUN live. Command: `node --check test/recorded-bds/bots/aim-and-shoot-cow.js`. Notes: after TASK-11 changed public `self.position` to eye coordinates, `test/recorded-bds/bots/aim-and-shoot-cow.js` was updated to pin `y=65.62` and send bow-use `player_pos` plus bow-release `head_pos` from `self.position` directly. Full scenario rerun still pending.
- `2026-05-16` - Latest failed-run diagnosis - PASS investigation. Commands: `rg -n 'step_complete|scenario_complete|scenario_end|gamemode survival|inventory_lacks|entity_dead|ActorDeathEvent|death_animation' logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/packets.jsonl logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/entity-event-full.jsonl`; `node scripts/decode-endstone-packet-recording.js logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/packets.jsonl 1.26.10 --packet-ids=49,50,27 --full --out=logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/inventory-entity-full.jsonl`. Notes: scenario dispatched `gamemode survival "OpBot"`; packet 27 showed cow `death_animation` at sequence `1512`; decoded inventory packets continued reporting arrows at count `16`, so `inventory_lacks` kept Step 2 from clearing.
- `2026-05-16` - `node --check test/recorded-bds/bots/aim-and-shoot-cow.js` - PASS. Notes: syntax valid after adding explicit Survival recovery command.
- `2026-05-16` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/aim-and-shoot-cow.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario parses after forcing Survival in setup and changing Step 2 to death-based clearance.
- `2026-05-16` - `node scripts/recorded-bds-gym.js run-bot --scenario=aim-and-shoot-cow` - PASS. Notes: run `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-21-04-301Z/packets.jsonl`; recorder logged `gamemode survival "OpBot"` at sequences `118` and `132`; Step 2 completed at sequence `1347` because `entity_dead` passed with `seen: 0`; `scenario_complete` at `1353`; `scenario_end status=complete completed_steps=2` at `1920`; SQLite sidecar indexed with 36 events, 1887 packets, 820485 fields.

## Architecture Notes

- Existing APIs include `lookAt`, `selectHotbarSlot`/`equipItem`, entity tracking, and entity interaction helpers. Bow draw/release behavior still needs packet evidence from the human trace before deciding whether a generic library API is sufficient or a scenario-local packet implementation is needed.
- Limited subchunk polling uses `level_chunk.highest_subchunk_count` as the highest non-air subchunk. When this value is below the player's current Y section, sections above it are known all-air. Chunk readiness must count them as loaded air, otherwise teleports to an air/platform height can wait forever on edge columns even though the server has already proven those sections empty.

## Handoff

Continue from the completed bot run. Next step is compare the completed human run against `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-21-04-301Z/packets.sqlite`, then decide which behavior, if any, is ready to promote from the isolated bot script into `src/`.

## Resume Notes

- Next step: run the recorded-BDS compare between human `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.sqlite` and bot `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-21-04-301Z/packets.sqlite`, then record intentional deviations before promotion.
- Do not repeat: human capture is complete and indexed; bot Step 1 now clears.
- Raw logs: human `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl`; chunk investigation `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T17-23-38-867Z/`; failed death-but-no-clearance bot `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-10-04-222Z/packets.jsonl`; latest completed bot `logs/recorded-bds/aim-and-shoot-cow/bot/2026-05-16T18-21-04-301Z/packets.jsonl`.

## Final Summary

Fill this only when marking the task complete.

- Result:
- Files changed:
- Verification:
- Follow-up tasks:

## Failure Summary

Fill this when marking the task blocked or abandoned.

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[ ]` Task log updated with final evidence.
- `[ ]` Current State and Change Ledger reflect the worktree.
- `[ ]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[ ]` Static tests or focused tests run.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[ ]` Live test run or explicitly deferred with reason.
- `[ ]` Raw debug logs kept out of git.
