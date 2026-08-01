import json
import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

from flask import Flask, g, request


def configure(app: Flask, log_dir: str | None = None) -> None:
    log_dir = log_dir or os.path.join(os.path.dirname(__file__), "..", "logs")
    os.makedirs(log_dir, exist_ok=True)

    api_log_path = os.path.join(log_dir, "api.log")

    # Guard against accumulating duplicate RotatingFileHandlers on app.logger.
    # app.logger is a plain logging.Logger looked up by name (== app.name),
    # so every create_app() call in the same process shares the SAME logger
    # instance and its handler list. Without this guard, configure() would
    # stack another handler on every call (e.g. across a pytest session that
    # creates many app instances), and each request would get logged once
    # per accumulated handler. Clear any pre-existing RotatingFileHandlers
    # before adding the new one so only the current call's handler remains.
    for handler in list(app.logger.handlers):
        if isinstance(handler, RotatingFileHandler):
            app.logger.removeHandler(handler)
            handler.close()

    file_handler = RotatingFileHandler(
        api_log_path, maxBytes=10240000, backupCount=10
    )
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
        )
    )
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info("F1 Dashboard API startup")

    user_log_path = os.path.join(log_dir, "user_activity.log")

    @app.before_request
    def _start_timer():
        g.start = datetime.now()
        g.user_ip = request.remote_addr

    @app.after_request
    def _log_request(response):
        if hasattr(g, "start"):
            duration = (datetime.now() - g.start).total_seconds()
            app.logger.info(
                f"{request.method} {request.path} - {response.status_code} - {duration:.3f}s - IP: {g.user_ip}"
            )
            with open(user_log_path, "a") as f:
                f.write(
                    json.dumps(
                        {
                            "timestamp": datetime.now().isoformat(),
                            "endpoint": request.endpoint,
                            "ip": g.user_ip,
                            "params": request.view_args,
                            "user_agent": request.headers.get("User-Agent", "Unknown"),
                        }
                    )
                    + "\n"
                )
        return response
