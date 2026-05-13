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

- `[x]` Build a minimal comparison scenario that runs unchanged against 1.21.130 and 1.26.12:
  - connect chat-command or smoke bot,
  - sample blocks around spawn/feet/head,
  - send controlled look and movement,
  - record `player_auth_input`, server corrections, and observer movement packets.
- `[x]` Compare the same scenario after reproducing the crafting-test setup and teleport:
  - create the 5x5 grass platform at `y=63`,
  - place the crafting table at `(1,64,0)`,
  - teleport the bot to `(0,64,0)`,
  - sample local blocks and movement.
- `[x]` Decode and summarize target packet capture enough to verify the publisher-center packet source.
- `[x]` Identify the first divergence between versions:
  - chunk/subchunk block names and collision shapes,
  - bot `self.position` vs encoded `player_auth_input.position`,
  - physics support-block/vertical-collision state,
  - BDS corrections or lack of broadcast movement.
- `[x]` Patch the smallest layer responsible for the divergence.
- `[x]` Add focused static coverage for the fixed mapping/physics case.
- `[x]` Re-run live comparison and mark success for the teleport chunk-readiness divergence.
- `[ ]` Re-run the focused Endstone crafting/workbench test from TASK-06 to verify the movement/world fix resolves the original container-open path.

## Current State

- Worktree state: many existing uncommitted changes from TASK-06/TASK-09/TASK-10 and related packet-recorder work are present. Treat them as user/peer-agent work and do not revert them.
- Already implemented: TASK-09 added Bedrock 1.26 chunk/subchunk compatibility and live smoke evidence that clean superflat chunks could decode and basic forward movement once changed position by about 5.24 blocks.
- New failure evidence: during a manual Endstone `1.26.12.2` session, `examples/basic-bot.js` received `!lookAtMe` and emitted a look update, but the bot's decoded `player_auth_input.position.y` had already drifted to about `-682.58` and later reached about `-11523.18`. Human attack transactions targeted `MyBot`, but the human observer received no server-to-client movement/rotation updates for `MyBot`.
- Implemented for this task: `scripts/tmp/task11-movement-compare.js` now compares spawn-level movement and the live crafting-test teleport setup. `src/builtins/chunks.js` now treats `network_chunk_publisher_update.coordinates.y` as direct world Y for 1.26+ when it is valid, while preserving the older 1.21 zig-zag decode path. `test/static/chunks-readiness.test.js` covers both `117 -> -59` and 1.26 direct `65`.
- Current result: spawn-level movement matched on Endstone/BDS `1.21.130.4` and `1.26.12.2`; the crafting-teleport setup exposed the 1.26-only divergence. Before the patch, 1.26 decoded server publisher `y=65` as `-33`, so chunk readiness around the teleported `y=64` bot timed out for all 9 chunks. After the patch, 1.26 keeps `chunkPublisherCenter.y=65`, chunk readiness passes, and the short post-teleport movement result matches the 1.21.130 baseline at about `1.10` horizontal blocks.
- Next validation needed: rerun the focused TASK-06 Endstone crafting/workbench test that previously timed out waiting for `container_open`.
- Known mismatch between notes and worktree: TASK-09's final smoke result said 1.26.12 movement once worked, while TASK-06's latest manual packet evidence showed invalid auth-input positions. The new evidence narrows one concrete cause to post-teleport chunk publisher Y normalization in 1.26+.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | changed | New active task log for version-comparison-driven world/physics movement rejection work. |
| `scripts/tmp/task11-movement-compare.js` | changed | Adds reusable live comparison client with spawn and `TASK11_SCENARIO=crafting_teleport` modes, auth-input/correction logging, local block samples, setup commands, and controlled movement. |
| `src/builtins/chunks.js` | changed | Fixes 1.26+ `network_chunk_publisher_update.coordinates.y` handling so direct valid publisher Y values such as `65` are not zig-zag decoded to `-33`; older 1.21 `117 -> -59` behavior is preserved. |
| `test/static/chunks-readiness.test.js` | changed | Adds regression coverage for 1.26 direct publisher Y after teleport while keeping the existing zig-zag publisher-Y test. |
| `docs/tasks/TASK-06-crafting-item-stack-request.md` | inspected | Source of latest manual packet evidence; no additional edits for this task yet. |
| `docs/tasks/TASK-09-local-prismarine-chunk-126.md` | inspected | Prior chunk compatibility evidence and known 1.21.130 vs 1.26.12 chunk decode history. |
| `docs/in-dev/bedrock-first-physics-implementation-notes.md` | inspected | Required physics subsystem notes before future edits under `src/builtins/physics/`. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Baseline capture | Codex | `logs/`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | Packet/log evidence from 1.21.130 scenario | `[x]` |
| Target capture | Codex | `logs/`, `docs/tasks/TASK-11-world-rendering-movement-rejection.md` | Packet/log evidence from 1.26.12 scenario | `[x]` |
| World/physics fix | Codex | `src/builtins/chunks.js`, `test/static/chunks-readiness.test.js` | Minimal patch and verification | `[x]` |

## Evidence Log

