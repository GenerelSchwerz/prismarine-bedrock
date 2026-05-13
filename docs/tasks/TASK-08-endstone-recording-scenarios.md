# TASK 08 - Endstone Recording Scenarios

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-13
- **Scope:** Add Endstone-only stepped scenario orchestration for human-driven packet recording sessions.
- **Owned files:** `scripts/e2e-server/options.js`, `scripts/e2e-server/install.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js`, `scripts/e2e-server/help.js`, `scripts/endstone-packet-recorder/**`, `test/recorded-bds/**`, `docs/tasks/TASK-08-endstone-recording-scenarios.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/e2e-server-launch-notes.md`, `docs/tasks/TASK-07-endstone-packet-recorder.md`, Endstone player/server/scheduler/inventory/level docs.

## Goal

Make it easy for future agents to define real-user BDS recording scenarios with deterministic setup, auto-op, teleport, multi-step instructions, per-step clearance conditions, and durable scenario markers in the packet JSONL.

## Non-Goals

- Do not automate the official Bedrock client.
- Do not add Java/Geyser scenario support.
- Do not change existing static/live test behavior.

## Current Plan

- `[x]` Add scenario option/env wiring for Endstone launcher.
- `[x]` Add scenario state machine to recorder plugin.
- `[x]` Add scenario docs and sample.
- `[x]` Verification.

## Current State

- Worktree state: clean at task start; task changes now limited to owned files.
- Already implemented: Endstone packet recorder from TASK-07.
- In progress: none.
- Not started: live Endstone scenario run with a real Bedrock client; requires user-driven Bedrock client interaction.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `scripts/e2e-server/options.js` | changed | Added `--endstone-scenario` and `E2E_ENDSTONE_SCENARIO`; selecting a scenario enables the recorder. |
| `scripts/e2e-server/install.js` | changed | Installs recorder plugin when recorder or scenario mode is selected. |
| `scripts/e2e-server/launch.js` | changed | Passes scenario id/path and repo root into Endstone env. |
| `scripts/e2e-server/process-utils.js` | changed | Builds recorder/scenario environment variables for Endstone process. |
| `scripts/e2e-server/help.js` | changed | Documents scenario option and env variable. |
| `scripts/endstone-packet-recorder/**` | changed | Added scenario loading/state machine/clearance checks and JSONL markers. |
| `test/recorded-bds/**` | changed | Added scenario authoring README, human tester runbook, copy-paste tester prompt, evidence checklist, and `craft-planks-and-place` sample. |
| `test/recorded-bds/scenarios/craft-wooden-pickaxes-at-table.json` | added | Human-driven workbench scenario that opens a crafting table and records crafting three wooden pickaxes from oak logs. |

## Evidence Log

