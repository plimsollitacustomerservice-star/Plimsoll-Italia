"""Local CSV extraction for account-label/value tables."""

from __future__ import annotations

import csv
from pathlib import Path

from italian_accounts_reclassifier.extractors.base import LocalExtractor
from italian_accounts_reclassifier.mapping.normalizer import normalize_italian_label
from italian_accounts_reclassifier.mapping.number_parser import parse_financial_number
from italian_accounts_reclassifier.models import ExtractedItem


class CsvExtractor(LocalExtractor):
    """Extract simple label/value rows from local CSV files."""

    supported_extensions = (".csv",)

    def extract(self, path: Path) -> list[ExtractedItem]:
        items: list[ExtractedItem] = []
        with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
            sample = handle.read(4096)
            handle.seek(0)
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
            except csv.Error:
                dialect = csv.excel
            reader = csv.reader(handle, dialect)
            for row_number, row in enumerate(reader, start=1):
                label, value, column = _best_label_value(row)
                if not label or value is None:
                    continue
                parsed = parse_financial_number(value)
                if parsed is None:
                    continue
                items.append(
                    ExtractedItem(
                        source_label=label,
                        normalized_label=normalize_italian_label(label),
                        value=value,
                        normalized_value=parsed,
                        detected_year=None,
                        source_type="csv",
                        extraction_method="csv_label_value",
                        extraction_confidence=85.0,
                        source_row=row_number,
                        source_column=column,
                        source_evidence={"row": row_number, "column": column, "raw_row": row},
                        raw_context_text=", ".join(row),
                    )
                )
        return items


def _best_label_value(row: list[str]) -> tuple[str | None, str | None, str | None]:
    for index in range(len(row) - 1):
        label = row[index].strip()
        candidate = row[index + 1].strip()
        if label and parse_financial_number(candidate) is not None:
            return label, candidate, _column_name(index + 2)
    return None, None, None


def _column_name(number: int) -> str:
    name = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        name = chr(65 + remainder) + name
    return name
