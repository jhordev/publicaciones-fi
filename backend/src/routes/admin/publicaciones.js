import { Router } from 'express';
import fs from 'node:fs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncH, HttpError, paginacion, parseId, registrarBitacora, slugify, emptyToNull } from '../../lib/utils.js';
import { construirFiltro, includeLista, includeDetalle, ORDENES, serializarLista, serializarDetalle } from '../../lib/publicaciones.js';
import { rutaFisica } from '../../lib/archivos.js';
import { eliminarImagen } from '../../lib/imagenes.js';
import { ROLES, requireRol } from '../../middleware/auth.js';

const router = Router();
const anioActual = new Date().getFullYear();

const optStr = (max) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
const optId = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.number().int().positive().nullable().optional());

/** Normaliza un DOI: acepta "https://doi.org/10.xxx/yyy", "doi:10.xxx/yyy" o "10.xxx/yyy". */
export function normalizarDoi(v) {
  const s = emptyToNull(v);
  if (typeof s !== 'string') return s;
  return s.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
}

const doiSchema = z.preprocess(
  normalizarDoi,
  z.string().max(191).regex(/^10\.\d{4,9}\/\S+$/, 'DOI inválido (ej.: 10.1234/abcd.2024.001)').nullable().optional(),
);

const urlSchema = z.preprocess(
  emptyToNull,
  z.string().trim().max(500).url('URL inválida')
    .refine((u) => /^https?:\/\//i.test(u), 'La URL debe iniciar con http:// o https://')
    .nullable().optional(),
);

const publicacionSchema = z.object({
  titulo: z.string().trim().min(5, 'El título es muy corto').max(500),
  resumen: optStr(20000),
  idioma: z.string().trim().min(2).max(10).default('es'),
  tipoPublicacionId: z.coerce.number({ invalid_type_error: 'Seleccione el tipo de publicación' }).int().positive('Seleccione el tipo de publicación'),
  revistaId: optId,
  programaId: optId,
  anioPublicacion: z.coerce.number().int().min(1950, 'Año inválido').max(anioActual + 1, 'Año inválido'),
  fechaPublicacion: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  volumen: optStr(20),
  numero: optStr(20),
  paginas: optStr(30),
  doi: doiSchema,
  urlPublicacion: urlSchema,
  destacado: z.boolean().default(false),
  autores: z
    .array(z.object({ autorId: z.coerce.number().int().positive(), esAutorCorrespondencia: z.boolean().default(false) }))
    .min(1, 'Agregue al menos un autor')
    .max(100)
    .refine((arr) => new Set(arr.map((a) => a.autorId)).size === arr.length, 'Hay autores repetidos'),
  palabrasClave: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  lineas: z.array(z.coerce.number().int().positive()).max(20).default([]),
});

async function slugUnico(tx, titulo, excluirId) {
  const base = slugify(titulo) || 'publicacion';
  let slug = base;
  for (let i = 2; ; i++) {
    const existe = await tx.publicacion.findUnique({ where: { slug }, select: { id: true } });
    if (!existe || existe.id === excluirId) return slug;
    slug = `${base}-${i}`;
  }
}

async function idsPalabrasClave(tx, nombres) {
  const ids = [];
  const vistos = new Set();
  for (const nombre of nombres) {
    const slug = slugify(nombre);
    if (!slug || vistos.has(slug)) continue;
    vistos.add(slug);
    const k = await tx.palabraClave.upsert({ where: { slug }, update: {}, create: { nombre, slug } });
    ids.push(k.id);
  }
  return ids;
}

function datosBase(d) {
  return {
    titulo: d.titulo,
    resumen: d.resumen ?? null,
    idioma: d.idioma,
    tipoPublicacionId: d.tipoPublicacionId,
    revistaId: d.revistaId ?? null,
    programaId: d.programaId ?? null,
    anioPublicacion: d.anioPublicacion,
    fechaPublicacion: d.fechaPublicacion ?? null,
    volumen: d.volumen ?? null,
    numero: d.numero ?? null,
    paginas: d.paginas ?? null,
    doi: d.doi ?? null,
    urlPublicacion: d.urlPublicacion ?? null,
    destacado: d.destacado,
  };
}

async function guardarRelaciones(tx, pubId, d) {
  await tx.publicacionAutor.deleteMany({ where: { publicacionId: pubId } });
  await tx.publicacionAutor.createMany({
    data: d.autores.map((a, i) => ({
      publicacionId: pubId,
      autorId: a.autorId,
      ordenAutoria: i + 1,
      esAutorCorrespondencia: a.esAutorCorrespondencia,
    })),
  });
  await tx.publicacionPalabraClave.deleteMany({ where: { publicacionId: pubId } });
  const kIds = await idsPalabrasClave(tx, d.palabrasClave);
  if (kIds.length) {
    await tx.publicacionPalabraClave.createMany({ data: kIds.map((id) => ({ publicacionId: pubId, palabraClaveId: id })) });
  }
  await tx.publicacionLinea.deleteMany({ where: { publicacionId: pubId } });
  const lineas = [...new Set(d.lineas)];
  if (lineas.length) {
    await tx.publicacionLinea.createMany({ data: lineas.map((id) => ({ publicacionId: pubId, lineaId: id })) });
  }
}

/** Verifica duplicados probables (mismo DOI o mismo título) para alertar al registrar. */
router.get('/duplicados', asyncH(async (req, res) => {
  const excluir = req.query.excluir ? parseId(req.query.excluir) : undefined;
  const OR = [];
  const titulo = typeof req.query.titulo === 'string' ? req.query.titulo.trim() : '';
  const doi = normalizarDoi(typeof req.query.doi === 'string' ? req.query.doi : '');
  if (titulo) OR.push({ titulo });
  if (doi) OR.push({ doi });
  if (!OR.length) return res.json([]);
  const items = await prisma.publicacion.findMany({
    where: { OR, ...(excluir ? { id: { not: excluir } } : {}) },
    select: { id: true, titulo: true, doi: true, estado: true },
    take: 5,
  });
  res.json(items);
}));

router.get('/', asyncH(async (req, res) => {
  const { page, limit, skip } = paginacion(req.query, 20, 100);
  const where = construirFiltro(req.query, { soloPublicadas: false });
  const orderBy = ORDENES[req.query.orden] ?? ORDENES.actualizacion;
  const [total, items, porEstado] = await Promise.all([
    prisma.publicacion.count({ where }),
    prisma.publicacion.findMany({ where, orderBy, skip, take: limit, include: includeLista }),
    prisma.publicacion.groupBy({ by: ['estado'], _count: true }),
  ]);
  res.json({
    items: items.map(serializarLista),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    porEstado: Object.fromEntries(porEstado.map((e) => [e.estado, e._count])),
  });
}));

router.get('/:id', asyncH(async (req, res) => {
  const p = await prisma.publicacion.findUnique({ where: { id: parseId(req.params.id) }, include: includeDetalle });
  if (!p) throw new HttpError(404, 'Publicación no encontrada');
  res.json(serializarDetalle(p, { publico: false }));
}));

router.post('/', asyncH(async (req, res) => {
  const d = publicacionSchema.parse(req.body);
  const pub = await prisma.$transaction(async (tx) => {
    const slug = await slugUnico(tx, d.titulo);
    const p = await tx.publicacion.create({ data: { ...datosBase(d), slug, estado: 'borrador', creadoPor: req.user.id } });
    await guardarRelaciones(tx, p.id, d);
    return p;
  });
  await registrarBitacora(req, 'crear', 'publicaciones', pub.id, pub.titulo);
  res.status(201).json({ id: pub.id, slug: pub.slug });
}));

router.put('/:id', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const d = publicacionSchema.parse(req.body);
  const actual = await prisma.publicacion.findUnique({ where: { id }, select: { id: true } });
  if (!actual) throw new HttpError(404, 'Publicación no encontrada');
  await prisma.$transaction(async (tx) => {
    await tx.publicacion.update({ where: { id }, data: datosBase(d) });
    await guardarRelaciones(tx, id, d);
  });
  await registrarBitacora(req, 'editar', 'publicaciones', id, d.titulo);
  res.json({ ok: true });
}));

