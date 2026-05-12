# Test Rules

## Teleporting

When creating new tests that teleport a player or bot, ensure there is a block beneath the destination position before teleporting there. This prevents tests from depending on falling, void behavior, or timing-sensitive ground placement after the teleport.

## Test Timing

When running tests back to back, wait 3-5 seconds before starting the next run. The Bedrock server can keep the previous player connection alive for about 10-15 seconds after disconnect, so immediate reruns can interfere with each other.