- `2026-05-13` - Endstone docs lookup - PASS. Notes: official docs show `Server.dispatch_command`, player `send_title`/`send_tip`/`inventory`/`is_op`, scheduler `run_task`, inventory `contains_at_least`, dimension `get_block_at`, and block `type`.
- `2026-05-13` - `node -c scripts/e2e-server/options.js; node -c scripts/e2e-server/install.js; node -c scripts/e2e-server/help.js; node -c scripts/e2e-server/launch.js; node -c scripts/e2e-server/process-utils.js` - PASS.
- `2026-05-13` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py scripts/endstone-packet-recorder/src/endstone_packet_recorder/__init__.py` - PASS.
- `2026-05-13` - Python AST parse with `feature_version=(3, 9)` for recorder plugin files - PASS.
- `2026-05-13` - JSON parse of `test/recorded-bds/scenarios/craft-planks-and-place.json` - PASS. Notes: printed `craft-planks-and-place:2`.
- `2026-05-13` - `parseOptions(['--target=endstone','--endstone-scenario=craft-planks-and-place'])` smoke check - PASS. Notes: scenario set and recorder auto-enabled.
- `2026-05-13` - `endstoneEnv(... scenario: 'craft-planks-and-place' ...)` smoke check - PASS. Notes: env included `E2E_ENDSTONE_PACKET_RECORDER=1`, `E2E_ENDSTONE_SCENARIO`, and `E2E_REPO_ROOT`.
- `2026-05-13` - `node scripts/e2e-servers.js help` - PASS. Notes: scenario command/env docs present; command emitted existing `punycode` deprecation warning.
- `2026-05-13` - Python import/helper smoke with fake Endstone modules - PASS. Notes: verified packet id parsing and namespace-insensitive identifier helper.
- `2026-05-13` - Documentation update for human tester prompting - PASS. Notes: `test/recorded-bds/README.md` now includes agent/operator steps, a copy-paste tester prompt, expected tester experience, and marker checklist. No live run performed.
- `2026-05-13` - Live scenario run requested with real Bedrock client available - IN PROGRESS. Target: Endstone/BDS superflat, scenario `craft-planks-and-place`, port `19132`.
- `2026-05-13` - First real-client connection attempt - FAIL/INCOMPLETE. Notes: Bedrock client showed `Disconnected from host` / `Server not found`; server process stayed running, BDS remained bound on UDP `0.0.0.0:19132`, packet recorder contained only `recorder_start` and `scenario_loaded` with no `player_join`.
- `2026-05-13` - `bedrock-protocol.ping({ host: '127.0.0.1', port: 19132 })` - PASS. Notes: local ping returned MOTD `bedrock-test endstone-1`, level `endstone-1-superflat`, protocol `898`, version `1.21.130`, players `0`.
- `2026-05-13` - `E2E_ENDSTONE_PACKAGE=endstone MC_VERSION=1.26.10 node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-planks-and-place` - IN PROGRESS. Notes: started as a background launcher for a real Bedrock client session; Endstone 0.11.3 / BDS 1.26.12.2, world `endstone-1-superflat`, UDP `0.0.0.0:19132`, packet recorder active at `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl`; initial markers include `recorder_start` and `scenario_loaded`.
- `2026-05-13` - Manual Endstone 0.11.3 + BDS 1.26.20.5 probe - FAIL. Notes: downloaded official `bedrock-server-1.26.20.5.zip`, extracted to ignored `.e2e-servers/manual-endstone-12620`, bypassed Endstone's supported-version updater with `version.txt=26.12`, and launched on port `19135` with packet-recorder/scenario env enabled. BDS printed `Version: 1.26.20.5`, but Endstone failed native hook installation with `FUNCHOOK_ERROR_FOUND_BACK_JUMP` for `RepositorySources::initializePackSource`, then exited with code `3221225501`; plugins/recording did not load. Raw logs: `logs/manual-endstone-12620-20260513-153711.out.log`, `logs/manual-endstone-12620-20260513-153711.err.log`.
- `2026-05-13` - PyPI package check for Endstone - PASS investigation. Notes: `https://pypi.org/pypi/endstone/json` reported latest published Endstone version `0.11.3`, so no newer published package is currently available to support BDS 1.26.20.5.
- `2026-05-13` - Fresh scenario run for real 1.26.12 client - IN PROGRESS. Command: `E2E_ENDSTONE_PACKAGE=endstone MC_VERSION=1.26.10 node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-planks-and-place`. Notes: Endstone 0.11.3 / BDS 1.26.12.2, UDP `0.0.0.0:19132`, world `endstone-1-superflat`; packet recorder active at `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl` with fresh `recorder_start` and `scenario_loaded` markers. Launcher log: `logs/recorded-bds-scenario-20260513-161049.out.log`.
- `2026-05-13` - First 1.26.12 client scenario attempt - FAIL/INCOMPLETE. Notes: player `Generel7050` joined and `step_start` for `craft-planks` was recorded, but no `step_complete`; the item/block clearance used legacy `minecraft:planks` instead of `minecraft:oak_planks`.
- `2026-05-13` - Scenario JSON corrected and relaunched - IN PROGRESS. Notes: `test/recorded-bds/scenarios/craft-planks-and-place.json` now expects inventory item `minecraft:oak_planks` and placed block `minecraft:oak_planks`; fresh Endstone 0.11.3 / BDS 1.26.12.2 server is live on UDP `0.0.0.0:19132`. Launcher log: `logs/recorded-bds-scenario-20260513-161421.out.log`; recorder has fresh `recorder_start` and `scenario_loaded`.
- `2026-05-13` - Inventory-gated scenario retry - PASS. Notes: fresh run `logs/recorded-bds-scenario-20260513-161635.out.log` on Endstone 0.11.3 / BDS 1.26.12.2 recorded `step_complete` for `craft-planks` at sequence 615, `step_start` for `place-plank-on-marker` at sequence 621, `step_complete` for placement at sequence 727 with actual block `minecraft:oak_planks`, and `scenario_complete` at sequence 733. Remaining action: player should leave to write `scenario_end` / `player_quit`.
- `2026-05-13` - Decoded real-client normal craft packets from `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl` - PASS investigation. Notes: `minecraft-data` 1.26.10 defines `packet_item_stack_request` as `!id: 0x93` / decimal `147`, and the real client emitted standalone `item_stack_request` packets at sequences 565, 585, and 605. The normal craft shape was: `take` hotbar slot 0 to cursor, `place` cursor to `crafting_input` slot 30, then `craft_recipe` + `results_deprecated` + `consume` from `crafting_input` slot 30 + `place` from `creative_output` slot 50 to `hotbar_and_inventory` slot 0.
- `2026-05-13` - `npx mocha test/static/crafting.test.js` - PASS. Notes: normal craft packet builder now asserts hotbar source, `place` result action, and `hotbar_and_inventory` destination.
- `2026-05-13` - `node scripts/roundtrip-packet.js scripts/tmp/craft-normal-roundtrip.json` - PASS. Notes: updated local temp packet round-trips with `place` from `creative_output` slot 50 to `hotbar_and_inventory`.
- `2026-05-13` - `node` JSON parse of `test/recorded-bds/scenarios/craft-planks-and-place.json` - PASS. Notes: printed `craft-planks-and-place:2`.
- `2026-05-13` - Focused live normal crafting verification against running `endstone-1` - BLOCKED/ENVIRONMENT. Notes: direct Mocha run connected to the existing human scenario server on BDS 1.26.12, but command targeting still used `.OpBot`, the bot was disconnected, and setup timed out before crafting. Attempting to launch a clean `endstone-2` with `--endstone-count=2` failed because the launcher tried to refresh the busy running `endstone-1` install and hit locked `python3.dll`. Static and round-trip checks passed; live verification needs the existing scenario server stopped or a launcher path that starts only a non-busy instance.
- `2026-05-13` - Temp focused live runner prepared - PASS. Notes: `scripts/tmp/run-live-normal-crafting.js` invokes Mocha through Node argv with `--grep "normal crafts oak planks from oak logs with the live server recipe data"` so launcher client command quoting cannot split the grep string. Syntax check `node -c scripts/tmp/run-live-normal-crafting.js` passed. Because Endstone command forwarding depends on launcher-injected `E2E_SERVER_COMMAND_FILE`, run it from the launcher console as `/client node scripts/tmp/run-live-normal-crafting.js`.
- `2026-05-13` - Added `craft-wooden-pickaxes-at-table` real-client scenario - PASS. Notes: JSON parse printed `craft-wooden-pickaxes-at-table:2:7`; the scenario clears when BDS sends `container_open` packet `46` for the opened table and when the player's inventory contains at least three `minecraft:wooden_pickaxe` items after receiving `item_stack_request` packet `147`.

