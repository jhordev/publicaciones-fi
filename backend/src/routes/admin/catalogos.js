import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { eliminarImagen } from '../../lib/imagenes.js';
import { asyncH, HttpError, paginacion, parseId, registrarBitacora, emptyToNull, slugify } from '../../lib/utils.js';

const optStr = (max) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
const optUrl = z.preprocess(emptyToNull, z.string().trim().max(500).url('URL inválida').nullable().optional());
const estado = z.enum(['activo', 'inactivo']).default('activo');
const issn = z.preprocess(
  (v) => (typeof emptyToNull(v) === 'string' ? v.trim().toUpperCase() : emptyToNull(v)),
  z.string().regex(/^\d{4}-\d{3}[\dX]$/, 'ISSN inválido (formato 1234-567X)').nullable().optional(),
);
const orcid = z.preprocess(
  (v) => {
    const s = emptyToNull(v);
    return typeof s === 'string' ? s.trim().replace(/^https?:\/\/orcid\.org\//i, '').toUpperCase() : s;
  },
  z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, 'ORCID inválido (formato 0000-0000-0000-0000)').nullable().optional(),
);

/**
 * Configuración de cada catálogo administrable.
 * - relaciones: conteos que impiden eliminar (se sugiere desactivar)
 * - buscar: campos para el filtro de texto
 */
const CATALOGOS = {
  autores: {
    modelo: 'autor',
    schema: z.object({
      nombres: z.string().trim().min(1, 'Ingrese los nombres').max(100),
      apellidos: z.string().trim().min(1, 'Ingrese los apellidos').max(100),
      tipoAutor: z.enum(['estudiante', 'docente', 'egresado', 'externo']),
      correo: z.preprocess(emptyToNull, z.string().trim().toLowerCase().email('Correo inválido').max(150).nullable().optional()),
      orcid,
      institucion: optStr(200),
      programaId: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.number().int().positive().nullable().optional()),
    }),
    buscar: ['nombres', 'apellidos', 'orcid', 'correo', 'institucion'],
    orden: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    include: { programa: { select: { id: true, nombre: true } } },
    relaciones: ['publicaciones'],
    filtros: (q) => ({
      ...(q.tipoAutor ? { tipoAutor: q.tipoAutor } : {}),
      ...(q.programa ? { programaId: Number(q.programa) || undefined } : {}),
    }),
    etiqueta: (r) => `${r.apellidos}, ${r.nombres}`,
    alEliminar: (r) => eliminarImagen('autores', r.foto),
  },
  revistas: {
    modelo: 'revista',
    schema: z.object({
      nombre: z.string().trim().min(2, 'Ingrese el nombre').max(255),
      editorial: optStr(200),
      issnImpreso: issn,
      issnElectronico: issn,
      pais: optStr(100),
      urlRevista: optUrl,
      indexacion: optStr(255),
      descripcion: optStr(5000),
      estado,
    }),
    buscar: ['nombre', 'editorial', 'issnImpreso', 'issnElectronico', 'indexacion'],
    orden: [{ nombre: 'asc' }],
    relaciones: ['publicaciones'],
    tieneEstado: true,
    etiqueta: (r) => r.nombre,
  },
  tipos: {
    modelo: 'tipoPublicacion',
    entidad: 'tipos_publicacion',
    schema: z.object({ nombre: z.string().trim().min(2).max(100), descripcion: optStr(2000), estado }),
    buscar: ['nombre'],
    orden: [{ nombre: 'asc' }],
    relaciones: ['publicaciones'],
    tieneEstado: true,
    etiqueta: (r) => r.nombre,
  },
  programas: {
    modelo: 'programa',
    schema: z.object({
      nombre: z.string().trim().min(2).max(150),
      codigo: optStr(20),
      descripcion: optStr(2000),
      estado,
    }),
    buscar: ['nombre', 'codigo'],
    orden: [{ nombre: 'asc' }],
    relaciones: ['publicaciones', 'autores'],
    tieneEstado: true,
    etiqueta: (r) => r.nombre,
  },
  lineas: {
    modelo: 'lineaInvestigacion',
    entidad: 'lineas_investigacion',
    schema: z.object({ nombre: z.string().trim().min(2).max(200), descripcion: optStr(2000), estado }),
    buscar: ['nombre'],
    orden: [{ nombre: 'asc' }],
    relaciones: ['publicaciones'],
    tieneEstado: true,
    etiqueta: (r) => r.nombre,
  },
  'palabras-clave': {
    modelo: 'palabraClave',
    entidad: 'palabras_clave',
    schema: z.object({ nombre: z.string().trim().min(1).max(100) }).transform((d) => ({ ...d, slug: slugify(d.nombre) })),
    buscar: ['nombre'],
    orden: [{ nombre: 'asc' }],
    relaciones: ['publicaciones'],
    etiqueta: (r) => r.nombre,
  },
};

