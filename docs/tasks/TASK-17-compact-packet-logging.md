# TASK 17 - Compact Packet Logging

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-15
- **Scope:** Reduce Endstone packet recorder output size and add queryable decoded packet projections plus a SQLite analysis sidecar.
- **Owned files:** `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py`, `scripts/decode-endstone-packet-recording.js`, `scripts/query-packet-recording.js`, `scripts/index-packet-recording.js`, `scripts/query-packet-db.js`, `scripts/e2e-server/help.js`, `test/static/packet-recording-query.test.js`, `test/static/packet-recording-db.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `test/recorded-bds/README.md`, `package.json`, `pnpm-workspace.yaml`, `docs/tasks/TASK-17-compact-packet-logging.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/e2e-server-launch-notes.md`, `test/rules.md`, `test/recorded-bds/README.md`

## Goal

Make Endstone packet recordings smaller by default without losing raw packet payloads, intentionally move the decoder/query path to the new compact packet format, and provide tools that can filter decoded packet streams by packet name/id, nested field predicates, event bounds, and samples.

## Non-Goals

Do not change bot runtime protocol behavior, live environment tests, TASK-15/TASK-16 edits, or the general e2e process log format.

## Current Plan

- `[x]` Add compact raw packet row format.
- `[x]` Update decoder for compact packet rows.
- `[x]` Add decoded packet query/projection script with static coverage.
- `[x]` Add SQLite index/query sidecar for event-bounded sampling and wildcard field predicates.
- `[x]` Run final full static verification after docs/log updates.

## Current State

- Worktree state: Existing unrelated TASK-15/TASK-16 changes may be present and should remain untouched. This task changes packet recording docs/tooling plus `package.json` and `pnpm-workspace.yaml` for `better-sqlite3`.
- Already implemented: Endstone packet hooks now write compact packet rows only; `decode-endstone-packet-recording.js` reads compact rows; `query-packet-recording.js` filters/projects decoded packet fields; `index-packet-recording.js` builds SQLite sidecars; `query-packet-db.js` supports event-bounded sampling and wildcard field predicates.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` | changed | Packet hook records now write compact `["p",sequence,ts,direction,packet_id,sub_client_id,player,address,payload_base64,payload_size,payload_sha256]` rows only. Marker records remain objects and `recorder_start` documents the packet schema. |
| `scripts/decode-endstone-packet-recording.js` | changed | Reads compact packet rows directly and ignores marker objects. |
| `scripts/query-packet-recording.js` | added | Streams compact recordings, decodes packet fields, filters by packet id/name and equality predicates, projects selected fields, and supports aggregate counts. |
| `scripts/index-packet-recording.js` | added | Builds a disposable SQLite sidecar from compact JSONL, including decoded packet JSON and flattened scalar `packet_fields`. |
| `scripts/query-packet-db.js` | added | Queries SQLite sidecars with event bounds, packet filters, wildcard field predicates, projections, sampling, and limits. |
| `scripts/e2e-server/help.js` | changed | Documents recorder output as compact JSONL rows. |
| `test/static/packet-recording-query.test.js` | added | Covers metadata projection and aggregate counts over compact packet rows. |
| `test/static/packet-recording-db.test.js` | added | Covers SQLite index creation and event-bounded sampling. |
| `docs/in-dev/e2e-server-launch-notes.md` | changed | Documents compact packet rows, direct query workflow, and SQLite sidecar workflow. |
| `test/recorded-bds/README.md` | changed | Documents compact packet rows, direct field-query workflow, and SQLite sidecar workflow for recorded scenarios. |
| `package.json` | changed | Adds `better-sqlite3` as a dev dependency for local analysis scripts. |
| `pnpm-workspace.yaml` | added | Allows the `better-sqlite3` build script under pnpm's build-approval policy. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-15` - `node -c scripts/decode-endstone-packet-recording.js` - PASS.
- `2026-05-15` - `node -c scripts/query-packet-recording.js` - PASS.
- `2026-05-15` - `python -m py_compile scripts/endstone-packet-recorder/src/endstone_packet_recorder/recorder.py` - PASS.
- `2026-05-15` - `npx mocha test/static/packet-recording-query.test.js test/static/e2e-server-options.test.js` - PASS. Notes: 6 passing.
- `2026-05-15` - `node scripts/decode-endstone-packet-recording.js scripts/tmp/packet-query-fixture.jsonl 1.26.10 --packet-ids=147` - PASS. Notes: compact row was accepted and decoded to an error summary for the intentionally empty payload fixture.
- `2026-05-15` - `pnpm run test:static` - PASS. Notes: 69 passing; existing Node `punycode` deprecation warning.
- `2026-05-15` - `pnpm add -D better-sqlite3` - PASS. Notes: package added; build script initially blocked by pnpm policy.
- `2026-05-15` - `pnpm approve-builds --all` - PASS. Notes: allowed and built `better-sqlite3`; created `pnpm-workspace.yaml`.
- `2026-05-15` - `node -e "const Database = require('better-sqlite3'); ..."` - PASS. Notes: verified the native binding works.
- `2026-05-15` - `node -c scripts/index-packet-recording.js` - PASS.
- `2026-05-15` - `node -c scripts/query-packet-db.js` - PASS.
- `2026-05-15` - `npx mocha test/static/packet-recording-db.test.js test/static/packet-recording-query.test.js` - PASS. Notes: 4 passing.
- `2026-05-15` - `pnpm run test:static` - PASS. Notes: 71 passing; existing Node `punycode` deprecation warning.
- `2026-05-15` - `node -c scripts/query-packet-db.js` after repeated-step event-bound tightening - PASS.
- `2026-05-15` - `npx mocha test/static/packet-recording-db.test.js` after repeated-step event-bound tightening - PASS. Notes: 2 passing.
- `2026-05-15` - `pnpm run test:static` final rerun - PASS. Notes: 71 passing; existing Node `punycode` deprecation warning.
- `2026-05-15` - `npx mocha test/static/packet-recording-db.test.js` after wildcard predicate coverage - PASS. Notes: 3 passing.
- `2026-05-15` - `node -c test/static/packet-recording-db.test.js` - PASS.
- `2026-05-15` - `pnpm run test:static` final rerun after wildcard predicate coverage - PASS. Notes: 72 passing; existing Node `punycode` deprecation warning.

