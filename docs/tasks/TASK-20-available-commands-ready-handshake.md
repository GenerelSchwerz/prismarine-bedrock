# TASK 20 - Available Commands Ready Handshake

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-16
- **Scope:** Add the missing client-ready packets sent after `available_commands` and fix Bedrock rotation yaw mapping needed for movement.
- **Owned files:** `src/builtins/setup.js`, `src/builtins/physics/index.js`, `src/builtins/entities.js`, `test/static/bedrock-rotation.test.js`, `docs/tasks/TASK-20-available-commands-ready-handshake.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`

## Goal

Send the Bedrock client-ready handshake packets observed in another implementation when the server sends `available_commands`: loading screen type `1`, loading screen type `2`, `interact mouse_over_entity` against runtime id `0`, and `set_local_player_as_initialized` for the local runtime id. Also ensure local self movement uses the 1.26.10 `vec2f` rotation shape, where yaw is `rotation.z`, not `rotation.y`.

## Non-Goals

Do not change physics packet cadence, entity interaction helpers, container-open behavior, or recorded BDS scenario scripts.

## Current Plan

- `[x]` Check current worktree and existing setup packet flow.
- `[x]` Verify packet shapes in the installed 1.26.10 `proto.yml`.
- `[x]` Add the one-time `available_commands` ready handshake in `src/builtins/setup.js`.
- `[x]` Fix self yaw mapping from Bedrock `vec2f` rotation packets.
- `[x]` Add static regression coverage for Bedrock rotation mapping.
- `[x]` Round-trip the new packet shapes.
- `[x]` Run focused static verification.

## Current State

- Worktree state: dirty before this task. At the follow-up, `src/builtins/chunks.js` was already modified outside this task and left untouched.
- Already implemented: `src/builtins/setup.js` now queues the missing ready packets once on `available_commands`; `src/builtins/physics/index.js` and `src/builtins/entities.js` now use `rotation.z` for Bedrock `vec2f` yaw.
- In progress: none.
- Not started: live server verification; deferred because serializer and static tests passed and no live server run was requested.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/setup.js` | changed | Added a one-time `available_commands` handler that sends two `serverbound_loading_screen` packets, a no-position `interact mouse_over_entity`, and `set_local_player_as_initialized`. |
| `src/builtins/physics/index.js` | changed | Added rotation helpers and fixed `start_game` / `correct_player_move_prediction` self yaw to use `rotation.z` for Bedrock `vec2f`. |
| `src/builtins/entities.js` | changed | Fixed duplicate self `correct_player_move_prediction` yaw assignment to use `rotation.z` and update `headYaw`. |
| `test/static/bedrock-rotation.test.js` | changed | Added regression tests for self yaw mapping in physics and entity correction handlers. |
| `src/builtins/chunks.js` | skipped | Pre-existing worktree modification; unrelated to this task and not inspected or changed. |
| `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml` | inspected | Confirmed `packet_serverbound_loading_screen`, `packet_interact`, and `packet_set_local_player_as_initialized` shapes. |
| `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/types.yml` | inspected | Confirmed `vec2f` fields are `x` and `z`; yaw-bearing packet rotations must read `z`. |
| `docs/in-dev/bedrock-first-physics-implementation-notes.md` | inspected | Required physics/protocol-context reading because the active file context was movement packet code. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-16` - `git status --short` - PASS. Notes: worktree was already dirty with unrelated edits before this task.
- `2026-05-16` - custom 1.26.10 serializer round-trip for `serverbound_loading_screen` type `1`, `serverbound_loading_screen` type `2`, `interact mouse_over_entity`, and `set_local_player_as_initialized` - PASS. Notes: packet hex outputs were `b8020200`, `b8020400`, `21040000`, and `7101`.
- `2026-05-16` - `node -c src/builtins/setup.js` - PASS. Notes: syntax check passed.
- `2026-05-16` - `pnpm run test:static` - PASS. Notes: 90 passing.
- `2026-05-16` - `node -c src/builtins/physics/index.js; node -c src/builtins/entities.js; node -c test/static/bedrock-rotation.test.js` - PASS. Notes: syntax checks passed.
- `2026-05-16` - `npx mocha test/static/bedrock-rotation.test.js` - PASS. Notes: 2 passing.
- `2026-05-16` - `pnpm run test:static` - PASS. Notes: 93 passing after adding rotation regression tests.

## Architecture Notes

- `packet_serverbound_loading_screen` in 1.26.10 is serverbound and accepts `type: zigzag32` plus optional `loading_screen_id`.
- `packet_interact` only carries `position` when `has_position` is true, so the setup mouse-over packet omits `position`.
- Existing `play_status: player_spawn` initialization remains in place; this task adds the missing `available_commands` sequence without altering respawn behavior.
- Bedrock `vec2f` is `{ x, z }`; `start_game.rotation` and `correct_player_move_prediction.rotation` use `x` as pitch and `z` as yaw. Reading `rotation.y` leaves `botState.self.yaw` undefined and causes movement packet senders to fall back to zero-degree yaw.

## Handoff

Task complete. Live validation is the only remaining optional follow-up if packet parity or movement still looks off against a real BDS trace.

## Resume Notes

- Next step: run a live Endstone/BDS capture if startup packet parity or movement still shows a gap.
- Do not repeat: proto/types shape inspection, serializer round-trip, syntax check, or static test run for this change.
- Raw logs: none.

## Final Summary

- Result: Added the missing one-time `available_commands` client-ready handshake in setup and fixed self yaw mapping from Bedrock `vec2f` rotations.
- Files changed: `src/builtins/setup.js`, `src/builtins/physics/index.js`, `src/builtins/entities.js`, `test/static/bedrock-rotation.test.js`, `docs/tasks/TASK-20-available-commands-ready-handshake.md`.
- Verification: packet serializer round-trip for all new packet shapes, syntax checks, focused rotation tests, and `pnpm run test:static` all passed.
- Follow-up tasks: Optional live packet capture comparison against Endstone/BDS startup and first movement if parity remains suspect.

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
