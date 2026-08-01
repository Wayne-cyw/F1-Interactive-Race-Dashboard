import json
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

from frameworks_drivers.web.app import create_app
from tests.fakes import FakeClock


def test_request_is_recorded_in_user_activity_log(tmp_path):
    app = create_app(clock=FakeClock(datetime(2026, 7, 31)), log_dir=str(tmp_path))
    app.testing = True
    resp = app.test_client().get("/api/seasons")
    assert resp.status_code == 200

    log_path = os.path.join(str(tmp_path), "user_activity.log")
    with open(log_path) as f:
        lines = f.readlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["endpoint"] == "seasons_route"
    assert "timestamp" in entry


def test_repeated_create_app_calls_do_not_stack_duplicate_log_handlers(tmp_path):
    # app.logger is looked up by name (== app.name), and every create_app()
    # call constructs Flask(__name__) with the same __name__, so all app
    # instances in this process share the same underlying Logger and handler
    # list. Without the de-dup guard in logging_config.configure, each of
    # these calls would append another RotatingFileHandler, and a single
    # request would get logged once per accumulated handler.
    apps = [
        create_app(clock=FakeClock(datetime(2026, 7, 31)), log_dir=str(tmp_path))
        for _ in range(5)
    ]
    app = apps[-1]

    rotating_handlers = [
        h for h in app.logger.handlers if isinstance(h, RotatingFileHandler)
    ]
    assert len(rotating_handlers) == 1

    app.testing = True
    app.test_client().get("/api/seasons")

    api_log_path = os.path.join(str(tmp_path), "api.log")
    with open(api_log_path) as f:
        request_lines = [
            line for line in f.readlines() if "GET /api/seasons" in line
        ]
    assert len(request_lines) == 1
