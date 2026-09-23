import unittest

from app.services.assembly_turns import AssemblyTurns


class AssemblyTurnsTest(unittest.TestCase):
    def test_partial_then_final_and_formatted_duplicate(self):
        turns = AssemblyTurns()
        base = {"type": "Turn", "turn_order": 0, "transcript": "Bom dia turma"}
        self.assertEqual(
            turns.receive({**base, "end_of_turn": False}), ("Bom dia turma", False, None)
        )
        self.assertEqual(
            turns.receive({**base, "end_of_turn": True}), ("Bom dia turma", True, None)
        )
        self.assertIsNone(turns.receive({**base, "end_of_turn": True, "turn_is_formatted": True}))
        self.assertEqual(
            turns.receive({**base, "turn_order": 1, "end_of_turn": True}),
            ("Bom dia turma", True, None),
        )

    def test_v3_field_takes_precedence_and_empty_status_is_ignored(self):
        turns = AssemblyTurns()
        self.assertEqual(
            turns.receive(
                {"type": "Turn", "transcript": "Aula", "end_of_turn": False, "turn_is_done": True}
            ),
            ("Aula", False, None),
        )
        self.assertIsNone(turns.receive({"type": "Begin"}))
        self.assertIsNone(turns.receive({"type": "Turn", "transcript": " "}))


if __name__ == "__main__":
    unittest.main()
