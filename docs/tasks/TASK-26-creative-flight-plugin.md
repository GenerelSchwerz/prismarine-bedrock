# TASK 26 - Creative Flight Plugin

- **Status:** `[x]` complete
- **Owner:** Codex / 2026-05-18
- **Scope:** Add and refactor a creative flight API so `flight.js` initiates/cancels flight while canonical ability state lives on entities and flying auth-input controls live in physics input controls.
- **Owned files:** `docs/tasks/TASK-26-creative-flight-plugin.md`, `src/builtins/flight.js`, `src/entity-metadata.js`, `src/builtins/entities.js`, `src/builtins/physics-constants.js`, `src/builtins/physics/input-controls.js`, `src/builtins/physics/movement-packets.js`, `test/static/flight.test.js`
- **Related docs:** `AGENTS.md`, `test/rules.md`, `docs/tasks/TASK-25-sneak-sprint-pose-physics.md`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`, `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/types.yml`, `ref/bedrock-protocol-docs/html/enums.html`, `ref/geyser/core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/entity/player/input/BedrockPlayerAuthInputTranslator.java`, `ref/geyser/core/src/main/java/org/geysermc/geyser/session/GeyserSession.java`

## Goal

Implement a creative flight API that requests flight on/off with vanilla-like `player_auth_input` transition bits while keeping persistent flight permission/state canonical on `botState.self`.

Success means focused static tests prove canonical `self` fields record `may_fly`/`flying`/`no_clip`, the flight API sends one-shot `start_flying` and `stop_flying`, and the shared input-control path maps jump/sneak to flight ascend/descend input while flying.

## Non-Goals

- Do not finish full spectator camera/no-clip behavior in this task.
- Do not rewrite unrelated physics/pathfinder behavior from `TASK-25`.
- Do not claim BDS parity until a live creative-flight capture verifies the trace.

## Current Plan

- `[x]` Read existing task state and note current dirty physics/pathfinder work.
- `[x]` Review local Bedrock protocol schema/docs for flight-related packets, flags, ability layers, and game mode values.
- `[x]` Review Geyser's Bedrock auth-input and ability handling for creative flight and spectator behavior.
- `[x]` Add initial `src/builtins/flight.js` with ability tracking and auth-input flight requests.
- `[x]` Refactor duplicate ability/game-mode tracking out of `flight.js`.
- `[x]` Move flying jump/sneak auth-input mapping into `input-controls.js`.
- `[x]` Extend canonical entity ability parsing and flight change events.
- `[x]` Run final focused and full static verification after refactor.

## Current State

- Worktree state: existing user/peer changes are present in `AGENTS.md`, repo docs, `TASK-24`, `TASK-25`, physics files, pathfinder live tests, and e2e runtime files. This task did not revert them.
- Already implemented: `src/builtins/flight.js` now auto-installs auth-input, exposes `startFlying`, `stopFlying`, `setFlying`, `canFly`, `isFlying`, and `isSpectator`, and queues one-shot `start_flying`/`stop_flying` bits without owning persistent ability state. `entity-metadata.js` owns ability-layer parsing. `input-controls.js` owns flying ascend/descend mapping.
- In progress: none.
- Not started: live creative-flight capture against Endstone/BDS.
- Known mismatch between notes and worktree: resolved by removing the missing `docs/in-dev` required-reading path from `AGENTS.md`; physics/movement source guidance now points directly to local protocol docs.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-26-creative-flight-plugin.md` | changed | Reopened for the canonical-state refactor and recorded the new ownership/files. |
| `src/builtins/flight.js` | changed | Reduced to a thin command/API plugin; removed duplicate ability parsing, game-mode parsing, flight hook control mapping, and persistent `flightState`. |
| `src/entity-metadata.js` | changed | Canonical ability parsing now handles base/spectator layers, `may_fly`, `flying`, `no_clip`, speeds, and spectator game-mode aliases. |
| `src/builtins/entities.js` | changed | Emits `flightChanged` when canonical flight state changes after abilities, adventure settings, or game-mode updates. |
| `src/builtins/physics-constants.js` | changed | Added auth-input bit constants for `ascend`, `descend`, `start_flying`, and `stop_flying`. |
| `src/builtins/physics/input-controls.js` | changed | Maps flying jump/sneak to `ascend`/`descend` and suppresses normal sneaking pose/transition state while flying. |
| `src/builtins/physics/movement-packets.js` | changed | Adds packet flag-name mapping for the new flight-related constants. |
| `test/static/flight.test.js` | changed | Static coverage now uses canonical `self` state through the entities plugin and adds entity metadata ability parsing checks. |
| `src/builtins/auth-input.js` | inspected | Already has needed auth-input flag names and hook API. |
| `docs/tasks/TASK-25-sneak-sprint-pose-physics.md` | inspected | Active related physics task; this task edits shared input-control files per the user's explicit refactor request. |

