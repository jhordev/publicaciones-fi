export const ESTADOS = {
  borrador: { label: 'Borrador', clase: 'bg-slate-100 text-slate-700' },
  revision: { label: 'En revisión', clase: 'bg-amber-100 text-amber-800' },
  publicado: { label: 'Publicado', clase: 'bg-emerald-100 text-emerald-800' },
  archivado: { label: 'Archivado', clase: 'bg-zinc-200 text-zinc-700' },
};

export const TIPOS_AUTOR = { estudiante: 'Estudiante', docente: 'Docente', egresado: 'Egresado', externo: 'Externo' };

export const IDIOMAS = { es: 'Español', en: 'Inglés', pt: 'Portugués', fr: 'Francés', otro: 'Otro' };

export const nombreCompleto = (a) => `${a.nombres} ${a.apellidos}`;

/** "Pérez Rojas, A. M." */
export function autorApa(a) {
  const iniciales = a.nombres.split(/\s+/).filter(Boolean).map((n) => `${n[0].toUpperCase()}.`).join(' ');
  return `${a.apellidos}, ${iniciales}`;
}

export function listaAutoresCorta(autores, max = 3) {
  if (!autores?.length) return '';
  const nombres = autores.slice(0, max).map(nombreCompleto);
  return autores.length > max ? `${nombres.join(', ')} et al.` : nombres.join(', ');
}

/** Referencia bibliográfica en formato APA 7. */
export function referenciaApa(p) {
  const autores = p.autores.map(autorApa);
  let a;
  if (autores.length === 1) a = autores[0];
  else if (autores.length <= 20) a = `${autores.slice(0, -1).join(', ')}, & ${autores.at(-1)}`;
  else a = `${autores.slice(0, 19).join(', ')}, . . . ${autores.at(-1)}`;
  let ref = `${a} (${p.anioPublicacion}). ${p.titulo.replace(/\.$/, '')}.`;
  if (p.revista) {
    ref += ` ${p.revista.nombre}`;
    if (p.volumen) ref += `, ${p.volumen}`;
    if (p.numero) ref += `(${p.numero})`;
    if (p.paginas) ref += `, ${p.paginas}`;
    ref += '.';
  }
  if (p.doi) ref += ` https://doi.org/${p.doi}`;
  else if (p.urlPublicacion) ref += ` ${p.urlPublicacion}`;
  return ref;
}

export function fecha(d, opciones = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!d) return '';
  // Las fechas sin hora llegan como medianoche UTC; se muestran en UTC para no restar un día
  return new Date(d).toLocaleDateString('es-PE', { ...opciones, timeZone: 'UTC' });
}

export function fechaHora(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function tamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
