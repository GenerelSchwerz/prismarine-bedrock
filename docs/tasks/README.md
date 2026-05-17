# Task Logs

This directory holds durable AI task logs. Use these logs for work that needs investigation history, packet evidence, multi-agent coordination, or handoff context.

Task logs are also the resume mechanism for interrupted agents. A restarted agent must be able to tell what already changed, what was tested, why the task stopped, and what exact step comes next.

## Naming

Use:

```text
TASK-NN-short-title.md
```

Examples:

```text
TASK-01-inventory-stack-identity.md
TASK-06-crafting-item-stack-request.md
```

Keep task numbers stable once referenced. If a feature expands, update the existing task log unless the new work has a distinct goal and ownership boundary.

## What Belongs Here

Commit:

- Plans, decisions, and handoff notes.
- Current state and resume notes for interrupted work.
- File-by-file change ledger entries.
- Completion summaries and failure summaries.
- Command summaries with exact command lines and pass/fail results.
- Packet shape conclusions and short decoded snippets.
- Links to source files, docs, protocol schemas, Gophertunnel files, and Geyser classes.

Do not commit:

- Full debug logs.
- Raw packet dumps.
- Server worlds, lock files, or generated artifacts.

Put raw investigation output in the gitignored `logs/` directory and summarize the evidence in the task log.

## Required Sections

Each active task log should keep these sections current:

- `Current State`: what is true right now, including whether the worktree has partial edits.
- `Change Ledger`: file-by-file notes for changes already made, intentionally skipped, or owned by another agent.
- `Evidence Log`: commands run, target server, date, and result.
- `Resume Notes`: the exact next step for a restarted agent.
- `Final Summary`: filled when the task completes.
- `Failure Summary`: filled when the task is blocked or abandoned.

If a task has no code changes yet, say that explicitly in `Current State` and `Change Ledger`.

## Evidence Sources

When a task depends on external or generated data, name where the data came from:

- `minecraft-data`: installed Bedrock schema used by `bedrock-protocol`.
- `ref/gophertunnel/`: local Gophertunnel protocol reference for packet/action/status semantics.
- `ref/geyser/`: local Geyser translator reference for proxy behavior.
- `ref/boar/`: local Boar anticheat reference for physics behavior.
- Runtime packets: captured from the active server during a test or example run.
- `logs/`: raw debug output kept out of git.

## Status Values

- `[ ] planned`
- `[/] active`
- `[x] complete`
- `[!] blocked`
- `[-] abandoned`

## Parallel Work

When multiple agents work on one task, the parent log must list subtasks with owners, owned files, and expected outputs. Agents should append updates under their own subtask sections and avoid rewriting another agent's notes except for explicit verification or handoff.

## Stop Discipline

Before an agent stops, it should update the task log even if the implementation is incomplete. Minimum stop note:

- Files touched.
- Tests or commands run.
- Last observed failure or uncertainty.
- Exact next action.
- Whether raw logs exist under `logs/`.
