# Italian Accounts Reclassifier - Technical Design for Approval

Status: draft for review and approval before production implementation.
Date: 2026-05-14.

## 1. Scope and approval gate

This document proposes a privacy-first, local Windows desktop application for processing one Italian company accounts file at a time, extracting financial statement data, mapping it into `Template.xlsx`, enabling human review and correction, learning corrections locally, and exporting traceable outputs.

No production application code should be implemented until this design is approved. The next implementation step after approval is Phase 2: project skeleton, database schema, local configuration, and basic GUI shell.

## 2. Current repository and knowledge-base discovery

The requested Windows knowledge-base folder is:

`C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Accounts update\knowledge_base`

The requested output folder is:

`C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Accounts update\Output`

In the current Linux/container execution environment, the Windows OneDrive path is not mounted at `/mnt/c/...`, and no `Template.xlsx` or `knowledge_base` folder was present in the repository. Therefore, the final mapping engine cannot yet inspect workbook rows, labels, formulas, or knowledge-base mapping assets. The application design explicitly includes a mandatory first-run knowledge-base scan and a separate inspection utility that must run on the target Windows workstation before mapping rules are finalized.

Repository files currently appear to be a separate web/catalog project rather than an existing Python desktop accounts parser. The new application should therefore be added as a self-contained Python project directory after approval, for example `italian_accounts_reclassifier/`, with docs and tests alongside it.

## 3. Public research summary

Public research supports the following design decisions:

- Italian XBRL should be processed as a structured filing format rather than as OCR text. XBRL Italia describes the Italian accounting taxonomy for ordinary and abbreviated accounts and notes that its tables were reviewed with OIC involvement, so taxonomy tags and labels should be treated as high-quality structured evidence when available: <https://it.xbrl.org/materiali/tassonomie/bilanci-principi-contabili-italiani/>.
- XBRL International describes taxonomies as the machine-readable definitions of business reporting concepts, which supports a tag-first mapping strategy where reliable XBRL tags override fuzzy label matches: <https://www.xbrl.org/the-standard/what/key-concepts-in-xbrl/taxonomies/>.
- Arelle is an open-source XBRL platform with GUI, CLI, Python API, and web service modes; this project should use only the local Python/CLI processing modes and must not enable any web-service exposure during document processing: <https://arelle.readthedocs.io/>.
- XBRL International's certified software registry lists Arelle as an XBRL Certified Software validating processor, supporting it as the preferred local XBRL parser: <https://software.xbrl.org/processor/arelle-arelle>.
- openpyxl can load workbooks while preserving formulas when `data_only=False`, but its own documentation warns that not all workbook items are preserved when a file is opened and saved, so the application should copy the template first, write only required cells, preserve formulas, and use Excel COM locally for recalculation when Microsoft Excel is installed: <https://openpyxl.readthedocs.io/en/3.0/usage.html>.
- Tesseract OCR is suitable only as a local OCR engine in this privacy model. OCR must be installed locally with Italian language data and must never be replaced by cloud OCR for private financial documents: <https://tesseract-ocr.github.io/>.

## 4. Recommended architecture

The recommended architecture is a local Python 3.11+ Windows desktop application with a layered design:

1. **Desktop UI layer**: PySide6 desktop app with wizard-style workflow, review table, source evidence panel, settings, export validation, and visible privacy indicator.
2. **Application service layer**: orchestrates ingestion, extraction, normalization, period detection, mapping, review state, export, reporting, audit trail, and correction learning.
3. **Extraction layer**: file-type-specific extractors for `.xlsx`, `.xls`, `.csv`, searchable PDF, scanned PDF with local OCR, and `.xbrl`.
4. **Normalization layer**: canonical `ExtractedItem` model containing source label, normalized label, value, normalized value, year, evidence, statement section, source coordinates, XBRL metadata, and extraction confidence.
5. **Mapping layer**: rules from Template.xlsx, knowledge-base mapping files, Italian accounting dictionary, XBRL tag map, exact matching, fuzzy matching, learned corrections, and confidence scoring.
6. **Persistence layer**: SQLite database for files, extracted items, template targets, mappings, learned corrections, audit trail, and settings.
7. **Export layer**: copied Template.xlsx output, CSV exports, HTML report, SQLite records, and local logs.
8. **Privacy/network guard layer**: explicit offline processing mode, no telemetry, no cloud OCR/AI/API integrations, local-only temporary directories, and optional network-block checks.

