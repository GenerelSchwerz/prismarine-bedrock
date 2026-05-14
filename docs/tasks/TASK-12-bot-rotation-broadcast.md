# TASK 12 - Bot Rotation Broadcast

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-13
- **Scope:** Diagnose and fix bot look/rotation updates that are accepted in outgoing auth input but not visible to other Bedrock clients.
- **Owned files:** `src/builtins/physics/movement-packets.js`, `src/builtins/physics/index.js`, `test/live/`, `scripts/tmp/two-bot-rotation-check.js`, `docs/tasks/TASK-12-bot-rotation-broadcast.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `docs/tasks/TASK-06-crafting-item-stack-request.md`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md`

## Goal

Other connected clients should visibly receive a bot's look/rotation changes when the bot calls `look()` or `lookAt()`. Success condition: a sentinel client receives a server-to-client rotation/movement packet for the rotating bot after a look-only command, and decoded packets prove the target runtime's yaw/head-yaw/pitch changed.

## Non-Goals

- Do not change crafting request shape in this task.
- Do not use Geyser-only success as proof of standalone BDS behavior.
- Do not mask the separate falling/local-position bug unless it directly affects rotation broadcast verification.
- Do not rely on human visual observation without packet evidence.

## Current Plan

- `[x]` Reproduce with two local bots so the observer is packet-recorded.
- `[x]` Compare current behavior on Endstone/BDS `1.26.12.2` and baseline `1.21.130.4`.
- `[ ]` Add a focused verification mode to `scripts/tmp/two-bot-rotation-check.js` or a live test that asserts sentinel-observed target rotation packets.
- `[ ]` Test whether sending a standalone `move_player` after look changes causes BDS to broadcast rotation to the sentinel.
- `[ ]` If proven, update the public look path or add an explicit server-visible look sync API with static/live coverage.

## Current State