## Evidence Log

- `2026-05-18` - `git status --short` - PASS. Notes: dirty worktree includes active physics/pathfinder changes; no unrelated changes reverted.
- `2026-05-18` - `Get-Content docs/tasks/TASK-25-sneak-sprint-pose-physics.md` - PASS. Notes: current sneak/sprint work is active and related.
- `2026-05-18` - `rg -n -C 8 "start_flying|stop_flying|packet_request_ability|packet_update_abilities|AbilityLayer|AbilitySet|mayfly|flying|GameMode"` over `minecraft-data` 1.26.10 protocol files - PASS. Notes: `start_flying` and `stop_flying` are `player_auth_input` bits 42/43; `update_abilities` is clientbound and carries base/spectator `AbilityLayers`; `AbilitySet` includes `flying`, `may_fly`, and `no_clip`.
- `2026-05-18` - Geyser inspection over `BedrockPlayerAuthInputTranslator.java`, `GeyserSession.java`, `InputCache.java`, and `JavaPlayerAbilitiesTranslator.java` - PASS. Notes: Geyser treats `START_FLYING`/`STOP_FLYING` from `player_auth_input` as the modern Bedrock toggle path, requires `canFly`, and uses `UpdateAbilitiesPacket` for acceptance/denial.
- `2026-05-18` - `pnpm exec mocha test/static/flight.test.js test/static/physics-sneak-sprint.test.js` before refactor - PASS. Notes: 10 passing.
- `2026-05-18` - `pnpm run test:static` before refactor - PASS. Notes: 120 passing; existing `punycode` deprecation warning only.
- `2026-05-18` - `pnpm exec mocha test/static/flight.test.js test/static/physics-sneak-sprint.test.js` after canonical-state refactor - PASS. Notes: 12 passing.
- `2026-05-18` - `pnpm run test:static` after canonical-state refactor - PASS. Notes: 122 passing; existing `punycode` deprecation warning only.

## Architecture Notes

- Flight request/cancel is modeled as one-shot `player_auth_input.input_data.start_flying` / `stop_flying` bits, not as a persistent bot-sent metadata flag.
- Server authority is `update_abilities`: `may_fly` indicates permission, `flying` indicates accepted current state. `self.flying`, `self.mayFly`, `self.allowFlight`, and `self.noClip` are canonical. The flight API may optimistically update `self.flying` for motion prediction, but later server ability/adventure packets overwrite it.
- `request_ability` is present in the schema, but the reviewed Geyser path for modern Bedrock flight uses `player_auth_input` transition bits. Keep `request_ability` out of the initial implementation unless a live client trace proves it is required for BDS.
- Spectator support should share the same ability-state store. Current parsing treats spectator game modes/layers as flight-capable and flight-locked, and records `noClip` from the spectator layer.
- While flying, jump maps to ascend and sneak maps to descend. `input-controls.js` now sets `ascend`/`descend` while keeping `sneak_down` input but suppressing normal sneaking pose/transition state.

## Handoff

The plugin, canonical-state refactor, focused static tests, and full static suite are complete. The next meaningful parity step is a recorded/live creative-mode toggle trace against Endstone/BDS to confirm the server's exact `update_abilities` response and any vertical-flight input quirks.

## Resume Notes

- Next step: run a live creative-mode trace on Endstone/BDS that toggles flight on/off and ascends/descends, comparing `player_auth_input` transition bits with `update_abilities` responses.
- Do not repeat: protocol/Geyser schema search above, or `TASK-25` sneak/sprint implementation.
- Raw logs: none.

## Final Summary

- Result: Added a creative-flight builtin and refactored it into a thin API over canonical entity ability state and shared physics input controls.
- Files changed: `docs/tasks/TASK-26-creative-flight-plugin.md`, `src/builtins/flight.js`, `src/entity-metadata.js`, `src/builtins/entities.js`, `src/builtins/physics-constants.js`, `src/builtins/physics/input-controls.js`, `src/builtins/physics/movement-packets.js`, `test/static/flight.test.js`.
- Verification: `pnpm exec mocha test/static/flight.test.js test/static/physics-sneak-sprint.test.js` and `pnpm run test:static` pass after the refactor.
- Follow-up tasks: capture/live-test Endstone/BDS creative flight; later add full spectator camera/no-clip semantics.

## Failure Summary

Fill this when marking the task blocked or abandoned.

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. No new packet object shape was added; the plugin sets existing `player_auth_input` flag names through the existing auth-input hook/input controls.
- `[x]` Live test run or explicitly deferred with reason. Deferred: no live creative-flight scenario was requested for this turn, and static refactor was the requested deliverable.
- `[x]` Raw debug logs kept out of git.
