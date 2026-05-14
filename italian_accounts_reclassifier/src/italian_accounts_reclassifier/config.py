"""Configuration loading for the local-only desktop application."""

from __future__ import annotations

from pathlib import Path
import tomllib

from .models import AppPaths, AppSettings, PrivacySettings, ProcessingSettings, ToolSettings

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SETTINGS_FILE = PROJECT_ROOT / "config" / "default_settings.toml"


def _resolve_app_path(value: str, base_dir: Path) -> Path:
    path = Path(value).expanduser()
    if path.is_absolute():
        return path
    return base_dir / path


def load_settings(settings_file: str | Path = DEFAULT_SETTINGS_FILE) -> AppSettings:
    """Load application settings from TOML without contacting any network service."""
    path = Path(settings_file)
    with path.open("rb") as handle:
        raw = tomllib.load(handle)

    base_dir = path.parent.parent
    paths = raw.get("paths", {})
    privacy = raw.get("privacy", {})
    processing = raw.get("processing", {})
    tools = raw.get("tools", {})

    app_paths = AppPaths(
        knowledge_base=_resolve_app_path(paths.get("knowledge_base", "knowledge_base"), base_dir),
        output=_resolve_app_path(paths.get("output", "Output"), base_dir),
        database=_resolve_app_path(paths.get("database", "data/local_mapping_memory.sqlite3"), base_dir),
        temp=_resolve_app_path(paths.get("temp", "data/temp"), base_dir),
    )

    return AppSettings(
        paths=app_paths,
        privacy=PrivacySettings(**privacy),
        processing=ProcessingSettings(**processing),
        tools=ToolSettings(**tools),
    )


def ensure_local_directories(settings: AppSettings) -> None:
    """Create configured local app data directories without touching source files."""
    settings.paths.output.mkdir(parents=True, exist_ok=True)
    settings.paths.database.parent.mkdir(parents=True, exist_ok=True)
    settings.paths.temp.mkdir(parents=True, exist_ok=True)
