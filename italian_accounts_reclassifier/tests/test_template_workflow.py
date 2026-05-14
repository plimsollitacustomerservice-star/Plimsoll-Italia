import pytest

openpyxl = pytest.importorskip("openpyxl")
Workbook = openpyxl.Workbook
load_workbook = openpyxl.load_workbook

from italian_accounts_reclassifier.export.template_writer import ApprovedMappingValue, write_template_copy
from italian_accounts_reclassifier.mapping.template_inspector import inspect_template


def create_template(path):
    workbook = Workbook()
    form = workbook.active
    form.title = "Form"
    form["A1"] = "Revenue"
    form["B1"] = None
    form["D1"] = "=B1*2"
    form["A2"] = "Costs"
    form["D2"] = "=B1-B2"
    manual = workbook.create_sheet("Manual")
    manual["A1"] = "Ricavi delle vendite e delle prestazioni"
    manual["A2"] = "Costi per servizi"
    workbook.save(path)
    workbook.close()


def test_inspect_template_discovers_labels_and_formulas(tmp_path):
    template = tmp_path / "Template.xlsx"
    create_template(template)

    inspection = inspect_template(template)

    assert inspection.form_label_count == 2
    assert inspection.manual_label_count == 2
    assert inspection.formula_count == 2
    assert any(target.destination_cell == "B1" for target in inspection.targets)
    assert any(target.normalized_template_label == "ricavi delle vendite e delle prestazioni" for target in inspection.targets)


def test_write_template_copy_preserves_formulas_and_writes_values(tmp_path):
    template = tmp_path / "Template.xlsx"
    output = tmp_path / "Output.xlsx"
    create_template(template)

    write_template_copy(
        template,
        output,
        [
            ApprovedMappingValue(sheet="Manual", row=1, value=1234.0),
            ApprovedMappingValue(sheet="Form", row=1, value=5678.0),
        ],
    )

    workbook = load_workbook(output, data_only=False)
    assert workbook["Manual"]["B1"].value == 1234.0
    assert workbook["Form"]["B1"].value == 5678.0
    assert workbook["Form"]["D1"].value == "=B1*2"
    assert workbook["Form"]["D2"].value == "=B1-B2"
    workbook.close()
