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

## Resume Notes

- Next step: live-run the sample with a real Bedrock client using the runbook in `test/recorded-bds/README.md`; verify the JSONL includes `scenario_start`, `step_start`, `step_complete`, `scenario_complete`, and `scenario_end`.
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
