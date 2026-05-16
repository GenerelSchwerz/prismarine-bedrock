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
- In progress: continue the human capture from `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl` through shooting the cow.
- Not started: bot recreation, packet comparison, library promotion.
- Known mismatch between notes and worktree: none for TASK-19 yet.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-19-aim-and-shoot-entity.md` | changed | Created task log for the recorded BDS workflow run. |
| `test/recorded-bds/scenarios/aim-and-shoot-cow.json` | changed | Guarded against async setup false positives. Step 1 now requires `entity_exists` for the target-position cow plus `held_item_is minecraft:bow`; setup gives arrows before the bow so slot 1 is the bow. The old packet-count gate was removed because the human got stuck after equipping the bow. Step 2 now requires both arrow consumption and `entity_dead` for the target-position cow. A tag-based attempt was reverted because BDS reported no targets for the tag selector immediately after summon. |
| `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` | changed | Fixed `held_item_is` to check Endstone's actual main-hand and selected-slot inventory APIs and to resolve nested item type identifiers instead of comparing stringified item/type objects. Fixed `entity_exists` to scan Endstone `dimension.actors`/`level.actors`, which was preventing `held_item_is` from being reached in `all` clearances. |
| `test/static/endstone-packet-recorder.test.js` | added | Covers `held_item_is` against Endstone-shaped `item_in_main_hand`, selected slot `get_item`, nested `ItemStack.type.id` identifiers, stale player-level held values, and `entity_exists` against Endstone `level.actors`. |

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

## Architecture Notes

- Existing APIs include `lookAt`, `selectHotbarSlot`/`equipItem`, entity tracking, and entity interaction helpers. Bow draw/release behavior still needs packet evidence from the human trace before deciding whether a generic library API is sufficient or a scenario-local packet implementation is needed.

## Handoff

Continue with scenario tightening, static JSON validation, then human capture.

## Resume Notes

- Next step: continue or rerun `node scripts/recorded-bds-gym.js record-human --scenario=aim-and-shoot-cow`; Step 1 now completes from `held_item_is`, so proceed through Step 2 by shooting until the cow dies and then inspect scenario completion markers.
- Do not repeat: scenario and task log discovery already found `aim-and-shoot-cow`; there are no existing completed gym runs for it.
- Raw logs: `logs/recorded-bds/aim-and-shoot-cow/human/2026-05-16T16-59-46-646Z/packets.jsonl`.

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
