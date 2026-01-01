import os
import json
from pypdf import PdfReader

def transcribe_manual(pdf_path, output_json):
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return

    print(f"Processing {pdf_path}...")
    reader = PdfReader(pdf_path)
    indexed_data = []

    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        indexed_data.append({
            "page": i + 1,
            "content": text.strip()
        })
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1} pages...")

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(indexed_data, f, ensure_ascii=False, indent=2)
    
    print(f"Success! Manual indexed to {output_json}")

if __name__ == "__main__":
    transcribe_manual("public/game-manual.pdf", "src/data/manual-index.json")
