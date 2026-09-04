"""OCR / text extraction from PDF, images, and plain text."""

from __future__ import annotations

import io
from pathlib import Path

from pypdf import PdfReader


def extract_text_from_bytes(data: bytes, filename: str) -> dict:
    """
    Extract text from uploaded file bytes.
    Returns {text, method, pages_or_note}.
    """
    name = (filename or "").lower()
    suffix = Path(name).suffix

    # 1. DOCX and OOXML Word processing formats
    if suffix in (".docx", ".docm", ".dotx") or (
        data.startswith(b"PK\x03\x04") and suffix not in (".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp")
    ):
        return _from_docx(data)

    # 2. Plain text formats
    if suffix in (".txt", ".md"):
        text = data.decode("utf-8", errors="replace")
        return {"text": text.strip(), "method": "plaintext", "note": "UTF-8 text file"}

    # 3. PDF documents
    if suffix == ".pdf":
        return _from_pdf(data)

    # 4. Scanned image formats
    if suffix in (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"):
        return _from_image(data)

    # 5. Legacy .doc or unknown format fallback
    if suffix == ".doc":
        try:
            res = _from_docx(data)
            if res["text"]:
                return res
        except Exception:
            pass

    # Try DOCX then PDF then image then text
    if data.startswith(b"PK\x03\x04"):
        try:
            return _from_docx(data)
        except Exception:
            pass

    try:
        return _from_pdf(data)
    except Exception:
        pass
    try:
        return _from_image(data)
    except Exception:
        pass

    # Clean text fallback - never allow raw binary ZIP headers through
    if data.startswith(b"PK\x03\x04"):
        return {"text": "", "method": "corrupt-zip", "note": "Unreadable or corrupted DOCX/ZIP archive"}

    text = data.decode("utf-8", errors="replace")
    # Discard non-printable binary data if decoded as garbage
    if "\x00" in text[:200]:
        return {"text": "", "method": "binary-unsupported", "note": "Unsupported binary format"}

    return {"text": text.strip(), "method": "plaintext-fallback", "note": "Decoded as text"}


def _from_docx(data: bytes) -> dict:
    """
    Extract clean paragraph and table text from DOCX bytes.
    Uses python-docx with in-memory zip/xml fallback.
    """
    text = ""
    method = "python-docx"
    note = ""

    # Primary method: python-docx
    try:
        import docx
        from docx.text.paragraph import Paragraph
        from docx.table import Table

        doc = docx.Document(io.BytesIO(data))
        parts = []

        # Iterate document body elements in true reading order (paragraphs and tables)
        for element in doc.element.body:
            tag = element.tag.lower()
            if tag.endswith("p"):
                p = Paragraph(element, doc)
                txt = p.text.strip()
                if txt:
                    parts.append(txt)
            elif tag.endswith("tbl"):
                tbl = Table(element, doc)
                tbl_lines = []
                for row in tbl.rows:
                    seen = set()
                    row_cells = []
                    for cell in row.cells:
                        if cell._tc not in seen:
                            seen.add(cell._tc)
                            c_txt = cell.text.strip()
                            if c_txt:
                                row_cells.append(c_txt)
                    if row_cells:
                        tbl_lines.append(" | ".join(row_cells))
                if tbl_lines:
                    parts.append("\n".join(tbl_lines))

        # Fallback to direct paragraphs if element.body was empty
        if not parts and doc.paragraphs:
            for p in doc.paragraphs:
                txt = p.text.strip()
                if txt:
                    parts.append(txt)

        text = "\n\n".join(parts).strip()
        note = f"{len(doc.paragraphs)} paragraph(s), {len(doc.tables)} table(s)"
    except Exception as e:
        # Fallback to direct XML extraction from docx zip
        text = _from_docx_zip(data)
        method = "docx-xml-fallback"
        note = f"Extracted via document.xml ({e})"

    # If python-docx yielded empty string, try XML fallback
    if not text:
        text = _from_docx_zip(data)
        if text:
            method = "docx-xml-fallback"
            note = "Extracted via document.xml"

    return {
        "text": text.strip(),
        "method": method,
        "note": note or "DOCX document",
    }


def _from_docx_zip(data: bytes) -> str:
    """Fallback XML parser for word/document.xml in DOCX zip archives."""
    import zipfile
    import xml.etree.ElementTree as ET

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            if "word/document.xml" not in zf.namelist():
                return ""
            xml_content = zf.read("word/document.xml")
            root = ET.fromstring(xml_content)
            paragraphs = []
            for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts = [
                    node.text
                    for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
                    if node.text
                ]
                if texts:
                    clean_para = "".join(texts).strip()
                    if clean_para:
                        paragraphs.append(clean_para)
            return "\n\n".join(paragraphs)
    except Exception:
        return ""


def _from_pdf(data: bytes) -> dict:
    reader = PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    text = "\n\n".join(parts).strip()
    if len(text) < 20:
        # Likely scanned PDF — try rasterize+OCR if possible
        ocr = _ocr_pdf_pages(data)
        if ocr["text"]:
            return ocr
    return {
        "text": text,
        "method": "pypdf",
        "note": f"{len(reader.pages)} page(s)",
    }


def _from_image(data: bytes) -> dict:
    try:
        from PIL import Image
        import pytesseract
    except ImportError as e:
        raise RuntimeError("Pillow/pytesseract required for image OCR") from e

    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    try:
        text = pytesseract.image_to_string(img)
        method = "tesseract"
        note = "pytesseract OCR"
    except Exception as e:
        # Graceful fallback when tesseract binary missing
        text = ""
        method = "tesseract-unavailable"
        note = f"OCR unavailable ({e}); upload a text/PDF with embedded text"
    return {"text": (text or "").strip(), "method": method, "note": note}


def _ocr_pdf_pages(data: bytes) -> dict:
    """Best-effort: if pdf2image unavailable, return empty."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError:
        return {"text": "", "method": "pdf-ocr-unavailable", "note": "scanned PDF needs pdf2image"}

    images = convert_from_bytes(data, dpi=200)
    parts = [pytesseract.image_to_string(im) for im in images]
    return {
        "text": "\n\n".join(parts).strip(),
        "method": "pdf-tesseract",
        "note": f"OCR on {len(images)} page(s)",
    }
