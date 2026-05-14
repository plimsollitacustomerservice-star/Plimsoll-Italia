"""Local HTML extraction report writer."""

from __future__ import annotations

from html import escape
from pathlib import Path

from italian_accounts_reclassifier.models import ExtractedItem, MappingSuggestion


def write_extraction_report(
    path: str | Path,
    items: list[ExtractedItem],
    suggestions: list[MappingSuggestion],
) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for item, suggestion in zip(items, suggestions, strict=True):
        rows.append(
            "<tr>"
            f"<td>{escape(item.source_label)}</td>"
            f"<td>{escape(str(item.value))}</td>"
            f"<td>{escape(item.source_type)}</td>"
            f"<td>{escape(str(suggestion.suggested_cell or ''))}</td>"
            f"<td>{suggestion.confidence_score:.1f}</td>"
            f"<td>{escape(suggestion.status)}</td>"
            "</tr>"
        )
    html = """<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Extraction Report</title></head>
<body>
<h1>Extraction Report</h1>
<p>Privacy mode: local processing only. This report is a local output file.</p>
<table border="1">
<thead><tr><th>Source label</th><th>Value</th><th>Source type</th><th>Suggested cell</th><th>Confidence</th><th>Status</th></tr></thead>
<tbody>
""" + "\n".join(rows) + """
</tbody>
</table>
</body>
</html>
"""
    destination.write_text(html, encoding="utf-8")
    return destination
