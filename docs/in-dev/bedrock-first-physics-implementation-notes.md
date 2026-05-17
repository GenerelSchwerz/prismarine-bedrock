# Bedrock-first physics implementation notes

This note records the local source pass used for the Bedrock physics implementation in `src/builtins/physics`.

## Sources checked

- `node_modules/minecraft-data/minecraft-data/data/bedrock/1.26.10/proto.yml`
  - `packet_player_auth_input`
  - `InputFlag`
  - `packet_correct_player_move_prediction`
  - `packet_set_movement_authority`
- `ref/bedrock-protocol-docs/json/CorrectPlayerMovePredictionPacket.json`
  - `Rotation` is documented as vehicle-only correction data, so player corrections should not change local look rotation.
- `node_modules/@nxg-org/mineflayer-util-plugin/lib/calcs/aabb.js`
  - Reused `AABB` for player and block collision volumes.
  - Reused `computeOffsetX`, `computeOffsetY`, `computeOffsetZ`, `extend`, `translate`, and `fromShape`.
- `node_modules/@nxg-org/mineflayer-physics-util/dist/physics/states/playerState.js`
  - Confirmed its control vector convention: `forward - back`, `left - right`.
  - Kept as reference material, but the active movement step is now Bedrock-first.
- `ref/boar/src/main/java/ac/boar/anticheat/player/BoarPlayer.java`
  - Jump handling uses `JUMPING` / `AUTO_JUMPING_IN_WATER` in fluids and `START_JUMPING` on ground.
  - Sprint jump adds horizontal velocity from yaw.
  - Movement speed is affected by friction, sprinting, effects, and ground state.
- `ref/boar/src/main/java/ac/boar/anticheat/prediction/engine/impl/GroundAndAirPredictionEngine.java`
  - Movement order is relative movement, collision/move, gravity, vertical drag, then horizontal drag from slipperiness.
- `ref/boar/src/main/java/ac/boar/anticheat/collision/Collider.java`
  - Collision clips Y, then horizontal axes, with a step-up retry when grounded and horizontally blocked.
- `ref/boar/src/main/java/ac/boar/anticheat/packets/input/legacy/LegacyAuthInputPackets.java`
  - Collision flags and packet delta are derived from the predicted movement rather than trusted from the client.
- `ref/geyser/core/src/main/java/org/geysermc/geyser/level/physics/CollisionManager.java`
  - Player box is 0.6 x 1.8.
  - Bedrock/Geyser step-up is 0.6.
  - Collision is resolved with AABB offset clipping and step-up comparison.

## Implementation shape

`src/builtins/physics/bedrock-physics-engine.js` is the active simulator. It does not wrap `BotcraftPhysics` for the actual tick. It keeps the tick order close to Boar/Geyser:

1. Normalize the local Bedrock input vector.
2. Apply jump or fluid upward impulse.
3. Apply yaw-relative acceleration from Bedrock controls.
4. Move through block collision shapes using `AABB` from `@nxg-org/mineflayer-util-plugin`.
5. Retry movement with a 0.6 block step-up when grounded and horizontally blocked.
6. Apply gravity, levitation/slow-falling handling, vertical drag, and horizontal drag.
7. Write back `position`, `velocity`, `onGround`, horizontal/vertical collision flags, and supporting block state.

`src/builtins/physics/input-controls.js` now sends Bedrock-local control vectors in `move_vector`, `analogue_move_vector`, and `raw_move_vector`. It also sets the directional and transition `InputFlag` bits from the 1.26.10 protocol schema, including `up`, `down`, `left`, `right`, `start_sprinting`, `stop_sprinting`, `start_sneaking`, `stop_sneaking`, and `start_jumping`.

`src/builtins/physics/index.js` still installs the Bedrock movement-state packet handlers from the existing adapter. Those handlers preserve useful Bedrock state from abilities, effects, metadata, velocity packets, game mode packets, and corrections. The tick itself now calls `createBedrockPhysicsEngine`.

## Important behavior boundaries

- This is a Bedrock-first player movement implementation, not a full Bedrock client clone.
- It currently relies on prismarine block collision `shapes`. Special block-specific behaviors are only covered where the local block data exposes enough information or where the behavior is generic, such as friction and climbable-name detection.
- Geyser/Boar both treat server corrections as authoritative. The plugin keeps that model: `move_player`, `respawn`, `correct_player_move_prediction`, and velocity hint packets reset or update local movement state. `correct_player_move_prediction` corrects position/ground state for player movement; it must not overwrite the bot's current pitch/yaw/headYaw unless vehicle correction semantics are explicitly implemented.
- `player_auth_input.delta` is generated from the simulated velocity after collision/drag. Boar explicitly corrects this field server-side because it is validation-sensitive.

## Follow-up candidates

- Add focused tests for flat-ground walking, jump arc, wall collision, and 0.6 block step-up against a synthetic prismarine world.
- Extend block behavior for scaffolding, powder snow, slime, honey, webs, and fluid height once those cases are needed.
- Feed accepted server `correct_player_move_prediction` offsets into a local verifier log so tuning changes can be compared against Geyser/Boar behavior.
