"""CSV export writers for raw extraction, unresolved items, and audit traces."""

from __future__ import annotations

import csv
from pathlib import Path

from italian_accounts_reclassifier.models import ExtractedItem, MappingSuggestion

RAW_COLUMNS = (
    "source_label",
    "value",
    "normalized_value",
    "detected_year",
    "source_type",
    "source_page",
    "source_sheet",
    "source_row",
    "source_column",
    "xbrl_tag",
    "extraction_method",
    "extraction_confidence",
    "raw_context_text",
)

AUDIT_COLUMNS = (
    "source_label",
    "value",
    "detected_year",
    "source_type",
    "suggested_sheet",
    "suggested_row",
    "suggested_cell",
    "suggested_label",
    "confidence_score",
    "mapping_method",
    "status",
)


def write_raw_extracted_items(path: str | Path, items: list[ExtractedItem]) -> Path:
    destination = _prepare(path)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=RAW_COLUMNS)
        writer.writeheader()
        for item in items:
            writer.writerow({column: getattr(item, column) for column in RAW_COLUMNS})
    return destination


def write_mapping_audit(
    path: str | Path,
    items: list[ExtractedItem],
    suggestions: list[MappingSuggestion],
) -> Path:
    destination = _prepare(path)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=AUDIT_COLUMNS)
        writer.writeheader()
        for item, suggestion in zip(items, suggestions, strict=True):
            writer.writerow(
                {
                    "source_label": item.source_label,
                    "value": item.value,
                    "detected_year": item.detected_year,
                    "source_type": item.source_type,
                    "suggested_sheet": suggestion.suggested_sheet,
                    "suggested_row": suggestion.suggested_row,
                    "suggested_cell": suggestion.suggested_cell,
                    "suggested_label": suggestion.suggested_label,
                    "confidence_score": suggestion.confidence_score,
                    "mapping_method": suggestion.mapping_method,
                    "status": suggestion.status,
                }
            )
    return destination


def write_unresolved_items(
    path: str | Path,
    items: list[ExtractedItem],
    suggestions: list[MappingSuggestion],
) -> Path:
    unresolved_pairs = [
        (item, suggestion)
        for item, suggestion in zip(items, suggestions, strict=True)
        if suggestion.status == "unresolved"
    ]
    destination = _prepare(path)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=AUDIT_COLUMNS)
        writer.writeheader()
        for item, suggestion in unresolved_pairs:
            writer.writerow(
                {
                    "source_label": item.source_label,
                    "value": item.value,
                    "detected_year": item.detected_year,
                    "source_type": item.source_type,
                    "suggested_sheet": suggestion.suggested_sheet,
                    "suggested_row": suggestion.suggested_row,
                    "suggested_cell": suggestion.suggested_cell,
                    "suggested_label": suggestion.suggested_label,
                    "confidence_score": suggestion.confidence_score,
                    "mapping_method": suggestion.mapping_method,
                    "status": suggestion.status,
                }
            )
    return destination


def _prepare(path: str | Path) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    return destination
