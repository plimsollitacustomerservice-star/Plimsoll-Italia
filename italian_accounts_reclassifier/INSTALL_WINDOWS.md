# Windows Installation Guide

This guide keeps private financial data local. Install packages only during setup, then run account processing offline/local-only.

## 1. Install local prerequisites

1. Install Python 3.11 or 3.12 for Windows. Python 3.14 may work, but 3.11/3.12 is recommended for dependency compatibility.
2. Install Microsoft Excel if you want future formula recalculation automation. Formula recalculation automation is not implemented yet in this build.
3. Install Tesseract OCR with Italian language data before scanned-PDF OCR is implemented in a later build.
4. Optional later prerequisite: LibreOffice for legacy conversion workflows.

## 2. Create a local virtual environment

From PowerShell in the repository root:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\italian_accounts_reclassifier"
py -3.11 -m venv .venv
& ".\.venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

If activation fails, use the virtual-environment Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pip install -e .
```

See `INSTALL_TROUBLESHOOTING.md` if PowerShell says `Activate.ps1` is not recognized or pip says the `dev` extra is not available.

For GUI development:

```powershell
python -m pip install -e ".[gui,dev]"
```

For XLSX/template processing, ensure `openpyxl` is installed. It is included in the base dependencies.

## 3. Run tests locally

```powershell
python -m pytest tests
```

All tests should run without private data. If `openpyxl` is missing, template and XLSX tests will skip; install dependencies and rerun before processing real files.

## 4. Initialize local database and privacy checks

```powershell
python -m italian_accounts_reclassifier.cli --init-db --privacy-check
```

The default settings point to the requested knowledge-base and output folders in OneDrive. The app will warn that OneDrive may sync files independently of this application.

## 5. Inspect the real Template.xlsx

```powershell
python -m italian_accounts_reclassifier.cli --inspect-template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx"
```

Confirm that the reported Form and Manual labels/formula counts look plausible before processing accounts.

## 6. Check dependencies and paths

Because your app folder is:

`C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani`

run these commands from PowerShell:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\italian_accounts_reclassifier"
& ".\.venv\Scripts\Activate.ps1"
python -m italian_accounts_reclassifier.cli --check-dependencies
python -m italian_accounts_reclassifier.cli --privacy-check
python -m italian_accounts_reclassifier.cli --inspect-template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx"
python -m pytest tests
```

Expected for the current limited workflow:

- `openpyxl`, `pandas`, and `rapidfuzz` should show `OK`.
- `Template.xlsx exists` should be `True`.
- PDF/OCR/XBRL packages may be `MISSING` until those later phases are implemented and installed.

## 7. Process one simple CSV/XLSX file

```powershell
python -m italian_accounts_reclassifier.cli `
  --process-file "C:\path\to\account.csv" `
  --template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx" `
  --output-dir "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\Output" `
  --company-name "Company Name" `
  --fiscal-year 2024
```
