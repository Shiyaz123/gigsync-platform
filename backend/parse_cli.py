import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from resumes.document_parser import parse_document
from resumes.gemini_extractor import extract_with_gemini
from resumes.validator import validate_extracted_resume

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python parse_cli.py <path_to_resume_file>"}))
        sys.exit(1)

    file_path = Path(sys.argv[1])
    if not file_path.exists():
        print(json.dumps({"error": f"File '{file_path}' does not exist."}))
        sys.exit(1)

    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        raw_text, is_scanned, warnings = parse_document(file_bytes, file_path.name)

        if not raw_text and not is_scanned:
            print(json.dumps({
                "success": False,
                "error": warnings[0] if warnings else "Empty document."
            }))
            sys.exit(0)

        mime_type = "application/pdf" if file_path.suffix.lower() == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        extracted_data, is_gemini, gemini_note = extract_with_gemini(
            text=raw_text,
            file_bytes=file_bytes if is_scanned else None,
            mime_type=mime_type if is_scanned else None
        )

        cleaned_profile, validation_warnings, confidence = validate_extracted_resume(
            extracted_data,
            raw_text=raw_text
        )

        all_warnings = warnings + validation_warnings
        if gemini_note:
            all_warnings.append(gemini_note)

        output = {
            "success": True,
            "filename": file_path.name,
            "file_size": len(file_bytes),
            "extracted_profile": cleaned_profile,
            "confidence_score": confidence,
            "warnings": all_warnings,
            "source_method": "gemini-3.5-flash-lite" if is_gemini else "pymupdf_python_parser"
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
