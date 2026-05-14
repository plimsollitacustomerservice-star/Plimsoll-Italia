"""Offline helper to inspect the Windows knowledge base after deployment."""

from __future__ import annotations

from pathlib import Path

from italian_accounts_reclassifier.config import load_settings


def main() -> int:
    settings = load_settings()
    kb = settings.paths.knowledge_base
    print(f"Knowledge-base folder: {kb}")
    print(f"Exists: {kb.exists()}")
    if not kb.exists():
        print("Knowledge base is not available in this environment.")
        return 1
    template = kb / "Template.xlsx"
    print(f"Template.xlsx exists: {template.exists()}")
    for path in sorted(kb.iterdir()):
        print(path.name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
