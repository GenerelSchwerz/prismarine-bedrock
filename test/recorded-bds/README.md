# Recorded BDS Scenarios

This directory contains Endstone-only scenarios for real Bedrock client packet recording. A scenario prepares a BDS world, tells the human tester what to do, advances through step clearance checks, and writes scenario markers into the same JSONL as packet hooks.

Run a scenario:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-planks-and-place
```

The scenario id resolves to:

```text
test/recorded-bds/scenarios/<id>.json
```

You can also pass an explicit JSON path:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=test/recorded-bds/scenarios/craft-planks-and-place.json
```

Default recording output:

```text
.e2e-servers/endstone-bds/logs/packet-recorder.jsonl
```

When a bot run might overlap with a human joining the same Endstone server, scope the recorder to the bot player so unrelated client packets are not captured:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --endstone-packet-recorder-player=OpBot
```

To keep every player while still getting clean per-player traces, split the recorder output:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --endstone-packet-recorder-split-by-player
```

This still writes the main `packet-recorder.jsonl` and also writes files such as `packet-recorder.OpBot.jsonl` beside it. The environment equivalents are `E2E_PACKET_RECORDER_PLAYERS=OpBot` and `E2E_PACKET_RECORDER_SPLIT_BY_PLAYER=1`.

Packet hook rows use `compact_packet_v1` to reduce repeated JSON keys. Scenario markers remain object records, while packets are arrays with this schema:

```text
["p",sequence,ts,direction,packet_id,sub_client_id,player,address,payload_base64,payload_size,payload_sha256]
```

`direction` is `r` for client-to-server receive hooks and `s` for server-to-client send hooks. Decode packet rows before inspecting fields:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10
```

The default decoded output is intentionally compact for agent and human inspection. It omits raw payload bytes and summarizes large packet bodies. Use `--full` only when the full decoded params are needed for a specific packet, and write that output to a file:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 --packet-ids=147 --full --out=logs/decoded-item-stack-requests.jsonl
```

Then search the decoded file:

```powershell
rg -n "craft_recipe|crafting_input|creative_output" logs/decoded-item-stack-requests.jsonl
```

For targeted packet and field queries, use the query helper instead of decoding broad full traces:

```powershell
node scripts/query-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 --packet-names=item_stack_response --field=params.responses.0.request_id --field=params.responses.0.status
node scripts/query-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 --packet-ids=147 --where=params.requests.0.request_id=4 --field=params.requests.0.actions
```

For longer investigations, generate a SQLite sidecar. Keep the compact JSONL as the raw capture and treat the SQLite file as a rebuildable query cache:

```powershell
node scripts/index-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 --out=logs/packet-recorder.sqlite
```

Use the DB query helper for event-bounded sampling and wildcard field predicates:

```powershell
node scripts/query-packet-db.js logs/packet-recorder.sqlite --after-event=step_start --after-where=step=open_table --before-event=step_complete --before-where=step=open_table --packet-names=player_auth_input --sample=20 --field=params.position --field=params.yaw
node scripts/query-packet-db.js logs/packet-recorder.sqlite --packet-names=item_stack_request --where=params.requests.*.actions.*.type_id=take --field=params.requests.0.request_id
```

Do not inspect raw recorder JSONL with broad `Get-Content`/`cat` during analysis. Use packet-id/name filters, compact decoder output, query field projections, `--out`, and `rg` against decoded summaries. The decoder and query helper stream input line-by-line, so filtered files can be generated without loading the whole recording into chat.

