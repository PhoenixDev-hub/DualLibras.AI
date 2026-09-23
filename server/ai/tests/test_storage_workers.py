"""Offline storage/concurrency regressions. Never contacts a provider or database."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
import importlib
import json
import os
import tempfile
import threading
import unittest
from unittest.mock import patch

import httpx

_storage = tempfile.TemporaryDirectory()
os.environ["OUTPUT_PATH"] = _storage.name
os.environ["DOCUMENTATION_OUTPUT_DIR"] = _storage.name
api = importlib.import_module("app.api.app")
from app.services.transcripts import TranscriptManager
from app.api import security


class StorageWorkersTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        security.limiter.windows.clear()
        self.enterContext(patch.object(security, 'lookup_session', return_value={'userId': '00000000-0000-4000-8000-000000000001', 'role': 'PROFESSOR'}))

    async def test_export_does_not_block_event_loop(self):
        entered = threading.Event()
        release = threading.Event()
        worker_threads = []
        main_thread = threading.get_ident()

        def slow_export(**kwargs):
            worker_threads.append(threading.get_ident())
            entered.set()
            if not release.wait(2):
                raise RuntimeError("Exporter ran on the event loop or was never released")
            return {}

        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=api.app), base_url="http://offline", headers={"Authorization": "Bearer offline-test"}
        ) as client:
            with patch.object(TranscriptManager, "save_transcript", side_effect=slow_export):
                exporting = asyncio.create_task(
                    client.post("/save-transcript", json={"text": "Aula de teste"})
                )
                try:
                    for _ in range(200):
                        if entered.is_set():
                            break
                        await asyncio.sleep(0.005)
                    self.assertTrue(entered.is_set())
                    self.assertNotEqual(worker_threads, [main_thread])
                    response = await asyncio.wait_for(client.get("/health"), 1)
                    self.assertEqual(response.status_code, 200)
                    self.assertFalse(
                        exporting.done(), "health must respond before the export finishes"
                    )
                finally:
                    release.set()
                    response = await exporting
                self.assertEqual(response.status_code, 200)

    async def test_blank_transcript_keeps_validation(self):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=api.app), base_url="http://offline", headers={"Authorization": "Bearer offline-test"}
        ) as client:
            response = await client.post("/save-transcript", json={"text": "   "})
            self.assertEqual(response.status_code, 400)


class TranscriptStorageTest(unittest.TestCase):
    def test_export_keeps_all_formats_and_portuguese_text(self):
        with tempfile.TemporaryDirectory() as directory:
            manager = TranscriptManager(directory)
            text = "Aula de português: ação, atenção e inclusão."
            files = manager.save_transcript(text, title="Aula de teste")
            self.assertEqual(set(files), {"pdf", "txt", "json"})
            self.assertTrue(files["pdf"].read_bytes().startswith(b"%PDF-"))
            self.assertEqual(files["txt"].read_text(), text)
            self.assertEqual(json.loads(files["json"].read_text())["text"], text)

    def test_concurrent_exports_have_unique_names_and_matching_formats(self):
        with tempfile.TemporaryDirectory() as directory:
            manager = TranscriptManager(directory)

            def export(index):
                return manager.save_transcript(f"Texto {index}", formats=["txt", "json"])

            with ThreadPoolExecutor(max_workers=4) as pool:
                results = list(pool.map(export, range(20)))
            self.assertEqual(len({str(result["txt"]) for result in results}), 20)
            for index, result in enumerate(results):
                self.assertEqual(result["txt"].read_text(), f"Texto {index}")
                metadata = json.loads(result["json"].read_text())
                self.assertEqual(metadata["text"], f"Texto {index}")
                self.assertEqual(result["txt"].stem, metadata["filename_base"])

    def test_pdf_font_is_loaded_once_across_manager_instances(self):
        with tempfile.TemporaryDirectory() as directory:
            first = TranscriptManager(directory)
            second = TranscriptManager(directory)
            with patch.object(TranscriptManager, "_fonts_registered", False), patch.object(
                TranscriptManager, "_load_fonts"
            ) as load:
                with ThreadPoolExecutor(max_workers=4) as pool:
                    list(
                        pool.map(
                            lambda i: (first if i % 2 else second)._register_fonts(), range(20)
                        )
                    )
                self.assertEqual(load.call_count, 1)
