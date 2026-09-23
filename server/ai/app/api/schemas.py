from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class SaveTranscriptRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=200000, description="Texto da transcrição")
    title: str = Field(default="Transcrição", max_length=200, description="Título do documento")
    formats: list[Literal["pdf", "txt", "json"]] = Field(default=["pdf", "txt", "json"], min_length=1, max_length=3, description="Formatos a salvar")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Dados adicionais")


class TranscriptResponse(BaseModel):
    success: bool
    message: str
    files: dict[str, str]
    metadata: dict[str, Any]


class TranscriptListResponse(BaseModel):
    total: int
    pdfs: list[str]
    texts: list[str]
    metadata: list[str]


class MaterialIngestRequest(BaseModel):
    material_id: UUID
    filename: str = Field(min_length=1, max_length=200)
    display_type: str = Field(max_length=100)
    content_base64: str = Field(max_length=48 * 1024 * 1024)
    uploaded_by: UUID | None = None


class MaterialIngestResponse(BaseModel):
    success: bool
    message: str
    file: str
