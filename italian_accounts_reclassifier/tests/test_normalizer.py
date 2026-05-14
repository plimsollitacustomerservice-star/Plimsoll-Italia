from italian_accounts_reclassifier.mapping.normalizer import normalize_italian_label


def test_normalize_italian_label_handles_quotes_accents_and_spaces():
    assert normalize_italian_label("  Disponibilità   dell’esercizio  ") == "disponibilita dell esercizio"
