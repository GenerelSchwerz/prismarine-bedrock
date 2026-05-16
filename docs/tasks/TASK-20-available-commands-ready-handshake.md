# TASK 20 - Available Commands Ready Handshake

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-16
- **Scope:** Add the missing client-ready packets sent after `available_commands`.
- **Owned files:** `src/builtins/setup.js`, `docs/tasks/TASK-20-available-commands-ready-handshake.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`

## Goal

Send the Bedrock client-ready handshake packets observed in another implementation when the server sends `available_commands`: loading screen type `1`, loading screen type `2`, `interact mouse_over_entity` against runtime id `0`, and `set_local_player_as_initialized` for the local runtime id.

## Non-Goals

Do not change physics packet cadence, entity interaction helpers, container-open behavior, or recorded BDS scenario scripts.

## Current Plan

- `[x]` Check current worktree and existing setup packet flow.
- `[x]` Verify packet shapes in the installed 1.26.10 `proto.yml`.
- `[x]` Add the one-time `available_commands` ready handshake in `src/builtins/setup.js`.
- `[x]` Round-trip the new packet shapes.
- `[x]` Run focused static verification.

## Current State

- Worktree state: dirty before this task with unrelated edits in launcher, recorder, docs, scenarios, and recorded-BDS files.
- Already implemented: `src/builtins/setup.js` now queues the missing ready packets once on `available_commands`.
- In progress: none.
- Not started: live server verification; deferred because serializer and static tests passed and no live server run was requested.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/setup.js` | changed | Added a one-time `available_commands` handler that sends two `serverbound_loading_screen` packets, a no-position `interact mouse_over_entity`, and `set_local_player_as_initialized`. |
| `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml` | inspected | Confirmed `packet_serverbound_loading_screen`, `packet_interact`, and `packet_set_local_player_as_initialized` shapes. |
| `docs/in-dev/bedrock-first-physics-implementation-notes.md` | inspected | Required physics/protocol-context reading because the active file context was movement packet code. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-16` - `git status --short` - PASS. Notes: worktree was already dirty with unrelated edits before this task.
- `2026-05-16` - custom 1.26.10 serializer round-trip for `serverbound_loading_screen` type `1`, `serverbound_loading_screen` type `2`, `interact mouse_over_entity`, and `set_local_player_as_initialized` - PASS. Notes: packet hex outputs were `b8020200`, `b8020400`, `21040000`, and `7101`.
- `2026-05-16` - `node -c src/builtins/setup.js` - PASS. Notes: syntax check passed.
- `2026-05-16` - `pnpm run test:static` - PASS. Notes: 90 passing.

## Architecture Notes

- `packet_serverbound_loading_screen` in 1.26.10 is serverbound and accepts `type: zigzag32` plus optional `loading_screen_id`.
- `packet_interact` only carries `position` when `has_position` is true, so the setup mouse-over packet omits `position`.
- Existing `play_status: player_spawn` initialization remains in place; this task adds the missing `available_commands` sequence without altering respawn behavior.

## Handoff

Task complete. Live validation is the only remaining optional follow-up if packet parity still looks off against a real BDS trace.

## Resume Notes

- Next step: run a live Endstone/BDS capture if startup packet parity still shows a gap.
- Do not repeat: proto.yml shape inspection, serializer round-trip, syntax check, or static test run for this change.
- Raw logs: none.

## Final Summary

- Result: Added the missing one-time `available_commands` client-ready handshake in setup.
- Files changed: `src/builtins/setup.js`, `docs/tasks/TASK-20-available-commands-ready-handshake.md`.
- Verification: packet serializer round-trip for all new packet shapes, `node -c src/builtins/setup.js`, and `pnpm run test:static` all passed.
- Follow-up tasks: Optional live packet capture comparison against Endstone/BDS startup if startup parity remains suspect.

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
