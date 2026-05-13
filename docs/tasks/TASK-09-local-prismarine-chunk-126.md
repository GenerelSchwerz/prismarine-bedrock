# TASK 09 - Forked Prismarine Chunk 1.26 Compatibility

- **Status:** `[/] active`
- **Owner:** Codex / 2026-05-13
- **Scope:** Fork `prismarine-chunk`, point `package.json` at a local ignored fork checkout, and add focused Bedrock 1.26 compatibility.
- **Owned files:** `.gitignore`, `package.json`, local ignored `pnpm-lock.yaml`, ignored root checkout `prismarine-chunk-fork/`, external fork branch `GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`
- **Related docs:** `AGENTS.md`, `docs/in-dev/bedrock-first-physics-implementation-notes.md`

## Goal

Allow this repo to instantiate the bot with Bedrock `1.26.x` versions by using a GitHub forked `prismarine-chunk` dependency without a git submodule.

## Non-Goals

- Do not convert the dependency to a git submodule or vendored nested repo.
- Do not change packet ordering or item stack request behavior.
- Do not upgrade Endstone/BDS in this task.
- Do not modify existing Endstone recorder scenario work from TASK-08.

## Current Plan

- `[x]` Create task log and define ownership.
- `[x]` Fork `PrismarineJS/prismarine-chunk` with `gh`.
- `[x]` Patch Bedrock 1.26 dispatch to reuse the modern Bedrock chunk implementation.
- `[x]` Point `package.json` dependency to the fork branch and refresh local ignored lockfile.
- `[x]` Run focused compatibility checks.
- `[/] Move local fork checkout to root-level ignored `prismarine-chunk-fork/`.
- `[ ] Rebase local fork branch onto current upstream.
- `[ ] Point `prismarine-chunk` dependency to the local checkout.
- `[ ] Add isolated Bedrock 1.26 chunk/subchunk files without changing the 1.18 implementation.
- `[ ] Run focused static and live chunk decode checks.

## Current State

- Worktree state: existing unrelated changes in Endstone/e2e recorder files and untracked TASK-08/test recorder files; left untouched. This task changes `package.json` and this task log. `pnpm-lock.yaml` is gitignored but was updated locally by pnpm.
- Already implemented: dependency review found `prismarine-chunk@1.40.0` fails for `bedrock_1.26.x` because its Bedrock dispatch table stops at major `1.21`.
- In progress: follow-up requested to use a root-level ignored local fork checkout and isolate 1.26 chunk behavior in new files.
- Not started: rebased local checkout, local dependency link, isolated 1.26 files.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `package.json` | changed | Points `prismarine-chunk` to `github:GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat`. |
| `pnpm-lock.yaml` | ignored-local-change | pnpm resolved fork commit `3bf1bc4403b18c3c9e56d6dd9b53a5572663f7d1`; file is gitignored by this repo. |
| `scripts/tmp/prismarine-chunk-fork/` | ignored-temp | Temporary clone used to create and push the fork branch; not a submodule and not a dependency path. |
| `GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat` | external-changed | Branch based on upstream `1.40.0`, commit `3bf1bc4`, maps Bedrock `1.26`, `1.26.10`, and `26.10` major keys to the existing Bedrock `1.18` chunk implementation. |
| `docs/tasks/TASK-09-local-prismarine-chunk-126.md` | changed | Task log for forked dependency work. |
| `.gitignore` | planned | Ignore root-level local `prismarine-chunk-fork/` checkout. |
| `prismarine-chunk-fork/` | planned-ignored | Move from `scripts/tmp/prismarine-chunk-fork/` to repo root; keep as local dependency checkout. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-13` - Prior review command - FAIL for `BotState` with `1.26.0`, `1.26.10`, and `1.26.20`. Notes: failure occurred at `prismarine-chunk` dispatch, before network connection.
- `2026-05-13` - `gh repo fork PrismarineJS/prismarine-chunk --remote=false` - PASS. Notes: fork already existed as `GenerelSchwerz/prismarine-chunk`.
- `2026-05-13` - `gh repo clone GenerelSchwerz/prismarine-chunk scripts/tmp/prismarine-chunk-fork` then `git checkout -B bedrock-1.26-compat upstream/master` - PASS. Notes: fork master was stale at `1.29.0`; branch was based on upstream `1.40.0`.
- `2026-05-13` - Fork commit `3bf1bc4 Add Bedrock 1.26 chunk dispatch` pushed to `origin/bedrock-1.26-compat` - PASS.
- `2026-05-13` - `pnpm install --lockfile-only`; `pnpm install`; `pnpm update prismarine-chunk` - PASS. Notes: local ignored lockfile resolved fork commit `3bf1bc4403b18c3c9e56d6dd9b53a5572663f7d1`; pnpm also installed `mineflayer-crafting-util@0.5.0` from existing `package.json`, with an unmet peer warning for `typescript@^5.0.0` because `4.9.5` is present transitively.
- `2026-05-13` - Node `BotState` construction probe for `1.21.130`, `1.26.0`, `1.26.10`, and `1.26.20` - PASS. Notes: `1.26.10` uses `minecraft-data` majorVersion `26.10`, so the fork maps both `1.26.10` and `26.10`.
- `2026-05-13` - Node `prismarine-registry` + `prismarine-chunk` construction probe for `bedrock_1.26.0`, `bedrock_1.26.10`, and `bedrock_1.26.20` - PASS. Notes: chunk instances expose `minCY=-4`, `worldHeight=384`, and `networkDecodeNoCache`.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: 40 passing.

## Architecture Notes

- The only tracked dependency pointer is `package.json`; no git submodule or vendored dependency directory was added.
- `minecraft-data` reports `bedrock_1.26.10` with `majorVersion: "26.10"` even though `bedrock-protocol` validates the version string as `1.26.10`.
- Initial compatibility maps Bedrock `1.26`, `1.26.10`, and `26.10` major versions to the existing Bedrock `1.18` chunk implementation. Construction and static tests pass; real `1.26.x` chunk decode still needs live server evidence.

## Handoff

Next task should run a real `1.26.x` Bedrock/Geyser or Endstone/BDS connect/chunk-load smoke and inspect chunk decode behavior under packet traffic.

## Resume Notes

- Next step: run a live `MC_VERSION=1.26.20` connect/chunk-load smoke against a matching server target.
- Do not repeat: dependency review showing `minecraft-data` and `bedrock-protocol` can load `1.26.x` serializers; fork creation and construction probes.
- Raw logs: none.

## Final Summary

- Result: Forked `PrismarineJS/prismarine-chunk`, added Bedrock `1.26` dispatch compatibility on branch `GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat`, and pointed this repo's `package.json` at that branch.
- Files changed: `package.json`, local ignored `pnpm-lock.yaml`, external fork branch commit `3bf1bc4`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`.
- Verification: `BotState` construction passes for `1.21.130`, `1.26.0`, `1.26.10`, and `1.26.20`; direct chunk construction passes for `bedrock_1.26.0`, `bedrock_1.26.10`, and `bedrock_1.26.20`; `pnpm run test:static` passed with 40 tests.
- Follow-up tasks: live `1.26.x` server smoke for chunk decode and world access; decide whether to upstream a broader PrismarineJS PR after live evidence.

## Failure Summary

Not blocked.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. No packet shapes changed.
- `[x]` Live test run or explicitly deferred with reason. Deferred because no matching `1.26.x` server target was launched in this task.
- `[x]` Raw debug logs kept out of git.
