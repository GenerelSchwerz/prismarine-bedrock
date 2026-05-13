# TASK 09 - Forked Prismarine Chunk 1.26 Compatibility

- **Status:** `[x] complete`
- **Owner:** Codex / 2026-05-13
- **Scope:** Fork `prismarine-chunk`, point `package.json` at a local ignored fork checkout, and add focused Bedrock 1.26 compatibility.
- **Owned files:** `.gitignore`, `package.json`, local ignored `pnpm-lock.yaml`, ignored root checkout `prismarine-chunk-fork/`, external fork branch `GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat`, `src/builtins/setup.js`, `test/live/chunks.test.js`, `test/static/block-runtime-ids.test.js`, `test/static/bedrock-subchunk-runtime-palette.test.js`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`
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
- `[x]` Move local fork checkout to root-level ignored `prismarine-chunk-fork/`.
- `[x]` Rebase local fork branch onto current upstream.
- `[x]` Point `prismarine-chunk` dependency to the local checkout.
- `[x]` Add isolated Bedrock 1.26 chunk/subchunk files without changing the 1.18 implementation.
- `[x]` Run focused static and live chunk decode checks.

## Current State

- Worktree state: existing unrelated changes in Endstone/e2e recorder files and untracked TASK-08/test recorder files; left untouched. This task changes `package.json` and this task log. `pnpm-lock.yaml` is gitignored but was updated locally by pnpm.
- Already implemented: dependency review found `prismarine-chunk@1.40.0` fails for `bedrock_1.26.x` because its Bedrock dispatch table stops at major `1.21`.
- Worktree state: root checkout points `prismarine-chunk` to ignored local `prismarine-chunk-fork/`; local fork checkout has uncommitted 1.26 chunk/subchunk files and index dispatch changes.
- Complete: live 1.26 chunk decode validation passes against current Endstone/BDS. `test/live/chunks.test.js` scans the clean superflat chunk neighborhood before test-authored block mutations and asserts only `air`, `grass_block`, `dirt`, and `bedrock` decode. `minecraft-data` comparison shows `packet_start_game` changed in 1.26 by moving telemetry IDs after new optional `server_join_info`, while level chunk/subchunk packet schemas are unchanged.
- Remaining follow-up outside this task: commit/push local fork changes if the fork should be published upstream.
- Known mismatch between notes and worktree: none for this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `package.json` | changed | Points `prismarine-chunk` to `github:GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat`. |
| `pnpm-lock.yaml` | ignored-local-change | pnpm resolved fork commit `3bf1bc4403b18c3c9e56d6dd9b53a5572663f7d1`; file is gitignored by this repo. |
| `scripts/tmp/prismarine-chunk-fork/` | ignored-temp | Temporary clone used to create and push the fork branch; not a submodule and not a dependency path. |
| `GenerelSchwerz/prismarine-chunk#bedrock-1.26-compat` | external-changed | Branch based on upstream `1.40.0`, commit `3bf1bc4`, maps Bedrock `1.26`, `1.26.10`, and `26.10` major keys to the existing Bedrock `1.18` chunk implementation. |
| `docs/tasks/TASK-09-local-prismarine-chunk-126.md` | changed | Task log for forked dependency work. |
| `.gitignore` | changed | Ignores root-level local `prismarine-chunk-fork/` checkout. |
| `package.json` | changed | Points `prismarine-chunk` to `link:./prismarine-chunk-fork`. |
| `prismarine-chunk-fork/` | ignored-local-change | Moved from `scripts/tmp/prismarine-chunk-fork/`, rebased against `upstream/master`, dependency install run locally, and 1.26 files added under `src/bedrock/1.26/`; `src/bedrock/1.18/` left unchanged. |
| `src/builtins/setup.js` | changed | Rebuilds `registry.blocksByRuntimeId` and reverse state-to-runtime mappings after `start_game`, translating versioned/live network block states into local Prismarine state IDs before chunks decode. |
| `test/static/block-runtime-ids.test.js` | changed | Adds a 1.26 regression proving hashed runtime IDs for `emerald_block` and Bedrock's network `bedrock` state map to local Prismarine state IDs after `start_game`. |
| `test/static/bedrock-subchunk-runtime-palette.test.js` | changed | Adds regressions for 1.26 runtime palette ID `3610` decoding as `emerald_block`, chunk network decode routing through the 1.26 decoder, and single-value hashed runtime palettes decoding through the rebuilt registry. |
| `test/live/chunks.test.js` | changed | Adds a pre-mutation superflat neighborhood scan around `(0,-60,0)` and fails if decoded block names include anything outside `air`, `grass_block`, `dirt`, and `bedrock`. |

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
- `2026-05-13` - `Move-Item scripts/tmp/prismarine-chunk-fork prismarine-chunk-fork` - PASS. Notes: checkout is now root-level and ignored by `.gitignore`.
- `2026-05-13` - `git fetch upstream --prune; git rebase upstream/master` in `prismarine-chunk-fork/` - PASS. Notes: branch was already up to date with current upstream `master`.
- `2026-05-13` - `pnpm install` in repo root after setting `prismarine-chunk` to `link:./prismarine-chunk-fork` - PASS. Notes: `node_modules/prismarine-chunk` is a junction to `prismarine-chunk-fork`.
- `2026-05-13` - `pnpm install` in `prismarine-chunk-fork/` - PASS. Notes: needed for linked package-local dependencies such as `xxhash-wasm`.
- `2026-05-13` - `npx mocha test/static/bedrock-subchunk-runtime-palette.test.js` - PASS. Notes: 1.26 runtime palette ID `3610` decodes to `emerald_block`.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: 43 passing.
- `2026-05-13` - Node construction probe for `bedrock_1.21.130`, `bedrock_1.26.10`, and `bedrock_1.26.20` using linked `prismarine-chunk` - PASS. Notes: module resolves through `prismarine-chunk-fork`.
- `2026-05-13` - `E2E_ENDSTONE_PACKAGE=endstone==0.10.18 MC_VERSION=1.21.130 node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client "npx mocha --config .mocharc.live.json test/live/chunks.test.js"` - PASS. Notes: Endstone 0.10.18 / BDS 1.21.130.4; server accepted setblock probes at y=-60; reconnect readback test passed with 1 passing.
- `2026-05-13` - `E2E_ENDSTONE_PACKAGE=endstone MC_VERSION=1.26.10 node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client "npx mocha --config .mocharc.live.json test/live/chunks.test.js"` - FAIL. Notes: Endstone 0.11.3 / BDS 1.26.12.2; server accepted setblock probes at y=-60; reconnect readback still returned `hard_light_blue_stained_glass` for expected `emerald_block` at `1 -60 0`.
- `2026-05-13` - Strengthened `test/live/chunks.test.js` against `MC_VERSION=1.21.130` / Endstone 0.10.18 - PASS. Notes: pre-mutation superflat scan accepted only `air`, `grass_block`, `dirt`, and `bedrock`, then setblock readback passed.
- `2026-05-13` - Strengthened `test/live/chunks.test.js` against `MC_VERSION=1.26.10` / Endstone 0.11.3 / BDS 1.26.12.2 - FAIL. Notes: pre-mutation superflat scan decoded `ice` 1734, `soul_lantern` 578, `green_concrete_powder` 289, and `andesite_double_slab` 289 instead of expected superflat blocks.
- `2026-05-13` - `minecraft-data` schema comparison between `data/bedrock/1.21.130/` and `data/bedrock/1.26.10/` - PASS investigation. Notes: `packet_level_chunk`, `packet_subchunk`, and `packet_subchunk_request` field order are unchanged. `packet_start_game` adds `has_server_join_info` / `server_join_info` and moves `server_identifier`, `scenario_identifier`, `world_identifier`, and `owner_identifier` to the end after `server_controlled_sound`.
- `2026-05-13` - Registry comparison for common superflat blocks - PASS investigation. Notes: in `bedrock_1.21.130`, `registry.blockStates[index]` aligns with `registry.blocksByStateId[index]` for `air`, `grass_block`, `dirt`, `bedrock`, and `emerald_block`; in `bedrock_1.26.10`, the network palette index is one lower than the Prismarine state ID for several common blocks (`air` index 12530 vs stateId 12531, `grass_block` 11062 vs 11063, `dirt` 9852 vs 9853, `emerald_block` 3610 vs 3611), which exactly matches the observed wrong decoded names when a network palette index is treated as a local state ID.
- `2026-05-13` - `npx mocha test/static/block-runtime-ids.test.js test/static/bedrock-subchunk-runtime-palette.test.js` - PASS. Notes: 7 passing; proves 1.26 hashed runtime registry rebuild maps `emerald_block` and Bedrock's network `bedrock` state to local Prismarine state IDs.
- `2026-05-13` - First `MC_VERSION=1.26.10` live rerun after registry rebuild - FAIL. Notes: `air`, `dirt`, and `grass_block` decoded correctly; only `bedrock` remained missing because Bedrock's network `infiniburn_bit=0` state did not match Prismarine's local default state range.
- `2026-05-13` - `E2E_ENDSTONE_PACKAGE=endstone MC_VERSION=1.26.10 node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client "npx mocha --config .mocharc.live.json test/live/chunks.test.js"` - PASS. Notes: Endstone 0.11.3 / BDS 1.26.12.2; clean superflat scan decoded only `air`, `grass_block`, `dirt`, and `bedrock`; server-authored emerald/gold/redstone block readback passed after reconnect.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: 45 passing.
- `2026-05-13` - Direct probe of Bedrock 1.18 chunk implementation with rebuilt 1.26 registry and a single-value hashed `air` subchunk - FAIL. Notes: 1.18 still reads `bitsPerBlock=0` runtime palettes as `stream.readVarInt() >> 1` and treats the result as a local state ID, so it cannot safely handle 1.26 hashed runtime IDs.
- `2026-05-13` - `npx mocha test/static/bedrock-subchunk-runtime-palette.test.js test/static/block-runtime-ids.test.js` - PASS. Notes: 8 passing after changing the isolated 1.26 `bitsPerBlock=0` runtime path to use `readZigZagVarInt()` and translate through the rebuilt registry.
- `2026-05-13` - `pnpm run test:static` - PASS. Notes: 46 passing.
- `2026-05-13` - `E2E_ENDSTONE_PACKAGE=endstone MC_VERSION=1.26.10 node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client "node scripts/tmp/endstone-126-world-smoke.js"` - PASS. Notes: Endstone 0.11.3 / BDS 1.26.12.2; bot connected as `Endstone126SmokeBot`, loaded 153 chunk columns, read `grass_block` near spawn, public chat echo was observed, and forward movement changed horizontal position by about 5.24 blocks.

