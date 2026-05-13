import base64
import hashlib
import json
import os
import threading
import time
from pathlib import Path
from typing import Any, Optional, Set

from endstone.event import PacketReceiveEvent, PacketSendEvent, PlayerJoinEvent, PlayerQuitEvent, event_handler
from endstone.plugin import Plugin


class PacketRecorderPlugin(Plugin):
    api_version = "0.10"

    def on_enable(self) -> None:
        if os.environ.get("E2E_ENDSTONE_PACKET_RECORDER") != "1":
            self.logger.info("Packet recorder is installed but inactive.")
            return

        self._sequence = 0
        self._lock = threading.Lock()
        self._packet_ids = self._parse_packet_ids(os.environ.get("E2E_PACKET_RECORDER_PACKET_IDS", ""))
        self._record_file = Path(os.environ.get("E2E_PACKET_RECORD_FILE", "logs/packet-recorder.jsonl"))
        self._record_file.parent.mkdir(parents=True, exist_ok=True)
        self._handle = self._record_file.open("a", encoding="utf8")
        self.register_events(self)
        self._write({
            "type": "recorder_start",
            "packet_ids": sorted(self._packet_ids) if self._packet_ids is not None else None
        })
        self.logger.info(f"Recording Bedrock packets to {self._record_file}")

    def on_disable(self) -> None:
        handle = getattr(self, "_handle", None)
        if handle is None:
            return
        self._write({"type": "recorder_stop"})
        handle.close()
        self._handle = None

    @event_handler
    def on_player_join(self, event: PlayerJoinEvent) -> None:
        self._write({
            "type": "player_join",
            "player": self._player_name(getattr(event, "player", None))
        })

    @event_handler
    def on_player_quit(self, event: PlayerQuitEvent) -> None:
        self._write({
            "type": "player_quit",
            "player": self._player_name(getattr(event, "player", None))
        })

    @event_handler
    def on_packet_receive(self, event: PacketReceiveEvent) -> None:
        self._record_packet("receive", event)

    @event_handler
    def on_packet_send(self, event: PacketSendEvent) -> None:
        self._record_packet("send", event)

    def _record_packet(self, direction: str, event: Any) -> None:
        packet_id = int(event.packet_id)
        if self._packet_ids is not None and packet_id not in self._packet_ids:
            return

        payload = bytes(event.payload)
        self._write({
            "type": "packet",
            "direction": direction,
            "packet_id": packet_id,
            "sub_client_id": int(getattr(event, "sub_client_id", 0)),
            "player": self._player_name(getattr(event, "player", None)),
            "address": str(getattr(event, "address", "")),
            "payload_base64": base64.b64encode(payload).decode("ascii"),
            "payload_size": len(payload),
            "payload_sha256": hashlib.sha256(payload).hexdigest()
        })

    def _write(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._sequence += 1
            record = {
                "ts": time.time(),
                "sequence": self._sequence,
                **record
            }
            self._handle.write(json.dumps(record, separators=(",", ":")) + "\n")
            self._handle.flush()

    @staticmethod
    def _parse_packet_ids(raw: str) -> Optional[Set[int]]:
        values = [value.strip() for value in raw.split(",") if value.strip()]
        if not values:
            return None
        return {int(value, 0) for value in values}

    @staticmethod
    def _player_name(player: Any) -> Optional[str]:
        if player is None:
            return None
        return getattr(player, "name", None) or str(player)
