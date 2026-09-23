"""Offline regressions. All provider connections are replaced, never use real keys."""

import asyncio
import json
import os
import tempfile
import time
import unittest
from dataclasses import replace
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

# Keep importing the API from writing into project storage.
_storage = tempfile.TemporaryDirectory()
os.environ["OUTPUT_PATH"] = _storage.name
os.environ["DOCUMENTATION_OUTPUT_DIR"] = _storage.name

from app.services import assemblyai
from app.realtime.audio import AudioBuffer
from app.realtime import session
from app.api.app import websocket_endpoint
from app.api import security


class Provider:
    def __init__(self, initial=None):
        self.incoming = asyncio.Queue()
        self.incoming.put_nowait(json.dumps(initial or {"type": "Begin"}))
        self.sent = []
        self.closed = False

    async def recv(self):
        return await self.incoming.get()

    async def send(self, data):
        self.sent.append(data)
        if isinstance(data, bytes):
            for final in (False, True):
                self.incoming.put_nowait(
                    json.dumps(
                        {
                            "type": "Turn",
                            "turn_order": 0,
                            "transcript": "Bom dia turma",
                            "end_of_turn": final,
                        }
                    )
                )

    async def close(self, **kwargs):
        self.closed = True


class Frontend:
    def __init__(self, frames):
        self.headers = {'authorization': 'Bearer offline-test'}
        self.query_params = {}
        self.client = None
        self.incoming = asyncio.Queue()
        for frame in frames:
            self.incoming.put_nowait(frame)
        self.messages = []
        self.closed = False

    async def accept(self):
        pass

    async def receive(self):
        return await self.incoming.get()

    async def send_text(self, raw):
        data = json.loads(raw)
        self.messages.append(data)
        if data.get("is_final") or data.get("error"):
            self.incoming.put_nowait({"type": "websocket.disconnect"})

    async def close(self, **kwargs):
        self.closed = True
        self.incoming.put_nowait({"type": "websocket.disconnect"})


class AudioPipelineTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        security.limiter.windows.clear()
        self.enterContext(patch.object(security, 'lookup_session', return_value={'userId': '00000000-0000-4000-8000-000000000001', 'role': 'PROFESSOR'}))
        settings = replace(
            session.SETTINGS,
            assemblyai_api_key="mock-only",
            save_transcripts=False,
            sample_rate=16000,
            channels=1,
            chunk_size=1600,
        )
        self.enterContext(patch.object(session, "SETTINGS", settings))
        self.enterContext(patch.object(assemblyai, "SETTINGS", settings))
        self.connect = self.enterContext(
            patch.object(assemblyai.websockets, "connect", new_callable=AsyncMock)
        )
        # Fail closed if a test accidentally uses any network outside the mock.
        self.enterContext(
            patch(
                "socket.socket.connect",
                side_effect=AssertionError("Network forbidden in offline tests"),
            )
        )

    async def test_continuous_partials_enabled_without_changing_model(self):
        params = parse_qs(urlparse(assemblyai.build_streaming_url()).query)
        self.assertEqual(params["speech_model"], [assemblyai.SETTINGS.speech_model])
        self.assertEqual(params["continuous_partials"], ["true"])
        other = replace(assemblyai.SETTINGS, speech_model="universal-streaming-multilingual")
        with patch.object(assemblyai, "SETTINGS", other):
            self.assertNotIn(
                "continuous_partials", parse_qs(urlparse(assemblyai.build_streaming_url()).query)
            )
        self.connect.assert_not_called()

    async def test_long_speech_partials_are_delivered_before_final(self):
        provider = Provider()
        provider.incoming.get_nowait()  # Begin is handled by connect, not this receiver.
        delivered = []

        async def on_turn(text, final, speaker):
            delivered.append((text, final))

        receiver = asyncio.create_task(
            assemblyai.receive_transcripts(lambda: provider, lambda: True, on_turn)
        )
        try:
            for text in ["Hoje", "Hoje vamos estudar", "Hoje vamos estudar matemática"]:
                provider.incoming.put_nowait(
                    json.dumps(
                        {"type": "Turn", "turn_order": 0, "transcript": text, "end_of_turn": False}
                    )
                )
                await asyncio.sleep(0)
                self.assertEqual(delivered[-1], (text, False))
            self.assertEqual(len(delivered), 3)
        finally:
            receiver.cancel()
            await receiver
        self.connect.assert_not_called()

    async def test_idle_frontend_never_opens_provider(self):
        front = Frontend([{"type": "websocket.disconnect"}])
        await websocket_endpoint(front)
        self.connect.assert_not_called()

    async def test_pcm_partial_final_and_explicit_termination(self):
        provider = Provider()
        self.connect.return_value = provider
        pcm = b"\x00\x20" * 800
        front = Frontend([{"bytes": pcm}])
        await asyncio.wait_for(websocket_endpoint(front), 2)
        self.connect.assert_awaited_once()
        self.assertIn(pcm, provider.sent)
        turns = [x for x in front.messages if x["type"] == "transcript"]
        self.assertEqual([x["is_final"] for x in turns], [False, True])
        self.assertEqual(turns[-1]["text"], "Bom dia turma")
        self.assertIn(json.dumps({"type": "Terminate"}), provider.sent)
        self.assertTrue(provider.closed)
        self.assertTrue(front.closed)

    async def test_invalid_pcm_never_opens_provider(self):
        front = Frontend([{"bytes": b"123"}])
        await websocket_endpoint(front)
        self.connect.assert_not_called()
        self.assertTrue(front.messages[0]["error"])

    async def test_rejected_begin_closes_without_retry(self):
        provider = Provider({"type": "Error"})
        self.connect.return_value = provider
        with self.assertRaises(RuntimeError):
            await assemblyai.connect()
        self.connect.assert_awaited_once()
        self.assertTrue(provider.closed)
        self.assertIn(json.dumps({"type": "Terminate"}), provider.sent)

    async def test_error_after_begin_reaches_interface_and_closes(self):
        provider = Provider()
        provider.incoming.put_nowait(json.dumps({"type": "Error"}))
        self.connect.return_value = provider
        front = Frontend([{"bytes": b"\0" * 1600}])
        await asyncio.wait_for(websocket_endpoint(front), 2)
        self.assertTrue(any(x.get("error") for x in front.messages))
        self.assertTrue(provider.closed)
        self.connect.assert_awaited_once()

    async def test_cancel_during_begin_terminates_connection(self):
        provider = Provider()
        provider.incoming.get_nowait()
        self.connect.return_value = provider
        task = asyncio.create_task(assemblyai.connect())
        await asyncio.sleep(0.01)
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertTrue(provider.closed)
        self.assertIn(json.dumps({"type": "Terminate"}), provider.sent)

    async def test_close_even_if_terminate_send_fails(self):
        provider = Provider()
        provider.send = AsyncMock(side_effect=OSError("mock failure"))
        await assemblyai.terminate(provider)
        self.assertTrue(provider.closed)

    async def test_stale_audio_is_dropped_and_stop_does_not_send(self):
        buffer = AudioBuffer(8)
        buffer.push(b"\0" * 1600, time.monotonic() - 10)
        provider = Provider()
        task = asyncio.create_task(assemblyai.send_audio(buffer, lambda: provider, lambda: True))
        await asyncio.sleep(0.01)
        task.cancel()
        await task
        self.assertEqual(provider.sent, [])
        self.assertEqual(buffer.stats.dropped, 1)
        buffer.push(b"\0" * 1600, time.monotonic())
        await assemblyai.send_audio(buffer, lambda: provider, lambda: False)
        self.assertEqual(provider.sent, [])


if __name__ == "__main__":
    unittest.main()
