#!/usr/bin/env bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR/server"
BASE_URL="http://localhost:5455"

echo "=========================================="
echo "Demo: Sistema de Transcrições em PDF"
echo "=========================================="
echo ""

if [ ! -f "$SERVER_DIR/main.py" ]; then
    echo "❌ Erro: Não encontrado $SERVER_DIR/main.py"
    echo "Execute este script a partir da raiz do projeto"
    exit 1
fi

wait_for_server() {
    echo "Aguardando servidor ficar online..."
    for i in {1..30}; do
        if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
            echo "✓ Servidor online!"
            return 0
        fi
        sleep 1
    done
    echo "❌ Timeout: Servidor não respondeu"
    return 1
}

echo "Opções:"
echo "1. Iniciar servidor (background)"
echo "2. Rodar testes"
echo "3. Salvar transcrição de exemplo"
echo "4. Listar transcrições"
echo "5. Ver estrutura de pastas"
echo "6. Parar servidor"
echo ""

read -p "Escolha uma opção [1-6]: " option

case $option in
    1)
        echo ""
        echo "Iniciando servidor..."
        cd "$SERVER_DIR"
        source venv/bin/activate
        python main.py > /tmp/festival_server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > /tmp/festival_server.pid
        echo "✓ Servidor iniciado (PID: $SERVER_PID)"
        echo "  Logs em: /tmp/festival_server.log"
        sleep 2
        ;;

    2)
        echo ""
        echo "Rodando testes..."
        cd "$SERVER_DIR"
        source venv/bin/activate
        python test_api.py
        ;;

    3)
        echo ""
        echo "Salvando transcrição de exemplo..."
        RESPONSE=$(curl -s -X POST "$BASE_URL/save-transcript" \
          -H "Content-Type: application/json" \
          -d '{
            "text": "Bem-vindo ao Festival 2026! Estamos muito felizes em apresentar o novo sistema de transcrição em tempo real com suporte a Libras. Este é um exemplo de como as transcrições são automaticamente salvas em PDF, texto e JSON para fácil acesso e compartilhamento.",
            "title": "Abertura do Festival 2026",
            "formats": ["pdf", "txt", "json"],
            "metadata": {
              "evento": "Festival 2026",
              "tipo": "Demo",
              "host": "Sistema",
              "data": "2026-06-03"
            }
          }')

        echo "$RESPONSE" | jq '.'

        PDF=$(echo "$RESPONSE" | jq -r '.files.pdf | split("/")[-1]')
        echo ""
        echo "✓ Transcrição salva!"
        echo "  PDF: $PDF"
        ;;

    4)
        echo ""
        echo "Listando transcrições..."
        curl -s "$BASE_URL/transcripts" | jq '.'
        ;;

    5)
        echo ""
        echo "Estrutura de pastas:"
        if [ -d "$SERVER_DIR/output" ]; then
            tree -h "$SERVER_DIR/output" 2>/dev/null || find "$SERVER_DIR/output" -type f -printf "%P (%s bytes)\n"
        else
            echo "Nenhuma transcrição salva ainda"
        fi
        ;;

    6)
        echo ""
        echo "Parando servidor..."
        if [ -f /tmp/festival_server.pid ]; then
            kill $(cat /tmp/festival_server.pid) 2>/dev/null || true
            rm /tmp/festival_server.pid
            echo "✓ Servidor parado"
        else
            echo "Nenhum servidor em execução"
        fi
        ;;

    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
