from italian_accounts_reclassifier.config import load_settings


def test_default_settings_load_requested_paths():
    settings = load_settings()
    assert "knowledge_base" in str(settings.paths.knowledge_base)
    assert str(settings.paths.output).endswith("Output")
    assert not settings.privacy.allow_network_during_processing
    assert not settings.privacy.allow_cloud_ocr
    assert not settings.privacy.allow_cloud_ai
