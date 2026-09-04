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

    if suffix in (".txt", ".md"):
        text = data.decode("utf-8", errors="replace")
        return {"text": text.strip(), "method": "plaintext", "note": "UTF-8 text file"}

    if suffix == ".pdf":
        return _from_pdf(data)

    if suffix in (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"):
        return _from_image(data)

    # Try PDF then image then text
    try:
        return _from_pdf(data)
    except Exception:
        pass
    try:
        return _from_image(data)
    except Exception:
        pass
    text = data.decode("utf-8", errors="replace")
    return {"text": text.strip(), "method": "plaintext-fallback", "note": "Decoded as text"}


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
