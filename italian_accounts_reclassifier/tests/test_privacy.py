from pathlib import Path

from italian_accounts_reclassifier.models import AppPaths, AppSettings, PrivacySettings
from italian_accounts_reclassifier.privacy import appears_cloud_synced, run_privacy_preflight


def make_settings(**privacy_overrides):
    return AppSettings(
        paths=AppPaths(
            knowledge_base=Path("C:/Local/knowledge_base"),
            output=Path("C:/Local/Output"),
            database=Path("data/test.sqlite3"),
            temp=Path("data/temp"),
        ),
        privacy=PrivacySettings(**privacy_overrides),
    )


def test_privacy_preflight_passes_for_local_defaults():
    result = run_privacy_preflight(make_settings())
    assert result.ok
    assert result.errors == ()


def test_privacy_preflight_blocks_cloud_ai_and_network():
    result = run_privacy_preflight(make_settings(allow_network_during_processing=True, allow_cloud_ai=True))
    assert not result.ok
    assert any("Network access" in error for error in result.errors)
    assert any("Cloud AI" in error for error in result.errors)


def test_cloud_synced_path_detection_warns_for_onedrive():
    assert appears_cloud_synced(Path("C:/Users/example/OneDrive - Example/Output"))