Decode only `player_auth_input` changes:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 --packet-ids=144
```

The decoder always prints `player_auth_input` as deltas. By default it ignores tick and look/movement fields such as `camera_orientation`, `interact_rotation`, `pitch`, `yaw`, `position`, and `delta`, so semantic changes like flags and embedded requests remain visible. To replace the ignored field set, pass comma-separated field names or dot paths, for example `--player-auth-input-delta-ignore=tick,position,delta`.

## Recorded BDS Workflow

Use this workflow whenever a bot behavior should be grounded in real Bedrock client behavior. The shared goal is packet-by-packet evidence for the complete user-visible action, not a sequence of isolated one-packet fixes.

There are two modes:

- **Feature implementation**: use when the goal is reusable library behavior in `src/`. The output is production code plus focused static/live tests.
- **Agentic recreation gym**: use when the goal is to make a bot recreate a human scenario first. The output starts as an isolated script under `test/recorded-bds/bots/<scenario>.js`; promotion into `src/` waits until the bot run completes and packet comparison passes.

### Triggers

This workflow is intended to be agent-triggerable from natural language. A prompt like this should start the workflow:

```text
Launch a new scenario. I want to sprint forward, then sprint into water. We should see the pose of the player change into swimming, from standing.
```

Explicit trigger phrases such as `Feature request workflow`, `Use the feature-to-recorded-test workflow`, `Recorded-test workflow`, `Scenario-to-test workflow`, and `Capture-driven feature workflow` start feature implementation mode. Requests to launch, create, capture, compare, or recreate a human scenario start agentic recreation gym mode unless the user asks for direct library implementation.

### Shared Setup

1. Capture the request in the matching `docs/tasks/TASK-NN-*.md` file. If the request compounds on active work, keep the same task log and append the new scenario, owned files, and resume step instead of starting a disconnected task.
2. Resolve a stable scenario id. If `test/recorded-bds/scenarios/<id>.json` exists, use it; otherwise author it.
3. Design the smallest complete real-client scenario that demonstrates the behavior from preconditions through server acknowledgement and resulting state. Prefer deterministic setup commands, one visible player action per step, and clearance checks that prove the action happened through server state plus relevant packets.
4. Run JSON parsing or other cheap static checks before asking for a live client run.
5. Capture or reuse a completed human run. Keep raw packet JSONL, SQLite sidecars, decoded traces, and comparison output under `logs/` or `.e2e-servers/`.
6. Decode and index the recording. Build an ordered trace map for the whole action: scenario markers, relevant clientbound setup/state packets, outbound request packets, embedded `player_auth_input` data, response packets, inventory/world-state updates, request ids, slot/container ids, and status behavior. Do not commit full packet dumps.
7. Capture, decode, or index the current bot trace for the same scenario and compare it against the live-client trace packet by packet.
8. Record matching packets, missing bot packets, extra bot packets, field mismatches, request/response id mismatches, and intentional deviations in the task log.

When the next requested feature builds on the current one, fold it into the same cycle: extend the scenario or add a neighboring scenario, reuse existing decoded evidence when it still applies, and keep the implementation/test plan in the same task log unless the new work has a separate ownership boundary.

### Feature Implementation Mode

Use this mode when a requested bot feature should be implemented in the library after being grounded in recorded BDS behavior.

1. Implement bot behavior from the trace map. Fixing one small packet mismatch is acceptable as an increment, but do not stop there unless the updated trace map says the remaining mismatches are understood, intentionally deferred, or blocked.
2. Create tests from the distilled evidence. Use static tests for packet builders, planners, and pure helpers; use live tests for actual bot behavior against both Java/Geyser and Endstone/BDS when the feature crosses client-server behavior.
3. Verify locally in this order when applicable: packet round-trip, focused static tests, focused live Endstone test, focused live Geyser test, then the broader relevant test script.
4. Update the task log after each scenario run, packet conclusion, code change, and test result. Mark the feature complete only after the test evidence covers both recorded BDS behavior and bot behavior on the target servers, or record the exact blocker.

### Agentic Recreation Gym Mode

Use this mode when a real Bedrock client scenario should become an iterative bot recreation target. The workflow keeps packet recreation experiments isolated in scenario-local bot scripts until the behavior is proven by a completed bot run and a human-vs-bot packet comparison.

The agent should turn the request into a stable scenario id, create or reuse the scenario JSON, capture or reuse the human run, scaffold the bot recreation, run comparison, and iterate until completion or a recorded blocker.

Check the current state for a scenario:

```powershell
node scripts/recorded-bds-gym.js status --scenario=craft-planks-and-place
```

If the scenario does not exist, author `test/recorded-bds/scenarios/<id>.json` first. Keep the scenario deterministic: setup commands, one visible action per step, and clearance checks that prove server-visible success.

Capture or reuse a completed human run:

```powershell
node scripts/recorded-bds-gym.js record-human --scenario=craft-planks-and-place
```

This reuses the latest completed human run when one exists. Otherwise it launches Endstone/BDS with the scenario, writes raw packets under `logs/recorded-bds/<scenario>/human/<run-id>/packets.jsonl`, waits for the launcher to stop after the completed player leaves, validates `scenario_complete` plus `scenario_end status=complete`, and builds `packets.sqlite`.

Create the isolated bot script:

```powershell
node scripts/recorded-bds-gym.js scaffold-bot --scenario=craft-planks-and-place
```

The script is written to `test/recorded-bds/bots/<scenario>.js`. Prefer existing bot APIs first. If existing APIs cannot reproduce the human trace, write manual packet-level behavior in the scenario bot script or `test/recorded-bds/bots/helpers.js`. Do not move exploratory packet hacks into `src/` yet.

Run the bot against the same scenario:

```powershell
node scripts/recorded-bds-gym.js run-bot --scenario=craft-planks-and-place
```

The launcher scopes packet recording to `OpBot`, writes bot packets under `logs/recorded-bds/<scenario>/bot/<run-id>/packets.jsonl`, validates completion markers, and builds a bot SQLite sidecar.

Compare human and bot traces:

```powershell
node scripts/recorded-bds-gym.js compare --scenario=craft-planks-and-place
```

This writes `logs/recorded-bds/<scenario>/compare/<run-id>.json` and `.md`. The comparison is step-bounded by `step_start` and `step_complete`, focuses on packets relevant to behavior, ignores routine jitter such as timestamps and tick/look drift, and reports missing packets, extra packets, decoded field mismatches, and item-stack request/response summaries.

For one-command bot iteration after human evidence exists:

```powershell
node scripts/recorded-bds-gym.js loop --scenario=craft-planks-and-place
```

Promotion into the library is a separate checkpoint:

```powershell
node scripts/recorded-bds-gym.js promote --scenario=craft-planks-and-place
```

`promote` only reports ready when the latest bot run completed and the latest comparison passed. After that, compare the scenario-local implementation against existing library APIs, move only the proven general behavior into `src/`, add focused tests, then rerun the scenario using the promoted API instead of local packet code.

To compare explicit SQLite sidecars:

```powershell
node scripts/compare-packet-dbs.js --human=logs/recorded-bds/<scenario>/human/<run>/packets.sqlite --bot=logs/recorded-bds/<scenario>/bot/<run>/packets.sqlite --scenario=<id> --out-json=logs/recorded-bds/<scenario>/compare/manual.json --out-md=logs/recorded-bds/<scenario>/compare/manual.md
```

## Human Test Runbook

These scenarios require a real Bedrock client. The server-side harness can prepare the world and detect completion, but the actual user action is manual.

### Agent/operator steps

1. Pick the scenario id from `test/recorded-bds/scenarios/`.
2. Start a fresh Endstone superflat server:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-scenario=craft-planks-and-place
```

