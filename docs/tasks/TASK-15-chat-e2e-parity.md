# TASK 15 - Chat E2E Parity

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-14
- **Scope:** Add an e2e chat test with target pinning for known Geyser limitations, and make the public chat helper send the expected Bedrock text packet.
- **Owned files:** `src/builtins/chat.js`, `test/live/chat.test.js`, `test/helpers/e2e-targets.js`, `test/static/e2e-targets.test.js`, `test/rules.md`, `package.json`, `docs/tasks/TASK-15-chat-e2e-parity.md`
- **Related docs:** `AGENTS.md`, `test/rules.md`, `docs/in-dev/e2e-server-launch-notes.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`

## Goal

Verify that a bot can send public chat and another bot can receive it through the `chat` event on Endstone/BDS. Keep the test out of Java/Geyser until the known Geyser chat/session bug is fixed, and provide a reusable way to pin live tests to a target family.

## Non-Goals

Do not change command routing, packet recorder scenarios, chat signing/authentication policy, or unrelated e2e launcher behavior.

## Current Plan

- `[x]` Read test rules, e2e launch notes, live test patterns, and packet schema for `packet_text`.
- `[x]` Add a focused live chat test using one bot connection and the server chat echo.
- `[x]` Wire `botState.chat()` to queue a Bedrock `text` packet.
- `[x]` Add a package script that launches both e2e targets and runs the chat test against each target.
- `[x]` Run syntax/static checks and packet round-trip for the outgoing text packet.
- `[x]` Run focused live e2e against Java/Geyser and Endstone/BDS.
- `[x]` Add reusable live test target pinning helper.
- `[x]` Pin chat e2e to Endstone/BDS.
- `[x]` Restore the two-bot chat assertion for Endstone/BDS.
- `[x]` Run syntax/static checks and focused Endstone e2e chat verification.

## Current State

- Worktree state: Clean at resume start. New changes are in `test/live/chat.test.js`, `test/helpers/e2e-targets.js`, `test/static/e2e-targets.test.js`, `test/rules.md`, and this task log.
- Already implemented: `botState.chat()` queues `packet_text` with `category: 'authored'`, `type: 'chat'`, `source_name`, message, empty XUID/platform chat ID, and `has_filtered_message: false`. `skipUnlessE2ETarget()` maps launcher target names to `endstone` or `geyser`.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/chat.js` | changed | Queues public `text` chat packets from `botState.chat()`. |
| `test/live/chat.test.js` | changed | Endstone-pinned two-bot live test asserting the receiver observes the sender's public chat message. |
| `test/helpers/e2e-targets.js` | changed | Adds reusable target-family detection and skip helper for target-pinned live tests. |
| `test/static/e2e-targets.test.js` | changed | Covers launcher target name mapping. |
| `test/rules.md` | changed | Documents target-pinned live test helper usage. |
| `package.json` | changed | Adds `test:live:e2e:chat` to launch Java/Geyser and Endstone/BDS and run `test/live/chat.test.js` against each. |
| `docs/tasks/TASK-15-chat-e2e-parity.md` | changed | Tracks plan, evidence, and handoff. |
| `docs/in-dev/e2e-server-launch-notes.md` | owned-by-peer | Existing modification inspected; not edited by this task. |
| `scripts/e2e-server/launch.js` | owned-by-peer | Existing modification inspected; not edited by this task. |
| `scripts/e2e-server/runtime.js` | owned-by-peer | Existing modification inspected; not edited by this task. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-14` - `git status --short` - PASS. Notes: identified pre-existing modified e2e launcher files.
- `2026-05-14` - `rg -n "packet_text|has_filtered_message|filtered_message" node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml ...` - PASS. Notes: verified installed `minecraft-data` packet shape for `text`.
- `2026-05-14` - `node -c src/builtins/chat.js` - PASS.
- `2026-05-14` - `node -c test/live/chat.test.js` - PASS.
- `2026-05-14` - `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"` - PASS.
- `2026-05-14` - `node scripts/roundtrip-packet.js scripts/tmp/chat-text-packet.json` - PASS. Notes: temporary local packet JSON used `name: "text"` with the outgoing chat shape and round-tripped on `1.26.10`; temp file was deleted after the run.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 62 passing; existing Node `punycode` deprecation warning.
- `2026-05-14` - `pnpm run test:live:e2e:chat` - FAIL. Notes: original two-bot test could not run on Java/Geyser because local offline/Floodgate sessions share the all-zero UUID and Geyser rejected the second Bedrock client as already logged in. Endstone client timed out during that aborted parallel run.
- `2026-05-14` - `pnpm run test:live:e2e:chat` - PASS. Notes: after changing the test to assert the one-bot server echo, Java/Geyser and Endstone/BDS each ran `test/live/chat.test.js` with 1 passing test. Server session logs: `.e2e-servers/runs/2026-05-14T20-08-08-179Z`.
- `2026-05-14` - `node scripts/e2e-servers.js status` - PASS. Notes: no configured e2e server processes left running after the passing run.
- `2026-05-14` - `node -c test/helpers/e2e-targets.js; node -c test/live/chat.test.js; node -c test/static/e2e-targets.test.js` - PASS.
- `2026-05-14` - `pnpm run test:static` - PASS. Notes: 63 passing; existing Node `punycode` deprecation warning.
- `2026-05-14` - `pnpm run test:live:e2e:chat` - PASS. Notes: Java/Geyser client run skipped the Endstone-pinned chat test with 1 pending; Endstone/BDS ran the two-bot chat broadcast test with 1 passing. Server session logs: `.e2e-servers/runs/2026-05-14T20-12-11-522Z`.
- `2026-05-14` - `node scripts/e2e-servers.js status` - PASS. Notes: no configured e2e server processes left running after the target-pinned passing run.