- `2026-05-13` - Task log created from TASK-06/TASK-09 evidence. No new tests run in this documentation-only step.
- `2026-05-13` - Prior TASK-06 manual 1.26.12 packet review - FAIL for visible movement/look. Notes: `!lookAtMe` reached `MyBot`; bot emitted auth-input look fields, but local/auth-input Y was invalid and the human observer received no movement/rotation broadcast for `MyBot`.
- `2026-05-13` - Prior TASK-09 live 1.26.12 chunk smoke - PASS at that time. Notes: clean superflat chunks decoded and forward movement changed horizontal position; this must be rechecked against the current dirty worktree and compared to 1.21.130.
- `2026-05-13` - Spawn-level comparison on Endstone `0.10.18` / BDS `1.21.130.4` with `MC_VERSION=1.21.130` - PASS. Command used `TASK11_CONNECT_DELAY_MS=5000`, packet recorder scoped to `Task11Move`, and `node scripts/tmp/task11-movement-compare.js`. Result: local superflat sample showed air at feet/head, `grass_block` below feet, `chunkPublisherCenter.y=-59`, chunk readiness passed, and forward movement changed horizontal position by about `7.93` blocks.
- `2026-05-13` - Spawn-level comparison on Endstone `0.11.3` / BDS `1.26.12.2` with `MC_VERSION=1.26.10` - PASS. Initial attempts without connect delay failed before login with `RakTimeout`; with `TASK11_CONNECT_DELAY_MS=5000`, local samples and forward movement matched baseline at about `7.93` blocks.
- `2026-05-13` - Crafting-teleport comparison on Endstone `0.10.18` / BDS `1.21.130.4` - PASS for short movement. Command used `TASK11_SCENARIO=crafting_teleport`, `TASK11_MOVE_MS=250`, `TASK11_RUN_MS=1500`. Result: after creating the crafting test platform/table and teleporting to `(0,64,0)`, `chunkPublisherCenter.y=65`, chunk readiness passed, and short movement changed horizontal position by about `1.10` blocks.
- `2026-05-13` - Crafting-teleport comparison on Endstone `0.11.3` / BDS `1.26.12.2` before fix - FAIL for chunk readiness. Result: server packet decode showed `network_chunk_publisher_update.coordinates.y=65`, but local `chunkPublisherCenter.y=-33`; `waitForChunksToLoad` timed out for all 9 chunks around the teleported `y=64` position. Raw/decoded logs include `logs/task11-target-12612-crafting-teleport-short-packets.Task11Move.jsonl` and `logs/decoded-task11-target-12612-crafting-teleport-short-full.jsonl`.
- `2026-05-13` - Static chunk regression checks after fix - PASS. Commands: `node -c src/builtins/chunks.js; node -c test/static/chunks-readiness.test.js`; `npx mocha test/static/chunks-readiness.test.js`; `pnpm run test:static`. Results: focused chunk readiness had 10 passing; full static suite had 49 passing.
- `2026-05-13` - Crafting-teleport comparison on Endstone `0.11.3` / BDS `1.26.12.2` after fix - PASS. Command used `TASK11_SCENARIO=crafting_teleport`, `TASK11_MOVE_MS=250`, `TASK11_RUN_MS=1500`, `MC_VERSION=1.26.10`, and packet recorder scoped to `Task11Move`. Result: `chunkPublisherCenter.y=65`, chunk readiness passed, local samples showed `grass_block` below feet and `crafting_table` nearby, and short movement changed horizontal position by about `1.10` blocks.

## Architecture Notes

- The comparison must use the same high-level scenario on both versions. Differences that appear only in 1.26.12 are candidates for the root cause; differences shared by both versions are likely harness or bot-command issues.
- Direct `MC_VERSION=1.26.12` is currently blocked by missing local registry data (`Do not have data for bedrock_1.26.12`). The installed Bedrock data directories include `1.21.130`, `1.26.10`, and `1.26.20`; current Endstone `0.11.3` serves BDS `1.26.12.2`, so the target run currently uses `MC_VERSION=1.26.10`.
- The first likely fault boundaries are:
  - chunk/subchunk decode storing wrong state IDs or empty shapes,
  - world adapter returning air or missing chunks below the bot,
  - physics applying gravity before chunk readiness,
  - `player_auth_input.position` being derived from a relative/local coordinate instead of current server/world position,
  - server corrections not resetting local movement state.
- The packet recorder confirmed the 1.26.12 server sends `network_chunk_publisher_update.coordinates.y=65` after teleport to the crafting platform. The bug was local: `chunks.js` treated every publisher Y as zig-zag encoded, turning `65` into `-33`. This belongs in `chunks.js`, not `prismarine-chunk-fork`, because `prismarine-chunk` handles chunk/subchunk payload decode, while this repo decides how publisher-center packet coordinates drive subchunk requests and readiness.

## Handoff

The comparison client is `scripts/tmp/task11-movement-compare.js`. Use `TASK11_SCENARIO=crafting_teleport` for the crafting-test platform/table/teleport reproduction, and set `TASK11_CONNECT_DELAY_MS=5000` for Endstone `0.11.3` because immediate post-ready pings can time out.

## Resume Notes

- Next step: rerun the focused TASK-06 Endstone crafting/workbench test that previously timed out waiting for `container_open`, using current `src/builtins/chunks.js`.
- If crafting still fails, inspect whether the post-teleport `handled_teleport`, support block state, and open-workbench transaction are now valid; do not revisit generic 1.26 chunk runtime palette work unless the local samples regress.
- Raw logs: latest relevant Task 11 files include `logs/task11-target-12612-crafting-teleport-short-packets.Task11Move.jsonl`, `logs/decoded-task11-target-12612-crafting-teleport-short-full.jsonl`, and `.e2e-servers/endstone-bds/logs/task11-target-12612-crafting-teleport-short-after-patch-packets.Task11Move.jsonl`.

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

- `[x]` Task log updated with current evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. No new packet shapes were added.
- `[x]` Live comparison run on 1.21.130.
- `[x]` Live comparison run on 1.26.12.
- `[x]` Raw debug logs kept out of git.