3. Wait for the launcher to print that `endstone-1` is ready or for BDS to print `Server started.`.
4. Give the human tester the server address and port.

For a Bedrock client on the same Windows machine:

```text
Server Address: 127.0.0.1
Port: 19132
```

For a Bedrock client on another device on the same LAN, use the host machine's LAN IPv4 address instead of `127.0.0.1`. One PowerShell way to find it:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object IPAddress,InterfaceAlias
```

5. Watch the launcher/server console while the tester joins and completes the steps.
6. Ask the tester to leave the game after the scenario says it is complete. Leaving writes the final `scenario_end` marker, and the e2e launcher stops the scenario server automatically.
7. Stop the launcher with `Ctrl+C` or `/quit`.
8. Check the recording markers:

```powershell
rg -n '"type":"(scenario_start|step_start|step_complete|scenario_complete|scenario_end)"' .e2e-servers/endstone-bds/logs/packet-recorder.jsonl
```

9. Decode packets for analysis:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.26.10 > logs/decoded-endstone-recording.jsonl
```

Keep decoded/raw recordings under `logs/` unless you intentionally distill them into a committed fixture or task note.

### Copy-paste prompt for the tester

Use this when asking a human to connect:

```text
Please connect with Minecraft Bedrock Edition.

1. Open Play.
2. Go to Servers.
3. Choose Add Server.
4. Server Name: bedrock-test scenario
5. Server Address: <HOST_OR_LAN_IP>
6. Port: 19132
7. Join the server.

When you join, the server will teleport you to the scenario and show step instructions on screen and in chat. Complete only the current step it asks for. When it says the recording/scenario is complete, leave the game so the server can finalize the recording and shut down.
```

Replace `<HOST_OR_LAN_IP>` with `127.0.0.1` if the Bedrock client is on the same machine as the server, or with the host machine's LAN IPv4 address if the client is on another device.

### Expected tester experience