## 5. Chosen libraries

Core dependencies:

- Python 3.11 or newer.
- PySide6 for native Windows desktop UI.
- openpyxl for `.xlsx` template copying, workbook inspection, and value writing.
- pandas for table normalization and CSV/Excel convenience reading.
- xlrd for legacy `.xls` reading where feasible.
- pyxlsb only if `.xlsb` support is later requested.
- pywin32 for optional Microsoft Excel COM recalculation on Windows.
- pdfplumber and pypdf for searchable PDF text/table extraction.
- PyMuPDF for PDF page rendering and coordinates.
- pytesseract, Tesseract OCR, Pillow, and OpenCV for local scanned-PDF OCR and preprocessing.
- Arelle for local XBRL parsing.
- lxml for lower-level XML/XBRL fallback parsing.
- RapidFuzz for fuzzy Italian label matching.
- scikit-learn only for optional local vector/TF-IDF similarity; no cloud embedding service.
- sqlite3 from Python standard library for local persistence.
- pytest for automated tests.
- PyInstaller for Windows packaging.

Excluded dependencies/services:

- OpenAI API, Anthropic API, Gemini API, Azure Document Intelligence, AWS Textract, Google Vision, cloud OCR, cloud LLMs, external financial document APIs, telemetry, crash uploaders, and cloud spreadsheet processors.

## 6. Local privacy controls

The application will enforce local-only processing by design:

- Show a persistent UI banner: `Privacy mode: local processing only`.
- Default `allow_network_during_processing=false` in configuration.
- Do not include code paths for cloud OCR, cloud LLM, cloud spreadsheet, telemetry, or crash reporting.
- Store logs, temporary files, SQLite database, learned mappings, CSVs, reports, and workbook outputs only under configured local paths.
- Keep original source files read-only and never modify them.
- Copy `Template.xlsx` before editing and never overwrite the original.
- Warn if source or output paths appear to be cloud-synced folders, including OneDrive, because local writes may later sync outside application control.
- Avoid logging raw financial values by default; audit exports intentionally contain trace data because they are user-requested local outputs.
- Provide a settings page to disable all network activity during processing and a pre-processing self-check that verifies no network-dependent optional feature is enabled.
- Avoid automatic update checks during processing.
- Use local OCR only and verify Tesseract executable path before scanned-PDF processing.
- Optional local LLM support, if later approved, must require explicit opt-in and must target local engines only, such as Ollama or LM Studio configured without external calls.

## 7. Template.xlsx mapping approach

Template.xlsx remains the source of truth for target structure.

At first run and whenever the template changes, the app will:

1. Open a copied or read-only instance of `Template.xlsx` from the configured knowledge-base folder.
2. Verify required sheets: `Form` and `Manual`.
3. Read `Form!A:A` labels and `Manual!A:A` labels dynamically.
4. Detect formulas in `Form!D:D` and formula-related rows.
5. Create or refresh `template_targets` records for every active label row.
6. Store target row, sheet, label, normalized label, writable column, destination cell, formula relationship, and active status.
7. Derive mapping candidates from workbook labels rather than hard-coded row numbers.

Export strategy:

