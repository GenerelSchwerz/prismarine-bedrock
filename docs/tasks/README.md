# Task Logs

This directory holds durable AI task logs. Use these logs for work that needs investigation history, packet evidence, multi-agent coordination, or handoff context.

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
- Command summaries with exact command lines and pass/fail results.
- Packet shape conclusions and short decoded snippets.
- Links to source files, docs, protocol schemas, Gophertunnel files, and Geyser classes.

Do not commit:

- Full debug logs.
- Raw packet dumps.
- Server worlds, lock files, or generated artifacts.

Put raw investigation output in the gitignored `logs/` directory and summarize the evidence in the task log.

## Evidence Sources

When a task depends on external or generated data, name where the data came from:

- `minecraft-data`: installed Bedrock schema used by `bedrock-protocol`.
- `temp-gophertunnel-inspect/`: local Gophertunnel protocol reference for packet/action/status semantics.
- `temp-geyser-inspect/`: local Geyser translator reference for proxy behavior.
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
