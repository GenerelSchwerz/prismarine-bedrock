const assert = require('assert')
const { execFileSync } = require('child_process')
const path = require('path')

describe('endstone packet recorder', function () {
  it('matches held_item_is against Endstone inventory item identifiers', function () {
    const root = path.join(__dirname, '..', '..')
    const python = process.env.PYTHON || 'python'
    const script = String.raw`
import sys
import types
from pathlib import Path

event = types.ModuleType("endstone.event")
for name in [
    "ActorDeathEvent", "PacketReceiveEvent", "PacketSendEvent", "PlayerChatEvent", "PlayerCommandEvent",
    "PlayerDeathEvent", "PlayerInteractEvent", "PlayerItemConsumeEvent",
    "PlayerItemHeldEvent", "PlayerJoinEvent", "PlayerJumpEvent", "PlayerMoveEvent",
    "PlayerQuitEvent", "PlayerRespawnEvent"
]:
    setattr(event, name, type(name, (), {}))
event.event_handler = lambda fn: fn

plugin = types.ModuleType("endstone.plugin")
plugin.Plugin = type("Plugin", (), {})

endstone = types.ModuleType("endstone")
endstone.event = event
endstone.plugin = plugin
sys.modules["endstone"] = endstone
sys.modules["endstone.event"] = event
sys.modules["endstone.plugin"] = plugin

sys.path.insert(0, str(Path("scripts/endstone-packet-recorder/src").resolve()))
from endstone_packet_recorder.recorder import PacketRecorderPlugin

class ItemType:
    def __init__(self, identifier):
        self.id = identifier
    def __str__(self):
        return "<ItemType object>"

class ItemStack:
    def __init__(self, identifier, amount=1):
        self.type = ItemType(identifier)
        self.amount = amount
    def __str__(self):
        return "<ItemStack object>"

class Inventory:
    def __init__(self):
        self.held_item_slot = 1
        self.slots = [ItemStack("minecraft:arrow", 16), ItemStack("minecraft:bow", 1)]
    @property
    def item_in_main_hand(self):
        return self.slots[self.held_item_slot]
    def get_item(self, slot):
        return self.slots[slot]

class SlotOnlyInventory:
    def __init__(self):
        self.held_item_slot = 1
        self.slots = [ItemStack("minecraft:arrow", 16), ItemStack("minecraft:bow", 1)]
    def get_item(self, slot):
        return self.slots[slot]

class PlayerWithStaleHeldItem:
    def __init__(self):
        self.inventory = Inventory()
        self.selected_item = ItemStack("minecraft:air", 1)

recorder = object.__new__(PacketRecorderPlugin)

passed, reason = recorder._clear_held_item_is(
    types.SimpleNamespace(inventory=Inventory()),
    {"type": "held_item_is", "item": "minecraft:bow"}
)
assert passed, reason
assert reason["actual"] == "minecraft:bow", reason

passed, reason = recorder._clear_held_item_is(
    types.SimpleNamespace(inventory=SlotOnlyInventory()),
    {"type": "held_item_is", "item": "bow"}
)
assert passed, reason

passed, reason = recorder._clear_held_item_is(
    PlayerWithStaleHeldItem(),
    {"type": "held_item_is", "item": "minecraft:bow"}
)
assert passed, reason
`

    assert.doesNotThrow(() => execFileSync(python, ['-c', script], { cwd: root, stdio: 'pipe' }))
  })

  it('matches entity_exists against Endstone level actors', function () {
    const root = path.join(__dirname, '..', '..')
    const python = process.env.PYTHON || 'python'
    const script = String.raw`
import sys
import types
from pathlib import Path

event = types.ModuleType("endstone.event")
for name in [
    "ActorDeathEvent", "PacketReceiveEvent", "PacketSendEvent", "PlayerChatEvent", "PlayerCommandEvent",
    "PlayerDeathEvent", "PlayerInteractEvent", "PlayerItemConsumeEvent",
    "PlayerItemHeldEvent", "PlayerJoinEvent", "PlayerJumpEvent", "PlayerMoveEvent",
    "PlayerQuitEvent", "PlayerRespawnEvent"
]:
    setattr(event, name, type(name, (), {}))
event.event_handler = lambda fn: fn

plugin = types.ModuleType("endstone.plugin")
plugin.Plugin = type("Plugin", (), {})

endstone = types.ModuleType("endstone")
endstone.event = event
endstone.plugin = plugin
sys.modules["endstone"] = endstone
sys.modules["endstone.event"] = event
sys.modules["endstone.plugin"] = plugin

sys.path.insert(0, str(Path("scripts/endstone-packet-recorder/src").resolve()))
from endstone_packet_recorder.recorder import PacketRecorderPlugin

class Location:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

class Actor:
    type = "minecraft:cow"
    location = Location(0, 65, 8)
    scoreboard_tags = []

class DeadActor:
    type = "minecraft:cow"
    location = Location(0, 65, 8)
    scoreboard_tags = []
    health = 0

class Level:
    actors = [Actor(), DeadActor()]

class Player:
    level = Level()

recorder = object.__new__(PacketRecorderPlugin)
passed, reason = recorder._clear_entity_exists(
    Player(),
    {"type": "entity_exists", "entity": "minecraft:cow", "position": [0, 65, 8], "radius": 3}
)
assert passed, reason
assert reason["seen"] == 1, reason

passed, reason = recorder._clear_entity_exists(
    Player(),
    {"type": "entity_dead", "entity": "minecraft:cow", "position": [0, 65, 8], "radius": 3, "count": 2}
)
assert not passed, reason
assert reason["seen"] == 1, reason
`

    assert.doesNotThrow(() => execFileSync(python, ['-c', script], { cwd: root, stdio: 'pipe' }))
  })
})
