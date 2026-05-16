# TASK 18 - Recorded BDS Recreation Gym

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-15
- **Scope:** Add tooling and docs for human-recorded scenario to bot recreation loops.
- **Owned files:** `scripts/recorded-bds-gym.js`, `scripts/compare-packet-dbs.js`, `test/recorded-bds/bots/helpers.js`, `test/static/recorded-bds-gym.test.js`, `test/static/compare-packet-dbs.test.js`, `test/recorded-bds/README.md`, `docs/tasks/TASK-18-recorded-bds-gym.md`
- **Related docs:** `AGENTS.md`, `test/recorded-bds/README.md`, `docs/tasks/TASK-17-compact-packet-logging.md`

## Goal

Provide a documented and test-covered workflow where a human-completed recorded-BDS scenario can be reused as packet evidence, a scenario-local bot recreation can be iterated against the same scenario, and human-vs-bot SQLite packet sidecars can be compared before any behavior is promoted into the core library.

## Non-Goals

Do not implement a specific scenario bot behavior, edit core runtime APIs for packet parity, or run a live human/client scenario as part of the initial tooling implementation.

## Current Plan

- `[x]` Add gym orchestration CLI.
- `[x]` Add packet DB comparison CLI.
- `[x]` Add scenario bot helper scaffold.
- `[x]` Document the workflow.
- `[x]` Add static tests and run verification.

## Current State

Keep this section current while the task is active. A restarted agent should read this before editing.

- Worktree state: Existing TASK-17 packet-index changes are present and should be preserved. This task adds gym/comparison tooling on top of that work.
- Already implemented: `scripts/recorded-bds-gym.js`, `scripts/compare-packet-dbs.js`, scenario bot helpers, static tests, and README workflow docs have been added.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

Record file-by-file intent. Include files inspected but intentionally not changed when that prevents duplicate work.

| File | State | Notes |
| --- | --- | --- |
| `scripts/recorded-bds-gym.js` | added | Orchestrates status, human capture, bot scaffold/run, compare, loop, and promotion readiness. |
| `scripts/compare-packet-dbs.js` | added | Compares human and bot SQLite sidecars by scenario step, with default packet focus and ignored jitter fields. |
| `test/recorded-bds/bots/helpers.js` | added | Shared helpers for isolated scenario bot scripts, including connect/disconnect and manual packet queue helper. |
| `test/static/recorded-bds-gym.test.js` | added | Static coverage for scenario resolution, completion marker detection, latest run selection, launch command shape, and promotion readiness. |
| `test/static/compare-packet-dbs.test.js` | added | Static coverage for matching traces, missing/extra packets, nested mismatches, ignored jitter, and repeated step bounds. |
| `test/recorded-bds/README.md` | changed | Documents Human Workflow -> Agentic Recreation. |

## Parallel Subtasks

Use this section when multiple agents are working independently.

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Packet schema check | Agent / date | `docs/tasks/TASK-NN-short-title.md` | Schema notes and round-trip result | `[ ]` |

## Evidence Log

Record exact commands, target server, date, and result. Keep raw output in `logs/` if it is large.

- `2026-05-15` - `node -c scripts/recorded-bds-gym.js` - PASS.
- `2026-05-15` - `node -c scripts/compare-packet-dbs.js` - PASS.
- `2026-05-15` - `node -c test/recorded-bds/bots/helpers.js` - PASS.
- `2026-05-15` - `npx mocha test/static/recorded-bds-gym.test.js test/static/compare-packet-dbs.test.js` - PASS. Notes: 10 passing.
- `2026-05-15` - `node scripts/recorded-bds-gym.js status --scenario=craft-planks-and-place` - PASS. Notes: reported scenario exists, no bot script/human/bot/compare runs yet.
- `2026-05-15` - `node scripts/recorded-bds-gym.js record-human --scenario=craft-planks-and-place --dry-run --run-id=static-dry-run` - PASS. Notes: printed e2e launch command without starting server.
- `2026-05-15` - `node scripts/recorded-bds-gym.js run-bot --scenario=craft-planks-and-place --dry-run --run-id=static-dry-run` - EXPECTED FAIL. Notes: no scenario bot script exists yet; command correctly blocks and instructs to run scaffold-bot first.
- `2026-05-15` - `pnpm run test:static` - PASS. Notes: 82 passing; existing Node `punycode` deprecation warning.

## Architecture Notes

- Scenario-local bot scripts are the safe exploration layer. Core library edits should happen only after an isolated bot recreation succeeds and comparison output justifies promotion.
- `record-human` and `run-bot` are intentionally live commands; static tests exercise helper behavior and dry-run/status paths only.
- Comparison currently aligns packets by direction plus packet name in order. It is sufficient for initial trace-gap reports; future improvements can add stronger semantic alignment for repeated same-name packet bursts.

## Handoff

Task complete. Use `scripts/recorded-bds-gym.js` as the scenario workflow entrypoint and `scripts/compare-packet-dbs.js` for explicit DB comparison.

## Resume Notes

Write the exact next step for a restarted agent. Include the next command to run or file/line area to inspect.

- Next step: None for this task.
- Do not repeat: Initial scenario/packet-index tooling inspection.
- Raw logs: None.

## Final Summary

- Result: Added the recorded-BDS gym workflow for human evidence capture, isolated bot recreation, step-bounded packet comparison, and promotion readiness checks.
- Files changed: `scripts/recorded-bds-gym.js`, `scripts/compare-packet-dbs.js`, `test/recorded-bds/bots/helpers.js`, `test/static/recorded-bds-gym.test.js`, `test/static/compare-packet-dbs.test.js`, `test/recorded-bds/README.md`, `docs/tasks/TASK-18-recorded-bds-gym.md`.
- Verification: Syntax checks passed, focused static tests passed with 10 tests, dry-run/status smoke checks passed, and `pnpm run test:static` passed with 82 tests.
- Follow-up tasks: Use the gym on a real scenario to refine comparison alignment for high-volume repeated packet bursts if needed.

## Failure Summary

Fill this when marking the task blocked or abandoned.

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
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[ ]` Live test run or explicitly deferred with reason.
- `[ ]` Raw debug logs kept out of git.
