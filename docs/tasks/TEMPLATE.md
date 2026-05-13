# TASK NN - Short Title

- **Status:** `[ ]` planned
- **Owner:** Agent / YYYY-MM-DD
- **Scope:** One sentence describing the owned goal.
- **Owned files:** `path/to/file.js`, `test/static/example.test.js`
- **Related docs:** `AGENTS.md`, subsystem notes, protocol docs, or prior task logs.

## Goal

Describe the user-visible behavior or engineering result. Include the success condition.

## Non-Goals

List adjacent work that should not be changed during this task.

## Current Plan

- `[ ]` Step 1.
- `[ ]` Step 2.
- `[ ]` Verification.

## Parallel Subtasks

Use this section when multiple agents are working independently.

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Packet schema check | Agent / date | `docs/tasks/TASK-NN-short-title.md` | Schema notes and round-trip result | `[ ]` |

## Evidence Log

Record exact commands, target server, date, and result. Keep raw output in `logs/` if it is large.

- `YYYY-MM-DD` - `pnpm run test:static` - PASS/FAIL. Notes:
- `YYYY-MM-DD` - `node scripts/roundtrip-packet.js --example item_stack_take` - PASS/FAIL. Notes:

## Architecture Notes

Capture durable implementation decisions, protocol quirks, and constraints discovered during the task.

## Handoff

Write what the next agent should do first, what is already proven, and what is still uncertain.

## Completion Checklist

- `[ ]` Task log updated with final evidence.
- `[ ]` Static tests or focused tests run.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[ ]` Live test run or explicitly deferred with reason.
- `[ ]` Raw debug logs kept out of git.
