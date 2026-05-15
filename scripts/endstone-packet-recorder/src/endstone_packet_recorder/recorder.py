import base64
import hashlib
import json
import math
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from endstone.event import (
    PacketReceiveEvent,
    PacketSendEvent,
    PlayerChatEvent,
    PlayerCommandEvent,
    PlayerDeathEvent,
    PlayerInteractEvent,
    PlayerItemConsumeEvent,
    PlayerItemHeldEvent,
    PlayerJoinEvent,
    PlayerJumpEvent,
    PlayerMoveEvent,
    PlayerQuitEvent,
    PlayerRespawnEvent,
    event_handler
)
from endstone.plugin import Plugin


DEFAULT_CHECK_PERIOD_TICKS = 10
DEFAULT_RECENT_EVENT_LIMIT = 100
TICKS_PER_SECOND = 20
SUPPORTED_COMMAND_HOOKS = {
    "player_join",
    "scenario_start",
    "step_start",
    "step_complete",
    "scenario_complete"
}


class PacketRecorderPlugin(Plugin):
    api_version = "0.10"

    def on_enable(self) -> None:
        if os.environ.get("E2E_ENDSTONE_PACKET_RECORDER") != "1":
            self.logger.info("Packet recorder is installed but inactive.")
            return

        self._sequence = 0
        self._lock = threading.Lock()
        self._packet_ids = self._parse_packet_ids(os.environ.get("E2E_PACKET_RECORDER_PACKET_IDS", ""))
        self._player_filter = self._parse_names(os.environ.get("E2E_PACKET_RECORDER_PLAYERS", ""))
        self._split_by_player = os.environ.get("E2E_PACKET_RECORDER_SPLIT_BY_PLAYER", "") == "1"
        self._record_file = Path(os.environ.get("E2E_PACKET_RECORD_FILE", "logs/packet-recorder.jsonl"))
        self._record_file.parent.mkdir(parents=True, exist_ok=True)
        self._handle = self._record_file.open("a", encoding="utf8")
        self._player_handles = {}
        self._scenario = self._load_scenario()
        self._event_interest = self._collect_scenario_event_interest(self._scenario)
        self._debug_record_events = self._parse_event_names(self._scenario.get("debugRecordEvents", [])) if self._scenario else set()
        self._recent_event_limit = int(self._scenario.get("recentEventLimit", DEFAULT_RECENT_EVENT_LIMIT)) if self._scenario else DEFAULT_RECENT_EVENT_LIMIT
        self._sessions = {}
        self._check_task = None
        self._scheduled_command_tasks = []

        self.register_events(self)
        self._write({
            "type": "recorder_start",
            "packet_ids": sorted(self._packet_ids) if self._packet_ids is not None else None,
            "players": sorted(self._player_filter) if self._player_filter is not None else None,
            "split_by_player": self._split_by_player,
            "packet_record_format": "compact_packet_v1",
            "packet_record_schema": [
                "tag",
                "sequence",
                "ts",
                "direction",
                "packet_id",
                "sub_client_id",
                "player",
                "address",
                "payload_base64",
                "payload_size",
                "payload_sha256"
            ],
            "scenario": self._scenario.get("id") if self._scenario else None
        })

        if self._scenario:
            self._write({
                "type": "scenario_loaded",
                "scenario": self._scenario.get("id"),
                "step_count": len(self._scenario.get("steps", [])),
                "endstone_events": sorted(self._event_interest),
                "debug_record_events": sorted(self._debug_record_events)
            })
            period = int(self._scenario.get("checkPeriodTicks", DEFAULT_CHECK_PERIOD_TICKS))
            self._check_task = self.server.scheduler.run_task(self, self._check_sessions, delay=period, period=period)

        self.logger.info(f"Recording Bedrock packets to {self._record_file}")

    def on_disable(self) -> None:
        if getattr(self, "_check_task", None) is not None:
            self._check_task.cancel()
            self._check_task = None
        for task in getattr(self, "_scheduled_command_tasks", []):
            try:
                task.cancel()
            except Exception:
                pass
        self._scheduled_command_tasks = []

        handle = getattr(self, "_handle", None)
        if handle is None:
            return
        self._write({"type": "recorder_stop"})
        for player_handle in getattr(self, "_player_handles", {}).values():
            player_handle.close()
        self._player_handles = {}
        handle.close()
        self._handle = None

    @event_handler
    def on_player_join(self, event: PlayerJoinEvent) -> None:
        player = getattr(event, "player", None)
        player_name = self._player_name(player)
        if not self._should_record_player(player_name):
            return
        self._write({
            "type": "player_join",
            "player": player_name
        })
        if player is not None and self._scenario:
            self._start_scenario(player)

    @event_handler
    def on_player_quit(self, event: PlayerQuitEvent) -> None:
        player = getattr(event, "player", None)
        player_name = self._player_name(player)
        if not self._should_record_player(player_name):
            return
        session = self._sessions.pop(player_name, None) if player_name else None
        if session is not None:
            self._write({
                "type": "scenario_end",
                "scenario": self._scenario.get("id") if self._scenario else None,
                "player": player_name,
                "status": session.get("status", "abandoned"),
                "completed_steps": session.get("step_index", -1) + (1 if session.get("status") == "complete" else 0)
            })
        self._write({
            "type": "player_quit",
            "player": player_name
        })

    @event_handler
    def on_packet_receive(self, event: PacketReceiveEvent) -> None:
        self._record_packet("receive", event)

    @event_handler
    def on_packet_send(self, event: PacketSendEvent) -> None:
        self._record_packet("send", event)

    @event_handler
    def on_player_move(self, event: PlayerMoveEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_jump(self, event: PlayerJumpEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_interact(self, event: PlayerInteractEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_item_held(self, event: PlayerItemHeldEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_item_consume(self, event: PlayerItemConsumeEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_death(self, event: PlayerDeathEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_respawn(self, event: PlayerRespawnEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_command(self, event: PlayerCommandEvent) -> None:
        self._record_endstone_event(event)

    @event_handler
    def on_player_chat(self, event: PlayerChatEvent) -> None:
        self._record_endstone_event(event)

    def _record_packet(self, direction: str, event: Any) -> None:
        packet_id = int(event.packet_id)
        player_name = self._player_name(getattr(event, "player", None))
        self._count_step_packet(player_name, direction, packet_id)

        if self._packet_ids is not None and packet_id not in self._packet_ids:
            return
        if not self._should_record_player(player_name):
            return

        payload = bytes(event.payload)
        self._write_packet_row([
            "p",
            "r" if direction == "receive" else "s",
            packet_id,
            int(getattr(event, "sub_client_id", 0)),
            player_name,
            str(getattr(event, "address", "")),
            base64.b64encode(payload).decode("ascii"),
            len(payload),
            hashlib.sha256(payload).hexdigest()
        ], player_name)

    def _record_endstone_event(self, event: Any) -> None:
        event_name = event.__class__.__name__
        if event_name not in self._event_interest and event_name not in self._debug_record_events:
            return

        player = self._safe_get(event, "player")
        player_name = self._player_name(player)
        if not self._should_record_player(player_name):
            return
        session = self._sessions.get(player_name) if player_name else None
        if session is None or session.get("status") != "active":
            return

        record = {
            "ts": time.time(),
            "event": event_name,
            "player": player_name,
            "data": self._normalize_endstone_event(event, event_name, player_name)
        }
        recent = session.setdefault("recent_events", [])
        recent.append(record)
        if len(recent) > self._recent_event_limit:
            del recent[:-self._recent_event_limit]

        if event_name in self._debug_record_events:
            self._write({
                "type": "endstone_event",
                "scenario": self._scenario.get("id") if self._scenario else None,
                "player": player_name,
                "event": event_name,
                "data": record["data"]
            })

        if player is not None:
            self._check_player_session(player, session)

    def _load_scenario(self) -> Optional[Dict[str, Any]]:
        raw = os.environ.get("E2E_ENDSTONE_SCENARIO", "").strip()
        if not raw:
            return None

        scenario_path = self._resolve_scenario_path(raw)
        with scenario_path.open("r", encoding="utf8") as handle:
            scenario = json.load(handle)

        if not isinstance(scenario, dict):
            raise ValueError(f"Scenario must be a JSON object: {scenario_path}")
        if not scenario.get("id"):
            scenario["id"] = scenario_path.stem
        if not isinstance(scenario.get("steps"), list) or not scenario["steps"]:
            raise ValueError(f"Scenario must define a non-empty steps array: {scenario_path}")
        scenario["_path"] = str(scenario_path)
        return scenario

    def _resolve_scenario_path(self, value: str) -> Path:
        candidates = []
        raw = Path(value)
        candidates.append(raw)
        if raw.suffix != ".json":
            candidates.append(Path(f"{value}.json"))

        repo_root = os.environ.get("E2E_REPO_ROOT")
        if repo_root:
            scenarios_dir = Path(repo_root) / "test" / "recorded-bds" / "scenarios"
            candidates.append(scenarios_dir / value)
            candidates.append(scenarios_dir / f"{value}.json")

        for candidate in candidates:
            if candidate.is_file():
                return candidate.resolve()

        rendered = ", ".join(str(candidate) for candidate in candidates)
        raise FileNotFoundError(f"Could not resolve E2E_ENDSTONE_SCENARIO={value!r}; tried {rendered}")

    def _start_scenario(self, player: Any) -> None:
        player_name = self._player_name(player)
        if not player_name:
            return

        session = {
            "player": player_name,
            "step_index": -1,
            "status": "active",
            "packet_counts": {},
            "command_history": [],
            "recent_events": []
        }
        self._sessions[player_name] = session
        self._run_hook_commands("player_join", player, session)

        if self._scenario.get("autoOp", True):
            self._op_player(player)

        for command in self._scenario.get("setupCommands", []):
            self._dispatch_command(command, player)

        gamemode = self._scenario.get("gamemode")
        if gamemode:
            self._dispatch_command(f"gamemode {gamemode} {{player}}", player)

        spawn = self._scenario.get("spawn") or self._scenario.get("position")
        if spawn:
            self._teleport_player(player, spawn)

        self._write({
            "type": "scenario_start",
            "scenario": self._scenario.get("id"),
            "player": player_name,
            "path": self._scenario.get("_path")
        })
        self._run_hook_commands("scenario_start", player, session)
        self._start_next_step(player, session)

    def _start_next_step(self, player: Any, session: Dict[str, Any]) -> None:
        steps = self._scenario.get("steps", [])
        next_index = session["step_index"] + 1
        if next_index >= len(steps):
            self._complete_scenario(player, session)
            return

        step = steps[next_index]
        session["step_index"] = next_index
        session["packet_counts"] = {}
        session["step_started_at"] = time.time()
        session["step_start_position"] = self._location_dict(getattr(player, "location", None))
        session["command_history"] = []
        session["recent_events"] = []

        for command in step.get("setupCommands", []):
            self._dispatch_command(command, player)

        instructions = self._instructions_for(step)
        self._write({
            "type": "step_start",
            "scenario": self._scenario.get("id"),
            "player": session["player"],
            "step": step.get("id", str(next_index + 1)),
            "step_index": next_index,
            "instructions": instructions,
            "clearance": step.get("clearance")
        })
        self._run_hook_commands("step_start", player, session, step)
        self._send_step_instructions(player, next_index, len(steps), instructions)
        self._check_player_session(player, session)

    def _complete_step(self, player: Any, session: Dict[str, Any], reason: Dict[str, Any]) -> None:
        step = self._current_step(session)
        if step is None:
            return

        self._write({
            "type": "step_complete",
            "scenario": self._scenario.get("id"),
            "player": session["player"],
            "step": step.get("id", str(session["step_index"] + 1)),
            "step_index": session["step_index"],
            "reason": reason
        })
        self._send_notice(player, "Step complete", step.get("completeMessage", "Good. Starting the next step."))

        for command in step.get("onCompleteCommands", []):
            self._dispatch_command(command, player)

        self._run_hook_commands("step_complete", player, session, step)
        self._start_next_step(player, session)

    def _complete_scenario(self, player: Any, session: Dict[str, Any]) -> None:
        session["status"] = "complete"
        self._write({
            "type": "scenario_complete",
            "scenario": self._scenario.get("id"),
            "player": session["player"]
        })
        self._send_notice(
            player,
            self._scenario.get("completeTitle", "Scenario complete"),
            self._scenario.get("completeMessage", "The recording task is complete. You can leave the game.")
        )
        self._run_hook_commands("scenario_complete", player, session)

    def _check_sessions(self) -> None:
        for player_name, session in list(self._sessions.items()):
            if session.get("status") != "active":
                continue
            player = self.server.get_player(player_name)
            if player is None:
                continue
            self._check_player_session(player, session)

    def _check_player_session(self, player: Any, session: Dict[str, Any]) -> None:
        step = self._current_step(session)
        if step is None:
            return

        passed, reason = self._evaluate_clearance(player, session, step.get("clearance"))
        if passed:
            self._complete_step(player, session, reason)

    def _evaluate_clearance(self, player: Any, session: Dict[str, Any], clearance: Any) -> tuple:
        if clearance is None:
            return False, {"type": "missing_clearance"}
        if isinstance(clearance, list):
            clearance = {"all": clearance}
        if not isinstance(clearance, dict):
            return False, {"type": "invalid_clearance", "value": clearance}

        if "all" in clearance:
            reasons = []
            for child in clearance["all"]:
                passed, reason = self._evaluate_clearance(player, session, child)
                reasons.append(reason)
                if not passed:
                    return False, {"type": "all", "passed": False, "reasons": reasons}
            return True, {"type": "all", "passed": True, "reasons": reasons}

        if "any" in clearance:
            reasons = []
            for child in clearance["any"]:
                passed, reason = self._evaluate_clearance(player, session, child)
                reasons.append(reason)
                if passed:
                    return True, {"type": "any", "passed": True, "reasons": reasons}
            return False, {"type": "any", "passed": False, "reasons": reasons}

        kind = clearance.get("type")
        try:
            if kind == "inventory_contains":
                return self._clear_inventory_contains(player, clearance)
            if kind == "inventory_lacks":
                passed, reason = self._clear_inventory_contains(player, clearance)
                reason["type"] = "inventory_lacks"
                reason["passed"] = not passed
                return not passed, reason
            if kind == "block_is":
                return self._clear_block_is(player, clearance)
            if kind == "player_at":
                return self._clear_player_at(player, clearance)
            if kind == "position_changed":
                return self._clear_position_changed(player, session, clearance)
            if kind == "packet_seen":
                return self._clear_packet_seen(session, clearance)
            if kind == "command_seen":
                return self._clear_command_seen(session, clearance)
            if kind == "entity_exists":
                return self._clear_entity_exists(player, clearance)
            if kind in ("entity_lacks", "entity_dead"):
                passed, reason = self._clear_entity_exists(player, clearance)
                reason["type"] = kind
                reason["passed"] = not passed
                return not passed, reason
            if kind == "held_item_is":
                return self._clear_held_item_is(player, clearance)
            if kind == "container_open":
                return self._clear_container_open(session, clearance)
            if kind == "effect_active":
                return self._clear_effect_active(player, clearance)
            if kind == "effect_lacks":
                passed, reason = self._clear_effect_active(player, clearance)
                reason["type"] = "effect_lacks"
                reason["passed"] = not passed
                return not passed, reason
            if kind == "time_elapsed":
                return self._clear_time_elapsed(session, clearance)
            if kind == "endstone_event_seen":
                return self._clear_endstone_event_seen(session, clearance)
            if kind == "manual":
                return False, {"type": "manual"}
        except Exception as err:
            return False, {"type": kind or "unknown", "error": str(err)}

        return False, {"type": "unknown_clearance", "clearance": clearance}

    def _clear_inventory_contains(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        item = str(clearance.get("item", ""))
        count = int(clearance.get("count", 1))
        inventory = getattr(player, "inventory", None)
        if inventory is None:
            return False, {"type": "inventory_contains", "item": item, "count": count, "error": "player has no inventory"}

        passed = self._inventory_contains_at_least(inventory, item, count)
        return passed, {"type": "inventory_contains", "item": item, "count": count, "passed": passed}

    def _inventory_contains_at_least(self, inventory: Any, item: str, count: int) -> bool:
        candidates = self._identifier_candidates(item)
        for candidate in candidates:
            try:
                if inventory.contains_at_least(candidate, count):
                    return True
            except TypeError:
                continue
        return False

    def _clear_block_is(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        position = clearance.get("position")
        block = str(clearance.get("block", ""))
        if not isinstance(position, list) or len(position) != 3:
            return False, {"type": "block_is", "error": "position must be [x, y, z]"}

        actual = player.dimension.get_block_at(int(position[0]), int(position[1]), int(position[2])).type
        passed = self._identifier_equal(actual, block)
        reason = {
            "type": "block_is",
            "position": position,
            "expected": block,
            "actual": actual,
            "passed": passed
        }
        return passed, reason

    def _clear_player_at(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        position = clearance.get("position")
        radius = float(clearance.get("radius", 1.0))
        if not isinstance(position, list) or len(position) != 3:
            return False, {"type": "player_at", "error": "position must be [x, y, z]"}

        loc = player.location
        dx = float(loc.x) - float(position[0])
        dy = float(loc.y) - float(position[1])
        dz = float(loc.z) - float(position[2])
        distance = math.sqrt(dx * dx + dy * dy + dz * dz)
        passed = distance <= radius
        return passed, {
            "type": "player_at",
            "position": position,
            "radius": radius,
            "distance": distance,
            "passed": passed
        }

    def _clear_position_changed(self, player: Any, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        origin = clearance.get("from") or clearance.get("position") or session.get("step_start_position")
        min_distance = float(clearance.get("minDistance", clearance.get("min_distance", 1.0)))
        if isinstance(origin, dict):
            origin = [origin.get("x"), origin.get("y"), origin.get("z")]
        if not isinstance(origin, list) or len(origin) != 3:
            return False, {"type": "position_changed", "error": "from/position must be [x, y, z] or omitted after step start"}

        loc = player.location
        distance = self._distance_xyz(
            [float(loc.x), float(loc.y), float(loc.z)],
            [float(origin[0]), float(origin[1]), float(origin[2])]
        )
        passed = distance >= min_distance
        return passed, {
            "type": "position_changed",
            "from": origin,
            "minDistance": min_distance,
            "distance": distance,
            "passed": passed
        }

    def _clear_packet_seen(self, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        packet_id = int(clearance.get("packet_id", clearance.get("packetId", -1)))
        direction = clearance.get("direction")
        count = int(clearance.get("count", 1))
        seen = 0
        if direction:
            seen = int(session.get("packet_counts", {}).get(self._packet_key(direction, packet_id), 0))
        else:
            seen = sum(
                int(value)
                for key, value in session.get("packet_counts", {}).items()
                if key.endswith(f":{packet_id}")
            )
        passed = seen >= count
        return passed, {
            "type": "packet_seen",
            "packet_id": packet_id,
            "direction": direction,
            "count": count,
            "seen": seen,
            "passed": passed
        }

    def _clear_container_open(self, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        packet_id = int(clearance.get("packet_id", clearance.get("packetId", 46)))
        direction = clearance.get("direction", "send")
        count = int(clearance.get("count", 1))
        passed, reason = self._clear_packet_seen(session, {
            "packet_id": packet_id,
            "direction": direction,
            "count": count
        })
        reason["type"] = "container_open"
        reason["container"] = clearance.get("container")
        return passed, reason

    def _clear_command_seen(self, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        contains = clearance.get("contains")
        equals = clearance.get("equals", clearance.get("command"))
        count = int(clearance.get("count", 1))
        matched = []
        for entry in session.get("command_history", []):
            command = str(entry.get("command", ""))
            if contains is not None and str(contains) not in command:
                continue
            if equals is not None and str(equals) != command:
                continue
            matched.append(entry)
        passed = len(matched) >= count
        return passed, {
            "type": "command_seen",
            "contains": contains,
            "equals": equals,
            "count": count,
            "seen": len(matched),
            "passed": passed
        }

    def _clear_entity_exists(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        expected_type = clearance.get("entity", clearance.get("entityType"))
        expected_name = clearance.get("name")
        expected_tag = clearance.get("tag")
        position = clearance.get("position")
        radius = float(clearance.get("radius", 16.0))
        matches = []

        for entity in self._iter_nearby_entities(player):
            actual_type = self._entity_type(entity)
            if expected_type is not None and not self._identifier_equal(actual_type, str(expected_type)):
                continue
            actual_name = self._entity_name(entity)
            if expected_name is not None and actual_name != str(expected_name):
                continue
            actual_tags = self._entity_tags(entity)
            if expected_tag is not None and str(expected_tag) not in actual_tags:
                continue
            actual_position = self._location_dict(getattr(entity, "location", None))
            if position is not None:
                if not isinstance(position, list) or len(position) != 3:
                    return False, {"type": "entity_exists", "error": "position must be [x, y, z]"}
                if actual_position is None:
                    continue
                distance = self._distance_xyz(
                    [actual_position["x"], actual_position["y"], actual_position["z"]],
                    [float(position[0]), float(position[1]), float(position[2])]
                )
                if distance > radius:
                    continue
            matches.append({
                "type": actual_type,
                "name": actual_name,
                "tags": sorted(actual_tags),
                "position": actual_position
            })

        passed = len(matches) >= int(clearance.get("count", 1))
        return passed, {
            "type": "entity_exists",
            "entity": expected_type,
            "name": expected_name,
            "tag": expected_tag,
            "position": position,
            "radius": radius,
            "count": int(clearance.get("count", 1)),
            "seen": len(matches),
            "matches": matches[:5],
            "passed": passed
        }

    def _clear_held_item_is(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        expected = str(clearance.get("item", ""))
        actual = self._held_item_identifier(player)
        passed = self._identifier_equal(actual or "", expected)
        return passed, {
            "type": "held_item_is",
            "expected": expected,
            "actual": actual,
            "passed": passed
        }

    def _clear_effect_active(self, player: Any, clearance: Dict[str, Any]) -> tuple:
        expected = str(clearance.get("effect", clearance.get("name", "")))
        effects = self._active_effect_identifiers(player)
        passed = any(self._identifier_equal(effect, expected) for effect in effects)
        return passed, {
            "type": "effect_active",
            "effect": expected,
            "active": sorted(effects),
            "passed": passed
        }

    def _clear_time_elapsed(self, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        required = float(clearance.get("seconds", 0))
        if "ms" in clearance:
            required = float(clearance.get("ms", 0)) / 1000.0
        if "ticks" in clearance:
            required = float(clearance.get("ticks", 0)) / TICKS_PER_SECOND
        started_at = float(session.get("step_started_at", time.time()))
        elapsed = time.time() - started_at
        passed = elapsed >= required
        return passed, {
            "type": "time_elapsed",
            "seconds": required,
            "elapsed": elapsed,
            "passed": passed
        }

    def _clear_endstone_event_seen(self, session: Dict[str, Any], clearance: Dict[str, Any]) -> tuple:
        event_name = str(clearance.get("event", ""))
        count = int(clearance.get("count", 1))
        within_seconds = clearance.get("withinSeconds", clearance.get("within_seconds"))
        since = None if within_seconds is None else time.time() - float(within_seconds)
        where = clearance.get("where")
        matched = []

        for record in session.get("recent_events", []):
            if event_name and record.get("event") != event_name:
                continue
            if since is not None and float(record.get("ts", 0)) < since:
                continue
            data = record.get("data", {})
            if where is not None and not self._matches_where(data, where):
                continue
            matched.append(record)

        passed = len(matched) >= count
        return passed, {
            "type": "endstone_event_seen",
            "event": event_name,
            "count": count,
            "withinSeconds": within_seconds,
            "seen": len(matched),
            "matches": matched[:5],
            "passed": passed
        }

    def _count_step_packet(self, player_name: Optional[str], direction: str, packet_id: int) -> None:
        if not player_name:
            return
        session = self._sessions.get(player_name)
        if not session or session.get("status") != "active":
            return
        key = self._packet_key(direction, packet_id)
        counts = session.setdefault("packet_counts", {})
        counts[key] = int(counts.get(key, 0)) + 1

    def _packet_key(self, direction: str, packet_id: int) -> str:
        return f"{direction}:{packet_id}"

    def _current_step(self, session: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        index = int(session.get("step_index", -1))
        steps = self._scenario.get("steps", []) if self._scenario else []
        if index < 0 or index >= len(steps):
            return None
        return steps[index]

    def _op_player(self, player: Any) -> None:
        try:
            player.is_op = True
        except Exception:
            pass
        self._dispatch_command("op {player}", player)

    def _teleport_player(self, player: Any, position: Any) -> None:
        if not isinstance(position, list) or len(position) < 3:
            return
        yaw_pitch = ""
        if len(position) >= 5:
            yaw_pitch = f" {float(position[3])} {float(position[4])}"
        self._dispatch_command(f"tp {{player}} {float(position[0])} {float(position[1])} {float(position[2])}{yaw_pitch}", player)

    def _run_hook_commands(
        self,
        hook: str,
        player: Any,
        session: Dict[str, Any],
        step: Optional[Dict[str, Any]] = None
    ) -> None:
        for spec in self._command_specs_for_hook(hook, session, step):
            self._schedule_command_spec(spec, hook, player, session, step)

    def _command_specs_for_hook(
        self,
        hook: str,
        session: Dict[str, Any],
        step: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        specs = []
        for spec in self._scenario.get("commands", []) if self._scenario else []:
            if self._command_spec_matches_hook(spec, hook, session, step, default_hook="scenario_start"):
                specs.append(spec)
        if step is not None:
            for spec in step.get("commands", []):
                if self._command_spec_matches_hook(spec, hook, session, step, default_hook="step_start"):
                    specs.append(spec)
        return specs

    def _command_spec_matches_hook(
        self,
        spec: Any,
        hook: str,
        session: Dict[str, Any],
        step: Optional[Dict[str, Any]],
        default_hook: str
    ) -> bool:
        if isinstance(spec, str):
            spec_hook = default_hook
        elif isinstance(spec, dict):
            spec_hook = str(spec.get("hook", spec.get("event", spec.get("on", default_hook))))
        else:
            return False
        if spec_hook != hook:
            return False
        if step is None:
            return True

        step_id = spec.get("step", spec.get("stepId")) if isinstance(spec, dict) else None
        if step_id is not None and str(step_id) != str(step.get("id", session.get("step_index"))):
            return False

        step_index = spec.get("stepIndex") if isinstance(spec, dict) else None
        if step_index is not None and int(step_index) != int(session.get("step_index", -1)):
            return False
        return True

    def _schedule_command_spec(
        self,
        spec: Any,
        hook: str,
        player: Any,
        session: Dict[str, Any],
        step: Optional[Dict[str, Any]] = None
    ) -> None:
        if hook not in SUPPORTED_COMMAND_HOOKS:
            self._write({
                "type": "scenario_command_error",
                "scenario": self._scenario.get("id") if self._scenario else None,
                "player": self._player_name(player),
                "hook": hook,
                "error": "unsupported command hook"
            })
            return

        commands = self._commands_from_spec(spec)
        delay_ticks = self._delay_ticks_from_spec(spec)
        for template in commands:
            command = self._format_command(template, player, hook=hook, session=session, step=step)
            if delay_ticks <= 0:
                self._dispatch_raw_command(command, player, hook=hook, session=session, step=step)
                continue
            self._schedule_command(command, delay_ticks, hook, player, session, step)

    def _commands_from_spec(self, spec: Any) -> List[str]:
        if isinstance(spec, str):
            return [spec]
        if not isinstance(spec, dict):
            return []
        if "commands" in spec:
            raw = spec.get("commands")
            if isinstance(raw, list):
                return [str(value) for value in raw]
            return [str(raw)]
        if "command" in spec:
            return [str(spec.get("command"))]
        return []

    def _delay_ticks_from_spec(self, spec: Any) -> int:
        if not isinstance(spec, dict):
            return 0
        if "delayTicks" in spec:
            return max(0, int(spec.get("delayTicks", 0)))
        if "delay_ticks" in spec:
            return max(0, int(spec.get("delay_ticks", 0)))
        if "delayMs" in spec:
            return max(0, int(math.ceil(float(spec.get("delayMs", 0)) / 50.0)))
        if "delay_ms" in spec:
            return max(0, int(math.ceil(float(spec.get("delay_ms", 0)) / 50.0)))
        if "delaySeconds" in spec:
            return max(0, int(math.ceil(float(spec.get("delaySeconds", 0)) * TICKS_PER_SECOND)))
        if "delay_seconds" in spec:
            return max(0, int(math.ceil(float(spec.get("delay_seconds", 0)) * TICKS_PER_SECOND)))
        return 0

    def _schedule_command(
        self,
        command: str,
        delay_ticks: int,
        hook: str,
        player: Any,
        session: Dict[str, Any],
        step: Optional[Dict[str, Any]] = None
    ) -> None:
        player_name = self._player_name(player)
        step_id = self._step_id(step, session)
        scheduled_session = {"step_index": session.get("step_index")}
        self._write({
            "type": "scenario_command_scheduled",
            "scenario": self._scenario.get("id") if self._scenario else None,
            "player": player_name,
            "hook": hook,
            "step": step_id,
            "step_index": scheduled_session.get("step_index"),
            "delay_ticks": delay_ticks,
            "command": command
        })

        def run_command() -> None:
            current_player = self.server.get_player(player_name) if player_name else None
            if current_player is None:
                self._write({
                    "type": "scenario_command_skipped",
                    "scenario": self._scenario.get("id") if self._scenario else None,
                    "player": player_name,
                    "hook": hook,
                    "step": step_id,
                    "step_index": scheduled_session.get("step_index"),
                    "command": command,
                    "reason": "player_offline"
                })
                return
            if step is not None and session.get("step_index") != scheduled_session.get("step_index"):
                self._write({
                    "type": "scenario_command_skipped",
                    "scenario": self._scenario.get("id") if self._scenario else None,
                    "player": player_name,
                    "hook": hook,
                    "step": step_id,
                    "step_index": scheduled_session.get("step_index"),
                    "command": command,
                    "reason": "step_changed"
                })
                return
            self._dispatch_raw_command(command, current_player, hook=hook, session=session, step=step)

        task = self.server.scheduler.run_task(self, run_command, delay=delay_ticks)
        self._scheduled_command_tasks.append(task)

    def _dispatch_command(self, template: str, player: Any) -> bool:
        command = self._format_command(template, player)
        return self._dispatch_raw_command(command, player)

    def _dispatch_raw_command(
        self,
        command: str,
        player: Any,
        hook: Optional[str] = None,
        session: Optional[Dict[str, Any]] = None,
        step: Optional[Dict[str, Any]] = None
    ) -> bool:
        self._write({
            "type": "scenario_command",
            "scenario": self._scenario.get("id") if self._scenario else None,
            "player": self._player_name(player),
            "hook": hook,
            "step": self._step_id(step, session),
            "step_index": session.get("step_index") if session else None,
            "command": command
        })
        if session is not None:
            history = session.setdefault("command_history", [])
            history.append({
                "ts": time.time(),
                "hook": hook,
                "step": self._step_id(step, session),
                "step_index": session.get("step_index"),
                "command": command
            })
        return bool(self.server.dispatch_command(self.server.command_sender, command))

    def _format_command(
        self,
        template: str,
        player: Any,
        hook: Optional[str] = None,
        session: Optional[Dict[str, Any]] = None,
        step: Optional[Dict[str, Any]] = None
    ) -> str:
        player_name = self._player_name(player) or ""
        quoted = self._quote_command_argument(player_name)
        scenario_id = self._scenario.get("id") if self._scenario else ""
        return str(template).format(
            id=scenario_id,
            scenario=scenario_id,
            scenarioId=scenario_id,
            player=quoted,
            playerName=player_name,
            hook=hook or "",
            step=self._step_id(step, session) or "",
            stepIndex=session.get("step_index") if session else ""
        )

    def _step_id(self, step: Optional[Dict[str, Any]], session: Optional[Dict[str, Any]]) -> Optional[str]:
        if step is not None:
            return str(step.get("id", session.get("step_index") if session else ""))
        return None

    def _send_step_instructions(self, player: Any, index: int, total: int, instructions: List[str]) -> None:
        title = f"Step {index + 1}/{total}"
        subtitle = instructions[0] if instructions else "Follow the scenario instructions."
        self._send_notice(player, title, subtitle)
        for line in instructions:
            self._send_chat_line(player, line)

    def _send_notice(self, player: Any, title: str, message: str) -> None:
        try:
            player.send_title(str(title), str(message), 5, 80, 20)
        except Exception:
            pass
        try:
            player.send_tip(str(message))
        except Exception:
            pass
        self._send_chat_line(player, f"{title}: {message}")

    def _send_chat_line(self, player: Any, message: str) -> None:
        escaped = json.dumps({"rawtext": [{"text": str(message)}]}, separators=(",", ":"))
        self._dispatch_raw_command(f"tellraw {self._quote_command_argument(self._player_name(player) or '')} {escaped}", player)

    def _instructions_for(self, step: Dict[str, Any]) -> List[str]:
        raw = step.get("instructions", step.get("instruction", []))
        if isinstance(raw, str):
            return [raw]
        if isinstance(raw, list):
            return [str(value) for value in raw]
        return []

    def _write(self, record: Dict[str, Any]) -> None:
        with self._lock:
            self._sequence += 1
            record = {
                "ts": time.time(),
                "sequence": self._sequence,
                **record
            }
            line = json.dumps(record, separators=(",", ":")) + "\n"
            self._handle.write(line)
            self._handle.flush()
            if self._split_by_player and record.get("player"):
                player_handle = self._player_handle(str(record["player"]))
                player_handle.write(line)
                player_handle.flush()

    def _write_packet_row(self, row: List[Any], player_name: Optional[str]) -> None:
        with self._lock:
            self._sequence += 1
            row.insert(1, self._sequence)
            row.insert(2, time.time())
            line = json.dumps(row, separators=(",", ":")) + "\n"
            self._handle.write(line)
            self._handle.flush()
            if self._split_by_player and player_name:
                player_handle = self._player_handle(str(player_name))
                player_handle.write(line)
                player_handle.flush()

    def _player_handle(self, player_name: str) -> Any:
        handle = self._player_handles.get(player_name)
        if handle is not None:
            return handle
        player_file = self._record_file.with_name(
            f"{self._record_file.stem}.{self._safe_file_label(player_name)}{self._record_file.suffix}"
        )
        handle = player_file.open("a", encoding="utf8")
        self._player_handles[player_name] = handle
        return handle

    def _should_record_player(self, player_name: Optional[str]) -> bool:
        if self._player_filter is None:
            return True
        if not player_name:
            return False
        return player_name.lower() in self._player_filter

    def _normalize_endstone_event(self, event: Any, event_name: str, player_name: Optional[str]) -> Dict[str, Any]:
        data = {
            "event": event_name,
            "player": player_name
        }

        from_location = self._location_dict(self._safe_get(event, "from_location"))
        to_location = self._location_dict(self._safe_get(event, "to_location"))
        if from_location is not None:
            data["from"] = from_location
        if to_location is not None:
            data["to"] = to_location
        if from_location is not None and to_location is not None:
            data["distance"] = self._distance_xyz(
                [from_location["x"], from_location["y"], from_location["z"]],
                [to_location["x"], to_location["y"], to_location["z"]]
            )

        for attr in ("command", "message", "action", "new_slot", "previous_slot", "death_message"):
            value = self._safe_get(event, attr)
            if value is not None:
                data[attr] = self._json_safe_value(value)

        block = self._safe_get(event, "block")
        if block is not None:
            data["block"] = self._block_summary(block)

        item = self._safe_get(event, "item")
        if item is not None:
            data["item"] = self._item_summary(item)

        actor = self._safe_get(event, "actor") or self._safe_get(event, "entity")
        if actor is not None:
            data["entity"] = self._entity_summary(actor)

        return data

    def _clearance_event_names(self, clearance: Any) -> Set[str]:
        names = set()
        if isinstance(clearance, list):
            for child in clearance:
                names.update(self._clearance_event_names(child))
            return names
        if not isinstance(clearance, dict):
            return names
        if "all" in clearance:
            names.update(self._clearance_event_names(clearance["all"]))
        if "any" in clearance:
            names.update(self._clearance_event_names(clearance["any"]))
        if clearance.get("type") == "endstone_event_seen" and clearance.get("event"):
            names.add(str(clearance.get("event")))
        return names

    def _collect_scenario_event_interest(self, scenario: Optional[Dict[str, Any]]) -> Set[str]:
        if not scenario:
            return set()
        names = set()
        names.update(self._parse_event_names(scenario.get("recordEvents", [])))
        names.update(self._parse_event_names(scenario.get("debugRecordEvents", [])))
        for step in scenario.get("steps", []):
            names.update(self._clearance_event_names(step.get("clearance")))
        return names

    def _matches_where(self, data: Dict[str, Any], where: Any) -> bool:
        if not isinstance(where, dict):
            return False
        for path, expected in where.items():
            actual = self._value_at_path(data, str(path))
            if not self._matches_expected(actual, expected):
                return False
        return True

    def _matches_expected(self, actual: Any, expected: Any) -> bool:
        if isinstance(expected, dict):
            for op, value in expected.items():
                if op == "gt":
                    if not (actual is not None and float(actual) > float(value)):
                        return False
                elif op == "gte":
                    if not (actual is not None and float(actual) >= float(value)):
                        return False
                elif op == "lt":
                    if not (actual is not None and float(actual) < float(value)):
                        return False
                elif op == "lte":
                    if not (actual is not None and float(actual) <= float(value)):
                        return False
                elif op == "contains":
                    if actual is None or str(value) not in str(actual):
                        return False
                else:
                    return False
            return True
        return actual == expected

    def _value_at_path(self, data: Any, path: str) -> Any:
        current = data
        for part in path.split("."):
            if isinstance(current, dict):
                current = current.get(part)
            else:
                current = getattr(current, part, None)
            if current is None:
                return None
        return current

    def _block_summary(self, block: Any) -> Dict[str, Any]:
        return {
            "type": self._json_safe_value(self._safe_get(block, "type")),
            "location": self._location_dict(self._safe_get(block, "location"))
        }

    def _item_summary(self, item: Any) -> Dict[str, Any]:
        count = self._safe_get(item, "count")
        if count is None:
            count = self._safe_get(item, "amount")
        return {
            "type": self._item_identifier(item),
            "count": self._json_safe_value(count)
        }

    def _entity_summary(self, entity: Any) -> Dict[str, Any]:
        return {
            "type": self._entity_type(entity),
            "name": self._entity_name(entity),
            "tags": sorted(self._entity_tags(entity)),
            "location": self._location_dict(self._safe_get(entity, "location"))
        }

    def _iter_nearby_entities(self, player: Any) -> List[Any]:
        dimension = getattr(player, "dimension", None)
        candidates = []
        if dimension is not None:
            for attr in ("entities", "entity_list"):
                value = getattr(dimension, attr, None)
                if value is not None:
                    candidates.append(value)
            for method in ("get_entities", "getEntities"):
                value = getattr(dimension, method, None)
                if callable(value):
                    try:
                        candidates.append(value())
                    except TypeError:
                        pass

        level = getattr(player, "level", None) or getattr(player, "world", None)
        if level is not None:
            for attr in ("entities", "entity_list"):
                value = getattr(level, attr, None)
                if value is not None:
                    candidates.append(value)

        entities = []
        for candidate in candidates:
            try:
                entities.extend(list(candidate.values()) if isinstance(candidate, dict) else list(candidate))
            except TypeError:
                continue
        return entities

    def _entity_type(self, entity: Any) -> str:
        for attr in ("type", "type_id", "identifier", "runtime_id"):
            value = getattr(entity, attr, None)
            if value is not None:
                return str(value)
        return str(entity.__class__.__name__)

    def _entity_name(self, entity: Any) -> Optional[str]:
        for attr in ("name", "custom_name", "display_name"):
            value = getattr(entity, attr, None)
            if value:
                return str(value)
        return None

    def _entity_tags(self, entity: Any) -> Set[str]:
        for attr in ("scoreboard_tags", "tags"):
            value = getattr(entity, attr, None)
            if value is None:
                continue
            try:
                return {str(tag) for tag in value}
            except TypeError:
                return {str(value)}
        method = getattr(entity, "get_scoreboard_tags", None)
        if callable(method):
            try:
                return {str(tag) for tag in method()}
            except TypeError:
                pass
        return set()

    def _held_item_identifier(self, player: Any) -> Optional[str]:
        inventory = getattr(player, "inventory", None)
        candidates = []
        for owner in (player, inventory):
            if owner is None:
                continue
            for attr in ("item_in_hand", "itemInHand", "held_item", "selected_item"):
                value = getattr(owner, attr, None)
                if value is not None:
                    candidates.append(value)
            for method in ("get_item_in_hand", "getItemInHand", "get_held_item"):
                value = getattr(owner, method, None)
                if callable(value):
                    try:
                        candidates.append(value())
                    except TypeError:
                        pass

        for item in candidates:
            identifier = self._item_identifier(item)
            if identifier:
                return identifier
        return None

    def _item_identifier(self, item: Any) -> Optional[str]:
        if item is None:
            return None
        if isinstance(item, str):
            return item
        for attr in ("type", "name", "identifier", "id"):
            value = getattr(item, attr, None)
            if value:
                return str(value)
        return str(item)

    def _active_effect_identifiers(self, player: Any) -> Set[str]:
        candidates = []
        for attr in ("active_effects", "effects", "potion_effects"):
            value = getattr(player, attr, None)
            if value is not None:
                candidates.append(value)
        for method in ("get_active_effects", "getEffects", "get_effects"):
            value = getattr(player, method, None)
            if callable(value):
                try:
                    candidates.append(value())
                except TypeError:
                    pass

        effects = set()
        for candidate in candidates:
            values = candidate.values() if isinstance(candidate, dict) else candidate
            try:
                iterator = iter(values)
            except TypeError:
                iterator = iter([values])
            for effect in iterator:
                for attr in ("type", "name", "identifier", "id"):
                    value = getattr(effect, attr, None)
                    if value:
                        effects.add(str(value))
                        break
                else:
                    effects.add(str(effect))
        return effects

    @staticmethod
    def _location_dict(location: Any) -> Optional[Dict[str, float]]:
        if location is None:
            return None
        try:
            data = {
                "x": float(location.x),
                "y": float(location.y),
                "z": float(location.z)
            }
            for attr in ("pitch", "yaw"):
                value = getattr(location, attr, None)
                if value is not None:
                    data[attr] = float(value)
            return data
        except Exception:
            return None

    @staticmethod
    def _distance_xyz(a: List[float], b: List[float]) -> float:
        dx = float(a[0]) - float(b[0])
        dy = float(a[1]) - float(b[1])
        dz = float(a[2]) - float(b[2])
        return math.sqrt(dx * dx + dy * dy + dz * dz)

    @staticmethod
    def _safe_get(obj: Any, attr: str) -> Any:
        try:
            return getattr(obj, attr, None)
        except Exception:
            return None

    @classmethod
    def _json_safe_value(cls, value: Any) -> Any:
        if value is None or isinstance(value, (str, int, float, bool)):
            return value
        if isinstance(value, (list, tuple)):
            return [cls._json_safe_value(entry) for entry in value]
        if isinstance(value, dict):
            return {str(key): cls._json_safe_value(entry) for key, entry in value.items()}
        return str(value)

    @staticmethod
    def _parse_packet_ids(raw: str) -> Optional[Set[int]]:
        values = [value.strip() for value in raw.split(",") if value.strip()]
        if not values:
            return None
        return {int(value, 0) for value in values}

    @staticmethod
    def _parse_names(raw: str) -> Optional[Set[str]]:
        values = [value.strip().lower() for value in raw.split(",") if value.strip()]
        if not values:
            return None
        return set(values)

    @staticmethod
    def _parse_event_names(raw: Any) -> Set[str]:
        if isinstance(raw, str):
            values = [value.strip() for value in raw.split(",") if value.strip()]
            return set(values)
        if isinstance(raw, list):
            return {str(value).strip() for value in raw if str(value).strip()}
        return set()

    @staticmethod
    def _identifier_candidates(identifier: str) -> List[str]:
        value = identifier.strip()
        if not value:
            return []
        if value.startswith("minecraft:"):
            return [value, value.split(":", 1)[1]]
        return [value, f"minecraft:{value}"]

    @classmethod
    def _identifier_equal(cls, actual: str, expected: str) -> bool:
        actual_set = set(cls._identifier_candidates(str(actual)))
        expected_set = set(cls._identifier_candidates(str(expected)))
        return bool(actual_set.intersection(expected_set))

    @staticmethod
    def _quote_command_argument(value: str) -> str:
        return f'"{value.replace(chr(92), chr(92) + chr(92)).replace(chr(34), chr(92) + chr(34))}"'

    @staticmethod
    def _player_name(player: Any) -> Optional[str]:
        if player is None:
            return None
        return getattr(player, "name", None) or str(player)

    @staticmethod
    def _safe_file_label(value: str) -> str:
        rendered = "".join(char if char.isalnum() or char in ("-", "_", ".") else "_" for char in value)
        return rendered.strip("._") or "unknown"
