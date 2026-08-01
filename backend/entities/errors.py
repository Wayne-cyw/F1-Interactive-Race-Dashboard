class DomainError(Exception):
    """Base class for domain-layer errors."""


class SessionNotFoundError(DomainError):
    """Raised when requested F1 data legitimately does not exist (maps to HTTP 404)."""
