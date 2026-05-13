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

Decode packet records:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.21.130
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
6. Ask the tester to leave the game after the scenario says it is complete. Leaving writes the final `scenario_end` marker.
7. Stop the launcher with `Ctrl+C` or `/quit`.
8. Check the recording markers:

```powershell
rg -n '"type":"(scenario_start|step_start|step_complete|scenario_complete|scenario_end)"' .e2e-servers/endstone-bds/logs/packet-recorder.jsonl
```

9. Decode packets for analysis:

```powershell
node scripts/decode-endstone-packet-recording.js .e2e-servers/endstone-bds/logs/packet-recorder.jsonl 1.21.130 > logs/decoded-endstone-recording.jsonl
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

When you join, the server will teleport you to the scenario and show step instructions on screen and in chat. Complete only the current step it asks for. When it says the recording/scenario is complete, leave the game so the server can finalize the recording.
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
  "steps": [
    {
      "id": "first-step",
      "instructions": [
        "Do the first action."
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

Supported clearance conditions:

- `inventory_contains`: `item`, optional `count`.
- `inventory_lacks`: `item`, optional `count`.
- `block_is`: `position: [x, y, z]`, `block`.
- `player_at`: `position: [x, y, z]`, optional `radius`.
- `packet_seen`: `packet_id`, optional `direction`, optional `count`.
- `manual`: never auto-clears; useful while drafting.
- `all`: array of child conditions.
- `any`: array of child conditions.

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