const TRANSICIONES = {
  borrador: ['revision', 'publicado', 'archivado'],
  revision: ['borrador', 'publicado', 'archivado'],
  publicado: ['revision', 'archivado'],
  archivado: ['borrador', 'publicado'],
};

router.patch('/:id/estado', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const { estado } = z.object({ estado: z.enum(['borrador', 'revision', 'publicado', 'archivado']) }).parse(req.body);
  const p = await prisma.publicacion.findUnique({ where: { id }, include: { _count: { select: { autores: true } } } });
  if (!p) throw new HttpError(404, 'Publicación no encontrada');
  if (p.estado === estado) return res.json({ ok: true });
  if (!TRANSICIONES[p.estado].includes(estado)) throw new HttpError(400, `No se puede pasar de "${p.estado}" a "${estado}"`);
  if (estado === 'publicado' && p._count.autores === 0) throw new HttpError(400, 'La publicación debe tener al menos un autor');
  await prisma.publicacion.update({ where: { id }, data: { estado } });
  await registrarBitacora(req, `estado_${estado}`, 'publicaciones', id, `${p.estado} → ${estado}`);
  res.json({ ok: true });
}));

router.patch('/:id/destacado', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const { destacado } = z.object({ destacado: z.boolean() }).parse(req.body);
  await prisma.publicacion.update({ where: { id }, data: { destacado } });
  await registrarBitacora(req, destacado ? 'destacar' : 'quitar_destacado', 'publicaciones', id);
  res.json({ ok: true });
}));

/** Eliminación definitiva: solo administradores y solo borradores (lo demás se archiva). */
router.delete('/:id', requireRol(ROLES.ADMIN), asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const p = await prisma.publicacion.findUnique({ where: { id }, include: { archivos: true } });
  if (!p) throw new HttpError(404, 'Publicación no encontrada');
  if (p.estado !== 'borrador') {
    throw new HttpError(400, 'Solo se pueden eliminar borradores. Archive la publicación para conservar su historial.');
  }
  await prisma.publicacion.delete({ where: { id } });
  for (const f of p.archivos) fs.rm(rutaFisica(f.rutaArchivo), { force: true }, () => {});
  eliminarImagen('publicaciones', p.imagen);
  await registrarBitacora(req, 'eliminar', 'publicaciones', id, p.titulo);
  res.json({ ok: true });
}));

export default router;