1. Copy the original `Template.xlsx` to the output folder using a timestamped filename.
2. Load the copy with `openpyxl.load_workbook(..., data_only=False)` to preserve formulas.
3. Write approved or user-corrected detailed data points to `Manual` column B by matching `Manual` column A target labels.
4. Write required direct values to `Form` column B only where the mapped target explicitly requires direct entry.
5. Never edit `Form` column D formulas.
6. Save the workbook copy.
7. If Microsoft Excel is installed, recalculate via pywin32 Excel COM automation locally, save, and close.
8. If Excel is not installed, set workbook calculation mode where possible and warn that formula values will update when opened in Excel.

## 8. XBRL parsing strategy

For `.xbrl` files, the application will prefer structured XBRL extraction over text/PDF extraction.

Processing steps:

1. Load the XBRL instance with Arelle in local Python/CLI mode.
2. Extract facts, concept QName/local name, labels, contextRef, unitRef, decimals, period type, instant/duration dates, entity identifier, dimensions, and numeric/text type.
3. Resolve Italian taxonomy labels where available.
4. Identify current and previous periods from contexts.
5. Distinguish instant balance-sheet facts from duration income-statement facts.
6. Exclude or flag consolidated contexts using taxonomy concepts, dimensional metadata, labels, filenames, and terms such as `consolidato`.
7. Normalize facts into `ExtractedItem` records with XBRL evidence.
8. Map via known XBRL tag map, knowledge-base mapping tables, Italian dictionary, labels, and learned corrections.
9. Preserve tag, context, unit, decimals, period, and entity evidence in audit outputs.
10. Gracefully handle taxonomy extensions and missing labels by falling back to concept names and fuzzy matching.

## 9. OCR and PDF strategy

Searchable PDFs:

1. Extract text and tables locally using pdfplumber and/or pypdf.
2. Use PyMuPDF for page rendering, text blocks, coordinates, and evidence snapshots where possible.
3. Detect statement headings, table regions, year columns, values, labels, signs, and notes.
4. Preserve source page, text context, table row/column, and bounding box where available.

Scanned PDFs:

1. Detect low text density and classify as scanned or hybrid.
2. Render pages locally with PyMuPDF.
3. Preprocess images locally with OpenCV/Pillow: grayscale, denoise, threshold, deskew, contrast normalization, optional line removal.
4. Run local Tesseract OCR with Italian language data.
5. Capture OCR confidence when available.
6. Run table reconstruction heuristics over OCR tokens and coordinates.
7. Mark OCR-derived items with lower baseline confidence than XBRL or high-quality Excel extraction.
8. Require user review for uncertain or low-confidence items.

## 10. Excel and CSV extraction strategy

For `.xlsx`, `.xls`, and `.csv`:

1. Read files in read-only mode and never overwrite source files.
2. Inspect sheets, used ranges, merged cells, headers, and visible tabular patterns.
3. Detect likely label columns, amount columns, and year columns.
4. Parse Italian and international number formats, including thousands separators, decimal commas, negative parentheses, minus signs, blanks, dashes, and values in thousands.
5. Preserve evidence: workbook, sheet, row, column, source cell address, and nearby row context.
6. Normalize all extracted records into the same internal schema used for PDF and XBRL.

## 11. Date and period detection

The app will derive period candidates from:

- Filename.
- Document title and headings.
- Balance sheet and income statement headings.
- XBRL contexts.
- Table column headers.
- Excel sheet names and headers.
- CSV headers.
- Metadata and nearby notes.

Rules:

- Current year is the latest credible fiscal year found unless user overrides it.
- Previous year is the immediately preceding year when present.
- One-year and two-year statements are flagged explicitly in review.
- User can select export year before final mapping/export.
- Year confidence is stored in mapping audit and extraction report.

## 12. Local database design

SQLite database file: `data/local_mapping_memory.sqlite3` under the application data folder or configured local data path.

### files

- id INTEGER PRIMARY KEY
- file_path TEXT
- file_name TEXT
- file_type TEXT
- company_name_detected TEXT
- fiscal_year_detected INTEGER
- import_timestamp TEXT
- processing_status TEXT
- notes TEXT

