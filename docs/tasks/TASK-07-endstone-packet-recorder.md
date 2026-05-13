# TASK 07 - Endstone Packet Recorder

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-13
- **Scope:** Add an opt-in Endstone packet hook recorder for human-driven real Bedrock client captures against BDS.
- **Owned files:** `scripts/e2e-server/options.js`, `scripts/e2e-server/install.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js`, `scripts/e2e-server/help.js`, `scripts/endstone-packet-recorder/**`, `scripts/decode-endstone-packet-recording.js`, `docs/tasks/TASK-07-endstone-packet-recorder.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/e2e-server-launch-notes.md`, Endstone packet event docs.

## Goal

Provide a first-pass packet recording suite foundation where Endstone/BDS can be launched on a superflat world with packet hooks enabled, a real Bedrock client can be driven manually, and packet events are written to JSONL for later protocol comparison.

## Non-Goals

- Do not automate the official Bedrock client.
- Do not change existing static/live test behavior.
- Do not make the packet recorder authoritative for bot behavior yet.

## Current Plan

- `[x]` Verify Endstone exposes packet receive/send events.
- `[x]` Add opt-in recorder plugin and launcher install flag.
- `[x]` Add decode helper for recorder JSONL.
- `[x]` Verification.

## Current State

- Worktree state: existing user/peer edits in `src/builtins/crafting.js` and `test/static/crafting.test.js`; left untouched.
- Already implemented: Endstone/BDS launcher already supports superflat worlds.
- In progress: none.
- Not started: live Endstone run with a real Bedrock client; requires user-driven client session.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `scripts/e2e-server/options.js` | changed | Added `--endstone-packet-recorder` and `E2E_ENDSTONE_PACKET_RECORDER` parsing. |
| `scripts/e2e-server/install.js` | changed | Installs recorder package into the Endstone venv in editable mode when enabled. |
| `scripts/e2e-server/launch.js` | changed | Activates recorder env only for launches using the recorder option. |
| `scripts/e2e-server/process-utils.js` | changed | Adds recorder env to launched Endstone process when requested. |
| `scripts/e2e-server/help.js` | changed | Documents recorder launch command and env variables. |
| `scripts/endstone-packet-recorder/**` | changed | New Python Endstone plugin records packet hooks to JSONL when active. |
| `scripts/decode-endstone-packet-recording.js` | changed | Decodes recorder JSONL payloads through bedrock-protocol. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-13` - Endstone docs lookup - PASS. Notes: `PacketReceiveEvent` and `PacketSendEvent` expose `packet_id`, writable `payload` bytes excluding header, `player`, `address`, and `sub_client_id`; event handlers use `@event_handler` and `self.register_events(self)`.
- `2026-05-13` - `node -c scripts/e2e-server/options.js; node -c scripts/e2e-server/install.js; node -c scripts/e2e-server/help.js; node -c scripts/e2e-server/launch.js; node -c scripts/e2e-server/process-utils.js; node -c scripts/decode-endstone-packet-recording.js` - PASS.
- `2026-05-13` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py scripts/endstone-packet-recorder/src/endstone_packet_recorder/__init__.py` - PASS.
- `2026-05-13` - Python AST parse with `feature_version=(3, 9)` for recorder plugin files - PASS.
- `2026-05-13` - `node -e "...parseOptions(['--target=endstone','--endstone-packet-recorder'])..."` - PASS. Notes: printed `endstonePacketRecorder=true`.
- `2026-05-13` - `node scripts/e2e-servers.js help` - PASS. Notes: help includes recorder command/env docs; command emitted existing `punycode` deprecation warning.
- `2026-05-13` - Generated temporary recorder JSONL from a serialized `item_stack_request`, then ran `node scripts/decode-endstone-packet-recording.js scripts/tmp/endstone-recorder-sample.jsonl 1.21.130` - PASS. Notes: decoded packet name `item_stack_request` and action `drop`; temp file removed after check.

## Architecture Notes

- Endstone packet hooks operate inside BDS after network framing/encryption handling, so the recorder stores packet id plus raw packet body rather than encrypted UDP traffic.
- The recorder package may remain installed in the Endstone venv after first use, but it is inert unless `E2E_ENDSTONE_PACKET_RECORDER=1` is present in the server process environment.
- The recorder is opt-in to avoid high-volume packet logs during normal e2e runs. Empty `E2E_PACKET_RECORDER_PACKET_IDS` records all packet IDs.

## Handoff

Run a manual capture with a real Bedrock client when needed:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder
```

The default recording path is `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl` unless `E2E_PACKET_RECORD_FILE` is set.

## Resume Notes

- Next step: launch Endstone/BDS with `--endstone-packet-recorder`, connect a real Bedrock client, perform the target action, then decode `.e2e-servers/endstone-bds/logs/packet-recorder.jsonl`.
- Do not repeat: Endstone packet event docs lookup.
- Raw logs: none.

## Final Summary

- Result: Added opt-in Endstone packet hook recording and decode tooling.
- Files changed: `scripts/e2e-server/options.js`, `scripts/e2e-server/install.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js`, `scripts/e2e-server/help.js`, `scripts/endstone-packet-recorder/**`, `scripts/decode-endstone-packet-recording.js`, `docs/tasks/TASK-07-endstone-packet-recorder.md`.
- Verification: focused JavaScript syntax checks, Python compile, Python 3.9 AST syntax check, option parsing check, help output check, and decoder smoke check passed.
- Follow-up tasks: manual real-client BDS capture; optional packet ID name filtering once the target packet set is known.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable. No new outbound packet shapes; decoder smoke test covered local serializer/deserializer handling.
- `[x]` Live test run or explicitly deferred with reason. Deferred because this requires a user-driven real Bedrock client session.
- `[x]` Raw debug logs kept out of git.
