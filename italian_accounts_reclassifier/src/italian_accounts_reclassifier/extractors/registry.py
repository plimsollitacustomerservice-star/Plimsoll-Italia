"""Extractor registry with lazy optional-dependency imports."""

from __future__ import annotations

from pathlib import Path

from italian_accounts_reclassifier.extractors.base import LocalExtractor
from italian_accounts_reclassifier.extractors.csv_extractor import CsvExtractor
from italian_accounts_reclassifier.ingestion import detect_file_type
from italian_accounts_reclassifier.models import ExtractedItem


class UnsupportedExtractorError(RuntimeError):
    """Raised when a file type is recognized but not implemented yet."""


def extractor_for_path(path: str | Path) -> LocalExtractor:
    """Return a local extractor for supported implemented file types."""
    file_type = detect_file_type(path)
    if file_type == "csv":
        return CsvExtractor()
    if file_type == "xlsx":
        try:
            from italian_accounts_reclassifier.extractors.excel_extractor import XlsxExtractor
        except ModuleNotFoundError as exc:
            raise UnsupportedExtractorError("XLSX extraction requires the local openpyxl package.") from exc
        return XlsxExtractor()
    raise UnsupportedExtractorError(
        f"{file_type.upper()} extraction is planned but not implemented in this local build yet."
    )


def extract_local_file(path: str | Path) -> list[ExtractedItem]:
    """Extract normalized items from an implemented local source type."""
    extractor = extractor_for_path(path)
    return extractor.extract(Path(path))