- The player should be automatically operator-capable for the scenario.
- The player should be moved to the scenario location after joining.
- The player should see one step at a time through title/tip/chat messages.
- After each clearance condition passes, the server should announce that the step is complete.
- After the final step, the server should announce that the scenario is complete.
- The player should leave after the completion message.

### Evidence checklist

A valid first recording should contain these JSONL markers in order:

```text
recorder_start
scenario_loaded
player_join
scenario_start
step_start
step_complete
step_start
step_complete
scenario_complete
scenario_end
player_quit
recorder_stop
```

The current sample scenario is still considered unproven until a real Bedrock client run produces those markers and the decoded packet trace is reviewed.

## Scenario Format

```json
{
  "id": "example",
  "autoOp": true,
  "gamemode": "survival",
  "spawn": [0, 65, 0, 0, 0],
  "setupCommands": [
    "clear {player}"
  ],
  "commands": [
    {
      "hook": "scenario_start",
      "delaySeconds": 1,
      "command": "say scenario {id} has started for {playerName}"
    }
  ],
  "debugRecordEvents": [],
  "steps": [
    {
      "id": "first-step",
      "instructions": [
        "Do the first action."
      ],
      "commands": [
        {
          "hook": "step_start",
          "delayTicks": 20,
          "command": "playsound random.orb {player}"
        }
      ],
      "clearance": {
        "type": "packet_seen",
        "direction": "receive",
        "packet_id": 147,
        "count": 1
      }
    }
  ]
}
```

Command placeholders:

- `{player}`: quoted player name, safe for commands.
- `{playerName}`: raw player name.
- `{id}`, `{scenario}`, `{scenarioId}`: scenario id.
- `{hook}`: current scenario event hook for entries in `commands`.
- `{step}`: current step id for step hooks.
- `{stepIndex}`: zero-based current step index for step hooks.

### Scenario event hooks

Scenario `commands` entries can run at these hooks. Each entry may use `hook`, `event`, or `on` to name the hook. Root-level `commands` default to `scenario_start`; step-level `commands` default to `step_start`.

| Hook | Where it can be declared | When it runs | Context |
| --- | --- | --- | --- |
| `player_join` | Root `commands` | After a recordable player joins and the scenario session is created, before auto-op, legacy root setup commands, gamemode, spawn teleport, and `scenario_start`. | Player only; no current step. |
| `scenario_start` | Root `commands` | After legacy root `setupCommands`, gamemode, spawn teleport, and the `scenario_start` marker. | Player only; no current step. |
| `step_start` | Root `commands`, optionally filtered with `step`/`stepIndex`, or a step's `commands` | After legacy step `setupCommands` and the `step_start` marker, before instructions are sent and before immediate clearance evaluation. | Player plus current step. |
| `step_complete` | Root `commands`, optionally filtered with `step`/`stepIndex`, or a step's `commands` | After the `step_complete` marker and legacy `onCompleteCommands`, before the next step starts. | Player plus completed step. |
| `scenario_complete` | Root `commands` | After the final step completes, the `scenario_complete` marker is written, and the completion notice is sent. | Player only; no current step. |

Command scheduling fields:

- `command`: one command string.
- `commands`: array of command strings, useful when several commands share the same hook and delay.
- `delayTicks`: delay in server ticks.
- `delaySeconds`: delay in seconds; converted to ticks at 20 ticks per second.
- `delayMs`: delay in milliseconds; rounded up to full ticks.
- `step`: optional step id filter for root commands on `step_start` or `step_complete`.
- `stepIndex`: optional zero-based step index filter for root commands on `step_start` or `step_complete`.

Scheduled command examples:

```json
{
  "commands": [
    {
      "hook": "player_join",
      "command": "say {playerName} joined the recording scenario"
    },
    {
      "hook": "step_start",
      "step": "wait-for-door",
      "delaySeconds": 3,
      "command": "setblock 4 64 0 air"
    },
    {
      "hook": "scenario_complete",
      "delayTicks": 40,
      "commands": [
        "say scenario complete for {playerName}",
        "gamemode creative {player}"
      ]
    }
  ],
  "steps": [
    {
      "id": "wait-for-door",
      "commands": [
        {
          "hook": "step_start",
          "delayMs": 500,
          "command": "title {player} actionbar Door opens soon"
        }
      ]
    }
  ]
}
```

Legacy command fields remain supported:

- Root `setupCommands` run immediately during scenario startup, before `scenario_start`.
- Step `setupCommands` run immediately before the `step_start` marker.
- Step `onCompleteCommands` run immediately after the `step_complete` marker.

