# Bedrock Relay Recorder

The relay recorder is a separate fallback for BDS versions that Endstone cannot hook. It uses `bedrock-protocol`'s `Relay` to sit between a real Bedrock client and a base BDS instance.

Topology:

```text
Real Bedrock Client -> bedrock-protocol Relay -> base BDS
```

For the current local `1.26.20.5` BDS instance:

```text
Base BDS: 127.0.0.1:19135
Relay:    127.0.0.1:19137
```

Start the relay:

```powershell
node scripts/recorded-bds-relay.js --version=1.26.20 --destination-port=19135 --listen-port=19137
```

Start with a relay scenario:

```powershell
node scripts/recorded-bds-relay.js --version=1.26.20 --destination-port=19135 --listen-port=19137 --scenario=capture-item-stack-request
```

The tester should connect to the relay, not directly to BDS:

```text
Server Address: 127.0.0.1
Port: 19137
```

For another device on the LAN, use the host machine's LAN IP and relay port:

```text
Server Address: <HOST_LAN_IP>
Port: 19137
```

Default output:

```text
logs/bedrock-relay-recording.jsonl
```

## Packet Filtering

Record only specific packet names:

```powershell
node scripts/recorded-bds-relay.js --packet-names=item_stack_request,item_stack_response
```

Record only one direction:

```powershell
node scripts/recorded-bds-relay.js --directions=serverbound
```

By default, binary fields such as chunk payloads are summarized with length and SHA-256. To include base64 payloads:

```powershell
node scripts/recorded-bds-relay.js --include-binary
```

For a smaller trace without decoded packet params:

```powershell
node scripts/recorded-bds-relay.js --no-packet-params
```

## Scenario Limits

Relay scenarios are packet-derived. Unlike Endstone scenarios, Relay cannot directly inspect BDS world blocks or player inventory.

Supported relay clearance conditions:

- `packet_seen`: `direction`, `name`, optional `count`.
- `manual`: never auto-clears.
- `all`: array of child conditions.
- `any`: array of child conditions.

Scenario commands are sent upstream as Bedrock `command_request` packets from the relayed player. This depends on the backend server accepting the player's command permission.

## Human Prompt

Use this when asking a human to test through the relay:

```text
Please connect with Minecraft Bedrock Edition.

1. Open Play.
2. Go to Servers.
3. Choose Add Server.
4. Server Name: bedrock-test relay
5. Server Address: <HOST_OR_LAN_IP>
6. Port: 19137
7. Join the server.

This is a relay recording run. Follow any in-game messages from the relay. When the relay says the scenario is complete, leave the game so the recording can finalize.
```

## Evidence Checklist

A valid relay scenario recording should include:

```text
relay_start
relay_connect
relay_join
scenario_start
step_start
packet
step_complete
scenario_complete
scenario_end
relay_disconnect
relay_stop
```

If no `relay_join` appears, the client did not complete login through the relay to the backend BDS.
