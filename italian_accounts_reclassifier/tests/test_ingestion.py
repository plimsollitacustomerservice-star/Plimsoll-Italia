import pytest

from italian_accounts_reclassifier.extractors.registry import UnsupportedExtractorError, extractor_for_path
from italian_accounts_reclassifier.ingestion import detect_file_type, validate_input_file


@pytest.mark.parametrize(
    "filename, expected",
    [
        ("bilancio.pdf", "pdf"),
        ("bilancio.xlsx", "xlsx"),
        ("bilancio.xls", "xls"),
        ("bilancio.csv", "csv"),
        ("bilancio.xbrl", "xbrl"),
        ("bilancio.xml", "xbrl"),
    ],
)
def test_detect_file_type_for_supported_extensions(filename, expected):
    assert detect_file_type(filename) == expected


def test_detect_file_type_rejects_unknown_extension():
    with pytest.raises(ValueError):
        detect_file_type("bilancio.docx")


def test_validate_input_file_returns_safe_metadata(tmp_path):
    source = tmp_path / "bilancio.csv"
    source.write_text("Ricavi,100\n", encoding="utf-8")

    metadata = validate_input_file(source)

    assert metadata.file_name == "bilancio.csv"
    assert metadata.file_type == "csv"
    assert metadata.size_bytes > 0


def test_extractor_registry_returns_csv_extractor_for_csv(tmp_path):
    source = tmp_path / "bilancio.csv"
    source.write_text("Ricavi,100\n", encoding="utf-8")
    assert extractor_for_path(source).supports(source)


def test_extractor_registry_reports_planned_pdf_extraction():
    with pytest.raises(UnsupportedExtractorError, match="planned"):
        extractor_for_path("bilancio.pdf")
