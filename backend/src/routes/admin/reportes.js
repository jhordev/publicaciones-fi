import { Router } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../../lib/prisma.js';
import { asyncH, registrarBitacora } from '../../lib/utils.js';
import { construirFiltro, includeLista, serializarLista } from '../../lib/publicaciones.js';

const router = Router();
const ESTADOS = ['borrador', 'revision', 'publicado', 'archivado'];

/** Filtro base de reportes: por defecto solo publicaciones publicadas. */
function filtroReporte(query) {
  const estado = ESTADOS.includes(query.estado) ? query.estado : query.estado === 'todos' ? undefined : 'publicado';
  return construirFiltro({ ...query, estado }, { soloPublicadas: false });
}

async function nombres(modelo, ids) {
  const filas = await prisma[modelo].findMany({ where: { id: { in: ids.filter(Boolean) } }, select: { id: true, nombre: true } });
  return Object.fromEntries(filas.map((f) => [f.id, f.nombre]));
}

async function agrupar(where, campo, modelo) {
  const grupos = await prisma.publicacion.groupBy({ by: [campo], where, _count: true });
  const mapa = await nombres(modelo, grupos.map((g) => g[campo]));
  return grupos
    .map((g) => ({ id: g[campo], nombre: g[campo] ? mapa[g[campo]] : 'Sin asignar', total: g._count }))
    .sort((a, b) => b.total - a.total);
}

async function autoresConPublicaciones(where, limite) {
  const grupos = await prisma.publicacionAutor.groupBy({
    by: ['autorId'],
    where: { publicacion: where },
    _count: true,
    orderBy: { _count: { autorId: 'desc' } },
    ...(limite ? { take: limite } : {}),
  });
  const autores = await prisma.autor.findMany({
    where: { id: { in: grupos.map((g) => g.autorId) } },
    include: { programa: { select: { nombre: true } } },
  });
  const mapa = Object.fromEntries(autores.map((a) => [a.id, a]));
  return grupos.map((g) => {
    const a = mapa[g.autorId];
    return {
      id: a.id,
      nombre: `${a.apellidos}, ${a.nombres}`,
      tipoAutor: a.tipoAutor,
      orcid: a.orcid,
      programa: a.programa?.nombre ?? null,
      total: g._count,
    };
  });
}

router.get('/dashboard', asyncH(async (req, res) => {
  const [porEstado, autores, revistas, archivos, recientes, actividad] = await Promise.all([
    prisma.publicacion.groupBy({ by: ['estado'], _count: true }),
    prisma.autor.count(),
    prisma.revista.count(),
    prisma.archivoPublicacion.count(),
    prisma.publicacion.findMany({ orderBy: { updatedAt: 'desc' }, take: 6, include: includeLista }),
    req.user.rol === 'Administrador'
      ? prisma.bitacora.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { usuario: { select: { nombres: true, apellidos: true } } },
      })
      : Promise.resolve(null),
  ]);
  const estados = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  porEstado.forEach((e) => { estados[e.estado] = e._count; });
  res.json({
    estados,
    totalPublicaciones: Object.values(estados).reduce((a, b) => a + b, 0),
    autores,
    revistas,
    archivos,
    recientes: recientes.map(serializarLista),
    actividad,
  });
}));

router.get('/reportes/resumen', asyncH(async (req, res) => {
  const where = filtroReporte(req.query);
  const [total, porAnio, porTipo, porPrograma, porRevista, autores] = await Promise.all([
    prisma.publicacion.count({ where }),
    prisma.publicacion.groupBy({ by: ['anioPublicacion'], where, _count: true, orderBy: { anioPublicacion: 'asc' } }),
    agrupar(where, 'tipoPublicacionId', 'tipoPublicacion'),
    agrupar(where, 'programaId', 'programa'),
    agrupar(where, 'revistaId', 'revista'),
    autoresConPublicaciones(where, 50),
  ]);
  res.json({
    total,
    porAnio: porAnio.map((a) => ({ anio: a.anioPublicacion, total: a._count })),
    porTipo,
    porPrograma,
    porRevista,
    autores,
  });
}));

const COLUMNAS_PUB = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Título', key: 'titulo', width: 60 },
  { header: 'Tipo', key: 'tipo', width: 28 },
  { header: 'Autores', key: 'autores', width: 50 },
  { header: 'Revista', key: 'revista', width: 40 },
  { header: 'ISSN', key: 'issn', width: 14 },
  { header: 'Año', key: 'anio', width: 8 },
  { header: 'Fecha', key: 'fecha', width: 12 },
  { header: 'Volumen', key: 'volumen', width: 10 },
  { header: 'Número', key: 'numero', width: 10 },
  { header: 'Páginas', key: 'paginas', width: 12 },
  { header: 'DOI', key: 'doi', width: 30 },
  { header: 'URL', key: 'url', width: 40 },
  { header: 'Programa', key: 'programa', width: 30 },
  { header: 'Líneas de investigación', key: 'lineas', width: 35 },
  { header: 'Palabras clave', key: 'palabras', width: 35 },
  { header: 'Idioma', key: 'idioma', width: 8 },
  { header: 'Estado', key: 'estado', width: 12 },
];

