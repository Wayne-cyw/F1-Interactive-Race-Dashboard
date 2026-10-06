# Hugging Face Space (Docker SDK) image for the F1 dashboard API.
# deploy.sh stages this file next to a copy of backend/ — the build context is the Space repo root.
FROM python:3.11-slim

# Spaces run the container as UID 1000.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1
WORKDIR /home/user/app

COPY --chown=user backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user backend/ .

# Each loaded race session is ~300 MB in RAM; free Spaces have 16 GB.
ENV SESSION_CACHE_SIZE=8

# Bake the FastF1 cache for a whole season into the image so races load in
# seconds instead of 30-60s. Rounds that fail here load on demand at runtime.
ARG PREWARM_YEAR=2025
RUN python scripts/prewarm_cache.py --year ${PREWARM_YEAR} --allow-partial

# Spaces route traffic to app_port (7860, set in README.md). One worker keeps the
# in-memory session cache shared; threads handle the frontend's parallel requests.
EXPOSE 7860
CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "8", "--timeout", "300"]
