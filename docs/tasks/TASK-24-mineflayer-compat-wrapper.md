# TASK 24 - Mineflayer Compat Wrapper

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-17
- **Scope:** Add a builtin compatibility wrapper that lets upstream `mineflayer-pathfinder` run against this Bedrock bot as the first supported Mineflayer plugin target.
- **Owned files:** `docs/tasks/TASK-24-mineflayer-compat-wrapper.md`, `package.json`, `src/builtins/mineflayer-compat.js`, `src/builtins/dig.js`, `src/builtins/physics/index.js`, `src/builtins/physics/movement-packets.js`, `test/static/mineflayer-compat.test.js`, `test/static/dig.test.js`, `test/live/pathfinder/`
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
- `[x]` Add Mineflayer event/API aliases for pathfinder replanning.
- `[x]` Make native `dig()` await matching block update completion.
- `[x]` Add Mineflayer-shaped `equip(item, 'hand')` and `placeBlock(refBlock, faceVec)` compat shims.
- `[x]` Split live pathfinder coverage into a scenario subfolder with current-course, bridge-up, and dig-down cases.
- `[x]` Add and verify the forward jump-up pathfinder scenario with the user-corrected course layout.

## Current State

- Worktree state: TASK-22 physics tick event changes are already in progress and should be preserved.
- Already implemented: `mineflayer-compat` builtin, upstream pathfinder dependency, focused static tests, and a live pathfinder lane scenario.
- Completed: live Endstone/BDS pathfinder run passes for the original flat lane.
- In progress: broaden the live pathfinder course to include a longer forward walk, a longer right turn, a one-block gap, a jump-up target, plus watch-friendly launch delays.
- Current strict jump/turn/gap result: passing on the extended course. The bot reaches the exact raised diamond target block after a five-block forward leg, five-block right turn, one-block air gap, and one-block upward jump.
- Follow-up complete: added an explicit runtime switch between the native Bedrock simulator and the `@nxg-org/mineflayer-physics-util` wrapper so the live pathfinder scenario can be run against either engine.
- Follow-up complete: hardened Mineflayer compatibility aliases for `blockUpdate`, `chunkColumnLoad`, event method normalization, plugin loaded checks, `findBlock(s)`, and `waitForChunks`.
- Follow-up complete: cloned upstream Mineflayer into ignored `ref/mineflayer` at `03eba44f` (`Release 4.37.1`, 2026-05-03) and broadened the current shims against its source contracts. Native `dig()` now supports Mineflayer `forceLook` / `digFace` arguments and awaits matching block update completion; the compat facade exposes `equip`, `unequip`, `getEquipmentDestSlot`, `placeBlock`, and `_placeBlockWithOptions` where current Bedrock primitives can support them. `activateBlock`, scaffolding-specific behavior, offhand placement, and armor/offhand equipment movement are intentionally deferred or explicit errors.
- Complete: live pathfinder coverage is now split into `test/live/pathfinder/` with shared helpers plus current-course, dig-down, and build-up scenario files. Current-course, dig-down, and build-up pass under Endstone/BDS. Bridge-up remains pending because the lateral bridge/climb case places but falls through to `y=-60`.
- Complete: added `forward-jump-up.test.js` using the corrected right-side start layout. Focused Endstone/BDS rerun passed, with exact feet-block completion on the emerald target.
- Complete: dig-down now explicitly switches back to survival after creative course setup, and the focused survival-mode rerun passed with empty-hand dirt digging.
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
| `src/builtins/mineflayer-compat.js` | changed | Adds Mineflayer event/API aliases without replacing native Bedrock state shapes: `blockUpdate`, `chunkColumnLoad`, `physicTick` normalization, `hasPlugin`, `findBlock(s)`, and `waitForChunks`. |
| `src/builtins/mineflayer-compat.js` | changed | Adds `equip(item, 'hand')` and `placeBlock(refBlock, faceVec)` signature shims for pathfinder digging/placing paths. |
| `src/builtins/mineflayer-compat.js` | changed | Broadens shims from upstream Mineflayer `simple_inventory`, `place_block`, and `generic_place`: `getEquipmentDestSlot`, `unequip`, `_placeBlockWithOptions`, force-look/delta/half placement options, and explicit unsupported errors for non-hand equipment/offhand placement. |
| `src/builtins/dig.js` | changed | Changes `dig(block)` from fire-and-forget scheduling to a promise that resolves after the matching block update confirms completion, and emits Mineflayer-style completion/abort events. |
| `src/builtins/dig.js` | changed | Broadens native `dig` toward upstream Mineflayer `dig(block, forceLook, digFace)`, plus `digTime`, `canDigBlock`, and `stopDigging`. |
| `src/builtins/place.js` | changed | Accepts an optional third options object used by compat placement shims for force-look and cursor-offset behavior; offhand placement remains unsupported. |
| `src/builtins/place.js` | changed | Native `placeBlock()` now waits for the matching placed-block update by default so Mineflayer/pathfinder placement promises represent confirmed placement rather than packet enqueue only. |
| `ref/mineflayer/` | inspected / gitignored | Local reference clone of PrismarineJS `mineflayer` at `03eba44f`; not repo source. |
| `src/state.js` | changed | Adds `physicsEngine: 'native' | 'nxg'` normalization, with `nxg-org` accepted as an alias and `BEDROCK_PHYSICS_ENGINE` as the env fallback. |
| `src/builtins/physics/nxg-physics-utils-adapter.js` | changed | Revives the nxg-org wrapper adapter behind the explicit physics engine switch, using Java `minecraft-data` for the wrapper while adapting Bedrock state, controls, yaw, pose, and world settings. |
| `src/builtins/physics/self-entity-proxy.js` | changed | Bridges Bedrock self state into the nxg player-state shape, including metadata array shape, normalized game mode, and normalized nxg poses. |
| `src/builtins/physics/bedrock-world-adapter.js` | changed | Adds Java-style block adapter fields required by nxg physics: positioned blocks and a `getProperties()` helper. |
| `src/builtins/physics/movement-packets.js` | changed | Adds configurable `yawStepSpeed` and `pitchStepSpeed` for look interpolation. |
| `src/builtins/physics/index.js` | changed | Passes physics options into the movement packet sender and selects native vs nxg physics engines. |
| `test/static/mineflayer-compat.test.js` | changed | Verifies facade shape and that upstream `mineflayer-pathfinder` injects through `state.loadPlugin(pathfinder)`. |
| `test/static/mineflayer-compat.test.js` | changed | Asserts the compat facade reports a Bedrock minecraft-data key such as `bedrock_1.26.10`. |
| `test/static/mineflayer-compat.test.js` | changed | Asserts the entity facade does not replace native `self` and exposes feet-position to Mineflayer consumers. |
| `test/static/mineflayer-compat.test.js` | changed | Adds focused static coverage for compat event/API aliases and packet-backed world event bridges. |
| `test/static/mineflayer-compat.test.js` | changed | Adds focused static coverage for Mineflayer `equip` and `placeBlock` shim signatures. |
| `test/static/dig.test.js` | changed | Adds focused static coverage that `dig()` remains unresolved after `predict_break` and resolves only after the matching block update. |
| `test/static/dig.test.js` | changed | Adds focused coverage for Mineflayer dig helper options and `stopDigging` abort behavior. |
| `test/live/pathfinder.test.js` | changed | Adds a live scenario that builds a flat lane, loads upstream `mineflayer-pathfinder`, sets movement-only `Movements`, and waits for the bot to walk near a target. |
| `test/live/pathfinder.test.js` | changed | Sets `skipPing: true` for this focused scenario after Endstone/BDS answered launcher readiness but the bot client's pre-connect RakNet ping timed out before initialization. |
| `test/live/pathfinder.test.js` | changed | Adds failure-only path/control/auth-input traces so future movement regressions show whether planning or Bedrock control handoff failed. |
| `test/live/pathfinder.test.js` | changed | Adds `PATHFINDER_START_DELAY_MS` and `PATHFINDER_GOAL_DELAY_MS`; replaces the straight lane with a cleared course containing a one-block jump-up and a right turn. |
| `test/live/pathfinder.test.js` | changed | Uses server-side `fill`/`setblock` commands for the course shape instead of conditional local-world checks, so rapid setup does not skip visible path blocks. |
| `test/live/pathfinder.test.js` | changed | Replaces X/Z-only goal and assertion with 3D feet-position checks, including an explicit start-teleport validation, so falling or walking under the course cannot pass. |
| `test/live/pathfinder.test.js` | changed | Sets high `yawStepSpeed` and `pitchStepSpeed` for the pathfinder scenario instead of adding compat-layer snap behavior. |
| `test/live/pathfinder.test.js` | changed | Marks the target footing block as `minecraft:diamond_block`, uses `GoalBlock`, and asserts the bot's floored feet position is exactly inside the target block. |
| `test/live/pathfinder.test.js` | changed | Reshapes the course to walk forward five blocks, turn right five blocks, then jump across one block of air onto a one-block-higher diamond target; enables pathfinder parkour for this explicit gap-jump scenario. |
| `test/live/pathfinder.test.js` | changed | Passes through `PATHFINDER_PHYSICS_ENGINE` / `BEDROCK_PHYSICS_ENGINE` so the same pathfinder course can run against native or nxg physics. |
| `test/live/pathfinder.test.js` | removed | Replaced the single top-level live pathfinder file with scenario-specific tests under `test/live/pathfinder/`. |
| `test/live/pathfinder/helpers.js` | added | Shared live pathfinder bot startup, course setup, feet-position assertions, trace diagnostics, movement configuration, and teardown helpers. |
| `test/live/pathfinder/helpers.js` | changed | Fixes trace wrapping so `_applyPlayerAuthInputHooks` still runs, and adds `goToGoalReached()` for scenarios where upstream pathfinder's goal completion is the intended acceptance signal. |
| `test/live/pathfinder/current-course.test.js` | added | Carries forward the existing forward-turn-gap raised-target scenario with exact feet-block completion. |
| `test/live/pathfinder/build-up.test.js` | added | Adds a straight-up tower scenario that builds several blocks toward an air `GoalBlock` and accepts upstream `goal_reached` as success. |
| `test/live/pathfinder/bridge-up.test.js` | added | Adds a placement/scaffolding pathfinder scenario that must bridge a missing support and climb onto a raised marked target. |
| `test/live/pathfinder/dig-down.test.js` | added | Adds a digging pathfinder scenario that must dig the block beneath the bot and drop onto a lower marked target. |
| `test/live/pathfinder/bridge-up.test.js` | changed | Marked pending after live verification showed the scenario currently falls through to the void after placement attempts. |
| `test/live/pathfinder/dig-down.test.js` | changed | Unskipped after fixing trace wrapping; pathfinder-driven dig-down now passes against Endstone/BDS and now switches to survival before the pathfinder action starts. |
| `test/live/pathfinder/forward-jump-up.test.js` | added | Adds the corrected right-side start / one-block-up emerald target scenario and asserts exact target feet block completion. |
| `test/static/runtime-options.test.js` | changed | Covers default native physics and the `nxg-org` alias normalization. |

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
- `2026-05-17` - `node -c src/state.js`; `node -c src/builtins/physics/index.js`; `node -c src/builtins/physics/nxg-physics-utils-adapter.js`; `node -c src/builtins/physics/self-entity-proxy.js`; `node -c src/builtins/physics/bedrock-world-adapter.js`; `node -c test/live/pathfinder.test.js` - PASS. Notes: syntax checks after adding the native/nxg physics engine switch.
- `2026-05-17` - `npx mocha test/static/runtime-options.test.js test/static/mineflayer-compat.test.js` - PASS. Notes: 11 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-17` - isolated nxg tick probes - PASS. Notes: `createNxgPhysicsAdapter().simulateSelf(...)` can tick a simple Bedrock world wrapper, including `gameMode: 'fallback'` and string pose metadata, after normalizing the proxy state.
- `2026-05-17` - interrupted nxg pathfinder run `PATHFINDER_PHYSICS_ENGINE=nxg node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - FAIL. Notes: first live nxg run repeatedly threw `Unknown game mode: fallback` from nxg `PlayerState.update()`, leaving `pathTrace=[]` and the bot at start.
- `2026-05-17` - interrupted nxg pathfinder rerun after game-mode normalization - FAIL. Notes: next live nxg run repeatedly threw `Cannot destructure property 'width' of 'exports.playerPoseCtx[entityPose]' as it is undefined` from nxg `getCollider()`, caused by Bedrock/string pose values reaching nxg.
- `2026-05-17` - `PATHFINDER_PHYSICS_ENGINE=nxg node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2`; focused pathfinder scenario passed `1 passing (9s)` using the nxg physics wrapper. Endstone process exited during launcher shutdown after the successful client exit.
- `2026-05-17` - `git status --short`; read `test/rules.md`; searched native event names and upstream `mineflayer-pathfinder` listener expectations - PASS. Notes: pathfinder listens for `blockUpdate` and `chunkColumnLoad`; native code currently has Bedrock packet/update handlers and no general Mineflayer event alias layer.
- `2026-05-17` - `node -c src/builtins/mineflayer-compat.js`; `node -c test/static/mineflayer-compat.test.js`; `npx mocha test/static/mineflayer-compat.test.js` - PASS. Notes: focused compat suite now has 4 passing tests covering wrapper shape, upstream pathfinder injection, event bridges, and event method aliases.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 105 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-17` - `git status --short`; searched native `dig`, `placeBlock`, `equipItem`, and upstream pathfinder action calls - PASS. Notes: native `dig` returned immediately after scheduling; upstream pathfinder calls `bot.dig(block, true)`, `bot.equip(item, 'hand')`, and `bot.placeBlock(refBlock, faceVec)`.
- `2026-05-17` - `node -c src/builtins/dig.js`; `node -c src/builtins/mineflayer-compat.js`; `node -c test/static/dig.test.js`; `node -c test/static/mineflayer-compat.test.js` - PASS. Notes: syntax checks for the dig completion and compat shim changes.
- `2026-05-17` - `npx mocha test/static/dig.test.js test/static/mineflayer-compat.test.js` - PASS. Notes: 6 passing; focused coverage for awaited dig completion and Mineflayer `equip`/`placeBlock` shims.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 107 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-17` - `git clone https://github.com/PrismarineJS/mineflayer.git ref/mineflayer`; `git -C ref/mineflayer log -1 --format="%h %ad %s" --date=short` - PASS. Notes: cloned ignored reference checkout at `03eba44f 2026-05-03 Release 4.37.1 (#3897)`.
- `2026-05-17` - inspected `ref/mineflayer/lib/plugins/digging.js`, `simple_inventory.js`, `place_block.js`, `generic_place.js`, and `inventory.js` activation section - PASS. Notes: upstream contracts include `dig(block, forceLook, digFace)`, `digTime`, `canDigBlock`, `stopDigging`, `equip/unequip/getEquipmentDestSlot`, `placeBlock`, `_placeBlockWithOptions`, and `activateBlock`.
- `2026-05-17` - `node -c src/builtins/dig.js`; `node -c src/builtins/place.js`; `node -c src/builtins/mineflayer-compat.js`; `node -c test/static/dig.test.js`; `node -c test/static/mineflayer-compat.test.js` - PASS. Notes: syntax checks after broadening shims from upstream Mineflayer source.
- `2026-05-17` - `npx mocha test/static/dig.test.js test/static/mineflayer-compat.test.js` - PASS. Notes: 7 passing; adds coverage for `forceLook`, `digFace`, `stopDigging`, `getEquipmentDestSlot`, `_placeBlockWithOptions`, placement cursor options, swing options, and explicit unsupported errors.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 108 passing; Node emitted the existing `punycode` deprecation warning.
- `2026-05-17` - `node -c test/live/pathfinder/helpers.js`; `node -c test/live/pathfinder/current-course.test.js`; `node -c test/live/pathfinder/bridge-up.test.js`; `node -c test/live/pathfinder/dig-down.test.js` - PASS. Notes: split live pathfinder scenarios syntax-check clean after moving the old top-level test into `test/live/pathfinder/`.
- `2026-05-17` - `pnpm run test:static` - PASS. Notes: 108 passing; Node emitted the existing `punycode` deprecation warning after the live pathfinder test split.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder/**/*.test.js"` - FAIL. Notes: Endstone/BDS `1.26.12.2`; current-course passed, bridge-up failed after placement attempts with feet at `24.60,-60,0.69` and path partial/timeout, dig-down failed after repeated `dig()` attempts and `path_reset: dig_error` while still at feet `40.5,67,0.5`.
- `2026-05-17` - `node -c test/live/pathfinder/bridge-up.test.js`; `node -c test/live/pathfinder/dig-down.test.js` - PASS. Notes: syntax check after marking the two currently unsupported action scenarios pending.
- `2026-05-17` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder/**/*.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2`; split pathfinder folder default run is green with `1 passing (10s), 2 pending`; current-course passes, bridge-up and dig-down remain pending coverage for the next action-integration pass.
- `2026-05-17` - watched dig-down rerun - FAIL/PASS. Notes: first run showed the test trace wrapper overwrote `_applyPlayerAuthInputHooks`, preventing dig block actions from reaching `player_auth_input`; after wrapping the original hook dispatcher, dig-down passed with `start break` and `block updated while digging` for `(40, 66, 0)`.
- `2026-05-17` - watched lateral bridge-up rerun - FAIL. Notes: confirmed this scenario is not the straight-up tower case; it places laterally toward a solid target and falls to `y=-60`, so it remains pending.
- `2026-05-17` - watched build-up reruns - PASS after expectation change. Notes: added multi-block straight-up scenario with target feet block at air `(60, 70, 0)`; strict feet-block assertion fails because upstream pathfinder emits `goal_reached` while native feet are lower, so the scenario now treats `goal_reached` as success per user direction. Focused Endstone/BDS run passed `1 passing (25s)`.
- `2026-05-17` - `$env:PATHFINDER_START_DELAY_MS='5000'; $env:PATHFINDER_GOAL_DELAY_MS='2000'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder/forward-jump-up.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2`; user-corrected forward jump-up layout passed `1 passing (15s)` with exact emerald target feet-block assertion.
- `2026-05-17` - `$env:PATHFINDER_START_DELAY_MS='5000'; $env:PATHFINDER_GOAL_DELAY_MS='2000'; node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=600000 --client "pnpm exec mocha --config .mocharc.live.json test/live/pathfinder/dig-down.test.js"` - PASS. Notes: Endstone/BDS `1.26.12.2`; dig-down switched OpBot to Survival before pathfinder started, dug dirt at `(40, 66, 0)` with empty hand, received the matching block update, and passed `1 passing (16s)`.

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
- The compat plugin now installs packet-backed bridges for Mineflayer `blockUpdate` and `chunkColumnLoad` when a Bedrock client is available. The bridge keeps native Bedrock state authoritative, then emits Mineflayer-shaped events for plugin consumers.
- `bot.once('event')` on the facade supports a promise-style form as a convenience for Mineflayer-adjacent code, while normal listener registration still delegates to the native `EventEmitter`.
- `activateBlock` and scaffolding-specific pathfinder behavior are intentionally still outside this shim pass. `placeBlock` compatibility is only signature conversion into the existing Bedrock placement primitive.
- Native `dig(block)` now keeps its break hook active after `predict_break` and resolves on matching `update_block`, `update_block_synced`, or `update_subchunk_blocks`; timeout rejects emit `diggingAborted`.
- The Mineflayer `equip(item, destination)` shim resolves item objects back to native inventory slots before calling `equipItem(slot)` for `hand`/`null`; non-hand destinations currently throw explicit unsupported errors because this repo does not yet have a proven Bedrock armor/offhand equipment action path.
- `_placeBlockWithOptions` supports upstream-compatible `forceLook`, `half`, `delta`, `swingArm`, and `showHand` translation into native placement. `offhand` placement throws explicitly because native `placeBlock` uses the selected hand only.
- `activateBlock` remains deferred per user direction from the previous turn; upstream source is now available under `ref/mineflayer` for a future targeted pass.
- Live pathfinder scenarios now live under `test/live/pathfinder/`. The default executable scenarios cover movement/parkour, dig-down, and straight-up tower building. Bridge-up is intentionally pending because it is a separate lateral bridge/climb behavior.

## Handoff

The wrapper supports upstream pathfinder injection and has passing Endstone/BDS live coverage for the stricter forward/turn/gap/jump diamond-target course, pathfinder-driven dig-down, straight-up tower building, and the corrected forward jump-up emerald-target course. Live pathfinder scenarios are split under `test/live/pathfinder/`; lateral bridge-up remains pending.

## Resume Notes

- Next step: unskip `test/live/pathfinder/bridge-up.test.js` after lateral placement/scaffolding integration can keep the bot on the placed route. Keep exact feet-block assertions for scenarios where this repo owns the final position; for straight-up tower building, accept upstream pathfinder `goal_reached`.
- Do not repeat: TASK-22 source review or wrapper injection tests.
- Raw logs: none.

## Final Summary

- Result: Added a Mineflayer compatibility builtin that lets upstream `mineflayer-pathfinder` inject through `botState.loadPlugin(pathfinder)` while preserving native `BotState` internals, plus passing Endstone/BDS live coverage for current-course, dig-down, and straight-up build-up pathfinder scenarios.
- Files changed: `docs/tasks/TASK-24-mineflayer-compat-wrapper.md`, `package.json`, `src/builtins/mineflayer-compat.js`, `src/builtins/dig.js`, `src/builtins/place.js`, `test/static/mineflayer-compat.test.js`, `test/static/dig.test.js`, `test/live/pathfinder/`.
- Verification: `node -c` syntax checks for compat/dig/place/static/live pathfinder files; `npx mocha test/static/dig.test.js test/static/mineflayer-compat.test.js`; `pnpm run test:static`; Endstone/BDS focused live pathfinder folder run.
- Follow-up tasks: unskip the pending lateral bridge-up pathfinder scenario after the underlying placement/scaffolding gap is fixed, then replace the simple physics shim with a Bedrock-native predictor when needed.

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