const COLUMNAS_AUT = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Autor', key: 'nombre', width: 40 },
  { header: 'Tipo', key: 'tipoAutor', width: 14 },
  { header: 'ORCID', key: 'orcid', width: 22 },
  { header: 'Programa', key: 'programa', width: 30 },
  { header: 'Publicaciones', key: 'total', width: 14 },
];

async function filasPublicaciones(where) {
  const pubs = await prisma.publicacion.findMany({
    where,
    orderBy: [{ anioPublicacion: 'desc' }, { titulo: 'asc' }],
    include: {
      tipoPublicacion: true,
      revista: true,
      programa: true,
      autores: { orderBy: { ordenAutoria: 'asc' }, include: { autor: true } },
      lineas: { include: { linea: true } },
      palabrasClave: { include: { palabraClave: true } },
    },
  });
  return pubs.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    tipo: p.tipoPublicacion.nombre,
    autores: p.autores.map((a) => `${a.autor.apellidos}, ${a.autor.nombres}`).join('; '),
    revista: p.revista?.nombre ?? '',
    issn: p.revista?.issnElectronico || p.revista?.issnImpreso || '',
    anio: p.anioPublicacion,
    fecha: p.fechaPublicacion ? p.fechaPublicacion.toISOString().slice(0, 10) : '',
    volumen: p.volumen ?? '',
    numero: p.numero ?? '',
    paginas: p.paginas ?? '',
    doi: p.doi ?? '',
    url: p.urlPublicacion ?? '',
    programa: p.programa?.nombre ?? '',
    lineas: p.lineas.map((l) => l.linea.nombre).join('; '),
    palabras: p.palabrasClave.map((k) => k.palabraClave.nombre).join('; '),
    idioma: p.idioma,
    estado: p.estado,
  }));
}

function aCsv(columnas, filas) {
  const esc = (v) => {
    let s = String(v ?? '');
    // Evita inyección de fórmulas al abrir el CSV en Excel
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lineas = [columnas.map((c) => esc(c.header)).join(',')];
  for (const f of filas) lineas.push(columnas.map((c) => esc(f[c.key])).join(','));
  return '﻿' + lineas.join('\r\n');
}

function agregarHoja(wb, nombre, columnas, filas) {
  const ws = wb.addWorksheet(nombre);
  ws.columns = columnas;
  ws.addRows(filas);
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF122B4A' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };
}

router.get('/reportes/exportar', asyncH(async (req, res) => {
  const formato = req.query.formato === 'xlsx' ? 'xlsx' : 'csv';
  const tipo = req.query.tipo === 'autores' ? 'autores' : 'publicaciones';
  const where = filtroReporte(req.query);
  const fecha = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `${tipo}_fi_${fecha}.${formato}`;

  const [columnas, filas] = tipo === 'autores'
    ? [COLUMNAS_AUT, await autoresConPublicaciones(where)]
    : [COLUMNAS_PUB, await filasPublicaciones(where)];

  await registrarBitacora(req, 'exportar', 'reportes', null, `${tipo} (${formato}, ${filas.length} filas)`);
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(aCsv(columnas, filas));
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Repositorio de Publicaciones FI - UCSS';
  wb.created = new Date();
  agregarHoja(wb, tipo === 'autores' ? 'Autores' : 'Publicaciones', columnas, filas);
  if (tipo === 'publicaciones') {
    const porAnio = await prisma.publicacion.groupBy({ by: ['anioPublicacion'], where, _count: true, orderBy: { anioPublicacion: 'asc' } });
    agregarHoja(wb, 'Por año', [{ header: 'Año', key: 'anio', width: 10 }, { header: 'Publicaciones', key: 'total', width: 14 }],
      porAnio.map((a) => ({ anio: a.anioPublicacion, total: a._count })));
    const colsGrupo = [{ header: 'Nombre', key: 'nombre', width: 50 }, { header: 'Publicaciones', key: 'total', width: 14 }];
    agregarHoja(wb, 'Por tipo', colsGrupo, await agrupar(where, 'tipoPublicacionId', 'tipoPublicacion'));
    agregarHoja(wb, 'Por programa', colsGrupo, await agrupar(where, 'programaId', 'programa'));
    agregarHoja(wb, 'Por revista', colsGrupo, await agrupar(where, 'revistaId', 'revista'));
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await wb.xlsx.write(res);
  res.end();
}));

export default router;
