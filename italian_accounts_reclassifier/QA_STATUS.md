# QA Status and Remaining Readiness Work

Date: 2026-05-14

## Current readiness

The application is still not production-ready for real Italian company accounts. It is now suitable for controlled local development and synthetic-data testing of the foundation workflow.

## Implemented and tested locally

- Local configuration loading.
- Privacy preflight checks for network/cloud/telemetry settings.
- SQLite schema creation.
- Local rotating file logging.
- Input-file type detection and validation for `.pdf`, `.xlsx`, `.xls`, `.csv`, `.xbrl`, and `.xml` XBRL aliases.
- CSV extraction for adjacent account-label/value rows.
- XLSX extractor code path, with tests skipped when `openpyxl` is unavailable.
- Template.xlsx inspection and copy-writing code paths, with tests skipped when `openpyxl` is unavailable.
- Formula-preservation check in workbook copy-writing.
- Italian text normalization.
- Italian and international number parsing, including thousands-only values such as `1.234`.
- Early deterministic mapping suggestions.
- CSV and HTML local export writers.

## Tests still required on the Windows workstation

These checks require local Windows dependencies and the real knowledge-base folder:

1. Install project dependencies from a trusted package source or offline wheelhouse.
2. Run the full test suite with `openpyxl` installed so template and XLSX tests execute instead of skipping.
3. Run `python -m italian_accounts_reclassifier.cli --inspect-template "C:\path\to\Template.xlsx"` against the real template.
4. Verify `Form` and `Manual` labels match expected business structure.
5. Verify formula preservation and Excel recalculation using local Microsoft Excel COM automation when that module is implemented.
6. Test real CSV and XLSX account samples copied into a safe local test folder.
7. Confirm OneDrive sync warnings are acceptable for the chosen output path.

## Major implementation still required before production use

- Full human review and correction UI.
- Learned correction persistence workflow.
- PDF searchable text/table extraction.
- Local OCR pipeline for scanned PDFs.
- XBRL parsing with Arelle.
- Legacy `.xls` extraction.
- Date/year detection and current/prior-year selection.
- Consolidated-account detection/flagging.
- Full end-to-end export orchestration and output folder manifest.
- Excel formula recalculation through local Excel COM automation.
- Windows packaging and installer/executable validation.
