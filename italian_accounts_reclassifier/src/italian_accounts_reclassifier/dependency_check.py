"""Local dependency and path preflight checks for Windows setup."""

from __future__ import annotations

from dataclasses import dataclass
from importlib.util import find_spec
from pathlib import Path

from italian_accounts_reclassifier.models import AppSettings

CORE_PACKAGES = ("openpyxl", "pandas", "rapidfuzz")
GUI_PACKAGES = ("PySide6",)
PDF_PACKAGES = ("pdfplumber", "pypdf", "fitz")
OCR_PACKAGES = ("pytesseract", "PIL", "cv2")
XBRL_PACKAGES = ("arelle", "lxml")
TEST_PACKAGES = ("pytest",)


@dataclass(frozen=True)
class DependencyStatus:
    """One package availability result."""

    package: str
    installed: bool


@dataclass(frozen=True)
class PreflightStatus:
    """Combined dependency and configured-path status."""

    dependencies: tuple[DependencyStatus, ...]
    knowledge_base_exists: bool
    template_exists: bool
    output_exists: bool
    template_path: Path

    @property
    def required_ready(self) -> bool:
        return all(item.installed for item in self.dependencies if item.package in CORE_PACKAGES) and self.template_exists


def check_dependencies(settings: AppSettings) -> PreflightStatus:
    """Check local package availability and configured Windows paths without network calls."""
    packages = CORE_PACKAGES + GUI_PACKAGES + PDF_PACKAGES + OCR_PACKAGES + XBRL_PACKAGES + TEST_PACKAGES
    dependencies = tuple(DependencyStatus(package, find_spec(package) is not None) for package in packages)
    template_path = settings.paths.knowledge_base / "Template.xlsx"
    return PreflightStatus(
        dependencies=dependencies,
        knowledge_base_exists=settings.paths.knowledge_base.exists(),
        template_exists=template_path.exists(),
        output_exists=settings.paths.output.exists(),
        template_path=template_path,
    )
