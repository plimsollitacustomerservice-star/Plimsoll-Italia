"""Core data models for the local reclassification workflow."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now_iso() -> str:
    """Return a timezone-aware UTC timestamp for audit records."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass(frozen=True)
class AppPaths:
    """Configured local filesystem paths used by the application."""

    knowledge_base: Path
    output: Path
    database: Path
    temp: Path


@dataclass(frozen=True)
class PrivacySettings:
    """Local-only privacy settings loaded from configuration."""

    privacy_mode_label: str = "Privacy mode: local processing only"
    allow_network_during_processing: bool = False
    allow_cloud_ocr: bool = False
    allow_cloud_ai: bool = False
    allow_telemetry: bool = False
    warn_on_cloud_synced_paths: bool = True
    log_raw_financial_values: bool = False


@dataclass(frozen=True)
class ProcessingSettings:
    """Mapping confidence and export review settings."""

    confidence_auto_suggest_min: int = 90
    confidence_review_min: int = 70
    require_review_before_export: bool = True
    allow_partial_export: bool = True


@dataclass(frozen=True)
class ToolSettings:
    """Local tool settings for OCR, Excel recalculation, and conversions."""

    tesseract_executable: str = ""
    use_excel_com_recalculation: bool = True
    libreoffice_executable: str = ""


@dataclass(frozen=True)
class AppSettings:
    """Full application settings object."""

    paths: AppPaths
    privacy: PrivacySettings = field(default_factory=PrivacySettings)
    processing: ProcessingSettings = field(default_factory=ProcessingSettings)
    tools: ToolSettings = field(default_factory=ToolSettings)


@dataclass(frozen=True)
class ExtractedItem:
    """Normalized extracted financial data point before user review."""

    source_label: str
    normalized_label: str
    value: str
    normalized_value: float | None
    detected_year: int | None
    source_type: str
    extraction_method: str
    extraction_confidence: float
    source_evidence: dict[str, Any] = field(default_factory=dict)
    source_page: int | None = None
    source_sheet: str | None = None
    source_row: int | None = None
    source_column: str | None = None
    xbrl_tag: str | None = None
    xbrl_context: str | None = None
    xbrl_unit: str | None = None
    xbrl_decimals: str | None = None
    raw_context_text: str = ""


@dataclass(frozen=True)
class TemplateTarget:
    """A writable target row dynamically discovered from Template.xlsx."""

    template_sheet: str
    template_row: int
    template_column: str
    template_label: str
    normalized_template_label: str
    destination_cell: str
    is_formula_related: bool
    active: bool = True


@dataclass(frozen=True)
class MappingSuggestion:
    """A suggested or reviewed mapping between an extracted item and a template target."""

    extracted_item_id: int
    template_target_id: int | None
    suggested_sheet: str | None
    suggested_row: int | None
    suggested_cell: str | None
    suggested_label: str | None
    confidence_score: float
    confidence_category: str
    mapping_method: str
    status: str
