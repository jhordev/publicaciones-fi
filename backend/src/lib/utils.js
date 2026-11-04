import { prisma } from './prisma.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

export function paginacion(query, defLimit = 12, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador inválido');
  return id;
}

/** Registra una acción administrativa en la bitácora (sin interrumpir la operación si falla). */
export async function registrarBitacora(req, accion, entidad, registroId = null, detalle = null) {
  try {
    await prisma.bitacora.create({
      data: {
        usuarioId: req.user?.id ?? null,
        accion,
        entidad,
        registroId,
        detalle: detalle ? String(detalle).slice(0, 2000) : null,
        ip: req.ip?.slice(0, 45) ?? null,
      },
    });
  } catch (err) {
    console.error('No se pudo registrar en bitácora:', err.message);
  }
}

/** Convierte cadenas vacías en null (útil para campos opcionales de formularios). */
export const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
