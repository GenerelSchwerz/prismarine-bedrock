# TASK 24 - Mineflayer Compat Wrapper

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-17
- **Scope:** Add a builtin compatibility wrapper that lets upstream `mineflayer-pathfinder` run against this Bedrock bot as the first supported Mineflayer plugin target.
- **Owned files:** `docs/tasks/TASK-24-mineflayer-compat-wrapper.md`, `package.json`, `src/builtins/mineflayer-compat.js`, `src/builtins/physics/index.js`, `src/builtins/physics/movement-packets.js`, `test/static/mineflayer-compat.test.js`, `test/live/pathfinder.test.js`
- **Related docs:** `AGENTS.md`, `docs/tasks/TASK-22-mineflayer-pathfinder-adapter-review.md`, `docs/reference/mineflayer-feature-comparison.md`

## Goal

Provide a Mineflayer-shaped wrapper/facade for plugin injection, prioritizing upstream `mineflayer-pathfinder` compatibility while treating broader Mineflayer plugin support as a secondary best-effort concern.

## Non-Goals

- Do not make this bot a drop-in Mineflayer replacement.
- Do not replace native `BotState` maps or inventory/window models with Mineflayer models.
- Do not implement pathfinder's Bedrock-native physics replacement in this task unless it is required for plugin loading.

## Current Plan

- `[x]` Check current worktree and active pathfinder task notes.
- `[x]` Add upstream `mineflayer-pathfinder` dependency.
- `[x]` Add a builtin compatibility facade with Mineflayer aliases.
- `[x]` Add a plugin injection helper that runs plugins against the facade.
- `[x]` Add static tests for wrapper shape and upstream-pathfinder injection assumptions.
- `[x]` Add a live e2e scenario for upstream pathfinder movement on a flat lane.
- `[/]` Tighten the live scenario so jump/turn completion requires reaching the exact marked target block.
- `[ ]` Fix or explicitly track the remaining pathfinder/physics failure on the strict jump/turn course.
- `[ ]` Run focused and static tests after the strict scenario is stable.

## Current State

