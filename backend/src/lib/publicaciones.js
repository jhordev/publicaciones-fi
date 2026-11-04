/** Utilidades compartidas para consultar y serializar publicaciones. */

const intOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const includeLista = {
  tipoPublicacion: { select: { id: true, nombre: true } },
  revista: { select: { id: true, nombre: true } },
  programa: { select: { id: true, nombre: true } },
  autores: {
    orderBy: { ordenAutoria: 'asc' },
    select: { autor: { select: { id: true, nombres: true, apellidos: true, foto: true } } },
  },
};

export const includeDetalle = {
  tipoPublicacion: { select: { id: true, nombre: true } },
  revista: true,
  programa: { select: { id: true, nombre: true, codigo: true } },
  autores: {
    orderBy: { ordenAutoria: 'asc' },
    include: { autor: { include: { programa: { select: { id: true, nombre: true } } } } },
  },
  palabrasClave: { include: { palabraClave: true } },
  lineas: { include: { linea: true } },
  archivos: { orderBy: { createdAt: 'asc' } },
};

export const ORDENES = {
  reciente: [{ anioPublicacion: 'desc' }, { fechaPublicacion: 'desc' }, { id: 'desc' }],
  antiguo: [{ anioPublicacion: 'asc' }, { fechaPublicacion: 'asc' }, { id: 'asc' }],
  titulo_asc: [{ titulo: 'asc' }],
  titulo_desc: [{ titulo: 'desc' }],
  registro: [{ createdAt: 'desc' }],
  actualizacion: [{ updatedAt: 'desc' }],
};

/** Construye el filtro de Prisma a partir de parámetros de búsqueda. */
export function construirFiltro(query, { soloPublicadas }) {
  const AND = [];
  if (soloPublicadas) AND.push({ estado: 'publicado' });
  else if (['borrador', 'revision', 'publicado', 'archivado'].includes(query.estado)) AND.push({ estado: query.estado });

  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  if (q) {
    // Cada término debe aparecer en algún campo (título, resumen, autores, revista, palabras clave, DOI)
    const terminos = q.split(/\s+/).filter(Boolean).slice(0, 8);
    for (const t of terminos) {
      AND.push({
        OR: [
          { titulo: { contains: t } },
          { resumen: { contains: t } },
          { doi: { contains: t } },
          { revista: { nombre: { contains: t } } },
          { autores: { some: { autor: { OR: [{ nombres: { contains: t } }, { apellidos: { contains: t } }] } } } },
          { palabrasClave: { some: { palabraClave: { nombre: { contains: t } } } } },
        ],
      });
    }
  }

  const anio = intOrNull(query.anio);
  if (anio) AND.push({ anioPublicacion: anio });
  const desde = intOrNull(query.desde);
  if (desde) AND.push({ anioPublicacion: { gte: desde } });
  const hasta = intOrNull(query.hasta);
  if (hasta) AND.push({ anioPublicacion: { lte: hasta } });

  const tipo = intOrNull(query.tipo);
  if (tipo) AND.push({ tipoPublicacionId: tipo });
  const revista = intOrNull(query.revista);
  if (revista) AND.push({ revistaId: revista });
  const programa = intOrNull(query.programa);
  if (programa) AND.push({ programaId: programa });
  const linea = intOrNull(query.linea);
  if (linea) AND.push({ lineas: { some: { lineaId: linea } } });
  const autor = intOrNull(query.autor);
  if (autor) AND.push({ autores: { some: { autorId: autor } } });
  const palabra = intOrNull(query.palabra);
  if (palabra) AND.push({ palabrasClave: { some: { palabraClaveId: palabra } } });
  if (query.destacado === '1' || query.destacado === 'true') AND.push({ destacado: true });

  return AND.length ? { AND } : {};
}

export function serializarLista(p) {
  return {
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    resumen: p.resumen ? (p.resumen.length > 320 ? `${p.resumen.slice(0, 320).trimEnd()}…` : p.resumen) : null,
    anioPublicacion: p.anioPublicacion,
    fechaPublicacion: p.fechaPublicacion,
    estado: p.estado,
    destacado: p.destacado,
    imagen: p.imagen,
    doi: p.doi,
    tipo: p.tipoPublicacion,
    revista: p.revista,
    programa: p.programa,
    autores: p.autores.map((a) => a.autor),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function serializarDetalle(p, { publico }) {
  return {
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    resumen: p.resumen,
    idioma: p.idioma,
    anioPublicacion: p.anioPublicacion,
    fechaPublicacion: p.fechaPublicacion,
    volumen: p.volumen,
    numero: p.numero,
    paginas: p.paginas,
    doi: p.doi,
    urlPublicacion: p.urlPublicacion,
    estado: p.estado,
    destacado: p.destacado,
    imagen: p.imagen,
    tipo: p.tipoPublicacion,
    revista: p.revista,
    programa: p.programa,
    autores: p.autores.map((a) => ({
      id: a.autor.id,
      foto: a.autor.foto,
      nombres: a.autor.nombres,
      apellidos: a.autor.apellidos,
      tipoAutor: a.autor.tipoAutor,
      orcid: a.autor.orcid,
      institucion: a.autor.institucion,
      programa: a.autor.programa,
      correo: publico ? undefined : a.autor.correo,
      ordenAutoria: a.ordenAutoria,
      esAutorCorrespondencia: a.esAutorCorrespondencia,
    })),
    palabrasClave: p.palabrasClave.map((k) => k.palabraClave),
    lineas: p.lineas.map((l) => ({ id: l.linea.id, nombre: l.linea.nombre })),
    archivos: p.archivos
      .filter((f) => !publico || f.autorizadoPublico)
      .map((f) => ({
        id: f.id,
        nombreOriginal: f.nombreOriginal,
        tipoMime: f.tipoMime,
        tamano: f.tamano,
        tipoArchivo: f.tipoArchivo,
        autorizadoPublico: f.autorizadoPublico,
        createdAt: f.createdAt,
      })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
