from entities.session import SessionTypeInfo


def present_session_types(types: list[SessionTypeInfo]) -> dict:
    return {
        "status": "success",
        "sessions": [{"code": t.code, "name": t.name} for t in types],
    }