## Architecture Notes

- The existing e2e runtime in the worktree starts one client run per selected server instance when `--target=all --client ...` is used, and injects target-specific `HOST`, `PORT`, `E2E_SERVER_TARGET`, `E2E_BEDROCK_PLAYER_NAME_PREFIX`, `E2E_BEDROCK_COMMAND_PACKET`, and `E2E_SERVER_COMMAND_FILE`.
- Geyser may expose Bedrock players with a leading dot in server-facing names. The chat test should compare normalized source names by stripping leading dots, while still asserting the exact message payload.
- The local Java/Geyser offline/Floodgate setup can reject simultaneous Bedrock bot sessions as duplicate logins because they share the all-zero UUID. Chat e2e coverage should avoid two simultaneous Bedrock clients on the same Geyser target unless the auth/session identity setup changes.
- Target-pinned live tests should use `skipUnlessE2ETarget(this, 'endstone')` or `skipUnlessE2ETarget(this, 'geyser')`. `java-*` launcher targets intentionally map to the `geyser` family.

## Handoff

Task is complete.

## Resume Notes

- Next step: None for this task.
- Do not repeat: Initial AGENTS/test rules/e2e notes/schema survey.
- Raw logs: `.e2e-servers/runs/2026-05-14T20-08-08-179Z`, `.e2e-servers/runs/2026-05-14T20-12-11-522Z`.

## Final Summary

- Result: Added target-pinned live test helpers, documented target-pinned live tests, and changed chat e2e to run only on Endstone/BDS where it now verifies a real two-bot broadcast.
- Files changed: `src/builtins/chat.js`, `test/live/chat.test.js`, `test/helpers/e2e-targets.js`, `test/static/e2e-targets.test.js`, `test/rules.md`, `package.json`, `docs/tasks/TASK-15-chat-e2e-parity.md`.
- Verification: Syntax checks passed, packet round-trip passed, full static suite passed with 63 tests, and `pnpm run test:live:e2e:chat` passed with Java/Geyser pending and Endstone/BDS passing the two-bot test.
- Follow-up tasks: When the known Geyser chat/session bug is fixed, add or unpin a Geyser-specific chat test instead of relying on the Endstone broadcast test.

## Failure Summary

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
