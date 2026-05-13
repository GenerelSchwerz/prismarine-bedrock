import base64
import hashlib
import json
import math
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from endstone.event import PacketReceiveEvent, PacketSendEvent, PlayerJoinEvent, PlayerQuitEvent, event_handler
from endstone.plugin import Plugin


DEFAULT_CHECK_PERIOD_TICKS = 10


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
        self._sessions = {}
        self._check_task = None

        self.register_events(self)
        self._write({
            "type": "recorder_start",
            "packet_ids": sorted(self._packet_ids) if self._packet_ids is not None else None,
            "players": sorted(self._player_filter) if self._player_filter is not None else None,
            "split_by_player": self._split_by_player,
            "scenario": self._scenario.get("id") if self._scenario else None
        })

        if self._scenario:
            self._write({
                "type": "scenario_loaded",
                "scenario": self._scenario.get("id"),
                "step_count": len(self._scenario.get("steps", []))
            })
            period = int(self._scenario.get("checkPeriodTicks", DEFAULT_CHECK_PERIOD_TICKS))
            self._check_task = self.server.scheduler.run_task(self, self._check_sessions, delay=period, period=period)

        self.logger.info(f"Recording Bedrock packets to {self._record_file}")

    def on_disable(self) -> None:
        if getattr(self, "_check_task", None) is not None:
            self._check_task.cancel()
            self._check_task = None

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

    def _record_packet(self, direction: str, event: Any) -> None:
        packet_id = int(event.packet_id)
        player_name = self._player_name(getattr(event, "player", None))
        self._count_step_packet(player_name, direction, packet_id)

        if self._packet_ids is not None and packet_id not in self._packet_ids:
            return
        if not self._should_record_player(player_name):
            return

        payload = bytes(event.payload)
        self._write({
            "type": "packet",
            "direction": direction,
            "packet_id": packet_id,
            "sub_client_id": int(getattr(event, "sub_client_id", 0)),
            "player": player_name,
            "address": str(getattr(event, "address", "")),
            "payload_base64": base64.b64encode(payload).decode("ascii"),
            "payload_size": len(payload),
            "payload_sha256": hashlib.sha256(payload).hexdigest()
        })

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
            "packet_counts": {}
        }
        self._sessions[player_name] = session

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
            if kind == "packet_seen":
                return self._clear_packet_seen(session, clearance)
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

    def _dispatch_command(self, template: str, player: Any) -> bool:
        command = self._format_command(template, player)
        return self._dispatch_raw_command(command, player)

    def _dispatch_raw_command(self, command: str, player: Any) -> bool:
        self._write({
            "type": "scenario_command",
            "scenario": self._scenario.get("id") if self._scenario else None,
            "player": self._player_name(player),
            "command": command
        })
        return bool(self.server.dispatch_command(self.server.command_sender, command))

    def _format_command(self, template: str, player: Any) -> str:
        player_name = self._player_name(player) or ""
        quoted = self._quote_command_argument(player_name)
        return str(template).format(
            player=quoted,
            playerName=player_name
        )

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
