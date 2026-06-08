#!/usr/bin/env python3
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "app"))

from transcript_manager import TranscriptManager


def main():
    manager = TranscriptManager()
    texts_dir = manager.texts_dir

    txt_files = sorted(texts_dir.glob("*.txt"))
    if not txt_files:
        print("Nenhum arquivo .txt encontrado em", texts_dir)
        return

    for txt in txt_files:
        text = txt.read_text(encoding="utf-8")
        base = txt.stem
        pdf_name = f"{base}.pdf"
        print("Gerando PDF para", txt.name, "->", pdf_name)
        manager.save_as_pdf(text, title=base, filename=pdf_name)

    print("Reprocessamento concluído.")


if __name__ == "__main__":
    main()
