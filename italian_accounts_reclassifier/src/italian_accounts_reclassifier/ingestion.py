"""Local file-ingestion validation and type detection."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

SUPPORTED_FILE_TYPES = {
    ".pdf": "pdf",
    ".xlsx": "xlsx",
    ".xls": "xls",
    ".csv": "csv",
    ".xbrl": "xbrl",
    ".xml": "xbrl",
}


@dataclass(frozen=True)
class InputFileMetadata:
    """Safe metadata captured before local extraction starts."""

    path: Path
    file_name: str
    file_type: str
    size_bytes: int
    suffix: str


def detect_file_type(path: str | Path) -> str:
    """Detect supported account-file type from local filename extension."""
    suffix = Path(path).suffix.lower()
    if suffix not in SUPPORTED_FILE_TYPES:
        raise ValueError(f"Unsupported account file type: {suffix or '<none>'}")
    return SUPPORTED_FILE_TYPES[suffix]


def validate_input_file(path: str | Path) -> InputFileMetadata:
    """Validate that a selected input file exists, is readable, and is supported."""
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Input file does not exist: {file_path}")
    if not file_path.is_file():
        raise ValueError(f"Input path is not a file: {file_path}")
    file_type = detect_file_type(file_path)
    with file_path.open("rb") as handle:
        handle.read(1)
    return InputFileMetadata(
        path=file_path,
        file_name=file_path.name,
        file_type=file_type,
        size_bytes=file_path.stat().st_size,
        suffix=file_path.suffix.lower(),
    )
