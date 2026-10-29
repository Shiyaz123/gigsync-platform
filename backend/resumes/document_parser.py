import io
import re
from typing import Tuple, List
import pymupdf  # PyMuPDF (fitz)
import docx

def normalize_text(text: str) -> str:
    """Normalize whitespace while preserving line and section boundaries."""
    if not text:
        return ""
    # Normalize carriage returns
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Collapse multiple horizontal spaces and tabs on the same line
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    # Collapse 3 or more blank lines into a double newline
    normalized = '\n'.join(lines)
    normalized = re.sub(r'\n{3,}', '\n\n', normalized)
    return normalized.strip()

def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, bool, List[str]]:
    """
    Extract readable text from PDF bytes page by page using PyMuPDF (fitz).
    NEVER decode raw PDF bytes as plain text.
    Returns: (extracted_text, is_scanned, warnings)
    """
    warnings: List[str] = []
    if not file_bytes:
        return "", False, ["Uploaded PDF file is empty."]

    # Safety check: Verify PDF magic header bytes %PDF-
    if not file_bytes.startswith(b'%PDF-'):
        return "", False, ["File does not have a valid PDF header."]

    try:
        # Open PDF document via PyMuPDF stream
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        return "", False, [f"Corrupted or invalid PDF structure: {str(e)}"]

    if doc.is_encrypted:
        return "", False, ["PDF document is password-protected or encrypted."]

    num_pages = len(doc)
    if num_pages == 0:
        return "", False, ["PDF document contains no pages."]

    extracted_pages: List[str] = []
    total_chars = 0

    for page_num in range(num_pages):
        page = doc[page_num]
        # Extract text page by page preserving layout
        page_text = page.get_text("text") or ""
        cleaned_page = normalize_text(page_text)
        if cleaned_page:
            extracted_pages.append(cleaned_page)
            total_chars += len(cleaned_page)

    full_text = "\n\n".join(extracted_pages).strip()

    # Detect scanned documents (pages present but virtually no extractable text)
    is_scanned = False
    if total_chars < 30 and num_pages > 0:
        is_scanned = True
        warnings.append(
            "Document appears to be a scanned image with no embedded text. "
            "Please use Gemini multimodal input or enter profile details manually."
        )

    return full_text, is_scanned, warnings

def extract_text_from_docx(file_bytes: bytes) -> Tuple[str, bool, List[str]]:
    """
    Extract text from DOCX bytes using python-docx.
    Iterates through paragraphs and tables.
    Returns: (extracted_text, is_scanned, warnings)
    """
    warnings: List[str] = []
    if not file_bytes:
        return "", False, ["Uploaded DOCX file is empty."]

    try:
        file_stream = io.BytesIO(file_bytes)
        doc = docx.Document(file_stream)
    except Exception as e:
        return "", False, [f"Corrupted or invalid DOCX document: {str(e)}"]

    content_blocks: List[str] = []

    # Extract all paragraphs
    for p in doc.paragraphs:
        p_text = p.text.strip()
        if p_text:
            content_blocks.append(p_text)

    # Extract all tables
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                # Deduplicate identical adjacent cells caused by merged table cells
                unique_cells = []
                for c in row_cells:
                    if not unique_cells or unique_cells[-1] != c:
                        unique_cells.append(c)
                content_blocks.append(" | ".join(unique_cells))

    full_text = normalize_text("\n".join(content_blocks))
    if not full_text:
        warnings.append("DOCX document contains no readable text content.")

    return full_text, False, warnings

def parse_document(file_bytes: bytes, filename: str) -> Tuple[str, bool, List[str]]:
    """
    Dispatcher based on filename extension.
    Never passes raw binary bytes into string text parsers.
    """
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif lower.endswith(".txt"):
        try:
            text = file_bytes.decode('utf-8')
            return normalize_text(text), False, []
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode('latin-1')
                return normalize_text(text), False, ["File decoded using latin-1 fallback."]
            except Exception as e:
                return "", False, [f"Could not decode text file: {str(e)}"]
    else:
        return "", False, [f"Unsupported file format '{filename}'. Please upload PDF, DOCX, or TXT."]
