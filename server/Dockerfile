FROM node:22-bookworm-slim AS auth-build
WORKDIR /build/auth
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY auth/package*.json ./
RUN npm ci
COPY auth/prisma ./prisma
COPY auth/prisma.config.ts auth/tsconfig*.json ./
COPY auth/src ./src
RUN npm run build

FROM python:3.11-slim-bookworm AS python-build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY ai/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /tmp/requirements.txt

FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends nginx gettext-base libportaudio2 libsndfile1 openssl libstdc++6 && rm -rf /var/lib/apt/lists/*
COPY --from=auth-build /usr/local/bin/node /usr/local/bin/node
COPY --from=python-build /install /usr/local
WORKDIR /app
COPY --from=auth-build /build/auth /app/auth
COPY ai/app /app/ai/app
COPY ai/main.py /app/ai/main.py
COPY deploy /app/deploy
ENV NODE_ENV=production PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PORT=10000 \
    CORS_ORIGIN=https://duallibrasai.vercel.app COOKIE_SECURE=true TRUST_PROXY=1 \
    AUTH_BACKEND_URL=http://127.0.0.1:4000 AI_BACKEND_URL=http://127.0.0.1:5455 \
    OUTPUT_PATH=/app/storage MATERIAL_OUTPUT_DIR=/app/storage/materials/ai MATERIAL_UPLOAD_DIR=/app/storage/materials/auth
RUN useradd --uid 1000 --create-home appuser && mkdir -p /app/storage && chown -R appuser:appuser /app/storage
USER appuser
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s CMD python /app/deploy/healthcheck.py
CMD ["bash", "/app/deploy/start.sh"]
