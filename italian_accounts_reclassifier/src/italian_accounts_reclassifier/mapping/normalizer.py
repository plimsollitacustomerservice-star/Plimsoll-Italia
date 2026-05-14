"""Italian account-label normalization utilities."""

from __future__ import annotations

import re
import unicodedata

APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "`": "'", "´": "'"})


def normalize_italian_label(label: str) -> str:
    """Normalize Italian account text for deterministic matching."""
    text = label.translate(APOSTROPHES).lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
