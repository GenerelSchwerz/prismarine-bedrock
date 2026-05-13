# TASK 11 - World Rendering And Movement Rejection

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-13
- **Scope:** Diagnose and fix the bot's local world/physics state divergence that makes BDS reject or ignore movement on 1.26.12.
- **Owned files:** `docs/tasks/TASK-11-world-rendering-movement-rejection.md`, `src/builtins/setup.js`, `src/builtins/world.js`, `src/builtins/physics/`, `prismarine-chunk-fork/`, focused tests under `test/static/` and `test/live/` as needed
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`, `docs/tasks/TASK-06-crafting-item-stack-request.md`, `test/rules.md`

## Goal

The bot should render/load the local Bedrock world correctly enough that physics uses the same solid ground and collision state as the server, so movement and look packets are accepted and visible to a human observer on BDS `1.26.12.2`.

Success vs failure is determined by comparing the same scenario on:

- **Known-good baseline:** Endstone/BDS `1.21.130.x` with `MC_VERSION=1.21.130`.
- **Target:** Endstone/BDS `1.26.12.2` with the available local `MC_VERSION=1.26.10` protocol data, unless true `1.26.12` registry data is added.

The target passes only when its decoded local world samples, auth-input position/delta, server correction behavior, and human-observed movement/rotation match the 1.21.130 baseline closely enough for normal movement and knockback to work.

## Non-Goals

- Do not change crafting item-stack request packet shapes in this task.
- Do not treat Geyser behavior as proof of standalone BDS behavior.
- Do not add a speculative movement workaround before proving whether the root issue is chunk/world decode, position initialization, physics collision, or packet encoding.
- Do not hard-code old `.pnpm` paths or stale version directories.

## Current Plan

- `[ ]` Build a minimal comparison scenario that runs unchanged against 1.21.130 and 1.26.12:
  - connect chat-command or smoke bot,
  - sample blocks around spawn/feet/head,
  - send controlled look and movement,
  - record `player_auth_input`, server corrections, and observer movement packets.
- `[ ]` Decode and summarize both packet captures using the same packet IDs and same player-scoped recorder settings.
- `[ ]` Identify the first divergence between versions:
  - chunk/subchunk block names and collision shapes,
  - bot `self.position` vs encoded `player_auth_input.position`,
  - physics support-block/vertical-collision state,
  - BDS corrections or lack of broadcast movement.
- `[ ]` Patch the smallest layer responsible for the divergence.
- `[ ]` Add focused static coverage for the fixed mapping/physics case.
- `[ ]` Re-run live comparison and mark success only if 1.26.12 behavior matches the 1.21.130 baseline.

## Current State

- Worktree state: many existing uncommitted changes from TASK-06/TASK-09/TASK-10 and related packet-recorder work are present. Treat them as user/peer-agent work and do not revert them.
- Already implemented: TASK-09 added Bedrock 1.26 chunk/subchunk compatibility and live smoke evidence that clean superflat chunks could decode and basic forward movement once changed position by about 5.24 blocks.
- New failure evidence: during a manual Endstone `1.26.12.2` session, `examples/basic-bot.js` received `!lookAtMe` and emitted a look update, but the bot's decoded `player_auth_input.position.y` had already drifted to about `-682.58` and later reached about `-11523.18`. Human attack transactions targeted `MyBot`, but the human observer received no server-to-client movement/rotation updates for `MyBot`.
- In progress: this task log defines the new priority investigation.
- Not started: no new reproduction script, tests, or code fix for this task yet.
- Known mismatch between notes and worktree: TASK-09's final smoke result says 1.26.12 movement once worked, but TASK-06's latest manual packet evidence shows the current worktree can still produce invalid auth-input positions and invisible/rejected movement.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | changed | New active task log for version-comparison-driven world/physics movement rejection work. |
| `docs/tasks/TASK-06-crafting-item-stack-request.md` | inspected | Source of latest manual packet evidence; no additional edits for this task yet. |
| `docs/tasks/TASK-09-local-prismarine-chunk-126.md` | inspected | Prior chunk compatibility evidence and known 1.21.130 vs 1.26.12 chunk decode history. |
| `docs/in-dev/bedrock-first-physics-implementation-notes.md` | inspected | Required physics subsystem notes before future edits under `src/builtins/physics/`. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Baseline capture | Unassigned | `logs/`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | Packet/log evidence from 1.21.130 scenario | `[ ]` |
| Target capture | Unassigned | `logs/`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | Packet/log evidence from 1.26.12 scenario | `[ ]` |
| World/physics fix | Unassigned | `src/builtins/setup.js`, `src/builtins/world.js`, `src/builtins/physics/`, tests | Minimal patch and verification | `[ ]` |

## Evidence Log

- `2026-05-13` - Task log created from TASK-06/TASK-09 evidence. No new tests run in this documentation-only step.
- `2026-05-13` - Prior TASK-06 manual 1.26.12 packet review - FAIL for visible movement/look. Notes: `!lookAtMe` reached `MyBot`; bot emitted auth-input look fields, but local/auth-input Y was invalid and the human observer received no movement/rotation broadcast for `MyBot`.
- `2026-05-13` - Prior TASK-09 live 1.26.12 chunk smoke - PASS at that time. Notes: clean superflat chunks decoded and forward movement changed horizontal position; this must be rechecked against the current dirty worktree and compared to 1.21.130.

## Architecture Notes

- The comparison must use the same high-level scenario on both versions. Differences that appear only in 1.26.12 are candidates for the root cause; differences shared by both versions are likely harness or bot-command issues.
- Direct `MC_VERSION=1.26.12` is currently blocked by missing local registry data (`Do not have data for bedrock_1.26.12`). The installed Bedrock data directories include `1.21.130`, `1.26.10`, and `1.26.20`; current Endstone `0.11.3` serves BDS `1.26.12.2`, so the target run currently uses `MC_VERSION=1.26.10`.
- The first likely fault boundaries are:
  - chunk/subchunk decode storing wrong state IDs or empty shapes,
  - world adapter returning air or missing chunks below the bot,
  - physics applying gravity before chunk readiness,
  - `player_auth_input.position` being derived from a relative/local coordinate instead of current server/world position,
  - server corrections not resetting local movement state.

## Handoff

Start by creating or reusing a tiny live comparison client that logs:

- bot self position before and after spawn settles,
- `world.sync.getBlock()` at feet, below feet, and head,
- outgoing `player_auth_input.position`, `delta`, `input_data`, `yaw`, and `pitch`,
- server `correct_player_move_prediction`, `move_player`, and observer movement packets.

Run it first on 1.21.130, then on 1.26.12, using packet recorder split-by-player output.

## Resume Notes

- Next step: build the minimal comparison run script under `scripts/tmp/` or adapt an existing smoke script, then run it against Endstone `1.21.130` and current Endstone `1.26.12.2`.
- Do not repeat: generic chunk compatibility work from TASK-09 unless the new comparison shows a chunk/world sample mismatch.
- Raw logs: latest relevant prior packet files are `.e2e-servers/endstone-bds/logs/chat-command-bot-12612-20260513-191518-packets.MyBot.jsonl` and `.Generel7050.jsonl`; decoded summaries are under `logs/decoded-chat-command-*.jsonl`.

## Final Summary

Fill this only when marking the task complete.

- Result:
- Files changed:
- Verification:
- Follow-up tasks:

## Failure Summary

Fill this when marking the task blocked or abandoned.

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[ ]` Task log updated with final evidence.
- `[ ]` Current State and Change Ledger reflect the worktree.
- `[ ]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[ ]` Static tests or focused tests run.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[ ]` Live comparison run on 1.21.130.
- `[ ]` Live comparison run on 1.26.12.
- `[ ]` Raw debug logs kept out of git.
