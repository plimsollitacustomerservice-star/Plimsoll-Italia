"""Deterministic local mapping engine for early review workflows."""

from __future__ import annotations

try:
    from rapidfuzz import fuzz
except ModuleNotFoundError:  # pragma: no cover - exercised only when optional dependency is absent
    from difflib import SequenceMatcher

    class _FuzzFallback:
        @staticmethod
        def token_set_ratio(left: str, right: str) -> int:
            return int(SequenceMatcher(None, left, right).ratio() * 100)

    fuzz = _FuzzFallback()

from italian_accounts_reclassifier.models import ExtractedItem, MappingSuggestion, TemplateTarget


def confidence_category(score: float) -> str:
    if score >= 90:
        return "auto_suggested"
    if score >= 70:
        return "review_required"
    return "unresolved"


def suggest_mapping(item_id: int, item: ExtractedItem, targets: list[TemplateTarget]) -> MappingSuggestion:
    """Suggest the best Template.xlsx target for one extracted item."""
    best_target: TemplateTarget | None = None
    best_score = 0.0
    method = "unresolved"

    for target in targets:
        if not target.active:
            continue
        if item.normalized_label and item.normalized_label == target.normalized_template_label:
            score = 100.0
            current_method = "exact_label"
        else:
            score = float(fuzz.token_set_ratio(item.normalized_label, target.normalized_template_label))
            current_method = "fuzzy_label"
        if score > best_score:
            best_score = score
            best_target = target
            method = current_method

    if best_target is None or best_score < 70:
        return MappingSuggestion(
            extracted_item_id=item_id,
            template_target_id=None,
            suggested_sheet=None,
            suggested_row=None,
            suggested_cell=None,
            suggested_label=None,
            confidence_score=best_score,
            confidence_category=confidence_category(best_score),
            mapping_method="unresolved",
            status="unresolved",
        )

    return MappingSuggestion(
        extracted_item_id=item_id,
        template_target_id=None,
        suggested_sheet=best_target.template_sheet,
        suggested_row=best_target.template_row,
        suggested_cell=best_target.destination_cell,
        suggested_label=best_target.template_label,
        confidence_score=best_score,
        confidence_category=confidence_category(best_score),
        mapping_method=method,
        status=confidence_category(best_score),
    )
