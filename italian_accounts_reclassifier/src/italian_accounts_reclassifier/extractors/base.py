"""Base extractor contracts for later ingestion phases."""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from italian_accounts_reclassifier.models import ExtractedItem


class LocalExtractor(ABC):
    """Contract for extractors that read local files without modifying them."""

    supported_extensions: tuple[str, ...] = ()

    def supports(self, path: Path) -> bool:
        return path.suffix.lower() in self.supported_extensions

    @abstractmethod
    def extract(self, path: Path) -> list[ExtractedItem]:
        """Extract normalized items from a local source file."""
