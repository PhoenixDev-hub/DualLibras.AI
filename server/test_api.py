#!/usr/bin/env python3
import sys
import json
import asyncio
import time

import httpx

BASE_URL = "http://localhost:5455"
STARTUP_TIMEOUT = 10


async def wait_for_server(timeout: int = STARTUP_TIMEOUT) -> bool:
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            async with httpx.AsyncClient(timeout=2) as client:
                response = await client.get(f"{BASE_URL}/health")
                if response.status_code == 200:
                    print("✓ Servidor online")
                    return True
        except (httpx.ConnectError, httpx.ReadTimeout):
            await asyncio.sleep(0.5)

    print("✗ Timeout: servidor não respondeu")
    return False


async def test_endpoints():
    print("\n" + "=" * 60)
    print("Testando Endpoints da API")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=10) as client:
        print("\n1. GET /health")
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Resposta: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"   ✗ Erro: {e}")
            return False

        print("\n2. GET /upload-status")
        try:
            response = await client.get(f"{BASE_URL}/upload-status")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Status: {data['status']}")
                print(f"   - PDFs: {data['counts']['pdfs']}")
                print(f"   - Texts: {data['counts']['texts']}")
                print(f"   - Metadata: {data['counts']['metadata']}")
                print(f"   - Tamanho total: {data['total_size_mb']} MB")
        except Exception as e:
            print(f"   ✗ Erro: {e}")
            return False

        print("\n3. GET /transcripts")
        try:
            response = await client.get(f"{BASE_URL}/transcripts")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Total: {data['total']}")
                if data["pdfs"]:
                    print(f"   - PDFs: {', '.join(data['pdfs'][:2])}")
        except Exception as e:
            print(f"   ✗ Erro: {e}")
            return False

        print("\n4. POST /save-transcript")
        try:
            payload = {
                "text": "Esta é uma transcrição de teste da API. O sistema está funcionando corretamente!",
                "title": "Teste de API",
                "formats": ["pdf", "txt", "json"],
                "metadata": {
                    "evento": "Festival 2026",
                    "tipo": "teste",
                    "versao": "1.0",
                },
            }

            response = await client.post(f"{BASE_URL}/save-transcript", json=payload)
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ {data['message']}")
                print(f"   - Formatos salvos: {', '.join(data['files'].keys())}")

                if "pdf" in data["files"]:
                    pdf_file = data["files"]["pdf"].split("/")[-1]
                    print(f"\n5. GET /transcripts/download/{pdf_file}")
                    try:
                        response = await client.get(
                            f"{BASE_URL}/transcripts/download/{pdf_file}"
                        )
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            size_kb = len(response.content) / 1024
                            print(f"   ✓ PDF baixado com sucesso ({size_kb:.1f} KB)")
                    except Exception as e:
                        print(f"   ✗ Erro ao baixar: {e}")
            else:
                print(f"   ✗ Erro: {response.text}")
                return False

        except Exception as e:
            print(f"   ✗ Erro: {e}")
            import traceback

            traceback.print_exc()
            return False

    print("\n" + "=" * 60)
    print("✓ Todos os testes passaram!")
    print("=" * 60)
    return True


async def main():
    print("=" * 60)
    print("Testador de API do Festival 2026")
    print("=" * 60)

    print("\nAguardando servidor ficar online...")
    if not await wait_for_server():
        print("\n✗ Não foi possível conectar ao servidor.")
        print(f"  Execute: cd server && source venv/bin/activate && python main.py")
        return False

    success = await test_endpoints()
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
