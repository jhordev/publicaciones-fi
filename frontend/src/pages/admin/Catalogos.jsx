import { useSearchParams } from 'react-router-dom';
import CrudCatalogo from '../../components/CrudCatalogo.jsx';
import { CAMPOS_LINEA, CAMPOS_PALABRA, CAMPOS_PROGRAMA, CAMPOS_TIPO } from '../../lib/catalogos.js';
import { useTitulo } from '../../lib/hooks.js';
import { Encabezado } from './AdminLayout.jsx';
import { EstadoActivo } from './Revistas.jsx';

const conteo = (r) => r._count?.publicaciones ?? 0;

const PESTANAS = {
  tipos: {
    label: 'Tipos de publicación', ruta: '/admin/tipos', singular: 'tipo', campos: CAMPOS_TIPO,
    columnas: [
      { titulo: 'Nombre', valor: (r) => <><p className="font-medium">{r.nombre}</p><p className="text-xs text-slate-500">{r.descripcion}</p></> },
      { titulo: 'Estado', valor: (r) => <EstadoActivo estado={r.estado} /> },
      { titulo: 'Publicaciones', clase: 'text-center', valor: conteo },
    ],
  },
  programas: {
    label: 'Programas académicos', ruta: '/admin/programas', singular: 'programa', campos: CAMPOS_PROGRAMA,
    columnas: [
      { titulo: 'Programa', valor: (r) => <p className="font-medium">{r.nombre}</p> },
      { titulo: 'Código', valor: (r) => r.codigo || '—' },
      { titulo: 'Estado', valor: (r) => <EstadoActivo estado={r.estado} /> },
      { titulo: 'Autores', clase: 'text-center', valor: (r) => r._count?.autores ?? 0 },
      { titulo: 'Publicaciones', clase: 'text-center', valor: conteo },
    ],
  },
  lineas: {
    label: 'Líneas de investigación', ruta: '/admin/lineas', singular: 'línea', campos: CAMPOS_LINEA,
    columnas: [
      { titulo: 'Línea', valor: (r) => <><p className="font-medium">{r.nombre}</p><p className="text-xs text-slate-500">{r.descripcion}</p></> },
      { titulo: 'Estado', valor: (r) => <EstadoActivo estado={r.estado} /> },
      { titulo: 'Publicaciones', clase: 'text-center', valor: conteo },
    ],
  },
  palabras: {
    label: 'Palabras clave', ruta: '/admin/palabras-clave', singular: 'palabra clave', campos: CAMPOS_PALABRA,
    columnas: [
      { titulo: 'Palabra clave', valor: (r) => r.nombre },
      { titulo: 'Publicaciones', clase: 'text-center', valor: conteo },
    ],
  },
};

export default function Catalogos() {
  useTitulo('Catálogos');
  const [sp, setSp] = useSearchParams();
  const actual = PESTANAS[sp.get('tab')] ? sp.get('tab') : 'tipos';
  const p = PESTANAS[actual];
  return (
    <>
      <Encabezado titulo="Catálogos" descripcion="Clasificaciones usadas para organizar las publicaciones" />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {Object.entries(PESTANAS).map(([k, v]) => (
          <button key={k} role="tab" aria-selected={actual === k} onClick={() => setSp({ tab: k })}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${actual === k ? 'border-naranja text-marino' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {v.label}
          </button>
        ))}
      </div>
      <CrudCatalogo key={actual} ruta={p.ruta} singular={p.singular} campos={p.campos} columnas={p.columnas} />
    </>
  );
}
