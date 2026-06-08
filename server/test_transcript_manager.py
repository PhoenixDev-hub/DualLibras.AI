#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.transcript_manager import TranscriptManager


def test_transcript_manager():
    print("=" * 60)
    print("Testando TranscriptManager")
    print("=" * 60)

    manager = TranscriptManager()
    print(f"\n✓ TranscriptManager inicializado")
    print(f"  Base path: {manager.base_path}")
    print(f"  PDF dir: {manager.pdfs_dir}")
    print(f"  Text dir: {manager.texts_dir}")
    print(f"  Metadata dir: {manager.metadata_dir}")

    test_text = """
    Bom dia a todos! Bem-vindo ao Festival 2026.

    Esta é uma transcrição de teste para validar o sistema de salvamento em PDF,
    texto e JSON. O sistema está organizado em pastas estruturadas para melhor
    gerenciamento dos arquivos.

    As transcrições sunt automaticamente salvas em múltiplos formatos para facilitar
    o acesso e o compartilhamento dos documentos.
    """

    print("\n" + "=" * 60)
    print("Salvando transcrição em múltiplos formatos...")
    print("=" * 60)

    try:
        results = manager.save_transcript(
            text=test_text,
            title="Transcição de Teste - Festival 2026",
            formats=["pdf", "txt", "json"],
            evento="Festival 2026",
            palestrante="Sistema de Teste",
        )

        print("\n✓ Transcrição salva com sucesso!")
        for fmt, filepath in results.items():
            size_kb = filepath.stat().st_size / 1024
            print(f"  [{fmt.upper()}] {filepath.name} ({size_kb:.1f} KB)")

    except Exception as e:
        print(f"\n✗ Erro ao salvar transcrição: {e}")
        import traceback

        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("Listando transcrições salvas...")
    print("=" * 60)

    try:
        transcripts = manager.list_transcripts()
        print(f"\n✓ Transcrições encontradas:")
        print(f"  PDFs: {len(transcripts['pdfs'])}")
        for pdf in transcripts["pdfs"]:
            print(f"    - {pdf}")
        print(f"  Texts: {len(transcripts['texts'])}")
        for txt in transcripts["texts"]:
            print(f"    - {txt}")
        print(f"  Metadata: {len(transcripts['metadata'])}")
        for meta in transcripts["metadata"]:
            print(f"    - {meta}")

    except Exception as e:
        print(f"\n✗ Erro ao listar transcrições: {e}")
        import traceback

        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✓ Todos os testes passaram com sucesso!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_transcript_manager()
    sys.exit(0 if success else 1)
