import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, WebSocketException
import uvicorn

# Configurar logging estruturado
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)
PORT = int(os.getenv("PORT", "5455"))

# Configurações
MAX_MESSAGE_SIZE = 64 * 1024  # 64KB
SEND_TIMEOUT = 5.0  # segundos
CLIENT_CONNECT_TIMEOUT = 10.0  # segundos

clientes: set[WebSocket] = set()
transcricao_task: asyncio.Task | None = None


async def enviar_para_front(mensagem: dict[str, Any] | str) -> None:
    """Envia mensagem para todos os clientes conectados com retry."""
    desconectados = []
    payload = mensagem if isinstance(mensagem, str) else json.dumps(mensagem)

    if not payload:
        logger.warning("Tentativa de enviar mensagem vazia")
        return

    logger.debug(f"Enviando para {len(clientes)} cliente(s): {payload[:100]}...")

    for cliente in list(clientes):
        try:
            # Enviar com timeout
            await asyncio.wait_for(cliente.send_text(payload), timeout=SEND_TIMEOUT)
        except asyncio.TimeoutError:
            logger.warning(f"Timeout ao enviar para cliente {cliente.client}")
            desconectados.append(cliente)
        except Exception as exc:
            logger.warning(f"Erro ao enviar para cliente: {type(exc).__name__}: {exc}")
            desconectados.append(cliente)

    # Remover clientes desconectados
    for cliente in desconectados:
        clientes.discard(cliente)
        logger.debug(f"Cliente removido. Restantes: {len(clientes)}")


async def executar_transcricao_com_retry(max_tentativas: int = 3) -> None:
    """Executa transcrição com retry logic e backoff exponencial."""
    for tentativa in range(max_tentativas):
        try:
            from RealTimeAudioTranscription import iniciar_transcricao

            logger.info(
                f"Iniciando transcrição (tentativa {tentativa + 1}/{max_tentativas})"
            )
            await iniciar_transcricao(on_text=enviar_para_front)
            return  # Sucesso

        except asyncio.CancelledError:
            logger.info("Transcrição cancelada")
            raise

        except Exception as exc:
            logger.exception(f"Erro na tentativa {tentativa + 1}: {exc}")

            if tentativa < max_tentativas - 1:
                delay = 2**tentativa  # Backoff: 1s, 2s, 4s
                logger.info(f"Aguardando {delay}s antes de tentar novamente...")
                await asyncio.sleep(delay)
            else:
                logger.error("Todas as tentativas falharam")
                await enviar_para_front(
                    {
                        "type": "error",
                        "text": f"Erro ao executar transcrição: {exc}",
                        "is_final": True,
                        "error": True,
                    }
                )


async def iniciar_transcricao_se_necessario() -> None:
    """Inicia transcrição apenas se houver clientes conectados."""
    global transcricao_task

    if transcricao_task and not transcricao_task.done():
        logger.debug("Transcrição já em executação")
        return

    logger.info("Iniciando transcrição para cliente(s) conectado(s)")
    transcricao_task = asyncio.create_task(executar_transcricao_com_retry())


async def parar_transcricao() -> None:
    """Para a transcrição de forma segura."""
    global transcricao_task

    if not transcricao_task:
        return

    if transcricao_task.done():
        logger.debug("Transcrição já finalizou")
        return

    logger.info("Parando transcrição...")
    transcricao_task.cancel()

    try:
        await asyncio.wait_for(transcricao_task, timeout=5.0)
    except asyncio.CancelledError:
        logger.debug("Transcrição cancelada com sucesso")
    except asyncio.TimeoutError:
        logger.warning("Timeout ao parar transcrição")
    except Exception as exc:
        logger.error(f"Erro ao parar transcrição: {exc}")
    finally:
        transcricao_task = None


async def parar_transcricao_se_sem_clientes() -> None:
    """Para a transcrição se não houver clientes conectados."""
    if clientes:
        logger.debug(f"Ainda há {len(clientes)} cliente(s) conectado(s)")
        return

    await parar_transcricao()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle da aplicação."""
    logger.info(f"Iniciando DualLibras Backend na porta {PORT}")
    try:
        yield
    finally:
        logger.info("Finalizando aplicação...")
        await parar_transcricao()
        logger.info("Transcrição finalizada")


app = FastAPI(
    title="DualLibras.AI Backend",
    description="API de transcrição em tempo real para Libras",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "clientes_conectados": len(clientes),
        "transcricao_ativa": bool(transcricao_task and not transcricao_task.done()),
        "porta": PORT,
    }


@app.post("/test-message")
async def test_message():
    """Endpoint de teste para enviar mensagem ao frontend."""
    mensagem = {
        "type": "transcript",
        "text": "Mensagem de teste do backend.",
        "is_final": True,
    }
    await enviar_para_front(mensagem)
    return {
        "enviado": True,
        "clientes": len(clientes),
        "mensagem": mensagem,
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Endpoint WebSocket para comunicação em tempo real."""
    try:
        await websocket.accept()
    except Exception as exc:
        logger.error(f"Erro ao aceitar conexão WebSocket: {exc}")
        raise

    clientes.add(websocket)
    logger.info(f"Cliente conectado de {websocket.client}. Total: {len(clientes)}")

    # Enviar confirmação de conexão
    try:
        await asyncio.wait_for(
            websocket.send_text(
                json.dumps(
                    {
                        "type": "status",
                        "text": "",
                        "is_final": False,
                        "connected": True,
                    }
                )
            ),
            timeout=SEND_TIMEOUT,
        )
    except Exception as exc:
        logger.warning(f"Erro ao enviar status inicial: {exc}")

    # Iniciar transcrição
    await iniciar_transcricao_se_necessario()

    try:
        while True:
            try:
                # Receber mensagens (keepalive)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0,  # timeout longo para manter conexão aberta
                )
                logger.debug(f"Mensagem recebida: {data[:50]}...")
            except asyncio.TimeoutError:
                # Keepalive: cliente ainda está conectado
                logger.debug("Timeout na recepção, client ainda conectado")
                continue

    except WebSocketDisconnect:
        logger.info(f"Cliente desconectado de {websocket.client}")
    except Exception as exc:
        logger.error(f"Erro no WebSocket: {type(exc).__name__}: {exc}")
    finally:
        clientes.discard(websocket)
        logger.info(f"Cliente removido. Total: {len(clientes)}")
        await parar_transcricao_se_sem_clientes()


if __name__ == "__main__":
    logger.info(f"Iniciando servidor na porta {PORT}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level=os.getenv("LOG_LEVEL", "INFO").lower(),
    )
