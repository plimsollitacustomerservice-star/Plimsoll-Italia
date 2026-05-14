# Italian Accounts Reclassifier

Phase 2 local-only application skeleton for a Windows desktop workflow that reclassifies Italian company accounts into `Template.xlsx`.

## Current status

This project is intentionally limited to the approved Phase 2 foundation:

- Python package skeleton.
- Default local configuration for the requested knowledge-base and output folders.
- Local-only privacy preflight checks.
- Local rotating file logging under the configured app data folder.
- SQLite schema creation for mapping memory, learned corrections, audit trail, template targets, and settings.
- Minimal PySide6 GUI shell with a visible privacy-mode indicator.
- Template.xlsx inspection and copy-writing with formula preservation checks.
- Input file type detection and validation for supported account formats.
- Basic CSV and XLSX local extraction for adjacent label/value tables.
- Early deterministic mapping, CSV exports, local HTML report generation, normalization, and number-parsing utilities.
- End-to-end CLI processing for simple CSV/XLSX adjacent label/value files.
- Unit tests using synthetic/non-private data only.

PDF/OCR/XBRL extraction, legacy XLS extraction, full review workflow, learned-correction UI, Excel COM recalculation, and Windows packaging are planned for later phases. See `QA_STATUS.md`, `INSTALL_WINDOWS.md`, and `USER_GUIDE.md` for readiness and usage details.

## Local-only principle

Private financial statements, extracted figures, company names, logs, screenshots, audit records, reports, corrections, and learned mappings must remain on the local Windows machine. The skeleton contains no cloud OCR, cloud AI, telemetry, crash-uploading, or external document-processing integrations.

## Developer quick start

```bash
cd italian_accounts_reclassifier
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
python -m italian_accounts_reclassifier.cli --init-db --privacy-check
python -m italian_accounts_reclassifier.cli --inspect-template "C:\path\to\Template.xlsx"
python -m pytest
```

On Windows, install the `gui` extra to run the desktop shell:

```bash
python -m pip install -e .[gui,dev]
python -c "from italian_accounts_reclassifier.gui.main_window import launch; raise SystemExit(launch())"
```

## Configuration

Default settings live in `config/default_settings.toml`. They point to:

- `C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base`
- `C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\Output`

The app warns when configured folders appear to be cloud-synced because the application processes locally, but OneDrive may independently sync files.

## Process one implemented file type

```bash
python -m italian_accounts_reclassifier.cli \
  --process-file "path/to/account.csv" \
  --template "path/to/Template.xlsx" \
  --output-dir "path/to/Output" \
  --company-name "Company Name" \
  --fiscal-year 2024
```

Current end-to-end processing is limited to simple CSV/XLSX files with adjacent account labels and values.
