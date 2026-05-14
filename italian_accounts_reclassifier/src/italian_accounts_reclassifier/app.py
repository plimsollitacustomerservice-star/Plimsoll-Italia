"""Application bootstrap helpers."""

from __future__ import annotations

from .config import ensure_local_directories, load_settings
from .app_logging import configure_logging
from .database import initialize_database
from .privacy import run_privacy_preflight


def bootstrap() -> tuple[bool, tuple[str, ...], tuple[str, ...]]:
    """Prepare local directories, database, and privacy checks for the GUI shell."""
    settings = load_settings()
    ensure_local_directories(settings)
    configure_logging(settings.paths.temp.parent / "logs")
    initialize_database(settings.paths.database)
    privacy_result = run_privacy_preflight(settings)
    return privacy_result.ok, privacy_result.errors, privacy_result.warnings
