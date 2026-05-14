"""Italian and international financial number parsing."""

from __future__ import annotations

import re

DASH_VALUES = {"", "-", "–", "—", "n/a", "na"}


def parse_financial_number(value: str | int | float | None) -> float | None:
    """Parse common Italian and international financial statement number formats."""
    if value is None:
        return None
    if isinstance(value, int | float):
        return float(value)

    text = str(value).strip().lower().replace("€", "")
    if text in DASH_VALUES:
        return None

    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("() ")
    text = text.replace(" ", "")
    text = re.sub(r"[^0-9,.-]", "", text)
    if not text or text in DASH_VALUES:
        return None

    last_comma = text.rfind(",")
    last_dot = text.rfind(".")
    if last_comma > -1 and last_dot > -1:
        if last_comma > last_dot:
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif last_comma > -1:
        text = _normalize_single_separator(text, ",")
    elif last_dot > -1:
        text = _normalize_single_separator(text, ".")

    number = float(text)
    return -number if negative else number


def _normalize_single_separator(text: str, separator: str) -> str:
    parts = text.split(separator)
    if len(parts) == 2 and len(parts[1]) == 3 and len(parts[0]) <= 3:
        return "".join(parts)
    if len(parts) > 2 and all(len(part) == 3 for part in parts[1:]):
        return "".join(parts)
    return text.replace(separator, ".")
