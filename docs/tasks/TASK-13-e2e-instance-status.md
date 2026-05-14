# TASK 13 - E2E Instance Status

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-13
- **Scope:** Add an e2e status handler that reports configured instance usage, port availability, and running e2e processes, including standalone/manual instances.
- **Owned files:** `scripts/e2e-server/status.js`, `scripts/e2e-server/orphans.js`, `scripts/e2e-server/help.js`, `scripts/e2e-servers.js`, `test/static/e2e-server-status.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `docs/tasks/TASK-13-e2e-instance-status.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/e2e-server-launch-notes.md`, `docs/tasks/TASK-07-endstone-packet-recorder.md`, `docs/tasks/TASK-10-bedrock-protocol-relay-recorder.md`

## Goal

Expose a focused e2e status command so manual and automated runs can tell which configured instance ports are used/free, whether Bedrock servers answer ping, and which e2e processes are currently running.

## Non-Goals

- Do not stop or reconfigure running servers.
- Do not replace orphan cleanup.
- Do not change bot protocol behavior.

## Current Plan

- `[x]` Add a status module that classifies configured instances and standalone e2e processes.
- `[x]` Wire the CLI and help output.
- `[x]` Add focused static tests for status classification.
- `[x]` Verification.

## Current State

- Worktree state: existing user/peer edits exist in e2e auto-port files, physics, players, docs, and AGENTS; this task will not revert them.
- Already implemented: e2e launch detects an already-used Bedrock UDP port and treats it as an external server for that session.
- Follow-up implemented: Windows launcher command paths with backslashes are normalized before `cleanup-orphans --include-managed` classifies live launchers.
- In progress: none.
- Not started: none.
- Known mismatch between notes and worktree: none.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-13-e2e-instance-status.md` | changed | Task log for this e2e launcher change. |
| `scripts/e2e-server/status.js` | changed | New read-only status handler for configured instance ports, Bedrock ping, recorder request state, and process ownership. |
| `scripts/e2e-server/orphans.js` | changed | Exports existing process scan/classification helpers for status reuse. Follow-up normalizes Windows backslashes in launcher command paths before matching `scripts/e2e-servers.js launch`. |
| `scripts/e2e-servers.js` | changed | Adds `status` command dispatch. |
| `scripts/e2e-server/help.js` | changed | Documents `status`. |
| `test/static/e2e-server-status.test.js` | changed | Adds classifier coverage for configured versus standalone e2e processes and Windows launcher command path matching. |
| `docs/in-dev/e2e-server-launch-notes.md` | changed | Documents read-only status checks before manual/standalone e2e work. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-13` - `node -c scripts/e2e-server/status.js; node -c scripts/e2e-server/orphans.js; node -c scripts/e2e-servers.js` - PASS.
- `2026-05-13` - `pnpm exec mocha test/static/e2e-server-status.test.js test/static/e2e-server-options.test.js` - PASS. Notes: 7 passing; existing `punycode` deprecation warning from dependency.
- `2026-05-13` - `node scripts/e2e-servers.js status --target=endstone --server-ready-timeout-ms=3000` - PASS. Notes: detected running manual Endstone on UDP `19132`, Bedrock ping `1.26.12`, recorder detected from launcher command, and standalone launcher processes listed; existing `punycode` deprecation warning from dependency.
- `2026-05-14` - `node -c scripts/e2e-server/orphans.js` - PASS.
- `2026-05-14` - `pnpm exec mocha test/static/e2e-server-status.test.js test/static/e2e-server-options.test.js` - PASS. Notes: 8 passing; existing `punycode` deprecation warning from dependency.
- `2026-05-14` - `node scripts/e2e-servers.js cleanup-orphans --include-managed --dry-run` - PASS. Notes: no current orphaned e2e server processes found; existing `punycode` deprecation warning from dependency.

## Architecture Notes

- Status must be read-only and safe to run while manual standalone servers are active.
- Recorder state is command-line/env inferred for already-running standalone launchers because cross-platform child process environment inspection is not available from the current scanner.

## Handoff

Task is complete. Use `node scripts/e2e-servers.js status --target=endstone` before starting another manual Endstone recorder session if default ports may already be occupied.

## Resume Notes

- Next step: none.
- Do not repeat: e2e launch notes and recorder task reading.
- Raw logs: none.

## Final Summary

- Result: Added read-only e2e instance status reporting for ports, Bedrock ping, process ownership, packet-recorder detection, and standalone/manual e2e processes.
- Follow-up result: Fixed Windows launcher command matching so `cleanup-orphans --include-managed` can recognize `scripts\e2e-servers.js launch` command lines as managed launchers.
- Files changed: `scripts/e2e-server/status.js`, `scripts/e2e-server/orphans.js`, `scripts/e2e-servers.js`, `scripts/e2e-server/help.js`, `test/static/e2e-server-status.test.js`, `docs/in-dev/e2e-server-launch-notes.md`, `docs/tasks/TASK-13-e2e-instance-status.md`.
- Verification: syntax checks, focused static tests, and live local status command passed.
- Follow-up tasks: none.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable. No packet shapes changed.
- `[x]` Live test run or explicitly deferred with reason. Read-only status command was run against the current local Endstone e2e state; no client/server mutation was needed.
- `[x]` Raw debug logs kept out of git.
