# User Guide

## Current status

This build can run a local end-to-end workflow for simple CSV and XLSX account files that have adjacent account-label/value rows. It is not yet complete for PDF, scanned PDF OCR, XBRL, legacy XLS, full human review, or learned corrections.

## Privacy reminder

The application is designed for local processing only. Do not use cloud OCR, cloud AI, or cloud spreadsheet tools with private accounts. If your output folder is inside OneDrive, OneDrive may sync files independently of this application.

## Process one CSV account file

From PowerShell:

```powershell
cd .\italian_accounts_reclassifier
& ".\.venv\Scripts\Activate.ps1"
python -m italian_accounts_reclassifier.cli `
  --process-file "C:\path\to\account.csv" `
  --template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx" `
  --output-dir "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\Output" `
  --company-name "Company Name" `
  --fiscal-year 2024
```

The command creates a timestamped output folder containing:

- A copied and partially populated `Template.xlsx` workbook.
- `raw_extracted_items.csv`.
- `mapping_audit.csv`.
- `unresolved_items.csv`.
- `extraction_report.html`.

## Review results

1. Open `mapping_audit.csv` to see each extracted value and suggested template cell.
2. Open `unresolved_items.csv` to review values that did not map with enough confidence.
3. Open `extraction_report.html` for a local browser-readable summary.
4. Open the copied workbook and check `Manual` column B and formulas before using results.

## What I still need from you before declaring production-ready

1. Access to or a copy of the real `Template.xlsx` structure, or confirmation from a Windows run of `--inspect-template`.
2. Confirmation that dependencies install successfully on your Windows machine.
3. A small non-confidential sample CSV/XLSX account file for validating the output workflow.
4. Confirmation of whether the OneDrive output path is acceptable despite sync warnings.

## Test the four matching account files you mentioned

If your four equivalent sample files are stored inside the app folder or knowledge-base folder, first test the implemented formats:

```powershell
# CSV sample
python -m italian_accounts_reclassifier.cli `
  --process-file "C:\path\to\sample.csv" `
  --template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx" `
  --output-dir "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\Output" `
  --company-name "Sample Company" `
  --fiscal-year 2024

# XLSX sample
python -m italian_accounts_reclassifier.cli `
  --process-file "C:\path\to\sample.xlsx" `
  --template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx" `
  --output-dir "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\Output" `
  --company-name "Sample Company" `
  --fiscal-year 2024
```

The `.pdf` and `.xbrl` files are useful validation fixtures for the next development phase, but this build will currently report those extractors as planned/not implemented.
