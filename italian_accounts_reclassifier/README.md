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
- Early normalization and number-parsing utilities.
- Unit tests using synthetic/non-private data only.

Extraction engines, mapping engines, review workflow, and export writers are planned for later phases.

## Local-only principle

Private financial statements, extracted figures, company names, logs, screenshots, audit records, reports, corrections, and learned mappings must remain on the local Windows machine. The skeleton contains no cloud OCR, cloud AI, telemetry, crash-uploading, or external document-processing integrations.

## Developer quick start

```bash
cd italian_accounts_reclassifier
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
python -m italian_accounts_reclassifier.cli --init-db --privacy-check
python -m pytest
```

On Windows, install the `gui` extra to run the desktop shell:

```bash
python -m pip install -e .[gui,dev]
python -c "from italian_accounts_reclassifier.gui.main_window import launch; raise SystemExit(launch())"
```

## Configuration

Default settings live in `config/default_settings.toml`. They point to:

- `C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Accounts update\knowledge_base`
- `C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Accounts update\Output`

The app warns when configured folders appear to be cloud-synced because the application processes locally, but OneDrive may independently sync files.
