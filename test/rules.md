# Test Rules

## Teleporting

When creating new tests that teleport a player or bot, ensure there is a block beneath the destination position before teleporting there. This prevents tests from depending on falling, void behavior, or timing-sensitive ground placement after the teleport.

## Test Timing

When running tests back to back, wait 3-5 seconds before starting the next run. The Bedrock server can keep the previous player connection alive for about 10-15 seconds after disconnect, so immediate reruns can interfere with each other.

## Static And Live Tests

Use `pnpm run test:static` for tests that do not connect to the shared Bedrock server. This is also the default `pnpm test` suite.

Use `pnpm run test:live` for tests that create a `BotState` and connect to the Bedrock server. Live tests acquire `.test-lock.json` at the repository root through `.mocharc.live.json`.

If the lock exists, assume another agent is running live tests. Wait for that run to finish. Only delete the lock after confirming no test process is active; stale same-host locks from dead processes are removed automatically on the next live Mocha startup.

Set `TEST_LOCK_DISABLE=1` only for tests that do not touch the shared Bedrock server.
