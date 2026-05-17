# TASK 22 - Mineflayer Pathfinder Adapter Review

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-17
- **Scope:** Inspect `mineflayer-pathfinder` as a reference and identify the minimum bot/world/entity state needed to reuse it for movement-only navigation.
- **Owned files:** `docs/tasks/TASK-22-mineflayer-pathfinder-adapter-review.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`, `docs/reference/mineflayer-feature-comparison.md`

## Goal

Produce a concrete compatibility review for using `mineflayer-pathfinder` as the base for Bedrock bot movement, explicitly excluding digging, placing, crafting, and inventory/tool behavior.

## Non-Goals

- Do not implement pathfinding in `src/`.
- Do not change physics behavior.
- Do not attempt full Mineflayer plugin compatibility.

## Current Plan

- `[x]` Check worktree state and relevant movement docs.
- `[x]` Pull `mineflayer-pathfinder` into `ref/` for local source inspection.
- `[x]` Inspect the plugin entrypoint, movement executor, world/entity assumptions, and no-dig/no-place path.
- `[x]` Map required assumptions to this repo's existing bot APIs.
- `[x]` Summarize adapter requirements and blockers.

## Current State

- Worktree state: existing user or peer changes were present before this task in `.gitignore`, `AGENTS.md`, several docs, and task logs. This task only owns this new task log. `ref/mineflayer-pathfinder` was cloned under gitignored `ref/`.
- Already implemented: no code changes.
- In progress: none.
- Not started: adapter implementation.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-22-mineflayer-pathfinder-adapter-review.md` | changed | Durable notes for the pathfinder compatibility investigation. |
| `ref/mineflayer-pathfinder/` | inspected / gitignored | Local reference clone of PrismarineJS `mineflayer-pathfinder`; not repo source. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-17` - `git status --short` - PASS. Notes: pre-existing modifications detected; no unrelated files reverted.
- `2026-05-17` - read movement docs and parity docs - PASS. Notes: current repo exposes low-level controls and Bedrock-first auth-input physics but no pathfinder.
- `2026-05-17` - `git clone https://github.com/PrismarineJS/mineflayer-pathfinder.git ref/mineflayer-pathfinder` - PASS. Notes: reference checkout cloned under ignored `ref/`.
- `2026-05-17` - inspected `ref/mineflayer-pathfinder/index.js`, `lib/movements.js`, `lib/physics.js`, `lib/astar.js`, `lib/goals.js`, and `lib/goto.js` - PASS. Notes: planner is reusable in concept; executor expects Mineflayer-shaped bot state and Java `prismarine-physics`.

## Architecture Notes

- Upstream entrypoint requires `bot.registry.blocksByName.water/ladder/vine`, constructs `new Movements(bot)`, `new Physics(bot)`, registers `bot.on('physicsTick', monitorMovement)`, and drives movement via `bot.look`, `bot.lookAt`, `bot.setControlState`, and `bot.clearControlStates`.
- For movement-only use, set `movements.canDig = false`, `movements.allow1by1towers = false`, avoid `toPlace` paths, avoid `GoalPlaceBlock` / `GoalBreakBlock`, and probably disable or replace upstream executor sections for digging and placing.
- `Movements` still asks for `bot.inventory.items()` for scaffolding counts and harvest-tool costs. With no placing/digging, this can be stubbed to `[]` or removed from a movement-only fork.
- Entity state is optional for static block navigation if `movements.allowEntityDetection = false`. If left enabled, upstream iterates `Object.values(bot.entities)` and expects each entity to have `position`, `width`, `height`, and `name`; `GoalFollow` and free-motion entity goals also require a live entity position.
- Upstream `Physics` depends on Java `prismarine-physics` and `bot.physics.simulatePlayer`. For Bedrock this should be replaced with this repo's Bedrock movement predictor or a simpler path execution heuristic, because the current runtime is `player_auth_input` with server corrections.
- This repo already has many needed surfaces: `BotState` is an event emitter; `botState.registry`, `botState.self`, `botState.entities`/`players`, `botState.inventory`, `botState.world.sync.getBlock`, `setControlState`, `clearControlStates`, `look`, and `lookAt`. Gaps include Mineflayer alias shape (`bot.entity`, `bot.blockAt`, object-form `bot.entities`), `physicsTick` emission, `blockUpdate` / `chunkColumnLoad` event aliases, and a Bedrock-native replacement for upstream `lib/physics.js`.

## Handoff

The next agent can implement a small movement-only adapter or forked plugin layer using the notes above. Start by creating a Mineflayer-shape facade around `BotState`, then replace upstream `lib/physics.js` decisions with Bedrock predictor checks.

## Resume Notes

- Next step: implement a prototype pathfinder facade with `bot.entity`, `bot.blockAt`, object-form `bot.entities`, `physicsTick` emission, movement-only `Movements` defaults, and Bedrock-native straight-line/jump checks.
- Do not repeat: initial dirty-worktree, reference clone, and source review.
- Raw logs: none.

## Final Summary

- Result: `mineflayer-pathfinder` is plausible as a planner/reference for movement-only navigation, but not as a clean drop-in. It needs a Mineflayer-shaped facade plus a Bedrock-native replacement for Java physics simulation.
- Files changed: `docs/tasks/TASK-22-mineflayer-pathfinder-adapter-review.md`.
- Verification: source inspection only; no static tests run because no production code changed.
- Follow-up tasks: prototype movement-only adapter, then add static planner tests and a live superflat `GoalBlock` walking test.

## Failure Summary

Pending.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run, or explicitly deferred.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