const router = Router();

for (const [ruta, cfg] of Object.entries(CATALOGOS)) {
  const modelo = prisma[cfg.modelo];
  const entidad = cfg.entidad ?? ruta;
  const conteo = { _count: { select: Object.fromEntries(cfg.relaciones.map((r) => [r, true])) } };

  router.get(`/${ruta}`, asyncH(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const where = {
      ...(q ? { AND: q.split(/\s+/).map((t) => ({ OR: cfg.buscar.map((f) => ({ [f]: { contains: t } })) })) } : {}),
      ...(cfg.tieneEstado && req.query.estado ? { estado: req.query.estado } : {}),
      ...(cfg.filtros ? cfg.filtros(req.query) : {}),
    };
    // ?todos=1 devuelve la lista completa (para selectores en formularios)
    if (req.query.todos === '1') {
      const items = await modelo.findMany({ where, orderBy: cfg.orden, include: cfg.include, take: 2000 });
      return res.json({ items, total: items.length });
    }
    const { page, limit, skip } = paginacion(req.query, 20, 100);
    const [total, items] = await Promise.all([
      modelo.count({ where }),
      modelo.findMany({ where, orderBy: cfg.orden, skip, take: limit, include: { ...cfg.include, ...conteo } }),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  }));

  router.get(`/${ruta}/:id`, asyncH(async (req, res) => {
    const item = await modelo.findUnique({ where: { id: parseId(req.params.id) }, include: { ...cfg.include, ...conteo } });
    if (!item) throw new HttpError(404, 'Registro no encontrado');
    res.json(item);
  }));

  router.post(`/${ruta}`, asyncH(async (req, res) => {
    const data = cfg.schema.parse(req.body);
    const item = await modelo.create({ data, include: cfg.include });
    await registrarBitacora(req, 'crear', entidad, item.id, cfg.etiqueta(item));
    res.status(201).json(item);
  }));

  router.put(`/${ruta}/:id`, asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    const data = cfg.schema.parse(req.body);
    const item = await modelo.update({ where: { id }, data, include: cfg.include });
    await registrarBitacora(req, 'editar', entidad, id, cfg.etiqueta(item));
    res.json(item);
  }));

  router.delete(`/${ruta}/:id`, asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    const item = await modelo.findUnique({ where: { id }, include: conteo });
    if (!item) throw new HttpError(404, 'Registro no encontrado');
    const usos = Object.values(item._count).reduce((a, b) => a + b, 0);
    if (usos > 0) {
      throw new HttpError(409, cfg.tieneEstado
        ? `No se puede eliminar: tiene ${usos} registro(s) relacionado(s). Puede marcarlo como inactivo.`
        : `No se puede eliminar: tiene ${usos} registro(s) relacionado(s).`);
    }
    await modelo.delete({ where: { id } });
    cfg.alEliminar?.(item);
    await registrarBitacora(req, 'eliminar', entidad, id, cfg.etiqueta(item));
    res.json({ ok: true });
  }));
}

export default router;
