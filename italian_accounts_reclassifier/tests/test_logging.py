from italian_accounts_reclassifier.app_logging import configure_logging


def test_configure_logging_creates_local_log_file(tmp_path):
    log_file = configure_logging(tmp_path / "logs")
    assert log_file.exists()
    assert log_file.name == "italian_accounts_reclassifier.log"