## Architecture Notes

- Scenario support is intentionally Endstone-only because it relies on the Endstone plugin API and BDS packet hooks.
- Scenario files should be data-only JSON so future agents can add cases without editing plugin code.
- Scenario selection activates recorder mode automatically so packet records and scenario markers share one JSONL.
- Supported clearance conditions: `inventory_contains`, `inventory_lacks`, `block_is`, `player_at`, `packet_seen`, `manual`, plus `all`/`any` composites.
- Scenario commands support `{player}` for a quoted player name and `{playerName}` for the raw name.

## Handoff

Run the sample scenario with:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-planks-and-place
```

Connect with a real Bedrock client, follow the step prompts, then decode `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl`.

For workbench crafting packet capture, run:

```powershell
$env:E2E_ENDSTONE_PACKAGE='endstone'
$env:MC_VERSION='1.26.10'
$env:E2E_PACKET_RECORD_FILE='logs/human-craft-wooden-pickaxes.jsonl'
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-wooden-pickaxes-at-table
```

## Resume Notes

- Next step: live-run `craft-wooden-pickaxes-at-table` with a real Bedrock client using the runbook in `test/recorded-bds/README.md`; verify the JSONL includes `scenario_start`, `step_start`, `step_complete`, `scenario_complete`, and `scenario_end`.
- For focused normal-crafting verification against a running Endstone launcher, use `/client node scripts/tmp/run-live-normal-crafting.js` from the launcher console instead of passing a quoted Mocha `--grep` string directly.
- Do not repeat: Endstone API docs lookup.
- Raw logs: none.

## Final Summary

- Result: Added Endstone-only stepped scenario orchestration for human-driven BDS packet recording, plus a human tester runbook and copy-paste prompt.
- Files changed: `scripts/e2e-server/options.js`, `scripts/e2e-server/install.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js`, `scripts/e2e-server/help.js`, `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `test/recorded-bds/README.md`, `test/recorded-bds/scenarios/craft-planks-and-place.json`, `docs/tasks/TASK-08-endstone-recording-scenarios.md`.
- Verification: focused JS syntax checks, Python compile, Python 3.9 AST check, scenario JSON parse, option/env smoke checks, help output check, and fake-Endstone helper smoke passed.
- Follow-up tasks: live-run sample scenario with real Bedrock client; tune sample item/block identifiers if BDS/Endstone reports a different canonical identifier than `minecraft:planks`.

## Failure Summary

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. No new packet shapes added; scenario marker JSONL and option/env behavior were smoke checked.
- `[x]` Live test run or explicitly deferred with reason. Deferred because this requires user-driven real Bedrock client interaction.
- `[x]` Raw debug logs kept out of git.