- Worktree state: only task logs are currently modified; `scripts/tmp/two-bot-rotation-check.js` exists under a gitignored path.
- Already implemented: no production fix yet.
- In progress: diagnosis points at auth-input-only look updates not being rebroadcast by BDS.
- Not started: focused patch and regression test.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-12-bot-rotation-broadcast.md` | changed | New task log for rotation broadcast diagnosis and fix plan. |
| `scripts/tmp/two-bot-rotation-check.js` | local/gitignored | Temporary runner connects `LookBot` and `SentinelBot`, teleports both, rotates `LookBot`, and relies on split Endstone packet recordings. |
| `src/builtins/physics/movement-packets.js` | inspected | `look()` updates local yaw/pitch/headYaw; normal auth-input ticks send those fields. `syncLook()` can send standalone `move_player`, but ordinary `look()`/`waitForLookComplete()` do not send it. |
| `src/builtins/physics/index.js` | inspected | Exposes `look`, `lookAt`, `waitForLookComplete`, and `syncLook`; no change made yet. |
| `docs/tasks/TASK-06-crafting-item-stack-request.md` | changed by prior evidence pass | Contains the original crafting-adjacent rotation findings and points to this new standalone task. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Move-player sync experiment | Unassigned | `scripts/tmp/two-bot-rotation-check.js`, `logs/` | Prove whether `syncLook()`/standalone `move_player` makes the sentinel receive rotation | `[ ]` |
| API/test design | Unassigned | `src/builtins/physics/movement-packets.js`, `test/live/` | Decide whether `look()` should always sync, optionally sync, or expose a separate visible-look helper | `[ ]` |

## Evidence Log

- `2026-05-13` - Two-bot sentinel check on Endstone `0.11.3` / BDS `1.26.12.2` - FAIL for visible rotation broadcast. Command:

```powershell
$env:E2E_ENDSTONE_PACKAGE='endstone'; $env:MC_VERSION='1.26.10'; $env:E2E_PACKET_RECORD_FILE='logs/two-bot-rotation-check-12612.jsonl'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --endstone-packet-recorder-split-by-player --exit-after-client --client-timeout-ms=240000 --client node scripts/tmp/two-bot-rotation-check.js
```

  Result: client exited `0`. `LookBot` sent many `player_auth_input` deltas with yaw/head-yaw/camera-orientation changes through the scripted sequence. `SentinelBot` received `add_player` for `LookBot` runtime `1`, then the setup teleport `move_player` for runtime `1`, but no later `move_player`, `move_entity`, or `move_entity_delta` for `LookBot`.
  Raw: `.e2e-servers/endstone-bds/logs/two-bot-rotation-check-12612.LookBot.jsonl`, `.SentinelBot.jsonl`.
  Decoded: `logs/decoded-two-bot-rotation-lookbot-auth.jsonl`, `logs/decoded-two-bot-rotation-sentinel-all.jsonl`, `logs/decoded-two-bot-rotation-sentinel-movement.jsonl`.

- `2026-05-13` - Two-bot sentinel check on Endstone `0.10.18` / BDS `1.21.130.4` - FAIL for visible rotation broadcast. Command:

```powershell
$env:E2E_ENDSTONE_PACKAGE='endstone==0.10.18'; $env:MC_VERSION='1.21.130'; $env:E2E_PACKET_RECORD_FILE='logs/two-bot-rotation-check-121130.jsonl'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --endstone-packet-recorder-split-by-player --exit-after-client --client-timeout-ms=240000 --client node scripts/tmp/two-bot-rotation-check.js
```

  Result: client exited `0`. `LookBot` sent auth-input yaw/head-yaw/camera-orientation deltas through the same look sequence. `SentinelBot` received `add_player` for `LookBot` runtime `1`, then setup teleport `move_player` for runtime `1`, but no later `move_player`, `move_entity`, or `move_entity_delta` for runtime `1`. The sentinel trace did contain passive-mob `move_entity_delta` packets, so entity movement recording was working.
  Raw: `.e2e-servers/endstone-bds/logs/two-bot-rotation-check-121130.LookBot.jsonl`, `.SentinelBot.jsonl`.
  Decoded: `logs/decoded-two-bot-rotation-121130-lookbot-auth.jsonl`, `logs/decoded-two-bot-rotation-121130-sentinel-all.jsonl`, `logs/decoded-two-bot-rotation-121130-sentinel-movement.jsonl`.

## Architecture Notes

- Current `look()` changes `botState.self.yaw`, `pitch`, and `headYaw`. The regular movement loop encodes those values in `player_auth_input`.
- BDS accepts those auth-input look fields from the bot, but the two-bot traces show BDS does not rebroadcast auth-input-only look changes as entity movement/rotation packets to another client.
- Setup teleports are visible to the sentinel as `move_player`, so the sentinel is close enough and packet recording is not missing all target-player updates.
- `syncLook()` already exists and sends a standalone `move_player` with current interpolated yaw/pitch/head_yaw. The next diagnostic should test whether this packet is the missing server-visible rotation publication path.
- If a `move_player` sync works, the implementation should avoid flooding: only emit it for explicit visible look syncs, container interactions, or completed look changes, not every auth-input interpolation tick unless tests prove BDS requires it.

## Handoff

Start by modifying the temporary two-bot runner to optionally call `lookBot.syncLook()` after each `lookBot.waitForLookComplete()`. Run it first on `MC_VERSION=1.21.130` / `endstone==0.10.18`, then on current Endstone/BDS with `MC_VERSION=1.26.10`. Decode `SentinelBot` only and check for target runtime `1` after the setup teleport.

## Resume Notes

- Next step: add an env-gated experiment to `scripts/tmp/two-bot-rotation-check.js`, such as `ROTATION_SYNC_MOVE_PLAYER=1`, that calls `await lookBot.syncLook()` after each scripted look.
- Do not repeat: plain auth-input-only look has already failed on both BDS `1.21.130.4` and `1.26.12.2`.
- Raw logs: `.e2e-servers/endstone-bds/logs/two-bot-rotation-check-12612*.jsonl` and `.e2e-servers/endstone-bds/logs/two-bot-rotation-check-121130*.jsonl`.

## Final Summary

Not complete.

## Failure Summary

Not blocked.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[ ]` Static tests or focused tests run.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
