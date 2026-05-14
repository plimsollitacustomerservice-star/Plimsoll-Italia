from italian_accounts_reclassifier.config import load_settings
from italian_accounts_reclassifier.dependency_check import check_dependencies


def test_dependency_check_reports_configured_template_path():
    settings = load_settings()
    status = check_dependencies(settings)
    assert status.template_path.name == "Template.xlsx"
    assert "Riclassificatore bilanci italiani" in str(status.template_path)
    assert any(item.package == "openpyxl" for item in status.dependencies)