## Architecture Notes

- The only tracked dependency pointer is `package.json`; no git submodule or vendored dependency directory was added.
- `minecraft-data` reports `bedrock_1.26.10` with `majorVersion: "26.10"` even though `bedrock-protocol` validates the version string as `1.26.10`.
- Initial compatibility maps Bedrock `1.26`, `1.26.10`, and `26.10` major versions to the existing Bedrock `1.18` chunk implementation. Construction and static tests pass; real `1.26.x` chunk decode still needs live server evidence.
- Follow-up local checkout now keeps `1.18` through `1.21` on the upstream `bedrock/1.18` implementation and maps only `1.26`, `1.26.10`, and `26.10` to `bedrock/1.26`.
- The `bedrock/1.26` subchunk implementation translates network runtime palette IDs through `registry.blockStates` and `Block.fromProperties(...)` into Prismarine state IDs before storing them. This addresses the observed `hard_light_blue_stained_glass`/`emerald_block` mismatch without changing the 1.18 path.
- `start_game.block_network_ids_are_hashes` exists in both 1.21.130 and 1.26.10 schemas, and live logs showed it as `true` in both runs. The chunk packet schemas did not change, so the failure is more likely from 1.26 registry state ID/network palette divergence or from a decode path still treating packet palette entries as Prismarine state IDs.
- `start_game.block_properties` was empty in the current Endstone/BDS 1.26.12 run, so the fix rebuilds vanilla mappings from the versioned network palette and then overlays any live `block_properties` entries if a server sends them.
- Bedrock's network `bedrock` state with `infiniburn_bit=0` does not map cleanly through Prismarine's local state range in 1.26.10; the registry rebuild falls back to the block's local default state when `Block.fromProperties(...)` returns block metadata without a concrete `stateId`.
- The isolated 1.26 chunk/subchunk files are still needed. The 1.18 implementation works for 1.21-style runtime palette indexes, but its `bitsPerBlock=0` runtime path assumes `(readVarInt() >> 1)` is already a local state ID. That is not valid for 1.26 hashed runtime IDs, especially negative hashes.

