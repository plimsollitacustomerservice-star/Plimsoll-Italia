import csv

from italian_accounts_reclassifier.export.csv_writer import (
    write_mapping_audit,
    write_raw_extracted_items,
    write_unresolved_items,
)
from italian_accounts_reclassifier.export.report_writer import write_extraction_report
from italian_accounts_reclassifier.mapping.mapper import suggest_mapping
from italian_accounts_reclassifier.models import ExtractedItem, TemplateTarget


def make_item(label="Ricavi delle vendite e delle prestazioni"):
    return ExtractedItem(
        source_label=label,
        normalized_label="ricavi delle vendite e delle prestazioni",
        value="1000",
        normalized_value=1000.0,
        detected_year=2024,
        source_type="csv",
        extraction_method="test",
        extraction_confidence=90.0,
    )


def make_target():
    return TemplateTarget(
        template_sheet="Manual",
        template_row=1,
        template_column="B",
        template_label="Ricavi delle vendite e delle prestazioni",
        normalized_template_label="ricavi delle vendite e delle prestazioni",
        destination_cell="B1",
        is_formula_related=False,
    )


def test_exact_mapping_suggestion():
    suggestion = suggest_mapping(1, make_item(), [make_target()])
    assert suggestion.suggested_cell == "B1"
    assert suggestion.confidence_score == 100.0
    assert suggestion.status == "auto_suggested"
    assert suggestion.mapping_method == "exact_label"


def test_export_csv_and_html_outputs(tmp_path):
    item = make_item()
    suggestion = suggest_mapping(1, item, [make_target()])

    raw_path = write_raw_extracted_items(tmp_path / "raw_extracted_items.csv", [item])
    audit_path = write_mapping_audit(tmp_path / "mapping_audit.csv", [item], [suggestion])
    unresolved_path = write_unresolved_items(tmp_path / "unresolved_items.csv", [item], [suggestion])
    report_path = write_extraction_report(tmp_path / "extraction_report.html", [item], [suggestion])

    with raw_path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    assert rows[0]["source_label"] == "Ricavi delle vendite e delle prestazioni"

    with audit_path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    assert rows[0]["suggested_cell"] == "B1"

    with unresolved_path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    assert rows == []

    assert "Privacy mode: local processing only" in report_path.read_text(encoding="utf-8")