### extracted_items

- id INTEGER PRIMARY KEY
- file_id INTEGER REFERENCES files(id)
- source_label TEXT
- normalized_label TEXT
- value TEXT
- normalized_value REAL
- detected_year INTEGER
- selected_export_year INTEGER
- source_type TEXT
- source_page INTEGER
- source_sheet TEXT
- source_row INTEGER
- source_column TEXT
- xbrl_tag TEXT
- xbrl_context TEXT
- xbrl_unit TEXT
- xbrl_decimals TEXT
- extraction_method TEXT
- extraction_confidence REAL
- raw_context_text TEXT
- source_evidence_json TEXT

### template_targets

- id INTEGER PRIMARY KEY
- template_sheet TEXT
- template_row INTEGER
- template_column TEXT
- template_label TEXT
- normalized_template_label TEXT
- destination_cell TEXT
- is_formula_related INTEGER
- active INTEGER
- template_hash TEXT
- last_seen_timestamp TEXT

### mappings

- id INTEGER PRIMARY KEY
- extracted_item_id INTEGER REFERENCES extracted_items(id)
- template_target_id INTEGER REFERENCES template_targets(id)
- suggested_sheet TEXT
- suggested_row INTEGER
- suggested_cell TEXT
- suggested_label TEXT
- confidence_score REAL
- confidence_category TEXT
- mapping_method TEXT
- status TEXT
- user_approved INTEGER
- user_corrected INTEGER
- correction_note TEXT
- timestamp TEXT

### learned_corrections

- id INTEGER PRIMARY KEY
- normalized_source_label TEXT
- source_context TEXT
- xbrl_tag TEXT
- template_sheet TEXT
- template_row INTEGER
- template_cell TEXT
- template_label TEXT
- confirmation_count INTEGER DEFAULT 0
- override_count INTEGER DEFAULT 0
- last_used_timestamp TEXT
- active INTEGER DEFAULT 1

### audit_trail

- id INTEGER PRIMARY KEY
- file_id INTEGER REFERENCES files(id)
- extracted_item_id INTEGER REFERENCES extracted_items(id)
- mapping_id INTEGER REFERENCES mappings(id)
- output_file TEXT
- source_evidence TEXT
- action TEXT
- user_decision TEXT
- timestamp TEXT
- app_version TEXT

### settings

- key TEXT PRIMARY KEY
- value TEXT

Additional recommended tables:

- `mapping_rules`: editable imported rules from knowledge-base tables.
- `account_dictionary`: configurable Italian accounting terms and target hints.
- `processing_runs`: run-level status, warnings, and output manifest.
- `template_versions`: template path, hash, sheets, label counts, and formula counts.

## 13. Mapping algorithm

The mapper will compute candidate target rows and scores from multiple signals:

1. Learned correction exact lookup by normalized source label, XBRL tag, and context.
2. XBRL tag mapping from knowledge-base rules and taxonomy map.
3. Exact normalized label match against Template.xlsx labels and imported mapping tables.
4. Italian accounting dictionary term match.
5. Fuzzy similarity using RapidFuzz.
6. Keyword and statement-section context match.
7. Value and sign plausibility checks.
8. Period confidence adjustment.
9. Repeated confirmation and override history adjustment.

Suggested scoring weights before tuning:

- XBRL tag mapping: up to 45 points.
- Learned correction: up to 40 points.
- Exact label/rule match: up to 35 points.
- Fuzzy label similarity: up to 25 points.
- Dictionary/keyword match: up to 20 points.
- Statement section context: up to 10 points.
- Year/date confidence: up to 10 points.
- Confirmation history: up to 10 points.
- Penalties for OCR uncertainty, consolidated-account warning, conflicting duplicate values, and low period confidence.

Confidence categories:

- 90-100: auto-suggested but still visible in review.
- 70-89: suggested mapping requiring user confirmation.
- Below 70: unresolved/manual review required.

The final reviewer remains the user. The app will never silently export hidden mappings; all extracted items are visible in review.

## 14. Italian accounting dictionary seed

The initial dictionary will include common Italian statutory-account labels and variants such as:

- Ricavi delle vendite e delle prestazioni.
- Valore della produzione.
- Variazioni delle rimanenze.
- Incrementi di immobilizzazioni per lavori interni.
- Altri ricavi e proventi.
- Costi della produzione.
- Costi per materie prime, sussidiarie, di consumo e merci.
- Costi per servizi.
- Costi per godimento di beni di terzi.
- Costi per il personale.
- Salari e stipendi.
- Oneri sociali.
- Trattamento di fine rapporto.
- Ammortamenti e svalutazioni.
- Proventi e oneri finanziari.
- Interessi e altri oneri finanziari.
- Imposte sul reddito dell'esercizio.
- Utile dell'esercizio.
- Perdita dell'esercizio.
- Immobilizzazioni immateriali.
- Immobilizzazioni materiali.
- Immobilizzazioni finanziarie.
- Rimanenze.
- Crediti verso clienti.
- Disponibilita liquide.
- Patrimonio netto.
- Debiti verso banche.
- Debiti verso fornitori.
- Debiti tributari.
- Ratei e risconti attivi/passivi.
- Fondi per rischi e oneri.

Normalization will lowercase text, remove accents where appropriate, normalize apostrophes and quotes, collapse whitespace, normalize punctuation, handle common abbreviations, and preserve the original label in the audit trail.

## 15. Manual review workflow

The UI workflow will be:

1. Launch app.
2. Confirm settings: knowledge-base folder, output folder, local database path, privacy/network settings, OCR executable path, Excel recalculation option.
3. Select one input file, with later optional batch selection.
4. Run file-type detection and extraction.
5. Detect company, period, one-year/two-year status, consolidated-account warnings, and available evidence.
6. Display review table with all extracted items.
7. Show source evidence panel for selected item.
8. Allow filters by confidence, unresolved status, source type, year, statement section, and mapping method.
9. Allow actions: accept, reject, remap, edit value, override year, mark not relevant, add missing item, remove duplicate, save correction, and add correction note.
10. Recalculate mapping and output preview after changes.
11. Show final validation screen with unresolved item count, warnings, output manifest, and privacy reminder.
12. Export final or partial outputs.

Review table columns:

- Source account label.
- Extracted value.
- Detected year.
- Selected/export year.
- Source file.
- Source page/sheet/row/column/XBRL tag.
- Suggested template sheet.
- Suggested row.
- Suggested target label.
- Suggested target cell.
- Confidence score.
- Mapping method.
- Status.
- User action.
- Correction note.

## 16. Correction-learning workflow

When the user corrects a mapping:

1. Save the corrected destination, source label, normalized label, context, XBRL tag, evidence, note, timestamp, and file context locally.
2. Increment confirmation count when the same correction is accepted again.
3. Increment override count when a learned correction is rejected or replaced.
4. Use learned corrections as high-priority mapping signals in future runs.
5. Provide a management screen to view, disable, edit, or delete learned corrections.
6. Never send learned corrections online.

## 17. Output structure

For each processed company/year, create a timestamped output subfolder under the configured output folder:

```text
Output/
  CompanyName_FiscalYear_YYYYMMDD_HHMMSS/
    CompanyName_FiscalYear_reclassified_YYYYMMDD_HHMMSS.xlsx
    CompanyName_FiscalYear_mapping_audit.csv
    CompanyName_FiscalYear_extraction_report.html
    CompanyName_FiscalYear_unresolved_items.csv
    CompanyName_FiscalYear_raw_extracted_items.csv
    CompanyName_FiscalYear_summary.csv
    processing_manifest.json
```