- Worktree state: TASK-22 physics tick event changes are already in progress and should be preserved.
- Already implemented: `mineflayer-compat` builtin, upstream pathfinder dependency, focused static tests, and a live pathfinder lane scenario.
- Completed: live Endstone/BDS pathfinder run passes for the original flat lane.
- In progress: broaden the live pathfinder course to include a longer forward walk, a longer right turn, a one-block gap, a jump-up target, plus watch-friendly launch delays.
- Current strict jump/turn/gap result: passing on the extended course. The bot reaches the exact raised diamond target block after a five-block forward leg, five-block right turn, one-block air gap, and one-block upward jump.
- Known mismatch between notes and worktree: none for this task.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-24-mineflayer-compat-wrapper.md` | changed | New task log for Mineflayer compatibility wrapper work. |
| `package.json` | changed | Adds `mineflayer-pathfinder` as a dependency so upstream package injection can be tested and used. |
| `src/builtins/mineflayer-compat.js` | changed | Adds a proxy-based Mineflayer facade, plugin loading helpers, pathfinder registry filtering, inventory/entity/game/block wrappers, and a minimal physics shim. |
| `src/builtins/mineflayer-compat.js` | changed | Adds Mineflayer entity defaults needed by upstream pathfinder physics probes and exposes the Minecraft data version as `bedrock_<version>`. |
| `src/builtins/mineflayer-compat.js` | changed | Exposes a Mineflayer entity facade with feet-position and Mineflayer yaw, converts upstream `bot.look()` yaw into Bedrock yaw, and fixes the simple pathfinder physics shim to use Mineflayer yaw/feet coordinates. |
| `src/builtins/mineflayer-compat.js` | changed | Keeps `bot.look()` compatibility as a yaw conversion only; test-specific snapping is handled by physics rotation speed options. |
| `src/builtins/physics/movement-packets.js` | changed | Adds configurable `yawStepSpeed` and `pitchStepSpeed` for look interpolation. |
| `src/builtins/physics/index.js` | changed | Passes physics options into the movement packet sender. |
| `test/static/mineflayer-compat.test.js` | changed | Verifies facade shape and that upstream `mineflayer-pathfinder` injects through `state.loadPlugin(pathfinder)`. |
| `test/static/mineflayer-compat.test.js` | changed | Asserts the compat facade reports a Bedrock minecraft-data key such as `bedrock_1.26.10`. |
| `test/static/mineflayer-compat.test.js` | changed | Asserts the entity facade does not replace native `self` and exposes feet-position to Mineflayer consumers. |
| `test/live/pathfinder.test.js` | changed | Adds a live scenario that builds a flat lane, loads upstream `mineflayer-pathfinder`, sets movement-only `Movements`, and waits for the bot to walk near a target. |
| `test/live/pathfinder.test.js` | changed | Sets `skipPing: true` for this focused scenario after Endstone/BDS answered launcher readiness but the bot client's pre-connect RakNet ping timed out before initialization. |
| `test/live/pathfinder.test.js` | changed | Adds failure-only path/control/auth-input traces so future movement regressions show whether planning or Bedrock control handoff failed. |
| `test/live/pathfinder.test.js` | changed | Adds `PATHFINDER_START_DELAY_MS` and `PATHFINDER_GOAL_DELAY_MS`; replaces the straight lane with a cleared course containing a one-block jump-up and a right turn. |
| `test/live/pathfinder.test.js` | changed | Uses server-side `fill`/`setblock` commands for the course shape instead of conditional local-world checks, so rapid setup does not skip visible path blocks. |
| `test/live/pathfinder.test.js` | changed | Replaces X/Z-only goal and assertion with 3D feet-position checks, including an explicit start-teleport validation, so falling or walking under the course cannot pass. |
| `test/live/pathfinder.test.js` | changed | Sets high `yawStepSpeed` and `pitchStepSpeed` for the pathfinder scenario instead of adding compat-layer snap behavior. |
| `test/live/pathfinder.test.js` | changed | Marks the target footing block as `minecraft:diamond_block`, uses `GoalBlock`, and asserts the bot's floored feet position is exactly inside the target block. |
| `test/live/pathfinder.test.js` | changed | Reshapes the course to walk forward five blocks, turn right five blocks, then jump across one block of air onto a one-block-higher diamond target; enables pathfinder parkour for this explicit gap-jump scenario. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |

## Evidence Log

- `2026-05-17` - `git status --short` - PASS. Notes: existing TASK-22 changes present; no unrelated files reverted.
- `2026-05-17` - read `TASK-22` and builtin loader/API surfaces - PASS. Notes: facade should avoid replacing native `botState.entities` because core code expects a `Map`.
- `2026-05-17` - `pnpm add mineflayer-pathfinder@^2.4.5` - PASS. Notes: installed upstream pathfinder package; pnpm warned about existing deprecated subdependencies and an existing `mineflayer-crafting-util` peer dependency on TypeScript.
- `2026-05-17` - `node -c src/builtins/mineflayer-compat.js` - PASS. Notes: syntax check for new builtin.
- `2026-05-17` - `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: 2 passing; upstream `mineflayer-pathfinder` injects and exposes `pathfinder` APIs through the facade.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 101 passing; Node emitted the existing `punycode` deprecation warning. Re-run after the live scenario username alignment also passed with 101 passing.
- `2026-05-17` - moved compat registry filtering to state-owned `botState.blockClass` - PASS. Notes: compat layer no longer instantiates `prismarine-block`; focused compat test and full static suite still pass.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check for new live pathfinder e2e scenario.
- `2026-05-17` - `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: 2 passing after adding Mineflayer-radian `look` conversion.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 101 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check after marking the target block and tightening completion to exact feet block.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - FAIL. Notes: strict target-block scenario correctly fails; bot reached feet `3.3742055892944336,67,1.430711030960083` / block `3,67,1`, adjacent to target block `3,67,2`; path trace ended with `status:"noPath"` and controls stopped.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check after extending the course to a five-block forward leg, five-block right turn, one-block air gap, and raised diamond target.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2`; focused pathfinder scenario passed `1 passing (9s)`, with the bot reaching the exact `GoalBlock(5,67,7)` diamond target after the extended forward/turn/gap/jump course.
- `2026-05-17` - `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: 2 passing after live course extension.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check after adding the jump/turn course and watch delays.
- `2026-05-17` - delayed launcher run with `set PATHFINDER_START_DELAY_MS=20000&& set PATHFINDER_GOAL_DELAY_MS=5000&& pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js` - PASS. Notes: corrected Windows `cmd.exe` env syntax after the failed `$env:` attempt; test passed `1 passing (31s)`.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check after replacing conditional course setup with forced `fill`/`setblock` commands.
- `2026-05-17` - `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax check after tightening the live assertion to 3D feet-position and `GoalNear`.
- `2026-05-17` - `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: 2 passing after live assertion changes.
- `2026-05-17` - strict 3D live pathfinder run - FAIL. Notes: Bot fell to feet `y=-60`; trace proved the previous X/Z-only assertion was a false positive for the jump/turn course.
- `2026-05-17` - `node -c src/builtins/mineflayer-compat.js`; `node -c src/builtins/physics/movement-packets.js`; `node -c src/builtins/physics/index.js`; `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax checks after moving snap behavior to physics rotation speed options.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - FAIL. Notes: Endstone/BDS `1.26.12.2` launched on UDP `19132`, client emitted `RakTimeout: Ping timed out`, Mocha timed out waiting for `OpBot` spawn before pathfinder loaded.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - FAIL. Notes: with `skipPing: true`, bot joined, built the lane, and loaded pathfinder; upstream pathfinder physics probe threw repeatedly from `prismarine-physics` because the facade version was not a Bedrock minecraft-data key and entity defaults were incomplete, then timed out near `2.65,67.55,14.14`.
- `2026-05-17` - `node -c src/builtins/mineflayer-compat.js` - PASS. Notes: syntax check after correcting facade version handling.
- `2026-05-17` - `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: 2 passing; facade reports `bedrock_1.26.10`.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - FAIL. Notes: after Bedrock version correction, pathfinder planned paths but auth input stayed at zero movement; trace showed `forward=true` immediately followed by `forward=false` and `path_reset: stuck`.
- `2026-05-17` - local `mineflayer-pathfinder/lib/physics` reproduction - PASS/DIAG. Notes: reproduced `canStraightLine=false` with path nodes from the live trace; after Mineflayer yaw conversion in the shim it returned `true`.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2` launched on UDP `19132`; client test passed `1 passing (4s)`. Endstone logged a harmless cleanup `No targets matched selector` after OpBot disconnected.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 101 passing; Node emitted the existing `punycode` deprecation warning.

