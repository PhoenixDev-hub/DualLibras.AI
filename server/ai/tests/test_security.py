"""Offline regressions: auth, path containment, limits and isolation. No providers."""
import asyncio
import base64
import importlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException

_temp = tempfile.TemporaryDirectory()
os.environ['OUTPUT_PATH'] = _temp.name
os.environ['DOCUMENTATION_OUTPUT_DIR'] = _temp.name
api = importlib.import_module('app.api.app')
from app.api import security
from app.realtime.audio import TranscriptSaver

USER_A = '00000000-0000-4000-8000-000000000001'
USER_B = '00000000-0000-4000-8000-000000000002'
ROOM = '00000000-0000-4000-8000-000000000003'
LESSON = '00000000-0000-4000-8000-000000000004'
MATERIAL = '00000000-0000-4000-8000-000000000005'


def lookup(headers, action, lesson_id, material_id):
    token = headers.get('authorization', '')
    if token not in ('Bearer A', 'Bearer B'): raise HTTPException(401, 'Invalid session')
    if lesson_id and token == 'Bearer B': raise HTTPException(403, 'Not a member')
    return {'userId': USER_A if token == 'Bearer A' else USER_B, 'role': 'PROFESSOR',
            'lessonId': lesson_id, 'classroomId': ROOM if lesson_id or material_id else None}


class SecurityTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = self.enterContext(tempfile.TemporaryDirectory())
        self.enterContext(patch.object(api, 'STORAGE_ROOT', Path(self.directory)))
        self.enterContext(patch.object(api, 'MATERIAL_OUTPUT_DIR', Path(self.directory) / 'materials'))
        self.enterContext(patch.object(security, 'lookup_session', side_effect=lookup))
        self.enterContext(patch.object(security, 'INTERNAL_TOKEN', 'internal-test-only'))
        self.enterContext(patch('socket.socket.connect', side_effect=AssertionError('Network forbidden')))
        security.limiter.windows.clear()
        security.sessions.clear()
        self.client = await self.enterAsyncContext(httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://offline'))

    async def test_authentication_revocation_and_scoped_downloads(self):
        for token in ('', 'Bearer revoked'):
            response = await self.client.get('/transcripts', headers={'Authorization': token})
            self.assertEqual(response.status_code, 401)
        created = await self.client.post('/save-transcript', headers={'Authorization': 'Bearer A'}, json={'text': 'Private A'})
        self.assertEqual(created.status_code, 200)
        name = created.json()['files']['txt']
        self.assertEqual((await self.client.get('/transcripts/download/' + name, headers={'Authorization': 'Bearer A'})).text, 'Private A')
        self.assertEqual((await self.client.get('/transcripts/download/' + name, headers={'Authorization': 'Bearer B'})).status_code, 404)
        self.assertEqual((await self.client.get('/transcripts', headers={'Authorization': 'Bearer B'})).json()['total'], 0)
        self.assertEqual((await self.client.get('/transcripts?lesson_id=' + LESSON, headers={'Authorization': 'Bearer B'})).status_code, 403)
        shared = await self.client.post('/save-transcript?lesson_id=' + LESSON, headers={'Authorization': 'Bearer A'}, json={'text': 'Lesson'})
        self.assertEqual(shared.status_code, 200)
        self.assertNotIn(shared.json()['files']['txt'], (await self.client.get('/transcripts', headers={'Authorization': 'Bearer A'})).json()['texts'])

    async def test_ingest_validates_id_filename_internal_auth_and_size(self):
        headers = {'Authorization': 'Bearer A', 'X-AI-Internal-Token': 'internal-test-only'}
        data = {'material_id': MATERIAL, 'filename': 'a.txt', 'display_type': 'Texto', 'content_base64': base64.b64encode(b'Hello').decode()}
        self.assertEqual((await self.client.post('/materials/ingest', headers={'Authorization': 'Bearer A'}, json=data)).status_code, 403)
        for key, value in [('material_id', '../escape'), ('filename', '../escape.txt'), ('filename', 'bad\\a.txt'), ('content_base64', '***')]:
            response = await self.client.post('/materials/ingest', headers=headers, json={**data, key: value})
            self.assertIn(response.status_code, (400, 422))
        with patch.object(security, 'MATERIAL_MAX_BYTES', 1):
            self.assertEqual((await self.client.post('/materials/ingest', headers=headers, json=data)).status_code, 413)
        self.assertEqual((await self.client.post('/materials/ingest', headers=headers, json=data)).status_code, 200)
        self.assertEqual(list(Path(self.directory).rglob('*.txt'))[0].read_text(), 'Hello')

    async def test_csrf_request_size_and_rate_limit(self):
        self.assertEqual((await self.client.post('/save-transcript', headers={'Cookie': 'session=x'}, json={'text': 'x'})).status_code, 403)
        self.assertEqual((await self.client.get('/transcripts', headers={'Authorization': 'Bearer A', 'Origin': 'https://evil.invalid'})).status_code, 403)
        with patch.object(security, 'HTTP_MAX_BYTES', 2):
            self.assertEqual((await self.client.post('/save-transcript', headers={'Authorization': 'Bearer A'}, json={'text': 'x'})).status_code, 413)
        security.limiter.windows.clear()
        with patch.object(security, 'REQUESTS_PER_MINUTE', 1):
            self.assertEqual((await self.client.get('/transcripts', headers={'Authorization': 'Bearer A'})).status_code, 200)
            self.assertEqual((await self.client.get('/transcripts', headers={'Authorization': 'Bearer A'})).status_code, 429)

    async def test_live_sessions_are_isolated_and_symlinks_rejected(self):
        first = TranscriptSaver(Path(self.directory) / 'session-a')
        second = TranscriptSaver(Path(self.directory) / 'session-b')
        first.save_final('A', 'Professor'); second.save_final('B', 'Professor')
        self.assertEqual(json.loads(first.json_file.read_text())[0]['text'], 'A')
        self.assertEqual(json.loads(second.json_file.read_text())[0]['text'], 'B')
        root = Path(self.directory) / 'allowed'; root.mkdir()
        (root / 'escape').symlink_to(Path(self.directory) / 'session-a', target_is_directory=True)
        with self.assertRaises(HTTPException): security.contained(root, 'escape', 'transcricao.txt')
        security.acquire_session(USER_A)
        with self.assertRaises(HTTPException): security.acquire_session(USER_A)
        security.release_session(USER_A)
        self.assertEqual(security.sessions, {})

    async def test_websocket_revocation_duration_and_no_provider_on_rejection(self):
        from test_audio_pipeline import Frontend
        ws = Frontend([])
        ws.headers = {'authorization': 'Bearer revoked'}
        with patch.object(api, 'ClientSession') as session:
            await api.websocket_endpoint(ws)
            session.assert_not_called()
        ws = Frontend([]); ws.headers = {'authorization': 'Bearer A'}
        with patch.object(security, 'RECHECK_SECONDS', 0.01), patch.object(security, 'lookup_session', side_effect=[lookup(ws.headers, 'capture', None, None), HTTPException(401, 'revoked')]), patch.object(api.ClientSession, 'start') as provider:
            await asyncio.wait_for(api.websocket_endpoint(ws), 1)
            self.assertTrue(any(message.get('error') for message in ws.messages))
            provider.assert_not_called()
        ws = Frontend([]); ws.headers = {'authorization': 'Bearer A'}
        with patch.object(security, 'SESSION_SECONDS', 0.01):
            await asyncio.wait_for(api.websocket_endpoint(ws), 1)
        self.assertEqual(security.sessions, {})
