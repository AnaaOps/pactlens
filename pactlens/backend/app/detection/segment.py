"""
Clause segmentation using structural rules — no LLM.

Splits contract text into clauses via:
  - Numbered headings (1., 1.1, Clause 3, Article IV, etc.)
  - ALL-CAPS / Title-Case section headers
  - Common Indian rental / gig / freelance clause patterns
  - Paragraph breaks as fallback
"""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Any


@dataclass
class Clause:
    id: str
    index: int
    title: str
    text: str
    source: str  # "old" | "new"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# Numbered / lettered clause starts
_NUMBERED = re.compile(
    r"^(?:"
    r"(?:clause|section|article|schedule)\s+[A-Z0-9IVXLC]+[.\):]?\s*"
    r"|"
    r"\d+(?:\.\d+)*[.\)]\s+"
    r"|"
    r"[A-Z][.\)]\s+"
    r"|"
    r"\([a-z0-9]+\)\s+"
    r")",
    re.IGNORECASE,
)

# Known Indian rental / gig / freelance heading keywords
_KNOWN_HEADINGS = re.compile(
    r"^(?:"
    r"security\s+deposit|security\s+money|refund|deposit\s+refund|"
    r"notice\s+period|termination|lock[\s-]?in|lockin|"
    r"rent(?:al)?(?:\s+amount)?|monthly\s+rent|payment|"
    r"maintenance|repairs?|landlord(?:'?s)?\s+obligations?|"
    r"tenant(?:'?s)?\s+obligations?|liability|indemnif|"
    r"auto[\s-]?renew(?:al)?|renewal|arbitration|dispute\s+resolution|"
    r"governing\s+law|jurisdiction|commission|platform\s+fee|"
    r"service\s+fee|cancellation|scope\s+of\s+work|deliverables?|"
    r"payment\s+terms|intellectual\s+property|confidential|"
    r"force\s+majeure|subletting|occupancy|utilities|"
    r"parking|pets?|visitors?|alterations|"
    r"data\s+privacy|account\s+suspension|rating|"
    r"vendor\s+obligations?|sla|service\s+levels?"
    r")\b",
    re.IGNORECASE,
)

_ALLCAPS_HEADER = re.compile(r"^[A-Z][A-Z\s\-/&]{3,60}$")
_TITLE_HEADER = re.compile(r"^[A-Z][A-Za-z0-9\s\-/&',()]{2,80}:?\s*$")


def _normalize_ws(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _is_heading(line: str) -> bool:
    s = line.strip()
    if not s or len(s) > 120:
        return False
    if _NUMBERED.match(s):
        return True
    if _KNOWN_HEADINGS.match(s.rstrip(":")):
        return True
    if _ALLCAPS_HEADER.match(s) and len(s.split()) <= 10:
        return True
    # Short title ending with colon
    if s.endswith(":") and len(s) < 80 and not s.endswith("."):
        return True
    return False


def _extract_title(first_line: str) -> tuple[str, str]:
    """Return (title, remainder_of_first_line)."""
    s = first_line.strip()
    m = _NUMBERED.match(s)
    if m:
        rest = s[m.end() :].strip()
        # Title may be rest of line until period or end
        if ":" in rest[:60]:
            title, body = rest.split(":", 1)
            return title.strip() or s[:40], body.strip()
        # If rest is short, treat whole as title+body later
        words = rest.split()
        if len(words) <= 8 and not rest.endswith("."):
            return rest or s[:40], ""
        # First few words as title
        title_words = words[:6]
        return " ".join(title_words), rest

    if s.endswith(":"):
        return s[:-1].strip(), ""
    if _KNOWN_HEADINGS.match(s) or _ALLCAPS_HEADER.match(s):
        return s.rstrip(":"), ""
    return s[:60], s


def segment_clauses(text: str, source: str = "old") -> list[Clause]:
    """Split contract text into numbered Clause objects."""
    text = _normalize_ws(text or "")
    if not text:
        return []

    lines = text.split("\n")
    blocks: list[list[str]] = []
    current: list[str] = []

    for line in lines:
        raw = line.rstrip()
        stripped = raw.strip()
        if not stripped:
            if current:
                # blank line may end a block if next is heading — keep for now
                current.append("")
            continue

        if _is_heading(stripped) and current:
            # flush previous
            blocks.append(current)
            current = [stripped]
        elif _is_heading(stripped) and not current:
            current = [stripped]
        else:
            if not current:
                current = [stripped]
            else:
                current.append(stripped)

    if current:
        blocks.append(current)

    # If almost no structure found, fall back to double-newline paragraphs
    if len(blocks) <= 1:
        paras = re.split(r"\n\s*\n", text)
        blocks = [[p.strip()] for p in paras if p.strip()]

    clauses: list[Clause] = []
    for i, block_lines in enumerate(blocks):
        # Drop trailing empty lines
        while block_lines and not block_lines[-1].strip():
            block_lines.pop()
        if not block_lines:
            continue
        title, remainder = _extract_title(block_lines[0])
        body_parts = []
        if remainder:
            body_parts.append(remainder)
        body_parts.extend(block_lines[1:])
        body = " ".join(p for p in body_parts if p).strip()
        full_text = f"{title}. {body}".strip() if body else title
        # Prefer body as text for matching; keep title separate
        clause_text = body if body else title
        clauses.append(
            Clause(
                id=f"{source}-{i + 1}",
                index=i + 1,
                title=title[:120],
                text=clause_text,
                source=source,
            )
        )

    return clauses
