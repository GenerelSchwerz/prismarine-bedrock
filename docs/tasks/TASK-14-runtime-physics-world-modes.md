# TASK 14 - Runtime Physics World Modes

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-14
- **Scope:** Add explicit physics/no-physics runtime modes, optional world decoding, bot-owned world state, and active-dimension world reset behavior.
- **Owned files:** `src/state.js`, `src/plugin-loader.js`, `src/index.js`, `src/builtins/setup.js`, `src/builtins/chunks.js`, `src/builtins/physics/index.js`, builtin header comments, `test/static/runtime-options.test.js`, `README.md`, `docs/tasks/TASK-14-runtime-physics-world-modes.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`

## Goal

Expose runtime configuration that lets a bot run with physics or without physics, optionally skip local world decoding, and use a caller-provided world instance so multiple bots can eventually share one world object.

## Non-Goals

Do not change packet schemas, recorded-test scenarios, inventory/crafting/trading behavior, or implement multi-bot world synchronization semantics.

## Current Plan

- `[x]` Read existing state/setup/chunks/physics code and physics notes.
- `[x]` Normalize runtime options in `BotState`, including the physics/world decoding invariant.
- `[x]` Gate builtin loading and setup chunk requests based on the normalized options.
- `[x]` Add focused static tests for option normalization, bot-owned world reset, and builtin gating.
- `[x]` Run syntax checks and static tests.

## Current State

- Worktree state: Existing user/peer changes are present in `AGENTS.md`, `test/recorded-bds/README.md`, and untracked recorded scenario JSON files. They are unrelated and will not be touched.
- Already implemented: Runtime options now use boolean `worldDecodeEnabled` and `physicsEnabled`, skip world/physics builtins when disabled, and reject `physicsEnabled: true` with `worldDecodeEnabled: false`. Plugin loading lives in `src/plugin-loader.js`; `BotState.start()` calls `pluginLoader.injectAll(this)`.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None for owned files.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/state.js` | changed | Normalizes runtime booleans; owns a single active Prismarine world; exposes `resetWorld()` and `setDimension(..., { resetWorld })`; delegates plugin loading to `src/plugin-loader.js`. |
| `src/plugin-loader.js` | changed | Owns builtin and plugin loading state/functions outside `BotState` using a WeakMap. |
| `src/index.js` | changed | Exports `pluginLoader` with the package API. |
| `src/builtins/setup.js` | changed | Skips `request_chunk_radius` on spawn when world decoding is disabled. |
| `src/builtins/chunks.js` | changed | Returns immediately when directly injected with world decoding disabled; exposes `getBlock`; drops decoded world/chunk/cache/readiness state on dimension change. |
| `src/builtins/physics/index.js` | changed | Returns when physics is disabled and rejects direct injection when world decoding is disabled. |
| `src/builtins/*.js` header comments | changed | Updated stale `BotState._loadBuiltins()` comments to name `plugin-loader`. |
| `test/static/runtime-options.test.js` | changed | Covers defaults, disabled physics, decode-disabled behavior, invalid physics/decode combination, bot-owned world reset, setup chunk-radius gating, and external plugin loader state. |
| `test/static/chunks-readiness.test.js` | changed | Covers clearing active world decode state on dimension change. |
| `README.md` | changed | Documents `physicsEnabled`, `worldDecodeEnabled`, and exported `pluginLoader`. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-14` - `node -c src\state.js; node -c src\builtins\setup.js; node -c src\builtins\chunks.js; node -c src\builtins\physics\index.js; node -c test\static\runtime-options.test.js` - PASS. Notes: syntax checks passed.
- `2026-05-14` - `npx mocha test\static\runtime-options.test.js` - PASS. Notes: 6 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 60 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-14` - Packet round-trip and live tests - NOT RUN. Notes: no packet shapes changed; static tests cover option behavior and builtin gating.
- `2026-05-14` - `node -c src\state.js; node -c src\plugin-loader.js; node -c src\index.js; node -c src\builtins\setup.js; node -c src\builtins\chunks.js; node -c src\builtins\physics\index.js; node -c test\static\runtime-options.test.js` - PASS. Notes: syntax checks passed after boolean rename and loader extraction.
- `2026-05-14` - `npx mocha test\static\runtime-options.test.js` - PASS. Notes: 7 passing; covers `physicsEnabled`, `worldDecodeEnabled`, bot-owned world reset, and external plugin loader state.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 61 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-14` - `node -c src\state.js; node -c src\builtins\chunks.js; node -c src\builtins\setup.js; node -c test\static\chunks-readiness.test.js; node -c test\static\runtime-options.test.js; node -c examples\block-access.js` - PASS. Notes: syntax checks after removing shared/external world support and renaming remaining block lookup.
- `2026-05-14` - `npx mocha test\static\runtime-options.test.js test\static\chunks-readiness.test.js` - PASS. Notes: 18 passing; covers active-world reset on dimension change.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 62 passing; Node emitted the existing `punycode` deprecation warning.

## Architecture Notes

- `worldDecodeEnabled: false` must be incompatible with `physicsEnabled: true` because the Bedrock physics engine needs synchronous block lookups from `botState.world`.
- The decoded world is bot-owned and active-dimension-only. On dimension change, the bot drops decoded chunks, readiness state, pending decode requests, blob cache, and publisher state instead of retaining a per-dimension world map.
- Plugin bookkeeping should not live directly on `BotState`; `src/plugin-loader.js` keeps it in a WeakMap keyed by bot instance.

## Handoff

Task is complete. For follow-up work, inspect `src/state.js` option normalization and `test/static/runtime-options.test.js` first.

## Resume Notes

- Next step: None for this task.
- Do not repeat: Initial AGENTS/physics note/code survey.
- Raw logs: None.

## Final Summary

- Result: Added boolean `physicsEnabled` and `worldDecodeEnabled`, bot-owned active world reset on dimension change, and moved plugin loading into `src/plugin-loader.js`. Physics remains enabled by default when world decoding is enabled; `worldDecodeEnabled: false` defaults physics off and rejects explicit `physicsEnabled: true`.
- Files changed: `src/state.js`, `src/plugin-loader.js`, `src/index.js`, `src/builtins/setup.js`, `src/builtins/chunks.js`, `src/builtins/physics/index.js`, builtin header comments, `test/static/runtime-options.test.js`, `README.md`, `docs/tasks/TASK-14-runtime-physics-world-modes.md`.
- Verification: Syntax checks passed; focused runtime/chunk tests passed with 18 passing; full static test suite passed with 62 passing.
- Follow-up tasks: None required. Future shared-world work should define ownership/synchronization semantics for multiple bots writing to the same world.

## Failure Summary

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
