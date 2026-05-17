# TASK 23 - BotState Categorized State

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-17
- **Scope:** Group loose primitive bot state values into category objects and remove top-level compatibility shims for the moved values.
- **Owned files:** `src/state.js`, `src/builtins/setup.js`, `src/builtins/chunks.js`, `src/builtins/environment.js`, focused static tests as needed
- **Related docs:** `AGENTS.md`, `test/rules.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`

## Goal

Move floating primitive values such as world bounds, dimension, health, XP, and chunk publisher metadata into named state categories on `botState`, without top-level compatibility accessors.

## Non-Goals

- Do not refactor public bot methods or plugin installation.
- Do not change packet behavior or live server interaction.
- Do not introduce top-level compatibility fields or accessors for the moved values.

## Current Plan

- `[x]` Inspect current loose primitive assignments and read sites.
- `[x]` Add grouped state objects to `BotState` without top-level compatibility accessors.
- `[x]` Update core setup/chunk/environment code to write grouped state first.
- `[x]` Add or update focused static coverage.
- `[x]` Verification.

## Current State

- Worktree state: `docs/tasks/TASK-22-mineflayer-pathfinder-adapter-review.md` is untracked user/peer work and is not owned by this task.
- Already implemented: `BotState` now owns `lifecycle`, `playerState`, `game`, `worldSettings`, `chunkState`, and `protocolState` groups. Top-level primitive aliases/accessors for these values were not kept. The temporary `runtimeState` duplicate was removed; normalized runtime options remain under `botState.options`, while `botState.version` remains the direct public version field.
- In progress: none.
- Not started: none.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-23-botstate-categorized-state.md` | changed | Task log for the categorized state refactor. |
| `src/state.js` | changed | Added grouped category objects and removed top-level primitive state fields for dimension, player health/spawn, world bounds, chunk publisher metadata, protocol handshakes, and the duplicate `runtimeState`. |
| `src/builtins/setup.js` | changed | Writes lifecycle/player/protocol/game state into grouped objects. |
| `src/builtins/chunks.js` | changed | Writes world bounds and chunk publisher/count data into `worldSettings` and `chunkState`; reads dimension/protocol flags from groups. |
| `src/builtins/environment.js` | changed | Uses `environment` as the source of truth; removed top-level time/day/weather mirrors. |
| `src/builtins/players.js` | changed | Updates spawn position through `playerState`. |
| `src/builtins/food.js` | changed | Reads fallback position from `playerState.spawnPosition`. |
| `src/builtins/place.js` | changed | Reads fallback position from `playerState.spawnPosition`. |
| `src/builtins/containers/index.js` | changed | Reads fallback position from `playerState.spawnPosition`. |
| `src/builtins/physics/index.js` | changed | Reads usable movement world bounds from `worldSettings`. |
| `src/plugin-loader.js` | changed | Uses normalized `botState.options` for builtin runtime gating instead of top-level flags or duplicate runtime state. |
| `test/static/runtime-options.test.js` | changed | Updated dimension/runtime assertions and added coverage that categorized state does not exist as top-level primitive aliases or duplicate `runtimeState`. |
| `test/static/bedrock-rotation.test.js` | changed | Removed test-only `runtimeState` setup; plugin options cover the explicit physics enablement in handcrafted fixtures. |
| `test/static/chunks-readiness.test.js` | changed | Updated fixture and assertions for `game`, `protocolState`, and `chunkState`. |
| `test/static/environment.test.js` | changed | Updated assertions to use `environment`/`getEnvironment()`. |
| `test/static/food.test.js` | changed | Updated fixture spawn position into `playerState`. |
| `test/static/crafting.test.js` | changed | Updated hash-mode fixture flag into `protocolState`. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-17` - `git status --short` - PASS. Notes: only pre-existing untracked `TASK-22...` before this task log.
- `2026-05-17` - `npx mocha test/static/runtime-options.test.js test/static/chunks-readiness.test.js test/static/environment.test.js test/static/food.test.js test/static/crafting.test.js` - PASS. Notes: 34 passing after removing compatibility shims.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 98 passing.
- `2026-05-17` - `npx mocha test/static/runtime-options.test.js test/static/bedrock-rotation.test.js test/static/chunks-readiness.test.js` - PASS. Notes: 26 passing after removing `runtimeState`.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 98 passing after removing `runtimeState`.
- `2026-05-17` - Packet round-trip/live tests - NOT RUN. Notes: no packet shapes or live server behavior changed.

## Architecture Notes

- State categories are explicit objects on `botState`: `lifecycle`, `playerState`, `game`, `worldSettings`, `chunkState`, and `protocolState`.
- No top-level compatibility accessors were kept for the moved primitive values.
- Normalized construction options, including `worldDecodeEnabled` and `physicsEnabled`, live only under `botState.options`; `runtimeState` is intentionally absent to avoid duplicating `options` and `bot.version`.

## Handoff

Task complete. Future state additions should prefer an existing grouped object or add a new category object instead of placing standalone primitive values on `botState`.

## Resume Notes

- Next step: none.
- Do not repeat: initial loose state search or focused/static verification.
- Raw logs: none.

## Final Summary

- Result: grouped loose primitive `botState` values and removed the compatibility/accessor shims and duplicate `runtimeState` at the user's request.
- Files changed: `src/state.js`, relevant builtins, focused static tests, and this task log.
- Verification: `pnpm run test:static` passed with 98 tests.
- Follow-up tasks: consider grouping other public mutable roots such as inventory action booleans in a separate API-aware pass.

## Failure Summary

Fill this when marking the task blocked or abandoned.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable; not applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
