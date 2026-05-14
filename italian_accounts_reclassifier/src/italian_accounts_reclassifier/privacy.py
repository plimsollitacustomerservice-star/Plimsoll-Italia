"""Privacy guardrails for local-only financial document processing."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .models import AppSettings

CLOUD_SYNC_MARKERS = (
    "onedrive",
    "google drive",
    "dropbox",
    "icloud",
    "sharepoint",
    "box sync",
)


@dataclass(frozen=True)
class PrivacyCheckResult:
    """Result of local-only privacy preflight checks."""

    ok: bool
    errors: tuple[str, ...]
    warnings: tuple[str, ...]


def appears_cloud_synced(path: Path) -> bool:
    """Return True when a path appears to sit inside a common sync folder."""
    lowered = str(path).lower()
    return any(marker in lowered for marker in CLOUD_SYNC_MARKERS)


def run_privacy_preflight(settings: AppSettings) -> PrivacyCheckResult:
    """Validate that privacy-sensitive processing settings remain local-only."""
    errors: list[str] = []
    warnings: list[str] = []

    if settings.privacy.allow_network_during_processing:
        errors.append("Network access during processing is enabled; disable it for local-only mode.")
    if settings.privacy.allow_cloud_ocr:
        errors.append("Cloud OCR is enabled; only local OCR is permitted.")
    if settings.privacy.allow_cloud_ai:
        errors.append("Cloud AI is enabled; cloud AI services are not permitted.")
    if settings.privacy.allow_telemetry:
        errors.append("Telemetry is enabled; telemetry must remain disabled.")

    if settings.privacy.warn_on_cloud_synced_paths:
        for label, path in (("knowledge base", settings.paths.knowledge_base), ("output", settings.paths.output)):
            if appears_cloud_synced(path):
                warnings.append(
                    f"The configured {label} path appears to be cloud-synced: {path}. "
                    "The app processes locally, but sync software may upload files independently."
                )

    return PrivacyCheckResult(ok=not errors, errors=tuple(errors), warnings=tuple(warnings))
