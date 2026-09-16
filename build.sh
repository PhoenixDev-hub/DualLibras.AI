#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

docker compose build

echo 'Imagens construídas. Consulte docs/DEPLOYMENT.md antes de iniciar os serviços.'
