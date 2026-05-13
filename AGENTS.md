# Agent Notes

## Crafting

- For crafting changes, read `docs/in-dev/crafting-util-implementation-notes.md` before editing `src/builtins/crafting.js`. It explains how `mineflayer-crafting-util` is bridged into the Bedrock packet sender.

## Bedrock Protocol Sources

- For Bedrock protocol packet shapes, check the versioned `minecraft-data` sources before changing packet send/receive code.
- For the current test server version, use the symlinked package paths:
  - `node_modules/minecraft-data/minecraft-data/data/bedrock/1.21.130/proto.yml`
  - `node_modules/minecraft-data/minecraft-data/data/bedrock/1.21.130/types.yml`
- The pnpm store version currently installed is `minecraft-data@3.110.0`; avoid hard-coding older `.pnpm/minecraft-data@...` paths in notes or scripts.
- In particular, verify these schema entries when working on crafting, inventory, or trading behavior:
  - `packet_item_stack_request`
  - `packet_item_stack_response`
  - `ItemStackRequest`
  - `ItemStackResponses`
  - `StackRequestSlotInfo`
  - `FullContainerName`
  - `ContainerSlotType`

## Packet Round-Trip Checks

- Before testing packet behavior against Geyser, round-trip any new packet shape through the local `bedrock-protocol` serializer/deserializer. This catches malformed conditional fields earlier and with less server log noise.
- Use:

```powershell
node scripts/roundtrip-packet.js --example item_stack_swap
node scripts/roundtrip-packet.js --example item_stack_take
node scripts/roundtrip-packet.js --example item_stack_drop
```

- For custom packets, put a full packet object in JSON and pass the file:

```json
{
  "name": "item_stack_request",
  "params": {
    "requests": [{
      "request_id": 1,
      "actions": [{
        "type_id": "take",
        "count": 1,
        "source": {
          "slot_type": { "container_id": "hotbar", "dynamic_container_id": 0 },
          "slot": 0,
          "stack_id": 2
        },
        "destination": {
          "slot_type": { "container_id": "hotbar", "dynamic_container_id": 0 },
          "slot": 1,
          "stack_id": 0
        }
      }],
      "custom_names": [],
      "cause": "chat_public"
    }]
  }
}
```

```powershell
node scripts/roundtrip-packet.js .\path\to\packet.json
```

- What the round-trip does:
  - `createSerializer('1.21.130')` compiles the `minecraft-data` protocol schema used by `bedrock-protocol`.
  - `serializer.createPacketBuffer({ name, params })` writes the packet ID plus encoded packet body. If a required conditional branch is missing, this usually fails in protodef before any server run.
  - `createDeserializer('1.21.130')` reads the same bytes back.
  - `deserializer.parsePacketBuffer(buffer).data` shows the packet as the library will put it on the wire. Compare this parsed object to the intended shape.
- This check validates encoding shape, enum names, conditional bodies, and optional field layout. It does not prove Geyser will accept the request semantically; server acceptance still depends on stack IDs, slot IDs, inventory state, and game mode.

## Item Stack Request Rules

- Protocol enum fields must be passed as string names, not numeric ordinals. Protodef may encode numeric `type_id` values, but conditional branches like `if consume:` / `if take:` compare against enum names. Numeric action IDs can serialize only the action header and omit required action bodies, causing Geyser/Cloudburst decode errors such as `readerIndex + length exceeds writerIndex`.
- `StackRequestSlotInfo` uses:

```js
{
  slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
  slot: 0,
  stack_id: 2
}
```

- Do not use flattened fields such as `container: 'inventory'` for stack request slots.
- Include `FullContainerName.dynamic_container_id` explicitly when targeting current Geyser/Cloudburst unless a round-trip and server test prove omission is valid.
- `ItemStackRequest` uses `custom_names: []` and `cause: 'chat_public'`; do not use stale names like `strings` or `filter_strings`.
- In player-auth-input paths, `item_stack_request` is embedded in `player_auth_input`, but the standalone `item_stack_request` packet has the same `ItemStackRequest` structure and is a good first round-trip target for action shape validation.

## Inventory State Notes

- Preserve server-authoritative Bedrock stack identity from raw items into prismarine items:
  - `stackId` and `stack_id`
  - `networkId` and `network_id`
  - `blockRuntimeId` and `block_runtime_id`
  - `raw`