## Handoff

Next task should publish or upstream the local fork changes if this 1.26 chunk path should be shared outside this checkout.

## Resume Notes

- Next step: optional fork publication/upstreaming; live 1.26 Endstone chunk decode now passes locally.
- Do not repeat: dependency review showing `minecraft-data` and `bedrock-protocol` can load `1.26.x` serializers; fork creation and construction probes.
- Raw logs: none.

## Final Summary

- Result: Forked `PrismarineJS/prismarine-chunk`, moved the fork to ignored root `prismarine-chunk-fork/`, linked the dependency locally, added isolated Bedrock 1.26 chunk/subchunk files, and rebuilt Bedrock block runtime registry mappings after `start_game` so 1.26 hashed network block IDs decode into local Prismarine state IDs.
- Files changed: `package.json`, local ignored `pnpm-lock.yaml`, `.gitignore`, ignored `prismarine-chunk-fork/`, `src/builtins/setup.js`, `test/static/block-runtime-ids.test.js`, `test/static/bedrock-subchunk-runtime-palette.test.js`, `test/live/chunks.test.js`, `docs/tasks/TASK-09-local-prismarine-chunk-126.md`.
- Verification: `BotState` construction passes for 1.26; focused static chunk/runtime tests pass; `pnpm run test:static` passed with 46 tests; live Endstone 0.11.3 / BDS 1.26.12.2 chunk test passed for clean superflat scan and server-authored block readback; smoke confirmed connect, chat echo, world block reads, and movement against newest Endstone.
- Follow-up tasks: decide whether to publish/push the root local fork changes or upstream them to PrismarineJS.

## Failure Summary

Not blocked.

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. No packet shapes changed.
- `[x]` Live test run. Endstone 0.11.3 / BDS 1.26.12.2 passed the focused chunk test for `MC_VERSION=1.26.10`.
- `[x]` Raw debug logs kept out of git.
