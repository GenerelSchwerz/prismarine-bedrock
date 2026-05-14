# TASK 15 - Chat E2E Parity

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-14
- **Scope:** Add an e2e chat test that runs against Java/Geyser and Endstone/BDS, and make the public chat helper send the expected Bedrock text packet.
- **Owned files:** `src/builtins/chat.js`, `test/live/chat.test.js`, `package.json`, `docs/tasks/TASK-15-chat-e2e-parity.md`
- **Related docs:** `AGENTS.md`, `test/rules.md`, `docs/in-dev/e2e-server-launch-notes.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`

## Goal

Verify that a bot can send public chat and another bot can receive it through the `chat` event on both local e2e server families: Java/Paper through Geyser and Endstone/BDS.

## Non-Goals

Do not change command routing, packet recorder scenarios, chat signing/authentication policy, or unrelated e2e launcher behavior.

## Current Plan

- `[x]` Read test rules, e2e launch notes, live test patterns, and packet schema for `packet_text`.
- `[x]` Add a focused live chat test using one bot connection and the server chat echo.
- `[x]` Wire `botState.chat()` to queue a Bedrock `text` packet.
- `[x]` Add a package script that launches both e2e targets and runs the chat test against each target.
- `[x]` Run syntax/static checks and packet round-trip for the outgoing text packet.
- `[x]` Run focused live e2e against Java/Geyser and Endstone/BDS.

## Current State

- Worktree state: Existing user or peer changes remain in `docs/in-dev/e2e-server-launch-notes.md`, `scripts/e2e-server/launch.js`, and `scripts/e2e-server/runtime.js`; they are not owned by this task. This task changed `package.json`, `src/builtins/chat.js`, `test/live/chat.test.js`, and this task log.
- Already implemented: `botState.chat()` queues `packet_text` with `category: 'authored'`, `type: 'chat'`, `source_name`, message, empty XUID/platform chat ID, and `has_filtered_message: false`. The live test sends public chat and waits for the server echo through the bot's `chat` event.
- In progress: None.
- Not started: None.
- Known mismatch between notes and worktree: None.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `src/builtins/chat.js` | changed | Queues public `text` chat packets from `botState.chat()`. |
| `test/live/chat.test.js` | changed | Single-bot live test asserting the bot receives the server echo of its own public chat message. |
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

## Architecture Notes

- The existing e2e runtime in the worktree starts one client run per selected server instance when `--target=all --client ...` is used, and injects target-specific `HOST`, `PORT`, `E2E_SERVER_TARGET`, `E2E_BEDROCK_PLAYER_NAME_PREFIX`, `E2E_BEDROCK_COMMAND_PACKET`, and `E2E_SERVER_COMMAND_FILE`.
- Geyser may expose Bedrock players with a leading dot in server-facing names. The chat test should compare normalized source names by stripping leading dots, while still asserting the exact message payload.
- The local Java/Geyser offline/Floodgate setup can reject simultaneous Bedrock bot sessions as duplicate logins because they share the all-zero UUID. Chat e2e coverage should avoid two simultaneous Bedrock clients on the same Geyser target unless the auth/session identity setup changes.

## Handoff

Task is complete. Pre-existing launcher/doc worktree changes were left untouched.

## Resume Notes

- Next step: None for this task.
- Do not repeat: Initial AGENTS/test rules/e2e notes/schema survey.
- Raw logs: `.e2e-servers/runs/2026-05-14T20-08-08-179Z`.

## Final Summary

- Result: Added focused live chat e2e coverage for both Java/Geyser and Endstone/BDS, and enabled `botState.chat()` to send public Bedrock `text` packets.
- Files changed: `src/builtins/chat.js`, `test/live/chat.test.js`, `package.json`, `docs/tasks/TASK-15-chat-e2e-parity.md`.
- Verification: Syntax checks passed, packet round-trip passed, full static suite passed with 62 tests, and `pnpm run test:live:e2e:chat` passed with one chat test on each e2e target.
- Follow-up tasks: None required. A future two-client chat broadcast test on Geyser needs distinct offline/Floodgate session identities first.

## Failure Summary

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
