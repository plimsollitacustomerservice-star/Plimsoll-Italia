from italian_accounts_reclassifier.database import initialize_database, list_tables


def test_initialize_database_creates_expected_tables(tmp_path):
    db_path = tmp_path / "local_mapping_memory.sqlite3"
    initialize_database(db_path)
    tables = set(list_tables(db_path))
    assert {
        "files",
        "extracted_items",
        "template_targets",
        "mappings",
        "learned_corrections",
        "audit_trail",
        "settings",
        "mapping_rules",
        "account_dictionary",
        "processing_runs",
        "template_versions",
    }.issubset(tables)
