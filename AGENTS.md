# Agent Notes

- For Bedrock protocol packet shapes, check the versioned `minecraft-data` sources before changing packet send/receive code. For the current test server version, use:
  - `node_modules/.pnpm/minecraft-data@3.109.1/node_modules/minecraft-data/minecraft-data/data/bedrock/1.21.130/proto.yml`
  - `node_modules/.pnpm/minecraft-data@3.109.1/node_modules/minecraft-data/minecraft-data/data/bedrock/1.21.130/types.yml`
- In particular, verify `packet_item_stack_request`, `packet_item_stack_response`, `ItemStackRequest`, `StackRequestSlotInfo`, `FullContainerName`, and `ContainerSlotType` there when working on crafting, inventory, or trading behavior.
- Before testing packet behavior against Geyser, round-trip any new packet shape through the local bedrock-protocol serializer/deserializer. This catches malformed conditional fields earlier and with less log noise than a server run. Example:

```powershell
@'
const { createSerializer, createDeserializer } = require('bedrock-protocol/src/transforms/serializer')
const serializer = createSerializer('1.21.130')
const deserializer = createDeserializer('1.21.130')

const packet = {
  name: 'item_stack_request',
  params: {
    requests: [{
      request_id: 1,
      actions: [{
        type_id: 'consume',
        count: 1,
        source: {
          slot_type: { container_id: 'hotbar', dynamic_container_id: 0 },
          slot: 0,
          stack_id: 2,
        },
      }],
      custom_names: [],
      cause: 'chat_public',
    }],
  },
}

const buffer = serializer.createPacketBuffer(packet)
console.log(buffer.toString('hex'))
console.log(JSON.stringify(deserializer.parsePacketBuffer(buffer).data.params, null, 2))
'@ | node -
```

- Protocol enum fields should be passed as their string names, not numeric ordinals. Protodef may encode a numeric `type_id`, but conditional branches like `if consume:` / `if take:` compare against the enum name. Numeric action IDs can therefore serialize only the action header and omit required bodies such as `StackRequestSlotInfo`, causing Geyser `readerIndex + length exceeds writerIndex` decode errors.
- For optional fields such as `FullContainerName.dynamic_container_id?: u32`, include the field explicitly when targeting current Geyser/Cloudburst versions unless the round-trip test proves omission is valid for that packet shape.

## Testing

When testing, the bedrock server keeps the player connected for ~10-15 seconds after disconnect. If we are doing quick test successions, just wait 3-5 seconds before trying, after your first run. 

Avoid running with unfiltered `DEBUG=minecraft-protocol` during normal test iteration because the 20 TPS `player_auth_input` spam consumes too much context. If packet debug is needed, filter out `player_auth_input`, for example:

```powershell
$env:DEBUG='minecraft-protocol'
node tests/test_crafting.js 2>&1 | Select-String -NotMatch 'player_auth_input'
```
