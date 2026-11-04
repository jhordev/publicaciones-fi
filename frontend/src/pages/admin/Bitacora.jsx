import { useState } from 'react';
import { Link } from 'react-router-dom';
import { qs } from '../../api/client.js';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { fechaHora } from '../../lib/format.js';
import { ErrorCaja, Paginacion, Spinner, Vacio } from '../../components/ui.jsx';
import { Encabezado } from './AdminLayout.jsx';

const COLOR = {
  crear: 'bg-emerald-100 text-emerald-800',
  editar: 'bg-sky-100 text-sky-800',
  eliminar: 'bg-red-100 text-red-800',
  login: 'bg-slate-100 text-slate-600',
  logout: 'bg-slate-100 text-slate-600',
};

export default function Bitacora() {
  useTitulo('Bitácora');
  const [filtros, setFiltros] = useState({ entidad: '', accion: '', page: 1 });
  const { data, cargando, error, recargar } = useApi(`/admin/bitacora${qs(filtros)}`);

  return (
    <>
      <Encabezado titulo="Bitácora" descripcion="Registro de operaciones administrativas" />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="input w-auto" value={filtros.entidad} onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value, page: 1 })} aria-label="Filtrar por entidad">
          <option value="">Todas las entidades</option>
          {data?.entidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input w-auto" value={filtros.accion} onChange={(e) => setFiltros({ ...filtros, accion: e.target.value, page: 1 })} aria-label="Filtrar por acción">
          <option value="">Todas las acciones</option>
          {['crear', 'editar', 'eliminar', 'estado', 'archivo', 'exportar', 'login'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {error ? <ErrorCaja error={error} onReintentar={recargar} /> : cargando && !data ? <Spinner /> : !data.items.length ? <Vacio titulo="Sin registros" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-fondo text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="hidden px-4 py-3 lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{fechaHora(b.createdAt)}</td>
                    <td className="px-4 py-2.5">{b.usuario ? `${b.usuario.nombres} ${b.usuario.apellidos}` : <span className="text-slate-400">—</span>}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`badge ${COLOR[b.accion] ?? 'bg-amber-100 text-amber-800'}`}>{b.accion.replace(/_/g, ' ')}</span>
                      <span className="ml-1 text-xs text-slate-500">{b.entidad}{b.registroId ? ` #${b.registroId}` : ''}</span>
                    </td>
                    <td className="max-w-md px-4 py-2.5 text-slate-600">
                      {b.entidad === 'publicaciones' && b.registroId && b.accion !== 'eliminar'
                        ? <Link to={`/admin/publicaciones/${b.registroId}`} className="hover:underline">{b.detalle || 'Ver publicación'}</Link>
                        : b.detalle}
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs text-slate-400 lg:table-cell">{b.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && <div className="mt-4"><Paginacion page={data.page} pages={data.pages} total={data.total} onChange={(page) => setFiltros({ ...filtros, page })} /></div>}
    </>
  );
}