- `item_stack_response` may report main player inventory changes under `slot_type.container_id: 'hotbar'`, not only `'inventory'`. Treat both as updates to the local main inventory mirror when applying accepted responses.
- `destroy` item-stack-request actions are creative-inventory behavior. In survival tests, use `drop` for “remove from slot” behavior unless explicitly testing creative mode.
- Keep these states conceptually separate:
  - `inventory.js`: server-confirmed mirror
  - `inventory-simulation.js`: pure prediction/planning
  - `inventory-actions.js`: sends Bedrock requests, waits for response, then applies accepted server response data

## Local Geyser Code

- Treat Geyser as part of the system under test, not as a perfect oracle. After local packet round-trips pass and the packet shape matches `minecraft-data`, consider that a failure or suspicious `item_stack_response: ok` may be caused by Geyser routing or translator behavior.
- Example: enchanting requests sent through `PERFORM_ITEM_STACK_REQUEST` inside `player_auth_input` may be routed to `session.getPlayerInventoryHolder().translateRequests(...)` in `BedrockPlayerAuthInputTranslator.java` instead of the currently open enchanting inventory holder. That bypasses `EnchantingInventoryTranslator`, so a bare `craft_recipe` action can be accepted by the generic inventory translator without sending the Java `ServerboundContainerButtonClickPacket` that actually applies an enchant.
- For enchanting investigations, compare these paths:
  - `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/entity/player/input/BedrockPlayerAuthInputTranslator.java`
    - `PERFORM_ITEM_STACK_REQUEST` auth-input routing.
  - `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/BedrockItemStackRequestTranslator.java`
    - Standalone `ItemStackRequestPacket` routing through the active inventory holder.
  - `core/src/main/java/org/geysermc/geyser/translator/inventory/EnchantingInventoryTranslator.java`
    - Maps `recipeNetworkId` to the enchant option and sends the Java button click.
  - `core/src/main/java/org/geysermc/geyser/translator/inventory/InventoryTranslator.java`
    - Generic inventory request planning, where non-container-specific requests can appear accepted without doing the intended container action.
- A local Geyser checkout exists at:

```powershell
cd C:\Users\owner\Documents\github\bedrock-test\temp-geyser-inspect
```

- Useful entrypoints:
  - `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/entity/player/input/BedrockPlayerAuthInputTranslator.java`
    - Handles `player_auth_input`; look for `PERFORM_ITEM_STACK_REQUEST`.
  - `core/src/main/java/org/geysermc/geyser/translator/protocol/bedrock/BedrockItemStackRequestTranslator.java`
    - Handles standalone `ItemStackRequestPacket`.
  - `core/src/main/java/org/geysermc/geyser/inventory/InventoryHolder.java`
    - Contains `translateRequests(...)`.
  - `core/src/main/java/org/geysermc/geyser/translator/inventory/InventoryTranslator.java`
    - Core request/action validation and inventory translation logic.
- Fast navigation commands:

```powershell
rg -n "PERFORM_ITEM_STACK_REQUEST|ItemStackRequestPacket|translateRequests" temp-geyser-inspect\core\src\main\java
rg -n "TransferItemStackRequestAction|DestroyStackRequestAction|DropStackRequestAction" temp-geyser-inspect\core\src\main\java\org\geysermc\geyser\translator\inventory
rg -n "bedrockSlotToJava|javaSlotToBedrock|ContainerSlotType" temp-geyser-inspect\core\src\main\java\org\geysermc\geyser\translator\inventory
```

## Testing

- Before creating or changing tests, read `test/rules.md` for repository-specific test rules.
- When testing, the Bedrock server keeps the player connected for about 10-15 seconds after disconnect. If doing quick test successions, wait 3-5 seconds before trying after the first run.
- If a live test failure is unclear after the first focused run, inspect packet traffic before guessing or repeatedly changing tests. Run the test with `DEBUG=minecraft-protocol` to see every packet sent and received by the protocol layer.
- Avoid leaving unfiltered packet debug in normal iteration because the 20 TPS `player_auth_input` spam consumes too much context. Prefer filtering it out while watching the console:

```powershell
$env:DEBUG='minecraft-protocol'
node examples/crafting.js 2>&1 | Select-String -NotMatch 'player_auth_input'
```

- For longer investigations, log packet debug to a file and inspect it with `rg` or an editor:

```powershell
$env:DEBUG='minecraft-protocol'
node examples/crafting.js *> .\logs\crafting-example-debug.log
rg -n "item_stack|inventory|container|craft|error" .\logs\crafting-example-debug.log
```

- Create the `logs` directory first if it does not exist:

```powershell
New-Item -ItemType Directory -Force .\logs
```

- Keep the debug log local investigation output unless the test explicitly asserts on it. Do not commit large packet logs.
