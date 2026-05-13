# Test Rules

## Teleporting

When creating new tests that teleport a player or bot, ensure there is a block beneath the destination position before teleporting there. This prevents tests from depending on falling, void behavior, or timing-sensitive ground placement after the teleport.

## Test Timing

When running tests back to back, wait 3-5 seconds before starting the next run. The Bedrock server can keep the previous player connection alive for about 10-15 seconds after disconnect, so immediate reruns can interfere with each other.

## Static And Live Tests

Put tests that do not connect to the shared Bedrock server under `test/static/`. Run them with `pnpm run test:static`. This is also the default `pnpm test` suite.

Put tests that create a `BotState` and connect to the Bedrock server under `test/live/`. Run them with `pnpm run test:live`. Live tests acquire a scoped `.test-lock.<scope>.json` at the repository root through `.mocharc.live.json`.

The default lock scope is `E2E_SERVER_TARGET`, then `PORT`, then `default`. This allows different e2e server instances, such as `java-1` and `endstone-1`, to run at the same time while still preventing concurrent tests against the same server instance. If a scoped lock exists, assume another agent is running live tests against that target. Wait for that run to finish. Only delete the lock after confirming no test process is active; stale same-host locks from dead processes are removed automatically on the next live Mocha startup.

Set `TEST_LOCK_DISABLE=1` only for tests that do not touch the shared Bedrock server.
