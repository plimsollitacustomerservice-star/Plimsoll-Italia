# Windows Setup Troubleshooting

## Error: `.\.venv\Scripts\Activate.ps1` is not recognized

This means PowerShell cannot find the virtual environment activation script in the current folder. Usually one of these is true:

1. The virtual environment was not created yet.
2. You are in the wrong folder.
3. The app folder name/path is different from the documented path.

Run this from the folder that contains `pyproject.toml`:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\italian_accounts_reclassifier"
py -3.11 -m venv .venv
& ".\.venv\Scripts\Activate.ps1"
```

If `py -3.11` is not available, try:

```powershell
python -m venv .venv
& ".\.venv\Scripts\Activate.ps1"
```

If PowerShell blocks activation because of execution policy, either run Python directly from the virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m italian_accounts_reclassifier.cli --check-dependencies
```

or allow local-user script activation:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
& ".\.venv\Scripts\Activate.ps1"
```

## Warning: `does not provide the extra 'dev'`

The package in this repository does provide the `dev` extra. If pip says it does not, you are probably installing from the wrong folder or from an older copy.

Check that this file exists:

```powershell
Test-Path ".\pyproject.toml"
```

Then check that the file contains `[project.optional-dependencies]` and `dev`:

```powershell
Select-String -Path ".\pyproject.toml" -Pattern "optional-dependencies|dev"
```

If you are in the parent app folder rather than the Python project folder, install with the subfolder path:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani"
python -m pip install -e ".\italian_accounts_reclassifier[dev]"
```

If you are in the Python project folder, install with:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\italian_accounts_reclassifier"
python -m pip install -e ".[dev]"
```

If editable extras still cause problems, install the explicit requirements files instead:

```powershell
python -m pip install -r requirements-dev.txt
python -m pip install -e .
```

## You are currently using Python 3.14

Your log shows Python 3.14 user site-packages. The project requires Python 3.11 or newer, but for best package compatibility on Windows, Python 3.11 or 3.12 is recommended for now.

Check versions:

```powershell
python --version
py -0p
```

If Python 3.11 is installed, create the virtual environment explicitly with:

```powershell
py -3.11 -m venv .venv
```

## Minimal recovery command sequence

From the correct Python project folder:

```powershell
cd "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\italian_accounts_reclassifier"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m italian_accounts_reclassifier.cli --check-dependencies
.\.venv\Scripts\python.exe -m italian_accounts_reclassifier.cli --inspect-template "C:\Users\g.delia\OneDrive - Plimsoll Publishing Ltd\Documents\Editing files\Riclassificatore bilanci italiani\knowledge base\Template.xlsx"
.\.venv\Scripts\python.exe -m pytest tests
```