Supported clearance conditions:

- `inventory_contains`: `item`, optional `count`.
- `inventory_lacks`: `item`, optional `count`.
- `block_is`: `position: [x, y, z]`, `block`.
- `player_at`: `position: [x, y, z]`, optional `radius`.
- `position_changed`: optional `from: [x, y, z]`, optional `minDistance`. When `from` is omitted, the step start position is used.
- `packet_seen`: `packet_id`, optional `direction`, optional `count`.
- `command_seen`: optional `contains`, optional `equals` or `command`, optional `count`. Matches scenario commands dispatched during the current step.
- `entity_exists`: optional `entity`, optional `name`, optional `tag`, optional `position: [x, y, z]`, optional `radius`, optional `count`.
- `entity_lacks`: same fields as `entity_exists`, clears when too few matching entities exist.
- `entity_dead`: alias for `entity_lacks`, intended for tagged or named scenario targets.
- `held_item_is`: `item`.
- `container_open`: optional `container`, optional `packet_id`, optional `direction`, optional `count`. Defaults to the BDS `container_open` packet, `packet_id: 46`, `direction: "send"`.
- `effect_active`: `effect`.
- `effect_lacks`: `effect`.
- `time_elapsed`: `seconds`, or `ms`, or `ticks`.
- `endstone_event_seen`: `event`, optional `count`, optional `withinSeconds`, optional `where`.
- `manual`: never auto-clears; useful while drafting.
- `all`: array of child conditions.
- `any`: array of child conditions.

Examples:

```json
{ "type": "time_elapsed", "seconds": 3 }
{ "type": "held_item_is", "item": "minecraft:bow" }
{ "type": "container_open", "container": "crafting_table" }
{ "type": "entity_exists", "entity": "minecraft:cow", "tag": "scenario_target", "position": [3, 64, 0], "radius": 5 }
{ "type": "entity_dead", "entity": "minecraft:cow", "tag": "scenario_target" }
{ "type": "effect_active", "effect": "minecraft:speed" }
{ "type": "position_changed", "minDistance": 4 }
{ "type": "command_seen", "contains": "setblock", "count": 1 }
{ "type": "endstone_event_seen", "event": "PlayerJumpEvent", "withinSeconds": 2 }
{ "type": "endstone_event_seen", "event": "PlayerMoveEvent", "where": { "distance": { "gte": 3 }, "to.y": { "gt": 65 } } }
```

### Endstone event clearances

`endstone_event_seen` listens to Endstone's semantic event stream for only the event names referenced by the active scenario. Event tracking is internal and silent by default; matching event data appears in the `step_complete.reason` when the clearance passes.

Supported event names:

- `PlayerMoveEvent`
- `PlayerJumpEvent`
- `PlayerInteractEvent`
- `PlayerItemHeldEvent`
- `PlayerItemConsumeEvent`
- `PlayerDeathEvent`
- `PlayerRespawnEvent`
- `PlayerCommandEvent`
- `PlayerChatEvent`

The optional `where` object matches normalized event data by dotted paths. Scalar values require equality. Numeric values may use `gt`, `gte`, `lt`, or `lte`. Strings may use `contains`.

```json
{
  "type": "endstone_event_seen",
  "event": "PlayerMoveEvent",
  "count": 1,
  "withinSeconds": 2,
  "where": {
    "distance": { "gte": 3 },
    "to.y": { "gt": 65 }
  }
}
```

Debug event recording is opt-in:

```json
{
  "debugRecordEvents": ["PlayerJumpEvent", "PlayerMoveEvent"]
}
```

Only listed event names write `endstone_event` JSONL records. Keep high-frequency events such as `PlayerMoveEvent` out of `debugRecordEvents` unless you are doing a focused short run.

Scenario markers written to JSONL include:

- `scenario_loaded`
- `scenario_start`
- `step_start`
- `step_complete`
- `scenario_complete`
- `scenario_end`

## Authoring Notes

Keep setup deterministic. Prefer `clear`, `give`, `setblock`, `fill`, `time set`, and `tp` commands in `setupCommands`.

Use `packet_seen` when the exact BDS packet is the point of the scenario, and combine it with a state clearance using `all` when possible.

Use Endstone/BDS item and block identifiers in clearance checks. If an identifier is unclear, run a broad packet recording first, inspect the decoded trace, and then tighten the scenario.
