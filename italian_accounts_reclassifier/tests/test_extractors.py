import pytest

from italian_accounts_reclassifier.extractors.csv_extractor import CsvExtractor


def test_csv_extractor_reads_label_value_pairs(tmp_path):
    source = tmp_path / "accounts.csv"
    source.write_text("Ricavi delle vendite e delle prestazioni;1.234,56\nCosti per servizi;1234\n", encoding="utf-8")

    items = CsvExtractor().extract(source)

    assert len(items) == 2
    assert items[0].source_label == "Ricavi delle vendite e delle prestazioni"
    assert items[0].normalized_value == 1234.56
    assert items[1].normalized_value == 1234.0


def test_xlsx_extractor_reads_adjacent_label_value_pairs(tmp_path):
    openpyxl = pytest.importorskip("openpyxl")
    from italian_accounts_reclassifier.extractors.excel_extractor import XlsxExtractor

    source = tmp_path / "accounts.xlsx"
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Bilancio"
    sheet["A1"] = "Ricavi delle vendite e delle prestazioni"
    sheet["B1"] = 12450000
    workbook.save(source)
    workbook.close()

    items = XlsxExtractor().extract(source)

    assert len(items) == 1
    assert items[0].source_sheet == "Bilancio"
    assert items[0].source_row == 1
    assert items[0].source_column == "B"
    assert items[0].normalized_value == 12450000.0
