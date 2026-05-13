# TASK 10 - Bedrock Protocol Relay Recorder

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-13
- **Scope:** Add a separate `bedrock-protocol` Relay recorder path for newest BDS versions where Endstone cannot hook the server binary.
- **Owned files:** `scripts/recorded-bds-relay.js`, `test/recorded-bds/relay.md`, `test/recorded-bds/relay-scenarios/**`, `package.json`, `docs/tasks/TASK-10-bedrock-protocol-relay-recorder.md`
- **Related docs:** `AGENTS.md`, `docs/tasks/TASK-07-endstone-packet-recorder.md`, `docs/tasks/TASK-08-endstone-recording-scenarios.md`, `node_modules/bedrock-protocol/docs/API.md`, `node_modules/bedrock-protocol/src/relay.js`

## Goal

Provide a relay-based packet recording fallback that can sit between a real Bedrock client and base BDS `1.26.20.5`, record decoded packets in both directions, send simple tester prompts to the downstream client, and write scenario/step markers without relying on Endstone.

## Non-Goals

- Do not replace the Endstone recorder/scenario system.
- Do not stop or reconfigure the currently-running base BDS instance.
- Do not claim server-side inventory/block clearance parity with Endstone; Relay only sees packets unless it sends/observes commands.

## Current Plan

- `[x]` Add a standalone relay recorder script.
- `[x]` Add relay-specific scenario docs and sample.
- `[x]` Add package script.
- `[x]` Verify syntax, help output, and live relay ping against the running BDS.

## Current State

- Worktree state: existing untracked `.test-lock.java-1.json` is user/runtime state; left untouched. Relay task changes are limited to owned files.
- Already implemented: Endstone recorder and Endstone scenarios exist, but Endstone `0.11.3` failed to hook BDS `1.26.20.5`.
- In progress: relay process is running for user testing.
- Not started: real-client relay join has not completed; current relay JSONL only shows `relay_start` and a short `relay_connect`/`relay_disconnect` from local probing.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `scripts/recorded-bds-relay.js` | changed | Standalone Relay recorder CLI with packet logging, packet-derived scenarios, prompt packets, and upstream command injection. |
| `test/recorded-bds/relay.md` | changed | Usage/runbook for relay recording and limits versus Endstone. |
| `test/recorded-bds/relay-scenarios/**` | changed | Added `capture-item-stack-request` packet-derived sample scenario. |
| `package.json` | changed | Added `recorded-bds:relay` convenience script. |

## Evidence Log

- `2026-05-13` - Local `bedrock-protocol` inspection - PASS. Notes: installed package is `bedrock-protocol@3.56.0`, exports `Relay`, and `src/options.js` sets `CURRENT_VERSION = '1.26.20'`.
- `2026-05-13` - Endstone switch attempt before this task - FAIL. Notes: Endstone `0.11.3` failed to hook BDS `1.26.20.5` with `FUNCHOOK_ERROR_FOUND_BACK_JUMP`; base BDS was restored on port `19135`.
- `2026-05-13` - `node -c scripts/recorded-bds-relay.js` - PASS.
- `2026-05-13` - `node -e "const pkg = require('./package.json'); ..."` - PASS. Notes: verified `recorded-bds:relay` script.
- `2026-05-13` - `node -e "const s = require('./test/recorded-bds/relay-scenarios/capture-item-stack-request.json'); ..."` - PASS. Notes: verified sample scenario id and `item_stack_request` clearance.
- `2026-05-13` - `node scripts/recorded-bds-relay.js --help` - PASS.
- `2026-05-13` - Started relay with `node scripts/recorded-bds-relay.js --version=1.26.20 --listen-port=19137 --destination-port=19135 --record-file=logs/bedrock-relay-12620.jsonl --scenario=capture-item-stack-request --packet-names=item_stack_request,item_stack_response,text,command_output,play_status,disconnect,start_game,inventory_content,inventory_slot,crafting_data` - PASS. Notes: PID `3052`, JSONL `logs/bedrock-relay-12620.jsonl`.
- `2026-05-13` - Restarted base BDS `1.26.20.5` backend after it was found not responding - PASS. Notes: PID `15868`, gameplay port `19135`, log confirms `Version: 1.26.20.5`.
- `2026-05-13` - `bedrock-protocol.ping` checks for `127.0.0.1:19135` and `127.0.0.1:19137` - PASS. Notes: backend and relay both respond as protocol `975`, version `1.26.20`.

## Architecture Notes

- Relay topology: real Bedrock client -> local Relay -> base BDS.
- Relay can record decoded `serverbound` and `clientbound` packets. It does not expose direct BDS world/inventory APIs.
- Relay scenario clearances should start with packet-derived conditions such as `packet_seen`.
- Current running relay listens on `0.0.0.0:19137` and forwards to base BDS on `127.0.0.1:19135`.
- Current running relay records filtered packets to `logs/bedrock-relay-12620.jsonl`.

## Handoff

Relay is running for user testing:

```text
Relay PID: 3052
Backend BDS PID: 15868
Client should connect to: 127.0.0.1:19137
Relay forwards to: 127.0.0.1:19135
Recording: logs/bedrock-relay-12620.jsonl
```

Next verification is a real Bedrock client join through the relay and completion of the `capture-item-stack-request` scenario.

## Resume Notes

- Next step: connect the real Bedrock client to `127.0.0.1:19137`, perform an inventory action that sends `item_stack_request`, then inspect `logs/bedrock-relay-12620.jsonl` for `relay_join`, `scenario_start`, `step_start`, `packet` with `name:"item_stack_request"`, `step_complete`, and `scenario_complete`.
- Do not repeat: bedrock-protocol Relay API inspection.
- Raw logs: `logs/bedrock-relay-12620.jsonl`, `logs/bedrock-relay-12620.stdout.log`, `logs/bedrock-relay-12620.stderr.log`, `logs/base-bds-12620.stdout.log`.

## Final Summary

- Result: Added a separate `bedrock-protocol` Relay recorder path for BDS versions unsupported by Endstone.
- Files changed: `scripts/recorded-bds-relay.js`, `test/recorded-bds/relay.md`, `test/recorded-bds/relay-scenarios/capture-item-stack-request.json`, `package.json`, `docs/tasks/TASK-10-bedrock-protocol-relay-recorder.md`.
- Verification: syntax/help/package/scenario checks passed; live backend BDS and relay pings passed for protocol `975` / Bedrock `1.26.20`.
- Follow-up tasks: real-client relay join and packet capture; add stronger command output/clearance support if packet-only relay scenarios are not enough.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable. No new packet shapes were added.
- `[x]` Live test run or explicitly deferred with reason. Relay/backend ping live checks passed; real-client relay scenario completion remains pending user action.
- `[x]` Raw debug logs kept out of git.
