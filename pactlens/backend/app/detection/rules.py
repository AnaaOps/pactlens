"""
Structured risk rules (deterministic). Each rule inspects matched clause
pairs and emits High / Medium / Low with a plain rule-based reason.

No LLM involvement.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Any, Callable, Optional


@dataclass
class RiskFinding:
    rule_id: str
    rule_name: str
    severity: str  # High | Medium | Low
    reason: str
    match_id: str
    status: str
    old_text: str
    new_text: str
    old_title: str
    new_title: str
    similarity: float
    extracted: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


_DAY = re.compile(
    r"(\d+)\s*(?:calendar\s+)?(?:working\s+)?days?",
    re.IGNORECASE,
)
_MONTH = re.compile(r"(\d+)\s*months?", re.IGNORECASE)
_MONEY = re.compile(r"₹\s*([\d,]+(?:\.\d+)?)|Rs\.?\s*([\d,]+(?:\.\d+)?)|INR\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)
_PCT = re.compile(r"(\d+(?:\.\d+)?)\s*%")

_WORD_NUMS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "twenty-one": 21, "twenty five": 25, "twenty-five": 25,
    "thirty": 30, "thirty-one": 31, "thirty-five": 35, "forty": 40,
    "forty-five": 45, "forty five": 45, "fifty": 50, "sixty": 60,
    "seventy": 70, "eighty": 80, "ninety": 90, "one hundred": 100,
}
_WORD_DAY_RE = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(_WORD_NUMS.keys(), key=len, reverse=True)) + r")\s*(?:calendar\s+)?(?:working\s+)?days?\b",
    re.IGNORECASE,
)
_WORD_MONTH_RE = re.compile(
    r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*months?\b",
    re.IGNORECASE,
)


def _days(text: str) -> list[int]:
    vals = [int(m.group(1)) for m in _DAY.finditer(text or "")]
    vals += [int(m.group(1)) * 30 for m in _MONTH.finditer(text or "")]
    for m in _WORD_DAY_RE.finditer(text or ""):
        word = m.group(1).lower().replace("  ", " ")
        if word in _WORD_NUMS:
            vals.append(_WORD_NUMS[word])
    for m in _WORD_MONTH_RE.finditer(text or ""):
        word = m.group(1).lower()
        if word in _WORD_NUMS:
            vals.append(_WORD_NUMS[word] * 30)
    return vals


def _money(text: str) -> list[float]:
    out = []
    for m in _MONEY.finditer(text or ""):
        raw = m.group(1) or m.group(2) or m.group(3)
        out.append(float(raw.replace(",", "")))
    return out


def _pct(text: str) -> list[float]:
    return [float(m.group(1)) for m in _PCT.finditer(text or "")]


def _blob(old: str, new: str) -> str:
    return f"{old or ''} {new or ''}".lower()


def _first_day(text: str) -> Optional[int]:
    d = _days(text)
    return d[0] if d else None


def _first_money(text: str) -> Optional[float]:
    m = _money(text)
    return m[0] if m else None


def _first_pct(text: str) -> Optional[float]:
    p = _pct(text)
    return p[0] if p else None


RuleFn = Callable[[dict], Optional[RiskFinding]]


def _base(match: dict, rule_id: str, rule_name: str, severity: str, reason: str, extracted: dict) -> RiskFinding:
    old_c = match.get("old_clause") or {}
    new_c = match.get("new_clause") or {}
    return RiskFinding(
        rule_id=rule_id,
        rule_name=rule_name,
        severity=severity,
        reason=reason,
        match_id=match["match_id"],
        status=match["status"],
        old_text=old_c.get("text") or "",
        new_text=new_c.get("text") or "",
        old_title=old_c.get("title") or "",
        new_title=new_c.get("title") or "",
        similarity=float(match.get("similarity") or 0),
        extracted=extracted,
    )


def rule_auto_renewal(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    status = match["status"]
    old_has = bool(re.search(r"auto[\s-]?renew", old, re.I))
    new_has = bool(re.search(r"auto[\s-]?renew", new, re.I))
    if status == "added" and new_has:
        days = _first_day(new)
        return _base(
            match, "auto_renewal_introduced", "Auto-renewal introduced", "High",
            "A new auto-renewal clause appears in the revised contract.",
            {"new_notice_days": days},
        )
    if status == "modified" and new_has and not old_has:
        return _base(
            match, "auto_renewal_introduced", "Auto-renewal introduced", "High",
            "Auto-renewal language was added to a previously non-auto-renewing clause.",
            {"new_notice_days": _first_day(new)},
        )
    if status == "modified" and old_has and new_has:
        od, nd = _first_day(old), _first_day(new)
        if od and nd and nd > od:
            return _base(
                match, "auto_renewal_notice_extended", "Auto-renewal notice window tightened", "High",
                f"Cancellation notice before auto-renewal changed from {od} to {nd} days (harder to cancel).",
                {"old_days": od, "new_days": nd},
            )
    return None


def rule_deposit_refund(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    title = _blob(
        (match.get("old_clause") or {}).get("title") or "",
        (match.get("new_clause") or {}).get("title") or "",
    )
    body = _blob(old, new)
    if not re.search(r"deposit|refund|security", title + " " + body):
        return None
    if match["status"] not in ("modified", "added"):
        return None
    od, nd = _first_day(old), _first_day(new)
    if od and nd and nd > od:
        sev = "High" if (nd - od) >= 30 else "Medium"
        return _base(
            match, "deposit_refund_extended", "Deposit refund timeline extended", sev,
            f"Security deposit refund period extended from {od} days to {nd} days.",
            {"old_days": od, "new_days": nd, "delta_days": nd - od, "numeric_changes": {"old": od, "new": nd}},
        )
    if match["status"] == "added" and nd:
        return _base(
            match, "deposit_refund_extended", "Deposit refund timeline set unfavourably", "Medium",
            f"New deposit refund timeline of {nd} days introduced.",
            {"new_days": nd, "numeric_changes": {"old": None, "new": nd}},
        )
    return None


def rule_notice_period(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    blob = _blob(old, new)
    title = _blob(
        (match.get("old_clause") or {}).get("title") or "",
        (match.get("new_clause") or {}).get("title") or "",
    )
    if not re.search(r"notice|terminat|vacat|lock[\s-]?in", title + " " + blob):
        return None
    if match["status"] != "modified":
        return None
    od, nd = _first_day(old), _first_day(new)
    if od and nd and nd > od:
        # 30 → 60 is Medium; jump of 60+ days is High
        sev = "High" if (nd - od) >= 60 else "Medium"
        return _base(
            match, "notice_period_extended", "Notice period extended", sev,
            f"Notice / lock-in related period extended from {od} to {nd} days.",
            {"old_days": od, "new_days": nd, "delta_days": nd - od},
        )
    return None


def rule_payment_reduced(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    blob = _blob(old, new)
    if not re.search(r"rent|payment|fee|commission|payout|salary|rate|consideration", blob):
        return None
    if match["status"] != "modified":
        return None
    # Prefer percentages for commission, money for rent
    op, np_ = _first_pct(old), _first_pct(new)
    if op is not None and np_ is not None and np_ < op:
        return _base(
            match, "payment_commission_reduced", "Payment / commission reduced", "High",
            f"Commission or share reduced from {op}% to {np_}%.",
            {"old_pct": op, "new_pct": np_, "delta_pct": round(op - np_, 2)},
        )
    if (
        re.search(r"commission|platform\s+fee|service\s+fee", blob)
        and op is not None
        and np_ is not None
        and np_ > op
    ):
        return _base(
            match, "fee_increased", "Platform / service fee increased", "High",
            f"Fee or commission charged to you increased from {op}% to {np_}%.",
            {"old_pct": op, "new_pct": np_, "delta_pct": round(np_ - op, 2)},
        )
    om, nm = _first_money(old), _first_money(new)
    if om is not None and nm is not None and nm < om:
        return _base(
            match, "payment_commission_reduced", "Payment / amount reduced", "High",
            f"Payable amount reduced from ₹{om:,.0f} to ₹{nm:,.0f}.",
            {"old_amount": om, "new_amount": nm, "delta_amount": om - nm},
        )
    # Fee increase against the user (platform fee up)
    if re.search(r"platform\s+fee|service\s+fee|convenience\s+fee", blob):
        if op is not None and np_ is not None and np_ > op:
            return _base(
                match, "fee_increased", "Platform / service fee increased", "High",
                f"Fee increased from {op}% to {np_}%.",
                {"old_pct": op, "new_pct": np_},
            )
        if om is not None and nm is not None and nm > om:
            return _base(
                match, "fee_increased", "Platform / service fee increased", "Medium",
                f"Fee increased from ₹{om:,.0f} to ₹{nm:,.0f}.",
                {"old_amount": om, "new_amount": nm},
            )
    return None


def rule_liability_shifted(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    if match["status"] not in ("modified", "added"):
        return None
    blob_new = new.lower()
    blob_old = old.lower()
    patterns = [
        r"sole(?:ly)?\s+liable",
        r"tenant\s+shall\s+be\s+(?:solely\s+)?responsible",
        r"worker\s+shall\s+indemnif",
        r"partner\s+bears?\s+all\s+(?:risk|liability|loss)",
        r"waives?\s+all\s+(?:claims?|liability)",
        r"no\s+liability\s+(?:whatsoever\s+)?(?:shall\s+)?attach",
        r"holds?\s+harmless",
    ]
    new_hits = sum(1 for p in patterns if re.search(p, blob_new))
    old_hits = sum(1 for p in patterns if re.search(p, blob_old))
    if new_hits > old_hits:
        return _base(
            match, "liability_shifted", "Liability shifted onto you", "High",
            "Revised wording places more liability, indemnity, or risk on your side.",
            {"old_hits": old_hits, "new_hits": new_hits},
        )
    return None


def rule_maintenance_shifted(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    blob = _blob(old, new)
    if not re.search(r"maintain|repair|upkeep|structural|wear\s+and\s+tear", blob):
        return None
    if match["status"] not in ("modified", "added"):
        return None
    # Landlord → tenant shift
    old_l = bool(re.search(r"landlord.{0,40}(maintain|repair)", old, re.I))
    new_t = bool(re.search(r"tenant.{0,40}(maintain|repair|bear)", new, re.I))
    old_t = bool(re.search(r"tenant.{0,40}(maintain|repair|bear)", old, re.I))
    if (old_l and new_t) or (new_t and not old_t and match["status"] == "modified"):
        return _base(
            match, "maintenance_shifted", "Maintenance responsibility shifted", "Medium",
            "Maintenance/repair obligations appear shifted toward the tenant/worker.",
            {},
        )
    return None


def rule_arbitration_introduced(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    old_has = bool(re.search(r"arbitrati|binding\s+dispute", old, re.I))
    new_has = bool(re.search(r"arbitrati|binding\s+dispute", new, re.I))
    if new_has and (match["status"] == "added" or (match["status"] == "modified" and not old_has)):
        return _base(
            match, "arbitration_introduced", "Arbitration clause introduced", "Medium",
            "Binding arbitration (or similar) appears in the revised contract, limiting court recourse.",
            {},
        )
    return None


def rule_rent_increase(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    blob = _blob(old, new)
    if not re.search(r"\brent\b|monthly\s+rent|lease\s+amount", blob):
        return None
    if match["status"] != "modified":
        return None
    om, nm = _first_money(old), _first_money(new)
    if om and nm and nm > om:
        pct = round((nm - om) / om * 100, 1)
        sev = "High" if pct >= 10 else "Medium"
        return _base(
            match, "rent_increased", "Rent increased", sev,
            f"Rent increased from ₹{om:,.0f} to ₹{nm:,.0f} (~{pct}% rise).",
            {"old_amount": om, "new_amount": nm, "delta_amount": nm - om, "delta_pct": pct},
        )
    return None


def rule_unilateral_change(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    if match["status"] not in ("modified", "added"):
        return None
    pat = r"may\s+(?:modify|amend|change|update).{0,40}(?:at\s+any\s+time|without\s+notice|sole\s+discretion)"
    if re.search(pat, new, re.I) and not re.search(pat, old, re.I):
        return _base(
            match, "unilateral_amendment", "Unilateral amendment rights introduced", "High",
            "Counterparty may amend terms unilaterally (often without meaningful notice).",
            {},
        )
    return None


def rule_data_rights(match: dict) -> Optional[RiskFinding]:
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    if match["status"] not in ("modified", "added"):
        return None
    pat = r"(?:share|sell|transfer|license).{0,30}(?:personal\s+data|data\s+with\s+third|location\s+data)"
    if re.search(pat, new, re.I) and not re.search(pat, old, re.I):
        return _base(
            match, "data_rights_expanded", "Data / privacy rights expanded against you", "Medium",
            "Revised terms expand how your personal or location data may be shared.",
            {},
        )
    return None


def rule_generic_material_change(match: dict) -> Optional[RiskFinding]:
    """Catch-all Low for modified clauses that didn't hit a specific rule."""
    if match["status"] != "modified":
        return None
    old = (match.get("old_clause") or {}).get("text") or ""
    new = (match.get("new_clause") or {}).get("text") or ""
    if not old or not new:
        return None
    if old.strip() == new.strip():
        return None
    return _base(
        match, "material_wording_change", "Material wording change", "Low",
        "Clause text changed in a way that did not match a high-priority risk rule — review recommended.",
        {},
    )


def rule_removed_protection(match: dict) -> Optional[RiskFinding]:
    if match["status"] != "removed":
        return None
    old = (match.get("old_clause") or {}).get("text") or ""
    if re.search(r"refund|deposit|notice|protect|grievance|cooling[\s-]?off", old, re.I):
        return _base(
            match, "protection_removed", "Protective clause removed", "High",
            "A protective clause present in the signed version was removed from the revision.",
            {},
        )
    return _base(
        match, "clause_removed", "Clause removed", "Medium",
        "A clause from the signed contract no longer appears in the revised version.",
        {},
    )


# Ordered: specific rules first; generic last (applied only if nothing else fired)
SPECIFIC_RULES: list[RuleFn] = [
    rule_auto_renewal,
    rule_deposit_refund,
    rule_notice_period,
    rule_payment_reduced,
    rule_rent_increase,
    rule_liability_shifted,
    rule_maintenance_shifted,
    rule_arbitration_introduced,
    rule_unilateral_change,
    rule_data_rights,
    rule_removed_protection,
]

FALLBACK_RULES: list[RuleFn] = [
    rule_generic_material_change,
]


SEVERITY_RANK = {"High": 3, "Medium": 2, "Low": 1}
