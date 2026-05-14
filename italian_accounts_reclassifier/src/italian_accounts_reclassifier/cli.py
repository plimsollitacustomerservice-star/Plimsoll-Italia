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
    parser.add_argument("--inspect-template", default=None, help="Inspect a local Template.xlsx file")
    parser.add_argument("--process-file", default=None, help="Process one local account file with implemented extractors")
    parser.add_argument("--template", default=None, help="Template.xlsx path for --process-file")
    parser.add_argument("--output-dir", default=None, help="Output directory for --process-file")
    parser.add_argument("--company-name", default=None, help="Optional company name for output naming")
    parser.add_argument("--fiscal-year", type=int, default=None, help="Optional fiscal year for output naming")
    args = parser.parse_args(argv)

    settings = load_settings(args.settings) if args.settings else load_settings()
    ensure_local_directories(settings)

    if args.init_db:
        initialize_database(settings.paths.database)
        print(f"Initialised local SQLite database: {settings.paths.database}")
        print("Tables: " + ", ".join(list_tables(settings.paths.database)))

    if args.inspect_template:
        from .mapping.template_inspector import inspect_template

        inspection = inspect_template(args.inspect_template)
        print(f"Template: {inspection.template_path}")
        print(f"Hash: {inspection.template_hash}")
        print(f"Targets: {len(inspection.targets)}")
        print(f"Form labels: {inspection.form_label_count}")
        print(f"Manual labels: {inspection.manual_label_count}")
        print(f"Formulas: {inspection.formula_count}")

    if args.process_file:
        if not args.template:
            parser.error("--process-file requires --template")
        from .pipeline import process_account_file

        output_dir = args.output_dir or str(settings.paths.output)
        result = process_account_file(
            args.process_file,
            args.template,
            output_dir,
            company_name=args.company_name,
            fiscal_year=args.fiscal_year,
        )
        print(f"Output directory: {result.output_directory}")
        print(f"Workbook: {result.workbook_path}")
        print(f"Raw extracted items: {result.raw_extracted_items_path}")
        print(f"Mapping audit: {result.mapping_audit_path}")
        print(f"Unresolved items: {result.unresolved_items_path}")
        print(f"Extraction report: {result.extraction_report_path}")
        print(f"Extracted: {result.extracted_count}; mapped: {result.mapped_count}; unresolved: {result.unresolved_count}")
        if result.partial_export:
            print("Partial export: unresolved items require review")

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
