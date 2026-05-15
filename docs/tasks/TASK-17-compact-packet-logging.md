# TASK 17 - Compact Packet Logging

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-15
- **Scope:** Reduce Endstone packet recorder output size and add queryable decoded packet projections.
- **Owned files:** `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `scripts/decode-endstone-packet-recording.js`, `scripts/query-packet-recording.js`, `scripts/e2e-server/options.js`, `scripts/e2e-server/launch.js`, `scripts/e2e-server/process-utils.js`, `scripts/e2e-server/help.js`, `test/static/e2e-server-options.test.js`, `test/static/packet-recording-query.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `test/recorded-bds/README.md`, `docs/tasks/TASK-17-compact-packet-logging.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/e2e-server-launch-notes.md`, `test/rules.md`, `test/recorded-bds/README.md`

## Goal

Make Endstone packet recordings smaller by default without losing raw packet payloads, intentionally move the decoder/query path to the new compact packet format, and provide a script that can filter decoded packet streams by packet name/id and nested field predicates.

## Non-Goals

Do not change bot runtime protocol behavior, live environment tests, TASK-15/TASK-16 edits, or the general e2e process log format.

## Current Plan

- `[x]` Add compact raw packet row format.
- `[x]` Update decoder for compact packet rows.
- `[x]` Add decoded packet query/projection script with static coverage.
- `[x]` Update docs and run focused verification.

## Current State

Keep this section current while the task is active. A restarted agent should read this before editing.

- Worktree state: Existing uncommitted TASK-15/TASK-16 changes are present and were not edited for this task. This task changed the Endstone packet recorder/decoder/query docs and tests listed below.
- Already implemented: Endstone packet hooks now write compact packet rows only; `decode-endstone-packet-recording.js` reads compact rows; `query-packet-recording.js` filters/projects decoded packet fields; docs and static tests are updated.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

Record file-by-file intent. Include files inspected but intentionally not changed when that prevents duplicate work.

| File | State | Notes |
| --- | --- | --- |
| `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` | changed | Packet hook records now write compact `["p",sequence,ts,direction,packet_id,sub_client_id,player,address,payload_base64,payload_size,payload_sha256]` rows only. Marker records remain objects and `recorder_start` documents the packet schema. |
| `scripts/decode-endstone-packet-recording.js` | changed | Reads compact packet rows directly and ignores marker objects. |
| `scripts/query-packet-recording.js` | added | Streams compact recordings, decodes packet fields, filters by packet id/name and equality predicates, projects selected fields, and supports aggregate counts. |
| `scripts/e2e-server/help.js` | changed | Documents recorder output as compact JSONL rows. |
| `test/static/packet-recording-query.test.js` | added | Covers metadata projection and aggregate counts over compact packet rows. |
| `docs/in-dev/e2e-server-launch-notes.md` | changed | Documents compact packet row schema and decoder/query examples. |
| `test/recorded-bds/README.md` | changed | Documents compact packet row schema and field-query workflow for recorded scenarios. |
| `scripts/e2e-server/options.js` | inspected | No format option added; compact rows are the only packet format. |
| `scripts/e2e-server/launch.js` | inspected | No env plumbing needed for a format switch. |
| `scripts/e2e-server/process-utils.js` | inspected | No env plumbing needed for a format switch. |
| `test/static/e2e-server-options.test.js` | inspected | Existing focused run still passes; no format option test needed. |

## Parallel Subtasks

Use this section when multiple agents are working independently.

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Packet schema check | Agent / date | `docs/tasks/TASK-NN-short-title.md` | Schema notes and round-trip result | `[ ]` |

## Evidence Log

Record exact commands, target server, date, and result. Keep raw output in `logs/` if it is large.

- `2026-05-15` - `node -c scripts/decode-endstone-packet-recording.js` - PASS.
- `2026-05-15` - `node -c scripts/query-packet-recording.js` - PASS.
- `2026-05-15` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` - PASS.
- `2026-05-15` - `npx mocha test/static/packet-recording-query.test.js test/static/e2e-server-options.test.js` - PASS. Notes: 6 passing.
- `2026-05-15` - `node scripts/decode-endstone-packet-recording.js scripts/tmp/packet-query-fixture.jsonl 1.26.10 --packet-ids=147` - PASS. Notes: compact row was accepted and decoded to an error summary for the intentionally empty payload fixture.
- `2026-05-15` - `pnpm run test:static` - PASS. Notes: 69 passing; existing Node `punycode` deprecation warning.

## Architecture Notes

- Raw capture still has to store payload bytes because nested packet fields require versioned `minecraft-data` decoding outside Endstone.
- This is an intentional format break for packet records. Existing legacy object-shaped packet rows are not supported by the updated decoder/query path.
- Scenario and lifecycle markers remain object records because they are sparse and human-readable; the high-volume packet records are compact rows.

## Handoff

Task is complete. Use compact rows plus `scripts/query-packet-recording.js` for future field-level packet investigations.

## Resume Notes

Write the exact next step for a restarted agent. Include the next command to run or file/line area to inspect.

- Next step: None for this task.
- Do not repeat: Initial recorder/decoder inspection.
- Raw logs: `scripts/tmp/packet-query-fixture.jsonl` from static test fixture generation.

## Final Summary

- Result: Endstone packet hook logs now use compact packet rows only, and packet field filtering/projection is available through a streaming query helper.
- Files changed: `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `scripts/decode-endstone-packet-recording.js`, `scripts/query-packet-recording.js`, `scripts/e2e-server/help.js`, `test/static/packet-recording-query.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `test/recorded-bds/README.md`, `docs/tasks/TASK-17-compact-packet-logging.md`.
- Verification: Syntax checks passed, Python compile passed, focused query/options tests passed, decoder smoke passed, and full static suite passed.
- Follow-up tasks: Consider adding richer aggregate modes if future investigations need histograms by arbitrary decoded fields.

## Failure Summary

Fill this when marking the task blocked or abandoned.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
