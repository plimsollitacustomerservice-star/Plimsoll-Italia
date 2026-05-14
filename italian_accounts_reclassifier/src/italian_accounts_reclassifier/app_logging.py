"""Local logging setup that avoids raw financial data by default."""

from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"


def configure_logging(log_dir: str | Path, *, debug: bool = False) -> Path:
    """Configure rotating local file logging under the configured app data folder."""
    directory = Path(log_dir)
    directory.mkdir(parents=True, exist_ok=True)
    log_file = directory / "italian_accounts_reclassifier.log"

    root = logging.getLogger("italian_accounts_reclassifier")
    root.setLevel(logging.DEBUG if debug else logging.INFO)
    root.handlers.clear()

    handler = RotatingFileHandler(log_file, maxBytes=1_000_000, backupCount=5, encoding="utf-8")
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    root.addHandler(handler)
    root.propagate = False
    root.info("Local logging initialised")
    return log_file
