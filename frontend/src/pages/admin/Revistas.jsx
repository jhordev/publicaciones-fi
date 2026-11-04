import CrudCatalogo from '../../components/CrudCatalogo.jsx';
import { CAMPOS_REVISTA } from '../../lib/catalogos.js';
import { useTitulo } from '../../lib/hooks.js';
import { Encabezado } from './AdminLayout.jsx';

export const EstadoActivo = ({ estado }) => (
  <span className={`badge ${estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
    {estado === 'activo' ? 'Activo' : 'Inactivo'}
  </span>
);

export default function Revistas() {
  useTitulo('Revistas');
  return (
    <>
      <Encabezado titulo="Revistas" descripcion="Revistas científicas donde se publican los artículos" />
      <CrudCatalogo
        ruta="/admin/revistas"
        singular="revista"
        campos={CAMPOS_REVISTA}
        columnas={[
          { titulo: 'Revista', valor: (r) => <><p className="font-medium text-slate-800">{r.nombre}</p><p className="text-xs text-slate-500">{[r.editorial, r.pais].filter(Boolean).join(' · ')}</p></> },
          { titulo: 'ISSN', clase: 'hidden md:table-cell whitespace-nowrap', valor: (r) => [r.issnImpreso, r.issnElectronico].filter(Boolean).join(' / ') || '—' },
          { titulo: 'Indexación', clase: 'hidden lg:table-cell', valor: (r) => r.indexacion || '—' },
          { titulo: 'Estado', valor: (r) => <EstadoActivo estado={r.estado} /> },
          { titulo: 'Publicaciones', clase: 'text-center', valor: (r) => r._count?.publicaciones ?? 0 },
        ]}
      />
    </>
  );
}
