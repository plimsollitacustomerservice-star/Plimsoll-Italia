"""SQLite schema management for local mapping memory and audit trail."""

from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        company_name_detected TEXT,
        fiscal_year_detected INTEGER,
        import_timestamp TEXT NOT NULL,
        processing_status TEXT NOT NULL,
        notes TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS extracted_items (
        id INTEGER PRIMARY KEY,
        file_id INTEGER NOT NULL REFERENCES files(id),
        source_label TEXT NOT NULL,
        normalized_label TEXT NOT NULL,
        value TEXT,
        normalized_value REAL,
        detected_year INTEGER,
        selected_export_year INTEGER,
        source_type TEXT NOT NULL,
        source_page INTEGER,
        source_sheet TEXT,
        source_row INTEGER,
        source_column TEXT,
        xbrl_tag TEXT,
        xbrl_context TEXT,
        xbrl_unit TEXT,
        xbrl_decimals TEXT,
        extraction_method TEXT NOT NULL,
        extraction_confidence REAL NOT NULL,
        raw_context_text TEXT,
        source_evidence_json TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS template_targets (
        id INTEGER PRIMARY KEY,
        template_sheet TEXT NOT NULL,
        template_row INTEGER NOT NULL,
        template_column TEXT NOT NULL,
        template_label TEXT NOT NULL,
        normalized_template_label TEXT NOT NULL,
        destination_cell TEXT NOT NULL,
        is_formula_related INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        template_hash TEXT,
        last_seen_timestamp TEXT,
        UNIQUE(template_sheet, template_row, template_column)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS mappings (
        id INTEGER PRIMARY KEY,
        extracted_item_id INTEGER NOT NULL REFERENCES extracted_items(id),
        template_target_id INTEGER REFERENCES template_targets(id),
        suggested_sheet TEXT,
        suggested_row INTEGER,
        suggested_cell TEXT,
        suggested_label TEXT,
        confidence_score REAL NOT NULL,
        confidence_category TEXT NOT NULL,
        mapping_method TEXT NOT NULL,
        status TEXT NOT NULL,
        user_approved INTEGER NOT NULL DEFAULT 0,
        user_corrected INTEGER NOT NULL DEFAULT 0,
        correction_note TEXT,
        timestamp TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS learned_corrections (
        id INTEGER PRIMARY KEY,
        normalized_source_label TEXT NOT NULL,
        source_context TEXT,
        xbrl_tag TEXT,
        template_sheet TEXT NOT NULL,
        template_row INTEGER NOT NULL,
        template_cell TEXT NOT NULL,
        template_label TEXT NOT NULL,
        confirmation_count INTEGER NOT NULL DEFAULT 0,
        override_count INTEGER NOT NULL DEFAULT 0,
        last_used_timestamp TEXT,
        active INTEGER NOT NULL DEFAULT 1
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_trail (
        id INTEGER PRIMARY KEY,
        file_id INTEGER REFERENCES files(id),
        extracted_item_id INTEGER REFERENCES extracted_items(id),
        mapping_id INTEGER REFERENCES mappings(id),
        output_file TEXT,
        source_evidence TEXT,
        action TEXT NOT NULL,
        user_decision TEXT,
        timestamp TEXT NOT NULL,
        app_version TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS mapping_rules (
        id INTEGER PRIMARY KEY,
        source TEXT NOT NULL,
        normalized_source_label TEXT,
        xbrl_tag TEXT,
        template_sheet TEXT,
        template_row INTEGER,
        template_cell TEXT,
        template_label TEXT,
        confidence_boost REAL NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS account_dictionary (
        id INTEGER PRIMARY KEY,
        source_label TEXT NOT NULL,
        normalized_source_label TEXT NOT NULL,
        target_hint TEXT NOT NULL,
        statement_section TEXT,
        active INTEGER NOT NULL DEFAULT 1
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS processing_runs (
        id INTEGER PRIMARY KEY,
        file_id INTEGER REFERENCES files(id),
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        warning_count INTEGER NOT NULL DEFAULT 0,
        unresolved_count INTEGER NOT NULL DEFAULT 0,
        output_manifest_json TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS template_versions (
        id INTEGER PRIMARY KEY,
        template_path TEXT NOT NULL,
        template_hash TEXT NOT NULL,
        inspected_at TEXT NOT NULL,
        form_label_count INTEGER NOT NULL DEFAULT 0,
        manual_label_count INTEGER NOT NULL DEFAULT 0,
        formula_count INTEGER NOT NULL DEFAULT 0
    )
    """,
]


def connect(database_path: str | Path) -> sqlite3.Connection:
    """Open a local SQLite connection and enable foreign keys."""
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database(database_path: str | Path) -> None:
    """Create or update the local SQLite schema."""
    with connect(database_path) as connection:
        for statement in SCHEMA_STATEMENTS:
            connection.execute(statement)
        connection.commit()


def list_tables(database_path: str | Path) -> list[str]:
    """Return user table names for diagnostics and tests."""
    with connect(database_path) as connection:
        rows = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
    return [row[0] for row in rows]
