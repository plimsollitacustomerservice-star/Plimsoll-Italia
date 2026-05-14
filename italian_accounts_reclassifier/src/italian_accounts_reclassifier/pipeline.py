"""End-to-end local processing pipeline for implemented source types.

This module intentionally performs only local filesystem work. It orchestrates
input validation, extraction, template inspection, deterministic mapping, partial
Template.xlsx export, CSV exports, and a local HTML report.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import re

from italian_accounts_reclassifier.export.csv_writer import (
    write_mapping_audit,
    write_raw_extracted_items,
    write_unresolved_items,
)
from italian_accounts_reclassifier.export.report_writer import write_extraction_report
from italian_accounts_reclassifier.export.template_writer import ApprovedMappingValue, write_template_copy
from italian_accounts_reclassifier.extractors.registry import extract_local_file
from italian_accounts_reclassifier.ingestion import InputFileMetadata, validate_input_file
from italian_accounts_reclassifier.mapping.mapper import suggest_mapping
from italian_accounts_reclassifier.mapping.template_inspector import TemplateInspection, inspect_template
from italian_accounts_reclassifier.models import ExtractedItem, MappingSuggestion


@dataclass(frozen=True)
class ProcessingResult:
    """Output manifest from one local account-file processing run."""

    input_metadata: InputFileMetadata
    template_inspection: TemplateInspection
    output_directory: Path
    workbook_path: Path
    raw_extracted_items_path: Path
    mapping_audit_path: Path
    unresolved_items_path: Path
    extraction_report_path: Path
    extracted_count: int
    mapped_count: int
    unresolved_count: int
    partial_export: bool


def process_account_file(
    input_file: str | Path,
    template_path: str | Path,
    output_root: str | Path,
    *,
    company_name: str | None = None,
    fiscal_year: int | None = None,
) -> ProcessingResult:
    """Process one implemented local account file and export review artifacts.

    Current implemented source extractors are CSV and XLSX. PDF, OCR, XBRL, and
    legacy XLS are recognized elsewhere but still require later extractor work.
    """
    metadata = validate_input_file(input_file)
    inspection = inspect_template(template_path)
    items = extract_local_file(metadata.path)
    suggestions = [suggest_mapping(index + 1, item, list(inspection.targets)) for index, item in enumerate(items)]

    output_directory = _build_output_directory(output_root, company_name or metadata.path.stem, fiscal_year)
    output_directory.mkdir(parents=True, exist_ok=True)
    prefix = output_directory.name

    approved_values = _approved_values(items, suggestions)
    workbook_path = output_directory / f"{prefix}_reclassified.xlsx"
    write_template_copy(template_path, workbook_path, approved_values)

    raw_path = write_raw_extracted_items(output_directory / f"{prefix}_raw_extracted_items.csv", items)
    audit_path = write_mapping_audit(output_directory / f"{prefix}_mapping_audit.csv", items, suggestions)
    unresolved_path = write_unresolved_items(output_directory / f"{prefix}_unresolved_items.csv", items, suggestions)
    report_path = write_extraction_report(output_directory / f"{prefix}_extraction_report.html", items, suggestions)

    unresolved_count = sum(1 for suggestion in suggestions if suggestion.status == "unresolved")
    return ProcessingResult(
        input_metadata=metadata,
        template_inspection=inspection,
        output_directory=output_directory,
        workbook_path=workbook_path,
        raw_extracted_items_path=raw_path,
        mapping_audit_path=audit_path,
        unresolved_items_path=unresolved_path,
        extraction_report_path=report_path,
        extracted_count=len(items),
        mapped_count=len(approved_values),
        unresolved_count=unresolved_count,
        partial_export=unresolved_count > 0,
    )


def _approved_values(items: list[ExtractedItem], suggestions: list[MappingSuggestion]) -> list[ApprovedMappingValue]:
    values: list[ApprovedMappingValue] = []
    for item, suggestion in zip(items, suggestions, strict=True):
        if suggestion.status == "unresolved" or suggestion.suggested_sheet is None or suggestion.suggested_row is None:
            continue
        values.append(
            ApprovedMappingValue(
                sheet=suggestion.suggested_sheet,
                row=suggestion.suggested_row,
                value=item.normalized_value if item.normalized_value is not None else item.value,
            )
        )
    return values


def _build_output_directory(output_root: str | Path, company_name: str, fiscal_year: int | None) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_company = _safe_filename(company_name) or "Company"
    year = str(fiscal_year) if fiscal_year else "UnknownYear"
    return Path(output_root) / f"{safe_company}_{year}_{timestamp}"


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._-")
    return cleaned[:80]
