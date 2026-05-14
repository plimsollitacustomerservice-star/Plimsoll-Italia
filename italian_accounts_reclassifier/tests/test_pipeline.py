import csv

import pytest

openpyxl = pytest.importorskip("openpyxl")

from italian_accounts_reclassifier.pipeline import process_account_file


def create_template(path):
    workbook = openpyxl.Workbook()
    form = workbook.active
    form.title = "Form"
    form["A1"] = "Revenue"
    form["D1"] = "=B1*2"
    manual = workbook.create_sheet("Manual")
    manual["A1"] = "Ricavi delle vendite e delle prestazioni"
    manual["A2"] = "Costi per servizi"
    workbook.save(path)
    workbook.close()


def test_process_account_file_exports_workbook_csvs_and_report(tmp_path):
    template = tmp_path / "Template.xlsx"
    create_template(template)
    source = tmp_path / "azienda.csv"
    source.write_text("Ricavi delle vendite e delle prestazioni;1.234,56\nVoce non mappata;99\n", encoding="utf-8")

    result = process_account_file(source, template, tmp_path / "Output", company_name="Azienda Test", fiscal_year=2024)

    assert result.extracted_count == 2
    assert result.mapped_count == 1
    assert result.unresolved_count == 1
    assert result.partial_export
    assert result.workbook_path.exists()
    assert result.raw_extracted_items_path.exists()
    assert result.mapping_audit_path.exists()
    assert result.unresolved_items_path.exists()
    assert result.extraction_report_path.exists()

    workbook = openpyxl.load_workbook(result.workbook_path, data_only=False)
    assert workbook["Manual"]["B1"].value == 1234.56
    assert workbook["Form"]["D1"].value == "=B1*2"
    workbook.close()

    with result.unresolved_items_path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    assert rows[0]["source_label"] == "Voce non mappata"
