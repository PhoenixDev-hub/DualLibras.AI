from typing import Any


class AssemblyTurns:
    """Normalize v3 turns and avoid replaying the formatted final of the same turn."""

    def __init__(self) -> None:
        self.completed_turn: int | None = None

    def receive(self, message: dict[str, Any]) -> tuple[str, bool, str | None] | None:
        if message.get("type") != "Turn":
            return None
        text = str(message.get("transcript") or "").strip()
        order = message.get("turn_order")
        if not text or (order is not None and order == self.completed_turn):
            return None
        is_final = bool(message.get("end_of_turn", message.get("turn_is_done", False)))
        if is_final and isinstance(order, int):
            self.completed_turn = order
        return text, is_final, message.get("speaker")
