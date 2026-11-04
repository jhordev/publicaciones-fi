import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncH, HttpError, paginacion, parseId } from '../lib/utils.js';
import { construirFiltro, includeLista, includeDetalle, ORDENES, serializarLista, serializarDetalle } from '../lib/publicaciones.js';
import { enviarArchivo } from '../lib/archivos.js';

const router = Router();
const PUBLICADA = { estado: 'publicado' };

/** Indicadores generales del portal. */
router.get('/estadisticas', asyncH(async (_req, res) => {
  const [publicaciones, autores, revistas] = await Promise.all([
    prisma.publicacion.count({ where: PUBLICADA }),
    prisma.autor.count({ where: { publicaciones: { some: { publicacion: PUBLICADA } } } }),
    prisma.revista.count({ where: { publicaciones: { some: PUBLICADA } } }),
  ]);
  res.json({ publicaciones, autores, revistas });
}));

/** Opciones para los filtros del catálogo (solo valores con publicaciones visibles). */
router.get('/filtros', asyncH(async (_req, res) => {
  const conPub = { some: PUBLICADA };
  const [anios, tipos, revistas, programas, lineas] = await Promise.all([
    prisma.publicacion.groupBy({ by: ['anioPublicacion'], where: PUBLICADA, _count: true, orderBy: { anioPublicacion: 'desc' } }),
    prisma.tipoPublicacion.findMany({ where: { publicaciones: conPub }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.revista.findMany({ where: { publicaciones: conPub }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.programa.findMany({ where: { publicaciones: conPub }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.lineaInvestigacion.findMany({
      where: { publicaciones: { some: { publicacion: PUBLICADA } } },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);
  res.json({
    anios: anios.map((a) => ({ anio: a.anioPublicacion, total: a._count })),
    tipos,
    revistas,
    programas,
    lineas,
  });
}));

/** Catálogo público con búsqueda, filtros, orden y paginación. */
router.get('/publicaciones', asyncH(async (req, res) => {
  const { page, limit, skip } = paginacion(req.query, 12, 50);
  const where = construirFiltro(req.query, { soloPublicadas: true });
  const orderBy = ORDENES[req.query.orden] ?? ORDENES.reciente;
  const [total, items] = await Promise.all([
    prisma.publicacion.count({ where }),
    prisma.publicacion.findMany({ where, orderBy, skip, take: limit, include: includeLista }),
  ]);
  res.json({ items: items.map(serializarLista), total, page, limit, pages: Math.ceil(total / limit) });
}));

/** Ficha pública de una publicación. */
router.get('/publicaciones/:slug', asyncH(async (req, res) => {
  const p = await prisma.publicacion.findFirst({
    where: { slug: String(req.params.slug), ...PUBLICADA },
    include: includeDetalle,
  });
  if (!p) throw new HttpError(404, 'Publicación no encontrada');
  const relacionadas = await prisma.publicacion.findMany({
    where: {
      ...PUBLICADA,
      id: { not: p.id },
      OR: [
        { autores: { some: { autorId: { in: p.autores.map((a) => a.autorId) } } } },
        { lineas: { some: { lineaId: { in: p.lineas.map((l) => l.lineaId) } } } },
      ],
    },
    take: 4,
    orderBy: ORDENES.reciente,
    include: includeLista,
  });
  res.json({ ...serializarDetalle(p, { publico: true }), relacionadas: relacionadas.map(serializarLista) });
}));

/** Perfil público de un autor (solo si tiene al menos una publicación visible). */
router.get('/autores/:id', asyncH(async (req, res) => {
  const autor = await prisma.autor.findFirst({
    where: { id: parseId(req.params.id), publicaciones: { some: { publicacion: PUBLICADA } } },
    select: {
      id: true, nombres: true, apellidos: true, tipoAutor: true, orcid: true, institucion: true, foto: true,
      programa: { select: { nombre: true } },
      _count: { select: { publicaciones: { where: { publicacion: PUBLICADA } } } },
    },
  });
  if (!autor) throw new HttpError(404, 'Autor no encontrado');
  const { _count, ...datos } = autor;
  res.json({ ...datos, totalPublicaciones: _count.publicaciones });
}));

/** Archivo de una publicación: solo si está publicada y su difusión está autorizada. */
router.get('/archivos/:id', asyncH(async (req, res) => {
  const archivo = await prisma.archivoPublicacion.findUnique({
    where: { id: parseId(req.params.id) },
    include: { publicacion: { select: { estado: true } } },
  });
  if (!archivo || !archivo.autorizadoPublico || archivo.publicacion.estado !== 'publicado') {
    throw new HttpError(404, 'Archivo no disponible');
  }
  enviarArchivo(res, archivo, { descargar: req.query.descargar === '1' });
}));

export default router;
