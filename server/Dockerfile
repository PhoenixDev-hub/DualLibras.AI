# Multi-stage build para otimizar imagem
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar em /opt
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt


# Stage final
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências runtime necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    libportaudio2 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar pacotes Python instalados do builder
COPY --from=builder /root/.local /root/.local

# Preparar PATH
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5455 \
    LOG_LEVEL=INFO

# Criar diretório para transcrições
RUN mkdir -p /app/transcripts

# Copiar código da aplicação
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5455/health', timeout=5)" || exit 1

# Expor porta
EXPOSE 5455

# Comando padrão
CMD ["python", "main.py"]
