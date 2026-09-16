#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

for service in client server/auth server/ai; do
    if [[ ! -f "$service/.env" ]]; then
        cp "$service/.env.example" "$service/.env"
        echo "Exemplo copiado para $service/.env; revise os valores antes de iniciar."
    fi
done

if [[ ! -d server/ai/venv ]]; then
    python3 -m venv server/ai/venv
fi
server/ai/venv/bin/python -m pip install -r server/ai/requirements.txt
npm --prefix server/auth ci
npm --prefix client ci

cat <<'GUIDE'
Dependências instaladas. Configure server/auth/.env antes de gerar o cliente Prisma:
  cd server/auth
  npm run prisma:generate
  npm run dev

Em outros terminais, a partir da raiz:
  cd server/ai && venv/bin/python main.py
  cd client && npm run dev

Este script não cria tabelas, executa migrações ou insere usuários.
Consulte README.md para preparação do banco e docs/DEPLOYMENT.md para Docker.
GUIDE
