from entities.errors import DomainError, SessionNotFoundError


def test_session_not_found_is_a_domain_error():
    err = SessionNotFoundError("No weather data available")
    assert isinstance(err, DomainError)
    assert str(err) == "No weather data available"
