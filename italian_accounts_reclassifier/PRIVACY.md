# Local-Only Privacy Statement

The Italian Accounts Reclassifier is designed for local Windows processing of private company accounts.

## What must stay local

The application must not transmit source financial files, extracted values, company names, mappings, learned corrections, logs, audit trails, reports, screenshots, SQLite databases, or completed workbooks to any online service.

## Disabled by design

The Phase 2 skeleton contains no integrations for:

- OpenAI API.
- Anthropic API.
- Gemini API.
- Azure Document Intelligence.
- AWS Textract.
- Google Vision.
- Cloud OCR.
- Cloud LLMs.
- Cloud spreadsheet processors.
- Telemetry or uploaded crash reporting.

## OneDrive warning

The default output path supplied by the user is inside OneDrive. The app writes files locally, but OneDrive sync software may upload local files independently of the application. Users who require a stricter non-sync workflow should choose a non-cloud-synced local output folder.