## Architecture Notes

- Raw capture still has to store payload bytes because nested packet fields require versioned `minecraft-data` decoding outside Endstone.
- This is an intentional format break for packet records. Existing legacy object-shaped packet rows are not supported by the updated decoder/query path.
- Scenario and lifecycle markers remain object records because they are sparse and human-readable; the high-volume packet records are compact rows.
- JSONL is still the right raw capture stream because it is append-only, crash-tolerant, easy for Endstone to write, and stores raw payload bytes without requiring SQLite writes on the server hot path.
- SQLite is the generated analysis layer because it supports indexed packet/event queries, JSON extraction, flattened nested field predicates, and event-bounded sampling.
- SQLite files are disposable sidecars under `logs/` or `.e2e-servers/`; regenerate them from compact JSONL when the decoder or schema changes.
- When both `--after-event` and `--before-event` are provided, the DB query chooses the first matching end event at or after the selected start event so repeated scenario steps do not accidentally widen the sample range.

## Handoff

Task is complete. Use compact rows plus `scripts/query-packet-recording.js` for small field-level packet investigations; use `scripts/index-packet-recording.js` and `scripts/query-packet-db.js` for event-bounded or repeated queries.

## Resume Notes

- Next step: None for this task.
- Do not repeat: Initial recorder/decoder inspection or `better-sqlite3` binding verification.
- Raw logs: `scripts/tmp/packet-query-fixture.jsonl`, `scripts/tmp/packet-db-fixture.jsonl`, and `scripts/tmp/packet-db-fixture.sqlite` from static test fixture generation.

## Final Summary

- Result: Added a SQLite sidecar workflow for compact packet recordings while keeping compact JSONL as the raw capture stream.
- Files changed: `scripts/index-packet-recording.js`, `scripts/query-packet-db.js`, `test/static/packet-recording-db.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `test/recorded-bds/README.md`, `package.json`, `pnpm-workspace.yaml`, and this task log.
- Verification: `better-sqlite3` binding smoke passed, syntax checks passed, focused DB/query tests passed, and `pnpm run test:static` passed with 72 tests.
- Follow-up tasks: Add richer DB aggregate reports if a future investigation needs histograms or joins beyond the current query CLI.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
