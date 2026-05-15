# TASK 16 - Environment Time Weather

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-14
- **Scope:** Add an environment builtin for time/weather state and live e2e coverage.
- **Owned files:** `src/builtins/environment.js`, `test/static/environment.test.js`, `test/live/environment.test.js`, `package.json`, `docs/tasks/TASK-16-environment-time-weather.md`
- **Related docs:** `AGENTS.md`, `test/rules.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`

## Goal

Track server time and weather in bot state from Bedrock packets, emit stable events, and verify with live e2e commands.

## Non-Goals

Do not add broad scoreboard/title/bossbar state, pathfinding, command routing changes, or recorded BDS scenarios.

## Current Plan

- `[x]` Verify packet sources for time and weather.
- `[x]` Add `src/builtins/environment.js`.
- `[x]` Add static tests for packet handling.
- `[x]` Add live e2e test using server commands for time and weather.
- `[x]` Run syntax/static and focused live e2e verification.

## Current State

- Worktree state: Existing uncommitted target-pinning/chat changes are present from TASK-15. This task added `src/builtins/environment.js`, `test/static/environment.test.js`, `test/live/environment.test.js`, updated `package.json`, and added this task log.
- Already implemented: `src/builtins/environment.js` tracks `set_time`, `start_game` weather levels, and `level_event` weather transitions. Static and live tests have been added.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/environment.js` | changed | New builtin for time/weather state and events. |
| `test/static/environment.test.js` | changed | Packet-level unit coverage for the builtin. |
| `test/live/environment.test.js` | changed | Live e2e command-driven coverage. |
| `package.json` | changed | Adds focused `test:live:e2e:environment` script. |
| `docs/tasks/TASK-16-environment-time-weather.md` | changed | Tracks plan and evidence. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-14` - `rg -n "time|weather|rain|thunder|level_event" ... proto.yml src test` - PASS. Notes: `packet_set_time`, `start_game.rain_level`, `start_game.lightning_level`, and `level_event` weather events are present in installed `minecraft-data`.
- `2026-05-14` - `node -c src/builtins/environment.js; node -c test/static/environment.test.js; node -c test/live/environment.test.js` - PASS.
- `2026-05-14` - `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"` - PASS.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 67 passing; existing Node `punycode` deprecation warning.
- `2026-05-14` - `pnpm run test:live:e2e:environment` - PASS. Notes: Java/Geyser and Endstone/BDS each ran `test/live/environment.test.js` with 2 passing tests. Server session logs: `.e2e-servers/runs/2026-05-14T20-17-49-954Z`.
- `2026-05-14` - `node scripts/e2e-servers.js status` - PASS. Notes: no configured e2e server processes left running after the passing run.

## Architecture Notes

- `set_time` is server-to-client and carries unbounded world time. The builtin should derive `timeOfDay` with modulo 24000.
- Weather state has two sources: initial `start_game` scalar levels and subsequent `level_event` start/stop events.
- Java/Geyser emits gradual weather level changes during transitions; tests assert boolean state rather than exact scalar levels. Endstone/BDS may use `65535` for active rain/thunder intensity.

## Handoff

Task is complete.

## Resume Notes

- Next step: None for this task.
- Do not repeat: Initial schema search for time/weather packet names.
- Raw logs: `.e2e-servers/runs/2026-05-14T20-17-49-954Z`.

## Final Summary

- Result: Added the environment builtin for time and weather state, plus focused static and live e2e coverage.
- Files changed: `src/builtins/environment.js`, `test/static/environment.test.js`, `test/live/environment.test.js`, `package.json`, `docs/tasks/TASK-16-environment-time-weather.md`.
- Verification: Syntax checks passed, package JSON parsed, static suite passed with 67 tests, and `pnpm run test:live:e2e:environment` passed on both Java/Geyser and Endstone/BDS.
- Follow-up tasks: Document the public environment API once the broader API docs are added.

## Failure Summary

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