Partial exports are allowed. When unresolved items remain, the workbook and reports must clearly show partial status and unresolved items.

## 18. Audit-trail design

Every mapped or unresolved value will preserve:

- Source file path.
- Source file type.
- Source page/sheet/row/column/XBRL tag.
- Original source label.
- Normalized source label.
- Extracted value.
- Normalized value.
- Detected year.
- Chosen/export year.
- Mapped Template.xlsx sheet.
- Mapped Template.xlsx row.
- Mapped Template.xlsx cell.
- Mapping method.
- Confidence score.
- User-approved/corrected/unresolved status.
- Correction note.
- Timestamp.
- App version.

`mapping_audit.csv` and `extraction_report.html` will be generated from the same audit records as the SQLite database to avoid conflicting evidence.

## 19. Privacy threat model

| Threat | Risk | Mitigation |
|---|---:|---|
| Accidental upload of source files | High | No upload features; local file pickers only; no cloud APIs; network disabled during processing by default. |
| Cloud OCR accidentally used | High | Only Tesseract/OCRmyPDF local executables allowed; no Azure/AWS/Google OCR dependency. |
| Cloud LLM accidentally used | High | No cloud LLM SDKs; optional local LLM requires explicit future opt-in and local endpoint validation. |
| Third-party telemetry | Medium | Avoid telemetry packages; no auto crash reports; dependency review before packaging. |
| Logs containing private data | Medium | Minimal operational logs; audit exports are explicit local artifacts; avoid raw values in debug logs. |
| Temporary files outside controlled folders | Medium | Configure local temp directory under app data/output; record temp artifacts in manifest. |
| OneDrive sync of outputs | Medium | Warn that configured folders under OneDrive may sync independently of app; allow user to choose local non-synced output. |
| Package update tools during processing | Low/Medium | No update checks while processing; installation/update separate from document processing. |
| Screenshots/reports expose sensitive data | Medium | Reports saved locally only; no automatic sharing; visible privacy warning. |
| User selects cloud output location | Medium | Detect common cloud path names and warn before export. |
| XBRL parser web service mode exposed | Medium | Use Arelle local API/CLI only; never start Arelle web service. |
| Formula recalculation via cloud spreadsheet | High | Use local Excel COM only; otherwise warn and rely on desktop Excel opening. |

## 20. Risk areas and open questions

1. **Template.xlsx unavailable in this environment**: exact rows, labels, formulas, and direct Form vs Manual write logic must be discovered on the Windows workstation before final mapping rules are coded.
2. **Knowledge-base unavailable in this environment**: mapping tables, examples, and instructions must be imported before tuning the mapper.
3. **PDF table variability**: scanned and multi-column PDFs will require conservative confidence scoring and review.
4. **OCR quality**: Tesseract performance depends on scan quality, language data, preprocessing, and source layout.
5. **Excel formula recalculation**: openpyxl preserves formulas but does not calculate them; reliable recalculation requires local Microsoft Excel or user opening the workbook.
6. **Consolidated-account detection**: can be flagged with heuristics but may require user confirmation.
7. **Italian taxonomy extensions**: unexpected XBRL concepts must fall back to label/fuzzy matching and review.
8. **OneDrive privacy boundary**: writing to a OneDrive path is local from the app's perspective, but sync can transmit files outside the app's control.

## 21. Testing strategy

Automated tests will use synthetic data only, not private accounts.

Unit tests:

- Italian text normalization.
- Italian number parsing.
- Date/year detection.
- Confidence scoring.
- Mapping candidate ranking.
- Learned correction lookup and update.
- SQLite schema migration.
- Output filename sanitization.

Integration tests:

- Synthetic Template.xlsx inspection.
- Manual sheet column B writing by label.
- Form sheet column B writing where configured.
- Formula preservation in Form column D.
- CSV extraction.
- XLSX extraction.
- Legacy XLS extraction where dependencies are available.
- Simple XBRL instance extraction.
- Searchable PDF extraction from synthetic PDF.
- OCR pipeline smoke test if local Tesseract is installed.
- Partial export with unresolved items.
- Audit CSV and HTML report generation.
- Privacy guardrails, including no configured cloud services and no network use during processing.

Manual QA:

- Run on Windows with real `Template.xlsx` and knowledge-base folder.
- Confirm non-technical user can process one file end-to-end.
- Validate output workbook, formulas, CSVs, report, and database records.
- Confirm learned corrections improve later mappings.
- Confirm original source files and original template remain unchanged.

## 22. Proposed folder structure after approval

```text
italian_accounts_reclassifier/
  pyproject.toml
  README.md
  PRIVACY.md
  USER_GUIDE.md
  MAPPING_METHODOLOGY.md
  QA_TEST_PLAN.md
  PACKAGING_WINDOWS.md
  config/
    default_settings.toml
    italian_account_dictionary.csv
  src/italian_accounts_reclassifier/
    __init__.py
    app.py
    cli.py
    config.py
    privacy.py
    database.py
    models.py
    gui/
      main_window.py
      review_table.py
      evidence_panel.py
      settings_dialog.py
    extractors/
      base.py
      csv_extractor.py
      excel_extractor.py
      pdf_extractor.py
      ocr_extractor.py
      xbrl_extractor.py
    mapping/
      normalizer.py
      number_parser.py
      template_inspector.py
      rule_loader.py
      mapper.py
      confidence.py
      learned_corrections.py
    export/
      template_writer.py
      csv_writer.py
      report_writer.py
      audit_writer.py
      excel_recalculate.py
  tests/
    fixtures/
    test_normalizer.py
    test_number_parser.py
    test_template_writer.py
    test_mapping.py
    test_database.py
    test_privacy.py
  scripts/
    inspect_knowledge_base.py
    create_windows_shortcut.ps1
    package_windows.ps1
```

## 23. Package and installation plan for Windows

Installation steps after implementation:

1. Install Python 3.11+ for Windows.
2. Install Microsoft Excel if formula recalculation is required automatically.
3. Install Tesseract OCR locally with Italian language data.
4. Optional: install LibreOffice locally for conversion workflows if needed.
5. Create a virtual environment.
6. Install pinned Python dependencies from project lock file.
7. Run first-time configuration wizard.
8. Select knowledge-base folder and output folder.
9. Run template/knowledge-base inspection.
10. Process a synthetic sample before using private accounts.

Packaging steps:

1. Build with PyInstaller on Windows.
2. Include Python application code and static configuration.
3. Do not bundle private knowledge-base files or private outputs.
4. Detect external local tools at runtime: Tesseract, Excel, LibreOffice.
5. Provide installer or ZIP distribution with `README`, `USER_GUIDE`, `PRIVACY`, and troubleshooting instructions.

## 24. Approval request

Please review and approve or modify the following key design choices before production implementation begins:

1. Python 3.11+ with PySide6 as the Windows desktop stack.
2. Strict local-only processing with no cloud OCR, cloud LLM, cloud AI, telemetry, or external document APIs.
3. Template.xlsx as the dynamic source of truth, with no hard-coded target rows unless imported from editable local configuration.
4. Arelle as the preferred local XBRL processor.
5. Tesseract as the local OCR engine.
6. SQLite as the local mapping, corrections, audit, and app-state database.
7. Human review required for all extracted items, with confidence categories guiding attention.
8. Partial export allowed when unresolved items remain.
9. Local Excel COM automation preferred for recalculation when Excel is installed.
10. Warning users that OneDrive output folders may sync outside application control even though the app itself remains local-only.

Once approved, implementation should proceed with Phase 2 only: project skeleton, configuration, database schema, privacy guardrails, basic GUI shell, and test framework.
