# TASK 21 - Limited Subchunk Polling

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-16
- **Scope:** Make 1.26 limited subchunk polling request every vertical section advertised by `level_chunk.highest_subchunk_count`.
- **Owned files:** `src/builtins/chunks.js`, `test/static/chunks-readiness.test.js`, `docs/tasks/TASK-21-limited-subchunk-polling.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md`

## Goal

Fix 1.26 rendering holes caused by requesting only a narrow vertical window after `level_chunk` enters subchunk polling mode. Success means limited polling mode uses the packet schema's advertised highest non-air subchunk to request the full column range.

## Non-Goals

- Do not change chunk payload decoding in the local `prismarine-chunk` fork.
- Do not change movement physics or packet auth input.
- Do not run a live human capture unless static/schema evidence is insufficient.

## Current Plan

- `[x]` Inspect 1.26 `level_chunk`, `subchunk`, and `subchunk_request` schema.
- `[x]` Patch limited polling mode request selection.
- `[x]` Run focused static tests and a packet round-trip for the request shape.

## Current State

- Worktree state: `src/builtins/chunks.js`, `test/static/chunks-readiness.test.js`, and this task log are modified by this task. Other modified/untracked files are present in the worktree and were not touched for this task.
- Already implemented: limited mode (`sub_chunk_count === -2`) now requests sections from world min section through `highest_subchunk_count`.
- In progress: none.
- Not started: live Endstone/BDS validation, intentionally deferred because the packet schema and focused static regression cover the request-planning bug.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/chunks.js` | changed | Added limited polling section planning from `WORLD_MIN_SECTION_Y` through packet `highest_subchunk_count`; limitless/default paths keep the existing three-section window. |
| `test/static/chunks-readiness.test.js` | changed | Added a regression for `sub_chunk_count: -2` with `highest_subchunk_count`. |
| `docs/tasks/TASK-21-limited-subchunk-polling.md` | changed | Tracks schema finding, edits, and verification. |

## Parallel Subtasks

None.

## Evidence Log

- `2026-05-16` - Schema inspection of `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml` - PASS. Notes: `packet_level_chunk.sub_chunk_count` can be negative for subchunk polling; `highest_subchunk_count` is present only when `sub_chunk_count` is `-2`; `packet_subchunk_request.requests` is an array of signed byte offsets from an absolute subchunk origin.
- `2026-05-16` - Gophertunnel inspection of `ref/gophertunnel/minecraft/protocol/packet/level_chunk.go` and `sub_chunk_request.go` - PASS. Notes: `SubChunkRequestModeLimited` uses `HighestSubChunk`; request position uses absolute chunk X/Z and absolute subchunk Y with signed byte offsets.
- `2026-05-16` - `npx mocha test/static/chunks-readiness.test.js` - PASS. Notes: 12 passing; includes limited mode regression.
- `2026-05-16` - `node scripts/roundtrip-packet.js scripts/tmp/task21-subchunk-request.json` - PASS. Notes: 1.26.10 serializer preserved the batched `subchunk_request` offsets from `dy=-8` through `dy=2`.

## Architecture Notes

- Existing code treated every negative `sub_chunk_count` the same and requested only `originY - 1` through `originY + 1`.
- In limited mode, the server has already advertised the highest non-air subchunk for that column. Requesting only three sections around the publisher/player height leaves lower or higher terrain sections absent, which shows up as render holes even though individual decoded subchunks are valid.
- The request packet shape supports batching all needed vertical sections for a column because offsets are signed bytes relative to the absolute subchunk origin.

## Handoff

The focused static test and serializer round-trip pass. If visual parity still looks suspicious, run a live Endstone/BDS smoke test and compare the decoded `level_chunk` limited mode packets against emitted bot `subchunk_request` offsets.

## Resume Notes

- Next step: optional live Endstone/BDS smoke test if needed.
- Do not repeat: schema and Gophertunnel source inspection already found the issue.
- Raw logs: none.

## Final Summary

- Result: Limited subchunk polling now requests every vertical section from the modern overworld minimum section through the packet-advertised highest non-air section instead of only the three sections around the publisher/player origin.
- Files changed: `src/builtins/chunks.js`, `test/static/chunks-readiness.test.js`, `docs/tasks/TASK-21-limited-subchunk-polling.md`.
- Verification: `npx mocha test/static/chunks-readiness.test.js` passed; `node scripts/roundtrip-packet.js scripts/tmp/task21-subchunk-request.json` passed.
- Follow-up tasks: Live visual/parity smoke test can be run if the renderer still shows holes.

## Failure Summary

Fill this when marking the task blocked or abandoned.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
