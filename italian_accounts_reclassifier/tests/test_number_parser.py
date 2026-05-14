from italian_accounts_reclassifier.mapping.number_parser import parse_financial_number


def test_parse_italian_number_format():
    assert parse_financial_number("1.234.567,89") == 1234567.89


def test_parse_international_number_format():
    assert parse_financial_number("1,234,567.89") == 1234567.89


def test_parse_parentheses_negative():
    assert parse_financial_number("(1.234,00)") == -1234.0


def test_parse_dash_as_none():
    assert parse_financial_number("-") is None


def test_parse_single_dot_thousands_separator():
    assert parse_financial_number("1.234") == 1234.0


def test_parse_single_comma_decimal_separator():
    assert parse_financial_number("1234,56") == 1234.56


def test_parse_repeated_dot_thousands_separator():
    assert parse_financial_number("1.234.567") == 1234567.0
