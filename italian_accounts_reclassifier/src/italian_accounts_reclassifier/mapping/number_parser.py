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
    if last_comma > last_dot:
        text = text.replace(".", "").replace(",", ".")
    elif last_dot > last_comma:
        text = text.replace(",", "")
    else:
        text = text.replace(",", "")

    number = float(text)
    return -number if negative else number
