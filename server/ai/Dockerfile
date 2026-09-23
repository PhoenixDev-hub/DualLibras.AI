FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libportaudio2 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*


ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5455 \
    LOG_LEVEL=INFO

RUN useradd --uid 1000 --create-home appuser && mkdir -p /app/storage /opt/python
COPY --from=builder /root/.local /opt/python
ENV PATH=/opt/python/bin:$PATH PYTHONPATH=/opt/python/lib/python3.11/site-packages
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser main.py ./main.py
RUN chown -R appuser:appuser /app/storage
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5455/health', timeout=5)" || exit 1

EXPOSE 5455

CMD ["python", "main.py"]
