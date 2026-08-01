from entities.session import SessionTypeInfo
from tests.fakes import FakeSessionRepository
from use_cases.get_session_types import GetSessionTypesUseCase


def test_returns_session_types_from_repository():
    types = [SessionTypeInfo(code="R", name="Race"), SessionTypeInfo(code="Q", name="Qualifying")]
    use_case = GetSessionTypesUseCase(FakeSessionRepository(session_types=types))
    assert use_case.execute(2026, 1) == types