## Architecture Notes

- Use a proxy/facade rather than mutating native state shape. Upstream Mineflayer plugins can receive the facade, while native builtins keep using `BotState`.
- Prioritize `mineflayer-pathfinder`: `entity`, object-like `entities`, `blockAt`, `inventory.items()`, `game.minY`, `loadPlugin`, and EventEmitter methods are the first required surface.
- The builtin exposes `botState.mineflayer`, `botState.asMineflayerBot()`, `botState.loadMineflayerPlugin()`, and Mineflayer-style `botState.loadPlugin()` after builtin injection. Plugin writes go through the proxy onto native `botState`, so `pathfinder` becomes available as `botState.pathfinder`.
- The facade returns object-like `entities` for `Object.values(bot.entities)` while preserving native `botState.entities` as a `Map`.
- Upstream pathfinder's constructor assumes Java-style block shapes for every registry `blocksArray` entry. The registry facade filters `blocksArray` through the state-owned `botState.blockClass`, while leaving `blocksByName` and `itemsByName` intact. The compat layer must not instantiate `prismarine-*` classes directly; `state.js` owns those constructors.
- A minimal `bot.physics.simulatePlayer` shim is present only to prevent upstream pathfinder physics checks from exploding. It is not Bedrock-accurate and should be replaced by a Bedrock predictor before trusting path quality.
- Upstream pathfinder calls `bot.look(yawRadians, pitchRadians)`. The facade converts those radians to native degree-based `botState.look` calls.
- Upstream pathfinder and `prismarine-physics` call `minecraft-data(bot.version)`, so the facade must expose a Bedrock minecraft-data key such as `bedrock_1.26.10`, not the native shorthand `1.26.10`.
- Native Bedrock state stores the local player position at eye height, while Mineflayer/pathfinder expects feet position. The compat entity facade exposes feet-position while preserving native `botState.self`.
- Mineflayer/pathfinder yaw is not Bedrock yaw. Convert using `bedrockYawRadians = Math.PI - mineflayerYawRadians`; the same convention is already documented in the NXG adapter.
- Pathfinder scenarios that need instant-looking behavior should raise physics `yawStepSpeed`/`pitchStepSpeed`, not special-case Mineflayer compat `look()`.
- The live scenario remains movement-only with no digging, no scaffolding, no sprinting, and no entity detection. The current course explicitly enables pathfinder parkour because the scenario includes a one-block air gap and a one-block-up diamond target after a five-block forward leg and five-block right turn.

## Handoff

The wrapper supports upstream pathfinder injection and has passing Endstone/BDS live coverage for the flat lane and the stricter forward/turn/gap/jump diamond-target course.

## Resume Notes

- Next step: optional follow-up is broader terrain coverage or replacing the intentionally small compat physics shim with a Bedrock-native predictor. Keep the exact feet-block assertion for target completion.
- Do not repeat: TASK-22 source review or wrapper injection tests.
- Raw logs: none.

## Final Summary

- Result: Added a Mineflayer compatibility builtin that lets upstream `mineflayer-pathfinder` inject through `botState.loadPlugin(pathfinder)` while preserving native `BotState` internals, plus a passing Endstone/BDS live e2e scenario for flat-lane pathfinder walking.
- Files changed: `docs/tasks/TASK-24-mineflayer-compat-wrapper.md`, `package.json`, `src/builtins/mineflayer-compat.js`, `test/static/mineflayer-compat.test.js`, `test/live/pathfinder.test.js`.
- Verification: `node -c src/builtins/mineflayer-compat.js`; `node -c test/live/pathfinder.test.js`; `npx mocha test/static/mineflayer-compat.test.js`; `pnpm run test:static`; Endstone/BDS focused live pathfinder run.
- Follow-up tasks: add broader pathfinder terrain scenarios and replace the simple physics shim with a Bedrock-native predictor when needed.

## Failure Summary

Pending.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
