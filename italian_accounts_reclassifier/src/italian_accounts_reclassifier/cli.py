"""Command-line entry points for setup diagnostics before GUI packaging."""

from __future__ import annotations

import argparse

from .config import ensure_local_directories, load_settings
from .database import initialize_database, list_tables
from .privacy import run_privacy_preflight


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Italian Accounts Reclassifier local diagnostics")
    parser.add_argument("--settings", default=None, help="Path to a TOML settings file")
    parser.add_argument("--init-db", action="store_true", help="Initialise the local SQLite database")
    parser.add_argument("--privacy-check", action="store_true", help="Run local-only privacy preflight checks")
    args = parser.parse_args(argv)

    settings = load_settings(args.settings) if args.settings else load_settings()
    ensure_local_directories(settings)

    if args.init_db:
        initialize_database(settings.paths.database)
        print(f"Initialised local SQLite database: {settings.paths.database}")
        print("Tables: " + ", ".join(list_tables(settings.paths.database)))

    if args.privacy_check:
        result = run_privacy_preflight(settings)
        print(settings.privacy.privacy_mode_label)
        for warning in result.warnings:
            print(f"WARNING: {warning}")
        for error in result.errors:
            print(f"ERROR: {error}")
        return 0 if result.ok else 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
