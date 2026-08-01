import json
import os
from datetime import datetime

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
