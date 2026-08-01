import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import type { UploadMaterialInput } from '../schemas/material.schema';

type MaterialKind = {
  prismaType: 'PDF' | 'DOCX' | 'PPTX' | 'OUTRO';
  displayType: string;
  extension: string;
  mimeHint: string;
};

const acceptedExtensions: Record<string, MaterialKind> = {
  pdf: { prismaType: 'PDF', displayType: 'PDF', extension: 'pdf', mimeHint: 'application/pdf' },
  doc: { prismaType: 'DOCX', displayType: 'Documento Word', extension: 'doc', mimeHint: 'application/msword' },
  docx: { prismaType: 'DOCX', displayType: 'Documento Word', extension: 'docx', mimeHint: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ppt: { prismaType: 'PPTX', displayType: 'Apresentação', extension: 'ppt', mimeHint: 'application/vnd.ms-powerpoint' },
  pptx: { prismaType: 'PPTX', displayType: 'Apresentação', extension: 'pptx', mimeHint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  txt: { prismaType: 'OUTRO', displayType: 'Texto', extension: 'txt', mimeHint: 'text/plain' },
};

function getMaterialKind(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const kind = acceptedExtensions[extension];

  if (!kind) {
    throw new AppError('Formato inválido. Envie PDF, Word, PowerPoint ou Texto.', 400);
  }

  return kind;
}

function sanitizeFilename(filename: string) {
  const parsed = path.parse(filename);
  const safeName = parsed.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'material';

  return safeName;
}

function decodeBase64(contentBase64: string) {
  const [, payload = contentBase64] = contentBase64.match(/^data:[^;]+;base64,(.*)$/) ?? [];
  return Buffer.from(payload, 'base64');
}

async function sendToAi(input: {
  materialId: string;
  filename: string;
  displayType: string;
  contentBase64: string;
  uploadedBy: string;
}) {
  try {
    const response = await fetch(`${env.aiBackendUrl}/materials/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: input.materialId,
        filename: input.filename,
        display_type: input.displayType,
        content_base64: input.contentBase64,
        uploaded_by: input.uploadedBy,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function ensureCanUploadMaterial(role: string) {
  const normalizedRole = role.toUpperCase();
  if (normalizedRole !== 'PROFESSOR' && normalizedRole !== 'ADMIN') {
    throw new AppError('Somente professores podem enviar materiais', 403);
  }
}

export function formatMaterial(material: {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: Date;
}) {
  const extension = material.name.split('.').pop()?.toLowerCase() ?? '';
  const kind = acceptedExtensions[extension];

  return {
    id: material.id,
    name: material.name,
    url: material.url,
    type: material.type,
    displayType: kind?.displayType ?? 'Arquivo',
    createdAt: material.createdAt,
  };
}

export const materialService = {
  async listForUser(userId: string, role: string) {
    const normalizedRole = role.toUpperCase();

    return prisma.material.findMany({
      where: normalizedRole === 'ADMIN' ? undefined : { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async upload(userId: string, role: string, data: UploadMaterialInput) {
    ensureCanUploadMaterial(role);

    const kind = getMaterialKind(data.filename);
    const fileBuffer = decodeBase64(data.contentBase64);

    if (fileBuffer.byteLength === 0) {
      throw new AppError('Arquivo vazio', 400);
    }

    if (fileBuffer.byteLength > env.materialMaxBytes) {
      throw new AppError('Arquivo excede o limite permitido', 400);
    }

    const uploadDir = path.resolve(env.materialUploadDir);
    await mkdir(uploadDir, { recursive: true });

    const storedFilename = `${randomUUID()}-${sanitizeFilename(data.filename)}.${kind.extension}`;
    const filePath = path.join(uploadDir, storedFilename);
    await writeFile(filePath, fileBuffer);

    const material = await prisma.material.create({
      data: {
        name: data.filename,
        url: filePath,
        type: kind.prismaType,
        uploadedById: userId,
      },
    });

    const sentToAi = await sendToAi({
      materialId: material.id,
      filename: data.filename,
      displayType: kind.displayType,
      contentBase64: fileBuffer.toString('base64'),
      uploadedBy: userId,
    });

    return {
      material,
      sentToAi,
    };
  },
};
