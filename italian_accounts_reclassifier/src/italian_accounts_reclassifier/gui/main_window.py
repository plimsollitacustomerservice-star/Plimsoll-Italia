"""Minimal PySide6 GUI shell for the approved Phase 2 skeleton."""

from __future__ import annotations

from italian_accounts_reclassifier.app import bootstrap
from italian_accounts_reclassifier.config import load_settings


def launch() -> int:
    """Launch the local desktop shell with a visible privacy-mode indicator."""
    from PySide6.QtWidgets import QApplication, QLabel, QMainWindow, QPushButton, QStatusBar, QVBoxLayout, QWidget

    settings = load_settings()
    ok, errors, warnings = bootstrap()

    app = QApplication([])
    window = QMainWindow()
    window.setWindowTitle("Italian Accounts Reclassifier")

    central = QWidget()
    layout = QVBoxLayout(central)
    privacy_label = QLabel(settings.privacy.privacy_mode_label)
    privacy_label.setObjectName("privacyModeLabel")
    layout.addWidget(privacy_label)
    layout.addWidget(QLabel("Phase 2 shell: configure paths, run local privacy checks, and initialise SQLite."))
    layout.addWidget(QPushButton("Select company accounts file (coming in extraction phase)"))
    window.setCentralWidget(central)

    status = QStatusBar()
    if ok:
        status.showMessage("Local-only privacy preflight passed" + (f" with {len(warnings)} warning(s)" if warnings else ""))
    else:
        status.showMessage("Privacy preflight failed: " + "; ".join(errors))
    window.setStatusBar(status)
    window.resize(900, 500)
    window.show()
    return app.exec()
