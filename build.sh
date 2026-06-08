#!/bin/bash
set -e

echo "================================"
echo "DualLibras.AI - Docker Builder"
echo "================================"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE} Building backend...${NC}"
docker build -t duallibras-backend:latest ./server

echo -e "${BLUE} Building frontend...${NC}"
docker build -t duallibras-frontend:latest ./client

echo ""
echo -e "${GREEN} Build completo!${NC}"
echo ""
echo "Próximos passos:"
echo "1. docker-compose up -d"
echo "2. Acesse http://localhost"
echo "3. WebSocket: ws://localhost:5455/ws"
echo ""
